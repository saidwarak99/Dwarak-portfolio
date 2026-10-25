"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Sparkles, ArrowUpRight, Calendar, Tag } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { SectionDivider } from "./SectionDivider";

export interface ArticleItem {
  slug: string;
  title: string;
  excerpt?: string | null;
  category: string;
  readingTime?: string;
  tags?: string[];
  publishedAt?: string | null;
}

interface LabsSectionProps {
  articles?: ArticleItem[];
}

export function LabsSection({ articles = [] }: LabsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="labs" aria-label="Build Logs and Labs Section" className="pt-16 pb-0 bg-[#FFF7F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header Title & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-[#E8CEC9] pb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                WRITING &amp; BUILD NOTES
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EC2929] text-white text-[10px] font-mono font-bold uppercase rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                <span>LABS</span>
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-[#230D10] uppercase tracking-tight leading-none"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              BUILD LOGS &amp; LABS .
            </h2>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#6B4D52] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search logs & notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono text-[#230D10] placeholder-[#6B4D52] brutalist-shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
            />
          </div>
        </div>

        {/* Real Articles Grid or Intentional Empty State */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => (
              <article
                key={article.slug}
                className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8CEC9] pb-2 text-[10px] font-mono font-bold">
                    <span className="uppercase bg-[#F5D9D5] text-[#230D10] px-2 py-0.5 border border-[#E8CEC9]">
                      {article.category}
                    </span>
                    {article.publishedAt && (
                      <span className="text-[#4A2E33] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#EC2929]" />
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>

                  <h3
                    className="text-xl sm:text-2xl font-black text-[#230D10] uppercase tracking-tight group-hover:text-[#EC2929] transition-colors"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    <Link href={`/labs/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>

                  {article.excerpt && (
                    <p className="text-xs font-mono text-[#4A2E33] line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}

                  {Array.isArray(article.tags) && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] font-mono bg-[#FFF7F5] text-[#4A2E33] border border-[#E8CEC9]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#E8CEC9] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#4A2E33] uppercase">
                    {article.readingTime || "Technical Log"}
                  </span>
                  <Link
                    href={`/labs/${article.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#230D10] group-hover:text-[#EC2929] transition-colors uppercase"
                  >
                    <span>Read Log</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            badge="WRITING VAULT"
            title="Build Logs in Preparation"
            description="Engineering reflections, design-to-code architecture breakdowns, and AI prototyping experiments will be published here once finalized."
          />
        )}
      </div>

      {/* Dark Chevron Divider at the bottom of Labs */}
      <SectionDivider variant="chevron-dark" />
    </section>
  );
}
