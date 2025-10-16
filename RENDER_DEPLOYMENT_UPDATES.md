# 🚀 RENDER DEPLOYMENT SETTINGS UPDATE

## 📋 CURRENT STATUS

### ✅ COMPLETED:
- ✅ Clean project structure (single `backend/` folder, single `frontend/` folder)
- ✅ Removed nested `backend/backend/backend/` structure
- ✅ Fixed `emailService.js` parameter order issue
- ✅ Updated `FRONTEND_URL` to use `vistapro.ng`
- ✅ Removed duplicate files and folders
- ✅ Local testing environment set up with production data
- ✅ Docker PostgreSQL + Redis running locally
- ✅ 80 production users imported for testing

### 🔄 PENDING:
- ⏳ Update Render deployment settings
- ⏳ Test locally to verify email verification works
- ⏳ Deploy to Render at 7PM with maintenance mode

---

## 🎯 RENDER SETTINGS TO UPDATE (AT 7PM)

### **Current Settings (INCORRECT):**
```
Root Directory: [EMPTY]
Build Command: npm install
Start Command: npm start
```

### **Required Settings (CORRECT):**
```
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

---

## 📝 STEP-BY-STEP DEPLOYMENT GUIDE

### **PHASE 1: LOCAL TESTING (NOW - BEFORE 7PM)**

#### **Option A: Quick Start (All-in-One)**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
.\start-local-complete.ps1
```

This will:
- ✅ Start Docker containers (PostgreSQL + Redis)
- ✅ Open Backend terminal (port 5000)
- ✅ Open Frontend terminal (port 5173)

#### **Option B: Manual Start**

**Terminal 1 - Backend:**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
.\start-local-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
.\start-local-frontend.ps1
```

#### **Test Email Verification:**
1. Open http://localhost:5173
2. Register a new test account with YOUR email
3. Check your email for verification link
4. **VERIFY:** Token should be a HASH (not "Andrew")
5. Click verification link
6. **VERIFY:** Redirects to login page after success
7. Login with verified account
8. **VERIFY:** All functionalities work

---

### **PHASE 2: RENDER SETTINGS UPDATE (7PM)**

#### **Step 1: Enable Maintenance Mode**

**Vercel (Frontend):**
1. Go to Vercel Dashboard → vistapro project
2. Settings → Environment Variables
3. Add: `MAINTENANCE_MODE=true`
4. Redeploy

**OR** use custom maintenance page if configured.

#### **Step 2: Update Render Settings**

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Navigate to `vistapro-backend` service
3. Click **"Settings"**

**Update These Fields:**

**Root Directory:**
- Click "Edit" next to "Root Directory (Optional)"
- Enter: `backend`
- Click "Save"

**Build Command:**
- Click "Edit" next to "Build Command"
- Keep as: `npm install`
- Click "Save"

**Start Command:**
- Click "Edit" next to "Start Command"
- Keep as: `npm start`
- Click "Save"

#### **Step 3: Trigger Deployment**

**Option A: Manual Deploy**
- In Render Dashboard → Click "Manual Deploy" → "Deploy latest commit"

**Option B: Git Push (if changes need to be pushed)**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
git add .
git commit -m "Fix: Clean structure and update deployment settings"
git push origin main
```

Render will auto-deploy after push.

#### **Step 4: Monitor Deployment**

Watch the deployment logs in Render:
- Check for successful build
- Verify server starts without errors
- Look for "Server running on port 5000" message

**Expected deployment time:** 3-5 minutes

#### **Step 5: Test Production**

1. Visit https://vistapro.ng
2. Try logging in with existing account
3. Register a NEW test account
4. **CRITICAL:** Check verification email
   - Token should be a secure hash
   - Link should use `vistapro.ng` domain
5. Click verification link
6. Verify successful verification
7. Test all major functionalities

#### **Step 6: Disable Maintenance Mode**

**Vercel:**
1. Go to Environment Variables
2. Remove `MAINTENANCE_MODE=true` OR set to `false`
3. Redeploy

---

## 🔍 VERIFICATION CHECKLIST

### **Before Deployment:**
- [ ] Local testing completed successfully
- [ ] Email verification works locally
- [ ] All roles can access their features
- [ ] No console errors in browser
- [ ] No server errors in terminal

### **During Deployment:**
- [ ] Maintenance mode activated
- [ ] Render settings updated correctly
- [ ] Deployment logs show no errors
- [ ] Server starts successfully

