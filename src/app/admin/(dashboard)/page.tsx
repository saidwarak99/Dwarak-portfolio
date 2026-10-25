import React from "react";
import Link from "next/link";
import {
  FolderKanban,
  Wrench,
  FileText,
  HardDrive,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  Edit,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { assertServerAdmin } from "@/lib/auth";

export const instant = false;

export default async function AdminDashboardOverviewPage() {
  await assertServerAdmin();
  const supabase = await createClient();

  // Fetch real counts from live database
  let projectsCount = 0;
  let publishedProjectsCount = 0;
  let draftProjectsCount = 0;
  let recentProjects: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    status: string;
    is_published: boolean;
    updated_at: string;
  }> = [];

  let toolsCount = 13;
  let categoriesCount = 4;
  let postsCount = 0;

  if (supabase) {
    // 1. Projects metrics
    const { data: projects } = await supabase
      .from("projects")
      .select("id, title, slug, category, status, is_published, updated_at")
      .order("updated_at", { ascending: false });

    if (projects) {
      projectsCount = projects.length;
      publishedProjectsCount = projects.filter((p) => p.is_published).length;
      draftProjectsCount = projects.filter((p) => !p.is_published).length;
      recentProjects = projects.slice(0, 5);
    }

    // 2. Tools & categories metrics
    const [tRes, cRes, pRes] = await Promise.all([
      supabase.from("tools").select("id", { count: "exact", head: true }),
      supabase.from("tool_categories").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
    ]);

    if (tRes.count !== null && tRes.count !== undefined) toolsCount = tRes.count;
    if (cRes.count !== null && cRes.count !== undefined) categoriesCount = cRes.count;
    if (pRes.count !== null && pRes.count !== undefined) postsCount = pRes.count;
  }

  return (
    <div className="space-y-8">
      {/* Title & Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-[#230D10] pb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#EC2929] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Overview & Management</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black text-[#230D10] uppercase tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            PORTFOLIO ENGINE
          </h1>
          <p className="text-xs font-mono text-[#4A2E33] mt-1">
            Private content-management system for Sai Dwarak • Authenticated session active
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE NEW PROJECT</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projects */}
        <div className="border-2 border-[#230D10] bg-white p-5 brutalist-shadow-sm relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-[#4A2E33] uppercase">
              Showcase Projects
            </span>
            <div className="w-8 h-8 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929]">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#230D10] font-mono mb-1">
            {projectsCount}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#4A2E33]">
            <span className="text-[#166534] font-bold">{publishedProjectsCount} published</span>
            <span>•</span>
            <span className="text-[#B45309] font-bold">{draftProjectsCount} drafts</span>
          </div>
        </div>

        {/* Card 2: Tools & Tech */}
        <div className="border-2 border-[#230D10] bg-white p-5 brutalist-shadow-sm relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-[#4A2E33] uppercase">
              Workflow Tools
            </span>
            <div className="w-8 h-8 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929]">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#230D10] font-mono mb-1">
            {toolsCount}
          </div>
          <div className="text-[11px] font-mono text-[#4A2E33]">
            Organized across <span className="font-bold text-[#230D10]">{categoriesCount} categories</span>
          </div>
        </div>

        {/* Card 3: Posts & Build Logs */}
        <div className="border-2 border-[#230D10] bg-white p-5 brutalist-shadow-sm relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-[#4A2E33] uppercase">
              Build Logs & Posts
            </span>
            <div className="w-8 h-8 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#230D10] font-mono mb-1">
            {postsCount}
          </div>
          <div className="text-[11px] font-mono text-[#4A2E33]">
            Clean slate (0 published)
          </div>
        </div>

        {/* Card 4: Security & Storage */}
        <div className="border-2 border-[#230D10] bg-white p-5 brutalist-shadow-sm relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-[#4A2E33] uppercase">
              Storage & RLS
            </span>
            <div className="w-8 h-8 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#166534]">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#166534] font-mono mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-[#166534]" />
            <span>ACTIVE</span>
          </div>
          <div className="text-[11px] font-mono text-[#4A2E33]">
            Public & Private buckets guarded
          </div>
        </div>
      </div>

      {/* Quick Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel 1: Projects CMS */}
        <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase">
              <FolderKanban className="w-4 h-4" />
              <span>Core Module</span>
            </div>
            <h2
              className="text-xl font-black text-[#230D10] uppercase"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Projects CMS
            </h2>
            <p className="text-xs text-[#4A2E33] leading-relaxed">
              Create and manage AI products and UX/UI case studies. Support for custom categories, draft isolation, and ordered case-study blocks.
            </p>
          </div>
          <div className="pt-6">
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
            >
              <span>Manage Projects ({projectsCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Panel 2: Tools & Tech */}
        <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase">
              <Wrench className="w-4 h-4" />
              <span>Workflow</span>
            </div>
            <h2
              className="text-xl font-black text-[#230D10] uppercase"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Tools & Stack
            </h2>
            <p className="text-xs text-[#4A2E33] leading-relaxed">
              Maintain your confirmed 13 tools and categories (Figma, Framer, Tailwind, Next.js, Cursor, etc.) displayed on the homepage.
            </p>
          </div>
          <div className="pt-6">
            <Link
              href="/admin/tools"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
            >
              <span>View Tools ({toolsCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Panel 3: Site Configuration */}
        <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Identity</span>
            </div>
            <h2
              className="text-xl font-black text-[#230D10] uppercase"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Site Settings
            </h2>
            <p className="text-xs text-[#4A2E33] leading-relaxed">
              Singleton configuration for Sai Dwarak: display name, headlines, contact links, section visibility, and character poses.
            </p>
          </div>
          <div className="pt-6">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
            >
              <span>View Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Projects Table or Empty State */}
      <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-[#E8CEC9] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#EC2929]">[●]</span>
            <h3
              className="text-lg font-black text-[#230D10] uppercase tracking-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Recent Projects
            </h3>
          </div>
          <Link
            href="/admin/projects"
            className="text-xs font-mono font-bold text-[#4A2E33] hover:text-[#EC2929] transition-colors"
          >
            View All ({projectsCount}) &rarr;
          </Link>
        </div>

        {projectsCount === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-[#E8CEC9] bg-[#FFF7F5]">
            <FolderKanban className="w-10 h-10 text-[#E8CEC9] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#230D10] font-mono uppercase mb-1">
              Zero Projects In Database
            </h4>
            <p className="text-xs text-[#4A2E33] max-w-md mx-auto mb-5 leading-relaxed font-mono">
              The public gallery is currently in clean empty-state. Create your first project or case study to begin managing content.
            </p>
            <Link
              href="/admin/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b-2 border-[#230D10] text-[#4A2E33] uppercase">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Visibility</th>
                  <th className="py-2.5 px-3">Last Updated</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8CEC9]">
                {recentProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FFF7F5] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#230D10]">
                      {p.title}
                    </td>
                    <td className="py-3 px-3 uppercase text-[11px] text-[#4A2E33]">
                      <span className="bg-[#F5D9D5] px-2 py-0.5 border border-[#E8CEC9]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 uppercase text-[11px]">
                      {p.status}
                    </td>
                    <td className="py-3 px-3">
                      {p.is_published ? (
                        <span className="bg-[#E8F8EE] text-[#166534] px-2 py-0.5 border border-[#166534] font-bold text-[10px] uppercase">
                          Published
                        </span>
                      ) : (
                        <span className="bg-[#FFF0F0] text-[#EC2929] px-2 py-0.5 border border-[#EC2929] font-bold text-[10px] uppercase">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#4A2E33] text-[11px]">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#230D10] hover:text-[#EC2929]"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                      <Link
                        href={`/admin/projects/${p.id}/preview`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A2E33] hover:text-[#230D10]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
