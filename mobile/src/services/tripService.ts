import api from './api';

export interface Trip {
  id: string;
  user_id: string;
  destination_name: string;
  destination_city?: string;
  destination_country?: string;
  start_date: string;
  end_date: string;
  description?: string;
  travel_style?: string;
  is_active: boolean;
  is_public: boolean;
  preferences?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateTripData {
  destination_name: string;
  destination_city?: string;
  destination_country?: string;
  latitude?: number;
  longitude?: number;
  start_date: string;
  end_date: string;
  description?: string;
  travel_style?: 'adventure' | 'relaxed' | 'cultural' | 'nightlife' | 'foodie' | 'budget' | 'luxury';
  preferences?: Record<string, unknown>;
}

export interface UpdateTripData extends Partial<CreateTripData> {
  is_active?: boolean;
  is_public?: boolean;
}

export interface OverlappingTraveler {
  id: string;
  name: string;
  profile_photo?: string;
  bio?: string;
  user_type: string;
  is_guide: boolean;
  distance: number;
  overlap_days?: number;
  match_type: 'local' | 'traveler';
}

class TripService {
  async createTrip(data: CreateTripData): Promise<Trip> {
    const response = await api.post('/trips', data);
    return response.data.data;
  }

  async getUserTrips(options?: {
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  }): Promise<Trip[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.includeInactive) params.append('includeInactive', 'true');

    const response = await api.get(`/trips?${params.toString()}`);
    return response.data.data;
  }

  async getTripById(tripId: string): Promise<Trip> {
    const response = await api.get(`/trips/${tripId}`);
    return response.data.data;
  }

  async updateTrip(tripId: string, data: UpdateTripData): Promise<Trip> {
    const response = await api.patch(`/trips/${tripId}`, data);
    return response.data.data;
  }

  async deleteTrip(tripId: string): Promise<void> {
    await api.delete(`/trips/${tripId}`);
  }

  async getActiveTrip(): Promise<Trip | null> {
    const response = await api.get('/trips/active');
    return response.data.data || null;
  }

  async getUpcomingTrips(daysAhead: number = 30): Promise<Trip[]> {
    const response = await api.get(`/trips/upcoming?daysAhead=${daysAhead}`);
    return response.data.data;
  }

  async findOverlappingTravelers(
    tripId: string,
    options?: { maxDistance?: number; limit?: number }
  ): Promise<OverlappingTraveler[]> {
    const params = new URLSearchParams();
    if (options?.maxDistance) params.append('maxDistance', options.maxDistance.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await api.get(`/trips/${tripId}/travelers?${params.toString()}`);
    return response.data.data;
  }

  formatTripDates(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    }
    
    if (start.getMonth() !== end.getMonth()) {
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }
    
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}`;
  }

  getDaysUntilTrip(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTripDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  isTripActive(trip: Trip): boolean {
    const now = new Date();
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    return now >= start && now <= end && trip.is_active;
  }

  isTripUpcoming(trip: Trip): boolean {
    const now = new Date();
    const start = new Date(trip.start_date);
    return start > now && trip.is_active;
  }

  isTripPast(trip: Trip): boolean {
    const now = new Date();
    const end = new Date(trip.end_date);
    return end < now;
  }
}

export const tripService = new TripService();
