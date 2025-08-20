# مركز مدينة أبوتيج - نظام إدارة الشكاوى

نظام متكامل لإدارة شكاوى المواطنين في مدينة أبوتيج مع ميزات أمان متقدمة وواجهة مستخدم حديثة.

## 🚀 الميزات الرئيسية

### 🔐 الأمان والصلاحيات
- **نظام صلاحيات متقدم**: مدير، موظف، مواطن
- **عزل البيانات**: كل مواطن يرى شكاواكه فقط
- **حماية من الهجمات**: Rate limiting، validation، sanitization
- **تشفير كلمات المرور**: bcrypt مع salt
- **JWT tokens**: آمنة ومشفرة
- **Audit trail**: تتبع كامل للتغييرات

### 📋 إدارة الشكاوى
- **حالات الشكاوى**: غير محلولة، قيد التنفيذ، تم الحل
- **أنواع الشكاوى**: قابلة للتخصيص مع أيقونات
- **المرفقات**: دعم الصور وملفات PDF
- **التتبع**: سجل كامل للتحديثات والتغييرات
- **التصدير**: Excel و CSV

### 👥 واجهات المستخدم
- **لوحة تحكم المدير**: إدارة شاملة للنظام
- **لوحة تحكم الموظف**: معالجة الشكاوى المخصصة
- **لوحة تحكم المواطن**: متابعة الشكاوى الشخصية
- **نموذج الشكاوى**: سهل الاستخدام مع validation

## 🛠️ متطلبات النظام

- Node.js 18+ 
- npm أو yarn
- SQLite (مدمج) أو PostgreSQL/MySQL
- Git

## 📦 التثبيت والإعداد

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd project
```

### 2. تثبيت التبعيات
```bash
# تثبيت تبعيات الخادم
cd server
npm install

# تثبيت تبعيات الواجهة الأمامية
cd ..
npm install
```

### 3. إعداد متغيرات البيئة
```bash
# إنشاء ملف .env في مجلد server
cd server
cp .env.example .env
```

تعديل ملف `.env`:
```env
# إعدادات الخادم
PORT=3001
NODE_ENV=development

# إعدادات قاعدة البيانات
DATABASE_URL="file:./dev.db"

# إعدادات JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# إعدادات المديرين (اختياري)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
ADMIN_USER_IDS=user1,user2
ADMIN_PHONES=01000000001,01000000002
ADMIN_NATIONAL_IDS=12345678901234,12345678901235

# إعدادات البريد الإلكتروني (اختياري)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# إعدادات الواجهة الأمامية
FRONTEND_URL=http://localhost:5173
```

### 4. إعداد قاعدة البيانات
```bash
cd server

# إنشاء قاعدة البيانات وتطبيق المخطط
npx prisma generate
npx prisma db push

# تشغيل migration (اختياري)
node prisma/migrate.js
```

### 5. تشغيل النظام
```bash
# تشغيل الخادم
cd server
npm start

# في terminal آخر، تشغيل الواجهة الأمامية
cd ..
npm run dev
```

## 🔧 إعدادات الأمان

### إعدادات المديرين
يمكن تكوين المديرين من خلال متغيرات البيئة:

```env
# المديرين عبر البريد الإلكتروني
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# المديرين عبر معرف المستخدم
ADMIN_USER_IDS=user1,user2

# المديرين عبر رقم الهاتف
ADMIN_PHONES=01000000001,01000000002

# المديرين عبر الرقم القومي
ADMIN_NATIONAL_IDS=12345678901234,12345678901235
```

### كلمات المرور الافتراضية
- **المدير الأول**: emanhassanmahmoud1@gmail.com / Emovmmm#951753
- **المدير الثاني**: karemelolary8@gmail.com / Emovmmm#951753

## 🧪 الاختبار

### تشغيل الاختبارات
```bash
# تثبيت تبعيات الاختبار
npm install --save-dev jest supertest

# تشغيل اختبارات الأمان
npm test

