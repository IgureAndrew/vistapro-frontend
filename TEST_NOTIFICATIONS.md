# 🧪 Testing Guide - Notification System

## 🎯 Quick Test Steps

### **Test User:**
- **Username:** leo smith
- **Email:** leo@gmail.com
- **Password:** (your password)
- **Expected notifications:** 9 unread (10 total)

---

## ✅ Test Checklist

### **1. Login and Initial State**
- [ ] Login as leo smith (leo@gmail.com)
- [ ] Dashboard loads successfully
- [ ] Look at top right header area

**Expected:**
- ✅ Bell icon visible
- ✅ Red badge shows number "9"
- ✅ Badge has red background

**Screenshot Comparison:**
```
BEFORE: 🔔 (no badge)
AFTER:  🔔(9) (red badge with count)
```

---

### **2. Open Notifications Dropdown**
- [ ] Click the bell icon

**Expected:**
- ✅ Dropdown panel opens below bell
- ✅ Header shows "Notifications" with "9 new" badge
- ✅ List shows 10 notifications
- ✅ 9 notifications have blue background (unread)
- ✅ 1 notification has white/gray background (read)

**Notifications to look for:**
1. "Your extra-pickup request has been rejected..." ← Jun 3
2. "Your stock pickup #90 has been returned..." ← May 27
3. "Your stock pickup #93 has been returned..." ← May 27
4. "Your stock pickup #94 has been returned..." ← May 27
5. "Your stock pickup #85 has been returned..." ← May 27
6. "Your stock pickup #84 has been returned..." ← May 27
7. "Your stock pickup #83 has been returned..." ← May 27
8. "Your extra-pickup request has been approved..." ← May 27
9. "Your stock pickup #61 has been returned..." ← May 26 (READ - white bg)
10. "Your stock pickup #60 has been returned..." ← May 25

---

