"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  Tag,
} from "lucide-react";
import {
  deletePostAction,
  togglePostPublishAction,
} from "@/lib/actions/posts";
import type { Database } from "@/types/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

interface PostsManagerProps {
  initialPosts: PostRow[];
}

export default function PostsManager({ initialPosts }: PostsManagerProps) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTogglePublish = (post: PostRow) => {
    const nextState = !post.is_published;
    startTransition(async () => {
      try {
        const res = await togglePostPublishAction(post.id, nextState);
        if (res.post) {
          setPosts((prev) =>
            prev.map((p) => (p.id === post.id ? res.post! : p))
          );
          setFeedback({
            type: "success",
            message: `Post "${post.title}" is now ${nextState ? "Published" : "Saved as Draft"}.`,
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to toggle post publication.",
        });
      }
    });
  };

  const handleDelete = (post: PostRow) => {
    if (!confirm(`Are you sure you want to delete post "${post.title}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deletePostAction(post.id);
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        setFeedback({ type: "success", message: `Post "${post.title}" deleted.` });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to delete post.",
        });
      }
    });
  };

  // Distinct categories
  const categories = Array.from(new Set(posts.map((p) => p.category))).filter(Boolean);

  // Filtered posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? post.is_published : !post.is_published);

    const matchesCategory =
      categoryFilter === "all" || post.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
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

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#230D10] pb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#4A2E33] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles & build logs..."
            className="w-full pl-9 pr-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
          />
        </div>

        {/* Filters and New Post CTA */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <Link
            href="/admin/posts/new"
            className="px-4 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center gap-1.5 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Post</span>
          </Link>
        </div>
      </div>

      {/* Posts Table or Empty State */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-[#230D10] bg-white text-center brutalist-shadow-sm space-y-4">
          <div className="w-12 h-12 mx-auto border-2 border-[#230D10] bg-[#FFF7F5] flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[#EC2929]" />
          </div>
          <div className="space-y-1">
            <h3
              className="text-lg font-black text-[#230D10] uppercase"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              0 Articles or Build Logs Found
            </h3>
            <p className="text-xs font-mono text-[#4A2E33] max-w-md mx-auto">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "No posts match your active search filters."
                : "Your writing vault is currently empty. Click below to draft your first engineering reflection, architecture breakdown, or AI prototype note."}
            </p>
          </div>
          {!searchQuery && (
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Post</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 border-2 border-[#230D10] bg-white brutalist-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Post Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                      post.is_published
                        ? "bg-[#E8F8EE] text-[#166534] border-[#166534]"
                        : "bg-[#FFF0F0] text-[#EC2929] border-[#EC2929]"
                    }`}
                  >
                    {post.is_published ? "PUBLISHED" : "DRAFT"}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[#F5D9D5] text-[#230D10] px-2 py-0.5 border border-[#E8CEC9]">
                    {post.category}
                  </span>
                  {post.published_at && (
                    <span className="text-[10px] font-mono text-[#4A2E33] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#EC2929]" />
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>

                <h3
                  className="text-lg font-black text-[#230D10] uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {post.title}
                </h3>

                {post.excerpt && (
                  <p className="text-xs font-mono text-[#4A2E33] line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                <div className="text-[11px] font-mono text-[#4A2E33] pt-1">
                  URL: <code className="text-[#230D10]">/labs/{post.slug}</code> • Updated:{" "}
                  {new Date(post.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                {/* Publish Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleTogglePublish(post)}
                  disabled={isPending}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-[#230D10] transition-colors ${
                    post.is_published
                      ? "bg-[#FFF7F5] text-[#230D10] hover:bg-[#F5D9D5]"
                      : "bg-[#EC2929] text-white hover:bg-[#D01C1C]"
                  }`}
                >
                  {post.is_published ? "Unpublish (Draft)" : "Publish Live"}
                </button>

                {/* Draft Preview Link */}
                <Link
                  href={`/admin/posts/${post.id}/preview`}
                  className="p-2 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] text-[#230D10]"
                  title="Preview Article"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>

                {/* Public Link (if published) */}
                {post.is_published && (
                  <Link
                    href={`/labs/${post.slug}`}
                    target="_blank"
                    className="p-2 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] text-[#166534]"
                    title="View on Public Website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}

                {/* Edit Link */}
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="p-2 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] text-[#230D10]"
                  title="Edit Post"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(post)}
                  disabled={isPending}
                  className="p-2 border border-[#230D10] bg-white hover:bg-[#FFF0F0] text-[#EC2929]"
                  title="Delete Post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
