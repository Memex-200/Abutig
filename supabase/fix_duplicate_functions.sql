-- Fix duplicate overloads of get_user_complaints
-- Run this in Supabase SQL editor

-- 1) Inspect existing overloads (for reference)
SELECT p.proname AS function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_args
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_complaints'
ORDER BY identity_args;

-- 2) Drop known duplicate overloads safely
DROP FUNCTION IF EXISTS public.get_user_complaints(uuid);
DROP FUNCTION IF EXISTS public.get_user_complaints(varchar, text);
DROP FUNCTION IF EXISTS public.get_user_complaints(character varying, text);

-- 3) Create a single canonical function (auth-scoped, unambiguous name)
-- Returns complaints for the currently authenticated user (citizen)
CREATE OR REPLACE FUNCTION public.get_user_complaints()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status complaint_status,
  created_at timestamptz,
  resolved_at timestamptz,
  location jsonb,
  type_name text,
  type_icon text,
  tracking_code text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.status,
    c.created_at,
    c.actual_resolution_date AS resolved_at,
    c.location,
    ct.name AS type_name,
    ct.icon AS type_icon,
    c.tracking_code
  FROM public.complaints c
  JOIN public.complaint_types ct ON c.type_id = ct.id
  JOIN public.users u ON u.id = c.citizen_id
  WHERE u.auth_user_id = auth.uid()
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Optional: provide an explicit-args alias to avoid future ambiguity
-- Uses the same logic but takes the user_id directly
CREATE OR REPLACE FUNCTION public.get_user_complaints_by_user_id(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status complaint_status,
  created_at timestamptz,
  resolved_at timestamptz,
  location jsonb,
  type_name text,
  type_icon text,
  tracking_code text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.status,
    c.created_at,
    c.actual_resolution_date AS resolved_at,
    c.location,
    ct.name AS type_name,
    ct.icon AS type_icon,
    c.tracking_code
  FROM public.complaints c
  JOIN public.complaint_types ct ON c.type_id = ct.id
  WHERE c.citizen_id = p_user_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
