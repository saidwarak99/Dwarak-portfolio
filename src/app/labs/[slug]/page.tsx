import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Tag, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const instant = false;

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return {
      title: "Article Not Found — Sai Dwarak",
    };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, seo_title, seo_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) {
    return {
      title: "Article Not Found — Sai Dwarak",
    };
  }

  return {
    title: post.seo_title || `${post.title} — Sai Dwarak`,
    description: post.seo_description || post.excerpt || undefined,
  };
}

function RenderMarkdownLines({ content }: { content: string }) {
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="p-4 bg-[#230D10] text-[#FFF7F5] font-mono text-xs overflow-x-auto my-4 border border-[#E8CEC9]"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={i}
          className="text-3xl sm:text-4xl font-black uppercase text-[#230D10] mt-8 mb-4 border-b-2 border-[#230D10] pb-2"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {line.replace("# ", "")}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="text-2xl sm:text-3xl font-black uppercase text-[#230D10] mt-6 mb-3 border-b border-[#E8CEC9] pb-1"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-xl font-bold text-[#230D10] font-mono mt-4 mb-2">
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="p-4 my-4 border-l-4 border-[#EC2929] bg-[#FFF7F5] text-xs sm:text-sm font-mono italic text-[#4A2E33]"
        >
          {line.replace("> ", "")}
        </blockquote>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="text-xs sm:text-sm font-mono text-[#230D10] ml-6 list-disc my-1">
          {line.replace(/^[-*]\s+/, "")}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-3" />);
    } else {
      elements.push(
        <p key={i} className="text-xs sm:text-sm font-mono text-[#230D10] leading-relaxed my-2">
          {line}
        </p>
      );
    }
  }

  return <div className="space-y-1">{elements}</div>;
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  // Strictly query published posts: RLS and query guarantee unpublished posts are 404
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FFF7F5] flex flex-col selection:bg-[#EC2929] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <Link
            href="/labs"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO LABS</span>
          </Link>
        </div>

        {/* Article Container */}
        <article className="border-2 border-[#230D10] bg-white p-6 sm:p-10 brutalist-shadow space-y-8">
          <div className="space-y-4 border-b-2 border-[#230D10] pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase bg-[#F5D9D5] text-[#230D10] px-2.5 py-1 border border-[#230D10]">
                {post.category}
              </span>
              {post.published_at && (
                <span className="text-[11px] font-mono text-[#4A2E33] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#EC2929]" />
                  <span>{new Date(post.published_at).toLocaleDateString()}</span>
                </span>
              )}
            </div>

            <h1
              className="text-3xl sm:text-5xl font-black text-[#230D10] uppercase tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-base sm:text-lg font-mono text-[#4A2E33] leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="border-2 border-[#230D10] overflow-hidden bg-[#FFF7F5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full max-h-[450px] object-cover"
              />
            </div>
          )}

          {/* Tags */}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-mono text-[#4A2E33] flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5 text-[#EC2929]" />
                <span>Tags:</span>
              </span>
              {post.tags.map((t: string) => (
                <span
                  key={t}
                  className="px-2.5 py-1 text-xs font-mono bg-[#FFF7F5] text-[#230D10] border border-[#230D10]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Markdown Content */}
          <div className="pt-4 border-t border-[#E8CEC9]">
            <RenderMarkdownLines content={post.content} />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
