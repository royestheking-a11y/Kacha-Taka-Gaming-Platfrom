# 🔍 MongoDB Data Not Showing - Debugging Guide

## 🐛 Issue
MongoDB shows as connected in logs, but:
- Data is not being stored
- User registration doesn't save to MongoDB
- No data shows on admin panel or website

## ✅ Fixes Applied

### 1. Fixed AuthDialog Component
**Problem:** `AuthDialog.tsx` was using localStorage instead of MongoDB API
- ❌ Login was using localStorage
- ❌ Registration was using localStorage
- ❌ OTP resend was using localStorage

**Fixed:**
- ✅ Login now uses `authAPI.login()`
- ✅ Registration now uses `authAPI.register()`
- ✅ OTP resend now uses `authAPI.sendOTP()`

### 2. Improved Error Logging
**Added:**
- ✅ Detailed API request/response logging
- ✅ MongoDB operation logging
- ✅ Error details in console
- ✅ Admin panel data loading logs

### 3. All Components Now Use MongoDB
- ✅ All game components use `storageMongo`
- ✅ Dashboard loads from MongoDB
- ✅ Profile loads from MongoDB
- ✅ Admin panel loads from MongoDB
- ✅ AuthDialog uses MongoDB API

---

## 🔍 How to Debug

### Step 1: Check Browser Console
Open browser DevTools (F12) → Console tab

**Look for:**
- `[API] GET /api/users` - Should show API calls
- `[API] Success` or `[API] Error` - Shows if API works
- `[storageMongo] Users fetched: X` - Shows data loaded
- `[AdminUsers] Users loaded: X` - Shows admin panel data

### Step 2: Check Network Tab
Open DevTools → Network tab

**Look for:**
- API calls to `/api/users`, `/api/auth/register`, etc.
- Response status codes (200 = success, 401/500 = error)
- Response data (should be JSON, not HTML)

### Step 3: Check Vercel Logs
In Vercel Dashboard → Your Project → Logs

**Look for:**
- `[REGISTER] Request received` - Registration attempts
- `[REGISTER] User created` - User saved to MongoDB
- `✅ MongoDB Connected` - Database connection
- Any error messages

### Step 4: Test API Directly
Use curl or Postman to test:

```bash
# Test health check
curl https://your-app.vercel.app/api/health

# Test registration
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Test get users (requires admin token)
curl https://your-app.vercel.app/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🚨 Common Issues & Solutions

### Issue 1: API Returns 404
**Symptom:** Network tab shows 404 for API calls

**Solution:**
- Check `vercel.json` routing is correct
- Ensure `api/index.js` exists
- Check API base URL in frontend

### Issue 2: API Returns HTML Instead of JSON
**Symptom:** Console shows "Non-JSON response"

**Solution:**
- API route not found (404 page returned)
- Check Vercel routing configuration
- Verify API endpoint path

### Issue 3: CORS Errors
**Symptom:** Console shows CORS error

**Solution:**
- CORS is configured to allow all origins
- Check if request includes proper headers
- Verify API CORS configuration

### Issue 4: Authentication Errors (401)
**Symptom:** API returns 401 Unauthorized

**Solution:**
- Token not being sent in Authorization header
- Token expired or invalid
- Check if user is logged in

### Issue 5: Data Not Saving
**Symptom:** API returns success but data not in MongoDB

**Solution:**
- Check MongoDB connection string
- Verify MongoDB Atlas allows connections
- Check Vercel environment variables
- Look for errors in Vercel logs

---

## 📋 Verification Checklist

After deployment, verify:

- [ ] **Health Check Works**
  ```bash
  curl https://your-app.vercel.app/api/health
  ```
  Should return: `{"status":"OK","message":"Server is running"}`

- [ ] **Registration Works**
  - Try registering a new user
  - Check browser console for `[API] Success`
  - Check Vercel logs for `[REGISTER] User created`
  - Check MongoDB Atlas for new user document

- [ ] **Login Works**
  - Try logging in
  - Check browser console for `[API] Success`
  - Check if token is saved in localStorage

- [ ] **Admin Panel Shows Data**
  - Login as admin
  - Go to Admin Panel → Users
  - Check browser console for `[AdminUsers] Users loaded: X`
  - Should see users from MongoDB

- [ ] **Game History Saves**
  - Play a game
  - Check browser console for API calls
  - Check Vercel logs for game history creation
  - Check MongoDB for game history document

---

## 🔧 Environment Variables Check

Ensure these are set in Vercel:

```
MONGODB_URI=mongodb+srv://kachatakaorg_db_user:DDFwm3r3SSNo6vgh@kachataka.gvwrrey.mongodb.net/kachataka?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
```

---

## 📝 What to Check in Vercel Logs

After trying to register a user, you should see:

```
[REGISTER] Request received: { email: '...', name: '...' }
[REGISTER] Database connected
[REGISTER] Creating user...
[REGISTER] User created: 6922fb9d81050f8df69bdd70
[REGISTER] User saved with referral code: ABC123
[REGISTER] Registration successful for: user@example.com
```

If you don't see these logs, the API route isn't being hit.

---

## 🎯 Next Steps

1. **Redeploy on Vercel** - All fixes have been pushed
2. **Check Browser Console** - Look for API logs
3. **Check Vercel Logs** - Look for MongoDB operations
4. **Test Registration** - Try creating a new user
5. **Check MongoDB Atlas** - Verify data is actually saved

---

**Status:** ✅ All fixes applied  
**Commit:** `00ef7af`  
**Ready to Test:** ✅ Yes

