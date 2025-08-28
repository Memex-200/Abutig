-- Comprehensive RLS Policies for Complaint Management System
-- This script creates secure role-based access control policies

-- ============================================================================
-- USER MANAGEMENT POLICIES
-- ============================================================================

-- Allow users to read their own profile
CREATE POLICY "users_self_access" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Allow user creation during registration
CREATE POLICY "users_allow_insert" ON public.users
  FOR INSERT WITH CHECK (true);

-- Admin full access to all users
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
-- COMPLAINT POLICIES
-- ============================================================================

-- Citizens can create complaints
CREATE POLICY "citizens_insert_complaints" ON public.complaints
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
      AND u.id = citizen_id
    )
  );

-- Citizens can read their own complaints
CREATE POLICY "citizens_read_own_complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
      AND u.id = citizen_id
    )
  );

-- Citizens can update their own complaints (limited fields)
CREATE POLICY "citizens_update_own_complaints" ON public.complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
      AND u.id = citizen_id
    )
  ) WITH CHECK (
    -- Only allow updating description and location
    (OLD.title = NEW.title) AND
    (OLD.type_id = NEW.type_id) AND
    (OLD.status = NEW.status) AND
    (OLD.assigned_user_id = NEW.assigned_user_id)
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

-- Employees can update complaints assigned to them
CREATE POLICY "employees_update_assigned_complaints" ON public.complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'EMPLOYEE'
      AND u.is_active = true
      AND u.id = assigned_user_id
    )
  );

-- Admin full access to all complaints
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
-- COMPLAINT TYPES POLICIES
-- ============================================================================

-- Public read access to complaint types
CREATE POLICY "public_read_complaint_types" ON public.complaint_types
  FOR SELECT USING (is_active = true);

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
-- COMPLAINT FILES POLICIES
-- ============================================================================

-- Citizens can read files for their own complaints
CREATE POLICY "citizens_read_own_complaint_files" ON public.complaint_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON u.id = c.citizen_id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
  );

-- Citizens can upload files for their own complaints
CREATE POLICY "citizens_insert_own_complaint_files" ON public.complaint_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON u.id = c.citizen_id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
  );

-- Employees can read files for complaints assigned to them
CREATE POLICY "employees_read_assigned_complaint_files" ON public.complaint_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON u.id = c.assigned_user_id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'EMPLOYEE'
      AND u.is_active = true
    )
  );

-- Employees can upload files for complaints assigned to them
CREATE POLICY "employees_insert_assigned_complaint_files" ON public.complaint_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON u.id = c.assigned_user_id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'EMPLOYEE'
      AND u.is_active = true
    )
  );

-- Admin full access to complaint files
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
-- COMPLAINT HISTORY POLICIES
-- ============================================================================

-- Citizens can read history for their own complaints
CREATE POLICY "citizens_read_own_complaint_history" ON public.complaint_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON u.id = c.citizen_id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'CITIZEN'
      AND u.is_active = true
    )
  );

-- Employees can read history for complaints assigned to them
CREATE POLICY "employees_read_assigned_complaint_history" ON public.complaint_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.users u ON u.id = c.assigned_user_id
      WHERE c.id = complaint_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'EMPLOYEE'
      AND u.is_active = true
    )
  );

-- Admin full access to complaint history
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
-- NOTIFICATIONS POLICIES
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

-- Users can update their own notifications (mark as read)
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
    (OLD.title = NEW.title) AND
    (OLD.message = NEW.message) AND
    (OLD.type = NEW.type) AND
    (OLD.related_complaint_id = NEW.related_complaint_id)
  );

-- System can insert notifications (for triggers/functions)
CREATE POLICY "system_insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SETTINGS POLICIES
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
-- ADMIN AUDIT LOGS POLICIES
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
-- VERIFICATION
-- ============================================================================

-- Verify all policies were created
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
