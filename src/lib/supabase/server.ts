// ==============================================================================
// Supabase Server Client (Phase 2.3 & Phase 3)
// Server Components, Server Actions, and Route Handlers with Cookie Sessions
// ==============================================================================
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getSupabaseKeys, isSupabaseConfigured } from "./client";

export { isSupabaseConfigured };

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
