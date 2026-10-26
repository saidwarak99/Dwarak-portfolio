// ==============================================================================
// Pure Client-Safe Storage Validation & Sanitization Helpers
// Safe to import in both Client Components and Server Components
// ==============================================================================

export const STORAGE_BUCKETS = {
  PUBLIC: "portfolio-public",
  PRIVATE: "portfolio-private",
} as const;

export const STORAGE_LIMITS = {
  IMAGE_MAX_BYTES: 10 * 1024 * 1024, // 10MB
  DOCUMENT_MAX_BYTES: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_MIMES: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ],
  ALLOWED_PRIVATE_IMAGE_MIMES: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ],
  ALLOWED_DOCUMENT_MIMES: ["application/pdf"],
} as const;

/**
 * Validates a file's MIME type and size prior to storage upload.
 * Strictly disallows SVG uploads across all buckets to prevent stored XSS vulnerabilities.
 */
export function validateAsset(
  mimeType: string,
  sizeBytes: number,
  isDocument: boolean = false,
  _accessModeOrBucket: "public" | "private" | "portfolio-public" | "portfolio-private" = "public"
): { valid: boolean; error?: string } {
  if (isDocument) {
    if (!STORAGE_LIMITS.ALLOWED_DOCUMENT_MIMES.includes(mimeType as "application/pdf")) {
      return { valid: false, error: "Only PDF documents are allowed for document uploads." };
    }
    if (sizeBytes > STORAGE_LIMITS.DOCUMENT_MAX_BYTES) {
      return { valid: false, error: "Document file size exceeds 20MB limit." };
    }
  } else {
    // Strictly reject SVG uploads to prevent stored XSS attacks
    if (mimeType === "image/svg+xml") {
      return {
        valid: false,
        error: "SVG uploads are disabled for security reasons (stored XSS prevention). Please upload raster images (PNG, JPEG, WebP, GIF) or PDF documents.",
      };
    }

    if (!STORAGE_LIMITS.ALLOWED_IMAGE_MIMES.includes(mimeType as any)) {
      return { valid: false, error: "Invalid image format. Supported formats: PNG, JPEG, WebP, GIF." };
    }
    if (sizeBytes > STORAGE_LIMITS.IMAGE_MAX_BYTES) {
      return { valid: false, error: "Image file size exceeds 10MB limit." };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes a filename to prevent path traversal, control characters, or invalid storage keys.
 * Preserves the file extension if present and safe.
 */
export function sanitizeStorageFilename(filename: string): string {
  // 1. Strip any directory path components to prevent traversal
  const rawBase = filename.split(/[/\\]/).pop() || "asset";
  // 2. Strip leading dots to prevent hidden dotfiles
  const base = rawBase.replace(/^\.+/, "") || "asset";

  // 3. Separate clean base name from extension
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
