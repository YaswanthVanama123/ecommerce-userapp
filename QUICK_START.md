# Quick Start Guide - User WebApp

## Prerequisites
- Node.js installed (v18 or higher)
- Backend server running on http://localhost:5000

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will be available at: http://localhost:5173

## Testing the Application

### 1. Register a New User
- Go to http://localhost:5173/register
- Fill in the registration form
- Submit to create account and auto-login

### 2. Or Use Demo Credentials (if available in backend)
- Email: demo@example.com
- Password: demo123

### 3. Explore Features

#### Browse Products
- Visit the Products page
- Use filters (search, category, price range)
- Sort products
- Click on a product to view details

#### Add to Cart
- On product detail page
- Select size/color if applicable
- Choose quantity
- Click "Add to Cart"

#### Checkout
- Go to Cart page
- Review items
- Click "Proceed to Checkout"
- Fill in shipping address
- Select payment method
- Place order

#### View Orders
- Go to Profile menu → Order History
- View all past orders
- Cancel pending/processing orders

#### Manage Profile
- Go to Profile menu → My Profile
- Edit personal information
- Manage saved addresses

## Available Routes

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/products` - Product listing
- `/products/:id` - Product detail

### Protected Routes (Login Required)
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/orders` - Order history
- `/profile` - User profile

## Features Checklist

- [x] User authentication (login/register/logout)
- [x] Browse products with filters and search
- [x] View product details
- [x] Add products to cart
- [x] Manage cart (update quantity, remove items)
- [x] Checkout with address and payment
- [x] View order history
- [x] Cancel orders
- [x] Update profile
- [x] Responsive design

## Troubleshooting

### Backend Connection Issues
If you see API errors:
1. Ensure backend server is running on port 5000
2. Check backend console for errors
3. Verify API endpoints match

### Styling Issues
If styles aren't loading:
1. Ensure Tailwind CSS is properly configured
2. Run `npm install` to install all dependencies
3. Restart the dev server

### Authentication Issues
If login/register fails:
1. Check backend server is running
2. Verify JWT secret is configured in backend
3. Clear browser localStorage and try again

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Preview Production Build

```bash
npm run preview
```

## Environment Variables
Currently using hardcoded API URL (http://localhost:5000/api).
For production, create a `.env` file:

```env
VITE_API_URL=https://your-production-api.com/api
```

Then update `src/api/axiosConfig.js` to use:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

## Support
For issues or questions:
- Check backend logs
- Check browser console for errors
- Verify all dependencies are installed
- Ensure backend and frontend versions match
