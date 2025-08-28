-- Complete Database Migration
-- This script drops all existing tables and creates a new improved schema

-- ============================================================================
-- STEP 1: DROP ALL EXISTING TABLES AND FUNCTIONS
-- ============================================================================

-- Drop all existing functions
DROP FUNCTION IF EXISTS public.submit_complaint_simple CASCADE;
DROP FUNCTION IF EXISTS public.lookup_complaints CASCADE;
DROP FUNCTION IF EXISTS public.get_user_complaints CASCADE;
DROP FUNCTION IF EXISTS public.create_citizen_if_not_exists CASCADE;
DROP FUNCTION IF EXISTS public.submit_complaint CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.generate_tracking_code CASCADE;
DROP FUNCTION IF EXISTS public.handle_complaint_insert CASCADE;
DROP FUNCTION IF EXISTS public.handle_complaint_update_timestamp CASCADE;

-- Drop all existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_complaint_insert ON public.complaints;
DROP TRIGGER IF EXISTS on_complaint_update ON public.complaints;

-- Drop all existing policies
DROP POLICY IF EXISTS allow_user_creation ON public.users;
DROP POLICY IF EXISTS allow_user_updates ON public.users;
DROP POLICY IF EXISTS users_self_access ON public.users;
DROP POLICY IF EXISTS users_self_update ON public.users;
DROP POLICY IF EXISTS admin_full_access_users ON public.users;
DROP POLICY IF EXISTS admin_full_access_complaints ON public.complaints;
DROP POLICY IF EXISTS admin_full_access_complaint_types ON public.complaint_types;
DROP POLICY IF EXISTS admin_full_access_complaint_files ON public.complaint_files;
DROP POLICY IF EXISTS admin_full_access_complaint_history ON public.complaint_history;
DROP POLICY IF EXISTS admin_full_access_settings ON public.settings;
DROP POLICY IF EXISTS admin_full_access_admin_audit_logs ON public.admin_audit_logs;
DROP POLICY IF EXISTS employee_read_complaints ON public.complaints;
DROP POLICY IF EXISTS employee_read_complaint_types ON public.complaint_types;
DROP POLICY IF EXISTS citizen_read_own_complaints ON public.complaints;
DROP POLICY IF EXISTS public_read_complaint_types ON public.complaint_types;
DROP POLICY IF EXISTS public_insert_complaints ON public.complaints;
DROP POLICY IF EXISTS citizen_insert_complaints ON public.complaints;
DROP POLICY IF EXISTS citizen_update_own_complaints ON public.complaints;
DROP POLICY IF EXISTS employee_read_assigned_complaints ON public.complaints;
DROP POLICY IF EXISTS employee_update_assigned_complaints ON public.complaints;
DROP POLICY IF EXISTS citizen_read_own_complaint_files ON public.complaint_files;
DROP POLICY IF EXISTS citizen_insert_own_complaint_files ON public.complaint_files;
DROP POLICY IF EXISTS employee_read_assigned_complaint_files ON public.complaint_files;
DROP POLICY IF EXISTS citizen_read_own_complaint_history ON public.complaint_history;
DROP POLICY IF EXISTS employee_read_assigned_complaint_history ON public.complaint_history;

-- Drop all existing tables
DROP TABLE IF EXISTS public.complaint_history CASCADE;
DROP TABLE IF EXISTS public.complaint_files CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.complaint_types CASCADE;
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS complaint_status CASCADE;

-- ============================================================================
-- STEP 2: CREATE NEW ENUMS
-- ============================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('CITIZEN', 'EMPLOYEE', 'ADMIN');

-- Complaint status enum
CREATE TYPE complaint_status AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'OVERDUE', 'CANCELLED');

-- Notification type enum
CREATE TYPE notification_type AS ENUM ('STATUS_UPDATE', 'ASSIGNMENT', 'RESOLUTION', 'GENERAL');

-- ============================================================================
-- STEP 3: CREATE NEW TABLES
-- ============================================================================

