import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { supabase } from "../lib/supabase";
import { contentService } from "../services/contentService";
import { Coach, MembershipPlan, MembershipSubscription, Plan, ScheduledCall, UserSubscription, Video } from "../types";
import { useAuth } from "./AuthContext";

type CatalogContextValue = {
  plans: Plan[];
  memberships: MembershipPlan[];
  videos: Video[];
  coaches: Coach[];
  scheduledCalls: ScheduledCall[];
  subscriptions: UserSubscription[];
  membershipSubscriptions: MembershipSubscription[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  activateDummySubscription: (packageId: string) => Promise<void>;
  activateDummyMembership: (membershipPlanId: string) => Promise<void>;
  hasActivePackage: (packageId: string) => boolean;
  hasActiveMembership: () => boolean;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export const CatalogProvider = ({ children }: React.PropsWithChildren) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [memberships, setMemberships] = useState<MembershipPlan[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [membershipSubscriptions, setMembershipSubscriptions] = useState<MembershipSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!user) {
      setPlans([]);
      setMemberships([]);
      setVideos([]);
      setCoaches([]);
      setScheduledCalls([]);
      setSubscriptions([]);
      setMembershipSubscriptions([]);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [nextPlans, nextMemberships, nextCoaches] = await Promise.all([
        contentService.fetchPackages(),
        contentService.fetchMembershipPlans(),
        contentService.fetchCoaches(),
      ]);
      const [nextSubscriptions, nextMembershipSubscriptions, nextVideos, nextScheduledCalls] = await Promise.all([
        contentService.fetchSubscriptions(user.id),
        contentService.fetchMembershipSubscriptions(user.id),
        contentService.fetchPublishedVideos(nextPlans),
        contentService.fetchScheduledCalls(user.id),
      ]);
      if (currentRequest === requestId.current) {
        setPlans(nextPlans);
        setMemberships(nextMemberships);
        setSubscriptions(nextSubscriptions);
        setMembershipSubscriptions(nextMembershipSubscriptions);
        setVideos(nextVideos);
        setCoaches(nextCoaches);
        setScheduledCalls(nextScheduledCalls);
      }
    } catch (caught) {
      if (currentRequest === requestId.current) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load your workout library.",
        );
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh().catch(() => undefined);
    });
    return () => listener.remove();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`scheduled-calls-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scheduled_calls",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh().catch(() => undefined),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, user]);

  useEffect(() => {
    const expirations = [...subscriptions, ...membershipSubscriptions]
      .filter((item) => item.status === "active")
      .map((item) => new Date(item.expiresAt).getTime())
      .filter((timestamp) => timestamp > Date.now());
    if (!expirations.length) return;

    const nextExpiration = Math.min(...expirations);
    const delay = Math.min(nextExpiration - Date.now() + 250, 2_147_483_647);
    const timer = setTimeout(() => refresh().catch(() => undefined), delay);
    return () => clearTimeout(timer);
  }, [membershipSubscriptions, refresh, subscriptions]);

  const hasActiveMembership = useCallback(
    () => membershipSubscriptions.some(item => item.status === "active" && new Date(item.expiresAt).getTime() > Date.now()),
    [membershipSubscriptions],
  );

  const hasActivePackage = useCallback(
    (packageId: string) =>
      hasActiveMembership() || subscriptions.some(
        (item) =>
          item.packageId === packageId &&
          item.status === "active" &&
          new Date(item.expiresAt).getTime() > Date.now(),
      ),
    [hasActiveMembership, subscriptions],
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      plans,
      memberships,
      videos,
      coaches,
      scheduledCalls,
      subscriptions,
      membershipSubscriptions,
      loading,
      error,
      refresh,
      hasActivePackage,
      hasActiveMembership,
      activateDummySubscription: async (packageId) => {
        await contentService.activateDummySubscription(packageId);
        await refresh();
      },
      activateDummyMembership: async (membershipPlanId) => {
        await contentService.activateDummyMembership(membershipPlanId);
        await refresh();
      },
    }),
    [coaches, error, hasActiveMembership, hasActivePackage, loading, membershipSubscriptions, memberships, plans, refresh, scheduledCalls, subscriptions, videos],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context)
    throw new Error("useCatalog must be used inside CatalogProvider.");
  return context;
};
