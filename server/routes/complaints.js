const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult, query } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  sendComplaintNotification,
  sendStatusUpdateNotification,
} = require("../utils/email");
const XLSX = require("xlsx");

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم"));
    }
  },
});

// Submit new complaint
router.post(
  "/submit",
  upload.array("files", 5),
  [
    body("fullName").isLength({ min: 2 }).withMessage("الاسم مطلوب"),
    body("phone").isMobilePhone("ar-EG").withMessage("رقم هاتف غير صالح"),
    body("nationalId")
      .isLength({ min: 14, max: 14 })
      .withMessage("الرقم القومي يجب أن يكون 14 رقم"),
    body("typeId").notEmpty().withMessage("نوع الشكوى مطلوب"),
    body("title").isLength({ min: 5 }).withMessage("عنوان الشكوى مطلوب"),
    body("description").isLength({ min: 10 }).withMessage("وصف الشكوى مطلوب"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "بيانات غير صالحة",
          details: errors.array(),
        });
      }

      const {
        fullName,
        phone,
        nationalId,
        typeId,
        title,
        description,
        location,
        email,
      } = req.body;

      // Check if complainant exists, create if not
      let complainant = await prisma.complainant.findFirst({
        where: {
          OR: [{ phone }, { nationalId }],
        },
      });

      if (!complainant) {
        complainant = await prisma.complainant.create({
          data: {
            fullName,
            phone,
            nationalId,
            email: email || null,
          },
        });
      }

      // Create complaint
      const complaint = await prisma.complaint.create({
        data: {
          complainantId: complainant.id,
          typeId,
          title,
          description,
          location: location || null,
          status: "NEW",
        },
        include: {
          type: true,
          complainant: true,
        },
      });

      // Handle file uploads
      if (req.files && req.files.length > 0) {
        const filePromises = req.files.map((file) =>
          prisma.complaintFile.create({
            data: {
              complaintId: complaint.id,
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
            },
          })
        );
        await Promise.all(filePromises);
      }

      // Log the creation - only if we have a user
      if (req.user?.id) {
        await prisma.complaintLog.create({
          data: {
            complaintId: complaint.id,
            userId: req.user.id,
            action: "CREATED",
            newStatus: "NEW",
            notes: "تم إنشاء الشكوى",
          },
        });
      }

      // Send email notification to admins
      try {
        await sendComplaintNotification(complaint, complainant);
      } catch (emailError) {
        console.error("خطأ في إرسال إشعار البريد الإلكتروني:", emailError);
        // لا نوقف العملية إذا فشل إرسال البريد الإلكتروني
      }

      res.status(201).json({
        success: true,
        complaint: {
          id: complaint.id,
          title: complaint.title,
          status: complaint.status,
          createdAt: complaint.createdAt,
        },
        message: "تم تقديم الشكوى بنجاح",
      });
    } catch (error) {
      console.error("Submit complaint error:", error);
      res.status(500).json({ error: "خطأ في تقديم الشكوى" });
    }
  }
);

// Get complaints (with role-based filtering)
router.get(
  "/",
  authenticateToken,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status")
      .optional()
      .isIn([
        "NEW",
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "RESOLVED",
        "REJECTED",
        "CLOSED",
      ]),
    query("typeId").optional().isString(),
    query("search").optional().isString(),
    query("complainant").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "معاملات غير صالحة",
          details: errors.array(),
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filters = {};

      if (req.query.status) filters.status = req.query.status;
      if (req.query.typeId) filters.typeId = req.query.typeId;

      // Role-based filtering
      if (req.user.role === "EMPLOYEE") {
        // Employee sees only assigned complaints
        filters.assignedToId = req.user.id;
      } else if (req.user.role === "CITIZEN") {
        // Citizen sees only their own complaints
        filters.complainantId = req.user.complainantId;
      }
      // ADMIN can see all complaints (no additional filter)

      // Search functionality
      if (req.query.search) {
        filters.OR = [
          { title: { contains: req.query.search } },
          { description: { contains: req.query.search } },
          { complainant: { fullName: { contains: req.query.search } } },
        ];
      }

      const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
          where: filters,
          include: {
            type: true,
            complainant: {
              select: {
                fullName: true,
                phone: true,
              },
            },
            assignedTo: {
              select: {
                fullName: true,
              },
            },
            _count: {
              select: {
                files: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.complaint.count({ where: filters }),
      ]);

      res.json({
        complaints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get complaints error:", error);
      res.status(500).json({ error: "خطأ في جلب الشكاوى" });
    }
  }
);

// Get single complaint (with role-based access)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: {
        type: true,
        complainant: true,
        assignedTo: {
          select: {
            fullName: true,
            email: true,
          },
        },
        files: true,
        logs: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "الشكوى غير موجودة" });
    }

    // Role-based access control
    if (
      req.user.role === "EMPLOYEE" &&
      complaint.assignedToId !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "غير مسموح لك بالوصول لهذه الشكوى" });
    }

    if (
      req.user.role === "CITIZEN" &&
      complaint.complainantId !== req.user.complainantId
    ) {
      return res
        .status(403)
        .json({ error: "غير مسموح لك بالوصول لهذه الشكوى" });
    }

    res.json(complaint);
  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({ error: "خطأ في جلب الشكوى" });
  }
});

