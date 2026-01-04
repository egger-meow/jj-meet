import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { messageService, Message } from '../../services/messageService';

interface ChatState {
  messages: Record<string, Message[]>;
  activeMatchId: string | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  totalUnread: number;
}

const initialState: ChatState = {
  messages: {},
  activeMatchId: null,
  isLoading: false,
  isSending: false,
  error: null,
  totalUnread: 0,
};

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (
    { matchId, options }: { matchId: string; options?: { limit?: number; before?: string } },
    { rejectWithValue }
  ) => {
    try {
      const messages = await messageService.getMessages(matchId, options);
      return { matchId, messages };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { matchId, content }: { matchId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const message = await messageService.sendMessage(matchId, { content });
      return { matchId, message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to send message');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const count = await messageService.getUnreadCount();
      return count;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch unread count');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (matchId: string, { rejectWithValue }) => {
    try {
      await messageService.markAsRead(matchId);
      return matchId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to mark as read');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveMatch: (state, action: PayloadAction<string | null>) => {
      state.activeMatchId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ matchId: string; message: Message }>) => {
      const { matchId, message } = action.payload;
      if (!state.messages[matchId]) {
        state.messages[matchId] = [];
      }
      state.messages[matchId].push(message);
    },
    clearChat: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
    },
    clearAllChats: (state) => {
      state.messages = {};
      state.activeMatchId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages[action.payload.matchId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const { matchId, message } = action.payload;
        if (!state.messages[matchId]) {
          state.messages[matchId] = [];
        }
        state.messages[matchId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.totalUnread = action.payload;
      });
  },
});

export const { setActiveMatch, addMessage, clearChat, clearAllChats } = chatSlice.actions;
export default chatSlice.reducer;
