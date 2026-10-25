"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Image as ImageIcon,
  FileText,
  Tags,
  Globe,
} from "lucide-react";
import { createPostAction, updatePostAction } from "@/lib/actions/posts";
import type { Database } from "@/types/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Simple markdown preview renderer for headers, bold, code, and lists
 */
function SimpleMarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <div className="p-8 text-center text-xs font-mono text-[#4A2E33] italic">
        Markdown preview will appear here once you write content.
      </div>
    );
  }

  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <pre
            key={`code-${i}`}
            className="p-3 bg-[#230D10] text-[#FFF7F5] font-mono text-xs overflow-x-auto my-3 border border-[#E8CEC9]"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={i}
          className="text-2xl font-black uppercase text-[#230D10] mt-4 mb-2"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {line.replace("# ", "")}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="text-xl font-bold uppercase text-[#230D10] mt-3 mb-1"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-[#230D10] font-mono mt-2 mb-1">
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="p-3 my-2 border-l-4 border-[#EC2929] bg-[#FFF7F5] text-xs font-mono italic text-[#4A2E33]"
        >
          {line.replace("> ", "")}
        </blockquote>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="text-xs font-mono text-[#230D10] ml-4 list-disc my-0.5">
          {line.replace(/^[-*]\s+/, "")}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-xs font-mono text-[#230D10] leading-relaxed my-1">
          {line}
        </p>
      );
    }
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function PostForm({ initialData }: { initialData?: PostRow }) {
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);

  // Form Fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [category, setCategory] = useState(initialData?.category || "build-log");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || "");

  // Tags
  const initialTags = Array.isArray(initialData?.tags)
    ? (initialData.tags as string[]).join(", ")
    : "";
  const [tagsInput, setTagsInput] = useState(initialTags);

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || "");

  // Publishing
  const [isPublished, setIsPublished] = useState(Boolean(initialData?.is_published));

  // Editor View Mode
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  // Feedback & Transition
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

    if (!title.trim()) {
      setFeedback({ type: "error", message: "Post title is required." });
      return;
    }
    if (!content.trim()) {
      setFeedback({ type: "error", message: "Post content is required." });
      return;
    }

    const cleanSlug = slugify(slug || title);
    if (!cleanSlug) {
      setFeedback({ type: "error", message: "A valid URL slug is required." });
      return;
    }

    const payload = {
      title: title.trim(),
      slug: cleanSlug,
      category: category.trim() || "build-log",
      excerpt: excerpt.trim() || null,
      content: content.trim(),
      cover_image: coverImage.trim() || null,
      tags: tagsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      is_published: publishState,
    };

    startTransition(async () => {
      try {
        if (isEdit && initialData?.id) {
          await updatePostAction(initialData.id, payload);
          setFeedback({
            type: "success",
            message: `Post updated successfully (${publishState ? "Published" : "Saved as Draft"}).`,
          });
          setIsPublished(publishState);
        } else {
          const res = await createPostAction(payload);
          setFeedback({
            type: "success",
            message: "Post created successfully! Redirecting to editor...",
          });
          if (res.post?.id) {
            setTimeout(() => {
              router.push(`/admin/posts/${res.post.id}`);
            }, 500);
          }
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to save post.",
        });
      }
    });
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
      {/* Feedback Banner */}
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

      {/* Main Grid: 2 Cols Left + 1 Col Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Core Writing Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Identity & Slug */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              <BookOpen className="w-4 h-4" />
              <span>Article Identity</span>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Post Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Architecting Multi-Turn Agentic UI Workflows"
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
                <span className="text-[#4A2E33] select-none">/labs/</span>
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

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Excerpt (Card Teaser / Summary)
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short, compelling summary of the technical or design insights explored..."
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Card 2: Markdown Content Editor */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase">
                <FileText className="w-4 h-4" />
                <span>Markdown Content</span>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditorMode("write")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border border-[#230D10] ${
                    editorMode === "write"
                      ? "bg-[#230D10] text-white"
                      : "bg-[#FFF7F5] text-[#230D10] hover:bg-[#F5D9D5]"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border border-[#230D10] ${
                    editorMode === "preview"
                      ? "bg-[#230D10] text-white"
                      : "bg-[#FFF7F5] text-[#230D10] hover:bg-[#F5D9D5]"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {editorMode === "write" ? (
              <div>
                <textarea
                  required
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article in Markdown. Supports # Headers, > Quotes, - Lists, and ```code blocks```..."
                  className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono text-[#230D10] bg-white focus:outline-none focus:ring-2 focus:ring-[#EC2929] leading-relaxed font-mono"
                />
                <span className="text-[10px] font-mono text-[#4A2E33] block mt-1">
                  Supports standard GitHub-flavored Markdown.
                </span>
              </div>
            ) : (
              <div className="p-4 border-2 border-[#230D10] bg-[#FFF7F5] min-h-[300px] overflow-y-auto max-h-[500px]">
                <SimpleMarkdownPreview content={content} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Publishing, Categories, SEO & Media */}
        <div className="space-y-6">
          {/* Card 3: Publication Control */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4">
            <div className="text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              Publication Control
            </div>

            <div className="p-3 border-2 border-[#230D10] bg-[#FFF7F5] space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#EC2929] rounded-none border-2 border-[#230D10]"
                />
                <span className="text-xs font-mono font-bold uppercase text-[#230D10]">
                  {isPublished ? "Published (Visible in Labs)" : "Draft (Admin Isolation)"}
                </span>
              </label>
              <p className="text-[11px] font-mono text-[#4A2E33] leading-relaxed">
                {isPublished
                  ? "This post is visible to public visitors on /labs."
                  : "Protected by RLS: completely hidden from public visitors."}
              </p>
            </div>

            <div className="pt-2 space-y-2">
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
                <span>{isEdit ? "Update Post" : "Create Post"}</span>
              </button>

              {isEdit && initialData?.id && (
                <Link
                  href={`/admin/posts/${initialData.id}/preview`}
                  target="_blank"
                  className="w-full py-2 px-4 bg-white text-[#230D10] text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Draft</span>
                </Link>
              )}
            </div>
          </div>

          {/* Card 4: Classification & Tags */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4">
            <div className="text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              Taxonomy &amp; Metadata
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="build-log, engineering, design-systems"
                className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Next.js, Supabase, LLM, Agents"
                className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Card 5: Cover Image */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-3">
            <div className="text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              Cover Image Asset
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Image URL (Optional)
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-28 object-cover border border-[#230D10]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#E8CEC9] bg-[#FFF7F5] p-4 text-center text-xs font-mono text-[#4A2E33]">
                <ImageIcon className="w-5 h-5 mx-auto mb-1 text-[#E8CEC9]" />
                <span>No cover image</span>
              </div>
            )}
          </div>

          {/* Card 6: SEO Settings */}
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-3">
            <div className="text-xs font-mono font-bold text-[#EC2929] uppercase border-b border-[#E8CEC9] pb-2">
              SEO Parameters
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Custom SEO Title (Optional)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Defaults to Post Title if empty"
                className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Meta Description (Optional)
              </label>
              <textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Defaults to Excerpt if empty"
                className="w-full px-2.5 py-1.5 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
