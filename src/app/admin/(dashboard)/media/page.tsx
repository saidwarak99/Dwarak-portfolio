import React from "react";
import { Image as ImageIcon, Database as DbIcon, ShieldCheck } from "lucide-react";
import { connection } from "next/server";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MediaManager } from "@/components/admin/MediaManager";
import type { MediaAsset } from "@/types/database.types";

export const instant = false;

export default async function AdminMediaPage() {
  await connection();
  await assertServerAdmin();
  const supabase = await createClient();

  let initialAssets: MediaAsset[] = [];

  if (supabase) {
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      initialAssets = data as MediaAsset[];
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#230D10] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase mb-1">
          <ImageIcon className="w-4 h-4" />
          <span>Storage &amp; Digital Assets</span>
        </div>
        <h1
          className="text-3xl font-black text-[#230D10] uppercase tracking-tight"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Media Library
        </h1>
        <p className="text-xs font-mono text-[#4A2E33] mt-1">
          Manage public showcase media, case study diagrams, private prototypes, and personal artwork.
        </p>
      </div>

      {/* Main Interactive Media Manager */}
      <MediaManager initialAssets={initialAssets} />
    </div>
  );
}
