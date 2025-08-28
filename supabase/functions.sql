-- Comprehensive Functions for Complaint Management System
-- This script creates all necessary functions for the system

-- ============================================================================
-- COMPLAINT MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to submit a new complaint with validation
CREATE OR REPLACE FUNCTION public.submit_complaint(
  p_type_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_location JSONB DEFAULT NULL,
  p_priority TEXT DEFAULT 'MEDIUM'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_complaint_id UUID;
  v_tracking_code TEXT;
  v_result JSON;
BEGIN
  -- Get current user ID
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  AND role = 'CITIZEN'
  AND is_active = true;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'لم يتم العثور على المستخدم أو ليس لديك صلاحية لتقديم شكوى'
    );
  END IF;
  
  -- Validate input
  IF p_title IS NULL OR length(trim(p_title)) < 5 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_TITLE',
      'message', 'يجب أن يكون عنوان الشكوى 5 أحرف على الأقل'
    );
  END IF;
  
  IF p_description IS NULL OR length(trim(p_description)) < 10 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_DESCRIPTION',
      'message', 'يجب أن يكون وصف الشكوى 10 أحرف على الأقل'
    );
  END IF;
  
  -- Validate complaint type
  IF NOT EXISTS (SELECT 1 FROM public.complaint_types WHERE id = p_type_id AND is_active = true) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_TYPE',
      'message', 'نوع الشكوى غير صحيح'
    );
  END IF;
  
  -- Create complaint
  INSERT INTO public.complaints (
    citizen_id,
    type_id,
    title,
    description,
    location,
    priority
  ) VALUES (
    v_user_id,
    p_type_id,
    trim(p_title),
    trim(p_description),
    p_location,
    p_priority
  ) RETURNING id, tracking_code INTO v_complaint_id, v_tracking_code;
  
  -- Create notification for admin
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_complaint_id
  )
  SELECT 
    u.id,
    'شكوى جديدة',
    'تم تقديم شكوى جديدة: ' || p_title,
    'GENERAL',
    v_complaint_id
  FROM public.users u
  WHERE u.role = 'ADMIN' AND u.is_active = true;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'complaint_id', v_complaint_id,
    'tracking_code', v_tracking_code,
    'message', 'تم تقديم الشكوى بنجاح! رقم التتبع: ' || v_tracking_code
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'DATABASE_ERROR',
    'message', 'حدث خطأ في قاعدة البيانات: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update complaint status
