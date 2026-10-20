import React from "react";
import { Sparkles } from "lucide-react";
import { SectionDivider } from "./SectionDivider";

interface AboutProps {
  heading?: string;
  statement?: string;
  secondary?: string;
  focusTag?: string;
  executionTag?: string;
}

export function About({
  heading = "DESIGNER & BUILDER .",
  statement = "I design thoughtful digital experiences and build AI-powered products. My work explores the intersection of UI/UX design, product thinking, prototyping, and artificial intelligence—from early concepts to functional prototypes.",
  secondary = "Bridging product strategy and hands-on technical execution, I transform complex ideas into intuitive design systems and working software with modern frontend frameworks and generative AI stacks.",
  focusTag = "UI/UX & PRODUCT DESIGN",
  executionTag = "AI PROTOTYPING & ENGINEERING",
}: AboutProps) {
  return (
    <section id="about" aria-label="About Section" className="pt-16 pb-0 bg-[#FFF7F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Asymmetrical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Bold Headline & Callout */}
          <div className="lg:col-span-5 space-y-4">
            {/* Small Label with Badge */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                ABOUT ME
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase rounded-full">
                <Sparkles className="w-3 h-3" />
                <span>AI • UX</span>
              </span>
            </div>

            {/* Giant Heading */}
            <h2
              className="text-4xl sm:text-5xl md:text-6xl font-black text-[#230D10] leading-none tracking-tight uppercase"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {heading}
            </h2>

            {/* Decorative Arrow / Notation */}
            <div className="pt-4 flex items-center gap-3 text-[#EC2929]">
              <svg
                width="70"
                height="32"
                viewBox="0 0 70 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transform rotate-2"
                aria-hidden="true"
              >
                <path
                  d="M4 8 C25 6, 45 12, 60 26 M60 26 L48 24 M60 26 L56 16"
                  stroke="#EC2929"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs font-mono uppercase tracking-wider text-[#4A2E33] font-semibold">
                Craft &amp; Architecture
              </span>
            </div>
          </div>

          {/* Right Column: Editorial Card with Statement & Pills */}
          <div className="lg:col-span-7">
            <div className="relative border-2 border-[#230D10] bg-[#FFF7F5] p-6 sm:p-8 md:p-10 brutalist-shadow-lg">
              {/* Corner Accent Dots */}
              <div className="absolute top-2 left-2 text-xs font-mono text-[#EC2929] select-none">
                ✦
              </div>
              <div className="absolute top-2 right-2 text-xs font-mono text-[#EC2929] select-none">
                ✦
              </div>
              <div className="absolute bottom-2 left-2 text-xs font-mono text-[#EC2929] select-none">
                ✦
              </div>
              <div className="absolute bottom-2 right-2 text-xs font-mono text-[#EC2929] select-none">
                ✦
              </div>

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
                  <span className="text-[#EC2929] mr-1.5 font-black">FOCUS:</span>
                  <span>{focusTag}</span>
                </div>
                <div className="border border-[#230D10] bg-[#F5D9D5] px-3.5 py-1.5 text-xs font-mono font-bold text-[#230D10] uppercase tracking-wide brutalist-shadow-sm">
                  <span className="text-[#EC2929] mr-1.5 font-black">EXECUTION:</span>
                  <span>{executionTag}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solid Red Sawtooth Divider at the bottom of About */}
      <SectionDivider variant="sawtooth-solid" />
    </section>
  );
}
