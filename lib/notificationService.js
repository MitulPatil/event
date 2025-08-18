import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    // Get the token that uniquely identifies this device
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

// Send local notification for new event
export async function sendLocalEventNotification(event) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `New Event: ${event.name}`,
      body: `${event.description} on ${event.date} at ${event.venue}`,
      data: { 
        eventId: event.$id,
        type: 'new_event'
      },
    },
    trigger: null, // Send immediately
  });
}

// Send local notification reminder
export async function scheduleEventReminder(event, reminderDate) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Event Reminder: ${event.name}`,
      body: `Don't forget! ${event.name} is tomorrow at ${event.venue}`,
      data: { 
        eventId: event.$id,
        type: 'event_reminder'
      },
    },
    trigger: {
      date: new Date(reminderDate),
    },
  });
}

// Cancel all notifications for a specific event
export async function cancelEventNotifications(eventId) {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.eventId === eventId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}
