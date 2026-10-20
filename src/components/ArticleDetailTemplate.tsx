import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export interface ArticleDetailProps {
  slug: string;
  title: string;
  category: string;
  readingTime: string;
  publishedDate?: string;
  contentMarkdown: string;
  tags?: string[];
}

export function ArticleDetailTemplate({
  slug,
  title,
  category,
  readingTime,
  publishedDate = "2026",
  contentMarkdown,
  tags = [],
}: ArticleDetailProps) {
  return (
    <div className="min-h-screen bg-[#FFF7F5] flex flex-col selection:bg-[#EC2929] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/labs"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO LABS &amp; BUILD LOGS</span>
          </Link>
        </div>

        {/* Article Container */}
        <article className="border-2 border-[#230D10] bg-[#FFF7F5] p-6 sm:p-10 brutalist-shadow-lg mb-10">
          <div className="flex items-center gap-3 text-xs font-mono text-[#6B4D52] mb-4">
            <span className="px-2.5 py-0.5 bg-[#EC2929] text-white font-bold uppercase rounded-sm">
              {category}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {readingTime}
            </span>
            <span>• {publishedDate}</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-black text-[#230D10] uppercase tracking-tight mb-6"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {title}
          </h1>

          <div className="space-y-4 text-base text-[#230D10] leading-relaxed whitespace-pre-wrap">
            {contentMarkdown}
          </div>

          {tags.length > 0 && (
            <div className="border-t border-[#E8CEC9] pt-4 mt-8 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono uppercase text-[#6B4D52] px-2 py-0.5 bg-white border border-[#230D10]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
