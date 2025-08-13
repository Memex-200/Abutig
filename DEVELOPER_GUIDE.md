# دليل المطورين - نظام إدارة الشكاوى البلدية 👨‍💻

## نظرة عامة

هذا الدليل مخصص للمطورين الذين يعملون على نظام إدارة الشكاوى البلدية.

---

## هيكل المشروع 📁

```
project/
├── src/                    # Frontend React
│   ├── components/         # مكونات React
│   │   ├── AdminDashboard.tsx
│   │   ├── CitizenDashboard.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   ├── ComplaintForm.tsx
│   │   ├── NotificationCenter.tsx    # NEW
│   │   └── ...
│   ├── contexts/          # React Contexts
│   │   └── AuthContext.tsx
│   └── main.tsx
├── server/                # Backend Node.js
│   ├── routes/            # مسارات API
│   │   ├── auth.js
│   │   ├── complaints.js
│   │   ├── users.js
│   │   ├── types.js
│   │   ├── stats.js
│   │   ├── notifications.js    # NEW
│   │   └── settings.js         # NEW
│   ├── middleware/        # Middleware
│   │   └── auth.js
│   ├── utils/             # أدوات مساعدة
│   │   └── email.js
│   └── uploads/           # الملفات المرفوعة
├── prisma/                # قاعدة البيانات
│   ├── schema.prisma      # مخطط قاعدة البيانات
│   └── seed.cjs           # البيانات الأولية
└── docs/                  # التوثيق
    ├── API_DOCUMENTATION.md
    ├── QUICK_START.md
    └── CHANGELOG.md
```

---

## التقنيات المستخدمة 🛠️

### Frontend

- **React 18** مع TypeScript
- **Tailwind CSS** للتصميم
- **Lucide React** للأيقونات
- **Vite** كأداة بناء

### Backend

- **Node.js** مع Express.js
- **Prisma ORM** مع SQLite
- **JWT** للمصادقة
- **Multer** لرفع الملفات
- **Nodemailer** لإرسال البريد الإلكتروني
- **XLSX** لتصدير البيانات

### الأمان

- **Helmet** لحماية HTTP headers
- **Rate Limiting** لمنع الهجمات
- **CORS** للتحكم في الوصول
- **Input Validation** للبيانات
- **Role-Based Access Control (RBAC)**

---

## إعداد بيئة التطوير 🚀

### المتطلبات

- Node.js 16+
- npm أو yarn

### خطوات الإعداد

1. **استنساخ المشروع**

```bash
git clone <repository-url>
cd project
```

2. **تثبيت التبعيات**

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

3. **إعداد قاعدة البيانات**

```bash
cd server
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
```

4. **إعداد متغيرات البيئة**

```bash
# إنشاء ملف .env في مجلد server
cp .env.example .env

# تعديل المتغيرات
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
JWT_SECRET=your-secret-key
```

