"use client";

import React, { useState } from "react";
import { Laptop, Layers, ArrowUpRight } from "lucide-react";
import type { Project } from "@/types/database.types";
import Link from "next/link";

interface WorkSectionProps {
  projects?: Project[];
}

export function WorkSection({ projects = [] }: WorkSectionProps) {
  const [activeTab, setActiveTab] = useState<"products" | "ux">("products");

  const productProjects = projects.filter(
    (p) => p.category === "ai-products" || p.category === "engineering"
  );
  const uxProjects = projects.filter(
    (p) => p.category === "ux-projects" || p.category === "design"
  );

  const activeProjects = activeTab === "products" ? productProjects : uxProjects;

  return (
    <section id="work" aria-label="Work Section" className="pt-20 pb-20 bg-[#FAFAF9] border-y-2 border-[#230D10] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b-2 border-[#230D10] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#EC2929] inline-block" />
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                03 / WORK
              </span>
            </div>
            <h2
              className="text-[clamp(2.5rem,5.5vw,5rem)] font-black text-[#230D10] uppercase tracking-tight leading-[0.92]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              SELECTED <span className="whitespace-nowrap">WORK.</span>
            </h2>
          </div>

          {/* Simple Clean Tabs: Product builds & UX case studies */}
          <div className="flex gap-2" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] transition-all flex items-center gap-2 ${
                activeTab === "products"
                  ? "bg-[#230D10] text-white brutalist-shadow-sm"
                  : "bg-white text-[#230D10] hover:bg-[#F5D9D5]"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Product builds</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "ux"}
              onClick={() => setActiveTab("ux")}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] transition-all flex items-center gap-2 ${
                activeTab === "ux"
                  ? "bg-[#230D10] text-white brutalist-shadow-sm"
                  : "bg-white text-[#230D10] hover:bg-[#F5D9D5]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>UX case studies</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeProjects.map((project) => (
              <article
                key={project.id}
                className="relative border-2 border-[#230D10] bg-white p-6 brutalist-shadow-lg flex flex-col justify-between group"
              >
                {/* Corner [+] Marks on real project cards */}
                <div className="absolute top-2 left-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
                <div className="absolute top-2 right-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
                <div className="absolute bottom-2 left-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
                <div className="absolute bottom-2 right-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>

                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-mono font-bold uppercase text-[#EC2929]">
                    {project.category}
                  </div>
                  <h3
                    className="text-2xl font-black text-[#230D10] uppercase tracking-tight group-hover:text-[#EC2929] transition-colors"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    <Link href={`/projects/${project.slug}`}>
                      {project.title}
                    </Link>
                  </h3>
                  {project.short_description && (
                    <p className="text-sm text-[#4A2E33] leading-relaxed line-clamp-3">
                      {project.short_description}
                    </p>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-[#E8CEC9] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[#230D10]">
                    Case Study
                  </span>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#230D10] group-hover:text-[#EC2929] transition-colors"
                  >
                    <span>Explore</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Single Compact Coming Soon State (Unique wording & icon per tab) */
          <div className="border-2 border-[#230D10] bg-white p-8 sm:p-12 text-center max-w-xl mx-auto brutalist-shadow-lg">
            <div className="w-12 h-12 border-2 border-[#230D10] bg-[#FFF7F5] text-[#EC2929] flex items-center justify-center mx-auto mb-4 brutalist-shadow-sm">
              {activeTab === "products" ? (
                <Laptop className="w-6 h-6" />
              ) : (
                <Layers className="w-6 h-6" />
              )}
            </div>

            <h3
              className="text-xl sm:text-2xl font-black text-[#230D10] uppercase tracking-tight mb-2"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {activeTab === "products" ? "Product Builds" : "UX Case Studies"}
            </h3>

            <p className="text-sm font-medium text-[#4A2E33] max-w-md mx-auto leading-relaxed mb-6">
              {activeTab === "products"
                ? "Building web applications and interactive prototypes with AI capabilities."
                : "Documenting interface design systems, user flows, and interaction patterns."}
            </p>

            <div className="inline-block px-3 py-1 bg-[#FFF7F5] border border-[#230D10] text-[11px] font-mono font-bold text-[#230D10] uppercase">
              In active development
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
