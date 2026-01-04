import api from './api';

export interface SwipeUser {
  id: string;
  name: string;
  bio?: string;
  profile_photo?: string;
  photos?: string[];
  user_type: string;
  is_guide: boolean;
  has_car: boolean;
  has_motorcycle: boolean;
  distance?: number;
}

export interface SwipeResult {
  swipe: {
    id: string;
    swiper_id: string;
    swiped_id: string;
    direction: string;
  };
  match?: {
    id: string;
    user1_id: string;
    user2_id: string;
  };
  isMatch: boolean;
}

export interface DiscoveryOptions {
  maxDistance?: number;
  user_type?: string;
  is_guide?: boolean;
  gender?: string;
  has_car?: boolean;
  has_motorcycle?: boolean;
  limit?: number;
}

export const swipeService = {
  async getDiscoveryCandidates(options: DiscoveryOptions = {}): Promise<SwipeUser[]> {
    const params = new URLSearchParams();
    
    if (options.maxDistance) params.append('maxDistance', options.maxDistance.toString());
    if (options.user_type) params.append('user_type', options.user_type);
    if (options.is_guide !== undefined) params.append('is_guide', options.is_guide.toString());
    if (options.gender) params.append('gender', options.gender);
    if (options.has_car !== undefined) params.append('has_car', options.has_car.toString());
    if (options.has_motorcycle !== undefined) params.append('has_motorcycle', options.has_motorcycle.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<{ success: boolean; data: SwipeUser[] }>(
      `/users/discover?${params.toString()}`
    );
    return response.data.data;
  },

  async swipe(swipedId: string, direction: 'like' | 'pass' | 'super_like'): Promise<SwipeResult> {
    const response = await api.post<{ success: boolean; data: SwipeResult }>('/swipes', {
      swiped_id: swipedId,
      direction,
    });
    return response.data.data;
  },

  async getSwipeHistory(options: { limit?: number; direction?: string } = {}): Promise<any[]> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.direction) params.append('direction', options.direction);

    const response = await api.get<{ success: boolean; data: any[] }>(
      `/swipes/history?${params.toString()}`
    );
    return response.data.data;
  },

  async getLikesReceived(): Promise<SwipeUser[]> {
    const response = await api.get<{ success: boolean; data: SwipeUser[] }>('/swipes/likes');
    return response.data.data;
  },

  async undoLastSwipe(): Promise<void> {
    await api.post('/swipes/undo');
  },
};
