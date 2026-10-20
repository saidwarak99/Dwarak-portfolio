"use client";

import React from "react";
import { ArrowUp, Sparkles } from "lucide-react";

interface FooterProps {
  showResume?: boolean;
}

export function Footer({ showResume = false }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full border-t-2 border-[#230D10] bg-[#FFF7F5] py-8 text-[#230D10]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          {/* Branding & Year */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#EC2929] inline-block" />
            <span className="font-bold tracking-wider">
              SAI DWARAK PORTFOLIO &apos;26
            </span>
          </div>

          {/* Action: Back to Top */}
          <div className="flex items-center gap-3">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF7F5] text-[#230D10] font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
              aria-label="Scroll back to top of page"
            >
              <span>BACK TO TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub-footer detail */}
        <div className="mt-6 pt-4 border-t border-[#E8CEC9] flex flex-col sm:flex-row items-center justify-between text-xs text-[#4A2E33] font-medium">
          <span>UI/UX Design &amp; AI Product Engineering.</span>
          <span className="mt-2 sm:mt-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EC2929]" />
            <span>Sai Dwarak • Hyderabad, India</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
