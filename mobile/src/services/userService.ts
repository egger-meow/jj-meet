import api from './api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio?: string;
  profile_photo?: string;
  photos?: string[];
  birth_date?: string;
  gender?: string;
  user_type: string;
  is_guide: boolean;
  has_car: boolean;
  has_motorcycle: boolean;
  languages?: string[];
  interests?: string[];
  is_active: boolean;
  last_active?: string;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
}

export interface ProfileCompleteness {
  percentage: number;
  missingRequired: string[];
  missingOptional: string[];
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<{ success: boolean; data: UserProfile }>('/auth/profile');
    return response.data.data;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.patch<{ success: boolean; data: UserProfile }>(
      '/auth/profile',
      updates
    );
    return response.data.data;
  },

  async getUserById(userId: string): Promise<UserProfile> {
    const response = await api.get<{ success: boolean; data: UserProfile }>(
      `/users/${userId}`
    );
    return response.data.data;
  },

  async updateLocation(location: LocationUpdate): Promise<void> {
    await api.post('/users/location', location);
  },

  async setGuideMode(isGuide: boolean, guideDetails?: object): Promise<UserProfile> {
    const response = await api.post<{ success: boolean; data: UserProfile }>(
      '/users/guide-mode',
      { isGuide, ...guideDetails }
    );
    return response.data.data;
  },

  async getProfileCompleteness(): Promise<ProfileCompleteness> {
    const response = await api.get<{ success: boolean; data: ProfileCompleteness }>(
      '/users/profile-completeness'
    );
    return response.data.data;
  },

  async getNearbyUsers(options: {
    maxDistance?: number;
    userType?: string;
    isGuide?: boolean;
  } = {}): Promise<UserProfile[]> {
    const params = new URLSearchParams();
    if (options.maxDistance) params.append('maxDistance', options.maxDistance.toString());
    if (options.userType) params.append('userType', options.userType);
    if (options.isGuide !== undefined) params.append('isGuide', options.isGuide.toString());

    const response = await api.get<{ success: boolean; data: UserProfile[] }>(
      `/users/nearby?${params.toString()}`
    );
    return response.data.data;
  },

  async deactivateAccount(): Promise<void> {
    await api.post('/users/deactivate');
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/users/account');
  },

  async blockUser(userId: string, reason?: string): Promise<void> {
    await api.post(`/users/${userId}/block`, { reason });
  },

  async unblockUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}/block`);
  },

  async reportUser(userId: string, reason: string, details?: string): Promise<void> {
    await api.post(`/users/${userId}/report`, { reason, details });
  },

  async getBlockedUsers(): Promise<UserProfile[]> {
    const response = await api.get<{ success: boolean; data: UserProfile[] }>(
      '/users/blocked'
    );
    return response.data.data;
  },
};
