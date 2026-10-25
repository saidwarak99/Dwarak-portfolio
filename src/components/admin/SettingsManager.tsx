"use client";

import React, { useState, useTransition } from "react";
import {
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  User,
  Mail,
  Link2,
  Globe,
  Eye,
  FileText,
  Palette,
  ExternalLink,
} from "lucide-react";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { updateSiteSettingsAction } from "@/lib/actions/settings";
import type {
  SiteSettings,
  AboutContent,
  ContactLinks,
  SectionVisibility,
  CharacterSettings,
} from "@/types/database.types";

interface SettingsManagerProps {
  initialSettings: SiteSettings;
}

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  // Form State
  const [displayName, setDisplayName] = useState(initialSettings.display_name || "Sai Dwarak");
  const [heroHeadline, setHeroHeadline] = useState(initialSettings.hero_headline || "");
  const [heroIntro, setHeroIntro] = useState(initialSettings.hero_intro || "");

  // About Content State
  const [aboutPhilosophy, setAboutPhilosophy] = useState(
    (initialSettings.about_content as AboutContent)?.philosophy || ""
  );
  const [aboutBackground, setAboutBackground] = useState(
    (initialSettings.about_content as AboutContent)?.background || ""
  );
  const [aboutLocation, setAboutLocation] = useState(
    (initialSettings.about_content as AboutContent)?.location || "Hyderabad, India"
  );
  const [openToWork, setOpenToWork] = useState(
    (initialSettings.about_content as AboutContent)?.open_to_work ?? true
  );

  // Contact Links State
  const [email, setEmail] = useState((initialSettings.contact_links as ContactLinks)?.email || "");
  const [linkedin, setLinkedin] = useState(
    (initialSettings.contact_links as ContactLinks)?.linkedin || ""
  );
  const [github, setGithub] = useState((initialSettings.contact_links as ContactLinks)?.github || "");

  // Resume URL State
  const [resumeUrl, setResumeUrl] = useState(initialSettings.resume_url || "");

  // Character Settings State
  const [charSettings, setCharSettings] = useState<CharacterSettings>(
    (initialSettings.character_settings as CharacterSettings) || {
      hero_pose: "hero",
      about_pose: "bust",
      tools_pose: "laptop",
      connect_pose: "standing",
    }
  );

  // Section Visibility State
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(
    (initialSettings.section_visibility as SectionVisibility) || {
      ai_products: true,
      ux_ui_projects: true,
      tools: true,
      build_logs: true,
      about: true,
      contact: true,
      resume: false,
    }
  );

  // UI States
  const [activeTab, setActiveTab] = useState<"general" | "about" | "contact" | "character" | "sections">("general");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleReset = () => {
    if (!confirm("Discard all unsaved changes and reload original settings?")) return;
    setDisplayName(initialSettings.display_name || "Sai Dwarak");
    setHeroHeadline(initialSettings.hero_headline || "");
    setHeroIntro(initialSettings.hero_intro || "");
    setAboutPhilosophy((initialSettings.about_content as AboutContent)?.philosophy || "");
    setAboutBackground((initialSettings.about_content as AboutContent)?.background || "");
    setAboutLocation((initialSettings.about_content as AboutContent)?.location || "Hyderabad, India");
    setOpenToWork((initialSettings.about_content as AboutContent)?.open_to_work ?? true);
    setEmail((initialSettings.contact_links as ContactLinks)?.email || "");
    setLinkedin((initialSettings.contact_links as ContactLinks)?.linkedin || "");
    setGithub((initialSettings.contact_links as ContactLinks)?.github || "");
    setResumeUrl(initialSettings.resume_url || "");
    setCharSettings((initialSettings.character_settings as CharacterSettings) || {
      hero_pose: "hero",
      about_pose: "bust",
      tools_pose: "laptop",
      connect_pose: "standing",
    });
    setSectionVisibility((initialSettings.section_visibility as SectionVisibility) || {
      ai_products: true,
      ux_ui_projects: true,
      tools: true,
      build_logs: true,
      about: true,
      contact: true,
      resume: false,
    });
    setFeedback(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Client-side quick checks
    if (!displayName.trim()) {
      setFeedback({ type: "error", message: "Display name cannot be empty." });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFeedback({ type: "error", message: "Please provide a valid contact email." });
      return;
    }

    startTransition(async () => {
      const res = await updateSiteSettingsAction({
        display_name: displayName.trim(),
        hero_headline: heroHeadline.trim(),
        hero_intro: heroIntro.trim(),
        about_content: {
          philosophy: aboutPhilosophy.trim(),
          background: aboutBackground.trim(),
          location: aboutLocation.trim(),
          open_to_work: openToWork,
        },
        contact_links: {
          email: email.trim(),
          linkedin: linkedin.trim(),
          github: github.trim(),
        },
        character_settings: charSettings,
        section_visibility: sectionVisibility,
        resume_url: resumeUrl.trim() || null,
      });

      if (res.success) {
        setFeedback({ type: "success", message: "Site settings updated and published successfully." });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update settings." });
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Tab Navigation & Save Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 border-2 border-[#230D10] brutalist-shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors border ${
              activeTab === "general"
                ? "bg-[#230D10] text-white border-[#230D10]"
                : "bg-[#FFF7F5] text-[#230D10] border-[#E8CEC9] hover:bg-[#F5D9D5]"
            }`}
          >
            Identity &amp; Hero
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors border ${
              activeTab === "about"
                ? "bg-[#230D10] text-white border-[#230D10]"
                : "bg-[#FFF7F5] text-[#230D10] border-[#E8CEC9] hover:bg-[#F5D9D5]"
            }`}
          >
            About &amp; Craft
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors border ${
              activeTab === "contact"
                ? "bg-[#230D10] text-white border-[#230D10]"
                : "bg-[#FFF7F5] text-[#230D10] border-[#E8CEC9] hover:bg-[#F5D9D5]"
            }`}
          >
            Contact &amp; Links
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("character")}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors border ${
              activeTab === "character"
                ? "bg-[#230D10] text-white border-[#230D10]"
                : "bg-[#FFF7F5] text-[#230D10] border-[#E8CEC9] hover:bg-[#F5D9D5]"
            }`}
          >
            Character Poses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors border ${
              activeTab === "sections"
                ? "bg-[#230D10] text-white border-[#230D10]"
                : "bg-[#FFF7F5] text-[#230D10] border-[#E8CEC9] hover:bg-[#F5D9D5]"
            }`}
          >
            Section Toggles
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono font-bold text-[#230D10] uppercase hover:bg-[#F5D9D5] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#230D10] transition-colors brutalist-shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 border-2 flex items-center gap-3 ${
            feedback.type === "success"
              ? "border-[#166534] bg-[#E8F8EE] text-[#166534]"
              : "border-[#EC2929] bg-[#FFF0F0] text-[#EC2929]"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-xs font-mono font-bold">{feedback.message}</span>
        </div>
      )}

      {/* Tab 1: General Identity & Hero */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4">
            <div className="border-b border-[#E8CEC9] pb-3">
              <h3 className="text-sm font-black font-mono uppercase text-[#230D10]">
                Identity &amp; Hero Typography
              </h3>
              <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
                Primary name and marquee headline displayed across the homepage.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                Display Name <span className="text-[#EC2929]">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono font-bold text-[#230D10] focus:outline-none focus:bg-white"
                placeholder="Sai Dwarak"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                Hero Headline <span className="text-[#EC2929]">*</span>
              </label>
              <input
                type="text"
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white"
                placeholder="UI/UX Designer & AI Product Builder"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                Hero Introduction Copy <span className="text-[#EC2929]">*</span>
              </label>
              <textarea
                rows={4}
                value={heroIntro}
                onChange={(e) => setHeroIntro(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white leading-relaxed"
                placeholder="I design thoughtful digital experiences and build AI-powered products..."
              />
            </div>
          </div>

          {/* Live Typography Preview */}
          <div className="lg:col-span-5 border-2 border-[#230D10] bg-[#FFF7F5] p-6 brutalist-shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E8CEC9] pb-3 text-xs font-mono font-bold text-[#EC2929] uppercase">
              <Eye className="w-4 h-4" />
              <span>Hero Marquee Live Preview</span>
            </div>

            <div className="border-2 border-[#230D10] bg-white p-4 text-center space-y-3">
              <span className="text-xs font-mono font-bold text-[#230D10] uppercase tracking-widest block">
                {displayName.toUpperCase()} • 2026
              </span>
              <div
                className="text-2xl font-black text-[#EC2929] uppercase tracking-tight leading-none"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                PORTFOLIO
              </div>
              <div className="inline-block border-2 border-[#EC2929] bg-[#FFF7F5] px-3 py-0.5 rounded-full">
                <span className="text-xs font-black font-mono text-[#EC2929] uppercase">
                  {displayName.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#4A2E33] leading-relaxed pt-2 border-t border-[#E8CEC9]">
                {heroIntro || "Hero intro statement will appear here..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: About & Craft */}
      {activeTab === "about" && (
        <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4 max-w-3xl">
          <div className="border-b border-[#E8CEC9] pb-3">
            <h3 className="text-sm font-black font-mono uppercase text-[#230D10]">
              About Section &amp; Design Philosophy
            </h3>
            <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
              Narrative statements displayed in the editorial About card.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
              Core Design Philosophy
            </label>
            <textarea
              rows={3}
              value={aboutPhilosophy}
              onChange={(e) => setAboutPhilosophy(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white leading-relaxed"
              placeholder="Designing at the seams of craft and intelligence..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
              Background &amp; Technical Execution
            </label>
            <textarea
              rows={3}
              value={aboutBackground}
              onChange={(e) => setAboutBackground(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white leading-relaxed"
              placeholder="With a strong focus on design systems, human-centered UI/UX..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                Primary Location
              </label>
              <input
                type="text"
                value={aboutLocation}
                onChange={(e) => setAboutLocation(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white"
                placeholder="Hyderabad, India"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                Open to Opportunities Status
              </label>
              <button
                type="button"
                onClick={() => setOpenToWork(!openToWork)}
                className={`w-full px-3 py-2 border-2 border-[#230D10] text-xs font-mono font-bold uppercase text-left flex items-center justify-between transition-colors ${
                  openToWork ? "bg-[#E8F8EE] text-[#166534]" : "bg-[#FFF0F0] text-[#EC2929]"
                }`}
              >
                <span>{openToWork ? "✓ Available for Work" : "✕ Not Currently Available"}</span>
                <span className="text-[10px] underline">Toggle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Contact & Links */}
      {activeTab === "contact" && (
        <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4 max-w-3xl">
          <div className="border-b border-[#E8CEC9] pb-3">
            <h3 className="text-sm font-black font-mono uppercase text-[#230D10]">
              Verified Contact Channels &amp; Links
            </h3>
            <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
              Direct channels for clients, employers, and collaborators.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
              Contact Email <span className="text-[#EC2929]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#4A2E33] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono font-bold text-[#230D10] focus:outline-none focus:bg-white"
                placeholder="saidwarak99@gmail.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
              LinkedIn Profile URL
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-[#4A2E33] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white"
                placeholder="https://www.linkedin.com/in/sai-dwarak99/"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
              GitHub Profile URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-[#4A2E33] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white"
                placeholder="https://github.com/saidwarak99"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-[#E8CEC9]">
            <label className="text-xs font-mono font-bold uppercase text-[#230D10] block">
              Public Resume File or URL
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#4A2E33] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-2 border-[#230D10] bg-[#FFF7F5] text-xs font-mono text-[#230D10] focus:outline-none focus:bg-white"
                placeholder="e.g. /resume.pdf or public storage URL"
              />
            </div>
            <span className="text-[10px] font-mono text-[#4A2E33] block">
              Note: The download action in navigation and footer remains hidden until a valid public resume URL is configured and enabled in section visibility.
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Character Artwork Poses */}
      {activeTab === "character" && (
        <div className="space-y-6">
          <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm">
            <h3 className="text-sm font-black font-mono uppercase text-[#230D10]">
              Sai Dwarak Character Artwork Configuration
            </h3>
            <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
              Configure pose selections and optional custom asset URLs for the authentic 2D character illustration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Hero Pose */}
            <div className="border-2 border-[#230D10] bg-white p-4 brutalist-shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-[#EC2929] block">
                Hero Section Pose
              </span>
              <div className="h-44 bg-[#FFF7F5] border-2 border-[#230D10] flex items-center justify-center overflow-hidden">
                <CharacterAvatar
                  pose={charSettings.hero_pose as any || "hero"}
                  imageUrl={charSettings.hero_asset_url}
                  size="md"
                />
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <label className="text-[#4A2E33] block text-[10px] uppercase font-bold">Pose Style:</label>
                  <select
                    value={charSettings.hero_pose || "hero"}
                    onChange={(e) =>
                      setCharSettings((prev) => ({ ...prev, hero_pose: e.target.value }))
                    }
                    className="w-full p-1.5 border border-[#230D10] bg-[#FFF7F5] text-xs font-mono"
                  >
                    <option value="hero">Hero Pose (Boston Red T-Shirt)</option>
                    <option value="standing">Full Standing with Backpack</option>
                    <option value="laptop">Sitting with Laptop</option>
                    <option value="bust">Portrait Bust</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#4A2E33] block text-[10px] uppercase font-bold">Custom Asset URL (Optional):</label>
                  <input
                    type="text"
                    value={charSettings.hero_asset_url || ""}
                    onChange={(e) =>
                      setCharSettings((prev) => ({ ...prev, hero_asset_url: e.target.value || undefined }))
                    }
                    placeholder="/images/character/sai-hero.png"
                    className="w-full p-1 border border-[#230D10] bg-[#FFF7F5] text-[11px] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* About Pose */}
            <div className="border-2 border-[#230D10] bg-white p-4 brutalist-shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-[#EC2929] block">
                About Section Pose
              </span>
              <div className="h-44 bg-[#FFF7F5] border-2 border-[#230D10] flex items-center justify-center overflow-hidden">
                <CharacterAvatar
                  pose={charSettings.about_pose as any || "bust"}
                  imageUrl={charSettings.about_asset_url}
                  size="md"
                />
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <label className="text-[#4A2E33] block text-[10px] uppercase font-bold">Pose Style:</label>
                  <select
                    value={charSettings.about_pose || "bust"}
                    onChange={(e) =>
                      setCharSettings((prev) => ({ ...prev, about_pose: e.target.value }))
                    }
                    className="w-full p-1.5 border border-[#230D10] bg-[#FFF7F5] text-xs font-mono"
                  >
                    <option value="bust">Portrait Bust</option>
                    <option value="hero">Hero Pose</option>
                    <option value="standing">Full Standing</option>
                    <option value="laptop">Sitting with Laptop</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#4A2E33] block text-[10px] uppercase font-bold">Custom Asset URL (Optional):</label>
                  <input
                    type="text"
                    value={charSettings.about_asset_url || ""}
                    onChange={(e) =>
                      setCharSettings((prev) => ({ ...prev, about_asset_url: e.target.value || undefined }))
                    }
                    placeholder="/images/character/sai-bust.png"
                    className="w-full p-1 border border-[#230D10] bg-[#FFF7F5] text-[11px] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Tools Pose */}
            <div className="border-2 border-[#230D10] bg-white p-4 brutalist-shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-[#EC2929] block">
                Tools Section Pose
              </span>
              <div className="h-44 bg-[#FFF7F5] border-2 border-[#230D10] flex items-center justify-center overflow-hidden">
                <CharacterAvatar
                  pose={charSettings.tools_pose as any || "laptop"}
                  imageUrl={charSettings.tools_asset_url}
                  size="md"
                />
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <label className="text-[#4A2E33] block text-[10px] uppercase font-bold">Pose Style:</label>
                  <select
                    value={charSettings.tools_pose || "laptop"}
                    onChange={(e) =>
                      setCharSettings((prev) => ({ ...prev, tools_pose: e.target.value }))
                    }
                    className="w-full p-1.5 border border-[#230D10] bg-[#FFF7F5] text-xs font-mono"
                  >
                    <option value="laptop">Sitting with Laptop</option>
                    <option value="hero">Hero Pose</option>
                    <option value="standing">Full Standing</option>
                    <option value="bust">Portrait Bust</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#4A2E33] block text-[10px] uppercase font-bold">Custom Asset URL (Optional):</label>
                  <input
                    type="text"
                    value={charSettings.tools_asset_url || ""}
                    onChange={(e) =>
                      setCharSettings((prev) => ({ ...prev, tools_asset_url: e.target.value || undefined }))
                    }
                    placeholder="/images/character/sai-laptop.png"
                    className="w-full p-1 border border-[#230D10] bg-[#FFF7F5] text-[11px] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Connect Pose */}
            <div className="border-2 border-[#230D10] bg-white p-4 brutalist-shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-[#EC2929] block">
                Connect Section Pose
              </span>
              <div className="h-44 bg-[#FFF7F5] border-2 border-[#230D10] flex items-center justify-center overflow-hidden">
                <CharacterAvatar
                  pose={charSettings.connect_pose as any || "standing"}
                  imageUrl={charSettings.connect_asset_url}
                  size="md"
                />
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <label className="text-[#4A2E33] block text-[10px] uppercase font-bold">Pose Style:</label>
                  <select
                    value={charSettings.connect_pose || "standing"}
                    onChange={(e) =>
                      setCharSettings((prev) => ({ ...prev, connect_pose: e.target.value }))
                    }
                    className="w-full p-1.5 border border-[#230D10] bg-[#FFF7F5] text-xs font-mono"
                  >
                    <option value="standing">Full Standing with Backpack</option>
                    <option value="hero">Hero Pose</option>
                    <option value="laptop">Sitting with Laptop</option>
                    <option value="bust">Portrait Bust</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#4A2E33] block text-[10px] uppercase font-bold">Custom Asset URL (Optional):</label>
                  <input
                    type="text"
                    value={charSettings.connect_asset_url || ""}
                    onChange={(e) =>
                      setCharSettings((prev) => ({ ...prev, connect_asset_url: e.target.value || undefined }))
                    }
                    placeholder="/images/character/sai-standing.png"
                    className="w-full p-1 border border-[#230D10] bg-[#FFF7F5] text-[11px] font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Section Visibility Toggles */}
      {activeTab === "sections" && (
        <div className="border-2 border-[#230D10] bg-white p-6 brutalist-shadow-sm space-y-4 max-w-2xl">
          <div className="border-b border-[#E8CEC9] pb-3">
            <h3 className="text-sm font-black font-mono uppercase text-[#230D10]">
              Public Section Visibility Controls
            </h3>
            <p className="text-xs font-mono text-[#4A2E33] mt-0.5">
              Toggle visibility of main homepage sections in real-time.
            </p>
          </div>

          <div className="divide-y divide-[#E8CEC9]">
            {Object.entries(sectionVisibility).map(([key, val]) => (
              <div key={key} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-[#230D10] block">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] font-mono text-[#4A2E33]">
                    {key === "resume"
                      ? "Enables resume download link in navbar and footer"
                      : `Controls rendering of the #${key} section on homepage`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSectionVisibility((prev) => ({
                      ...prev,
                      [key]: !val,
                    }))
                  }
                  className={`px-3 py-1 border-2 border-[#230D10] text-xs font-mono font-bold uppercase transition-colors ${
                    val ? "bg-[#E8F8EE] text-[#166534]" : "bg-[#FFF0F0] text-[#EC2929]"
                  }`}
                >
                  {val ? "Visible" : "Hidden"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
