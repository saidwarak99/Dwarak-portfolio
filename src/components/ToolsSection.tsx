"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import {
  SiFigma,
  SiFramer,
  SiTailwindcss,
  SiNextdotjs,
  SiTypescript,
  SiReact,
  SiSupabase,
} from "react-icons/si";
import {
  Claude,
  Cursor,
  GithubCopilot,
  Midjourney,
  OpenAI,
  V0,
} from "@lobehub/icons";
import { SectionDivider } from "./SectionDivider";
import type { Tool, ToolCategory as DBToolCategory } from "@/types/database.types";

export interface ToolItem {
  id: string;
  name: string;
  category: string;
  role: string;
  externalUrl?: string | null;
}

export interface SimplifiedCategory {
  id: string;
  label: string;
}

// 5 Clean, simplified category names: All, Design, Frontend, AI, Prototyping
const simplifiedCategories: SimplifiedCategory[] = [
  { id: "all", label: "All" },
  { id: "design", label: "Design" },
  { id: "frontend", label: "Frontend" },
  { id: "ai", label: "AI" },
  { id: "prototyping", label: "Prototyping" },
];

// Helper to normalize category slugs or IDs to our 4 core groups
function normalizeCategory(catIdOrName: string): string {
  const lower = catIdOrName.toLowerCase();
  if (lower.includes("design") || lower.includes("c1000000-0000-0000-0000-000000000001")) return "design";
  if (lower.includes("frontend") || lower.includes("c1000000-0000-0000-0000-000000000002")) return "frontend";
  if (lower.includes("ai") || lower.includes("c1000000-0000-0000-0000-000000000003")) return "ai";
  if (lower.includes("prototyping") || lower.includes("c1000000-0000-0000-0000-000000000004")) return "prototyping";
  return "all";
}

// Rewritten concise descriptions: max 8 words each, practical human usage
const toolDescriptions: Record<string, string> = {
  Figma: "Where every screen and prototype starts.",
  Framer: "Interactive site design and production animations.",
  "Tailwind CSS": "Fast design tokens and layout styling.",
  "Next.js": "Full-stack React framework for web apps.",
  TypeScript: "Strict types for dependable frontend code.",
  React: "Component UI and state management.",
  Claude: "Reasoning partner for architecture and logic.",
  Cursor: "Primary code editor for fast iteration.",
  "GitHub Copilot": "Code completions and daily workflow acceleration.",
  Midjourney: "Visual concepts, textures, and mood boarding.",
  "OpenAI API": "Structured model outputs and function calling.",
  "v0 by Vercel": "Rapid generative UI layout prototyping.",
  Supabase: "Auth and database for side projects.",
};

// Brand icons map with monochrome near-black default and full brand color on hover
function renderToolBrandLogo(name: string) {
  const iconSize = 28;

  switch (name) {
    case "Figma":
      return (
        <SiFigma
          size={iconSize}
          className="text-[#230D10] group-hover:text-[#F24E1E] transition-colors"
          aria-label="Figma logo"
        />
      );
    case "Framer":
      return (
        <SiFramer
          size={iconSize}
          className="text-[#230D10] group-hover:text-[#0055FF] transition-colors"
          aria-label="Framer logo"
        />
      );
    case "Tailwind CSS":
      return (
        <SiTailwindcss
          size={iconSize}
          className="text-[#230D10] group-hover:text-[#06B6D4] transition-colors"
          aria-label="Tailwind CSS logo"
        />
      );
    case "Next.js":
      return (
        <SiNextdotjs
          size={iconSize}
          className="text-[#230D10] group-hover:text-black transition-colors"
          aria-label="Next.js logo"
        />
      );
    case "TypeScript":
      return (
        <SiTypescript
          size={iconSize}
          className="text-[#230D10] group-hover:text-[#3178C6] transition-colors"
          aria-label="TypeScript logo"
        />
      );
    case "React":
      return (
        <SiReact
          size={iconSize}
          className="text-[#230D10] group-hover:text-[#61DAFB] transition-colors"
          aria-label="React logo"
        />
      );
    case "Claude":
      return (
        <div className="text-[#230D10] group-hover:text-[#D97706] transition-colors" aria-label="Claude logo">
          <Claude size={iconSize} />
        </div>
      );
    case "Cursor":
      return (
        <div className="text-[#230D10] group-hover:text-[#000000] transition-colors" aria-label="Cursor logo">
          <Cursor size={iconSize} />
        </div>
      );
    case "GitHub Copilot":
      return (
        <div className="text-[#230D10] group-hover:text-[#6E40C9] transition-colors" aria-label="GitHub Copilot logo">
          <GithubCopilot size={iconSize} />
        </div>
      );
    case "Midjourney":
      return (
        <div className="text-[#230D10] group-hover:text-[#2F3136] transition-colors" aria-label="Midjourney logo">
          <Midjourney size={iconSize} />
        </div>
      );
    case "OpenAI API":
      return (
        <div className="text-[#230D10] group-hover:text-[#10A37F] transition-colors" aria-label="OpenAI logo">
          <OpenAI size={iconSize} />
        </div>
      );
    case "v0 by Vercel":
      return (
        <div className="text-[#230D10] group-hover:text-black transition-colors" aria-label="v0 logo">
          <V0 size={iconSize} />
        </div>
      );
    case "Supabase":
      return (
        <SiSupabase
          size={iconSize}
          className="text-[#230D10] group-hover:text-[#3ECF8E] transition-colors"
          aria-label="Supabase logo"
        />
      );
    default:
      return (
        <div className="font-bold text-sm text-[#230D10]" aria-label={`${name} logo`}>
          {name.slice(0, 2)}
        </div>
      );
  }
}

