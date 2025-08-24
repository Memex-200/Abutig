-- Database Cleanup Script
-- This script removes all dummy/fake data from the database
-- Run this before inserting production data

-- Clear all data from tables (in correct order due to foreign key constraints)
DELETE FROM public.complaint_files;
DELETE FROM public.complaint_history;
DELETE FROM public.complaints;
DELETE FROM public.complaint_types;

-- Don't delete users table data - we'll handle admin user creation properly
-- The admin user will be created through the application interface

-- Reset sequences if they exist
-- Note: This is optional and depends on your database setup
-- ALTER SEQUENCE IF EXISTS public.complaint_types_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.complaints_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.users_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'complaint_files' as table_name, COUNT(*) as record_count FROM public.complaint_files
UNION ALL
SELECT 'complaint_history' as table_name, COUNT(*) as record_count FROM public.complaint_history
UNION ALL
SELECT 'complaints' as table_name, COUNT(*) as record_count FROM public.complaints
UNION ALL
SELECT 'complaint_types' as table_name, COUNT(*) as record_count FROM public.complaint_types
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM public.users;

-- The database is now clean and ready for production data