CREATE OR REPLACE FUNCTION public.update_complaint_status(
  p_complaint_id UUID,
  p_new_status complaint_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_user_role user_role;
  v_complaint_record RECORD;
  v_result JSON;
BEGIN
  -- Get current user info
  SELECT id, role INTO v_user_id, v_user_role
  FROM public.users
  WHERE auth_user_id = auth.uid() AND is_active = true;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'لم يتم العثور على المستخدم'
    );
  END IF;
  
  -- Get complaint info
  SELECT * INTO v_complaint_record
  FROM public.complaints
  WHERE id = p_complaint_id;
  
  IF v_complaint_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'COMPLAINT_NOT_FOUND',
      'message', 'لم يتم العثور على الشكوى'
    );
  END IF;
  
  -- Check permissions
  IF v_user_role = 'CITIZEN' AND v_complaint_record.citizen_id != v_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'ليس لديك صلاحية لتحديث هذه الشكوى'
    );
  END IF;
  
  IF v_user_role = 'EMPLOYEE' AND v_complaint_record.assigned_user_id != v_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'ليس لديك صلاحية لتحديث هذه الشكوى'
    );
  END IF;
  
  -- Update complaint status
  UPDATE public.complaints
  SET 
    status = p_new_status,
    actual_resolution_date = CASE WHEN p_new_status = 'RESOLVED' THEN now() ELSE actual_resolution_date END
  WHERE id = p_complaint_id;
  
  -- Create notification for citizen
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_complaint_id
  ) VALUES (
    v_complaint_record.citizen_id,
    'تحديث حالة الشكوى',
    'تم تحديث حالة شكواك إلى: ' || 
    CASE p_new_status
      WHEN 'NEW' THEN 'جديدة'
      WHEN 'IN_PROGRESS' THEN 'قيد المعالجة'
      WHEN 'RESOLVED' THEN 'تم الحل'
      WHEN 'OVERDUE' THEN 'متأخرة'
      WHEN 'CANCELLED' THEN 'ملغية'
    END,
    'STATUS_UPDATE',
    p_complaint_id
  );
  
  -- Log the action
  INSERT INTO public.admin_audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    v_user_id,
    'UPDATE_COMPLAINT_STATUS',
    'complaint',
    p_complaint_id,
    jsonb_build_object(
      'old_status', v_complaint_record.status,
      'new_status', p_new_status,
      'notes', p_notes
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'تم تحديث حالة الشكوى بنجاح'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'DATABASE_ERROR',
    'message', 'حدث خطأ في قاعدة البيانات: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign complaint to employee
CREATE OR REPLACE FUNCTION public.assign_complaint(
  p_complaint_id UUID,
  p_employee_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_user_role user_role;
  v_employee_record RECORD;
  v_complaint_record RECORD;
BEGIN
  -- Check if current user is admin
  SELECT id, role INTO v_user_id, v_user_role
  FROM public.users
  WHERE auth_user_id = auth.uid() AND is_active = true;
  
  IF v_user_id IS NULL OR v_user_role != 'ADMIN' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'ليس لديك صلاحية لتعيين الشكاوى'
    );
  END IF;
  
  -- Check if employee exists and is active
  SELECT * INTO v_employee_record
  FROM public.users
  WHERE id = p_employee_id AND role = 'EMPLOYEE' AND is_active = true;
  
  IF v_employee_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EMPLOYEE_NOT_FOUND',
      'message', 'لم يتم العثور على الموظف'
    );
  END IF;
  
  -- Check if complaint exists
  SELECT * INTO v_complaint_record
  FROM public.complaints
  WHERE id = p_complaint_id;
  
  IF v_complaint_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'COMPLAINT_NOT_FOUND',
      'message', 'لم يتم العثور على الشكوى'
    );
  END IF;
  
  -- Assign complaint
  UPDATE public.complaints
  SET assigned_user_id = p_employee_id
  WHERE id = p_complaint_id;
  
  -- Create notification for employee
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_complaint_id
  ) VALUES (
    p_employee_id,
    'شكوى جديدة مخصصة لك',
    'تم تعيين شكوى جديدة لك: ' || v_complaint_record.title,
    'ASSIGNMENT',
    p_complaint_id
  );
  
  -- Create notification for citizen
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_complaint_id
  ) VALUES (
    v_complaint_record.citizen_id,
    'تم تعيين شكواك',
    'تم تعيين شكواك إلى موظف للمراجعة',
    'ASSIGNMENT',
    p_complaint_id
  );
  
  -- Log the action
  INSERT INTO public.admin_audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    v_user_id,
    'ASSIGN_COMPLAINT',
    'complaint',
    p_complaint_id,
    jsonb_build_object(
      'employee_id', p_employee_id,
      'employee_name', v_employee_record.full_name
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'تم تعيين الشكوى بنجاح'
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
-- USER MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to get user profile with role-based data
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS JSON AS $$
DECLARE
  v_user_record RECORD;
  v_complaints_count INTEGER;
  v_notifications_count INTEGER;
BEGIN
  -- Get user info
  SELECT 
    u.id,
    u.full_name,
    u.email,
    u.phone,
    u.national_id,
    u.role,
    u.avatar_url,
    u.created_at
  INTO v_user_record
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true;
  
  IF v_user_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'لم يتم العثور على المستخدم'
    );
  END IF;
  
  -- Get complaints count based on role
  IF v_user_record.role = 'CITIZEN' THEN
    SELECT COUNT(*) INTO v_complaints_count
    FROM public.complaints
    WHERE citizen_id = v_user_record.id;
  ELSIF v_user_record.role = 'EMPLOYEE' THEN
    SELECT COUNT(*) INTO v_complaints_count
    FROM public.complaints
    WHERE assigned_user_id = v_user_record.id;
  ELSE -- ADMIN
    SELECT COUNT(*) INTO v_complaints_count
    FROM public.complaints;
  END IF;
  
  -- Get unread notifications count
  SELECT COUNT(*) INTO v_notifications_count
  FROM public.notifications
  WHERE user_id = v_user_record.id AND is_read = false;
  
  -- Return user profile (hide national_id for non-admin users)
  RETURN json_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user_record.id,
      'full_name', v_user_record.full_name,
      'email', v_user_record.email,
      'phone', v_user_record.phone,
      'national_id', CASE WHEN v_user_record.role = 'ADMIN' THEN v_user_record.national_id ELSE NULL END,
      'role', v_user_record.role,
      'avatar_url', v_user_record.avatar_url,
      'created_at', v_user_record.created_at,
      'complaints_count', v_complaints_count,
      'notifications_count', v_notifications_count
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

