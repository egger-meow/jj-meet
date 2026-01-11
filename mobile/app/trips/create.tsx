import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../src/store';
import { createTrip } from '../../src/store/slices/tripSlice';
import { locationService } from '../../src/services/locationService';

const TRAVEL_STYLES = [
  { id: 'adventure', label: 'Adventure', icon: 'compass' },
  { id: 'relaxed', label: 'Relaxed', icon: 'leaf' },
  { id: 'cultural', label: 'Cultural', icon: 'library' },
  { id: 'nightlife', label: 'Nightlife', icon: 'moon' },
  { id: 'foodie', label: 'Foodie', icon: 'restaurant' },
  { id: 'budget', label: 'Budget', icon: 'wallet' },
  { id: 'luxury', label: 'Luxury', icon: 'diamond' },
] as const;

export default function CreateTripScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.trips);

  const [destination, setDestination] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [travelStyle, setTravelStyle] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const handleGeocode = async () => {
    if (!destination) return;
    
    const searchQuery = [destination, city, country].filter(Boolean).join(', ');
    const coords = await locationService.geocodeAddress(searchQuery);
    
    if (coords) {
      setCoordinates({ lat: coords.latitude, lng: coords.longitude });
      Alert.alert('Location Found', `Coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
    } else {
      Alert.alert('Location Not Found', 'Could not find coordinates for this destination. You can still create the trip.');
    }
  };

  const validateDates = (): boolean => {
    if (!startDate || !endDate) {
      Alert.alert('Missing Dates', 'Please enter both start and end dates.');
      return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert('Invalid Date Format', 'Please use YYYY-MM-DD format (e.g., 2026-02-15).');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      Alert.alert('Invalid Date', 'Start date cannot be in the past.');
      return false;
    }

    if (end < start) {
      Alert.alert('Invalid Date', 'End date must be after start date.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!destination.trim()) {
      Alert.alert('Missing Destination', 'Please enter a destination.');
      return;
    }

    if (!validateDates()) return;

    try {
      await dispatch(
        createTrip({
          destination_name: destination.trim(),
          destination_city: city.trim() || undefined,
          destination_country: country.trim() || undefined,
          start_date: startDate,
          end_date: endDate,
          description: description.trim() || undefined,
          travel_style: travelStyle as any,
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
        })
      ).unwrap();

      Alert.alert('Trip Created!', 'Your trip has been added.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to create trip');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Plan a Trip</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where are you going?</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination *</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g., Tokyo, Bali, Paris"
                value={destination}
                onChangeText={setDestination}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.geocodeButton} onPress={handleGeocode}>
                <Ionicons name="location" size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="Country"
                value={country}
                onChangeText={setCountry}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {coordinates && (
            <View style={styles.coordinatesTag}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.coordinatesText}>
                Location set: {coordinates.lat.toFixed(2)}, {coordinates.lng.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When?</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Start Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>End Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Style</Text>
          <View style={styles.styleGrid}>
            {TRAVEL_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleButton,
                  travelStyle === style.id && styles.styleButtonActive,
                ]}
                onPress={() => setTravelStyle(travelStyle === style.id ? null : style.id)}
              >
                <Ionicons
                  name={style.icon as any}
                  size={20}
                  color={travelStyle === style.id ? '#fff' : '#6366F1'}
                />
                <Text
                  style={[
                    styles.styleLabel,
                    travelStyle === style.id && styles.styleLabelActive,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you looking for?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Looking for a local guide to show me hidden food spots, or fellow travelers to explore together..."
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Ionicons name="airplane" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Trip'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geocodeButton: {
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
  },
  coordinatesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  coordinatesText: {
    fontSize: 13,
    color: '#065F46',
    marginLeft: 6,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
    marginLeft: 6,
  },
  styleLabelActive: {
    color: '#fff',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
