import { supabase } from '../lib/supabase';
import { Coach, MembershipPlan, MembershipSubscription, Plan, ScheduledCall, UserSubscription, Video } from '../types';
import { Database } from '../types/database';

type PackageRow = Database['public']['Tables']['packages']['Row'];
type VideoRow = Database['public']['Tables']['videos']['Row'];
type SubscriptionRow = Database['public']['Tables']['user_subscriptions']['Row'];
type CoachRow = Database['public']['Tables']['coaches']['Row'];
type ScheduledCallRow = Database['public']['Tables']['scheduled_calls']['Row'];
type MembershipPlanRow = Database['public']['Tables']['membership_plans']['Row'];
type MembershipSubscriptionRow = Database['public']['Tables']['member_subscriptions']['Row'];
type VideoPreviewRow = Database['public']['Functions']['list_published_video_previews']['Returns'][number];

const formatDuration = (seconds: number) => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
};

const mapPackage = (row: PackageRow): Plan => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  price: row.price_inr,
  duration: row.duration_days === 30 ? 'month' : `${row.duration_days} days`,
  durationDays: row.duration_days,
  benefits: Array.isArray(row.benefits) ? row.benefits.filter((item): item is string => typeof item === 'string') : [],
  popular: row.is_popular,
});

const mapSubscription = (row: SubscriptionRow): UserSubscription => ({
  id: row.id,
  userId: row.user_id,
  packageId: row.package_id,
  status: row.status,
  startsAt: row.starts_at,
  expiresAt: row.expires_at,
  paymentProvider: row.payment_provider,
});
const mapMembership = (row: MembershipPlanRow): MembershipPlan => ({
  id: row.id, slug: row.slug, name: row.name, description: row.description,
  price: row.price_inr, duration: row.duration_days === 30 ? 'month' : `${row.duration_days} days`,
  durationDays: row.duration_days, trialDays: row.trial_days,
  features: Array.isArray(row.features) ? row.features.filter((item): item is string => typeof item === 'string') : [],
  badge: row.badge, savingsLabel: row.savings_label, popular: row.is_popular,
});
const mapMembershipSubscription = (row: MembershipSubscriptionRow): MembershipSubscription => ({
  id: row.id, userId: row.user_id, membershipPlanId: row.membership_plan_id,
  status: row.status, startsAt: row.starts_at, expiresAt: row.expires_at, paymentProvider: row.payment_provider,
});

const mapVideo = (row: VideoRow | VideoPreviewRow, packageName: string): Video => ({
  id: row.id,
  packageId: row.package_id,
  title: row.title,
  category: packageName,
  description: row.description,
  duration: formatDuration(row.duration_seconds),
  durationSeconds: row.duration_seconds,
  trainer: row.trainer,
  muxPlaybackId: row.mux_playback_id || '',
  thumbnailUrl: row.thumbnail_url || (row.mux_playback_id ? `https://image.mux.com/${row.mux_playback_id}/thumbnail.jpg?time=1&width=900` : ''),
});

const mapCoach = (row: CoachRow): Coach => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  specialty: row.specialty,
  bio: row.bio,
  experienceYears: row.experience_years,
  rating: Number(row.rating),
  clientsCount: row.clients_count,
  expertise: row.expertise || [],
  photoUrl: row.photo_url,
  bookingUrl: row.booking_url,
  sortOrder: row.sort_order,
});

const mapScheduledCall = (row: ScheduledCallRow): ScheduledCall => ({
  id: row.id,
  userId: row.user_id,
  coachId: row.coach_id,
  coachName: row.coach_name,
  title: row.title,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  status: row.status,
  meetingUrl: row.meeting_url,
  provider: row.provider,
});

export const contentService = {
  fetchCoaches: async (): Promise<Coach[]> => {
    const { data, error } = await supabase.from('coaches').select('*').eq('is_active', true).order('sort_order');
    if (error) throw error;
    return data.map(mapCoach);
  },
  fetchPackages: async (): Promise<Plan[]> => {
    const { data, error } = await supabase.from('packages').select('*').eq('is_active', true).order('sort_order');
    if (error) throw error;
    return data.map(mapPackage);
  },
  fetchMembershipPlans: async (): Promise<MembershipPlan[]> => {
    const { data, error } = await supabase.from('membership_plans').select('*').eq('is_active', true).order('sort_order');
    if (error) throw error;
    return data.map(mapMembership);
  },
  fetchMembershipSubscriptions: async (userId: string): Promise<MembershipSubscription[]> => {
    const { data, error } = await supabase.from('member_subscriptions').select('*').eq('user_id', userId).order('expires_at', { ascending: false });
    if (error) throw error;
    return data.map(mapMembershipSubscription);
  },
  fetchSubscriptions: async (userId: string): Promise<UserSubscription[]> => {
    const { data, error } = await supabase.from('user_subscriptions').select('*').eq('user_id', userId).order('expires_at', { ascending: false });
    if (error) throw error;
    return data.map(mapSubscription);
  },
  fetchScheduledCalls: async (userId: string): Promise<ScheduledCall[]> => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('scheduled_calls')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('starts_at', now.toISOString())
      .order('starts_at', { ascending: true })
      .limit(20);
    if (error) {
      if (error.code === '42P01' || error.message.toLowerCase().includes('scheduled_calls')) return [];
      throw error;
    }
    return data.map(mapScheduledCall);
  },
  fetchPublishedVideos: async (packages: Plan[]): Promise<Video[]> => {
    const { data, error } = await supabase.rpc('list_published_video_previews');
    if (error) throw error;
    const packageNames = new Map(packages.map(item => [item.id, item.name]));
    return data.map(row => mapVideo(row, packageNames.get(row.package_id) || 'Course'));
  },
  activateDummySubscription: async (packageId: string) => {
    const { data, error } = await supabase.rpc('activate_dummy_subscription', { p_package_id: packageId });
    if (error) throw error;
    return mapSubscription(data);
  },
  activateDummyMembership: async (membershipPlanId: string) => {
    const { data, error } = await supabase.rpc('activate_dummy_membership', { p_membership_plan_id: membershipPlanId });
    if (error) throw error;
    return mapMembershipSubscription(data);
  },
};
