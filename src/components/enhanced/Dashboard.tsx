import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search,
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
  RefreshCw,
  Plus,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient.ts";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Table, Column } from "../ui/Table";
import { Modal } from "../ui/Modal";

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
  trackingCode: string;
}

interface DashboardStats {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  overdueComplaints: number;
  averageResolutionTime: number;
  complaintsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  complaintsByStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    complaintTitle: string;
    timestamp: string;
    user: string;
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    priority: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentPage, sortColumn, sortDirection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchComplaints(), fetchStats()]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      let query = supabase
        .from("complaints")
        .select(
          `
          id,
          title,
          description,
          status,
          priority,
          location,
          tracking_code,
          created_at,
          resolved_at,
          type:complaint_types(id, name, icon),
          complainant:users!complaints_citizen_id_fkey(id, full_name, phone, email, role),
          assigned_to:users!complaints_assigned_user_id_fkey(id, full_name)
        `
        )
        .order(sortColumn, { ascending: sortDirection === "asc" });

      // Apply filters
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.type) query = query.eq("type_id", filters.type);
      if (filters.priority) query = query.eq("priority", filters.priority);
      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      const formattedComplaints =
        data?.map((complaint) => ({
          id: complaint.id,
          title: complaint.title,
          description: complaint.description,
          status: complaint.status,
          type: complaint.type,
          createdAt: complaint.created_at,
          resolvedAt: complaint.resolved_at,
          complainant: complaint.complainant,
          assignedTo: complaint.assigned_to,
          priority: complaint.priority,
          location: complaint.location,
          trackingCode: complaint.tracking_code,
        })) || [];

      setComplaints(formattedComplaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: complaintsData, error } = await supabase
        .from("complaints")
        .select(
          "status, type_id, created_at, resolved_at, type:complaint_types(name)"
        );

      if (error) throw error;

      const totalComplaints = complaintsData.length;
      const pendingComplaints = complaintsData.filter(
        (c) => c.status === "NEW" || c.status === "IN_PROGRESS"
      ).length;
      const resolvedComplaints = complaintsData.filter(
        (c) => c.status === "RESOLVED"
      ).length;
      const overdueComplaints = complaintsData.filter(
        (c) => c.status === "OVERDUE"
      ).length;

      // Calculate average resolution time
      const resolvedComplaintsWithTime = complaintsData.filter(
        (c) => c.resolved_at && c.created_at
      );
      const totalResolutionTime = resolvedComplaintsWithTime.reduce(
        (acc, complaint) => {
          const created = new Date(complaint.created_at);
          const resolved = new Date(complaint.resolved_at!);
          return acc + (resolved.getTime() - created.getTime());
        },
        0
      );
      const averageResolutionTime =
        resolvedComplaintsWithTime.length > 0
          ? Math.round(
              totalResolutionTime /
                resolvedComplaintsWithTime.length /
                (1000 * 60 * 60 * 24)
            ) // Convert to days
          : 0;

      // Complaints by type
      const typeCounts = complaintsData.reduce((acc, complaint) => {
        const typeName = complaint.type?.name || "غير محدد";
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const complaintsByType = Object.entries(typeCounts).map(
        ([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / totalComplaints) * 100),
        })
      );

      // Complaints by status
      const statusCounts = complaintsData.reduce((acc, complaint) => {
        acc[complaint.status] = (acc[complaint.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusColors = {
        NEW: "bg-blue-500",
        IN_PROGRESS: "bg-yellow-500",
        RESOLVED: "bg-green-500",
        OVERDUE: "bg-red-500",
      };

      const complaintsByStatus = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status,
          count,
          color:
            statusColors[status as keyof typeof statusColors] || "bg-gray-500",
        })
      );

      setStats({
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        overdueComplaints,
        averageResolutionTime,
        complaintsByType,
        complaintsByStatus,
        recentActivity: [], // This would be populated from complaint_history table
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleComplaintClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowComplaintModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NEW: { color: "bg-blue-100 text-blue-800", text: "جديد" },
      IN_PROGRESS: {
        color: "bg-yellow-100 text-yellow-800",
        text: "قيد المعالجة",
      },
      RESOLVED: { color: "bg-green-100 text-green-800", text: "تم الحل" },
      OVERDUE: { color: "bg-red-100 text-red-800", text: "متأخر" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig["NEW"];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { color: "bg-gray-100 text-gray-800", text: "منخفض" },
      MEDIUM: { color: "bg-yellow-100 text-yellow-800", text: "متوسط" },
      HIGH: { color: "bg-red-100 text-red-800", text: "عالي" },
    };

    const config =
      priorityConfig[priority as keyof typeof priorityConfig] ||
      priorityConfig["MEDIUM"];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const columns: Column<Complaint>[] = [
    {
      key: "trackingCode",
      header: "رقم التتبع",
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: "title",
      header: "العنوان",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.type.name}</div>
        </div>
      ),
    },
    {
      key: "complainant",
      header: "مقدم الشكوى",
      render: (value) => (
        <div>
          <div className="font-medium text-gray-900">{value.fullName}</div>
          <div className="text-sm text-gray-500">{value.phone}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      render: (value) => getStatusBadge(value),
    },
    {
      key: "priority",
      header: "الأولوية",
      render: (value) => getPriorityBadge(value),
    },
    {
      key: "createdAt",
      header: "تاريخ التقديم",
      render: (value) => (
        <div className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString("ar-EG")}
        </div>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "الإجراءات",
      render: (_, row) => (
        <div className="flex space-x-2 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleComplaintClick(row)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            عرض
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-600 mt-1">
              مرحباً {user?.fullName}، إليك نظرة عامة على النظام
            </p>
          </div>
          <Button
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            variant="outline"
          >
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ml-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    إجمالي الشكاوى
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalComplaints}
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center ml-4">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    قيد المعالجة
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingComplaints}
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center ml-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">تم الحل</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.resolvedComplaints}
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center ml-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">متأخر</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.overdueComplaints}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Input
              placeholder="البحث..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الحالات</option>
              <option value="NEW">جديد</option>
              <option value="IN_PROGRESS">قيد المعالجة</option>
              <option value="RESOLVED">تم الحل</option>
              <option value="OVERDUE">متأخر</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الأولويات</option>
              <option value="LOW">منخفض</option>
              <option value="MEDIUM">متوسط</option>
              <option value="HIGH">عالي</option>
            </select>

            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
            />

            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
            />

            <Button
              onClick={() =>
                setFilters({
                  status: "",
                  type: "",
                  priority: "",
                  dateFrom: "",
                  dateTo: "",
                  search: "",
                })
              }
              variant="outline"
              leftIcon={<Filter className="w-4 h-4" />}
            >
              مسح الفلاتر
            </Button>
          </div>
        </Card>

        {/* Complaints Table */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">الشكاوى</h2>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                /* Navigate to complaint form */
              }}
            >
              شكوى جديدة
            </Button>
          </div>

          <Table
            data={complaints}
            columns={columns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onRowClick={handleComplaintClick}
            emptyMessage="لا توجد شكاوى"
          />

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-700">
              عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
              {Math.min(currentPage * itemsPerPage, complaints.length)} من{" "}
              {complaints.length} نتيجة
            </p>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={complaints.length < itemsPerPage}
              >
                التالي
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Complaint Details Modal */}
      <Modal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        title="تفاصيل الشكوى"
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  معلومات الشكوى
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>رقم التتبع:</strong>{" "}
                    {selectedComplaint.trackingCode}
                  </p>
                  <p>
                    <strong>العنوان:</strong> {selectedComplaint.title}
                  </p>
                  <p>
                    <strong>النوع:</strong> {selectedComplaint.type.name}
                  </p>
                  <p>
                    <strong>الحالة:</strong>{" "}
                    {getStatusBadge(selectedComplaint.status)}
                  </p>
                  <p>
                    <strong>الأولوية:</strong>{" "}
                    {getPriorityBadge(selectedComplaint.priority)}
                  </p>
                  <p>
                    <strong>الموقع:</strong> {selectedComplaint.location}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  معلومات مقدم الشكوى
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>الاسم:</strong>{" "}
                    {selectedComplaint.complainant.fullName}
                  </p>
                  <p>
                    <strong>الهاتف:</strong>{" "}
                    {selectedComplaint.complainant.phone}
                  </p>
                  <p>
                    <strong>البريد الإلكتروني:</strong>{" "}
                    {selectedComplaint.complainant.email}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">تفاصيل الشكوى</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {selectedComplaint.description}
              </p>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setShowComplaintModal(false)}
              >
                إغلاق
              </Button>
              <Button
                onClick={() => {
                  /* Handle edit */
                }}
              >
                تعديل
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
