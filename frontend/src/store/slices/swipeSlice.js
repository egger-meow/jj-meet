import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import swipeService from '../../services/swipeService';

export const swipeUser = createAsyncThunk(
  'swipe/swipeUser',
  async ({ userId, direction }, { rejectWithValue }) => {
    try {
      const response = await swipeService.swipe(userId, direction);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Swipe failed');
    }
  }
);

export const fetchSwipeHistory = createAsyncThunk(
  'swipe/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await swipeService.getHistory();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch history');
    }
  }
);

export const fetchLikes = createAsyncThunk(
  'swipe/fetchLikes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await swipeService.getLikes();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch likes');
    }
  }
);

const swipeSlice = createSlice({
  name: 'swipe',
  initialState: {
    history: [],
    likes: [],
    lastSwipe: null,
    isMatch: false,
    matchedUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearMatch: (state) => {
      state.isMatch = false;
      state.matchedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(swipeUser.fulfilled, (state, action) => {
        state.lastSwipe = action.payload.swipe;
        state.isMatch = action.payload.isMatch;
        if (action.payload.isMatch) {
          state.matchedUser = action.payload.match;
        }
      })
      .addCase(fetchSwipeHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(fetchLikes.fulfilled, (state, action) => {
        state.likes = action.payload;
      });
  },
});

export const { clearMatch } = swipeSlice.actions;
export default swipeSlice.reducer;
