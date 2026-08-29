import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { contentService } from '../services/contentService';
import { Plan, UserSubscription, Video } from '../types';
import { useAuth } from './AuthContext';

type CatalogContextValue = {
  plans: Plan[];
  videos: Video[];
  subscriptions: UserSubscription[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  activateDummySubscription: (packageId: string) => Promise<void>;
  hasActivePackage: (packageId: string) => boolean;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export const CatalogProvider = ({ children }: React.PropsWithChildren) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user) {
      setPlans([]); setVideos([]); setSubscriptions([]); setLoading(false); setError('');
      return;
    }
    setLoading(true); setError('');
    try {
      const nextPlans = await contentService.fetchPackages();
      const [nextSubscriptions, nextVideos] = await Promise.all([
        contentService.fetchSubscriptions(user.id),
        contentService.fetchEntitledVideos(nextPlans),
      ]);
      setPlans(nextPlans); setSubscriptions(nextSubscriptions); setVideos(nextVideos);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your workout library.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);

  const hasActivePackage = useCallback((packageId: string) => subscriptions.some(item => item.packageId === packageId && item.status === 'active' && new Date(item.expiresAt).getTime() > Date.now()), [subscriptions]);

  const value = useMemo<CatalogContextValue>(() => ({
    plans, videos, subscriptions, loading, error, refresh, hasActivePackage,
    activateDummySubscription: async packageId => {
      await contentService.activateDummySubscription(packageId);
      await refresh();
    },
  }), [error, hasActivePackage, loading, plans, refresh, subscriptions, videos]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside CatalogProvider.');
  return context;
};

