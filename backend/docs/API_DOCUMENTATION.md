# Enhanced Verification System - API Documentation

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Verification Endpoints](#verification-endpoints)
3. [Notification Endpoints](#notification-endpoints)
4. [File Upload Endpoints](#file-upload-endpoints)
5. [Dashboard Endpoints](#dashboard-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All API endpoints require authentication via JWT token in the Authorization header.

```http
Authorization: Bearer <jwt_token>
```

### Token Requirements
- **Marketer**: Access to verification forms and progress
- **Admin**: Access to physical verification tools
- **SuperAdmin**: Access to phone verification and team management
- **MasterAdmin**: Access to approval and system management

---

## 🔄 Verification Endpoints

### Get Verification Progress
```http
GET /api/verification/progress/:marketerId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "marketerId": "MKT001",
    "overallStatus": "in_progress",
    "progress": 65,
    "steps": {
      "biodata": {
        "completed": true,
        "timestamp": "2025-01-15T10:30:00Z"
      },
      "guarantor": {
        "completed": true,
        "timestamp": "2025-01-15T11:15:00Z"
      },
      "commitment": {
        "completed": false,
        "timestamp": null
      },
      "physicalVerification": {
        "status": "pending",
        "adminId": "ADM001",
        "scheduledDate": "2025-01-16T14:00:00Z"
      },
      "phoneVerification": {
        "status": "not_started",
        "superAdminId": null
      },
      "masterAdminApproval": {
        "status": "not_started",
        "masterAdminId": null
      }
    }
  }
}
```

### Submit Biodata Form
```http
POST /api/verification/biodata
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State",
  "dateOfBirth": "1990-01-01",
  "nationalId": "123456789",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567891",
    "relationship": "Spouse"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Biodata submitted successfully",
  "data": {
    "formId": "BIO001",
    "submittedAt": "2025-01-15T10:30:00Z"
  }
}
```

### Submit Guarantor Form
```http
POST /api/verification/guarantor
```

**Request Body:**
```json
{
  "guarantorName": "Jane Smith",
  "guarantorPhone": "+1234567892",
  "guarantorAddress": "456 Oak St, City, State",
  "guarantorRelationship": "Friend",
  "guarantorOccupation": "Engineer",
  "guarantorEmployer": "Tech Corp",
  "guarantorSalary": 75000,
  "guarantorIdNumber": "987654321"
}
```

### Submit Commitment Form
```http
POST /api/verification/commitment
```

**Request Body:**
```json
{
  "salesTarget": 100000,
  "commitmentPeriod": 12,
  "expectedStartDate": "2025-02-01",
  "previousExperience": "2 years in sales",
  "motivation": "Career growth and financial stability",
  "agreementAccepted": true
}
```

### Upload Verification Documents
```http
POST /api/verification/upload
```

**Request Body (multipart/form-data):**
```
file: [binary file data]
type: "biodata" | "guarantor" | "commitment" | "physical_verification"
description: "Optional description"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "FILE001",
    "url": "https://res.cloudinary.com/...",
    "uploadedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /api/notifications
```

**Query Parameters:**
- `limit`: Number of notifications to return (default: 20)
- `offset`: Number of notifications to skip (default: 0)
- `type`: Filter by notification type
- `unread`: Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "NOTIF001",
        "type": "verification_status_update",
        "title": "Verification Status Updated",
        "message": "Physical verification completed. Awaiting phone verification.",
        "timestamp": "2025-01-15T10:30:00Z",
        "read": false,
        "priority": "medium"
      }
    ],
    "unreadCount": 3,
    "totalCount": 15
  }
}
```

### Mark Notification as Read
```http
PUT /api/notifications/:notificationId/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read
```http
PUT /api/notifications/read-all
```

---

## 📁 File Upload Endpoints

### Upload Physical Verification Photos
```http
POST /api/verification/physical-verification/upload
```

**Request Body (multipart/form-data):**
```
photos: [array of image files]
locationPhotos: [array of location image files]
verificationForm: [PDF file]
marketerId: "MKT001"
adminId: "ADM001"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "PHYS001",
    "photos": [
      "https://res.cloudinary.com/...",
      "https://res.cloudinary.com/..."
    ],
    "locationPhotos": [
      "https://res.cloudinary.com/..."
    ],
    "verificationForm": "https://res.cloudinary.com/...",
    "uploadedAt": "2025-01-15T10:30:00Z"
  }
}
```

