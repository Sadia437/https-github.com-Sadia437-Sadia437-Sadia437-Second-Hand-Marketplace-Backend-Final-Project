require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*', 
  credentials: true
}));
app.use(express.json());
app.use(fileUpload());

// MongoDB Connection
const uri = `mongodb+srv://secondhandDB:AeruEkd8PLD6EHCQ@cluster0.amfxxji.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let usersCollection, productsCollection, categoriesCollection, ordersCollection;

// JWT middleware
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_temporary_key', (err, decoded) => { 
    if (err) return res.status(403).send({ message: 'Forbidden' });
    req.decoded = decoded;
    next();
  });
};

// Admin check middleware
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const user = await usersCollection.findOne({ email });
  if (user?.role !== 'admin') return res.status(403).send({ message: 'Forbidden' });
  next();
};

// Run server
async function run() {
  try {
    await client.connect();
    
    
    const db = client.db('secondhandDB'); 
    
    usersCollection = db.collection('users');
    productsCollection = db.collection('products');
    categoriesCollection = db.collection('categories');
    ordersCollection = db.collection('orders');

    console.log('MongoDB connected successfully!');

    // ===== JWT =====
    app.post('/jwt', (req, res) => {
      const user = req.body;
      
      const secret = process.env.JWT_SECRET || 'super_secret_temporary_key';
      const token = jwt.sign(user, secret, { expiresIn: '1h' });
      res.send({ token });
    });

    // ===== Users =====
    app.post('/users', async (req, res) => {
      const user = req.body;
      const existingUser = await usersCollection.findOne({ email: user.email });
      if (existingUser) return res.send({ message: 'User already exists' });
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const users = await usersCollection.find({}).toArray();
      res.send(users);
    });

    app.get('/users/sellers', verifyJWT, verifyAdmin, async (req, res) => {
      const sellers = await usersCollection.find({ role: 'seller' }).toArray();
      res.send(sellers);
    });

    app.get('/users/buyers', verifyJWT, verifyAdmin, async (req, res) => {
      const buyers = await usersCollection.find({ role: 'buyer' }).toArray();
      res.send(buyers);
    });

    app.put('/users/:id/verify', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { verified: true } }
      );
      res.send(result);
    });

    app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ===== Categories =====
    const seedCategories = async () => {
      const count = await categoriesCollection.countDocuments();
      if (count === 0) {
        const categories = [
          { id: 1, name: 'Electronics', description: 'Phones, laptops, and gadgets' },
          { id: 2, name: 'Furniture', description: 'Chairs, tables, and home decor' },
          { id: 3, name: 'Vehicles', description: 'Cars, bikes, and accessories' },
          { id: 4, name: 'Clothing', description: 'Shirts, pants, and fashion items' }
        ];
        await categoriesCollection.insertMany(categories);
        console.log('Categories seeded');
      }
    };
    await seedCategories();

    app.get('/categories', async (req, res) => {
      const categories = await categoriesCollection.find({}).toArray();
      res.send(categories);
    });

    // ===== Products =====
    app.get('/products', async (req, res) => {
      const category = req.query.category;
      let query = {};
      if (category) query = { category };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const product = await productsCollection.findOne({ _id: new ObjectId(id) });
      res.send(product);
    });

    app.post('/products', verifyJWT, async (req, res) => {
      const product = req.body;
      const email = req.decoded.email;
      const user = await usersCollection.findOne({ email });
      if (!user?.verified || user.role !== 'seller')
        return res.status(403).send({ message: 'Only verified sellers can add products' });

      product.sellerId = user._id;
      product.status = 'available';
      product.postedAt = new Date();
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    app.delete('/products/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ===== Orders =====
    app.post('/orders', verifyJWT, async (req, res) => {
      const order = req.body;
      order.buyerId = req.decoded.email;
      order.paymentStatus = 'unpaid';
      order.bookedAt = new Date();
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    app.get('/orders', verifyJWT, async (req, res) => {
      const email = req.decoded.email;
      const orders = await ordersCollection.find({ buyerId: email }).toArray();
      res.send(orders);
    });

    app.put('/orders/:id/payment', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { paymentStatus: 'paid' } }
      );
      res.send(result);
    });

    // ===== Stripe =====
    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const { price } = req.body;
      if (!price) return res.status(400).send({ message: 'Price is required' });
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100),
        currency: 'usd',
        payment_method_types: ['card'],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    // ===== Test route =====
    app.get('/', (req, res) => {
      res.send('Second-Hand Marketplace API running successfully!');
    });

  } catch (error) {
    console.error("Database connection error:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => console.log(`Server running on port ${port}`));