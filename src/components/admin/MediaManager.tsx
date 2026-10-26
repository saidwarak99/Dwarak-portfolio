"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import Image from "next/image";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  Lock,
  Globe,
  Search,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ArrowRightLeft,
  X,
  FileUp,
} from "lucide-react";
import {
  uploadMediaAction,
  recordDirectUploadAction,
  deleteMediaAction,
  moveMediaAccessModeAction,
  getSignedUrlAction,
  type MediaUploadResult,
} from "@/lib/actions/media";
import { createClient } from "@/lib/supabase/client";
import { sanitizeStorageFilename } from "@/lib/storage/validation";
import type { MediaAsset } from "@/types/database.types";

interface MediaManagerProps {
  initialAssets: MediaAsset[];
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function MediaManager({ initialAssets }: MediaManagerProps) {
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "public" | "private">("all");
  const [filterType, setFilterType] = useState<"all" | "image" | "document">("all");

  // Upload modal / state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<"public" | "private">("public");
  const [uploadFolder, setUploadFolder] = useState("uploads");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Signed URL modal / state
  const [signedUrlData, setSignedUrlData] = useState<{ id: string; url: string; expiresAt: string } | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Failed image previews fallback tracking
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Pending transitions
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Object URL lifecycle for selected file preview
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Validation helper
  const validateSelectedFile = (file: File): string | null => {
    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      return "SVG uploads are disabled for security reasons (stored XSS prevention). Please choose a raster image (PNG, JPEG, WebP, GIF) or PDF document.";
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const allowedImages = ["image/png", "image/jpeg", "image/webp", "image/gif"];

    if (isPdf) {
      if (file.size > 20 * 1024 * 1024) {
        return "PDF document exceeds the 20 MB size limit.";
      }
    } else {
      if (!allowedImages.includes(file.type)) {
        return `Unsupported file format (${file.type || "unknown"}). Only PNG, JPEG, WebP, GIF, and PDF files are allowed.`;
      }
      if (file.size > 10 * 1024 * 1024) {
        return "Image file exceeds the 10 MB size limit.";
      }
    }

    return null;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const err = validateSelectedFile(file);
    if (err) {
      setUploadError(err);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    if (filterMode !== "all" && asset.access_mode !== filterMode) return false;
    if (filterType !== "all" && asset.resource_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const filename = asset.storage_path.toLowerCase();
      const alt = (asset.alt_text || "").toLowerCase();
      const caption = (asset.caption || "").toLowerCase();
      return filename.includes(q) || alt.includes(q) || caption.includes(q);
    }
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    const validationErr = validateSelectedFile(selectedFile);
    if (validationErr) {
      setUploadError(validationErr);
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      const client = createClient();
      let res: MediaUploadResult;

      const cleanFolder = uploadFolder
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .replace(/^_+|_+$/g, "") || "uploads";
      const sanitizedFilename = sanitizeStorageFilename(selectedFile.name);
      const storagePath = `${cleanFolder}/${Date.now()}-${sanitizedFilename}`;
      const targetBucket = uploadMode === "private" ? "portfolio-private" : "portfolio-public";

      if (client) {
        setUploadStatusText(`Uploading to ${targetBucket}...`);
        const { error: uploadErr } = await client.storage
          .from(targetBucket)
          .upload(storagePath, selectedFile, {
            contentType: selectedFile.type,
            upsert: false,
          });

        if (uploadErr) {
          throw new Error(`Storage upload error: ${uploadErr.message}`);
        }

        setUploadStatusText("Recording asset metadata...");
        res = await recordDirectUploadAction({
          bucket_id: targetBucket,
          storage_path: storagePath,
          url: "",
          format: selectedFile.type,
          bytes: selectedFile.size,
          resource_type: selectedFile.type === "application/pdf" ? "document" : "image",
          access_mode: uploadMode,
          alt_text: uploadAlt,
          caption: uploadCaption,
          folder: cleanFolder,
        });
      } else {
        // Fallback to server action
        setUploadStatusText("Uploading via server action...");
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("access_mode", uploadMode);
        formData.append("folder", cleanFolder);
        formData.append("alt_text", uploadAlt);
        formData.append("caption", uploadCaption);
        res = await uploadMediaAction(formData);
      }

      if (res.success && res.asset) {
        setAssets((prev) => [res.asset!, ...prev]);
        setUploadSuccess(`Uploaded "${selectedFile.name}" successfully to ${uploadMode === "private" ? "portfolio-private" : "portfolio-public"}.`);
        setSelectedFile(null);
        setUploadAlt("");
        setUploadCaption("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => {
          setIsUploadOpen(false);
          setUploadSuccess(null);
          setUploadStatusText("");
        }, 1200);
      } else {
        setUploadError(res.error || "Upload failed. Please check file format and administrative permissions.");
      }
    } catch (err) {
      console.error("[MediaManager] Upload error:", err);
      setUploadError(err instanceof Error ? err.message : "An unexpected upload error occurred. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This removes the physical storage object and database record.`)) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteMediaAction(id);
      if (res.success) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert(res.error || "Failed to delete asset.");
      }
      setDeletingId(null);
    });
  };

