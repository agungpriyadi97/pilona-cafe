import { NextResponse } from "next/server";
import { requireUserAndRole } from "../../lib/authServer";
import { supabaseService } from "../../lib/supabaseServer";

export async function GET(req: Request) {
  try {
    await requireUserAndRole(req.headers.get("authorization"), ["admin"]);
    const svc = supabaseService();

    const { data, error } = await svc
      .from("audit_logs")
      .select("id,created_at,user_id,action,meta")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    return NextResponse.json({ logs: data ?? [] });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}