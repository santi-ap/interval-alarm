import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import type { AlarmRingingScreenProps } from '../types';
import { formatCurrentTime } from '../utils/clockUtils';

export default function AlarmRingingScreen({ navigation, route }: AlarmRingingScreenProps) {
  const { label } = route.params;
  const [currentTime, setCurrentTime] = useState(() => formatCurrentTime(new Date()));
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startAudio() {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/alarm.mp3'),
          { isLooping: true, shouldPlay: true }
        );
        if (mounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch {
        // Audio unavailable (e.g. simulator without audio) — proceed silently
      }
    }

    startAudio();

    const interval = setInterval(() => {
      setCurrentTime(formatCurrentTime(new Date()));
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    });
    return unsubscribe;
  }, [navigation]);

  async function handleDismiss() {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    navigation.navigate('Home');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.clock}>{currentTime}</Text>
      <Text style={styles.ringing}>Alarm Ringing</Text>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={handleDismiss} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  clock: {
    fontSize: 64,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  ringing: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4A90E2',
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  label: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
