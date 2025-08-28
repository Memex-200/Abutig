import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient.ts";

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
      // basic validation
      const required = [
        "name",
        "phone",
        "email",
        "national_id",
        "title",
        "details",
        "address",
        "type_id",
      ] as const;
      for (const key of required) {
        if (
          !(form as any)[key] ||
          String((form as any)[key]).trim().length === 0
        ) {
          throw new Error("يرجى ملء جميع الحقول المطلوبة");
        }
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
      if (insertError) throw insertError;

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
      onNavigate("home");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ عند إرسال الشكوى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">تقديم شكوى</h2>
      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="الاسم"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="رقم الهاتف"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="البريد الإلكتروني"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="national_id"
          value={form.national_id}
          onChange={handleChange}
          placeholder="الرقم القومي"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="عنوان الشكوى"
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          name="details"
          value={form.details}
          onChange={handleChange}
          placeholder="تفاصيل الشكوى"
          className="w-full border p-2 rounded"
          required
        />
        <select
          name="type_id"
          value={form.type_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">اختر نوع الشكوى</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="العنوان"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="w-full"
        />
        <button
          disabled={submitting}
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {submitting ? "جارٍ الإرسال..." : "إرسال"}
        </button>
      </form>
    </div>
  );
};

export default SimpleComplaintForm;
