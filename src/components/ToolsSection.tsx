"use client";

import React, { useState } from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { CharacterAvatar } from "./CharacterAvatar";
import { SectionDivider } from "./SectionDivider";

export interface ToolItem {
  name: string;
  category: "design" | "ai" | "engineering";
  role: string;
}

export interface ToolCategory {
  id: "all" | "design" | "ai" | "engineering";
  label: string;
  description: string;
}

const toolCategories: ToolCategory[] = [
  { id: "all", label: "All Tools", description: "Complete stack & workflow directory" },
  { id: "design", label: "Design & Prototyping", description: "Visual craft, design systems & interactive prototypes" },
  { id: "ai", label: "AI & AI-assisted Dev", description: "Model intelligence, reasoning & agentic environments" },
  { id: "engineering", label: "Development & Engineering", description: "Modern full-stack, APIs, data pipelines & vector retrieval" },
];

const confirmedTools: ToolItem[] = [
  // Design & Prototyping
  { name: "Figma", category: "design", role: "Interface Design & Design Systems" },
  { name: "Lovable", category: "design", role: "Rapid Functional Web Prototyping" },
  { name: "Base44", category: "design", role: "Interactive Product Explorations" },

  // AI & AI-assisted Development
  { name: "ChatGPT", category: "ai", role: "AI Intelligence & Strategy" },
  { name: "Gemini", category: "ai", role: "Multimodal Reasoning & Context" },
  { name: "Antigravity", category: "ai", role: "Agentic IDE & Automated Coding" },
  { name: "Cursor", category: "ai", role: "AI-Augmented Code Editor" },
  { name: "Claude Code", category: "ai", role: "Agentic Terminal & Logic Reasoning" },

  // Development & AI Engineering
  { name: "Python", category: "engineering", role: "Core AI Logic & Data Pipelines" },
  { name: "Tailwind CSS", category: "engineering", role: "Utility-First Design Tokens" },
  { name: "FastAPI", category: "engineering", role: "High-Performance Backend Services" },
  { name: "Supabase", category: "engineering", role: "PostgreSQL, Auth & Storage Engine" },
  { name: "RAG", category: "engineering", role: "Retrieval-Augmented Generation & Vector Stores" },
];

export function ToolsSection() {
  const [activeCategoryId, setActiveCategoryId] = useState<"all" | "design" | "ai" | "engineering">("all");

  const filteredTools =
    activeCategoryId === "all"
      ? confirmedTools
      : confirmedTools.filter((t) => t.category === activeCategoryId);

  return (
    <section id="tools" aria-label="Tools Section" className="pt-16 pb-0 bg-[#FFF7F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header Title & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b border-[#E8CEC9] pb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                STACK &amp; WORKFLOW
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase rounded-full">
                <Sparkles className="w-3 h-3" />
                <span>WORKFLOW ARSENAL</span>
              </span>
            </div>
            <h2
              className="text-4xl sm:text-5xl font-black text-[#230D10] uppercase tracking-tight leading-none"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              TOOLS I USE .
            </h2>
          </div>

          {/* Data-Driven Category Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs font-mono font-bold" role="tablist">
            {toolCategories.map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={activeCategoryId === cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-3 py-1.5 border border-[#230D10] uppercase transition-all ${
                  activeCategoryId === cat.id
                    ? "bg-[#230D10] text-[#FFF7F5] brutalist-shadow-sm"
                    : "bg-[#FFF7F5] text-[#230D10] hover:bg-[#F5D9D5]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid: Left Poster Card + Right Tools Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Illustrated Poster Card with Sai's Laptop Avatar */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="relative flex-1 border-2 border-[#230D10] bg-[#FFF7F5] p-6 flex flex-col justify-between items-center text-center brutalist-shadow-lg overflow-hidden group">
              {/* Background decorative big typography watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center text-[#EC2929]/10 text-8xl font-black select-none pointer-events-none transform -rotate-90"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                STACK
              </div>

              {/* Poster Header */}
              <div className="w-full flex justify-between items-center text-xs font-mono font-bold border-b border-[#230D10] pb-3 text-[#230D10]">
                <span>WORKFLOW ENGINE</span>
                <span className="text-[#EC2929]">✦ 13 CORE TOOLS</span>
              </div>

              {/* Illustrated Character Centerpiece: Sai sitting with Laptop */}
              <div className="my-6 relative z-10 flex flex-col items-center">
                <CharacterAvatar pose="laptop" size="md" />
                <div className="mt-3 inline-block px-3.5 py-1 border border-[#230D10] bg-[#F5D9D5] text-xs font-mono font-bold text-[#230D10] uppercase brutalist-shadow-sm">
                  BUILDING IDEAS
                </div>
              </div>

              {/* Poster Footer Note */}
              <div className="w-full border-t border-[#230D10] pt-3 text-xs font-mono text-[#4A2E33] leading-relaxed">
                Focused on rapid UI/UX exploration, agentic workflows &amp; full-stack AI engineering.
              </div>
            </div>
          </div>

          {/* Right Column: Stack Directory Table */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="border-2 border-[#230D10] bg-white p-4 sm:p-6 brutalist-shadow-lg flex-1">
              <div className="flex justify-between items-center border-b border-[#E8CEC9] pb-3 mb-4 text-xs font-mono font-bold text-[#230D10]">
                <span className="uppercase text-xs tracking-wider">
                  {toolCategories.find((c) => c.id === activeCategoryId)?.description}
                </span>
                <span className="text-[#EC2929] text-xs font-bold">2026 STACK</span>
              </div>

              {/* Grid of Tools Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center justify-between p-3 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] transition-all group brutalist-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center font-bold text-xs text-[#EC2929] group-hover:bg-[#230D10] group-hover:text-white transition-colors">
                        {tool.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#230D10] flex items-center gap-1.5">
                          <span>{tool.name}</span>
                        </div>
                        <div className="text-xs font-mono text-[#4A2E33] leading-snug">
                          {tool.role}
                        </div>
                      </div>
                    </div>

                    <ArrowUpRight className="w-4 h-4 text-[#4A2E33] group-hover:text-[#EC2929] transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>

              {/* Stack Note */}
              <div className="mt-4 pt-3 border-t border-[#E8CEC9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-[#4A2E33]">
                <span>Curated directory ({filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"} shown)</span>
                <span className="text-[#EC2929] font-bold tracking-wide">13 TOOLS IN MY WORKFLOW</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Chevron Divider at the bottom of Tools */}
      <SectionDivider variant="chevron-dark" />
    </section>
  );
}
