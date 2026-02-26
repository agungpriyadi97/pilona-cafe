import { supabasePublic, supabaseService } from "./supabaseServer";

export async function requireCustomer(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = authHeader.slice("Bearer ".length);

  const pub = supabasePublic();
  const { data: userData, error: userErr } = await pub.auth.getUser(token);
  if (userErr || !userData?.user) throw new Error("UNAUTHORIZED");

  const svc = supabaseService();
  const { data: profile, error: profErr } = await svc
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (profErr || profile?.role !== "customer") throw new Error("FORBIDDEN");
  return { userId: userData.user.id };
}