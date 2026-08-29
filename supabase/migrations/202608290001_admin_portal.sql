-- Admin package management and asynchronous Mux uploads.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.packages add column if not exists cover_url text;
alter table public.videos alter column mux_playback_id drop not null;
alter table public.videos add column if not exists mux_upload_id text unique;
alter table public.videos add column if not exists mux_asset_id text unique;
alter table public.videos add column if not exists status text not null default 'draft'
  check (status in ('draft', 'waiting', 'uploading', 'processing', 'ready', 'errored'));
alter table public.videos add column if not exists error_message text;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;

drop policy if exists "Admins can view admin membership" on public.admin_users;
create policy "Admins can view admin membership" on public.admin_users
for select to authenticated using (public.is_admin());

drop policy if exists "Admins can create packages" on public.packages;
create policy "Admins can create packages" on public.packages
for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins can update packages" on public.packages;
create policy "Admins can update packages" on public.packages
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can delete packages" on public.packages;
create policy "Admins can delete packages" on public.packages
for delete to authenticated using (public.is_admin());
drop policy if exists "Admins can view all packages" on public.packages;
create policy "Admins can view all packages" on public.packages
for select to authenticated using (public.is_admin());

drop policy if exists "Admins can create videos" on public.videos;
create policy "Admins can create videos" on public.videos
for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins can update videos" on public.videos;
create policy "Admins can update videos" on public.videos
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can delete videos" on public.videos;
create policy "Admins can delete videos" on public.videos
for delete to authenticated using (public.is_admin());
drop policy if exists "Admins can view all videos" on public.videos;
create policy "Admins can view all videos" on public.videos
for select to authenticated using (public.is_admin());

grant select on public.admin_users to authenticated;
grant insert, update, delete on public.packages, public.videos to authenticated;

-- After this migration, promote the first administrator from the SQL editor:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'ADMIN_EMAIL_HERE'
-- on conflict (user_id) do nothing;
