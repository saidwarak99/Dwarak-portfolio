import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { assertServerAdmin } from "@/lib/auth";
import PostForm from "@/components/admin/PostForm";

export const instant = false;

export default async function NewPostPage() {
  await assertServerAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#230D10] pb-5">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#4A2E33] hover:text-[#EC2929] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Posts</span>
          </Link>
        </div>
        <h1
          className="text-3xl font-black text-[#230D10] uppercase tracking-tight"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          CREATE NEW BUILD LOG / ARTICLE
        </h1>
        <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
          Draft your technical writeup, configure Markdown narrative, and control publication state.
        </p>
      </div>

      {/* Form */}
      <PostForm />
    </div>
  );
}
