"use server";

import { revalidatePath } from "next/cache";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  STORAGE_BUCKETS,
  validateAsset,
  sanitizeStorageFilename,
} from "@/lib/storage";
import type { MediaAsset } from "@/types/database.types";

export interface MediaUploadResult {
  success: boolean;
  asset?: MediaAsset;
  error?: string;
}

/**
 * Server Action: Upload an asset to portfolio-public or portfolio-private.
 * Enforces admin authorization, MIME & size validation, sanitized storage paths,
 * and automatic rollback if metadata recording fails.
 */
export async function uploadMediaAction(formData: FormData): Promise<MediaUploadResult> {
  try {
    await assertServerAdmin();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Database client unconfigured." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No file was provided for upload." };
  }

  const accessMode = (formData.get("access_mode") as string) === "private" ? "private" : "public";
  const folderInput = ((formData.get("folder") as string) || "uploads").trim();
  const altText = ((formData.get("alt_text") as string) || "").trim() || null;
  const caption = ((formData.get("caption") as string) || "").trim() || null;

  const isDocument = file.type === "application/pdf";
  const validation = validateAsset(file.type, file.size, isDocument, accessMode);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Clean folder: allow only alphanumeric, underscores, hyphens
  const cleanFolder = folderInput
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/^_+|_+$/g, "") || "uploads";

  const sanitizedFilename = sanitizeStorageFilename(file.name);
  const storagePath = `${cleanFolder}/${Date.now()}-${sanitizedFilename}`;
  const targetBucket = accessMode === "private" ? STORAGE_BUCKETS.PRIVATE : STORAGE_BUCKETS.PUBLIC;

  try {
    // 1. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `Storage upload failed: ${uploadError.message}` };
    }

    // 2. Resolve URL
    let assetUrl = "";
    if (accessMode === "public") {
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.PUBLIC)
        .getPublicUrl(storagePath);
      assetUrl = urlData.publicUrl;
    } else {
      assetUrl = `storage://${STORAGE_BUCKETS.PRIVATE}/${storagePath}`;
    }

    // 3. Write metadata to media_assets
    const { data: assetData, error: dbError } = await supabase
      .from("media_assets")
      .insert({
        bucket_id: targetBucket,
        storage_path: storagePath,
        url: assetUrl,
        format: file.type,
        bytes: file.size,
        resource_type: isDocument ? "document" : "image",
        access_mode: accessMode,
        alt_text: altText,
        caption: caption,
        folder: cleanFolder,
      })
      .select()
      .single();

    // 4. Critical Rollback if DB insert fails: delete newly uploaded storage object
    if (dbError || !assetData) {
      console.error("[uploadMediaAction] Metadata write failed, rolling back uploaded object:", dbError);
      await supabase.storage.from(targetBucket).remove([storagePath]);
      return { success: false, error: `Failed to record asset metadata: ${dbError?.message}` };
    }

    revalidatePath("/admin/media");
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, asset: assetData as MediaAsset };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unexpected upload error occurred.",
    };
  }
}

/**
 * Server Action: Delete an asset.
 * Removes both the physical Storage object and the media_assets database row.
 */
export async function deleteMediaAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertServerAdmin();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Database client unconfigured." };

  // 1. Fetch asset record
  const { data: asset, error: fetchError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !asset) {
    return { success: false, error: "Asset not found." };
  }

  // 2. Remove physical object from bucket
  const { error: storageError } = await supabase.storage
    .from(asset.bucket_id)
    .remove([asset.storage_path]);

  if (storageError) {
    console.warn("[deleteMediaAction] Storage remove returned warning:", storageError.message);
  }

  // 3. Remove metadata row from media_assets
  const { error: dbError } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", id);

  if (dbError) {
    return { success: false, error: `Failed to delete asset record: ${dbError.message}` };
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { success: true };
}

/**
 * Server Action: Physically move an asset between public and private buckets.
 * Executes genuine storage transfer (download blob -> upload to target bucket -> delete from source)
 * and updates media_assets metadata.
 */
