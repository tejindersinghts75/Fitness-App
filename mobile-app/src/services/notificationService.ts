import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const channelId = 'fitora-updates';
const coachReminderStorageKey = 'fitora-coach-call-reminders';

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ||
  Constants.easConfig?.projectId;

const platformName = () => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'web') return 'web';
  return 'unknown';
};

export type NotificationPermissionResult = {
  granted: boolean;
  token: string | null;
  reason?: string;
};

export const notificationService = {
  async prepareAndroidChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Fitora updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F36B21',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  },

  async registerForPushNotifications(userId: string): Promise<NotificationPermissionResult> {
    if (!Device.isDevice) {
      return { granted: false, token: null, reason: 'Push notifications require a physical device.' };
    }

    await this.prepareAndroidChannel();

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      status = requested.status;
    }

    if (status !== 'granted') {
      return { granted: false, token: null, reason: 'Notification permission was not granted.' };
    }

    const projectId = getProjectId();
    if (!projectId) {
      return { granted: false, token: null, reason: 'EAS project id is missing.' };
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const now = new Date().toISOString();

    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: token,
        device_id: Constants.sessionId || null,
        platform: platformName(),
        app_version: Constants.expoConfig?.version || null,
        enabled: true,
        last_registered_at: now,
        updated_at: now,
      },
      { onConflict: 'expo_push_token' },
    );

    if (error) throw error;
    return { granted: true, token };
  },

  async disableCurrentDeviceToken(token: string) {
    await supabase
      .from('push_tokens')
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq('expo_push_token', token);
  },

  async scheduleLocalReminder(input: {
    title: string;
    body: string;
    date: Date;
    data?: Record<string, unknown>;
  }) {
    await this.prepareAndroidChannel();
    return Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        data: input.data,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: input.date,
        channelId,
      },
    });
  },

  async scheduleCoachCallReminder(input: {
    coachName: string;
    startsAt: string;
    minutesBefore?: number;
    callId?: string;
  }) {
    const minutesBefore = input.minutesBefore ?? 30;
    const reminderAt = new Date(new Date(input.startsAt).getTime() - minutesBefore * 60 * 1000);
    if (reminderAt.getTime() <= Date.now()) return null;
    return this.scheduleLocalReminder({
      title: 'Coach call coming up',
      body: `Your call with Coach ${input.coachName} starts in ${minutesBefore} minutes.`,
      date: reminderAt,
      data: { type: 'coach_call', callId: input.callId },
    });
  },

  async syncCoachCallReminders(calls: Array<{
    id: string;
    coachName: string;
    startsAt: string;
    status: string;
  }>) {
    const raw = await AsyncStorage.getItem(coachReminderStorageKey);
    const existing = raw ? JSON.parse(raw) as Record<string, string> : {};
    const next: Record<string, string> = {};
    const upcoming = calls.filter((call) =>
      call.status === 'scheduled' &&
      new Date(call.startsAt).getTime() > Date.now() + 5 * 60 * 1000,
    );

    for (const call of upcoming) {
      if (existing[call.id]) {
        next[call.id] = existing[call.id];
        continue;
      }
      const identifier = await this.scheduleCoachCallReminder({
        callId: call.id,
        coachName: call.coachName,
        startsAt: call.startsAt,
      });
      if (identifier) next[call.id] = identifier;
    }

    const staleIdentifiers = Object.entries(existing)
      .filter(([callId]) => !next[callId])
      .map(([, identifier]) => identifier);
    await Promise.all(
      staleIdentifiers.map((identifier) =>
        Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
      ),
    );
    await AsyncStorage.setItem(coachReminderStorageKey, JSON.stringify(next));
  },
};
