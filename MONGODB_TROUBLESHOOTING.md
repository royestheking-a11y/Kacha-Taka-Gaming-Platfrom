# 🔍 MongoDB Data Not Saving/Showing - Troubleshooting Guide

## 🎯 Quick Test

After deployment, test MongoDB connection:

```bash
# Test MongoDB connection and data
curl https://your-app.vercel.app/api/test/mongodb
```

This will show:
- MongoDB connection status
- Count of users, game history, transactions
- Recent users in database

---

## 🔍 Step-by-Step Debugging

### Step 1: Check if API is Being Called

**In Browser Console (F12):**
1. Open DevTools → Console
2. Try to register a user
3. Look for: `[API] POST /api/auth/register`
4. Look for: `[API] Success` or `[API] Error`

**If you see errors:**
- Check the error message
- Check Network tab for the actual HTTP response

### Step 2: Check Vercel Logs

**In Vercel Dashboard:**
1. Go to your project → Logs
2. Try to register a user
3. Look for these logs:

```
[REGISTER] Request received: { email: '...', name: '...' }
[REGISTER] Database connected
[REGISTER] Creating user with data: { ... }
[REGISTER] User created in MongoDB: { id: '...', email: '...' }
[REGISTER] User saved to MongoDB - ID: ...
[REGISTER] Verification - User exists in DB: true
```

**If you DON'T see these logs:**
- API route is not being hit
- Check Vercel routing configuration
- Check API base URL in frontend

**If you see errors:**
- Check the error message and stack trace
- Common issues: MongoDB connection, validation errors

### Step 3: Verify Data in MongoDB Atlas

1. Log into MongoDB Atlas
2. Go to your cluster → Browse Collections
3. Check the `users` collection
4. You should see user documents

**If no data:**
- Data is not being saved
- Check Vercel logs for errors
- Check MongoDB connection string

**If data exists but not showing:**
- Issue with data retrieval
- Check authentication
- Check API response format

### Step 4: Test API Directly

**Test Registration:**
```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Expected Response:**
```json
{
  "message": "Registration successful",
  "token": "...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    ...
  }
}
```

**Test Get Users (requires admin token):**
```bash
curl https://your-app.vercel.app/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🚨 Common Issues & Solutions

### Issue 1: API Returns 404
**Symptom:** Network tab shows 404 for API calls

**Solution:**
- Check `vercel.json` routing
- Ensure `api/index.js` exists
- Check API base URL: Should be `/api` in production

### Issue 2: API Returns HTML Instead of JSON
**Symptom:** Console shows "Non-JSON response"

**Solution:**
- API route not found (404 page returned)
- Check Vercel routing
- Verify API endpoint path

### Issue 3: Data Saves But Doesn't Show
**Symptom:** MongoDB has data, but admin panel shows empty

**Possible Causes:**
1. **Authentication Issue:**
   - Admin not logged in
   - Token expired
   - Token not being sent

2. **Data Format Issue:**
   - User ID mismatch
   - Data transformation error
   - Response format incorrect

3. **Query Issue:**
   - Wrong query parameters
   - Filtering out data
   - Sorting issue

**Solution:**
- Check browser console for API errors
- Check Vercel logs for query results
- Verify authentication token
- Check data transformation in `transformUser()`

### Issue 4: Registration Works But Data Not in MongoDB
**Symptom:** Registration succeeds, but MongoDB is empty

**Possible Causes:**
1. **Wrong Database:**
   - Connection string points to wrong database
   - Data saved to different collection

2. **Transaction Rollback:**
   - Error after save
   - Transaction not committed

3. **Silent Failure:**
   - Error caught but not logged
   - Save operation fails silently

**Solution:**
- Check MongoDB connection string
- Check Vercel environment variables
- Look for errors in Vercel logs
- Verify database name in connection string

### Issue 5: User Update Doesn't Save
**Symptom:** Balance updates but doesn't persist

**Check:**
- Is `updateUser()` being called?
- Is API request successful?
- Check Vercel logs for `[UPDATE_USER]` messages
- Verify user ID matches

---

## 📋 Verification Checklist

After deployment:

- [ ] **Test MongoDB Connection**
  ```bash
  curl https://your-app.vercel.app/api/test/mongodb
  ```
  Should return counts and recent users

- [ ] **Test Registration**
  - Register a new user
  - Check browser console for `[API] Success`
  - Check Vercel logs for `[REGISTER] User saved to MongoDB`
  - Check MongoDB Atlas for new user

- [ ] **Test Login**
  - Login with registered user
  - Check if token is saved
  - Check if user data loads

- [ ] **Test Admin Panel**
  - Login as admin
  - Go to Admin Panel → Users
  - Check browser console for `[GET_USERS] Found users in MongoDB: X`
  - Should see users from MongoDB

- [ ] **Test Game History**
  - Play a game
  - Check browser console for API calls
  - Check Vercel logs for `[GAME_HISTORY] Game history saved to MongoDB`
  - Check MongoDB for game history document

---

## 🔧 Environment Variables

Ensure these are set in Vercel:

```
MONGODB_URI=mongodb+srv://kachatakaorg_db_user:DDFwm3r3SSNo6vgh@kachataka.gvwrrey.mongodb.net/kachataka?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
```

---

## 📝 What to Check in Vercel Logs

### Registration:
```
[REGISTER] Request received: { email: '...', name: '...' }
[REGISTER] Database connected
[REGISTER] Creating user with data: { ... }
[REGISTER] User created in MongoDB: { id: '...', email: '...' }
[REGISTER] User saved to MongoDB - ID: ...
[REGISTER] Verification - User exists in DB: true
[REGISTER] Registration successful for: ...
```

### Get Users:
```
[GET_USERS] Request received from admin: admin@example.com
[GET_USERS] Database connected
[GET_USERS] Found users in MongoDB: 5
[GET_USERS] User IDs: ['...', '...', ...]
```

### Update User:
```
[UPDATE_USER] Updating user: ... { demoPoints: 1000 }
[UPDATE_USER] User found: { id: '...', email: '...' }
[UPDATE_USER] Current balance: { demoPoints: 100, realBalance: 0 }
[UPDATE_USER] Update data: { demoPoints: 1000 }
[UPDATE_USER] User saved to MongoDB: { id: '...', demoPoints: 1000 }
[UPDATE_USER] Verification - Updated balance: { demoPoints: 1000 }
```

---

## 🎯 Next Steps

1. **Redeploy** - All logging has been added
2. **Test Registration** - Try creating a user
3. **Check Vercel Logs** - Look for detailed logs
4. **Check MongoDB Atlas** - Verify data exists
5. **Test Admin Panel** - See if data loads

The comprehensive logging will help identify exactly where the issue is!

---

**Status:** ✅ Comprehensive logging added  
**Commit:** `d6e56e3`  
**Test Endpoint:** `/api/test/mongodb`

