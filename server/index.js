const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { migrateDatabase } = require("../prisma/migrate.cjs");

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const userRoutes = require("./routes/users");
const typeRoutes = require("./routes/types");
const statsRoutes = require("./routes/stats");
const notificationRoutes = require("./routes/notifications");
const settingsRoutes = require("./routes/settings");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/types", typeRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Global error handler with enhanced security
app.use((error, req, res, next) => {
  console.error("Error:", error);

  // Don't leak sensitive information in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(error.status || 500).json({
    error: error.message || "خطأ داخلي في الخادم",
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Initialize default data with enhanced security
async function initializeData() {
  try {
    console.log("🔄 Running database migration...");
    await migrateDatabase();

    // Create default admin users with enhanced security
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("Emovmmm#951753", 12);

    // First admin
    await prisma.user.upsert({
      where: { email: "emanhassanmahmoud1@gmail.com" },
      update: {
        fullName: "إيمان حسن محمود",
        phone: "01000000001",
        nationalId: "12345678901234",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
      create: {
        email: "emanhassanmahmoud1@gmail.com",
        phone: "01000000001",
        nationalId: "12345678901234",
        fullName: "إيمان حسن محمود",
        role: "ADMIN",
        password: hashedPassword,
        isActive: true,
      },
    });

    // Second admin
    await prisma.user.upsert({
      where: { email: "karemelolary8@gmail.com" },
      update: {
        fullName: "كريم العكري",
        phone: "01000000002",
        nationalId: "12345678901235",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
      create: {
        email: "karemelolary8@gmail.com",
        phone: "01000000002",
        nationalId: "12345678901235",
        fullName: "كريم العكري",
        role: "ADMIN",
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log("✅ تم تهيئة البيانات الافتراضية");
  } catch (error) {
    console.error("❌ خطأ في تهيئة البيانات:", error);
    // Don't exit the process, just log the error
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 الخادم يعمل على البورت ${PORT}`);
  await initializeData();
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 إيقاف الخادم...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 إيقاف الخادم...");
  await prisma.$disconnect();
  process.exit(0);
});
