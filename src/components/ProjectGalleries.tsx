"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { SectionDivider } from "./SectionDivider";
import { ProjectCardData } from "./ProjectCard";

interface ProjectGalleriesProps {
  aiProjects?: ProjectCardData[];
  uxProjects?: ProjectCardData[];
}

export function ProjectGalleries({
  aiProjects = [],
  uxProjects = [],
}: ProjectGalleriesProps) {
  return (
    <>
      {/* ============================================================ */}
      {/* 1. AI POWERED PRODUCTS / SIDE PROJECTS                       */}
      {/* ============================================================ */}
      <section
        id="ai-products"
        aria-label="AI Powered Products and Side Projects"
        className="pt-16 pb-0 bg-[#FFF7F5] relative"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Header */}
          <div className="mb-8 border-b border-[#E8CEC9] pb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                SIDE PROJECTS &amp; VIBE-CODED EXPERIMENTS
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EC2929] text-white text-[10px] font-mono font-bold uppercase rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI LABS</span>
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-[#230D10] uppercase tracking-tight leading-none"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              AI POWERED PRODUCTS / SIDE PROJECTS .
            </h2>
          </div>

          {/* Intentional Polished Empty State */}
          <EmptyState
            badge="CURATION IN PROGRESS"
            title="AI Product Vault in Preparation"
            description="Currently curating personal AI product architectures, generative workflows, and full-stack experiments. Selected projects will be published here once finalized."
          />
        </div>

        {/* Red Sawtooth Divider */}
        <SectionDivider variant="sawtooth-outline" />
      </section>

      {/* ============================================================ */}
      {/* 2. UX / UI PROJECTS                                          */}
      {/* ============================================================ */}
      <section
        id="ux-projects"
        aria-label="UX and UI Projects"
        className="pt-16 pb-0 bg-[#FFF7F5] relative overflow-hidden"
      >
        {/* Subtle Watermark in Background */}
        <div
          className="absolute right-4 top-16 text-[#EC2929]/5 text-[15vw] font-black select-none pointer-events-none leading-none"
          style={{ fontFamily: "var(--font-syne)" }}
          aria-hidden="true"
        >
          UX/UI
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          {/* Header */}
          <div className="mb-8 border-b border-[#E8CEC9] pb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                UX RESEARCH, UI DESIGNS, PROTOTYPES, DESIGN SYSTEMS
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EC2929] text-white text-[10px] font-mono font-bold uppercase rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                <span>CASE STUDIES</span>
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-[#230D10] uppercase tracking-tight leading-none"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              UX / UI PROJECTS .
            </h2>
          </div>

          {/* Intentional Polished Empty State */}
          <EmptyState
            badge="CASE STUDY VAULT"
            title="UX/UI Case Studies Under Curation"
            description="In-depth product design documentation, interface explorations, user flows, and interactive prototypes are being prepared for public presentation."
          />
        </div>

        {/* Red Sawtooth Divider */}
        <SectionDivider variant="sawtooth-outline" />
      </section>
    </>
  );
}
