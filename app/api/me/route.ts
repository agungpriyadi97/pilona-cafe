// app/api/me/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "../../lib/authUser";
import { supabaseService } from "../../lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { userId, user } = await requireUser(req.headers.get("authorization"));

    const svc = supabaseService();
    const { data: prof, error } = await svc
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    // role bisa null untuk customer
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
      role: (prof?.role ?? null) as "admin" | "cashier" | null,
    });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}