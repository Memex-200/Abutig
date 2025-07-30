import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface Stats {
  overview: {
    totalComplaints: number;
    newComplaints: number;
    inProgressComplaints: number;
    resolvedComplaints: number;
    complaintsThisMonth: number;
    complaintsLastMonth: number;
    growthPercentage: number;
  };
  charts: {
    complaintsByType: { type: string; count: number }[];
    complaintsByStatus: { status: string; count: number }[];
  };
  recentComplaints: any[];
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    assignedComplaints: number;
  };
}

interface ComplaintType {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  type: {
    name: string;
    icon: string;
  };
  complainant: {
    fullName: string;
    phone: string;
    email?: string;
  };
  assignedTo?: {
    fullName: string;
  };
  createdAt: string;
  resolvedAt?: string;
  files?: { id: string; filename: string; originalName: string }[];
  logs?: {
    id: string;
    user: { fullName: string };
    notes: string;
    createdAt: string;
  }[];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "complaints" | "users" | "types" | "reports"
  >("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingType, setEditingType] = useState<ComplaintType | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedComplaintForAssign, setSelectedComplaintForAssign] =
    useState<Complaint | null>(null);
  const [selectedComplaintForView, setSelectedComplaintForView] =
    useState<Complaint | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    role: "EMPLOYEE",
    password: "",
  });

  const [newType, setNewType] = useState({
    name: "",
    description: "",
    icon: "",
  });

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchComplaintTypes();
    if (activeTab === "complaints") {
      fetchComplaints();
      fetchEmployees();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:3001/api/stats/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("authToken");
      let url = "http://localhost:3001/api/complaints?";

      const params = new URLSearchParams();
      params.append("limit", "100");

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(url + params.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setComplaints(result.complaints);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const fetchComplaintDetails = async (complaintId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:3001/api/complaints/${complaintId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const complaintDetails = await response.json();
        setSelectedComplaintForView(complaintDetails);
      }
    } catch (error) {
      console.error("Error fetching complaint details:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3001/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchComplaintTypes = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/types");
      if (response.ok) {
        const typesData = await response.json();
        setComplaintTypes(typesData);
      }
    } catch (error) {
      console.error("Error fetching types:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:3001/api/users/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const employeesData = await response.json();
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const assignComplaint = async () => {
    if (!selectedEmployee || !selectedComplaintForAssign) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:3001/api/complaints/${selectedComplaintForAssign.id}/assign`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assignedToId: selectedEmployee }),
        }
      );

      if (response.ok) {
        fetchComplaints();
        setShowAssignModal(false);
        setSelectedComplaintForAssign(null);
        setSelectedEmployee("");
      }
    } catch (error) {
      console.error("Error assigning complaint:", error);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        fetchUsers();
        setShowUserModal(false);
        setNewUser({
          fullName: "",
          email: "",
          phone: "",
          nationalId: "",
          role: "EMPLOYEE",
          password: "",
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const createComplaintType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3001/api/types", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newType),
      });

      if (response.ok) {
        fetchComplaintTypes();
        setShowTypeModal(false);
        setNewType({
          name: "",
          description: "",
          icon: "",
        });
      }
    } catch (error) {
      console.error("Error creating type:", error);
    }
  };

  const exportComplaints = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:3001/api/complaints/export/excel",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "complaints.xlsx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting complaints:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NEW":
        return "جديد";
      case "UNDER_REVIEW":
        return "قيد المراجعة";
      case "IN_PROGRESS":
        return "جار المعالجة";
      case "RESOLVED":
        return "تم الحل";
      case "REJECTED":
        return "مرفوض";
      case "CLOSED":
        return "مغلق";
      default:
        return status;
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (
      searchTerm &&
      !complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !complaint.complainant.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const renderComplaints = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة الشكاوى</h2>
        <button
          onClick={exportComplaints}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
        >
          <Download className="w-4 h-4 ml-1" />
          تصدير Excel
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الشكاوى..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Filter className="w-4 h-4 text-gray-500 ml-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الحالات</option>
                <option value="NEW">جديد</option>
                <option value="UNDER_REVIEW">قيد المراجعة</option>
                <option value="IN_PROGRESS">جار المعالجة</option>
                <option value="RESOLVED">تم الحل</option>
                <option value="REJECTED">مرفوض</option>
              </select>
            </div>
            <button
              onClick={fetchComplaints}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              تحديث
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد شكاوى
            </h3>
            <p className="text-gray-600">
              لا توجد شكاوى تطابق معايير البحث المحددة
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الشكوى
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المشتكي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المخصص إليه
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
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {complaint.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.complainant.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {complaint.complainant.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-lg ml-2">
                          {complaint.type.icon}
                        </span>
                        <span className="text-sm text-gray-900">
                          {complaint.type.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          complaint.status
                        )}`}
                      >
                        {getStatusLabel(complaint.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {complaint.assignedTo?.fullName || "غير محدد"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(complaint.createdAt).toLocaleDateString(
                        "ar-EG"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-reverse space-x-2">
                        <button
                          onClick={() => fetchComplaintDetails(complaint.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </button>
                        {!complaint.assignedTo && (
                          <button
                            onClick={() => {
                              setSelectedComplaintForAssign(complaint);
                              setShowAssignModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <UserCheck className="w-4 h-4 ml-1" />
                            تخصيص
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">
                إجمالي الشكاوى
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.overview.totalComplaints}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">شكاوى جديدة</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.overview.newComplaints}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">قيد المعالجة</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.overview.inProgressComplaints}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">تم حلها</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.overview.resolvedComplaints}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              نمو الشكاوى الشهري
            </h3>
            <p className="text-gray-600">مقارنة مع الشهر الماضي</p>
          </div>
          <div className="flex items-center">
            <TrendingUp
              className={`w-6 h-6 ml-2 ${
                (stats?.overview.growthPercentage || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            />
            <span
              className={`text-2xl font-bold ${
                (stats?.overview.growthPercentage || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {stats?.overview.growthPercentage > 0 ? "+" : ""}
              {stats?.overview.growthPercentage}%
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">هذا الشهر</p>
            <p className="text-xl font-semibold">
              {stats?.overview.complaintsThisMonth}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">الشهر الماضي</p>
            <p className="text-xl font-semibold">
              {stats?.overview.complaintsLastMonth}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            الشكاوى حسب النوع
          </h3>
          <div className="space-y-3">
            {stats?.charts.complaintsByType.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.type}</span>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            الشكاوى حسب الحالة
          </h3>
          <div className="space-y-3">
            {stats?.charts.complaintsByStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.status}</span>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            الشكاوى الحديثة
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العنوان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المشتكي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.recentComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {complaint.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {complaint.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {complaint.complainant}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(complaint.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h2>
        <button
          onClick={() => setShowUserModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 ml-1" />
          إضافة مستخدم
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الشكاوى المخصصة
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
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.fullName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role === "ADMIN" ? "مدير" : "موظف"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user._count.assignedComplaints}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.isActive ? "نشط" : "غير نشط"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 ml-2">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTypes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          إدارة أنواع الشكاوى
        </h2>
        <button
          onClick={() => setShowTypeModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 ml-1" />
          إضافة نوع
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaintTypes.map((type) => (
          <div key={type.id} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl ml-3">{type.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {type.name}
                  </h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
              <div className="flex space-x-reverse space-x-2">
                <button className="text-blue-600 hover:text-blue-900">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-red-600 hover:text-red-900">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                type.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {type.isActive ? "نشط" : "غير نشط"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                تصدير الشكاوى
              </h3>
              <p className="text-sm text-gray-600">
                تصدير جميع الشكاوى إلى Excel
              </p>
            </div>
            <Download className="w-8 h-8 text-blue-600" />
          </div>
          <button
            onClick={exportComplaints}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            تصدير Excel
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                تقرير شهري
              </h3>
              <p className="text-sm text-gray-600">إحصائيات الشهر الحالي</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
          <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
            عرض التقرير
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                تقرير الأداء
              </h3>
              <p className="text-sm text-gray-600">أداء الموظفين والمعالجة</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
          <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors">
            عرض الأداء
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-10 h-10 text-blue-600 bg-blue-100 rounded-full p-2 ml-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  لوحة تحكم المدير
                </h1>
                <p className="text-gray-600 mt-1">أهلاً بك، {user?.fullName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-reverse space-x-8 px-6">
              {[
                { key: "overview", label: "نظرة عامة", icon: BarChart3 },
                { key: "complaints", label: "الشكاوى", icon: FileText },
                { key: "users", label: "المستخدمين", icon: Users },
                { key: "types", label: "أنواع الشكاوى", icon: Settings },
                { key: "reports", label: "التقارير", icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4 ml-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "complaints" && renderComplaints()}
          {activeTab === "users" && renderUsers()}
          {activeTab === "types" && renderTypes()}
          {activeTab === "reports" && renderReports()}
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  إضافة مستخدم جديد
                </h3>
              </div>

              <form onSubmit={createUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرقم القومي
                  </label>
                  <input
                    type="text"
                    value={newUser.nationalId}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        nationalId: e.target.value,
                      }))
                    }
                    required
                    maxLength={14}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الدور
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EMPLOYEE">موظف</option>
                    <option value="ADMIN">مدير</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Type Modal */}
        {showTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  إضافة نوع شكوى جديد
                </h3>
              </div>

              <form onSubmit={createComplaintType} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم النوع
                  </label>
                  <input
                    type="text"
                    value={newType.name}
                    onChange={(e) =>
                      setNewType((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف
                  </label>
                  <textarea
                    value={newType.description}
                    onChange={(e) =>
                      setNewType((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الأيقونة
                  </label>
                  <input
                    type="text"
                    value={newType.icon}
                    onChange={(e) =>
                      setNewType((prev) => ({ ...prev, icon: e.target.value }))
                    }
                    placeholder="🏚️"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-reverse space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTypeModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignModal && selectedComplaintForAssign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  تخصيص الشكوى
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedComplaintForAssign.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedComplaintForAssign.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر الموظف
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر موظف...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.fullName} -{" "}
                        {employee._count.assignedComplaints} شكاوى مخصصة
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-reverse space-x-3 pt-4">
                  <button
                    onClick={assignComplaint}
                    disabled={!selectedEmployee}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    تخصيص
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedComplaintForAssign(null);
                      setSelectedEmployee("");
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Details Modal */}
        {selectedComplaintForView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    تفاصيل الشكوى
                  </h3>
                  <button
                    onClick={() => setSelectedComplaintForView(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedComplaintForView.title}
                  </h4>
                  <div className="flex items-center space-x-reverse space-x-4 mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        selectedComplaintForView.status
                      )}`}
                    >
                      {getStatusLabel(selectedComplaintForView.status)}
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="text-lg ml-2">
                        {selectedComplaintForView.type.icon}
                      </span>
                      {selectedComplaintForView.type.name}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    وصف الشكوى:
                  </h5>
                  <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedComplaintForView.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      معلومات المشتكي:
                    </h5>
                    <p className="text-gray-600">
                      <strong>الاسم:</strong>{" "}
                      {selectedComplaintForView.complainant.fullName}
                      <br />
                      <strong>الهاتف:</strong>{" "}
                      {selectedComplaintForView.complainant.phone}
                      <br />
                      <strong>البريد الإلكتروني:</strong>{" "}
                      {selectedComplaintForView.complainant.email || "غير محدد"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      معلومات الشكوى:
                    </h5>
                    <p className="text-gray-600">
                      <strong>تاريخ التقديم:</strong>{" "}
                      {new Date(
                        selectedComplaintForView.createdAt
                      ).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <br />
                      <strong>الموظف المخصص:</strong>{" "}
                      {selectedComplaintForView.assignedTo?.fullName ||
                        "غير محدد"}
                      <br />
                      {selectedComplaintForView.resolvedAt && (
                        <>
                          <strong>تاريخ الحل:</strong>{" "}
                          {new Date(
                            selectedComplaintForView.resolvedAt
                          ).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {selectedComplaintForView.files &&
                  selectedComplaintForView.files.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        الملفات المرفقة:
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedComplaintForView.files.map((file: any) => (
                          <div
                            key={file.id}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <a
                              href={`http://localhost:3001/uploads/${file.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {file.originalName}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedComplaintForView.logs &&
                  selectedComplaintForView.logs.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        سجل التحديثات:
                      </h5>
                      <div className="space-y-2">
                        {selectedComplaintForView.logs.map((log: any) => (
                          <div
                            key={log.id}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {log.user.fullName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleDateString(
                                  "ar-EG"
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedComplaintForView(null)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
