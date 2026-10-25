// ==============================================================================
// Phase 3B — Comprehensive Verification Test Script
// Tests Tools CMS, Categories CMS, Blog Posts CMS, RLS, Draft Isolation, & Non-Admin Rejection
// Uses standard Supabase Auth sessions (zero service-role key needed).
// ==============================================================================

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Read configuration from .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
    if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY" || key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
      supabaseKey = value;
    }
    if (key === "TEST_ADMIN_EMAIL") adminEmail = value;
    if (key === "TEST_ADMIN_PASSWORD") adminPassword = value;
    if (key === "TEST_NON_ADMIN_EMAIL") nonAdminEmail = value;
    if (key === "TEST_NON_ADMIN_PASSWORD") nonAdminPassword = value;
  }
}

async function runPhase3BTests() {
  console.log("==================================================================");
  console.log(" SAI DWARAK PORTFOLIO — PHASE 3B COMPREHENSIVE VALIDATION");
  console.log(" Tools CMS, Categories CMS, Blog & Build Logs CMS, and Security");
  console.log("==================================================================\n");

  const anonClient = createClient(supabaseUrl, supabaseKey);
  const adminClient = createClient(supabaseUrl, supabaseKey);
  const nonAdminClient = createClient(supabaseUrl, supabaseKey);

  // Authenticate Admin
  const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (adminAuthErr || !adminAuth.session) {
    throw new Error(`Admin sign in failed: ${adminAuthErr?.message}`);
  }
  console.log(`[PASS] Admin session active: ${adminEmail}`);

  // Authenticate Non-Admin
  const { data: nonAdminAuth, error: nonAdminAuthErr } = await nonAdminClient.auth.signInWithPassword({
    email: nonAdminEmail,
    password: nonAdminPassword,
  });
  if (nonAdminAuthErr || !nonAdminAuth.session) {
    throw new Error(`Non-admin sign in failed: ${nonAdminAuthErr?.message}`);
  }
  console.log(`[PASS] Ordinary user session active: ${nonAdminEmail}\n`);

  let passed = 0;
  let failed = 0;

  function report(name, status, detail) {
    if (status) {
      passed++;
      console.log(`  [PASS] ${name}\n         ↳ ${detail}`);
    } else {
      failed++;
      console.log(`  [FAIL] ${name}\n         ↳ ${detail}`);
    }
  }

  // ----------------------------------------------------------------------------
  // TEST 1: Preserve 13 confirmed tools & 4 categories
  // ----------------------------------------------------------------------------
  console.log("1. PRESERVATION CHECKS (CONFIRMED DATA INTEGRITY):");
  const { data: initialTools } = await anonClient.from("tools").select("id, name, is_visible");
  const { data: initialCategories } = await anonClient.from("tool_categories").select("id, name, is_visible");

  report(
    "Preserve 13 confirmed workflow tools",
    initialTools?.length === 13,
    `Retrieved exactly ${initialTools?.length} active confirmed tools`
  );

  report(
    "Preserve 4 workflow tool categories",
    initialCategories?.length === 4,
    `Retrieved exactly ${initialCategories?.length} active categories`
  );

  // ----------------------------------------------------------------------------
  // TEST 2: Admin Tool CRUD & Visibility Impact
  // ----------------------------------------------------------------------------
  console.log("\n2. TOOLS CMS MUTATIONS & PUBLIC VISIBILITY REFLECTION:");
  let testToolId = null;
  try {
    // A. Create tool
    const { data: createdTool, error: toolCreateErr } = await adminClient
      .from("tools")
      .insert({
        name: "Test Automated Tool",
        description: "Testing tool creation in Phase 3B CMS.",
        category_id: initialCategories[0].id,
        is_visible: true,
        display_order: 99,
      })
      .select()
      .single();

    if (toolCreateErr) throw toolCreateErr;
    testToolId = createdTool.id;

    report(
      "Admin can create a new tool",
      Boolean(createdTool?.id),
      `Tool created successfully (ID: ${createdTool.id}, name: "${createdTool.name}")`
    );

    // B. Public query sees visible tool
    const { data: publicVisible } = await anonClient
      .from("tools")
      .select("id, name")
      .eq("id", testToolId);

    report(
      "Public queries include visible tool",
      publicVisible?.length === 1,
      `Anonymous visitor retrieved ${publicVisible?.length} visible tool`
    );

    // C. Edit tool to hidden (is_visible = false)
    const { error: hideErr } = await adminClient
      .from("tools")
      .update({ is_visible: false })
      .eq("id", testToolId);

    if (hideErr) throw hideErr;

    // D. Public query excludes hidden tool
    const { data: publicHidden } = await anonClient
      .from("tools")
      .select("id, name")
      .eq("id", testToolId);

    report(
      "Tool visibility change (is_visible = false) immediately hides tool from public",
      publicHidden?.length === 0,
      `Anonymous visitor received ${publicHidden?.length} records after tool was marked hidden`
    );

  } finally {
    if (testToolId) {
      await adminClient.from("tools").delete().eq("id", testToolId);
    }
  }

  // Confirm count restored to exactly 13
  const { data: restoredTools } = await anonClient.from("tools").select("id");
  report(
    "Tool deletion cleaned up without damaging existing 13 tools",
    restoredTools?.length === 13,
    `Active tool count cleanly restored to ${restoredTools?.length}`
  );

  // ----------------------------------------------------------------------------
  // TEST 3: Blog Posts Draft Isolation, Publishing, & Unpublishing
  // ----------------------------------------------------------------------------
  console.log("\n3. BLOG & BUILD LOGS CMS (DRAFT ISOLATION, PUBLISH, & UNPUBLISH):");
  let testPostId = null;
  const testPostSlug = `test-build-log-${Date.now()}`;

  try {
    // A. Create Post Draft (is_published = false)
    const { data: postDraft, error: postCreateErr } = await adminClient
      .from("posts")
      .insert({
        title: "Phase 3B Automated Architecture Log",
        slug: testPostSlug,
        excerpt: "Exploring multi-turn reasoning and CMS security.",
        content: "# Architectural Insights\n\nTesting Markdown body rendering.",
        category: "build-log",
        tags: ["Architecture", "Testing", "Next.js"],
        is_published: false,
      })
      .select()
      .single();

    if (postCreateErr) throw postCreateErr;
    testPostId = postDraft.id;

    report(
      "Admin can create a new post draft",
      Boolean(postDraft?.id),
      `Draft created with ID: ${postDraft.id}, is_published: false`
    );

    // B. Anonymous visitor cannot retrieve unpublished draft
    const { data: anonDraft } = await anonClient
      .from("posts")
      .select("id, title")
      .eq("id", testPostId);

    report(
      "Unpublished post draft is strictly isolated from anonymous visitors",
      anonDraft?.length === 0,
      `Anonymous query returned ${anonDraft?.length} records (RLS enforced)`
    );

    // C. Publish post
    const { error: publishErr } = await adminClient
      .from("posts")
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq("id", testPostId);

    if (publishErr) throw publishErr;

    // D. Public query sees published post
    const { data: publicPost } = await anonClient
      .from("posts")
      .select("id, title, is_published")
      .eq("id", testPostId)
      .single();

    report(
      "Publishing makes post publicly accessible to visitors",
      Boolean(publicPost?.is_published),
      `Public visitor retrieved post: "${publicPost?.title}"`
    );

    // E. Unpublish post
    const { error: unpublishErr } = await adminClient
      .from("posts")
      .update({ is_published: false })
      .eq("id", testPostId);

    if (unpublishErr) throw unpublishErr;

    // F. Public query cannot retrieve unpublished post
    const { data: recheckedPost } = await anonClient
      .from("posts")
      .select("id")
      .eq("id", testPostId);

    report(
      "Unpublishing immediately isolates post from public queries again",
      recheckedPost?.length === 0,
      `Public query returned ${recheckedPost?.length} records after unpublishing`
    );

  } finally {
    if (testPostId) {
      await adminClient.from("posts").delete().eq("id", testPostId);
    }
  }

  // Confirm post table restored to 0 public posts
  const { data: publicPostsCount } = await anonClient.from("posts").select("id");
  report(
    "Public post gallery restored to clean 0-post state",
    publicPostsCount?.length === 0,
    `Confirmed ${publicPostsCount?.length} posts exposed to public`
  );

  // ----------------------------------------------------------------------------
  // TEST 4: Security Rejection of Non-Admin Users
  // ----------------------------------------------------------------------------
  console.log("\n4. NON-ADMIN SECURITY REJECTION (RLS & FUNCTION AUTHORIZATION):");

  // A. Non-admin cannot create tool
  const { error: nonAdminToolErr } = await nonAdminClient
    .from("tools")
    .insert({
      name: "Unauthorized Hacker Tool",
      description: "Should fail.",
      is_visible: true,
    });

  report(
    "Non-admin cannot insert into tools",
    Boolean(nonAdminToolErr),
    `Rejected by RLS: "${nonAdminToolErr?.message}"`
  );

  // B. Non-admin cannot create category
  const { error: nonAdminCatErr } = await nonAdminClient
    .from("tool_categories")
    .insert({
      name: "Unauthorized Category",
      slug: "unauthorized-category",
    });

  report(
    "Non-admin cannot insert into tool_categories",
    Boolean(nonAdminCatErr),
    `Rejected by RLS: "${nonAdminCatErr?.message}"`
  );

  // C. Non-admin cannot create post
  const { error: nonAdminPostErr } = await nonAdminClient
    .from("posts")
    .insert({
      title: "Unauthorized Post",
      slug: "unauthorized-post",
      content: "Should fail.",
    });

  report(
    "Non-admin cannot insert into posts",
    Boolean(nonAdminPostErr),
    `Rejected by RLS: "${nonAdminPostErr?.message}"`
  );

  // D. Non-admin cannot modify existing tools
  const { data: nonAdminToolMod } = await nonAdminClient
    .from("tools")
    .update({ name: "Tampered" })
    .eq("id", initialTools[0].id)
    .select();

  report(
    "Non-admin cannot modify existing tools",
    !nonAdminToolMod || nonAdminToolMod.length === 0,
    `0 rows modified by ordinary authenticated user`
  );

  console.log("\n==================================================================");
  console.log(` PHASE 3B SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3BTests().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
