-- Fixed Schema without Validation Constraints
-- This schema handles existing types and tables properly

-- Drop ALL existing policies first (including the ones causing the error)
drop policy if exists "allow_all_users" on public.users;
drop policy if exists "allow_all_complaints" on public.complaints;
drop policy if exists "allow_all_complaint_files" on public.complaint_files;
drop policy if exists "allow_all_complaint_history" on public.complaint_history;
drop policy if exists "allow_all_complaint_types" on public.complaint_types;
drop policy if exists "allow_all_settings" on public.settings;
drop policy if exists "allow_all_admin_audit_logs" on public.admin_audit_logs;

-- Drop the specific policy that's causing the error
drop policy if exists "citizen_read_own_complaints" on public.complaints;
drop policy if exists "citizen_insert_complaints" on public.complaints;
drop policy if exists "citizen_update_own_complaints" on public.complaints;
drop policy if exists "employee_read_assigned_complaints" on public.complaints;
drop policy if exists "employee_update_assigned_complaints" on public.complaints;
drop policy if exists "admin_full_access_complaints" on public.complaints;
drop policy if exists "public_insert_complaints" on public.complaints;

-- Drop other existing policies that might exist
drop policy if exists "users_self_access" on public.users;
drop policy if exists "users_self_update" on public.users;
drop policy if exists "admin_full_access_users" on public.users;
drop policy if exists "allow_user_creation" on public.users;
drop policy if exists "allow_user_updates" on public.users;

drop policy if exists "public_read_complaint_types" on public.complaint_types;
drop policy if exists "admin_full_access_complaint_types" on public.complaint_types;
drop policy if exists "employee_read_complaint_types" on public.complaint_types;

drop policy if exists "citizen_read_own_complaint_files" on public.complaint_files;
drop policy if exists "citizen_insert_own_complaint_files" on public.complaint_files;
drop policy if exists "employee_read_assigned_complaint_files" on public.complaint_files;
drop policy if exists "admin_full_access_complaint_files" on public.complaint_files;

drop policy if exists "citizen_read_own_complaint_history" on public.complaint_history;
drop policy if exists "employee_read_assigned_complaint_history" on public.complaint_history;
drop policy if exists "admin_full_access_complaint_history" on public.complaint_history;

drop policy if exists "admin_full_access_settings" on public.settings;
drop policy if exists "admin_full_access_admin_audit_logs" on public.admin_audit_logs;

-- Drop existing triggers
drop trigger if exists on_complaint_insert on public.complaints;
drop trigger if exists on_complaint_update on public.complaints;
drop trigger if exists on_auth_user_created on auth.users;

-- Drop existing functions
drop function if exists handle_complaint_insert();
drop function if exists handle_complaint_update_timestamp();
drop function if exists handle_new_user();
drop function if exists generate_tracking_code();

-- Modify existing tables to remove constraints (if they exist)
do $$
begin
  -- Modify users table
  if exists (select 1 from information_schema.tables where table_name = 'users' and table_schema = 'public') then
    alter table public.users alter column full_name drop not null;
    alter table public.users alter column email drop not null;
    alter table public.users drop constraint if exists users_email_key;
    alter table public.users alter column national_id type text;
    alter table public.users drop constraint if exists users_national_id_key;
  end if;
  
  -- Modify complaints table
  if exists (select 1 from information_schema.tables where table_name = 'complaints' and table_schema = 'public') then
    alter table public.complaints alter column type_id drop not null;
    alter table public.complaints alter column title drop not null;
    alter table public.complaints alter column description drop not null;
    alter table public.complaints alter column national_id type text;
    alter table public.complaints alter column national_id drop not null;
    alter table public.complaints alter column tracking_code type text;
    alter table public.complaints drop constraint if exists complaints_tracking_code_key;
  end if;
  
  -- Modify complaint_files table
  if exists (select 1 from information_schema.tables where table_name = 'complaint_files' and table_schema = 'public') then
    alter table public.complaint_files alter column file_type drop not null;
    alter table public.complaint_files alter column file_size drop not null;
  end if;
end $$;

-- Create simplified RLS Policies (allow all operations for testing)
create policy "allow_all_users" on public.users for all using (true);
create policy "allow_all_complaints" on public.complaints for all using (true);
create policy "allow_all_complaint_files" on public.complaint_files for all using (true);
create policy "allow_all_complaint_history" on public.complaint_history for all using (true);
create policy "allow_all_complaint_types" on public.complaint_types for all using (true);
create policy "allow_all_settings" on public.settings for all using (true);
create policy "allow_all_admin_audit_logs" on public.admin_audit_logs for all using (true);

-- Functions (simplified)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (auth_user_id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'CITIZEN');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function to generate tracking code (simplified)
create or replace function generate_tracking_code()
returns text as $$
begin
  return 'COMP-' || to_char(now(), 'YYYYMMDD') || '-' || 
         lpad(floor(random() * 10000)::text, 4, '0');
end;
$$ language plpgsql;

-- Function to handle complaint insert (simplified)
create or replace function handle_complaint_insert()
returns trigger as $$
begin
  -- Generate tracking code if not provided
  if new.tracking_code is null then
    new.tracking_code := generate_tracking_code();
  end if;
  
  -- Set national_id if not provided
  if new.national_id is null then
    select national_id into new.national_id from public.users where id = new.citizen_id;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger for complaint insert
create trigger on_complaint_insert
  before insert on public.complaints
  for each row execute procedure handle_complaint_insert();

-- Function to update timestamp (simplified)
create or replace function handle_complaint_update_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- Trigger for complaint update
create trigger on_complaint_update
  before update on public.complaints
  for each row execute procedure handle_complaint_update_timestamp();

-- Insert default complaint types (only if they don't exist)
insert into public.complaint_types (name, icon, description) values
  ('مشاكل الصرف الصحي', '🚰', 'مشاكل في شبكة الصرف الصحي'),
  ('مشاكل الكهرباء', '⚡', 'مشاكل في شبكة الكهرباء'),
  ('مشاكل الطرق', '🛣️', 'مشاكل في الطرق والشوارع'),
  ('مشاكل النظافة', '🧹', 'مشاكل في النظافة العامة'),
  ('مشاكل المياه', '💧', 'مشاكل في شبكة المياه'),
  ('الأمان والسلامة العامة', '🛡️', 'مشاكل أمنية وسلامة عامة'),
  ('مشاكل أخرى', '📋', 'مشاكل أخرى متنوعة')
on conflict (name) do nothing;