### Get Uploaded Files
```http
GET /api/verification/files/:marketerId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "biodata": [
      {
        "fileId": "FILE001",
        "url": "https://res.cloudinary.com/...",
        "type": "national_id",
        "uploadedAt": "2025-01-15T10:30:00Z"
      }
    ],
    "guarantor": [
      {
        "fileId": "FILE002",
        "url": "https://res.cloudinary.com/...",
        "type": "employment_letter",
        "uploadedAt": "2025-01-15T11:15:00Z"
      }
    ],
    "physicalVerification": [
      {
        "fileId": "FILE003",
        "url": "https://res.cloudinary.com/...",
        "type": "location_photo",
        "uploadedAt": "2025-01-16T14:00:00Z"
      }
    ]
  }
}
```

---

## 🏠 Dashboard Endpoints

### Get Admin Dashboard Summary
```http
GET /api/admin/dashboard-summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "personalSales": 0,
    "personalOrders": 0,
    "assignedMarketers": 15,
    "teamSales": 250000,
    "teamOrders": 45,
    "activeMarketers": 12,
    "pendingPhysicalVerification": 3,
    "completedPhysicalVerification": 8,
    "pendingPhoneVerification": 2
  }
}
```

### Get SuperAdmin Dashboard Summary
```http
GET /api/super-admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignedAdmins": 5,
    "teamSales": 500000,
    "teamOrders": 120,
    "activeTeamMembers": 35,
    "pendingPhoneVerification": 4,
    "completedPhoneVerification": 15,
    "pendingMasterAdminApproval": 2
  }
}
```

### Get Marketer Dashboard Summary
```http
GET /api/marketer/dashboard-summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 25,
    "totalSales": 75000,
    "pendingOrders": 3,
    "wallet": 15000,
    "verificationStatus": "in_progress",
    "verificationProgress": 65
  }
}
```

---

## ❌ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "V001",
    "message": "Verification form incomplete",
    "details": "Missing required field: firstName"
  }
}
```

### Common Error Codes
- **V001**: Verification form incomplete
- **V002**: File upload failed
- **V003**: Permission denied
- **V004**: Network error
- **V005**: Database connection failed
- **V006**: Invalid file format
- **V007**: File size too large
- **V008**: User not found
- **V009**: Verification already completed
- **V010**: Invalid verification status

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

---

## 🚦 Rate Limiting

### Rate Limits
- **General API**: 100 requests per minute per user
- **File Upload**: 10 requests per minute per user
- **Verification Forms**: 5 requests per minute per user
- **Notifications**: 50 requests per minute per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## 🔧 WebSocket Events

### Connection
```javascript
const socket = io('https://api.snippsta.com');

// Listen for verification updates
socket.on('verification_status_update', (data) => {
  console.log('Verification status updated:', data);
});

// Listen for reminders
socket.on('verification_reminder', (data) => {
  console.log('Verification reminder:', data);
});

// Listen for approvals
socket.on('verification_approved', (data) => {
  console.log('Verification approved:', data);
});
```

### Event Data Formats
```json
{
  "userId": "MKT001",
  "status": "physical_verification_completed",
  "timestamp": "2025-01-15T10:30:00Z",
  "message": "Physical verification completed. Awaiting phone verification."
}
```

---

## 📊 Response Pagination

### Paginated Response Format
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Pagination Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (default: created_at)
- `order`: Sort order (asc/desc, default: desc)

---

## 🧪 Testing

### Test Environment
- **Base URL**: `https://api-test.snippsta.com`
- **Authentication**: Use test JWT tokens
- **Database**: Test database with sample data

### Test Data
- **Test Marketer**: `MKT_TEST_001`
- **Test Admin**: `ADM_TEST_001`
- **Test SuperAdmin**: `SUP_TEST_001`
- **Test MasterAdmin**: `MAS_TEST_001`

### Sample Test Request
```bash
curl -X GET \
  https://api-test.snippsta.com/api/verification/progress/MKT_TEST_001 \
  -H "Authorization: Bearer test_jwt_token"
```

---

*Last Updated: January 2025*
*Version: 2.0*
*API Version: v2*
