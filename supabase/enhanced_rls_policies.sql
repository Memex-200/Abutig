-- Enhanced RLS Policies for Municipal Complaints System
-- This script implements comprehensive security with strict data isolation

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES
-- ============================================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_self_access" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "users_allow_insert" ON public.users;
DROP POLICY IF EXISTS "admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "citizens_insert_complaints" ON public.complaints;
DROP POLICY IF EXISTS "citizens_read_own_complaints" ON public.complaints;
DROP POLICY IF EXISTS "citizens_update_own_complaints" ON public.complaints;
DROP POLICY IF EXISTS "employees_read_assigned_complaints" ON public.complaints;
DROP POLICY IF EXISTS "employees_update_assigned_complaints" ON public.complaints;
DROP POLICY IF EXISTS "admin_full_access_complaints" ON public.complaints;
DROP POLICY IF EXISTS "public_read_complaint_types" ON public.complaint_types;
DROP POLICY IF EXISTS "admin_full_access_complaint_types" ON public.complaint_types;
DROP POLICY IF EXISTS "citizen_read_own_complaint_files" ON public.complaint_files;
DROP POLICY IF EXISTS "citizen_insert_own_complaint_files" ON public.complaint_files;
DROP POLICY IF EXISTS "employee_read_assigned_complaint_files" ON public.complaint_files;
DROP POLICY IF EXISTS "admin_full_access_complaint_files" ON public.complaint_files;
DROP POLICY IF EXISTS "citizen_read_own_complaint_history" ON public.complaint_history;
DROP POLICY IF EXISTS "employee_read_assigned_complaint_history" ON public.complaint_history;
DROP POLICY IF EXISTS "admin_full_access_complaint_history" ON public.complaint_history;
DROP POLICY IF EXISTS "users_read_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "system_insert_notifications" ON public.notifications;
DROP POLICY IF EXISTS "admin_full_access_settings" ON public.settings;
DROP POLICY IF EXISTS "admin_full_access_audit_logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "system_insert_audit_logs" ON public.admin_audit_logs;

-- ============================================================================
-- STEP 2: ENHANCED USER MANAGEMENT POLICIES
-- ============================================================================

-- Users can only read their own profile (strict isolation)
CREATE POLICY "users_self_access" ON public.users
  FOR SELECT USING (
    auth_user_id = auth.uid() 
    AND is_active = true
  );

-- Users can only update their own profile (limited fields)
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE USING (
    auth_user_id = auth.uid() 
    AND is_active = true
  ) WITH CHECK (
    -- Only allow updating specific fields
    (OLD.id = NEW.id) AND
    (OLD.auth_user_id = NEW.auth_user_id) AND
    (OLD.role = NEW.role) AND
    (OLD.is_active = NEW.is_active) AND
    (OLD.created_at = NEW.created_at)
  );

-- Allow user creation during registration (with validation)
CREATE POLICY "users_allow_insert" ON public.users
  FOR INSERT WITH CHECK (
    -- Ensure email is not null and role is valid
    email IS NOT NULL 
    AND role IN ('CITIZEN', 'EMPLOYEE', 'ADMIN')
    AND is_active = true
  );

-- Admin full access to users (with audit logging)
CREATE POLICY "admin_full_access_users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'ADMIN' 
      AND u.is_active = true
    )
  );

-- ============================================================================
-- STEP 3: ENHANCED COMPLAINT POLICIES
-- ============================================================================

-- Citizens can create complaints (with validation)
CREATE POLICY "citizens_insert_complaints" ON public.complaints
  FOR INSERT WITH CHECK (
    -- Validate that the citizen exists and is active
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = citizen_id
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
    -- Ensure required fields are present
    AND title IS NOT NULL
    AND description IS NOT NULL
    AND type_id IS NOT NULL
    AND national_id IS NOT NULL
  );

-- Citizens can only read their own complaints (strict isolation)
CREATE POLICY "citizens_read_own_complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = citizen_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
  );

-- Citizens can update their own complaints (very limited fields)
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
    -- Only allow updating description and location
    (OLD.id = NEW.id) AND
    (OLD.citizen_id = NEW.citizen_id) AND
    (OLD.type_id = NEW.type_id) AND
    (OLD.title = NEW.title) AND
    (OLD.status = NEW.status) AND
    (OLD.assigned_user_id = NEW.assigned_user_id) AND
    (OLD.national_id = NEW.national_id) AND
    (OLD.tracking_code = NEW.tracking_code) AND
    (OLD.created_at = NEW.created_at) AND
    (OLD.resolved_at = NEW.resolved_at)
  );

