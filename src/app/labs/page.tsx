import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LabsSection } from "@/components/LabsSection";

export default function LabsIndexPage() {
  return (
    <div className="min-h-screen bg-[#FFF7F5] flex flex-col selection:bg-[#EC2929] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO HOME</span>
          </Link>
        </div>

        <LabsSection />
      </main>

      <Footer />
    </div>
  );
}
