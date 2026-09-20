import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, ImageBackground, ImageSourcePropType, Platform, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { MembershipPlan, Video } from '../types';

export const AppButton = ({ title, onPress, variant = 'primary', icon, disabled }: { title: string; onPress?: () => void; variant?: 'primary'|'secondary'|'ghost'; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean }) => {
  const { theme } = useAppTheme();
  const bg = variant === 'primary' ? theme.accent : variant === 'secondary' ? theme.surfaceAlt : 'transparent';
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, { backgroundColor: bg, borderColor: theme.border, opacity: pressed || disabled ? .65 : 1 }]}>
    {icon && <Ionicons name={icon} size={19} color={variant === 'primary' ? '#fff' : theme.text} />}
    <Text style={[s.buttonText, { color: variant === 'primary' ? '#fff' : theme.text }]}>{title}</Text>
  </Pressable>;
};
export const AppInput = ({ label, secureTextEntry, ...props }: TextInputProps & { label?: string }) => {
  const { theme } = useAppTheme(); const [hidden, setHidden] = useState(!!secureTextEntry);
  return <View style={{ gap: 8 }}><Text style={[s.label, { color: theme.text }]}>{label}</Text><View style={[s.inputWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}><TextInput {...props} secureTextEntry={hidden} placeholderTextColor={theme.muted} style={[s.input, { color: theme.text }]} />{secureTextEntry && <Pressable onPress={() => setHidden(v => !v)}><Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.muted}/></Pressable>}</View></View>;
};
export const GlassCard = ({ children, style }: React.PropsWithChildren<{ style?: object }>) => {
  const { theme } = useAppTheme();
  const isAndroid = Platform.OS === 'android';
  return <View style={[
    s.cardShell,
    isAndroid && s.cardShellAndroid,
    { borderColor: theme.border, backgroundColor: isAndroid ? theme.surface : 'transparent' },
    style,
  ]}>
    {!isAndroid ? <BlurView intensity={theme.dark ? 42 : 62} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}/> : null}
    {!isAndroid ? <LinearGradient pointerEvents="none" colors={theme.dark ? ['rgba(255,255,255,.13)', 'rgba(255,255,255,.035)', 'rgba(243,107,33,.055)'] : ['rgba(255,255,255,.88)', 'rgba(255,255,255,.54)', 'rgba(247,247,244,.76)']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/> : null}
    {!isAndroid ? <View pointerEvents="none" style={s.glassHighlight}/> : null}
    <View style={[s.cardContent, { gap: 14 }]}>{children}</View>
  </View>;
};
export const AmbientBackground = () => null;
export const SectionHeader = ({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) => { const { theme } = useAppTheme(); return <View style={s.sectionHead}><Text style={[s.sectionTitle, { color: theme.text }]}>{title}</Text>{action && <Pressable accessibilityRole="button" accessibilityLabel={action} hitSlop={10} pressRetentionOffset={12} onPress={onPress} style={({ pressed }) => [s.sectionAction, { opacity: pressed ? .55 : 1 }]}><Text style={{ color: theme.accent, fontWeight: '700' }}>{action}</Text></Pressable>}</View>; };
export const StatusBadge = ({ label, tone = 'accent' }: { label: string; tone?: 'accent'|'success'|'neutral' }) => { const { theme } = useAppTheme(); const c = tone === 'success' ? theme.success : tone === 'neutral' ? theme.muted : theme.accent; return <View style={[s.badge, { backgroundColor: c + '18' }]}><View style={[s.dot, { backgroundColor: c }]}/><Text style={{ color: c, fontSize: 12, fontWeight: '800' }}>{label}</Text></View>; };
export const AppHeader = ({ title, subtitle, back, onBack }: { title: string; subtitle?: string; back?: boolean; onBack?: () => void }) => { const { theme } = useAppTheme(); return <View style={s.header}>{back && <Pressable onPress={onBack} style={[s.iconButton, { backgroundColor: theme.surface }]}><Ionicons name="arrow-back" size={21} color={theme.text}/></Pressable>}<View style={{ flex: 1 }}><Text style={[s.headerTitle, { color: theme.text }]}>{title}</Text>{subtitle && <Text style={{ color: theme.muted, marginTop: 3 }}>{subtitle}</Text>}</View></View>; };
export const PlanCard = ({ plan, onDetails, onChoose }: { plan: MembershipPlan; onDetails: () => void; onChoose: () => void }) => {
  const { theme } = useAppTheme();
  const foreground = plan.popular ? '#FFFFFF' : theme.text;
  const secondary = plan.popular ? 'rgba(255,255,255,.68)' : theme.muted;
  const months = Math.max(1, Math.round(plan.durationDays / 30));
  const monthlyPrice = Math.round(plan.price / months);
  return (
    <View style={[s.planCard, { backgroundColor: plan.popular ? '#191917' : theme.surface, borderColor: plan.popular ? theme.accent : theme.border }]}> 
      {plan.popular && <LinearGradient colors={['#24221F', '#191917', '#2A160C']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>} 
      {plan.popular && <View pointerEvents="none" style={[s.planGlow, { backgroundColor: theme.accent }]} />}

      <View style={s.planTopRow}>
        <View style={[s.planIcon, { backgroundColor: plan.popular ? theme.accent : theme.accent + '16' }]}>
          <Ionicons name={plan.popular ? 'diamond' : 'flash'} size={17} color={plan.popular ? '#FFFFFF' : theme.accent}/>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.planEyebrow, { color: plan.popular ? theme.accent : theme.muted }]}>{months === 1 ? 'FLEXIBLE START' : 'BEST VALUE'}</Text>
          <Text style={[s.planName, { color: foreground }]}>{plan.name}</Text>
        </View>
        {plan.badge && (
          <View style={[s.popular, { backgroundColor: plan.popular ? theme.accent : theme.accent + '16' }]}> 
            <Ionicons name="sparkles" size={11} color={plan.popular ? '#FFFFFF' : theme.accent}/>
            <Text style={[s.popularText, { color: plan.popular ? '#FFFFFF' : theme.accent }]}>{plan.badge}</Text>
          </View>
        )}
      </View>

      <View style={s.priceBlock}>
        <View style={s.priceRow}>
          <Text style={[s.currency, { color: secondary }]}>₹</Text>
          <Text style={[s.price, { color: foreground }]}>{plan.price.toLocaleString('en-IN')}</Text>
        </View>
        <View style={s.priceMeta}>
          <Text style={[s.pricePeriod, { color: secondary }]}>for {months} {months === 1 ? 'month' : 'months'}</Text>
          {months > 1 && <Text style={[s.monthlyEquivalent, { color: theme.accent }]}>Only ₹{monthlyPrice.toLocaleString('en-IN')}/month</Text>}
        </View>
      </View>

      {plan.savingsLabel && (
        <View style={[s.savingsPill, { backgroundColor: plan.popular ? 'rgba(243,107,33,.17)' : theme.accent + '12' }]}> 
          <Ionicons name="pricetag" size={14} color={theme.accent}/>
          <Text style={[s.savingsText, { color: theme.accent }]}>{plan.savingsLabel}</Text>
        </View>
      )}

      <View style={[s.compactSummary, { borderColor: plan.popular ? 'rgba(255,255,255,.12)' : theme.border }]}>
        <Ionicons name="checkmark-circle" size={16} color={theme.accent}/>
        <Text numberOfLines={1} style={[s.compactSummaryText, { color: secondary }]}>
          All programs · Meal plans · Tracking
        </Text>
      </View>

      <View style={s.planActions}>
        <Pressable onPress={onChoose} style={({pressed}) => [s.buyButton, { backgroundColor: theme.accent, opacity: pressed ? .78 : 1 }]}>
          <Text style={s.buyButtonText}>Buy</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFFFFF"/>
        </Pressable>
        <Pressable onPress={onDetails} style={({pressed}) => [s.detailsButton, { borderColor: plan.popular ? 'rgba(255,255,255,.18)' : theme.border, backgroundColor: plan.popular ? 'rgba(255,255,255,.07)' : theme.surfaceAlt, opacity: pressed ? .65 : 1 }]}>
          <Text style={[s.detailsButtonText, { color: foreground }]}>Details</Text>
        </Pressable>
      </View>
    </View>
  );
};
export const ContentCard = ({ video, onPress, wide = false }: { video: Video; onPress: () => void; wide?: boolean }) => { const { theme } = useAppTheme(); return <Pressable onPress={onPress} style={({pressed}) => [s.contentCard, { borderColor: theme.border, opacity: pressed ? .78 : 1 }, wide && { width: 248 }]}><BlurView intensity={theme.dark ? 38 : 55} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}/><LinearGradient colors={theme.dark ? ['rgba(255,255,255,.11)','rgba(255,255,255,.025)'] : ['rgba(255,255,255,.8)','rgba(255,255,255,.3)']} style={StyleSheet.absoluteFill}/><ImageBackground source={{ uri: video.thumbnailUrl }} resizeMode="cover" imageStyle={{ opacity: .94 }} style={s.thumb}><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,9,.24)' }]}/><View style={s.playBubble}><Ionicons name="play" color="#fff" size={20}/></View><StatusBadge label="Unlocked" tone="success"/></ImageBackground><View style={s.contentBody}><Text numberOfLines={1} style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{video.title}</Text><Text style={{ color: theme.muted, fontSize: 12 }}>{video.category} · {video.duration}</Text>{video.progress !== undefined && <View style={[s.track, { backgroundColor: theme.surfaceAlt }]}><View style={{ width: `${video.progress * 100}%`, height: 3, backgroundColor: theme.accent, borderRadius: 2 }}/></View>}</View></Pressable>; };
export const EmptyState = ({ title = 'Nothing here yet' }: { title?: string }) => { const { theme } = useAppTheme(); return <GlassCard style={{ alignItems: 'center', gap: 10 }}><Ionicons name="sparkles-outline" size={28} color={theme.accent}/><Text style={{ color: theme.text, fontWeight: '800' }}>{title}</Text></GlassCard>; };
export const LoadingState = () => { const { theme } = useAppTheme(); return <View style={{ gap: 10 }}>{[1,2,3].map(x => <View key={x} style={{ height: 76, borderRadius: 18, backgroundColor: theme.surfaceAlt }}/>)}</View>; };
export const HeroImage = ({ source, style }: { source: ImageSourcePropType; style?: object }) => <Image source={source} style={style} resizeMode="cover"/>;

