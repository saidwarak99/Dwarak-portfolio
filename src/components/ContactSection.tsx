"use client";

import React, { useState } from "react";
import { Sparkles, Mail, ArrowUpRight, Send } from "lucide-react";

export function ContactSection() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleComposeMailto = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:saidwarak99@gmail.com?subject=${encodeURIComponent(
      subject || "Portfolio Inquiry — Sai Dwarak"
    )}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <section id="contact" aria-label="Contact Section" className="pt-16 pb-16 bg-[#FFF7F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Box */}
        <div className="relative border-2 border-[#230D10] bg-[#FFF7F5] p-6 sm:p-10 md:p-12 brutalist-shadow-lg">
          {/* Corner Marks */}
          <div className="absolute top-2 left-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
          <div className="absolute top-2 right-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
          <div className="absolute bottom-2 left-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
          <div className="absolute bottom-2 right-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Title & Intro */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                  CONTACT
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EC2929] text-white text-[10px] font-mono font-bold uppercase rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>GET IN TOUCH</span>
                </span>
              </div>

              <h2
                className="text-4xl sm:text-5xl md:text-6xl font-black text-[#230D10] uppercase tracking-tight leading-none"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                LET&apos;S CONNECT
              </h2>

              <p className="text-sm sm:text-base text-[#4A2E33] leading-relaxed max-w-md pt-2">
                Available for product design opportunities, AI interface collaborations, and generative tooling explorations. Connect directly through email or professional channels.
              </p>

              {/* Hand-drawn style arrow */}
              <div className="pt-4 hidden sm:block">
                <svg
                  width="60"
                  height="36"
                  viewBox="0 0 60 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#EC2929]"
                  aria-hidden="true"
                >
                  <path
                    d="M10 30 C25 28, 40 22, 50 10 M50 10 L38 12 M50 10 L48 22"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Right Column: Confirmed Channels & Direct Email Action */}
            <div className="lg:col-span-6 space-y-3">
              {/* LinkedIn Card */}
              <a
                href="https://www.linkedin.com/in/sai-dwarak99/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border-2 border-[#230D10] bg-white hover:bg-[#F5D9D5] transition-all brutalist-shadow-sm group hover:translate-x-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929] group-hover:bg-[#230D10] group-hover:text-white transition-colors">
                    <svg
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.66 1.66 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66 1.66 1.66 0 0 0-1.66-1.66Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase text-[#4A2E33] font-bold">
                      LINKEDIN
                    </div>
                    <div className="text-sm font-bold text-[#230D10]">
                      linkedin.com/in/sai-dwarak99
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#4A2E33] group-hover:text-[#EC2929] transition-colors" />
              </a>

              {/* GitHub Card */}
              <a
                href="https://github.com/saidwarak99"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border-2 border-[#230D10] bg-white hover:bg-[#F5D9D5] transition-all brutalist-shadow-sm group hover:translate-x-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929] group-hover:bg-[#230D10] group-hover:text-white transition-colors">
                    <svg
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase text-[#4A2E33] font-bold">
                      GITHUB
                    </div>
                    <div className="text-sm font-bold text-[#230D10]">
                      github.com/saidwarak99
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#4A2E33] group-hover:text-[#EC2929] transition-colors" />
              </a>

              {/* Email Card */}
              <a
                href="mailto:saidwarak99@gmail.com"
                className="flex items-center justify-between p-4 border-2 border-[#230D10] bg-white hover:bg-[#F5D9D5] transition-all brutalist-shadow-sm group hover:translate-x-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929] group-hover:bg-[#230D10] group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase text-[#4A2E33] font-bold">
                      DIRECT EMAIL
                    </div>
                    <div className="text-sm font-bold text-[#230D10]">
                      saidwarak99@gmail.com
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#4A2E33] group-hover:text-[#EC2929] transition-colors" />
              </a>

              {/* Working Direct Mail Compose Action */}
              <form
                onSubmit={handleComposeMailto}
                className="mt-4 border-2 border-[#230D10] bg-white p-4 brutalist-shadow-sm space-y-3"
              >
                <div className="text-xs font-mono font-bold text-[#230D10] uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#EC2929] inline-block" />
                  <span>Quick Compose Email</span>
                </div>
                <input
                  type="text"
                  placeholder="Subject (e.g. Design Collaboration)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-[#230D10] bg-[#FFF7F5] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
                />
                <textarea
                  rows={2}
                  placeholder="Message preview..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-[#230D10] bg-[#FFF7F5] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#EC2929] resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>OPEN IN EMAIL CLIENT</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
