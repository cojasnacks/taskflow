-- ============================================
-- TASKFLOW — Schéma Supabase
-- Colle ce SQL dans : Supabase > SQL Editor > New Query
-- ============================================

-- 1. Profiles (auto-créé à chaque signup)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles visibles par tous les membres" on public.profiles
  for select using (true);

create policy "Utilisateur modifie son propre profil" on public.profiles
  for update using (auth.uid() = id);

-- Trigger : créer un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Projects
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text default '#5344B7',
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Membres peuvent voir le projet" on public.projects
  for select using (
    exists (
      select 1 from public.project_members
      where project_id = id and user_id = auth.uid()
    )
  );

create policy "Owner peut modifier" on public.projects
  for all using (owner_id = auth.uid());


-- 3. Project Members
create table if not exists public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(project_id, user_id)
);

alter table public.project_members enable row level security;

create policy "Membres voient les membres du projet" on public.project_members
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_id and pm.user_id = auth.uid()
    )
  );

create policy "Owner gère les membres" on public.project_members
  for all using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_id and pm.user_id = auth.uid() and pm.role = 'owner'
    )
  );

create policy "Self insert" on public.project_members
  for insert with check (user_id = auth.uid());


-- 4. Tasks
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  project_id uuid references public.projects(id) on delete cascade not null,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  status text default 'todo' check (status in ('todo', 'progress', 'review', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Membres voient les tâches du projet" on public.tasks
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_id and pm.user_id = auth.uid()
    )
  );

create policy "Membres créent des tâches" on public.tasks
  for insert with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_id and pm.user_id = auth.uid()
    )
  );

create policy "Membres modifient les tâches" on public.tasks
  for update using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_id and pm.user_id = auth.uid()
    )
  );

create policy "Membres suppriment les tâches" on public.tasks
  for delete using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_id and pm.user_id = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.update_updated_at();


-- 5. Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Utilisateur voit ses notifs" on public.notifications
  for select using (user_id = auth.uid());

create policy "Utilisateur modifie ses notifs" on public.notifications
  for update using (user_id = auth.uid());

create policy "Tout le monde peut créer une notif" on public.notifications
  for insert with check (true);


-- 6. Realtime (activer pour les tables)
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.notifications;
