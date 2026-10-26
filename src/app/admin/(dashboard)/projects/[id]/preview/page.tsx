import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Globe,
  Layers,
  Sparkles,
  Calendar,
  Tag,
  Wrench,
  AlertTriangle,
  Code2,
} from "lucide-react";
import { connection } from "next/server";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface PreviewProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function PreviewProjectPage({ params }: PreviewProjectPageProps) {
  await connection();
  await assertServerAdmin();
  const { id } = await params;

  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const { data: caseStudyBlocks } = await supabase
    .from("case_study_blocks")
    .select("*")
    .eq("project_id", id)
    .order("display_order", { ascending: true });

  const links = (project.links as any) || {};

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Preview Top Banner */}
      <div className="border-2 border-[#230D10] bg-[#FFF0F0] p-4 brutalist-shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#EC2929] flex-shrink-0" />
          <div>
            <span className="text-xs font-mono font-bold text-[#EC2929] uppercase tracking-wider block">
              DRAFT PREVIEW MODE — ADMIN PRIVILEGED ACCESS
            </span>
            <span className="text-[11px] font-mono text-[#4A2E33]">
              {project.is_published
                ? "This project is currently Published and accessible publicly."
                : "This project is in Draft state and strictly isolated from anonymous visitors."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/projects/${project.id}`}
            className="px-3 py-1.5 bg-white text-[#230D10] text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors"
          >
            ← Back to Editor
          </Link>
          {project.is_published && (
            <Link
              href={`/projects/${project.slug}`}
              target="_blank"
              className="px-3 py-1.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center gap-1"
            >
              <span>View Public</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Project Presentation */}
      <article className="border-2 border-[#230D10] bg-white p-6 sm:p-10 brutalist-shadow space-y-10">
        {/* Header Metadata */}
        <div className="space-y-4 border-b-2 border-[#230D10] pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase bg-[#F5D9D5] text-[#230D10] px-2.5 py-1 border border-[#230D10]">
              {project.category}
            </span>
            <span className="text-[11px] font-mono uppercase bg-[#FFF7F5] text-[#4A2E33] px-2.5 py-1 border border-[#E8CEC9]">
              {project.project_type}
            </span>
            {project.role && (
              <span className="text-[11px] font-mono text-[#4A2E33] px-2 py-1">
                Role: <strong className="text-[#230D10]">{project.role}</strong>
              </span>
            )}
          </div>

          <h1
            className="text-3xl sm:text-5xl font-black text-[#230D10] uppercase tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {project.title}
          </h1>

          <p className="text-base sm:text-lg font-mono text-[#4A2E33] leading-relaxed max-w-4xl">
            {project.short_description}
          </p>

          {/* Action Links */}
          {(links.demo_url || links.figma_url || links.github_url) && (
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {links.demo_url && (
                <a
                  href={links.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Live Demo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {links.figma_url && (
                <a
                  href={links.figma_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#230D10] text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors brutalist-shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-[#EC2929]" />
                  <span>Figma File</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {links.github_url && (
                <a
                  href={links.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#230D10] text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors brutalist-shadow-sm"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Cover Image */}
        {project.cover_image && (
          <div className="border-2 border-[#230D10] overflow-hidden bg-[#FFF7F5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.cover_image}
              alt={project.title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Tools and Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-2 border-[#230D10] bg-[#FFF7F5]">
          {/* Tools */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#EC2929] uppercase mb-2">
              <Wrench className="w-3.5 h-3.5" />
              <span>Tools & Technologies</span>
            </div>
            {Array.isArray(project.tools) && project.tools.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.tools.map((tool: string) => (
                  <span
                    key={tool}
                    className="px-2.5 py-1 text-xs font-mono font-bold bg-white text-[#230D10] border border-[#230D10]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs font-mono text-[#4A2E33]">None specified</span>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#EC2929] uppercase mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Tags & Capabilities</span>
            </div>
            {Array.isArray(project.tags) && project.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-mono bg-white text-[#4A2E33] border border-[#E8CEC9]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs font-mono text-[#4A2E33]">None specified</span>
            )}
          </div>
        </div>

        {/* Overview Content */}
        {project.content && (
          <div className="space-y-4">
            <h2
              className="text-2xl font-black text-[#230D10] uppercase tracking-tight border-b border-[#E8CEC9] pb-2"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Overview & Context
            </h2>
            <div className="text-sm font-mono text-[#230D10] leading-relaxed whitespace-pre-wrap">
              {project.content}
            </div>
          </div>
        )}

        {/* Structured Case Study Blocks */}
        {caseStudyBlocks && caseStudyBlocks.length > 0 && (
          <div className="space-y-10 pt-4">
            <div className="border-b-2 border-[#230D10] pb-2">
              <span className="text-xs font-mono font-bold text-[#EC2929] uppercase tracking-wider">
                Case Study Deep Dive
              </span>
              <h2
                className="text-2xl font-black text-[#230D10] uppercase tracking-tight"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Design & Engineering Process
              </h2>
            </div>

            <div className="space-y-8">
              {caseStudyBlocks.map((block, idx) => (
                <section
                  key={block.id}
                  className="p-6 border-2 border-[#230D10] bg-[#FFF7F5] space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#EC2929] text-white px-2 py-0.5 uppercase">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-mono uppercase text-[#4A2E33] font-bold">
                      {block.block_type.replace("_", " ")}
                    </span>
                  </div>

                  <h3
                    className="text-xl font-black text-[#230D10] uppercase"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {block.heading}
                  </h3>

                  {block.content && (
                    <p className="text-xs sm:text-sm font-mono text-[#230D10] leading-relaxed whitespace-pre-wrap">
                      {block.content}
                    </p>
                  )}

                  {block.media_url && (
                    <div className="border-2 border-[#230D10] bg-white overflow-hidden mt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={block.media_url}
                        alt={block.media_caption || block.heading}
                        className="w-full max-h-96 object-contain bg-white"
                      />
                      {block.media_caption && (
                        <div className="p-2 border-t border-[#230D10] text-[11px] font-mono text-[#4A2E33] bg-[#FFF7F5]">
                          {block.media_caption}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
