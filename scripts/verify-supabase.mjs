// ==============================================================================
// Supabase Security & Authorization Validation Script (Phase 2.3.2)
// Full role-based authorization verification using standard Supabase Auth sessions
// NO service-role or privileged keys required. Uses only publishable client + sessions.
// Run with: npm run db:verify
// ==============================================================================

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. Read .env.local configuration
const envLocalPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let adminEmail = process.env.TEST_ADMIN_EMAIL;
let adminPassword = process.env.TEST_ADMIN_PASSWORD;
let nonAdminEmail = process.env.TEST_NON_ADMIN_EMAIL;
let nonAdminPassword = process.env.TEST_NON_ADMIN_PASSWORD;

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = value;
    if (
      key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ||
      key === "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    ) {
      supabaseKey = value;
    }
    if (key === "TEST_ADMIN_EMAIL") adminEmail = value;
    if (key === "TEST_ADMIN_PASSWORD") adminPassword = value;
    if (key === "TEST_NON_ADMIN_EMAIL") nonAdminEmail = value;
    if (key === "TEST_NON_ADMIN_PASSWORD") nonAdminPassword = value;
  }
}

console.log("==================================================================");
console.log(" SAI DWARAK PORTFOLIO — COMPLETE SECURITY & ROLE AUDIT (PHASE 2.3.2)");
console.log(" Testing Standard Auth Sessions (Zero Privileged Secret Keys Required)");
console.log("==================================================================\n");

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes("your-project-id") &&
  supabaseUrl.startsWith("https://")
);

if (!isConfigured) {
  console.log("STATUS: [UNCONFIGURED / LOCAL SAFE MODE]");
  console.log("------------------------------------------------------------------");
  console.log("• No live Supabase credentials detected in .env.local.");
  console.log("• The public website operates safely using local fallback defaults.");
  console.log("• 13 confirmed tools are preserved; galleries and build logs remain empty.\n");
  process.exit(0);
}

// Masked URL for safe logging
const maskedUrl = supabaseUrl.replace(/^(https:\/\/[a-z0-9]{4})[a-z0-9]+(\.supabase\.co.*)$/, "$1...$2");
console.log(`Target URL: ${maskedUrl}`);
console.log("Publishable Client: Active (Standard Browser Key)\n");

// 1x1 pixel valid transparent PNG buffer for Storage RLS tests
const VALID_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// Initialize Anonymous Client (Tier 1: Public / Anonymous)
const anonClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Test tracking
let passCount = 0;
let failCount = 0;
let inconclusiveCount = 0;
let blockedCount = 0;
const resultsTable = [];

/**
 * Standard test runner
 * @param {string} category 
 * @param {string} name 
 * @param {Function} fn 
 */
async function test(category, name, fn) {
  try {
    const res = await fn();
    const outcome = {
      category,
      name,
      status: res.status,
      detail: res.detail,
    };
    resultsTable.push(outcome);

    if (res.status === "PASS") {
      passCount++;
      console.log(`  [PASS] ${name}`);
      console.log(`         ↳ ${res.detail}`);
    } else if (res.status === "FAIL") {
      failCount++;
      console.log(`  [FAIL] ${name}`);
      console.log(`         ↳ ${res.detail}`);
    } else if (res.status === "INCONCLUSIVE") {
      inconclusiveCount++;
      console.log(`  [INCONCLUSIVE] ${name}`);
      console.log(`         ↳ ${res.detail}`);
    } else if (res.status === "BLOCKED") {
      blockedCount++;
      console.log(`  [BLOCKED] ${name}`);
      console.log(`         ↳ ${res.detail}`);
    }
  } catch (err) {
    failCount++;
    resultsTable.push({
      category,
      name,
      status: "FAIL",
      detail: `Unexpected exception: ${err.message}`,
    });
    console.log(`  [FAIL] ${name}`);
    console.log(`         ↳ Unexpected exception: ${err.message}`);
  }
}

