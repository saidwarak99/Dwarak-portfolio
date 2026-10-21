-- ==============================================================================
-- Migration: 20261021000002_harden_is_admin_search_path.sql
-- Description: Move is_admin() to isolated 'private' schema, set search_path = '',
--              restrict EXECUTE to authenticated role only, and update all RLS & Storage policies.
-- ==============================================================================

-- 1. CREATE PRIVATE SCHEMA (ISOLATED FROM POSTGREST DATA API)
CREATE SCHEMA IF NOT EXISTS private;

-- Restrict schema usage strictly: never exposed to public or anon
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;

-- 2. CREATE FUNCTION IN PRIVATE SCHEMA WITH EMPTY SEARCH_PATH
CREATE OR REPLACE FUNCTION private.is_admin()
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

COMMENT ON FUNCTION private.is_admin() IS 
  'Internal security definer function verifying admin privileges. Housed in private schema with empty search_path, inaccessible via PostgREST Data API.';

-- Restrict function execution strictly: authenticated only
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- 3. UPDATE DATABASE TABLE RLS POLICIES TO USE private.is_admin()

-- Table: public.site_settings
DROP POLICY IF EXISTS "Admin manage site settings" ON public.site_settings;
CREATE POLICY "Admin manage site settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Table: public.projects
DROP POLICY IF EXISTS "Admin manage all projects" ON public.projects;
CREATE POLICY "Admin manage all projects"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Table: public.case_study_blocks
DROP POLICY IF EXISTS "Admin manage case study blocks" ON public.case_study_blocks;
CREATE POLICY "Admin manage case study blocks"
  ON public.case_study_blocks
  FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Table: public.tool_categories
DROP POLICY IF EXISTS "Admin manage tool categories" ON public.tool_categories;
CREATE POLICY "Admin manage tool categories"
  ON public.tool_categories
  FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Table: public.tools
DROP POLICY IF EXISTS "Admin manage tools" ON public.tools;
CREATE POLICY "Admin manage tools"
  ON public.tools
  FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Table: public.posts
DROP POLICY IF EXISTS "Admin manage all posts" ON public.posts;
CREATE POLICY "Admin manage all posts"
  ON public.posts
  FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Table: public.media_assets
DROP POLICY IF EXISTS "Admin manage media assets" ON public.media_assets;
CREATE POLICY "Admin manage media assets"
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- 4. UPDATE STORAGE OBJECT POLICIES TO USE private.is_admin()

-- Public Bucket: Insert
DROP POLICY IF EXISTS "Admin Insert Portfolio Public" ON storage.objects;
CREATE POLICY "Admin Insert Portfolio Public"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-public' 
    AND private.is_admin()
  );

-- Public Bucket: Update
DROP POLICY IF EXISTS "Admin Update Portfolio Public" ON storage.objects;
CREATE POLICY "Admin Update Portfolio Public"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio-public' 
    AND private.is_admin()
  );

-- Public Bucket: Delete
DROP POLICY IF EXISTS "Admin Delete Portfolio Public" ON storage.objects;
CREATE POLICY "Admin Delete Portfolio Public"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio-public' 
    AND private.is_admin()
  );

-- Private Bucket: All Operations
DROP POLICY IF EXISTS "Admin Full Access Portfolio Private" ON storage.objects;
CREATE POLICY "Admin Full Access Portfolio Private"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'portfolio-private' 
    AND private.is_admin()
  )
  WITH CHECK (
    bucket_id = 'portfolio-private' 
    AND private.is_admin()
  );

-- 5. REMOVE DEPRECATED public.is_admin() FUNCTION
-- Safe to drop now that all dependent policies reference private.is_admin()
DROP FUNCTION IF EXISTS public.is_admin();
