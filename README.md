# ⚙️ Secondhand Marketplace - Backend API

A robust RESTful API built with the **MERN Stack** (Node.js, Express, MongoDB) to power the Secondhand Marketplace platform. Handles product management, category filtering, and verified seller data.

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb)

---

## 🚀 Key Features

- **MVC Architecture** – Clean and scalable structure
- **Dynamic Product Queries** – Fetch products with `limit` and `category`
- **Cloud Database** – MongoDB Atlas integration
- **CORS Configured** – Secure communication with frontend
- **Verified Seller Logic** – Trusted seller badges support

---

## 📂 Folder Structure
models/ - Mongoose models
controllers/ - Route logic
routes/ - Express API endpoints
config/ - DB and server configs
index.js - Server entry point


---

## 📡 API Endpoints

### 🛒 Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/products | Fetch all products (supports `?limit=8`) |
| GET    | /api/products?category=:id | Fetch products by category |
| GET    | /api/products/:id | Fetch single product details |

### 👥 Users & Sellers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/users/sellers | Fetch verified sellers |
| POST   | /api/users/register | User registration |
| POST   | /api/users/login | User login |
| GET    | /api/users/profile | Get logged-in user profile (needs token) |
| PUT    | /api/users/profile | Update user profile (needs token) |

**Live API Base URL:**  
[https://second-hand-marketplace-fin-git-f482a4-sadias-projects-bf071fed.vercel.app/](second-hand-marketplace-final-project-akwk6p642.vercel.app)

---

## 📦 Installation & Setup

```bash
# Clone backend repo
git clone https://github.com/Sadia437/https-github.com-Sadia437-Sadia437-Sadia437-Second-Hand-Marketplace-Backend-Final-Project.git

# Navigate to folder
cd Second-Hand-Marketplace-Backend-Final

# Install dependencies
npm install

# Set environment variables
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>

# Run server
npm start