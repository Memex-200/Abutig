import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient.ts";
import {
  validatePhoneNumber,
  validateNationalId,
  validateEmail,
  validateRequired,
  ValidationResult,
} from "../utils/validation";

interface SimpleComplaintFormProps {
  onNavigate: (page: string) => void;
}

interface ComplaintTypeOption {
  id: string;
  name: string;
}

const SimpleComplaintForm: React.FC<SimpleComplaintFormProps> = ({
  onNavigate,
}) => {
  const [types, setTypes] = useState<ComplaintTypeOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    national_id: "",
    title: "",
    details: "",
    address: "",
    type_id: "",
    imageFile: null as File | null,
  });

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase
        .from("complaint_types")
        .select("id, name")
        .order("name");
      if (error) {
        console.error(error);
      } else {
        setTypes(data || []);
      }
    };
    fetchTypes();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setForm((prev) => ({ ...prev, imageFile: file }));
  };

  const uploadImageIfAny = async (): Promise<string | null> => {
    if (!form.imageFile) return null;
    const fileExt = form.imageFile.name.split(".").pop();
    const filePath = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("complaint-images")
      .upload(filePath, form.imageFile, {
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) {
      throw uploadError;
    }
    const { data: publicUrlData } = supabase.storage
      .from("complaint-images")
      .getPublicUrl(filePath);
    return publicUrlData.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // Enhanced validation
      const errors: Record<string, string> = {};

      // Validate required fields
      const nameValidation = validateRequired(form.name, "الاسم");
      if (!nameValidation.isValid) {
        errors.name = nameValidation.error!;
      }

      // Validate phone number
      const phoneValidation = validatePhoneNumber(form.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error!;
      }

      // Validate email (optional)
      const emailValidation = validateEmail(form.email);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error!;
      }

      // Validate national ID
      const nationalIdValidation = validateNationalId(form.national_id);
      if (!nationalIdValidation.isValid) {
        errors.national_id = nationalIdValidation.error!;
      }

      // Validate title
      const titleValidation = validateRequired(form.title, "عنوان الشكوى");
      if (!titleValidation.isValid) {
        errors.title = titleValidation.error!;
      }

      // Validate details
      const detailsValidation = validateRequired(form.details, "تفاصيل الشكوى");
      if (!detailsValidation.isValid) {
        errors.details = detailsValidation.error!;
      }

      // Validate address
      const addressValidation = validateRequired(form.address, "العنوان");
      if (!addressValidation.isValid) {
        errors.address = addressValidation.error!;
      }

      // Validate type
      const typeValidation = validateRequired(form.type_id, "نوع الشكوى");
      if (!typeValidation.isValid) {
        errors.type_id = typeValidation.error!;
      }

      setFieldErrors(errors);

      if (Object.keys(errors).length > 0) {
        setSubmitting(false);
        return;
      }

      const imageUrl = await uploadImageIfAny();

      const { error: insertError } = await supabase.from("complaints").insert({
        name: form.name,
        phone: form.phone,
        email: form.email,
        national_id: form.national_id,
        title: form.title,
        details: form.details,
        image_url: imageUrl,
        type_id: form.type_id || null,
        address: form.address,
      });

      if (insertError) {
        // Handle specific constraint violations
        if (insertError.message?.includes("unique_name_national_id")) {
          throw new Error(
            "هذا الرقم القومي مسجل بالفعل لشخص آخر. يرجى التأكد من صحة البيانات."
          );
        }

        if (insertError.message?.includes("check_national_id_length")) {
          throw new Error("الرقم القومي يجب أن يكون 14 رقم بالضبط");
        }

        if (insertError.message?.includes("check_phone_format")) {
          throw new Error("رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 01");
        }

        throw insertError;
      }

      alert("تم إرسال الشكوى بنجاح!");
      setForm({
        name: "",
        phone: "",
        email: "",
        national_id: "",
        title: "",
        details: "",
        address: "",
        type_id: "",
        imageFile: null,
      });
      setFieldErrors({});
      onNavigate("home");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ عند إرسال الشكوى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        تقديم شكوى
      </h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الاسم *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="أدخل اسمك الكامل"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رقم الهاتف *
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="01xxxxxxxxx"
            maxLength={11}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.phone ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.phone && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الرقم القومي *
          </label>
          <input
            name="national_id"
            value={form.national_id}
            onChange={handleChange}
            placeholder="14 رقم"
            maxLength={14}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.national_id ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.national_id && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.national_id}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            عنوان الشكوى *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="عنوان مختصر للشكوى"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.title && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تفاصيل الشكوى *
          </label>
          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="اشرح تفاصيل الشكوى بوضوح..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.details ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.details && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.details}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع الشكوى *
          </label>
          <select
            name="type_id"
            value={form.type_id}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.type_id ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">اختر نوع الشكوى</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {fieldErrors.type_id && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.type_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            العنوان *
          </label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="العنوان أو موقع المشكلة"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.address ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.address && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الملفات المرفقة
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            disabled={submitting}
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {submitting ? "جاري الإرسال..." : "تقديم الشكوى"}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimpleComplaintForm;
