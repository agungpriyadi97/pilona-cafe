import { NextResponse } from "next/server";
import { requireUserAndRole } from "../../../lib/authServer";
import { supabaseService } from "../../../lib/supabaseServer";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    await requireUserAndRole(req.headers.get("authorization"), ["admin"]);
    const svc = supabaseService();

    const { data: orders, error } = await svc
      .from("orders")
      .select("id,created_at,customer_name,customer_phone,order_type,status,subtotal,tax,total")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Orders");

    ws.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Created At", key: "created_at", width: 22 },
      { header: "Customer", key: "customer_name", width: 18 },
      { header: "Phone", key: "customer_phone", width: 16 },
      { header: "Type", key: "order_type", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Subtotal", key: "subtotal", width: 12 },
      { header: "Tax", key: "tax", width: 10 },
      { header: "Total", key: "total", width: 12 },
    ];

    (orders ?? []).forEach((o: any) => ws.addRow(o));
    ws.getRow(1).font = { bold: true };

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pilona-report.xlsx"`,
      },
    });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}