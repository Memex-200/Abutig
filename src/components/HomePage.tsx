import React from "react";
import {
  FileText,
  Users,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
} from "lucide-react";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  // Responsive background image logic
  const [bgImage, setBgImage] = React.useState("url(/images/logo.jpg)");

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setBgImage("url(/images/logo4.jpg)");
      } else {
        setBgImage("url(/images/logo.jpg)");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const features = [
    {
      icon: FileText,
      title: "تقديم الشكاوى",
      description: "قدم شكواك بسهولة وتابع حالتها خطوة بخطوة",
      color: "bg-blue-500",
    },
    {
      icon: Clock,
      title: "متابعة سريعة",
      description: "تابع حالة شكواك في الوقت الفعلي واحصل على تحديثات فورية",
      color: "bg-green-500",
    },
    {
      icon: Users,
      title: "فريق متخصص",
      description: "فريق من الموظفين المدربين للتعامل مع جميع أنواع الشكاوى",
      color: "bg-purple-500",
    },
    {
      icon: Shield,
      title: "أمان البيانات",
      description: "نضمن حماية بياناتك الشخصية وسرية معلوماتك",
      color: "bg-red-500",
    },
  ];

  const complaintTypes = [
    {
      icon: "🏚️",
      name: "شكوى بناء مخالف",
      description: "بناء بدون ترخيص أو مخالف للقوانين",
    },
    {
      icon: "🚽",
      name: "شكوى صرف صحي",
      description: "مشاكل في شبكة الصرف الصحي",
    },
    {
      icon: "♻️",
      name: "شكوى نظافة أو قمامة",
      description: "تراكم القمامة أو عدم النظافة",
    },
    {
      icon: "🚧",
      name: "شكوى طريق أو رصف",
      description: "تلف في الطرق أو الأرصفة",
    },
    {
      icon: "💡",
      name: "شكوى إنارة",
      description: "مشاكل في الإنارة العامة",
    },
    {
      icon: "📶",
      name: "شكوى ضعف أو انقطاع الإنترنت",
      description: "ضعف أو انقطاع الإنترنت / الشبكة",
    },
    {
      icon: "🌳",
      name: "شكوى تعديات على ممتلكات عامة",
      description: "تعديات على أراضي أو ممتلكات عامة",
    },
    {
      icon: "🛠️",
      name: "شكوى صيانة أو كهرباء",
      description: "مشاكل في الصيانة أو الكهرباء",
    },
    {
      icon: "🚓",
      name: "شكوى أمنية أو تعدي",
      description: "مشاكل أمنية أو تعديات",
    },
    {
      icon: "✉️",
      name: "أخرى",
      description: "شكاوى أخرى مع تحديد التفاصيل",
    },
  ];

  // const stats = [
  //   {
  //     number: "1,234",
  //     label: "شكوى تم حلها",
  //     icon: CheckCircle,
  //     color: "text-green-600",
  //   },
  //   {
  //     number: "89",
  //     label: "شكوى قيد المعالجة",
  //     icon: AlertCircle,
  //     color: "text-orange-600",
  //   },
  //   {
  //     number: "45",
  //     label: "شكوى جديدة",
  //     icon: FileText,
  //     color: "text-blue-600",
  //   },
  //   {
  //     number: "24/7",
  //     label: "خدمة على مدار الساعة",
  //     icon: Clock,
  //     color: "text-purple-600",
  //   },
  // ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="text-white py-12 md:py-20 relative overflow-hidden"
        style={{
          backgroundImage: bgImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "60vh",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center pt-8 md:pt-16">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              نظام الشكاوى البلدية
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-blue-100">
              مجلس مدينة أبوتيج - خدمة المواطنين أولوية
            </p>
            <p className="text-base sm:text-lg mb-8 md:mb-12 max-w-3xl mx-auto text-blue-50 px-4">
              نوفر لك خدمة متكاملة لتقديم الشكاوى ومتابعتها بكل سهولة وشفافية.
              فريقنا المتخصص جاهز لخدمتك على مدار الساعة لضمان حل جميع المشاكل
              بسرعة وكفاءة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <button
                onClick={() => onNavigate("complaint-form")}
                className="bg-white text-blue-600 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto"
              >
                تقديم شكوى جديدة
              </button>
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full sm:w-auto">
                <button
                  onClick={() => onNavigate("login")}
                  className="border-2 border-white text-white px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                  موظف/أدمن
                </button>
                <button
                  onClick={() => onNavigate("citizen-login")}
                  className="bg-green-600 text-white px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                  مواطن
                </button>
              </div>
            </div>

            {/* Admin Setup Link - Only show in development
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => window.location.href = '/admin-setup'}
                  className="text-sm text-blue-200 hover:text-white underline"
                >
                  إعداد النظام (للمطورين فقط)
                </button>
              </div>
            )} */}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <stat.icon className={`w-12 h-12 mx-auto mb-4 ${stat.color}`} />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              لماذا تختار نظامنا؟
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              نقدم لك تجربة متميزة في تقديم الشكاوى ومتابعتها بأحدث التقنيات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div
                  className={`${feature.color} w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Complaint Types Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              أنواع الشكاوى المتاحة
            </h2>
            <p className="text-xl text-gray-600">
              نتعامل مع جميع أنواع الشكاوى البلدية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaintTypes.map((type, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <span className="text-3xl ml-4">{type.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {type.name}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">تواصل معنا</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center">
                <Phone className="w-12 h-12 mb-4 text-blue-200" />
                <h3 className="text-xl font-semibold mb-2">الهاتف</h3>
                <p className="text-blue-100">088-1234567</p>
              </div>
              <div className="flex flex-col items-center">
                <FileText className="w-12 h-12 mb-4 text-blue-200" />
                <h3 className="text-xl font-semibold mb-2">
                  البريد الإلكتروني
                </h3>
                <p className="text-blue-100">complaints@abuttig.gov</p>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="w-12 h-12 mb-4 text-blue-200" />
                <h3 className="text-xl font-semibold mb-2">ساعات العمل</h3>
                <p className="text-blue-100">24/7 خدمة مستمرة</p>
              </div>
              <div className="flex flex-col items-center">
                <a
                  href="https://www.facebook.com/share/1GERhinivV/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-12 h-12 mb-4 text-blue-200 group-hover:text-white transition-colors"
                    fill="currentColor"
                  >
                    <path d="M22.675 0h-21.35C.596 0 0 .596 0 1.326v21.348C0 23.404.596 24 1.326 24h11.495v-9.294H9.691V11.01h3.13V8.414c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.917.001c-1.504 0-1.796.715-1.796 1.765v2.314h3.587l-.467 3.696h-3.12V24h6.116C23.404 24 24 23.404 24 22.674V1.326C24 .596 23.404 0 22.675 0z" />
                  </svg>
                </a>
                <h3 className="text-xl font-semibold mb-2">فيسبوك</h3>
                <p className="text-blue-100">تابعنا على فيسبوك</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
