-- Check Complaints Status
-- Run this in Supabase SQL Editor to diagnose complaints display issue

-- ============================================================================
-- STEP 1: CHECK COMPLAINTS TABLE STRUCTURE
-- ============================================================================

-- Check complaints table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'complaints' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: CHECK COMPLAINTS DATA
-- ============================================================================

-- Check total complaints count
SELECT 'Total complaints' as info, COUNT(*) as count FROM complaints;

-- Check complaints with details
SELECT 
    id,
    title,
    description,
    status,
    created_at,
    citizen_id,
    type_id,
    location
FROM complaints
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 3: CHECK CITIZENS DATA
-- ============================================================================

-- Check citizens who have complaints
SELECT 
    'Citizens with complaints' as info,
    COUNT(DISTINCT citizen_id) as count
FROM complaints
WHERE citizen_id IS NOT NULL;

-- Check citizens table
SELECT 
    id,
    full_name,
    phone,
    email,
    role,
    created_at
FROM users
WHERE role = 'CITIZEN'
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 4: CHECK COMPLAINT TYPES
-- ============================================================================

-- Check complaint types
SELECT 
    id,
    name,
    icon,
    description,
    is_active
FROM complaint_types
ORDER BY name;

-- ============================================================================
-- STEP 5: CHECK RELATIONSHIPS
-- ============================================================================

-- Check complaints with citizen and type info
SELECT 
    c.id as complaint_id,
    c.title,
    c.status,
    c.created_at,
    u.full_name as citizen_name,
    u.phone as citizen_phone,
    u.role as citizen_role,
    ct.name as type_name
FROM complaints c
LEFT JOIN users u ON c.citizen_id = u.id
LEFT JOIN complaint_types ct ON c.type_id = ct.id
ORDER BY c.created_at DESC;

-- ============================================================================
-- STEP 6: CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='complaints';

-- ============================================================================
-- STEP 7: CHECK RLS POLICIES
-- ============================================================================

-- Check RLS policies on complaints table
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
WHERE tablename = 'complaints';

-- ============================================================================
-- STEP 8: TEST SIMPLE QUERY
-- ============================================================================

-- Test a simple query that should work
SELECT 
    c.id,
    c.title,
    c.status,
    c.created_at
FROM complaints c
LIMIT 5;
