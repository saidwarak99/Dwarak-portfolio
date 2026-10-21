-- ==============================================================================
-- Migration: 20261021000002_harden_is_admin_search_path.sql
-- Description: Harden public.is_admin() with empty search_path and explicit schema qualification
-- Reference: PostgreSQL Security Definer best practice & Supabase Security Advisory
-- ==============================================================================

-- 1. Recreate public.is_admin() with empty search_path
-- All identifiers are explicitly qualified with their schema ('public', 'auth', 'pg_catalog')
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

-- 2. Explicitly comment on the function explaining the security model
COMMENT ON FUNCTION public.is_admin() IS 
  'Evaluates whether the current request user is an authorized administrator. Hardened with empty search_path and SECURITY DEFINER.';

-- 3. Manage EXECUTE permissions
-- Revoke broad PUBLIC execute and grant explicitly to authenticated and anon roles.
-- This ensures RLS policies on tables and storage objects calling public.is_admin()
-- execute without permission errors while preserving strict function privileges.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
