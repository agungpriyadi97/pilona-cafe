import { supabasePublic, supabaseService } from "./supabaseServer";

export async function requireUserAndRole(
  authHeader: string | null,
  allowRoles: Array<"admin" | "cashier">
) {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = authHeader.slice("Bearer ".length);

  // 1) validasi token -> dapat user
  const pub = supabasePublic();
  const { data: userData, error: userErr } = await pub.auth.getUser(token);
  if (userErr || !userData?.user) throw new Error("UNAUTHORIZED");
  const userId = userData.user.id;

  // 2) cek role dari table profiles
  const svc = supabaseService();
  const { data: profile, error: profErr } = await svc
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (profErr || !profile?.role) throw new Error("FORBIDDEN");
  if (!allowRoles.includes(profile.role)) throw new Error("FORBIDDEN");

  return { userId, role: profile.role as "admin" | "cashier" };
}