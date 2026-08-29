import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LoginScreen, RegisterScreen, SplashScreen, VerifyEmailOtpScreen, WelcomeScreen } from '../screens/AuthScreens';
import { CheckoutScreen, EditProfileScreen, LockedContentScreen, PaymentFailedScreen, PaymentSuccessScreen, PlanDetailsScreen, VideoDetailsScreen } from '../screens/DetailScreens';
import { ExploreScreen, HomeScreen, PlansScreen, SubscriptionScreen } from '../screens/MainScreens';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const tabs = [['Home', 'home-outline', 'home', HomeScreen], ['Explore', 'compass-outline', 'compass', ExploreScreen], ['Subscription', 'sparkles-outline', 'sparkles', PlansScreen], ['Profile', 'person-outline', 'person', ProfileScreen]] as const;

const MainTabs = () => {
  const { theme } = useAppTheme();
  return <Tab.Navigator screenOptions={{
    headerShown: false,
    tabBarStyle: { position: 'absolute', marginHorizontal: 10, bottom: 10, height: 70, paddingTop: 8, paddingBottom: 8, borderRadius: 25, overflow: 'hidden', backgroundColor: 'transparent', borderTopWidth: 1, borderWidth: 1, borderColor: theme.dark ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.86)', shadowColor: '#000', shadowOpacity: theme.dark ? .22 : .1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
    tabBarItemStyle: { flex: 1, alignItems: 'center', justifyContent: 'center' }, tabBarIconStyle: { margin: 0 }, tabBarActiveTintColor: theme.accent, tabBarInactiveTintColor: theme.muted,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    tabBarBackground: () => <View style={[StyleSheet.absoluteFill, { borderRadius: 25, overflow: 'hidden' }]}><BlurView intensity={theme.dark ? 58 : 78} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}/><LinearGradient colors={theme.dark ? ['rgba(255,255,255,.14)', 'rgba(20,20,19,.72)'] : ['rgba(255,255,255,.88)', 'rgba(255,255,255,.54)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}/><View style={{ position: 'absolute', top: 0, left: 22, right: 22, height: 1, backgroundColor: 'rgba(255,255,255,.95)' }}/></View>,
  }}>
    {tabs.map(([name, off, on, Component]) => <Tab.Screen key={name} name={name} component={Component} options={{ tabBarIcon: ({ focused, color }) => <Ionicons name={(focused ? on : off) as any} color={color} size={22}/> }}/>) }
  </Tab.Navigator>;
};

export const AppNavigator = () => {
  const { theme } = useAppTheme(); const { session, loading } = useAuth(); const base = theme.dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: theme.background, card: theme.surface, text: theme.text, border: theme.border, primary: theme.accent } };
  if (loading) return <SplashScreen/>;
  return <NavigationContainer theme={navTheme}>{session ? <Stack.Navigator key="app" screenOptions={{ headerShown: false, animation: 'slide_from_right' }} initialRouteName="Main">
    <Stack.Screen name="Main" component={MainTabs}/><Stack.Screen name="MySubscription" component={SubscriptionScreen}/><Stack.Screen name="PlanDetails" component={PlanDetailsScreen}/><Stack.Screen name="Checkout" component={CheckoutScreen}/><Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen}/><Stack.Screen name="PaymentFailed" component={PaymentFailedScreen}/><Stack.Screen name="VideoDetails" component={VideoDetailsScreen}/><Stack.Screen name="LockedContent" component={LockedContentScreen}/><Stack.Screen name="EditProfile" component={EditProfileScreen}/>
  </Stack.Navigator> : <Stack.Navigator key="auth" screenOptions={{ headerShown: false, animation: 'slide_from_right' }} initialRouteName="Welcome">
    <Stack.Screen name="Welcome" component={WelcomeScreen}/><Stack.Screen name="Login" component={LoginScreen}/><Stack.Screen name="Register" component={RegisterScreen}/><Stack.Screen name="VerifyEmailOtp" component={VerifyEmailOtpScreen}/>
  </Stack.Navigator>}</NavigationContainer>;
};
