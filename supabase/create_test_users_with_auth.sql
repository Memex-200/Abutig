-- Create Test Users with Proper Authentication
-- This script creates users in both the users table AND Supabase Auth

-- ============================================================================
-- STEP 1: CREATE USERS IN USERS TABLE
-- ============================================================================

-- Insert test users into the users table
INSERT INTO public.users (full_name, email, phone, national_id, role, is_active)
VALUES 
  ('أسماء أحمد', 'asmaa@gmail.com', '01234567890', '12345678901234', 'EMPLOYEE', true),
  ('كريم سيد', 'karem@gmail.com', '01234567899', '11111111111111', 'EMPLOYEE', true),
  ('أحمد محمد', 'ahmed@gmail.com', '01234567891', '22222222222222', 'EMPLOYEE', true)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = true,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  national_id = EXCLUDED.national_id;

-- ============================================================================
-- STEP 2: CREATE AUTH USERS (MANUAL PROCESS)
-- ============================================================================

-- Note: You need to manually create these users in Supabase Auth
-- Go to Supabase Dashboard → Authentication → Users → Add User

-- User 1: asmaa@gmail.com
-- Email: asmaa@gmail.com
-- Password: 123456
-- User Metadata: {"full_name": "أسماء أحمد", "role": "EMPLOYEE"}

-- User 2: karem@gmail.com  
-- Email: karem@gmail.com
-- Password: 123456
-- User Metadata: {"full_name": "كريم سيد", "role": "EMPLOYEE"}

-- User 3: ahmed@gmail.com
-- Email: ahmed@gmail.com
-- Password: 123456
-- User Metadata: {"full_name": "أحمد محمد", "role": "EMPLOYEE"}

-- ============================================================================
-- STEP 3: LINK AUTH USERS TO PROFILES (AFTER CREATING AUTH USERS)
-- ============================================================================

-- After creating the auth users, run this to link them:
-- UPDATE public.users 
-- SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'asmaa@gmail.com')
-- WHERE email = 'asmaa@gmail.com' AND auth_user_id IS NULL;

-- UPDATE public.users 
-- SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'karem@gmail.com')
-- WHERE email = 'karem@gmail.com' AND auth_user_id IS NULL;

-- UPDATE public.users 
-- SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'ahmed@gmail.com')
-- WHERE email = 'ahmed@gmail.com' AND auth_user_id IS NULL;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Check users in the database
SELECT 'Users in database:' as info, id, full_name, email, role, is_active, auth_user_id 
FROM public.users 
WHERE email IN ('asmaa@gmail.com', 'karem@gmail.com', 'ahmed@gmail.com')
ORDER BY email;

-- Verify the fix
SELECT 'Test users created successfully' as status;
