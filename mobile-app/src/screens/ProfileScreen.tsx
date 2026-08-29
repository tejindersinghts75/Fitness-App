import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground, AppHeader, GlassCard, StatusBadge } from '../components/ui';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { RootStackParamList } from '../types';

export const ProfileScreen = () => {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { profile, user, signOut } = useAuth();
  const { plans, subscriptions } = useCatalog();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member';
  const initials = displayName.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
  const activeNames = subscriptions.filter(item => item.status === 'active' && new Date(item.expiresAt).getTime() > Date.now()).map(item => plans.find(plan => plan.id === item.packageId)?.name).filter(Boolean);
  const items = [
    ['person-outline', 'Edit profile', () => nav.navigate('EditProfile')],
    ['card-outline', 'My subscription', () => nav.navigate('MySubscription')],
  ] as const;
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
    <AmbientBackground/>
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <AppHeader title="Profile" subtitle="Manage your Fitora account."/>
      <View style={s.profile}><View style={[s.avatar, { backgroundColor: theme.accent }]}><Text style={s.initials}>{initials || 'FM'}</Text></View><Text style={[s.name, { color: theme.text }]}>{displayName}</Text><Text style={{ color: theme.muted }}>{profile?.email || user?.email}</Text>{profile?.phone && <Text style={{ color: theme.muted }}>{profile.phone}</Text>}<StatusBadge label={activeNames.length ? `${activeNames.join(', ')} · Active` : 'No active package'} tone={activeNames.length ? 'success' : 'neutral'}/></View>
      <GlassCard>{items.map(([icon, label, onPress]) => <Pressable key={label} onPress={onPress} style={[s.item, { borderColor: theme.border }]}><Ionicons name={icon} size={21} color={theme.accent}/><Text style={[s.itemText, { color: theme.text }]}>{label}</Text><Ionicons name="chevron-forward" size={19} color={theme.muted}/></Pressable>)}<View style={s.item}><Ionicons name="moon-outline" size={21} color={theme.accent}/><Text style={[s.itemText, { color: theme.text }]}>Dark mode</Text><Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: theme.accent }}/></View></GlassCard>
      <Pressable style={s.logout} onPress={() => signOut().catch(() => {})}><Ionicons name="log-out-outline" color={theme.danger} size={20}/><Text style={{ color: theme.danger, fontWeight: '800' }}>Log out</Text></Pressable>
      <Text style={{ color: theme.muted, textAlign: 'center', fontSize: 12 }}>Fitora 1.0.0</Text>
    </ScrollView>
  </SafeAreaView>;
};

const s = StyleSheet.create({ page: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 128, gap: 24 }, profile: { alignItems: 'center', gap: 8, marginVertical: 4 }, avatar: { width: 86, height: 86, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 7 }, initials: { color: '#fff', fontSize: 28, fontWeight: '900' }, name: { fontSize: 24, fontWeight: '900' }, item: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: StyleSheet.hairlineWidth }, itemText: { flex: 1, fontSize: 15, fontWeight: '700' }, logout: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 } });
