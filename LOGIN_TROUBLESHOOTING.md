# 🔐 Login Troubleshooting Guide

## 🐛 Current Issue

**Error:** `[API] Request failed: POST /api/auth/login`
**Symptom:** Login request fails, no token is saved, so user cannot access data

## ✅ What's Working

- MongoDB has data ✅
- Token checks are working ✅ (preventing API calls without token)
- Settings endpoints work ✅ (don't require auth)

## ❌ What's Not Working

- Login endpoint is failing
- User cannot authenticate
- Cannot access MongoDB data

---

## 🔍 How to Debug

### Step 1: Check Browser Console

When you try to login, look for:

1. **Request Details:**
   ```
   [API] POST /api/auth/login { email: '...', password: '...' }
   [API] Token present: false
   ```

2. **Error Details:**
   - Look for the actual error message
   - Check if it's a network error or server error
   - Check the status code (400, 401, 500, etc.)

### Step 2: Check Vercel Logs

In Vercel Dashboard → Your Project → Logs

Look for:
```
[LOGIN] Request received: { email: '...' }
[LOGIN] Database connected
[LOGIN] User not found for email: ...
OR
[LOGIN] Password mismatch for email: ...
OR
[LOGIN] Login successful for user: ...
```

### Step 3: Test Login Directly

Use curl to test the login endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Admin User",
    ...
  }
}
```

---

## 🚨 Common Login Issues

### Issue 1: User Not Found
**Error:** `[LOGIN] User not found for email: ...`

**Solution:**
- Check if user exists in MongoDB
- Verify email is correct (case-insensitive)
- Check if user was created properly

### Issue 2: Password Mismatch
**Error:** `[LOGIN] Password mismatch for email: ...`

**Solution:**
- Verify password is correct
- Check if password was hashed properly during registration
- Try resetting password

### Issue 3: Database Connection Error
**Error:** `Database connection failed`

**Solution:**
- Check MongoDB connection string
- Verify MongoDB Atlas allows connections
- Check Vercel environment variables

### Issue 4: Request Body Not Parsed
**Error:** `Missing email or password`

**Solution:**
- Check if request body is being sent correctly
- Verify Content-Type header is `application/json`
- Check if body is being parsed by Express

### Issue 5: Admin Not Initialized
**Error:** `Admin initialization error`

**Solution:**
- Admin should auto-initialize on first request
- Check Vercel logs for admin init errors
- Verify admin user can be created

---

## 🔧 Quick Fixes

### Fix 1: Check Admin User Exists

The default admin user should be:
- **Email:** `admin@kachataka.com`
- **Password:** `admin123`

If it doesn't exist, it should be created automatically. Check Vercel logs for:
```
✅ Default admin user created: admin@kachataka.com
```

### Fix 2: Verify MongoDB Connection

Test the connection:
```bash
curl https://your-app.vercel.app/api/test/mongodb
```

Should return:
```json
{
  "status": "OK",
  "mongodb": "Connected",
  "counts": {
    "users": 1,
    "gameHistory": 0,
    "transactions": 0
  },
  "recentUsers": [...]
}
```

### Fix 3: Check Request Format

Make sure the login request includes:
- **Method:** POST
- **URL:** `/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:** `{ "email": "...", "password": "..." }`

---

## 📋 Verification Checklist

After fixing login:

- [ ] **Login Request Succeeds**
  - Check browser console for `[API] Success: POST /api/auth/login`
  - Check Vercel logs for `[LOGIN] Login successful`

- [ ] **Token is Saved**
  - Check localStorage for `kachaTaka_token`
  - Token should be a JWT string

- [ ] **User State is Set**
  - Check localStorage for `kachaTaka_currentUser`
  - User object should be saved

- [ ] **Can Access Data**
  - Admin panel should load users
  - Dashboard should load game history
  - No more "No token found" errors

---

## 🎯 Next Steps

1. **Check Vercel Logs** - Look for actual login error
2. **Test Login Endpoint** - Use curl to test directly
3. **Verify User Exists** - Check MongoDB for user
4. **Check Password** - Verify password is correct
5. **Test Admin Login** - Try admin credentials

---

**Status:** 🔍 Debugging login issue  
**Priority:** High - Blocks all data access

