const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "رمز الوصول مطلوب" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if userId or complainantId exists in the decoded token
    if (!decoded.userId && !decoded.complainantId) {
      return res
        .status(401)
        .json({ error: "رمز وصول غير صالح - معرف المستخدم مفقود" });
    }

    // If it's a complainant token, we need to fetch complainant data
    if (decoded.complainantId) {
      const complainant = await prisma.complainant.findUnique({
        where: { id: decoded.complainantId },
        select: {
          id: true,
          fullName: true,
          phone: true,
          nationalId: true,
          email: true,
        },
      });

      if (!complainant) {
        return res.status(401).json({ error: "مشتكي غير صالح" });
      }

      req.user = {
        id: complainant.id,
        complainantId: complainant.id,
        role: "CITIZEN",
        fullName: complainant.fullName,
        phone: complainant.phone,
        nationalId: complainant.nationalId,
        email: complainant.email,
      };
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        nationalId: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "مستخدم غير صالح" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ error: "رمز وصول غير صالح" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "مصادقة مطلوبة" });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "غير مسموح لك بالوصول" });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
};
