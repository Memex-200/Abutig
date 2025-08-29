import React, { useState, useEffect } from "react";
import {
  FileText,
  Users,
  Settings,
  BarChart3,
  Eye,
  Download,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Paperclip,
  X,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  Wrench,
  Shield,
  Lightbulb,
  Wifi,
  Leaf,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient.ts";
import ComplaintTypeManager from "./ComplaintTypeManager";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  type: {
    id: string;
    name: string;
    icon: string;
  };
  createdAt: string;
  resolvedAt?: string;
  complainant: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    role: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
  };
  priority: "LOW" | "MEDIUM" | "HIGH";
  location: string;
  internalNotes?: string[];
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
  }>;
  updates?: Array<{
    id: string;
    message: string;
    createdAt: string;
    createdBy: string;
  }>;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface ComplaintType {
  id: string;
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
}

const AdminDashboard: React.FC = () => {
  // Use user from context, fallback to localStorage if not set
  const { user: contextUser } = useAuth();
  const [user, setUser] = useState(contextUser);

  useEffect(() => {
    if (!contextUser) {
      // Try to get user from localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } else {
      setUser(contextUser);
    }
  }, [contextUser]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "complaints" | "types" | "settings"
  >("overview");

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    role: "EMPLOYEE" as "EMPLOYEE" | "ADMIN",
    password: "",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: "",
    notes: "",
  });
  const [complaintFilters, setComplaintFilters] = useState({
    status: "",
    type: "",
    dateFrom: "",
    dateTo: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      console.error("Access denied: User is not an admin");
      return;
    }
    console.log("Admin access verified, fetching data for tab:", activeTab);
    fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    if (!user || user.role !== "ADMIN") return;

    setLoading(true);
    try {
      switch (activeTab) {
        case "users":
          await fetchUsers();
          break;
        case "complaints":
          await fetchComplaints();
          break;
        case "types":
          await fetchComplaintTypes();
          break;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    if (!user || user.role !== "ADMIN") return;
    try {
      console.log("Admin fetching complaints (simple schema)...");
      let query = supabase
        .from("complaints")
        .select(
          "id, created_at, name, phone, email, national_id, title, details, image_url, address, status, type:complaint_types(id, name)"
        )
        .order("created_at", { ascending: false });

      if (complaintFilters.status)
        query = query.eq("status", complaintFilters.status);
      if (complaintFilters.type)
        query = query.eq("type_id", complaintFilters.type);
      if (complaintFilters.dateFrom)
        query = query.gte("created_at", complaintFilters.dateFrom);
      if (complaintFilters.dateTo)
        query = query.lte("created_at", complaintFilters.dateTo);
      if (searchTerm) query = query.ilike("title", `%${searchTerm}%`);

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching complaints:", error);
        return;
      }
      const transformedData =
        (data as any[])?.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.details,
          status: c.status,
          createdAt: c.created_at,
          resolvedAt: undefined,
          priority: "MEDIUM",
          location: c.address,
          type: { id: c.type?.id || "", name: c.type?.name || "" },
          complainant: {
            id: c.id,
            fullName: c.name,
            phone: c.phone,
            email: c.email,
            role: "CITIZEN",
            nationalId: c.national_id,
          },
        })) || [];
      setComplaints(transformedData);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Only fetch employees and admins, not citizens
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, role, is_active, created_at")
        .in("role", ["EMPLOYEE", "ADMIN"]) // Only show employees and admins
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return;
      }

      console.log("Raw users data from database:", data);

      const transformedData =
        data?.map((user: any) => ({
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
        })) || [];

      setUsers(transformedData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateUser = async () => {
    try {
      // First, create the user in Supabase Auth using admin API
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: userForm.email,
          password: userForm.password,
          email_confirm: true, // Auto-confirm the email
          user_metadata: {
            full_name: userForm.fullName,
            role: userForm.role,
          },
        });

      if (authError) {
        console.error("Auth creation error:", authError);
        alert("فشل إنشاء حساب المستخدم: " + authError.message);
        return;
      }

      if (!authData.user) {
        alert("فشل إنشاء حساب المستخدم");
        return;
      }

      // Then, create the profile in the users table
      const { error: profileError } = await supabase.from("users").insert({
        auth_user_id: authData.user.id,
        email: userForm.email,
        full_name: userForm.fullName,
        phone: userForm.phone || null,
        national_id: userForm.nationalId || null,
        role: userForm.role,
        is_active: true,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // If profile creation fails, we should clean up the auth user
        // But for now, just show the error
        alert("فشل إنشاء ملف المستخدم: " + profileError.message);
        return;
      }

      setShowUserModal(false);
      setUserForm({
        fullName: "",
        email: "",
        phone: "",
        nationalId: "",
        role: "EMPLOYEE",
        password: "",
      });
      await fetchUsers();
      alert("تم إنشاء المستخدم بنجاح! يمكن للمستخدم الآن تسجيل الدخول.");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("حدث خطأ أثناء إنشاء المستخدم");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      fullName: user.fullName,
      email: user.email,
      phone: "", // We'll need to fetch this from the database
      nationalId: "", // We'll need to fetch this from the database
      role: user.role as "EMPLOYEE" | "ADMIN",
      password: "", // We don't edit passwords in this form
    });
    setIsEditing(true);
    setShowUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      // Update the user profile in the users table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: userForm.fullName,
          phone: userForm.phone || null,
          national_id: userForm.nationalId || null,
          role: userForm.role,
        })
        .eq("id", editingUser.id);

      if (updateError) {
        console.error("Update error:", updateError);
        alert("فشل تحديث المستخدم: " + updateError.message);
        return;
      }

      setShowUserModal(false);
      setEditingUser(null);
      setIsEditing(false);
      setUserForm({
        fullName: "",
        email: "",
        phone: "",
        nationalId: "",
        role: "EMPLOYEE",
        password: "",
      });
      await fetchUsers();
      alert("تم تحديث المستخدم بنجاح!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("حدث خطأ أثناء تحديث المستخدم");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      return;
    }

    try {
      // First, get the auth_user_id for this user
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("auth_user_id")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching user:", fetchError);
        alert("فشل في جلب بيانات المستخدم");
        return;
      }

      // Delete the user profile from the users table
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        alert("فشل حذف المستخدم: " + deleteError.message);
        return;
      }

      // If we have an auth_user_id, we should also delete the auth user
      // But this requires admin privileges and might not work from client-side
      if (userData.auth_user_id) {
        console.log(
          "Note: Auth user deletion requires server-side implementation"
        );
        // For now, we'll just log this. In a real application, you'd want to
        // implement this on the server side for security reasons.
      }

      await fetchUsers();
      alert("تم حذف المستخدم بنجاح!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("حدث خطأ أثناء حذف المستخدم");
    }
  };

  const handleMigrateUsers = async () => {
    try {
      // This functionality would need to be implemented differently
      // For now, we'll show a message that this feature is not available
      alert(
        "ميزة ترحيل المستخدمين غير متاحة في النسخة الحالية. يرجى إضافة المستخدمين يدوياً."
      );
    } catch (error) {
      console.error("Error migrating users:", error);
      alert("حدث خطأ أثناء ترحيل المستخدمين");
    }
  };

  const handleCreateTestUser = async () => {
    try {
      // Create a test user directly in Supabase
      const testEmail = `test${Date.now()}@abuttig.gov`;
      const testPassword = "Test123!";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (authError) {
        alert(`فشل إنشاء المستخدم التجريبي: ${authError.message}`);
        return;
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert({
          auth_user_id: authData.user.id,
          email: testEmail,
          full_name: "مستخدم تجريبي",
          role: "EMPLOYEE",
          is_active: true,
        });

        if (profileError) {
          alert(`فشل إنشاء ملف المستخدم: ${profileError.message}`);
          return;
        }

        alert(
          `تم إنشاء المستخدم التجريبي بنجاح!\n\nبيانات تسجيل الدخول:\nالبريد الإلكتروني: ${testEmail}\nكلمة المرور: ${testPassword}`
        );
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error creating test user:", error);
      alert("حدث خطأ أثناء إنشاء المستخدم التجريبي");
    }
  };

  const handleUpdateComplaintStatus = async () => {
    if (!selectedComplaint || !statusUpdateForm.status) return;
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ status: statusUpdateForm.status })
        .eq("id", selectedComplaint.id);
      if (error) {
        console.error("Error updating complaint status:", error);
        alert("فشل تحديث حالة الشكوى");
        return;
      }
      alert("تم تحديث حالة الشكوى بنجاح");
      setSelectedComplaint({
        ...selectedComplaint,
        status: statusUpdateForm.status,
      });
      setStatusUpdateForm({ status: "", notes: "" });
      await fetchData();
    } catch (error) {
      console.error("Error updating complaint status:", error);
      alert("حدث خطأ أثناء تحديث حالة الشكوى");
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    if (
      !confirm(
        "هل أنت متأكد من حذف هذه الشكوى؟ لا يمكن التراجع عن هذا الإجراء."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", complaintId);

      if (error) {
        console.error("Error deleting complaint:", error);
        alert("فشل حذف الشكوى: " + error.message);
        return;
      }

      alert("تم حذف الشكوى بنجاح!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting complaint:", error);
      alert("حدث خطأ أثناء حذف الشكوى");
    }
  };

  const fetchComplaintTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("complaint_types")
        .select("id, name, icon, description, is_active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching complaint types:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return;
      }

      console.log("Raw complaint types data from database:", data);

      const transformedData =
        data?.map((type: any) => ({
          id: type.id,
          name: type.name,
          icon: type.icon,
          description: type.description,
          isActive: type.is_active,
        })) || [];

      setComplaintTypes(transformedData);
    } catch (error) {
      console.error("Error fetching complaint types:", error);
    }
  };

  const handleViewComplaintDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowComplaintModal(true);
  };

  const applyFilters = () => {
    fetchData();
  };

  const exportComplaints = async (format: "excel" | "csv") => {
    try {
      // تحميل البيانات مباشرة من قاعدة البيانات للتأكد من الحصول على أحدث البيانات
      console.log("Fetching complaints for export...");
      const { data: exportComplaintsData, error: fetchError } = await supabase
        .from("complaints")
        .select(
          `
          id, 
          created_at, 
          name, 
          phone, 
          email, 
          national_id, 
          title, 
          details, 
          image_url, 
          address, 
          status, 
          type:complaint_types(id, name)
        `
        )
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching complaints for export:", fetchError);
        alert("فشل في جلب البيانات للتصدير: " + fetchError.message);
        return;
      }

      if (!exportComplaintsData || exportComplaintsData.length === 0) {
        alert("لا توجد شكاوى للتصدير");
        return;
      }

      console.log(
        "Exporting complaints:",
        exportComplaintsData.length,
        "complaints"
      );

      // Prepare data for export
      const exportData = exportComplaintsData.map((complaint: any) => ({
        "رقم الشكوى": complaint.id.slice(-8),
        "اسم المواطن": complaint.name || "غير محدد",
        "رقم الهاتف": complaint.phone || "غير محدد",
        "البريد الإلكتروني": complaint.email || "غير محدد",
        "الرقم القومي": complaint.national_id || "غير محدد",
        "نوع الشكوى": complaint.type?.name || "غير محدد",
        "عنوان الشكوى": complaint.title || "غير محدد",
        "وصف الشكوى": complaint.details || "غير محدد",
        العنوان: complaint.address || "غير محدد",
        الحالة: getStatusLabel(complaint.status),
        "تاريخ الإنشاء": complaint.created_at
          ? new Date(complaint.created_at).toLocaleDateString(
              "ar-EG-u-ca-gregory"
            )
          : "غير محدد",
        "تاريخ الحل": "", // لا يوجد resolved_at في البيانات المحملة
        الأولوية: "متوسطة", // افتراضية
      }));

      console.log("Export data prepared:", exportData.length, "rows");

      if (format === "excel") {
        try {
          // Create Excel file using SheetJS
          const XLSX = await import("xlsx");
          console.log("XLSX imported successfully, creating worksheet...");

          const ws = XLSX.utils.json_to_sheet(exportData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "الشكاوى");

          // Generate filename with current date
          const date = new Date().toISOString().split("T")[0];
          const filename = `شكاوى_${date}.xlsx`;

          console.log("Writing Excel file:", filename);
          XLSX.writeFile(wb, filename);
          alert("تم تصدير الشكاوى بنجاح!");
        } catch (excelError) {
          console.error("Excel export error:", excelError);
          alert("حدث خطأ أثناء تصدير ملف Excel: " + excelError);
        }
      } else {
        // Create CSV file
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(",")
        );
        const csv = [headers, ...rows].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `شكاوى_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert("تم تصدير الشكاوى بنجاح!");
      }
    } catch (error) {
      console.error("Error exporting complaints:", error);
      alert("حدث خطأ أثناء تصدير الشكاوى");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UNRESOLVED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "UNRESOLVED":
        return "غير محلولة";
      case "IN_PROGRESS":
        return "قيد المعالجة";
      case "NEW":
        return "غير محلولة";
      case "OVERDUE":
        return "متأخرة";
      case "RESOLVED":
        return "تم الحل";
      default:
        return status;
    }
  };

  const getTypeIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      Building: <Building className="w-4 h-4" />,
      Wrench: <Wrench className="w-4 h-4" />,
      Shield: <Shield className="w-4 h-4" />,
      Lightbulb: <Lightbulb className="w-4 h-4" />,
      Wifi: <Wifi className="w-4 h-4" />,
      Tree: <Leaf className="w-4 h-4" />,
      Leaf: <Leaf className="w-4 h-4" />,
      MessageSquare: <MessageSquare className="w-4 h-4" />,
    };
    return iconMap[iconName] || <FileText className="w-4 h-4" />;
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            غير مصرح بالوصول
          </h1>
          <p className="text-gray-600">يجب تسجيل الدخول للوصول لهذه الصفحة</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={() => (window.location.href = "/")}
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                لوحة تحكم المدير
              </h1>
              <p className="text-gray-600">مرحباً، {user.fullName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-reverse space-x-8">
              {[
                { id: "overview", label: "نظرة عامة", icon: BarChart3 },
                { id: "users", label: "إدارة المستخدمين", icon: Users },
                { id: "complaints", label: "إدارة الشكاوى", icon: FileText },
                { id: "types", label: "أنواع الشكاوى", icon: Settings },
                { id: "settings", label: "الإعدادات", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-reverse space-x-2 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Welcome Message */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    مرحباً بك في لوحة تحكم المدير
                  </h3>
                  <p className="text-gray-600">
                    يمكنك إدارة الشكاوى والمستخدمين وأنواع الشكاوى من خلال
                    التبويبات أدناه.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      إدارة الشكاوى
                    </h4>
                    <p className="text-gray-600 mb-4">
                      عرض وإدارة جميع الشكاوى المقدمة
                    </p>
                    <button
                      onClick={() => setActiveTab("complaints")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      عرض الشكاوى
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      إدارة المستخدمين
                    </h4>
                    <p className="text-gray-600 mb-4">
                      إضافة وتعديل حسابات الموظفين
                    </p>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      إدارة المستخدمين
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <Settings className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      أنواع الشكاوى
                    </h4>
                    <p className="text-gray-600 mb-4">
                      إدارة أنواع الشكاوى المتاحة
                    </p>
                    <button
                      onClick={() => setActiveTab("types")}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                      إدارة الأنواع
                    </button>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    تصدير التقارير
                  </h3>
                  <div className="flex space-x-reverse space-x-4">
                    <button
                      onClick={() => exportComplaints("excel")}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 ml-2" />
                      تصدير Excel
                    </button>
                    <button
                      onClick={() => exportComplaints("csv")}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 ml-2" />
                      تصدير CSV
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "complaints" && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    فلاتر البحث
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الحالة
                      </label>
                      <select
                        value={complaintFilters.status}
                        onChange={(e) =>
                          setComplaintFilters({
                            ...complaintFilters,
                            status: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">جميع الحالات</option>
                        <option value="NEW">غير محلولة</option>
                        <option value="IN_PROGRESS">قيد المعالجة</option>

                        <option value="OVERDUE">متأخرة</option>
                        <option value="RESOLVED">تم الحل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        النوع
                      </label>
                      <select
                        value={complaintFilters.type}
                        onChange={(e) =>
                          setComplaintFilters({
                            ...complaintFilters,
                            type: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">جميع الأنواع</option>
                        {complaintTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        من تاريخ
                      </label>
                      <input
                        type="date"
                        value={complaintFilters.dateFrom}
                        onChange={(e) =>
                          setComplaintFilters({
                            ...complaintFilters,
                            dateFrom: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        إلى تاريخ
                      </label>
                      <input
                        type="date"
                        value={complaintFilters.dateTo}
                        onChange={(e) =>
                          setComplaintFilters({
                            ...complaintFilters,
                            dateTo: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-reverse space-x-4">
                    <button
                      onClick={applyFilters}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Filter className="w-4 h-4 ml-2" />
                      تطبيق الفلاتر
                    </button>
                    <button
                      onClick={() =>
                        setComplaintFilters({
                          status: "",
                          type: "",
                          dateFrom: "",
                          dateTo: "",
                        })
                      }
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      إعادة تعيين
                    </button>
                  </div>
                </div>

                {/* Complaints Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        قائمة الشكاوى
                      </h3>
                      <div className="flex items-center space-x-reverse space-x-4">
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="البحث في الشكاوى..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
                          />
                        </div>
                        <button
                          onClick={() => exportComplaints("excel")}
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 ml-2" />
                          تصدير
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            رقم الشكوى
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المواطن
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الرقم القومي
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            النوع
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            العنوان
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الحالة
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            التاريخ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {complaints.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center">
                              <div className="text-gray-500">
                                <div className="text-lg font-medium mb-2">
                                  لا توجد شكاوى
                                </div>
                                <div className="text-sm">
                                  لم يتم العثور على أي شكاوى في النظام
                                </div>
                                <div className="text-xs mt-2 text-gray-400">
                                  تحقق من كونسول المتصفح (F12) لمعرفة المزيد من
                                  التفاصيل
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          complaints.map((complaint) => (
                            <tr key={complaint.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{complaint.id.slice(-8)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {complaint.complainant.fullName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {complaint.complainant.phone}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {complaint.complainant.role === "CITIZEN"
                                    ? "مواطن"
                                    : complaint.complainant.role}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {complaint.complainant.nationalId || "غير محدد"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {getTypeIcon(complaint.type.icon)}
                                  <span className="text-sm text-gray-900 mr-2">
                                    {complaint.type.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {complaint.location}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                    complaint.status
                                  )}`}
                                >
                                  {getStatusLabel(complaint.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(
                                  complaint.createdAt
                                ).toLocaleDateString("ar-EG-u-ca-gregory")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-reverse space-x-2">
                                  <button
                                    onClick={() =>
                                      handleViewComplaintDetails(complaint)
                                    }
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    عرض التفاصيل
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteComplaint(complaint.id)
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    حذف
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      إدارة المستخدمين
                    </h3>
                    <div className="flex space-x-reverse space-x-2">
                      <button
                        onClick={handleCreateTestUser}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <User className="w-4 h-4 ml-2" />
                        إنشاء مستخدم تجريبي
                      </button>
                      <button
                        onClick={handleMigrateUsers}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <User className="w-4 h-4 ml-2" />
                        ترحيل المستخدمين
                      </button>
                      <button
                        onClick={() => setShowUserModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة مستخدم
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الاسم
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            البريد الإلكتروني
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الدور
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الحالة
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            تاريخ الإنشاء
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.fullName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === "ADMIN"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {user.role === "ADMIN" ? "مدير" : "موظف"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.isActive ? "نشط" : "غير نشط"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString(
                                "ar-EG-u-ca-gregory"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-reverse space-x-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "types" && <ComplaintTypeManager />}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    إعدادات النظام
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وقت الحل الافتراضي (أيام)
                      </label>
                      <input
                        type="number"
                        defaultValue={7}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عدد الشكاوى في الصفحة
                      </label>
                      <input
                        type="number"
                        defaultValue={20}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      حفظ الإعدادات
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Details Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  value={userForm.fullName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, fullName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الهاتف
                  </label>
                  <input
                    value={userForm.phone}
                    onChange={(e) =>
                      setUserForm({ ...userForm, phone: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرقم القومي
                  </label>
                  <input
                    value={userForm.nationalId}
                    onChange={(e) =>
                      setUserForm({ ...userForm, nationalId: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الدور
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value as any })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="EMPLOYEE">موظف</option>
                    <option value="ADMIN">مدير</option>
                  </select>
                </div>
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-reverse space-x-3">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  setIsEditing(false);
                  setUserForm({
                    fullName: "",
                    email: "",
                    phone: "",
                    nationalId: "",
                    role: "EMPLOYEE",
                    password: "",
                  });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={isEditing ? handleUpdateUser : handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                {isEditing ? "تحديث" : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      {showComplaintModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  تفاصيل الشكوى #{selectedComplaint.id.slice(-8)}
                </h2>
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المواطن
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedComplaint.complainant.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الهاتف
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedComplaint.complainant.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedComplaint.complainant.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الرقم القومي
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedComplaint.complainant.nationalId}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع الشكوى
                    </label>
                    <div className="flex items-center">
                      {getTypeIcon(selectedComplaint.type.icon)}
                      <span className="text-sm text-gray-900 mr-2">
                        {selectedComplaint.type.name}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحالة
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedComplaint.status
                      )}`}
                    >
                      {getStatusLabel(selectedComplaint.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ الإنشاء
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedComplaint.createdAt).toLocaleDateString(
                        "ar-EG-u-ca-gregory"
                      )}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedComplaint.location}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وصف الشكوى
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedComplaint.description || "لا يوجد وصف للشكوى"}
                  </p>
                </div>

                {/* Attachments */}
                {selectedComplaint.attachments &&
                  selectedComplaint.attachments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المرفقات
                      </label>
                      <div className="space-y-2">
                        {selectedComplaint.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center space-x-reverse space-x-2"
                          >
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-900"
                            >
                              {attachment.filename}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Internal Notes */}
                {selectedComplaint.internalNotes &&
                  selectedComplaint.internalNotes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الملاحظات الداخلية
                      </label>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        {selectedComplaint.internalNotes.map((note, index) => (
                          <p key={index} className="text-sm text-gray-900 mb-1">
                            {note}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Status Update Section */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    تحديث حالة الشكوى
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الحالة الجديدة
                      </label>
                      <select
                        value={statusUpdateForm.status}
                        onChange={(e) =>
                          setStatusUpdateForm({
                            ...statusUpdateForm,
                            status: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">اختر الحالة</option>
                        <option value="NEW">غير محلولة</option>
                        <option value="IN_PROGRESS">قيد المعالجة</option>

                        <option value="OVERDUE">متأخرة</option>
                        <option value="RESOLVED">تم الحل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ملاحظات (اختياري)
                      </label>
                      <input
                        type="text"
                        value={statusUpdateForm.notes}
                        onChange={(e) =>
                          setStatusUpdateForm({
                            ...statusUpdateForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="أضف ملاحظات حول التحديث..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleUpdateComplaintStatus}
                      disabled={!statusUpdateForm.status}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      تحديث الحالة
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
