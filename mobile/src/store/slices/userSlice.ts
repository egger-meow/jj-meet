import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService, UserProfile, LocationUpdate } from '../../services/userService';

interface UserState {
  profile: UserProfile | null;
  location: LocationUpdate | null;
  profileCompleteness: number;
  missingFields: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  location: null,
  profileCompleteness: 0,
  missingFields: [],
  isLoading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getProfile();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      return await userService.updateProfile(updates);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update profile');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'user/updateLocation',
  async (location: LocationUpdate, { rejectWithValue }) => {
    try {
      await userService.updateLocation(location);
      return location;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update location');
    }
  }
);

export const setGuideMode = createAsyncThunk(
  'user/setGuideMode',
  async ({ isGuide, details }: { isGuide: boolean; details?: object }, { rejectWithValue }) => {
    try {
      return await userService.setGuideMode(isGuide, details);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to set guide mode');
    }
  }
);

export const fetchProfileCompleteness = createAsyncThunk(
  'user/fetchProfileCompleteness',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getProfileCompleteness();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch completeness');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLocation: (state, action: PayloadAction<LocationUpdate>) => {
      state.location = action.payload;
    },
    clearUserData: (state) => {
      state.profile = null;
      state.location = null;
      state.profileCompleteness = 0;
      state.missingFields = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.location = action.payload;
      })
      .addCase(setGuideMode.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(fetchProfileCompleteness.fulfilled, (state, action) => {
        state.profileCompleteness = action.payload.percentage;
        state.missingFields = action.payload.missingRequired;
      });
  },
});

export const { setLocation, clearUserData, clearError } = userSlice.actions;
export default userSlice.reducer;
