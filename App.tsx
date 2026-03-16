import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import AlarmFormScreen from './screens/AlarmFormScreen';
import { requestPermissions } from './utils/notifications';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  }, []);

  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
