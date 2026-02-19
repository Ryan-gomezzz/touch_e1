import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android notification channel
async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('touch-reminders', {
      name: 'Touch Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100],
      lightColor: '#2D6A4F',
      description: 'Gentle reminders to stay connected with your people',
    });
    await Notifications.setNotificationChannelAsync('touch-weekly', {
      name: 'Weekly Reflections',
      importance: Notifications.AndroidImportance.LOW,
      description: 'Weekly summaries of your relationship health',
    });
  }
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;
  await setupNotificationChannel();
  return true;
}

// Schedule a gentle reminder for a contact
export async function scheduleContactReminder(
  contactName: string,
  contactId: string,
  delaySeconds: number = 5,
  message?: string,
) {
  const body = message || `It's been a while since you connected with ${contactName}. Maybe a quick message?`;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Touch — ${contactName}`,
      body,
      data: { contactId, type: 'reminder' },
      categoryIdentifier: 'touch-reminder',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      channelId: 'touch-reminders',
    },
  });
}

// Schedule daily check reminder
export async function scheduleDailyCheck() {
  await Notifications.cancelScheduledNotificationAsync('daily-check').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-check',
    content: {
      title: 'Touch — Daily Check',
      body: 'Take a moment to see who could use a little connection today.',
      data: { type: 'daily-check' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 86400, // 24 hours
      repeats: true,
      channelId: 'touch-reminders',
    },
  });
}

// Schedule weekly reflection
export async function scheduleWeeklyReflection() {
  await Notifications.cancelScheduledNotificationAsync('weekly-reflection').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'weekly-reflection',
    content: {
      title: 'Touch — Weekly Reflection',
      body: 'How are your connections this week? Take a quick look at your relationship health.',
      data: { type: 'weekly-reflection' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 604800, // 7 days
      repeats: true,
      channelId: 'touch-weekly',
    },
  });
}

// Schedule reminders for contacts that need attention
export async function scheduleRemindersForContacts(reminders: any[]) {
  // Cancel existing scheduled reminders first
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  // Schedule new ones staggered throughout the day
  for (let i = 0; i < Math.min(reminders.length, 5); i++) {
    const r = reminders[i];
    const delay = (i + 1) * 3600; // stagger by 1 hour each
    await scheduleContactReminder(
      r.contact_name,
      r.contact_id,
      delay,
      r.message,
    );
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get count of scheduled notifications
export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

// Listen for notification interactions
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// Get notification badge count
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
