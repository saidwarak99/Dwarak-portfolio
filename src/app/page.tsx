import React from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { ToolsSection } from "@/components/ToolsSection";
import { WorkSection } from "@/components/WorkSection";
import { LabsSection } from "@/components/LabsSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import fs from "fs";
import path from "path";
import {
  getToolsData,
  getPublishedPosts,
  getSiteSettings,
  getPublishedProjects,
} from "@/lib/supabase/queries";

export const instant = false;

export default async function Home() {
  const illustrationPath = path.join(process.cwd(), "public", "tools-illustration.png");
  const hasToolsIllustration = fs.existsSync(illustrationPath);

  const [toolsData, posts, siteSettings, projects] = await Promise.all([
    getToolsData(),
    getPublishedPosts(),
    getSiteSettings(),
    getPublishedProjects(),
  ]);

  const formattedArticles = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    publishedAt: p.published_at,
    readingTime: "Technical Note",
  }));

  const visibility = siteSettings.section_visibility || {
    ai_products: true,
    ux_ui_projects: true,
    tools: true,
    build_logs: true,
    about: true,
    contact: true,
    resume: false,
  };

  const showResume = Boolean(visibility.resume && siteSettings.resume_url);

  return (
    <div className="min-h-screen bg-[#FFF7F5] flex flex-col selection:bg-[#EC2929] selection:text-white">
      {/* 1. Header & Navigation */}
      <Navbar showResume={showResume} />

      {/* Main Content Flow */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          ownerName={siteSettings.display_name?.toUpperCase() || "SAI DWARAK"}
          taglineLeft="UI/UX DESIGNER"
          taglineRight="AI PRODUCT BUILDER"
          characterImageUrl={siteSettings.character_settings?.hero_asset_url || null}
        />

        {/* 3. About Section */}
        {visibility.about !== false && (
          <About
            heading="DESIGNER & BUILDER"
            statement="I design clean, functional interfaces and build working web applications with AI capabilities."
            secondary="I turn product ideas into testable prototypes and responsive websites using Figma, Next.js, and Supabase. Everything is built with clear typography, fast interaction, and clean frontend code."
            focusTag="Focus: UI/UX"
            executionTag="Build: AI apps, full-stack"
          />
        )}

        {/* 4. Tools I Use */}
        {visibility.tools !== false && (
          <ToolsSection
            categories={toolsData.categories}
            tools={toolsData.tools}
            hasIllustration={hasToolsIllustration}
          />
        )}

        {/* 5. Unified Work Section (Product builds & UX case studies) */}
        {(visibility.ai_products !== false || visibility.ux_ui_projects !== false) && (
          <WorkSection projects={projects} />
        )}

        {/* 6. Labs & Build Logs (Rendered only when real articles exist) */}
        {visibility.build_logs !== false && formattedArticles.length > 0 && (
          <LabsSection articles={formattedArticles} />
        )}

        {/* 7. Contact Section */}
        {visibility.contact !== false && (
          <ContactSection
            email={siteSettings.contact_links?.email}
            linkedin={siteSettings.contact_links?.linkedin}
            github={siteSettings.contact_links?.github}
          />
        )}
      </main>

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
