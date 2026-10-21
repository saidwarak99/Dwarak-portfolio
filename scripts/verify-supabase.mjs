// ==============================================================================
// Supabase Security & Schema Validation Script (Phase 2.3)
// Run with: npm run db:verify
// ==============================================================================

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. Check for .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  }
}

console.log("==================================================================");
console.log(" SAI DWARAK PORTFOLIO — SUPABASE SECURITY VALIDATOR (PHASE 2.3)");
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
  console.log("• 13 confirmed tools are preserved; galleries and build logs remain empty.");
  console.log("\nNEXT STEPS TO CONNECT A LIVE SUPABASE PROJECT:");
  console.log("1. Open https://database.new and create or select your project.");
  console.log("2. Copy your Project URL & Publishable/Anon Key from Settings -> API.");
  console.log("3. Create .env.local in the repository root:");
  console.log("   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co");
  console.log("   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>");
  console.log("4. In the Supabase SQL Editor, run:");
  console.log("   - supabase/migrations/20261021000001_initial_schema.sql");
  console.log("5. Re-run this script to execute live security validation:");
  console.log("   npm run db:verify\n");
  console.log("==================================================================");
  process.exit(0);
}

console.log(`Target URL: ${supabaseUrl}`);
console.log("Connecting as Anonymous Client to validate RLS security boundaries...\n");

const anonClient = createClient(supabaseUrl, supabaseKey);

async function runValidation() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      const result = await fn();
      if (result.success) {
        console.log(`  [PASS] ${name}`);
        if (result.detail) console.log(`         ↳ ${result.detail}`);
        passed++;
      } else {
        console.error(`  [FAIL] ${name}`);
        if (result.detail) console.error(`         ↳ ${result.detail}`);
        failed++;
      }
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ↳ Unexpected error: ${err.message}`);
      failed++;
    }
  }

  console.log("1. PUBLIC READ ACCESS CHECKS:");

  await test("Site settings are publicly readable", async () => {
    const { data, error } = await anonClient.from("site_settings").select("display_name, hero_headline").eq("id", 1).single();
    if (error) return { success: false, detail: error.message };
    return { success: true, detail: `Found display_name: "${data?.display_name}"` };
  });

  await test("Visible tools are publicly readable (13 confirmed tools)", async () => {
    const { data, error } = await anonClient.from("tools").select("name").eq("is_visible", true);
    if (error) return { success: false, detail: error.message };
    return { success: data.length === 13, detail: `Received ${data.length} tools (expected 13)` };
  });

  await test("Visible tool categories are publicly readable (4 categories)", async () => {
    const { data, error } = await anonClient.from("tool_categories").select("name").eq("is_visible", true);
    if (error) return { success: false, detail: error.message };
    return { success: data.length === 4, detail: `Received ${data.length} categories (expected 4)` };
  });

  console.log("\n2. RLS WRITE RESTRICTION CHECKS (ANONYMOUS USERS):");

  await test("Anonymous insertion into projects is BLOCKED", async () => {
    const { error } = await anonClient.from("projects").insert({
      title: "Malicious Injection",
      slug: "malicious-test",
      short_description: "Should fail",
      category: "ai-products",
    });
    if (error) return { success: true, detail: `Correctly rejected: ${error.message}` };
    return { success: false, detail: "Security violation: Anonymous insert succeeded!" };
  });

  await test("Anonymous insertion into posts is BLOCKED", async () => {
    const { error } = await anonClient.from("posts").insert({
      title: "Malicious Post",
      slug: "malicious-post",
      content: "Should fail",
    });
    if (error) return { success: true, detail: `Correctly rejected: ${error.message}` };
    return { success: false, detail: "Security violation: Anonymous insert succeeded!" };
  });

  await test("Anonymous update of site_settings is BLOCKED", async () => {
    const { data, error } = await anonClient.from("site_settings").update({ display_name: "Hacked" }).eq("id", 1).select();
    if (error) return { success: true, detail: `Correctly rejected: ${error.message}` };
    if (!data || data.length === 0) return { success: true, detail: "0 rows modified (RLS write isolation enforced)" };
    return { success: false, detail: "Security violation: Anonymous update succeeded!" };
  });

  console.log("\n3. ADMINISTRATIVE SELF-PROMOTION PROTECTION:");

  await test("Anonymous access to admin_users table is BLOCKED", async () => {
    const { data, error } = await anonClient.from("admin_users").select("*");
    if (error) return { success: true, detail: `Correctly rejected: ${error.message}` };
    if (!data || data.length === 0) return { success: true, detail: "Empty set returned (RLS enforced)" };
    return { success: false, detail: `Security violation: Anonymous user read ${data.length} admin records!` };
  });

  await test("Anonymous insertion into admin_users is BLOCKED", async () => {
    const { error } = await anonClient.from("admin_users").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      role: "super_admin",
    });
    if (error) return { success: true, detail: `Correctly rejected: ${error.message}` };
    return { success: false, detail: "Security violation: Self-promotion insert succeeded!" };
  });

  console.log("\n4. DRAFT AND UNPUBLISHED ISOLATION:");

  await test("Unpublished projects are INVISIBLE to anonymous visitors", async () => {
    const { data, error } = await anonClient.from("projects").select("*").eq("is_published", false);
    if (error) return { success: true, detail: `Query rejected: ${error.message}` };
    if (!data || data.length === 0) return { success: true, detail: "0 unpublished projects returned (isolation active)" };
    return { success: false, detail: `Security violation: ${data.length} unpublished projects exposed!` };
  });

  await test("Unpublished posts are INVISIBLE to anonymous visitors", async () => {
    const { data, error } = await anonClient.from("posts").select("*").eq("is_published", false);
    if (error) return { success: true, detail: `Query rejected: ${error.message}` };
    if (!data || data.length === 0) return { success: true, detail: "0 unpublished posts returned (isolation active)" };
    return { success: false, detail: `Security violation: ${data.length} unpublished posts exposed!` };
  });

  console.log("\n5. STORAGE ACCESS RESTRICTIONS:");

  await test("Anonymous upload to portfolio-public is BLOCKED", async () => {
    const dummyBlob = new Blob(["test"], { type: "text/plain" });
    const { error } = await anonClient.storage.from("portfolio-public").upload("malicious.txt", dummyBlob);
    if (error) return { success: true, detail: `Correctly rejected: ${error.message}` };
    return { success: false, detail: "Security violation: Anonymous upload succeeded!" };
  });

  await test("Anonymous upload to portfolio-private is BLOCKED", async () => {
    const dummyBlob = new Blob(["test"], { type: "text/plain" });
    const { error } = await anonClient.storage.from("portfolio-private").upload("malicious.txt", dummyBlob);
    if (error) return { success: true, detail: `Correctly rejected: ${error.message}` };
    return { success: false, detail: "Security violation: Anonymous upload succeeded!" };
  });

  console.log("\n==================================================================");
  console.log(`VALIDATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");
}

runValidation();
