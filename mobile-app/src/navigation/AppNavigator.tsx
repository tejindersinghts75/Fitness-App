import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LoginScreen, RegisterScreen, SplashScreen, VerifyEmailOtpScreen, WelcomeScreen } from '../screens/AuthScreens';
import { CheckoutScreen, EditProfileScreen, LockedContentScreen, PaymentFailedScreen, PaymentSuccessScreen, PlanDetailsScreen, VideoDetailsScreen } from '../screens/DetailScreens';
import { CategoryVideosScreen, CoachProfileScreen, ExploreScreen, HomeScreen, PlansScreen, ProgressScreen, SubscriptionScreen, TrainersScreen } from '../screens/MainScreens';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const tabs = [
  ['Home', 'Today', 'calendar-outline', 'calendar', HomeScreen],
  ['Explore', 'Progress', 'stats-chart-outline', 'stats-chart', ProgressScreen],
  ['Subscription', 'Workouts', 'barbell-outline', 'barbell', ExploreScreen],
] as const;

const tabMeta = {
  Home: { label: 'Today', off: 'calendar-outline', on: 'calendar' },
  Explore: { label: 'Progress', off: 'stats-chart-outline', on: 'stats-chart' },
  Subscription: { label: 'Workouts', off: 'barbell-outline', on: 'barbell' },
} as const;

const CompactTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  if (state.routes[state.index]?.name === 'Profile') return null;
  const visibleRoutes = state.routes.filter(route => route.name in tabMeta);
  const barWidth = 210;
  return <View style={{
    position: 'absolute',
    left: (width - barWidth) / 2,
    bottom: 12,
    width: barWidth,
    height: 56,
    borderRadius: 28,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEA',
    shadowColor: '#000000',
    shadowOpacity: .12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  }}>
    {visibleRoutes.map(route => {
      const routeIndex = state.routes.findIndex(item => item.key === route.key);
      const selected = state.index === routeIndex;
      const meta = tabMeta[route.name as keyof typeof tabMeta];
      return <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={selected ? { selected: true } : {}}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!selected && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        style={({ pressed }) => ({
          width: 62,
          height: 50,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? theme.accent : 'transparent',
          opacity: pressed ? .72 : 1,
        })}
      >
        <Ionicons name={(selected ? meta.on : meta.off) as any} color={selected ? '#FFFFFF' : '#7D7D78'} size={21}/>
        <Text style={{ color: selected ? '#FFFFFF' : '#7D7D78', fontSize: 8, lineHeight: 10, fontWeight: '800', marginTop: 2 }}>
          {meta.label}
        </Text>
      </Pressable>;
    })}
  </View>;
};

const MainTabs = () => {
  return <Tab.Navigator tabBar={props => <CompactTabBar {...props}/>} screenOptions={{ headerShown: false }}>
    {tabs.map(([name, , , , Component]) => <Tab.Screen key={name} name={name} component={Component}/>) }
    <Tab.Screen name="Profile" component={ProfileScreen}/>
  </Tab.Navigator>;
};

export const AppNavigator = () => {
  const { theme } = useAppTheme(); const { session, loading } = useAuth(); const base = theme.dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: theme.background, card: theme.surface, text: theme.text, border: theme.border, primary: theme.accent } };
  if (loading) return <SplashScreen/>;
  return <NavigationContainer theme={navTheme}>{session ? <Stack.Navigator key="app" screenOptions={{ headerShown: false, animation: 'slide_from_right' }} initialRouteName="Main">
    <Stack.Screen name="Main" component={MainTabs}/><Stack.Screen name="MySubscription" component={SubscriptionScreen}/><Stack.Screen name="Plans" component={PlansScreen}/><Stack.Screen name="Trainers" component={TrainersScreen}/><Stack.Screen name="CategoryVideos" component={CategoryVideosScreen}/><Stack.Screen name="CoachProfile" component={CoachProfileScreen}/><Stack.Screen name="PlanDetails" component={PlanDetailsScreen}/><Stack.Screen name="Checkout" component={CheckoutScreen}/><Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen}/><Stack.Screen name="PaymentFailed" component={PaymentFailedScreen}/><Stack.Screen name="VideoDetails" component={VideoDetailsScreen}/><Stack.Screen name="LockedContent" component={LockedContentScreen}/><Stack.Screen name="EditProfile" component={EditProfileScreen}/>
  </Stack.Navigator> : <Stack.Navigator key="auth" screenOptions={{ headerShown: false, animation: 'slide_from_right' }} initialRouteName="Welcome">
    <Stack.Screen name="Welcome" component={WelcomeScreen}/><Stack.Screen name="Login" component={LoginScreen}/><Stack.Screen name="Register" component={RegisterScreen}/><Stack.Screen name="VerifyEmailOtp" component={VerifyEmailOtpScreen}/>
  </Stack.Navigator>}</NavigationContainer>;
};
