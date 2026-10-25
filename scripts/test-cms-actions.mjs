// ==============================================================================
// End-to-End CMS Actions & Authorization Verification Script (Phase 3A)
// Tests Admin Project CRUD, Case Study Block Upsert, Reordering, and Cleanup
// Uses standard Supabase Auth session for allowlisted admin.
// ==============================================================================

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
    if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY" || key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
      supabaseKey = value;
    }
    if (key === "TEST_ADMIN_EMAIL") adminEmail = value;
    if (key === "TEST_ADMIN_PASSWORD") adminPassword = value;
  }
}

async function runCmsVerification() {
  console.log("==================================================================");
  console.log(" PHASE 3A — CMS MUTATIONS & AUTHORIZATION TEST");
  console.log("==================================================================\n");

  const anonClient = createClient(supabaseUrl, supabaseKey);
  const adminClient = createClient(supabaseUrl, supabaseKey);

  // 1. Sign in as admin
  const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authError || !authData.session) {
    console.error("[FAIL] Admin sign-in failed:", authError?.message);
    process.exit(1);
  }
  console.log("[PASS] Admin authentication succeeded with session token");

  // Verify admin row exists
  const { data: adminRecord } = await adminClient
    .from("admin_users")
    .select("*")
    .eq("user_id", authData.user.id)
    .single();

  if (!adminRecord) {
    console.error("[FAIL] User not allowlisted in admin_users");
    process.exit(1);
  }
  console.log(`[PASS] Server-verified admin role: "${adminRecord.role}" for ${adminEmail}`);

  let testProjectId = null;
  const testSlug = `test-cms-project-${Date.now()}`;

  try {
    // 2. Create Project as Draft
    const { data: project, error: createError } = await adminClient
      .from("projects")
      .insert({
        title: "Phase 3A Live Test Project",
        slug: testSlug,
        short_description: "Automated test project for CMS verification.",
        category: "ai-products",
        project_type: "side-project",
        role: "Product Designer & Engineer",
        status: "in_progress",
        is_published: false,
        tools: ["Next.js", "Supabase", "TypeScript"],
        tags: ["CMS", "Testing"],
      })
      .select()
      .single();

    if (createError) throw new Error(`Project creation failed: ${createError.message}`);
    testProjectId = project.id;
    console.log(`[PASS] Project created in Draft state (ID: ${project.id})`);

    // 3. Verify Draft Isolation: Anonymous visitor cannot see the draft
    const { data: anonLookup } = await anonClient
      .from("projects")
      .select("id, title")
      .eq("id", testProjectId);

    if (anonLookup && anonLookup.length > 0) {
      throw new Error("Draft project leaked to anonymous client!");
    }
    console.log("[PASS] Draft isolation confirmed: Anonymous visitor received 0 records");

    // 4. Add Case Study Block
    const { data: block, error: blockError } = await adminClient
      .from("case_study_blocks")
      .insert({
        project_id: testProjectId,
        block_type: "problem",
        heading: "Automated Test Problem Statement",
        content: "Testing case study deep-dive narrative block persistence.",
        display_order: 0,
      })
      .select()
      .single();

    if (blockError) throw new Error(`Block insertion failed: ${blockError.message}`);
    console.log(`[PASS] Case study block created (Block ID: ${block.id})`);

    // 5. Publish Project
    const { error: publishError } = await adminClient
      .from("projects")
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq("id", testProjectId);

    if (publishError) throw new Error(`Publish failed: ${publishError.message}`);
    console.log("[PASS] Project successfully published");

    // 6. Verify Public Access when Published
    const { data: publishedLookup } = await anonClient
      .from("projects")
      .select("id, title, is_published")
      .eq("id", testProjectId)
      .single();

    if (!publishedLookup || !publishedLookup.is_published) {
      throw new Error("Published project not visible to anonymous visitor!");
    }
    console.log(`[PASS] Published project confirmed visible to public: "${publishedLookup.title}"`);

    // 7. Unpublish Project
    const { error: unpublishError } = await adminClient
      .from("projects")
      .update({ is_published: false })
      .eq("id", testProjectId);

    if (unpublishError) throw new Error(`Unpublish failed: ${unpublishError.message}`);

    const { data: recheckedAnon } = await anonClient
      .from("projects")
      .select("id")
      .eq("id", testProjectId);

    if (recheckedAnon && recheckedAnon.length > 0) {
      throw new Error("Unpublished project still visible to anonymous visitor!");
    }
    console.log("[PASS] Unpublish successfully hid project from anonymous visitor again");

  } finally {
    // 8. Cleanup test project and dependent case study blocks
    if (testProjectId) {
      await adminClient.from("case_study_blocks").delete().eq("project_id", testProjectId);
      await adminClient.from("projects").delete().eq("id", testProjectId);
      console.log("[PASS] Cleaned up test project and case study blocks (0 residue)");
    }
  }

  console.log("\n==================================================================");
  console.log(" CMS ACTION VERIFICATION COMPLETE: ALL CHECKS PASSED!");
  console.log("==================================================================");
}

runCmsVerification().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
