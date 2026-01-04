import api from './api';

export interface Match {
  match_id: string;
  id: string;
  name: string;
  bio?: string;
  profile_photo?: string;
  user_type: string;
  is_guide: boolean;
  has_car: boolean;
  has_motorcycle: boolean;
  matched_at: string;
  last_interaction: string;
  last_active?: string;
  unread_count: number;
}

export interface MatchStats {
  totalMatches: number;
  activeChats: number;
}

export const matchService = {
  async getMatches(options: { limit?: number; sortBy?: string } = {}): Promise<Match[]> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const response = await api.get<{ success: boolean; data: Match[] }>(
      `/matches?${params.toString()}`
    );
    return response.data.data;
  },

  async getMatchById(matchId: string): Promise<Match> {
    const response = await api.get<{ success: boolean; data: Match }>(`/matches/${matchId}`);
    return response.data.data;
  },

  async unmatch(matchId: string): Promise<void> {
    await api.delete(`/matches/${matchId}`);
  },

  async getMatchStats(): Promise<MatchStats> {
    const response = await api.get<{ success: boolean; data: MatchStats }>('/matches/stats');
    return response.data.data;
  },
};
