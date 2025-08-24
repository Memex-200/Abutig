-- Database Setup Verification Script
-- This script verifies that the database is properly set up

-- Check complaint types
SELECT 'Complaint Types' as check_type, COUNT(*) as count FROM public.complaint_types WHERE is_active = true;

-- List all complaint types in Arabic
SELECT name, description, icon FROM public.complaint_types WHERE is_active = true ORDER BY name;

-- Check admin user
SELECT 'Admin User' as check_type, COUNT(*) as count FROM public.users WHERE email = 'emanhassanmahmoud1@gmail.com' AND role = 'ADMIN' AND is_active = true;

-- Check admin user details
SELECT full_name, email, role, is_active FROM public.users WHERE email = 'emanhassanmahmoud1@gmail.com';

-- Check if admin user has auth_user_id (should not be null)
SELECT 'Admin Auth Check' as check_type, 
       CASE WHEN auth_user_id IS NOT NULL THEN 'OK' ELSE 'MISSING AUTH ID' END as status
FROM public.users WHERE email = 'emanhassanmahmoud1@gmail.com';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check table structure
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'complaints', 'complaint_types', 'complaint_files', 'complaint_history')
ORDER BY table_name, ordinal_position;

-- Summary
SELECT 
  'Database Setup Summary' as summary,
  (SELECT COUNT(*) FROM public.complaint_types WHERE is_active = true) as complaint_types_count,
  (SELECT COUNT(*) FROM public.users WHERE role = 'ADMIN' AND is_active = true) as admin_users_count,
  (SELECT COUNT(*) FROM public.users WHERE role = 'EMPLOYEE' AND is_active = true) as employee_users_count,
  (SELECT COUNT(*) FROM public.users WHERE role = 'CITIZEN' AND is_active = true) as citizen_users_count;

-- Expected results:
-- complaint_types_count should be 11
-- admin_users_count should be 1
-- All complaint types should have Arabic names and emoji icons
