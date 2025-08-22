import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  (process.env.SUPABASE_ANON_KEY as string);
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event) => {
  try {
    const path = event.path
      .replace("/.netlify/functions/api", "")
      .replace(/^\/+/, "");
    const method = event.httpMethod.toUpperCase();

    // Example router
    if (path === "health") {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (path === "users" && method === "GET") {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .limit(50);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Not Found", path }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
};
