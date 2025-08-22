import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY) as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      fullName,
      phone,
      email,
      nationalId,
      typeId,
      title,
      description,
      location,
    } = body;

    if (!nationalId || !/^\d{14}$/.test(nationalId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "الرقم القومي غير صالح. يجب أن يكون 14 رقمًا.",
        }),
      };
    }
    if (!fullName || !phone || !typeId || !title || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "بيانات غير مكتملة" }),
      };
    }

    // Ensure citizen user exists (users table with role CITIZEN by national_id)
    const { data: existingUsers, error: findUserError } = await supabase
      .from("users")
      .select("id, role, full_name, national_id")
      .eq("national_id", nationalId)
      .limit(1);
    if (findUserError) throw findUserError;

    let citizenId: string | null =
      existingUsers && existingUsers.length > 0
        ? (existingUsers[0] as any).id
        : null;
    if (!citizenId) {
      const { data: createdUser, error: createUserError } = await supabase
        .from("users")
        .insert({
          full_name: fullName,
          email: email || null,
          national_id: nationalId,
          role: "CITIZEN",
        })
        .select("id")
        .single();
      if (createUserError) throw createUserError;
      citizenId = (createdUser as any).id;
    }

    // Insert complaint
    const { data: complaint, error: complaintError } = await supabase
      .from("complaints")
      .insert({
        citizen_id: citizenId,
        type_id: typeId,
        title,
        description,
        location: location || null,
        status: "NEW",
        national_id: nationalId,
      })
      .select("id")
      .single();
    if (complaintError) throw complaintError;

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        complaintId: (complaint as any).id,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
};