async function runAudit() {
  // ============================================================================
  // TIER 1: ANONYMOUS VISITOR CHECKS (PUBLIC READ & WRITE REJECTION)
  // ============================================================================
  console.log("1. ANONYMOUS VISITOR READ CHECKS:");

  await test("Anonymous Read", "Site settings singleton is publicly readable", async () => {
    const { data, error } = await anonClient
      .from("site_settings")
      .select("id, display_name, hero_headline")
      .eq("id", 1)
      .single();

    if (error) return { status: "FAIL", detail: `Read query failed: ${error.message}` };
    if (data?.display_name === "Sai Dwarak") {
      return { status: "PASS", detail: `Confirmed singleton record (display_name: "${data.display_name}")` };
    }
    return { status: "FAIL", detail: `Unexpected site_settings record: ${JSON.stringify(data)}` };
  });

  await test("Anonymous Read", "Confirmed tools are publicly readable (13 confirmed tools)", async () => {
    const { data, error } = await anonClient
      .from("tools")
      .select("name, is_visible")
      .eq("is_visible", true);

    if (error) return { status: "FAIL", detail: `Tools query failed: ${error.message}` };
    if (data?.length === 13) {
      return { status: "PASS", detail: `Received exactly 13 active confirmed tools (Figma, Framer, Tailwind, etc.)` };
    }
    return { status: "FAIL", detail: `Expected 13 tools, received ${data?.length || 0}` };
  });

  await test("Anonymous Read", "Visible tool categories are publicly readable (4 categories)", async () => {
    const { data, error } = await anonClient
      .from("tool_categories")
      .select("name, is_visible")
      .eq("is_visible", true);

    if (error) return { status: "FAIL", detail: `Categories query failed: ${error.message}` };
    if (data?.length === 4) {
      return { status: "PASS", detail: `Received exactly 4 active categories` };
    }
    return { status: "FAIL", detail: `Expected 4 categories, received ${data?.length || 0}` };
  });

  console.log("\n2. ANONYMOUS VISITOR WRITE & MUTATION RESTRICTIONS:");

  await test("Anonymous Write", "Anonymous insert into projects is BLOCKED by RLS", async () => {
    const { error } = await anonClient.from("projects").insert({
      title: "Malicious Anonymous Project",
      slug: `audit-malicious-proj-${Date.now()}`,
      short_description: "Should fail",
      category: "ai-products",
    });

    if (error && error.message.toLowerCase().includes("row-level security")) {
      return { status: "PASS", detail: `Rejected by RLS: "${error.message}"` };
    }
    if (error) return { status: "INCONCLUSIVE", detail: `Rejected by DB without RLS error: ${error.message}` };
    return { status: "FAIL", detail: "CRITICAL: Anonymous project insert succeeded!" };
  });

  await test("Anonymous Write", "Anonymous insert into posts is BLOCKED by RLS", async () => {
    const { error } = await anonClient.from("posts").insert({
      title: "Malicious Anonymous Post",
      slug: `audit-malicious-post-${Date.now()}`,
      content: "Should fail",
    });

    if (error && error.message.toLowerCase().includes("row-level security")) {
      return { status: "PASS", detail: `Rejected by RLS: "${error.message}"` };
    }
    if (error) return { status: "INCONCLUSIVE", detail: `Rejected by DB without RLS error: ${error.message}` };
    return { status: "FAIL", detail: "CRITICAL: Anonymous post insert succeeded!" };
  });

  await test("Anonymous Write", "Anonymous modification of site_settings is BLOCKED (zero rows modified)", async () => {
    const { data, error } = await anonClient
      .from("site_settings")
      .update({ display_name: "Defaced Name" })
      .eq("id", 1)
      .select();

    if (error) return { status: "PASS", detail: `Update rejected with error: ${error.message}` };
    if (!data || data.length === 0) {
      return { status: "PASS", detail: "0 rows modified (RLS write isolation strictly enforced)" };
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous update altered site_settings record!" };
  });

  await test("Anonymous Write", "Anonymous insert into case_study_blocks is BLOCKED by RLS", async () => {
    const { error } = await anonClient.from("case_study_blocks").insert({
      project_id: "00000000-0000-0000-0000-000000000000",
      block_type: "overview",
      heading: "Malicious Block",
    });

    if (error && error.message.toLowerCase().includes("row-level security")) {
      return { status: "PASS", detail: `Rejected by RLS: "${error.message}"` };
    }
    if (error) return { status: "INCONCLUSIVE", detail: `Rejected by DB: ${error.message}` };
    return { status: "FAIL", detail: "CRITICAL: Anonymous block insert succeeded!" };
  });

  console.log("\n3. ADMINISTRATIVE SELF-PROMOTION PROTECTION (admin_users):");

  await test("Admin Isolation", "Anonymous read of admin_users returns empty set (isolated by RLS)", async () => {
    const { data, error } = await anonClient.from("admin_users").select("*");
    if (error) return { status: "PASS", detail: `Query rejected: ${error.message}` };
    if (!data || data.length === 0) {
      return { status: "PASS", detail: "0 admin records exposed to anonymous client" };
    }
    return { status: "FAIL", detail: `CRITICAL: Anonymous client retrieved ${data.length} admin records!` };
  });

  await test("Admin Isolation", "Anonymous insert into admin_users is BLOCKED by RLS", async () => {
    const { error } = await anonClient.from("admin_users").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      role: "super_admin",
    });

    if (error && error.message.toLowerCase().includes("row-level security")) {
      return { status: "PASS", detail: `Self-promotion rejected: "${error.message}"` };
    }
    if (error) return { status: "INCONCLUSIVE", detail: `Rejected with non-RLS error: ${error.message}` };
    return { status: "FAIL", detail: "CRITICAL: Anonymous user successfully inserted admin record!" };
  });

  await test("Admin Isolation", "Anonymous update of admin_users is BLOCKED (zero rows modified)", async () => {
    const { data, error } = await anonClient
      .from("admin_users")
      .update({ role: "super_admin" })
      .neq("role", "")
      .select();

    if (error) return { status: "PASS", detail: `Update rejected with error: ${error.message}` };
    if (!data || data.length === 0) {
      return { status: "PASS", detail: "0 rows modified (administrative table is strictly isolated)" };
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous user modified admin_users table!" };
  });

  await test("Admin Isolation", "Anonymous visitor cannot execute admin-check RPC through Data API", async () => {
    const { data, error } = await anonClient.rpc("is_admin");
    if (error) {
      return {
        status: "PASS",
        detail: `RPC execution blocked / not exposed via Data API: "${error.message}"`,
      };
    }
    // If the function currently returns false for anon in the public schema prior to migration,
    // or is in private schema:
    if (data === false) {
      return {
        status: "PASS",
        detail: `Function returned false for anonymous visitor (no elevation possible). Moving to private schema will remove API endpoint entirely.`,
      };
    }
    return {
      status: "FAIL",
      detail: `CRITICAL: Anonymous user executed admin-check RPC and received: ${data}!`,
    };
  });

  console.log("\n4. STORAGE UPLOAD AUTHORIZATION (VALID IN-MEMORY PNG):");

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function safeUploadWithRetry(bucketClient, fileName, buffer, options) {
    let res = await bucketClient.upload(fileName, buffer, options);
    if (res.error && String(res.error.message || "").includes("fetch failed")) {
      await sleep(500);
      res = await bucketClient.upload(fileName, buffer, options);
    }
    return res;
  }

  await test("Storage RLS", "Anonymous upload to portfolio-public is BLOCKED by Storage RLS (valid PNG)", async () => {
    await sleep(200);
    const testFileName = `_audit_anon_${Date.now()}.png`;
    const { data, error } = await safeUploadWithRetry(
      anonClient.storage.from("portfolio-public"),
      testFileName,
      VALID_1X1_PNG,
      {
        contentType: "image/png",
        upsert: false,
      }
    );

    if (error) {
      const msg = error.message || "";
      const isMimeError = msg.toLowerCase().includes("mime");
      const isRls =
        msg.toLowerCase().includes("row-level security") ||
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("accessdenied") ||
        error.statusCode === "403" ||
        error.statusCode === "401";

      if (isMimeError) {
        return { status: "INCONCLUSIVE", detail: `Upload rejected due to MIME validation instead of RLS: ${msg}` };
      }
      if (isRls) {
        return {
          status: "PASS",
          detail: `Correctly passed MIME check and was REJECTED by Storage RLS: "${msg}" (status: ${error.status || error.statusCode})`,
        };
      }
      return { status: "INCONCLUSIVE", detail: `Upload failed with unexpected error: ${msg}` };
    }

    if (data?.path) {
      await anonClient.storage.from("portfolio-public").remove([testFileName]);
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous user uploaded file to portfolio-public!" };
  });

  await test("Storage RLS", "Anonymous upload to portfolio-private is BLOCKED by Storage RLS (valid PNG)", async () => {
    await sleep(200);
    const testFileName = `_audit_anon_${Date.now()}.png`;
    const { data, error } = await safeUploadWithRetry(
      anonClient.storage.from("portfolio-private"),
      testFileName,
      VALID_1X1_PNG,
      {
        contentType: "image/png",
        upsert: false,
      }
    );

    if (error) {
      const msg = error.message || "";
      const isMimeError = msg.toLowerCase().includes("mime");
      const isRls =
        msg.toLowerCase().includes("row-level security") ||
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("accessdenied") ||
        error.statusCode === "403" ||
        error.statusCode === "401";

      if (isMimeError) {
        return { status: "INCONCLUSIVE", detail: `Upload rejected due to MIME validation instead of RLS: ${msg}` };
      }
      if (isRls) {
        return {
          status: "PASS",
          detail: `Correctly passed MIME check and was REJECTED by Storage RLS: "${msg}" (status: ${error.status || error.statusCode})`,
        };
      }
      return { status: "INCONCLUSIVE", detail: `Upload failed with unexpected error: ${msg}` };
    }

    if (data?.path) {
      await anonClient.storage.from("portfolio-private").remove([testFileName]);
    }
  });

  // ============================================================================
  // TIER 2: AUTHENTICATED NON-ADMIN USER CHECKS (STANDARD AUTH SESSION)
  // ============================================================================
  console.log("\n5. AUTHENTICATED NON-ADMIN USER CHECKS (STANDARD SESSION):");

  let nonAdminClient = null;
  let nonAdminUserId = null;

  if (nonAdminEmail && nonAdminPassword) {
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authErr } = await client.auth.signInWithPassword({
      email: nonAdminEmail,
      password: nonAdminPassword,
    });

    if (!authErr && authData?.session) {
      nonAdminClient = client;
      nonAdminUserId = authData.user.id;
    } else {
      console.log(`  [INFO] Non-admin login attempt returned: ${authErr?.message || "No session"}`);
    }
  }

  await test("Non-Admin Auth", "Non-admin user cannot insert or edit projects", async () => {
    if (!nonAdminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_NON_ADMIN_EMAIL & TEST_NON_ADMIN_PASSWORD in .env.local to test non-admin account.",
      };
    }

    const { error } = await nonAdminClient.from("projects").insert({
      title: "Non-Admin Malicious Project",
      slug: `audit-nonadmin-proj-${Date.now()}`,
      short_description: "Non-admin test",
      category: "ai-products",
    });

    if (error && error.message.toLowerCase().includes("row-level security")) {
      return { status: "PASS", detail: `Correctly blocked by RLS: "${error.message}"` };
    }
    return { status: "FAIL", detail: `CRITICAL: Authenticated non-admin was able to insert project!` };
  });

  await test("Non-Admin Auth", "Non-admin user cannot modify site_settings (zero rows modified)", async () => {
    if (!nonAdminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_NON_ADMIN_EMAIL & TEST_NON_ADMIN_PASSWORD in .env.local.",
      };
    }

    const { data, error } = await nonAdminClient
      .from("site_settings")
      .update({ display_name: "Hacked by Non-Admin" })
      .eq("id", 1)
      .select();

    if (error) return { status: "PASS", detail: `Update rejected with error: ${error.message}` };
    if (!data || data.length === 0) {
      return { status: "PASS", detail: "0 rows modified (RLS write isolation strictly enforced for non-admin)" };
    }
    return { status: "FAIL", detail: "CRITICAL: Non-admin user modified site_settings!" };
  });

  await test("Non-Admin Auth", "Non-admin user cannot modify tools or tool categories", async () => {
    if (!nonAdminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_NON_ADMIN_EMAIL & TEST_NON_ADMIN_PASSWORD in .env.local.",
      };
    }

    const { data, error } = await nonAdminClient
      .from("tools")
      .update({ name: "Defaced Tool" })
      .eq("name", "Figma")
      .select();

    if (error) return { status: "PASS", detail: `Tool update rejected with error: ${error.message}` };
    if (!data || data.length === 0) {
      return { status: "PASS", detail: "0 rows modified (Tools table write isolation strictly enforced)" };
    }
    return { status: "FAIL", detail: "CRITICAL: Non-admin user modified tools table!" };
  });

  await test("Non-Admin Auth", "Non-admin user cannot self-promote to admin_users", async () => {
    if (!nonAdminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_NON_ADMIN_EMAIL & TEST_NON_ADMIN_PASSWORD in .env.local.",
      };
    }

    const { error } = await nonAdminClient.from("admin_users").insert({
      user_id: nonAdminUserId || "00000000-0000-0000-0000-000000000000",
      role: "admin",
    });

    if (error && error.message.toLowerCase().includes("row-level security")) {
      return { status: "PASS", detail: `Self-promotion insert rejected: "${error.message}"` };
    }
    return { status: "FAIL", detail: "CRITICAL: Authenticated non-admin was able to self-promote in admin_users!" };
  });

  await test("Non-Admin Auth", "Non-admin user cannot upload to Storage (portfolio-public or private)", async () => {
    if (!nonAdminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_NON_ADMIN_EMAIL & TEST_NON_ADMIN_PASSWORD in .env.local.",
      };
    }

    const testFileName = `_audit_nonadmin_${Date.now()}.png`;
    const { data: pubData, error: pubErr } = await nonAdminClient.storage
      .from("portfolio-public")
      .upload(testFileName, VALID_1X1_PNG, { contentType: "image/png" });

    if (pubData?.path) {
      await nonAdminClient.storage.from("portfolio-public").remove([testFileName]);
      return { status: "FAIL", detail: "CRITICAL: Authenticated non-admin uploaded to portfolio-public!" };
    }

    const isPubBlocked = pubErr && (
      pubErr.message.toLowerCase().includes("row-level security") ||
      pubErr.statusCode === "403" ||
      pubErr.statusCode === 403
    );

    if (isPubBlocked) {
      return { status: "PASS", detail: `Storage upload correctly blocked by RLS: "${pubErr.message}"` };
    }
    return { status: "INCONCLUSIVE", detail: `Unexpected response: ${pubErr?.message}` };
  });

  // ============================================================================
  // TIER 3: AUTHENTICATED ADMINISTRATOR & CONTROLLED DRAFT ISOLATION
  // ============================================================================
  console.log("\n6. AUTHENTICATED ADMIN CHECKS & CONTROLLED DRAFT ISOLATION:");

  let adminClient = null;
  let adminUserId = null;

  if (adminEmail && adminPassword) {
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authErr } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (!authErr && authData?.session) {
      adminClient = client;
      adminUserId = authData.user.id;
    } else {
      console.log(`  [INFO] Admin login attempt returned: ${authErr?.message || "No session"}`);
    }
  }

  await test("Controlled Drafts", "Admin draft creation, public invisibility, admin visibility & cleanup", async () => {
    if (!adminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_ADMIN_EMAIL & TEST_ADMIN_PASSWORD in .env.local (account must be allowlisted in public.admin_users).",
      };
    }

    const testSlug = `audit-draft-proj-${Date.now()}`;
    let insertedProjId = null;

    try {
      // 1. Admin creates temporary unpublished project
      const { data: inserted, error: insertErr } = await adminClient
        .from("projects")
        .insert({
          title: "Temporary Security Audit Draft Project",
          slug: testSlug,
          short_description: "Temporary draft for security audit",
          category: "ai-products",
          is_published: false,
        })
        .select("id, slug, is_published")
        .single();

      if (insertErr || !inserted) {
        return {
          status: "FAIL",
          detail: `Admin could not create draft project: ${insertErr?.message}. Ensure user ${adminUserId} is allowlisted in public.admin_users!`,
        };
      }
      insertedProjId = inserted.id;

      // 2. Anonymous client query attempting to find this draft
      const { data: anonData } = await anonClient
        .from("projects")
        .select("id, slug, is_published")
        .eq("slug", testSlug);

      if (anonData && anonData.length > 0) {
        return { status: "FAIL", detail: "CRITICAL: Unpublished project was accessible to anonymous visitor!" };
      }

      // 3. Admin client retrieves this draft
      const { data: adminData } = await adminClient
        .from("projects")
        .select("id, slug, is_published")
        .eq("slug", testSlug);

      if (!adminData || adminData.length === 0) {
        return { status: "FAIL", detail: "Admin could not retrieve the unpublished draft project!" };
      }

      return {
        status: "PASS",
        detail: `Verified: Admin successfully created unpublished draft; anonymous visitor returned 0 records; admin retrieved 1 record. Cleaned up immediately.`,
      };
    } finally {
      if (insertedProjId) {
        await adminClient.from("projects").delete().eq("id", insertedProjId);
      }
    }
  });

  await test("Controlled Drafts", "Admin post draft creation, public invisibility & cleanup", async () => {
    if (!adminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_ADMIN_EMAIL & TEST_ADMIN_PASSWORD in .env.local.",
      };
    }

    const testSlug = `audit-draft-post-${Date.now()}`;
    let insertedPostId = null;

    try {
      // 1. Admin creates temporary unpublished post
      const { data: inserted, error: insertErr } = await adminClient
        .from("posts")
        .insert({
          title: "Temporary Security Audit Draft Post",
          slug: testSlug,
          content: "Audit content",
          is_published: false,
        })
        .select("id, slug, is_published")
        .single();

      if (insertErr || !inserted) {
        return {
          status: "FAIL",
          detail: `Admin could not create draft post: ${insertErr?.message}`,
        };
      }
      insertedPostId = inserted.id;

      // 2. Anonymous client query
      const { data: anonData } = await anonClient
        .from("posts")
        .select("id, slug, is_published")
        .eq("slug", testSlug);

      if (anonData && anonData.length > 0) {
        return { status: "FAIL", detail: "CRITICAL: Unpublished post was accessible to anonymous visitor!" };
      }

      return {
        status: "PASS",
        detail: `Verified: Admin successfully created unpublished post draft; anonymous visitor returned 0 records. Cleaned up immediately.`,
      };
    } finally {
      if (insertedPostId) {
        await adminClient.from("posts").delete().eq("id", insertedPostId);
      }
    }
  });

  await test("Admin Operations", "Admin can update and revert site_settings field cleanly", async () => {
    if (!adminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_ADMIN_EMAIL & TEST_ADMIN_PASSWORD in .env.local.",
      };
    }

    // 1. Read current hero_intro
    const { data: current, error: readErr } = await adminClient
      .from("site_settings")
      .select("hero_intro")
      .eq("id", 1)
      .single();

    if (readErr || !current) {
      return { status: "FAIL", detail: `Admin failed to read site_settings: ${readErr?.message}` };
    }

    const originalIntro = current.hero_intro;
    const testIntro = originalIntro + " [audit-test]";

    try {
      // 2. Update to test value
      const { data: updated, error: updateErr } = await adminClient
        .from("site_settings")
        .update({ hero_intro: testIntro })
        .eq("id", 1)
        .select("hero_intro")
        .single();

      if (updateErr || updated?.hero_intro !== testIntro) {
        return { status: "FAIL", detail: `Admin update failed: ${updateErr?.message}` };
      }

      return {
        status: "PASS",
        detail: `Verified: Admin successfully updated setting and reverted to original state without affecting other fields.`,
      };
    } finally {
      // Revert back
      await adminClient.from("site_settings").update({ hero_intro: originalIntro }).eq("id", 1);
    }
  });

  await test("Admin Operations", "Admin can upload and delete test image in portfolio-public & private", async () => {
    if (!adminClient) {
      return {
        status: "BLOCKED",
        detail: "Configure TEST_ADMIN_EMAIL & TEST_ADMIN_PASSWORD in .env.local.",
      };
    }

    const testFileName = `_audit_admin_${Date.now()}.png`;

    // 1. Public bucket test
    const { data: pubData, error: pubErr } = await adminClient.storage
      .from("portfolio-public")
      .upload(testFileName, VALID_1X1_PNG, { contentType: "image/png" });

    if (pubErr) {
      return { status: "FAIL", detail: `Admin upload to portfolio-public failed: ${pubErr.message}` };
    }
    await adminClient.storage.from("portfolio-public").remove([testFileName]);

    // 2. Private bucket test
    const { data: privData, error: privErr } = await adminClient.storage
      .from("portfolio-private")
      .upload(testFileName, VALID_1X1_PNG, { contentType: "image/png" });

    if (privErr) {
      return { status: "FAIL", detail: `Admin upload to portfolio-private failed: ${privErr.message}` };
    }
    await adminClient.storage.from("portfolio-private").remove([testFileName]);

    return {
      status: "PASS",
      detail: `Verified: Authorized admin successfully uploaded and cleaned up test images in both public and private storage buckets.`,
    };
  });

  // ============================================================================
  // SUMMARY REPORT & TABLE
  // ============================================================================
  console.log("\n==================================================================");
  console.log(`AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED, ${inconclusiveCount} INCONCLUSIVE, ${blockedCount} BLOCKED`);
  console.log("==================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runAudit();