// Update complaint status (Employee/Admin only)
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole(["EMPLOYEE", "ADMIN"]),
  [
    body("status").isIn([
      "NEW",
      "UNDER_REVIEW",
      "IN_PROGRESS",
      "RESOLVED",
      "REJECTED",
      "CLOSED",
    ]),
    body("notes").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "بيانات غير صالحة",
          details: errors.array(),
        });
      }

      const { status, notes } = req.body;
      const complaintId = req.params.id;

      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
          complainant: true,
          type: true,
        },
      });

      if (!complaint) {
        return res.status(404).json({ error: "الشكوى غير موجودة" });
      }

      // Role-based access control
      if (
        req.user.role === "EMPLOYEE" &&
        complaint.assignedToId !== req.user.id
      ) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بتحديث هذه الشكوى" });
      }

      const oldStatus = complaint.status;

      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status,
          ...(status === "RESOLVED" && { resolvedAt: new Date() }),
          ...(req.user.role === "EMPLOYEE" &&
            !complaint.assignedToId && { assignedToId: req.user.id }),
        },
      });

      // Log the status change
      await prisma.complaintLog.create({
        data: {
          complaintId,
          userId: req.user.id,
          action: "STATUS_CHANGED",
          oldStatus,
          newStatus: status,
          notes: notes || `تم تغيير الحالة من ${oldStatus} إلى ${status}`,
        },
      });

      // Send email notification to complainant if they have email
      if (complaint.complainant.email) {
        try {
          await sendStatusUpdateNotification(
            complaint,
            complaint.complainant,
            oldStatus,
            status,
            notes
          );
        } catch (emailError) {
          console.error("خطأ في إرسال إشعار تحديث الحالة:", emailError);
          // لا نوقف العملية إذا فشل إرسال البريد الإلكتروني
        }
      }

      res.json({
        success: true,
        complaint: updatedComplaint,
        message: "تم تحديث حالة الشكوى بنجاح",
      });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ error: "خطأ في تحديث الحالة" });
    }
  }
);

// Assign complaint (Admin only)
router.patch(
  "/:id/assign",
  authenticateToken,
  requireRole(["ADMIN"]),
  [body("assignedToId").notEmpty().withMessage("الموظف المخصص مطلوب")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "بيانات غير صالحة",
          details: errors.array(),
        });
      }

      const { assignedToId } = req.body;
      const complaintId = req.params.id;

      const employee = await prisma.user.findUnique({
        where: { id: assignedToId, role: "EMPLOYEE" },
      });

      if (!employee) {
        return res.status(404).json({ error: "الموظف غير موجود" });
      }

      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: { assignedToId },
      });

      // Log the assignment
      await prisma.complaintLog.create({
        data: {
          complaintId,
          userId: req.user.id,
          action: "ASSIGNED",
          notes: `تم تخصيص الشكوى للموظف: ${employee.fullName}`,
        },
      });

      res.json({
        success: true,
        complaint: updatedComplaint,
        message: "تم تخصيص الشكوى بنجاح",
      });
    } catch (error) {
      console.error("Assign complaint error:", error);
      res.status(500).json({ error: "خطأ في تخصيص الشكوى" });
    }
  }
);

// Export complaints
router.get(
  "/export/excel",
  authenticateToken,
  requireRole(["ADMIN"]),
  async (req, res) => {
    try {
      const complaints = await prisma.complaint.findMany({
        include: {
          type: true,
          complainant: {
            select: {
              fullName: true,
              phone: true,
              nationalId: true,
            },
          },
          assignedTo: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const data = complaints.map((complaint) => ({
        "رقم الشكوى": complaint.id,
        "اسم المشتكي": complaint.complainant.fullName,
        "رقم الهاتف": complaint.complainant.phone,
        "الرقم القومي": complaint.complainant.nationalId,
        "نوع الشكوى": complaint.type.name,
        العنوان: complaint.title,
        الوصف: complaint.description,
        الحالة: complaint.status,
        "الموظف المخصص": complaint.assignedTo?.fullName || "غير محدد",
        "تاريخ التقديم": complaint.createdAt.toLocaleDateString("ar-EG"),
        "تاريخ الحل":
          complaint.resolvedAt?.toLocaleDateString("ar-EG") || "لم يتم الحل",
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "الشكاوى");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=complaints.xlsx"
      );
      res.send(buffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "خطأ في التصدير" });
    }
  }
);

module.exports = router;
