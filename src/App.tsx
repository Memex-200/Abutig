import React, { useState, useEffect } from "react";
import {
  Home,
  FileText,
  Users,
  Settings,
  LogIn,
  LogOut,
  User,
  Bell,
} from "lucide-react";
import HomePage from "./components/HomePage";
import ComplaintForm from "./components/ComplaintForm";
import CitizenDashboard from "./components/CitizenDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import AdminDashboard from "./components/AdminDashboard";
import LoginForm from "./components/LoginForm";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const AppContent: React.FC = () => {
  const { user, logout, userType } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage("home");
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigation} />;
      case "complaint-form":
        return <ComplaintForm onNavigate={handleNavigation} />;
      case "citizen-dashboard":
        return <CitizenDashboard />;
      case "employee-dashboard":
        return <EmployeeDashboard />;
      case "admin-dashboard":
        return <AdminDashboard />;
      case "login":
        return <LoginForm onNavigate={handleNavigation} />;
      default:
        return <HomePage onNavigate={handleNavigation} />;
    }
  };

  const getDashboardPage = () => {
    if (userType === "complainant") return "citizen-dashboard";
    if (user?.role === "EMPLOYEE") return "employee-dashboard";
    if (user?.role === "ADMIN") return "admin-dashboard";
    return "home";
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 ml-2" />
                <h1 className="text-xl font-bold text-gray-900">
                  مركز مدينة أبوتيج
                </h1>
              </div>
            </div>

            <nav className="flex items-center space-x-reverse space-x-4">
              <button
                onClick={() => handleNavigation("home")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === "home"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Home className="w-4 h-4 ml-1" />
                الرئيسية
              </button>

              {(user || userType === "complainant") && (
                <button
                  onClick={() => handleNavigation(getDashboardPage())}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage.includes("dashboard")
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <User className="w-4 h-4 ml-1" />
                  لوحة التحكم
                </button>
              )}

              {!user && userType !== "complainant" && (
                <button
                  onClick={() => handleNavigation("login")}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === "login"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <LogIn className="w-4 h-4 ml-1" />
                  تسجيل الدخول
                </button>
              )}

              {(user || userType === "complainant") && (
                <div className="flex items-center space-x-reverse space-x-2">
                  <span className="text-sm text-gray-600">
                    {user?.fullName || "مواطن"}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4 ml-1" />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{renderCurrentPage()}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-300">
              © 2025 مركز مدينة أبوتيج - مجلس مدينة أبوتيج
            </p>
            <p className="text-gray-400 text-sm mt-2">جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
