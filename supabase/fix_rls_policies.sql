-- Fix RLS Policies for Admin Setup
-- This script fixes the Row Level Security policies that prevent admin user creation

-- Drop existing policies that might conflict
drop policy if exists allow_user_creation on public.users;
drop policy if exists allow_user_updates on public.users;
drop policy if exists users_self_access on public.users;

-- Create new policies that allow user creation and management
create policy allow_user_creation on public.users
  for insert with check (true);

create policy allow_user_updates on public.users
  for update using (auth_user_id = auth.uid() or role = 'ADMIN');

create policy users_self_access on public.users
  for select using (auth_user_id = auth.uid());

-- Verify the policies are created
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where tablename = 'users' 
order by policyname;
