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
        Row: { id: string; slug: string; name: string; description: string; price_inr: number; duration_days: number; benefits: unknown; is_popular: boolean; is_active: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; name: string; description?: string; price_inr: number; duration_days?: number; benefits?: unknown; is_popular?: boolean; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['packages']['Insert']>;
        Relationships: [];
      };
      videos: {
        Row: { id: string; package_id: string; title: string; description: string; trainer: string; duration_seconds: number; mux_playback_id: string | null; thumbnail_url: string | null; is_published: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; package_id: string; title: string; description?: string; trainer?: string; duration_seconds?: number; mux_playback_id?: string | null; thumbnail_url?: string | null; is_published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['videos']['Insert']>;
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
