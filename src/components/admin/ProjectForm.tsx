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
} from "lucide-react";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import type { Database } from "@/types/database.types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

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

    const payload = {
      title: title.trim(),
      slug: slugify(slug || title),
      category: finalCategory,
      short_description: shortDescription.trim(),
      content: content.trim() || undefined,
      project_type: projectType,
      role: role.trim() || undefined,
      cover_image: coverImage.trim() || undefined,
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
          await updateProjectAction(initialData.id, payload);
          setFeedback({
            type: "success",
            message: `Project updated successfully (${publishState ? "Published" : "Draft"}).`,
          });
          setIsPublished(publishState);
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

          {/* Card 5: Cover Image Preview */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-3">
            <div className="text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              Cover Image Asset
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Asset URL
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://... or /images/..."
                className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>

            {coverImage ? (
              <div className="mt-2 border-2 border-[#230D10] bg-[#FFF7F5] p-2">
                <span className="text-[10px] font-mono text-[#4A2E33] block mb-1 uppercase font-bold">
                  Preview:
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-32 object-cover border border-[#230D10]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#E8CEC9] bg-[#FFF7F5] p-6 text-center text-xs font-mono text-[#4A2E33]">
                <ImageIcon className="w-6 h-6 mx-auto mb-1 text-[#E8CEC9]" />
                <span>No cover image specified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
