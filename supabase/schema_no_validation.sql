-- Simplified Schema without Validation Constraints
-- This schema removes all validation constraints while keeping basic functionality

-- Enums
create type user_role as enum ('CITIZEN','EMPLOYEE','ADMIN');
create type complaint_status as enum ('NEW','IN_PROGRESS','RESOLVED','OVERDUE');

-- Tables (simplified without validation constraints)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text, -- Removed NOT NULL constraint
  email text, -- Removed UNIQUE constraint
  phone text,
  national_id text, -- Changed from varchar(14) to text, removed UNIQUE
  role user_role not null default 'CITIZEN',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.complaint_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.users(id) on delete restrict,
  assigned_user_id uuid references public.users(id) on delete set null,
  type_id uuid references public.complaint_types(id) on delete restrict, -- Removed NOT NULL
  title text, -- Removed NOT NULL constraint
  description text, -- Removed NOT NULL constraint
  location jsonb,
  status complaint_status not null default 'NEW',
  national_id text, -- Changed from varchar(14) to text, removed NOT NULL
  tracking_code text, -- Changed from varchar(20) to text, removed UNIQUE
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.complaint_files (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  file_path text not null,
  file_type text, -- Removed NOT NULL constraint
  file_size integer, -- Removed NOT NULL constraint
  uploaded_at timestamptz not null default now()
);

create table if not exists public.complaint_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  action text not null,
  performed_by uuid references public.users(id) on delete set null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Admin/Employee audit logs
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null
);

-- Indexes (simplified)
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_created_at on public.complaints(created_at);

-- RLS (simplified policies)
alter table public.users enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_files enable row level security;
alter table public.complaint_history enable row level security;
alter table public.complaint_types enable row level security;
alter table public.settings enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Simplified RLS Policies (allow all operations for testing)
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
drop trigger if exists on_auth_user_created on auth.users;
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
drop trigger if exists on_complaint_insert on public.complaints;
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
drop trigger if exists on_complaint_update on public.complaints;
create trigger on_complaint_update
  before update on public.complaints
  for each row execute procedure handle_complaint_update_timestamp();

-- Insert default complaint types
insert into public.complaint_types (name, icon, description) values
  ('مشاكل الصرف الصحي', '🚰', 'مشاكل في شبكة الصرف الصحي'),
  ('مشاكل الكهرباء', '⚡', 'مشاكل في شبكة الكهرباء'),
  ('مشاكل الطرق', '🛣️', 'مشاكل في الطرق والشوارع'),
  ('مشاكل النظافة', '🧹', 'مشاكل في النظافة العامة'),
  ('مشاكل المياه', '💧', 'مشاكل في شبكة المياه'),
  ('الأمان والسلامة العامة', '🛡️', 'مشاكل أمنية وسلامة عامة'),
  ('مشاكل أخرى', '📋', 'مشاكل أخرى متنوعة')
on conflict (name) do nothing;
