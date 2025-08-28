-- Simple password-based auth (temporary)
-- Safe for development only. Do NOT use in production without proper hardening.

-- 1) Crypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Add password hash column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;

-- 3) Helper: set or update user password (upsert on email)
CREATE OR REPLACE FUNCTION public.set_user_password(
  p_email text,
  p_password text,
  p_full_name text DEFAULT NULL,
  p_role user_role DEFAULT 'CITIZEN'
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Upsert base row
  INSERT INTO public.users (email, full_name, role, is_active)
  VALUES (lower(p_email), COALESCE(p_full_name, split_part(p_email,'@',1)), p_role, true)
  ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    role = p_role,
    is_active = true;

  -- Update password hash
  UPDATE public.users
  SET password_hash = crypt(p_password, gen_salt('bf'))
  WHERE email = lower(p_email)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 4) Helper: simple login (email + password)
CREATE OR REPLACE FUNCTION public.simple_login(
  p_email text,
  p_password text
) RETURNS json AS $$
DECLARE
  v_user record;
BEGIN
  SELECT id, full_name, email, role, is_active
  INTO v_user
  FROM public.users
  WHERE email = lower(p_email)
    AND password_hash IS NOT NULL
    AND password_hash = crypt(p_password, password_hash)
  LIMIT 1;

  IF v_user.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'لم يتم العثور على المستخدم أو كلمة المرور غير صحيحة'
    );
  END IF;

  IF v_user.is_active = false THEN
    RETURN json_build_object(
      'success', false,
      'message', 'الحساب غير مُفعل'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'full_name', v_user.full_name,
      'email', v_user.email,
      'role', v_user.role
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 5) Seed the requested admin credentials
SELECT public.set_user_password(
  'emanhassanmahmoud1@gmail.com',
  'Emovmmm#951753',
  'مسؤول النظام',
  'ADMIN'
) AS admin_user_id;
