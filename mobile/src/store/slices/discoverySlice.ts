import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { swipeService } from '../../services';

interface DiscoveryUser {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  profile_photo?: string;
  photos?: { url: string }[];
  distance?: number;
  user_type?: string;
  is_guide?: boolean;
  has_car?: boolean;
  has_motorcycle?: boolean;
  is_verified?: boolean;
}

interface DiscoveryState {
  candidates: DiscoveryUser[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  lastSwipedUser: DiscoveryUser | null;
  filters: {
    maxDistance: number;
    userType: string | null;
    isGuide: boolean | null;
  };
}

const initialState: DiscoveryState = {
  candidates: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  lastSwipedUser: null,
  filters: {
    maxDistance: 50,
    userType: null,
    isGuide: null,
  },
};

export const fetchDiscoveryCandidates = createAsyncThunk(
  'discovery/fetchCandidates',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { discovery: DiscoveryState };
      const { filters } = state.discovery;
      
      const response = await swipeService.getDiscoveryCandidates({
        maxDistance: filters.maxDistance,
        userType: filters.userType,
        isGuide: filters.isGuide,
      });
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch candidates');
    }
  }
);

export const swipeOnUser = createAsyncThunk(
  'discovery/swipe',
  async ({ userId, direction }: { userId: string; direction: 'like' | 'pass' | 'super_like' }, { rejectWithValue }) => {
    try {
      const response = await swipeService.createSwipe(userId, direction);
      return { userId, direction, isMatch: response.data.isMatch, match: response.data.match };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to swipe');
    }
  }
);

const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    nextCard: (state) => {
      if (state.currentIndex < state.candidates.length - 1) {
        state.lastSwipedUser = state.candidates[state.currentIndex];
        state.currentIndex += 1;
      }
    },
    undoSwipe: (state) => {
      if (state.currentIndex > 0 && state.lastSwipedUser) {
        state.currentIndex -= 1;
        state.lastSwipedUser = null;
      }
    },
    setFilters: (state, action: PayloadAction<Partial<DiscoveryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetDiscovery: (state) => {
      state.candidates = [];
      state.currentIndex = 0;
      state.lastSwipedUser = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscoveryCandidates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDiscoveryCandidates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidates = action.payload;
        state.currentIndex = 0;
      })
      .addCase(fetchDiscoveryCandidates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(swipeOnUser.fulfilled, (state, action) => {
        state.lastSwipedUser = state.candidates[state.currentIndex];
        state.currentIndex += 1;
      })
      .addCase(swipeOnUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { nextCard, undoSwipe, setFilters, resetDiscovery, clearError } = discoverySlice.actions;
export default discoverySlice.reducer;
