import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Alarm } from '../types';

const ALARMS_KEY = 'interval_alarms';

export async function loadAlarms(): Promise<Alarm[]> {
  try {
    const data = await AsyncStorage.getItem(ALARMS_KEY);
    return data ? (JSON.parse(data) as Alarm[]) : [];
  } catch {
    return [];
  }
}

export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
}
