import React, { useState } from "react";
import { LogIn, User, Phone, CreditCard, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";

interface LoginFormProps {
  onNavigate: (page: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onNavigate }) => {
  const { login, loginComplainant } = useAuth();
  const [activeTab, setActiveTab] = useState<"citizen" | "staff">("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Staff login form
  const [staffForm, setStaffForm] = useState({
    email: "",
    password: "",
  });

  // Citizen verification form
  const [citizenForm, setCitizenForm] = useState({
    fullName: "",
    phone: "",
    nationalId: "",
  });

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: staffForm.email,
        password: staffForm.password,
      });

      if (error) {
        console.error("Supabase auth error:", error);
        // Handle specific error cases
        if (error.status === 400) {
          setError("الحساب غير موجود أو كلمة المرور غير صحيحة");
        } else if (error.message.includes("Invalid login credentials")) {
          setError("الحساب غير موجود أو كلمة المرور غير صحيحة");
        } else {
          setError(error.message || "خطأ في تسجيل الدخول");
        }
      } else if (data.session) {
        const authUserId = data.session.user.id;
        const { data: profiles, error: profileError } = await supabase
          .from("users")
          .select("id,email,full_name,role,is_active")
          .eq("auth_user_id", authUserId)
          .limit(1);

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          setError("خطأ في جلب بيانات المستخدم");
        } else if (!profiles || profiles.length === 0) {
          setError("لا يوجد ملف مستخدم مرتبط بهذا الحساب");
        } else {
          const profile = profiles[0] as any;

          // Check if user is active
          if (!profile.is_active) {
            setError("الحساب معطل، يرجى التواصل مع الإدارة");
            return;
          }

          const mappedUser = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            role: profile.role,
          } as any;

          login(mappedUser, "");

          if (mappedUser.role === "ADMIN") {
            onNavigate("admin-dashboard");
          } else {
            onNavigate("employee-dashboard");
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleCitizenVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check if citizen exists in the database
      const { data: existingComplaints, error } = await supabase
        .from("complaints")
        .select("id, full_name, phone")
        .eq("national_id", citizenForm.nationalId)
        .eq("phone", citizenForm.phone)
        .limit(1);

      if (error) {
        console.error("Database error:", error);
        setError("خطأ في الاتصال بقاعدة البيانات");
        return;
      }

      if (existingComplaints && existingComplaints.length > 0) {
        const complainant = existingComplaints[0];
        const complainantData = {
          id: complainant.id,
          fullName: complainant.full_name,
          phone: complainant.phone,
          nationalId: citizenForm.nationalId,
        };
        loginComplainant(complainantData, "");
        onNavigate("citizen-dashboard");
      } else {
        setError(
          "لم يتم العثور على شكاوى بهذه البيانات. يرجى التأكد من صحة البيانات أو تقديم شكوى جديدة."
        );
      }
    } catch (error) {
      setError("خطأ في الاتصال بالخادم");
      console.error("Verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 text-center">
            <LogIn className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
            <p className="text-blue-100 mt-2">اختر نوع الحساب للدخول للنظام</p>
          </div>

          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex-1 py-4 px-6 font-medium text-center border-b-2 transition-colors ${
                activeTab === "staff"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-gray-200 text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1" />
              موظف/إداري
            </button>
            <button
              onClick={() => setActiveTab("citizen")}
              className={`flex-1 py-4 px-6 font-medium text-center border-b-2 transition-colors ${
                activeTab === "citizen"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-gray-200 text-gray-500 hover:text-gray-700"
              }`}
            >
              <Phone className="w-5 h-5 mx-auto mb-1" />
              مواطن
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {activeTab === "staff" ? (
              /* Staff Login Form */
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(e) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@abuttig.gov"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="كلمة المرور"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </button>
              </form>
            ) : (
              /* Citizen Verification Form */
              <form onSubmit={handleCitizenVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline ml-1" />
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={citizenForm.fullName}
                    onChange={(e) =>
                      setCitizenForm((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline ml-1" />
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={citizenForm.phone}
                    onChange={(e) =>
                      setCitizenForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="01xxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline ml-1" />
                    الرقم القومي
                  </label>
                  <input
                    type="text"
                    value={citizenForm.nationalId}
                    onChange={(e) =>
                      setCitizenForm((prev) => ({
                        ...prev,
                        nationalId: e.target.value,
                      }))
                    }
                    required
                    maxLength={14}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="14 رقم"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "جاري التحقق..." : "تسجيل الدخول"}
                </button>

                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500 mt-2">
                    * سيتم التحقق من بياناتك وإنشاء حساب إذا لم يكن موجوداً
                  </p>
                </div>
              </form>
            )}

            <div className="text-center mt-6">
              <button
                onClick={() => onNavigate("home")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
