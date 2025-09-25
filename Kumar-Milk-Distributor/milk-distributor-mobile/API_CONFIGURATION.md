# 🌐 API Configuration Guide

## How to Change Backend URL

### Method 1: Automatic (Recommended)
The app automatically selects the correct backend:
- **Development builds**: Uses `http://localhost:5000/api`
- **Production builds**: Uses `https://api-kumarmilk.vercel.app/api`

### Method 2: Manual Override
Edit the `.env` file and uncomment/change this line:

```bash
# Change this URL to switch backends
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url.com/api
```

### Method 3: Code-Level Change
Edit `src/config/apiConfig.js` and change these URLs:

```javascript
// MAIN CONFIGURATION - CHANGE THESE URLs
this.PRODUCTION_URL = 'https://api-kumarmilk.vercel.app/api';
this.DEVELOPMENT_URL = 'http://localhost:5000/api';
```

## 🎯 Quick Examples

### Use Production Backend (Custom Domain)
```bash
# In .env file:
EXPO_PUBLIC_API_URL=https://api.shriyashmhatre.com
```

### Use Local Development Server
```bash
# In .env file:
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### Use Your Computer's IP (for mobile device testing)
```bash
# In .env file (replace with your actual IP):
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:5000/api
```

### Use Custom Backend
```bash
# In .env file:
EXPO_PUBLIC_API_BASE_URL=https://your-custom-backend.herokuapp.com/api
```

## 🔄 After Changing URL

1. Stop the development server (`Ctrl+C`)
2. Clear cache: `npx expo start --clear`
3. The app will automatically use the new URL

## 📱 Current Configuration

Your app is currently configured to use:
- **Production**: `https://api-kumarmilk.vercel.app/api`
- **Development**: `http://localhost:5000/api`

## 🐛 Troubleshooting

### App can't connect to backend?
1. Check if the URL is correct in `.env`
2. Make sure the backend server is running
3. For mobile device testing, use your computer's IP address, not `localhost`

### How to find your computer's IP?
- **Windows**: Open Command Prompt → `ipconfig` → look for "IPv4 Address"
- **Mac/Linux**: Open Terminal → `ifconfig` → look for "inet" address

## 📋 Available Endpoints

The backend provides these main endpoints:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/products` - Get products
- `GET /api/customer/orders` - Get customer orders
- `POST /api/customer/orders` - Place new order
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/health` - Health check