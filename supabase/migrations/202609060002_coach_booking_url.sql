alter table public.coaches
add column if not exists booking_url text;

alter table public.coaches
drop constraint if exists coaches_booking_url_format;

alter table public.coaches
add constraint coaches_booking_url_format
check (booking_url is null or booking_url ~ '^https://');
