import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, AlertCircle } from "lucide-react";
import { supabase } from "../utils/supabaseClient.ts";

interface ComplaintType {
  id: string;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
}

const ComplaintTypeManager: React.FC = () => {
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    fetchComplaintTypes();
  }, []);

  const fetchComplaintTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("complaint_types")
        .select("*")
        .order("name");

      if (error) {
        setError("فشل في جلب أنواع الشكاوى: " + error.message);
      } else {
        setComplaintTypes(data || []);
      }
    } catch (error) {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError("يرجى إدخال اسم نوع الشكوى");
      return;
    }

    try {
      console.log("Adding new complaint type:", formData);
      const { data, error } = await supabase
        .from("complaint_types")
        .insert([{ name: formData.name }])
        .select();

      if (error) {
        console.error("Error adding complaint type:", error);
        setError("فشل في إضافة نوع الشكوى: " + error.message);
      } else {
        console.log("Complaint type added successfully:", data);
        setShowAddForm(false);
        setFormData({ name: "" });
        fetchComplaintTypes();
        setError("");
        alert("تم إضافة نوع الشكوى بنجاح!");
      }
    } catch (error) {
      console.error("Exception in handleAdd:", error);
      setError("خطأ في الاتصال بالخادم");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim()) {
      setError("يرجى إدخال اسم نوع الشكوى");
      return;
    }

    try {
      const { error } = await supabase
        .from("complaint_types")
        .update({ name: formData.name })
        .eq("id", id);

      if (error) {
        setError("فشل في تحديث نوع الشكوى: " + error.message);
      } else {
        setEditingId(null);
        setFormData({ name: "" });
        fetchComplaintTypes();
        setError("");
      }
    } catch (error) {
      setError("خطأ في الاتصال بالخادم");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا النوع؟")) return;

    try {
      console.log("Deleting complaint type:", id);
      const { error } = await supabase
        .from("complaint_types")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting complaint type:", error);
        setError("فشل في حذف نوع الشكوى: " + error.message);
      } else {
        console.log("Complaint type deleted successfully");
        fetchComplaintTypes();
        setError("");
        alert("تم حذف نوع الشكوى بنجاح!");
      }
    } catch (error) {
      console.error("Exception in handleDelete:", error);
      setError("خطأ في الاتصال بالخادم");
    }
  };

  const startEdit = (type: ComplaintType) => {
    setEditingId(type.id);
    setFormData({
      name: type.name,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: "" });
    setError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          إدارة أنواع الشكاوى
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة نوع جديد
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">إضافة نوع شكوى جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="اسم نوع الشكوى"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Save className="w-4 h-4 ml-2" />
              حفظ
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center"
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Complaint Types List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                الاسم
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {complaintTypes.map((type) => (
              <tr key={type.id}>
                <td className="px-4 py-3">
                  {editingId === type.id ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <span className="font-medium">{type.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === type.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(type.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(type)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {complaintTypes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          لا توجد أنواع شكاوى مضافة بعد
        </div>
      )}
    </div>
  );
};

export default ComplaintTypeManager;
