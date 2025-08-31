import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  User,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient.ts";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import {
  validateInput,
  sanitizeInput,
  checkRateLimit,
} from "../../utils/security.ts";
import {
  validatePhoneNumber,
  validateNationalId,
  validateEmail,
  validateRequired,
  ValidationResult,
} from "../../utils/validation";
import ReCaptcha from "../ReCaptcha";

interface ComplaintFormProps {
  onNavigate: (page: string) => void;
}

interface ComplaintType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface FormData {
  fullName: string;
  phone: string;
  nationalId: string;
  email: string;
  typeId: string;
  title: string;
  description: string;
  location: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  nationalId?: string;
  email?: string;
  typeId?: string;
  title?: string;
  description?: string;
  location?: string;
  general?: string;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ onNavigate }) => {
  const { loginComplainant } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    nationalId: "",
    email: "",
    typeId: "",
    title: "",
    description: "",
    location: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaintTypes();
  }, []);

  const fetchComplaintTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("complaint_types")
        .select("id, name, icon, description")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!error && data) {
        setComplaintTypes(data);
      }
    } catch (error) {
      console.error("Error fetching complaint types:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Check rate limiting
    if (!checkRateLimit("complaint-submission", 3, 300000)) {
      newErrors.general =
        "تم تجاوز الحد المسموح لتقديم الشكاوى. يرجى المحاولة بعد 5 دقائق";
    }

    // Validate required fields
    const fullNameValidation = validateRequired(
      formData.fullName,
      "الاسم الكامل"
    );
    if (!fullNameValidation.isValid) {
      newErrors.fullName = fullNameValidation.error!;
    } else if (!validateInput.name(formData.fullName)) {
      newErrors.fullName = "الاسم يجب أن يحتوي على أحرف عربية فقط";
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error!;
    }

    // Validate national ID
    const nationalIdValidation = validateNationalId(formData.nationalId);
    if (!nationalIdValidation.isValid) {
      newErrors.nationalId = nationalIdValidation.error!;
    }

    // Validate email (optional)
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error!;
    }

    // Validate complaint type
    const typeValidation = validateRequired(formData.typeId, "نوع الشكوى");
    if (!typeValidation.isValid) {
      newErrors.typeId = typeValidation.error!;
    }

    // Validate title
    const titleValidation = validateRequired(formData.title, "عنوان الشكوى");
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.error!;
    } else if (!validateInput.minLength(formData.title, 5)) {
      newErrors.title = "عنوان الشكوى يجب أن يكون 5 أحرف على الأقل";
    }

    // Validate description
    const descriptionValidation = validateRequired(
      formData.description,
      "تفاصيل الشكوى"
    );
    if (!descriptionValidation.isValid) {
      newErrors.description = descriptionValidation.error!;
    } else if (!validateInput.minLength(formData.description, 20)) {
      newErrors.description = "تفاصيل الشكوى يجب أن تكون 20 حرف على الأقل";
    }

    // Validate location
    const locationValidation = validateRequired(
      formData.location,
      "موقع الشكوى"
    );
    if (!locationValidation.isValid) {
      newErrors.location = locationValidation.error!;
    }

    // CAPTCHA validation temporarily disabled
    // if (!captchaToken) {
    //   newErrors.general = "يرجى إكمال التحقق من أنك لست روبوت";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
      ];

      if (file.size > maxSize) {
        alert(`الملف ${file.name} كبير جداً. الحد الأقصى 5 ميجابايت`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`نوع الملف ${file.name} غير مسموح`);
        return false;
      }

      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Upload files first
      const uploadedFiles: string[] = [];

      if (files.length > 0) {
        for (const file of files) {
          const fileName = `${Date.now()}-${file.name}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("complaint-images")
              .upload(fileName, file);

          if (uploadError) {
            throw new Error(`فشل في رفع الملف ${file.name}`);
          }

          uploadedFiles.push(uploadData.path);
        }
      }

      // Submit complaint
      const { data, error } = await supabase.rpc("submit_complaint", {
        p_full_name: formData.fullName,
        p_phone: formData.phone,
        p_national_id: formData.nationalId,
        p_email: formData.email,
        p_type_id: formData.typeId,
        p_title: formData.title,
        p_description: formData.description,
        p_location: formData.location,
        p_files: uploadedFiles,
        p_captcha_token: captchaToken,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.success) {
        setTrackingCode(data.tracking_code);
        setSuccess(true);

        // Login complainant for dashboard access
        loginComplainant(
          {
            id: data.citizen_id,
            fullName: formData.fullName,
            phone: formData.phone,
            nationalId: formData.nationalId,
          },
          "citizen-token"
        );
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setErrors({ general: "فشل في تقديم الشكوى. يرجى المحاولة مرة أخرى" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card variant="elevated" className="text-center">
            <div className="p-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                تم تقديم الشكوى بنجاح!
              </h1>

              <p className="text-gray-600 mb-6">
                شكراً لك على تقديم الشكوى. سيتم مراجعتها والرد عليك في أقرب وقت
                ممكن.
              </p>

              {trackingCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 mb-2">رقم التتبع:</p>
                  <p className="text-xl font-mono font-bold text-blue-900">
                    {trackingCode}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => onNavigate("citizen-dashboard")}
                  leftIcon={<User className="w-4 h-4" />}
                >
                  الذهاب للوحة التحكم
                </Button>

                <Button variant="outline" onClick={() => onNavigate("home")}>
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card variant="elevated">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center ml-4">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">تقديم شكوى جديدة</h1>
                <p className="text-blue-100 mt-1">
                  املأ النموذج التالي لتقديم شكوى للمجلس البلدي
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 ml-2 mt-0.5 flex-shrink-0" />
                <span className="text-red-700">{errors.general}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="الاسم الكامل"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  error={errors.fullName}
                  leftIcon={<User className="w-4 h-4" />}
                  placeholder="أدخل اسمك الكامل"
                  required
                />

                <Input
                  label="رقم الهاتف"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={errors.phone}
                  leftIcon={<Phone className="w-4 h-4" />}
                  placeholder="01xxxxxxxxx"
                  required
                />

                <Input
                  label="الرقم القومي"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleInputChange}
                  error={errors.nationalId}
                  placeholder="14 رقم"
                  maxLength={14}
                  required
                />

                <Input
                  label="البريد الإلكتروني"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  leftIcon={<Mail className="w-4 h-4" />}
                  placeholder="example@email.com"
                  required
                />
              </div>

              {/* Complaint Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الشكوى *
                  </label>
                  <select
                    name="typeId"
                    value={formData.typeId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.typeId ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">اختر نوع الشكوى</option>
                    {complaintTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.typeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.typeId}</p>
                  )}
                </div>

                <Input
                  label="عنوان الشكوى"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={errors.title}
                  placeholder="أدخل عنوان الشكوى"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تفاصيل الشكوى *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="اشرح تفاصيل الشكوى بالتفصيل..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description}
                    </p>
                  )}
                </div>

                <Input
                  label="موقع الشكوى"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  error={errors.location}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  placeholder="أدخل العنوان أو الموقع"
                  required
                />

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المرفقات
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      اسحب الملفات هنا أو اضغط للاختيار
                    </p>
                    <p className="text-xs text-gray-500">
                      الحد الأقصى: 5 ميجابايت لكل ملف (JPG, PNG, PDF)
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" className="mt-2">
                        اختيار الملفات
                      </Button>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm text-gray-700">
                            {file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            leftIcon={<X className="w-4 h-4" />}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button type="submit" loading={loading} size="lg">
                  تقديم الشكوى
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ComplaintForm;
