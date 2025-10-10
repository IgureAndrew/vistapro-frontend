# 🔍 Marketer Overview - Issues Review

## 📊 CURRENT STATUS

### **What's Working:** ✅
- ✅ **Total Orders:** Showing **5** (CORRECT!)
- ✅ **Wallet Balance:** Showing **₦34,000** (CORRECT!)

### **What's NOT Working:** ❌
- ❌ **Stock Pickups:** Showing **0** (should be **13**)
- ❌ **Recent Activity:** Showing "No Recent Activity" (should show 25+ activities)

---

## ❌ ISSUE #1: STOCK PICKUPS SHOWING 0

### **Root Cause:**
**WRONG API ENDPOINT!**

**File:** `frontend/src/components/MarketerOverview.jsx` (Line 106)

**Current Code:**
```javascript
const { data: stockData } = await api.get("/stock/marketer-history", {
  headers: { Authorization: `Bearer ${token}` },
});
```

**Problem:**
- Endpoint `/api/stock/marketer-history` **DOES NOT EXIST** ❌
- The correct endpoint is `/api/stock/marketer` ✅

---

### **Backend Routes Check:**

**File:** `backend/src/routes/stockupdateRoutes.js` (Lines 73-79)

```javascript
// 9) List your own pickups
router.get(
  '/marketer',                    // ← CORRECT PATH
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.getMarketerStockUpdates    // ← Controller function
);
```

**Registered as:** `GET /api/stock/marketer`

---

### **Controller Function:**

**File:** `backend/src/controllers/stockupdateController.js`

The `getMarketerStockUpdates` function returns:
```javascript
{
  data: [
    { id, product_id, quantity, status, ... },
    ...
  ]
}
```

---

### **What Needs to Change:**

**File:** `frontend/src/components/MarketerOverview.jsx`

**Line 106 - CHANGE FROM:**
```javascript
const { data: stockData } = await api.get("/stock/marketer-history", {
```

**Line 106 - CHANGE TO:**
```javascript
const { data: stockData } = await api.get("/stock/marketer", {
```

**Line 110 - CHANGE FROM:**
```javascript
const pickups = stockData.history || [];
```

**Line 110 - CHANGE TO:**
```javascript
const pickups = stockData.data || [];
```

---

## ❌ ISSUE #2: RECENT ACTIVITY NOT SHOWING

### **Root Cause:**
**HARDCODED EMPTY ARRAY!**

**File:** `frontend/src/components/MarketerOverview.jsx` (Line 198)

**Current Code:**
```javascript
// TODO: Replace with real API call to fetch recent activities
const recentActivities = [];
```

**Problem:**
- `recentActivities` is hardcoded as empty array
- Never fetches from API
- Always shows "No Recent Activity" message

---

### **Database Has 25+ Activity Records:**

1. **Stock Updates:** 13 records
   - Latest: Product 76, sold (Sep 25, 2025)
   - Status: sold, expired, returned, etc.

2. **Orders:** 5 records
   - Latest: lekan, ₦110,000 (Sep 25, 2025)
   - Status: released_confirmed, cancelled

3. **Notifications:** 10 records
   - Latest: "Extra-pickup request rejected" (Jun 3, 2025)
   - Various pickup and status notifications

---

### **What Needs to Change:**

#### **Option 1: Combine Multiple Sources**

