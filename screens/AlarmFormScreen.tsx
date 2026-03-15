import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { loadAlarms, saveAlarms } from '../utils/storage';
import { scheduleAlarmNotifications, formatTime } from '../utils/notifications';
import {
  ALL_DAYS,
  WORKDAYS,
  WEEKENDS,
  DAY_LABELS,
  IOS_NOTIFICATION_LIMIT,
  countNotifications,
} from '../utils/alarmUtils';
import type { Alarm, AlarmFormScreenProps } from '../types';

const INTERVAL_OPTIONS: number[] = [5, 10, 15, 20, 30, 45, 60, 90, 120];

function minutesToDate(totalMinutes: number): Date {
  const d = new Date();
  d.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return d;
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function areDaysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
}

export default function AlarmFormScreen({ route, navigation }: AlarmFormScreenProps) {
  const existing = route.params?.alarm;

  const [label, setLabel] = useState(existing?.label ?? '');
  const [startMinutes, setStartMinutes] = useState(existing?.startMinutes ?? 9 * 60);
  const [endMinutes, setEndMinutes] = useState(existing?.endMinutes ?? 18 * 60);
  const [intervalMinutes, setIntervalMinutes] = useState(existing?.intervalMinutes ?? 60);
  const [days, setDays] = useState<number[]>(existing?.days ?? ALL_DAYS);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [saving, setSaving] = useState(false);

  const alertCount = countNotifications({ startMinutes, endMinutes, intervalMinutes, days });
  const overLimit = alertCount > IOS_NOTIFICATION_LIMIT;

  function toggleDay(day: number) {
    setDays((prev) =>
      prev.includes(day)
        ? prev.length > 1 ? prev.filter((d) => d !== day) : prev // keep at least one day
        : [...prev, day]
    );
  }

  async function save() {
    if (startMinutes >= endMinutes) {
      Alert.alert('Invalid times', 'End time must be after start time.');
      return;
    }

    setSaving(true);
    try {
      const alarms = await loadAlarms();
      const alarm: Alarm = {
        id: existing?.id ?? Date.now().toString(),
        label: label.trim(),
        startMinutes,
        endMinutes,
        intervalMinutes,
        days,
        active: existing?.active ?? true,
        notificationIds: existing?.notificationIds ?? [],
      };

      const ids = await scheduleAlarmNotifications(alarm);
      alarm.notificationIds = ids;

      const next = existing
        ? alarms.map((a) => (a.id === alarm.id ? alarm : a))
        : [...alarms, alarm];

      await saveAlarms(next);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save alarm. Make sure notifications are enabled.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LABEL</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Hydration reminder"
          placeholderTextColor="#bbb"
          value={label}
          onChangeText={setLabel}
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TIME RANGE</Text>
        <View style={styles.timeRow}>
          <Pressable style={styles.timePill} onPress={() => setShowStart(true)}>
            <Text style={styles.timeLabel}>From</Text>
            <Text style={styles.timeValue}>{formatTime(startMinutes)}</Text>
          </Pressable>
          <Text style={styles.timeDash}>→</Text>
          <Pressable style={styles.timePill} onPress={() => setShowEnd(true)}>
            <Text style={styles.timeLabel}>To</Text>
            <Text style={styles.timeValue}>{formatTime(endMinutes)}</Text>
          </Pressable>
        </View>
      </View>

      {showStart && (
        <View style={styles.pickerContainer}>
          {Platform.OS === 'ios' && (
            <Pressable style={styles.pickerDoneBtn} onPress={() => setShowStart(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          )}
          <DateTimePicker
            value={minutesToDate(startMinutes)}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_: DateTimePickerEvent, date?: Date) => {
              setShowStart(Platform.OS === 'ios');
              if (date) setStartMinutes(dateToMinutes(date));
            }}
          />
        </View>
      )}

      {showEnd && (
        <View style={styles.pickerContainer}>
          {Platform.OS === 'ios' && (
            <Pressable style={styles.pickerDoneBtn} onPress={() => setShowEnd(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          )}
          <DateTimePicker
            value={minutesToDate(endMinutes)}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_: DateTimePickerEvent, date?: Date) => {
              setShowEnd(Platform.OS === 'ios');
              if (date) setEndMinutes(dateToMinutes(date));
            }}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>REPEAT EVERY</Text>
        <View style={styles.intervalGrid}>
          {INTERVAL_OPTIONS.map((min) => (
            <Pressable
              key={min}
              style={[
                styles.intervalChip,
                intervalMinutes === min && styles.intervalChipActive,
              ]}
              onPress={() => setIntervalMinutes(min)}
            >
              <Text
                style={[
                  styles.intervalChipText,
                  intervalMinutes === min && styles.intervalChipTextActive,
                ]}
              >
                {min < 60
                  ? `${min}m`
                  : min === 60
                  ? '1h'
                  : min === 90
                  ? '1.5h'
                  : `${min / 60}h`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>REPEAT ON</Text>
        <View style={styles.dayRow}>
          {DAY_LABELS.map((label, index) => (
            <Pressable
              key={index}
              style={[styles.dayChip, days.includes(index) && styles.dayChipActive]}
              onPress={() => toggleDay(index)}
            >
              <Text style={[styles.dayChipText, days.includes(index) && styles.dayChipTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.presetRow}>
          {[
            { label: 'All week', value: ALL_DAYS },
            { label: 'Workdays', value: WORKDAYS },
            { label: 'Weekends', value: WEEKENDS },
          ].map((preset) => (
            <Pressable
              key={preset.label}
              style={[
                styles.presetChip,
                areDaysEqual(days, preset.value) && styles.presetChipActive,
              ]}
              onPress={() => setDays(preset.value)}
            >
              <Text
                style={[
                  styles.presetChipText,
                  areDaysEqual(days, preset.value) && styles.presetChipTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.previewBox, overLimit && styles.previewBoxWarning]}>
        <Text style={[styles.previewTitle, overLimit && styles.previewTitleWarning]}>
          {alertCount} alert{alertCount !== 1 ? 's' : ''} per day
        </Text>
        <Text style={styles.previewSub}>
          {formatTime(startMinutes)} · every {intervalMinutes} min · until{' '}
          {formatTime(endMinutes)}
        </Text>
        {overLimit && (
          <Text style={styles.previewWarning}>
            ⚠️ Exceeds iOS limit of {IOS_NOTIFICATION_LIMIT}. Only the first {IOS_NOTIFICATION_LIMIT} alerts will fire. Use a longer interval or shorter range.
          </Text>
        )}
      </View>

      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={save}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Alarm'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, gap: 24 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a2e',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timePill: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerDoneBtn: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  pickerDoneText: { fontSize: 16, fontWeight: '600', color: '#4A90E2' },
  timeLabel: { fontSize: 11, color: '#999', fontWeight: '600', marginBottom: 4 },
  timeValue: { fontSize: 22, fontWeight: '700', color: '#4A90E2' },
  timeDash: { fontSize: 18, color: '#bbb' },
  intervalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  intervalChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  intervalChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  intervalChipText: { fontSize: 14, fontWeight: '600', color: '#555' },
  intervalChipTextActive: { color: '#fff' },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  dayChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  dayChipText: { fontSize: 12, fontWeight: '700', color: '#888' },
  dayChipTextActive: { color: '#fff' },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  presetChipActive: {
    backgroundColor: '#EBF3FD',
    borderColor: '#4A90E2',
  },
  presetChipText: { fontSize: 13, fontWeight: '600', color: '#888' },
  presetChipTextActive: { color: '#4A90E2' },
  previewBox: {
    backgroundColor: '#EBF3FD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  previewBoxWarning: { backgroundColor: '#FFF4E5' },
  previewTitle: { fontSize: 18, fontWeight: '700', color: '#4A90E2' },
  previewTitleWarning: { color: '#E07800' },
  previewSub: { fontSize: 13, color: '#666' },
  previewWarning: { fontSize: 12, color: '#E07800', textAlign: 'center', marginTop: 4 },
  saveBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 20,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
