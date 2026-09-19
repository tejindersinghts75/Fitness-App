create table if not exists public.scheduled_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid references public.coaches(id) on delete set null,
  coach_name text not null,
  title text not null default 'Consultation call',
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  meeting_url text,
  provider text not null default 'admin',
  provider_event_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists scheduled_calls_provider_event_unique
on public.scheduled_calls(provider, provider_event_id)
where provider_event_id is not null;

create index if not exists scheduled_calls_user_starts_at_idx
on public.scheduled_calls(user_id, starts_at);

drop trigger if exists scheduled_calls_set_updated_at on public.scheduled_calls;
create trigger scheduled_calls_set_updated_at before update on public.scheduled_calls
for each row execute function public.set_updated_at();

alter table public.scheduled_calls enable row level security;

drop policy if exists "Users can view their scheduled calls" on public.scheduled_calls;
create policy "Users can view their scheduled calls" on public.scheduled_calls
for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can manage scheduled calls" on public.scheduled_calls;
create policy "Admins can manage scheduled calls" on public.scheduled_calls
for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.scheduled_calls to authenticated;
revoke all on public.scheduled_calls from anon;

do $$
begin
  alter publication supabase_realtime add table public.scheduled_calls;
exception
  when duplicate_object then null;
end $$;
