import React, { createContext, useContext, useMemo, useState } from "react";

type Lang = "ar" | "en";

type Dictionary = Record<string, string>;

const ar: Dictionary = {
  home: "الرئيسية",
  dashboard: "لوحة التحكم",
  employeeAdmin: "موظف/أدمن",
  citizen: "مواطن",
  logout: "تسجيل الخروج",
  loading: "جاري التحميل...",
};

const en: Dictionary = {
  home: "Home",
  dashboard: "Dashboard",
  employeeAdmin: "Staff/Admin",
  citizen: "Citizen",
  logout: "Log out",
  loading: "Loading...",
};

interface I18nContextType {
  lang: Lang;
  t: (key: string) => string;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLang] = useState<Lang>(
    (localStorage.getItem("lang") as Lang) || "ar"
  );
  const dict = useMemo(() => (lang === "ar" ? ar : en), [lang]);
  const t = (key: string) => dict[key] || key;
  const value = useMemo(
    () => ({
      lang,
      t,
      setLang: (l: Lang) => {
        localStorage.setItem("lang", l);
        setLang(l);
      },
    }),
    [lang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
