-- Create Users in Supabase Auth
-- This script creates users in Supabase Auth using admin functions

-- ============================================================================
-- STEP 1: CREATE USERS IN USERS TABLE (IF NOT EXISTS)
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
-- STEP 2: CREATE AUTH USERS USING ADMIN API
-- ============================================================================

-- Note: These functions require admin privileges
-- You may need to run these from the Supabase Dashboard or use the admin API

-- Function to create auth user (requires admin privileges)
CREATE OR REPLACE FUNCTION public.create_auth_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text DEFAULT 'EMPLOYEE'
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- This function requires admin privileges
  -- In a real scenario, you would use the Supabase admin API
  -- For now, we'll return instructions
  
  RETURN json_build_object(
    'success', false,
    'message', 'يجب إنشاء المستخدم يدوياً في Supabase Dashboard',
    'instructions', json_build_object(
      'step1', 'اذهب إلى Supabase Dashboard → Authentication → Users',
      'step2', 'اضغط على "Add User"',
      'step3', 'أدخل البريد الإلكتروني: ' || p_email,
      'step4', 'أدخل كلمة المرور: ' || p_password,
      'step5', 'أضف User Metadata: {"full_name": "' || p_full_name || '", "role": "' || p_role || '"}',
      'step6', 'اضغط "Create User"'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: MANUAL INSTRUCTIONS FOR CREATING AUTH USERS
-- ============================================================================

-- To create the auth users manually, follow these steps:

-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User"
-- 3. For each user:

-- User 1: asmaa@gmail.com
-- - Email: asmaa@gmail.com
-- - Password: 123456
-- - User Metadata: {"full_name": "أسماء أحمد", "role": "EMPLOYEE"}

-- User 2: karem@gmail.com
-- - Email: karem@gmail.com
-- - Password: 123456
-- - User Metadata: {"full_name": "كريم سيد", "role": "EMPLOYEE"}

-- User 3: ahmed@gmail.com
-- - Email: ahmed@gmail.com
-- - Password: 123456
-- - User Metadata: {"full_name": "أحمد محمد", "role": "EMPLOYEE"}

-- ============================================================================
-- STEP 4: LINK AUTH USERS TO PROFILES (AFTER CREATING AUTH USERS)
-- ============================================================================

-- After creating the auth users, run these commands to link them:

-- Link asmaa
UPDATE public.users 
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'asmaa@gmail.com')
WHERE email = 'asmaa@gmail.com' AND auth_user_id IS NULL;

-- Link karem
UPDATE public.users 
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'karem@gmail.com')
WHERE email = 'karem@gmail.com' AND auth_user_id IS NULL;

-- Link ahmed
UPDATE public.users 
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'ahmed@gmail.com')
WHERE email = 'ahmed@gmail.com' AND auth_user_id IS NULL;

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

-- Check users in the database
SELECT 'Users in database:' as info, id, full_name, email, role, is_active, auth_user_id 
FROM public.users 
WHERE email IN ('asmaa@gmail.com', 'karem@gmail.com', 'ahmed@gmail.com')
ORDER BY email;

-- Check auth users (if you have access)
SELECT 'Auth users:' as info, id, email, raw_user_meta_data
FROM auth.users 
WHERE email IN ('asmaa@gmail.com', 'karem@gmail.com', 'ahmed@gmail.com')
ORDER BY email;

-- Verify the fix
SELECT 'Auth users setup completed' as status;
