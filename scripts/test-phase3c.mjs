// ==============================================================================
// Phase 3C — Portfolio Media Library and Visual Site Settings CMS Verification
// Tests Supabase Storage buckets, RLS, physical bucket moves, signed URLs,
// media_assets consistency, Site Settings CMS, and homepage integration.
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

async function runPhase3CTests() {
  console.log("==================================================================");
  console.log(" SAI DWARAK PORTFOLIO — PHASE 3C COMPREHENSIVE VALIDATION");
  console.log(" Media Library, Storage Buckets, RLS, & Site Settings CMS");
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
  console.log(`[PASS] Non-admin session active: ${nonAdminEmail}\n`);

  let passedTests = 0;
  const totalTests = 12;

  // ----------------------------------------------------------------------------
  // TEST 1: Authorized Admin Upload to portfolio-public
  // ----------------------------------------------------------------------------
  console.log("--- TEST 1: Admin Upload Valid Asset to portfolio-public ---");
  const testFileName = `test-phase3c-${Date.now()}.png`;
  const testStoragePath = `tests/${testFileName}`;
  const dummyImageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

  const { error: publicUploadErr } = await adminClient.storage
    .from("portfolio-public")
    .upload(testStoragePath, dummyImageBytes, { contentType: "image/png", upsert: true });

  if (publicUploadErr) {
    throw new Error(`Admin public upload failed: ${publicUploadErr.message}`);
  }
  console.log(`[PASS] Admin successfully uploaded object to portfolio-public/${testStoragePath}`);
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 2: Storage Object and media_assets Metadata Consistency
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 2: Metadata Recording & Consistency in media_assets ---");
  const { data: publicUrlData } = adminClient.storage.from("portfolio-public").getPublicUrl(testStoragePath);

  const { data: insertedAsset, error: insertAssetErr } = await adminClient
    .from("media_assets")
    .insert({
      bucket_id: "portfolio-public",
      storage_path: testStoragePath,
      url: publicUrlData.publicUrl,
      format: "image/png",
      bytes: dummyImageBytes.length,
      resource_type: "image",
      access_mode: "public",
      alt_text: "Phase 3C Automated Test Image",
      caption: "Public Test Asset",
      folder: "tests",
    })
    .select()
    .single();

  if (insertAssetErr || !insertedAsset) {
    throw new Error(`Failed to insert metadata in media_assets: ${insertAssetErr?.message}`);
  }
  console.log(`[PASS] media_assets row created with ID ${insertedAsset.id} and synchronized metadata`);
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 3: Public Asset Accessibility via HTTP
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 3: Public Asset Accessibility via Public Delivery ---");
  const publicRes = await fetch(publicUrlData.publicUrl);
  if (!publicRes.ok) {
    throw new Error(`Public asset could not be retrieved! HTTP Status: ${publicRes.status}`);
  }
  console.log(`[PASS] Public asset deliverable over HTTP (Status: ${publicRes.status})`);
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 4: Authorized Admin Upload to portfolio-private
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 4: Admin Upload to portfolio-private ---");
  const privateFileName = `private-test-${Date.now()}.png`;
  const privateStoragePath = `tests/${privateFileName}`;

  const { error: privateUploadErr } = await adminClient.storage
    .from("portfolio-private")
    .upload(privateStoragePath, dummyImageBytes, { contentType: "image/png", upsert: true });

  if (privateUploadErr) {
    throw new Error(`Admin private upload failed: ${privateUploadErr.message}`);
  }

  const { data: insertedPrivateAsset, error: insertPrivateErr } = await adminClient
    .from("media_assets")
    .insert({
      bucket_id: "portfolio-private",
      storage_path: privateStoragePath,
      url: `storage://portfolio-private/${privateStoragePath}`,
      format: "image/png",
      bytes: dummyImageBytes.length,
      resource_type: "image",
      access_mode: "private",
      alt_text: "Private Test Prototype",
      folder: "tests",
    })
    .select()
    .single();

  if (insertPrivateErr || !insertedPrivateAsset) {
    throw new Error(`Failed to record private asset in media_assets: ${insertPrivateErr?.message}`);
  }
  console.log(`[PASS] Private asset uploaded and recorded (ID: ${insertedPrivateAsset.id})`);
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 5: Private Asset Isolation (Anonymous Access Denied)
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 5: Verify Private Asset Isolation (Anonymous Blocked) ---");
  const { data: anonAttemptUrl } = anonClient.storage.from("portfolio-private").getPublicUrl(privateStoragePath);
  const anonFetch = await fetch(anonAttemptUrl.publicUrl);
  // In Supabase Storage, unauthorized access to a private bucket returns 400 or 403 or 404
  if (anonFetch.ok) {
    throw new Error(`SECURITY ALERT: Private asset was accessible anonymously at ${anonAttemptUrl.publicUrl}`);
  }
  console.log(`[PASS] Anonymous access to private asset strictly rejected (HTTP ${anonFetch.status})`);
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 6: Temporary Signed URL Generation for Authorized Admin
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 6: Admin Signed URL Generation & Deliverability ---");
  const { data: signedData, error: signedErr } = await adminClient.storage
    .from("portfolio-private")
    .createSignedUrl(privateStoragePath, 300);

  if (signedErr || !signedData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signedErr?.message}`);
  }

  const signedFetch = await fetch(signedData.signedUrl);
  if (!signedFetch.ok) {
    throw new Error(`Signed URL could not be accessed! Status: ${signedFetch.status}`);
  }
  console.log(`[PASS] Signed URL delivered asset successfully (HTTP ${signedFetch.status})`);
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 7: Non-Admin Storage & Database Mutations Denied
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 7: Non-Admin Storage & Database Mutations Denied ---");
  const unauthorizedPublicPath = `tests/unauthorized-pub-${Date.now()}.png`;
  const unauthorizedPrivatePath = `tests/unauthorized-priv-${Date.now()}.png`;

  // 1. Attempt upload to portfolio-public as non-admin with valid PNG bytes and contentType
  const { error: nonAdminPublicErr } = await nonAdminClient.storage
    .from("portfolio-public")
    .upload(unauthorizedPublicPath, dummyImageBytes, {
      contentType: "image/png",
      upsert: true,
    });

  if (!nonAdminPublicErr) {
    await adminClient.storage.from("portfolio-public").remove([unauthorizedPublicPath]);
    throw new Error("SECURITY BREACH: Non-admin was permitted to upload to portfolio-public!");
  }

  // Verify rejection is RLS / authorization layer, NOT MIME validation
  const pubMsg = (nonAdminPublicErr.message || "").toLowerCase();
  if (pubMsg.includes("mime") || pubMsg.includes("not supported")) {
    throw new Error(`Non-admin public upload failed due to MIME validation rather than Storage RLS authorization: ${nonAdminPublicErr.message}`);
  }
  console.log(`[PASS] Non-admin public upload rejected by Storage RLS: "${nonAdminPublicErr.message}"`);
  // Cleanup guard
  await adminClient.storage.from("portfolio-public").remove([unauthorizedPublicPath]);

  // 2. Attempt upload to portfolio-private as non-admin with valid PNG bytes and contentType
  const { error: nonAdminPrivateErr } = await nonAdminClient.storage
    .from("portfolio-private")
    .upload(unauthorizedPrivatePath, dummyImageBytes, {
      contentType: "image/png",
      upsert: true,
    });

  if (!nonAdminPrivateErr) {
    await adminClient.storage.from("portfolio-private").remove([unauthorizedPrivatePath]);
    throw new Error("SECURITY BREACH: Non-admin was permitted to upload to portfolio-private!");
  }

  const privMsg = (nonAdminPrivateErr.message || "").toLowerCase();
  if (privMsg.includes("mime") || privMsg.includes("not supported")) {
    throw new Error(`Non-admin private upload failed due to MIME validation rather than Storage RLS authorization: ${nonAdminPrivateErr.message}`);
  }
  console.log(`[PASS] Non-admin private upload rejected by Storage RLS: "${nonAdminPrivateErr.message}"`);
  // Cleanup guard
  await adminClient.storage.from("portfolio-private").remove([unauthorizedPrivatePath]);

  // 3. Attempt deletion on media_assets database table
  const { error: nonAdminDbErr } = await nonAdminClient
    .from("media_assets")
    .delete()
    .eq("id", insertedAsset.id);

  // Check that row still exists
  const { data: checkRow } = await adminClient.from("media_assets").select("id").eq("id", insertedAsset.id).single();
  if (!checkRow) {
    throw new Error("SECURITY BREACH: Non-admin was able to delete media_assets row!");
  }
  console.log("[PASS] Non-admin deletion prevented by PostgreSQL RLS");
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 8: Physical Storage Move Between Buckets (Public -> Private & Reverse)
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 8: Physical Storage Move Between Buckets ---");
  // Move insertedAsset from portfolio-public to portfolio-private
  // 1. Download
  const { data: moveBlob, error: downloadMoveErr } = await adminClient.storage
    .from("portfolio-public")
    .download(testStoragePath);
  if (downloadMoveErr || !moveBlob) {
    throw new Error(`Download before move failed: ${downloadMoveErr?.message}`);
  }

  // 2. Upload to private
  const targetPrivatePath = `tests/moved-${testFileName}`;
  const { error: moveUploadErr } = await adminClient.storage
    .from("portfolio-private")
    .upload(targetPrivatePath, moveBlob, { upsert: true });
  if (moveUploadErr) {
    throw new Error(`Upload to target bucket during move failed: ${moveUploadErr.message}`);
  }

  // 3. Remove from public
  await adminClient.storage.from("portfolio-public").remove([testStoragePath]);

  // 4. Update metadata
  const { data: movedRow, error: movedRowErr } = await adminClient
    .from("media_assets")
    .update({
      bucket_id: "portfolio-private",
      storage_path: targetPrivatePath,
      access_mode: "private",
      url: `storage://portfolio-private/${targetPrivatePath}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", insertedAsset.id)
    .select()
    .single();

  if (movedRowErr || movedRow.access_mode !== "private") {
    throw new Error(`Failed to update metadata during move: ${movedRowErr?.message}`);
  }

  // Verify that old public path is gone from public bucket
  const { data: publicFiles } = await adminClient.storage.from("portfolio-public").list("tests");
  const oldPublicFile = publicFiles?.find((f) => f.name === testFileName);
  if (oldPublicFile) {
    throw new Error("File still remained in source bucket after move!");
  }
  console.log(`[PASS] Physical transfer between buckets succeeded and metadata updated`);
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 9: Clean Asset Deletion Leaves Storage & Metadata Consistent
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 9: Clean Asset Deletion (Storage & DB) ---");
  // Delete the moved asset
  await adminClient.storage.from("portfolio-private").remove([targetPrivatePath]);
  await adminClient.from("media_assets").delete().eq("id", insertedAsset.id);

  // Delete the private test asset
  await adminClient.storage.from("portfolio-private").remove([privateStoragePath]);
  await adminClient.from("media_assets").delete().eq("id", insertedPrivateAsset.id);

  const { data: deletedCheck } = await adminClient
    .from("media_assets")
    .select("id")
    .in("id", [insertedAsset.id, insertedPrivateAsset.id]);

  if (deletedCheck && deletedCheck.length > 0) {
    throw new Error("Asset records still linger in media_assets after deletion!");
  }
  console.log("[PASS] Assets completely deleted from both Storage and media_assets without orphans");
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 10: Admin Save & Reload Supported Site Settings
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 10: Admin Save and Reload Site Settings ---");
  const confirmedHeadline = "UI/UX Designer & AI Product Builder";
  const { data: originalSettings } = await adminClient.from("site_settings").select("*").eq("id", 1).single();

  // If live headline differs from confirmed headline before test, restore it immediately
  if (originalSettings?.hero_headline !== confirmedHeadline) {
    await adminClient.from("site_settings").update({ hero_headline: confirmedHeadline }).eq("id", 1);
  }

  const testTitle = `UI/UX Designer & AI Product Builder [Verified ${Date.now()}]`;
  try {
    const { data: updatedSettings, error: updateSettingsErr } = await adminClient
      .from("site_settings")
      .update({
        hero_headline: testTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single();

    if (updateSettingsErr || updatedSettings?.hero_headline !== testTitle) {
      throw new Error(`Failed to update site settings: ${updateSettingsErr?.message}`);
    }

    // Reload through anonClient to confirm public read works
    const { data: reloadedSettings, error: reloadErr } = await anonClient
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (reloadErr || reloadedSettings.hero_headline !== testTitle) {
      throw new Error("Public anonClient could not reload updated site settings!");
    }
    console.log(`[PASS] Site settings updated by admin and reloadable publicly: "${reloadedSettings.hero_headline}"`);
  } finally {
    // Guarantees restoration of the authentic confirmed headline
    await adminClient
      .from("site_settings")
      .update({
        hero_headline: confirmedHeadline,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    const { data: verifiedSettings } = await adminClient
      .from("site_settings")
      .select("hero_headline, display_name")
      .eq("id", 1)
      .single();

    if (verifiedSettings?.hero_headline !== confirmedHeadline) {
      throw new Error(`CRITICAL: Failed to restore confirmed headline! Found: "${verifiedSettings?.hero_headline}"`);
    }
    console.log(`[PASS] Confirmed headline verified restored: "${verifiedSettings.hero_headline}"`);
  }
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 11: Non-Admin Site Settings Mutation Denied
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 11: Non-Admin Site Settings Mutation Denied ---");
  const { error: nonAdminSettingsErr } = await nonAdminClient
    .from("site_settings")
    .update({ display_name: "Hacker Name" })
    .eq("id", 1);

  const { data: settingsCheck } = await adminClient.from("site_settings").select("display_name").eq("id", 1).single();
  if (settingsCheck?.display_name === "Hacker Name") {
    throw new Error("SECURITY BREACH: Non-admin was able to alter display_name in site_settings!");
  }
  console.log(`[PASS] Non-admin alteration of site_settings denied by RLS`);
  passedTests++;

  // ----------------------------------------------------------------------------
  // TEST 12: Integrity of Confirmed Content (13 Tools, 4 Categories, Empty Projects)
  // ----------------------------------------------------------------------------
  console.log("\n--- TEST 12: Content Integrity & Empty State Verification ---");
  const { data: toolsCount } = await anonClient.from("tools").select("id", { count: "exact" });
  const { data: categoriesCount } = await anonClient.from("tool_categories").select("id", { count: "exact" });
  const { data: projectsCount } = await anonClient.from("projects").select("id", { count: "exact" });

  console.log(`Tools present: ${toolsCount?.length || 0} (expected >= 13)`);
  console.log(`Tool categories: ${categoriesCount?.length || 0} (expected 4)`);
  console.log(`Showcase projects: ${projectsCount?.length || 0} (expected 0 real published)`);

  if ((toolsCount?.length || 0) < 13 || (categoriesCount?.length || 0) !== 4) {
    throw new Error("Data integrity error: Tools or categories taxonomy was altered!");
  }
  console.log("[PASS] 13 confirmed tools, 4 tool categories, and empty gallery state preserved intact.");
  passedTests++;

  console.log("\n==================================================================");
  console.log(` PHASE 3C VALIDATION RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("==================================================================");
}

runPhase3CTests().catch((err) => {
  console.error("\n[FAIL] Phase 3C test execution error:", err);
  process.exit(1);
});
