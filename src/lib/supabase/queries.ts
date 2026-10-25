// ==============================================================================
// Typed Supabase Database Access Layer (Phase 2.3)
// Provides resilient fallbacks so the public site runs without an active database
// ==============================================================================
import { createPublicClient } from "./server";
import type {
  Project,
  SiteSettings,
  ToolCategory,
  Tool,
  Post,
} from "@/types/database.types";

// ==============================================================================
// VERIFIED FALLBACK DEFAULTS (Used when Supabase is not yet connected)
// ==============================================================================
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  display_name: "Sai Dwarak",
  hero_headline: "UI/UX Designer & AI Product Builder",
  hero_intro:
    "I design thoughtful digital experiences and build AI-powered products. My work explores the intersection of UI/UX design, product thinking, prototyping, and artificial intelligence—from early concepts to functional prototypes.",
  about_content: {
    philosophy:
      "Designing at the seams of craft and intelligence. I specialize in turning ambiguous concepts into functional prototypes and production-ready digital products.",
    background:
      "With a strong focus on design systems, human-centered UI/UX, and generative AI interfaces, I build software that feels intuitive, responsive, and tactile.",
    location: "Hyderabad, India",
    open_to_work: true,
  },
  contact_links: {
    email: "saidwarak99@gmail.com",
    linkedin: "https://www.linkedin.com/in/sai-dwarak99/",
    github: "https://github.com/saidwarak99",
  },
  theme_tokens: {
    canvas: "#FFF7F5",
    accent: "#EC2929",
    ink: "#230D10",
    surface: "#F5D9D5",
    border: "#E8CEC9",
  },
  section_visibility: {
    ai_products: true,
    ux_ui_projects: true,
    tools: true,
    build_logs: true,
    about: true,
    contact: true,
    resume: false,
  },
  character_settings: {
    hero_pose: "hero",
    about_pose: "bust",
    tools_pose: "laptop",
    connect_pose: "standing",
    hero_asset_url: "/images/character/sai-hero.png",
    about_asset_url: "/images/character/sai-bust.png",
    tools_asset_url: "/images/character/sai-laptop.png",
    connect_asset_url: "/images/character/sai-standing.png",
  },
  resume_url: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export const DEFAULT_TOOL_CATEGORIES: ToolCategory[] = [
  { id: "c1000000-0000-0000-0000-000000000001", name: "Design & Systems", slug: "design-systems", display_order: 1, is_visible: true, created_at: "" },
  { id: "c1000000-0000-0000-0000-000000000002", name: "Frontend Architecture", slug: "frontend-architecture", display_order: 2, is_visible: true, created_at: "" },
  { id: "c1000000-0000-0000-0000-000000000003", name: "AI & Generative Tooling", slug: "ai-generative-tooling", display_order: 3, is_visible: true, created_at: "" },
  { id: "c1000000-0000-0000-0000-000000000004", name: "Prototyping & Workflow", slug: "prototyping-workflow", display_order: 4, is_visible: true, created_at: "" },
];

