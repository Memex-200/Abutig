import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../utils/supabaseClient.ts";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
}

interface Complainant {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string;
}

interface AuthContextType {
  user: User | null;
  complainant: Complainant | null;
  userType: "user" | "complainant" | null;
  login: (userData: User, token: string) => void;
  loginComplainant: (complainantData: Complainant, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [complainant, setComplainant] = useState<Complainant | null>(null);
  const [loading, setLoading] = useState(true);

  const userType = user ? "user" : complainant ? "complainant" : null;

  useEffect(() => {
    const init = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const authUserId = sessionData.session.user.id;
          const { data: profiles, error } = await supabase
            .from("users")
            .select("id,email,full_name,role,is_active")
            .eq("auth_user_id", authUserId)
            .limit(1);
          if (!error && profiles && profiles.length > 0) {
            const profile = profiles[0] as any;

            // Check if user is active
            if (!profile.is_active) {
              console.warn("User account is inactive:", profile.email);
              await supabase.auth.signOut();
              return;
            }

            const userData = {
              id: profile.id,
              email: profile.email,
              fullName: profile.full_name,
              role: profile.role,
            };

            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("userType", "user");
          } else {
            console.error("No profile found for auth user:", authUserId);
            await supabase.auth.signOut();
          }
        } else {
          // Load citizen session (non-auth) if present
          const storedComplainant = localStorage.getItem("complainant");
          const storedUserType = localStorage.getItem("userType");
          if (storedUserType === "complainant" && storedComplainant) {
            try {
              const complainantData = JSON.parse(storedComplainant);
              setComplainant(complainantData);
            } catch (error) {
              console.error("Error parsing stored complainant data:", error);
              localStorage.clear();
            }
          }
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          setUser(null);
          localStorage.removeItem("user");
          if (localStorage.getItem("userType") === "user") {
            localStorage.removeItem("userType");
          }
        } else {
          // Re-run init to fetch profile
          await init();
        }
      }
    );

    init();
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = (userData: User, _token: string) => {
    setUser(userData);
    setComplainant(null);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userType", "user");
    localStorage.removeItem("complainant");
  };

  const loginComplainant = (complainantData: Complainant, token: string) => {
    setComplainant(complainantData);
    setUser(null);
    localStorage.setItem("authToken", token);
    localStorage.setItem("complainant", JSON.stringify(complainantData));
    localStorage.setItem("userType", "complainant");
    localStorage.removeItem("user");
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setComplainant(null);
      try {
        const keepAdmin = localStorage.getItem("adminMode");
        localStorage.clear();
        if (keepAdmin) localStorage.setItem("adminMode", keepAdmin);
      } catch {}
    }
  };

  const value: AuthContextType = {
    user,
    complainant,
    userType,
    login,
    loginComplainant,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
