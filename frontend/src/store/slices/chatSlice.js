import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import messageService from '../../services/messageService';

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ matchId, limit = 50, offset = 0 }, { rejectWithValue }) => {
    try {
      const response = await messageService.getMessages(matchId, limit, offset);
      return { matchId, messages: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ matchId, content, attachment_url, attachment_type }, { rejectWithValue }) => {
    try {
      const response = await messageService.sendMessage(matchId, {
        content,
        attachment_url,
        attachment_type
      });
      return { matchId, message: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: {}, // { matchId: { messages: [], loading: false, hasMore: true } }
    activeChat: null,
    typingUsers: {},
    error: null,
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    addMessage: (state, action) => {
      const { matchId, message } = action.payload;
      if (!state.conversations[matchId]) {
        state.conversations[matchId] = { messages: [], loading: false, hasMore: true };
      }
      state.conversations[matchId].messages.push(message);
    },
    setTyping: (state, action) => {
      const { matchId, userId, isTyping } = action.payload;
      if (!state.typingUsers[matchId]) {
        state.typingUsers[matchId] = {};
      }
      if (isTyping) {
        state.typingUsers[matchId][userId] = true;
      } else {
        delete state.typingUsers[matchId][userId];
      }
    },
    markMessagesRead: (state, action) => {
      const { matchId } = action.payload;
      if (state.conversations[matchId]) {
        state.conversations[matchId].messages = state.conversations[matchId].messages.map(
          msg => ({ ...msg, is_read: true })
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const matchId = action.meta.arg.matchId;
        if (!state.conversations[matchId]) {
          state.conversations[matchId] = { messages: [], loading: true, hasMore: true };
        } else {
          state.conversations[matchId].loading = true;
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { matchId, messages } = action.payload;
        state.conversations[matchId] = {
          messages: messages,
          loading: false,
          hasMore: messages.length === 50
        };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { matchId, message } = action.payload;
        if (state.conversations[matchId]) {
          state.conversations[matchId].messages.push(message);
        }
      });
  },
});

export const { setActiveChat, addMessage, setTyping, markMessagesRead } = chatSlice.actions;
export default chatSlice.reducer;
