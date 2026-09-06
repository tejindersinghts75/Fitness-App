import { supabase } from '../lib/supabase';
import { Coach, Plan, UserSubscription, Video } from '../types';
import { Database } from '../types/database';

type PackageRow = Database['public']['Tables']['packages']['Row'];
type VideoRow = Database['public']['Tables']['videos']['Row'];
type SubscriptionRow = Database['public']['Tables']['user_subscriptions']['Row'];
type CoachRow = Database['public']['Tables']['coaches']['Row'];

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

const mapVideo = (row: VideoRow, packageName: string): Video => ({
  id: row.id,
  packageId: row.package_id,
  title: row.title,
  category: packageName,
  description: row.description,
  duration: formatDuration(row.duration_seconds),
  durationSeconds: row.duration_seconds,
  trainer: row.trainer,
  muxPlaybackId: row.mux_playback_id || '',
  thumbnailUrl: row.thumbnail_url || `https://image.mux.com/${row.mux_playback_id}/thumbnail.jpg?time=1&width=900`,
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
  fetchSubscriptions: async (userId: string): Promise<UserSubscription[]> => {
    const { data, error } = await supabase.from('user_subscriptions').select('*').eq('user_id', userId).order('expires_at', { ascending: false });
    if (error) throw error;
    return data.map(mapSubscription);
  },
  fetchEntitledVideos: async (packages: Plan[]): Promise<Video[]> => {
    const { data, error } = await supabase.from('videos').select('*').eq('is_published', true).order('sort_order');
    if (error) throw error;
    const packageNames = new Map(packages.map(item => [item.id, item.name]));
    return data.map(row => mapVideo(row, packageNames.get(row.package_id) || 'Course'));
  },
  activateDummySubscription: async (packageId: string) => {
    const { data, error } = await supabase.rpc('activate_dummy_subscription', { p_package_id: packageId });
    if (error) throw error;
    return mapSubscription(data);
  },
};
