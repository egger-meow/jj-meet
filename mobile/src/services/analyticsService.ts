// Analytics Service for JJ-Meet
// Supports multiple analytics providers (Mixpanel, Amplitude, etc.)

type EventProperties = Record<string, string | number | boolean | null | undefined>;

interface UserProperties {
  id: string;
  email?: string;
  name?: string;
  isGuide?: boolean;
  hasCar?: boolean;
  hasMotorcycle?: boolean;
  mbti?: string;
}

// Analytics events
export const AnalyticsEvents = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  
  // Discovery
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  SUPER_LIKE: 'super_like',
  UNDO_SWIPE: 'undo_swipe',
  
  // Matches
  MATCH_CREATED: 'match_created',
  MATCH_OPENED: 'match_opened',
  
  // Chat
  MESSAGE_SENT: 'message_sent',
  CHAT_OPENED: 'chat_opened',
  
  // Trips
  TRIP_CREATED: 'trip_created',
  TRIP_DELETED: 'trip_deleted',
  TRIP_DISCOVERY_STARTED: 'trip_discovery_started',
  
  // Profile
  PROFILE_UPDATED: 'profile_updated',
  PHOTO_UPLOADED: 'photo_uploaded',
  
  // Navigation
  SCREEN_VIEW: 'screen_view',
  
  // Settings
  LANGUAGE_CHANGED: 'language_changed',
  NOTIFICATIONS_TOGGLED: 'notifications_toggled',
} as const;

// In-memory analytics (can be replaced with Mixpanel/Amplitude)
let isInitialized = false;
let userId: string | null = null;
const eventQueue: Array<{ event: string; properties: EventProperties; timestamp: Date }> = [];

// Initialize analytics
export const initAnalytics = (): void => {
  if (isInitialized) return;
  
  isInitialized = true;
  console.log('[Analytics] Initialized');
  
  // Flush queued events
  if (eventQueue.length > 0) {
    console.log(`[Analytics] Flushing ${eventQueue.length} queued events`);
    eventQueue.forEach(({ event, properties }) => {
      logEventInternal(event, properties);
    });
    eventQueue.length = 0;
  }
};

// Set user for analytics
export const setAnalyticsUser = (user: UserProperties | null): void => {
  if (user) {
    userId = user.id;
    console.log('[Analytics] User identified:', user.id);
    
    // Set user properties
    const userProps = {
      email: user.email,
      name: user.name,
      is_guide: user.isGuide,
      has_car: user.hasCar,
      has_motorcycle: user.hasMotorcycle,
      mbti: user.mbti,
    };
    console.log('[Analytics] User properties set:', userProps);
  } else {
    userId = null;
    console.log('[Analytics] User cleared');
  }
};

// Internal event logging
const logEventInternal = (event: string, properties: EventProperties = {}): void => {
  const enrichedProps = {
    ...properties,
    user_id: userId,
    timestamp: new Date().toISOString(),
    platform: 'mobile',
  };
  
  if (__DEV__) {
    console.log(`[Analytics] Event: ${event}`, enrichedProps);
  }
  
  // TODO: Send to analytics provider (Mixpanel, Amplitude, etc.)
  // Example:
  // Mixpanel.track(event, enrichedProps);
  // amplitude.logEvent(event, enrichedProps);
};

// Track event
export const trackEvent = (
  event: string,
  properties: EventProperties = {}
): void => {
  if (!isInitialized) {
    // Queue events if not initialized yet
    eventQueue.push({ event, properties, timestamp: new Date() });
    return;
  }
  
  logEventInternal(event, properties);
};

// Track screen view
export const trackScreen = (screenName: string, properties: EventProperties = {}): void => {
  trackEvent(AnalyticsEvents.SCREEN_VIEW, {
    screen_name: screenName,
    ...properties,
  });
};

// Convenience methods for common events
export const trackSwipe = (direction: 'left' | 'right' | 'super', targetUserId: string): void => {
  const event = direction === 'left' 
    ? AnalyticsEvents.SWIPE_LEFT 
    : direction === 'right' 
      ? AnalyticsEvents.SWIPE_RIGHT 
      : AnalyticsEvents.SUPER_LIKE;
  
  trackEvent(event, { target_user_id: targetUserId });
};

export const trackMatch = (matchId: string, matchedUserId: string): void => {
  trackEvent(AnalyticsEvents.MATCH_CREATED, { 
    match_id: matchId,
    matched_user_id: matchedUserId,
  });
};

export const trackMessage = (matchId: string): void => {
  trackEvent(AnalyticsEvents.MESSAGE_SENT, { match_id: matchId });
};

export default {
  init: initAnalytics,
  setUser: setAnalyticsUser,
  track: trackEvent,
  trackScreen,
  trackSwipe,
  trackMatch,
  trackMessage,
  Events: AnalyticsEvents,
};
