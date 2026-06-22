-- ============================================================================
-- ProjectGuide – Initiales Datenmodell inkl. Row Level Security
-- ============================================================================
-- Ausfuehren via Supabase SQL Editor oder `supabase db push`.
-- ----------------------------------------------------------------------------

-- gen_random_uuid()
create extension if not exists "pgcrypto";

-- ============================================================================
-- Tabellen
-- ============================================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  role         text default 'student',
  created_at   timestamptz not null default now()
);

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  subject       text,
  description   text,
  project_type  text not null default 'single' check (project_type in ('single','team')),
  deadline      date,
  current_phase text not null default 'informieren'
                  check (current_phase in ('informieren','planen','entscheiden','realisieren','kontrollieren','auswerten')),
  join_code     text unique,
  created_at    timestamptz not null default now()
);

create table if not exists public.project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'member' check (role in ('leader','member')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.phases (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  key         text not null
                check (key in ('informieren','planen','entscheiden','realisieren','kontrollieren','auswerten')),
  status      text not null default 'open' check (status in ('open','in_progress','done')),
  order_index int  not null,
  start_date  date,
  end_date    date,
  unique (project_id, key)
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  phase_id    uuid references public.phases (id) on delete set null,
  title       text not null,
  description text,
  assignee_id uuid references auth.users (id) on delete set null,
  status      text not null default 'open' check (status in ('open','in_progress','review','done')),
  due_date    date,
  created_at  timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id          uuid primary key default gen_random_uuid(),
  phase_id    uuid not null references public.phases (id) on delete cascade,
  label       text not null,
  is_done     boolean not null default false,
  order_index int not null default 0
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  task_id    uuid references public.tasks (id) on delete cascade,
  author_id  uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_id   uuid not null references auth.users (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  name         text not null,
  storage_path text not null,
  uploaded_by  uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- Hilfreiche Indizes
create index if not exists idx_members_project on public.project_members (project_id);
create index if not exists idx_members_user    on public.project_members (user_id);
create index if not exists idx_phases_project  on public.phases (project_id);
create index if not exists idx_tasks_project   on public.tasks (project_id);
create index if not exists idx_checklist_phase on public.checklist_items (phase_id);
create index if not exists idx_comments_project on public.comments (project_id);
create index if not exists idx_activities_project on public.activities (project_id);
create index if not exists idx_files_project   on public.files (project_id);

-- ============================================================================
-- Hilfsfunktion: Ist der aktuelle Nutzer Mitglied (oder Owner) des Projekts?
-- SECURITY DEFINER vermeidet rekursive RLS-Auswertung.
-- ============================================================================
create or replace function public.is_project_member(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_members m
    where m.project_id = p_project and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_owner(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and p.owner_id = auth.uid()
  );
$$;

-- ============================================================================
-- Trigger: bei Registrierung automatisch ein Profil anlegen
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Trigger: beim Anlegen eines Projekts die 6 IPERKA-Phasen erzeugen
-- und den Owner als Leader-Mitglied eintragen.
-- ============================================================================
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'leader')
  on conflict (project_id, user_id) do nothing;

  insert into public.phases (project_id, key, order_index, status) values
    (new.id, 'informieren',   1, 'in_progress'),
    (new.id, 'planen',        2, 'open'),
    (new.id, 'entscheiden',   3, 'open'),
    (new.id, 'realisieren',   4, 'open'),
    (new.id, 'kontrollieren', 5, 'open'),
    (new.id, 'auswerten',     6, 'open')
  on conflict (project_id, key) do nothing;

  return new;
end;
$$;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.phases          enable row level security;
alter table public.tasks           enable row level security;
alter table public.checklist_items enable row level security;
alter table public.comments        enable row level security;
alter table public.activities      enable row level security;
alter table public.files           enable row level security;

-- profiles: jeder Angemeldete darf Profile lesen (fuer Team-Anzeige),
-- aber nur das eigene aendern.
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- projects
create policy "projects_select_member" on public.projects
  for select to authenticated using (public.is_project_member(id));
create policy "projects_insert_owner" on public.projects
  for insert to authenticated with check (owner_id = auth.uid());
create policy "projects_update_member" on public.projects
  for update to authenticated using (public.is_project_member(id)) with check (public.is_project_member(id));
create policy "projects_delete_owner" on public.projects
  for delete to authenticated using (owner_id = auth.uid());

-- project_members
create policy "members_select" on public.project_members
  for select to authenticated using (public.is_project_member(project_id));
-- Beitritt: man traegt sich selbst ein; Owner darf ebenfalls hinzufuegen.
create policy "members_insert" on public.project_members
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_project_owner(project_id));
create policy "members_delete" on public.project_members
  for delete to authenticated
  using (user_id = auth.uid() or public.is_project_owner(project_id));

-- phases
create policy "phases_select" on public.phases
  for select to authenticated using (public.is_project_member(project_id));
create policy "phases_cud" on public.phases
  for all to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

-- tasks
create policy "tasks_select" on public.tasks
  for select to authenticated using (public.is_project_member(project_id));
create policy "tasks_cud" on public.tasks
  for all to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

-- checklist_items (Projektbezug ueber die Phase)
create policy "checklist_select" on public.checklist_items
  for select to authenticated
  using (exists (select 1 from public.phases ph where ph.id = phase_id and public.is_project_member(ph.project_id)));
create policy "checklist_cud" on public.checklist_items
  for all to authenticated
  using (exists (select 1 from public.phases ph where ph.id = phase_id and public.is_project_member(ph.project_id)))
  with check (exists (select 1 from public.phases ph where ph.id = phase_id and public.is_project_member(ph.project_id)));

-- comments
create policy "comments_select" on public.comments
  for select to authenticated using (public.is_project_member(project_id));
create policy "comments_insert" on public.comments
  for insert to authenticated with check (author_id = auth.uid() and public.is_project_member(project_id));
create policy "comments_delete_own" on public.comments
  for delete to authenticated using (author_id = auth.uid() or public.is_project_owner(project_id));

-- activities
create policy "activities_select" on public.activities
  for select to authenticated using (public.is_project_member(project_id));
create policy "activities_insert" on public.activities
  for insert to authenticated with check (actor_id = auth.uid() and public.is_project_member(project_id));

-- files (Metadaten)
create policy "files_select" on public.files
  for select to authenticated using (public.is_project_member(project_id));
create policy "files_cud" on public.files
  for all to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

-- ============================================================================
-- Storage-Bucket fuer Projektdateien
-- Pfad-Konvention: <project_id>/<dateiname>
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "project_files_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-files'
    and public.is_project_member((split_part(name, '/', 1))::uuid)
  );

create policy "project_files_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and public.is_project_member((split_part(name, '/', 1))::uuid)
  );

create policy "project_files_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-files'
    and public.is_project_member((split_part(name, '/', 1))::uuid)
  );
