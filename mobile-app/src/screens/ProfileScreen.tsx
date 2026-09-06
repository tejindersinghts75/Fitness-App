import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useAppTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';

const profilePhoto = require('../../assets/fitness-hero.png');

export const ProfileScreen = () => {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { profile, user, signOut } = useAuth();
  const { plans, subscriptions } = useCatalog();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const activeNames = subscriptions
    .filter(item => item.status === 'active' && new Date(item.expiresAt).getTime() > Date.now())
    .map(item => plans.find(plan => plan.id === item.packageId)?.name)
    .filter(Boolean) as string[];
  const accountItems = [
    { icon: 'person-outline', label: 'Personal information', detail: 'Name, email and phone', onPress: () => nav.navigate('EditProfile') },
    { icon: 'card-outline', label: 'My subscription', detail: activeNames.length ? activeNames.join(', ') : 'Choose your training plan', onPress: () => nav.navigate('MySubscription') },
  ] as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <AppHeader title="Profile" subtitle="Your Fitora account" back onBack={() => nav.goBack()} />
        <View style={[s.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.identityRow}>
            <View style={[s.avatarFrame, { borderColor: theme.border }]}>
              <Image source={profilePhoto} style={s.avatar} />
              <View style={s.onlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[s.name, { color: theme.text }]}>{displayName}</Text>
              <Text numberOfLines={1} style={[s.email, { color: theme.muted }]}>{profile?.email || user?.email}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={() => nav.navigate('EditProfile')}
              style={({ pressed }) => [s.editButton, { backgroundColor: theme.accentSoft, opacity: pressed ? .65 : 1 }]}
            >
              <Ionicons name="pencil" size={17} color={theme.accent} />
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => nav.navigate(activeNames.length ? 'MySubscription' : 'Plans')}
          style={({ pressed }) => [s.membershipCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? .68 : 1 }]}
        >
          <View style={[s.membershipIcon, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name={activeNames.length ? 'checkmark' : 'sparkles'} size={21} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.membershipEyebrow, { color: theme.accent }]}>MEMBERSHIP</Text>
            <Text style={[s.membershipName, { color: theme.text }]}>{activeNames.length ? activeNames[0] : 'Choose your training plan'}</Text>
            {!activeNames.length && <Text style={[s.membershipDescription, { color: theme.muted }]}>Unlock guided workouts built for your goal.</Text>}
          </View>
          <View style={[s.membershipArrow, { backgroundColor: theme.accent }]}>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: theme.text }]}>Account</Text>
          <View style={[s.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {accountItems.map((item, index) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                onPress={item.onPress}
                style={({ pressed }) => [
                  s.settingRow,
                  index < accountItems.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                  { opacity: pressed ? .62 : 1 },
                ]}
              >
                <View style={[s.settingIcon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={item.icon} size={21} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.settingLabel, { color: theme.text }]}>{item.label}</Text>
                  <Text numberOfLines={1} style={[s.settingDetail, { color: theme.muted }]}>{item.detail}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: theme.text }]}>Preferences</Text>
          <View style={[s.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.settingRow}>
              <View style={[s.settingIcon, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="moon-outline" size={21} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: theme.text }]}>Dark mode</Text>
                <Text style={[s.settingDetail, { color: theme.muted }]}>Adjust the app appearance</Text>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#D7D7D2', true: theme.accent }} thumbColor="#FFFFFF" />
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => signOut().catch(() => undefined)}
          style={({ pressed }) => [s.logout, { borderColor: `${theme.danger}35`, backgroundColor: `${theme.danger}08`, opacity: pressed ? .65 : 1 }]}
        >
          <Ionicons name="log-out-outline" color={theme.danger} size={21} />
          <Text style={[s.logoutText, { color: theme.danger }]}>Log out</Text>
        </Pressable>
        <Text style={[s.version, { color: theme.muted }]}>Fitora · Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 42, gap: 22 },
  profileCard: { minHeight: 112, borderRadius: 24, borderWidth: 1, padding: 16, justifyContent: 'center' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarFrame: { width: 72, height: 72, borderRadius: 23, backgroundColor: '#FFFFFF', padding: 3, borderWidth: 1 },
  avatar: { width: '100%', height: '100%', borderRadius: 20 },
  onlineDot: { position: 'absolute', right: 1, bottom: 1, width: 17, height: 17, borderRadius: 9, backgroundColor: '#31C878', borderWidth: 3, borderColor: '#FFFFFF' },
  name: { fontSize: 20, lineHeight: 25, fontWeight: '900', letterSpacing: -.35 },
  email: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  editButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  membershipCard: { minHeight: 96, borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  membershipIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  membershipEyebrow: { fontSize: 8, lineHeight: 11, fontWeight: '900', letterSpacing: 1.2 },
  membershipName: { fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 2 },
  membershipDescription: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  membershipArrow: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, lineHeight: 23, fontWeight: '900', letterSpacing: -.25 },
  settingsCard: { borderRadius: 23, borderWidth: 1, paddingHorizontal: 14, overflow: 'hidden' },
  settingRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 13, lineHeight: 17, fontWeight: '800' },
  settingDetail: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  logout: { minHeight: 54, borderRadius: 19, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  logoutText: { fontSize: 13, lineHeight: 17, fontWeight: '900' },
  version: { textAlign: 'center', fontSize: 10, lineHeight: 13, marginTop: -8 },
});
