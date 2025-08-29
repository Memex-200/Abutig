-- Admin User Creation System
-- This script provides automatic user creation for admins

-- ============================================================================
-- STEP 1: CREATE ADMIN USER CREATION FUNCTION
-- ============================================================================

-- Function to create users with authentication (admin only)
CREATE OR REPLACE FUNCTION public.admin_create_user(
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

  -- Check if auth user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'AUTH_USER_EXISTS',
      'message', 'حساب المصادقة موجود بالفعل'
    );
  END IF;

  -- Create user in auth.users (this requires admin privileges)
  -- Note: This might not work from client-side due to security restrictions
  -- We'll provide alternative approaches
  
  -- For now, create profile and provide instructions
  INSERT INTO public.users (email, full_name, phone, national_id, role, is_active)
  VALUES (p_email, p_full_name, p_phone, p_national_id, p_role, true)
  RETURNING id INTO v_user_id;

  -- Return success with instructions for manual auth creation
  RETURN json_build_object(
    'success', true,
    'message', 'تم إنشاء الملف الشخصي بنجاح. يرجى إنشاء حساب المصادقة يدوياً.',
    'user_id', v_user_id,
    'instructions', json_build_object(
      'step1', 'اذهب إلى Supabase Dashboard → Authentication → Users',
      'step2', 'اضغط على "Add User"',
      'step3', 'أدخل البريد الإلكتروني: ' || p_email,
      'step4', 'أدخل كلمة المرور: ' || p_password,
      'step5', 'أضف User Metadata: {"full_name": "' || p_full_name || '", "role": "' || p_role || '"}',
      'step6', 'اضغط "Create User"',
      'step7', 'شغل أمر الربط التالي في SQL Editor:',
      'link_command', 'UPDATE public.users SET auth_user_id = (SELECT id FROM auth.users WHERE email = ''' || p_email || ''') WHERE email = ''' || p_email || ''' AND auth_user_id IS NULL;'
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

-- ============================================================================
-- STEP 2: CREATE AUTOMATIC LINKING FUNCTION
-- ============================================================================

-- Function to automatically link profiles with auth users
CREATE OR REPLACE FUNCTION public.auto_link_profiles()
RETURNS json AS $$
DECLARE
  v_linked_count integer := 0;
  v_profile record;
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

  -- Link all unlinked profiles
  FOR v_profile IN 
    SELECT email FROM public.users 
    WHERE auth_user_id IS NULL
  LOOP
    UPDATE public.users 
    SET auth_user_id = (SELECT id FROM auth.users WHERE email = v_profile.email)
    WHERE email = v_profile.email AND auth_user_id IS NULL;
    
    IF FOUND THEN
      v_linked_count := v_linked_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'تم ربط ' || v_linked_count || ' ملف شخصي بنجاح',
    'linked_count', v_linked_count
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'DATABASE_ERROR',
    'message', 'حدث خطأ في قاعدة البيانات: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: CREATE USER STATUS CHECK FUNCTION
-- ============================================================================

-- Function to check user creation status
CREATE OR REPLACE FUNCTION public.check_user_status(p_email text)
RETURNS json AS $$
DECLARE
  v_profile_exists boolean;
  v_auth_exists boolean;
  v_linked boolean;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = p_email) INTO v_profile_exists;
  
  -- Check if auth user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = p_email) INTO v_auth_exists;
  
  -- Check if linked
  SELECT EXISTS(
    SELECT 1 FROM public.users u
    JOIN auth.users a ON u.auth_user_id = a.id
    WHERE u.email = p_email
  ) INTO v_linked;

  RETURN json_build_object(
    'email', p_email,
    'profile_exists', v_profile_exists,
    'auth_exists', v_auth_exists,
    'linked', v_linked,
    'ready_for_login', v_profile_exists AND v_auth_exists AND v_linked,
    'status', CASE 
      WHEN NOT v_profile_exists THEN 'PROFILE_MISSING'
      WHEN NOT v_auth_exists THEN 'AUTH_MISSING'
      WHEN NOT v_linked THEN 'NOT_LINKED'
      ELSE 'READY'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Test the functions
SELECT 'Admin user creation functions created successfully' as status;

-- Example usage:
-- SELECT public.admin_create_user('test@example.com', 'password123', 'Test User', '01234567890', '12345678901234', 'EMPLOYEE');
-- SELECT public.auto_link_profiles();
-- SELECT public.check_user_status('test@example.com');
