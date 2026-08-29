import { requireSupabaseConfiguration, supabase } from '../lib/supabase';

export type SignUpInput = { firstName: string; email: string; phone: string };
export type OtpMode = 'signup' | 'login';

export const authService = {
  getSession: async () => { requireSupabaseConfiguration(); return supabase.auth.getSession(); },
  requestSignupOtp: async ({ firstName, email, phone }: SignUpInput) => {
    requireSupabaseConfiguration();
    return supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        data: { full_name: firstName.trim(), phone: phone.trim() },
      },
    });
  },
  requestLoginOtp: async (email: string) => {
    requireSupabaseConfiguration();
    return supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
  },
  verifyEmailOtp: async (email: string, token: string) => {
    requireSupabaseConfiguration();
    return supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'email' });
  },
  resendEmailOtp: async (email: string, mode: OtpMode) => {
    requireSupabaseConfiguration();
    return supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: mode === 'signup' },
    });
  },
  signOut: async () => { requireSupabaseConfiguration(); return supabase.auth.signOut(); },
};
