"use client";

import React, { useState, useTransition } from "react";
import {
  Layers,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import {
  upsertCaseStudyBlockAction,
  deleteCaseStudyBlockAction,
  reorderCaseStudyBlocksAction,
} from "@/lib/actions/projects";
import type { Database } from "@/types/database.types";

type CaseStudyBlock = Database["public"]["Tables"]["case_study_blocks"]["Row"];

const BLOCK_TYPES = [
  { value: "overview", label: "Overview" },
  { value: "problem", label: "Problem Statement" },
  { value: "goals", label: "Project Goals" },
  { value: "research", label: "Research & Discovery" },
  { value: "user_flows", label: "User Flows & Architecture" },
  { value: "wireframes", label: "Wireframes & Iteration" },
  { value: "final_ui", label: "Final UI & Visual Polish" },
  { value: "prototype", label: "Interactive Prototype" },
  { value: "learnings", label: "Key Takeaways & Impact" },
  { value: "custom", label: "Custom Section" },
];

export default function CaseStudyBlocksEditor({
  projectId,
  initialBlocks,
}: {
  projectId: string;
  initialBlocks: CaseStudyBlock[];
}) {
  const [blocks, setBlocks] = useState<CaseStudyBlock[]>(initialBlocks);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for new/edited block
  const [blockType, setBlockType] = useState("overview");
  const [heading, setHeading] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");

  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setBlockType("overview");
    setHeading("");
    setContent("");
    setMediaUrl("");
    setMediaCaption("");
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (block: CaseStudyBlock) => {
    setIsAdding(false);
    setEditingId(block.id);
    setBlockType(block.block_type);
    setHeading(block.heading);
    setContent(block.content || "");
    setMediaUrl(block.media_url || "");
    setMediaCaption(block.media_caption || "");
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim()) {
      setFeedback({ type: "error", message: "Heading is required for each block." });
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      try {
        const payload = {
          id: editingId || undefined,
          project_id: projectId,
          block_type: blockType,
          heading: heading.trim(),
          content: content.trim() || undefined,
          media_url: mediaUrl.trim() || undefined,
          media_caption: mediaCaption.trim() || undefined,
          display_order: editingId
            ? blocks.find((b) => b.id === editingId)?.display_order ?? blocks.length
            : blocks.length,
        };

        const res = await upsertCaseStudyBlockAction(payload);
        if (res.success && res.block) {
          if (editingId) {
            setBlocks((prev) => prev.map((b) => (b.id === editingId ? res.block! : b)));
            setFeedback({ type: "success", message: `Block "${heading}" updated.` });
          } else {
            setBlocks((prev) => [...prev, res.block!]);
            setFeedback({ type: "success", message: `New block "${heading}" added.` });
          }
          resetForm();
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to save case study block.",
        });
      }
    });
  };

  const handleDeleteBlock = (blockId: string, title: string) => {
    if (!confirm(`Delete case-study block "${title}"?`)) return;

    startTransition(async () => {
      try {
        await deleteCaseStudyBlockAction(blockId, projectId);
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
        setFeedback({ type: "success", message: "Block deleted." });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to delete block.",
        });
      }
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    setBlocks(newBlocks);

    startTransition(async () => {
      try {
        await reorderCaseStudyBlocksAction(
          projectId,
          newBlocks.map((b) => b.id)
        );
      } catch (err: unknown) {
        console.error("Reorder failed:", err);
      }
    });
  };

  return (
    <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase">
            <Layers className="w-4 h-4" />
            <span>Case Study Deep-Dive</span>
          </div>
          <h3
            className="text-xl font-black text-[#230D10] uppercase tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Modular Case Study Blocks ({blocks.length})
          </h3>
          <p className="text-xs text-[#4A2E33] font-mono mt-0.5">
            Add ordered narrative blocks (problem, research, final UI, prototypes) for your case study.
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF7F5] text-[#230D10] text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors brutalist-shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#EC2929]" />
            <span>Add Block</span>
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 text-xs font-mono border-2 flex items-center justify-between ${
            feedback.type === "success"
              ? "border-[#230D10] bg-[#E8F8EE] text-[#166534]"
              : "border-[#EC2929] bg-[#FFF0F0] text-[#EC2929]"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline"
          >
            [close]
          </button>
        </div>
      )}

      {/* Block Form (When Adding or Editing) */}
      {(isAdding || editingId) && (
        <form
          onSubmit={handleSaveBlock}
          className="p-5 border-2 border-[#230D10] bg-[#FFF7F5] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-2">
            <span className="text-xs font-mono font-bold text-[#EC2929] uppercase">
              {editingId ? "Edit Block" : "Add New Case Study Block"}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-mono text-[#4A2E33] hover:text-[#EC2929]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Block Type
              </label>
              <select
                value={blockType}
                onChange={(e) => setBlockType(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              >
                {BLOCK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Heading *
              </label>
              <input
                type="text"
                required
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="e.g. Identifying User Friction"
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
              Content / Narrative
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed explanation, process breakdown, design rationale..."
              className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Media URL (Optional Image/Diagram)
              </label>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://... or /images/..."
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Media Caption (Optional)
              </label>
              <input
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Figure 1: High-fidelity prototype exploration"
                className="w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center gap-1.5 brutalist-shadow-sm"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{editingId ? "Save Changes" : "Insert Block"}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white text-[#230D10] text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Blocks List */}
      {blocks.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-[#E8CEC9] bg-[#FFF7F5] text-xs font-mono text-[#4A2E33]">
          No case study blocks created yet. Click &quot;Add Block&quot; to build a structured narrative.
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              className="p-4 border-2 border-[#230D10] bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#F5D9D5] text-[#230D10] px-2 py-0.5 border border-[#E8CEC9] uppercase">
                    #{idx + 1} • {block.block_type}
                  </span>
                  {block.media_url && (
                    <span className="text-[10px] font-mono text-[#4A2E33] flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-[#EC2929]" />
                      <span>Has Media</span>
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#230D10] font-mono">
                  {block.heading}
                </h4>
                {block.content && (
                  <p className="text-xs text-[#4A2E33] line-clamp-2 font-mono leading-relaxed">
                    {block.content}
                  </p>
                )}
              </div>

              {/* Order and Action Controls */}
              <div className="flex items-center gap-1 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleMove(idx, "up")}
                  disabled={idx === 0 || isPending}
                  title="Move Up"
                  className="p-1.5 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] disabled:opacity-30"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, "down")}
                  disabled={idx === blocks.length - 1 || isPending}
                  title="Move Down"
                  className="p-1.5 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] disabled:opacity-30"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(block)}
                  title="Edit Block"
                  className="p-1.5 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] ml-2 text-[#230D10]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(block.id, block.heading)}
                  title="Delete Block"
                  className="p-1.5 border border-[#230D10] bg-white hover:bg-[#FFF0F0] text-[#EC2929]"
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
