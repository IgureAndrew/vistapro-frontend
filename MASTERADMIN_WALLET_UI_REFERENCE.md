# MasterAdmin Wallet - UI Reference Guide

## 🔐 ACCESS CODE SCREEN

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ┌──────────┐                        │
│                    │  [💰]   │                        │
│                    └──────────┘                        │
│                                                         │
│              Master Admin Wallet                        │
│           Enter access code to continue                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Access Code                                      │  │
│  │ [••••••••••••••••••••••••••••••]                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         [✓] Unlock Wallet                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Access Code**: `2r?dbA534GwN`

---

## 📊 OVERVIEW TAB LAYOUT

### **1. PENDING CASHOUT REQUESTS** (5 per page)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Pending Cashout Requests (12 total)                          Page 1/3  │
├──────────┬─────────────┬───────────┬────────────┬─────────┬────────────┤
│   ID     │    User     │  Amount   │    Date    │ Status  │  Actions   │
├──────────┼─────────────┼───────────┼────────────┼─────────┼────────────┤
│ DSR001   │ Leo Joseph  │ ₦50,000   │ 01 Oct 25  │ pending │ [✓] [✗]   │
│ DSR002   │ Jane Doe    │ ₦30,000   │ 30 Sep 25  │ pending │ [✓] [✗]   │
│ DSR003   │ John Smith  │ ₦45,000   │ 29 Sep 25  │ pending │ [✓] [✗]   │
│ DSR004   │ Mary Jones  │ ₦60,000   │ 28 Sep 25  │ pending │ [✓] [✗]   │
│ DSR005   │ Bob Wilson  │ ₦35,000   │ 27 Sep 25  │ pending │ [✓] [✗]   │
└──────────┴─────────────┴───────────┴────────────┴─────────┴────────────┘
                    [Previous] [1] [2] [3] [Next]
```

**Features:**
- ✅ Green approve button with CheckCircle icon
- ❌ Red reject button with XCircle icon
- 📱 User name is clickable (UserSummaryPopover)
- 🔢 Total count in header
- 📄 Pagination: 5 items per page
- ⚠️ Confirmation dialog on click

---

### **2. PENDING WITHHELD RELEASES** (All shown)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pending Withheld Releases (5 total)                                │
├──────────┬─────────────┬────────────┬─────────────────┬────────────┤
│   ID     │    User     │  Amount    │     Reason      │  Actions   │
├──────────┼─────────────┼────────────┼─────────────────┼────────────┤
│ DSR001   │ Leo Joseph  │ ₦15,000    │ Manual Request  │ [✓] [✗]   │
│ DSR006   │ Alex Brown  │ ₦20,000    │ Manual Request  │ [✓] [✗]   │
│ DSR012   │ Sarah White │ ₦10,000    │ Manual Request  │ [✓] [✗]   │
│ DSR018   │ Mike Green  │ ₦25,000    │ Manual Request  │ [✓] [✗]   │
│ DSR023   │ Emma Davis  │ ₦18,000    │ Manual Request  │ [✓] [✗]   │
└──────────┴─────────────┴────────────┴─────────────────┴────────────┘
```

**Features:**
- 🟠 Orange-colored amounts (highlight withheld status)
- ✅ Green approve button (releases withheld to available)
- ❌ Red reject button (clears withheld balance)
- 📱 User name is clickable (UserSummaryPopover)
- ⚠️ Confirmation dialog shows withheld amount

---

### **3. RELEASE HISTORY (APPROVED & REJECTED)** (10 per page)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  Release History (Approved & Rejected) - Last 50                               │
├──────────┬─────────────┬──────────┬─────────────┬────────────────┬────────────┤
│   ID     │    User     │  Amount  │   Action    │      By        │    Date    │
├──────────┼─────────────┼──────────┼─────────────┼────────────────┼────────────┤
│ DSR003   │ John Smith  │ ₦25,000  │ ✅ Approved │ Andrew Igure   │ 01 Oct 25  │
│ DSR004   │ Mary Jones  │ ₦10,000  │ ❌ Rejected │ Andrew Igure   │ 30 Sep 25  │
│ DSR007   │ Tom Clark   │ ₦40,000  │ ✅ Approved │ Samuel Okon    │ 29 Sep 25  │
│ DSR008   │ Lisa Brown  │ ₦15,000  │ ❌ Rejected │ Andrew Igure   │ 28 Sep 25  │
│ DSR011   │ Paul Davis  │ ₦50,000  │ ✅ Approved │ Samuel Okon    │ 27 Sep 25  │
│ ...      │ ...         │ ...      │ ...         │ ...            │ ...        │
└──────────┴─────────────┴──────────┴─────────────┴────────────────┴────────────┘
                    [Previous] [1] [2] [3] [4] [5] [Next]
