import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground, AppButton, AppHeader, AppInput, EmptyState, GlassCard, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useAppTheme } from '../context/ThemeContext';
import { videoProgressService } from '../services/videoProgressService';
import { RootStackParamList } from '../types';

type P<N extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, N>;
const Shell = ({ children }: React.PropsWithChildren) => { const { theme } = useAppTheme(); return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}><AmbientBackground/><ScrollView contentContainerStyle={s.page}>{children}</ScrollView></SafeAreaView>; };

const LockedWorkoutOffer = ({ category, onViewMemberships }: { category?: string; onViewMemberships: () => void }) => {
  const { theme } = useAppTheme();
  const packageName = category || 'matching';
  return <View style={[locked.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <View style={[locked.iconHalo, { backgroundColor: theme.accentSoft }]}>
      <View style={[locked.iconCircle, { backgroundColor: theme.accent }]}>
        <Ionicons name="lock-closed" size={25} color="#FFFFFF" />
      </View>
    </View>
    <Text style={[locked.eyebrow, { color: theme.accent }]}>PREMIUM WORKOUT</Text>
    <Text style={[locked.title, { color: theme.text }]}>Unlock this workout</Text>
    <Text style={[locked.copy, { color: theme.muted }]}>Choose a Fitora membership to watch this {packageName} workout and unlock the complete program library.</Text>
    <View style={[locked.divider, { backgroundColor: theme.border }]} />
    <View style={locked.benefit}>
      <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
      <Text style={[locked.benefitText, { color: theme.text }]}>Access to every included program</Text>
    </View>
    <View style={locked.buttonWrap}>
      <AppButton title="View memberships" icon="arrow-forward" onPress={onViewMemberships} />
    </View>
  </View>;
};

export const PlanDetailsScreen = ({ navigation, route }: P<'PlanDetails'>) => {
  const { theme } = useAppTheme(); const { memberships, hasActiveMembership } = useCatalog();
  const plan = memberships.find(item => item.id === route.params.planId);
  if (!plan) return <Shell><AppHeader title="Membership" back onBack={() => navigation.goBack()}/><EmptyState title="This membership is not available."/></Shell>;
  const active = hasActiveMembership();
  return <Shell><AppHeader title={plan.name} subtitle="Membership details" back onBack={() => navigation.goBack()}/><GlassCard><Text style={[s.price, { color: theme.text }]}>₹{plan.price}</Text><Text style={{ color: theme.muted, marginTop: 5 }}>{plan.description}</Text>{plan.savingsLabel && <Text style={{ color: theme.accent, fontWeight: '800', marginTop: 8 }}>{plan.savingsLabel}</Text>}</GlassCard><Text style={[s.heading, { color: theme.text }]}>What’s included</Text>{plan.features.map(item => <View key={item} style={s.check}><Ionicons name="checkmark-circle" size={22} color={theme.accent}/><Text style={{ color: theme.text, fontWeight: '600', flex: 1 }}>{item}</Text></View>)}{active && <StatusBadge label="Your membership is active" tone="success"/>}<AppButton disabled={active} title={active ? 'Membership active' : 'Continue to checkout'} onPress={() => navigation.navigate('Checkout', { planId: plan.id })}/></Shell>;
};

export const CheckoutScreen = ({ navigation, route }: P<'Checkout'>) => {
  const { theme } = useAppTheme(); const { memberships, activateDummyMembership } = useCatalog();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const plan = memberships.find(item => item.id === route.params.planId);
  if (!plan) return <Shell><AppHeader title="Checkout" back onBack={() => navigation.goBack()}/><EmptyState title="This membership is not available."/></Shell>;
  const complete = async () => { setBusy(true); setError(''); try { await activateDummyMembership(plan.id); navigation.replace('PaymentSuccess', { planId: plan.id }); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to activate this membership.'); } finally { setBusy(false); } };
  return <Shell><AppHeader title="Dummy checkout" subtitle="Review your test order." back onBack={() => navigation.goBack()}/><GlassCard><View style={s.row}><View style={{ flex: 1 }}><Text style={[s.heading, { color: theme.text }]}>{plan.name}</Text><Text style={{ color: theme.muted }}>{plan.durationDays}-day access</Text></View><Text style={[s.priceSmall, { color: theme.text }]}>₹{plan.price}</Text></View></GlassCard><GlassCard><Text style={[s.heading, { color: theme.text }]}>Order summary</Text><View style={s.line}><Text style={{ color: theme.muted }}>Membership price</Text><Text style={{ color: theme.text }}>₹{plan.price}</Text></View><View style={s.line}><Text style={{ color: theme.muted }}>Payment mode</Text><Text style={{ color: theme.text }}>Test only</Text></View><View style={[s.line, { borderTopWidth: 1, borderColor: theme.border, paddingTop: 14 }]}><Text style={{ color: theme.text, fontWeight: '900' }}>Total</Text><Text style={[s.priceSmall, { color: theme.text }]}>₹{plan.price}</Text></View></GlassCard><View style={s.secure}><Ionicons name="information-circle" size={20} color={theme.accent}/><Text style={{ color: theme.muted, flex: 1 }}>This is a dummy checkout. No real payment will be charged.</Text></View>{!!error && <Text style={{ color: theme.danger, textAlign: 'center' }}>{error}</Text>}<AppButton disabled={busy} title={busy ? 'Activating…' : 'Complete dummy checkout'} icon="checkmark-circle" onPress={complete}/></Shell>;
};

export const PaymentSuccessScreen = ({ navigation, route }: P<'PaymentSuccess'>) => { const { theme } = useAppTheme(); const { memberships } = useCatalog(); const plan = memberships.find(item => item.id === route.params.planId); return <Shell><View style={s.state}><View style={[s.stateIcon, { backgroundColor: theme.success + '18' }]}><Ionicons name="checkmark" size={45} color={theme.success}/></View><Text style={[s.stateTitle, { color: theme.text }]}>Membership activated</Text><Text style={[s.stateCopy, { color: theme.muted }]}>Your {plan?.name ?? 'selected membership'} is active. All Fitora programs are now unlocked.</Text><StatusBadge label={`${plan?.name ?? 'Membership'} · Active`} tone="success"/></View><AppButton title="Explore programs" onPress={() => navigation.replace('Main')}/></Shell>; };
export const PaymentFailedScreen = ({ navigation, route }: P<'PaymentFailed'>) => { const { theme } = useAppTheme(); return <Shell><View style={s.state}><View style={[s.stateIcon, { backgroundColor: theme.danger + '18' }]}><Ionicons name="close" size={45} color={theme.danger}/></View><Text style={[s.stateTitle, { color: theme.text }]}>Activation failed</Text><Text style={[s.stateCopy, { color: theme.muted }]}>We couldn’t activate this membership. No amount was charged.</Text></View><AppButton title="Try again" onPress={() => navigation.replace('Checkout', { planId: route.params.planId })}/></Shell>; };

export const VideoDetailsScreen = ({ navigation, route }: P<'VideoDetails'>) => {
  const { theme } = useAppTheme(); const { videos } = useCatalog(); const video = videos.find(item => item.id === route.params.videoId);
  // The backend only returns a playback id for entitled members, admins, or free previews.
  const unlocked = Boolean(video?.muxPlaybackId);
  const source = unlocked && video?.muxPlaybackId ? { uri: `https://stream.mux.com/${video.muxPlaybackId}.m3u8` } : null;
  const player = useVideoPlayer(source, instance => { instance.loop = false; });
  const restored = useRef(false);
  useEffect(() => {
    if (!video || !unlocked) return;
    let active = true;
    let lastSavedSecond = -5;
    let latestPosition = 0;
    let knownDuration = video.durationSeconds;
    restored.current = false;
    player.timeUpdateEventInterval = 1;
    videoProgressService.get(video.id).then(saved => {
      if (!active || !saved || restored.current) return;
      const duration = saved.durationSeconds || knownDuration;
      knownDuration = duration;
      latestPosition = saved.positionSeconds;
      if (saved.positionSeconds > 0 && saved.positionSeconds < duration - 3) {
        try {
          player.currentTime = saved.positionSeconds;
        } catch {
          // The screen may have closed while stored progress was loading.
        }
      }
      restored.current = true;
    });
    const sourceSubscription = player.addListener('sourceLoad', ({ duration }) => {
      if (duration > 0) knownDuration = duration;
    });
    const timeSubscription = player.addListener('timeUpdate', ({ currentTime }) => {
      latestPosition = currentTime;
      if (Math.abs(currentTime - lastSavedSecond) < 5) return;
      lastSavedSecond = currentTime;
      videoProgressService.save(video.id, currentTime, knownDuration).catch(() => undefined);
    });
    const endSubscription = player.addListener('playToEnd', () => {
      latestPosition = knownDuration;
      videoProgressService.complete(video.id, knownDuration).catch(() => undefined);
    });
    return () => {
      active = false;
      sourceSubscription.remove();
      timeSubscription.remove();
      endSubscription.remove();
      if (latestPosition > 0) {
        videoProgressService.save(video.id, latestPosition, knownDuration).catch(() => undefined);
      }
    };
  }, [player, unlocked, video]);
  if (!video) return <Shell><AppHeader title="Workout" back onBack={() => navigation.goBack()}/><EmptyState title="This video is locked or unavailable. Choose a membership to watch it."/><AppButton title="View memberships" onPress={() => navigation.navigate('Plans')}/></Shell>;
  if (!unlocked) return <Shell><AppHeader title="Workout locked" subtitle="Premium content" back onBack={() => navigation.goBack()}/><LockedWorkoutOffer category={video.category} onViewMemberships={() => navigation.navigate('Plans')}/></Shell>;
  return <Shell><AppHeader title="Workout" back onBack={() => navigation.goBack()}/><VideoView style={s.player} player={player} nativeControls fullscreenOptions={{ enable: true }} allowsPictureInPicture/><View style={s.row}><View style={{ flex: 1 }}><Text style={[s.videoTitle, { color: theme.text }]}>{video.title}</Text><Text style={{ color: theme.muted, marginTop: 5 }}>{video.category} · {video.duration}</Text></View><StatusBadge label="Unlocked" tone="success"/></View><Text style={[s.heading, { color: theme.text }]}>With {video.trainer}</Text><Text style={{ color: theme.muted, lineHeight: 23 }}>{video.description || 'Follow the trainer at your own pace and listen to your body.'}</Text></Shell>;
};

export const LockedContentScreen = ({ navigation, route }: P<'LockedContent'>) => { const { videos } = useCatalog(); const video = videos.find(item => item.id === route.params.videoId); return <Shell><AppHeader title="Workout locked" subtitle="Premium content" back onBack={() => navigation.goBack()}/><LockedWorkoutOffer category={video?.category} onViewMemberships={() => navigation.navigate('Plans')}/></Shell>; };

export const EditProfileScreen = ({ navigation }: P<'EditProfile'>) => { const { theme } = useAppTheme(); const { profile, user, updateProfile } = useAuth(); const [fullName, setFullName] = useState(profile?.full_name || ''); const [phone, setPhone] = useState(profile?.phone || ''); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const save = async () => { if (!fullName.trim()) { setError('Full name is required.'); return; } setBusy(true); setError(''); setSaved(false); try { await updateProfile({ full_name: fullName, phone: phone || null }); setSaved(true); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save your profile.'); } finally { setBusy(false); } }; return <Shell><AppHeader title="Edit profile" subtitle="Keep your details current." back onBack={() => navigation.goBack()}/><AppInput label="Full name" value={fullName} onChangeText={setFullName}/><AppInput label="Email" value={profile?.email || user?.email || ''} editable={false} keyboardType="email-address"/><Text style={{ color: theme.muted, fontSize: 12, marginTop: -14 }}>Email is managed by your account and cannot be edited here.</Text><AppInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>{!!error && <Text style={{ color: theme.danger, textAlign: 'center' }}>{error}</Text>}<AppButton title={busy ? 'Saving…' : saved ? 'Changes saved' : 'Save changes'} icon={saved ? 'checkmark' : undefined} disabled={busy} onPress={save}/>{saved && <Text style={{ color: theme.success, textAlign: 'center' }}>Your shared profile has been updated.</Text>}</Shell>; };

const locked = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center' },
  iconHalo: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconCircle: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '900', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 26, lineHeight: 31, fontWeight: '900', textAlign: 'center', letterSpacing: -.55 },
  copy: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 300 },
  divider: { width: '100%', height: StyleSheet.hairlineWidth, marginVertical: 21 },
  benefit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 20 },
  benefitText: { fontSize: 13, lineHeight: 17, fontWeight: '800' },
  buttonWrap: { width: '100%' },
});

const s = StyleSheet.create({ page: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 38, gap: 22, flexGrow: 1 }, price: { fontSize: 38, fontWeight: '900' }, priceSmall: { fontSize: 23, fontWeight: '900' }, heading: { fontSize: 19, fontWeight: '900', marginTop: 2 }, check: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 2 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }, secure: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 }, state: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: 16 }, stateIcon: { width: 92, height: 92, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }, stateTitle: { fontSize: 31, fontWeight: '900', textAlign: 'center', letterSpacing: -.7 }, stateCopy: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 330 }, player: { width: '100%', height: 235, borderRadius: 26, overflow: 'hidden', backgroundColor: '#111' }, videoTitle: { fontSize: 29, fontWeight: '900', letterSpacing: -.8 }, lockCircle: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center' } });
