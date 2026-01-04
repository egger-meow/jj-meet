import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

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

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;

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
}

export const locationService = new LocationService();
