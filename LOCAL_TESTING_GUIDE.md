# 🚀 LOCAL TESTING GUIDE FOR VISTAPRO

## ✅ SETUP COMPLETE!

Your local development environment is ready with **REAL PRODUCTION DATA**:
- ✅ PostgreSQL 16 running locally (Docker)
- ✅ Redis running locally (Docker)
- ✅ **80 production users** imported
- ✅ **34 tables** with all production data
- ✅ Zero risk to live users

---

## 🔧 CURRENT STATUS

### **Docker Containers Running:**
```
✅ vistapro_local_db (PostgreSQL 16) - localhost:5432
✅ vistapro_local_redis (Redis 7) - localhost:6379
```

### **Database Credentials:**
```
Host: localhost
Port: 5432
Database: vistapro_local
Username: vistapro_local
Password: local_dev_password
```

---

## 🎯 HOW TO RUN VISTAPRO LOCALLY

### **Step 1: Copy Environment Files**

**Backend:**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro\backend
Copy-Item env.local.example -Destination .env.local
```

**Frontend:**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro\frontend
Copy-Item env.local.example -Destination .env.local
```

### **Step 2: Start Backend**

Open **Terminal 1**:
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro\backend
$env:NODE_ENV="development"
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
pnpm install
pnpm dev
```

Or use the existing pnpm command:
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
pnpm -F backend dev
```

### **Step 3: Start Frontend**

Open **Terminal 2**:
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
pnpm -F frontend dev
```

### **Step 4: Access the Application**

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Database:** localhost:5432

---

## 🧪 TESTING EMAIL VERIFICATION

### **Test Flow:**
1. Open http://localhost:5173
2. Register a NEW test account (use your real email to receive verification)
3. Check the verification email
4. Click the verification link
5. Verify the token is a proper hash (not "Andrew")
6. Check if verification works correctly

### **What to Test:**
- ✅ Email verification link generation
- ✅ Token format (should be a hash)
- ✅ Verification page loads correctly
- ✅ Successful verification redirects to login
- ✅ Failed verification shows proper error
- ✅ User can login after verification

---

## 🛠️ DOCKER COMMANDS

### **Start Containers:**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
docker-compose up -d
```

### **Stop Containers:**
```powershell
cd C:\Users\abc\OneDrive\Desktop\Vistapro
docker-compose down
```

### **View Logs:**
```powershell
# PostgreSQL logs
docker logs vistapro_local_db

# Redis logs
docker logs vistapro_local_redis
```

### **Access Database:**
```powershell
docker exec vistapro_local_db psql -U vistapro_local -d vistapro_local
```

### **Check Container Status:**
```powershell
docker ps
```

---

## 📊 DATABASE QUERIES

### **Count Users:**
```powershell
docker exec vistapro_local_db psql -U vistapro_local -d vistapro_local -c "SELECT COUNT(*) FROM users;"
```

### **List All Tables:**
```powershell
docker exec vistapro_local_db psql -U vistapro_local -d vistapro_local -c "\dt"
```

### **Check Recent Users:**
```powershell
docker exec vistapro_local_db psql -U vistapro_local -d vistapro_local -c "SELECT id, email, first_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 10;"
```

---

## ⚠️ IMPORTANT NOTES

### **Data Safety:**
- ✅ **This is a LOCAL COPY** - changes won't affect production
- ✅ **Safe to test** - break things, debug, experiment freely
- ✅ **Real data** - 80 actual production users for realistic testing
- ⚠️ **Privacy** - Don't commit this data to Git!

### **Email Testing:**
- ⚠️ Resend API key is PRODUCTION key
- ⚠️ Test emails will actually send
- ⚠️ Use your own email for testing, not real user emails
- ⚠️ Remember to rotate this key after testing

### **When Done Testing:**
- Delete local database if it contains sensitive data
- Rotate production secrets (especially Resend API key)
- Update Render settings for deployment

---

## 🚀 NEXT STEPS AFTER TESTING

### **Once Everything Works Locally:**

1. **Update Render Settings** (at 7PM with maintenance):
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Deploy to Production:**
   - Push clean code to GitHub
   - Render will auto-deploy
   - Test live email verification

3. **Security:**
   - Rotate all secrets (database, API keys, etc.)
   - Remove local database dump
   - Delete `database_dump/` folder

---

## 🔧 TROUBLESHOOTING

### **Containers Won't Start:**
```powershell
docker-compose down -v
docker-compose up -d
```

### **Database Connection Error:**
Check if PostgreSQL is running:
```powershell
docker ps | Select-String "vistapro_local_db"
```

### **Frontend Can't Connect to Backend:**
Verify backend is running on port 5000:
```powershell
netstat -an | Select-String "5000"
```

### **Need Fresh Database:**
```powershell
# Stop and remove everything
docker-compose down -v

# Re-import production data
docker-compose up -d
Start-Sleep -Seconds 15
Get-Content database_dump/production_dump.sql | docker exec -i vistapro_local_db psql -U vistapro_local -d vistapro_local
```

---

## 📞 READY TO TEST!

Everything is set up. You can now:
1. Copy the `.env` files
2. Start backend and frontend
3. Test the complete application with real production data
4. Debug email verification safely

**No risk to live users. Test freely!** 🎉

