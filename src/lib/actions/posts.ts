"use server";

import { revalidatePath } from "next/cache";
import { assertServerAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

export interface PostInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  category?: string;
  tags?: string[];
  is_published?: boolean;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

/**
 * Create a new blog post / build log (Admin only)
 */
export async function createPostAction(input: PostInput) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  if (!input.title?.trim()) throw new Error("Post title is required.");
  if (!input.slug?.trim()) throw new Error("URL slug is required.");
  if (!input.content?.trim()) throw new Error("Post content is required.");

  const cleanSlug = input.slug.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");

  // Check duplicate slug
  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (existing) {
    throw new Error(`A post with slug "${cleanSlug}" already exists. Please choose a unique slug.`);
  }

  const publishedAt = input.is_published
    ? input.published_at || new Date().toISOString()
    : null;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: input.title.trim(),
      slug: cleanSlug,
      excerpt: input.excerpt?.trim() || null,
      content: input.content.trim(),
      cover_image: input.cover_image?.trim() || null,
      category: input.category?.trim() || "build-log",
      tags: (Array.isArray(input.tags) ? input.tags : []) as unknown as Database["public"]["Tables"]["posts"]["Insert"]["tags"],
      is_published: Boolean(input.is_published),
      published_at: publishedAt,
      seo_title: input.seo_title?.trim() || null,
      seo_description: input.seo_description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/labs");
  revalidatePath(`/labs/${cleanSlug}`);
  revalidatePath("/");
  return { success: true, post: data };
}

/**
 * Update an existing blog post / build log (Admin only)
 */
export async function updatePostAction(id: string, input: Partial<PostInput>) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  const updatePayload: PostUpdate = {};

  if (input.title !== undefined) {
    if (!input.title.trim()) throw new Error("Post title cannot be empty.");
    updatePayload.title = input.title.trim();
  }

  if (input.slug !== undefined) {
    const cleanSlug = input.slug.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
    if (!cleanSlug) throw new Error("URL slug cannot be empty.");

    // Check duplicate slug excluding current post
    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", cleanSlug)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      throw new Error(`Another post with slug "${cleanSlug}" already exists. Please choose a unique slug.`);
    }
    updatePayload.slug = cleanSlug;
  }

  if (input.content !== undefined) {
    if (!input.content.trim()) throw new Error("Post content cannot be empty.");
    updatePayload.content = input.content.trim();
  }

  if (input.excerpt !== undefined) updatePayload.excerpt = input.excerpt?.trim() || null;
  if (input.cover_image !== undefined) updatePayload.cover_image = input.cover_image?.trim() || null;
  if (input.category !== undefined) updatePayload.category = input.category.trim() || "build-log";
  if (input.tags !== undefined) {
    updatePayload.tags = (Array.isArray(input.tags) ? input.tags : []) as unknown as Database["public"]["Tables"]["posts"]["Update"]["tags"];
  }
  if (input.seo_title !== undefined) updatePayload.seo_title = input.seo_title?.trim() || null;
  if (input.seo_description !== undefined) updatePayload.seo_description = input.seo_description?.trim() || null;

  if (input.is_published !== undefined) {
    updatePayload.is_published = input.is_published;
    if (input.is_published) {
      updatePayload.published_at = input.published_at || new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}`);
  revalidatePath("/labs");
  if (data?.slug) {
    revalidatePath(`/labs/${data.slug}`);
  }
  revalidatePath("/");
  return { success: true, post: data };
}

/**
 * Quick toggle publish state for a post (Admin only)
 */
export async function togglePostPublishAction(id: string, isPublished: boolean) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  const updateData: PostUpdate = {
    is_published: isPublished,
  };
  if (isPublished) {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to toggle post publish state: ${error.message}`);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/labs");
  if (data?.slug) {
    revalidatePath(`/labs/${data.slug}`);
  }
  revalidatePath("/");
  return { success: true, post: data };
}

/**
 * Delete a post (Admin only)
 */
export async function deletePostAction(id: string) {
  await assertServerAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Database client unconfigured.");

  // Fetch slug before deletion for revalidation
  const { data: post } = await supabase.from("posts").select("slug").eq("id", id).single();

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/labs");
  if (post?.slug) {
    revalidatePath(`/labs/${post.slug}`);
  }
  revalidatePath("/");
  return { success: true };
}
