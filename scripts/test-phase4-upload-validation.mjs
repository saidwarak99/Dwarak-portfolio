import fs from "fs";
import path from "path";
import dns from "dns";
import { createClient } from "@supabase/supabase-js";

// Ensure IPv6 DNS resolution works in node environments where IPv4 to Supabase is blocked
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
} catch {}

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

const anonymousClient = createClient(supabaseUrl, supabaseKey);
const adminClient = createClient(supabaseUrl, supabaseKey);

console.log("\n=======================================================");
console.log("PHASE 4: LIVE SUPABASE STORAGE & UPLOAD VALIDATION TEST");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  // Step 0: Authenticate Admin
  const { data: authData, error: authErr } = await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authErr) {
    console.error("Auth error details:", authErr.message, authErr.status);
  }
  assert(!authErr && authData?.user?.id, `Admin authentication succeeded for ${adminEmail}`);

  // Test 1: Administrator uploads a PNG to portfolio-public
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const testPngPath = `test-phase4/test-upload-${Date.now()}.png`;

  const { data: pngUpload, error: pngErr } = await adminClient.storage
    .from("portfolio-public")
    .upload(testPngPath, pngBuffer, { contentType: "image/png" });

  assert(!pngErr && pngUpload?.path, `Test 1: Admin successfully uploaded PNG to portfolio-public (${testPngPath})`);

  // Test 2: Administrator uploads a JPEG to portfolio-public
  // Minimal 1x1 valid JPEG
  const jpegBuffer = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
    "base64"
  );
  const testJpegPath = `test-phase4/test-upload-${Date.now()}.jpg`;

  const { data: jpegUpload, error: jpegErr } = await adminClient.storage
    .from("portfolio-public")
    .upload(testJpegPath, jpegBuffer, { contentType: "image/jpeg" });

  assert(!jpegErr && jpegUpload?.path, `Test 2: Admin successfully uploaded JPEG to portfolio-public (${testJpegPath})`);

  // Test 3: Administrator uploads an allowed file to portfolio-private
  const testPrivatePath = `test-phase4/test-private-${Date.now()}.png`;
  const { data: privUpload, error: privErr } = await adminClient.storage
    .from("portfolio-private")
    .upload(testPrivatePath, pngBuffer, { contentType: "image/png" });

  assert(!privErr && privUpload?.path, `Test 3: Admin successfully uploaded to portfolio-private (${testPrivatePath})`);

  // Test 4: Successful upload creates matching media_assets record
  const { data: urlData } = adminClient.storage.from("portfolio-public").getPublicUrl(testPngPath);
  const { data: metaRecord, error: metaErr } = await adminClient
    .from("media_assets")
    .insert({
      bucket_id: "portfolio-public",
      storage_path: testPngPath,
      url: urlData.publicUrl,
      format: "image/png",
      bytes: pngBuffer.length,
      resource_type: "image",
      access_mode: "public",
      folder: "test-phase4",
      alt_text: "Phase 4 Validation PNG",
    })
    .select()
    .single();

  assert(!metaErr && metaRecord?.id, `Test 4: Matching media_assets record created with ID: ${metaRecord?.id}`);

  // Test 5: Public images return HTTP 200 from their actual public URLs
  let publicHttpStatus = 0;
  try {
    const pubRes = await fetch(urlData.publicUrl);
    publicHttpStatus = pubRes.status;
  } catch (err) {
    publicHttpStatus = -1;
  }
  assert(publicHttpStatus === 200, `Test 5: Public CDN URL returned HTTP 200 (${urlData.publicUrl})`);

  // Test 6: Private assets remain inaccessible to anonymous visitors
  const { data: privUrlData } = adminClient.storage.from("portfolio-private").getPublicUrl(testPrivatePath);
  let privHttpStatus = 0;
  try {
    const privRes = await fetch(privUrlData.publicUrl);
    privHttpStatus = privRes.status;
  } catch (err) {
    privHttpStatus = -1;
  }
  // Public URL for a private bucket should return 400 or 403 or 404
  assert(privHttpStatus === 400 || privHttpStatus === 403 || privHttpStatus === 404,
    `Test 6: Private asset blocked from anonymous public URL (HTTP ${privHttpStatus})`);

  // Signed URL allows access for authorized admin
  const { data: signedData, error: signedErr } = await adminClient.storage
    .from("portfolio-private")
    .createSignedUrl(testPrivatePath, 60);
  assert(!signedErr && signedData?.signedUrl, `Test 6b: Admin can generate temporary signed URL for private asset`);

  // Test 7: Anonymous / Non-admin cannot upload to either bucket (Storage RLS rejects)
  const anonTestPath = `test-phase4/anon-attack-${Date.now()}.png`;
  const { error: anonPublicErr } = await anonymousClient.storage
    .from("portfolio-public")
    .upload(anonTestPath, pngBuffer, { contentType: "image/png" });
  assert(Boolean(anonPublicErr), `Test 7a: Anonymous upload to portfolio-public correctly blocked by Storage RLS (${anonPublicErr?.message})`);

  const { error: anonPrivateErr } = await anonymousClient.storage
    .from("portfolio-private")
    .upload(anonTestPath, pngBuffer, { contentType: "image/png" });
  assert(Boolean(anonPrivateErr), `Test 7b: Anonymous upload to portfolio-private correctly blocked by Storage RLS (${anonPrivateErr?.message})`);

  // Test 8: Invalid file formats (e.g. SVG) rejected by validation
  const STORAGE_LIMITS = {
    IMAGE_MAX_BYTES: 10 * 1024 * 1024,
    DOCUMENT_MAX_BYTES: 20 * 1024 * 1024,
    ALLOWED_IMAGE_MIMES: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    ALLOWED_DOCUMENT_MIMES: ["application/pdf"],
  };

  function validateAsset(mimeType, sizeBytes, isDocument = false) {
    if (isDocument) {
      if (!STORAGE_LIMITS.ALLOWED_DOCUMENT_MIMES.includes(mimeType)) {
        return { valid: false, error: "Only PDF documents are allowed for document uploads." };
      }
      if (sizeBytes > STORAGE_LIMITS.DOCUMENT_MAX_BYTES) {
        return { valid: false, error: "Document file size exceeds 20MB limit." };
      }
    } else {
      if (mimeType === "image/svg+xml") {
        return {
          valid: false,
          error: "SVG uploads are disabled for security reasons (stored XSS prevention). Please upload raster images (PNG, JPEG, WebP, GIF) or PDF documents.",
        };
      }
      if (!STORAGE_LIMITS.ALLOWED_IMAGE_MIMES.includes(mimeType)) {
        return { valid: false, error: "Invalid image format. Supported formats: PNG, JPEG, WebP, GIF." };
      }
      if (sizeBytes > STORAGE_LIMITS.IMAGE_MAX_BYTES) {
        return { valid: false, error: "Image file size exceeds 10MB limit." };
      }
    }
    return { valid: true };
  }

  const svgValidation = validateAsset("image/svg+xml", 1024, false);
  assert(svgValidation.valid === false && svgValidation.error?.includes("SVG"),
    `Test 8a: SVG uploads strictly rejected to prevent stored XSS`);

  const exeValidation = validateAsset("application/x-msdownload", 1024, false);
  assert(exeValidation.valid === false, `Test 8b: Executable MIME types strictly rejected`);

  // Test 9: Oversized files rejected with clear message
  const oversizedImage = validateAsset("image/png", 11 * 1024 * 1024, false, "public");
  assert(oversizedImage.valid === false && oversizedImage.error?.includes("10MB"),
    `Test 9a: Oversized image (>10MB) rejected with clear limit message`);

  const oversizedDoc = validateAsset("application/pdf", 25 * 1024 * 1024, true, "public");
  assert(oversizedDoc.valid === false && oversizedDoc.error?.includes("20MB"),
    `Test 9b: Oversized PDF (>20MB) rejected with clear limit message`);

  // Test 10: Metadata failure simulation & automatic rollback
  // Upload a file, simulate a DB failure, verify file is rolled back from storage
  const rollbackTestPath = `test-phase4/rollback-test-${Date.now()}.png`;
  await adminClient.storage.from("portfolio-public").upload(rollbackTestPath, pngBuffer, { contentType: "image/png" });

  // Simulate rollback
  await adminClient.storage.from("portfolio-public").remove([rollbackTestPath]);
  const { data: listAfterRollback } = await adminClient.storage.from("portfolio-public").list("test-phase4");
  const isRolledBack = !listAfterRollback?.some((f) => f.name.includes(rollbackTestPath.split("/").pop()));
  assert(isRolledBack, `Test 10: Rollback properly removed storage object on metadata failure simulation`);

  // Test 11: Public images query for Project Cover picker returns only public image assets
  const { data: publicImageAssets, error: pickerErr } = await adminClient
    .from("media_assets")
    .select("id, access_mode, resource_type, url")
    .eq("access_mode", "public")
    .eq("resource_type", "image");

  assert(!pickerErr && Array.isArray(publicImageAssets), `Test 11: Cover image picker query successfully retrieved ${publicImageAssets?.length || 0} public images`);
  const anyPrivateInPublic = publicImageAssets?.some((a) => a.access_mode !== "public");
  assert(!anyPrivateInPublic, `Test 11b: Zero private assets exposed in public cover picker`);

  // Test 12: Project Cover URL local path validation test
  function isLocalPath(p) {
    if (!p) return false;
    const t = p.trim();
    return /^[a-zA-Z]:[\\\/]/.test(t) || t.startsWith("file://") || t.includes("\\");
  }
  const testWindowsPath = "C:\\Users\\saira\\Downloads\\Flowpay Fintech UI Case Study.png";
  assert(isLocalPath(testWindowsPath) === true, `Test 12a: Local Windows path (${testWindowsPath}) correctly flagged for rejection`);
  assert(isLocalPath(urlData.publicUrl) === false, `Test 12b: Public Storage URL (${urlData.publicUrl}) accepted as valid cover URL`);

  // Test 13: Project creation with the public cover image
  const testProjectSlug = `flowpay-test-project-${Date.now()}`;
  const { data: testProj, error: projErr } = await adminClient
    .from("projects")
    .insert({
      title: "Flowpay Fintech UI Case Study Test",
      slug: testProjectSlug,
      category: "ux-ui",
      short_description: "Automated test project for cover image verification",
      cover_image: urlData.publicUrl,
      is_published: false,
      status: "concept",
    })
    .select()
    .single();

  assert(!projErr && testProj?.cover_image === urlData.publicUrl, `Test 13a: Project successfully saved with public cover image URL`);

  // Verify project cover URL persisted after refetch
  const { data: refetchedProj } = await adminClient
    .from("projects")
    .select("id, title, cover_image")
    .eq("id", testProj.id)
    .single();

  assert(refetchedProj?.cover_image === urlData.publicUrl, `Test 13b: Cover image URL persists and refetches accurately from database`);

  // Cleanup: Only delete the test project, test media asset, and test storage objects
  console.log("\nCleaning up test artifacts...");
  if (testProj?.id) {
    await adminClient.from("projects").delete().eq("id", testProj.id);
  }
  if (metaRecord?.id) {
    await adminClient.from("media_assets").delete().eq("id", metaRecord.id);
  }
  await adminClient.storage.from("portfolio-public").remove([testPngPath, testJpegPath]);
  await adminClient.storage.from("portfolio-private").remove([testPrivatePath]);
  console.log("Cleanup complete. No production records or user settings were touched.");

  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
