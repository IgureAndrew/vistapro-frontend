# 🧪 Testing Guide - Marketer Overview Real Data Fix

## 🎯 Quick Test (1 Minute)

### **Test User:**
- **Email:** leo@gmail.com
- **Password:** (your password)
- **Expected Data:**
  - Stock Pickups: **13**
  - Total Orders: **5**
  - Wallet Balance: **₦34,000**

---

## ✅ Testing Steps

### **Step 1: Clear Cache**
- Press **Ctrl + Shift + R** (hard refresh)
- Or clear browser cache manually

---

### **Step 2: Login**
- Navigate to login page
- Enter email: `leo@gmail.com`
- Enter password
- Click Login

---

### **Step 3: Check Overview Dashboard**

The dashboard should automatically show the Overview page.

**Look for these cards:**

```
┌────────────────────────────────────────────────────────────────┐
│                     VERIFICATION STATUS                        │
│  ✓ Approved                                                    │
│  Account verified                                              │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ 📦 Stock Pickups    │  │ 🛒 Total Orders     │  │ 💰 Wallet Balance   │
│ 13                  │  │ 5                   │  │ ₦34,000             │
│ Total pickups...    │  │ Orders placed...    │  │ Available balance   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

### **Step 4: Verify Each Metric**

#### **✅ Stock Pickups Card**
- Should show: **13**
- NOT: 0
- Card icon: 📦 (Package icon)

#### **✅ Total Orders Card**
- Should show: **5**
- NOT: 0
- Card icon: 🛒 (Shopping cart icon)

#### **✅ Wallet Balance Card**
- Should show: **₦34,000**
- NOT: ₦0
- Card icon: 💰 (Wallet icon)
- Formatted with thousand separators

---

### **Step 5: Check Browser Console**

**Open Developer Tools:**
- Press **F12** or **Ctrl + Shift + I**
- Click **Console** tab

**Expected Logs:**
```
✅ No errors should appear
```

**Successful API Calls:**
```
(If you see these, it's working correctly)
```

---

### **Step 6: Check Network Tab**

**In Developer Tools:**
- Click **Network** tab
- Look for these API calls:

1. **GET marketer/orders/history**
   - Status: **200 OK**
   - Response: `{ orders: [...] }` (array of 5 orders)

2. **GET wallets**
   - Status: **200 OK**
   - Response: `{ wallet: { available_balance: "34000", ... } }`

3. **GET stock/marketer-history**
   - Status: **200 OK**
   - Response: `{ history: [...] }` (array of 13 pickups)

---

## 📊 Visual Comparison

### **BEFORE (Broken) ❌**
```
Stock Pickups: 0
Total Orders: 0
Wallet Balance: ₦0
```

### **AFTER (Fixed) ✅**
```
Stock Pickups: 13
Total Orders: 5
Wallet Balance: ₦34,000
```

---

## 🐛 Troubleshooting

### **Issue 1: Still Showing Zeros**

**Possible Causes:**
- Browser cache not cleared
- Old version still loaded
- API errors

**Solution:**
1. Hard refresh: **Ctrl + Shift + R**
2. Check console for errors
3. Check Network tab for failed API calls
4. Logout and login again

---

### **Issue 2: Console Shows Errors**

**Check for:**
```
Error loading orders: ...
Error loading wallet: ...
Error loading stock pickups: ...
```

**Solution:**
1. Check if backend is running
2. Check if token is valid (logout/login)
3. Verify API endpoints are accessible
4. Check browser console for specific error messages

---

### **Issue 3: Network Tab Shows 401 Unauthorized**

**Cause:** Token expired or invalid

**Solution:**
1. Logout
2. Login again
3. Test overview page

---

### **Issue 4: Network Tab Shows 404 Not Found**

**Cause:** API endpoint doesn't exist

**Check:**
1. Backend server is running
2. API routes are registered
3. Endpoint URLs are correct

---

## 🔍 Detailed Verification

### **Test Each API Endpoint Individually:**

#### **1. Orders API**
```javascript
// In browser console:
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/marketer/orders/history', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Orders:', d));
```

**Expected Output:**
```json
{
  "orders": [
    {
      "id": 886,
      "customer_name": "lekan",
      "sold_amount": "110000.00",
      "status": "released_confirmed",
      ...
    },
    ... 4 more orders
  ]
}
```

---

#### **2. Wallet API**
```javascript
// In browser console:
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/wallets', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Wallet:', d));
```

**Expected Output:**
```json
{
  "wallet": {
    "user_unique_id": "DSR00093",
    "available_balance": "34000",
    "total_balance": "40000",
    "withheld_balance": "6000",
    ...
  },
  "transactions": [...],
  "withdrawals": [...]
}
```

---

#### **3. Stock Pickups API**
```javascript
// In browser console:
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/stock/marketer-history', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Stock Pickups:', d));
```

**Expected Output:**
```json
{
  "history": [
    {
      "id": 1330,
      "product_id": 76,
      "quantity": 1,
      "status": "sold",
      ...
    },
    ... 12 more pickups
  ]
}
```

---

## ✅ Success Criteria

**All tests pass when:**

- [x] Stock Pickups card shows **13**
- [x] Total Orders card shows **5**
- [x] Wallet Balance card shows **₦34,000**
- [x] No console errors
- [x] All 3 API calls return 200 OK
- [x] Numbers match database values
- [x] Page loads within 1-2 seconds
- [x] No infinite loading or crashes

---

## 📱 Additional Tests (Optional)

### **Test on Different Screen Sizes:**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

### **Test Dark Mode:**
- Toggle dark mode switch
- Verify cards are readable
- Verify numbers display correctly

### **Test Other Marketers:**
- Login as different marketer
- Verify their data shows correctly
- Ensure no data leakage between users

---

## 🎯 Expected User Experience

### **Loading Sequence:**

1. **Initial Load (0-100ms):**
   - Page renders with default values (zeros)
   
2. **User Data Loads (100-200ms):**
   - Verification status updates
   
3. **API Calls Complete (200-500ms):**
   - Stock Pickups updates to 13
   - Total Orders updates to 5
   - Wallet Balance updates to ₦34,000

4. **Final State (500ms+):**
   - All metrics showing real data
   - Page fully interactive

---

## 🚀 Performance Check

**Load Time:**
- Initial render: < 100ms
- API calls: < 500ms
- Total: < 600ms

**If slower:**
- Check network speed
- Check backend response time
- Check database query performance

---

**Happy Testing! 🎉**