const s = StyleSheet.create({
  button: { minHeight: 54, paddingHorizontal: 20, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1 },
  buttonText: { fontSize: 16, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700' },
  inputWrap: { height: 56, borderRadius: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  input: { flex: 1, height: '100%', fontSize: 15 },
  cardShell: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', shadowColor: '#171714', shadowOpacity: .1, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 5 },
  cardShellAndroid: { elevation: 0, shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  cardContent: { padding: 20 },
  glassHighlight: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,.92)' },
  sectionHead: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 2, zIndex: 20, elevation: 20 },
  sectionAction: { minWidth: 68, minHeight: 40, alignItems: 'flex-end', justifyContent: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -.3 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 99 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  header: { minHeight: 64, flexDirection: 'row', gap: 13, alignItems: 'center', marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -.7 },
  iconButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planCard: { position: 'relative', overflow: 'hidden', borderRadius: 23, borderWidth: 1.3, padding: 15, shadowColor: '#171714', shadowOpacity: .09, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  planGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -105, top: -120, opacity: .24 },
  planTopRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  planIcon: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  planEyebrow: { fontSize: 8, lineHeight: 11, fontWeight: '900', letterSpacing: 1.1, marginBottom: 2 },
  planName: { fontSize: 18, lineHeight: 21, fontWeight: '900', letterSpacing: -.35 },
  popular: { maxWidth: 100, minHeight: 25, paddingHorizontal: 8, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  popularText: { flexShrink: 1, fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: .25, textAlign: 'center' },
  priceBlock: { marginTop: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start' },
  currency: { fontSize: 16, lineHeight: 22, fontWeight: '900', marginTop: 4, marginRight: 2 },
  price: { fontSize: 32, lineHeight: 36, fontWeight: '900', letterSpacing: -1.25 },
  priceMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 1 },
  pricePeriod: { fontSize: 11, fontWeight: '700' },
  monthlyEquivalent: { fontSize: 11, fontWeight: '900' },
  savingsPill: { position: 'absolute', right: 15, bottom: 15, minHeight: 27, borderRadius: 99, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  savingsText: { fontSize: 10, fontWeight: '900' },
  benefitsPanel: { borderRadius: 19, padding: 14, gap: 10, marginTop: 17 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  benefitCheck: { width: 23, height: 23, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: '600' },
  planCta: { minHeight: 52, borderRadius: 17, paddingHorizontal: 16, marginTop: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planCtaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  planCtaArrow: { width: 29, height: 29, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' },
  planDetails: { minHeight: 37, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 5 },
  planDetailsText: { fontSize: 11, fontWeight: '700' },
  compactSummary: { height: 34, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  compactSummaryText: { flex: 1, fontSize: 11, fontWeight: '700' },
  planActions: { flexDirection: 'row', gap: 9, marginTop: 11, paddingRight: 104 },
  buyButton: { height: 40, borderRadius: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1 },
  buyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  detailsButton: { height: 40, minWidth: 86, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  detailsButtonText: { fontSize: 13, fontWeight: '900' },
  contentCard: { width: '48%', borderRadius: 21, borderWidth: 1, overflow: 'hidden', shadowColor: '#171714', shadowOpacity: .08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  thumb: { height: 116, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playBubble: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,.24)', alignItems: 'center', justifyContent: 'center' },
  contentBody: { padding: 14, gap: 6 },
  track: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
});
