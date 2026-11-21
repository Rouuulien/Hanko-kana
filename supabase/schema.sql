-- Hanko · base de données Supabase
-- À exécuter une seule fois dans Supabase : SQL Editor → New query → coller → Run.

-- 1. Une ligne de progression par utilisateur
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_taille check (pg_column_size(data) < 200000)
);

-- 2. Sécurité : chacun ne voit et ne modifie que sa propre progression
alter table public.progress enable row level security;

drop policy if exists "progress_lecture" on public.progress;
drop policy if exists "progress_creation" on public.progress;
drop policy if exists "progress_modification" on public.progress;
drop policy if exists "progress_suppression" on public.progress;

create policy "progress_lecture" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress_creation" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress_modification" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progress_suppression" on public.progress
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

-- 3. Suppression de compte par l'utilisateur lui-même (bouton « Supprimer mon compte »)
--    La progression est effacée en cascade.
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'non connecté';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
