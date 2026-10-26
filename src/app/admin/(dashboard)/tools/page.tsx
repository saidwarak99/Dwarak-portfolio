import React from "react";
import { Wrench } from "lucide-react";
import { connection } from "next/server";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ToolsManager from "@/components/admin/ToolsManager";

export const instant = false;

export default async function AdminToolsPage() {
  await connection();
  await assertServerAdmin();
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="p-6 border-2 border-[#230D10] bg-white text-xs font-mono text-[#4A2E33]">
        Supabase client is unconfigured in local environment.
      </div>
    );
  }

  const [{ data: tools }, { data: categories }] = await Promise.all([
    supabase.from("tools").select("*").order("display_order", { ascending: true }),
    supabase.from("tool_categories").select("*").order("display_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#230D10] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase mb-1">
          <Wrench className="w-4 h-4" />
          <span>Tools & Tech Stack CMS</span>
        </div>
        <h1
          className="text-3xl font-black text-[#230D10] uppercase tracking-tight"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Tools & Categories
        </h1>
        <p className="text-xs font-mono text-[#4A2E33] mt-1">
          Manage your verified workflow tools, descriptions, order priorities, and taxonomy categories.
        </p>
      </div>

      {/* Interactive Manager */}
      <ToolsManager
        initialTools={tools || []}
        initialCategories={categories || []}
      />
    </div>
  );
}
