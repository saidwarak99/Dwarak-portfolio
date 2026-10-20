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
    "image/svg+xml",
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
 */
export function validateAsset(
  mimeType: string,
  sizeBytes: number,
  isDocument: boolean = false
): { valid: boolean; error?: string } {
  if (isDocument) {
    if (!STORAGE_LIMITS.ALLOWED_DOCUMENT_MIMES.includes(mimeType as "application/pdf")) {
      return { valid: false, error: "Only PDF documents are allowed for document uploads." };
    }
    if (sizeBytes > STORAGE_LIMITS.DOCUMENT_MAX_BYTES) {
      return { valid: false, error: "Document file size exceeds 20MB limit." };
    }
  } else {
    if (!STORAGE_LIMITS.ALLOWED_IMAGE_MIMES.includes(mimeType as "image/png")) {
      return { valid: false, error: "Invalid image format. Supported formats: PNG, JPEG, WebP, SVG, GIF." };
    }
    if (sizeBytes > STORAGE_LIMITS.IMAGE_MAX_BYTES) {
      return { valid: false, error: "Image file size exceeds 10MB limit." };
    }
  }

  return { valid: true };
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
