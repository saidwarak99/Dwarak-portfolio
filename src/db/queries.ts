// ==============================================================================
// Typed Neon + Drizzle Database Access Layer (Phase 2.2)
// Provides resilient fallbacks so the public site runs without an active database
// ==============================================================================
import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "./index";
import {
  projects,
  caseStudyBlocks,
  toolCategories,
  tools,
  posts,
  siteSettings,
  type Project,
  type CaseStudyBlock,
  type ToolCategory,
  type Tool,
  type Post,
  type SiteSettings,
} from "./schema";

// ==============================================================================
// VERIFIED FALLBACK DEFAULTS (Used when Neon database is not yet connected)
// ==============================================================================
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  displayName: "Sai Dwarak",
  heroHeadline: "UI/UX Designer & AI Product Builder",
  heroIntro:
    "I design thoughtful digital experiences and build AI-powered products. My work explores the intersection of UI/UX design, product thinking, prototyping, and artificial intelligence—from early concepts to functional prototypes.",
  aboutContent: {
    philosophy:
      "Designing at the seams of craft and intelligence. I specialize in turning ambiguous concepts into functional prototypes and production-ready digital products.",
    background:
      "With a strong focus on design systems, human-centered UI/UX, and generative AI interfaces, I build software that feels intuitive, responsive, and tactile.",
    location: "Hyderabad, India",
    open_to_work: true,
  },
  contactLinks: {
    email: "saidwarak99@gmail.com",
    linkedin: "https://www.linkedin.com/in/sai-dwarak99/",
    github: "https://github.com/saidwarak99",
  },
  themeTokens: {
    canvas: "#FFF7F5",
    accent: "#EC2929",
    ink: "#230D10",
    surface: "#F5D9D5",
    border: "#E8CEC9",
  },
  sectionVisibility: {
    ai_products: true,
    ux_ui_projects: true,
    tools: true,
    build_logs: true,
    about: true,
    contact: true,
    resume: false,
  },
  characterSettings: {
    hero_pose: "hero",
    about_pose: "bust",
    tools_pose: "laptop",
    connect_pose: "standing",
    hero_asset_url: "/images/character/sai-hero.png",
    about_asset_url: "/images/character/sai-bust.png",
    tools_asset_url: "/images/character/sai-laptop.png",
    connect_asset_url: "/images/character/sai-standing.png",
  },
  resumeUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const DEFAULT_TOOL_CATEGORIES: ToolCategory[] = [
  { id: "c1000000-0000-0000-0000-000000000001", name: "Design & Systems", slug: "design-systems", displayOrder: 1, isVisible: true, createdAt: new Date() },
  { id: "c1000000-0000-0000-0000-000000000002", name: "Frontend Architecture", slug: "frontend-architecture", displayOrder: 2, isVisible: true, createdAt: new Date() },
  { id: "c1000000-0000-0000-0000-000000000003", name: "AI & Generative Tooling", slug: "ai-generative-tooling", displayOrder: 3, isVisible: true, createdAt: new Date() },
  { id: "c1000000-0000-0000-0000-000000000004", name: "Prototyping & Workflow", slug: "prototyping-workflow", displayOrder: 4, isVisible: true, createdAt: new Date() },
];

export const DEFAULT_TOOLS: Tool[] = [
  { id: "t1", categoryId: "c1000000-0000-0000-0000-000000000001", name: "Figma", description: "Primary vector canvas, auto-layout design systems, UI components, and high-fidelity product prototyping.", iconUrl: null, externalUrl: null, displayOrder: 1, isVisible: true, createdAt: new Date() },
  { id: "t2", categoryId: "c1000000-0000-0000-0000-000000000001", name: "Framer", description: "Interactive web design, responsive layout canvas, and production micro-animations.", iconUrl: null, externalUrl: null, displayOrder: 2, isVisible: true, createdAt: new Date() },
  { id: "t3", categoryId: "c1000000-0000-0000-0000-000000000001", name: "Tailwind CSS", description: "Utility-first modern styling engine for rapid design-system token implementation.", iconUrl: null, externalUrl: null, displayOrder: 3, isVisible: true, createdAt: new Date() },
  { id: "t4", categoryId: "c1000000-0000-0000-0000-000000000002", name: "Next.js", description: "App Router, SSR, Turbopack, and high-performance React application foundation.", iconUrl: null, externalUrl: null, displayOrder: 4, isVisible: true, createdAt: new Date() },
  { id: "t5", categoryId: "c1000000-0000-0000-0000-000000000002", name: "TypeScript", description: "Strict type systems, predictable component contracts, and robust state safety.", iconUrl: null, externalUrl: null, displayOrder: 5, isVisible: true, createdAt: new Date() },
  { id: "t6", categoryId: "c1000000-0000-0000-0000-000000000002", name: "React", description: "Component architecture, declarative UI primitives, and modern hook state flows.", iconUrl: null, externalUrl: null, displayOrder: 6, isVisible: true, createdAt: new Date() },
  { id: "t7", categoryId: "c1000000-0000-0000-0000-000000000003", name: "Claude", description: "Reasoning partner for architecture decisions, prompt design, and iterative product framing.", iconUrl: null, externalUrl: null, displayOrder: 7, isVisible: true, createdAt: new Date() },
  { id: "t8", categoryId: "c1000000-0000-0000-0000-000000000003", name: "Cursor", description: "AI-augmented IDE for rapid development, code refactoring, and agentic workflows.", iconUrl: null, externalUrl: null, displayOrder: 8, isVisible: true, createdAt: new Date() },
  { id: "t9", categoryId: "c1000000-0000-0000-0000-000000000003", name: "GitHub Copilot", description: "Context-aware code completion, snippet acceleration, and test scaffolding.", iconUrl: null, externalUrl: null, displayOrder: 9, isVisible: true, createdAt: new Date() },
  { id: "t10", categoryId: "c1000000-0000-0000-0000-000000000003", name: "Midjourney", description: "Visual exploration, concept art direction, texture generation, and mood boarding.", iconUrl: null, externalUrl: null, displayOrder: 10, isVisible: true, createdAt: new Date() },
  { id: "t11", categoryId: "c1000000-0000-0000-0000-000000000003", name: "OpenAI API", description: "Structured outputs, function calling, embeddings, and generative product logic.", iconUrl: null, externalUrl: null, displayOrder: 11, isVisible: true, createdAt: new Date() },
  { id: "t12", categoryId: "c1000000-0000-0000-0000-000000000004", name: "v0 by Vercel", description: "Generative component prototyping, rapid visual iteration, and layout exploration.", iconUrl: null, externalUrl: null, displayOrder: 12, isVisible: true, createdAt: new Date() },
  { id: "t13", categoryId: "c1000000-0000-0000-0000-000000000004", name: "Supabase", description: "Postgres backend, Row Level Security, authentication, and structured cloud storage.", iconUrl: null, externalUrl: null, displayOrder: 13, isVisible: true, createdAt: new Date() },
];

// ==============================================================================
// PUBLIC QUERIES (Safe for unauthenticated visitors)
// ==============================================================================

/**
 * Fetch public site settings singleton.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const db = getDb();
  if (!db) return DEFAULT_SITE_SETTINGS;

  try {
    const result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, 1))
      .limit(1);

    if (!result || result.length === 0) return DEFAULT_SITE_SETTINGS;
    return result[0];
  } catch (error) {
    console.warn("[getSiteSettings] Falling back to default settings:", error);
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Fetch published projects with optional category filtering.
 * Strictly respects empty state when no projects are published.
 */
export async function getPublishedProjects(category?: string): Promise<Project[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const conditions = [eq(projects.isPublished, true)];
    if (category) {
      conditions.push(eq(projects.category, category));
    }

    const result = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(asc(projects.displayOrder));

    return result ?? [];
  } catch (error) {
    console.warn("[getPublishedProjects] Database query failed, returning empty:", error);
    return [];
  }
}

/**
 * Fetch a single published project by slug with its ordered case-study blocks.
 */
export async function getPublishedProjectBySlug(
  slug: string
): Promise<{ project: Project; blocks: CaseStudyBlock[] } | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const projectResult = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublished, true)))
      .limit(1);

    if (!projectResult || projectResult.length === 0) return null;
    const project = projectResult[0];

    const blocks = await db
      .select()
      .from(caseStudyBlocks)
      .where(eq(caseStudyBlocks.projectId, project.id))
      .orderBy(asc(caseStudyBlocks.displayOrder));

    return { project, blocks: blocks ?? [] };
  } catch (error) {
    console.warn("[getPublishedProjectBySlug] Query failed:", error);
    return null;
  }
}

/**
 * Fetch published blog posts / build logs.
 * Strictly respects empty state when no posts are published.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.isPublished, true))
      .orderBy(desc(posts.publishedAt));

    return result ?? [];
  } catch (error) {
    console.warn("[getPublishedPosts] Database query failed, returning empty:", error);
    return [];
  }
}

/**
 * Fetch a single published post by slug.
 */
export async function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.isPublished, true)))
      .limit(1);

    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.warn("[getPublishedPostBySlug] Query failed:", error);
    return null;
  }
}

/**
 * Fetch visible workflow tools and categories.
 */
export async function getToolsData(): Promise<{
  categories: ToolCategory[];
  tools: Tool[];
}> {
  const db = getDb();
  if (!db) {
    return {
      categories: DEFAULT_TOOL_CATEGORIES,
      tools: DEFAULT_TOOLS,
    };
  }

  try {
    const [fetchedCategories, fetchedTools] = await Promise.all([
      db
        .select()
        .from(toolCategories)
        .where(eq(toolCategories.isVisible, true))
        .orderBy(asc(toolCategories.displayOrder)),
      db
        .select()
        .from(tools)
        .where(eq(tools.isVisible, true))
        .orderBy(asc(tools.displayOrder)),
    ]);

    return {
      categories:
        fetchedCategories && fetchedCategories.length > 0
          ? fetchedCategories
          : DEFAULT_TOOL_CATEGORIES,
      tools:
        fetchedTools && fetchedTools.length > 0
          ? fetchedTools
          : DEFAULT_TOOLS,
    };
  } catch (error) {
    console.warn("[getToolsData] Falling back to verified default tools:", error);
    return {
      categories: DEFAULT_TOOL_CATEGORIES,
      tools: DEFAULT_TOOLS,
    };
  }
}

// ==============================================================================
// ADMINISTRATIVE QUERIES (Requires trusted server-side authentication)
// ==============================================================================

/**
 * Admin: Fetch all projects including drafts.
 */
export async function getAdminProjects(): Promise<Project[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(asc(projects.displayOrder));
}

/**
 * Admin: Fetch all posts including drafts.
 */
export async function getAdminPosts(): Promise<Post[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(posts).orderBy(desc(posts.createdAt));
}
