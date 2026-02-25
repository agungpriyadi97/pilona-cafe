import { supabasePublic } from "./supabaseServer";

export async function requireUser(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = authHeader.slice("Bearer ".length);

  const pub = supabasePublic();
  const { data, error } = await pub.auth.getUser(token);
  if (error || !data?.user) throw new Error("UNAUTHORIZED");

  return { userId: data.user.id, user: data.user };
}