# تشغيل اختبارات محددة
npm test -- --testNamePattern="Security"
```

### أنواع الاختبارات
- **اختبارات الأمان**: التحقق من الصلاحيات وعزل البيانات
- **اختبارات المصادقة**: JWT tokens والتحقق من الهوية
- **اختبارات الإدخال**: validation والتحقق من البيانات
- **اختبارات Rate Limiting**: منع الهجمات

## 📊 الأدوار والصلاحيات

### 👑 المدير (ADMIN)
- **الوصول الكامل**: جميع الشكاوى والمستخدمين
- **إدارة النظام**: إضافة/تعديل/حذف المستخدمين والأنواع
- **تحديث الحالات**: تغيير حالة أي شكوى
- **التصدير**: تصدير التقارير
- **التخصيص**: تخصيص الشكاوى للموظفين

### 👨‍💼 الموظف (EMPLOYEE)
- **الشكاوى المخصصة**: رؤية الشكاوى المخصصة له فقط
- **تحديث الحالات**: تحديث حالة الشكاوى المخصصة
- **إضافة ملاحظات**: ملاحظات داخلية
- **التصدير**: تقارير محدودة

### 👤 المواطن (CITIZEN)
- **الشكاوى الشخصية**: رؤية شكاواكه فقط
- **تقديم شكاوى**: إرسال شكاوى جديدة
- **متابعة الحالة**: تتبع حالة الشكاوى
- **لا يمكن**: تحديث الحالات أو الوصول لشكاوى أخرى

## 🔒 ميزات الأمان

### حماية البيانات
- **عزل البيانات**: كل مستخدم يرى بياناته فقط
- **تشفير البيانات الحساسة**: كلمات المرور مشفرة
- **حماية من SQL Injection**: استخدام Prisma ORM
- **حماية من XSS**: sanitization للبيانات

### حماية الملفات
- **تحقق من نوع الملف**: صور و PDF فقط
- **حجم الملف**: حد أقصى 5MB
- **عدد الملفات**: حد أقصى 5 ملفات
- **تسمية آمنة**: منع path traversal

### Rate Limiting
- **تقديم الشكاوى**: 10 شكاوى في الساعة
- **تسجيل الدخول**: 5 محاولات في 15 دقيقة
- **إجراءات المدير**: 50 إجراء في 5 دقائق

## 🚀 النشر

### Railway (موصى به)
```bash
# إعداد Railway
railway login
railway init

# إضافة متغيرات البيئة
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-production-secret
railway variables set DATABASE_URL=your-production-db-url

# النشر
railway up
```

### Docker
```bash
# بناء الصورة
docker build -t complaint-system .

# تشغيل الحاوية
docker run -p 3001:3001 complaint-system
```

## 📝 API Documentation

### المصادقة
```http
POST /api/auth/login
POST /api/auth/verify-citizen
```

### الشكاوى
```http
GET /api/complaints
POST /api/complaints/submit
GET /api/complaints/:id
PATCH /api/complaints/:id/status
PATCH /api/complaints/:id/assign
```

### التصدير
```http
GET /api/complaints/export/excel
GET /api/complaints/export/csv
```

## 🐛 استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في قاعدة البيانات**: تأكد من تشغيل `npx prisma generate`
2. **خطأ في JWT**: تأكد من تعيين `JWT_SECRET`
3. **خطأ في CORS**: تأكد من إعداد `FRONTEND_URL`
4. **خطأ في الملفات**: تأكد من وجود مجلد `uploads`

### السجلات
```bash
# سجلات الخادم
tail -f server/logs/app.log

# سجلات قاعدة البيانات
npx prisma studio
```

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

للدعم التقني أو الاستفسارات:
- البريد الإلكتروني: support@example.com
- الهاتف: 01000000000
- العنوان: مدينة أبوتيج، محافظة أسيوط

---

**تم تطوير هذا النظام بواسطة فريق تطوير مجلس مدينة أبوتيج** 🏛️
