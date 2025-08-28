-- Create Admin and Employee Users
-- This script creates admin and employee users for the complaint management system

-- ============================================================================
-- STEP 1: CREATE ADMIN USER
-- ============================================================================

-- Insert admin user profile
INSERT INTO public.users (
  full_name,
  email,
  phone,
  national_id,
  role,
  is_active
) VALUES (
  'إيمان حسن محمود',
  'emanhassanmahmoud1@gmail.com',
  '01220815359',
  '30403202502808',
  'ADMIN',
  true
) ON CONFLICT (email) DO UPDATE SET
  role = 'ADMIN',
  is_active = true,
  full_name = 'إيمان حسن محمود',
  phone = '01220815359',
  national_id = '30403202502808';

-- ============================================================================
-- STEP 2: CREATE EMPLOYEE USERS
-- ============================================================================

-- Insert employee users
INSERT INTO public.users (
  full_name,
  email,
  phone,
  national_id,
  role,
  is_active
) VALUES 
  ('أحمد محمد علي', 'ahmed.employee@test.com', '01123456789', '98765432109876', 'EMPLOYEE', true),
  ('فاطمة أحمد', 'fatima.employee@test.com', '01234567890', '11223344556677', 'EMPLOYEE', true),
  ('محمد حسن', 'mohamed.employee@test.com', '01345678901', '22334455667788', 'EMPLOYEE', true)
ON CONFLICT (email) DO UPDATE SET
  role = 'EMPLOYEE',
  is_active = true;

-- ============================================================================
-- STEP 3: CREATE TEST CITIZEN USERS
-- ============================================================================

-- Insert test citizen users
INSERT INTO public.users (
  full_name,
  email,
  phone,
  national_id,
  role,
  is_active
) VALUES 
  ('علي محمد أحمد', 'ali.citizen@test.com', '01456789012', '33445566778899', 'CITIZEN', true),
  ('سارة محمود', 'sara.citizen@test.com', '01567890123', '44556677889900', 'CITIZEN', true),
  ('خالد عبدالله', 'khaled.citizen@test.com', '01678901234', '55667788990011', 'CITIZEN', true)
ON CONFLICT (email) DO UPDATE SET
  role = 'CITIZEN',
  is_active = true;

-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Check all users by role
SELECT 
  'All Users by Role' as info,
  role,
  COUNT(*) as count
FROM public.users
GROUP BY role
ORDER BY role;

-- Check admin users
SELECT 
  'Admin Users' as info,
  id,
  full_name,
  email,
  phone,
  national_id,
  is_active,
  created_at
FROM public.users
WHERE role = 'ADMIN'
ORDER BY created_at;

-- Check employee users
SELECT 
  'Employee Users' as info,
  id,
  full_name,
  email,
  phone,
  national_id,
  is_active,
  created_at
FROM public.users
WHERE role = 'EMPLOYEE'
ORDER BY created_at;

-- Check citizen users
SELECT 
  'Citizen Users' as info,
  id,
  full_name,
  email,
  phone,
  national_id,
  is_active,
  created_at
FROM public.users
WHERE role = 'CITIZEN'
ORDER BY created_at;

-- ============================================================================
-- STEP 5: CREATE SAMPLE COMPLAINTS FOR TESTING
-- ============================================================================

-- Insert sample complaints
INSERT INTO public.complaints (
  citizen_id,
  type_id,
  title,
  description,
  status,
  priority
) 
SELECT 
  u.id,
  ct.id,
  'مشكلة في الصرف الصحي',
  'هناك مشكلة في شبكة الصرف الصحي في الشارع الرئيسي',
  'NEW',
  'HIGH'
FROM public.users u, public.complaint_types ct
WHERE u.role = 'CITIZEN' AND ct.name = 'مشاكل الصرف الصحي'
LIMIT 1;

INSERT INTO public.complaints (
  citizen_id,
  type_id,
  title,
  description,
  status,
  priority
) 
SELECT 
  u.id,
  ct.id,
  'مشكلة في الكهرباء',
  'انقطاع الكهرباء في المنطقة السكنية',
  'IN_PROGRESS',
  'MEDIUM'
FROM public.users u, public.complaint_types ct
WHERE u.role = 'CITIZEN' AND ct.name = 'مشاكل الكهرباء'
LIMIT 1;

INSERT INTO public.complaints (
  citizen_id,
  type_id,
  title,
  description,
  status,
  priority
) 
SELECT 
  u.id,
  ct.id,
  'مشكلة في الطرق',
  'حفرة كبيرة في الطريق تسبب مشاكل للمركبات',
  'RESOLVED',
  'LOW'
FROM public.users u, public.complaint_types ct
WHERE u.role = 'CITIZEN' AND ct.name = 'مشاكل الطرق'
LIMIT 1;

-- ============================================================================
-- STEP 6: ASSIGN COMPLAINTS TO EMPLOYEES
-- ============================================================================

-- Assign complaints to employees
UPDATE public.complaints 
SET assigned_user_id = (
  SELECT id FROM public.users 
  WHERE role = 'EMPLOYEE' 
  ORDER BY RANDOM() 
  LIMIT 1
)
WHERE status = 'IN_PROGRESS';

-- ============================================================================
-- STEP 7: FINAL VERIFICATION
-- ============================================================================

-- Check total users
SELECT 'Total Users' as info, COUNT(*) as count FROM public.users;

-- Check total complaints
SELECT 'Total Complaints' as info, COUNT(*) as count FROM public.complaints;

-- Check complaints by status
SELECT 
  'Complaints by Status' as info,
  status,
  COUNT(*) as count
FROM public.complaints
GROUP BY status
ORDER BY status;

-- Check assigned complaints
SELECT 
  'Assigned Complaints' as info,
  COUNT(*) as count
FROM public.complaints
WHERE assigned_user_id IS NOT NULL;

-- Display system is ready message
SELECT 
  'SYSTEM READY' as status,
  'All users and sample data have been created successfully!' as message,
  now() as created_at;
