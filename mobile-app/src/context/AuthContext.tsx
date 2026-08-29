import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { authService, OtpMode, SignUpInput } from '../services/authService';
import { profileService } from '../services/profileService';
import { Profile, ProfileUpdate } from '../types/profile';

type AuthContextValue = {
  user: User | null; session: Session | null; profile: Profile | null; loading: boolean; configured: boolean;
  requestSignupOtp: (input: SignUpInput) => Promise<void>;
  requestLoginOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  resendEmailOtp: (email: string, mode: OtpMode) => Promise<void>;
  signOut: () => Promise<void>; refreshProfile: () => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const applyAuthDeepLink = async (url: string | null) => {
  if (!url) return;

  const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  }
};

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null); const [profile, setProfile] = useState<Profile | null>(null); const [loading, setLoading] = useState(true);
  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession) { setProfile(null); return; }
    const { data, error } = await profileService.fetchProfile(nextSession.user.id);
    if (error) throw error; setProfile(data);
  }, []);
  const refreshProfile = useCallback(async () => { if (session) await loadProfile(session); }, [loadProfile, session]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => { setSession(data.session); try { await loadProfile(data.session); } catch { setProfile(null); } finally { setLoading(false); } }).catch(() => setLoading(false));
    Linking.getInitialURL().then(applyAuthDeepLink).catch(() => undefined);
    const deepLinkListener = Linking.addEventListener('url', ({ url }) => {
      applyAuthDeepLink(url).catch(() => undefined);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession); if (!nextSession) setProfile(null);
      setTimeout(() => { loadProfile(nextSession).catch(() => setProfile(null)); }, 0);
    });
    return () => {
      deepLinkListener.remove();
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null, session, profile, loading, configured: isSupabaseConfigured,
    requestSignupOtp: async input => { const { error } = await authService.requestSignupOtp(input); if (error) throw error; },
    requestLoginOtp: async email => { const { error } = await authService.requestLoginOtp(email); if (error) throw error; },
    verifyEmailOtp: async (email, token) => { const { error } = await authService.verifyEmailOtp(email, token); if (error) throw error; },
    resendEmailOtp: async (email, mode) => { const { error } = await authService.resendEmailOtp(email, mode); if (error) throw error; },
    signOut: async () => { const { error } = await authService.signOut(); if (error) throw error; },
    refreshProfile,
    updateProfile: async update => { if (!session) throw new Error('You must be signed in.'); const { data, error } = await profileService.updateProfile(session.user.id, update); if (error) throw error; setProfile(data); },
  }), [loading, profile, refreshProfile, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider.'); return context; };
