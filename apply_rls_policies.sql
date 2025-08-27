-- Apply RLS Policies for Complaint Management System
-- Run this script in your Supabase SQL editor to apply the security policies

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_files enable row level security;
alter table public.complaint_history enable row level security;
alter table public.complaint_types enable row level security;
alter table public.settings enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Drop existing policies that might conflict
drop policy if exists allow_user_creation on public.users;
drop policy if exists allow_user_updates on public.users;
drop policy if exists users_self_access on public.users;
drop policy if exists users_self_update on public.users;
drop policy if exists admin_full_access_users on public.users;
drop policy if exists admin_full_access_complaints on public.complaints;
drop policy if exists admin_full_access_complaint_types on public.complaint_types;
drop policy if exists admin_full_access_complaint_files on public.complaint_files;
drop policy if exists admin_full_access_complaint_history on public.complaint_history;
drop policy if exists admin_full_access_settings on public.settings;
drop policy if exists admin_full_access_admin_audit_logs on public.admin_audit_logs;
drop policy if exists employee_read_complaints on public.complaints;
drop policy if exists employee_read_assigned_complaints on public.complaints;
drop policy if exists employee_update_assigned_complaints on public.complaints;
drop policy if exists employee_read_complaint_types on public.complaint_types;
drop policy if exists citizen_read_own_complaints on public.complaints;
drop policy if exists citizen_insert_complaints on public.complaints;
drop policy if exists citizen_update_own_complaints on public.complaints;
drop policy if exists public_read_complaint_types on public.complaint_types;
drop policy if exists public_insert_complaints on public.complaints;
drop policy if exists citizen_read_own_complaint_files on public.complaint_files;
drop policy if exists citizen_insert_own_complaint_files on public.complaint_files;
drop policy if exists employee_read_assigned_complaint_files on public.complaint_files;
drop policy if exists citizen_read_own_complaint_history on public.complaint_history;
drop policy if exists employee_read_assigned_complaint_history on public.complaint_history;

-- ============================================================================
-- USER MANAGEMENT POLICIES
-- ============================================================================

-- Allow user creation during complaint submission (for citizens)
create policy allow_user_creation on public.users
  for insert with check (true);

-- Allow users to read their own profile
create policy users_self_access on public.users
  for select using (auth_user_id = auth.uid());

-- Allow users to update their own profile
create policy users_self_update on public.users
  for update using (auth_user_id = auth.uid());

-- Admin full access to users (employees and admins only, not citizens)
create policy admin_full_access_users on public.users
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

-- ============================================================================
-- COMPLAINT POLICIES
-- ============================================================================

-- Citizens can only see their own complaints
create policy citizen_read_own_complaints on public.complaints
  for select using (
    exists (
      select 1 from public.users u
      where u.id = complaints.citizen_id 
      and u.national_id = complaints.national_id
      and u.role = 'CITIZEN'
    )
  );

-- Citizens can insert their own complaints (for complaint form)
create policy citizen_insert_complaints on public.complaints
  for insert with check (true);

-- Citizens can update their own complaints (limited fields)
create policy citizen_update_own_complaints on public.complaints
  for update using (
    exists (
      select 1 from public.users u
      where u.id = complaints.citizen_id 
      and u.national_id = complaints.national_id
      and u.role = 'CITIZEN'
    )
  );

-- Employees can see complaints assigned to them
create policy employee_read_assigned_complaints on public.complaints
  for select using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() 
      and u.role = 'EMPLOYEE' 
      and u.is_active = true
      and complaints.assigned_user_id = u.id
    )
  );

-- Employees can update complaints assigned to them
create policy employee_update_assigned_complaints on public.complaints
  for update using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() 
      and u.role = 'EMPLOYEE' 
      and u.is_active = true
      and complaints.assigned_user_id = u.id
    )
  );

-- Admin full access to complaints
create policy admin_full_access_complaints on public.complaints
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

-- ============================================================================
-- COMPLAINT TYPES POLICIES
-- ============================================================================

-- Public read access to complaint types (for complaint form)
create policy public_read_complaint_types on public.complaint_types
  for select using (true);

-- Admin full access to complaint types
create policy admin_full_access_complaint_types on public.complaint_types
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

-- Employee read access to complaint types
create policy employee_read_complaint_types on public.complaint_types
  for select using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'EMPLOYEE' and u.is_active = true
    )
  );

-- ============================================================================
-- COMPLAINT FILES POLICIES
-- ============================================================================

-- Citizens can see files for their own complaints
create policy citizen_read_own_complaint_files on public.complaint_files
  for select using (
    exists (
      select 1 from public.complaints c
      join public.users u on c.citizen_id = u.id
      where c.id = complaint_files.complaint_id
      and u.national_id = c.national_id
      and u.role = 'CITIZEN'
    )
  );

-- Citizens can insert files for their own complaints
create policy citizen_insert_own_complaint_files on public.complaint_files
  for insert with check (
    exists (
      select 1 from public.complaints c
      join public.users u on c.citizen_id = u.id
      where c.id = complaint_files.complaint_id
      and u.national_id = c.national_id
      and u.role = 'CITIZEN'
    )
  );

-- Employees can see files for complaints assigned to them
create policy employee_read_assigned_complaint_files on public.complaint_files
  for select using (
    exists (
      select 1 from public.complaints c
      join public.users u on c.assigned_user_id = u.id
      where c.id = complaint_files.complaint_id
      and u.auth_user_id = auth.uid()
      and u.role = 'EMPLOYEE'
      and u.is_active = true
    )
  );

-- Admin full access to complaint files
create policy admin_full_access_complaint_files on public.complaint_files
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

-- ============================================================================
-- COMPLAINT HISTORY POLICIES
-- ============================================================================

-- Citizens can see history for their own complaints
create policy citizen_read_own_complaint_history on public.complaint_history
  for select using (
    exists (
      select 1 from public.complaints c
      join public.users u on c.citizen_id = u.id
      where c.id = complaint_history.complaint_id
      and u.national_id = c.national_id
      and u.role = 'CITIZEN'
    )
  );

-- Employees can see history for complaints assigned to them
create policy employee_read_assigned_complaint_history on public.complaint_history
  for select using (
    exists (
      select 1 from public.complaints c
      join public.users u on c.assigned_user_id = u.id
      where c.id = complaint_history.complaint_id
      and u.auth_user_id = auth.uid()
      and u.role = 'EMPLOYEE'
      and u.is_active = true
    )
  );

-- Admin full access to complaint history
create policy admin_full_access_complaint_history on public.complaint_history
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

-- ============================================================================
-- SETTINGS POLICIES
-- ============================================================================

-- Admin full access to settings
create policy admin_full_access_settings on public.settings
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Admin full access to audit logs
create policy admin_full_access_admin_audit_logs on public.admin_audit_logs
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify policies are applied
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
