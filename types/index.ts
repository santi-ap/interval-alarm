import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface Alarm {
  id: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
  intervalMinutes: number;
  days: number[]; // 0=Sun, 1=Mon, …, 6=Sat
  active: boolean;
  notificationIds: string[];
}

export type RootStackParamList = {
  Home: undefined;
  AlarmForm: { alarm: Alarm | null };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type AlarmFormScreenProps = NativeStackScreenProps<RootStackParamList, 'AlarmForm'>;
