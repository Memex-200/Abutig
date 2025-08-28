-- Ensure admin user exists with the specified credentials
-- IMPORTANT: You must also create/update the Auth user in Supabase Auth with the same email and password.

-- 1) Upsert profile in public.users as ADMIN
INSERT INTO public.users (full_name, email, phone, national_id, role, is_active)
VALUES ('مسؤول النظام', 'emanhassanmahmoud1@gmail.com', '01220815359', '30403202502808', 'ADMIN', true)
ON CONFLICT (email) DO UPDATE SET
  role = 'ADMIN',
  is_active = true,
  full_name = EXCLUDED.full_name;

-- 2) Verification
SELECT id, full_name, email, role, is_active FROM public.users WHERE email = 'emanhassanmahmoud1@gmail.com';

-- 3) Notes:
-- - Go to Supabase Dashboard → Authentication → Users, and create/update a user
--   with Email: emanhassanmahmoud1@gmail.com and Password: Emovmmm#951753
-- - The trigger public.handle_new_user will keep profiles in sync if configured.
