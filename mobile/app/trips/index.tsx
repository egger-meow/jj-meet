import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../src/store';
import {
  fetchUserTrips,
  fetchActiveTrip,
  setSelectedTrip,
  setDiscoveryTripId,
} from '../../src/store/slices/tripSlice';
import { tripService, Trip } from '../../src/services/tripService';
import { t } from '../../src/i18n';

export default function TripsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { trips, activeTrip, loading, discoveryTripId } = useSelector(
    (state: RootState) => state.trips
  );

  useEffect(() => {
    dispatch(fetchUserTrips(undefined));
    dispatch(fetchActiveTrip());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchUserTrips(undefined));
    dispatch(fetchActiveTrip());
  };

  const handleTripPress = (trip: Trip) => {
    dispatch(setSelectedTrip(trip));
    router.push(`/trips/${trip.id}`);
  };

  const handleDiscoverForTrip = (trip: Trip) => {
    dispatch(setDiscoveryTripId(trip.id));
    router.push('/(tabs)/swipe');
  };

  const renderTripCard = ({ item: trip }: { item: Trip }) => {
    const isActive = tripService.isTripActive(trip);
    const isUpcoming = tripService.isTripUpcoming(trip);
    const isPast = tripService.isTripPast(trip);
    const daysUntil = tripService.getDaysUntilTrip(trip.start_date);
    const duration = tripService.getTripDuration(trip.start_date, trip.end_date);
    const isDiscoveryContext = discoveryTripId === trip.id;

    return (
      <TouchableOpacity
        style={[
          styles.tripCard,
          isActive && styles.activeCard,
          isPast && styles.pastCard,
          isDiscoveryContext && styles.discoveryContextCard,
        ]}
        onPress={() => handleTripPress(trip)}
      >
        <View style={styles.tripHeader}>
          <View style={styles.destinationContainer}>
            <Ionicons
              name="location"
              size={20}
              color={isActive ? '#10B981' : isPast ? '#9CA3AF' : '#6366F1'}
            />
            <Text style={[styles.destinationName, isPast && styles.pastText]}>
              {trip.destination_name}
            </Text>
          </View>
          {isDiscoveryContext && (
            <View style={styles.discoveryBadge}>
              <Ionicons name="compass" size={14} color="#fff" />
              <Text style={styles.discoveryBadgeText}>{t.trips.discovering}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.dates, isPast && styles.pastText]}>
          {tripService.formatTripDates(trip.start_date, trip.end_date)}
        </Text>

        <View style={styles.tripMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{duration} {t.trips.days}</Text>
          </View>
          {isUpcoming && daysUntil > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>
                {daysUntil === 1 ? t.trips.tomorrow : t.trips.inDays.replace('{days}', String(daysUntil))}
              </Text>
            </View>
          )}
          {isActive && (
            <View style={[styles.statusBadge, styles.activeBadge]}>
              <Text style={styles.statusText}>{t.trips.activeNow}</Text>
            </View>
          )}
          {trip.travel_style && (
            <View style={styles.styleBadge}>
              <Text style={styles.styleText}>{trip.travel_style}</Text>
            </View>
          )}
        </View>

        {trip.description && (
          <Text style={[styles.description, isPast && styles.pastText]} numberOfLines={2}>
            {trip.description}
          </Text>
        )}

        {!isPast && (
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => handleDiscoverForTrip(trip)}
          >
            <Ionicons name="people" size={16} color="#6366F1" />
            <Text style={styles.discoverButtonText}>{t.trips.findTravelers}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="airplane-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>{t.trips.noTrips}</Text>
      <Text style={styles.emptySubtitle}>
        {t.trips.startPlanning}
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/trips/create')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>{t.trips.planTrip}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.trips.title}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/trips/create')}
        >
          <Ionicons name="add-circle" size={28} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {activeTrip && (
        <View style={styles.activeSection}>
          <Text style={styles.sectionTitle}>{t.trips.currentlyTraveling}</Text>
          {renderTripCard({ item: activeTrip })}
        </View>
      )}

      <FlatList
        data={trips.filter((t) => t.id !== activeTrip?.id)}
        keyExtractor={(item) => item.id}
        renderItem={renderTripCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },
  activeSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  pastCard: {
    opacity: 0.7,
  },
  discoveryContextCard: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  discoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discoveryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  dates: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 28,
  },
  pastText: {
    color: '#9CA3AF',
  },
  tripMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  styleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  styleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
    lineHeight: 20,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
  },
  discoverButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
