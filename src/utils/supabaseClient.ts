import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          national_id: string | null;
          role: "CITIZEN" | "EMPLOYEE" | "ADMIN";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          national_id?: string | null;
          role?: "CITIZEN" | "EMPLOYEE" | "ADMIN";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          national_id?: string | null;
          role?: "CITIZEN" | "EMPLOYEE" | "ADMIN";
          is_active?: boolean;
          created_at?: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          citizen_id: string;
          assigned_user_id: string | null;
          type_id: string;
          title: string;
          description: string;
          location: any | null;
          status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "OVERDUE";
          national_id: string;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          citizen_id: string;
          assigned_user_id?: string | null;
          type_id: string;
          title: string;
          description: string;
          location?: any | null;
          status?: "NEW" | "IN_PROGRESS" | "RESOLVED" | "OVERDUE";
          national_id: string;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          citizen_id?: string;
          assigned_user_id?: string | null;
          type_id?: string;
          title?: string;
          description?: string;
          location?: any | null;
          status?: "NEW" | "IN_PROGRESS" | "RESOLVED" | "OVERDUE";
          national_id?: string;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      complaint_types: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
