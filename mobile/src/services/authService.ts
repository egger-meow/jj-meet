import api from './api';
import { tokenStorage } from './tokenStorage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  birth_date: string;
  gender?: string;
  user_type?: string;
  social_link?: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  profile_photo?: string;
  user_type: string;
  is_guide: boolean;
  has_car: boolean;
  has_motorcycle: boolean;
}

const getDeviceInfo = async () => {
  const deviceId = await tokenStorage.getDeviceId();
  return {
    deviceId,
    deviceName: Device.deviceName || `${Platform.OS} Device`,
    platform: Platform.OS,
  };
};

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const deviceInfo = await getDeviceInfo();
    const response = await api.post<AuthResponse>('/auth/register', {
      ...data,
      deviceInfo,
    });

    if (response.data.success) {
      await tokenStorage.setAccessToken(response.data.data.accessToken);
      await tokenStorage.setRefreshToken(response.data.data.refreshToken);
    }

    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const deviceInfo = await getDeviceInfo();
    const response = await api.post<AuthResponse>('/auth/login', {
      ...data,
      ...deviceInfo,
    });

    if (response.data.success) {
      await tokenStorage.setAccessToken(response.data.data.accessToken);
      await tokenStorage.setRefreshToken(response.data.data.refreshToken);
    }

    return response.data;
  },

  async logout(): Promise<void> {
    try {
      const deviceId = await tokenStorage.getDeviceId();
      await api.post('/auth/logout', { deviceId });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await tokenStorage.clearAll();
    }
  },

  async getProfile(): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>('/auth/profile');
    return response.data.data;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await api.patch<{ success: boolean; data: User }>('/auth/profile', updates);
    return response.data.data;
  },

  async checkAuth(): Promise<boolean> {
    try {
      const hasTokens = await tokenStorage.hasTokens();
      if (!hasTokens) return false;

      await this.getProfile();
      return true;
    } catch {
      return false;
    }
  },
};
