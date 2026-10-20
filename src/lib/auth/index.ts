// ==============================================================================
// Server-Side Authorization Guard (Supabase Auth & Database Admin Allowlist)
// ==============================================================================
// Security Principles:
// 1. Never trust client-supplied roles, hidden gestures, or browser-sent user IDs.
// 2. Authentication is verified via Supabase Auth server session cookies.
// 3. Authorization is verified against public.admin_users via public.is_admin().
// 4. Server Actions and Route Handlers must call assertServerAdmin() before
//    executing any database mutation or accessing private storage.
// ==============================================================================
import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedAdmin {
  userId: string;
  email: string | undefined;
  role: "admin" | "super_admin";
}

/**
 * Validates the active server-side session and verifies administrator authorization
 * in the public.admin_users database table.
 *
 * @returns AuthenticatedAdmin if authorized, or null if unauthenticated / non-admin.
 */
export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  try {
    // 1. Get authenticated user from secure HTTP-only cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // 2. Verify admin allowlist status in admin_users table
    const { data: adminRecord, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .single();

    if (adminError || !adminRecord) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: adminRecord.role as "admin" | "super_admin",
    };
  } catch (err) {
    console.warn("[getAuthenticatedAdmin] Verification failed:", err);
    return null;
  }
}

/**
 * Server guard to throw an error if the user is not an authenticated administrator.
 * Use at the start of Server Actions and CMS Route Handlers.
 */
export async function assertServerAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    throw new Error("UNAUTHORIZED: Administrator privileges required.");
  }
  return admin;
}