### **After Deployment:**
- [ ] Production site loads correctly
- [ ] Existing users can login
- [ ] New registrations work
- [ ] Email verification links use correct domain
- [ ] Verification tokens are secure hashes
- [ ] Email verification completes successfully
- [ ] All user roles function properly
- [ ] Maintenance mode disabled

---

## 🚨 ROLLBACK PLAN (IF ISSUES OCCUR)

### **If Deployment Fails:**

**Option 1: Revert Render Settings**
1. Go to Render Settings
2. Change Root Directory back to: [EMPTY]
3. Build Command: `cd backend && npm install`
4. Start Command: `cd backend && npm start`
5. Manual deploy

**Option 2: Revert Git Commit**
```powershell
git revert HEAD
git push origin main
```

### **If Email Verification Fails:**
1. Check Render environment variables
2. Verify `FRONTEND_URL=https://vistapro.ng`
3. Check `RESEND_API_KEY` is valid
4. Review server logs for errors
5. Test with local database to isolate issue

---

## 📊 EXPECTED RESULTS

### **Email Verification Link (BEFORE FIX):**
```
https://vistapro-4xlusoclj-vistapros-projects.vercel.app/verify-email?token=Andrew
```
❌ Wrong domain, token is "Andrew"

### **Email Verification Link (AFTER FIX):**
```
https://vistapro.ng/verify-email?token=a8f5e2c9b4d7e1f8a3c6b2d5e9f1a4c7b8d2e5f9a1c4b7d8e2f5a9c1b4d7e8f2
```
✅ Correct domain, secure token

---

## 🔒 POST-DEPLOYMENT SECURITY

### **CRITICAL: Rotate These Secrets After Testing**

1. **Resend API Key:**
   - Current: `re_922xJy5k_p9K9ZbRDxCeR1ESsesswXtca`
   - Action: Delete and create new key in Resend dashboard
   - Update in Render environment variables

2. **Database Password:**
   - Action: Rotate in Render PostgreSQL settings
   - Update `DATABASE_URL` in environment variables

3. **Redis Password:**
   - Action: Rotate in Upstash dashboard
   - Update `REDIS_URL` in environment variables

4. **JWT & Session Secrets:**
   - Generate new secrets
   - Update in Render environment variables
   - **WARNING:** This will log out all users

5. **Admin Access Codes:**
   - Change `MASTER_ADMIN_SECRET_KEY`
   - Change `PROFIT_REPORT_ACCESS_CODE`
   - Update in secure storage

6. **Cloudinary API Secret:**
   - Rotate in Cloudinary dashboard
   - Update in Render environment variables

---

## 🧹 CLEANUP AFTER TESTING

### **Remove Local Database Dump:**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
Remove-Item -Recurse -Force database_dump
```

### **Stop Docker Containers:**
```powershell
docker-compose down -v
```

### **Delete Local .env Files:**
```powershell
Remove-Item backend\.env.local -ErrorAction SilentlyContinue
Remove-Item frontend\.env.local -ErrorAction SilentlyContinue
```

---

## 📞 SUPPORT CONTACTS

### **If Issues Occur:**
1. Check Render deployment logs
2. Check Vercel deployment logs
3. Review browser console errors
4. Check email service (Resend) logs
5. Contact support if needed:
   - Render Support
   - Vercel Support
   - Resend Support

---

## ✅ SUCCESS CRITERIA

**Deployment is successful when:**
- ✅ All existing users can login
- ✅ New users can register
- ✅ Email verification emails are sent
- ✅ Verification links use `vistapro.ng` domain
- ✅ Verification tokens are secure hashes
- ✅ Email verification completes successfully
- ✅ All user roles function properly
- ✅ No errors in production logs
- ✅ No user complaints

---

## 🎯 TIMELINE

**Current Time:** ~2:00 PM (estimate)
**Testing Window:** 2:00 PM - 7:00 PM
**Maintenance Window:** 7:00 PM - 7:30 PM
**Expected Completion:** 7:30 PM

**Total Estimated Downtime:** 15-30 minutes

---

## 📝 NOTES

- Local testing uses REAL production data (80 users, 34 tables)
- Changes are isolated to local environment
- Zero risk to live users during testing
- Maintenance mode protects users during deployment
- Rollback plan ensures quick recovery if needed

**Good luck with the deployment! 🚀**

