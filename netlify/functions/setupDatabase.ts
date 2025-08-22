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
    const results = [];

    // 1. Create complaint types
    const complaintTypes = [
      {
        name: "شكوى بناء مخالف",
        description: "بناء بدون ترخيص أو مخالف للقوانين",
        icon: "🏚️",
      },
      {
        name: "شكوى صرف صحي",
        description: "مشاكل في شبكة الصرف الصحي",
        icon: "🚽",
      },
      {
        name: "شكوى نظافة أو قمامة",
        description: "تراكم القمامة أو عدم النظافة",
        icon: "♻️",
      },
      {
        name: "شكوى طريق أو رصف",
        description: "تلف في الطرق أو الأرصفة",
        icon: "🚧",
      },
      {
        name: "شكوى إنارة",
        description: "مشاكل في الإنارة العامة",
        icon: "💡",
      },
      {
        name: "شكوى ضعف أو انقطاع الإنترنت",
        description: "ضعف أو انقطاع الإنترنت / الشبكة",
        icon: "📶",
      },
      {
        name: "شكوى تعديات على ممتلكات عامة",
        description: "تعديات على الأراضي أو الممتلكات العامة",
        icon: "🌳",
      },
      {
        name: "شكوى صيانة أو كهرباء",
        description: "مشاكل في الصيانة أو الكهرباء",
        icon: "🛠️",
      },
      {
        name: "شكوى أمنية أو تعدي",
        description: "مشاكل أمنية أو تعديات",
        icon: "🚓",
      },
      {
        name: "أخرى",
        description: "شكاوى أخرى (مع تحديد التفاصيل)",
        icon: "✉️",
      },
    ];

    // Check existing complaint types
    const { data: existingTypes } = await supabase
      .from("complaint_types")
      .select("name");
    
    const existingNames = existingTypes?.map(t => t.name) || [];
    const newTypes = complaintTypes.filter(t => !existingNames.includes(t.name));

    if (newTypes.length > 0) {
      const { data: createdTypes, error: typesError } = await supabase
        .from("complaint_types")
        .insert(newTypes)
        .select("*");
      
      if (typesError) {
        console.error("Error creating complaint types:", typesError);
      } else {
        results.push({ 
          action: "complaint_types", 
          created: newTypes.length,
          data: createdTypes 
        });
      }
    } else {
      results.push({ 
        action: "complaint_types", 
        message: "All types already exist",
        existing: existingNames.length
      });
    }

    // 2. Create admin user if not exists
    const adminUser = {
      email: "admin@abuttig.gov",
      fullName: "مدير النظام",
      nationalId: "12345678901234",
      role: "ADMIN" as "ADMIN",
      password: "Admin123!",
    };

    const { data: existingAdmin, error: checkAdminError } = await supabase
      .from("users")
      .select("id, email, auth_user_id")
      .eq("email", adminUser.email)
      .single();

    if (checkAdminError && checkAdminError.code !== "PGRST116") {
      throw checkAdminError;
    }

    if (!existingAdmin) {
      // Create auth user
      const { data: authRes, error: authError } =
        await supabase.auth.admin.createUser({
          email: adminUser.email,
          email_confirm: true,
          password: adminUser.password,
          user_metadata: {
            full_name: adminUser.fullName,
            role: adminUser.role,
          },
        });
      
      if (authError || !authRes.user) {
        console.error("Admin auth creation error:", authError);
        throw authError || new Error("Admin auth creation failed");
      }

      // Create profile row
      const { data: adminProfile, error: profileError } = await supabase
        .from("users")
        .insert({
          email: adminUser.email,
          national_id: adminUser.nationalId,
          full_name: adminUser.fullName,
          role: adminUser.role,
          is_active: true,
          auth_user_id: authRes.user.id,
        })
        .select("*")
        .single();
      
      if (profileError) {
        console.error("Admin profile creation error:", profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authRes.user.id);
        throw profileError;
      }

      results.push({
        action: "admin_user",
        created: true,
        user: adminProfile,
        credentials: {
          email: adminUser.email,
          password: adminUser.password,
        }
      });
    } else {
      results.push({
        action: "admin_user",
        message: "Admin user already exists",
        user: existingAdmin
      });
    }

    // 3. Create employee user if not exists
    const employeeUser = {
      email: "employee@abuttig.gov",
      fullName: "موظف الشكاوى",
      nationalId: "12345678901235",
      role: "EMPLOYEE" as "EMPLOYEE",
      password: "Employee123!",
    };

    const { data: existingEmployee, error: checkEmployeeError } = await supabase
      .from("users")
      .select("id, email, auth_user_id")
      .eq("email", employeeUser.email)
      .single();

    if (checkEmployeeError && checkEmployeeError.code !== "PGRST116") {
      throw checkEmployeeError;
    }

    if (!existingEmployee) {
      // Create auth user
      const { data: authRes, error: authError } =
        await supabase.auth.admin.createUser({
          email: employeeUser.email,
          email_confirm: true,
          password: employeeUser.password,
          user_metadata: {
            full_name: employeeUser.fullName,
            role: employeeUser.role,
          },
        });
      
      if (authError || !authRes.user) {
        console.error("Employee auth creation error:", authError);
        throw authError || new Error("Employee auth creation failed");
      }

      // Create profile row
      const { data: employeeProfile, error: profileError } = await supabase
        .from("users")
        .insert({
          email: employeeUser.email,
          national_id: employeeUser.nationalId,
          full_name: employeeUser.fullName,
          role: employeeUser.role,
          is_active: true,
          auth_user_id: authRes.user.id,
        })
        .select("*")
        .single();
      
      if (profileError) {
        console.error("Employee profile creation error:", profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authRes.user.id);
        throw profileError;
      }

      results.push({
        action: "employee_user",
        created: true,
        user: employeeProfile,
        credentials: {
          email: employeeUser.email,
          password: employeeUser.password,
        }
      });
    } else {
      results.push({
        action: "employee_user",
        message: "Employee user already exists",
        user: existingEmployee
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "تم إعداد قاعدة البيانات بنجاح",
        results: results,
      }),
    };
  } catch (err: any) {
    console.error("Database setup error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message || "خطأ في إعداد قاعدة البيانات",
        details: err.toString()
      }),
    };
  }
};
