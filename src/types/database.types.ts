// ==============================================================================
// Sai Dwarak Portfolio Platform — Supabase Database Types (Phase 2.3)
// Strongly typed schema definitions mirroring database migrations
// ==============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = "concept" | "in_progress" | "completed" | "archived";

export interface ProjectLinks {
  demo_url?: string | null;
  figma_url?: string | null;
  github_url?: string | null;
  [key: string]: string | null | undefined;
}

export interface AboutContent {
  philosophy?: string;
  background?: string;
  location?: string;
  open_to_work?: boolean;
  [key: string]: unknown;
}

export interface ContactLinks {
  email: string;
  linkedin: string;
  github: string;
  [key: string]: string;
}

export interface ThemeTokens {
  canvas: string;
  accent: string;
  ink: string;
  surface: string;
  border: string;
  [key: string]: string;
}

export interface SectionVisibility {
  ai_products: boolean;
  ux_ui_projects: boolean;
  tools: boolean;
  build_logs: boolean;
  about: boolean;
  contact: boolean;
  resume: boolean;
  [key: string]: boolean;
}

export interface CharacterSettings {
  hero_pose: string;
  about_pose: string;
  tools_pose: string;
  connect_pose: string;
  hero_asset_url?: string;
  about_asset_url?: string;
  tools_asset_url?: string;
  connect_asset_url?: string;
  [key: string]: string | undefined;
}

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          role: "admin" | "super_admin";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: "admin" | "super_admin";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: "admin" | "super_admin";
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          display_name: string;
          hero_headline: string;
          hero_intro: string;
          about_content: AboutContent;
          contact_links: ContactLinks;
          theme_tokens: ThemeTokens;
          section_visibility: SectionVisibility;
          character_settings: CharacterSettings;
          resume_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          display_name?: string;
          hero_headline?: string;
          hero_intro?: string;
          about_content?: AboutContent;
          contact_links?: ContactLinks;
          theme_tokens?: ThemeTokens;
          section_visibility?: SectionVisibility;
          character_settings?: CharacterSettings;
          resume_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          display_name?: string;
          hero_headline?: string;
          hero_intro?: string;
          about_content?: AboutContent;
          contact_links?: ContactLinks;
          theme_tokens?: ThemeTokens;
          section_visibility?: SectionVisibility;
          character_settings?: CharacterSettings;
          resume_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          short_description: string;
          content: string | null;
          category: string;
          project_type: string;
          role: string | null;
          cover_image: string | null;
          gallery_images: string[];
          tools: string[];
          tags: string[];
          links: ProjectLinks;
          status: ProjectStatus;
          is_published: boolean;
          is_featured: boolean;
          display_order: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          short_description: string;
          content?: string | null;
          category: string;
          project_type?: string;
          role?: string | null;
          cover_image?: string | null;
          gallery_images?: string[];
          tools?: string[];
          tags?: string[];
          links?: ProjectLinks;
          status?: ProjectStatus;
          is_published?: boolean;
          is_featured?: boolean;
          display_order?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          short_description?: string;
          content?: string | null;
          category?: string;
          project_type?: string;
          role?: string | null;
          cover_image?: string | null;
          gallery_images?: string[];
          tools?: string[];
          tags?: string[];
          links?: ProjectLinks;
          status?: ProjectStatus;
          is_published?: boolean;
          is_featured?: boolean;
          display_order?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      case_study_blocks: {
        Row: {
          id: string;
          project_id: string;
          block_type: string;
          heading: string;
          content: string | null;
          media_url: string | null;
          media_caption: string | null;
          metadata: Json;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          block_type: string;
          heading: string;
          content?: string | null;
          media_url?: string | null;
          media_caption?: string | null;
          metadata?: Json;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          block_type?: string;
          heading?: string;
          content?: string | null;
          media_url?: string | null;
          media_caption?: string | null;
          metadata?: Json;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_study_blocks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      tool_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          display_order: number;
          is_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          display_order?: number;
          is_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          display_order?: number;
          is_visible?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tools: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string;
          icon_url: string | null;
          external_url: string | null;
          display_order: number;
          is_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          description: string;
          icon_url?: string | null;
          external_url?: string | null;
          display_order?: number;
          is_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          description?: string;
          icon_url?: string | null;
          external_url?: string | null;
          display_order?: number;
          is_visible?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tools_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "tool_categories";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_image: string | null;
          category: string;
          tags: string[];
          is_published: boolean;
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          cover_image?: string | null;
          category?: string;
          tags?: string[];
          is_published?: boolean;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          bucket_id: string;
          storage_path: string;
          url: string;
          format: string | null;
          width: number | null;
          height: number | null;
          bytes: number | null;
          resource_type: string;
          access_mode: "public" | "private";
          alt_text: string | null;
          caption: string | null;
          folder: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bucket_id?: string;
          storage_path: string;
          url: string;
          format?: string | null;
          width?: number | null;
          height?: number | null;
          bytes?: number | null;
          resource_type?: string;
          access_mode?: "public" | "private";
          alt_text?: string | null;
          caption?: string | null;
          folder?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bucket_id?: string;
          storage_path?: string;
          url?: string;
          format?: string | null;
          width?: number | null;
          height?: number | null;
          bytes?: number | null;
          resource_type?: string;
          access_mode?: "public" | "private";
          alt_text?: string | null;
          caption?: string | null;
          folder?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience Type Aliases
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type InsertProject = Database["public"]["Tables"]["projects"]["Insert"];

export type CaseStudyBlock = Database["public"]["Tables"]["case_study_blocks"]["Row"];
export type InsertCaseStudyBlock = Database["public"]["Tables"]["case_study_blocks"]["Insert"];

export type ToolCategory = Database["public"]["Tables"]["tool_categories"]["Row"];
export type InsertToolCategory = Database["public"]["Tables"]["tool_categories"]["Insert"];

export type Tool = Database["public"]["Tables"]["tools"]["Row"];
export type InsertTool = Database["public"]["Tables"]["tools"]["Insert"];

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type InsertPost = Database["public"]["Tables"]["posts"]["Insert"];

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];
export type InsertSiteSettings = Database["public"]["Tables"]["site_settings"]["Insert"];

export type MediaAsset = Database["public"]["Tables"]["media_assets"]["Row"];
export type InsertMediaAsset = Database["public"]["Tables"]["media_assets"]["Insert"];

export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
