import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, ExternalLink } from "lucide-react";
import { connection } from "next/server";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/admin/PostForm";

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function EditPostPage({ params }: EditPostPageProps) {
  await connection();
  await assertServerAdmin();
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) {
    notFound();
  }

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#230D10] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin/posts"
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#4A2E33] hover:text-[#EC2929] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Posts</span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                className="text-2xl sm:text-3xl font-black text-[#230D10] uppercase tracking-tight"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {post.title}
              </h1>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                  post.is_published
                    ? "bg-[#E8F8EE] text-[#166534] border-[#166534]"
                    : "bg-[#FFF0F0] text-[#EC2929] border-[#EC2929]"
                }`}
              >
                {post.is_published ? "PUBLISHED" : "DRAFT"}
              </span>
              <span className="text-[10px] font-mono uppercase bg-[#F5D9D5] text-[#230D10] px-2 py-0.5 border border-[#E8CEC9]">
                {post.category}
              </span>
            </div>
            <p className="text-xs font-mono text-[#4A2E33] mt-1">
              Slug: <code className="text-[#230D10]">/labs/{post.slug}</code> • ID:{" "}
              <code className="text-[#4A2E33]">{post.id.slice(0, 8)}...</code>
            </p>
          </div>

          {/* Quick Action Links */}
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/posts/${post.id}/preview`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-[#230D10] text-xs font-mono font-bold uppercase border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors brutalist-shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Draft</span>
            </Link>

            {post.is_published && (
              <Link
                href={`/labs/${post.slug}`}
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

      {/* Post Form */}
      <PostForm initialData={post} />
    </div>
  );
}
