// ==============================================================================
// Supabase Server Client (Phase 2.3)
// Server Components and Route Handlers with Cookie-based Authentication
// ==============================================================================
import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Handled when called from Server Components where cookies cannot be mutated
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Handled when called from Server Components
        }
      },
    },
  });
}
