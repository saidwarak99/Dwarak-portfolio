"use client";

import React from "react";
import { ArrowDownRight, Compass, Sparkles } from "lucide-react";
import { CharacterAvatar } from "./CharacterAvatar";
import { SectionDivider } from "./SectionDivider";

interface HeroProps {
  ownerName?: string;
  taglineLeft?: string;
  taglineRight?: string;
  characterImageUrl?: string | null;
}

export function Hero({
  ownerName = "SAI DWARAK",
  taglineLeft = "UI/UX DESIGNER",
  taglineRight = "AI PRODUCT BUILDER",
  characterImageUrl = null,
}: HeroProps) {
  return (
    <section
      id="hero"
      aria-label="Hero Section"
      className="relative pt-6 pb-2 overflow-hidden bg-[#FFF7F5] editorial-grid"
    >
      {/* Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Metadata Bar with Corner Dots */}
        <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-3 text-xs sm:text-sm font-mono tracking-widest text-[#230D10] select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#EC2929] inline-block" />
            <span className="font-bold">{ownerName} •</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">• 2026</span>
            <span className="w-2.5 h-2.5 bg-[#EC2929] inline-block" />
          </div>
        </div>

        {/* Central Giant Typographic Composition */}
        <div className="py-6 sm:py-10 md:py-14 text-center select-none relative">
          {/* Top Line: PO [Character] RT */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 leading-none">
            <span
              className="text-[20vw] sm:text-[17vw] md:text-[14vw] font-black tracking-tight text-[#EC2929] uppercase transform -translate-y-2 select-none"
              style={{
                fontFamily: "var(--font-syne)",
                lineHeight: 0.85,
              }}
            >
              PO
            </span>

            {/* Integrated 2D Cartoon Character: Sai Dwarak in Red Boston T-Shirt */}
            <div className="flex-shrink-0 z-10 px-1">
              <CharacterAvatar
                pose="hero"
                size="md"
                imageUrl={characterImageUrl}
                priority={true}
                className="transform hover:scale-105 transition-transform"
              />
            </div>

            <span
              className="text-[20vw] sm:text-[17vw] md:text-[14vw] font-black tracking-tight text-[#EC2929] uppercase transform -translate-y-2 select-none"
              style={{
                fontFamily: "var(--font-syne)",
                lineHeight: 0.85,
              }}
            >
              RT
            </span>
          </div>

          {/* Bottom Line: FO [Badge] LIO */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 leading-none -mt-4 sm:-mt-8 md:-mt-12">
            <span
              className="text-[20vw] sm:text-[17vw] md:text-[14vw] font-black tracking-tight text-[#EC2929] uppercase select-none"
              style={{
                fontFamily: "var(--font-syne)",
                lineHeight: 0.85,
              }}
            >
              FO
            </span>

            {/* Sai Dwarak Badge Pill */}
            <div className="flex-shrink-0 z-10 px-2 sm:px-4">
              <div className="border-2 border-[#EC2929] bg-[#FFF7F5] px-3 py-1 sm:px-5 sm:py-2 rounded-full brutalist-shadow-sm hover:scale-105 transition-transform">
                <span
                  className="text-xs sm:text-base md:text-xl font-black text-[#EC2929] tracking-wider uppercase font-mono"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {ownerName}
                </span>
              </div>
            </div>

            <span
              className="text-[20vw] sm:text-[17vw] md:text-[14vw] font-black tracking-tight text-[#EC2929] uppercase select-none"
              style={{
                fontFamily: "var(--font-syne)",
                lineHeight: 0.85,
              }}
            >
              LIO
            </span>
          </div>
        </div>

        {/* Bottom Subtitles Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E8CEC9] pt-4 pb-6 gap-3 text-xs sm:text-sm font-mono tracking-wider font-bold text-[#230D10]">
          <div className="flex items-center gap-2">
            <span className="text-[#EC2929]">✦</span>
            <span>{taglineLeft}</span>
            <span className="text-[#EC2929]">•</span>
          </div>

          {/* Quick CTA actions */}
          <div className="flex items-center gap-3">
            <a
              href="#ai-products"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#230D10] text-[#FFF7F5] text-xs font-mono font-bold tracking-wider hover:bg-[#EC2929] transition-colors brutalist-shadow-sm"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>EXPLORE WORK</span>
            </a>
            <a
              href="#about"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#FFF7F5] text-[#230D10] border border-[#230D10] text-xs font-mono font-bold tracking-wider hover:bg-[#F5D9D5] transition-colors"
            >
              <span>ABOUT</span>
              <ArrowDownRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#EC2929]">•</span>
            <span>{taglineRight}</span>
            <span className="text-[#EC2929]">✦</span>
          </div>
        </div>
      </div>

      {/* Red Sawtooth Outline Divider at the base */}
      <div className="mt-4">
        <SectionDivider variant="sawtooth-outline" />
      </div>
    </section>
  );
}
