# دليل تنفيذ نظام إدارة الشكاوى المحسن

## نظرة عامة على النظام الجديد

تم إعادة تصميم النظام بالكامل لحل جميع المشاكل السابقة وتوفير نظام شامل ومحسن.

### المميزات الجديدة:

✅ **نظام مصادقة محسن** مع role-based access control  
✅ **إدارة شكاوى شاملة** مع validation كامل  
✅ **نظام إشعارات متقدم** مع real-time updates  
✅ **حماية البيانات الحساسة** (الرقم القومي للأدمين فقط)  
✅ **إحصائيات متقدمة** للأدمين  
✅ **أمان محسن** مع RLS policies شاملة

## خطوات التنفيذ

### 1. إعداد قاعدة البيانات

#### الخطوة الأولى: تشغيل Migration

```sql
-- شغل هذا الملف أولاً في Supabase SQL Editor
supabase/database_migration.sql
```

#### الخطوة الثانية: تطبيق RLS Policies

```sql
-- شغل هذا الملف ثانياً
supabase/rls_policies.sql
```

#### الخطوة الثالثة: إنشاء الدوال

```sql
-- شغل هذا الملف ثالثاً
supabase/functions.sql
```

#### الخطوة الرابعة: إنشاء المستخدمين

```sql
-- شغل هذا الملف رابعاً
supabase/create_admin_users.sql
```

### 2. إنشاء المستخدمين في Supabase Auth

#### للأدمين:

1. اذهب إلى **Authentication > Users** في Supabase Dashboard
2. اضغط **"Add User"**
3. أدخل البيانات:
   - **Email**: `emanhassanmahmoud1@gmail.com`
   - **Password**: (اختر كلمة مرور قوية)
   - **User Metadata**:
     ```json
     {
       "full_name": "إيمان حسن محمود",
       "role": "ADMIN"
     }
     ```

#### للموظفين:

1. كرر نفس الخطوات للموظفين:
   - `ahmed.employee@test.com`
   - `fatima.employee@test.com`
   - `mohamed.employee@test.com`

### 3. تحديث الكود في التطبيق

#### ملف `ComplaintForm.tsx`:

```typescript
const handleSubmit = async (formData: ComplaintFormData) => {
  try {
    console.log("Submitting complaint form...");

    const { data, error } = await supabase.rpc("submit_complaint", {
      p_type_id: formData.typeId,
      p_title: formData.title,
      p_description: formData.description,
      p_location: formData.location || null,
      p_priority: formData.priority || "MEDIUM",
    });

    if (error) {
      console.error("Complaint submission error:", error);
      setError("فشل في تقديم الشكوى");
      return;
    }

    if (data && data.success) {
      console.log("Complaint submitted successfully:", data);
      setSuccess(`تم تقديم الشكوى بنجاح! رقم التتبع: ${data.tracking_code}`);
      reset();
    } else {
      console.error("Complaint submission failed:", data);
      setError(data?.message || "فشل في تقديم الشكوى");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    setError("حدث خطأ غير متوقع");
  }
};
```

#### ملف `ComplaintList.tsx`:

```typescript
const fetchComplaints = async () => {
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select(
        `
        *,
        complaint_types(name, icon, color),
        users!citizen_id(full_name, email, national_id),
        assigned_user:users!assigned_user_id(full_name, email)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching complaints:", error);
      return;
    }

    setComplaints(data || []);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
};
```

#### ملف `ComplaintDetail.tsx`:

```typescript
const updateComplaintStatus = async (newStatus: string) => {
  try {
    const { data, error } = await supabase.rpc("update_complaint_status", {
      p_complaint_id: complaint.id,
      p_new_status: newStatus,
      p_notes: notes,
    });

    if (error) {
      console.error("Status update error:", error);
      setError("فشل في تحديث الحالة");
      return;
    }

    if (data && data.success) {
      setSuccess("تم تحديث حالة الشكوى بنجاح");
      fetchComplaintDetails();
    } else {
      setError(data?.message || "فشل في تحديث الحالة");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    setError("حدث خطأ غير متوقع");
  }
};
```

### 4. إنشاء مكونات جديدة

#### مكون الإشعارات `Notifications.tsx`:

```typescript
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase.rpc("get_notifications", {
        p_limit: 20,
        p_offset: 0,
      });

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      if (data && data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { data, error } = await supabase.rpc("mark_notification_read", {
        p_notification_id: notificationId,
      });

      if (data && data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="notifications-container">
      <h2>الإشعارات</h2>
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${
                !notification.is_read ? "unread" : ""
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <small>
                {new Date(notification.created_at).toLocaleString("ar-EG")}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### مكون الإحصائيات `Statistics.tsx`:

```typescript
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc("get_complaint_statistics");

      if (error) {
        console.error("Error fetching statistics:", error);
        return;
      }

      if (data && data.success) {
        setStats(data.statistics);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) return <div>جاري التحميل...</div>;
  if (!stats) return <div>لا يمكن تحميل الإحصائيات</div>;

  return (
    <div className="statistics-container">
      <h2>إحصائيات الشكاوى</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>إجمالي الشكاوى</h3>
          <p>{stats.total_complaints}</p>
        </div>
        <div className="stat-card">
          <h3>شكاوى جديدة</h3>
          <p>{stats.new_complaints}</p>
        </div>
        <div className="stat-card">
          <h3>قيد المعالجة</h3>
          <p>{stats.in_progress_complaints}</p>
        </div>
        <div className="stat-card">
          <h3>تم الحل</h3>
          <p>{stats.resolved_complaints}</p>
        </div>
      </div>
    </div>
  );
}
```

### 5. تحديث ملفات التوجيه

#### `app/dashboard/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ComplaintList from "@/components/ComplaintList";
import Statistics from "@/components/Statistics";
import Notifications from "@/components/Notifications";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_profile");

        if (data && data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <div>جاري التحميل...</div>;
  if (!user) return <div>لا يمكن تحميل البيانات</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>مرحباً {user.full_name}</h1>
        <p>
          دورك:{" "}
          {user.role === "ADMIN"
            ? "مدير"
            : user.role === "EMPLOYEE"
            ? "موظف"
            : "مواطن"}
        </p>
      </div>

      <div className="dashboard-content">
        {user.role === "ADMIN" && (
          <div className="admin-section">
            <Statistics />
          </div>
        )}

        <div className="notifications-section">
          <Notifications />
        </div>

        <div className="complaints-section">
          <ComplaintList />
        </div>
      </div>
    </div>
  );
}
```

## اختبار النظام

### 1. اختبار تسجيل الدخول

- جرب تسجيل الدخول بحساب الأدمين
- جرب تسجيل الدخول بحساب الموظف
- جرب تسجيل الدخول بحساب المواطن

### 2. اختبار تقديم الشكاوى

- قدم شكوى جديدة كمواطن
- تحقق من ظهور الإشعار للأدمين
- تحقق من إنشاء رقم التتبع

### 3. اختبار إدارة الشكاوى

- كأدمين، عيّن شكوى لموظف
- كموظف، حدث حالة الشكوى
- تحقق من ظهور الإشعارات للمواطن

### 4. اختبار الأمان

- تحقق من عدم ظهور الرقم القومي للمواطنين
- تحقق من عدم إمكانية الوصول لبيانات الآخرين
- تحقق من عمل RLS policies

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في تسجيل الدخول**:

   - تأكد من إنشاء المستخدم في Supabase Auth
   - تأكد من تطابق البريد الإلكتروني

2. **خطأ في تقديم الشكاوى**:

   - تحقق من تشغيل جميع ملفات SQL
   - تحقق من وجود أنواع الشكاوى

3. **خطأ في الصلاحيات**:
   - تحقق من تطبيق RLS policies
   - تحقق من دور المستخدم

### أوامر تشخيصية:

```sql
-- فحص المستخدمين
SELECT * FROM public.users ORDER BY created_at DESC;

-- فحص الشكاوى
SELECT * FROM public.complaints ORDER BY created_at DESC;

-- فحص السياسات
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- فحص الدوال
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

## ملاحظات مهمة

✅ **احتفظ بنسخة احتياطية** من البيانات قبل تشغيل Migration  
✅ **اختبر النظام** في بيئة التطوير أولاً  
✅ **راجع الأخطاء** في console المتصفح  
✅ **تحقق من الصلاحيات** لكل دور مستخدم  
✅ **اختبر جميع الوظائف** قبل النشر للإنتاج

## الدعم

إذا واجهت أي مشاكل:

1. راجع رسائل الخطأ في console
2. تحقق من تشغيل جميع ملفات SQL
3. تأكد من إنشاء المستخدمين في Auth
4. راجع RLS policies