```

**Features:**
- 🟢 Green badge for Approved actions
- 🔴 Red badge for Rejected actions
- 👤 **NEW**: Shows MasterAdmin name who approved/rejected
- 📱 User name is clickable (UserSummaryPopover)
- 📄 Pagination: 10 items per page
- 📊 Shows last 50 records

---

## 🎨 VISUAL DESIGN TOKENS

### **Cards**
```css
background: white
border-radius: 12px (rounded-xl)
shadow: sm
border: 1px solid gray-200
```

### **Tables**
```css
header: gray-50 background
rows: hover:bg-gray-50
padding: px-6 py-4
border-bottom: 1px solid gray-200
```

### **Buttons**

**Approve (Green):**
```css
size: sm
variant: outline
text-green-600 hover:text-green-700
hover:bg-green-50
border-green-200
icon: CheckCircle (w-4 h-4)
```

**Reject (Red):**
```css
size: sm
variant: outline
text-red-600 hover:text-red-700
hover:bg-red-50
border-red-200
icon: XCircle (w-4 h-4)
```

### **Badges**

**Pending:**
```css
variant: outline
bg-yellow-50
text-yellow-700
border-yellow-200
```

**Approved:**
```css
variant: default
with CheckCircle icon
```

**Rejected:**
```css
variant: destructive
with XCircle icon
```

---

## 📱 RESPONSIVE BEHAVIOR

### **Desktop (≥768px)**
- Full table width
- All columns visible
- Pagination controls horizontal
- Buttons side-by-side

### **Mobile (<768px)**
- Horizontal scroll for tables
- Pagination controls remain visible
- Touch-friendly button sizes (44px minimum)
- User names wrap if needed

---

## 💬 CONFIRMATION DIALOGS

### **Approve Withdrawal**
```
┌─────────────────────────────────────────────┐
│  Confirm Action                             │
├─────────────────────────────────────────────┤
│                                             │
│  Approve withdrawal of ₦50,000              │
│  for Leo Joseph?                            │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │ Cancel   │  │ Approve  │                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
```

### **Reject Withdrawal**
```
┌─────────────────────────────────────────────┐
│  Confirm Action                             │
├─────────────────────────────────────────────┤
│                                             │
│  Reject withdrawal of ₦50,000               │
│  for Leo Joseph?                            │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │ Cancel   │  │ Reject   │                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
```

### **Release Withheld**
```
┌─────────────────────────────────────────────┐
│  Confirm Action                             │
├─────────────────────────────────────────────┤
│                                             │
│  Release withheld amount of ₦15,000         │
│  for DSR001?                                │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │ Cancel   │  │ Release  │                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
```

---

## 🔄 LOADING STATES

### **Access Code Verification**
```
[🔄 Verifying...]  (Button text during unlock)
```

### **Button During Action**
```
Disabled state (opacity: 0.5, cursor: not-allowed)
```

### **Initial Data Load**
```
Loading… (centered text with muted color)
```

---

## ✅ SUCCESS/ERROR ALERTS

### **Success Messages**
```javascript
alert('Withdrawal approved successfully!')
alert('Withdrawal rejected successfully!')
alert('Withheld amount released successfully!')
alert('Withheld amount rejected successfully!')
```

### **Error Messages**
```javascript
alert('Error: [error message from server]')
setUnlockError('Incorrect access code.')
setUnlockError('Server error. Please try again.')
```

---

## 🎯 USER JOURNEY

1. **Landing** → Access Code Screen
2. **Enter Code** → `2r?dbA534GwN`
3. **Unlock** → Loading indicator
4. **Success** → Overview Tab Loads
5. **View Data** → Scroll through 3 tables
6. **Take Action** → Click Approve/Reject
7. **Confirm** → Dialog appears
8. **Execute** → API call + loading state
9. **Feedback** → Success/error alert
10. **Refresh** → Data reloads automatically

---

## 📊 DATA REFRESH TRIGGERS

| Action | Triggers Refresh |
|--------|-----------------|
| Approve Pending Cashout | ✅ Yes |
| Reject Pending Cashout | ✅ Yes |
| Approve Withheld Release | ✅ Yes |
| Reject Withheld Release | ✅ Yes |
| Page Change (Pagination) | ❌ No (uses cached data) |
| Tab Change | ❌ No (lazy load on first visit) |
| Page Refresh (F5) | ✅ Yes (requires re-unlock) |

---

## 🎨 ICONS USED

| Icon | Component | Usage |
|------|-----------|-------|
| 💰 Wallet | Access Code Screen | Branding |
| ✓ CheckCircle | Approve Buttons | Action Icon |
| ✗ XCircle | Reject Buttons | Action Icon |
| 🕐 Clock | Empty States | No Data Icon |
| ⚠️ AlertCircle | Withheld Empty State | Warning Icon |
| 📜 History | Release History Empty | History Icon |
| 🔄 RefreshCw | Loading States | Spinning Loader |

---

**Design System**: Shadcn/ui + Tailwind CSS  
**Font**: Geist [[memory:6523817]]  
**Currency Format**: Nigerian Naira (₦) with thousand separators  
**Date Format**: `DD MMM YY` (e.g., "01 Oct 25")

