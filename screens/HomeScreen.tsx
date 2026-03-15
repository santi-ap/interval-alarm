import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadAlarms, saveAlarms } from '../utils/storage';
import {
  scheduleAlarmNotifications,
  cancelAlarmNotifications,
  formatTime,
} from '../utils/notifications';
import { formatDays } from '../utils/alarmUtils';
import type { Alarm, HomeScreenProps } from '../types';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAlarms().then(setAlarms);
    }, [])
  );

  async function toggleAlarm(alarm: Alarm) {
    const updated: Alarm = { ...alarm, active: !alarm.active };
    const ids = await scheduleAlarmNotifications(updated);
    updated.notificationIds = ids;

    const next = alarms.map((a) => (a.id === alarm.id ? updated : a));
    setAlarms(next);
    await saveAlarms(next);
  }

  async function deleteAlarm(alarm: Alarm) {
    Alert.alert('Delete Alarm', `Delete "${alarm.label || 'Alarm'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelAlarmNotifications(alarm);
          const next = alarms.filter((a) => a.id !== alarm.id);
          setAlarms(next);
          await saveAlarms(next);
        },
      },
    ]);
  }

  function renderAlarm({ item }: { item: Alarm }) {
    const times: string[] = [];
    let current = item.startMinutes;
    while (current <= item.endMinutes) {
      times.push(formatTime(current));
      current += item.intervalMinutes;
    }

    return (
      <View style={styles.card}>
        <Pressable
          style={styles.cardContent}
          onPress={() => navigation.navigate('AlarmForm', { alarm: item })}
        >
          <Text style={styles.label}>{item.label || 'Alarm'}</Text>
          <Text style={styles.range}>
            {formatTime(item.startMinutes)} – {formatTime(item.endMinutes)}
          </Text>
          <Text style={styles.interval}>
            Every {item.intervalMinutes} min · {times.length} alert
            {times.length !== 1 ? 's' : ''} per day
          </Text>
          <Text style={styles.days}>{formatDays(item.days ?? [0, 1, 2, 3, 4, 5, 6])}</Text>
        </Pressable>
        <View style={styles.cardActions}>
          <Switch
            value={item.active}
            onValueChange={() => toggleAlarm(item)}
            trackColor={{ false: '#ccc', true: '#4A90E2' }}
            thumbColor="#fff"
          />
          <Pressable onPress={() => deleteAlarm(item)} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>✕</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {alarms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⏰</Text>
          <Text style={styles.emptyText}>No alarms yet</Text>
          <Text style={styles.emptyHint}>Tap + to create your first interval alarm</Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={renderAlarm}
          contentContainerStyle={styles.list}
        />
      )}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AlarmForm', { alarm: null })}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardContent: { flex: 1 },
  label: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  range: { fontSize: 14, color: '#4A90E2', fontWeight: '500', marginBottom: 2 },
  interval: { fontSize: 13, color: '#888' },
  days: { fontSize: 12, color: '#aaa', marginTop: 2 },
  cardActions: { alignItems: 'center', gap: 10 },
  deleteBtn: { padding: 6 },
  deleteText: { fontSize: 16, color: '#ccc' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#1a1a2e' },
  emptyHint: { fontSize: 14, color: '#999', textAlign: 'center', paddingHorizontal: 40 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36, marginTop: -2 },
});
