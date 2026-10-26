import React from "react";
import Link from "next/link";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { connection } from "next/server";
import { assertServerAdmin } from "@/lib/auth";
import ProjectForm from "@/components/admin/ProjectForm";

export const instant = false;

export default async function NewProjectPage() {
  await connection();
  await assertServerAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#230D10] pb-5">
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
          <h1
            className="text-3xl font-black text-[#230D10] uppercase tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            CREATE NEW PROJECT
          </h1>
          <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
            Configure project parameters, case-study narrative, and publication state.
          </p>
        </div>
      </div>

      {/* Form */}
      <ProjectForm />
    </div>
  );
}
