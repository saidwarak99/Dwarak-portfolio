"use client";

import React, { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { SectionDivider } from "./SectionDivider";

interface ArticleItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  tags: string[];
}

interface LabsSectionProps {
  articles?: ArticleItem[];
}

export function LabsSection({ articles = [] }: LabsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

        {/* Pure Intentional Empty State until real articles exist */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Render real articles when available */}
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
