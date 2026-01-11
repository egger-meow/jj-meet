import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface User {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  profile_photo?: string;
  photos?: { url: string }[];
  distance?: number;
  is_guide?: boolean;
  has_car?: boolean;
  has_motorcycle?: boolean;
  is_verified?: boolean;
}

interface SwipeCardProps {
  user: User;
  onSwipe: (direction: 'like' | 'pass' | 'super_like') => void;
  isFirst: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ user, onSwipe, isFirst }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(isFirst)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5);
        runOnJS(onSwipe)('like');
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        runOnJS(onSwipe)('pass');
      } else if (translateY.value < -SWIPE_THRESHOLD * 1.5) {
        translateY.value = withSpring(-SCREEN_HEIGHT);
        runOnJS(onSwipe)('super_like');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const superLikeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [-SWIPE_THRESHOLD * 1.5, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const photos = user.photos?.length ? user.photos : user.profile_photo ? [{ url: user.profile_photo }] : [];

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.imageContainer}>
          {photos.length > 0 ? (
            <Image source={{ uri: photos[0].url }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="user" size={80} color="#D1D5DB" />
            </View>
          )}
          
          <Animated.View style={[styles.overlayLabel, styles.likeLabel, likeOpacity]}>
            <Text style={styles.likeLabelText}>LIKE</Text>
          </Animated.View>
          
          <Animated.View style={[styles.overlayLabel, styles.nopeLabel, nopeOpacity]}>
            <Text style={styles.nopeLabelText}>NOPE</Text>
          </Animated.View>
          
          <Animated.View style={[styles.overlayLabel, styles.superLikeLabel, superLikeOpacity]}>
            <Text style={styles.superLikeLabelText}>SUPER LIKE</Text>
          </Animated.View>

          <View style={styles.gradient} />
          
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              {user.age && <Text style={styles.age}>, {user.age}</Text>}
              {user.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            
            {user.distance !== undefined && (
              <View style={styles.distanceRow}>
                <Feather name="map-pin" size={14} color="#FFFFFF" />
                <Text style={styles.distance}>{Math.round(user.distance)} km away</Text>
              </View>
            )}
            
            <View style={styles.badges}>
              {user.is_guide && (
                <View style={styles.badge}>
                  <Feather name="compass" size={12} color="#FF6B6B" />
                  <Text style={styles.badgeText}>Guide</Text>
                </View>
              )}
              {user.has_car && (
                <View style={styles.badge}>
                  <Feather name="truck" size={12} color="#3B82F6" />
                  <Text style={styles.badgeText}>Car</Text>
                </View>
              )}
              {user.has_motorcycle && (
                <View style={styles.badge}>
                  <Feather name="zap" size={12} color="#F59E0B" />
                  <Text style={styles.badgeText}>Moto</Text>
                </View>
              )}
            </View>
            
            {user.bio && (
              <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  userInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  age: {
    fontSize: 26,
    color: '#FFFFFF',
  },
  verifiedBadge: {
    marginLeft: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distance: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  bio: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
  },
  overlayLabel: {
    position: 'absolute',
    padding: 10,
    borderWidth: 4,
    borderRadius: 8,
  },
  likeLabel: {
    top: 50,
    left: 20,
    borderColor: '#22C55E',
    transform: [{ rotate: '-15deg' }],
  },
  likeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  nopeLabel: {
    top: 50,
    right: 20,
    borderColor: '#EF4444',
    transform: [{ rotate: '15deg' }],
  },
  nopeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  superLikeLabel: {
    bottom: 120,
    alignSelf: 'center',
    borderColor: '#3B82F6',
  },
  superLikeLabelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
});

export default SwipeCard;
