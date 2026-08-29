-- Create application profiles only after a user verifies their email OTP.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_confirmed on auth.users;

-- Covers admin-created users that may already be confirmed when inserted.
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Normal email/password users receive their profile when OTP verification
-- changes email_confirmed_at from null to a timestamp.
create trigger on_auth_user_confirmed
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.handle_new_auth_user();

-- Remove application profiles created for still-unverified Auth users by the
-- previous trigger. The pending Auth records remain so Supabase can verify OTPs.
delete from public.profiles p
using auth.users u
where p.id = u.id
  and u.email_confirmed_at is null;

-- Ensure every already-confirmed user has a profile.
insert into public.profiles (id, full_name, email, phone, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.email, ''),
  nullif(u.raw_user_meta_data ->> 'phone', ''),
  'user'
from auth.users u
where u.email_confirmed_at is not null
on conflict (id) do nothing;
