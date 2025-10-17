import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';

export const fetchNearbyUsers = createAsyncThunk(
  'user/fetchNearby',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await userService.getNearbyUsers(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch users');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'user/updateLocation',
  async ({ latitude, longitude }, { rejectWithValue }) => {
    try {
      await userService.updateLocation(latitude, longitude);
      return { latitude, longitude };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update location');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    nearbyUsers: [],
    currentLocation: null,
    loading: false,
    error: null,
  },
  reducers: {
    removeUser: (state, action) => {
      state.nearbyUsers = state.nearbyUsers.filter(user => user.id !== action.payload);
    },
    clearNearbyUsers: (state) => {
      state.nearbyUsers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNearbyUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyUsers = action.payload;
      })
      .addCase(fetchNearbyUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.currentLocation = action.payload;
      });
  },
});

export const { removeUser, clearNearbyUsers } = userSlice.actions;
export default userSlice.reducer;
