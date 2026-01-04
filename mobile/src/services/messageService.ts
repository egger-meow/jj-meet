import api from './api';

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  is_read: boolean;
  created_at: string;
}

export interface SendMessageData {
  content?: string;
  attachment_url?: string;
  attachment_type?: string;
}

export const messageService = {
  async getMessages(
    matchId: string,
    options: { limit?: number; before?: string; after?: string } = {}
  ): Promise<Message[]> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.before) params.append('before', options.before);
    if (options.after) params.append('after', options.after);

    const response = await api.get<{ success: boolean; data: Message[] }>(
      `/messages/${matchId}?${params.toString()}`
    );
    return response.data.data;
  },

  async sendMessage(matchId: string, data: SendMessageData): Promise<Message> {
    const response = await api.post<{ success: boolean; data: Message }>(
      `/messages/${matchId}`,
      data
    );
    return response.data.data;
  },

  async markAsRead(matchId: string): Promise<void> {
    await api.post(`/messages/${matchId}/read`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ success: boolean; data: { unreadCount: number } }>(
      '/messages/unread'
    );
    return response.data.data.unreadCount;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  },
};
