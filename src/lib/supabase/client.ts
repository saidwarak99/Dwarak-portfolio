// ==============================================================================
// Supabase Browser Client (Phase 2.3)
// ==============================================================================
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function getSupabaseKeys(): { url: string | undefined; key: string | undefined } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Support both standard NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseKeys();
  return Boolean(
    url &&
    key &&
    !url.includes("your-project-id") &&
    url.startsWith("https://")
  );
}

export function createClient() {
  const { url, key } = getSupabaseKeys();

  if (!url || !key || url.includes("your-project-id")) {
    return null;
  }

  return createBrowserClient<Database>(url, key);
}
