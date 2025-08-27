-- Fix Complaint User Roles - Comprehensive Solution
-- This script checks and fixes user roles for complaints

-- ============================================================================
-- STEP 1: DIAGNOSTIC QUERIES
-- ============================================================================

-- Check current state of users and their roles
SELECT 
    'Current Users with Complaints' as info,
    u.id,
    u.full_name,
    u.role,
    u.national_id,
    u.email,
    COUNT(c.id) as complaint_count
FROM users u
LEFT JOIN complaints c ON u.id = c.citizen_id
GROUP BY u.id, u.full_name, u.role, u.national_id, u.email
ORDER BY complaint_count DESC;

-- Check complaints and their associated users
SELECT 
    'Complaints with User Details' as info,
    c.id as complaint_id,
    c.title,
    c.status,
    c.created_at,
    u.full_name as citizen_name,
    u.role as citizen_role,
    u.national_id as citizen_national_id
FROM complaints c
JOIN users u ON c.citizen_id = u.id
ORDER BY c.created_at DESC;

-- ============================================================================
-- STEP 2: FIX EXISTING DATA
-- ============================================================================

-- Fix: Update all users who have complaints but don't have CITIZEN role
UPDATE users 
SET role = 'CITIZEN'::user_role
WHERE id IN (
    SELECT DISTINCT citizen_id 
    FROM complaints 
    WHERE citizen_id IS NOT NULL
) 
AND role != 'CITIZEN';

-- Create missing user records for complaints that don't have proper citizen association
INSERT INTO users (full_name, phone, national_id, email, role, is_active)
SELECT DISTINCT
    COALESCE(c.title, 'مواطن') as full_name,
    NULL as phone,
    c.national_id,
    NULL as email,
    'CITIZEN'::user_role as role,
    true as is_active
FROM complaints c
LEFT JOIN users u ON c.national_id = u.national_id
WHERE u.id IS NULL AND c.national_id IS NOT NULL;

-- Update complaints to link to the correct citizen users
UPDATE complaints 
SET citizen_id = u.id
FROM users u
WHERE complaints.national_id = u.national_id 
AND complaints.citizen_id IS NULL
AND u.role = 'CITIZEN';

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================

-- Verify the fix - Users with complaints should now have CITIZEN role
SELECT 
    'After Fix - Users with Complaints' as info,
    u.id,
    u.full_name,
    u.role,
    u.national_id,
    u.email,
    COUNT(c.id) as complaint_count
FROM users u
LEFT JOIN complaints c ON u.id = c.citizen_id
GROUP BY u.id, u.full_name, u.role, u.national_id, u.email
ORDER BY complaint_count DESC;

-- Check if there are any complaints without proper citizen association
SELECT 
    'Complaints without proper citizen' as info,
    c.id,
    c.title,
    c.national_id,
    c.citizen_id
FROM complaints c
LEFT JOIN users u ON c.citizen_id = u.id
WHERE u.id IS NULL OR u.role != 'CITIZEN';

-- Final verification - All complaints should have proper citizens
SELECT 
    'Final State - All Complaints with Proper Citizens' as info,
    c.id as complaint_id,
    c.title,
    c.status,
    c.created_at,
    u.full_name as citizen_name,
    u.role as citizen_role,
    u.national_id as citizen_national_id
FROM complaints c
JOIN users u ON c.citizen_id = u.id
ORDER BY c.created_at DESC;

-- ============================================================================
-- STEP 4: SUMMARY STATISTICS
-- ============================================================================

-- Summary of user roles
SELECT 
    'User Role Distribution' as info,
    role,
    COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY user_count DESC;

-- Summary of complaint statuses
SELECT 
    'Complaint Status Distribution' as info,
    status,
    COUNT(*) as complaint_count
FROM complaints
GROUP BY status
ORDER BY complaint_count DESC;

-- Summary of complaints by citizen role
SELECT 
    'Complaints by Citizen Role' as info,
    u.role as citizen_role,
    COUNT(c.id) as complaint_count
FROM complaints c
JOIN users u ON c.citizen_id = u.id
GROUP BY u.role
ORDER BY complaint_count DESC;