export async function moveMediaAccessModeAction(
  id: string,
  targetMode: "public" | "private"
): Promise<{ success: boolean; asset?: MediaAsset; error?: string }> {
  try {
    await assertServerAdmin();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Database client unconfigured." };

  const { data: asset, error: fetchError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !asset) {
    return { success: false, error: "Asset record not found." };
  }

  if (asset.access_mode === targetMode) {
    return { success: true, asset: asset as MediaAsset };
  }

  if (asset.format?.includes("svg") || asset.storage_path.toLowerCase().endsWith(".svg")) {
    return {
      success: false,
      error: "SVG assets are not supported due to security restrictions.",
    };
  }

  const sourceBucket = asset.bucket_id;
  const targetBucket = targetMode === "public" ? STORAGE_BUCKETS.PUBLIC : STORAGE_BUCKETS.PRIVATE;
  const sourcePath = asset.storage_path;
  const targetPath = sourcePath;

  try {
    // 1. Download from source bucket
    const { data: blob, error: downloadError } = await supabase.storage
      .from(sourceBucket)
      .download(sourcePath);

    if (downloadError || !blob) {
      return { success: false, error: `Could not retrieve file from source bucket: ${downloadError?.message}` };
    }

    // 2. Upload to target bucket
    const { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(targetPath, blob, {
        contentType: blob.type || asset.format || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Failed to write file to target bucket: ${uploadError.message}` };
    }

    // 3. Remove from source bucket
    await supabase.storage.from(sourceBucket).remove([sourcePath]);

    // 4. Compute new URL
    let newUrl = "";
    if (targetMode === "public") {
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.PUBLIC)
        .getPublicUrl(targetPath);
      newUrl = urlData.publicUrl;
    } else {
      newUrl = `storage://${STORAGE_BUCKETS.PRIVATE}/${targetPath}`;
    }

    // 5. Update media_assets metadata
    const { data: updatedAsset, error: updateError } = await supabase
      .from("media_assets")
      .update({
        bucket_id: targetBucket,
        storage_path: targetPath,
        access_mode: targetMode,
        url: newUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: `Metadata update failed: ${updateError.message}` };
    }

    revalidatePath("/admin/media");
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, asset: updatedAsset as MediaAsset };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to move asset access mode.",
    };
  }
}

/**
 * Server Action: Generate a temporary signed URL for a private asset.
 * Protected: Administrator access only.
 */
export async function getSignedUrlAction(
  id: string,
  expiresInSeconds: number = 3600
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    await assertServerAdmin();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Database client unconfigured." };

  const { data: asset, error: fetchError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !asset) {
    return { success: false, error: "Asset not found." };
  }

  const { data, error } = await supabase.storage
    .from(asset.bucket_id)
    .createSignedUrl(asset.storage_path, expiresInSeconds);

  if (error || !data) {
    return { success: false, error: error?.message || "Failed to create signed URL." };
  }

  return { success: true, signedUrl: data.signedUrl };
}

/**
 * Server Action: Update alt text, caption, or folder metadata for an asset.
 */
export async function updateMediaMetadataAction(
  id: string,
  updates: { alt_text?: string | null; caption?: string | null; folder?: string | null }
): Promise<{ success: boolean; asset?: MediaAsset; error?: string }> {
  try {
    await assertServerAdmin();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Database client unconfigured." };

  const { data, error } = await supabase
    .from("media_assets")
    .update({
      alt_text: updates.alt_text !== undefined ? updates.alt_text : undefined,
      caption: updates.caption !== undefined ? updates.caption : undefined,
      folder: updates.folder !== undefined ? updates.folder : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/media");
  return { success: true, asset: data as MediaAsset };
}

export interface RecordDirectUploadInput {
  bucket_id: string;
  storage_path: string;
  url: string;
  format: string;
  bytes: number;
  resource_type: "image" | "document";
  access_mode: "public" | "private";
  alt_text?: string | null;
  caption?: string | null;
  folder?: string | null;
}

/**
 * Server Action: Records metadata for an asset uploaded directly to Supabase Storage.
 * Verifies admin privileges and metadata safety.
 * If database insert fails, automatically removes the uploaded storage object to prevent orphans.
 */
export async function recordDirectUploadAction(
  input: RecordDirectUploadInput
): Promise<MediaUploadResult> {
  try {
    await assertServerAdmin();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Database client unconfigured." };

  const validBuckets = [STORAGE_BUCKETS.PUBLIC, STORAGE_BUCKETS.PRIVATE];
  if (!validBuckets.includes(input.bucket_id as any)) {
    return { success: false, error: "Invalid storage bucket." };
  }

  const isDocument = input.resource_type === "document" || input.format === "application/pdf";
  const validation = validateAsset(input.format, input.bytes, isDocument, input.access_mode);
  if (!validation.valid) {
    await supabase.storage.from(input.bucket_id).remove([input.storage_path]);
    return { success: false, error: validation.error };
  }

  if (!input.storage_path || input.storage_path.includes("..") || input.storage_path.startsWith("/")) {
    await supabase.storage.from(input.bucket_id).remove([input.storage_path]);
    return { success: false, error: "Invalid storage path detected." };
  }

  let resolvedUrl = input.url;
  if (input.access_mode === "public") {
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.PUBLIC)
      .getPublicUrl(input.storage_path);
    resolvedUrl = urlData.publicUrl;
  } else {
    resolvedUrl = `storage://${STORAGE_BUCKETS.PRIVATE}/${input.storage_path}`;
  }

  try {
    const cleanFolder = (input.folder || "uploads")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .replace(/^_+|_+$/g, "") || "uploads";

    const { data: assetData, error: dbError } = await supabase
      .from("media_assets")
      .insert({
        bucket_id: input.bucket_id,
        storage_path: input.storage_path,
        url: resolvedUrl,
        format: input.format,
        bytes: input.bytes,
        resource_type: isDocument ? "document" : "image",
        access_mode: input.access_mode,
        alt_text: input.alt_text?.trim() || null,
        caption: input.caption?.trim() || null,
        folder: cleanFolder,
      })
      .select()
      .single();

    if (dbError || !assetData) {
      console.error("[recordDirectUploadAction] DB insert failed, rolling back storage object:", dbError);
      await supabase.storage.from(input.bucket_id).remove([input.storage_path]);
      return { success: false, error: `Failed to record asset metadata: ${dbError?.message}` };
    }

    revalidatePath("/admin/media");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/projects");
    revalidatePath("/");
    return { success: true, asset: assetData as MediaAsset };
  } catch (err) {
    await supabase.storage.from(input.bucket_id).remove([input.storage_path]);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unexpected database error recording asset.",
    };
  }
}

/**
 * Server Action: Fetch all public image assets for project cover selection.
 * Exclusively queries assets where access_mode = 'public' and resource_type = 'image'.
 */
export async function getPublicMediaAssetsAction(): Promise<{
  success: boolean;
  assets: MediaAsset[];
  error?: string;
}> {
  try {
    await assertServerAdmin();
  } catch {
    return { success: false, assets: [], error: "Unauthorized. Admin privileges required." };
  }

  const supabase = await createClient();
  if (!supabase) return { success: false, assets: [], error: "Database client unconfigured." };

  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("access_mode", "public")
    .eq("resource_type", "image")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, assets: [], error: error.message };
  }

  return { success: true, assets: (data as MediaAsset[]) || [] };
}
