import React from "react";
import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertServerAdmin } from "@/lib/auth";
import ProjectsManager from "@/components/admin/ProjectsManager";

export const instant = false;

export default async function AdminProjectsPage() {
  await connection();
  await assertServerAdmin();
  const supabase = await createClient();

  let projects: any[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (data) {
      projects = data;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#230D10] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#EC2929] uppercase tracking-wider mb-1">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Content Management</span>
          </div>
          <h1
            className="text-3xl font-black text-[#230D10] uppercase tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            PROJECTS CMS
          </h1>
          <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
            Manage showcase projects, case study blocks, publication visibility, and metadata.
          </p>
        </div>

        <div>
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE NEW PROJECT</span>
          </Link>
        </div>
      </div>

      {/* Interactive Manager with search, filter, and action support */}
      <ProjectsManager initialProjects={projects} />
    </div>
  );
}
