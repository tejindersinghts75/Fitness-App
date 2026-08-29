export type Plan = { id: string; slug: string; name: string; description: string; price: number; duration: string; durationDays: number; benefits: string[]; popular?: boolean };
export type Video = { id: string; packageId: string; title: string; category: string; description: string; duration: string; durationSeconds: number; trainer: string; muxPlaybackId: string; thumbnailUrl: string; progress?: number };
export type UserSubscription = { id: string; userId: string; packageId: string; status: 'active' | 'expired' | 'cancelled'; startsAt: string; expiresAt: string; paymentProvider: string };
export type Program = { id: string; title: string; level: string; sessions: number; color: string };
export type RootStackParamList = {
  Splash: undefined; Welcome: undefined; Login: undefined; Register: undefined; VerifyEmailOtp: { email: string; mode: 'signup' | 'login' };
  Main: undefined; PlanDetails: { planId: string }; Checkout: { planId: string }; PaymentSuccess: { planId: string };
  PaymentFailed: { planId: string }; VideoDetails: { videoId: string }; LockedContent: { videoId: string };
  EditProfile: undefined; MySubscription: undefined;
};
