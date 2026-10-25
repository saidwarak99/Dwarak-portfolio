// ==============================================================================
// Supabase Server Client (Phase 2.3 & Phase 3)
// Server Components, Server Actions, and Route Handlers with Cookie Sessions
// ==============================================================================
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getSupabaseKeys, isSupabaseConfigured } from "./client";

export { isSupabaseConfigured };

/**
 * Stateless client for public read queries (site_settings, tools, published projects, posts).
 * Does not inspect or mutate cookies, avoiding runtime auth session checks during page render.
 */
export function createPublicClient() {
  const { url, key } = getSupabaseKeys();
  if (!url || !key || url.includes("your-project-id")) {
    return null;
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createClient() {
  const { url, key } = getSupabaseKeys();

  if (!url || !key || url.includes("your-project-id")) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Handled when called from Server Components where response cookies cannot be mutated
        }
      },
    },
  });
}
