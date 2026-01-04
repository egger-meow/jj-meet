import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { matchService, Match } from '../../services/matchService';

interface MatchesState {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  totalMatches: number;
  activeChats: number;
}

const initialState: MatchesState = {
  matches: [],
  isLoading: false,
  error: null,
  totalMatches: 0,
  activeChats: 0,
};

export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async (options: { limit?: number; sortBy?: string } = {}, { rejectWithValue }) => {
    try {
      const matches = await matchService.getMatches(options);
      return matches;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch matches');
    }
  }
);

export const fetchMatchStats = createAsyncThunk(
  'matches/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await matchService.getMatchStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch stats');
    }
  }
);

export const unmatch = createAsyncThunk(
  'matches/unmatch',
  async (matchId: string, { rejectWithValue }) => {
    try {
      await matchService.unmatch(matchId);
      return matchId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to unmatch');
    }
  }
);

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    addMatch: (state, action: PayloadAction<Match>) => {
      state.matches.unshift(action.payload);
      state.totalMatches += 1;
    },
    updateMatchUnreadCount: (state, action: PayloadAction<{ matchId: string; count: number }>) => {
      const match = state.matches.find((m) => m.match_id === action.payload.matchId);
      if (match) {
        match.unread_count = action.payload.count;
      }
    },
    clearMatches: (state) => {
      state.matches = [];
      state.totalMatches = 0;
      state.activeChats = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matches = action.payload;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMatchStats.fulfilled, (state, action) => {
        state.totalMatches = action.payload.totalMatches;
        state.activeChats = action.payload.activeChats;
      })
      .addCase(unmatch.fulfilled, (state, action) => {
        state.matches = state.matches.filter((m) => m.match_id !== action.payload);
        state.totalMatches -= 1;
      });
  },
});

export const { addMatch, updateMatchUnreadCount, clearMatches } = matchesSlice.actions;
export default matchesSlice.reducer;
