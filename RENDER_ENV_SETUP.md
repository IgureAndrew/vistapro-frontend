# Render Environment Variables Setup

## 🔧 Add RESEND_API_KEY to Render

The backend deployment is failing because the `RESEND_API_KEY` environment variable is not configured on Render.

### **Step-by-Step Instructions:**

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Navigate to your backend service (`vistapro-backend`)

2. **Access Environment Variables**
   - Click on your service
   - Go to the **"Environment"** tab in the left sidebar
   - Click **"Add Environment Variable"**

3. **Add RESEND_API_KEY**
   - **Key**: `RESEND_API_KEY`
   - **Value**: `re_922xJy5k_p9K9ZbRDxCeR1ESsesswXtca`
   - Click **"Save Changes"**

4. **Add RESEND_FROM_EMAIL (Optional but Recommended)**
   - **Key**: `RESEND_FROM_EMAIL`
   - **Value**: `noreply@vistapro.ng`
   - Click **"Save Changes"**

5. **Redeploy**
   - Render will automatically redeploy after saving environment variables
   - Wait 2-3 minutes for deployment to complete
   - Check logs for success message

---

## ✅ Expected Log Output After Fix

```
✅ Database connection successful
✅ All tables checked
🔧 Adding OTP-related columns to users table...
✅ Set grace period for existing users
✅ Server listening on port 10000
```

---

## ⚠️ Current Error (Before Fix)

```
Error: Missing API key. Pass it to the constructor `new Resend("re_123")`
```

---

## 📧 Environment Variables for Resend

| Variable | Value | Required |
|----------|-------|----------|
| `RESEND_API_KEY` | `re_922xJy5k_p9K9ZbRDxCeR1ESsesswXtca` | ✅ Yes |
| `RESEND_FROM_EMAIL` | `noreply@vistapro.ng` | ⚠️ Optional |

---

## 🔐 Security Note

The Resend API key has been added to the local `config.env` file but needs to be manually added to Render's environment variables for production deployment.

---

## 🚀 After Adding the Environment Variable

Once the environment variable is added and the service redeploys:

1. **OTP Login** will work on production
2. **Email sending** will be functional
3. **Grace period alerts** will trigger
4. **Users can receive OTP codes** via email

---

## 📞 Troubleshooting

If the error persists after adding the environment variable:

1. **Check spelling**: Ensure `RESEND_API_KEY` is spelled correctly
2. **Check value**: Verify the API key starts with `re_`
3. **Manual redeploy**: Click "Manual Deploy" → "Deploy latest commit"
4. **Check logs**: Look for `✅ OTP email sent successfully` messages

---

**Once this is set up, the OTP system will be fully operational!** 🎉