5. **تشغيل النظام**

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
npm run dev
```

---

## قاعدة البيانات 🗄️

### النماذج الرئيسية

#### User

```prisma
model User {
  id          String   @id @default(cuid())
  email       String?  @unique
  phone       String   @unique
  nationalId  String   @unique
  fullName    String
  role        String   @default("CITIZEN")
  password    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Complaint

```prisma
model Complaint {
  id            String   @id @default(cuid())
  complainantId String
  typeId        String
  title         String
  description   String
  status        String   @default("NEW")
  priority      String   @default("MEDIUM")
  location      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  assignedToId  String?
  resolvedAt    DateTime?
}
```

#### ComplaintType

```prisma
model ComplaintType {
  id          String @id @default(cuid())
  name        String @unique
  description String?
  icon        String?
  isActive    Boolean @default(true)
}
```

---

## API Endpoints 📡

### المصادقة

- `POST /api/auth/login` - تسجيل دخول الموظف/الإدارة
- `POST /api/auth/verify-citizen` - التحقق من المواطن

### الشكاوى

- `GET /api/complaints` - جلب الشكاوى
- `POST /api/complaints/submit` - تقديم شكوى جديدة
- `PUT /api/complaints/:id/status` - تحديث حالة الشكوى
- `GET /api/complaints/export/excel` - تصدير Excel
- `GET /api/complaints/export/csv` - تصدير CSV

### الإشعارات (NEW)

- `GET /api/notifications` - جلب الإشعارات
- `PUT /api/notifications/:id/read` - تحديد كمقروء
- `PUT /api/notifications/read-all` - تحديد الكل كمقروء

### الإعدادات (NEW)

- `GET /api/settings` - جلب الإعدادات
- `PATCH /api/settings/email` - تحديث إعدادات البريد
- `POST /api/settings/email/test` - اختبار البريد

---

## نظام الصلاحيات 🔐

### الأدوار

- **CITIZEN:** الوصول لشكاواهم فقط
- **EMPLOYEE:** الوصول للشكاوى المخصصة لهم
- **ADMIN:** الوصول الكامل للنظام

### Middleware

```javascript
// التحقق من التوكن
authenticateToken;

// التحقق من الدور
requireRole(["ADMIN", "EMPLOYEE"]);
```

---

## الميزات الجديدة في الإصدار 2.0.0 ✨

### 1. نظام الإشعارات

- **الملف:** `server/routes/notifications.js`
- **المكون:** `src/components/NotificationCenter.tsx`
- **الوظيفة:** إشعارات للمواطنين والموظفين

### 2. إدارة الإعدادات

- **الملف:** `server/routes/settings.js`
- **الوظيفة:** إدارة إعدادات النظام والبريد الإلكتروني

### 3. التصدير

- **الملف:** `server/routes/complaints.js`
- **الوظيفة:** تصدير Excel و CSV مع فلترة

### 4. أنواع الشكاوى

- **الملف:** `prisma/seed.cjs`
- **الوظيفة:** 10 أنواع شكاوى مناسبة لأبوتيج

---

## أفضل الممارسات 💡

### الكود

- استخدم TypeScript لجميع الملفات الجديدة
- اتبع نمط التسمية camelCase
- أضف تعليقات للوظائف المعقدة
- استخدم ESLint و Prettier

### الأمان

- تحقق من صحة جميع المدخلات
- استخدم HTTPS في الإنتاج
- لا تخزن كلمات المرور كنص عادي
- استخدم Rate Limiting

### الأداء

- استخدم Pagination للقوائم الكبيرة
- احفظ الصور في مجلد منفصل
- استخدم Indexes في قاعدة البيانات
- احذف الملفات المؤقتة

---

## الاختبار 🧪

### تشغيل الاختبارات

```bash
# Frontend
npm test

# Backend
cd server
npm test
```

### اختبار API

```bash
# استخدام Postman أو curl
curl -X GET http://localhost:3001/api/health
```

---

## النشر 🚀

### الإعدادات المطلوبة

- متغيرات البيئة للإنتاج
- قاعدة بيانات PostgreSQL
- خادم HTTPS
- إعدادات البريد الإلكتروني

### خطوات النشر

1. بناء Frontend: `npm run build`
2. إعداد Backend: `npm run start:prod`
3. إعداد قاعدة البيانات
4. تكوين Reverse Proxy

---

## استكشاف الأخطاء 🔧

### مشاكل شائعة

#### مشكلة في قاعدة البيانات

```bash
npx prisma db push
npx prisma generate
```

#### مشكلة في التبعيات

```bash
rm -rf node_modules package-lock.json
npm install
```

#### مشكلة في البريد الإلكتروني

- تحقق من متغيرات البيئة
- اختبر الإعدادات من لوحة التحكم

---

## المساهمة 🤝

### إرشادات المساهمة

1. Fork المشروع
2. إنشاء branch جديد
3. إضافة الميزة أو الإصلاح
4. إضافة الاختبارات
5. تحديث التوثيق
6. إنشاء Pull Request

### معايير الكود

- استخدم TypeScript
- اتبع ESLint rules
- أضف تعليقات للوظائف الجديدة
- اكتب اختبارات للوظائف الجديدة

---

## الموارد 📚

### التوثيق

- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### الأدوات

- [Postman](https://www.postman.com/) - اختبار API
- [Prisma Studio](https://www.prisma.io/studio) - إدارة قاعدة البيانات
- [VS Code Extensions](https://marketplace.visualstudio.com/) - أدوات التطوير

---

## التواصل 📞

للحصول على الدعم أو المساهمة:

- إنشاء Issue في GitHub
- التواصل مع فريق التطوير
- مراجعة التوثيق المتاح

---

**مجلس مدينة أبوتيج** - خدمة المواطنين أولوية 🏛️

_آخر تحديث: 15 يناير 2024_
