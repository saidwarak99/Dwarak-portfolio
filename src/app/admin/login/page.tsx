"use client";

import React from "react";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#FFF7F5] flex flex-col justify-center items-center p-4 selection:bg-[#EC2929] selection:text-white editorial-grid">
      <div className="w-full max-w-md border-2 border-[#230D10] bg-[#FFF7F5] p-8 brutalist-shadow-lg relative">
        {/* Corner Marks */}
        <div className="absolute top-2 left-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
        <div className="absolute top-2 right-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
        <div className="absolute bottom-2 left-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
        <div className="absolute bottom-2 right-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 border-2 border-[#230D10] bg-[#F5D9D5] flex items-center justify-center text-[#EC2929] brutalist-shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#EC2929]">
              <Sparkles className="w-3 h-3" />
              <span>Concealed Entry Point</span>
            </div>
            <h1
              className="text-2xl font-black text-[#230D10] uppercase tracking-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              CMS ADMIN PORTAL
            </h1>
          </div>
        </div>

        {/* Informative Notice */}
        <div className="border border-[#230D10] bg-white p-4 mb-6 text-xs text-[#230D10] space-y-2">
          <div className="flex items-center gap-1.5 font-mono font-bold text-[#EC2929]">
            <ShieldCheck className="w-4 h-4" />
            <span>AUTHENTICATION SYSTEM GATE</span>
          </div>
          <p className="text-[#4A2E33] leading-relaxed">
            You accessed the administrative entry route for Sai Dwarak.
          </p>
          <p className="text-[#4A2E33] leading-relaxed">
            Clerk authentication, protected administrative sessions, and the content management dashboard will be connected in <strong>Phase 3</strong>.
          </p>
        </div>

        {/* Disabled Specimen Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
              Admin Email
            </label>
            <input
              type="email"
              disabled
              placeholder="owner@domain.com"
              className="w-full px-3 py-2 border border-[#230D10] bg-[#F5D9D5]/30 text-xs font-mono text-[#6B4D52] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
              Passkey / Password
            </label>
            <input
              type="password"
              disabled
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-[#230D10] bg-[#F5D9D5]/30 text-xs font-mono text-[#6B4D52] cursor-not-allowed"
            />
          </div>

          <button
            type="button"
            disabled
            className="w-full py-2.5 px-4 bg-[#230D10]/40 text-white text-xs font-mono font-bold uppercase tracking-wider border border-[#230D10] cursor-not-allowed"
          >
            LOCKED UNTIL PHASE 3 AUTH
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-[#E8CEC9] text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO PUBLIC PORTFOLIO</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
