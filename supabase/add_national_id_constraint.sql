-- Add unique constraint for name + national_id combination
-- This prevents the same national ID from belonging to different people
-- while allowing the same person to submit multiple complaints

-- First, let's check if there are any existing duplicate combinations
SELECT name, national_id, COUNT(*) as count
FROM public.complaints
WHERE national_id IS NOT NULL
GROUP BY name, national_id
HAVING COUNT(*) > 1;

-- Add unique constraint for name + national_id combination
-- This ensures that the same national ID cannot belong to two different people
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