const defaultTools: ToolItem[] = [
  { id: "t1", name: "Figma", category: "design", role: toolDescriptions["Figma"] },
  { id: "t2", name: "Framer", category: "design", role: toolDescriptions["Framer"] },
  { id: "t3", name: "Tailwind CSS", category: "design", role: toolDescriptions["Tailwind CSS"] },
  { id: "t4", name: "Next.js", category: "frontend", role: toolDescriptions["Next.js"] },
  { id: "t5", name: "TypeScript", category: "frontend", role: toolDescriptions["TypeScript"] },
  { id: "t6", name: "React", category: "frontend", role: toolDescriptions["React"] },
  { id: "t7", name: "Claude", category: "ai", role: toolDescriptions["Claude"] },
  { id: "t8", name: "Cursor", category: "ai", role: toolDescriptions["Cursor"] },
  { id: "t9", name: "GitHub Copilot", category: "ai", role: toolDescriptions["GitHub Copilot"] },
  { id: "t10", name: "Midjourney", category: "ai", role: toolDescriptions["Midjourney"] },
  { id: "t11", name: "OpenAI API", category: "ai", role: toolDescriptions["OpenAI API"] },
  { id: "t12", name: "v0 by Vercel", category: "prototyping", role: toolDescriptions["v0 by Vercel"] },
  { id: "t13", name: "Supabase", category: "prototyping", role: toolDescriptions["Supabase"] },
];

interface ToolsSectionProps {
  categories?: DBToolCategory[];
  tools?: Tool[];
  hasIllustration?: boolean;
}

