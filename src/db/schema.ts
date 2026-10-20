// ==============================================================================
// Sai Dwarak Portfolio Platform — Drizzle ORM Schema (Neon PostgreSQL)
// ==============================================================================
import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==============================================================================
// 1. SITE SETTINGS (SINGLETON)
// ==============================================================================
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  displayName: text("display_name").notNull().default("Sai Dwarak"),
  heroHeadline: text("hero_headline")
    .notNull()
    .default("UI/UX Designer & AI Product Builder"),
  heroIntro: text("hero_intro")
    .notNull()
    .default(
      "I design thoughtful digital experiences and build AI-powered products. My work explores the intersection of UI/UX design, product thinking, prototyping, and artificial intelligence—from early concepts to functional prototypes."
    ),
  aboutContent: jsonb("about_content")
    .$type<{
      philosophy?: string;
      background?: string;
      location?: string;
      open_to_work?: boolean;
      [key: string]: unknown;
    }>()
    .notNull()
    .default({
      philosophy:
        "Designing at the seams of craft and intelligence. I specialize in turning ambiguous concepts into functional prototypes and production-ready digital products.",
      background:
        "With a strong focus on design systems, human-centered UI/UX, and generative AI interfaces, I build software that feels intuitive, responsive, and tactile.",
      location: "Hyderabad, India",
      open_to_work: true,
    }),
  contactLinks: jsonb("contact_links")
    .$type<{
      email: string;
      linkedin: string;
      github: string;
      [key: string]: string;
    }>()
    .notNull()
    .default({
      email: "saidwarak99@gmail.com",
      linkedin: "https://www.linkedin.com/in/sai-dwarak99/",
      github: "https://github.com/saidwarak99",
    }),
  themeTokens: jsonb("theme_tokens")
    .$type<Record<string, string>>()
    .notNull()
    .default({
      canvas: "#FFF7F5",
      accent: "#EC2929",
      ink: "#230D10",
      surface: "#F5D9D5",
      border: "#E8CEC9",
    }),
  sectionVisibility: jsonb("section_visibility")
    .$type<Record<string, boolean>>()
    .notNull()
    .default({
      ai_products: true,
      ux_ui_projects: true,
      tools: true,
      build_logs: true,
      about: true,
      contact: true,
      resume: false,
    }),
  characterSettings: jsonb("character_settings")
    .$type<Record<string, string>>()
    .notNull()
    .default({
      hero_pose: "hero",
      about_pose: "bust",
      tools_pose: "laptop",
      connect_pose: "standing",
      hero_asset_url: "/images/character/sai-hero.png",
      about_asset_url: "/images/character/sai-bust.png",
      tools_asset_url: "/images/character/sai-laptop.png",
      connect_asset_url: "/images/character/sai-standing.png",
    }),
  resumeUrl: text("resume_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 2. PROJECTS & CASE STUDIES (FLEXIBLE CONTENT MODEL)
// ==============================================================================
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    shortDescription: text("short_description").notNull(),
    content: text("content"),
    category: varchar("category", { length: 100 }).notNull(), // Flexible category model
    projectType: varchar("project_type", { length: 50 }).notNull().default("side-project"),
    role: text("role"),
    coverImage: text("cover_image"),
    galleryImages: jsonb("gallery_images").$type<string[]>().notNull().default([]),
    tools: jsonb("tools").$type<string[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    links: jsonb("links")
      .$type<{
        demo_url?: string | null;
        figma_url?: string | null;
        github_url?: string | null;
        [key: string]: string | null | undefined;
      }>()
      .notNull()
      .default({}),
    status: varchar("status", { length: 30 })
      .$type<"concept" | "in_progress" | "completed" | "archived">()
      .notNull()
      .default("concept"),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("projects_category_idx").on(table.category),
    index("projects_published_idx").on(table.isPublished, table.displayOrder),
    index("projects_featured_idx").on(table.isFeatured),
  ]
);

// ==============================================================================
// 3. CASE STUDY BLOCKS (MODULAR ORDERED SECTIONS)
// ==============================================================================
export const caseStudyBlocks = pgTable(
  "case_study_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    blockType: varchar("block_type", { length: 50 }).notNull(), // 'overview', 'problem', 'goals', 'research', 'user_flows', 'wireframes', 'final_ui', 'prototype', 'learnings', 'custom'
    heading: text("heading").notNull(),
    content: text("content"),
    mediaUrl: text("media_url"),
    mediaCaption: text("media_caption"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("case_study_blocks_project_order_idx").on(table.projectId, table.displayOrder),
  ]
);

// ==============================================================================
// 4. TOOL CATEGORIES & TOOLS (13 CONFIRMED WORKFLOW TOOLS)
// ==============================================================================
export const toolCategories = pgTable("tool_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tools = pgTable(
  "tools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => toolCategories.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    iconUrl: text("icon_url"),
    externalUrl: text("external_url"),
    displayOrder: integer("display_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tools_category_order_idx").on(table.categoryId, table.displayOrder),
    index("tools_visible_idx").on(table.isVisible, table.displayOrder),
  ]
);

// ==============================================================================
// 5. BLOG POSTS & BUILD LOGS (STARTING WITH ZERO POSTS)
// ==============================================================================
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverImage: text("cover_image"),
    category: varchar("category", { length: 50 }).notNull().default("build-log"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("posts_published_idx").on(table.isPublished, table.publishedAt),
  ]
);

// ==============================================================================
// 6. CLOUDINARY MEDIA ASSETS METADATA
// ==============================================================================
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicId: text("public_id").notNull().unique(), // Cloudinary public_id
    url: text("url").notNull(),
    secureUrl: text("secure_url").notNull(),
    format: varchar("format", { length: 20 }),
    width: integer("width"),
    height: integer("height"),
    bytes: integer("bytes"),
    resourceType: varchar("resource_type", { length: 20 }).notNull().default("image"), // 'image', 'raw', 'video'
    accessMode: varchar("access_mode", { length: 20 })
      .$type<"public" | "authenticated">()
      .notNull()
      .default("public"),
    altText: text("alt_text"),
    caption: text("caption"),
    folder: varchar("folder", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("media_assets_folder_idx").on(table.folder),
    index("media_assets_access_mode_idx").on(table.accessMode),
  ]
);

// ==============================================================================
// 7. RELATIONS
// ==============================================================================
export const projectsRelations = relations(projects, ({ many }) => ({
  caseStudyBlocks: many(caseStudyBlocks),
}));

export const caseStudyBlocksRelations = relations(caseStudyBlocks, ({ one }) => ({
  project: one(projects, {
    fields: [caseStudyBlocks.projectId],
    references: [projects.id],
  }),
}));

export const toolCategoriesRelations = relations(toolCategories, ({ many }) => ({
  tools: many(tools),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  category: one(toolCategories, {
    fields: [tools.categoryId],
    references: [toolCategories.id],
  }),
}));

// ==============================================================================
// TYPE INFERENCES (Drizzle schema types)
// ==============================================================================
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export type CaseStudyBlock = typeof caseStudyBlocks.$inferSelect;
export type InsertCaseStudyBlock = typeof caseStudyBlocks.$inferInsert;

export type ToolCategory = typeof toolCategories.$inferSelect;
export type InsertToolCategory = typeof toolCategories.$inferInsert;

export type Tool = typeof tools.$inferSelect;
export type InsertTool = typeof tools.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;
