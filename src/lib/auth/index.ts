// ==============================================================================
// Server-Side Authorization Architecture (Clerk Integration Foundation)
// ==============================================================================
// Security Principles:
// 1. Database credentials (DATABASE_URL) are strictly server-only.
// 2. All database mutations (INSERT, UPDATE, DELETE) must pass through trusted
//    server-side code (Server Actions or API Route Handlers).
// 3. Administrator authorization is enforced against a server-side allowlist:
//    PORTFOLIO_ADMIN_USER_ID (configured in .env.local / production env).
// 4. Client-side flags, user-supplied roles, public metadata, or hidden UI
//    gestures are NEVER treated as authorization.
// ==============================================================================

/**
 * Validates whether a given Clerk User ID corresponds to the authorized portfolio owner.
 *
 * @param userId - The authenticated Clerk user ID extracted from server session
 * @returns boolean indicating if the user is the authorized administrator
 */
export function isAuthorizedAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;

  const adminUserId = process.env.PORTFOLIO_ADMIN_USER_ID;
  if (!adminUserId || adminUserId.trim() === "" || adminUserId.includes("user_...")) {
    return false;
  }

  return userId.trim() === adminUserId.trim();
}

/**
 * Server-side guard to throw an error if an unauthenticated or unauthorized
 * user attempts an administrative mutation.
 *
 * @param userId - The authenticated Clerk user ID
 * @throws Error if not authorized
 */
export function assertAdmin(userId: string | null | undefined): void {
  if (!isAuthorizedAdmin(userId)) {
    throw new Error("UNAUTHORIZED: Administrator privileges required.");
  }
}
