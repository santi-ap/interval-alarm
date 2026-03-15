import type { Alarm } from '../types';

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const WORKDAYS = [1, 2, 3, 4, 5];
export const WEEKENDS = [0, 6];

export const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Minutes-since-midnight → "h:mm AM/PM" */
export function formatTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

/** Returns every minute-offset that should fire for the given alarm. */
export function getAlarmTimeslots(alarm: Pick<Alarm, 'startMinutes' | 'endMinutes' | 'intervalMinutes'>): number[] {
  const slots: number[] = [];
  let current = alarm.startMinutes;
  while (current <= alarm.endMinutes) {
    slots.push(current);
    current += alarm.intervalMinutes;
  }
  return slots;
}

/** Our day index (0=Sun … 6=Sat) → expo-notifications weekday (1=Sun … 7=Sat) */
export function dayToWeekday(day: number): number {
  return day + 1;
}

/** Human-readable summary of selected days, e.g. "Workdays", "Mo, We, Fr" */
export function formatDays(days: number[]): string {
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && WORKDAYS.every((d) => days.includes(d)) && !days.includes(0) && !days.includes(6))
    return 'Workdays';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(', ');
}
