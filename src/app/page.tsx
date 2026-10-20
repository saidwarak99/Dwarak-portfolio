import React from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { ToolsSection } from "@/components/ToolsSection";
import { ProjectGalleries } from "@/components/ProjectGalleries";
import { LabsSection } from "@/components/LabsSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFF7F5] flex flex-col selection:bg-[#EC2929] selection:text-white">
      {/* 1. Header & Navigation (Resume action hidden until real resume exists) */}
      <Navbar />

      {/* Main Content Flow */}
      <main className="flex-1">
        {/* 2. Hero Section with Sai Dwarak's authentic 2D cartoon avatar */}
        <Hero
          ownerName="SAI DWARAK"
          taglineLeft="UI/UX DESIGNER"
          taglineRight="AI PRODUCT BUILDER"
        />

        {/* 3. About Section with confirmed statement */}
        <About
          heading="DESIGNER &amp; BUILDER ."
          statement="I design thoughtful digital experiences and build AI-powered products. My work explores the intersection of UI/UX design, product thinking, prototyping, and artificial intelligence—from early concepts to functional prototypes."
          secondary="Bridging product strategy and hands-on technical execution, I transform complex ideas into intuitive design systems and working software with modern frontend frameworks and generative AI stacks."
          focusTag="UI/UX &amp; PRODUCT DESIGN"
          executionTag="AI PROTOTYPING &amp; ENGINEERING"
        />

        {/* 4. Tools I Use (Confirmed 13 tools in data-driven categories) */}
        <ToolsSection />

        {/* 5. Project Galleries (Pure, intentional empty states without fake projects) */}
        <ProjectGalleries />

        {/* 6. Labs & Build Logs (Intentional empty state) */}
        <LabsSection />

        {/* 7. Contact Section (Verified email, LinkedIn, GitHub & mailto compose) */}
        <ContactSection />
      </main>

      {/* 8. Footer (Resume download hidden until real file exists) */}
      <Footer />
    </div>
  );
}
