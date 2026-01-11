import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import {
  fetchDiscoveryCandidates,
  swipeOnUser,
  undoSwipe,
} from '../../src/store/slices/discoverySlice';
import { SwipeCard } from '../../src/components/SwipeCard';
import { t } from '../../src/i18n';

export default function DiscoverScreen() {
  const dispatch = useAppDispatch();
  const { candidates, currentIndex, isLoading, error, lastSwipedUser } = useAppSelector(
    (state) => state.discovery
  );

  useEffect(() => {
    dispatch(fetchDiscoveryCandidates());
  }, [dispatch]);

  const handleSwipe = useCallback(
    (direction: 'like' | 'pass' | 'super_like') => {
      const currentUser = candidates[currentIndex];
      if (currentUser) {
        dispatch(swipeOnUser({ userId: currentUser.id, direction }));
      }
    },
    [dispatch, candidates, currentIndex]
  );

  const handleUndo = useCallback(() => {
    dispatch(undoSwipe());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchDiscoveryCandidates());
  }, [dispatch]);

  const currentCard = candidates[currentIndex];
  const nextCard = candidates[currentIndex + 1];

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.discovery.title}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleRefresh}>
              <Feather name="refresh-cw" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Feather name="sliders" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>{t.discovery.findingPeople}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>{t.common.retry}</Text>
              </TouchableOpacity>
            </View>
          ) : !currentCard ? (
            <View style={styles.emptyContainer}>
              <Feather name="compass" size={64} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>{t.discovery.noMoreProfiles}</Text>
              <Text style={styles.emptyText}>
                {t.discovery.checkBackLater}
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                <Feather name="refresh-cw" size={20} color="#FFFFFF" />
                <Text style={styles.refreshButtonText}>{t.discovery.refresh}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {nextCard && (
                <SwipeCard
                  key={nextCard.id}
                  user={nextCard}
                  onSwipe={() => {}}
                  isFirst={false}
                />
              )}
              <SwipeCard
                key={currentCard.id}
                user={currentCard}
                onSwipe={handleSwipe}
                isFirst={true}
              />
            </View>
          )}
        </View>

        {currentCard && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.passButton]}
              onPress={() => handleSwipe('pass')}
            >
              <Feather name="x" size={32} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.superLikeButton]}
              onPress={() => handleSwipe('super_like')}
            >
              <Feather name="star" size={28} color="#3B82F6" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => handleSwipe('like')}
            >
              <Feather name="heart" size={32} color="#22C55E" />
            </TouchableOpacity>

            {lastSwipedUser && (
              <TouchableOpacity
                style={[styles.actionButton, styles.undoButton]}
                onPress={handleUndo}
              >
                <Feather name="rotate-ccw" size={24} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  superLikeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  likeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  undoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F59E0B',
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'absolute',
    right: 20,
  },
});
