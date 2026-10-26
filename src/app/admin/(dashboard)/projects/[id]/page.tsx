import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { connection } from "next/server";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProjectForm from "@/components/admin/ProjectForm";
import CaseStudyBlocksEditor from "@/components/admin/CaseStudyBlocksEditor";
import type { Database } from "@/types/database.types";

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  await connection();
  await assertServerAdmin();
  const { id } = await params;

  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch case study blocks
  const { data: caseStudyBlocks } = await supabase
    .from("case_study_blocks")
    .select("*")
    .eq("project_id", id)
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="border-b-2 border-[#230D10] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin/projects"
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#4A2E33] hover:text-[#EC2929] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Projects</span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                className="text-2xl sm:text-3xl font-black text-[#230D10] uppercase tracking-tight"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {project.title}
              </h1>
              {/* Status & Publication Badges */}
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                  project.is_published
                    ? "bg-[#E8F8EE] text-[#166534] border-[#166534]"
                    : "bg-[#FFF0F0] text-[#EC2929] border-[#EC2929]"
                }`}
              >
                {project.is_published ? "PUBLISHED" : "DRAFT"}
              </span>
              <span className="text-[10px] font-mono uppercase bg-[#F5D9D5] text-[#230D10] px-2 py-0.5 border border-[#E8CEC9]">
                {project.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs font-mono text-[#4A2E33] mt-1">
              Slug: <code className="text-[#230D10]">/projects/{project.slug}</code> • ID:{" "}
              <code className="text-[#4A2E33]">{project.id.slice(0, 8)}...</code>
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/projects/${project.id}/preview`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-[#230D10] text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors brutalist-shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Draft</span>
            </Link>

            {project.is_published && (
              <Link
                href={`/projects/${project.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live View</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Project Form (Basics, Classification, Publication) */}
      <ProjectForm initialData={project} />

      {/* Case Study Deep-Dive Blocks Editor */}
      <CaseStudyBlocksEditor
        projectId={project.id}
        initialBlocks={caseStudyBlocks || []}
      />
    </div>
  );
}