### **3. Visual Indicators**
- [ ] Check unread notifications (should be first 8 + #10)

**Expected for UNREAD:**
- ✅ Blue/light blue background
- ✅ Blue left border (vertical line)
- ✅ Blue dot on right side
- ✅ Darker, bolder text
- ✅ Timestamp in gray

**Expected for READ (#9):**
- ✅ White/normal background
- ✅ No border
- ✅ No blue dot
- ✅ Lighter text color
- ✅ Timestamp in gray

---

### **4. Mark as Read Functionality**
- [ ] Click on an unread notification (e.g., #1 - "extra-pickup request rejected")

**Expected:**
- ✅ Notification immediately changes visual style (loses blue bg, border, dot)
- ✅ Text becomes lighter/grayed
- ✅ Badge count decreases from "9" to "8"
- ✅ Header badge updates to "8 new"
- ✅ No page refresh needed

---

### **5. Close Dropdown**

**Test Method 1: Click bell again**
- [ ] Click the bell icon

**Expected:**
- ✅ Dropdown closes

**Test Method 2: Click outside**
- [ ] Open dropdown again
- [ ] Click anywhere on the page (outside dropdown)

**Expected:**
- ✅ Dropdown closes

---

### **6. Dark Mode**
- [ ] Toggle dark mode switch (moon/sun icon)

**Expected:**
- ✅ Entire dashboard switches to dark mode
- ✅ Bell icon changes color
- [ ] Click bell to open dropdown

**Expected in Dark Mode:**
- ✅ Dropdown has dark background
- ✅ Text is light colored (white/light gray)
- ✅ Unread notifications have dark blue background
- ✅ Borders are visible (dark gray)
- ✅ All text is readable
- ✅ Hover effects work (darker background on hover)

---

### **7. Responsive Design (Optional)**

**Desktop (> 768px):**
- [ ] Dropdown is ~384px wide
- [ ] All notifications visible
- [ ] Proper spacing

**Mobile (< 768px):**
- [ ] Bell icon visible in mobile header
- [ ] Dropdown adapts to screen size
- [ ] Touch-friendly (easy to tap)
- [ ] Scrollable if many notifications

---

### **8. Real-time Updates (Advanced)**

**Option 1: Create notification via backend**
- [ ] Open browser console
- [ ] Keep notifications dropdown open
- [ ] Have someone trigger a new notification for DSR00093
  (e.g., stock pickup, verification update, etc.)

**Expected:**
- ✅ New notification appears at TOP of list immediately
- ✅ Badge count increases (e.g., from 8 to 9)
- ✅ No page refresh needed
- ✅ New notification has unread styling

**Option 2: Use another browser tab**
- [ ] Login in two browser tabs as leo smith
- [ ] In Tab 1: Mark a notification as read
- [ ] In Tab 2: Check if count updates

**Expected:**
- ✅ Socket.io should sync unread count across tabs

---

## 🐛 Common Issues & Solutions

### **Issue 1: Bell has no badge**
**Possible Causes:**
- User has no unread notifications
- Socket.io not connected
- API error

**Solution:**
1. Check browser console for errors
2. Check Network tab for API call to `/api/notifications`
3. Verify user has notifications in database

---

### **Issue 2: Dropdown shows "No notifications yet"**
**Possible Causes:**
- API not returning data
- User unique_id mismatch
- Database has no notifications for this user

**Solution:**
1. Check browser console for API response
2. Check Network tab: Look for `/api/notifications` call
3. Verify response has `notifications` array
4. Run backend check: `node backend/check-user-notifications.js`

---

### **Issue 3: Mark as read doesn't work**
**Possible Causes:**
- API endpoint error
- Network issue
- Token invalid

**Solution:**
1. Check browser console for errors
2. Check Network tab for `PATCH /api/notifications/:id/read` call
3. Verify response is 204 No Content
4. Check token is valid in localStorage

---

### **Issue 4: Dark mode not working**
**Possible Causes:**
- Theme context issue
- CSS classes not applied

**Solution:**
1. Toggle dark mode switch
2. Check browser inspector: `<html>` should have `class="dark"`
3. Check dropdown element has dark mode classes
4. Verify Tailwind CSS is loaded

---

## 🔍 Debug Information

### **Browser Console Logs:**

When NotificationBell loads, you should see:
```
NotificationBell: Received data: {notifications: Array(10), unread: 9}
NotificationBell: Set unread count to: 9
```

### **Network Requests:**

**On component mount:**
- `GET /api/notifications` → 200 OK
- Response: `{notifications: [...], unread: 9}`

**On mark as read:**
- `PATCH /api/notifications/602/read` → 204 No Content

### **Socket.io Connection:**

In browser console, Socket.io should log:
```
Socket.io: Connected
Socket.io: Registered to room: DSR00093
```

---

## ✅ Success Criteria

**All tests pass when:**

1. ✅ Badge shows correct unread count
2. ✅ Dropdown displays all notifications
3. ✅ Unread notifications have visual indicators
4. ✅ Mark as read works immediately
5. ✅ Badge count updates when marking as read
6. ✅ Click outside closes dropdown
7. ✅ Dark mode works correctly
8. ✅ Real-time updates work (optional)
9. ✅ No console errors
10. ✅ Responsive on all screen sizes

---

## 📊 Expected vs Actual

### **Current State Check:**

**Before Fix:**
- Bell icon: 🔔 (no badge)
- Dropdown: "No new notifications"
- Count: 0

**After Fix (Expected):**
- Bell icon: 🔔(9) (red badge)
- Dropdown: List of 10 notifications
- Count: 9 unread, 1 read

**Verify yours matches "After Fix"!**

---

## 🚀 Quick Verification

**1-Minute Test:**
1. Login as leo@gmail.com
2. Look at bell icon → Should have "9" badge ✅
3. Click bell → Should show 10 notifications ✅
4. Click one notification → Badge becomes "8" ✅

**If all 3 steps work → FIX IS SUCCESSFUL! 🎉**

---

## 📞 Need Help?

**Check these files for issues:**

1. `frontend/src/components/NotificationBell.jsx` - Main component
2. `frontend/src/components/UnifiedDashboard.jsx` - Integration
3. `backend/src/controllers/notificationController.js` - API logic
4. `backend/src/routes/notificationRoutes.js` - API routes

**Console commands to verify:**

```bash
# Backend: Check notifications in database
cd backend
node -e "const { pool } = require('./src/config/database'); pool.query('SELECT COUNT(*) FROM notifications WHERE user_unique_id = \\'DSR00093\\'').then(r => console.log(r.rows)).finally(() => process.exit());"

# Frontend: Check if component exists
ls frontend/src/components/NotificationBell.jsx
```

---

**Happy Testing! 🎉**
