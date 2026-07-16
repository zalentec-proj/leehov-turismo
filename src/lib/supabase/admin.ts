import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnv, requireSupabaseSecretKey } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const { url } = requireSupabasePublicEnv();
  const secretKey = requireSupabaseSecretKey();

  return createSupabaseClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
