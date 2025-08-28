# تنظيف ملفات المشروع

## الملفات التي يمكن حذفها بأمان

### ملفات SQL القديمة:

```
supabase/updated_rls_policies.sql
supabase/fix_complaint_submission.sql
supabase/final_complaint_fix.sql
supabase/create_admin_user.sql
```

### ملفات التشخيص:

```
check_complaints_status.sql
check_database_status.sql
fix_complaint_roles.sql
```

### ملفات الدليل القديمة:

```
COMPLAINT_SUBMISSION_GUIDE.md
```

## الملفات المطلوبة للاحتفاظ بها:

### ملفات SQL الأساسية:

```
supabase/database_migration.sql      # Migration الرئيسي
supabase/rls_policies.sql            # سياسات RLS
supabase/functions.sql               # دوال النظام
supabase/create_admin_users.sql      # إنشاء المستخدمين
```

### ملفات الدليل:

```
IMPLEMENTATION_GUIDE.md              # دليل التنفيذ الشامل
cleanup_files.md                     # هذا الملف
```

## أوامر الحذف:

```bash
# حذف الملفات القديمة
rm supabase/updated_rls_policies.sql
rm supabase/fix_complaint_submission.sql
rm supabase/final_complaint_fix.sql
rm supabase/create_admin_user.sql
rm check_complaints_status.sql
rm check_database_status.sql
rm fix_complaint_roles.sql
rm COMPLAINT_SUBMISSION_GUIDE.md
```

## هيكل المشروع النهائي:

```
supabase/
├── database_migration.sql      # Migration الرئيسي
├── rls_policies.sql            # سياسات RLS
├── functions.sql               # دوال النظام
└── create_admin_users.sql      # إنشاء المستخدمين

docs/
├── IMPLEMENTATION_GUIDE.md     # دليل التنفيذ
└── cleanup_files.md           # هذا الملف
```

## ملاحظات:

✅ **احتفظ بنسخة احتياطية** قبل الحذف  
✅ **تأكد من عمل النظام** قبل حذف أي ملفات  
✅ **احتفظ بالملفات الأساسية** المذكورة أعلاه  
✅ **اختبر النظام** بعد التنظيف
