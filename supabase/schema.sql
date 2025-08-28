-- Simplified schema for public complaints + admin management (no auth)

create table if not exists public.complaint_types (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  name text not null,
  phone text not null,
  email text not null,
  national_id text not null,
  title text not null,
  details text not null,
  image_url text,
  type_id uuid references public.complaint_types(id) on delete set null,
  address text not null,
  status text not null default 'Pending'
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null
);

-- Seed complaint types
insert into public.complaint_types (name)
values ('Service Issue'), ('Product Complaint'), ('Other')
on conflict do nothing;

-- Seed admin (plaintext for demo)
insert into public.admins (email, password)
values ('emanhassanmahmoud1@gmail.com', 'Emovmmm#951753')
on conflict (email) do nothing;

-- Storage bucket should be created manually or via UI: "complaint-images"
-- For SQL API provisioning (if using PostgREST + storage SQL), run separately:
-- select storage.create_bucket('complaint-images', true, 'public');
-- Enums
create type user_role as enum ('CITIZEN','EMPLOYEE','ADMIN');
create type complaint_status as enum ('NEW','IN_PROGRESS','RESOLVED','OVERDUE');

-- Tables
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text unique,
  phone text,
  national_id varchar(14) unique,
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
  type_id uuid not null references public.complaint_types(id) on delete restrict,
  title text not null,
  description text not null,
  location jsonb,
  status complaint_status not null default 'NEW',
  national_id varchar(14) not null,
  tracking_code varchar(20) unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.complaint_files (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
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

-- Admin/Employee audit logs (generic actions not tied to a single complaint)
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

-- Indexes
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_type_id on public.complaints(type_id);
create index if not exists idx_complaints_created_at on public.complaints(created_at);

-- RLS
alter table public.users enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_files enable row level security;
alter table public.complaint_history enable row level security;
alter table public.complaint_types enable row level security;
alter table public.settings enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Drop existing policies if they exist
drop policy if exists users_self_access on public.users;
drop policy if exists users_self_update on public.users;
drop policy if exists complaints_citizen_select on public.complaints;
drop policy if exists complaints_citizen_insert on public.complaints;
drop policy if exists files_citizen_select on public.complaint_files;
drop policy if exists files_citizen_insert on public.complaint_files;
drop policy if exists history_citizen_select on public.complaint_history;
drop policy if exists admin_full_access_users on public.users;
drop policy if exists admin_full_access_complaints on public.complaints;
drop policy if exists admin_full_access_complaint_types on public.complaint_types;
drop policy if exists admin_full_access_complaint_files on public.complaint_files;
drop policy if exists admin_full_access_complaint_history on public.complaint_history;
drop policy if exists admin_full_access_settings on public.settings;
drop policy if exists admin_full_access_admin_audit_logs on public.admin_audit_logs;
drop policy if exists employee_read_complaints on public.complaints;
drop policy if exists employee_read_complaint_types on public.complaint_types;
drop policy if exists citizen_read_own_complaints on public.complaints;
drop policy if exists public_read_complaint_types on public.complaint_types;
drop policy if exists public_insert_complaints on public.complaints;

-- Allow user creation during setup (temporary policy)
create policy allow_user_creation on public.users
  for insert with check (true);

-- Allow user updates for existing users
create policy allow_user_updates on public.users
  for update using (auth_user_id = auth.uid() or role = 'ADMIN');

-- Allow users to read their own profile
create policy users_self_access on public.users
  for select using (auth_user_id = auth.uid());

-- Admin policies (full access for admin account)
create policy admin_full_access_users on public.users
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

create policy admin_full_access_complaints on public.complaints
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

create policy admin_full_access_complaint_types on public.complaint_types
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

create policy admin_full_access_complaint_files on public.complaint_files
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

create policy admin_full_access_complaint_history on public.complaint_history
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

create policy admin_full_access_settings on public.settings
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

create policy admin_full_access_admin_audit_logs on public.admin_audit_logs
  for all using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'ADMIN' and u.is_active = true
    )
  );

-- Employee policies (read access to complaints and types)
create policy employee_read_complaints on public.complaints
  for select using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'EMPLOYEE' and u.is_active = true
    )
  );

create policy employee_read_complaint_types on public.complaint_types
  for select using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'EMPLOYEE' and u.is_active = true
    )
  );

-- Citizen policies (read-only access to their own complaints)
create policy citizen_read_own_complaints on public.complaints
  for select using (
    exists (
      select 1 from public.users u
      where u.id = complaints.citizen_id and u.auth_user_id = auth.uid()
    )
  );

-- Public read access to complaint types (for complaint form)
create policy public_read_complaint_types on public.complaint_types
  for select using (true);

-- Insert policy for complaints (for complaint form)
create policy public_insert_complaints on public.complaints
  for insert with check (true);

-- Function to automatically create user profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (auth_user_id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    'CITIZEN',
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to generate human-friendly unique tracking code for complaints
create or replace function public.generate_tracking_code()
returns text as $$
declare
  code text;
begin
  -- Format: ATG-YYYYMMDD-XXXX (random base36)
  code := 'ATG-' || to_char(now(), 'YYYYMMDD') || '-' || substring(replace(encode(gen_random_bytes(6), 'base64'), '/', '0') from 1 for 6);
  code := upper(replace(replace(code, '+', '1'), '=', '2'));
  return code;
end;
$$ language plpgsql volatile;

-- Trigger to auto-fill tracking_code and updated_at
create or replace function public.handle_complaint_insert()
returns trigger as $$
begin
  if new.tracking_code is null then
    new.tracking_code := public.generate_tracking_code();
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_complaint_insert on public.complaints;
create trigger on_complaint_insert
  before insert on public.complaints
  for each row execute procedure public.handle_complaint_insert();

create or replace function public.handle_complaint_update_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_complaint_update on public.complaints;
create trigger on_complaint_update
  before update on public.complaints
  for each row execute procedure public.handle_complaint_update_timestamp();


