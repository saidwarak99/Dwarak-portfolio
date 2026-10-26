import React from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { connection } from "next/server";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SITE_SETTINGS } from "@/lib/supabase/queries";
import { SettingsManager } from "@/components/admin/SettingsManager";
import type { SiteSettings } from "@/types/database.types";

export const instant = false;

export default async function AdminSettingsPage() {
  await connection();
  await assertServerAdmin();
  const supabase = await createClient();

  let activeSettings: SiteSettings = DEFAULT_SITE_SETTINGS;

  if (supabase) {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      activeSettings = data as SiteSettings;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#230D10] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>Configuration &amp; Brand</span>
        </div>
        <h1
          className="text-3xl font-black text-[#230D10] uppercase tracking-tight"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Site Settings
        </h1>
        <p className="text-xs font-mono text-[#4A2E33] mt-1">
          Manage identity copy, narrative statements, character artwork poses, contact channels, and section visibility.
        </p>
      </div>

      {/* Settings Manager */}
      <SettingsManager initialSettings={activeSettings} />
    </div>
  );
}
