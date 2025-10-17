import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import matchService from '../../services/matchService';

export const fetchMatches = createAsyncThunk(
  'match/fetchMatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await matchService.getMatches();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch matches');
    }
  }
);

export const unmatch = createAsyncThunk(
  'match/unmatch',
  async (matchId, { rejectWithValue }) => {
    try {
      await matchService.unmatch(matchId);
      return matchId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to unmatch');
    }
  }
);

const matchSlice = createSlice({
  name: 'match',
  initialState: {
    matches: [],
    loading: false,
    error: null,
  },
  reducers: {
    addMatch: (state, action) => {
      state.matches.unshift(action.payload);
    },
    updateMatchLastInteraction: (state, action) => {
      const match = state.matches.find(m => m.match_id === action.payload.matchId);
      if (match) {
        match.last_interaction = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(unmatch.fulfilled, (state, action) => {
        state.matches = state.matches.filter(m => m.match_id !== action.payload);
      });
  },
});

export const { addMatch, updateMatchLastInteraction } = matchSlice.actions;
export default matchSlice.reducer;
