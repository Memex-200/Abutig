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
    // Get all users with NULL auth_user_id (staff/admin users)
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("id, email, full_name, role, national_id")
      .is("auth_user_id", null)
      .in("role", ["EMPLOYEE", "ADMIN"]);

    if (fetchError) {
      throw fetchError;
    }

    if (!users || users.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "لا يوجد مستخدمين يحتاجون للترحيل",
          migrated: 0,
        }),
      };
    }

    const migratedUsers = [];
    const errors = [];

    for (const user of users) {
      try {
        // Generate a default password (user should change it)
        const defaultPassword = `AbuTig${user.national_id?.slice(-4) || "2024"}!`;
        
        // Create auth user
        const { data: authRes, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          password: defaultPassword,
          user_metadata: {
            full_name: user.full_name,
            role: user.role,
          },
        });

        if (authError || !authRes.user) {
          errors.push({
            user: user.email,
            error: authError?.message || "Auth creation failed",
          });
          continue;
        }

        // Update the user record with auth_user_id
        const { error: updateError } = await supabase
          .from("users")
          .update({ auth_user_id: authRes.user.id })
          .eq("id", user.id);

        if (updateError) {
          errors.push({
            user: user.email,
            error: updateError.message,
          });
          continue;
        }

        migratedUsers.push({
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          auth_user_id: authRes.user.id,
          default_password: defaultPassword,
        });
      } catch (error: any) {
        errors.push({
          user: user.email,
          error: error.message,
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `تم ترحيل ${migratedUsers.length} مستخدم بنجاح`,
        migrated: migratedUsers,
        errors: errors.length > 0 ? errors : undefined,
      }),
    };
  } catch (err: any) {
    console.error("Migration error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message || "خطأ في ترحيل المستخدمين",
        details: err.toString()
      }),
    };
  }
};
