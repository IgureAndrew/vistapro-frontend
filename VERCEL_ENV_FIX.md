# 🚨 VERCEL ENVIRONMENT VARIABLE FIX

## **Problem**

The email verification is failing with a 404 error because the frontend is calling:
```
https://vistapro-backend.onrender.com/auth/verify-email
```

Instead of:
```
https://vistapro-backend.onrender.com/api/auth/verify-email
```

## **Root Cause**

The `VITE_API_URL` environment variable is **NOT SET** in Vercel, so the frontend is using an incorrect base URL.

---

## **✅ SOLUTION: Set VITE_API_URL in Vercel**

### **Step 1: Go to Vercel Dashboard**

1. Open: https://vercel.com/dashboard
2. Select your **vistapro-frontend** project
3. Click on **"Settings"** tab
4. Click on **"Environment Variables"** in the left sidebar

### **Step 2: Add Environment Variable**

Click **"Add New"** and add:

- **Name**: `VITE_API_URL`
- **Value**: `https://vistapro-backend.onrender.com`
- **Environment**: Select all (Production, Preview, Development)

Click **"Save"**

### **Step 3: Redeploy**

1. Go back to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## **Alternative: Quick Fix via Vercel CLI**

If you have Vercel CLI installed:

```bash
cd frontend
vercel env add VITE_API_URL
# When prompted, enter: https://vistapro-backend.onrender.com
# Select all environments (Production, Preview, Development)
```

Then redeploy:
```bash
vercel --prod
```

---

## **Verification**

After redeploying, the frontend should call:
```
https://vistapro-backend.onrender.com/api/auth/verify-email
```

You can verify this by:
1. Opening browser DevTools Console
2. Going to Network tab
3. Attempting email verification
4. Checking the API call URL

---

## **Expected Behavior After Fix**

1. User receives verification email
2. User clicks verification link
3. Frontend calls: `https://vistapro-backend.onrender.com/api/auth/verify-email`
4. Backend verifies the token
5. User sees success message
6. User can log in

---

**Status**: ⚠️ Action Required
**Priority**: 🔴 HIGH - Blocks email verification functionality

