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
    <section id="about" aria-label="About Section" className="pt-14 pb-12 sm:pt-20 sm:pb-16 bg-[#FFF7F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Responsive Grid: single column on mobile, balanced 2-column on tablet (md:) and desktop (lg:) */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 md:gap-8 lg:gap-14 items-start">
          {/* Left Column: Fluid Headline */}
          <div className="min-w-0 w-full space-y-3 sm:space-y-4">
            {/* Clean Section Number / Label */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#EC2929] inline-block" />
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                01 / ABOUT
              </span>
            </div>

            {/* Giant Fluid Heading that never clips or underlaps */}
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[clamp(2.5rem,4.5vw,4.5rem)] font-black text-[#230D10] leading-[0.95] tracking-tight uppercase break-words"
              style={{
                fontFamily: "var(--font-syne)",
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              DESIGNER &amp; BUILDER.
            </h2>

            <p className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-[#4A2E33] font-semibold pt-1 sm:pt-2">
              Hyderabad, India · Active Worldwide
            </p>
          </div>

          {/* Right Column: Editorial Card with Statement & Pills */}
          <div className="min-w-0 w-full">
            <div className="relative border-2 border-[#230D10] bg-[#FFF7F5] p-5 sm:p-8 md:p-10 brutalist-shadow-lg">
              {/* Primary Statement */}
              <p className="text-base sm:text-lg md:text-xl font-bold text-[#230D10] leading-relaxed mb-4 sm:mb-6">
                {statement}
              </p>

              {/* Secondary Detail */}
              <p className="text-xs sm:text-sm md:text-base text-[#4A2E33] leading-relaxed font-medium mb-6 sm:mb-8 border-t border-[#E8CEC9] pt-4 sm:pt-6">
                {secondary}
              </p>

              {/* Tag Capsules */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div className="border border-[#230D10] bg-[#F5D9D5] px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold text-[#230D10] uppercase tracking-wide brutalist-shadow-sm">
                  <span>{focusTag}</span>
                </div>
                <div className="border border-[#230D10] bg-[#F5D9D5] px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold text-[#230D10] uppercase tracking-wide brutalist-shadow-sm">
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
