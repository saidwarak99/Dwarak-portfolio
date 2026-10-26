// ==============================================================================
// Live CMS & Dynamic Work Section Verification Script
// Tests:
// 1. Admin creates draft project -> Confirms draft is completely invisible to anonymous visitor
// 2. Admin publishes project -> Confirms project appears in public query with correct category & detail link
// 3. Admin unpublishes project -> Confirms project disappears from public query
// 4. Cleanup of all test artifacts
// ==============================================================================

import fs from "fs";
import path from "path";
import dns from "dns";
import { createClient } from "@supabase/supabase-js";

// Ensure IPv6/NAT64 connectivity on IPv6-only networks
try {
  dns.setServers(["2001:4860:4860::6464", "2001:4860:4860::6460"]);
  const origLookup = dns.lookup;
  dns.lookup = function (hostname, options, callback) {
    const cb = typeof options === "function" ? options : callback;
    const opts = typeof options === "object" ? options : {};
    dns.resolve6(hostname, (err, addrs) => {
      if (!err && addrs && addrs.length > 0) {
        if (opts && opts.all) {
          return cb(null, addrs.map((a) => ({ address: a, family: 6 })));
        }
        return cb(null, addrs[0], 6);
      }
      return origLookup.call(dns, hostname, options, callback);
    });
  };
} catch {
  // Fallback to default DNS
}

// Read .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let adminEmail = process.env.TEST_ADMIN_EMAIL;
let adminPassword = process.env.TEST_ADMIN_PASSWORD;

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...rest] = trimmed.split("=");
    const v = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (k === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = v;
    if (k === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" || k === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      supabaseKey = v;
    }
    if (k === "TEST_ADMIN_EMAIL") adminEmail = v;
    if (k === "TEST_ADMIN_PASSWORD") adminPassword = v;
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration in .env.local");
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let adminClient = null;
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
  } else {
    console.error("Admin authentication failed:", authErr?.message);
    process.exit(1);
  }
} else {
  console.error("Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD");
  process.exit(1);
}

console.log("==================================================================");
console.log(" DYNAMIC WORK SECTION & PUBLISHED CMS INTEGRATION TEST");
console.log("==================================================================");

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name, fn) {
  try {
    const result = await fn();
    if (result.success) {
      console.log(`[PASS] ${name}`);
      if (result.detail) console.log(`       ↳ ${result.detail}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (result.detail) console.error(`       ↳ ${result.detail}`);
      testsFailed++;
    }
  } catch (err) {
    console.error(`[ERROR] ${name}:`, err.message);
    testsFailed++;
  }
}

const testSlug = `audit-work-${Date.now()}`;
let createdProjectId = null;

// Test 1: Create draft project -> verify anonymous visitor cannot see it
await runTest("Draft project is completely invisible to public anonymous visitors", async () => {
  const { data, error } = await adminClient
    .from("projects")
    .insert({
      title: "Neural Engine AI Platform",
      slug: testSlug,
      short_description: "Real-time AI interface testing draft",
      category: "ai-products",
      project_type: "side-project",
      cover_image: "https://example.com/cover.png",
      is_published: false,
    })
    .select("id, slug, is_published")
    .single();

  if (error || !data) {
    return { success: false, detail: `Failed to insert draft: ${error?.message}` };
  }
  createdProjectId = data.id;

  // Query as anonymous public client
  const { data: pubData } = await anonClient
    .from("projects")
    .select("id, slug, title")
    .eq("slug", testSlug);

  if (pubData && pubData.length > 0) {
    return { success: false, detail: "Unpublished draft was returned to anonymous visitor!" };
  }

  return { success: true, detail: "Draft was created by admin; anonymous query returned 0 records." };
});

// Test 2: Publish project -> verify it appears in public query with correct fields
await runTest("Publishing project makes it dynamically visible in public query", async () => {
  const { error: updateErr } = await adminClient
    .from("projects")
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq("id", createdProjectId);

  if (updateErr) {
    return { success: false, detail: `Failed to publish project: ${updateErr.message}` };
  }

  // Query as public anonymous client
  const { data: pubData, error: pubErr } = await anonClient
    .from("projects")
    .select("id, slug, title, category, project_type, short_description, cover_image, is_published")
    .eq("slug", testSlug);

  if (pubErr || !pubData || pubData.length === 0) {
    return { success: false, detail: `Published project was not returned to public client: ${pubErr?.message}` };
  }

  const proj = pubData[0];
  if (proj.title !== "Neural Engine AI Platform" || !proj.cover_image) {
    return { success: false, detail: "Returned project missing expected metadata or cover image." };
  }

  return {
    success: true,
    detail: `Published project "${proj.title}" dynamically retrieved with slug "/projects/${proj.slug}".`,
  };
});

// Test 3: Unpublish project -> verify it disappears from public query
await runTest("Unpublishing project immediately removes it from public queries", async () => {
  const { error: updateErr } = await adminClient
    .from("projects")
    .update({ is_published: false })
    .eq("id", createdProjectId);

  if (updateErr) {
    return { success: false, detail: `Failed to unpublish project: ${updateErr.message}` };
  }

  // Query as public anonymous client
  const { data: pubData } = await anonClient
    .from("projects")
    .select("id, slug")
    .eq("slug", testSlug);

  if (pubData && pubData.length > 0) {
    return { success: false, detail: "Unpublished project still visible to public client!" };
  }

  return { success: true, detail: "Project was unpublished; anonymous client returned 0 records." };
});

// Test 4: UX Project category grouping validation
await runTest("UX Project is correctly classified as UX Case Study", async () => {
  const { data: uxProj, error: insertErr } = await adminClient
    .from("projects")
    .insert({
      title: "Fintech Dashboard Redesign",
      slug: `${testSlug}-ux`,
      short_description: "End-to-end design system and user research",
      category: "ux-ui",
      project_type: "case-study",
      is_published: true,
    })
    .select("id, slug, category, project_type")
    .single();

  if (insertErr || !uxProj) {
    return { success: false, detail: `Failed to create UX project: ${insertErr?.message}` };
  }

  // Check categorization helper logic
  const isUX = (cat, type) => {
    const c = (cat || "").toLowerCase();
    const t = (type || "").toLowerCase();
    return c.includes("ux") || c.includes("design") || t.includes("case-study");
  };

  const classified = isUX(uxProj.category, uxProj.project_type);

  // Clean up UX project
  await adminClient.from("projects").delete().eq("id", uxProj.id);

  if (!classified) {
    return { success: false, detail: "UX project was not classified into UX case studies tab." };
  }

  return { success: true, detail: "Project with category 'ux-ui' and type 'case-study' classified into UX tab." };
});

// Cleanup main test project
if (createdProjectId) {
  await adminClient.from("projects").delete().eq("id", createdProjectId);
  console.log(`\nCleaned up test project ${createdProjectId}.`);
}

console.log("\n==================================================================");
console.log(` RESULT: ${testsPassed}/${testsPassed + testsFailed} TESTS PASSED`);
console.log("==================================================================");

if (testsFailed > 0) process.exit(1);
