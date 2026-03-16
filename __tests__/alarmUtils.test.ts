import {
  formatTime,
  getAlarmTimeslots,
  dayToWeekday,
  formatDays,
  countNotifications,
  getSameDayUpcomingSlots,
  ALL_DAYS,
  WORKDAYS,
  WEEKENDS,
  IOS_NOTIFICATION_LIMIT,
} from '../utils/alarmUtils';

describe('formatTime', () => {
  it('formats midnight', () => {
    expect(formatTime(0)).toBe('12:00 AM');
  });

  it('formats noon', () => {
    expect(formatTime(720)).toBe('12:00 PM');
  });

  it('formats 9:00 AM', () => {
    expect(formatTime(540)).toBe('9:00 AM');
  });

  it('formats 1:30 PM', () => {
    expect(formatTime(810)).toBe('1:30 PM');
  });

  it('formats 11:59 PM', () => {
    expect(formatTime(1439)).toBe('11:59 PM');
  });

  it('pads minutes with leading zero', () => {
    expect(formatTime(601)).toBe('10:01 AM');
  });
});

describe('getAlarmTimeslots', () => {
  it('returns correct slots for 9:00–10:00 every 60 min', () => {
    expect(getAlarmTimeslots({ startMinutes: 540, endMinutes: 600, intervalMinutes: 60 }))
      .toEqual([540, 600]);
  });

  it('returns 10 slots for 9:00–18:00 every 60 min', () => {
    const slots = getAlarmTimeslots({ startMinutes: 540, endMinutes: 1080, intervalMinutes: 60 });
    expect(slots).toHaveLength(10);
    expect(slots[0]).toBe(540);
    expect(slots[9]).toBe(1080);
  });

  it('returns a single slot when start equals end', () => {
    expect(getAlarmTimeslots({ startMinutes: 540, endMinutes: 540, intervalMinutes: 30 }))
      .toEqual([540]);
  });

  it('returns correct slots for 30 min interval', () => {
    const slots = getAlarmTimeslots({ startMinutes: 0, endMinutes: 60, intervalMinutes: 30 });
    expect(slots).toEqual([0, 30, 60]);
  });
});

describe('dayToWeekday', () => {
  it('converts Sunday (0) to weekday 1', () => {
    expect(dayToWeekday(0)).toBe(1);
  });

  it('converts Saturday (6) to weekday 7', () => {
    expect(dayToWeekday(6)).toBe(7);
  });

  it('converts Monday (1) to weekday 2', () => {
    expect(dayToWeekday(1)).toBe(2);
  });
});

describe('countNotifications', () => {
  it('counts slots only when all 7 days selected (daily trigger)', () => {
    // 9:00–18:00 every 60 min = 10 slots, all days → 10 notifications (not 70)
    expect(countNotifications({ startMinutes: 540, endMinutes: 1080, intervalMinutes: 60, days: ALL_DAYS })).toBe(10);
  });

  it('counts slots × days when specific days selected', () => {
    // 9:00–10:00 every 60 min = 2 slots, 3 days → 6 notifications
    expect(countNotifications({ startMinutes: 540, endMinutes: 600, intervalMinutes: 60, days: [1, 2, 3] })).toBe(6);
  });

  it('exceeds iOS limit for 5-min interval over a full day', () => {
    // 9:00–18:00 every 5 min = 109 slots, all days → 109 > 64
    const count = countNotifications({ startMinutes: 540, endMinutes: 1080, intervalMinutes: 5, days: ALL_DAYS });
    expect(count).toBeGreaterThan(IOS_NOTIFICATION_LIMIT);
  });

  it('stays within iOS limit for 60-min interval all day', () => {
    const count = countNotifications({ startMinutes: 540, endMinutes: 1080, intervalMinutes: 60, days: ALL_DAYS });
    expect(count).toBeLessThanOrEqual(IOS_NOTIFICATION_LIMIT);
  });
});

describe('getSameDayUpcomingSlots', () => {
  const alarm = { startMinutes: 540, endMinutes: 660, intervalMinutes: 60, days: [1, 3, 5] }; // Mon/Wed/Fri, 9–11 AM

  it('returns upcoming slots when today is a selected day', () => {
    // 9:30 AM on Monday → 9:00 passed, 10:00 and 11:00 upcoming
    expect(getSameDayUpcomingSlots(alarm, 570, 1)).toEqual([600, 660]);
  });

  it('returns all slots when none have passed yet', () => {
    // 8:00 AM on Monday → all slots upcoming
    expect(getSameDayUpcomingSlots(alarm, 480, 1)).toEqual([540, 600, 660]);
  });

  it('returns empty when all slots have passed', () => {
    // 12:00 PM on Monday → all slots passed
    expect(getSameDayUpcomingSlots(alarm, 720, 1)).toEqual([]);
  });

  it('returns empty when today is not a selected day', () => {
    // Sunday (0) is not in [1, 3, 5]
    expect(getSameDayUpcomingSlots(alarm, 480, 0)).toEqual([]);
  });

  it('returns upcoming slots for an all-days alarm', () => {
    const allDaysAlarm = { startMinutes: 540, endMinutes: 660, intervalMinutes: 60, days: ALL_DAYS };
    expect(getSameDayUpcomingSlots(allDaysAlarm, 570, 2)).toEqual([600, 660]);
  });

  it('returns empty for all-days alarm when all slots have passed', () => {
    const allDaysAlarm = { startMinutes: 540, endMinutes: 660, intervalMinutes: 60, days: ALL_DAYS };
    expect(getSameDayUpcomingSlots(allDaysAlarm, 720, 2)).toEqual([]);
  });
});

describe('formatDays', () => {
  it('returns "Every day" for all 7 days', () => {
    expect(formatDays(ALL_DAYS)).toBe('Every day');
  });

  it('returns "Workdays" for Mon–Fri', () => {
    expect(formatDays(WORKDAYS)).toBe('Workdays');
  });

  it('returns "Weekends" for Sat–Sun', () => {
    expect(formatDays(WEEKENDS)).toBe('Weekends');
  });

  it('returns abbreviated day labels for a custom selection', () => {
    expect(formatDays([1, 3, 5])).toBe('Mo, We, Fr');
  });

  it('sorts days before formatting', () => {
    expect(formatDays([5, 1, 3])).toBe('Mo, We, Fr');
  });
});
