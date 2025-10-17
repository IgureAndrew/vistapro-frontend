# 🚀 Production Email Verification Testing Guide

## **✅ LIVE PRODUCTION ENVIRONMENT**

Both services are now deployed and running:

- **Backend**: `https://vistapro-backend.onrender.com` ✅
- **Frontend**: `https://www.vistapro.ng` ✅
- **Database**: Production PostgreSQL (Render) ✅
- **Redis**: Production Upstash ✅

---

## **🧪 How to Test Email Verification in Production**

### **Step 1: Go to Production Website**

1. Open your browser
2. Go to: **https://www.vistapro.ng**
3. You should see the Vistapro landing page

### **Step 2: Register a New User**

1. Click **"Sign Up"** or **"Register"** button
2. Fill in the registration form:
   - **Email**: Use your real email address (e.g., `your-email@gmail.com`)
   - **Password**: Create a secure password
   - **First Name**: Your first name
   - **Last Name**: Your last name
   - **Phone**: Your phone number
   - **Role**: Select appropriate role (Marketer, etc.)
3. Click **"Register"** or **"Sign Up"**

### **Step 3: Check Your Email**

1. Open your email inbox
2. **Check spam folder** if not in inbox
3. Look for an email from **Vistapro** with subject: **"Verify Your Email Address"**
4. The email should contain:
   - A verification link
   - The link should point to: **`https://www.vistapro.ng/email-verification?token=XXXXX`**

### **Step 4: Click the Verification Link**

1. Click the verification link in the email
2. You should be redirected to: **`https://www.vistapro.ng/email-verification?token=XXXXX`**
3. The frontend should:
   - Extract the token from the URL
   - Send it to the backend API: `POST /api/auth/verify-email`
   - Display a success message if verification succeeds
   - Display an error message if verification fails

### **Step 5: Verify Success**

1. After clicking the link, you should see a success message like:
   - ✅ **"Email verified successfully!"**
   - ✅ **"Your email has been verified. You can now log in."**
2. Try to log in with the registered credentials
3. The user should now be able to log in successfully

---

## **🔍 What to Check**

### **Email Content:**
- ✅ Email is received (check spam folder)
- ✅ Email subject is correct: "Verify Your Email Address"
- ✅ Email contains the verification link
- ✅ Link points to **`https://www.vistapro.ng/email-verification?token=XXXXX`**
- ✅ Link is clickable and works
- ✅ Email is well-formatted and professional

### **Frontend Behavior:**
- ✅ Verification page loads at `/email-verification`
- ✅ Token is extracted from URL query parameter
- ✅ Token is sent to backend API
- ✅ Success/error message is displayed
- ✅ User can log in after verification
- ✅ Page redirects to login or dashboard after verification

### **Backend Behavior:**
- ✅ Email is sent successfully (check Resend dashboard)
- ✅ Token is generated and stored in database
- ✅ Token is validated when user clicks the link
- ✅ User's `is_verified` flag is set to `true`
- ✅ Token is deleted after successful verification

---

## **📊 Testing Checklist**

- [ ] Go to https://www.vistapro.ng
- [ ] Register a new user with real email
- [ ] Receive verification email
- [ ] Email contains correct link
- [ ] Link points to https://www.vistapro.ng/email-verification?token=XXXXX
- [ ] Click verification link
- [ ] Frontend displays success message
- [ ] User can log in after verification
- [ ] Backend logs show email sent (check Render logs)
- [ ] Backend logs show verification successful
- [ ] Database shows `is_verified = true`

---

## **🐛 Troubleshooting**

### **Email Not Received:**
1. Check spam folder
2. Check Resend dashboard for email logs: https://resend.com/emails
3. Verify `RESEND_API_KEY` is correct in Render environment variables
4. Check Render logs for email sending errors
5. Wait 1-2 minutes for email delivery

### **Verification Link Not Working:**
1. Check if the link is pointing to the correct frontend URL (`https://www.vistapro.ng`)
2. Verify the token is valid (not expired, not already used)
3. Check Render logs for verification errors
4. Verify the frontend route `/email-verification` exists
5. Check browser console for JavaScript errors

### **Token Invalid Error:**
1. Check if token is expired (default: 24 hours)
2. Check if token was already used
3. Check if token exists in database
4. Check Render logs for detailed error messages
5. Try registering again to get a new token

### **Page Not Loading:**
1. Check if Vercel deployment is successful
2. Check Vercel logs for errors
3. Verify DNS is pointing to correct Vercel deployment
4. Check browser console for errors

---

## **🔧 Production API Endpoints**

### **Register User:**
```
POST https://vistapro-backend.onrender.com/api/auth/register
```

### **Verify Email:**
```
POST https://vistapro-backend.onrender.com/api/auth/verify-email
Body: { "token": "verification-token" }
```

### **Resend Verification Email:**
```
POST https://vistapro-backend.onrender.com/api/auth/resend-verification
Body: { "email": "user@example.com" }
```

---

## **📝 Production Environment Details**

- **Frontend URL**: `https://www.vistapro.ng`
- **Backend URL**: `https://vistapro-backend.onrender.com`
- **Token Expiry**: 24 hours
- **Email Provider**: Resend
- **Database**: PostgreSQL (Render)
- **Redis**: Upstash
- **Frontend Host**: Vercel
- **Backend Host**: Render

---

## **🎯 Next Steps After Testing**

1. ✅ Test email verification flow end-to-end
2. ✅ Verify all edge cases (expired token, invalid token, etc.)
3. ✅ Test resend verification email functionality
4. ✅ Monitor Render and Vercel logs for any errors
5. ✅ Check Resend dashboard for email delivery status
6. ✅ Verify database records are updated correctly

---

## **📞 Support & Monitoring**

### **Check Render Logs:**
1. Go to https://dashboard.render.com
2. Select your backend service
3. Click "Logs" tab
4. Look for email sending and verification logs

### **Check Vercel Logs:**
1. Go to https://vercel.com/dashboard
2. Select your frontend project
3. Click "Deployments"
4. Click on latest deployment
5. Click "Functions" tab for serverless logs

### **Check Resend Dashboard:**
1. Go to https://resend.com/emails
2. View all sent emails
3. Check delivery status
4. View email content

---

**Status**: ✅ Ready for Production Testing
**Date**: October 17, 2025
**Environment**: Production (Live)