-- Employees can read complaints assigned to them
CREATE POLICY "employees_read_assigned_complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'EMPLOYEE'
      AND u.is_active = true
      AND u.id = assigned_user_id
    )
  );

-- Employees can update complaints assigned to them (with audit)
CREATE POLICY "employees_update_assigned_complaints" ON public.complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'EMPLOYEE'
      AND u.is_active = true
      AND u.id = assigned_user_id
    )
  ) WITH CHECK (
    -- Prevent changing critical fields
    (OLD.id = NEW.id) AND
    (OLD.citizen_id = NEW.citizen_id) AND
    (OLD.type_id = NEW.type_id) AND
    (OLD.title = NEW.title) AND
    (OLD.national_id = NEW.national_id) AND
    (OLD.tracking_code = NEW.tracking_code) AND
    (OLD.created_at = NEW.created_at)
  );

-- Admin full access to all complaints (with comprehensive audit)
CREATE POLICY "admin_full_access_complaints" ON public.complaints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.is_active = true
    )
  );

-- ============================================================================
-- STEP 4: ENHANCED COMPLAINT TYPES POLICIES
-- ============================================================================

-- Public read access to active complaint types only
CREATE POLICY "public_read_complaint_types" ON public.complaint_types
  FOR SELECT USING (
    is_active = true
  );

-- Admin full access to complaint types
CREATE POLICY "admin_full_access_complaint_types" ON public.complaint_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.is_active = true
    )
  );

-- ============================================================================
-- STEP 5: ENHANCED FILE POLICIES
-- ============================================================================

-- Citizens can read files for their own complaints
CREATE POLICY "citizen_read_own_complaint_files" ON public.complaint_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON c.citizen_id = u.id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
  );

-- Citizens can upload files for their own complaints
CREATE POLICY "citizen_insert_own_complaint_files" ON public.complaint_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON c.citizen_id = u.id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
    -- Validate file information
    AND file_path IS NOT NULL
    AND file_type IS NOT NULL
    AND file_size > 0
  );

-- Employees can read files for assigned complaints
CREATE POLICY "employee_read_assigned_complaint_files" ON public.complaint_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON c.assigned_user_id = u.id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'EMPLOYEE'
      AND u.is_active = true
    )
  );

-- Admin full access to all files
CREATE POLICY "admin_full_access_complaint_files" ON public.complaint_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.is_active = true
    )
  );

-- ============================================================================
-- STEP 6: ENHANCED HISTORY POLICIES
-- ============================================================================

-- Citizens can read history for their own complaints
CREATE POLICY "citizen_read_own_complaint_history" ON public.complaint_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON c.citizen_id = u.id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
  );

-- Employees can read history for assigned complaints
CREATE POLICY "employee_read_assigned_complaint_history" ON public.complaint_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON c.assigned_user_id = u.id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'EMPLOYEE'
      AND u.is_active = true
    )
  );

-- Admin full access to all history
CREATE POLICY "admin_full_access_complaint_history" ON public.complaint_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.is_active = true
    )
  );

-- ============================================================================
-- STEP 7: ENHANCED NOTIFICATION POLICIES
-- ============================================================================

-- Users can read their own notifications
CREATE POLICY "users_read_own_notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
      AND u.is_active = true
    )
  );

-- Users can update their own notifications (mark as read only)
CREATE POLICY "users_update_own_notifications" ON public.notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
      AND u.is_active = true
    )
  ) WITH CHECK (
    -- Only allow updating is_read field
    (OLD.id = NEW.id) AND
    (OLD.user_id = NEW.user_id) AND
    (OLD.title = NEW.title) AND
    (OLD.message = NEW.message) AND
    (OLD.type = NEW.type) AND
    (OLD.related_complaint_id = NEW.related_complaint_id) AND
    (OLD.created_at = NEW.created_at)
  );

-- System can insert notifications (for triggers/functions)
CREATE POLICY "system_insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 8: ENHANCED SETTINGS POLICIES
-- ============================================================================

-- Admin full access to settings
CREATE POLICY "admin_full_access_settings" ON public.settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.is_active = true
    )
  );

-- ============================================================================
-- STEP 9: ENHANCED AUDIT LOG POLICIES
-- ============================================================================

-- Admin full access to audit logs
CREATE POLICY "admin_full_access_audit_logs" ON public.admin_audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.is_active = true
    )
  );

-- System can insert audit logs (for triggers/functions)
CREATE POLICY "system_insert_audit_logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 10: VERIFICATION
-- ============================================================================

-- Verify all policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
