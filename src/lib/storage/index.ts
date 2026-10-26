// ==============================================================================
// Supabase Storage Manager (Phase 2.3)
// Handles public asset delivery, private signed URLs, and asset promotion
// ==============================================================================
import { createClient } from "@/lib/supabase/server";
import { assertServerAdmin } from "@/lib/auth";

export * from "./validation";
import { STORAGE_BUCKETS, STORAGE_LIMITS } from "./validation";

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

