"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Sparkles, Layers } from "lucide-react";

export interface ProjectCardData {
  id: string;
  slug: string;
  title: string;
  type: "ai_product" | "ux_ui";
  numberLabel?: string; // e.g. "01", "02"
  shortDescription: string;
  category: string;
  tags: string[];
  role?: string;
  tools: string[];
  status: "completed" | "in_progress" | "concept" | "specimen";
  coverImage?: string | null;
  demoUrl?: string | null;
  figmaUrl?: string | null;
  githubUrl?: string | null;
  featured?: boolean;
}

interface ProjectCardProps {
  project: ProjectCardData;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const isUXUI = project.type === "ux_ui";

  return (
    <article
      className="group relative flex flex-col justify-between border-2 border-[#230D10] bg-[#FFF7F5] p-5 sm:p-6 brutalist-shadow-lg transition-all hover:-translate-y-1 hover:border-[#EC2929] hover:shadow-[5px_5px_0px_#EC2929]"
    >
      <div>
        {/* Card Header: Number/Type badge + Status + External Link */}
        <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#EC2929] text-white text-[11px] font-mono font-bold uppercase rounded-sm">
              {project.numberLabel || "01"}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#6B4D52] uppercase">
              {project.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {project.status === "in_progress" && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-[#EC2929] text-[#EC2929] bg-[#F5D9D5]/60 uppercase rounded-full">
                UNDER PROGRESS
              </span>
            )}
            {project.status === "specimen" && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-[#230D10] text-[#230D10] bg-[#F5D9D5] uppercase rounded-full">
                SPECIMEN LAYOUT
              </span>
            )}
            <Link
              href={`/projects/${project.slug}`}
              className="text-[#230D10] group-hover:text-[#EC2929] transition-colors p-1"
              aria-label={`View details for ${project.title}`}
            >
              <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Visual Cover Preview Container (for UX/UI projects or AI projects) */}
        {isUXUI && (
          <div className="relative mb-5 w-full h-40 border-2 border-[#230D10] bg-[#F5D9D5] flex items-center justify-center overflow-hidden">
            {project.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.coverImage}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <span
                  className="absolute text-7xl font-black text-[#EC2929]/20 select-none"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {project.numberLabel || "UX"}
                </span>
                <div className="z-10 w-20 h-14 border-2 border-[#230D10] bg-[#FFF7F5] brutalist-shadow-sm flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[#EC2929]" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <h3
          className="text-xl sm:text-2xl font-black text-[#230D10] uppercase tracking-tight mb-2 group-hover:text-[#EC2929] transition-colors"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-[#6B4D52] leading-relaxed mb-4 line-clamp-3">
          {project.shortDescription}
        </p>
      </div>

      {/* Footer Metadata & Tags */}
      <div className="border-t border-[#E8CEC9] pt-3 mt-4 space-y-3">
        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#230D10] bg-[#FFF7F5] text-[#230D10] rounded-sm group-hover:border-[#EC2929]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <Link
            href={`/projects/${project.slug}`}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#230D10] text-[#FFF7F5] group-hover:bg-[#EC2929] text-xs font-mono font-bold uppercase tracking-wider transition-colors brutalist-shadow-sm"
          >
            <span>EXPLORE CASE STUDY</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
