-- Link existing Supabase Auth user to public.users and ensure ADMIN role
-- Run after you create the user in Auth with the desired password.

DO $$
DECLARE
  v_auth_id uuid;
BEGIN
  -- 1) Fetch auth user id by email
  SELECT id INTO v_auth_id FROM auth.users WHERE email = 'emanhassanmahmoud1@gmail.com';

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Auth user not found. Create it in Authentication > Users first.';
  END IF;

  -- 2) Upsert user profile and link auth_user_id
  INSERT INTO public.users (auth_user_id, full_name, email, phone, national_id, role, is_active)
  VALUES (v_auth_id, 'مسؤول النظام', 'emanhassanmahmoud1@gmail.com', '01220815359', '30403202502808', 'ADMIN', true)
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = v_auth_id,
    role = 'ADMIN',
    is_active = true,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    national_id = EXCLUDED.national_id;
END $$;

-- Verify link
SELECT id, auth_user_id, full_name, email, role, is_active
FROM public.users
WHERE email = 'emanhassanmahmoud1@gmail.com';
