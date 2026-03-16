import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Alarm } from '../types';
import { ALL_DAYS, IOS_NOTIFICATION_LIMIT, dayToWeekday, formatTime, getAlarmTimeslots, getSameDayUpcomingSlots } from './alarmUtils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export { formatTime };

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('interval-alarms', {
      name: 'Interval Alarms',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAlarmNotifications(alarm: Alarm): Promise<string[]> {
  await cancelAlarmNotifications(alarm);

  if (!alarm.active) return [];

  const { label } = alarm;
  const days = alarm.days ?? ALL_DAYS;
  const allDays = days.length === ALL_DAYS.length;
  const slots = getAlarmTimeslots(alarm);
  const notificationIds: string[] = [];
  let scheduled = 0;

  // For weekday-specific alarms, CALENDAR weekday triggers may skip the current day.
  // Schedule one-time DATE triggers for any slots still upcoming today.
  if (!allDays) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayDayIndex = now.getDay();
    const sameDaySlots = getSameDayUpcomingSlots(alarm, currentMinutes, todayDayIndex);
    for (const slot of sameDaySlots) {
      if (scheduled >= IOS_NOTIFICATION_LIMIT) break;
      const hour = Math.floor(slot / 60);
      const minute = slot % 60;
      const triggerDate = new Date();
      triggerDate.setHours(hour, minute, 0, 0);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: label || 'Interval Alarm',
          body: formatTime(slot),
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          ...(Platform.OS === 'android' && { channelId: 'interval-alarms' }),
        },
      });
      notificationIds.push(id);
      scheduled++;
    }
  }

  for (const slot of slots) {
    const hour = Math.floor(slot / 60);
    const minute = slot % 60;

    if (allDays) {
      // Daily repeat — one notification per slot, no weekday needed
      if (scheduled >= IOS_NOTIFICATION_LIMIT) break;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: label || 'Interval Alarm',
          body: formatTime(slot),
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
          ...(Platform.OS === 'android' && { channelId: 'interval-alarms' }),
        },
      });
      notificationIds.push(id);
      scheduled++;
    } else {
      for (const day of days) {
        if (scheduled >= IOS_NOTIFICATION_LIMIT) break;
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: label || 'Interval Alarm',
            body: formatTime(slot),
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday: dayToWeekday(day),
            hour,
            minute,
            repeats: true,
            ...(Platform.OS === 'android' && { channelId: 'interval-alarms' }),
          },
        });
        notificationIds.push(id);
        scheduled++;
      }
      if (scheduled >= IOS_NOTIFICATION_LIMIT) break;
    }
  }

  return notificationIds;
}

export async function cancelAlarmNotifications(alarm: Alarm): Promise<void> {
  if (!alarm.notificationIds?.length) return;
  for (const id of alarm.notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  }
}
