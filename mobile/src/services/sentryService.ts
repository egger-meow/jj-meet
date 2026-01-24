// Sentry Error Tracking Service
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || '';

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] No DSN configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    debug: __DEV__,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    attachStacktrace: true,
    beforeSend(event) {
      // Filter out development errors if needed
      if (__DEV__) {
        console.log('[Sentry] Would send event:', event.exception?.values?.[0]?.type);
      }
      return event;
    },
  });

  console.log('[Sentry] Initialized successfully');
};

// Set user context for error tracking
export const setUserContext = (user: { id: string; email?: string; name?: string } | null) => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
};

// Capture custom error with context
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  if (context) {
    Sentry.setContext('errorContext', context);
  }
  Sentry.captureException(error);
};

// Capture message for non-error events
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Add breadcrumb for navigation/action tracking
export const addBreadcrumb = (category: string, message: string, data?: Record<string, unknown>) => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
};

// Wrap component with Sentry error boundary
export const withErrorBoundary = Sentry.wrap;

export default {
  initSentry,
  setUserContext,
  captureError,
  captureMessage,
  addBreadcrumb,
  withErrorBoundary,
};
