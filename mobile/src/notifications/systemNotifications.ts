import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up foreground notification presentation
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  });
} catch {
  // Graceful fallback in unsupported testing environments
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MediBook Clinical & Visit Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        sound: 'default'
      });
    }

    return finalStatus === 'granted';
  } catch (err) {
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleSystemNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH
      },
      trigger: null // Deliver immediately to Android status bar & notification shade
    });
  } catch {
    // If notification service is unavailable, fail silently without disrupting UI
  }
}
