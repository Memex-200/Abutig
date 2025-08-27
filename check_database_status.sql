-- Check Database Status and Fix Issues
-- Run this in Supabase SQL Editor to diagnose and fix issues

-- ============================================================================
-- STEP 1: CHECK TABLE STRUCTURE
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

-- Check users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check complaint_types table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'complaint_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: CHECK DATA
-- ============================================================================

-- Check if there are any complaints
SELECT 'Complaints count' as info, COUNT(*) as count FROM complaints;

-- Check if there are any users
SELECT 'Users count' as info, COUNT(*) as count FROM users;

-- Check if there are any complaint types
SELECT 'Complaint types count' as info, COUNT(*) as count FROM complaint_types;

-- Check complaints with their citizens
SELECT 
    'Complaints with citizens' as info,
    c.id as complaint_id,
    c.title,
    c.status,
    c.created_at,
    u.full_name as citizen_name,
    u.role as citizen_role,
    u.phone as citizen_phone
FROM complaints c
LEFT JOIN users u ON c.citizen_id = u.id
ORDER BY c.created_at DESC;

-- ============================================================================
-- STEP 3: FIX MISSING COLUMNS (if needed)
-- ============================================================================

-- Add priority column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' 
        AND column_name = 'priority'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE complaints ADD COLUMN priority TEXT DEFAULT 'MEDIUM';
        RAISE NOTICE 'Added priority column to complaints table';
    ELSE
        RAISE NOTICE 'Priority column already exists in complaints table';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: VERIFY FIXES
-- ============================================================================

-- Check complaints table structure again
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'complaints' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test a simple query
SELECT 
    c.id,
    c.title,
    c.status,
    c.created_at,
    u.full_name,
    u.role
FROM complaints c
LEFT JOIN users u ON c.citizen_id = u.id
LIMIT 5;
