-- Backend-managed Fitora coach profiles and public coach photos.

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  specialty text not null,
  bio text not null default '',
  experience_years integer not null default 0 check (experience_years >= 0),
  rating numeric(2,1) not null default 5.0 check (rating between 0 and 5),
  clients_count integer not null default 0 check (clients_count >= 0),
  expertise text[] not null default '{}',
  photo_url text not null,
  photo_path text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists coaches_set_updated_at on public.coaches;
create trigger coaches_set_updated_at before update on public.coaches
for each row execute function public.set_updated_at();

alter table public.coaches enable row level security;

drop policy if exists "Authenticated users can view active coaches" on public.coaches;
create policy "Authenticated users can view active coaches" on public.coaches
for select to authenticated using (is_active = true or public.is_admin());

drop policy if exists "Admins can create coaches" on public.coaches;
create policy "Admins can create coaches" on public.coaches
for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins can update coaches" on public.coaches;
create policy "Admins can update coaches" on public.coaches
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete coaches" on public.coaches;
create policy "Admins can delete coaches" on public.coaches
for delete to authenticated using (public.is_admin());

grant select, insert, update, delete on public.coaches to authenticated;
revoke all on public.coaches from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-images', 'coach-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload coach images" on storage.objects;
create policy "Admins can upload coach images" on storage.objects
for insert to authenticated with check (bucket_id = 'coach-images' and public.is_admin());

drop policy if exists "Admins can update coach images" on storage.objects;
create policy "Admins can update coach images" on storage.objects
for update to authenticated using (bucket_id = 'coach-images' and public.is_admin())
with check (bucket_id = 'coach-images' and public.is_admin());

drop policy if exists "Admins can delete coach images" on storage.objects;
create policy "Admins can delete coach images" on storage.objects
for delete to authenticated using (bucket_id = 'coach-images' and public.is_admin());
