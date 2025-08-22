import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const testUser = {
      email: "admin@abuttig.gov",
      fullName: "مدير النظام",
      phone: "01000000000",
      nationalId: "12345678901234",
      role: "ADMIN" as "ADMIN",
      password: "Admin123!",
    };

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, auth_user_id")
      .eq("email", testUser.email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ 
          error: "المستخدم موجود بالفعل",
          user: existingUser 
        }),
      };
    }

    // Create auth user
    const { data: authRes, error: authError } =
      await supabase.auth.admin.createUser({
        email: testUser.email,
        email_confirm: true,
        password: testUser.password,
        user_metadata: {
          full_name: testUser.fullName,
          role: testUser.role,
        },
      });
    
    if (authError || !authRes.user) {
      console.error("Auth creation error:", authError);
      throw authError || new Error("Auth creation failed");
    }

    // Create profile row
    const { data: userRow, error: profileError } = await supabase
      .from("users")
      .insert({
        email: testUser.email,
        phone: testUser.phone,
        national_id: testUser.nationalId,
        full_name: testUser.fullName,
        role: testUser.role,
        is_active: true,
        auth_user_id: authRes.user.id,
      })
      .select("id,email,full_name,role,is_active,created_at")
      .single();
    
    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authRes.user.id);
      throw profileError;
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        user: userRow,
        message: "تم إنشاء المستخدم التجريبي بنجاح",
        auth_user_id: authRes.user.id,
        login_credentials: {
          email: testUser.email,
          password: testUser.password,
        },
      }),
    };
  } catch (err: any) {
    console.error("Test user creation error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message || "خطأ في إنشاء المستخدم التجريبي",
        details: err.toString()
      }),
    };
  }
};
