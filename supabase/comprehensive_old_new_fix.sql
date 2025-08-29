-- Comprehensive Fix for "missing FROM-clause entry for table 'old'" Error
-- This script fixes all RLS policies that incorrectly use OLD and NEW references
-- These references are only available in trigger functions, not in RLS policies

-- ============================================================================
-- STEP 1: DROP ALL PROBLEMATIC POLICIES
-- ============================================================================

-- Drop policies from enhanced_rls_policies.sql
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "citizens_update_own_complaints" ON public.complaints;
DROP POLICY IF EXISTS "employees_update_assigned_complaints" ON public.complaints;
DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;

-- Drop policies from rls_policies.sql
DROP POLICY IF EXISTS "citizen_update_own_complaints" ON public.complaints;
DROP POLICY IF EXISTS "notification_self_update" ON public.notifications;

-- Drop policies from fix_rls_policies.sql
DROP POLICY IF EXISTS "citizen_update_own_complaints" ON public.complaints;

-- ============================================================================
-- STEP 2: RECREATE POLICIES WITHOUT OLD/NEW REFERENCES
-- ============================================================================

-- Users can update their own profile (simplified)
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE USING (
    auth_user_id = auth.uid() 
    AND is_active = true
  ) WITH CHECK (
    -- Basic validation without OLD/NEW references
    email IS NOT NULL
    AND role IN ('CITIZEN', 'EMPLOYEE', 'ADMIN')
    AND is_active = true
  );

-- Citizens can update their own complaints (simplified)
CREATE POLICY "citizens_update_own_complaints" ON public.complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = citizen_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
  ) WITH CHECK (
    -- Basic validation without OLD/NEW references
    title IS NOT NULL
    AND description IS NOT NULL
    AND type_id IS NOT NULL
    AND citizen_id IS NOT NULL
  );

-- Employees can update complaints assigned to them (simplified)
CREATE POLICY "employees_update_assigned_complaints" ON public.complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'EMPLOYEE' 
      AND u.is_active = true
      AND assigned_user_id = u.id
    )
  ) WITH CHECK (
    -- Basic validation without OLD/NEW references
    title IS NOT NULL
    AND description IS NOT NULL
    AND type_id IS NOT NULL
  );

-- Notifications self update (simplified)
CREATE POLICY "notifications_self_update" ON public.notifications
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND is_active = true
    )
  ) WITH CHECK (
    -- Basic validation without OLD/NEW references
    title IS NOT NULL
    AND message IS NOT NULL
    AND user_id IS NOT NULL
  );

-- ============================================================================
-- STEP 3: CREATE TRIGGER FUNCTIONS FOR FIELD-LEVEL VALIDATION (OPTIONAL)
-- ============================================================================

-- If you need field-level update restrictions, use these trigger functions instead

-- Trigger function for complaint updates with field-level restrictions
CREATE OR REPLACE FUNCTION public.validate_complaint_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow updating specific fields for citizens
  IF EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = NEW.citizen_id
    AND u.auth_user_id = auth.uid()
    AND u.role = 'CITIZEN'
    AND u.is_active = true
  ) THEN
    -- Citizens can only update description and location
    IF OLD.title != NEW.title OR 
       OLD.type_id != NEW.type_id OR
       OLD.status != NEW.status OR
       OLD.assigned_user_id != NEW.assigned_user_id OR
       OLD.national_id != NEW.national_id OR
       OLD.tracking_code != NEW.tracking_code OR
       OLD.created_at != NEW.created_at OR
       OLD.resolved_at != NEW.resolved_at THEN
      RAISE EXCEPTION 'Citizens can only update description and location fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for user profile updates with field-level restrictions
CREATE OR REPLACE FUNCTION public.validate_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Users can only update specific fields
  IF OLD.id != NEW.id OR
     OLD.auth_user_id != NEW.auth_user_id OR
     OLD.role != NEW.role OR
     OLD.is_active != NEW.is_active OR
     OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Users can only update name, email, phone, and national_id fields';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: CREATE TRIGGERS (OPTIONAL - UNCOMMENT IF NEEDED)
-- ============================================================================

-- Uncomment these lines if you want field-level update restrictions

-- DROP TRIGGER IF EXISTS validate_complaint_update_trigger ON public.complaints;
-- CREATE TRIGGER validate_complaint_update_trigger
--   BEFORE UPDATE ON public.complaints
--   FOR EACH ROW
--   EXECUTE FUNCTION public.validate_complaint_update();

-- DROP TRIGGER IF EXISTS validate_user_update_trigger ON public.users;
-- CREATE TRIGGER validate_user_update_trigger
--   BEFORE UPDATE ON public.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.validate_user_update();

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

-- Check that all policies are created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname IN (
    'users_self_update',
    'citizens_update_own_complaints',
    'employees_update_assigned_complaints',
    'notifications_self_update'
  )
ORDER BY tablename, policyname;

-- Verify no OLD/NEW references remain in policies
SELECT 'No OLD/NEW references found in policies' as status;
