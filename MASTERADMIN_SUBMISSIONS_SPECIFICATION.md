# MasterAdmin Submissions Page - Complete Specification

## 🎯 **Purpose**

The MasterAdmin Submissions page is the central hub for the MasterAdmin to:
1. **Review and approve** marketer verification submissions
2. **Review and approve** Admin/SuperAdmin account creation requests
3. **Track the complete workflow** of each submission
4. **View historical data** of all approved and rejected submissions

---

## 📊 **What It Should Display**

### **1. Summary Statistics Cards**
The page should show 6 key metrics:

| Card | Description | Data Source |
|------|-------------|-------------|
| **Total Submissions** | Total number of submissions in the system | `submissions.length` |
| **Pending Approval** | Submissions awaiting MasterAdmin review | Filter by `pending_masteradmin_approval` |
| **Marketer Verifications** | Marketer verification submissions | Filter by `submission_type === 'marketer_verification'` |
| **Admin/SuperAdmin Approvals** | Admin/SuperAdmin account requests | Filter by `submission_type === 'admin_superadmin_approval'` |
| **Approved** | Total approved submissions | Count of `approved` status |
| **Rejected** | Total rejected submissions | Count of `rejected` status |

### **2. Two Main Tabs**

#### **Tab 1: Pending Approval**
- Shows submissions that need MasterAdmin review
- Includes:
  - Marketer verifications at `pending_masteradmin_approval` status
  - Admin/SuperAdmin account requests at `pending_approval` status

#### **Tab 2: History**
- Shows all completed submissions
- Includes:
  - Approved submissions
  - Rejected submissions
  - Filtered by date and status

### **3. Submission List Table**

Each submission should display:

| Column | Description | Data Source |
|--------|-------------|-------------|
| **USER** | User's name, email, and unique ID | `first_name`, `last_name`, `email`, `unique_id` |
| **TYPE** | Type of submission | `submission_type` (Marketer Verification or Admin/SuperAdmin Approval) |
| **ADMIN** | Admin who reviewed (if applicable) | `admin_first_name`, `admin_last_name` |
| **SUPERADMIN** | SuperAdmin who reviewed (if applicable) | `superadmin_first_name`, `superadmin_last_name` |
| **SUBMISSION DATE** | When the submission was created | `created_at` |
| **STATUS** | Current status of the submission | `submission_status` with color-coded badge |
| **ACTIONS** | Action buttons | Review, Timeline, Approve, Reject |

### **4. Filtering and Search**

- **Search Bar**: Search by user name, unique ID, or email
- **Status Filter**: Filter by submission status (All, Pending, Approved, Rejected)
- **SuperAdmin Filter**: Filter by SuperAdmin who reviewed
- **Show All Submissions Toggle**: Show submissions at all stages (not just pending MasterAdmin approval)

---

## 🔄 **Data Flow**

### **Backend Endpoint:**
```
GET /api/verification/submissions/master
```

### **Expected Response:**
```json
{
  "success": true,
  "submissions": [
    {
      // Marketer Verification Submission
      "submission_id": 1,
      "submission_type": "marketer_verification",
      "submission_status": "pending_masteradmin_approval",
      "marketer_id": 471,
      "marketer_unique_id": "DSR00336",
      "marketer_first_name": "Bayo",
      "marketer_last_name": "Lawal",
      "marketer_email": "lawal@gmail.com",
      "admin_id": 184,
      "admin_first_name": "Andrei",
      "admin_last_name": "Igurrr",
      "admin_email": "andrei@gmail.com",
      "super_admin_id": 232,
      "superadmin_first_name": "Andu",
      "superadmin_last_name": "Eagle",
      "superadmin_email": "andu@gmail.com",
      "created_at": "2025-10-07T10:54:26.943Z",
      "updated_at": "2025-10-08T19:34:34.357Z",
      "biodata": { /* biodata form data */ },
      "guarantor": { /* guarantor form data */ },
      "commitment": { /* commitment form data */ }
    },
    {
      // Admin/SuperAdmin Approval Submission
      "user_id": 123,
      "user_unique_id": "ADM001",
      "submission_type": "admin_superadmin_approval",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "role": "Admin",
      "overall_verification_status": "pending_approval",
      "created_at": "2025-10-17T12:00:00.000Z",
      "updated_at": "2025-10-17T12:00:00.000Z"
    }
  ],
  "total": 5,
  "marketer_verifications": 4,
  "admin_superadmin_approvals": 1
}
```

---

## 🎨 **Status Badges**

Each status should have a color-coded badge:

| Status | Badge Color | Icon | Description |
|--------|-------------|------|-------------|
| `pending_marketer_forms` | 🟡 Yellow | Clock | Marketer is filling out forms |
| `pending_admin_review` | 🔵 Blue | Clock | Waiting for Admin review |
| `pending_superadmin_review` | 🟣 Purple | Clock | Waiting for SuperAdmin review |
| `pending_masteradmin_approval` | 🟣 Purple | Clock | **Waiting for YOU (MasterAdmin)** |
| `superadmin_verified` | 🟢 Green | CheckCircle | SuperAdmin approved, ready for MasterAdmin |
| `approved` | 🟢 Green | ThumbsUp | Approved by MasterAdmin |
| `rejected` | 🔴 Red | ThumbsDown | Rejected by MasterAdmin |

---

## 🔧 **Key Features**

### **1. Review Modal**
When clicking "Review" on a submission:
- Show all form details (biodata, guarantor, commitment)
- Show admin and superadmin review notes
- Show submission timeline
- Allow MasterAdmin to:
  - ✅ Approve the submission
  - ❌ Reject the submission
  - 📝 Add approval/rejection notes

