"use client";

import React, { useState, useTransition } from "react";
import {
  Wrench,
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Loader2,
  Info,
  X,
} from "lucide-react";
import {
  createToolAction,
  updateToolAction,
  deleteToolAction,
  toggleToolVisibilityAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions/tools";
import type { Database } from "@/types/database.types";

type ToolRow = Database["public"]["Tables"]["tools"]["Row"];
type CategoryRow = Database["public"]["Tables"]["tool_categories"]["Row"];

interface ToolsManagerProps {
  initialTools: ToolRow[];
  initialCategories: CategoryRow[];
}

export default function ToolsManager({
  initialTools,
  initialCategories,
}: ToolsManagerProps) {
  const [activeTab, setActiveTab] = useState<"tools" | "categories">("tools");
  const [tools, setTools] = useState<ToolRow[]>(initialTools);
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");

  // Tool Modal / Form States
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolRow | null>(null);
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolCategoryId, setToolCategoryId] = useState<string>("");
  const [toolIconUrl, setToolIconUrl] = useState("");
  const [toolExternalUrl, setToolExternalUrl] = useState("");
  const [toolDisplayOrder, setToolDisplayOrder] = useState<number>(0);
  const [toolIsVisible, setToolIsVisible] = useState<boolean>(true);

  // Category Modal / Form States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState<number>(0);
  const [categoryIsVisible, setCategoryIsVisible] = useState<boolean>(true);

  // Global Feedback & Transition
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset tool modal fields
  const openNewToolModal = () => {
    setEditingTool(null);
    setToolName("");
    setToolDescription("");
    setToolCategoryId(categories[0]?.id || "");
    setToolIconUrl("");
    setToolExternalUrl("");
    setToolDisplayOrder(tools.length + 1);
    setToolIsVisible(true);
    setIsToolModalOpen(true);
  };

  const openEditToolModal = (tool: ToolRow) => {
    setEditingTool(tool);
    setToolName(tool.name);
    setToolDescription(tool.description);
    setToolCategoryId(tool.category_id || "");
    setToolIconUrl(tool.icon_url || "");
    setToolExternalUrl(tool.external_url || "");
    setToolDisplayOrder(tool.display_order);
    setToolIsVisible(tool.is_visible);
    setIsToolModalOpen(true);
  };

  // Reset category modal fields
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategorySlug("");
    setCategoryDisplayOrder(categories.length + 1);
    setCategoryIsVisible(true);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: CategoryRow) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySlug(cat.slug);
    setCategoryDisplayOrder(cat.display_order);
    setCategoryIsVisible(cat.is_visible);
    setIsCategoryModalOpen(true);
  };

  // Tool Handlers
  const handleSaveTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim()) {
      setFeedback({ type: "error", message: "Tool name is required." });
      return;
    }
    if (!toolDescription.trim()) {
      setFeedback({ type: "error", message: "Tool description is required." });
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name: toolName.trim(),
          description: toolDescription.trim(),
          category_id: toolCategoryId || null,
          icon_url: toolIconUrl.trim() || null,
          external_url: toolExternalUrl.trim() || null,
          display_order: Number(toolDisplayOrder),
          is_visible: toolIsVisible,
        };

        if (editingTool) {
          const res = await updateToolAction(editingTool.id, payload);
          if (res.tool) {
            setTools((prev) => prev.map((t) => (t.id === editingTool.id ? res.tool! : t)));
            setFeedback({ type: "success", message: `Tool "${toolName}" updated successfully.` });
          }
        } else {
          const res = await createToolAction(payload);
          if (res.tool) {
            setTools((prev) => [...prev, res.tool!]);
            setFeedback({ type: "success", message: `Tool "${toolName}" created successfully.` });
          }
        }
        setIsToolModalOpen(false);
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to save tool.",
        });
      }
    });
  };

  const handleToggleToolVisibility = (tool: ToolRow) => {
    const newVisibility = !tool.is_visible;
    startTransition(async () => {
      try {
        await toggleToolVisibilityAction(tool.id, newVisibility);
        setTools((prev) =>
          prev.map((t) => (t.id === tool.id ? { ...t, is_visible: newVisibility } : t))
        );
        setFeedback({
          type: "success",
          message: `Tool "${tool.name}" is now ${newVisibility ? "Visible on Public Portfolio" : "Hidden from Public"}`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to toggle visibility.",
        });
      }
    });
  };

  const handleDeleteTool = (tool: ToolRow) => {
    if (!confirm(`Are you sure you want to delete "${tool.name}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteToolAction(tool.id);
        setTools((prev) => prev.filter((t) => t.id !== tool.id));
        setFeedback({ type: "success", message: `Tool "${tool.name}" deleted.` });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to delete tool.",
        });
      }
    });
  };

  // Category Handlers
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setFeedback({ type: "error", message: "Category name is required." });
      return;
    }
    const slug = categorySlug.trim() || categoryName.trim().toLowerCase().replace(/[\s_]+/g, "-");

    startTransition(async () => {
      try {
        const payload = {
          name: categoryName.trim(),
          slug,
          display_order: Number(categoryDisplayOrder),
          is_visible: categoryIsVisible,
        };

        if (editingCategory) {
          const res = await updateCategoryAction(editingCategory.id, payload);
          if (res.category) {
            setCategories((prev) =>
              prev.map((c) => (c.id === editingCategory.id ? res.category! : c))
            );
            setFeedback({ type: "success", message: `Category "${categoryName}" updated.` });
          }
        } else {
          const res = await createCategoryAction(payload);
          if (res.category) {
            setCategories((prev) => [...prev, res.category!]);
            setFeedback({ type: "success", message: `Category "${categoryName}" created.` });
          }
        }
        setIsCategoryModalOpen(false);
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to save category.",
        });
      }
    });
  };

  const handleDeleteCategory = (cat: CategoryRow) => {
    const dependentCount = tools.filter((t) => t.category_id === cat.id).length;
    const confirmMsg = dependentCount > 0
      ? `Category "${cat.name}" has ${dependentCount} assigned tool(s). Deleting this category will unassign them (their category will become unassigned), but the tools will NOT be deleted. Proceed?`
      : `Are you sure you want to delete category "${cat.name}"?`;

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        await deleteCategoryAction(cat.id);
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        setTools((prev) =>
          prev.map((t) => (t.category_id === cat.id ? { ...t, category_id: null } : t))
        );
        setFeedback({ type: "success", message: `Category "${cat.name}" removed.` });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to delete category.",
        });
      }
    });
  };

  // Filtered tools
  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "unassigned" ? !tool.category_id : tool.category_id === selectedCategory);

    const matchesVisibility =
      visibilityFilter === "all" ||
      (visibilityFilter === "visible" ? tool.is_visible : !tool.is_visible);

    return matchesSearch && matchesCategory && matchesVisibility;
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

      {/* Visibility Impact Notice */}
      <div className="p-4 border-2 border-[#230D10] bg-[#FFF7F5] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#EC2929] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-[#230D10] block">
            Public Visibility &amp; Safety Rule
          </span>
          <p className="text-xs font-mono text-[#4A2E33] leading-relaxed">
            The public Tools section on the homepage displays tools where <code className="text-[#230D10]">is_visible = true</code> and their category is visible. Marking a tool as &ldquo;Hidden&rdquo; removes it from public queries immediately while preserving the record. The 13 confirmed core tools remain intact.
          </p>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#230D10] pb-4">
        {/* Module Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("tools")}
            className={`px-4 py-2 border-2 border-[#230D10] text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 ${
              activeTab === "tools"
                ? "bg-[#230D10] text-white"
                : "bg-white text-[#230D10] hover:bg-[#F5D9D5]"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Tools Arsenal ({tools.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 border-2 border-[#230D10] text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 ${
              activeTab === "categories"
                ? "bg-[#230D10] text-white"
                : "bg-white text-[#230D10] hover:bg-[#F5D9D5]"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>
        </div>

        {/* Action Button */}
        <div>
          {activeTab === "tools" ? (
            <button
              type="button"
              onClick={openNewToolModal}
              className="px-4 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center gap-1.5 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Tool</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openNewCategoryModal}
              className="px-4 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center gap-1.5 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: TOOLS ARSENAL */}
      {/* ===================================================================== */}
      {activeTab === "tools" && (
        <div className="space-y-6">
          {/* Search & Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-[#4A2E33] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools by name or description..."
                className="w-full pl-9 pr-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="unassigned">Unassigned Category</option>
              </select>
            </div>

            <div>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono focus:outline-none"
              >
                <option value="all">All Visibility</option>
                <option value="visible">Visible Only</option>
                <option value="hidden">Hidden Only</option>
              </select>
            </div>
          </div>

          {/* Tools List */}
          {filteredTools.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-[#230D10] bg-white text-center text-xs font-mono text-[#4A2E33]">
              No tools found matching your search and filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTools.map((tool) => {
                const categoryObj = categories.find((c) => c.id === tool.category_id);
                return (
                  <div
                    key={tool.id}
                    className={`p-5 border-2 border-[#230D10] bg-white brutalist-shadow-sm space-y-3 transition-opacity ${
                      !tool.is_visible ? "opacity-75 bg-[#FFFDF9]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold font-mono text-[#230D10]">
                            {tool.name}
                          </h3>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                              tool.is_visible
                                ? "bg-[#E8F8EE] text-[#166534] border-[#166534]"
                                : "bg-[#FFF0F0] text-[#EC2929] border-[#EC2929]"
                            }`}
                          >
                            {tool.is_visible ? "VISIBLE" : "HIDDEN"}
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-[#F5D9D5] text-[#230D10] px-2 py-0.5 border border-[#E8CEC9]">
                            {categoryObj ? categoryObj.name : "Unassigned"}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#4A2E33] leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleToolVisibility(tool)}
                          title={tool.is_visible ? "Hide from public" : "Make visible"}
                          className="p-1.5 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] transition-colors"
                        >
                          {tool.is_visible ? (
                            <Eye className="w-3.5 h-3.5 text-[#166534]" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-[#EC2929]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditToolModal(tool)}
                          title="Edit Tool"
                          className="p-1.5 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#230D10]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTool(tool)}
                          title="Delete Tool"
                          className="p-1.5 border border-[#230D10] bg-white hover:bg-[#FFF0F0] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#EC2929]" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8CEC9] text-[10px] font-mono text-[#4A2E33]">
                      <span>Order priority: #{tool.display_order}</span>
                      {tool.external_url && (
                        <a
                          href={tool.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#230D10] hover:text-[#EC2929]"
                        >
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CATEGORY TAXONOMY */}
      {/* ===================================================================== */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const assignedTools = tools.filter((t) => t.category_id === cat.id);
              return (
                <div
                  key={cat.id}
                  className="p-5 border-2 border-[#230D10] bg-white brutalist-shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold font-mono text-[#230D10]">
                          {cat.name}
                        </h3>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                            cat.is_visible
                              ? "bg-[#E8F8EE] text-[#166534] border-[#166534]"
                              : "bg-[#FFF0F0] text-[#EC2929] border-[#EC2929]"
                          }`}
                        >
                          {cat.is_visible ? "VISIBLE" : "HIDDEN"}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
                        Slug: <code>{cat.slug}</code> • Display Order: #{cat.display_order}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCategoryModal(cat)}
                        title="Edit Category"
                        className="p-1.5 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        title="Delete Category"
                        className="p-1.5 border border-[#230D10] bg-white hover:bg-[#FFF0F0] text-[#EC2929]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Assigned Tools Count & Chips */}
                  <div className="pt-2 border-t border-[#E8CEC9] space-y-2">
                    <span className="text-[11px] font-mono text-[#4A2E33] block">
                      Assigned Tools ({assignedTools.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedTools.length === 0 ? (
                        <span className="text-[10px] font-mono text-[#4A2E33] italic">
                          No tools assigned to this category
                        </span>
                      ) : (
                        assignedTools.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 text-[10px] font-mono bg-[#FFF7F5] text-[#230D10] border border-[#230D10]"
                          >
                            {t.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOOL MODAL (CREATE / EDIT) */}
      {/* ===================================================================== */}
      {isToolModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#230D10]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#230D10] w-full max-w-xl brutalist-shadow p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-3">
              <h3 className="text-base font-black uppercase text-[#230D10] font-mono">
                {editingTool ? `Edit Tool: ${editingTool.name}` : "Create New Tool"}
              </h3>
              <button
                type="button"
                onClick={() => setIsToolModalOpen(false)}
                className="p-1 text-[#4A2E33] hover:text-[#EC2929]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTool} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Tool Name *
                </label>
                <input
                  type="text"
                  required
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="e.g. Linear, Raycast, Docker"
                  className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-[#FFF7F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Description / Role in Workflow *
                </label>
                <textarea
                  required
                  rows={2}
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  placeholder="e.g. Issue tracking and project management for software workflows."
                  className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={toolCategoryId}
                    onChange={(e) => setToolCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white"
                  >
                    <option value="">(Unassigned Category)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={toolDisplayOrder}
                    onChange={(e) => setToolDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                    Icon / Logo URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={toolIconUrl}
                    onChange={(e) => setToolIconUrl(e.target.value)}
                    placeholder="https://... or /icons/..."
                    className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                    External Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={toolExternalUrl}
                    onChange={(e) => setToolExternalUrl(e.target.value)}
                    placeholder="https://linear.app"
                    className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toolIsVisible}
                    onChange={(e) => setToolIsVisible(e.target.checked)}
                    className="w-4 h-4 accent-[#EC2929] rounded-none border-2 border-[#230D10]"
                  />
                  <span className="text-xs font-mono font-bold uppercase text-[#230D10]">
                    Visible on Public Portfolio
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8CEC9]">
                <button
                  type="button"
                  onClick={() => setIsToolModalOpen(false)}
                  className="px-4 py-2 border-2 border-[#230D10] text-xs font-mono font-bold uppercase hover:bg-[#F5D9D5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#EC2929] text-white border-2 border-[#230D10] text-xs font-mono font-bold uppercase hover:bg-[#D01C1C] flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTool ? "Save Changes" : "Create Tool"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CATEGORY MODAL (CREATE / EDIT) */}
      {/* ===================================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#230D10]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#230D10] w-full max-w-lg brutalist-shadow p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-3">
              <h3 className="text-base font-black uppercase text-[#230D10] font-mono">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-[#4A2E33] hover:text-[#EC2929]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (!editingCategory) {
                      setCategorySlug(e.target.value.toLowerCase().replace(/[\s_]+/g, "-"));
                    }
                  }}
                  placeholder="e.g. Cloud Infrastructure"
                  className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-[#FFF7F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Slug (Unique Identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder="e.g. cloud-infrastructure"
                  className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={categoryDisplayOrder}
                  onChange={(e) => setCategoryDisplayOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryIsVisible}
                    onChange={(e) => setCategoryIsVisible(e.target.checked)}
                    className="w-4 h-4 accent-[#EC2929] rounded-none border-2 border-[#230D10]"
                  />
                  <span className="text-xs font-mono font-bold uppercase text-[#230D10]">
                    Visible on Public Portfolio
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8CEC9]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border-2 border-[#230D10] text-xs font-mono font-bold uppercase hover:bg-[#F5D9D5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#EC2929] text-white border-2 border-[#230D10] text-xs font-mono font-bold uppercase hover:bg-[#D01C1C] flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
