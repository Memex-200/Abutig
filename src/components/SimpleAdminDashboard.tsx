import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabaseClient";

type Complaint = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  national_id: string;
  title: string;
  details: string;
  image_url: string | null;
  type_id: string | null;
  address: string;
  status: string;
  type?: { id: string; name: string } | null;
};

const SimpleAdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAuthed = useMemo(
    () => localStorage.getItem("simple_admin") === "true",
    []
  );

  useEffect(() => {
    if (!isAuthed) return;
    const load = async () => {
      setLoading(true);
      const [{ data: t }, { data: c, error: ce }] = await Promise.all([
        supabase.from("complaint_types").select("id, name").order("name"),
        supabase
          .from("complaints")
          .select("*, type:complaint_types(id, name)")
          .order("created_at", { ascending: false }),
      ]);
      if (ce) setError(ce.message);
      setTypes(t || []);
      setComplaints((c as any) || []);
      setLoading(false);
    };
    load();
  }, [isAuthed]);

  const [newTypeName, setNewTypeName] = useState("");
  const addType = async () => {
    if (!newTypeName.trim()) return;
    const { data, error } = await supabase
      .from("complaint_types")
      .insert({ name: newTypeName })
      .select("id, name")
      .single();
    if (!error && data) {
      setTypes((prev) => [...prev, data]);
      setNewTypeName("");
    } else if (error) {
      alert(error.message);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);
    if (error) return alert(error.message);
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const exportToExcel = async () => {
    const data = complaints.map((c) => ({
      created_at: c.created_at,
      name: c.name,
      phone: c.phone,
      email: c.email,
      national_id: c.national_id,
      title: c.title,
      details: c.details,
      image_url: c.image_url || "",
      type: c.type?.name || "",
      address: c.address,
      status: c.status,
    }));
    try {
      const xlsx = await import("xlsx");
      const ws = xlsx.utils.json_to_sheet(data);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Complaints");
      xlsx.writeFile(wb, "complaints.xlsx");
    } catch (e) {
      // fallback CSV
      const header = Object.keys(data[0] || {}).join(",");
      const rows = data
        .map((row) =>
          Object.values(row)
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(",")
        )
        .join("\n");
      const csv = [header, rows].filter(Boolean).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "complaints.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isAuthed) {
    return <div className="max-w-md mx-auto p-4">يرجى تسجيل الدخول كأدمن.</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">لوحة تحكم الأدمن</h2>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          تصدير
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          placeholder="إضافة نوع شكوى"
          className="border p-2 rounded"
        />
        <button
          onClick={addType}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          إضافة
        </button>
      </div>

      {loading ? (
        <div>جارٍ التحميل...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">التاريخ</th>
                <th className="p-2 border">الاسم</th>
                <th className="p-2 border">الهاتف</th>
                <th className="p-2 border">البريد</th>
                <th className="p-2 border">الرقم القومي</th>
                <th className="p-2 border">العنوان</th>
                <th className="p-2 border">النوع</th>
                <th className="p-2 border">العنوان المختصر</th>
                <th className="p-2 border">التفاصيل</th>
                <th className="p-2 border">الصورة</th>
                <th className="p-2 border">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="p-2 border whitespace-nowrap">
                    {new Date(c.created_at).toLocaleString()}
                  </td>
                  <td className="p-2 border">{c.name}</td>
                  <td className="p-2 border">{c.phone}</td>
                  <td className="p-2 border">{c.email}</td>
                  <td className="p-2 border">{c.national_id}</td>
                  <td className="p-2 border">{c.address}</td>
                  <td className="p-2 border">{c.type?.name || ""}</td>
                  <td className="p-2 border">{c.title}</td>
                  <td className="p-2 border max-w-[240px] whitespace-pre-wrap">
                    {c.details}
                  </td>
                  <td className="p-2 border">
                    {c.image_url ? (
                      <a
                        className="text-blue-600"
                        href={c.image_url}
                        target="_blank"
                      >
                        رابط
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="p-2 border">
                    <select
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option>Pending</option>
                      <option>Under Review</option>
                      <option>Solved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SimpleAdminDashboard;