export const DEFAULT_TOOLS: Tool[] = [
  { id: "t1", category_id: "c1000000-0000-0000-0000-000000000001", name: "Figma", description: "Primary vector canvas, auto-layout design systems, UI components, and high-fidelity product prototyping.", icon_url: null, external_url: null, display_order: 1, is_visible: true, created_at: "" },
  { id: "t2", category_id: "c1000000-0000-0000-0000-000000000001", name: "Framer", description: "Interactive web design, responsive layout canvas, and production micro-animations.", icon_url: null, external_url: null, display_order: 2, is_visible: true, created_at: "" },
  { id: "t3", category_id: "c1000000-0000-0000-0000-000000000001", name: "Tailwind CSS", description: "Utility-first modern styling engine for rapid design-system token implementation.", icon_url: null, external_url: null, display_order: 3, is_visible: true, created_at: "" },
  { id: "t4", category_id: "c1000000-0000-0000-0000-000000000002", name: "Next.js", description: "App Router, SSR, Turbopack, and high-performance React application foundation.", icon_url: null, external_url: null, display_order: 4, is_visible: true, created_at: "" },
  { id: "t5", category_id: "c1000000-0000-0000-0000-000000000002", name: "TypeScript", description: "Strict type systems, predictable component contracts, and robust state safety.", icon_url: null, external_url: null, display_order: 5, is_visible: true, created_at: "" },
  { id: "t6", category_id: "c1000000-0000-0000-0000-000000000002", name: "React", description: "Component architecture, declarative UI primitives, and modern hook state flows.", icon_url: null, external_url: null, display_order: 6, is_visible: true, created_at: "" },
  { id: "t7", category_id: "c1000000-0000-0000-0000-000000000003", name: "Claude", description: "Reasoning partner for architecture decisions, prompt design, and iterative product framing.", icon_url: null, external_url: null, display_order: 7, is_visible: true, created_at: "" },
  { id: "t8", category_id: "c1000000-0000-0000-0000-000000000003", name: "Cursor", description: "AI-augmented IDE for rapid development, code refactoring, and agentic workflows.", icon_url: null, external_url: null, display_order: 8, is_visible: true, created_at: "" },
  { id: "t9", category_id: "c1000000-0000-0000-0000-000000000003", name: "GitHub Copilot", description: "Context-aware code completion, snippet acceleration, and test scaffolding.", icon_url: null, external_url: null, display_order: 9, is_visible: true, created_at: "" },
  { id: "t10", category_id: "c1000000-0000-0000-0000-000000000003", name: "Midjourney", description: "Visual exploration, concept art direction, texture generation, and mood boarding.", icon_url: null, external_url: null, display_order: 10, is_visible: true, created_at: "" },
  { id: "t11", category_id: "c1000000-0000-0000-0000-000000000003", name: "OpenAI API", description: "Structured outputs, function calling, embeddings, and generative product logic.", icon_url: null, external_url: null, display_order: 11, is_visible: true, created_at: "" },
  { id: "t12", category_id: "c1000000-0000-0000-0000-000000000004", name: "v0 by Vercel", description: "Generative component prototyping, rapid visual iteration, and layout exploration.", icon_url: null, external_url: null, display_order: 12, is_visible: true, created_at: "" },
  { id: "t13", category_id: "c1000000-0000-0000-0000-000000000004", name: "Supabase", description: "Postgres backend, Row Level Security, authentication, and structured cloud storage.", icon_url: null, external_url: null, display_order: 13, is_visible: true, created_at: "" },
];

// ==============================================================================
// PUBLIC QUERIES
// ==============================================================================

/**
 * Fetch public site settings singleton.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createPublicClient();
  if (!supabase) return DEFAULT_SITE_SETTINGS;

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) return DEFAULT_SITE_SETTINGS;
    return data as SiteSettings;
  } catch (error) {
    console.warn("[getSiteSettings] Error, returning fallback:", error);
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Fetch published showcase projects.
 * Strictly respects empty state when no projects are published.
 */
export async function getPublishedProjects(category?: string): Promise<Project[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from("projects")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Project[];
  } catch (error) {
    console.warn("[getPublishedProjects] Error, returning empty:", error);
    return [];
  }
}

/**
 * Fetch published blog posts / build logs.
 * Strictly respects empty state when no posts are published.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error || !data) return [];
    return data as Post[];
  } catch (error) {
    console.warn("[getPublishedPosts] Error, returning empty:", error);
    return [];
  }
}

/**
 * Fetch visible workflow tools and categories.
 */
export async function getToolsData(): Promise<{
  categories: ToolCategory[];
  tools: Tool[];
}> {
  const supabase = createPublicClient();
  if (!supabase) {
    return {
      categories: DEFAULT_TOOL_CATEGORIES,
      tools: DEFAULT_TOOLS,
    };
  }

  try {
    const [catRes, toolsRes] = await Promise.all([
      supabase.from("tool_categories").select("*").eq("is_visible", true).order("display_order", { ascending: true }),
      supabase.from("tools").select("*").eq("is_visible", true).order("display_order", { ascending: true }),
    ]);

    return {
      categories:
        catRes.data && catRes.data.length > 0
          ? (catRes.data as ToolCategory[])
          : DEFAULT_TOOL_CATEGORIES,
      tools:
        toolsRes.data && toolsRes.data.length > 0
          ? (toolsRes.data as Tool[])
          : DEFAULT_TOOLS,
    };
  } catch (error) {
    console.warn("[getToolsData] Falling back to default tools:", error);
    return {
      categories: DEFAULT_TOOL_CATEGORIES,
      tools: DEFAULT_TOOLS,
    };
  }
}
