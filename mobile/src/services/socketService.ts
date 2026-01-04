import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './tokenStorage';
import { store } from '../store';
import { addMessage } from '../store/slices/chatSlice';
import { addMatch, updateMatchUnreadCount } from '../store/slices/matchesSlice';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const token = await tokenStorage.getAccessToken();
    if (!token) {
      console.log('No token available for socket connection');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('new_message', (data) => {
      const { matchId, message } = data;
      store.dispatch(addMessage({ matchId, message }));
      
      const state = store.getState();
      if (state.chat.activeMatchId !== matchId) {
        const match = state.matches.matches.find(m => m.match_id === matchId);
        if (match) {
          store.dispatch(updateMatchUnreadCount({
            matchId,
            count: (match.unread_count || 0) + 1,
          }));
        }
      }
    });

    this.socket.on('new_match', (data) => {
      store.dispatch(addMatch(data.match));
    });

    this.socket.on('typing_start', (data) => {
      console.log(`User ${data.userId} is typing in match ${data.matchId}`);
    });

    this.socket.on('typing_stop', (data) => {
      console.log(`User ${data.userId} stopped typing in match ${data.matchId}`);
    });

    this.socket.on('user_online', (data) => {
      console.log(`User ${data.userId} is online`);
    });

    this.socket.on('user_offline', (data) => {
      console.log(`User ${data.userId} is offline`);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinMatch(matchId: string): void {
    this.socket?.emit('join_match', { matchId });
  }

  leaveMatch(matchId: string): void {
    this.socket?.emit('leave_match', { matchId });
  }

  sendMessage(matchId: string, content: string, attachments?: any[]): void {
    this.socket?.emit('send_message', {
      matchId,
      content,
      attachments,
    });
  }

  startTyping(matchId: string): void {
    this.socket?.emit('typing_start', { matchId });
  }

  stopTyping(matchId: string): void {
    this.socket?.emit('typing_stop', { matchId });
  }

  markAsRead(matchId: string): void {
    this.socket?.emit('mark_read', { matchId });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
