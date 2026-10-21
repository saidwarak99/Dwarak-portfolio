-- ==============================================================================
-- Migration: 20261021000001_initial_schema.sql
-- Description: Complete schema for Sai Dwarak Portfolio Platform (Phase 2.3)
-- Engine: Supabase PostgreSQL with Row Level Security (RLS) & Storage
-- ==============================================================================

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Automatic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. ADMINISTRATIVE AUTHORIZATION MODEL
-- ==============================================================================
-- Admin table mapping Supabase auth.users to administrative roles.
-- Protected strictly: no public or unprivileged user may insert or promote themselves.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_users IS 'Administrative credentials mapping auth.users to elevated roles. Managed only via database admin / service role.';

-- Hardened Security Definer function to check if the current user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own admin status directly
-- Uses user_id = auth.uid() to completely eliminate policy recursion during is_admin() checks
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin_users;
CREATE POLICY "Users can view their own admin record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- NOTE: No client-side INSERT/UPDATE/DELETE policy is granted for admin_users.
-- Modifications require service_role or DB admin via SQL.

-- ==============================================================================
-- 3. SITE SETTINGS (SINGLETON)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL DEFAULT 'Sai Dwarak',
  hero_headline TEXT NOT NULL DEFAULT 'UI/UX Designer & AI Product Builder',
  hero_intro TEXT NOT NULL DEFAULT 'I design thoughtful digital experiences and build AI-powered products. My work explores the intersection of UI/UX design, product thinking, prototyping, and artificial intelligence—from early concepts to functional prototypes.',
  about_content JSONB NOT NULL DEFAULT '{
    "philosophy": "Designing at the seams of craft and intelligence. I specialize in turning ambiguous concepts into functional prototypes and production-ready digital products.",
    "background": "With a strong focus on design systems, human-centered UI/UX, and generative AI interfaces, I build software that feels intuitive, responsive, and tactile.",
    "location": "Hyderabad, India",
    "open_to_work": true
  }'::jsonb,
  contact_links JSONB NOT NULL DEFAULT '{
    "email": "saidwarak99@gmail.com",
    "linkedin": "https://www.linkedin.com/in/sai-dwarak99/",
    "github": "https://github.com/saidwarak99"
  }'::jsonb,
  theme_tokens JSONB NOT NULL DEFAULT '{
    "canvas": "#FFF7F5",
    "accent": "#EC2929",
    "ink": "#230D10",
    "surface": "#F5D9D5",
    "border": "#E8CEC9"
  }'::jsonb,
  section_visibility JSONB NOT NULL DEFAULT '{
    "ai_products": true,
    "ux_ui_projects": true,
    "tools": true,
    "build_logs": true,
    "about": true,
    "contact": true,
    "resume": false
  }'::jsonb,
  character_settings JSONB NOT NULL DEFAULT '{
    "hero_pose": "hero",
    "about_pose": "bust",
    "tools_pose": "laptop",
    "connect_pose": "standing",
    "hero_asset_url": "/images/character/sai-hero.png",
    "about_asset_url": "/images/character/sai-bust.png",
    "tools_asset_url": "/images/character/sai-laptop.png",
    "connect_asset_url": "/images/character/sai-standing.png"
  }'::jsonb,
  resume_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.site_settings IS 'Singleton settings table holding public visual and editorial configuration.';

