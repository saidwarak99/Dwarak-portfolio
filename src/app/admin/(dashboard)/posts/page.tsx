import React from "react";
import { BookOpen } from "lucide-react";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PostsManager from "@/components/admin/PostsManager";

export const instant = false;

export default async function AdminPostsPage() {
  await assertServerAdmin();
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="p-6 border-2 border-[#230D10] bg-white text-xs font-mono text-[#4A2E33]">
        Supabase client is unconfigured in local environment.
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#230D10] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EC2929] uppercase mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Editorial &amp; Build Logs CMS</span>
        </div>
        <h1
          className="text-3xl font-black text-[#230D10] uppercase tracking-tight"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Blog &amp; Build Logs
        </h1>
        <p className="text-xs font-mono text-[#4A2E33] mt-1">
          Author and manage your design engineering logs, architecture deep-dives, and AI prototyping writeups.
        </p>
      </div>

      {/* Interactive Posts Manager */}
      <PostsManager initialPosts={posts || []} />
    </div>
  );
}
