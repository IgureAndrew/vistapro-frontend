# ✅ Marketer Overview - Fix Plan & Solution

## 📊 CONFIRMED: REAL DATA EXISTS IN DATABASE

### **User:** leo smith (DSR00093, ID: 182)

| Metric | Database | Current Display | Status |
|--------|----------|----------------|--------|
| **Stock Pickups** | **13** | **0** | ❌ BROKEN |
| **Total Orders** | **5** | **0** | ❌ BROKEN |
| **Wallet Balance** | **₦34,000** | **₦0** | ❌ BROKEN |

---

## ✅ BACKEND API ENDPOINTS - CONFIRMED EXIST

I've verified the backend endpoints are already in place:

### **1. Orders**
```javascript
GET /api/marketer/orders/history
```
**Used by:** `MarketersOverview.jsx` (line 63), `Order.jsx` (line 9), `MarketerStockPickup.jsx` (line 169)
**Returns:** `{ orders: [...] }`

---

### **2. Wallet**
```javascript
GET /api/wallets/
```
**Used by:** `Wallet.jsx` (line 64), `MarketersOverview.jsx` (line 79)
**Returns:** `{ wallet: { available_balance, total_balance, ... }, transactions: [...], withdrawals: [...] }`

---

### **3. Stock Pickups**
```javascript
GET /api/stock/marketer-history
```
**Used by:** `MarketerStockHistory.jsx` (line 34)
**Returns:** `{ history: [...] }`

**OR**

```javascript
GET /api/stock/pickup/current
```
**Used by:** `MarketerStockPickup.jsx` (line 163)
**Returns:** `{ data: [...] }`

---

## ❌ THE PROBLEM

### **File:** `frontend/src/components/MarketerOverview.jsx`

**Current Code:**
```javascript
// Line 29-38: Hardcoded zeros
const [stats, setStats] = useState({
  verificationStatus: "pending",
  totalPickups: 0,           // ← HARDCODED
  totalOrders: 0,            // ← HARDCODED
  walletBalance: 0,          // ← HARDCODED
  pendingOrders: 0,
  completedOrders: 0,
  monthlyEarnings: 0,
  weeklyEarnings: 0
});

// Line 40-54: Only fetches user from localStorage
useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setStats(prev => ({
      ...prev,
      verificationStatus: parsedUser.overall_verification_status || "pending"
      // ❌ NO API CALLS FOR REAL DATA!
    }));
  }
}, []);
```

**What's Missing:**
- ❌ No API call to fetch orders
- ❌ No API call to fetch wallet balance
- ❌ No API call to fetch stock pickups

---

## ✅ THE SOLUTION

### **Add API Calls to MarketerOverview.jsx**

I'll follow the **exact same pattern** used in `MarketersOverview.jsx` (which works correctly):

```javascript
// Line 63-89 in MarketersOverview.jsx (WORKING CODE)
useEffect(() => {
  (async () => {
    try {
      const token = localStorage.getItem("token");
      
      // 1. Fetch orders history
      const { data: orderData } = await api.get("/marketer/orders/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetched = orderData.orders || [];
      setOrders(fetched);

      // 2. Derive stats from orders
      const derived = fetched.reduce((acc, o) => {
        acc.totalOrders++;
        acc.totalSales += Number(o.sold_amount) || 0;
        if (o.status === "pending") acc.pendingOrders++;
        return acc;
      }, { totalOrders: 0, totalSales: 0, pendingOrders: 0 });
      setStats({ ...derived, wallet: 0 });

      // 3. Fetch wallet balance
      const { data: walletData } = await api.get("/wallets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(prev => ({
        ...prev,
        wallet: Number(walletData.wallet.available_balance) || 0,
      }));
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  })();
}, []);
```

---

## 🔧 IMPLEMENTATION PLAN

### **Step 1: Add API Import**
```javascript
// At top of file
import api from "../api";
```

---

### **Step 2: Replace `useEffect` Hook**

