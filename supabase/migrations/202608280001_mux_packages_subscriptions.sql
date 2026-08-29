-- Fitora course catalog, Mux videos, and package-scoped subscriptions.

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_inr integer not null check (price_inr >= 0),
  duration_days integer not null default 30 check (duration_days > 0),
  benefits jsonb not null default '[]'::jsonb,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  title text not null,
  description text not null default '',
  trainer text not null default 'Coach Kal',
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  mux_playback_id text not null,
  thumbnail_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mux_playback_id)
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  payment_provider text not null default 'dummy',
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, package_id)
);

create index if not exists videos_package_id_idx on public.videos(package_id);
create index if not exists subscriptions_user_active_idx on public.user_subscriptions(user_id, status, expires_at);

drop trigger if exists packages_set_updated_at on public.packages;
create trigger packages_set_updated_at before update on public.packages
for each row execute function public.set_updated_at();

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at before update on public.videos
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.user_subscriptions;
create trigger subscriptions_set_updated_at before update on public.user_subscriptions
for each row execute function public.set_updated_at();

alter table public.packages enable row level security;
alter table public.videos enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists "Authenticated users can view active packages" on public.packages;
create policy "Authenticated users can view active packages" on public.packages
for select to authenticated using (is_active = true);

drop policy if exists "Users can view entitled videos" on public.videos;
create policy "Users can view entitled videos" on public.videos
for select to authenticated using (
  is_published = true and exists (
    select 1 from public.user_subscriptions s
    where s.user_id = (select auth.uid())
      and s.package_id = videos.package_id
      and s.status = 'active'
      and s.expires_at > now()
  )
);

drop policy if exists "Users can view own subscriptions" on public.user_subscriptions;
create policy "Users can view own subscriptions" on public.user_subscriptions
for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.packages, public.videos, public.user_subscriptions from anon;
grant select on public.packages, public.videos, public.user_subscriptions to authenticated;

create or replace function public.activate_dummy_subscription(p_package_id uuid)
returns public.user_subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.user_subscriptions;
  package_duration integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select duration_days into package_duration
  from public.packages
  where id = p_package_id and is_active = true;

  if package_duration is null then
    raise exception 'Package not found';
  end if;

  insert into public.user_subscriptions (
    user_id, package_id, status, starts_at, expires_at,
    payment_provider, payment_reference
  ) values (
    auth.uid(), p_package_id, 'active', now(),
    now() + make_interval(days => package_duration),
    'dummy', 'dummy_' || gen_random_uuid()::text
  )
  on conflict (user_id, package_id) do update set
    status = 'active',
    starts_at = now(),
    expires_at = now() + make_interval(days => package_duration),
    payment_provider = 'dummy',
    payment_reference = 'dummy_' || gen_random_uuid()::text,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.activate_dummy_subscription(uuid) from public;
grant execute on function public.activate_dummy_subscription(uuid) to authenticated;

insert into public.packages (slug, name, description, price_inr, duration_days, benefits, is_popular, sort_order)
values
  ('muscle-building', 'Muscle Building', 'Progressive training for size, control, and confident lifting.', 799, 30, '["Structured muscle-building course", "All program videos", "30-day access"]'::jsonb, true, 1),
  ('fat-loss', 'Fat Loss', 'High-energy workouts designed to support sustainable fat loss.', 599, 30, '["Fat-loss workout series", "Beginner-friendly progressions", "30-day access"]'::jsonb, false, 2),
  ('strength-training', 'Strength Training', 'Build foundational strength with coached compound movements.', 999, 30, '["Strength-focused course", "Technique-led sessions", "30-day access"]'::jsonb, false, 3)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_inr = excluded.price_inr,
  duration_days = excluded.duration_days,
  benefits = excluded.benefits,
  is_popular = excluded.is_popular,
  sort_order = excluded.sort_order,
  is_active = true;

