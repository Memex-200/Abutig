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
    const body = JSON.parse(event.body || "{}");
    const { email, phone, nationalId, fullName, role, password } = body;
    
    // Validate required fields
    if (!email || !fullName || !role || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "البريد الإلكتروني والاسم الكامل والدور وكلمة المرور مطلوبة" }),
      };
    }

    // Validate role
    if (!["EMPLOYEE", "ADMIN"].includes(role)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "الدور يجب أن يكون EMPLOYEE أو ADMIN" }),
      };
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, auth_user_id")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "المستخدم موجود بالفعل" }),
      };
    }

    // Create auth user
    const { data: authRes, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: {
          full_name: fullName,
          role: role,
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
        email,
        phone: phone || null,
        national_id: nationalId || null,
        full_name: fullName,
        role,
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
        message: "تم إنشاء المستخدم بنجاح",
        auth_user_id: authRes.user.id,
      }),
    };
  } catch (err: any) {
    console.error("User creation error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message || "خطأ في إنشاء المستخدم",
        details: err.toString()
      }),
    };
  }
};
