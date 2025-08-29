-- Function to Create Users with Authentication
-- This function allows admins to create users properly

-- Create a function to create users with auth
CREATE OR REPLACE FUNCTION public.create_user_with_auth(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_national_id text DEFAULT NULL,
  p_role user_role DEFAULT 'EMPLOYEE'
)
RETURNS json AS $$
DECLARE
  v_auth_user_id uuid;
  v_user_id uuid;
  v_result json;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'ADMIN' 
    AND is_active = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'ليس لديك صلاحية لإنشاء مستخدمين'
    );
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_EXISTS',
      'message', 'المستخدم موجود بالفعل'
    );
  END IF;

  -- Create user in auth.users (this requires admin privileges)
  -- Note: This might not work from client-side, so we'll create the profile first
  -- and provide instructions for manual auth creation
  
  -- Create profile in public.users
  INSERT INTO public.users (email, full_name, phone, national_id, role, is_active)
  VALUES (p_email, p_full_name, p_phone, p_national_id, p_role, true)
  RETURNING id INTO v_user_id;

  -- Return success with instructions
  RETURN json_build_object(
    'success', true,
    'message', 'تم إنشاء المستخدم بنجاح. يرجى إنشاء حساب المصادقة يدوياً.',
    'user_id', v_user_id,
    'instructions', json_build_object(
      'step1', 'اذهب إلى Supabase Dashboard → Authentication → Users',
      'step2', 'اضغط على "Add User"',
      'step3', 'أدخل البريد الإلكتروني: ' || p_email,
      'step4', 'أدخل كلمة المرور: ' || p_password,
      'step5', 'أضف User Metadata: {"full_name": "' || p_full_name || '", "role": "' || p_role || '"}',
      'step6', 'اضغط "Create User"'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'DATABASE_ERROR',
    'message', 'حدث خطأ في قاعدة البيانات: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link existing profiles with auth users
CREATE OR REPLACE FUNCTION public.link_user_profile(p_email text)
RETURNS json AS $$
DECLARE
  v_auth_user_id uuid;
  v_result json;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'ADMIN' 
    AND is_active = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'ليس لديك صلاحية لربط الملفات الشخصية'
    );
  END IF;

  -- Get auth user id
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = p_email;

  IF v_auth_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'AUTH_USER_NOT_FOUND',
      'message', 'لم يتم العثور على حساب المصادقة لهذا البريد الإلكتروني'
    );
  END IF;

  -- Update profile with auth_user_id
  UPDATE public.users 
  SET auth_user_id = v_auth_user_id,
      is_active = true
  WHERE email = p_email 
  AND auth_user_id IS NULL;

  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'تم ربط الملف الشخصي بنجاح'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'PROFILE_NOT_FOUND',
      'message', 'لم يتم العثور على الملف الشخصي'
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'DATABASE_ERROR',
    'message', 'حدث خطأ في قاعدة البيانات: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the functions
SELECT 'User creation functions created successfully' as status;
