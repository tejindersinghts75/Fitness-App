import { createClient } from "@supabase/supabase-js";

const required = (name: string) => { const value = process.env[name]; if (!value) throw new Error(`${name} is not configured`); return value; };

export async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Authentication required");
  const client = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid session");
  const { data: admin } = await client.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) throw new Error("Administrator access required");
  return { client, user: data.user };
}

export function serverSupabase() {
  return createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
}
