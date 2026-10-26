"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Search,
  X,
  RefreshCw,
  Check,
  UploadCloud,
  FileUp,
} from "lucide-react";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { getPublicMediaAssetsAction, recordDirectUploadAction } from "@/lib/actions/media";
import { createClient } from "@/lib/supabase/client";
import { sanitizeStorageFilename, validateAsset } from "@/lib/storage/validation";
import type { Database, MediaAsset } from "@/types/database.types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

function isLocalPath(path: string): boolean {
  if (!path) return false;
  const trimmed = path.trim();
  return (
    /^[a-zA-Z]:[\\\/]/.test(trimmed) ||
    trimmed.startsWith("file://") ||
    trimmed.includes("\\")
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProjectForm({
  initialData,
}: {
  initialData?: ProjectRow;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);

  // Form Fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [category, setCategory] = useState(initialData?.category || "ai-products");
  const [customCategory, setCustomCategory] = useState(
    initialData?.category && initialData.category !== "ai-products" && initialData.category !== "ux-ui"
      ? initialData.category
      : ""
  );
  const [projectType, setProjectType] = useState(initialData?.project_type || "side-project");
  const [role, setRole] = useState(initialData?.role || "");
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || "");
  const [status, setStatus] = useState<"concept" | "in_progress" | "completed" | "archived">(
    initialData?.status || "concept"
  );
  const [isPublished, setIsPublished] = useState(Boolean(initialData?.is_published));
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.is_featured));
  const [displayOrder, setDisplayOrder] = useState(Number(initialData?.display_order ?? 0));

  // Tools & Tags
  const initialTools = Array.isArray(initialData?.tools)
    ? (initialData.tools as string[]).join(", ")
    : "";
  const initialTags = Array.isArray(initialData?.tags)
    ? (initialData.tags as string[]).join(", ")
    : "";
  const [toolsInput, setToolsInput] = useState(initialTools);
  const [tagsInput, setTagsInput] = useState(initialTags);

  // Links
  const linksObj = (initialData?.links as any) || {};
  const [demoUrl, setDemoUrl] = useState(linksObj.demo_url || "");
  const [figmaUrl, setFigmaUrl] = useState(linksObj.figma_url || "");
  const [githubUrl, setGithubUrl] = useState(linksObj.github_url || "");

  // Media Picker & Validation States
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [coverImageLoadFailed, setCoverImageLoadFailed] = useState(false);

  // In-modal Direct Upload States
  const [modalTab, setModalTab] = useState<"browse" | "upload">("browse");
  const [modalUploadFile, setModalUploadFile] = useState<File | null>(null);
  const [modalUploadPreview, setModalUploadPreview] = useState<string | null>(null);
  const [isModalUploading, setIsModalUploading] = useState(false);
  const [modalUploadError, setModalUploadError] = useState<string | null>(null);
  const [modalUploadStatus, setModalUploadStatus] = useState<string>("");
  const modalFileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!modalUploadFile) {
      setModalUploadPreview(null);
      return;
    }
    const url = URL.createObjectURL(modalUploadFile);
    setModalUploadPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [modalUploadFile]);

  const openMediaPicker = async (defaultTab: "browse" | "upload" = "browse") => {
    setModalTab(defaultTab);
    setIsMediaPickerOpen(true);
    setModalUploadError(null);
    setModalUploadFile(null);
    setIsLoadingMedia(true);
    setMediaError(null);
    try {
      const res = await getPublicMediaAssetsAction();
      if (res.success) {
        setMediaAssets(res.assets);
      } else {
        setMediaError(res.error || "Failed to load public media assets.");
      }
    } catch {
      setMediaError("Could not connect to media library.");
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleModalDirectUpload = async (file: File) => {
    const validation = validateAsset(file.type, file.size, false, "public");
    if (!validation.valid) {
      setModalUploadError(validation.error || "Invalid file format or size.");
      return;
    }

    setModalUploadError(null);
    setIsModalUploading(true);
    setModalUploadStatus("Uploading image to portfolio-public...");

    try {
      const client = createClient();
      if (!client) {
        throw new Error("Supabase client is not configured.");
      }

      const cleanFolder = "projects";
      const sanitized = sanitizeStorageFilename(file.name);
      const storagePath = `${cleanFolder}/${Date.now()}-${sanitized}`;

      const { error: uploadErr } = await client.storage
        .from("portfolio-public")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadErr) {
        throw new Error(`Storage upload failed: ${uploadErr.message}`);
      }

      setModalUploadStatus("Registering asset in media library...");
      const res = await recordDirectUploadAction({
        bucket_id: "portfolio-public",
        storage_path: storagePath,
        url: "",
        format: file.type,
        bytes: file.size,
        resource_type: "image",
        access_mode: "public",
        folder: cleanFolder,
        alt_text: title ? `${title} Cover Image` : file.name,
      });

      if (res.success && res.asset) {
        setCoverImage(res.asset.url);
        setCoverImageLoadFailed(false);
        setIsMediaPickerOpen(false);
        setModalUploadFile(null);
        setFeedback({
          type: "success",
          message: `Uploaded "${file.name}" and selected as project cover! Click "Update Project" to save changes.`,
        });
      } else {
        setModalUploadError(res.error || "Failed to record asset metadata.");
      }
    } catch (err) {
      setModalUploadError(err instanceof Error ? err.message : "Upload error occurred.");
    } finally {
      setIsModalUploading(false);
      setModalUploadStatus("");
    }
  };

  const filteredMediaAssets = mediaAssets.filter((asset) => {
    if (asset.access_mode !== "public") return false;
    if (!mediaSearchQuery.trim()) return true;
    const q = mediaSearchQuery.toLowerCase();
    const filename = asset.storage_path.toLowerCase();
    const alt = (asset.alt_text || "").toLowerCase();
    const caption = (asset.caption || "").toLowerCase();
    return filename.includes(q) || alt.includes(q) || caption.includes(q);
  });

  // States
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = (e: React.FormEvent, overridePublish?: boolean) => {
    e.preventDefault();
    setFeedback(null);

    const publishState = overridePublish !== undefined ? overridePublish : isPublished;
    const finalCategory = customCategory.trim() ? customCategory.trim() : category;

    if (!title.trim()) {
      setFeedback({ type: "error", message: "Project title is required." });
      return;
    }
    if (!shortDescription.trim()) {
      setFeedback({ type: "error", message: "Short description is required." });
      return;
    }
    if (coverImage.trim() && isLocalPath(coverImage)) {
      setFeedback({
        type: "error",
        message:
          "Local Windows file paths (e.g. C:\\...) cannot be used as cover image URLs. Please click 'Choose from Media Library' or upload the image in the Media Library first.",
      });
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slugify(slug || title),
      category: finalCategory,
      short_description: shortDescription.trim(),
      content: content.trim() || undefined,
      project_type: projectType,
      role: role.trim() || undefined,
      cover_image: coverImage.trim() ? coverImage.trim() : null,
      status,
      is_published: publishState,
      is_featured: isFeatured,
      display_order: Number(displayOrder),
      tools: toolsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: tagsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      links: {
        demo_url: demoUrl.trim() || null,
        figma_url: figmaUrl.trim() || null,
        github_url: githubUrl.trim() || null,
      },
    };

    startTransition(async () => {
      try {
        if (isEdit && initialData?.id) {
          await updateProjectAction(initialData.id, payload as any);
          setFeedback({
            type: "success",
            message: `Project updated successfully (${publishState ? "Published" : "Draft"}).`,
          });
          setIsPublished(publishState);
          router.refresh();
        } else {
          const res = await createProjectAction(payload);
          setFeedback({
            type: "success",
            message: "Project created successfully! Redirecting to editor...",
          });
          if (res.project?.id) {
            setTimeout(() => {
              router.push(`/admin/projects/${res.project.id}`);
            }, 500);
          }
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to save project.",
        });
      }
    });
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 border-2 text-xs font-mono flex items-center justify-between ${
            feedback.type === "success"
              ? "border-[#230D10] bg-[#E8F8EE] text-[#166534]"
              : "border-[#EC2929] bg-[#FFF0F0] text-[#EC2929]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs uppercase font-bold hover:underline"
          >
            [close]
          </button>
        </div>
      )}

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Core Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basics */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              <Sparkles className="w-4 h-4" />
              <span>Project Identity & Basics</span>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Specimen AI Platform"
                className="w-full px-3.5 py-2.5 border-2 border-[#230D10] text-sm font-mono text-[#230D10] bg-[#FFF7F5] focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono font-bold text-[#230D10] uppercase">
                  URL Slug *
                </label>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[10px] font-mono text-[#4A2E33] hover:underline"
                >
                  {autoSlug ? "[Manual Edit]" : "[Auto Sync with Title]"}
                </button>
              </div>
              <div className="flex items-center border-2 border-[#230D10] bg-white px-3 py-2 text-xs font-mono">
                <span className="text-[#4A2E33] select-none">/projects/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setSlug(e.target.value);
                  }}
                  className="flex-1 bg-transparent border-none text-xs font-mono font-bold text-[#230D10] focus:outline-none"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Short Description (Card Summary) *
              </label>
              <textarea
                required
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A high-level sentence summarizing the core value, problem solved, or innovation..."
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono text-[#230D10] bg-white focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              />
            </div>

            {/* Detailed Content / Case Study Overview */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Overview & Narrative (Markdown or Plain Text)
              </label>
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="In-depth explanation of the background, context, approach, design systems, and outcomes..."
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono text-[#230D10] bg-white focus:outline-none focus:ring-2 focus:ring-[#EC2929] leading-relaxed"
              />
            </div>
          </div>

          {/* Card 2: Links & Tools */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4">
            <div className="text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              External References & Stack
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Live Demo URL
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-[#FFF7F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Figma File URL
                </label>
                <input
                  type="url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://figma.com/..."
                  className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-[#FFF7F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-[#FFF7F5] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Tools Used (Comma-separated)
                </label>
                <input
                  type="text"
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  placeholder="Figma, Framer, Next.js, Cursor, Tailwind CSS"
                  className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Tags & Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Design System, Agentic UI, Prototyping"
                  className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Publishing, Categories & Meta */}
        <div className="space-y-6">
          {/* Card 3: Publication & Status */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-5">
            <div className="text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              Publication Control
            </div>

            {/* Visibility Toggle */}
            <div className="p-3 border-2 border-[#230D10] bg-[#FFF7F5] space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#EC2929] rounded-none border-2 border-[#230D10]"
                />
                <span className="text-xs font-mono font-bold uppercase text-[#230D10]">
                  {isPublished ? "Published (Visible Publicly)" : "Draft (Private Isolation)"}
                </span>
              </label>
              <p className="text-[11px] font-mono text-[#4A2E33] leading-relaxed">
                {isPublished
                  ? "This project is visible to visitors in public galleries."
                  : "Protected by RLS: completely invisible to anonymous visitors."}
              </p>
            </div>

            {/* Featured Switch */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#EC2929] rounded-none border-2 border-[#230D10]"
              />
              <span className="text-xs font-mono font-bold uppercase text-[#230D10]">
                Mark as Featured Project
              </span>
            </label>

            {/* Status */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-[#FFF7F5] uppercase font-bold"
              >
                <option value="concept">Concept</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Display Order Priority
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-[#FFF7F5]"
              />
              <span className="text-[10px] font-mono text-[#4A2E33] mt-1 block">
                Lower numbers display first (0, 1, 2...)
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#E8CEC9] space-y-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isEdit ? "Update Project" : "Create Project"}</span>
              </button>

              {isEdit && initialData?.id && (
                <Link
                  href={`/admin/projects/${initialData.id}/preview`}
                  target="_blank"
                  className="w-full py-2 px-4 bg-white text-[#230D10] text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Project View</span>
                </Link>
              )}
            </div>
          </div>

          {/* Card 4: Category & Role */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4">
            <div className="text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              Classification & Role
            </div>

            {/* Category Selector with Flexible Entry */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategory("ai-products");
                    setCustomCategory("");
                  }}
                  className={`py-1.5 px-2 text-xs font-mono font-bold uppercase border-2 transition-colors ${
                    category === "ai-products" && !customCategory
                      ? "border-[#230D10] bg-[#EC2929] text-white"
                      : "border-[#230D10] bg-[#FFF7F5] text-[#230D10] hover:bg-[#F5D9D5]"
                  }`}
                >
                  AI Products
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory("ux-ui");
                    setCustomCategory("");
                  }}
                  className={`py-1.5 px-2 text-xs font-mono font-bold uppercase border-2 transition-colors ${
                    category === "ux-ui" && !customCategory
                      ? "border-[#230D10] bg-[#EC2929] text-white"
                      : "border-[#230D10] bg-[#FFF7F5] text-[#230D10] hover:bg-[#F5D9D5]"
                  }`}
                >
                  UX/UI Projects
                </button>
              </div>

              {/* Custom category input */}
              <div>
                <span className="text-[10px] font-mono text-[#4A2E33] block mb-1">
                  Or enter any custom category:
                </span>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. generative-audio, design-systems"
                  className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Your Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Product Designer & AI Prototyper"
                className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Project Type
              </label>
              <input
                type="text"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="side-project, case-study, client-work"
                className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Card 5: Cover Image Preview & Selector */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-2">
              <span className="text-xs font-mono font-bold text-[#EC2929] uppercase">
                Cover Image Asset
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openMediaPicker("upload")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EC2929] text-white text-[10px] font-mono font-bold uppercase hover:bg-[#230D10] transition-colors border border-[#230D10]"
                  title="Upload a new cover image directly"
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>Upload New</span>
                </button>
                <button
                  type="button"
                  onClick={() => openMediaPicker("browse")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#230D10] text-[#FFF7F5] text-[10px] font-mono font-bold uppercase hover:bg-[#EC2929] transition-colors border border-[#230D10]"
                  title="Browse existing public images"
                >
                  <ImageIcon className="w-3 h-3 text-[#EC2929]" />
                  <span>Media Library</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Asset URL
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  setCoverImageLoadFailed(false);
                }}
                placeholder="https://... or choose from Media Library"
                className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>

            {/* Local Windows Path Rejection Banner */}
            {isLocalPath(coverImage) && (
              <div className="p-3 border-2 border-[#EC2929] bg-[#FFF0F0] text-xs font-mono text-[#EC2929] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold uppercase">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Local Windows Path Detected</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#230D10]">
                  Web browsers cannot load images directly from local paths like <code>{coverImage}</code>.
                  Please click <strong>&quot;Upload New&quot;</strong> or <strong>&quot;Media Library&quot;</strong> above to upload and select a public CDN image.
                </p>
              </div>
            )}

            {/* Preview Box */}
            {coverImage ? (
              <div className="mt-2 border-2 border-[#230D10] bg-[#FFF7F5] p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#4A2E33] uppercase font-bold">
                    Cover Preview:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openMediaPicker("upload")}
                      className="text-[10px] font-mono font-bold text-[#230D10] underline hover:text-[#EC2929]"
                    >
                      Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage("");
                        setCoverImageLoadFailed(false);
                      }}
                      className="text-[10px] font-mono font-bold text-[#EC2929] hover:underline"
                    >
                      Clear URL
                    </button>
                  </div>
                </div>

                {coverImageLoadFailed || isLocalPath(coverImage) ? (
                  <div className="h-32 border border-dashed border-[#EC2929] bg-[#FFF0F0] flex flex-col items-center justify-center p-3 text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-[#EC2929]" />
                    <span className="text-[11px] font-mono font-bold text-[#230D10]">
                      Image Failed to Load
                    </span>
                    <span className="text-[10px] font-mono text-[#4A2E33]">
                      Verify the URL is a valid, publicly accessible image.
                    </span>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-36 object-cover border border-[#230D10] bg-white"
                    onError={() => setCoverImageLoadFailed(true)}
                  />
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#E8CEC9] bg-[#FFF7F5] p-6 text-center text-xs font-mono text-[#4A2E33] space-y-2">
                <ImageIcon className="w-6 h-6 mx-auto text-[#E8CEC9]" />
                <span>No cover image specified</span>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => openMediaPicker("upload")}
                    className="text-[11px] font-mono font-bold text-[#EC2929] underline hover:text-[#230D10]"
                  >
                    Upload a new image
                  </button>
                  <span className="text-[#8A6A70]">•</span>
                  <button
                    type="button"
                    onClick={() => openMediaPicker("browse")}
                    className="text-[11px] font-mono font-bold text-[#230D10] underline hover:text-[#EC2929]"
                  >
                    Select existing asset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Library Picker & Upload Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-50 bg-[#230D10]/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#230D10] max-w-2xl w-full brutalist-shadow-lg p-6 space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-[#230D10] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#EC2929]" />
                <h3 className="text-base font-black font-mono uppercase text-[#230D10]">
                  Project Cover Image Selector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(false)}
                className="p-1 border border-[#230D10] hover:bg-[#F5D9D5]"
              >
                <X className="w-4 h-4 text-[#230D10]" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b-2 border-[#230D10] gap-2">
              <button
                type="button"
                onClick={() => setModalTab("browse")}
                className={`py-1.5 px-3 text-xs font-mono font-bold uppercase border-t-2 border-l-2 border-r-2 -mb-[2px] transition-colors ${
                  modalTab === "browse"
                    ? "bg-[#FFF7F5] border-[#230D10] text-[#EC2929]"
                    : "bg-white border-transparent text-[#4A2E33] hover:text-[#230D10]"
                }`}
              >
                Browse Media Library ({filteredMediaAssets.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab("upload")}
                className={`py-1.5 px-3 text-xs font-mono font-bold uppercase border-t-2 border-l-2 border-r-2 -mb-[2px] transition-colors ${
                  modalTab === "upload"
                    ? "bg-[#FFF7F5] border-[#230D10] text-[#EC2929]"
                    : "bg-white border-transparent text-[#4A2E33] hover:text-[#230D10]"
                }`}
              >
                Upload New Image
              </button>
            </div>

            {/* TAB 1: BROWSE EXISTING ASSETS */}
            {modalTab === "browse" && (
              <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#4A2E33] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search public assets by filename or alt text..."
                    value={mediaSearchQuery}
                    onChange={(e) => setMediaSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] placeholder-[#8A6A70] focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[380px] border-2 border-[#230D10] p-3 bg-[#FFF7F5]">
                  {isLoadingMedia ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 space-y-2 text-xs font-mono text-[#4A2E33]">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#EC2929]" />
                      <span>Loading public assets...</span>
                    </div>
                  ) : mediaError ? (
                    <div className="p-4 border-2 border-[#EC2929] bg-[#FFF0F0] text-xs font-mono text-[#EC2929] space-y-2">
                      <div className="flex items-center gap-2 font-bold uppercase">
                        <AlertCircle className="w-4 h-4" />
                        <span>Error Loading Assets</span>
                      </div>
                      <p>{mediaError}</p>
                      <button
                        type="button"
                        onClick={() => openMediaPicker("browse")}
                        className="px-3 py-1 bg-[#230D10] text-[#FFF7F5] text-xs font-mono uppercase"
                      >
                        Retry
                      </button>
                    </div>
                  ) : filteredMediaAssets.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <ImageIcon className="w-8 h-8 text-[#8A6A70] mx-auto" />
                      <p className="text-xs font-mono font-bold uppercase text-[#230D10]">
                        No public images found
                      </p>
                      <p className="text-[11px] font-mono text-[#4A2E33] max-w-sm mx-auto">
                        {mediaSearchQuery
                          ? "No assets match your search term."
                          : "No public images have been uploaded yet. Click 'Upload New Image' above to upload your cover."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalTab("upload")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#230D10] transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload New Cover Image</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredMediaAssets.map((asset) => {
                        const filename = asset.storage_path.split("/").pop() || asset.storage_path;
                        const isSelected = coverImage === asset.url;

                        return (
                          <div
                            key={asset.id}
                            onClick={() => {
                              setCoverImage(asset.url);
                              setCoverImageLoadFailed(false);
                              setIsMediaPickerOpen(false);
                            }}
                            className={`cursor-pointer border-2 p-2 bg-white flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${
                              isSelected
                                ? "border-[#EC2929] ring-2 ring-[#EC2929] bg-[#FFF0F0]"
                                : "border-[#230D10] hover:border-[#EC2929]"
                            }`}
                          >
                            <div className="relative w-full h-24 bg-[#FFF7F5] border border-[#230D10] overflow-hidden mb-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={asset.url}
                                alt={asset.alt_text || filename}
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-[#EC2929] text-white p-0.5 border border-[#230D10]">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <p className="text-[11px] font-mono font-bold text-[#230D10] truncate" title={filename}>
                                {filename}
                              </p>
                              <p className="text-[10px] font-mono text-[#8A6A70]">
                                {asset.folder || "uploads"} • {(asset.bytes ? (asset.bytes / 1024).toFixed(0) : "0")} KB
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT UPLOAD NEW IMAGE */}
            {modalTab === "upload" && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-[#FFF7F5] border border-[#230D10] text-[11px] font-mono text-[#4A2E33]">
                    Upload any raster image (PNG, JPEG, WebP, GIF up to 10 MB). It will be saved directly to <code>portfolio-public/projects</code> and automatically applied as this project&apos;s cover image.
                  </div>

                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f) {
                        const validation = validateAsset(f.type, f.size, false, "public");
                        if (!validation.valid) {
                          setModalUploadError(validation.error || "Invalid file.");
                          setModalUploadFile(null);
                        } else {
                          setModalUploadError(null);
                          setModalUploadFile(f);
                        }
                      }
                    }}
                    className="hidden"
                    id="project-cover-file-input"
                  />

                  {modalUploadFile ? (
                    <div className="border-2 border-[#166534] bg-[#E8F8EE] p-4 text-center space-y-3">
                      {modalUploadPreview && (
                        <div className="relative w-40 h-28 mx-auto border-2 border-[#230D10] bg-white overflow-hidden brutalist-shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={modalUploadPreview}
                            alt="Selected upload preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="text-xs font-mono">
                        <p className="font-bold text-[#230D10]">{modalUploadFile.name}</p>
                        <p className="text-[10px] text-[#4A2E33]">
                          {(modalUploadFile.size / 1024).toFixed(1)} KB • {modalUploadFile.type}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setModalUploadFile(null);
                          if (modalFileInputRef.current) modalFileInputRef.current.value = "";
                        }}
                        disabled={isModalUploading}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#EC2929] hover:underline"
                      >
                        <X className="w-3 h-3" />
                        <span>Choose different file</span>
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="project-cover-file-input"
                      className="border-2 border-dashed border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] p-8 text-center block cursor-pointer transition-colors space-y-2"
                    >
                      <div className="w-12 h-12 mx-auto border-2 border-[#230D10] bg-white flex items-center justify-center text-[#EC2929] brutalist-shadow-sm">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-mono font-bold text-[#230D10]">
                        <span className="text-[#EC2929] underline">Click to select an image file</span> or drag it here
                      </p>
                      <p className="text-[10px] font-mono text-[#4A2E33]">
                        Supported formats: PNG, JPEG, WebP, GIF (Max 10 MB)
                      </p>
                    </label>
                  )}

                  {modalUploadError && (
                    <div className="p-3 border-2 border-[#EC2929] bg-[#FFF0F0] text-xs font-mono text-[#EC2929] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{modalUploadError}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#230D10]/20 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalTab("browse")}
                    disabled={isModalUploading}
                    className="px-4 py-2 border-2 border-[#230D10] bg-white text-xs font-mono font-bold uppercase hover:bg-[#F5D9D5]"
                  >
                    Back to Library
                  </button>
                  <button
                    type="button"
                    disabled={isModalUploading || !modalUploadFile}
                    onClick={() => {
                      if (modalUploadFile) {
                        handleModalDirectUpload(modalUploadFile);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#230D10] transition-colors disabled:opacity-50"
                  >
                    {isModalUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{modalUploadStatus || "Uploading..."}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload &amp; Set as Cover</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer (for Browse tab) */}
            {modalTab === "browse" && (
              <div className="flex items-center justify-between pt-2 border-t border-[#230D10]/20">
                <button
                  type="button"
                  onClick={() => setModalTab("upload")}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#EC2929] hover:underline"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload a new image instead</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(false)}
                  className="px-4 py-1.5 border-2 border-[#230D10] bg-white text-xs font-mono font-bold uppercase hover:bg-[#F5D9D5]"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
