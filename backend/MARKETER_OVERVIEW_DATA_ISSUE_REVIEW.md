# 🔍 Marketer Overview - Real Data Not Showing - REVIEW

## 📊 DATABASE VERIFICATION - REAL DATA EXISTS! ✅

### **User:** leo smith (DSR00093)

| Metric | Database Value | Dashboard Showing | Status |
|--------|---------------|-------------------|--------|
| **Stock Pickups** | **13** | **0** | ❌ WRONG |
| **Total Orders** | **5** | **0** | ❌ WRONG |
| **Wallet Balance** | **₦34,000** | **₦0** | ❌ WRONG |
| **Order Amount** | **₦930,000** | N/A | ❌ NOT SHOWN |

---

## 🗄️ DATABASE DETAILS

### **Stock Pickups (13 total)**
```sql
SELECT * FROM stock_updates WHERE marketer_id = 182
```

**Status Breakdown:**
- ✅ Sold: 3
- 🔄 Returned: 1
- ⏰ Expired: 1
- ...and 8 more

**Recent Pickups:**
1. ID 1330: Product 76, Qty 1, Status: sold (Sep 25, 2025)
2. ID 451: Product 32, Qty 1, Status: expired (Jun 12, 2025)
3. ID 308: Product 30, Qty 0, Status: sold (May 31, 2025)
4. ID 306: Product 30, Qty 0, Status: sold (May 31, 2025)
5. ID 94: Product 39, Qty 1, Status: returned (May 27, 2025)

---

### **Orders (5 total)**
```sql
SELECT * FROM orders WHERE marketer_id = 182
```

**Total Amount:** ₦930,000
**Total Earnings:** ₦0 (no earnings set)

**Recent Orders:**
1. ID 886: lekan, ₦110,000, released_confirmed (Sep 25, 2025)
2. ID 695: bayo smith, ₦242,000, released_confirmed (May 31, 2025)
3. ID 696: bayo smith, ₦242,000, released_confirmed (May 31, 2025)
4. ID 835: bayo lawal, ₦168,000, cancelled (May 25, 2025)
5. ID 836: bayo lawal, ₦168,000, cancelled (May 24, 2025)

---

### **Wallet**
```sql
SELECT * FROM wallets WHERE user_unique_id = 'DSR00093'
```

**Wallet Data:**
- **Total Balance:** ₦40,000
- **Available Balance:** ₦34,000
- **Withheld Balance:** ₦6,000
- **Pending Cashout:** ₦0

---

## ❌ THE PROBLEM

### **File:** `frontend/src/components/MarketerOverview.jsx`

**Line 29-38:** Component initializes stats with hardcoded zeros:
```javascript
const [stats, setStats] = useState({
  verificationStatus: "pending",
  totalPickups: 0,           // ← Hardcoded 0
  totalOrders: 0,            // ← Hardcoded 0
  walletBalance: 0,          // ← Hardcoded 0
  pendingOrders: 0,          // ← Hardcoded 0
  completedOrders: 0,        // ← Hardcoded 0
  monthlyEarnings: 0,        // ← Hardcoded 0
  weeklyEarnings: 0          // ← Hardcoded 0
});
```

**Line 40-54:** `useEffect` hook ONLY fetches user from localStorage:
```javascript
useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setStats(prev => ({
        ...prev,
        verificationStatus: parsedUser.overall_verification_status || "pending"
        // ❌ NO API CALLS TO FETCH:
        // - Stock pickups
        // - Orders
        // - Wallet balance
        // - Earnings
      }));
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }
}, []);
```

**Line 129-130:** Recent activities hardcoded as empty:
```javascript
// TODO: Replace with real API call to fetch recent activities
const recentActivities = [];
```

---

## 🔍 WHAT'S MISSING

### **1. Stock Pickups API Call**
**Missing:**
```javascript
// Should fetch from API
api.get('/stock-updates/my-pickups')
  .then(response => {
    setStats(prev => ({
      ...prev,
      totalPickups: response.data.totalPickups || 0
    }));
  });
```

**Expected API Endpoint:**
- `GET /api/stock-updates/my-pickups`
- `GET /api/stock-updates/marketer` 
- Or similar endpoint

---

### **2. Orders API Call**
**Missing:**
```javascript
// Should fetch from API
api.get('/orders/my-orders')
  .then(response => {
    setStats(prev => ({
      ...prev,
      totalOrders: response.data.total || 0,
      pendingOrders: response.data.pending || 0,
      completedOrders: response.data.completed || 0
    }));
  });
```

**Expected API Endpoint:**
- `GET /api/orders/my-orders`
- `GET /api/orders/marketer`
- Or similar endpoint

---

### **3. Wallet API Call**
**Missing:**
```javascript
// Should fetch from API
api.get('/wallet')
  .then(response => {
    setStats(prev => ({
      ...prev,
      walletBalance: response.data.available_balance || 0
    }));
  });
```

**Expected API Endpoint:**
- `GET /api/wallet`
- `GET /api/wallet/balance`
- Or similar endpoint

---

### **4. Earnings API Call**
**Missing:**
```javascript
// Should fetch from API
api.get('/earnings/summary')
  .then(response => {
    setStats(prev => ({
      ...prev,
      monthlyEarnings: response.data.monthly || 0,
      weeklyEarnings: response.data.weekly || 0
    }));
  });
```

---

### **5. Recent Activities API Call**
**Missing:**
```javascript
// Currently hardcoded as empty array
const recentActivities = [];

// Should be state with API call
const [recentActivities, setRecentActivities] = useState([]);

useEffect(() => {
  api.get('/activities/recent')
    .then(response => {
      setRecentActivities(response.data || []);
    });
}, []);
```

---

