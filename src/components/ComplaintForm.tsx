import React, { useState, useEffect } from "react";
import { FileText, Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient.ts";

interface ComplaintFormProps {
  onNavigate: (page: string) => void;
}

interface ComplaintType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ onNavigate }) => {
  const { loginComplainant } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    nationalId: "",
    email: "",
    typeId: "",
    title: "",
    description: "",
    location: "",
  });
  const [nationalIdError, setNationalIdError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);

  // Fallback types in case API fails
  const fallbackTypes: ComplaintType[] = [
    {
      id: "1",
      name: "مخالفات البناء",
      description: "مخالفات البناء والبناء بدون ترخيص",
      icon: "🏗️",
    },
    {
      id: "2",
      name: "مشاكل الصرف الصحي",
      description: "مشاكل في شبكة الصرف الصحي والصرف",
      icon: "🚽",
    },
    {
      id: "3",
      name: "النظافة وجمع القمامة",
      description: "شكاوى النظافة العامة وجمع القمامة",
      icon: "🗑️",
    },
    {
      id: "4",
      name: "إنارة الشوارع والكهرباء",
      description: "مشاكل في إنارة الشوارع والكهرباء",
      icon: "💡",
    },
    {
      id: "5",
      name: "صيانة الطرق",
      description: "صيانة الطرق والأرصفة",
      icon: "🛣️",
    },
    {
      id: "6",
      name: "مشاكل إمداد المياه",
      description: "مشاكل في إمداد وتوزيع المياه",
      icon: "💧",
    },
    {
      id: "7",
      name: "مشاكل المرور والمواقف",
      description: "إشارات المرور ومشاكل المواقف",
      icon: "🚗",
    },
    {
      id: "8",
      name: "الحدائق والمساحات الخضراء",
      description: "صيانة الحدائق العامة والمساحات الخضراء",
      icon: "🌳",
    },
    {
      id: "9",
      name: "شكاوى الضوضاء",
      description: "شكاوى الضوضاء والإزعاج",
      icon: "🔊",
    },
    {
      id: "10",
      name: "الأمان والسلامة العامة",
      description: "مخاوف الأمان والسلامة العامة",
      icon: "🛡️",
    },
    {
      id: "11",
      name: "أخرى",
      description: "شكاوى أخرى لا تنتمي للفئات السابقة",
      icon: "📝",
    },
  ];
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComplaintTypes();
  }, []);

  const fetchComplaintTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("complaint_types")
        .select("id,name,description,icon")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (!error && data) {
        const mapped = (data as any[]).map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          icon: t.icon,
        }));
        setComplaintTypes(mapped);
      } else {
        setComplaintTypes(fallbackTypes);
      }
    } catch (error) {
      setComplaintTypes(fallbackTypes);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "nationalId") {
      const digitsOnly = value.replace(/[^0-9]/g, "");
      if (digitsOnly !== value) {
        setFormData((prev) => ({ ...prev, nationalId: digitsOnly }));
      }
      if (digitsOnly.length !== 14) {
        setNationalIdError("الرقم القومي يجب أن يكون 14 رقمًا");
      } else {
        setNationalIdError("");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      setError("يمكن رفع 5 ملفات كحد أقصى");
      return;
    }
    setFiles((prev) => [...prev, ...selectedFiles]);
    setError("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!/^\d{14}$/.test(formData.nationalId)) {
        setError("الرقم القومي غير صالح. يجب أن يكون 14 رقمًا.");
        setLoading(false);
        return;
      }

      // First, create or get the citizen user
      let citizenId: string;

      // Check if citizen exists
      const { data: existingCitizen, error: citizenCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("national_id", formData.nationalId)
        .eq("phone", formData.phone)
        .single();

      if (existingCitizen) {
        citizenId = existingCitizen.id;
      } else {
        // Create new citizen user
        const { data: newCitizen, error: newCitizenError } = await supabase
          .from("users")
          .insert({
            full_name: formData.fullName,
            phone: formData.phone,
            national_id: formData.nationalId,
            email: formData.email || null,
            role: "CITIZEN",
            is_active: true,
          })
          .select("id")
          .single();

        if (newCitizenError) {
          console.error("Citizen creation error:", newCitizenError);
          throw new Error("فشل إنشاء ملف المواطن");
        }
        citizenId = newCitizen.id;
      }

      // Insert complaint
      const { data: complaintData, error: complaintError } = await supabase
        .from("complaints")
        .insert({
          citizen_id: citizenId,
          type_id: formData.typeId,
          title: formData.title,
          description: formData.description,
          location: formData.location || null,
          status: "NEW",
          national_id: formData.nationalId,
        })
        .select("id")
        .single();

      if (complaintError) {
        console.error("Complaint insert error:", complaintError);
        throw new Error(complaintError.message || "فشل إرسال الشكوى");
      }

      const complaintId = complaintData.id;

      // Upload files to Supabase Storage (optional)
      if (files.length > 0) {
        for (const file of files) {
          const path = `${complaintId}/${Date.now()}-${file.name}`;
          const upload = await supabase.storage
            .from("complaint-files")
            .upload(path, file, {
              upsert: false,
            });
          if (!upload.error) {
            await supabase.from("complaint_files").insert({
              complaint_id: complaintId,
              file_path: path,
              file_type: file.type,
              file_size: file.size,
            });
          }
        }
      }

      // Auto-login citizen context (create complainant object from submitted data)
      const complainantData = {
        id: complaintId, // Use complaint ID as temporary ID
        fullName: formData.fullName,
        phone: formData.phone,
        nationalId: formData.nationalId,
      };
      loginComplainant(complainantData, "");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          fullName: "",
          phone: "",
          nationalId: "",
          email: "",
          typeId: "",
          title: "",
          description: "",
          location: "",
        });
        setFiles([]);
      }, 3000);
    } catch (error) {
      setError("خطأ في الاتصال بالخادم");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              تم تقديم الشكوى بنجاح!
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
              شكراً لك على تقديم الشكوى. سيتم مراجعتها والرد عليك في أقرب وقت
              ممكن.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => onNavigate("citizen")}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                الذهاب للوحة التحكم
              </button>
              <button
                onClick={() => onNavigate("home")}
                className="border border-gray-300 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                العودة للرئيسية
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border border-gray-300 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                تقديم شكوى أخرى
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 sm:p-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 ml-2 sm:ml-3" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  تقديم شكوى جديدة
                </h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">
                  املأ النموذج التالي لتقديم شكوى للمجلس البلدي
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 ml-2 mt-0.5 flex-shrink-0" />
                <span className="text-red-700 text-sm sm:text-base">
                  {error}
                </span>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرقم القومي *
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleInputChange}
                  required
                  maxLength={14}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="14 رقم"
                />
                {nationalIdError && (
                  <p className="mt-1 text-xs text-red-600">{nationalIdError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* Complaint Information */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الشكوى *
                </label>
                <select
                  name="typeId"
                  value={formData.typeId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">اختر نوع الشكوى</option>
                  {complaintTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الشكوى *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="عنوان مختصر للشكوى"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف الشكوى *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="اشرح تفاصيل الشكوى بوضوح..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموقع (اختياري)
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="العنوان أو موقع المشكلة"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الملفات المرفقة (اختياري)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 mb-2 text-sm sm:text-base">
                  اسحب الملفات هنا أو انقر للاختيار
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  PNG, JPG, PDF (حتى 5MB لكل ملف)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  اختيار الملفات
                </label>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                {loading ? "جاري الإرسال..." : "تقديم الشكوى"}
              </button>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintForm;