-- Trigger for site_settings updated_at
DROP TRIGGER IF EXISTS tr_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER tr_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed initial default singleton row
INSERT INTO public.site_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
CREATE POLICY "Public read site settings"
  ON public.site_settings
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admin manage site settings" ON public.site_settings;
CREATE POLICY "Admin manage site settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 4. PROJECTS & CASE STUDIES (FLEXIBLE CONTENT MODEL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  content TEXT, -- Detailed overview or markdown
  category TEXT NOT NULL, -- Flexible category model (e.g. 'ai-products', 'ux-ui', or future custom categories)
  project_type TEXT NOT NULL DEFAULT 'side-project',
  role TEXT,
  cover_image TEXT,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  links JSONB NOT NULL DEFAULT '{
    "demo_url": null,
    "figma_url": null,
    "github_url": null
  }'::jsonb,
  status TEXT NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'in_progress', 'completed', 'archived')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS 'Showcase projects and case studies with flexible categories, status, and metadata.';

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_published ON public.projects(is_published, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(is_featured) WHERE is_featured = true;

-- Trigger for projects updated_at
DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published projects" ON public.projects;
CREATE POLICY "Public read published projects"
  ON public.projects
  FOR SELECT
  TO public
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin manage all projects" ON public.projects;
CREATE POLICY "Admin manage all projects"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTE: Strictly ZERO projects seeded per Phase 2 constraints.

-- ==============================================================================
-- 5. MODULAR CASE STUDY CONTENT BLOCKS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.case_study_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- 'overview', 'problem', 'goals', 'research', 'user_flows', 'wireframes', 'final_ui', 'prototype', 'learnings', 'custom'
  heading TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_caption TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.case_study_blocks IS 'Modular, ordered content blocks for project deep-dives and design case studies.';

CREATE INDEX IF NOT EXISTS idx_case_study_blocks_project ON public.case_study_blocks(project_id, display_order ASC);

-- Trigger for case_study_blocks updated_at
DROP TRIGGER IF EXISTS tr_case_study_blocks_updated_at ON public.case_study_blocks;
CREATE TRIGGER tr_case_study_blocks_updated_at
  BEFORE UPDATE ON public.case_study_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS for case_study_blocks
ALTER TABLE public.case_study_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read case study blocks for published projects" ON public.case_study_blocks;
CREATE POLICY "Public read case study blocks for published projects"
  ON public.case_study_blocks
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = case_study_blocks.project_id
        AND projects.is_published = true
    )
  );

