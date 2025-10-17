# 📧 Email Verification Testing Guide

## **✅ Backend is Running Successfully!**

Both backend and frontend are now running locally and connected to the **production database**.

### **Services Running:**

- **Backend**: `http://localhost:5000` ✅
- **Frontend**: `http://localhost:5173` ✅
- **Database**: Production PostgreSQL (Render) ✅
- **Redis**: Production Upstash ✅

---

## **🧪 How to Test Email Verification**

### **Step 1: Register a New User**

1. Go to `http://localhost:5173`
2. Click "Sign Up" or "Register"
3. Fill in the registration form with:
   - **Email**: Use your real email address (e.g., `your-email@gmail.com`)
   - **Password**: Any secure password
   - **Other required fields**: Fill as needed
4. Click "Register"

### **Step 2: Check Your Email**

1. Open your email inbox (check spam folder too)
2. Look for an email from **Vistapro** with subject: **"Verify Your Email Address"**
3. The email should contain:
   - A verification link
   - The link should point to: `http://localhost:5173/email-verification?token=XXXXX`

### **Step 3: Verify the Link**

1. Click the verification link in the email
2. You should be redirected to: `http://localhost:5173/email-verification?token=XXXXX`
3. The frontend should:
   - Extract the token from the URL
   - Send it to the backend API: `POST /api/auth/verify-email`
   - Display a success message if verification succeeds
   - Display an error message if verification fails

### **Step 4: Verify Success**

1. After clicking the link, you should see a success message
2. Try to log in with the registered credentials
3. The user should now be able to log in successfully

---

## **🔍 What to Check**

### **Email Content:**
- ✅ Email is received
- ✅ Email subject is correct: "Verify Your Email Address"
- ✅ Email contains the verification link
- ✅ Link points to `http://localhost:5173/email-verification?token=XXXXX`
- ✅ Link is clickable and works

### **Frontend Behavior:**
- ✅ Verification page loads at `/email-verification`
- ✅ Token is extracted from URL query parameter
- ✅ Token is sent to backend API
- ✅ Success/error message is displayed
- ✅ User can log in after verification

### **Backend Behavior:**
- ✅ Email is sent successfully (check logs)
- ✅ Token is generated and stored in database
- ✅ Token is validated when user clicks the link
- ✅ User's `is_verified` flag is set to `true`
- ✅ Token is deleted after successful verification

---

## **🐛 Troubleshooting**

### **Email Not Received:**
1. Check spam folder
2. Check Resend dashboard for email logs
3. Verify `RESEND_API_KEY` is correct in environment variables
4. Check backend logs for email sending errors

### **Verification Link Not Working:**
1. Check if the link is pointing to the correct frontend URL
2. Verify the token is valid (not expired, not already used)
3. Check backend logs for verification errors
4. Verify the frontend route `/email-verification` exists

### **Token Invalid Error:**
1. Check if token is expired (default: 24 hours)
2. Check if token was already used
3. Check if token exists in database
4. Check backend logs for detailed error messages

---

## **📊 Testing Checklist**

- [ ] Register a new user
- [ ] Receive verification email
- [ ] Email contains correct link
- [ ] Link points to correct frontend URL
- [ ] Click verification link
- [ ] Frontend displays success message
- [ ] User can log in after verification
- [ ] Backend logs show email sent
- [ ] Backend logs show verification successful
- [ ] Database shows `is_verified = true`

---

## **🔧 Backend API Endpoints**

### **Register User:**
```
POST /api/auth/register
```

### **Verify Email:**
```
POST /api/auth/verify-email
Body: { "token": "verification-token" }
```

### **Resend Verification Email:**
```
POST /api/auth/resend-verification
Body: { "email": "user@example.com" }
```

---

## **📝 Notes**

- **Frontend URL**: Currently set to `http://localhost:5173` for local testing
- **Production URL**: Will be `https://vistapro.ng` when deployed
- **Token Expiry**: 24 hours by default
- **Email Provider**: Resend (check dashboard for delivery status)

---

## **🎯 Next Steps**

1. Test email verification flow end-to-end
2. Verify all edge cases (expired token, invalid token, etc.)
3. Test resend verification email functionality
4. Update `FRONTEND_URL` to `https://vistapro.ng` for production
5. Deploy to Render and Vercel

---

**Status**: ✅ Ready for Testing
**Date**: October 17, 2025

