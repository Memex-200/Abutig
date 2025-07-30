import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User,
  Filter,
  Search,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  };
  assignedTo?: {
    fullName: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('authToken');
      let url = 'http://localhost:3001/api/complaints?';
      
      const params = new URLSearchParams();
      params.append('limit', '50');
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(url + params.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setComplaints(result.complaints);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: string, notes?: string) => {
    setUpdateLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, notes })
      });

      if (response.ok) {
        fetchComplaints();
        setSelectedComplaint(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return 'جديد';
      case 'UNDER_REVIEW': return 'قيد المراجعة';
      case 'IN_PROGRESS': return 'جار المعالجة';
      case 'RESOLVED': return 'تم الحل';
      case 'REJECTED': return 'مرفوض';
      case 'CLOSED': return 'مغلق';
      default: return status;
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (searchTerm && !complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !complaint.complainant.fullName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-10 h-10 text-blue-600 bg-blue-100 rounded-full p-2 ml-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  لوحة تحكم الموظف
                </h1>
                <p className="text-gray-600 mt-1">
                  أهلاً بك، {user?.fullName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {complaints.filter(c => c.status === 'NEW').length}
                </div>
                <div className="text-sm text-gray-600">شكاوى جديدة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {complaints.filter(c => ['UNDER_REVIEW', 'IN_PROGRESS'].includes(c.status)).length}
                </div>
                <div className="text-sm text-gray-600">قيد المعالجة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {complaints.filter(c => c.status === 'RESOLVED').length}
                </div>
                <div className="text-sm text-gray-600">تم حلها</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
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

        {/* Complaints Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد شكاوى مخصصة لك
              </h3>
              <p className="text-gray-600">
                سيتم إعلامك عند تخصيص شكاوى جديدة لك
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
                          <span className="text-lg ml-2">{complaint.type.icon}</span>
                          <span className="text-sm text-gray-900">{complaint.type.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(complaint.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          معالجة
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
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    معالجة الشكوى
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
                {/* Complaint Info */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedComplaint.title}
                  </h4>
                  <div className="flex items-center space-x-reverse space-x-4 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedComplaint.status)}`}>
                      {getStatusLabel(selectedComplaint.status)}
                    </span>  
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="text-lg ml-2">{selectedComplaint.type.icon}</span>
                      {selectedComplaint.type.name}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">وصف الشكوى:</h5>
                  <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">معلومات المشتكي:</h5>
                    <p className="text-gray-600">
                      <strong>الاسم:</strong> {selectedComplaint.complainant.fullName}<br />
                      <strong>الهاتف:</strong> {selectedComplaint.complainant.phone}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">تاريخ التقديم:</h5>
                    <p className="text-gray-600">
                      {new Date(selectedComplaint.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-4">تحديث حالة الشكوى:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.status === 'NEW' && (
                      <>
                        <button
                          onClick={() => updateComplaintStatus(selectedComplaint.id, 'UNDER_REVIEW')}
                          disabled={updateLoading}
                          className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          بدء المراجعة
                        </button>
                        <button
                          onClick={() => updateComplaintStatus(selectedComplaint.id, 'IN_PROGRESS')}
                          disabled={updateLoading}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          بدء المعالجة
                        </button>
                      </>
                    )}
                    {['UNDER_REVIEW', 'IN_PROGRESS'].includes(selectedComplaint.status) && (
                      <>
                        <button
                          onClick={() => updateComplaintStatus(selectedComplaint.id, 'RESOLVED')}
                          disabled={updateLoading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          تم الحل
                        </button>
                        <button
                          onClick={() => updateComplaintStatus(selectedComplaint.id, 'REJECTED')}
                          disabled={updateLoading}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          رفض الشكوى
                        </button>
                      </>
                    )}
                  </div>
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
      </div>
    </div>
  );
};

export default EmployeeDashboard;