Fetch from multiple endpoints and combine:
```javascript
const [recentActivities, setRecentActivities] = useState([]);

useEffect(() => {
  const loadRecentActivity = async () => {
    try {
      const token = localStorage.getItem("token");
      const activities = [];

      // 1. Get recent stock updates
      const { data: stockData } = await api.get("/stock/marketer", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stockActivities = (stockData.data || []).slice(0, 5).map(item => ({
        id: `stock-${item.id}`,
        type: 'stock',
        title: `Stock ${item.status}`,
        description: `Product #${item.product_id} - ${item.status}`,
        timestamp: item.updated_at,
        status: item.status
      }));
      activities.push(...stockActivities);

      // 2. Get recent orders
      const { data: orderData } = await api.get("/marketer/orders/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderActivities = (orderData.orders || []).slice(0, 5).map(order => ({
        id: `order-${order.id}`,
        type: 'order',
        title: 'Order placed',
        description: `${order.customer_name} - ${new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(order.sold_amount)}`,
        timestamp: order.created_at,
        status: order.status
      }));
      activities.push(...orderActivities);

      // 3. Get recent notifications
      const { data: notifData } = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifActivities = (notifData.notifications || []).slice(0, 5).map(notif => ({
        id: `notif-${notif.id}`,
        type: 'notification',
        title: 'Notification',
        description: notif.message,
        timestamp: notif.created_at,
        status: notif.is_read ? 'read' : 'unread'
      }));
      activities.push(...notifActivities);

      // Sort by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Take top 10
      setRecentActivities(activities.slice(0, 10));
    } catch (err) {
      console.error("Error loading recent activity:", err);
    }
  };

  loadRecentActivity();
}, []);
```

---

#### **Option 2: Use Existing Data**

Since we already fetch orders and stock pickups, we can combine them:
```javascript
// After fetching orders and stock pickups
const combineRecentActivity = () => {
  const activities = [];
  
  // Add stock activities (from already fetched data)
  if (stockPickups.length > 0) {
    stockPickups.slice(0, 5).forEach(item => {
      activities.push({
        id: `stock-${item.id}`,
        type: 'stock',
        title: `Stock ${item.status}`,
        description: `Product #${item.product_id}`,
        timestamp: item.updated_at,
        status: item.status
      });
    });
  }
  
  // Add order activities (from already fetched data)
  if (orders.length > 0) {
    orders.slice(0, 5).forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'Order placed',
        description: order.customer_name,
        timestamp: order.created_at,
        status: order.status
      });
    });
  }
  
  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  setRecentActivities(activities.slice(0, 10));
};
```

---

#### **Option 3: Create Backend Endpoint (Best Long-term)**

Create a dedicated endpoint:
```
GET /api/marketer/recent-activity
```

Returns:
```json
{
  "activities": [
    {
      "id": 1,
      "type": "order",
      "title": "Order placed",
      "description": "lekan - ₦110,000",
      "timestamp": "2025-09-25T20:22:02.176Z",
      "status": "released_confirmed"
    },
    ...
  ]
}
```

---

## 📋 DATABASE VERIFICATION

### **Stock Updates Table:**
```sql
SELECT COUNT(*) FROM stock_updates WHERE marketer_id = 182;
-- Result: 13
```

**Recent records:**
- ID 1330: Product 76, sold (Sep 25, 2025)
- ID 451: Product 32, expired (Jun 12, 2025)
- ID 308: Product 30, sold (May 31, 2025)
- ... 10 more

---

### **Orders Table:**
```sql
SELECT COUNT(*) FROM orders WHERE marketer_id = 182;
-- Result: 5
```

**Recent records:**
- ID 886: lekan, ₦110,000, released_confirmed (Sep 25, 2025)
- ID 695: bayo smith, ₦242,000, released_confirmed (May 31, 2025)
- ... 3 more

---

### **Notifications Table:**
```sql
SELECT COUNT(*) FROM notifications WHERE user_unique_id = 'DSR00093';
-- Result: 10
```

**Recent records:**
- ID 602: "Extra-pickup request rejected" (Jun 3, 2025)
- ID 282: "Stock pickup #90 returned" (May 27, 2025)
- ... 8 more

---

## 🎯 RECOMMENDED FIX

### **Priority 1: Fix Stock Pickups (CRITICAL)**

**Changes needed in:** `frontend/src/components/MarketerOverview.jsx`

1. **Line 106:** Change endpoint from `/stock/marketer-history` to `/stock/marketer`
2. **Line 110:** Change `stockData.history` to `stockData.data`

**Impact:** Stock Pickups will show **13** instead of **0**

---

### **Priority 2: Fix Recent Activity (IMPORTANT)**

**Recommended:** **Option 2** (Use existing data)

**Why:**
- ✅ No additional API calls
- ✅ Uses data already fetched
- ✅ Fast implementation
- ✅ No backend changes needed

**Changes needed in:** `frontend/src/components/MarketerOverview.jsx`

1. **Line 198:** Change from `const recentActivities = [];` to `const [recentActivities, setRecentActivities] = useState([]);`
2. **Add helper function** to combine orders and stock pickups into activities
3. **Call helper function** after data is loaded

**Impact:** Recent Activity section will show real activities from orders and stock pickups

---

## 📊 EXPECTED RESULTS AFTER FIX

### **Stock Pickups Card:**
```
BEFORE: 0 ❌
AFTER:  13 ✅
```

### **Recent Activity Section:**
```
BEFORE:
┌────────────────────────────────┐
│ No Recent Activity             │
│ Your recent activities will... │
└────────────────────────────────┘

AFTER:
┌────────────────────────────────┐
│ 📦 Stock sold                  │
│ Product #76                    │
│ Sep 25, 2025                   │
├────────────────────────────────┤
│ 🛒 Order placed                │
│ lekan - ₦110,000               │
│ Sep 25, 2025                   │
├────────────────────────────────┤
│ 📦 Stock sold                  │
│ Product #30                    │
│ May 31, 2025                   │
├────────────────────────────────┤
│ 🛒 Order placed                │
│ bayo smith - ₦242,000          │
│ May 31, 2025                   │
└────────────────────────────────┘
```

---

## ✅ SUMMARY

### **Issues Found:**

1. ❌ **Stock Pickups showing 0**
   - **Cause:** Wrong API endpoint (`/stock/marketer-history` doesn't exist)
   - **Fix:** Change to `/stock/marketer` and `data` instead of `history`
   - **Impact:** Will show 13 pickups

2. ❌ **Recent Activity not showing**
   - **Cause:** Hardcoded empty array, never fetches from API
   - **Fix:** Use existing fetched data (orders + stock pickups) to populate
   - **Impact:** Will show 10+ recent activities

### **Database Verification:**
- ✅ Stock Updates: 13 records exist
- ✅ Orders: 5 records exist  
- ✅ Notifications: 10 records exist
- ✅ Total Activity Items: 25+ available

### **Recommended Approach:**
1. **Fix stock pickups endpoint** (2 line changes)
2. **Use existing data for recent activity** (Option 2 - simple, no extra API calls)

---

**Ready to implement these fixes?**
