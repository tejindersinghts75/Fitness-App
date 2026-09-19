import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
const hero = require('../../assets/fitness-hero.png');
type P<N extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, N>;
const messageOf = (error: unknown) => {
  const raw = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : '';
  const message = raw.toLowerCase();

  if (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('connection was lost') ||
    message.includes('load failed') ||
    message.includes('timed out')
  ) {
    return 'We couldn’t connect. Check your internet connection and try again.';
  }
  if (message.includes('token has expired') || message.includes('otp_expired')) {
    return 'This code has expired. Request a new code and try again.';
  }
  if (
    message.includes('invalid token') ||
    message.includes('invalid otp') ||
    message.includes('token is invalid')
  ) {
    return 'That verification code is incorrect. Check the code and try again.';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }

  return raw || 'Something went wrong. Please try again.';
};

export const SplashScreen = () => { const { theme } = useAppTheme(); return <SafeAreaView style={[s.center, { backgroundColor: theme.background }]}><View style={[s.logo, { backgroundColor: theme.accent }]}><Ionicons name="pulse" color="#fff" size={35}/></View><Text style={[s.brand, { color: theme.text }]}>FITORA</Text><Text style={{ color: theme.muted }}>Move with purpose.</Text><View style={[s.loader, { backgroundColor: theme.surfaceAlt }]}><View style={{ width: '55%', height: 4, borderRadius: 4, backgroundColor: theme.accent }}/></View></SafeAreaView>; };
export const WelcomeScreen = ({ navigation }: P<'Welcome'>) => { const { theme } = useAppTheme(); return <View style={{ flex: 1, backgroundColor: theme.background }}><ImageBackground source={hero} style={{ flex: 1 }}><View style={s.overlay}/><SafeAreaView style={s.welcome}><View style={s.brandRow}><View style={[s.logoSmall, { backgroundColor: theme.accent }]}><Ionicons name="pulse" color="#fff" size={19}/></View><Text style={s.brandWhite}>FITORA</Text></View><View style={{ gap: 15 }}><Text style={s.heroTitle}>Your strongest self starts here.</Text><Text style={s.heroCopy}>Premium training that fits your pace, your goals, and your life.</Text><AppButton title="Get started" onPress={() => navigation.navigate('Register')} icon="arrow-forward"/><AppButton title="I already have an account" variant="secondary" onPress={() => navigation.navigate('Login')}/></View></SafeAreaView></ImageBackground></View>; };
const AuthShell = ({ title, subtitle, children, onBack }: React.PropsWithChildren<{ title: string; subtitle: string; onBack: () => void }>) => { const { theme } = useAppTheme(); return <SafeAreaView style={[s.safe, { backgroundColor: theme.background }]}><ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled"><AppHeader title={title} subtitle={subtitle} back onBack={onBack}/>{children}</ScrollView></SafeAreaView>; };

export const LoginScreen = ({ navigation }: P<'Login'>) => {
  const { requestLoginOtp } = useAuth(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async () => { const normalizedEmail = email.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) { setError('Enter a valid registered email address.'); return; } setBusy(true); setError(''); try { await requestLoginOtp(normalizedEmail); navigation.navigate('VerifyEmailOtp', { email: normalizedEmail, mode: 'login' }); } catch (e) { const message = messageOf(e); setError(message.toLowerCase().includes('signups not allowed') ? 'No account was found for this email. Please create an account first.' : message); } finally { setBusy(false); } };
  return <AuthShell title="Welcome back" subtitle="Enter your registered email and we’ll send you a login code." onBack={() => navigation.goBack()}><AppInput label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email"/>{!!error && <Text style={s.error}>{error}</Text>}<AppButton title={busy ? 'Sending code…' : 'Send login code'} disabled={busy} onPress={submit}/><Text style={s.helper}>No password needed. Your one-time code will arrive by email.</Text><Text style={s.authFoot}>New to Fitora? <Text style={s.link} onPress={() => navigation.navigate('Register')}>Create account</Text></Text></AuthShell>;
};

export const RegisterScreen = ({ navigation }: P<'Register'>) => {
  const { requestSignupOtp } = useAuth(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [firstName, setFirstName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const submit = async () => { const normalizedEmail = email.trim().toLowerCase(); if (!firstName.trim() || !normalizedEmail || !phone.trim()) { setError('Complete all three fields.'); return; } if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) { setError('Enter a valid email address.'); return; } if (phone.replace(/\D/g, '').length < 10) { setError('Enter a valid mobile number.'); return; } setBusy(true); setError(''); try { await requestSignupOtp({ firstName, email: normalizedEmail, phone }); navigation.replace('VerifyEmailOtp', { email: normalizedEmail, mode: 'signup' }); } catch (e) { setError(messageOf(e)); } finally { setBusy(false); } };
  return <AuthShell title="Create account" subtitle="Three details, then verify your email." onBack={() => navigation.goBack()}><AppInput label="First name" placeholder="Your first name" value={firstName} onChangeText={setFirstName} autoComplete="given-name"/><AppInput label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email"/><AppInput label="Mobile number" placeholder="+91 00000 00000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel"/>{!!error && <Text style={s.error}>{error}</Text>}<AppButton title={busy ? 'Sending code…' : 'Continue with email OTP'} disabled={busy} onPress={submit}/><Text style={s.helper}>By continuing, you agree to Fitora’s Terms and Privacy Policy.</Text><Text style={s.authFoot}>Already a member? <Text style={s.link} onPress={() => navigation.navigate('Login')}>Log in</Text></Text></AuthShell>;
};

export const VerifyEmailOtpScreen = ({ navigation, route }: P<'VerifyEmailOtp'>) => {
  const { theme } = useAppTheme();
  const { verifyEmailOtp, resendEmailOtp } = useAuth(); const [otp, setOtp] = useState(''); const [busy, setBusy] = useState(false); const [resending, setResending] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const submit = async () => { if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit verification code from your email.'); return; } setBusy(true); setError(''); try { await verifyEmailOtp(route.params.email, otp); } catch (e) { setError(messageOf(e)); } finally { setBusy(false); } };
  const resend = async () => { setResending(true); setError(''); setNotice(''); try { await resendEmailOtp(route.params.email, route.params.mode); setNotice('A new verification code was sent.'); } catch (e) { setError(messageOf(e)); } finally { setResending(false); } };
  const returnScreen = route.params.mode === 'login' ? 'Login' : 'Register';
  const title = route.params.mode === 'login' ? 'Enter your login code' : 'Verify your email';
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.otpPage}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.navigate(returnScreen)}
          style={({ pressed }) => [s.otpBack, { backgroundColor: theme.surfaceAlt, opacity: pressed ? .62 : 1 }]}
        >
          <Ionicons name="arrow-back" size={21} color={theme.text} />
        </Pressable>

        <View style={s.otpHero}>
          <View style={[s.otpHalo, { backgroundColor: theme.accentSoft }]}>
            <View style={[s.otpIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="mail-open-outline" size={30} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[s.otpEyebrow, { color: theme.accent }]}>ONE LAST STEP</Text>
          <Text style={[s.otpTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[s.otpCopy, { color: theme.muted }]}>We sent a six-digit verification code to</Text>
          <View style={[s.emailPill, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
            <Ionicons name="mail-outline" size={15} color={theme.accent} />
            <Text numberOfLines={1} style={[s.emailPillText, { color: theme.text }]}>{route.params.email}</Text>
          </View>
        </View>

        <View style={[s.otpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <View style={s.otpLabelRow}>
            <Text style={[s.otpLabel, { color: theme.text }]}>Verification code</Text>
            <Text style={[s.otpCount, { color: otp.length === 6 ? theme.accent : theme.muted }]}>{otp.length}/6</Text>
          </View>
          <TextInput
            value={otp}
            onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            autoFocus
            placeholder="000000"
            placeholderTextColor={theme.dark ? '#545450' : '#D4D3CE'}
            selectionColor={theme.accent}
            style={[s.otpInput, { color: theme.text, backgroundColor: theme.background, borderColor: otp.length === 6 ? theme.accent : theme.border }]}
          />
          <Text style={[s.otpHint, { color: theme.muted }]}>The code expires shortly. Check your spam folder if you don’t see it.</Text>
          {!!notice && <View style={s.messageRow}><Ionicons name="checkmark-circle" size={17} color="#27A66B" /><Text style={[s.success, { flex: 1 }]}>{notice}</Text></View>}
          {!!error && <View style={s.messageRow}><Ionicons name="alert-circle" size={17} color="#E74C3C" /><Text style={[s.error, { flex: 1 }]}>{error}</Text></View>}
          <AppButton title={busy ? 'Verifying…' : route.params.mode === 'login' ? 'Verify and log in' : 'Verify and continue'} icon="arrow-forward" disabled={busy || resending || otp.length !== 6} onPress={submit}/>
        </View>

        <View style={s.otpActions}>
          <Text style={[s.otpActionCopy, { color: theme.muted }]}>Didn’t receive the email?</Text>
          <Pressable disabled={busy || resending} onPress={resend} hitSlop={10}>
            <Text style={[s.otpActionLink, { color: theme.accent, opacity: busy || resending ? .55 : 1 }]}>{resending ? 'Sending…' : 'Resend code'}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => navigation.navigate(returnScreen)} style={s.changeEmailButton}>
          <Ionicons name="create-outline" size={15} color={theme.muted} />
          <Text style={[s.changeEmailText, { color: theme.muted }]}>Use a different email</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { width: 76, height: 76, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoSmall: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 29, fontWeight: '900', letterSpacing: 3 },
  brandWhite: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  loader: { width: 110, height: 4, borderRadius: 4, overflow: 'hidden', marginTop: 32 },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(7,7,6,.42)' },
  welcome: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroTitle: { color: '#fff', fontSize: 43, lineHeight: 47, fontWeight: '900', letterSpacing: -1.4, maxWidth: 340 },
  heroCopy: { color: 'rgba(255,255,255,.82)', fontSize: 16, lineHeight: 24, maxWidth: 335 },
  form: { padding: 22, gap: 18, flexGrow: 1 },
  link: { color: '#F36B21', fontWeight: '800' },
  authFoot: { textAlign: 'center', color: '#777772', marginTop: 4 },
  helper: { textAlign: 'center', color: '#8A8A84', fontSize: 12, lineHeight: 18, paddingHorizontal: 12 },
  error: { color: '#E74C3C', fontSize: 13, lineHeight: 18 },
  success: { color: '#27A66B', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  otpPage: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30 },
  otpBack: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  otpHero: { alignItems: 'center', marginTop: 12 },
  otpHalo: { width: 88, height: 88, borderRadius: 30, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  otpIcon: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '6deg' }], shadowColor: '#F36B21', shadowOpacity: .24, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  otpEyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '900', letterSpacing: 1.7, marginTop: 20 },
  otpTitle: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -.9, marginTop: 5, textAlign: 'center' },
  otpCopy: { fontSize: 13, lineHeight: 19, marginTop: 7, textAlign: 'center' },
  emailPill: { maxWidth: '94%', minHeight: 34, borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  emailPillText: { flexShrink: 1, fontSize: 12, fontWeight: '700' },
  otpCard: { borderRadius: 25, borderWidth: 1, padding: 18, marginTop: 24, shadowColor: '#171714', shadowOpacity: .06, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  otpLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  otpLabel: { fontSize: 13, fontWeight: '800' },
  otpCount: { fontSize: 11, fontWeight: '800' },
  otpInput: { height: 68, borderRadius: 18, borderWidth: 1.5, marginTop: 10, paddingHorizontal: 18, textAlign: 'center', fontSize: 28, fontWeight: '900', letterSpacing: Platform.OS === 'ios' ? 16 : 12 },
  otpHint: { fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 6, marginTop: 10, marginBottom: 17 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 13 },
  otpActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 20 },
  otpActionCopy: { fontSize: 13 },
  otpActionLink: { fontSize: 13, fontWeight: '900' },
  changeEmailButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 5 },
  changeEmailText: { fontSize: 12, fontWeight: '700' },
});
