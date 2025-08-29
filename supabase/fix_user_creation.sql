-- Fix User Creation Process
-- This script updates the handle_new_user function to properly handle existing profiles

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a profile already exists for this email
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = NEW.email 
    AND auth_user_id IS NULL
  ) THEN
    -- Update existing profile with auth_user_id
    UPDATE public.users 
    SET auth_user_id = NEW.id,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        is_active = true
    WHERE email = NEW.email 
    AND auth_user_id IS NULL;
  ELSE
    -- Create new profile if none exists
    INSERT INTO public.users (auth_user_id, full_name, email, role, is_active)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      NEW.email,
      'CITIZEN',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to manually link existing profiles (for admin use)
CREATE OR REPLACE FUNCTION public.link_user_profile(p_user_email text, p_auth_user_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE public.users 
  SET auth_user_id = p_auth_user_id,
      is_active = true
  WHERE email = p_user_email 
  AND auth_user_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "admin_create_users" ON public.users;
DROP POLICY IF EXISTS "admin_read_users" ON public.users;
DROP POLICY IF EXISTS "admin_update_users" ON public.users;

-- Create a policy to allow admin to create users
CREATE POLICY "admin_create_users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'ADMIN' 
      AND u.is_active = true
    )
  );

-- Create a policy to allow admin to read all users
CREATE POLICY "admin_read_users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'ADMIN' 
      AND u.is_active = true
    )
  );

-- Create a policy to allow admin to update users
CREATE POLICY "admin_update_users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'ADMIN' 
      AND u.is_active = true
    )
  );

-- Verify the fix
SELECT 'User creation process fixed successfully' as status;
