// ==============================================================================
// Supabase Storage Manager (Phase 2.3)
// Handles public asset delivery, private signed URLs, and asset promotion
// ==============================================================================
import { createClient } from "@/lib/supabase/server";
import { assertServerAdmin } from "@/lib/auth";

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
 * Generates the permanent public URL for an asset in portfolio-public.
 */
export async function getPublicAssetUrl(storagePath: string): Promise<string> {
  const supabase = await createClient();
  if (!supabase) return storagePath;

  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.PUBLIC)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Generates a temporary signed URL for an asset in portfolio-private.
 * Requires administrator privileges.
 */
export async function getPrivateAssetSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PRIVATE)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    console.warn("[getPrivateAssetSignedUrl] Error:", error);
    return null;
  }

  return data.signedUrl;
}

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

/**
 * Server-side promotion: Moves an asset from portfolio-private to portfolio-public
 * and updates the media_assets metadata table.
 *
 * Ensures that publishing is a physical storage operation rather than relying
 * on database flags alone.
 */
export async function promoteAssetToPublic(
  privatePath: string,
  publicPath: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Supabase client uninitialized" };

  try {
    // 1. Download private asset buffer
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PRIVATE)
      .download(privatePath);

    if (downloadError || !fileBlob) {
      return { success: false, error: `Failed to read private asset: ${downloadError?.message}` };
    }

    // 2. Upload to public bucket
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PUBLIC)
      .upload(publicPath, fileBlob, {
        contentType: fileBlob.type,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Failed to upload to public bucket: ${uploadError.message}` };
    }

    // 3. Remove from private bucket
    await supabase.storage.from(STORAGE_BUCKETS.PRIVATE).remove([privatePath]);

    // 4. Retrieve permanent public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.PUBLIC)
      .getPublicUrl(publicPath);

    // 5. Update media_assets metadata row
    await supabase
      .from("media_assets")
      .update({
        bucket_id: STORAGE_BUCKETS.PUBLIC,
        storage_path: publicPath,
        url: urlData.publicUrl,
        access_mode: "public",
        updated_at: new Date().toISOString(),
      })
      .eq("storage_path", privatePath);

    return { success: true, publicUrl: urlData.publicUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Promotion failed",
    };
  }
}

/**
 * Server-side demotion: Moves an asset from portfolio-public to portfolio-private
 * and updates the media_assets metadata table.
 *
 * Ensures the public file is genuinely removed from public delivery.
 */
export async function demoteAssetToPrivate(
  publicPath: string,
  privatePath: string
): Promise<{ success: boolean; error?: string }> {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Supabase client uninitialized" };

  try {
    // 1. Download public asset buffer
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PUBLIC)
      .download(publicPath);

    if (downloadError || !fileBlob) {
      return { success: false, error: `Failed to read public asset: ${downloadError?.message}` };
    }

    // 2. Upload to private bucket
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PRIVATE)
      .upload(privatePath, fileBlob, {
        contentType: fileBlob.type,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Failed to upload to private bucket: ${uploadError.message}` };
    }

    // 3. Remove from public bucket so it can no longer be delivered publicly
    await supabase.storage.from(STORAGE_BUCKETS.PUBLIC).remove([publicPath]);

    // 4. Update media_assets metadata row
    await supabase
      .from("media_assets")
      .update({
        bucket_id: STORAGE_BUCKETS.PRIVATE,
        storage_path: privatePath,
        url: `storage://${STORAGE_BUCKETS.PRIVATE}/${privatePath}`,
        access_mode: "private",
        updated_at: new Date().toISOString(),
      })
      .eq("storage_path", publicPath);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Demotion failed",
    };
  }
}

