# توثيق API - نظام إدارة الشكاوى البلدية 📚

## نظرة عامة

هذا التوثيق يغطي جميع نقاط النهاية (Endpoints) المتاحة في نظام إدارة الشكاوى البلدية.

**Base URL:** `http://localhost:3001/api`

---

## المصادقة 🔐

### تسجيل دخول الموظف/الإدارة

```http
POST /auth/login
```

**Body:**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "fullName": "اسم المستخدم",
    "role": "ADMIN"
  }
}
```

### التحقق من المواطن

```http
POST /auth/verify-citizen
```

**Body:**

```json
{
  "phone": "01000000000",
  "nationalId": "12345678901234",
  "fullName": "اسم المواطن"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt_token_here",
  "complainant": {
    "id": "complainant_id",
    "fullName": "اسم المواطن",
    "phone": "01000000000",
    "nationalId": "12345678901234"
  }
}
```

---

## الشكاوى 📝

### جلب الشكاوى

```http
GET /complaints
```

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): NEW, UNDER_REVIEW, IN_PROGRESS, RESOLVED, REJECTED, CLOSED
- `typeId` (optional): ID of complaint type
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "complaints": [
    {
      "id": "complaint_id",
      "title": "عنوان الشكوى",
      "description": "وصف الشكوى",
      "status": "NEW",
      "priority": "MEDIUM",
      "location": "موقع المشكلة",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "type": {
        "name": "نوع الشكوى",
        "icon": "🏚️"
      },
      "complainant": {
        "fullName": "اسم المشتكي",
        "phone": "01000000000"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### تقديم شكوى جديدة

```http
POST /complaints/submit
```

**Body:** (FormData)

```
fullName: اسم المشتكي
phone: 01000000000
nationalId: 12345678901234
email: email@example.com (optional)
typeId: complaint_type_id
title: عنوان الشكوى
description: وصف مفصل للشكوى
location: موقع المشكلة (optional)
files: [File1, File2, ...] (optional, max 5 files)
```

**Response:**

```json
{
  "success": true,
  "complaint": {
    "id": "complaint_id",
    "title": "عنوان الشكوى",
    "status": "NEW"
  },
  "message": "تم تقديم الشكوى بنجاح"
}
```

### تحديث حالة الشكوى

```http
PUT /complaints/:id/status
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "status": "IN_PROGRESS",
  "notes": "ملاحظات التحديث",
  "internalNote": "ملاحظة داخلية (اختياري)"
}
```

**Response:**

```json
{
  "success": true,
  "complaint": {
    "id": "complaint_id",
    "status": "IN_PROGRESS",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "تم تحديث حالة الشكوى بنجاح"
}
```

### تصدير الشكاوى - Excel

```http
GET /complaints/export/excel
```

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): Filter by status
- `typeId` (optional): Filter by type
- `dateFrom` (optional): Start date
- `dateTo` (optional): End date
- `assignedToId` (optional): Filter by assigned employee

**Response:** Excel file download

### تصدير الشكاوى - CSV

```http
GET /complaints/export/csv
```

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:** Same as Excel export

**Response:** CSV file download

---

## المستخدمين 👥

### جلب المستخدمين (Admin only)

```http
GET /users
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "fullName": "اسم المستخدم",
      "role": "EMPLOYEE",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### إنشاء مستخدم جديد (Admin only)

```http
POST /users
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "email": "newuser@example.com",
  "fullName": "اسم المستخدم الجديد",
  "role": "EMPLOYEE",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "newuser@example.com",
    "fullName": "اسم المستخدم الجديد",
    "role": "EMPLOYEE"
  },
  "message": "تم إنشاء المستخدم بنجاح"
}
```

---

## أنواع الشكاوى 🏠

### جلب أنواع الشكاوى

```http
GET /types
```

**Response:**

```json
[
  {
    "id": "type_id",
    "name": "شكوى بناء مخالف",
    "description": "بناء بدون ترخيص أو مخالف للقوانين",
    "icon": "🏚️",
    "isActive": true
  }
]
```

### إنشاء نوع شكوى جديد (Admin only)

```http
POST /types
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "name": "نوع شكوى جديد",
  "description": "وصف النوع",
  "icon": "🔧"
}
```

**Response:**

```json
{
  "success": true,
  "type": {
    "id": "type_id",
    "name": "نوع شكوى جديد",
    "description": "وصف النوع",
    "icon": "🔧"
  },
  "message": "تم إنشاء نوع الشكوى بنجاح"
}
```

### تحديث نوع شكوى (Admin only)

```http
PATCH /types/:id
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "name": "اسم محدث",
  "description": "وصف محدث",
  "icon": "🆕",
  "isActive": false
}
```

### حذف نوع شكوى (Admin only)

```http
DELETE /types/:id
```

**Headers:**

```
Authorization: Bearer <token>
```

---

## الإشعارات 🔔

### جلب الإشعارات

```http
GET /notifications
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "notifications": [
    {
      "id": "notification_id",
      "type": "status_update",
      "title": "تحديث حالة الشكوى",
      "message": "تم تحديث حالة الشكوى إلى قيد التنفيذ",
      "complaintId": "complaint_id",
      "complaintTitle": "عنوان الشكوى",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "read": false
    }
  ]
}
```

### تحديد إشعار كمقروء

```http
PUT /notifications/:id/read
```

**Headers:**

```
Authorization: Bearer <token>
```

### تحديد جميع الإشعارات كمقروءة

```http
PUT /notifications/read-all
```

**Headers:**

```
Authorization: Bearer <token>
```

---

## الإحصائيات 📊

### إحصائيات الإدارة

```http
GET /stats
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "totalComplaints": 150,
  "newComplaints": 25,
  "inProgressComplaints": 45,
  "resolvedComplaints": 80,
  "totalUsers": 10,
  "activeUsers": 8,
  "complaintsByType": [
    {
      "type": "شكوى بناء مخالف",
      "count": 30
    }
  ],
  "complaintsByStatus": [
    {
      "status": "جديدة",
      "count": 25
    }
  ],
  "overdueComplaints": 5,
  "avgResolutionTime": 3.5
}
```

---

## الإعدادات ⚙️

### جلب إعدادات النظام (Admin only)

```http
GET /settings
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "email": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "admin@example.com",
    "isConfigured": true
  },
  "system": {
    "siteName": "نظام الشكاوى البلدية",
    "maxFileSize": "10MB",
    "maxFilesPerComplaint": 5,
    "allowedFileTypes": ["image/jpeg", "image/png", "application/pdf"],
    "autoAssignment": false,
    "emailNotifications": true
  },
  "adminEmails": ["admin1@example.com", "admin2@example.com"]
}
```

### تحديث إعدادات البريد الإلكتروني (Admin only)

```http
PATCH /settings/email
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "admin@example.com",
  "password": "app_password"
}
```

### اختبار إعدادات البريد الإلكتروني (Admin only)

```http
POST /settings/email/test
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "testEmail": "test@example.com"
}
```

---

## رموز الحالة 📋

### حالات الشكاوى

- `NEW` - جديدة
- `UNDER_REVIEW` - قيد المراجعة
- `IN_PROGRESS` - قيد التنفيذ
- `RESOLVED` - تم الحل
- `REJECTED` - مرفوضة
- `CLOSED` - مغلقة

### الأولويات

- `LOW` - منخفضة
- `MEDIUM` - متوسطة
- `HIGH` - عالية

### الأدوار

- `CITIZEN` - مواطن
- `EMPLOYEE` - موظف
- `ADMIN` - إدارة

### أنواع الإشعارات

- `status_update` - تحديث حالة
- `new_message` - رسالة جديدة
- `resolved` - تم الحل
- `reminder` - تذكير

---

## رموز الخطأ 🚨

### رموز الحالة الشائعة

- `200` - نجح الطلب
- `201` - تم الإنشاء بنجاح
- `400` - بيانات غير صالحة
- `401` - غير مصرح
- `403` - ممنوع
- `404` - غير موجود
- `500` - خطأ في الخادم

### أمثلة على رسائل الخطأ

```json
{
  "error": "بيانات غير صالحة",
  "details": [
    {
      "field": "email",
      "message": "البريد الإلكتروني غير صالح"
    }
  ]
}
```

---

## المصادقة والأمان 🔒

### Headers المطلوبة

جميع الطلبات (ما عدا تسجيل الدخول) تتطلب:

```
Authorization: Bearer <jwt_token>
```

### صلاحيات الأدوار

- **CITIZEN:** الوصول لشكاواهم فقط
- **EMPLOYEE:** الوصول للشكاوى المخصصة لهم
- **ADMIN:** الوصول الكامل للنظام

### Rate Limiting

- 100 طلب لكل IP في 15 دقيقة

---

## أمثلة الاستخدام 💡

### مثال: تقديم شكوى جديدة

```javascript
const formData = new FormData();
formData.append("fullName", "أحمد محمد");
formData.append("phone", "01000000000");
formData.append("nationalId", "12345678901234");
formData.append("typeId", "type_id");
formData.append("title", "مشكلة في الطريق");
formData.append("description", "وصف المشكلة...");

const response = await fetch("/api/complaints/submit", {
  method: "POST",
  body: formData,
});
```

### مثال: جلب الشكاوى مع الفلترة

```javascript
const token = localStorage.getItem("authToken");
const response = await fetch("/api/complaints?status=NEW&page=1&limit=10", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

**ملاحظة:** جميع التواريخ في التنسيق ISO 8601، وجميع النصوص باللغة العربية.

**مجلس مدينة أبوتيج** - خدمة المواطنين أولوية 🏛️
