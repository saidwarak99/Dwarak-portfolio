"use server";

import { revalidatePath } from "next/cache";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ToolUpdate = Database["public"]["Tables"]["tools"]["Update"];
type CategoryUpdate = Database["public"]["Tables"]["tool_categories"]["Update"];

export interface ToolInput {
  name: string;
  description: string;
  category_id?: string | null;
  icon_url?: string | null;
  external_url?: string | null;
  display_order?: number;
  is_visible?: boolean;
}

export interface ToolCategoryInput {
  name: string;
  slug: string;
  display_order?: number;
  is_visible?: boolean;
}

/**
 * Create a new workflow tool (Admin only)
 */
export async function createToolAction(input: ToolInput) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  if (!input.name?.trim()) throw new Error("Tool name is required.");
  if (!input.description?.trim()) throw new Error("Tool description is required.");

  const { data, error } = await supabase
    .from("tools")
    .insert({
      name: input.name.trim(),
      description: input.description.trim(),
      category_id: input.category_id || null,
      icon_url: input.icon_url?.trim() || null,
      external_url: input.external_url?.trim() || null,
      display_order: input.display_order ?? 0,
      is_visible: input.is_visible ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create tool: ${error.message}`);
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true, tool: data };
}

/**
 * Update an existing workflow tool (Admin only)
 */
export async function updateToolAction(id: string, input: Partial<ToolInput>) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  const updatePayload: ToolUpdate = {};
  if (input.name !== undefined) updatePayload.name = input.name.trim();
  if (input.description !== undefined) updatePayload.description = input.description.trim();
  if (input.category_id !== undefined) updatePayload.category_id = input.category_id || null;
  if (input.icon_url !== undefined) updatePayload.icon_url = input.icon_url?.trim() || null;
  if (input.external_url !== undefined) updatePayload.external_url = input.external_url?.trim() || null;
  if (input.display_order !== undefined) updatePayload.display_order = input.display_order;
  if (input.is_visible !== undefined) updatePayload.is_visible = input.is_visible;

  const { data, error } = await supabase
    .from("tools")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tool: ${error.message}`);
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true, tool: data };
}

/**
 * Toggle tool visibility (Admin only)
 */
export async function toggleToolVisibilityAction(id: string, isVisible: boolean) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  const { data, error } = await supabase
    .from("tools")
    .update({ is_visible: isVisible })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to toggle tool visibility: ${error.message}`);
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true, tool: data };
}

/**
 * Delete a workflow tool (Admin only)
 */
export async function deleteToolAction(id: string) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  const { error } = await supabase.from("tools").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete tool: ${error.message}`);
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true };
}

/**
 * Reorder tools (Admin only)
 */
export async function reorderToolsAction(toolIds: string[]) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  for (let i = 0; i < toolIds.length; i++) {
    const { error } = await supabase
      .from("tools")
      .update({ display_order: i })
      .eq("id", toolIds[i]);

    if (error) {
      throw new Error(`Failed to reorder tools: ${error.message}`);
    }
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true };
}

// ==============================================================================
// CATEGORY ACTIONS
// ==============================================================================

/**
 * Create a new tool category (Admin only)
 */
export async function createCategoryAction(input: ToolCategoryInput) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  if (!input.name?.trim()) throw new Error("Category name is required.");
  if (!input.slug?.trim()) throw new Error("Category slug is required.");

  const { data, error } = await supabase
    .from("tool_categories")
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase().replace(/[\s_]+/g, "-"),
      display_order: input.display_order ?? 0,
      is_visible: input.is_visible ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true, category: data };
}

/**
 * Update an existing tool category (Admin only)
 */
export async function updateCategoryAction(id: string, input: Partial<ToolCategoryInput>) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  const updatePayload: CategoryUpdate = {};
  if (input.name !== undefined) updatePayload.name = input.name.trim();
  if (input.slug !== undefined) updatePayload.slug = input.slug.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (input.display_order !== undefined) updatePayload.display_order = input.display_order;
  if (input.is_visible !== undefined) updatePayload.is_visible = input.is_visible;

  const { data, error } = await supabase
    .from("tool_categories")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true, category: data };
}

/**
 * Delete a tool category (Admin only)
 * Note: Database schema specifies ON DELETE SET NULL on tools.category_id,
 * so child tools will become unassigned rather than deleted.
 */
export async function deleteCategoryAction(id: string) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  const { error } = await supabase.from("tool_categories").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true };
}

/**
 * Reorder categories (Admin only)
 */
export async function reorderCategoriesAction(categoryIds: string[]) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  for (let i = 0; i < categoryIds.length; i++) {
    const { error } = await supabase
      .from("tool_categories")
      .update({ display_order: i })
      .eq("id", categoryIds[i]);

    if (error) {
      throw new Error(`Failed to reorder categories: ${error.message}`);
    }
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
  return { success: true };
}
