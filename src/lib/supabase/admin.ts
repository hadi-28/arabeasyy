import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Hanya untuk server actions/server code yang telah memverifikasi pengguna.
 * Jangan pernah mengimpor modul ini dari Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diatur di environment server.");
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
