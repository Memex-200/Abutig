const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("بدء إضافة البيانات الأولية...");

  // NEW FUNCTIONALITY: أنواع الشكاوى المناسبة لأبوتيج - تم إضافتها في الإصدار 2.0.0
  const complaintTypes = [
    {
      name: "شكوى بناء مخالف",
      description: "بناء بدون ترخيص أو مخالف للقوانين",
      icon: "🏚️",
    },
    {
      name: "شكوى صرف صحي",
      description: "مشاكل في شبكة الصرف الصحي",
      icon: "🚽",
    },
    {
      name: "شكوى نظافة أو قمامة",
      description: "تراكم القمامة أو عدم النظافة",
      icon: "♻️",
    },
    {
      name: "شكوى طريق أو رصف",
      description: "تلف في الطرق أو الأرصفة",
      icon: "🚧",
    },
    {
      name: "شكوى إنارة",
      description: "مشاكل في الإنارة العامة",
      icon: "💡",
    },
    {
      name: "شكوى ضعف أو انقطاع الإنترنت",
      description: "ضعف أو انقطاع الإنترنت / الشبكة",
      icon: "📶",
    },
    {
      name: "شكوى تعديات على ممتلكات عامة",
      description: "تعديات على الأراضي أو الممتلكات العامة",
      icon: "🌳",
    },
    {
      name: "شكوى صيانة أو كهرباء",
      description: "مشاكل في الصيانة أو الكهرباء",
      icon: "🛠️",
    },
    {
      name: "شكوى أمنية أو تعدي",
      description: "مشاكل أمنية أو تعديات",
      icon: "🚓",
    },
    {
      name: "أخرى",
      description: "شكاوى أخرى (مع تحديد التفاصيل)",
      icon: "✉️",
    },
  ];

  for (const type of complaintTypes) {
    await prisma.complaintType.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    });
  }

  // إنشاء حساب الإدارة الأول
  const adminPassword = await bcrypt.hash("Emovmmm#951753", 12);
  const admin1 = await prisma.user.upsert({
    where: { email: "emanhassanmahmoud1@gmail.com" },
    update: {
      fullName: "إيمان حسن محمود",
      phone: "01000000001",
      nationalId: "12345678901234",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      fullName: "إيمان حسن محمود",
      phone: "01000000001",
      nationalId: "12345678901234",
      email: "emanhassanmahmoud1@gmail.com",
      role: "ADMIN",
      password: adminPassword,
      isActive: true,
    },
  });

  // إنشاء حساب الإدارة الثاني
  const admin2 = await prisma.user.upsert({
    where: { email: "karemelolary8@gmail.com" },
    update: {
      fullName: "كريم العكري",
      phone: "01000000002",
      nationalId: "12345678901235",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      fullName: "كريم العكري",
      phone: "01000000002",
      nationalId: "12345678901235",
      email: "karemelolary8@gmail.com",
      role: "ADMIN",
      password: adminPassword,
      isActive: true,
    },
  });

  console.log("✅ تم إضافة البيانات الأولية بنجاح!");
  console.log("Admin 1:", admin1.fullName, "-", admin1.email);
  console.log("Admin 2:", admin2.fullName, "-", admin2.email);
  console.log("كلمة المرور لكلا الحسابين: Emovmmm#951753");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
