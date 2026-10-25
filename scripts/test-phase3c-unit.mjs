// ==============================================================================
// Phase 3C — Offline Unit & Security Validation Test
// Validates file types, size limits, path sanitization, and settings validation rules.
// ==============================================================================

export const STORAGE_LIMITS = {
  IMAGE_MAX_BYTES: 10 * 1024 * 1024, // 10MB
  DOCUMENT_MAX_BYTES: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_MIMES: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ],
  ALLOWED_DOCUMENT_MIMES: ["application/pdf"],
};

export function validateAsset(mimeType, sizeBytes, isDocument = false, _accessModeOrBucket = "public") {
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

export function sanitizeStorageFilename(filename) {
  const rawBase = filename.split(/[/\\]/).pop() || "asset";
  const base = rawBase.replace(/^\.+/, "") || "asset";
  const parts = base.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  const name = parts.join(".");

  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  const cleanExt = ext ? ext.replace(/[^a-zA-Z0-9]/g, "") : "";
  const finalName = cleanExt ? `${cleanName || "asset"}.${cleanExt}` : cleanName || "asset";
  return finalName;
}

console.log("==================================================================");
console.log(" SAI DWARAK PORTFOLIO — PHASE 3C OFFLINE SECURITY & LOGIC TESTS");
console.log("==================================================================\n");

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exit(1);
  }
}

// 1. Allowed Image Mimes
assert(validateAsset("image/png", 1024 * 1024, false, "public").valid, "PNG under 10MB is valid");
assert(validateAsset("image/jpeg", 5 * 1024 * 1024, false, "public").valid, "JPEG under 10MB is valid");
assert(validateAsset("image/webp", 2 * 1024 * 1024, false, "public").valid, "WebP under 10MB is valid");
assert(!validateAsset("image/svg+xml", 50 * 1024, false, "public").valid, "SVG in public storage is strictly rejected for stored XSS security");
assert(!validateAsset("image/svg+xml", 50 * 1024, false, "private").valid, "SVG in private storage is strictly rejected");
assert(!validateAsset("image/svg+xml", 50 * 1024, false, "portfolio-private").valid, "SVG in portfolio-private bucket is strictly rejected");
assert(validateAsset("image/gif", 3 * 1024 * 1024, false, "public").valid, "GIF under 10MB is valid");

// 2. Disallowed Image Mimes & Executables
assert(!validateAsset("application/javascript", 100, false).valid, "JavaScript files rejected as image");
assert(!validateAsset("text/html", 100, false).valid, "HTML files rejected as image");
assert(!validateAsset("application/x-msdownload", 100, false).valid, "Executable EXE files rejected as image");

// 3. Image Size Limits
assert(!validateAsset("image/png", 11 * 1024 * 1024, false).valid, "Image over 10MB rejected");

// 4. Document Mimes & Limits
assert(validateAsset("application/pdf", 15 * 1024 * 1024, true).valid, "PDF under 20MB is valid for documents");
assert(!validateAsset("application/msword", 1024, true).valid, "Non-PDF documents rejected");
assert(!validateAsset("application/pdf", 21 * 1024 * 1024, true).valid, "PDF over 20MB rejected");

// 5. Filename Sanitization & Directory Traversal Prevention
assert(
  sanitizeStorageFilename("../../../etc/passwd") === "passwd",
  "Directory traversal sequences stripped from filename"
);
assert(
  !sanitizeStorageFilename("..\\..\\windows\\system32\\cmd.exe").includes(".."),
  "Backslash traversal stripped"
);
assert(
  sanitizeStorageFilename("sai dwarak (hero) [2026] #1.png") === "sai_dwarak_hero_2026_1.png",
  "Special characters and spaces safely normalized to underscores"
);
assert(
  sanitizeStorageFilename(".hidden") === "hidden",
  "Hidden leading dot normalized safely"
);

// 6. Settings Validation Helpers
function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}
function isValidHttpUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
function isValidAssetUrlOrPath(str) {
  const trimmed = str.trim();
  if (trimmed.startsWith("/")) return true;
  return isValidHttpUrl(trimmed);
}

assert(isValidEmail("saidwarak99@gmail.com"), "Valid contact email accepted");
assert(!isValidEmail("saidwarak99"), "Invalid email missing domain rejected");
assert(!isValidEmail("saidwarak99@"), "Invalid email missing TLD rejected");

assert(isValidHttpUrl("https://www.linkedin.com/in/sai-dwarak99/"), "Valid HTTPS LinkedIn URL accepted");
assert(isValidHttpUrl("https://github.com/saidwarak99"), "Valid HTTPS GitHub URL accepted");
assert(!isValidHttpUrl("javascript:alert(document.cookie)"), "Unsafe javascript: scheme URL rejected");
assert(!isValidHttpUrl("data:text/html,<script>alert(1)</script>"), "Unsafe data: URI scheme rejected");

assert(isValidAssetUrlOrPath("/images/character/sai-hero.png"), "Relative character asset path accepted");
assert(isValidAssetUrlOrPath("https://pmrrtepibytnfjplirew.supabase.co/storage/v1/object/public/test.png"), "Remote HTTPS asset URL accepted");
assert(!isValidAssetUrlOrPath("file:///C:/Users/test.png"), "Local file:// protocol rejected");

console.log("\n==================================================================");
console.log(` RESULT: ${passed}/${total} TESTS PASSED`);
console.log("==================================================================");
