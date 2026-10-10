create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  device_id text,
  platform text not null check (platform in ('ios', 'android', 'web', 'unknown')),
  app_version text,
  enabled boolean not null default true,
  last_registered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expo_push_token)
);

create index if not exists push_tokens_user_enabled_idx
on public.push_tokens(user_id, enabled);

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at before update on public.push_tokens
for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;

drop policy if exists "Users can view their own push tokens" on public.push_tokens;
create policy "Users can view their own push tokens" on public.push_tokens
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can register their own push tokens" on public.push_tokens;
create policy "Users can register their own push tokens" on public.push_tokens
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own push tokens" on public.push_tokens;
create policy "Users can update their own push tokens" on public.push_tokens
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can manage push tokens" on public.push_tokens;
create policy "Admins can manage push tokens" on public.push_tokens
for delete using (public.is_admin());

grant select, insert, update on public.push_tokens to authenticated;
revoke all on public.push_tokens from anon;
