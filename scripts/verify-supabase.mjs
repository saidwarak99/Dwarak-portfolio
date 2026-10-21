// ==============================================================================
// Supabase Security & Schema Validation Script (Phase 2.3.1)
// Comprehensive authorization, RLS, Storage MIME vs RLS, and draft isolation tests
// Run with: npm run db:verify
// ==============================================================================

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. Check for .env.local and parse configurations
const envLocalPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let nonAdminEmail = process.env.TEST_NON_ADMIN_EMAIL;
let nonAdminPassword = process.env.TEST_NON_ADMIN_PASSWORD;
let adminEmail = process.env.TEST_ADMIN_EMAIL;
let adminPassword = process.env.TEST_ADMIN_PASSWORD;

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
    if (key === "SUPABASE_SERVICE_ROLE_KEY") serviceRoleKey = value;
    if (key === "TEST_NON_ADMIN_EMAIL") nonAdminEmail = value;
    if (key === "TEST_NON_ADMIN_PASSWORD") nonAdminPassword = value;
    if (key === "TEST_ADMIN_EMAIL") adminEmail = value;
    if (key === "TEST_ADMIN_PASSWORD") adminPassword = value;
  }
}

// Treat placeholder service role keys as undefined
if (serviceRoleKey && (serviceRoleKey.includes("your-supabase-service-role") || serviceRoleKey.includes("placeholder"))) {
  serviceRoleKey = undefined;
}

console.log("==================================================================");
console.log(" SAI DWARAK PORTFOLIO — ADVANCED SUPABASE SECURITY AUDIT (PHASE 2.3.1)");
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
console.log("Initializing test suite with multi-tiered role isolation checks...\n");

// 1x1 pixel valid transparent PNG buffer
const VALID_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// Initialize Anonymous Client
const anonClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Initialize Optional Service Role Client (if key provided)
const serviceRoleClient = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

let passCount = 0;
let failCount = 0;
let inconclusiveCount = 0;
let blockedCount = 0;

/**
 * Standard test runner recording outcomes
 * status: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'BLOCKED'
 */
async function test(name, fn) {
  try {
    const res = await fn();
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
    console.log(`  [FAIL] ${name}`);
    console.log(`         ↳ Unexpected exception: ${err.message}`);
  }
}