export function ToolsSection({ tools, hasIllustration = false }: ToolsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [illustrationError, setIllustrationError] = useState(false);

  // Map tools and assign normalized category and concise human descriptions
  const allTools: ToolItem[] =
    tools && tools.length > 0
      ? tools.map((t) => ({
          id: t.id,
          name: t.name,
          category: normalizeCategory(t.category_id || ""),
          role: toolDescriptions[t.name] || t.description || "Daily product workflow tool.",
          externalUrl: t.external_url,
        }))
      : defaultTools;

  const filteredTools =
    activeTab === "all"
      ? allTools
      : allTools.filter((t) => t.category === activeTab);

  return (
    <section id="tools" aria-label="Tools Section" className="pt-20 pb-0 bg-[#FFF7F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header Title: Varied formula (Numbered label, no pill, single count) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b-2 border-[#230D10] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#EC2929] inline-block" />
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                02 / STACK · {allTools.length} TOOLS
              </span>
            </div>
            <h2
              className="text-[clamp(2.5rem,5.5vw,5rem)] font-black text-[#230D10] uppercase tracking-tight leading-[0.92]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              TOOLS I <span className="whitespace-nowrap">USE.</span>
            </h2>
          </div>

          {/* Simple Category Filter Tabs: All, Design, Frontend, AI, Prototyping */}
          <div className="flex flex-wrap gap-2 text-xs font-mono font-bold" role="tablist">
            {simplifiedCategories.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3.5 py-1.5 border-2 border-[#230D10] uppercase transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#EC2929] ${
                    isActive
                      ? "bg-[#230D10] text-[#FFF7F5] brutalist-shadow-sm translate-x-0.5 translate-y-0.5"
                      : "bg-[#FFF7F5] text-[#230D10] hover:bg-[#F5D9D5]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Grid: Left Illustration Card + Right Tools Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Workflow Engine Card with tools-illustration placeholder */}
          <div className="lg:col-span-4 flex flex-col min-w-0">
            <div className="relative flex-1 border-2 border-[#230D10] bg-[#FFF7F5] p-6 flex flex-col justify-between items-center text-center brutalist-shadow-lg">
              {/* Card Header */}
              <div className="w-full flex justify-between items-center text-xs font-mono font-bold border-b border-[#230D10] pb-3 text-[#230D10]">
                <span>WORKFLOW ENGINE</span>
                <span className="text-[#EC2929]">✦ {allTools.length} TOOLS</span>
              </div>

              {/* Replacement Illustration Slot: /tools-illustration.png with graceful pink fallback */}
              <div className="my-6 w-full flex-1 flex flex-col items-center justify-center">
                {hasIllustration && !illustrationError ? (
                  <div className="relative w-full aspect-[4/5] max-w-[260px] flex items-center justify-center">
                    <Image
                      src="/tools-illustration.png"
                      alt="Sai Dwarak tools workflow illustration"
                      fill
                      className="object-contain"
                      onError={() => setIllustrationError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/5] max-w-[260px] border-2 border-dashed border-[#230D10] bg-[#F5D9D5] flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-2xl mb-2 text-[#EC2929]">✦</span>
                    <span className="text-xs font-mono font-bold text-[#230D10] uppercase tracking-wider">
                      Workflow Canvas
                    </span>
                    <span className="text-[11px] font-mono text-[#4A2E33] mt-1">
                      Design &amp; AI Stack
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Note */}
              <div className="w-full border-t border-[#230D10] pt-3 text-xs font-mono text-[#4A2E33] leading-relaxed">
                Hands-on UI/UX design, prompt architecture, and full-stack execution.
              </div>
            </div>
          </div>

          {/* Right Column: Stack Directory Grid */}
          <div className="lg:col-span-8 flex flex-col min-w-0">
            <div className="border-2 border-[#230D10] bg-white p-4 sm:p-6 brutalist-shadow-lg flex-1">
              {/* Grid of Tools: 13th item spans 2 columns on 2-col view to keep grid balanced */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity duration-200">
                {filteredTools.map((tool, idx) => {
                  const isLastOddItem =
                    filteredTools.length % 2 === 1 && idx === filteredTools.length - 1;
                  return (
                    <div
                      key={tool.name}
                      className={`flex items-center justify-between p-3.5 border-2 border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] transition-all group brutalist-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 ${
                        isLastOddItem ? "sm:col-span-2" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Authentic Brand Logo Square (28-32px) */}
                        <div className="w-10 h-10 border-2 border-[#230D10] bg-white flex items-center justify-center flex-shrink-0 group-hover:border-[#230D10] transition-colors">
                          {renderToolBrandLogo(tool.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[#230D10] truncate">
                            {tool.name}
                          </div>
                          <div className="text-xs font-mono text-[#4A2E33] leading-snug line-clamp-1">
                            {tool.role}
                          </div>
                        </div>
                      </div>

                      {tool.externalUrl ? (
                        <a
                          href={tool.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:text-[#EC2929] transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[#EC2929]"
                          aria-label={`Visit ${tool.name}`}
                        >
                          <ArrowUpRight className="w-4 h-4 text-[#4A2E33] group-hover:text-[#EC2929] transition-colors" />
                        </a>
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-[#4A2E33] group-hover:text-[#EC2929] transition-colors flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The ONE chevron-dark zigzag divider between major sections */}
      <SectionDivider variant="chevron-dark" />
    </section>
  );
}