-- Function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid() AND is_active = true;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'لم يتم العثور على المستخدم'
    );
  END IF;
  
  -- Validate input
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_NAME',
      'message', 'يجب أن يكون الاسم 2 أحرف على الأقل'
    );
  END IF;
  
  -- Update profile
  UPDATE public.users
  SET 
    full_name = trim(p_full_name),
    phone = p_phone,
    updated_at = now()
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'تم تحديث الملف الشخصي بنجاح'
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
-- NOTIFICATION FUNCTIONS
-- ============================================================================

-- Function to get user notifications
CREATE OR REPLACE FUNCTION public.get_notifications(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_notifications JSON;
  v_total_count INTEGER;
BEGIN
  -- Get current user ID
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid() AND is_active = true;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'لم يتم العثور على المستخدم'
    );
  END IF;
  
  -- Get notifications
  SELECT json_agg(
    json_build_object(
      'id', n.id,
      'title', n.title,
      'message', n.message,
      'type', n.type,
      'is_read', n.is_read,
      'created_at', n.created_at,
      'related_complaint_id', n.related_complaint_id
    )
  ) INTO v_notifications
  FROM public.notifications n
  WHERE n.user_id = v_user_id
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
  
  -- Get total count
  SELECT COUNT(*) INTO v_total_count
  FROM public.notifications
  WHERE user_id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'notifications', COALESCE(v_notifications, '[]'::json),
    'total_count', v_total_count
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'DATABASE_ERROR',
    'message', 'حدث خطأ في قاعدة البيانات: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid() AND is_active = true;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'لم يتم العثور على المستخدم'
    );
  END IF;
  
  -- Mark notification as read
  UPDATE public.notifications
  SET is_read = true
  WHERE id = p_notification_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NOTIFICATION_NOT_FOUND',
      'message', 'لم يتم العثور على الإشعار'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'تم تحديث الإشعار بنجاح'
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
-- STATISTICS FUNCTIONS
-- ============================================================================

-- Function to get complaint statistics (admin only)
CREATE OR REPLACE FUNCTION public.get_complaint_statistics()
RETURNS JSON AS $$
DECLARE
  v_user_role user_role;
  v_stats JSON;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_user_role
  FROM public.users
  WHERE auth_user_id = auth.uid() AND is_active = true;
  
  IF v_user_role != 'ADMIN' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'ليس لديك صلاحية لعرض الإحصائيات'
    );
  END IF;
  
  -- Get statistics
  SELECT json_build_object(
    'total_complaints', COUNT(*),
    'new_complaints', COUNT(*) FILTER (WHERE status = 'NEW'),
    'in_progress_complaints', COUNT(*) FILTER (WHERE status = 'IN_PROGRESS'),
    'resolved_complaints', COUNT(*) FILTER (WHERE status = 'RESOLVED'),
    'overdue_complaints', COUNT(*) FILTER (WHERE status = 'OVERDUE'),
    'cancelled_complaints', COUNT(*) FILTER (WHERE status = 'CANCELLED'),
    'complaints_by_type', (
      SELECT json_object_agg(ct.name, type_count)
      FROM (
        SELECT ct.name, COUNT(*) as type_count
        FROM public.complaints c
        JOIN public.complaint_types ct ON c.type_id = ct.id
        GROUP BY ct.name
      ) ct
    ),
    'recent_complaints', (
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'title', c.title,
          'status', c.status,
          'created_at', c.created_at,
          'citizen_name', u.full_name
        )
      )
      FROM public.complaints c
      JOIN public.users u ON c.citizen_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 10
    )
  ) INTO v_stats
  FROM public.complaints;
  
  RETURN json_build_object(
    'success', true,
    'statistics', v_stats
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
-- VERIFICATION
-- ============================================================================

-- Check all functions were created
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
