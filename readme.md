# Final-Exam-Project-Backend

This is the backend of **Second-Hand Marketplace**, a full-featured second-hand online shopping system. Users can register as buyers or sellers, browse categories, add products, place orders, and make payments securely.

---

## Features

- User registration and authentication (JWT)
- Role-based access: Admin, Seller, Buyer
- Product management by verified sellers
- Order placement and payment integration (Stripe)
- Categories management
- File upload support
- CORS middleware enabled

---

## API Endpoints

### Users
- `POST /users` - Add a new user
- `GET /users` - Get all users (Admin only)
- `GET /users/sellers` - Get all sellers (Admin only)
- `GET /users/buyers` - Get all buyers (Admin only)
- `PUT /users/:id/verify` - Verify a user (Admin only)
- `DELETE /users/:id` - Delete a user (Admin only)

### Categories
- `GET /categories` - Get all product categories

### Products
- `GET /products` - Get all products or filter by category
- `GET /products/:id` - Get product details
- `POST /products` - Add a product (Verified sellers only)
- `DELETE /products/:id` - Delete a product

### Orders
- `POST /orders` - Place an order
- `GET /orders` - Get orders of the logged-in user
- `PUT /orders/:id/payment` - Update payment status

### JWT & Authentication
- `POST /jwt` - Generate JWT token for authenticated users

### Payment
- `POST /create-payment-intent` - Create a Stripe payment intent

### Test
- `GET /` - Test route, returns "Second-Hand Marketplace API running"

---

## Middlewares

- **CORS**: Enabled to allow cross-origin requests
- **File Upload**: Supported for product images
- **JWT Verification**: Protects routes for authenticated users
- **Admin Verification**: Protects admin-only routes

---

## Environment Variables

Create a `.env` file with the following:

