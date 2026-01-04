import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'jjmeet_access_token',
  REFRESH_TOKEN: 'jjmeet_refresh_token',
  DEVICE_ID: 'jjmeet_device_id',
};

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const isSecureStoreAvailable = Platform.OS !== 'web';

const webStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  deleteItem: (key: string) => localStorage.removeItem(key),
};

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (isSecureStoreAvailable) {
      return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    }
    return webStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async setAccessToken(token: string): Promise<void> {
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
    } else {
      webStorage.setItem(KEYS.ACCESS_TOKEN, token);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (isSecureStoreAvailable) {
      return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    }
    return webStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
    } else {
      webStorage.setItem(KEYS.REFRESH_TOKEN, token);
    }
  },

  async getDeviceId(): Promise<string> {
    let deviceId: string | null;
    
    if (isSecureStoreAvailable) {
      deviceId = await SecureStore.getItemAsync(KEYS.DEVICE_ID);
    } else {
      deviceId = webStorage.getItem(KEYS.DEVICE_ID);
    }

    if (!deviceId) {
      deviceId = generateUUID();
      if (isSecureStoreAvailable) {
        await SecureStore.setItemAsync(KEYS.DEVICE_ID, deviceId);
      } else {
        webStorage.setItem(KEYS.DEVICE_ID, deviceId);
      }
    }

    return deviceId;
  },

  async clearAll(): Promise<void> {
    if (isSecureStoreAvailable) {
      await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    } else {
      webStorage.deleteItem(KEYS.ACCESS_TOKEN);
      webStorage.deleteItem(KEYS.REFRESH_TOKEN);
    }
  },

  async hasTokens(): Promise<boolean> {
    const refreshToken = await this.getRefreshToken();
    return !!refreshToken;
  },
};
