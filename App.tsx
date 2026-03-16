import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import HomeScreen from './screens/HomeScreen';
import AlarmFormScreen from './screens/AlarmFormScreen';
import AlarmRingingScreen from './screens/AlarmRingingScreen';
import { requestPermissions } from './utils/notifications';
import { navigationRef } from './utils/navigationRef';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function navigateToAlarmRinging(label: string) {
  if (!navigationRef.isReady()) return;
  if (navigationRef.getCurrentRoute()?.name === 'AlarmRinging') return;
  navigationRef.navigate('AlarmRinging', { label });
}

export default function App() {
  useEffect(() => {
    requestPermissions().then((granted) => {
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in Settings to receive alarm alerts.'
        );
      }
    });

    // Foreground: notification received while app is open
    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const label = notification.request.content.title ?? 'Alarm';
      navigateToAlarmRinging(label);
    });

    // Background tap: user taps notification to open app
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const label = response.notification.request.content.title ?? 'Alarm';
      navigateToAlarmRinging(label);
    });

    // Killed state: app was launched by tapping notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const label = response.notification.request.content.title ?? 'Alarm';
      navigateToAlarmRinging(label);
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1a1a2e',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#F5F7FA' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Interval Alarms' }}
        />
        <Stack.Screen
          name="AlarmForm"
          component={AlarmFormScreen}
          options={({ route }) => ({
            title: route.params?.alarm ? 'Edit Alarm' : 'New Alarm',
          })}
        />
        <Stack.Screen
          name="AlarmRinging"
          component={AlarmRingingScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
