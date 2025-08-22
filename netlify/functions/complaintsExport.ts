import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY) as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event) => {
  try {
    const params = new URLSearchParams(event.queryStringParameters as any);
    const format = params.get("format") || "csv";
    const status = params.get("status");
    const type = params.get("type");
    const dateFrom = params.get("dateFrom");
    const dateTo = params.get("dateTo");

    let query = supabase
      .from("complaints")
      .select(
        "id,title,description,status,created_at,resolved_at,priority,location, type:complaint_types(name), complainant:complainants(full_name,phone,national_id,email), assignedTo:users(full_name)"
      )
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type_id", type);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data as any[]).map((c) => ({
      "رقم الشكوى": c.id,
      "اسم المشتكي": c.complainant?.full_name,
      "رقم الهاتف": c.complainant?.phone,
      "الرقم القومي": c.complainant?.national_id,
      "البريد الإلكتروني": c.complainant?.email || "غير محدد",
      "نوع الشكوى": c.type?.name,
      العنوان: c.title,
      الوصف: c.description,
      الموقع: c.location || "غير محدد",
      الحالة: c.status,
      الأولوية: c.priority,
      "الموظف المخصص": c.assignedTo?.full_name || "غير محدد",
      "تاريخ التقديم": new Date(c.created_at).toLocaleDateString("ar-EG"),
      "تاريخ الحل": c.resolved_at
        ? new Date(c.resolved_at).toLocaleDateString("ar-EG")
        : "لم يتم الحل",
    }));

    if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الشكاوى");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return {
        statusCode: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=complaints_${
            new Date().toISOString().split("T")[0]
          }.xlsx`,
        },
        body: buf.toString("base64"),
        isBase64Encoded: true,
      };
    }

    // CSV
    const headers = Object.keys(rows[0] || {});
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const csv = "\ufeff" + csvLines.join("\n");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=complaints_${
          new Date().toISOString().split("T")[0]
        }.csv`,
      },
      body: csv,
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
};