**Current (line 40-54):**
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
      }));
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }
}, []);
```

**New (with API calls):**
```javascript
useEffect(() => {
  const loadDashboardData = async () => {
    // 1. Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setStats(prev => ({
          ...prev,
          verificationStatus: parsedUser.overall_verification_status || "pending"
        }));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // 2. Fetch orders from API
    try {
      const token = localStorage.getItem("token");
      
      const { data: orderData } = await api.get("/marketer/orders/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const orders = orderData.orders || [];
      
      // Calculate stats from orders
      const orderStats = orders.reduce((acc, order) => {
        acc.totalOrders++;
        if (order.status === "pending") acc.pendingOrders++;
        if (order.status === "completed" || order.status === "released_confirmed") {
          acc.completedOrders++;
        }
        return acc;
      }, { totalOrders: 0, pendingOrders: 0, completedOrders: 0 });
      
      setStats(prev => ({
        ...prev,
        ...orderStats
      }));
    } catch (err) {
      console.error("Error loading orders:", err);
    }

    // 3. Fetch wallet balance from API
    try {
      const token = localStorage.getItem("token");
      
      const { data: walletData } = await api.get("/wallets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setStats(prev => ({
        ...prev,
        walletBalance: Number(walletData.wallet?.available_balance) || 0
      }));
    } catch (err) {
      console.error("Error loading wallet:", err);
    }

    // 4. Fetch stock pickups from API
    try {
      const token = localStorage.getItem("token");
      
      const { data: stockData } = await api.get("/stock/marketer-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const pickups = stockData.history || [];
      
      setStats(prev => ({
        ...prev,
        totalPickups: pickups.length
      }));
    } catch (err) {
      console.error("Error loading stock pickups:", err);
    }
  };

  loadDashboardData();
}, []);
```

---

## 📋 EXPECTED RESULTS AFTER FIX

### **Stock Pickups Card:**
```
┌─────────────────────────┐
│ 📦 Stock Pickups        │
│ 13                      │  ← From `/api/stock/marketer-history`
│ Total pickups this month│
└─────────────────────────┘
```

---

### **Total Orders Card:**
```
┌─────────────────────────┐
│ 🛒 Total Orders         │
│ 5                       │  ← From `/api/marketer/orders/history`
│ Orders placed this month│
└─────────────────────────┘
```

---

### **Wallet Balance Card:**
```
┌─────────────────────────┐
│ 💰 Wallet Balance       │
│ ₦34,000                 │  ← From `/api/wallets`
│ Available balance       │
└─────────────────────────┘
```

---

## 🧪 TESTING CHECKLIST

After implementation:

- [ ] **Login as leo smith** (leo@gmail.com)
- [ ] **Check Stock Pickups card** → Should show **13**
- [ ] **Check Total Orders card** → Should show **5**
- [ ] **Check Wallet Balance card** → Should show **₦34,000**
- [ ] **Check browser console** → No errors
- [ ] **Test with other marketers** → Verify their data shows correctly
- [ ] **Test when API fails** → Ensure graceful error handling

---

## 📊 DATABASE REFERENCE

### **For User DSR00093 (ID: 182):**

**stock_updates table:**
```sql
SELECT COUNT(*) FROM stock_updates WHERE marketer_id = 182;
-- Result: 13 pickups
```

**orders table:**
```sql
SELECT COUNT(*), SUM(sold_amount) FROM orders WHERE marketer_id = 182;
-- Result: 5 orders, ₦930,000 total
```

**wallets table:**
```sql
SELECT * FROM wallets WHERE user_unique_id = 'DSR00093';
-- Result: available_balance = 34000
```

---

## 🔍 CODE COMPARISON

### **Working Component: MarketersOverview.jsx**
✅ Fetches orders from API (line 63)
✅ Fetches wallet from API (line 79)
✅ Calculates stats from real data (line 70-75)
✅ Updates state with API results (line 76, 82-85)

### **Broken Component: MarketerOverview.jsx**
❌ No API calls for orders
❌ No API calls for wallet
❌ No API calls for stock pickups
❌ Uses hardcoded zeros (line 29-38)

---

## ✅ SUMMARY

### **Issue:**
MarketerOverview displays zeros for all metrics despite real data existing in database.

### **Root Cause:**
Component never fetches data from API; only reads user from localStorage.

### **Solution:**
Add API calls to fetch orders, wallet, and stock pickups using existing backend endpoints.

### **Pattern to Follow:**
Copy the data-fetching logic from `MarketersOverview.jsx` which already works correctly.

### **Backend Endpoints to Use:**
1. `GET /api/marketer/orders/history` → Orders
2. `GET /api/wallets` → Wallet balance
3. `GET /api/stock/marketer-history` → Stock pickups

### **Files to Modify:**
- `frontend/src/components/MarketerOverview.jsx` (ONLY this file)

### **Lines to Change:**
- Add `import api from "../api";` at top
- Replace `useEffect` hook (lines 40-54) with new implementation

---

**Ready to implement? This will fix all three metrics (Stock Pickups, Orders, Wallet Balance) to show real data from the database!** 🚀