DROP POLICY IF EXISTS "Admin manage case study blocks" ON public.case_study_blocks;
CREATE POLICY "Admin manage case study blocks"
  ON public.case_study_blocks
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 6. TOOL CATEGORIES & TOOLS (CONFIRMED 13 WORKFLOW TOOLS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tool_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.tool_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  external_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tool_categories IS 'Workflow tool categories (Design & Systems, Frontend, AI, Prototyping).';
COMMENT ON TABLE public.tools IS 'Curated list of 13 verified tools used by Sai Dwarak in daily workflows.';

CREATE INDEX IF NOT EXISTS idx_tools_category ON public.tools(category_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_tools_visible ON public.tools(is_visible, display_order ASC);

-- RLS for tool categories & tools
ALTER TABLE public.tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visible tool categories" ON public.tool_categories;
CREATE POLICY "Public read visible tool categories"
  ON public.tool_categories
  FOR SELECT
  TO public
  USING (is_visible = true);

DROP POLICY IF EXISTS "Admin manage tool categories" ON public.tool_categories;
CREATE POLICY "Admin manage tool categories"
  ON public.tool_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read visible tools" ON public.tools;
CREATE POLICY "Public read visible tools"
  ON public.tools
  FOR SELECT
  TO public
  USING (is_visible = true);

DROP POLICY IF EXISTS "Admin manage tools" ON public.tools;
CREATE POLICY "Admin manage tools"
  ON public.tools
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed confirmed tool categories
INSERT INTO public.tool_categories (id, name, slug, display_order, is_visible)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Design & Systems', 'design-systems', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Frontend Architecture', 'frontend-architecture', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'AI & Generative Tooling', 'ai-generative-tooling', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Prototyping & Workflow', 'prototyping-workflow', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed ONLY the 13 confirmed tools currently in Sai Dwarak workflow
INSERT INTO public.tools (category_id, name, description, display_order, is_visible)
VALUES
  -- Category 1: Design & Systems
  ('c1000000-0000-0000-0000-000000000001', 'Figma', 'Primary vector canvas, auto-layout design systems, UI components, and high-fidelity product prototyping.', 1, true),
  ('c1000000-0000-0000-0000-000000000001', 'Framer', 'Interactive web design, responsive layout canvas, and production micro-animations.', 2, true),
  ('c1000000-0000-0000-0000-000000000001', 'Tailwind CSS', 'Utility-first modern styling engine for rapid design-system token implementation.', 3, true),

  -- Category 2: Frontend Architecture
  ('c1000000-0000-0000-0000-000000000002', 'Next.js', 'App Router, SSR, Turbopack, and high-performance React application foundation.', 4, true),
  ('c1000000-0000-0000-0000-000000000002', 'TypeScript', 'Strict type systems, predictable component contracts, and robust state safety.', 5, true),
  ('c1000000-0000-0000-0000-000000000002', 'React', 'Component architecture, declarative UI primitives, and modern hook state flows.', 6, true),

  -- Category 3: AI & Generative Tooling
  ('c1000000-0000-0000-0000-000000000003', 'Claude', 'Reasoning partner for architecture decisions, prompt design, and iterative product framing.', 7, true),
  ('c1000000-0000-0000-0000-000000000003', 'Cursor', 'AI-augmented IDE for rapid development, code refactoring, and agentic workflows.', 8, true),
  ('c1000000-0000-0000-0000-000000000003', 'GitHub Copilot', 'Context-aware code completion, snippet acceleration, and test scaffolding.', 9, true),
  ('c1000000-0000-0000-0000-000000000003', 'Midjourney', 'Visual exploration, concept art direction, texture generation, and mood boarding.', 10, true),
  ('c1000000-0000-0000-0000-000000000003', 'OpenAI API', 'Structured outputs, function calling, embeddings, and generative product logic.', 11, true),

  -- Category 4: Prototyping & Workflow
  ('c1000000-0000-0000-0000-000000000004', 'v0 by Vercel', 'Generative component prototyping, rapid visual iteration, and layout exploration.', 12, true),
  ('c1000000-0000-0000-0000-000000000004', 'Supabase', 'Postgres backend, Row Level Security, authentication, and structured cloud storage.', 13, true);

-- ==============================================================================
-- 7. BLOG POSTS & BUILD LOGS (STARTING WITH ZERO POSTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'build-log',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.posts IS 'Articles, build logs, and design engineering writeups. Zero seeded at launch.';

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(is_published, published_at DESC);

-- Trigger for posts updated_at
DROP TRIGGER IF EXISTS tr_posts_updated_at ON public.posts;
CREATE TRIGGER tr_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published posts" ON public.posts;
CREATE POLICY "Public read published posts"
  ON public.posts
  FOR SELECT
  TO public
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin manage all posts" ON public.posts;
CREATE POLICY "Admin manage all posts"
  ON public.posts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTE: Strictly ZERO posts seeded per user constraints.

-- ==============================================================================
-- 8. MEDIA ASSETS METADATA (SUPABASE STORAGE TRACKING)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL DEFAULT 'portfolio-public',
  storage_path TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  format TEXT,
  width INTEGER,
  height INTEGER,
  bytes INTEGER,
  resource_type TEXT NOT NULL DEFAULT 'image',
  access_mode TEXT NOT NULL DEFAULT 'public' CHECK (access_mode IN ('public', 'private')),
  alt_text TEXT,
  caption TEXT,
  folder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.media_assets IS 'Metadata tracking table for assets stored in Supabase Storage buckets.';

CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON public.media_assets(folder);
CREATE INDEX IF NOT EXISTS idx_media_assets_access_mode ON public.media_assets(access_mode);

-- Trigger for media_assets updated_at
DROP TRIGGER IF EXISTS tr_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER tr_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS for media_assets
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read public media assets" ON public.media_assets;
CREATE POLICY "Public read public media assets"
  ON public.media_assets
  FOR SELECT
  TO public
  USING (access_mode = 'public');

DROP POLICY IF EXISTS "Admin manage media assets" ON public.media_assets;
CREATE POLICY "Admin manage media assets"
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 9. SUPABASE STORAGE BUCKETS & OBJECT POLICIES
-- ==============================================================================
-- 1. Create Public Assets Bucket ('portfolio-public')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-public',
  'portfolio-public',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];

-- 2. Create Private Assets Bucket ('portfolio-private')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-private',
  'portfolio-private',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

-- Storage Object Policies
-- Public Bucket: Anyone can read
DROP POLICY IF EXISTS "Public Read Portfolio Public" ON storage.objects;
CREATE POLICY "Public Read Portfolio Public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'portfolio-public');

-- Public Bucket: Only admin can insert
DROP POLICY IF EXISTS "Admin Insert Portfolio Public" ON storage.objects;
CREATE POLICY "Admin Insert Portfolio Public"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-public' 
    AND public.is_admin()
  );

-- Public Bucket: Only admin can update
DROP POLICY IF EXISTS "Admin Update Portfolio Public" ON storage.objects;
CREATE POLICY "Admin Update Portfolio Public"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio-public' 
    AND public.is_admin()
  );

-- Public Bucket: Only admin can delete
DROP POLICY IF EXISTS "Admin Delete Portfolio Public" ON storage.objects;
CREATE POLICY "Admin Delete Portfolio Public"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio-public' 
    AND public.is_admin()
  );

-- Private Bucket: Only admin can select, insert, update, delete
DROP POLICY IF EXISTS "Admin Full Access Portfolio Private" ON storage.objects;
CREATE POLICY "Admin Full Access Portfolio Private"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'portfolio-private' 
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'portfolio-private' 
    AND public.is_admin()
  );
