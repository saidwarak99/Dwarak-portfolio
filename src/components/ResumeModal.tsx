"use client";

import React, { useEffect } from "react";
import { X, FileText, Download, Mail } from "lucide-react";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumePdfUrl?: string | null;
}

/**
 * Reusable Resume Dialog Component.
 * Currently disabled in public navigation until a verified resume PDF is supplied by Sai Dwarak.
 */
export function ResumeModal({ isOpen, onClose, resumePdfUrl = null }: ResumeModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#230D10]/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg bg-[#FFF7F5] border-2 border-[#230D10] p-6 sm:p-8 brutalist-shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Target Decorations */}
        <span className="absolute top-2 left-2 text-xs font-mono text-[#EC2929] select-none">[+]</span>
        <span className="absolute top-2 right-2 text-xs font-mono text-[#EC2929] select-none">[+]</span>
        <span className="absolute bottom-2 left-2 text-xs font-mono text-[#EC2929] select-none">[+]</span>
        <span className="absolute bottom-2 right-2 text-xs font-mono text-[#EC2929] select-none">[+]</span>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 border border-[#230D10] bg-[#FFF7F5] hover:bg-[#EC2929] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 border-2 border-[#230D10] bg-[#F5D9D5] flex items-center justify-center text-[#EC2929]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-wider text-[#EC2929] uppercase font-bold">
              CURRICULUM VITAE
            </span>
            <h3
              id="resume-modal-title"
              className="text-2xl font-black tracking-tight text-[#230D10]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              SAI DWARAK
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="border border-[#230D10] bg-white p-5 mb-6 text-sm text-[#230D10]">
          <p className="text-[#6B4D52] leading-relaxed mb-3">
            Official curriculum vitae detailing verified product design engineering milestones and AI system architectures.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {resumePdfUrl ? (
            <a
              href={resumePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#EC2929] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          ) : (
            <a
              href="mailto:saidwarak99@gmail.com?subject=Resume%20Inquiry%20%E2%80%94%20Sai%20Dwarak"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#EC2929] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors brutalist-shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Request via Email</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
