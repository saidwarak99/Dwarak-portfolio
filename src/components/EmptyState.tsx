"use client";

import React from "react";
import { FolderKanban, Sparkles } from "lucide-react";

interface EmptyStateProps {
  badge: string;
  title: string;
  description: string;
}

export function EmptyState({ badge, title, description }: EmptyStateProps) {
  return (
    <div className="relative border-2 border-[#230D10] bg-[#FFF7F5] p-8 sm:p-12 text-center brutalist-shadow-lg overflow-hidden">
      {/* Corner Crosshairs */}
      <div className="absolute top-3 left-3 text-xs font-mono text-[#EC2929] select-none">
        [ ⌖ ]
      </div>
      <div className="absolute top-3 right-3 text-xs font-mono text-[#EC2929] select-none">
        [ ⌖ ]
      </div>
      <div className="absolute bottom-3 left-3 text-xs font-mono text-[#EC2929] select-none">
        [ ⌖ ]
      </div>
      <div className="absolute bottom-3 right-3 text-xs font-mono text-[#EC2929] select-none">
        [ ⌖ ]
      </div>

      {/* Center Icon Box */}
      <div className="w-14 h-14 mx-auto mb-4 border-2 border-[#230D10] bg-[#F5D9D5] flex items-center justify-center text-[#EC2929] brutalist-shadow-sm">
        <FolderKanban className="w-6 h-6" />
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#230D10] text-[#FFF7F5] text-xs font-mono font-bold uppercase tracking-wider mb-3">
        <Sparkles className="w-3 h-3 text-[#EC2929]" />
        <span>{badge}</span>
      </div>

      {/* Headline */}
      <h3
        className="text-2xl sm:text-3xl font-black text-[#230D10] uppercase tracking-tight mb-2"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        {title}
      </h3>

      {/* Editorial Description */}
      <p className="max-w-xl mx-auto text-sm sm:text-base text-[#4A2E33] leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
