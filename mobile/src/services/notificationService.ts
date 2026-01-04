import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  type: 'new_match' | 'new_message' | 'like_received' | 'trip_match';
  matchId?: string;
  userId?: string;
  message?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications to get alerts about new matches and messages.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  }

  async registerForPushNotifications(): Promise<string | null> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return null;

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });

        await Notifications.setNotificationChannelAsync('matches', {
          name: 'Matches',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      await this.sendTokenToServer(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      await api.post('/users/push-token', { token, platform: Platform.OS });
    } catch (error) {
      console.error('Error sending push token to server:', error);
    }
  }

  async unregisterPushNotifications(): Promise<void> {
    try {
      if (this.expoPushToken) {
        await api.delete('/users/push-token', {
          data: { token: this.expoPushToken },
        });
      }
      this.expoPushToken = null;
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  }

  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  removeNotificationSubscription(subscription: Notifications.Subscription): void {
    subscription.remove();
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: PushNotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as unknown as Record<string, unknown>,
        sound: true,
      },
      trigger: trigger || null,
    });
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  async dismissAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
