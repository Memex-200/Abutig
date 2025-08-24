-- Seed data for the municipal complaints system

-- Clear existing data (if any)
DELETE FROM public.complaint_files;
DELETE FROM public.complaint_history;
DELETE FROM public.complaints;
DELETE FROM public.complaint_types;
-- Don't delete admin user if it exists, we'll handle it properly

-- Insert complaint types in Arabic with appropriate icons
INSERT INTO public.complaint_types (name, icon, description, is_active) VALUES
('مخالفات البناء', '🏗️', 'مخالفات البناء والبناء بدون ترخيص', true),
('مشاكل الصرف الصحي', '🚽', 'مشاكل في شبكة الصرف الصحي والصرف', true),
('النظافة وجمع القمامة', '🗑️', 'شكاوى النظافة العامة وجمع القمامة', true),
('إنارة الشوارع والكهرباء', '💡', 'مشاكل في إنارة الشوارع والكهرباء', true),
('صيانة الطرق', '🛣️', 'صيانة الطرق والأرصفة', true),
('مشاكل إمداد المياه', '💧', 'مشاكل في إمداد وتوزيع المياه', true),
('مشاكل المرور والمواقف', '🚗', 'إشارات المرور ومشاكل المواقف', true),
('الحدائق والمساحات الخضراء', '🌳', 'صيانة الحدائق العامة والمساحات الخضراء', true),
('شكاوى الضوضاء', '🔊', 'شكاوى الضوضاء والإزعاج', true),
('الأمان والسلامة العامة', '🛡️', 'مخاوف الأمان والسلامة العامة', true),
('أخرى', '📝', 'شكاوى أخرى لا تنتمي للفئات السابقة', true);

-- Note: Admin user will be created through the application interface
-- Email: emanhassanmahmoud1@gmail.com
-- Password: Emovmmm#951753
-- Role: ADMIN

-- Instructions for creating the admin account:
-- 1. Run the application: npm run dev
-- 2. Go to: http://localhost:5173/admin-setup
-- 3. Click "إنشاء حساب المدير" button
-- 4. This will create the auth user and link it to the profile automatically
