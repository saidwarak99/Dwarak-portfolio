"use server";

import { revalidatePath } from "next/cache";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  SiteSettings,
  AboutContent,
  ContactLinks,
  SectionVisibility,
  CharacterSettings,
} from "@/types/database.types";

export interface SiteSettingsInput {
  display_name: string;
  hero_headline: string;
  hero_intro: string;
  about_content: AboutContent;
  contact_links: ContactLinks;
  character_settings?: CharacterSettings;
  section_visibility?: SectionVisibility;
  resume_url?: string | null;
}

function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

function isValidAssetUrlOrPath(str: string): boolean {
  const trimmed = str.trim();
  if (trimmed.startsWith("/")) return true; // valid relative path like /images/...
  return isValidHttpUrl(trimmed);
}

/**
 * Server Action: Update site settings singleton (id = 1).
 * Strictly enforces admin authentication and validates all URLs, email, and required copy.
 */
export async function updateSiteSettingsAction(
  input: SiteSettingsInput
): Promise<{ success: boolean; settings?: SiteSettings; error?: string }> {
  try {
    await assertServerAdmin();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Database client unconfigured." };

  // 1. Validate required fields
  const displayName = input.display_name?.trim();
  if (!displayName) {
    return { success: false, error: "Display name cannot be empty." };
  }

  const heroHeadline = input.hero_headline?.trim();
  if (!heroHeadline) {
    return { success: false, error: "Hero headline cannot be empty." };
  }

  const heroIntro = input.hero_intro?.trim();
  if (!heroIntro) {
    return { success: false, error: "Hero introduction cannot be empty." };
  }

  // 2. Validate contact links
  const email = input.contact_links?.email?.trim();
  if (!email || !isValidEmail(email)) {
    return { success: false, error: "Please enter a valid contact email address." };
  }

  const linkedin = input.contact_links?.linkedin?.trim();
  if (linkedin && !isValidHttpUrl(linkedin)) {
    return { success: false, error: "LinkedIn URL must be a valid http:// or https:// URL." };
  }

  const github = input.contact_links?.github?.trim();
  if (github && !isValidHttpUrl(github)) {
    return { success: false, error: "GitHub URL must be a valid http:// or https:// URL." };
  }

  // 3. Validate resume URL if provided
  const resumeUrl = input.resume_url?.trim() || null;
  if (resumeUrl && !isValidAssetUrlOrPath(resumeUrl)) {
    return { success: false, error: "Resume URL must be a valid http(s) URL or relative path." };
  }

  // 4. Validate character asset URLs if provided
  const charSettings = input.character_settings || {
    hero_pose: "hero",
    about_pose: "bust",
    tools_pose: "laptop",
    connect_pose: "standing",
  };

  const assetKeys: (keyof CharacterSettings)[] = [
    "hero_asset_url",
    "about_asset_url",
    "tools_asset_url",
    "connect_asset_url",
  ];

  for (const key of assetKeys) {
    const val = charSettings[key];
    if (val && typeof val === "string" && val.trim()) {
      if (!isValidAssetUrlOrPath(val)) {
        return {
          success: false,
          error: `Invalid URL format for ${key}. Must be a valid http(s) URL or relative path.`,
        };
      }
    }
  }

  // 5. Update or Upsert in database
  const { data, error } = await supabase
    .from("site_settings")
    .upsert({
      id: 1,
      display_name: displayName,
      hero_headline: heroHeadline,
      hero_intro: heroIntro,
      about_content: input.about_content || {},
      contact_links: {
        email,
        linkedin: linkedin || "",
        github: github || "",
      },
      character_settings: charSettings,
      section_visibility: input.section_visibility || {
        ai_products: true,
        ux_ui_projects: true,
        tools: true,
        build_logs: true,
        about: true,
        contact: true,
        resume: false,
      },
      resume_url: resumeUrl,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: `Failed to update site settings: ${error?.message}` };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, settings: data as SiteSettings };
}
