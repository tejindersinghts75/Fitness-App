-- Let signed-in users browse published workout metadata without exposing playback
-- IDs for packages they have not purchased.

create or replace function public.list_published_video_previews()
returns table (
  id uuid,
  package_id uuid,
  title text,
  description text,
  trainer text,
  duration_seconds integer,
  mux_playback_id text,
  thumbnail_url text,
  sort_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    v.id,
    v.package_id,
    v.title,
    v.description,
    v.trainer,
    v.duration_seconds,
    case
      when public.is_admin() or exists (
        select 1
        from public.user_subscriptions subscription
        where subscription.user_id = (select auth.uid())
          and subscription.package_id = v.package_id
          and subscription.status = 'active'
          and subscription.expires_at > now()
      ) then v.mux_playback_id
      else null
    end as mux_playback_id,
    v.thumbnail_url,
    v.sort_order
  from public.videos v
  join public.packages package on package.id = v.package_id
  where auth.uid() is not null
    and package.is_active = true
    and v.is_published = true
  order by package.sort_order, v.sort_order, v.created_at;
$$;

revoke all on function public.list_published_video_previews() from public;
grant execute on function public.list_published_video_previews() to authenticated;
