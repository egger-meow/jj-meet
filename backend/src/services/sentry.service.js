// Sentry Error Tracking Service for Backend
const Sentry = require('@sentry/node');

const SENTRY_DSN = process.env.SENTRY_DSN || '';

const initSentry = (app) => {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] No DSN configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      Sentry.httpIntegration({ tracing: true }),
      Sentry.expressIntegration({ app }),
    ],
  });

  console.log('[Sentry] Initialized successfully');
};

// Set user context for error tracking
const setUserContext = (user) => {
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
const captureError = (error, context = {}) => {
  Sentry.setContext('errorContext', context);
  Sentry.captureException(error);
};

// Capture message for non-error events
const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

// Add breadcrumb for action tracking
const addBreadcrumb = (category, message, data = {}) => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
};

// Express error handler middleware
const sentryErrorHandler = Sentry.expressErrorHandler();

// Request handler middleware (must be first)
const sentryRequestHandler = Sentry.expressRequestHandler
  ? Sentry.expressRequestHandler()
  : (req, res, next) => next();

module.exports = {
  initSentry,
  setUserContext,
  captureError,
  captureMessage,
  addBreadcrumb,
  sentryErrorHandler,
  sentryRequestHandler,
  Sentry,
};
