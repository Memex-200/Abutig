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
    const { phone, nationalId, fullName, email } = body;
    if (!phone || !nationalId || !fullName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "بيانات غير صالحة" }),
      };
    }

    const { data: existing, error: findError } = await supabase
      .from("complainants")
      .select("*")
      .or(`phone.eq.${phone},national_id.eq.${nationalId}`)
      .limit(1);
    if (findError) throw findError;

    let complainant = existing && existing.length > 0 ? existing[0] : null;
    if (!complainant) {
      const { data: created, error: createError } = await supabase
        .from("complainants")
        .insert({
          full_name: fullName,
          phone,
          national_id: nationalId,
          email: email || null,
        })
        .select("*")
        .single();
      if (createError) throw createError;
      complainant = created;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token: "",
        complainant: {
          id: complainant.id,
          fullName: complainant.full_name,
          phone: complainant.phone,
        },
        message: "تم التحقق بنجاح",
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
};
