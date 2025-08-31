-- Safe version: Add national ID constraints with duplicate checking
-- This script will check for duplicates before adding constraints

-- Step 1: Check for existing duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check if there are any duplicate name + national_id combinations
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT name, national_id, COUNT(*) as count
        FROM public.complaints
        WHERE national_id IS NOT NULL
        GROUP BY name, national_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Found % duplicate name + national_id combinations. Please run fix_duplicates_before_constraint.sql first.', duplicate_count;
    END IF;
    
    RAISE NOTICE 'No duplicates found. Proceeding with constraint creation...';
END $$;

-- Step 2: Check for invalid national_id formats
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for national_ids that are not exactly 14 digits
    SELECT COUNT(*) INTO invalid_count
    FROM public.complaints
    WHERE national_id IS NOT NULL 
    AND (national_id !~ '^[0-9]{14}$' OR LENGTH(national_id) != 14);
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % records with invalid national_id format (must be exactly 14 digits). Please fix these first.', invalid_count;
    END IF;
    
    RAISE NOTICE 'All national_id formats are valid.';
END $$;

-- Step 3: Check for invalid phone formats
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for phones that don't start with 01 and are not exactly 11 digits
    SELECT COUNT(*) INTO invalid_count
    FROM public.complaints
    WHERE phone IS NOT NULL 
    AND (phone !~ '^01[0-9]{9}$' OR LENGTH(phone) != 11);
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % records with invalid phone format (must start with 01 and be exactly 11 digits). Please fix these first.', invalid_count;
    END IF;
    
    RAISE NOTICE 'All phone formats are valid.';
END $$;

-- Step 4: Add constraints (only if all checks pass)
-- Add unique constraint for name + national_id combination
ALTER TABLE public.complaints 
ADD CONSTRAINT unique_name_national_id 
UNIQUE (name, national_id);

-- Add check constraint to ensure national_id is exactly 14 digits
ALTER TABLE public.complaints 
ADD CONSTRAINT check_national_id_length 
CHECK (national_id ~ '^[0-9]{14}$');

-- Add check constraint to ensure phone is exactly 11 digits and starts with 01
ALTER TABLE public.complaints 
ADD CONSTRAINT check_phone_format 
CHECK (phone ~ '^01[0-9]{9}$');

-- Step 5: Verify constraints were added successfully
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'complaints' 
AND constraint_name IN ('unique_name_national_id', 'check_national_id_length', 'check_phone_format')
ORDER BY constraint_name;

RAISE NOTICE 'All constraints added successfully!';