  const handleMoveAccessMode = (id: string, currentMode: "public" | "private") => {
    const targetMode = currentMode === "public" ? "private" : "public";
    const confirmMsg = targetMode === "public"
      ? "Promote this asset to public? It will be physically moved to portfolio-public and deliverable to anyone."
      : "Move this asset to private? It will be physically moved to portfolio-private and completely blocked from anonymous access.";

    if (!confirm(confirmMsg)) return;

    setMovingId(id);
    startTransition(async () => {
      const res = await moveMediaAccessModeAction(id, targetMode);
      if (res.success && res.asset) {
        setAssets((prev) => prev.map((a) => (a.id === id ? res.asset! : a)));
      } else {
        alert(res.error || "Failed to move asset access mode.");
      }
      setMovingId(null);
    });
  };

  const handleGenerateSignedUrl = (id: string) => {
    startTransition(async () => {
      const res = await getSignedUrlAction(id, 3600); // 1 hour
      if (res.success && res.signedUrl) {
        const expiresAt = new Date(Date.now() + 3600 * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSignedUrlData({ id, url: res.signedUrl, expiresAt });
      } else {
        alert(res.error || "Could not generate signed URL.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 border-2 border-[#230D10] brutalist-shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#4A2E33] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by filename, alt text, or caption..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] placeholder-[#8A6A70] focus:outline-none focus:bg-white"
          />
        </div>

        {/* Filters and Upload Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="px-3 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono font-bold text-[#230D10] focus:outline-none"
          >
            <option value="all">All Access Modes</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono font-bold text-[#230D10] focus:outline-none"
          >
            <option value="all">All File Types</option>
            <option value="image">Images Only</option>
            <option value="document">PDF Documents</option>
          </select>

          {/* Upload Button */}
          <button
            onClick={() => {
              setIsUploadOpen(true);
              setUploadError(null);
              setUploadSuccess(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#230D10] transition-colors brutalist-shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Asset</span>
          </button>
        </div>
      </div>

      {/* Asset Count & Active Status */}
      <div className="flex items-center justify-between text-xs font-mono text-[#4A2E33] px-1">
        <span>
          Showing <strong>{filteredAssets.length}</strong> of <strong>{assets.length}</strong> total assets
        </span>
        <span className="text-[11px] text-[#166534] bg-[#E8F8EE] px-2 py-0.5 border border-[#166534]">
          Live Storage Connection Active
        </span>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="border-2 border-dashed border-[#230D10] p-12 text-center bg-white space-y-3">
          <div className="w-12 h-12 mx-auto border-2 border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929]">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black font-mono uppercase text-[#230D10]">
            No matching assets found
          </h3>
          <p className="text-xs font-mono text-[#4A2E33] max-w-md mx-auto">
            {assets.length === 0
              ? "Your storage buckets are currently empty. Upload your first raster image or PDF document above."
              : "No assets match your search query or active filter settings. Try adjusting the filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const isImage = asset.resource_type === "image";
            const isPublic = asset.access_mode === "public";
            const filename = asset.storage_path.split("/").pop() || asset.storage_path;
            const isDeleting = deletingId === asset.id;
            const isMoving = movingId === asset.id;
            const hasLoadFailed = failedImages[asset.id];

            return (
              <div
                key={asset.id}
                className="border-2 border-[#230D10] bg-white brutalist-shadow-sm flex flex-col justify-between hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform"
              >
                {/* Preview Box */}
                <div className="relative w-full h-48 bg-[#FFF7F5] border-b-2 border-[#230D10] flex items-center justify-center overflow-hidden">
                  {isImage && isPublic ? (
                    hasLoadFailed ? (
                      <div className="text-center p-4 space-y-2">
                        <AlertCircle className="w-8 h-8 text-[#EC2929] mx-auto" />
                        <span className="text-[10px] font-mono font-bold text-[#4A2E33] block">
                          Preview Unavailable
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={asset.url}
                        alt={asset.alt_text || filename}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-contain p-2"
                        unoptimized={asset.format?.includes("svg")}
                        onError={() => {
                          setFailedImages((prev) => ({ ...prev, [asset.id]: true }));
                        }}
                      />
                    )
                  ) : isImage && !isPublic ? (
                    <div className="text-center p-4 space-y-2">
                      <div className="w-10 h-10 mx-auto border-2 border-[#230D10] bg-[#FFF0F0] flex items-center justify-center text-[#EC2929]">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#EC2929] block">
                        Private Asset Isolation
                      </span>
                      <button
                        onClick={() => handleGenerateSignedUrl(asset.id)}
                        disabled={isPending}
                        className="text-[10px] font-mono font-bold underline text-[#230D10] hover:text-[#EC2929]"
                      >
                        Generate Temporary Preview
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <div className="w-12 h-12 mx-auto border-2 border-[#230D10] bg-white flex items-center justify-center text-[#230D10]">
                        <FileText className="w-6 h-6 text-[#EC2929]" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                        PDF Document
                      </span>
                      <span className="text-[10px] font-mono text-[#4A2E33]">
                        {formatBytes(asset.bytes)}
                      </span>
                    </div>
                  )}

                  {/* Mode Badge in Top-Right */}
                  <div className="absolute top-2 right-2">
                    {isPublic ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8F8EE] text-[#166534] border border-[#166534] text-[10px] font-mono font-bold uppercase">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFF0F0] text-[#EC2929] border border-[#EC2929] text-[10px] font-mono font-bold uppercase">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </span>
                    )}
                  </div>

                  {/* Folder Badge in Top-Left */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 bg-[#230D10] text-white text-[10px] font-mono font-bold uppercase">
                      {asset.folder || "uploads"}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4
                      className="text-xs font-mono font-bold text-[#230D10] truncate"
                      title={filename}
                    >
                      {filename}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#4A2E33]">
                      <span>{formatBytes(asset.bytes)}</span>
                      <span className="uppercase">{asset.format || "unknown"}</span>
                    </div>
                    {asset.alt_text && (
                      <p className="text-[10px] font-mono text-[#4A2E33] italic truncate">
                        Alt: &quot;{asset.alt_text}&quot;
                      </p>
                    )}
                  </div>

                  {/* Storage Path Box & Actions */}
                  <div className="space-y-2 pt-2 border-t border-[#230D10]/10">
                    <div className="flex items-center justify-between gap-2 bg-[#FFF7F5] border border-[#230D10] px-2 py-1 text-[10px] font-mono">
                      <span className="truncate text-[#4A2E33]" title={asset.storage_path}>
                        {asset.storage_path}
                      </span>
                      <button
                        onClick={() => handleCopy(isPublic ? asset.url : asset.storage_path, asset.id)}
                        className="p-1 hover:text-[#EC2929] transition-colors flex-shrink-0"
                        title={isPublic ? "Copy public CDN URL" : "Copy storage path"}
                      >
                        {copiedId === asset.id ? (
                          <Check className="w-3.5 h-3.5 text-[#166534]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      {/* Move Access Mode */}
                      <button
                        onClick={() => handleMoveAccessMode(asset.id, asset.access_mode as any)}
                        disabled={isMoving || isDeleting}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-[#230D10] text-[10px] font-mono font-bold uppercase hover:bg-[#FFF7F5] disabled:opacity-50"
                        title={isPublic ? "Move to private bucket" : "Promote to public bucket"}
                      >
                        {isMoving ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="w-3 h-3 text-[#EC2929]" />
                        )}
                        <span>{isPublic ? "Make Private" : "Make Public"}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {isPublic && (
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 border border-[#230D10] hover:bg-[#FFF7F5] text-[#230D10]"
                            title="Open direct URL in new tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(asset.id, filename)}
                          disabled={isDeleting || isMoving}
                          className="p-1.5 border border-[#230D10] hover:bg-[#FFF0F0] text-[#EC2929] disabled:opacity-50"
                          title="Delete asset permanently"
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-[#230D10]/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#230D10] max-w-lg w-full brutalist-shadow-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#230D10] pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#EC2929]" />
                <h3 className="text-base font-black font-mono uppercase text-[#230D10]">
                  Upload Asset to Storage
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!isUploading) setIsUploadOpen(false);
                }}
                disabled={isUploading}
                className="p-1 border border-[#230D10] hover:bg-[#F5D9D5] disabled:opacity-50"
              >
                <X className="w-4 h-4 text-[#230D10]" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag-and-Drop / File Picker Dropzone */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                  Select File <span className="text-[#EC2929]">*</span>
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4 border-2 border-dashed transition-colors text-center relative ${
                    isDragging
                      ? "border-[#EC2929] bg-[#FFF0F0]"
                      : selectedFile
                      ? "border-[#166534] bg-[#E8F8EE]"
                      : "border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      handleFileSelect(f);
                    }}
                    className="hidden"
                    id="media-file-input"
                    disabled={isUploading}
                  />

                  {selectedFile ? (
                    <div className="space-y-3">
                      {previewUrl ? (
                        <div className="relative w-32 h-32 mx-auto border-2 border-[#230D10] bg-white overflow-hidden brutalist-shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="Selected preview"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 mx-auto border-2 border-[#230D10] bg-white flex items-center justify-center text-[#EC2929]">
                          <FileText className="w-8 h-8" />
                        </div>
                      )}

                      <div className="text-xs font-mono">
                        <p className="font-bold text-[#230D10] truncate max-w-xs mx-auto">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-[#4A2E33]">
                          {formatBytes(selectedFile.size)} • {selectedFile.type || "unknown"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1 px-3 py-1 border border-[#230D10] bg-white text-[11px] font-mono font-bold uppercase text-[#EC2929] hover:bg-[#FFF0F0] transition-colors"
                      >
                        <X className="w-3 h-3" />
                        <span>Choose Different File</span>
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="media-file-input"
                      className="cursor-pointer block py-4 space-y-2"
                    >
                      <div className="w-12 h-12 mx-auto border-2 border-[#230D10] bg-white flex items-center justify-center text-[#EC2929] brutalist-shadow-sm">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-mono">
                        <span className="font-bold text-[#EC2929] underline">
                          Click to browse
                        </span>{" "}
                        or drag and drop your file here
                      </div>
                      <p className="text-[10px] font-mono text-[#4A2E33]">
                        PNG, JPEG, WebP, GIF (up to 10 MB) or PDF (up to 20 MB)
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* Bucket / Access Mode Selection */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                  Storage Destination &amp; Access Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode("public")}
                    disabled={isUploading}
                    className={`p-3 border-2 border-[#230D10] text-left transition-colors ${
                      uploadMode === "public"
                        ? "bg-[#E8F8EE] border-[#166534]"
                        : "bg-white hover:bg-[#FFF7F5]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#166534] uppercase">
                      <Globe className="w-3.5 h-3.5" />
                      <span>portfolio-public</span>
                    </div>
                    <p className="text-[10px] font-mono text-[#4A2E33] mt-1">
                      Direct public URL for project covers, case studies, or hero artwork.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode("private")}
                    disabled={isUploading}
                    className={`p-3 border-2 border-[#230D10] text-left transition-colors ${
                      uploadMode === "private"
                        ? "bg-[#FFF0F0] border-[#EC2929]"
                        : "bg-white hover:bg-[#FFF7F5]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#EC2929] uppercase">
                      <Lock className="w-3.5 h-3.5" />
                      <span>portfolio-private</span>
                    </div>
                    <p className="text-[10px] font-mono text-[#4A2E33] mt-1">
                      Restricted storage. Accessible only through temporary signed URLs.
                    </p>
                  </button>
                </div>
              </div>

              {/* Folder selection */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                  Storage Folder
                </label>
                <input
                  type="text"
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  disabled={isUploading}
                  placeholder="e.g. projects, avatars, resume, uploads"
                  className="w-full px-3 py-1.5 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white"
                />
              </div>

              {/* Alt Text */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                  Alt Text (Accessibility)
                </label>
                <input
                  type="text"
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  disabled={isUploading}
                  placeholder="Describe image content for screen readers..."
                  className="w-full px-3 py-1.5 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white"
                />
              </div>

              {/* Caption */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                  Caption / Internal Note
                </label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  disabled={isUploading}
                  placeholder="Optional context or figure caption..."
                  className="w-full px-3 py-1.5 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white"
                />
              </div>

              {/* Feedback messages */}
              {uploadError && (
                <div className="p-3 border-2 border-[#EC2929] bg-[#FFF0F0] text-xs font-mono text-[#EC2929] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 border-2 border-[#166534] bg-[#E8F8EE] text-xs font-mono text-[#166534] flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#230D10]/20">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 border-2 border-[#230D10] bg-white text-xs font-mono font-bold uppercase hover:bg-[#F5D9D5] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#230D10] transition-colors brutalist-shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{uploadStatusText || "Uploading..."}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Execute Upload</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signed URL Result Modal */}
      {signedUrlData && (
        <div className="fixed inset-0 z-50 bg-[#230D10]/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#230D10] max-w-lg w-full brutalist-shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#230D10] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#EC2929]" />
                <h3 className="text-base font-black font-mono uppercase text-[#230D10]">
                  Temporary Signed URL Generated
                </h3>
              </div>
              <button
                onClick={() => setSignedUrlData(null)}
                className="p-1 border border-[#230D10] hover:bg-[#F5D9D5]"
              >
                <X className="w-4 h-4 text-[#230D10]" />
              </button>
            </div>

            <p className="text-xs font-mono text-[#4A2E33]">
              This temporary URL is cryptographically signed and grants access until{" "}
              <strong>{signedUrlData.expiresAt}</strong> (1 hour). Anonymous visitors cannot view or reconstruct this file without a valid signature.
            </p>

            <div className="p-3 bg-[#FFF7F5] border-2 border-[#230D10] text-xs font-mono text-[#230D10] break-all select-all">
              {signedUrlData.url}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#230D10]/20">
              <a
                href={signedUrlData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-[#230D10] bg-white text-xs font-mono font-bold uppercase hover:bg-[#F5D9D5] transition-colors"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleCopy(signedUrlData.url, "signed-modal")}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#230D10] text-[#FFF7F5] text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#EC2929] transition-colors"
              >
                {copiedId === "signed-modal" ? (
                  <>
                    <Check className="w-4 h-4 text-[#166534]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
