import { Profile } from './profile';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'updated_at'>>;
        Relationships: [];
      };
      packages: {
        Row: { id: string; slug: string; name: string; description: string; price_inr: number; duration_days: number; benefits: unknown; is_popular: boolean; is_active: boolean; sort_order: number; difficulty: string; equipment: string; workouts_per_week: number; meal_plan_included: boolean; is_free: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; name: string; description?: string; price_inr: number; duration_days?: number; benefits?: unknown; is_popular?: boolean; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['packages']['Insert']>;
        Relationships: [];
      };
      membership_plans: {
        Row: { id: string; slug: string; name: string; description: string; price_inr: number; duration_days: number; trial_days: number; features: unknown; badge: string | null; savings_label: string | null; is_popular: boolean; is_active: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: Partial<Database['public']['Tables']['membership_plans']['Row']> & { slug: string; name: string; price_inr: number; duration_days: number };
        Update: Partial<Database['public']['Tables']['membership_plans']['Row']>;
        Relationships: [];
      };
      member_subscriptions: {
        Row: { id: string; user_id: string; membership_plan_id: string; status: 'active' | 'expired' | 'cancelled'; starts_at: string; expires_at: string; payment_provider: string; payment_reference: string | null; created_at: string; updated_at: string };
        Insert: Partial<Database['public']['Tables']['member_subscriptions']['Row']> & { user_id: string; membership_plan_id: string; expires_at: string };
        Update: Partial<Database['public']['Tables']['member_subscriptions']['Row']>;
        Relationships: [];
      };
      videos: {
        Row: { id: string; package_id: string; title: string; description: string; trainer: string; duration_seconds: number; mux_playback_id: string | null; thumbnail_url: string | null; is_published: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; package_id: string; title: string; description?: string; trainer?: string; duration_seconds?: number; mux_playback_id?: string | null; thumbnail_url?: string | null; is_published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['videos']['Insert']>;
        Relationships: [];
      };
      coaches: {
        Row: { id: string; slug: string; name: string; specialty: string; bio: string; experience_years: number; rating: number; clients_count: number; expertise: string[]; photo_url: string; photo_path: string; booking_url: string | null; is_active: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; name: string; specialty: string; bio?: string; experience_years?: number; rating?: number; clients_count?: number; expertise?: string[]; photo_url: string; photo_path: string; booking_url?: string | null; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['coaches']['Insert']>;
        Relationships: [];
      };
      scheduled_calls: {
        Row: { id: string; user_id: string; coach_id: string | null; coach_name: string; title: string; starts_at: string; ends_at: string | null; status: 'scheduled' | 'completed' | 'cancelled'; meeting_url: string | null; provider: string; provider_event_id: string | null; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; coach_id?: string | null; coach_name: string; title?: string; starts_at: string; ends_at?: string | null; status?: 'scheduled' | 'completed' | 'cancelled'; meeting_url?: string | null; provider?: string; provider_event_id?: string | null; notes?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['scheduled_calls']['Insert']>;
        Relationships: [];
      };
      user_subscriptions: {
        Row: { id: string; user_id: string; package_id: string; status: 'active' | 'expired' | 'cancelled'; starts_at: string; expires_at: string; payment_provider: string; payment_reference: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; package_id: string; status?: 'active' | 'expired' | 'cancelled'; starts_at?: string; expires_at: string; payment_provider?: string; payment_reference?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['user_subscriptions']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      activate_dummy_subscription: { Args: { p_package_id: string }; Returns: Database['public']['Tables']['user_subscriptions']['Row'] };
      activate_dummy_membership: { Args: { p_membership_plan_id: string }; Returns: Database['public']['Tables']['member_subscriptions']['Row'] };
      list_published_video_previews: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          package_id: string;
          title: string;
          description: string;
          trainer: string;
          duration_seconds: number;
          mux_playback_id: string | null;
          thumbnail_url: string | null;
          sort_order: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
