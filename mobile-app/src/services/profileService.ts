import { requireSupabaseConfiguration, supabase } from '../lib/supabase';
import { ProfileUpdate } from '../types/profile';

export const profileService = {
  fetchProfile: async (userId: string) => {
    requireSupabaseConfiguration();
    return supabase.from('profiles').select('*').eq('id', userId).single();
  },
  updateProfile: async (userId: string, update: ProfileUpdate) => {
    requireSupabaseConfiguration();
    return supabase.from('profiles').update({ full_name: update.full_name.trim(), phone: update.phone?.trim() || null }).eq('id', userId).select('*').single();
  },
};
