import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tripService, Trip, CreateTripData, UpdateTripData, OverlappingTraveler } from '../../services/tripService';

interface TripState {
  trips: Trip[];
  activeTrip: Trip | null;
  upcomingTrips: Trip[];
  selectedTrip: Trip | null;
  overlappingTravelers: OverlappingTraveler[];
  discoveryContext: 'current' | 'trip';
  discoveryTripId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: TripState = {
  trips: [],
  activeTrip: null,
  upcomingTrips: [],
  selectedTrip: null,
  overlappingTravelers: [],
  discoveryContext: 'current',
  discoveryTripId: null,
  loading: false,
  error: null,
};

export const fetchUserTrips = createAsyncThunk(
  'trips/fetchUserTrips',
  async (options: { includeInactive?: boolean } | undefined, { rejectWithValue }) => {
    try {
      return await tripService.getUserTrips(options);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trips');
    }
  }
);

export const fetchActiveTrip = createAsyncThunk(
  'trips/fetchActiveTrip',
  async (_, { rejectWithValue }) => {
    try {
      return await tripService.getActiveTrip();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active trip');
    }
  }
);

export const fetchUpcomingTrips = createAsyncThunk(
  'trips/fetchUpcomingTrips',
  async (daysAhead: number = 30, { rejectWithValue }) => {
    try {
      return await tripService.getUpcomingTrips(daysAhead);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch upcoming trips');
    }
  }
);

export const createTrip = createAsyncThunk(
  'trips/createTrip',
  async (data: CreateTripData, { rejectWithValue }) => {
    try {
      return await tripService.createTrip(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create trip');
    }
  }
);

export const updateTrip = createAsyncThunk(
  'trips/updateTrip',
  async ({ tripId, data }: { tripId: string; data: UpdateTripData }, { rejectWithValue }) => {
    try {
      return await tripService.updateTrip(tripId, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update trip');
    }
  }
);

export const deleteTrip = createAsyncThunk(
  'trips/deleteTrip',
  async (tripId: string, { rejectWithValue }) => {
    try {
      await tripService.deleteTrip(tripId);
      return tripId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete trip');
    }
  }
);

export const fetchOverlappingTravelers = createAsyncThunk(
  'trips/fetchOverlappingTravelers',
  async ({ tripId, options }: { tripId: string; options?: { maxDistance?: number; limit?: number } }, { rejectWithValue }) => {
    try {
      return await tripService.findOverlappingTravelers(tripId, options);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch travelers');
    }
  }
);

const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setDiscoveryContext: (state, action: PayloadAction<'current' | 'trip'>) => {
      state.discoveryContext = action.payload;
      if (action.payload === 'current') {
        state.discoveryTripId = null;
      }
    },
    setDiscoveryTripId: (state, action: PayloadAction<string | null>) => {
      state.discoveryTripId = action.payload;
      state.discoveryContext = action.payload ? 'trip' : 'current';
    },
    setSelectedTrip: (state, action: PayloadAction<Trip | null>) => {
      state.selectedTrip = action.payload;
    },
    clearTripError: (state) => {
      state.error = null;
    },
    resetTripState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload;
      })
      .addCase(fetchUserTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchActiveTrip.fulfilled, (state, action) => {
        state.activeTrip = action.payload;
      })

      .addCase(fetchUpcomingTrips.fulfilled, (state, action) => {
        state.upcomingTrips = action.payload;
      })

      .addCase(createTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.trips.unshift(action.payload);
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateTrip.fulfilled, (state, action) => {
        const index = state.trips.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        if (state.selectedTrip?.id === action.payload.id) {
          state.selectedTrip = action.payload;
        }
        if (state.activeTrip?.id === action.payload.id) {
          state.activeTrip = action.payload;
        }
      })

      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.trips = state.trips.filter((t) => t.id !== action.payload);
        if (state.selectedTrip?.id === action.payload) {
          state.selectedTrip = null;
        }
        if (state.activeTrip?.id === action.payload) {
          state.activeTrip = null;
        }
        if (state.discoveryTripId === action.payload) {
          state.discoveryTripId = null;
          state.discoveryContext = 'current';
        }
      })

      .addCase(fetchOverlappingTravelers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOverlappingTravelers.fulfilled, (state, action) => {
        state.loading = false;
        state.overlappingTravelers = action.payload;
      })
      .addCase(fetchOverlappingTravelers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setDiscoveryContext,
  setDiscoveryTripId,
  setSelectedTrip,
  clearTripError,
  resetTripState,
} = tripSlice.actions;

export default tripSlice.reducer;
