"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toggleProjectPublishAction, deleteProjectAction } from "@/lib/actions/projects";
import type { Database } from "@/types/database.types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export default function ProjectsManager({
  initialProjects,
}: {
  initialProjects: ProjectRow[];
}) {
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Extract unique categories
  const categories = Array.from(new Set(projects.map((p) => p.category))).filter(Boolean);

  // Filtered projects
  const filtered = projects.filter((p) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.short_description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || p.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && p.is_published) ||
      (statusFilter === "draft" && !p.is_published) ||
      p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleTogglePublish = (project: ProjectRow) => {
    setFeedback(null);
    const nextState = !project.is_published;

    startTransition(async () => {
      try {
        await toggleProjectPublishAction(project.id, nextState);
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, is_published: nextState } : p))
        );
        setFeedback({
          type: "success",
          message: `Project "${project.title}" is now ${nextState ? "PUBLISHED" : "saved as DRAFT"}.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to toggle publication status.",
        });
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete project "${title}"?\nThis will remove the project and all associated case-study blocks.`)) {
      return;
    }

    setDeletingId(id);
    setFeedback(null);

    startTransition(async () => {
      try {
        await deleteProjectAction(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setFeedback({
          type: "success",
          message: `Project "${title}" has been permanently deleted.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to delete project.",
        });
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action & Feedback Bar */}
      {feedback && (
        <div
          className={`p-3 border-2 text-xs font-mono flex items-center justify-between ${
            feedback.type === "success"
              ? "border-[#230D10] bg-[#E8F8EE] text-[#166534]"
              : "border-[#EC2929] bg-[#FFF0F0] text-[#EC2929]"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs uppercase font-bold hover:underline"
          >
            [dismiss]
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="border-2 border-[#230D10] bg-white p-4 brutalist-shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4A2E33]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, slug, or keyword..."
            className="w-full pl-9 pr-3 py-2 border-2 border-[#230D10] text-xs font-mono text-[#230D10] bg-[#FFF7F5] focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1 border-2 border-[#230D10] bg-[#FFF7F5] px-2 py-1.5 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-[#EC2929]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-mono font-bold text-[#230D10] focus:outline-none uppercase"
            >
              <option value="all">All Categories</option>
              <option value="ai-products">AI Products</option>
              <option value="ux-ui">UX/UI</option>
              {categories
                .filter((c) => c !== "ai-products" && c !== "ux-ui")
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1 border-2 border-[#230D10] bg-[#FFF7F5] px-2 py-1.5 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-[#EC2929]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-mono font-bold text-[#230D10] focus:outline-none uppercase"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts Only</option>
              <option value="concept">Concept</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List View */}
      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-[#E8CEC9] bg-white p-12 text-center">
          <FolderKanban className="w-12 h-12 text-[#E8CEC9] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#230D10] font-mono uppercase mb-1">
            {projects.length === 0 ? "No Projects Created Yet" : "No Projects Match Your Filter"}
          </h3>
          <p className="text-xs text-[#4A2E33] font-mono max-w-md mx-auto mb-6 leading-relaxed">
            {projects.length === 0
              ? "Your project gallery is currently empty. Create your first project to draft and publish work."
              : "Try adjusting your search query, category selection, or publication status filter."}
          </p>
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </Link>
        </div>
      ) : (
        <div className="border-2 border-[#230D10] bg-white brutalist-shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b-2 border-[#230D10] bg-[#FFF7F5] text-[#230D10] uppercase">
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8CEC9]">
                {filtered.map((p) => {
                  const isDeleting = deletingId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#FFF7F5]/80 transition-colors"
                    >
                      {/* Title & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#230D10] text-sm flex items-center gap-2">
                          <span>{p.title}</span>
                          {p.is_featured && (
                            <span className="text-[10px] font-mono bg-[#F5D9D5] text-[#EC2929] px-1.5 py-0.5 border border-[#EC2929]">
                              ★ FEATURED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#4A2E33] font-mono mt-0.5">
                          /{p.slug}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 uppercase text-[11px]">
                        <span className="bg-[#F5D9D5] px-2 py-0.5 border border-[#E8CEC9] text-[#230D10] font-bold">
                          {p.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 uppercase text-[11px] text-[#4A2E33]">
                        {p.status.replace("_", " ")}
                      </td>

                      {/* Visibility Toggle Button */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePublish(p)}
                          disabled={isPending}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase border transition-colors inline-flex items-center gap-1 ${
                            p.is_published
                              ? "bg-[#E8F8EE] text-[#166534] border-[#166534] hover:bg-[#d0f2db]"
                              : "bg-[#FFF0F0] text-[#EC2929] border-[#EC2929] hover:bg-[#ffe0e0]"
                          }`}
                        >
                          {p.is_published ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                              <span>PUBLISHED</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-[#EC2929]" />
                              <span>DRAFT</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Order */}
                      <td className="py-3.5 px-4 font-mono text-[#4A2E33]">
                        #{p.display_order}
                      </td>

                      {/* Updated At */}
                      <td className="py-3.5 px-4 text-[11px] text-[#4A2E33]">
                        {new Date(p.updated_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/projects/${p.id}/preview`}
                            title="Preview Draft"
                            className="p-1.5 border border-[#230D10] bg-white text-[#230D10] hover:bg-[#F5D9D5] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/admin/projects/${p.id}`}
                            title="Edit Project"
                            className="p-1.5 border border-[#230D10] bg-[#FFF7F5] text-[#230D10] hover:bg-[#F5D9D5] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            disabled={isDeleting || isPending}
                            title="Delete Project"
                            className="p-1.5 border border-[#230D10] bg-white text-[#EC2929] hover:bg-[#FFF0F0] transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