## 🔧 BACKEND API ENDPOINTS TO CHECK

Need to verify if these endpoints exist:

### **1. Stock Pickups Endpoint**
```bash
GET /api/stock-updates/marketer
```
**Should return:**
```json
{
  "totalPickups": 13,
  "pendingPickups": 2,
  "completedPickups": 11,
  "pickups": [...]
}
```

---

### **2. Orders Endpoint**
```bash
GET /api/orders/marketer
```
**Should return:**
```json
{
  "total": 5,
  "pending": 0,
  "completed": 3,
  "cancelled": 2,
  "totalAmount": 930000,
  "orders": [...]
}
```

---

### **3. Wallet Endpoint**
```bash
GET /api/wallet
```
**Should return:**
```json
{
  "total_balance": 40000,
  "available_balance": 34000,
  "withheld_balance": 6000,
  "pending_cashout": 0
}
```

---

### **4. Earnings Endpoint**
```bash
GET /api/earnings/summary
```
**Should return:**
```json
{
  "monthly": 0,
  "weekly": 0,
  "total": 0
}
```

---

## 📋 DATABASE TABLE REFERENCE

### **stock_updates Table**
```sql
Columns: id, marketer_id, pickup_date, deadline, quantity, product_id, 
         transfer_to_marketer_id, transfer_requested_at, transfer_approved_at, 
         expiry_notified, status, returned_at, sold_at, updated_at, 
         return_requested_at, expired_at
```

**Key Points:**
- Uses `marketer_id` (integer) not `marketer_unique_id`
- `marketer_id = 182` for DSR00093
- Has 13 records for this user

---

### **orders Table**
```sql
Columns: id, marketer_id, sold_amount, customer_name, customer_phone, 
         customer_address, bnpl_platform, sale_date, status, created_at, 
         updated_at, earnings, confirmed_at, earnings_per_device, confirmed_by, 
         stock_update_id, product_id, number_of_devices, commission_paid, 
         super_admin_id
```

**Key Points:**
- Uses `marketer_id` (integer) not `marketer_unique_id`
- `marketer_id = 182` for DSR00093
- Has 5 records for this user
- Total amount: 930,000

---

### **wallets Table**
```sql
Columns: user_unique_id, total_balance, available_balance, withheld_balance, 
         created_at, updated_at, account_name, account_number, bank_name, 
         pending_cashout
```

**Key Points:**
- Uses `user_unique_id` (text) not `user_id`
- `user_unique_id = 'DSR00093'`
- Available balance: 34,000

---

## 🎯 SOLUTION NEEDED

### **Option 1: Add API Calls to MarketerOverview.jsx**

**Pros:**
- Centralized data fetching in one component
- All data loaded at once

**Cons:**
- Multiple API calls on component mount
- Slower initial load
- Need to ensure API endpoints exist

---

### **Option 2: Create Individual API Calls per Metric**

**Pros:**
- Faster perceived load (metrics appear individually)
- Can show loading states per metric
- More granular error handling

**Cons:**
- More API calls
- More complex state management

---

## 🔍 INVESTIGATION NEEDED

### **Step 1: Check if Backend API Endpoints Exist**

Need to verify:
- [ ] `GET /api/stock-updates/marketer` (or similar)
- [ ] `GET /api/orders/marketer` (or similar)
- [ ] `GET /api/wallet` (or similar)
- [ ] `GET /api/earnings/summary` (or similar)

**How to check:**
```bash
# Search for routes in backend
grep -r "stock-updates" backend/src/routes/
grep -r "wallet" backend/src/routes/
grep -r "orders" backend/src/routes/
grep -r "earnings" backend/src/routes/
```

---

### **Step 2: Check Existing API Integrations**

Need to check other components to see how they fetch data:
- [ ] Check `Wallet.jsx` - how does it fetch wallet data?
- [ ] Check `Order.jsx` - how does it fetch orders?
- [ ] Check `MarketerStockHistory.jsx` - how does it fetch stock pickups?

**Example:**
```bash
grep -r "api.get" frontend/src/components/
```

---

## 📝 EXPECTED BEHAVIOR

### **After Fix:**

**Stock Pickups Card:**
```
┌─────────────────────────┐
│ 📦 Stock Pickups        │
│ 13                      │  ← From database
│ Total pickups this month│
└─────────────────────────┘
```

**Total Orders Card:**
```
┌─────────────────────────┐
│ 🛒 Total Orders         │
│ 5                       │  ← From database
│ Orders placed this month│
└─────────────────────────┘
```

**Wallet Balance Card:**
```
┌─────────────────────────┐
│ 💰 Wallet Balance       │
│ ₦34,000                 │  ← From database
│ Available balance       │
└─────────────────────────┘
```

---

## ✅ SUMMARY

### **Issue:**
MarketerOverview component shows zeros for all metrics even though real data exists in database.

### **Root Cause:**
Component initializes stats with hardcoded zeros and never fetches real data from API.

### **What's in Database:**
- Stock Pickups: 13
- Orders: 5
- Order Amount: ₦930,000
- Wallet Balance: ₦34,000

### **What's Showing:**
- Stock Pickups: 0
- Orders: 0
- Wallet Balance: ₦0

### **Missing:**
- API calls to fetch stock pickups
- API calls to fetch orders
- API calls to fetch wallet balance
- API calls to fetch earnings
- API calls to fetch recent activities

### **Next Steps:**
1. Check if backend API endpoints exist
2. Check how other components fetch data
3. Implement API calls in MarketerOverview
4. Test with real data
5. Add loading states
6. Add error handling

---

**Ready to fix? Let me know if you want me to:**
1. First check if the API endpoints exist
2. Proceed to add the API calls to MarketerOverview
3. Both - check endpoints first, then implement

