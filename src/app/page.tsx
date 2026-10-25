import React from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { ToolsSection } from "@/components/ToolsSection";
import { ProjectGalleries } from "@/components/ProjectGalleries";
import { LabsSection } from "@/components/LabsSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { getToolsData, getPublishedPosts, getSiteSettings } from "@/lib/supabase/queries";

export const instant = false;

export default async function Home() {
  const [toolsData, posts, siteSettings] = await Promise.all([
    getToolsData(),
    getPublishedPosts(),
    getSiteSettings(),
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
            heading="DESIGNER &amp; BUILDER ."
            statement={
              siteSettings.about_content?.philosophy ||
              siteSettings.hero_intro ||
              "I design thoughtful digital experiences and build AI-powered products."
            }
            secondary={
              siteSettings.about_content?.background ||
              "Bridging product strategy and hands-on technical execution, I transform complex ideas into intuitive design systems and working software with modern frontend frameworks and generative AI stacks."
            }
            focusTag="UI/UX &amp; PRODUCT DESIGN"
            executionTag="AI PROTOTYPING &amp; ENGINEERING"
          />
        )}

        {/* 4. Tools I Use */}
        {visibility.tools !== false && (
          <ToolsSection
            categories={toolsData.categories}
            tools={toolsData.tools}
          />
        )}

        {/* 5. Project Galleries */}
        {(visibility.ai_products !== false || visibility.ux_ui_projects !== false) && (
          <ProjectGalleries />
        )}

        {/* 6. Labs & Build Logs */}
        {visibility.build_logs !== false && (
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
      <Footer showResume={showResume} />
    </div>
  );
}
