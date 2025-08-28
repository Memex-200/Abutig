-- Seed complaint types
INSERT INTO public.complaint_types (name, icon, description, color)
VALUES
  ('مشاكل الصرف الصحي', '🚰', 'مشاكل في شبكة الصرف الصحي', '#EF4444'),
  ('مشاكل الكهرباء', '⚡', 'مشاكل في شبكة الكهرباء', '#F59E0B'),
  ('مشاكل الطرق', '🛣️', 'مشاكل في الطرق والشوارع', '#10B981'),
  ('مشاكل النظافة', '🧹', 'مشاكل في النظافة العامة', '#8B5CF6'),
  ('مشاكل المياه', '💧', 'مشاكل في شبكة المياه', '#06B6D4'),
  ('الأمان والسلامة العامة', '🛡️', 'مشاكل أمنية وسلامة عامة', '#84CC16'),
  ('مشاكل أخرى', '📋', 'مشاكل أخرى متنوعة', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Verify
SELECT id, name, icon, is_active FROM public.complaint_types ORDER BY name;
