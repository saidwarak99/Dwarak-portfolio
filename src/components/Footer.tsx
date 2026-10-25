"use client";

import React from "react";
import { ArrowUp } from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full border-t-2 border-[#230D10] bg-[#FFF7F5] py-6 text-[#230D10]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          {/* Exactly one line branding */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#EC2929] inline-block" />
            <span className="font-bold tracking-wider">
              Sai Dwarak · Hyderabad · 2026
            </span>
          </div>

          {/* Action: Back to Top */}
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF7F5] text-[#230D10] font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#EC2929]"
            aria-label="Scroll back to top of page"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
