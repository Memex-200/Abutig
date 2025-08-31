-- Fix duplicate entries before adding unique constraint
-- This script will help resolve the duplicate data issue

-- Step 1: Identify all duplicate combinations
SELECT 
    name, 
    national_id, 
    COUNT(*) as duplicate_count,
    array_agg(id) as complaint_ids
FROM public.complaints
WHERE national_id IS NOT NULL
GROUP BY name, national_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Show the actual duplicate records
WITH duplicates AS (
    SELECT 
        name, 
        national_id,
        COUNT(*) as count
    FROM public.complaints
    WHERE national_id IS NOT NULL
    GROUP BY name, national_id
    HAVING COUNT(*) > 1
)
SELECT 
    c.id,
    c.name,
    c.national_id,
    c.title,
    c.created_at,
    c.status
FROM public.complaints c
INNER JOIN duplicates d ON c.name = d.name AND c.national_id = d.national_id
ORDER BY c.name, c.national_id, c.created_at;

-- Step 3: Option 1 - Keep the most recent complaint for each duplicate combination
-- (Uncomment and run this if you want to keep only the latest complaint)

/*
DELETE FROM public.complaints 
WHERE id IN (
    SELECT c.id
    FROM public.complaints c
    INNER JOIN (
        SELECT 
            name, 
            national_id,
            MAX(created_at) as max_created_at
        FROM public.complaints
        WHERE national_id IS NOT NULL
        GROUP BY name, national_id
        HAVING COUNT(*) > 1
    ) duplicates ON c.name = duplicates.name 
                   AND c.national_id = duplicates.national_id
                   AND c.created_at < duplicates.max_created_at
);
*/

-- Step 4: Option 2 - Keep the first complaint for each duplicate combination
-- (Uncomment and run this if you want to keep only the earliest complaint)

/*
DELETE FROM public.complaints 
WHERE id IN (
    SELECT c.id
    FROM public.complaints c
    INNER JOIN (
        SELECT 
            name, 
            national_id,
            MIN(created_at) as min_created_at
        FROM public.complaints
        WHERE national_id IS NOT NULL
        GROUP BY name, national_id
        HAVING COUNT(*) > 1
    ) duplicates ON c.name = duplicates.name 
                   AND c.national_id = duplicates.national_id
                   AND c.created_at > duplicates.min_created_at
);
*/

-- Step 5: Option 3 - Update duplicate names to make them unique
-- (Uncomment and run this if you want to keep all complaints but make names unique)

/*
UPDATE public.complaints 
SET name = name || ' (2)'
WHERE id IN (
    SELECT c.id
    FROM public.complaints c
    INNER JOIN (
        SELECT 
            name, 
            national_id,
            ROW_NUMBER() OVER (PARTITION BY name, national_id ORDER BY created_at) as rn
        FROM public.complaints
        WHERE national_id IS NOT NULL
    ) ranked ON c.id = ranked.id
    WHERE ranked.rn > 1
);
*/

-- Step 6: Verify no duplicates remain
SELECT 
    name, 
    national_id, 
    COUNT(*) as count
FROM public.complaints
WHERE national_id IS NOT NULL
GROUP BY name, national_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 7: If no duplicates remain, you can now run the constraint script
-- Run the add_national_id_constraint.sql script after this
