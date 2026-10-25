"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertServerAdmin } from "@/lib/auth";
import type { Database } from "@/types/database.types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type CaseStudyBlockRow = Database["public"]["Tables"]["case_study_blocks"]["Row"];

/**
 * Helper to slugify a string if slug is not provided.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Server Action: Create a new project.
 * Enforces server-side administrator authorization and RLS.
 */
export async function createProjectAction(data: {
  title: string;
  slug?: string;
  category: string;
  short_description: string;
  content?: string;
  project_type?: string;
  role?: string;
  cover_image?: string;
  status?: "concept" | "in_progress" | "completed" | "archived";
  is_published?: boolean;
  is_featured?: boolean;
  display_order?: number;
  tools?: string[];
  tags?: string[];
  links?: {
    demo_url?: string | null;
    figma_url?: string | null;
    github_url?: string | null;
  };
}) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Could not initialize Supabase client.");

  const title = data.title.trim();
  if (!title) throw new Error("Project title is required.");

  const slug = (data.slug ? slugify(data.slug) : slugify(title)) || `project-${Date.now()}`;
  const category = (data.category || "ai-products").trim().toLowerCase();
  const short_description = (data.short_description || "").trim();
  if (!short_description) throw new Error("Short description is required.");

  const is_published = Boolean(data.is_published);

  const insertPayload: ProjectInsert = {
    title,
    slug,
    category,
    short_description,
    content: data.content ?? null,
    project_type: data.project_type || "side-project",
    role: data.role || null,
    cover_image: data.cover_image || null,
    status: data.status || "concept",
    is_published,
    is_featured: Boolean(data.is_featured),
    display_order: Number(data.display_order ?? 0),
    published_at: is_published ? new Date().toISOString() : null,
    tools: (data.tools ?? []) as unknown as Database["public"]["Tables"]["projects"]["Insert"]["tools"],
    tags: (data.tags ?? []) as unknown as Database["public"]["Tables"]["projects"]["Insert"]["tags"],
    links: {
      demo_url: data.links?.demo_url || null,
      figma_url: data.links?.figma_url || null,
      github_url: data.links?.github_url || null,
    } as unknown as Database["public"]["Tables"]["projects"]["Insert"]["links"],
  };

  const { data: inserted, error } = await supabase
    .from("projects")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("[createProjectAction] Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/");
  revalidatePath("/labs");

  return { success: true, project: inserted };
}

/**
 * Server Action: Update an existing project.
 */
export async function updateProjectAction(
  id: string,
  data: {
    title?: string;
    slug?: string;
    category?: string;
    short_description?: string;
    content?: string;
    project_type?: string;
    role?: string;
    cover_image?: string;
    status?: "concept" | "in_progress" | "completed" | "archived";
    is_published?: boolean;
    is_featured?: boolean;
    display_order?: number;
    tools?: string[];
    tags?: string[];
    links?: {
      demo_url?: string | null;
      figma_url?: string | null;
      github_url?: string | null;
    };
  }
) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Could not initialize Supabase client.");

  const updatePayload: ProjectUpdate = {};

  if (data.title !== undefined) updatePayload.title = data.title.trim();
  if (data.slug !== undefined) updatePayload.slug = slugify(data.slug);
  if (data.category !== undefined) updatePayload.category = data.category.trim().toLowerCase();
  if (data.short_description !== undefined) updatePayload.short_description = data.short_description.trim();
  if (data.content !== undefined) updatePayload.content = data.content;
  if (data.project_type !== undefined) updatePayload.project_type = data.project_type;
  if (data.role !== undefined) updatePayload.role = data.role;
  if (data.cover_image !== undefined) updatePayload.cover_image = data.cover_image;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.is_featured !== undefined) updatePayload.is_featured = data.is_featured;
  if (data.display_order !== undefined) updatePayload.display_order = Number(data.display_order);

  if (data.tools !== undefined) {
    updatePayload.tools = data.tools as unknown as Database["public"]["Tables"]["projects"]["Update"]["tools"];
  }
  if (data.tags !== undefined) {
    updatePayload.tags = data.tags as unknown as Database["public"]["Tables"]["projects"]["Update"]["tags"];
  }
  if (data.links !== undefined) {
    updatePayload.links = {
      demo_url: data.links.demo_url || null,
      figma_url: data.links.figma_url || null,
      github_url: data.links.github_url || null,
    } as unknown as Database["public"]["Tables"]["projects"]["Update"]["links"];
  }

  if (data.is_published !== undefined) {
    updatePayload.is_published = data.is_published;
    if (data.is_published) {
      updatePayload.published_at = new Date().toISOString();
    }
  }

  const { data: updated, error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateProjectAction] Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath(`/projects/${updated.slug}`);
  revalidatePath("/");
  revalidatePath("/labs");

  return { success: true, project: updated };
}

/**
 * Server Action: Quick toggle of publication status (Draft <-> Published).
 */
export async function toggleProjectPublishAction(id: string, is_published: boolean) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Could not initialize Supabase client.");

  const { data: updated, error } = await supabase
    .from("projects")
    .update({
      is_published,
      published_at: is_published ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("id, slug, is_published")
    .single();

  if (error) {
    console.error("[toggleProjectPublishAction] Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath(`/projects/${updated.slug}`);
  revalidatePath("/");
  revalidatePath("/labs");

  return { success: true, project: updated };
}

/**
 * Server Action: Delete project and its dependent case study blocks.
 */
export async function deleteProjectAction(id: string) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Could not initialize Supabase client.");

  // Delete project (Postgres CASCADE deletes associated case_study_blocks)
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("[deleteProjectAction] Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/");
  revalidatePath("/labs");

  return { success: true };
}

/**
 * Server Action: Create or update a case study block for a project.
 */
export async function upsertCaseStudyBlockAction(data: {
  id?: string;
  project_id: string;
  block_type: string;
  heading: string;
  content?: string;
  media_url?: string;
  media_caption?: string;
  display_order?: number;
}) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Could not initialize Supabase client.");

  if (!data.heading?.trim()) throw new Error("Block heading is required.");

  if (data.id) {
    // Update existing
    const { data: updated, error } = await supabase
      .from("case_study_blocks")
      .update({
        block_type: data.block_type || "overview",
        heading: data.heading.trim(),
        content: data.content ?? null,
        media_url: data.media_url ?? null,
        media_caption: data.media_caption ?? null,
        display_order: Number(data.display_order ?? 0),
      })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath(`/admin/projects/${data.project_id}`);
    return { success: true, block: updated };
  } else {
    // Insert new
    const { data: inserted, error } = await supabase
      .from("case_study_blocks")
      .insert({
        project_id: data.project_id,
        block_type: data.block_type || "overview",
        heading: data.heading.trim(),
        content: data.content ?? null,
        media_url: data.media_url ?? null,
        media_caption: data.media_caption ?? null,
        display_order: Number(data.display_order ?? 0),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath(`/admin/projects/${data.project_id}`);
    return { success: true, block: inserted };
  }
}

/**
 * Server Action: Delete a case study block.
 */
export async function deleteCaseStudyBlockAction(blockId: string, projectId: string) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Could not initialize Supabase client.");

  const { error } = await supabase.from("case_study_blocks").delete().eq("id", blockId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

/**
 * Server Action: Reorder case study blocks.
 */
export async function reorderCaseStudyBlocksAction(projectId: string, orderedIds: string[]) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Could not initialize Supabase client.");

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("case_study_blocks")
      .update({ display_order: i })
      .eq("id", orderedIds[i])
      .eq("project_id", projectId);
  }

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}
