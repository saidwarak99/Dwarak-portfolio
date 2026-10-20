import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Layers, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export interface ProjectDetailProps {
  slug: string;
  title: string;
  role: string;
  category: string;
  timeline: string;
  status: string;
  overviewMarkdown?: string;
  problemMarkdown?: string;
  executionMarkdown?: string;
  outcomesMarkdown?: string;
}

export function ProjectDetailTemplate({
  slug,
  title,
  role,
  category,
  timeline,
  status,
  overviewMarkdown,
  problemMarkdown,
  executionMarkdown,
  outcomesMarkdown,
}: ProjectDetailProps) {
  return (
    <div className="min-h-screen bg-[#FFF7F5] flex flex-col selection:bg-[#EC2929] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <Link
            href="/#ai-products"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO PORTFOLIO</span>
          </Link>
        </div>

        {/* Project Header */}
        <div className="border-2 border-[#230D10] bg-[#FFF7F5] p-6 sm:p-10 brutalist-shadow-lg mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-[#EC2929] text-white text-[10px] font-mono font-bold uppercase rounded-sm">
              CASE STUDY
            </span>
            <span className="text-xs font-mono text-[#6B4D52]">/projects/{slug}</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black text-[#230D10] uppercase tracking-tight mb-4"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#E8CEC9] pt-4 text-xs font-mono">
            <div>
              <span className="text-[#6B4D52] block uppercase text-[10px]">ROLE</span>
              <span className="font-bold text-[#230D10]">{role}</span>
            </div>
            <div>
              <span className="text-[#6B4D52] block uppercase text-[10px]">CATEGORY</span>
              <span className="font-bold text-[#230D10]">{category}</span>
            </div>
            <div>
              <span className="text-[#6B4D52] block uppercase text-[10px]">TIMELINE</span>
              <span className="font-bold text-[#230D10]">{timeline}</span>
            </div>
            <div>
              <span className="text-[#6B4D52] block uppercase text-[10px]">STATUS</span>
              <span className="font-bold text-[#EC2929]">{status}</span>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {problemMarkdown && (
            <div className="border-2 border-[#230D10] bg-white p-6 sm:p-8 brutalist-shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono text-[#EC2929] font-bold uppercase mb-2">
                <span>01 / CONTEXT</span>
              </div>
              <h2
                className="text-2xl font-black text-[#230D10] uppercase mb-3"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                The Problem &amp; Opportunity
              </h2>
              <div className="text-sm text-[#6B4D52] leading-relaxed whitespace-pre-wrap">
                {problemMarkdown}
              </div>
            </div>
          )}

          {executionMarkdown && (
            <div className="border-2 border-[#230D10] bg-white p-6 sm:p-8 brutalist-shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono text-[#EC2929] font-bold uppercase mb-2">
                <span>02 / EXECUTION</span>
              </div>
              <h2
                className="text-2xl font-black text-[#230D10] uppercase mb-3"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Information Architecture &amp; User Flows
              </h2>
              <div className="text-sm text-[#6B4D52] leading-relaxed whitespace-pre-wrap">
                {executionMarkdown}
              </div>
            </div>
          )}

          {outcomesMarkdown && (
            <div className="border-2 border-[#230D10] bg-white p-6 sm:p-8 brutalist-shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono text-[#EC2929] font-bold uppercase mb-2">
                <span>03 / REFLECTION</span>
              </div>
              <h2
                className="text-2xl font-black text-[#230D10] uppercase mb-3"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Outcomes &amp; Learnings
              </h2>
              <div className="text-sm text-[#6B4D52] leading-relaxed whitespace-pre-wrap">
                {outcomesMarkdown}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
