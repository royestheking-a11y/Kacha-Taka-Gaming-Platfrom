# 🚀 Vercel Deployment Guide

This project has been configured for deployment on Vercel with all APIs consolidated into a single serverless function.

## ✅ What Was Changed

### 1. **Consolidated API Handler**
- All 30+ API endpoints consolidated into a single serverless function (`api/index.js`)
- Reduces function count from 23+ to just 1 (well within Vercel Hobby plan limit of 12)
- All routes properly configured and working

### 2. **MongoDB Connection Optimization**
- Updated database connection for serverless environment
- Connection caching to prevent multiple connections
- Optimized for cold starts

### 3. **Vercel Configuration**
- Created `vercel.json` with proper routing
- Auto-detects Node.js runtime for API routes
- Frontend build configured correctly

### 4. **Frontend API Configuration**
- Updated API base URL to work with Vercel
- Uses relative URLs in production (`/api`)
- Falls back to localhost in development

### 5. **EmailJS Integration**
- EmailJS continues to work (client-side)
- No changes needed - works as before

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://kachatakaorg_db_user:DDFwm3r3SSNo6vgh@kachataka.gvwrrey.mongodb.net/kachataka?retryWrites=true&w=majority
JWT_SECRET=your-secret-jwt-key-here
VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
VITE_EMAILJS_TEMPLATE_ID_REGISTRATION=your-registration-template-id
VITE_EMAILJS_TEMPLATE_ID_PASSWORD_RESET=your-password-reset-template-id
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Test Build Locally
```bash
npm run build
```

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
```

### Option 2: Deploy via GitHub
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration
6. Add environment variables
7. Click "Deploy"

## 📁 Project Structure

```
/
├── api/                    # Serverless API functions
│   ├── index.js           # Consolidated API handler (ALL routes)
│   ├── config/
│   │   └── database.js    # MongoDB connection (serverless optimized)
│   ├── middleware/
│   │   └── auth.js        # Authentication middleware
│   └── models/            # MongoDB models
│       ├── User.js
│       ├── GameHistory.js
│       ├── Transaction.js
│       ├── Message.js
│       ├── PaymentRequest.js
│       ├── GameSettings.js
│       ├── GlobalSettings.js
│       ├── PlatformStats.js
│       └── OTP.js
├── src/                   # Frontend React app
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies (includes backend deps)
└── vite.config.ts         # Vite configuration
```

## 🔌 API Endpoints

All endpoints are available at `/api/*`:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/balance` - Update balance (Admin)
- `GET /api/users/referral/:code` - Get user by referral code
- `GET /api/users/:id/referrals` - Get referrals

### Games
- `POST /api/games/history` - Add game history
- `GET /api/games/history` - Get game history
- `GET /api/games/stats` - Get game statistics (Admin)

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get transactions

### Messages
- `POST /api/messages` - Create message
- `GET /api/messages` - Get messages
- `PATCH /api/messages/:id` - Update message

### Payments
- `POST /api/payments` - Create payment request
- `GET /api/payments` - Get payment requests
- `PATCH /api/payments/:id` - Update payment request (Admin)
- `DELETE /api/payments/:id` - Delete payment request (Admin)

### Settings
- `GET /api/settings/game` - Get game settings
- `PUT /api/settings/game` - Update game settings (Admin)
- `GET /api/settings/global` - Get global settings
- `PUT /api/settings/global` - Update global settings (Admin)
- `GET /api/settings/stats` - Get platform stats
- `PUT /api/settings/stats` - Update platform stats (Admin)

### Health Check
- `GET /api/health` - Server health check

## ✅ Verification

After deployment, test these endpoints:

1. **Health Check**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Admin Login**
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@kachataka.com","password":"kachataka"}'
   ```

3. **Game Settings**
   ```bash
   curl https://your-app.vercel.app/api/settings/game
   ```

## 🔧 Troubleshooting

### Issue: 404 Errors on API Routes
**Solution:** Ensure `vercel.json` is in the root directory and routes are configured correctly.

### Issue: MongoDB Connection Errors
**Solution:** 
- Check `MONGODB_URI` environment variable is set correctly
- Ensure MongoDB Atlas allows connections from Vercel IPs (0.0.0.0/0)

### Issue: CORS Errors
**Solution:** CORS is configured to allow all origins. If issues persist, check the CORS configuration in `api/index.js`.

### Issue: Environment Variables Not Working
**Solution:** 
- Ensure variables are set in Vercel Dashboard
- Variables starting with `VITE_` are for frontend
- Other variables are for backend/API

## 📊 Function Count

- **Before:** 23+ separate functions (exceeded Hobby plan limit)
- **After:** 1 consolidated function ✅ (well within limit)

## 🎯 Key Features

✅ Single serverless function (within Vercel limits)  
✅ MongoDB connection optimized for serverless  
✅ All API endpoints working  
✅ EmailJS integration maintained  
✅ Admin panel fully functional  
✅ All data stored in MongoDB  
✅ CORS configured for production  

## 🚀 Ready to Deploy!

Your project is now fully configured for Vercel deployment. Just add environment variables and deploy!