### **2. Timeline Feature**
When clicking "Timeline" on a submission:
- Show complete journey from creation to approval/rejection
- Display timestamps for each stage:
  - Form submission
  - Admin review
  - SuperAdmin review
  - MasterAdmin approval/rejection
- Show notes from each reviewer

### **3. Filtering**
- **Show All Submissions**: Toggle to show submissions at all stages (not just pending MasterAdmin approval)
- **Status Filter**: Filter by specific status
- **Search**: Search by name, email, or unique ID
- **SuperAdmin Filter**: Filter by SuperAdmin who reviewed

### **4. Bulk Actions**
- Select multiple submissions
- Approve/reject multiple submissions at once
- Export submission data

---

## 📋 **Current Issues and Fixes**

### **Issue 1: "Undefined Undefined" Display**
**Problem:** User names showing as "undefined undefined"

**Root Cause:** API endpoint was changed to KYC tracking endpoint which only returns marketer submissions with different field names

**Fix:** Reverted to original `/api/verification/submissions/master` endpoint

**Status:** ✅ FIXED

### **Issue 2: "No Submissions Found"**
**Problem:** Dashboard showing "No pending submissions found" despite having submissions

**Root Cause:** The "Show Only Pending MasterAdmin" toggle is active, which filters out submissions that are not at `pending_masteradmin_approval` status

**Fix:** 
1. Click "Show All Submissions" button to see all submissions
2. Or wait for submissions to reach `pending_masteradmin_approval` status

**Status:** ✅ WORKING AS DESIGNED

### **Issue 3: Database Columns Missing**
**Problem:** KYC tracking columns not in production database

**Fix:** Added tracking columns to `verification_submissions` table

**Status:** ✅ FIXED

### **Issue 4: Database Pool Import Error**
**Problem:** `TypeError: pool.query is not a function`

**Root Cause:** Incorrect import statement in `kycTrackingController.js`

**Fix:** Changed `const pool = require('../config/database')` to `const { pool } = require('../config/database')`

**Status:** ✅ FIXED

---

## 🎯 **What Should Be Visible Now**

### **Current Submissions (as of now):**

| Submission | Type | Status | Where It Should Appear |
|------------|------|--------|------------------------|
| Bayo Lawal (DSR00336) | Marketer Verification | `approved` | History tab |
| OLUWATOBI ODUNADE (DSR00344) | Marketer Verification | `pending_admin_review` | Pending tab (with "Show All Submissions") |
| Olaopa Feranmi (DSR00346) | Marketer Verification | `pending_admin_review` | Pending tab (with "Show All Submissions") |
| KABIR ADEMOLA OLORODE (DSR00351) | Marketer Verification | `pending_admin_review` | Pending tab (with "Show All Submissions") |
| Isiaka Afeez Oluwaferanmi (DSR00350) | Marketer Verification | `pending_marketer_forms` | Pending tab (with "Show All Submissions") |

---

## 🚀 **How to Use the Page**

### **Step 1: View All Submissions**
1. Navigate to MasterAdmin Dashboard
2. Click on "Submissions" in the sidebar
3. Click "Show All Submissions" button (it will turn purple)
4. You'll now see all 5 submissions

### **Step 2: View Specific Submission**
1. Find the submission in the list
2. Click "Review" to see full details
3. Click "Timeline" to see the complete journey

### **Step 3: Approve or Reject**
1. Click "Review" on a submission
2. Review all form details
3. Click "Approve" or "Reject"
4. Add notes if needed
5. Confirm the action

### **Step 4: View History**
1. Click "History" tab
2. See all approved and rejected submissions
3. Filter by status or date

---

## 📊 **Expected Behavior**

### **When Submissions Reach MasterAdmin:**
1. Submissions will automatically appear in "Pending Approval" tab
2. You'll see a notification badge
3. Status will be `pending_masteradmin_approval`
4. You can review and approve/reject

### **Current Status:**
- 3 submissions are at `pending_admin_review` (waiting for Admin)
- 1 submission is at `pending_marketer_forms` (waiting for marketer)
- 1 submission is `approved` (in history)

### **Next Steps:**
1. Admin needs to review the 3 submissions
2. Admin needs to submit them to SuperAdmin
3. SuperAdmin needs to review them
4. SuperAdmin needs to submit them to MasterAdmin
5. **Then they'll appear in your "Pending Approval" tab**

---

## ✅ **Verification Checklist**

- [ ] Summary cards show correct counts
- [ ] "Pending Approval" tab shows submissions awaiting MasterAdmin review
- [ ] "History" tab shows approved and rejected submissions
- [ ] Search bar filters submissions correctly
- [ ] Status filter works correctly
- [ ] "Show All Submissions" toggle works correctly
- [ ] Review modal displays all form details
- [ ] Timeline modal shows complete journey
- [ ] Approve/Reject actions work correctly
- [ ] Status badges display correctly
- [ ] No "undefined" values displayed

---

## 🎉 **Summary**

The MasterAdmin Submissions page is designed to:
- ✅ Show all submissions at every stage
- ✅ Allow MasterAdmin to review and approve/reject
- ✅ Track the complete workflow
- ✅ Provide detailed timelines
- ✅ Filter and search submissions
- ✅ Display comprehensive statistics

**Current Status:** The page is working correctly. The reason you see "No pending submissions found" is because:
1. The 3 submissions are at `pending_admin_review` (not yet at MasterAdmin stage)
2. The "Show Only Pending MasterAdmin" toggle is active (filters out non-MasterAdmin submissions)

**Solution:** Click "Show All Submissions" to see all submissions regardless of status!

