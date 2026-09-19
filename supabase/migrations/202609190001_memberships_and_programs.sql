-- Separate purchasable memberships from workout programs while preserving the
-- existing packages table and uploaded video relationships as program data.

alter table public.packages add column if not exists difficulty text not null default 'All levels';
alter table public.packages add column if not exists equipment text not null default 'No equipment required';
alter table public.packages add column if not exists workouts_per_week integer not null default 3 check (workouts_per_week > 0);
alter table public.packages add column if not exists meal_plan_included boolean not null default false;
alter table public.packages add column if not exists is_free boolean not null default false;
alter table public.videos add column if not exists is_free_preview boolean not null default false;

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_inr integer not null check (price_inr >= 0),
  duration_days integer not null check (duration_days > 0),
  trial_days integer not null default 0 check (trial_days >= 0),
  features jsonb not null default '[]'::jsonb,
  badge text,
  savings_label text,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_plan_id uuid not null references public.membership_plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  payment_provider text not null default 'dummy',
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_subscriptions_user_active_idx
on public.member_subscriptions(user_id, status, expires_at);

drop trigger if exists membership_plans_set_updated_at on public.membership_plans;
create trigger membership_plans_set_updated_at before update on public.membership_plans
for each row execute function public.set_updated_at();
drop trigger if exists member_subscriptions_set_updated_at on public.member_subscriptions;
create trigger member_subscriptions_set_updated_at before update on public.member_subscriptions
for each row execute function public.set_updated_at();

alter table public.membership_plans enable row level security;
alter table public.member_subscriptions enable row level security;

drop policy if exists "Users can view active membership plans" on public.membership_plans;
drop policy if exists "Admins can create membership plans" on public.membership_plans;
drop policy if exists "Admins can update membership plans" on public.membership_plans;
drop policy if exists "Admins can delete membership plans" on public.membership_plans;
drop policy if exists "Users can view own member subscriptions" on public.member_subscriptions;
create policy "Users can view active membership plans" on public.membership_plans
for select to authenticated using (is_active = true or public.is_admin());
create policy "Admins can create membership plans" on public.membership_plans
for insert to authenticated with check (public.is_admin());
create policy "Admins can update membership plans" on public.membership_plans
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete membership plans" on public.membership_plans
for delete to authenticated using (public.is_admin());
create policy "Users can view own member subscriptions" on public.member_subscriptions
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

grant select on public.membership_plans, public.member_subscriptions to authenticated;
grant insert, update, delete on public.membership_plans to authenticated;

insert into public.membership_plans
  (slug, name, description, price_inr, duration_days, trial_days, features, badge, savings_label, is_popular, sort_order)
values
  ('monthly', 'Monthly Membership', 'Flexible month-to-month access to every Fitora program.', 2500, 30, 7,
   '["All workout programs","Personalized training guidance","Meal plans and video demonstrations","Habit and progress tracking","Monthly plan updates"]'::jsonb,
   '7 DAYS FREE', null, false, 1),
  ('three-month', '3-Month Membership', 'A complete 90-day transformation with full program access.', 3997, 90, 0,
   '["All workout programs","Personalized training guidance","Meal plans and video demonstrations","Habit and progress tracking","Monthly plan updates"]'::jsonb,
   'MOST POPULAR', 'Save ₹3,503', true, 2),
  ('annual', 'Annual Membership', 'Make fitness a lifestyle with year-round Fitora access.', 15000, 365, 0,
   '["All workout programs","Personalized training guidance","Meal plans and video demonstrations","Habit and progress tracking","Monthly plan updates"]'::jsonb,
   'BEST VALUE', '2 months free', false, 3)
on conflict (slug) do nothing;

create or replace function public.activate_dummy_membership(p_membership_plan_id uuid)
returns public.member_subscriptions
language plpgsql security definer set search_path = '' as $$
declare result public.member_subscriptions; plan_duration integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select duration_days into plan_duration from public.membership_plans
  where id = p_membership_plan_id and is_active = true;
  if plan_duration is null then raise exception 'Membership not found'; end if;
  update public.member_subscriptions set status = 'cancelled', updated_at = now()
  where user_id = auth.uid() and status = 'active';
  insert into public.member_subscriptions
    (user_id, membership_plan_id, status, starts_at, expires_at, payment_provider, payment_reference)
  values (auth.uid(), p_membership_plan_id, 'active', now(), now() + make_interval(days => plan_duration), 'dummy', 'dummy_' || gen_random_uuid()::text)
  returning * into result;
  return result;
end; $$;
revoke all on function public.activate_dummy_membership(uuid) from public;
grant execute on function public.activate_dummy_membership(uuid) to authenticated;

create or replace function public.list_published_video_previews()
returns table (id uuid, package_id uuid, title text, description text, trainer text, duration_seconds integer, mux_playback_id text, thumbnail_url text, sort_order integer)
language sql stable security definer set search_path = '' as $$
  select v.id, v.package_id, v.title, v.description, v.trainer, v.duration_seconds,
    case when p.is_free or v.is_free_preview or public.is_admin() or exists (
      select 1 from public.member_subscriptions s
      where s.user_id = auth.uid() and s.status = 'active' and s.expires_at > now()
    ) then v.mux_playback_id else null end,
    v.thumbnail_url, v.sort_order
  from public.videos v join public.packages p on p.id = v.package_id
  where auth.uid() is not null and p.is_active and v.is_published
  order by p.sort_order, v.sort_order, v.created_at;
$$;
revoke all on function public.list_published_video_previews() from public;
grant execute on function public.list_published_video_previews() to authenticated;
