"use client";

import React, { useState } from "react";
import { Mail, ArrowUpRight, Send } from "lucide-react";

interface ContactSectionProps {
  email?: string;
  linkedin?: string;
  github?: string;
}

export function ContactSection({
  email = "saidwarak99@gmail.com",
  linkedin = "https://www.linkedin.com/in/sai-dwarak99/",
  github = "https://github.com/saidwarak99",
}: ContactSectionProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleComposeMailto = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
      subject || "Portfolio Inquiry — Sai Dwarak"
    )}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
  };

  const cleanLinkedin = linkedin.replace(/^https?:\/\/(www\.)?/, "");
  const cleanGithub = github.replace(/^https?:\/\/(www\.)?/, "");

  return (
    <section id="contact" aria-label="Contact Section" className="pt-20 pb-20 bg-[#FFF7F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Box - Corner brackets removed (reserved for hero and project cards) */}
        <div className="border-2 border-[#230D10] bg-[#FFF7F5] p-6 sm:p-10 md:p-12 brutalist-shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8 lg:gap-14 items-start">
            {/* Left Column: Title & Intro (min-w-0 w-full to prevent collision with right cards) */}
            <div className="min-w-0 w-full space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#EC2929] inline-block" />
                <span className="text-xs font-mono font-bold tracking-widest text-[#230D10] uppercase">
                  04 / CONTACT
                </span>
              </div>

              {/* Fluid clamp heading with break-words so it never collides */}
              <h2
                className="text-[clamp(2.2rem,4.5vw,4.25rem)] font-black text-[#230D10] uppercase tracking-tight leading-[0.95] break-words"
                style={{
                  fontFamily: "var(--font-syne)",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                LET&apos;S <span className="whitespace-nowrap">CONNECT.</span>
              </h2>

              <p className="text-sm sm:text-base text-[#4A2E33] leading-relaxed max-w-md pt-2">
                Open to design and AI product roles, freelance, and collaborations. Email is the fastest way.
              </p>

              <div className="pt-2">
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#230D10] transition-colors brutalist-shadow-sm focus-visible:ring-2 focus-visible:ring-[#230D10]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email me</span>
                </a>
              </div>
            </div>

            {/* Right Column: Confirmed Channels & Direct Message Composer */}
            <div className="min-w-0 space-y-3">
              {/* LinkedIn Card */}
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border-2 border-[#230D10] bg-white hover:bg-[#F5D9D5] transition-all brutalist-shadow-sm group hover:translate-x-1 focus-visible:ring-2 focus-visible:ring-[#EC2929]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929] group-hover:bg-[#230D10] group-hover:text-white transition-colors flex-shrink-0">
                    <svg
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.66 1.66 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66Z" />
                    </svg>
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] font-mono uppercase text-[#4A2E33] font-bold">
                      LINKEDIN
                    </div>
                    <div className="text-sm font-bold text-[#230D10] truncate">
                      {cleanLinkedin || "linkedin.com/in/sai-dwarak99"}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#4A2E33] group-hover:text-[#EC2929] transition-colors flex-shrink-0" />
              </a>

              {/* GitHub Card */}
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border-2 border-[#230D10] bg-white hover:bg-[#F5D9D5] transition-all brutalist-shadow-sm group hover:translate-x-1 focus-visible:ring-2 focus-visible:ring-[#EC2929]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 border border-[#230D10] bg-[#FFF7F5] flex items-center justify-center text-[#EC2929] group-hover:bg-[#230D10] group-hover:text-white transition-colors flex-shrink-0">
                    <svg
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                    </svg>
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] font-mono uppercase text-[#4A2E33] font-bold">
                      GITHUB
                    </div>
                    <div className="text-sm font-bold text-[#230D10] truncate">
                      {cleanGithub || "github.com/saidwarak99"}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#4A2E33] group-hover:text-[#EC2929] transition-colors flex-shrink-0" />
              </a>

              {/* Working Direct Mail Compose Action */}
              <form
                onSubmit={handleComposeMailto}
                className="mt-4 border-2 border-[#230D10] bg-white p-4 brutalist-shadow-sm space-y-3"
              >
                <div className="text-[11px] font-mono font-bold text-[#230D10] uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#EC2929] inline-block" />
                  <span>Send a message</span>
                </div>
                <input
                  type="text"
                  placeholder="Subject (e.g. Design inquiry or project)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-[#230D10] bg-[#FFF7F5] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
                />
                <textarea
                  rows={2}
                  placeholder="Write your note..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-[#230D10] bg-[#FFF7F5] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#EC2929] resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#230D10] text-[#FFF7F5] text-xs font-mono font-bold uppercase tracking-wider border border-[#230D10] hover:bg-[#EC2929] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#EC2929]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
