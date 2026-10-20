// ==============================================================================
// Server-side Cloudinary Media Architecture (Phase 2.2)
// ==============================================================================
// Security Principles:
// 1. CLOUDINARY_API_SECRET is strictly server-only. NEVER expose to the browser.
// 2. Direct browser uploads use server-generated HMAC-SHA1 signed parameters.
// 3. Strict validation: 10MB limit for images, 20MB limit for PDFs.
// 4. Access Strategy:
//    - Public: Standard CDN delivery for assets used in published projects/posts.
//    - Authenticated / Restricted: Signed time-limited delivery for draft assets
//      or private documents (e.g. pre-release resumes).
// ==============================================================================
import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_UPLOAD_LIMITS = {
  IMAGE_MAX_BYTES: 10 * 1024 * 1024, // 10 MB
  DOCUMENT_MAX_BYTES: 20 * 1024 * 1024, // 20 MB
  ALLOWED_IMAGE_MIMES: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "image/gif",
  ],
  ALLOWED_DOCUMENT_MIMES: ["application/pdf"],
} as const;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes("your_cloud_name")
  );
}

/**
 * Configure the server-side Cloudinary instance.
 */
export function getCloudinaryClient() {
  if (!isCloudinaryConfigured()) {
    return null;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

export interface SignedUploadParams {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
  accessMode: "public" | "authenticated";
}

/**
 * Generates server-signed upload parameters for direct client uploads to Cloudinary.
 * The client posts directly to Cloudinary using this signature, ensuring the secret
 * key remains secure on the server.
 *
 * @param folder - Destination folder (e.g., 'portfolio/projects', 'portfolio/articles')
 * @param accessMode - 'public' for published assets, 'authenticated' for draft/private assets
 */
export function generateSignedUploadParams(
  folder: string = "portfolio/general",
  accessMode: "public" | "authenticated" = "public"
): SignedUploadParams {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary credentials are not configured in environment variables.");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;

  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  };

  if (accessMode === "authenticated") {
    paramsToSign.type = "authenticated";
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    timestamp,
    folder,
    signature,
    apiKey,
    cloudName,
    accessMode,
  };
}

/**
 * Generates a signed, time-limited URL for authenticated (restricted/draft) assets.
 *
 * @param publicId - Cloudinary public ID
 * @param expiresInSeconds - Token lifetime in seconds (default: 3600 / 1 hour)
 */
export function getSignedAssetUrl(publicId: string, expiresInSeconds: number = 3600): string | null {
  const client = getCloudinaryClient();
  if (!client) return null;

  return client.url(publicId, {
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}
