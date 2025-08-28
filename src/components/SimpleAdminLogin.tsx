import React, { useState } from "react";

interface SimpleAdminLoginProps {
  onNavigate: (page: string) => void;
}

const ADMIN_EMAIL = "emanhassanmahmoud1@gmail.com";
const ADMIN_PASSWORD = "Emovmmm#951753";

const SimpleAdminLogin: React.FC<SimpleAdminLoginProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("simple_admin", "true");
      onNavigate("simple-admin-dashboard");
    } else {
      setError("بيانات الدخول غير صحيحة");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">تسجيل دخول الأدمن</h2>
      {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          دخول
        </button>
      </form>
    </div>
  );
};

export default SimpleAdminLogin;
