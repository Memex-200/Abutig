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

-- Users policies
create policy users_self_access on public.users
  for select using (
    auth.uid() is not null and auth.uid() = auth_user_id
  );
create policy users_self_update on public.users
  for update using (
    auth.uid() is not null and auth.uid() = auth_user_id
  ) with check (
    auth.uid() = auth_user_id and role = role and is_active = is_active
  );
-- Employees/Admins can view all (handled via service role or add JWT claims-based check if using custom JWT)

-- Complaints policies
create policy complaints_citizen_select on public.complaints
  for select using (
    exists (
      select 1 from public.users u
      where u.id = complaints.citizen_id and u.auth_user_id = auth.uid()
    )
  );
create policy complaints_citizen_insert on public.complaints
  for insert with check (
    exists (
      select 1 from public.users u
      where u.id = citizen_id and u.auth_user_id = auth.uid()
    )
  );

-- Files policies
create policy files_citizen_select on public.complaint_files
  for select using (
    exists (
      select 1 from public.complaints c
      join public.users u on u.id = c.citizen_id
      where c.id = complaint_files.complaint_id and u.auth_user_id = auth.uid()
    )
  );
create policy files_citizen_insert on public.complaint_files
  for insert with check (
    exists (
      select 1 from public.complaints c
      join public.users u on u.id = c.citizen_id
      where c.id = complaint_id and u.auth_user_id = auth.uid()
    )
  );

-- History policies
create policy history_citizen_select on public.complaint_history
  for select using (
    exists (
      select 1 from public.complaints c
      join public.users u on u.id = c.citizen_id
      where c.id = complaint_history.complaint_id and u.auth_user_id = auth.uid()
    )
  );

-- Note: Staff/Admin broader access should be enforced via service role on serverless functions,
-- or by issuing custom JWTs with role claims and extending policies accordingly.


