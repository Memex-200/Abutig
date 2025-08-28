import React, { useState, useEffect } from "react";
import {
  FileText,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Wrench,
  Plus,
  Bell,
  Building,
  Shield,
  Lightbulb,
  Wifi,
  Leaf,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import NotificationCenter from "./NotificationCenter";
import { supabase } from "../utils/supabaseClient.ts";

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
}

const CitizenDashboard: React.FC = () => {
  const { complainant } = useAuth();
  const [impersonationName, setImpersonationName] = useState<string | null>(
    null
  );
  const impersonatedCitizenId =
    typeof window !== "undefined"
      ? localStorage.getItem("impersonatedCitizenId")
      : null;
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (impersonatedCitizenId) {
      // Admin impersonation path: fetch citizen by id first
      const loadImpersonated = async () => {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("id, full_name, phone, national_id")
            .eq("id", impersonatedCitizenId)
            .single();
          if (!error && data) {
            setImpersonationName(data.full_name || null);
            await fetchComplaintsByIdentity(data.national_id || "");
          }
        } catch (e) {
        } finally {
          setLoading(false);
        }
      };
      loadImpersonated();
    } else if (complainant) {
      fetchComplaints();
    } else {
      setLoading(false);
    }
  }, [complainant, impersonatedCitizenId]);

  const fetchComplaints = async () => {
    try {
      if (!complainant) {
        console.log("No complainant data, clearing complaints");
        setComplaints([]);
        return;
      }

      console.log(
        "Citizen fetching own complaints for:",
        complainant.nationalId
      );

      // Get complaints by national ID with complaint type relation
      const { data, error } = await supabase
        .from("complaints")
        .select(
          "id, created_at, name, phone, email, national_id, title, details, image_url, address, status, type:complaint_types(id, name, icon)"
        )
        .eq("national_id", complainant.nationalId || "")
        .order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = (data as any[])?.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.details,
          status: c.status,
          type: {
            id: c.type?.id || "",
            name: c.type?.name || "",
            icon: c.type?.icon || "",
          },
          createdAt: c.created_at,
          resolvedAt: c.resolved_at,
        }));
        setComplaints(mapped as any);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintsByIdentity = async (nationalId: string) => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(
          "id, created_at, name, phone, email, national_id, title, details, image_url, address, status, type:complaint_types(id, name, icon)"
        )
        .eq("national_id", nationalId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = (data as any[])?.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.details,
          status: c.status,
          type: {
            id: c.type?.id || "",
            name: c.type?.name || "",
            icon: c.type?.icon || "",
          },
          createdAt: c.created_at,
          resolvedAt: c.resolved_at,
        }));
        setComplaints(mapped as any);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UNRESOLVED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "BEING_RESOLVED":
        return "bg-purple-100 text-purple-800";
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
        return "قيد التنفيذ";
      case "BEING_RESOLVED":
        return "يتم حلها الآن";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "UNRESOLVED":
        return <AlertCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />;
      case "BEING_RESOLVED":
        return <Wrench className="w-4 h-4" />;
      case "NEW":
        return <AlertCircle className="w-4 h-4" />;
      case "OVERDUE":
        return <AlertTriangle className="w-4 h-4" />;
      case "RESOLVED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Impersonation banner */}
        {impersonatedCitizenId && (
          <div className="bg-yellow-100 border border-yellow-200 text-yellow-900 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div>
              أنت تشاهد كـ مواطن:{" "}
              {impersonationName ||
                localStorage.getItem("impersonatedCitizenName") ||
                ""}
            </div>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem("impersonatedCitizenId");
                  localStorage.removeItem("impersonatedCitizenName");
                } catch {}
                window.location.href = "/admin-dashboard";
              }}
              className="px-3 py-1 bg-yellow-600 text-white rounded"
            >
              إنهاء التجربة
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                أهلاً بك،{" "}
                {impersonatedCitizenId
                  ? impersonationName ||
                    localStorage.getItem("impersonatedCitizenName") ||
                    ""
                  : complainant?.fullName}
              </h1>
              <p className="text-gray-600 mt-1">
                تابع شكاواك وحالتها من خلال لوحة التحكم
              </p>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {complaints.length}
                </div>
                <div className="text-sm text-gray-600">إجمالي الشكاوى</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {complaints.filter((c) => c.status === "RESOLVED").length}
                </div>
                <div className="text-sm text-gray-600">تم حلها</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {
                    complaints.filter((c) =>
                      [
                        "UNRESOLVED",
                        "IN_PROGRESS",
                        "BEING_RESOLVED",
                        "NEW",
                      ].includes(c.status)
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">قيد المعالجة</div>
              </div>
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                شكاواي ({complaints.length})
              </h2>
              <button
                onClick={() => (window.location.href = "/complaint-form")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 ml-1" />
                شكوى جديدة
              </button>
            </div>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد شكاوى
              </h3>
              <p className="text-gray-600 mb-6">لم تقم بتقديم أي شكاوى بعد</p>
              <button
                onClick={() => (window.location.href = "/complaint-form")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                تقديم شكوى جديدة
              </button>
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
                      النوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ التقديم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaints.map((complaint) => (
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
                        <div className="flex items-center">
                          {getTypeIcon(complaint.type.icon)}
                          <span className="text-sm text-gray-900 mr-2">
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
                          {getStatusIcon(complaint.status)}
                          <span className="mr-1">
                            {getStatusLabel(complaint.status)}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(complaint.createdAt).toLocaleDateString(
                          "ar-EG"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    تفاصيل الشكوى
                  </h3>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedComplaint.title}
                  </h4>
                  <div className="flex items-center space-x-reverse space-x-4 mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        selectedComplaint.status
                      )}`}
                    >
                      {getStatusIcon(selectedComplaint.status)}
                      <span className="mr-1">
                        {getStatusLabel(selectedComplaint.status)}
                      </span>
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      {getTypeIcon(selectedComplaint.type.icon)}
                      <span className="mr-2">
                        {selectedComplaint.type.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    وصف الشكوى:
                  </h5>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      تاريخ التقديم:
                    </span>
                    <br />
                    <span className="text-gray-600">
                      {new Date(selectedComplaint.createdAt).toLocaleDateString(
                        "ar-EG",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  {selectedComplaint.resolvedAt && (
                    <div>
                      <span className="font-medium text-gray-700">
                        تاريخ الحل:
                      </span>
                      <br />
                      <span className="text-gray-600">
                        {new Date(
                          selectedComplaint.resolvedAt
                        ).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Center */}
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </div>
    </div>
  );
};

export default CitizenDashboard;
