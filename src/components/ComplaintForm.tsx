import React, { useState, useEffect } from "react";
import { FileText, Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient.ts";
import ReCaptcha from "./ReCaptcha";
import { 
  validatePhoneNumber, 
  validateNationalId, 
  validateEmail, 
  validateRequired,
  ValidationResult 
} from "../utils/validation";

interface ComplaintFormProps {
  onNavigate: (page: string) => void;
}

interface ComplaintType {
  id: string;
  name: string;
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
  const [files, setFiles] = useState<File[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);

  // Fallback types in case API fails
  const fallbackTypes: ComplaintType[] = [{ id: "other", name: "أخرى" }];
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingCodeState, setTrackingCodeState] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchComplaintTypes();
  }, []);

  const fetchComplaintTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("complaint_types")
        .select("id,name")
        .order("name", { ascending: true });
      if (!error && data) {
        const mapped = (data as any[]).map((t) => ({ id: t.id, name: t.name }));
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
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validate required fields
    const fullNameValidation = validateRequired(formData.fullName, "الاسم الكامل");
    if (!fullNameValidation.isValid) {
      errors.fullName = fullNameValidation.error!;
    }
    
    // Validate phone number
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error!;
    }
    
    // Validate email (optional)
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!;
    }
    
    // Validate national ID
    const nationalIdValidation = validateNationalId(formData.nationalId);
    if (!nationalIdValidation.isValid) {
      errors.nationalId = nationalIdValidation.error!;
    }
    
    // Validate complaint type
    const typeValidation = validateRequired(formData.typeId, "نوع الشكوى");
    if (!typeValidation.isValid) {
      errors.typeId = typeValidation.error!;
    }
    
    // Validate title
    const titleValidation = validateRequired(formData.title, "عنوان الشكوى");
    if (!titleValidation.isValid) {
      errors.title = titleValidation.error!;
    }
    
    // Validate description
    const descriptionValidation = validateRequired(formData.description, "وصف الشكوى");
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.error!;
    }
    
    // Validate location
    const locationValidation = validateRequired(formData.location, "الموقع");
    if (!locationValidation.isValid) {
      errors.location = locationValidation.error!;
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return false;
    }
    
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting complaint form...");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Rate limiting temporarily disabled for testing
      // TODO: Re-enable when proper rate limiting is configured

      // CAPTCHA validation temporarily disabled for testing
      // TODO: Re-enable when proper reCAPTCHA site key is configured

      // Upload the first image (optional)
      let imageUrl: string | null = null;
      if (files.length > 0) {
        const file = files[0];
        const fileExt = file.name.split(".").pop();
        const filePath = `${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("complaint-images")
          .upload(filePath, file, { upsert: false });
        if (uploadError) {
          console.warn(
            "Image upload failed, continuing without image:",
            uploadError.message
          );
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("complaint-images")
            .getPublicUrl(filePath);
          imageUrl = publicUrlData.publicUrl || null;
        }
      }

      // Insert complaint into simple public.complaints
      const { error: insertError } = await supabase.from("complaints").insert({
        name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        national_id: formData.nationalId,
        title: formData.title,
        details: formData.description,
        description: formData.description, // لبعض قواعد البيانات القديمة التي تشترط هذا العمود
        image_url: imageUrl,
        type_id: formData.typeId || null,
        address: formData.location,
        // status defaults to 'Pending'
      });

      if (insertError) {
        console.error("Complaint insert error:", insertError);
        
        // Handle specific constraint violations
        if (insertError.message?.includes('unique_name_national_id')) {
          throw new Error("هذا الرقم القومي مسجل بالفعل لشخص آخر. يرجى التأكد من صحة البيانات.");
        }
        
        if (insertError.message?.includes('check_national_id_length')) {
          throw new Error("الرقم القومي يجب أن يكون 14 رقم بالضبط");
        }
        
        if (insertError.message?.includes('check_phone_format')) {
          throw new Error("رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 01");
        }
        
        throw new Error(insertError.message || "فشل إرسال الشكوى");
      }

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
        setTrackingCodeState(null);
        setFieldErrors({});
      }, 5000);
    } catch (error: any) {
      console.error("Complaint submission error:", error);
      setError(error.message || "حدث خطأ أثناء إرسال الشكوى");
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
            {/* No tracking code in simple flow */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => {
                  console.log(
                    "Dashboard button clicked - navigating to citizen dashboard"
                  );
                  onNavigate("citizen-dashboard");
                }}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                الذهاب للوحة التحكم
              </button>
              <button
                onClick={() => {
                  console.log("Home button clicked - navigating to home");
                  onNavigate("home");
                }}
                className="border border-gray-300 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                العودة للرئيسية
              </button>
              <button
                onClick={() => {
                  console.log("New complaint button clicked - reloading page");
                  window.location.reload();
                }}
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
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                    fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="أدخل اسمك الكامل"
                />
                {fieldErrors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
                )}
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
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                    fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="01xxxxxxxxx"
                  maxLength={11}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                )}
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
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                    fieldErrors.nationalId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="14 رقم"
                  maxLength={14}
                />
                {fieldErrors.nationalId && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.nationalId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                )}
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
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                    fieldErrors.typeId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر نوع الشكوى</option>
                  {complaintTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.typeId && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.typeId}</p>
                )}
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
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                    fieldErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="عنوان مختصر للشكوى"
                />
                {fieldErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف الشكوى *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                    fieldErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="اشرح تفاصيل الشكوى بوضوح..."
                />
                {fieldErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموقع *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                    fieldErrors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="العنوان أو موقع المشكلة"
                />
                {fieldErrors.location && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الملفات المرفقة
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors"
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
              >
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
                className="flex-1 bg-blue-600 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg text-base sm:text-lg"
              >
                {loading ? "جاري الإرسال..." : "تقديم الشكوى"}
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Cancel button clicked - navigating to home");
                  onNavigate("home");
                }}
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-base sm:text-lg"
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
