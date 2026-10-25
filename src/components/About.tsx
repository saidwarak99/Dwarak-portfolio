import React from "react";

interface AboutProps {
  heading?: string;
  statement?: string;
  secondary?: string;
  focusTag?: string;
  executionTag?: string;
}

export function About({
  heading = "DESIGNER & BUILDER",
  statement = "I design clean, functional interfaces and build working web applications with AI capabilities.",
  secondary = "I turn product ideas into testable prototypes and responsive websites using Figma, Next.js, and Supabase. Everything is built with clear typography, fast interaction, and clean frontend code.",
  focusTag = "Focus: UI/UX",
  executionTag = "Build: AI apps, full-stack",
}: AboutProps) {
  return (
    <section id="about" aria-label="About Section" className="pt-20 pb-16 bg-[#FFF7F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Asymmetrical Grid: minmax(0, 1.1fr) minmax(0, 1fr) preventing overlap at all breakpoints */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
          {/* Left Column: Fluid Headline */}
          <div className="min-w-0 space-y-4">
            {/* Clean Section Number / Label (Varied formula, no pill) */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#EC2929] inline-block" />
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                01 / ABOUT
              </span>
            </div>

            {/* Giant Fluid Heading that never clips or underlaps */}
            <h2
              className="text-[clamp(2.5rem,5.5vw,5rem)] font-black text-[#230D10] leading-[0.92] tracking-tight uppercase break-words"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              DESIGNER &amp; <span className="whitespace-nowrap">BUILDER.</span>
            </h2>

            <p className="text-xs font-mono uppercase tracking-wider text-[#4A2E33] font-semibold pt-2">
              Hyderabad, India · Active Worldwide
            </p>
          </div>

          {/* Right Column: Editorial Card with Statement & Pills */}
          <div className="min-w-0">
            <div className="relative border-2 border-[#230D10] bg-[#FFF7F5] p-6 sm:p-8 md:p-10 brutalist-shadow-lg">
              {/* Primary Statement */}
              <p className="text-lg sm:text-xl font-bold text-[#230D10] leading-relaxed mb-6">
                {statement}
              </p>

              {/* Secondary Detail */}
              <p className="text-sm sm:text-base text-[#4A2E33] leading-relaxed font-medium mb-8 border-t border-[#E8CEC9] pt-6">
                {secondary}
              </p>

              {/* Tag Capsules */}
              <div className="flex flex-wrap gap-3">
                <div className="border border-[#230D10] bg-[#F5D9D5] px-3.5 py-1.5 text-xs font-mono font-bold text-[#230D10] uppercase tracking-wide brutalist-shadow-sm">
                  <span>{focusTag}</span>
                </div>
                <div className="border border-[#230D10] bg-[#F5D9D5] px-3.5 py-1.5 text-xs font-mono font-bold text-[#230D10] uppercase tracking-wide brutalist-shadow-sm">
                  <span>{executionTag}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
