# Order Management System Backend API

## 🚀 Live API
- Base URL: `https://your-app-name.pxxl.app`
- API Documentation: `https://your-app-name.pxxl.app/api-docs`

## 📋 Available Endpoints
- `GET /` - API Status
- `GET /api` - API Information
- `POST /api/auth` - Authentication
- `GET /api/products` - Products
- `GET /api/orders` - Orders
- `POST /api/payments` - Payments
- `GET /api/users` - Users
- `GET /api-docs` - Swagger Documentation

## 🔧 Environment Variables
Create a `.env` file with:
```env
NODE_ENV=production
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret