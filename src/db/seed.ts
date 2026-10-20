// ==============================================================================
// Database Seed Script for Neon PostgreSQL (Phase 2.2)
// Seeds ONLY verified site settings and the 13 confirmed workflow tools.
// Strictly ZERO projects or posts are seeded.
// Run with: npx tsx src/db/seed.ts
// ==============================================================================
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import * as schema from "./schema";
import {
  DEFAULT_SITE_SETTINGS,
  DEFAULT_TOOL_CATEGORIES,
  DEFAULT_TOOLS,
} from "./queries";

dotenv.config({ path: ".env.local" });

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("ep-xyz")) {
    console.error("Error: Valid DATABASE_URL not found in .env.local.");
    process.exit(1);
  }

  console.log("Connecting to Neon PostgreSQL...");
  const sql = neon(url);
  const db = drizzle(sql, { schema });

  console.log("1. Seeding site_settings singleton...");
  await db
    .insert(schema.siteSettings)
    .values({
      id: 1,
      displayName: DEFAULT_SITE_SETTINGS.displayName,
      heroHeadline: DEFAULT_SITE_SETTINGS.heroHeadline,
      heroIntro: DEFAULT_SITE_SETTINGS.heroIntro,
      aboutContent: DEFAULT_SITE_SETTINGS.aboutContent,
      contactLinks: DEFAULT_SITE_SETTINGS.contactLinks,
      themeTokens: DEFAULT_SITE_SETTINGS.themeTokens,
      sectionVisibility: DEFAULT_SITE_SETTINGS.sectionVisibility,
      characterSettings: DEFAULT_SITE_SETTINGS.characterSettings,
      resumeUrl: null,
    })
    .onConflictDoNothing();

  console.log("2. Seeding tool categories...");
  for (const cat of DEFAULT_TOOL_CATEGORIES) {
    await db
      .insert(schema.toolCategories)
      .values({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        displayOrder: cat.displayOrder,
        isVisible: cat.isVisible,
      })
      .onConflictDoNothing();
  }

  console.log("3. Seeding confirmed 13 workflow tools...");
  for (const tool of DEFAULT_TOOLS) {
    await db
      .insert(schema.tools)
      .values({
        categoryId: tool.categoryId,
        name: tool.name,
        description: tool.description,
        iconUrl: tool.iconUrl,
        externalUrl: tool.externalUrl,
        displayOrder: tool.displayOrder,
        isVisible: tool.isVisible,
      })
      .onConflictDoNothing();
  }

  console.log("\n[SEED COMPLETE]");
  console.log("• Site settings initialized.");
  console.log("• 4 tool categories and 13 confirmed tools seeded.");
  console.log("• Projects table: 0 rows (Empty state preserved).");
  console.log("• Posts table: 0 rows (Empty state preserved).");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
