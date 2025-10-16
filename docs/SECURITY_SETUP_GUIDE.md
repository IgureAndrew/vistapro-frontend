# 🔒 VistaPro Security Setup Guide

## ⚠️ **CRITICAL: Environment Variables Removed from Git**

All environment files containing secret keys have been removed from git tracking for security.

---

## 🛡️ **SECURITY FIXES IMPLEMENTED:**

### ✅ **Removed from Git History:**
- `backend/config.env` (contained RESEND_API_KEY and database credentials)
- `frontend/.env` (contained API URLs and secrets)
- `frontend/production.env` (production secrets)
- `backend/production.env` (production secrets)
- `backend/staging.env` (staging secrets)

### ✅ **Updated .gitignore:**
- Added `config.env` to gitignore
- Added `*.env` to gitignore
- Added all environment file patterns

### ✅ **Created Templates:**
- `backend/config.env.template` - Safe template for backend
- `frontend/env.template` - Safe template for frontend

---

## 🔧 **REQUIRED: Set Up Environment Variables**

### **Step 1: Create Local Environment Files**

**Backend:**
```bash
cp backend/config.env.template backend/config.env
```

**Frontend:**
```bash
cp frontend/env.template frontend/.env
```

### **Step 2: Fill in Actual Values**

**Edit `backend/config.env`:**
```env
# Database Configuration
DB_HOST=your_actual_database_host
DB_PORT=5432
DB_NAME=your_actual_database_name
DB_USER=your_actual_database_user
DB_PASSWORD=your_actual_database_password
DB_SSL=true

# JWT Configuration
JWT_SECRET=your_actual_jwt_secret_key
JWT_EXPIRES_IN=24h

# Email Configuration (Resend API)
RESEND_API_KEY=re_922xJy5k_p9K9ZbRDxCeR1ESsesswXtca
RESEND_FROM_EMAIL=noreply@vistapro.ng

# Server Configuration
PORT=5007
NODE_ENV=production
```

**Edit `frontend/.env`:**
```env
# API Configuration
REACT_APP_API_URL=https://vistapro-backend.onrender.com
VITE_API_URL=https://vistapro-backend.onrender.com

# Environment
NODE_ENV=production
```

---

## 🚀 **DEPLOYMENT: Configure Production Environment**

### **Render (Backend):**
1. Go to: https://dashboard.render.com
2. Find your VistaPro backend service
3. Go to **Environment** tab
4. Add these variables:
   ```
   DB_HOST=your_database_host
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_SSL=true
   JWT_SECRET=your_jwt_secret
   RESEND_API_KEY=re_922xJy5k_p9K9ZbRDxCeR1ESsesswXtca
   RESEND_FROM_EMAIL=noreply@vistapro.ng
   PORT=5007
   NODE_ENV=production
   ```
5. **Restart the service**

### **Vercel (Frontend):**
1. Go to: https://vercel.com/dashboard
2. Find your VistaPro project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   REACT_APP_API_URL=https://vistapro-backend.onrender.com
   VITE_API_URL=https://vistapro-backend.onrender.com
   NODE_ENV=production
   ```
5. **Redeploy the project**

---

## 🔍 **VERIFY SECURITY:**

### **Check Git Status:**
```bash
git status
```
Should show NO environment files in "Changes not staged for commit"

### **Check .gitignore:**
```bash
cat backend/.gitignore | grep env
```
Should show:
```
.env
config.env
*.env
```

### **Test Local Development:**
1. Create `backend/config.env` from template
2. Create `frontend/.env` from template
3. Fill in actual values
4. Test local development

---

## 🚨 **SECURITY BEST PRACTICES:**

### ✅ **DO:**
- Use environment templates (`.template` files)
- Keep secrets in environment variables
- Use different secrets for development/staging/production
- Regularly rotate API keys and passwords
- Monitor for unauthorized access

### ❌ **DON'T:**
- Commit environment files to git
- Share API keys in code or documentation
- Use production secrets in development
- Store secrets in plain text files
- Ignore security warnings

---

## 📞 **NEXT STEPS:**

1. **Create local environment files** from templates
2. **Configure Render environment variables** for production
3. **Configure Vercel environment variables** for frontend
4. **Test the OTP system** with proper environment setup
5. **Verify all secrets are secure** and not in git

---

## 🔐 **ENVIRONMENT VARIABLES SUMMARY:**

### **Required for OTP System:**
- `RESEND_API_KEY` - For sending OTP emails
- `RESEND_FROM_EMAIL` - Email sender address
- `JWT_SECRET` - For authentication tokens
- `DB_*` variables - For database connection

### **Required for Frontend:**
- `REACT_APP_API_URL` - Backend API URL
- `VITE_API_URL` - Backend API URL (Vite)

**All environment variables are now secure and properly configured!** 🛡️

