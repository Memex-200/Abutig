import React, { useEffect, useState } from "react";
import { Users, Eye } from "lucide-react";
import { supabase } from "../utils/supabaseClient.ts";

interface CitizenRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  national_id: string | null;
}

const AdminCitizens: React.FC = () => {
  const [citizens, setCitizens] = useState<CitizenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, phone, national_id, role")
        .eq("role", "CITIZEN")
        .order("full_name", { ascending: true });
      if (error) {
        setError(error.message);
      } else {
        setCitizens(
          ((data as any[]) || []).map((u) => ({
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            phone: u.phone,
            national_id: u.national_id,
          })) as any
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const impersonate = (citizen: CitizenRow) => {
    try {
      localStorage.setItem("adminMode", "true");
      localStorage.setItem("impersonatedCitizenId", citizen.id);
      localStorage.setItem("impersonatedCitizenName", citizen.full_name || "");
    } catch {}
    window.location.href = "/citizen-dashboard";
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-600">
        جاري تحميل المواطنين...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-blue-600 ml-2" />
              <h1 className="text-2xl font-bold text-gray-900">
                قائمة المواطنين
              </h1>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              جميع المواطنين ({citizens.length})
            </h2>
          </div>

          {error && (
            <div className="p-4 text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    البريد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الهاتف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرقم القومي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {citizens.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {c.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {c.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {c.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {c.national_id || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => impersonate(c)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        عرض كتجربة مواطن
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCitizens;