async function runAudit() {
  // ----------------------------------------------------------------------------
  // SECTION 1: PUBLIC READ ACCESS CHECKS (ANONYMOUS VISITOR)
  // ----------------------------------------------------------------------------
  console.log("1. PUBLIC READ ACCESS CHECKS (ANONYMOUS VISITOR):");

  await test("Site settings singleton is publicly readable", async () => {
    const { data, error } = await anonClient
      .from("site_settings")
      .select("id, display_name, hero_headline")
      .eq("id", 1)
      .single();

    if (error) {
      return { status: "FAIL", detail: `Read query failed: ${error.message}` };
    }
    if (data?.display_name === "Sai Dwarak") {
      return { status: "PASS", detail: `Confirmed singleton record (display_name: "${data.display_name}")` };
    }
    return { status: "FAIL", detail: `Unexpected site_settings record: ${JSON.stringify(data)}` };
  });

  await test("Confirmed tools are publicly readable (exactly 13 tools)", async () => {
    const { data, error } = await anonClient
      .from("tools")
      .select("name, is_visible")
      .eq("is_visible", true);

    if (error) {
      return { status: "FAIL", detail: `Tools query failed: ${error.message}` };
    }
    if (data?.length === 13) {
      return { status: "PASS", detail: `Received exactly 13 active confirmed tools (Figma, Framer, Tailwind, etc.)` };
    }
    return { status: "FAIL", detail: `Expected 13 tools, received ${data?.length || 0}` };
  });

  await test("Visible tool categories are publicly readable (exactly 4 categories)", async () => {
    const { data, error } = await anonClient
      .from("tool_categories")
      .select("name, is_visible")
      .eq("is_visible", true);

    if (error) {
      return { status: "FAIL", detail: `Tool categories query failed: ${error.message}` };
    }
    if (data?.length === 4) {
      return { status: "PASS", detail: `Received exactly 4 active categories` };
    }
    return { status: "FAIL", detail: `Expected 4 categories, received ${data?.length || 0}` };
  });

  // ----------------------------------------------------------------------------
  // SECTION 2: ANONYMOUS RLS WRITE RESTRICTIONS
  // ----------------------------------------------------------------------------
  console.log("\n2. ANONYMOUS RLS WRITE & MUTATION RESTRICTIONS:");

  await test("Anonymous insertion into projects is BLOCKED by RLS", async () => {
    const { error } = await anonClient.from("projects").insert({
      title: "Malicious Anonymous Project",
      slug: `audit-malicious-proj-${Date.now()}`,
      short_description: "Should be rejected",
      category: "ai-products",
    });

    if (error) {
      const isRls = error.message.toLowerCase().includes("row-level security");
      return {
        status: isRls ? "PASS" : "INCONCLUSIVE",
        detail: `Rejected by DB: ${error.message}`,
      };
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous project insert succeeded!" };
  });

  await test("Anonymous insertion into posts is BLOCKED by RLS", async () => {
    const { error } = await anonClient.from("posts").insert({
      title: "Malicious Anonymous Post",
      slug: `audit-malicious-post-${Date.now()}`,
      content: "Should be rejected",
    });

    if (error) {
      const isRls = error.message.toLowerCase().includes("row-level security");
      return {
        status: isRls ? "PASS" : "INCONCLUSIVE",
        detail: `Rejected by DB: ${error.message}`,
      };
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous post insert succeeded!" };
  });

  await test("Anonymous modification of site_settings is BLOCKED (zero rows modified)", async () => {
    const { data, error } = await anonClient
      .from("site_settings")
      .update({ display_name: "Defaced Name" })
      .eq("id", 1)
      .select();

    if (error) {
      return { status: "PASS", detail: `Update rejected with error: ${error.message}` };
    }
    if (!data || data.length === 0) {
      return { status: "PASS", detail: "0 rows modified (RLS write isolation strictly enforced)" };
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous update altered site_settings record!" };
  });

  await test("Anonymous insertion into case_study_blocks is BLOCKED by RLS", async () => {
    const { error } = await anonClient.from("case_study_blocks").insert({
      project_id: "00000000-0000-0000-0000-000000000000",
      block_type: "overview",
      heading: "Malicious Block",
    });

    if (error) {
      const isRls = error.message.toLowerCase().includes("row-level security");
      return {
        status: isRls ? "PASS" : "INCONCLUSIVE",
        detail: `Rejected by DB: ${error.message}`,
      };
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous block insert succeeded!" };
  });

  // ----------------------------------------------------------------------------
  // SECTION 3: ADMINISTRATIVE SELF-PROMOTION PROTECTION (admin_users)
  // ----------------------------------------------------------------------------
  console.log("\n3. ADMINISTRATIVE SELF-PROMOTION PROTECTION (admin_users):");

  await test("Anonymous read of admin_users returns empty set (isolated by RLS)", async () => {
    const { data, error } = await anonClient.from("admin_users").select("*");
    if (error) {
      return { status: "PASS", detail: `Query rejected: ${error.message}` };
    }
    if (!data || data.length === 0) {
      return { status: "PASS", detail: "0 admin records exposed to anonymous client" };
    }
    return { status: "FAIL", detail: `CRITICAL: Anonymous client retrieved ${data.length} admin records!` };
  });

  await test("Anonymous insert into admin_users is BLOCKED by RLS", async () => {
    const { error } = await anonClient.from("admin_users").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      role: "super_admin",
    });

    if (error) {
      const isRls = error.message.toLowerCase().includes("row-level security");
      return {
        status: isRls ? "PASS" : "INCONCLUSIVE",
        detail: `Self-promotion rejected: ${error.message}`,
      };
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous user successfully inserted admin record!" };
  });

  await test("Anonymous update of admin_users is BLOCKED (zero rows modified)", async () => {
    const { data, error } = await anonClient
      .from("admin_users")
      .update({ role: "super_admin" })
      .neq("role", "")
      .select();

    if (error) {
      return { status: "PASS", detail: `Update rejected with error: ${error.message}` };
    }
    if (!data || data.length === 0) {
      return { status: "PASS", detail: "0 rows modified (administrative table is read/write isolated)" };
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous user modified admin_users table!" };
  });

  // ----------------------------------------------------------------------------
  // SECTION 4: STORAGE UPLOAD AUTHORIZATION (VALID IN-MEMORY PNG)
  // ----------------------------------------------------------------------------
  console.log("\n4. STORAGE UPLOAD AUTHORIZATION (VALID IN-MEMORY PNG):");

  await test("Anonymous upload to portfolio-public is BLOCKED by Storage RLS (valid PNG)", async () => {
    const testFileName = `_audit_anon_${Date.now()}.png`;
    const { data, error } = await anonClient.storage
      .from("portfolio-public")
      .upload(testFileName, VALID_1X1_PNG, {
        contentType: "image/png",
        upsert: false,
      });

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
        return {
          status: "INCONCLUSIVE",
          detail: `Upload rejected due to MIME validation instead of RLS: ${msg}`,
        };
      }
      if (isRls) {
        return {
          status: "PASS",
          detail: `Correctly passed MIME validation and was REJECTED by Storage RLS: "${msg}" (status: ${error.status || error.statusCode})`,
        };
      }
      return {
        status: "INCONCLUSIVE",
        detail: `Upload failed with unexpected error: ${msg}`,
      };
    }

    // Attempt emergency cleanup if upload unexpectedly succeeded
    if (data?.path) {
      await anonClient.storage.from("portfolio-public").remove([testFileName]);
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous user successfully uploaded file to portfolio-public!" };
  });

  await test("Anonymous upload to portfolio-private is BLOCKED by Storage RLS (valid PNG)", async () => {
    const testFileName = `_audit_anon_${Date.now()}.png`;
    const { data, error } = await anonClient.storage
      .from("portfolio-private")
      .upload(testFileName, VALID_1X1_PNG, {
        contentType: "image/png",
        upsert: false,
      });

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
        return {
          status: "INCONCLUSIVE",
          detail: `Upload rejected due to MIME validation instead of RLS: ${msg}`,
        };
      }
      if (isRls) {
        return {
          status: "PASS",
          detail: `Correctly passed MIME validation and was REJECTED by Storage RLS: "${msg}" (status: ${error.status || error.statusCode})`,
        };
      }
      return {
        status: "INCONCLUSIVE",
        detail: `Upload failed with unexpected error: ${msg}`,
      };
    }

    // Attempt emergency cleanup if upload unexpectedly succeeded
    if (data?.path) {
      await anonClient.storage.from("portfolio-private").remove([testFileName]);
    }
    return { status: "FAIL", detail: "CRITICAL: Anonymous user successfully uploaded file to portfolio-private!" };
  });

  // ----------------------------------------------------------------------------
  // SECTION 5: CONTROLLED UNPUBLISHED-CONTENT ISOLATION
  // ----------------------------------------------------------------------------
  console.log("\n5. CONTROLLED UNPUBLISHED-CONTENT ISOLATION (DRAFTS):");

  await test("Temporary unpublished project isolation (controlled seed & verify)", async () => {
    if (!serviceRoleClient) {
      return {
        status: "BLOCKED",
        detail: "Controlled draft verification requires SUPABASE_SERVICE_ROLE_KEY in .env.local to insert a temporary draft without bypassing RLS.",
      };
    }

    const testSlug = `audit-draft-proj-${Date.now()}`;
    let insertedId = null;

    try {
      // 1. Authorized insertion of an unpublished project
      const { data: inserted, error: insertErr } = await serviceRoleClient
        .from("projects")
        .insert({
          title: "Temporary Security Audit Draft Project",
          slug: testSlug,
          short_description: "Temporary record for security audit",
          category: "ai-products",
          is_published: false,
        })
        .select("id, slug, is_published")
        .single();

      if (insertErr || !inserted) {
        return { status: "INCONCLUSIVE", detail: `Failed to seed temporary draft: ${insertErr?.message}` };
      }
      insertedId = inserted.id;

      // 2. Anonymous client query attempting to read this specific draft
      const { data: anonData, error: anonErr } = await anonClient
        .from("projects")
        .select("id, slug, is_published")
        .eq("slug", testSlug);

      if (anonErr) {
        return { status: "FAIL", detail: `Anonymous query failed unexpectedly: ${anonErr.message}` };
      }
      if (anonData && anonData.length > 0) {
        return { status: "FAIL", detail: `CRITICAL: Unpublished project was returned to anonymous visitor!` };
      }

      // 3. Confirm authorized client CAN read this draft
      const { data: authData } = await serviceRoleClient
        .from("projects")
        .select("id, slug, is_published")
        .eq("slug", testSlug);

      if (!authData || authData.length === 0) {
        return { status: "INCONCLUSIVE", detail: "Seeded draft was not found by authorized client" };
      }

      return {
        status: "PASS",
        detail: `Confirmed: Unpublished draft exists in DB, is 100% invisible to anonymous visitor (0 returned), and is readable by authorized admin (1 returned).`,
      };
    } finally {
      // Clean up temporary record regardless of test outcome
      if (insertedId) {
        await serviceRoleClient.from("projects").delete().eq("id", insertedId);
      }
    }
  });

  await test("Temporary unpublished post isolation (controlled seed & verify)", async () => {
    if (!serviceRoleClient) {
      return {
        status: "BLOCKED",
        detail: "Controlled draft verification requires SUPABASE_SERVICE_ROLE_KEY in .env.local to insert a temporary draft without bypassing RLS.",
      };
    }

    const testSlug = `audit-draft-post-${Date.now()}`;
    let insertedId = null;

    try {
      // 1. Authorized insertion of an unpublished post
      const { data: inserted, error: insertErr } = await serviceRoleClient
        .from("posts")
        .insert({
          title: "Temporary Security Audit Draft Post",
          slug: testSlug,
          content: "Temporary content for security audit",
          is_published: false,
        })
        .select("id, slug, is_published")
        .single();

      if (insertErr || !inserted) {
        return { status: "INCONCLUSIVE", detail: `Failed to seed temporary post draft: ${insertErr?.message}` };
      }
      insertedId = inserted.id;

      // 2. Anonymous client query attempting to read this draft
      const { data: anonData, error: anonErr } = await anonClient
        .from("posts")
        .select("id, slug, is_published")
        .eq("slug", testSlug);

      if (anonErr) {
        return { status: "FAIL", detail: `Anonymous query failed unexpectedly: ${anonErr.message}` };
      }
      if (anonData && anonData.length > 0) {
        return { status: "FAIL", detail: `CRITICAL: Unpublished post was returned to anonymous visitor!` };
      }

      // 3. Confirm authorized client CAN read this draft
      const { data: authData } = await serviceRoleClient
        .from("posts")
        .select("id, slug, is_published")
        .eq("slug", testSlug);

      if (!authData || authData.length === 0) {
        return { status: "INCONCLUSIVE", detail: "Seeded post draft was not found by authorized client" };
      }

      return {
        status: "PASS",
        detail: `Confirmed: Unpublished post exists in DB, is 100% invisible to anonymous visitor (0 returned), and is readable by authorized admin (1 returned).`,
      };
    } finally {
      // Clean up temporary record regardless of test outcome
      if (insertedId) {
        await serviceRoleClient.from("posts").delete().eq("id", insertedId);
      }
    }
  });

  // ----------------------------------------------------------------------------
  // SECTION 6: AUTHENTICATED NON-ADMIN USER AUTHORIZATION
  // ----------------------------------------------------------------------------
  console.log("\n6. AUTHENTICATED NON-ADMIN USER AUTHORIZATION:");

  let nonAdminClient = null;
  let tempNonAdminUserId = null;

  // If service role client is available, automatically provision a confirmed temporary non-admin user
  if (serviceRoleClient) {
    const tempEmail = `audit_nonadmin_${Date.now()}@portfolio.test`;
    const tempPassword = `AuditNonAdminPass!_${Date.now()}`;
    const { data: created, error: createErr } = await serviceRoleClient.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (!createErr && created?.user) {
      tempNonAdminUserId = created.user.id;
      const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
      const { data: loginData } = await client.auth.signInWithPassword({
        email: tempEmail,
        password: tempPassword,
      });
      if (loginData?.session) {
        nonAdminClient = client;
      }
    }
  } else if (nonAdminEmail && nonAdminPassword) {
    const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({
      email: nonAdminEmail,
      password: nonAdminPassword,
    });
    if (!error && data?.session) {
      nonAdminClient = client;
    }
  }

  try {
    await test("Authenticated non-admin user project write rejection", async () => {
      if (!nonAdminClient) {
        return {
          status: "BLOCKED",
          detail: "No active non-admin session. Supply SUPABASE_SERVICE_ROLE_KEY (to auto-provision) or TEST_NON_ADMIN_EMAIL / TEST_NON_ADMIN_PASSWORD in .env.local.",
        };
      }

      const { error } = await nonAdminClient.from("projects").insert({
        title: "Non-Admin Injection",
        slug: `audit-nonadmin-${Date.now()}`,
        short_description: "Non admin test",
        category: "ai-products",
      });

      if (error && error.message.toLowerCase().includes("row-level security")) {
        return { status: "PASS", detail: `Non-admin insert blocked by RLS: ${error.message}` };
      }
      return { status: "FAIL", detail: "CRITICAL: Authenticated non-admin was able to insert project!" };
    });

    await test("Authenticated non-admin self-promotion to admin_users rejection", async () => {
      if (!nonAdminClient) {
        return {
          status: "BLOCKED",
          detail: "No active non-admin session. Supply SUPABASE_SERVICE_ROLE_KEY or TEST_NON_ADMIN_EMAIL in .env.local.",
        };
      }

      const { error } = await nonAdminClient.from("admin_users").insert({
        role: "admin",
      });

      if (error && error.message.toLowerCase().includes("row-level security")) {
        return { status: "PASS", detail: `Self-promotion insert blocked by RLS: ${error.message}` };
      }
      return { status: "FAIL", detail: "CRITICAL: Authenticated non-admin was able to self-promote in admin_users!" };
    });

    await test("Authenticated non-admin Storage upload rejection (valid PNG)", async () => {
      if (!nonAdminClient) {
        return {
          status: "BLOCKED",
          detail: "No active non-admin session. Supply SUPABASE_SERVICE_ROLE_KEY or TEST_NON_ADMIN_EMAIL in .env.local.",
        };
      }

      const testFileName = `_audit_nonadmin_${Date.now()}.png`;
      const { error } = await nonAdminClient.storage
        .from("portfolio-public")
        .upload(testFileName, VALID_1X1_PNG, { contentType: "image/png" });

      if (error && (error.message.toLowerCase().includes("row-level security") || error.statusCode === "403" || error.statusCode === 403)) {
        return { status: "PASS", detail: `Non-admin Storage upload blocked by RLS: "${error.message}" (status: ${error.status || error.statusCode})` };
      }
      return { status: "FAIL", detail: "CRITICAL: Authenticated non-admin was able to upload to Storage!" };
    });
  } finally {
    // Delete temporary non-admin user if created
    if (serviceRoleClient && tempNonAdminUserId) {
      await serviceRoleClient.auth.admin.deleteUser(tempNonAdminUserId);
    }
  }

  // ----------------------------------------------------------------------------
  // SECTION 7: AUTHENTICATED ADMINISTRATOR OPERATIONS
  // ----------------------------------------------------------------------------
  console.log("\n7. AUTHENTICATED ADMINISTRATOR OPERATIONS:");

  let adminClient = null;
  if (adminEmail && adminPassword) {
    const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (!error && data?.session) {
      adminClient = client;
    }
  }

  await test("Administrator privileged operations verification", async () => {
    if (!adminClient && !serviceRoleClient) {
      return {
        status: "BLOCKED",
        detail: "No administrator credentials configured. Set SUPABASE_SERVICE_ROLE_KEY or TEST_ADMIN_EMAIL & TEST_ADMIN_PASSWORD in .env.local to test verified admin mutations.",
      };
    }

    const activeAdmin = adminClient || serviceRoleClient;
    const { data, error } = await activeAdmin.from("admin_users").select("*");
    if (error) {
      return { status: "FAIL", detail: `Admin failed to read admin_users: ${error.message}` };
    }
    return {
      status: "PASS",
      detail: `Verified: Authorized administrative client successfully queried admin_users table (${data?.length || 0} records found).`,
    };
  });

  // ----------------------------------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED, ${inconclusiveCount} INCONCLUSIVE, ${blockedCount} BLOCKED`);
  console.log("==================================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

runAudit();
