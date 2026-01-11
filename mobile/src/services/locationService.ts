import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Linking, Platform, AppState, AppStateStatus } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationAddress {
  city?: string;
  country?: string;
  district?: string;
  region?: string;
  street?: string;
  postalCode?: string;
  name?: string;
}

export interface LocationConfig {
  foregroundIntervalMs: number;
  backgroundIntervalMs: number;
  distanceFilterMeters: number;
}

const BACKGROUND_LOCATION_TASK = 'jj-meet-background-location';

const DEFAULT_CONFIG: LocationConfig = {
  foregroundIntervalMs: 25000,
  backgroundIntervalMs: 300000,
  distanceFilterMeters: 300,
};

type LocationUpdateCallback = (location: LocationCoords) => void;

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private config: LocationConfig = DEFAULT_CONFIG;
  private isBackgroundEnabled: boolean = false;
  private hasActiveTrip: boolean = false;
  private lastLocation: LocationCoords | null = null;
  private onLocationUpdate: LocationUpdateCallback | null = null;
  private appState: AppStateStatus = 'active';

  async requestPermission(): Promise<boolean> {
    const { status: foregroundStatus } = 
      await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'JJ-Meet needs your location to find travelers and guides near you. Please enable location access in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => Linking.openSettings() 
          },
        ]
      );
      return false;
    }
    return true;
  }

  async requestBackgroundPermission(): Promise<boolean> {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation(): Promise<LocationCoords | null> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return null;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        altitude: location.coords.altitude ?? undefined,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  async getLastKnownLocation(): Promise<LocationCoords | null> {
    try {
      const location = await Location.getLastKnownPositionAsync();
      if (!location) return null;

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      };
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  async reverseGeocode(coords: LocationCoords): Promise<LocationAddress | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (!addresses.length) return null;

      const address = addresses[0];
      return {
        city: address.city ?? undefined,
        country: address.country ?? undefined,
        district: address.district ?? undefined,
        region: address.region ?? undefined,
        street: address.street ?? undefined,
        postalCode: address.postalCode ?? undefined,
        name: address.name ?? undefined,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  async geocodeAddress(address: string): Promise<LocationCoords | null> {
    try {
      const locations = await Location.geocodeAsync(address);
      if (!locations.length) return null;

      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  async startWatching(
    callback: (location: LocationCoords) => void,
    options?: {
      accuracy?: Location.Accuracy;
      distanceInterval?: number;
      timeInterval?: number;
    }
  ): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return false;

    try {
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.Balanced,
          distanceInterval: options?.distanceInterval || 100,
          timeInterval: options?.timeInterval || 30000,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            heading: location.coords.heading ?? undefined,
            speed: location.coords.speed ?? undefined,
          });
        }
      );
      return true;
    } catch (error) {
      console.error('Error starting location watch:', error);
      return false;
    }
  }

  stopWatching(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  calculateDistance(
    coords1: LocationCoords,
    coords2: LocationCoords
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coords2.latitude - coords1.latitude);
    const dLon = this.toRad(coords2.longitude - coords1.longitude);
    const lat1 = this.toRad(coords1.latitude);
    const lat2 = this.toRad(coords2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  }

  setConfig(config: Partial<LocationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setActiveTrip(hasTrip: boolean): void {
    this.hasActiveTrip = hasTrip;
    if (hasTrip && this.isBackgroundEnabled) {
      this.startBackgroundTracking();
    } else if (!hasTrip) {
      this.stopBackgroundTracking();
    }
  }

  setLocationUpdateCallback(callback: LocationUpdateCallback | null): void {
    this.onLocationUpdate = callback;
  }

  getLastLocation(): LocationCoords | null {
    return this.lastLocation;
  }

  async startContextAwareTracking(callback: LocationUpdateCallback): Promise<boolean> {
    this.onLocationUpdate = callback;

    AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    const hasForeground = await this.requestPermission();
    if (!hasForeground) return false;

    await this.startForegroundTracking();

    if (this.hasActiveTrip) {
      const hasBackground = await this.requestBackgroundPermission();
      if (hasBackground) {
        this.isBackgroundEnabled = true;
      }
    }

    return true;
  }

  stopContextAwareTracking(): void {
    this.stopWatching();
    this.stopBackgroundTracking();
    this.onLocationUpdate = null;
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      this.stopWatching();
      if (this.hasActiveTrip && this.isBackgroundEnabled) {
        this.startBackgroundTracking();
      }
    } else if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.stopBackgroundTracking();
      this.startForegroundTracking();
    }
    this.appState = nextAppState;
  }

  private async startForegroundTracking(): Promise<void> {
    try {
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: this.config.distanceFilterMeters,
          timeInterval: this.config.foregroundIntervalMs,
        },
        (location) => {
          const coords: LocationCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            heading: location.coords.heading ?? undefined,
            speed: location.coords.speed ?? undefined,
          };
          this.lastLocation = coords;
          this.onLocationUpdate?.(coords);
        }
      );
    } catch (error) {
      console.error('Error starting foreground tracking:', error);
    }
  }

  private async startBackgroundTracking(): Promise<void> {
    if (!this.hasActiveTrip) return;

    try {
      const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
      if (!isTaskDefined) {
        console.warn('Background location task not defined');
        return;
      }

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasStarted) return;

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: this.config.distanceFilterMeters,
        timeInterval: this.config.backgroundIntervalMs,
        foregroundService: {
          notificationTitle: 'JJ-Meet',
          notificationBody: 'Tracking your trip location',
          notificationColor: '#6366F1',
        },
        pausesUpdatesAutomatically: true,
        activityType: Location.ActivityType.Other,
      });
    } catch (error) {
      console.error('Error starting background tracking:', error);
    }
  }

  private async stopBackgroundTracking(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  }

  async checkBackgroundStatus(): Promise<{
    hasPermission: boolean;
    isTracking: boolean;
    hasActiveTrip: boolean;
  }> {
    const { status } = await Location.getBackgroundPermissionsAsync();
    let isTracking = false;
    try {
      isTracking = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    } catch {}

    return {
      hasPermission: status === 'granted',
      isTracking,
      hasActiveTrip: this.hasActiveTrip,
    };
  }
}

export const locationService = new LocationService();

export const LOCATION_TASK_NAME = BACKGROUND_LOCATION_TASK;

export function defineBackgroundLocationTask(
  onUpdate: (locations: LocationCoords[]) => void
): void {
  TaskManager.defineTask(
    BACKGROUND_LOCATION_TASK,
    ({ data, error }: { data: { locations: Location.LocationObject[] } | null; error: Error | null }) => {
      if (error) {
        console.error('Background location task error:', error);
        return;
      }
      if (data) {
        const { locations } = data;
        const coords: LocationCoords[] = locations.map((loc) => ({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? undefined,
          heading: loc.coords.heading ?? undefined,
          speed: loc.coords.speed ?? undefined,
        }));
        onUpdate(coords);
      }
    }
  );
}
