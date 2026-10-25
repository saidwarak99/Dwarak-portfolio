"use client";

import React from "react";
import { ArrowDownRight, Compass } from "lucide-react";
import { CharacterAvatar } from "./CharacterAvatar";

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
      className="relative pt-6 pb-6 overflow-hidden bg-[#FFF7F5]"
    >
      {/* Container with brutalist corner marks */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Frame with Corner [ + ] brackets (reserved for Hero and Project Cards) */}
        <div className="relative border-2 border-[#230D10] bg-[#FFF7F5] p-4 sm:p-8 md:p-12 brutalist-shadow-lg">
          {/* Corner Marks */}
          <div className="absolute top-2 left-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
          <div className="absolute top-2 right-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
          <div className="absolute bottom-2 left-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>
          <div className="absolute bottom-2 right-2 text-xs font-mono font-bold text-[#EC2929] select-none" aria-hidden="true">[+]</div>

          {/* Top Metadata Bar */}
          <div className="flex items-center justify-between border-b border-[#E8CEC9] pb-3 text-xs font-mono tracking-widest text-[#230D10] select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#EC2929] inline-block" />
              <span className="font-bold">{ownerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">HYDERABAD · 2026</span>
              <span className="w-2.5 h-2.5 bg-[#EC2929] inline-block" />
            </div>
          </div>

          {/* Central Giant Typographic Composition: PORT / FOLIO with centered overlapping character */}
          <div className="py-6 sm:py-10 md:py-14 text-center select-none relative flex flex-col items-center justify-center">
            {/* Row 1: PORT */}
            <div className="w-full text-center leading-none">
              <h1
                className="text-[20vw] sm:text-[17vw] md:text-[13vw] font-black tracking-tight text-[#EC2929] uppercase leading-[0.82] select-none m-0 p-0"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                PORT
              </h1>
            </div>

            {/* Overlapping Character Centerpiece: Centered between PORT and FOLIO */}
            <div className="relative z-10 -my-8 sm:-my-14 md:-my-20 flex justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <CharacterAvatar
                  pose="hero"
                  size="md"
                  imageUrl={characterImageUrl}
                  priority={true}
                  className="transform hover:scale-105 transition-transform drop-shadow-md"
                />
              </div>
            </div>

            {/* Row 2: FOLIO with Centered Name Pill */}
            <div className="w-full text-center leading-none relative">
              <span
                className="text-[20vw] sm:text-[17vw] md:text-[13vw] font-black tracking-tight text-[#EC2929] uppercase leading-[0.82] select-none m-0 p-0 block"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                FOLIO
              </span>

              {/* SAI DWARAK Pill - Aligned to exact center of second row */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto border-2 border-[#230D10] bg-[#FFF7F5] px-4 py-1.5 sm:px-6 sm:py-2 brutalist-shadow-sm hover:scale-105 transition-transform">
                  <span
                    className="text-xs sm:text-sm md:text-base font-black text-[#230D10] tracking-wider uppercase font-mono"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {ownerName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Subtitles Bar: UI/UX Designer & AI Product Builder */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E8CEC9] pt-4 gap-3 text-xs font-mono tracking-wider font-bold text-[#230D10]">
            <div className="flex items-center gap-2">
              <span className="text-[#EC2929]">✦</span>
              <span>{taglineLeft}</span>
            </div>

            {/* Quick CTA actions */}
            <div className="flex items-center gap-3">
              <a
                href="#work"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#230D10] text-[#FFF7F5] text-xs font-mono font-bold tracking-wider hover:bg-[#EC2929] transition-colors brutalist-shadow-sm focus-visible:ring-2 focus-visible:ring-[#EC2929]"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>VIEW WORK</span>
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF7F5] text-[#230D10] border-2 border-[#230D10] text-xs font-mono font-bold tracking-wider hover:bg-[#F5D9D5] transition-colors focus-visible:ring-2 focus-visible:ring-[#EC2929]"
              >
                <span>ABOUT</span>
                <ArrowDownRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <span>{taglineRight}</span>
              <span className="text-[#EC2929]">✦</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
