import React, { useState } from "react";
import { User, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const AdminSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const createAdminAccount = async () => {
    setLoading(true);
    setError("");

    try {
      // Create the admin account using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: "emanhassanmahmoud1@gmail.com",
        password: "Emovmmm#951753",
        options: {
          data: {
            full_name: "مدير النظام",
            role: "ADMIN",
          }
        }
      });

      if (authError) {
        console.error("Auth creation error:", authError);
        setError("فشل إنشاء حساب المدير: " + authError.message);
        return;
      }

      if (authData.user) {
        // Check if user profile already exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_user_id", authData.user.id)
          .single();

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from("users")
            .update({
              full_name: "مدير النظام",
              email: "emanhassanmahmoud1@gmail.com",
              role: "ADMIN",
              is_active: true,
            })
            .eq("auth_user_id", authData.user.id);

          if (updateError) {
            console.error("Profile update error:", updateError);
            setError("فشل تحديث ملف المستخدم: " + updateError.message);
            return;
          }
        } else {
          // Create new profile
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              auth_user_id: authData.user.id,
              full_name: "مدير النظام",
              email: "emanhassanmahmoud1@gmail.com",
              role: "ADMIN",
              is_active: true,
            });

          if (insertError) {
            console.error("Profile creation error:", insertError);
            setError("فشل إنشاء ملف المستخدم: " + insertError.message);
            return;
          }
        }

        setSuccess(true);
      }
    } catch (error) {
      console.error("Setup error:", error);
      setError("حدث خطأ أثناء إعداد حساب المدير");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              تم إنشاء حساب المدير بنجاح!
            </h2>
            <p className="text-gray-600 mb-6">
              يمكنك الآن تسجيل الدخول باستخدام:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <strong>البريد الإلكتروني:</strong> emanhassanmahmoud1@gmail.com
              </p>
              <p className="text-sm text-gray-700">
                <strong>كلمة المرور:</strong> Emovmmm#951753
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              إعداد حساب المدير
            </h2>
            <p className="text-gray-600">إنشاء حساب المدير للنظام</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-900 mb-2">بيانات المدير:</h3>
            <div className="text-sm text-blue-800">
              <p>
                <strong>البريد الإلكتروني:</strong> emanhassanmahmoud1@gmail.com
              </p>
              <p>
                <strong>كلمة المرور:</strong> Emovmmm#951753
              </p>
            </div>
          </div>

          <button
            onClick={createAdminAccount}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جاري الإنشاء...
              </>
            ) : (
              <>
                <User className="w-4 h-4 ml-2" />
                إنشاء حساب المدير
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => (window.location.href = "/")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
