"use client";

import React, { useState } from "react";
import { Laptop, Layers, ArrowUpRight } from "lucide-react";
import type { Project } from "@/types/database.types";
import Link from "next/link";

interface WorkSectionProps {
  projects?: Project[];
}

function isUXCaseStudy(project: Project): boolean {
  const cat = (project.category || "").toLowerCase();
  const type = (project.project_type || "").toLowerCase();
  return (
    cat === "ux-ui" ||
    cat === "ux-projects" ||
    cat === "design" ||
    cat.includes("ux") ||
    cat.includes("design") ||
    type === "case-study" ||
    type.includes("ux") ||
    type.includes("design")
  );
}

export function WorkSection({ projects = [] }: WorkSectionProps) {
  const [activeTab, setActiveTab] = useState<"products" | "ux">("products");

  const productProjects = projects.filter((p) => !isUXCaseStudy(p));
  const uxProjects = projects.filter(isUXCaseStudy);

  const activeProjects = activeTab === "products" ? productProjects : uxProjects;

  return (
    <section id="work" aria-label="Work Section" className="pt-14 pb-14 sm:pt-20 sm:pb-20 bg-[#FAFAF9] border-y-2 border-[#230D10] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-12 border-b-2 border-[#230D10] pb-5 sm:pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#EC2929] inline-block" />
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                03 / WORK
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#230D10] uppercase tracking-tight leading-[0.95]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              SELECTED WORK.
            </h2>
          </div>

          {/* Simple Clean Tabs: Product builds & UX case studies (50% grid on mobile, flex on tablet/desktop) */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              className={`w-full sm:w-auto px-2.5 sm:px-4 py-2 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeTab === "products"
                  ? "bg-[#230D10] text-white brutalist-shadow-sm"
                  : "bg-white text-[#230D10] hover:bg-[#F5D9D5]"
              }`}
            >
              <Laptop className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Product builds</span>
              {productProjects.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#EC2929] text-white font-bold leading-none flex-shrink-0">
                  {productProjects.length}
                </span>
              )}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "ux"}
              onClick={() => setActiveTab("ux")}
              className={`w-full sm:w-auto px-2.5 sm:px-4 py-2 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeTab === "ux"
                  ? "bg-[#230D10] text-white brutalist-shadow-sm"
                  : "bg-white text-[#230D10] hover:bg-[#F5D9D5]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">UX case studies</span>
              {uxProjects.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#EC2929] text-white font-bold leading-none flex-shrink-0">
                  {uxProjects.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area: Strictly shows real project cards OR tab-specific concise empty state */}
        {activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {activeProjects.map((project) => (
              <article
                key={project.id}
                className="relative border-2 border-[#230D10] bg-white p-4 sm:p-6 brutalist-shadow-lg flex flex-col justify-between group hover:border-[#EC2929] transition-colors"
              >
                {/* Corner [+] Marks on real project cards */}
                <div className="absolute top-2 left-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
                <div className="absolute top-2 right-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
                <div className="absolute bottom-2 left-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
                <div className="absolute bottom-2 right-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>

                <div className="space-y-4 pt-1">
                  {/* Real Cover Image when available */}
                  {project.cover_image && (
                    <div className="relative w-full aspect-[16/10] border-2 border-[#230D10] bg-[#FFF7F5] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.cover_image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Metadata labels */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 bg-[#FFF7F5] border border-[#230D10] text-[#EC2929]">
                        {project.category}
                      </span>
                      {project.project_type && (
                        <span className="text-[11px] font-mono text-[#4A2E33] font-semibold uppercase">
                          {project.project_type.replace(/[-_]/g, " ")}
                        </span>
                      )}
                    </div>
                    {project.status && (
                      <span className="text-[10px] font-mono uppercase text-[#4A2E33] font-bold">
                        {project.status.replace(/[-_]/g, " ")}
                      </span>
                    )}
                  </div>

                  {/* Title & Link */}
                  <h3
                    className="text-xl sm:text-2xl font-black text-[#230D10] uppercase tracking-tight group-hover:text-[#EC2929] transition-colors"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    <Link href={`/projects/${project.slug}`}>
                      {project.title}
                    </Link>
                  </h3>

                  {/* Short Description */}
                  {project.short_description && (
                    <p className="text-sm text-[#4A2E33] leading-relaxed line-clamp-3">
                      {project.short_description}
                    </p>
                  )}

                  {/* Tools / Tags */}
                  {Array.isArray(project.tools) && project.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.tools.slice(0, 4).map((tool) => (
                        <span
                          key={tool}
                          className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#FFF7F5] border border-[#E8CEC9] text-[#230D10]"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-5 mt-5 border-t border-[#E8CEC9] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[#230D10]">
                    {isUXCaseStudy(project) ? "Case Study" : "Live Build"}
                  </span>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#230D10] group-hover:text-[#EC2929] transition-colors"
                  >
                    <span>Explore</span>
                    <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Single Compact Empty State (Unique wording & icon per tab) */
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
