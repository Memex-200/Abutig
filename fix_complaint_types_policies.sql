-- Fix Complaint Types Policies
-- Run this in Supabase SQL Editor to fix complaint types management

-- ============================================================================
-- STEP 1: CHECK CURRENT POLICIES
-- ============================================================================

-- Check existing policies on complaint_types table
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
WHERE tablename = 'complaint_types';

-- ============================================================================
-- STEP 2: DROP EXISTING POLICIES (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON complaint_types;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON complaint_types;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON complaint_types;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON complaint_types;
DROP POLICY IF EXISTS "Enable all operations for admins" ON complaint_types;

-- ============================================================================
-- STEP 3: CREATE NEW POLICIES
-- ============================================================================

-- Enable read access for all users (including anonymous)
CREATE POLICY "Enable read access for all users" ON complaint_types
    FOR SELECT USING (true);

-- Enable insert for authenticated users only
CREATE POLICY "Enable insert for authenticated users only" ON complaint_types
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable update for authenticated users only
CREATE POLICY "Enable update for authenticated users only" ON complaint_types
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Enable delete for authenticated users only
CREATE POLICY "Enable delete for authenticated users only" ON complaint_types
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 4: VERIFY TABLE STRUCTURE
-- ============================================================================

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
-- STEP 5: CHECK EXISTING DATA
-- ============================================================================

-- Check existing complaint types
SELECT 
    id,
    name,
    icon,
    description,
    is_active,
    created_at
FROM complaint_types
ORDER BY name;

-- ============================================================================
-- STEP 6: TEST POLICIES
-- ============================================================================

-- Test read access (should work for all users)
-- SELECT * FROM complaint_types LIMIT 5;

-- ============================================================================
-- STEP 7: ADD SAMPLE DATA (if needed)
-- ============================================================================

-- Insert sample complaint types if table is empty
INSERT INTO complaint_types (name, icon, description, is_active)
SELECT * FROM (VALUES 
    ('مشاكل الطرق', '🚧', 'مشاكل في الطرق والشوارع', true),
    ('مشاكل الكهرباء', '⚡', 'مشاكل في شبكة الكهرباء', true),
    ('مشاكل المياه', '💧', 'مشاكل في شبكة المياه', true),
    ('مشاكل الصرف الصحي', '🚰', 'مشاكل في شبكة الصرف الصحي', true),
    ('مشاكل النظافة', '🧹', 'مشاكل في النظافة العامة', true),
    ('الأمان والسلامة العامة', '🛡️', 'مشاكل أمنية وسلامة عامة', true),
    ('مشاكل أخرى', '📝', 'مشاكل أخرى متنوعة', true)
) AS v(name, icon, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM complaint_types WHERE name = v.name);

-- ============================================================================
-- STEP 8: FINAL VERIFICATION
-- ============================================================================

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'complaint_types'
ORDER BY policyname;

-- Verify data
SELECT 
    'Total complaint types' as info,
    COUNT(*) as count 
FROM complaint_types;

SELECT 
    'Active complaint types' as info,
    COUNT(*) as count 
FROM complaint_types 
WHERE is_active = true;