-- Users table (improved)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  national_id TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'CITIZEN',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Complaint types table
CREATE TABLE public.complaint_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Complaints table (improved)
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type_id UUID NOT NULL REFERENCES public.complaint_types(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB,
  status complaint_status NOT NULL DEFAULT 'NEW',
  priority TEXT DEFAULT 'MEDIUM',
  tracking_code TEXT UNIQUE,
  estimated_resolution_date DATE,
  actual_resolution_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Complaint files table
CREATE TABLE public.complaint_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Complaint history table (improved)
CREATE TABLE public.complaint_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status complaint_status,
  new_status complaint_status,
  performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table (new)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  related_complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settings table
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_national_id ON public.users(national_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);

-- Complaints indexes
CREATE INDEX idx_complaints_citizen_id ON public.complaints(citizen_id);
CREATE INDEX idx_complaints_assigned_user_id ON public.complaints(assigned_user_id);
CREATE INDEX idx_complaints_type_id ON public.complaints(type_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at);
CREATE INDEX idx_complaints_tracking_code ON public.complaints(tracking_code);

-- Complaint history indexes
CREATE INDEX idx_complaint_history_complaint_id ON public.complaint_history(complaint_id);
CREATE INDEX idx_complaint_history_performed_by ON public.complaint_history(performed_by);
CREATE INDEX idx_complaint_history_created_at ON public.complaint_history(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to generate tracking code
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Format: ATG-YYYYMMDD-XXXX (random base36)
    code := 'ATG-' || to_char(now(), 'YYYYMMDD') || '-' || 
            substring(replace(encode(gen_random_bytes(6), 'base64'), '/', '0') from 1 for 6);
    code := upper(replace(replace(code, '+', '1'), '=', '2'));
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.complaints WHERE tracking_code = code) THEN
      RETURN code;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'Could not generate unique tracking code after 10 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to handle complaint insert
CREATE OR REPLACE FUNCTION public.handle_complaint_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate tracking code if not provided
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := public.generate_tracking_code();
  END IF;
  
  -- Set updated_at
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle complaint update
CREATE OR REPLACE FUNCTION public.handle_complaint_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Set updated_at
  NEW.updated_at := now();
  
  -- If status changed, create history record
  IF OLD.status != NEW.status THEN
    INSERT INTO public.complaint_history (
      complaint_id,
      action,
      old_status,
      new_status,
      performed_by,
      details
    ) VALUES (
      NEW.id,
      'STATUS_CHANGE',
      OLD.status,
      NEW.status,
      auth.uid(),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    'CITIZEN',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: CREATE TRIGGERS
-- ============================================================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for complaint insert
CREATE TRIGGER on_complaint_insert
  BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE PROCEDURE public.handle_complaint_insert();

-- Trigger for complaint update
CREATE TRIGGER on_complaint_update
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE PROCEDURE public.handle_complaint_update();

-- ============================================================================
-- STEP 8: INSERT DEFAULT DATA
-- ============================================================================

-- Insert default complaint types
INSERT INTO public.complaint_types (name, icon, description, color) VALUES 
  ('مشاكل الصرف الصحي', '🚰', 'مشاكل في شبكة الصرف الصحي', '#EF4444'),
  ('مشاكل الكهرباء', '⚡', 'مشاكل في شبكة الكهرباء', '#F59E0B'),
  ('مشاكل الطرق', '🛣️', 'مشاكل في الطرق والشوارع', '#10B981'),
  ('مشاكل النظافة', '🧹', 'مشاكل في النظافة العامة', '#8B5CF6'),
  ('مشاكل المياه', '💧', 'مشاكل في شبكة المياه', '#06B6D4'),
  ('الأمان والسلامة العامة', '🛡️', 'مشاكل أمنية وسلامة عامة', '#84CC16'),
  ('مشاكل أخرى', '📋', 'مشاكل أخرى متنوعة', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES 
  ('system_name', '"مجلس مدينة أبو تيج"', 'اسم النظام'),
  ('max_file_size', '10485760', 'الحد الأقصى لحجم الملف (10MB)'),
  ('allowed_file_types', '["image/jpeg", "image/png", "image/gif", "application/pdf"]', 'أنواع الملفات المسموحة'),
  ('auto_assign_complaints', 'true', 'تعيين الشكاوى تلقائياً للموظفين'),
  ('notification_retention_days', '30', 'عدد أيام الاحتفاظ بالإشعارات')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- STEP 9: VERIFICATION
-- ============================================================================

-- Check all tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check all functions were created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check all triggers were created
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
