# JJ-Meet Error Code Dictionary 📋

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Usage:** Backend API, Frontend handling, Testing, Debugging

---

## Overview

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Human-readable message",
    "details": {}
  }
}
```

| Field | Description |
|-------|-------------|
| `code` | Unique error identifier (use for programmatic handling) |
| `message` | User-friendly message (safe to display) |
| `details` | Additional context (validation errors, etc.) |

---

## Error Code Prefixes

| Prefix | Domain | HTTP Status Range |
|--------|--------|-------------------|
| `AUTH_` | Authentication & Authorization | 401, 403 |
| `USER_` | User Management | 400, 404 |
| `SWIPE_` | Swipe & Discovery | 400, 403, 429 |
| `MATCH_` | Matches | 400, 404 |
| `CHAT_` | Messaging | 400, 403, 404 |
| `UPLOAD_` | File Uploads | 400, 413 |
| `VERIFY_` | Verification | 400, 403 |
| `REPORT_` | Reporting & Safety | 400, 429 |
| `RATE_` | Rate Limiting | 429 |
| `VAL_` | Validation | 400 |
| `SYS_` | System Errors | 500, 503 |

---

## Authentication Errors (AUTH_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `AUTH_001` | 401 | Invalid email or password | Show error, clear password |
| `AUTH_002` | 401 | Token expired | Attempt refresh |
| `AUTH_003` | 401 | Token invalid | Logout, redirect to login |
| `AUTH_004` | 401 | Refresh token expired | Logout, redirect to login |
| `AUTH_005` | 401 | Refresh token invalid | Logout, redirect to login |
| `AUTH_006` | 401 | Refresh token reused (security) | Logout, show security alert |
| `AUTH_007` | 403 | Account suspended | Show suspension notice |
| `AUTH_008` | 403 | Account banned | Show ban notice |
| `AUTH_009` | 403 | Email not verified | Redirect to verification |
| `AUTH_010` | 403 | Phone not verified | Redirect to verification |
| `AUTH_011` | 401 | Device not recognized | Request device verification |
| `AUTH_012` | 403 | Session limit exceeded | Show device management |
| `AUTH_013` | 400 | Email already registered | Show login suggestion |
| `AUTH_014` | 400 | Phone already registered | Show login suggestion |
| `AUTH_015` | 401 | Password incorrect | Show error, increment attempts |
| `AUTH_016` | 403 | Account locked (too many attempts) | Show lockout timer |
| `AUTH_017` | 400 | Password too weak | Show requirements |
| `AUTH_018` | 400 | Invalid verification code | Allow retry |
| `AUTH_019` | 400 | Verification code expired | Request new code |
| `AUTH_020` | 403 | Must change password | Redirect to password change |

### Usage Examples

```javascript
// Frontend error handler
switch (error.code) {
  case 'AUTH_002':
  case 'AUTH_004':
  case 'AUTH_005':
    await refreshToken();
    break;
  case 'AUTH_006':
    showSecurityAlert();
    await forceLogout();
    break;
  case 'AUTH_007':
  case 'AUTH_008':
    showAccountStatusScreen(error);
    break;
  default:
    showError(error.message);
}
```

---

## User Errors (USER_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `USER_001` | 404 | User not found | Show not found |
| `USER_002` | 400 | Invalid profile data | Show validation errors |
| `USER_003` | 400 | Profile incomplete | Redirect to profile setup |
| `USER_004` | 400 | Invalid date of birth | Show error |
| `USER_005` | 400 | Must be 18 or older | Block signup |
| `USER_006` | 400 | Invalid location format | Request location again |
| `USER_007` | 400 | Bio too long | Show character limit |
| `USER_008` | 400 | Too many photos | Show photo limit |
| `USER_009` | 400 | At least one photo required | Prompt photo upload |
| `USER_010` | 403 | Cannot view this profile | Show unavailable |
| `USER_011` | 404 | Profile deleted | Show unavailable |
| `USER_012` | 400 | Invalid preferences | Show validation errors |
| `USER_013` | 400 | Location required | Request location permission |
| `USER_014` | 403 | Profile hidden by user | Show unavailable |
| `USER_015` | 400 | Invalid language selection | Show available options |

---

## Swipe Errors (SWIPE_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `SWIPE_001` | 404 | User to swipe not found | Remove from stack |
| `SWIPE_002` | 400 | Already swiped on this user | Remove from stack |
| `SWIPE_003` | 400 | Cannot swipe on yourself | Remove from stack |
| `SWIPE_004` | 403 | User has blocked you | Remove from stack |
| `SWIPE_005` | 403 | You have blocked this user | Remove from stack |
| `SWIPE_006` | 429 | Daily swipe limit reached | Show limit message |
| `SWIPE_007` | 429 | Super like limit reached | Show upgrade prompt |
| `SWIPE_008` | 400 | Invalid swipe type | Log error |
| `SWIPE_009` | 403 | Feature requires verification | Prompt verification |
| `SWIPE_010` | 400 | No more users nearby | Show empty state |
| `SWIPE_011` | 400 | Location too old | Request location update |
| `SWIPE_012` | 403 | Swipe feature restricted | Show restriction notice |

---

## Match Errors (MATCH_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `MATCH_001` | 404 | Match not found | Redirect to matches list |
| `MATCH_002` | 403 | Not part of this match | Show error |
| `MATCH_003` | 400 | Match already exists | Show existing match |
| `MATCH_004` | 400 | Match was unmatched | Remove from list |
| `MATCH_005` | 403 | Other user unmatched | Remove from list |
| `MATCH_006` | 403 | Other user account suspended | Show unavailable |
| `MATCH_007` | 403 | Other user deleted account | Show unavailable |

---

## Chat Errors (CHAT_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `CHAT_001` | 404 | Conversation not found | Redirect to matches |
| `CHAT_002` | 403 | Not authorized for this chat | Show error |
| `CHAT_003` | 400 | Message too long | Show character limit |
| `CHAT_004` | 403 | User blocked you | Disable input, show notice |
| `CHAT_005` | 403 | You blocked this user | Show unblock option |
| `CHAT_006` | 400 | Message empty | Disable send button |
| `CHAT_007` | 403 | Match unmatched | Disable input, show notice |
| `CHAT_008` | 429 | Message rate limit | Show cooldown |
| `CHAT_009` | 400 | Invalid attachment type | Show allowed types |
| `CHAT_010` | 413 | Attachment too large | Show size limit |
| `CHAT_011` | 403 | Links not allowed yet | Show time restriction |
| `CHAT_012` | 403 | Message contains blocked content | Show warning |
| `CHAT_013` | 403 | Chat restricted (safety review) | Show notice |
| `CHAT_014` | 404 | Message not found | Ignore |
| `CHAT_015` | 403 | Cannot delete this message | Show error |

---

## Upload Errors (UPLOAD_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `UPLOAD_001` | 400 | No file provided | Show error |
| `UPLOAD_002` | 400 | Invalid file type | Show allowed types |
| `UPLOAD_003` | 413 | File too large | Show size limit |
| `UPLOAD_004` | 400 | Image dimensions invalid | Show requirements |
| `UPLOAD_005` | 400 | Image corrupted | Request re-upload |
| `UPLOAD_006` | 403 | Image contains prohibited content | Show warning |
| `UPLOAD_007` | 400 | Too many files | Show limit |
| `UPLOAD_008` | 500 | Upload failed, try again | Retry with backoff |
| `UPLOAD_009` | 400 | No face detected in photo | Request different photo |
| `UPLOAD_010` | 400 | Multiple faces detected | Request single-person photo |

---

## Verification Errors (VERIFY_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `VERIFY_001` | 400 | Verification already complete | Show badge |
| `VERIFY_002` | 400 | Verification pending review | Show status |
| `VERIFY_003` | 400 | Selfie doesn't match profile | Allow retry |
| `VERIFY_004` | 400 | Face not clearly visible | Show tips, retry |
| `VERIFY_005` | 400 | Wrong pose | Show correct pose, retry |
| `VERIFY_006` | 429 | Too many verification attempts | Show cooldown |
| `VERIFY_007` | 400 | ID verification failed | Contact support option |
| `VERIFY_008` | 400 | ID document expired | Request valid ID |
| `VERIFY_009` | 400 | ID document unreadable | Request clearer photo |
| `VERIFY_010` | 400 | ID doesn't match profile info | Contact support |

---

## Report Errors (REPORT_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `REPORT_001` | 400 | Already reported this user | Show previous report status |
| `REPORT_002` | 429 | Report limit reached | Show cooldown |
| `REPORT_003` | 400 | Invalid report category | Show categories |
| `REPORT_004` | 400 | Cannot report yourself | Show error |
| `REPORT_005` | 404 | User to report not found | Show error |
| `REPORT_006` | 400 | Report details too long | Show limit |
| `REPORT_007` | 400 | Invalid evidence format | Show requirements |

---

## Rate Limit Errors (RATE_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `RATE_001` | 429 | Too many requests | Show retry timer |
| `RATE_002` | 429 | API rate limit exceeded | Exponential backoff |
| `RATE_003` | 429 | Too many login attempts | Show lockout timer |
| `RATE_004` | 429 | Too many password resets | Show cooldown |
| `RATE_005` | 429 | Too many verification requests | Show cooldown |

### Rate Limit Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704326400
Retry-After: 300
```

---

## Validation Errors (VAL_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `VAL_001` | 400 | Required field missing | Highlight field |
| `VAL_002` | 400 | Invalid email format | Show format hint |
| `VAL_003` | 400 | Invalid phone format | Show format hint |
| `VAL_004` | 400 | Invalid date format | Show format hint |
| `VAL_005` | 400 | Field too short | Show minimum length |
| `VAL_006` | 400 | Field too long | Show maximum length |
| `VAL_007` | 400 | Invalid characters | Show allowed characters |
| `VAL_008` | 400 | Invalid UUID format | Log error |
| `VAL_009` | 400 | Invalid enum value | Show allowed values |
| `VAL_010` | 400 | Invalid coordinates | Request location again |

### Validation Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "code": "VAL_002",
        "message": "Invalid email format"
      },
      {
        "field": "name",
        "code": "VAL_005",
        "message": "Name must be at least 2 characters"
      }
    ]
  }
}
```

---

## System Errors (SYS_)

| Code | HTTP | Message | Frontend Action |
|------|------|---------|-----------------|
| `SYS_001` | 500 | Internal server error | Show generic error, retry |
| `SYS_002` | 503 | Service temporarily unavailable | Show maintenance message |
| `SYS_003` | 500 | Database error | Show generic error, report |
| `SYS_004` | 500 | External service error | Show retry option |
| `SYS_005` | 500 | Configuration error | Report to admin |
| `SYS_006` | 408 | Request timeout | Retry with backoff |
| `SYS_007` | 500 | Unexpected error | Show generic error, report |

---

## Implementation Guide

### Backend: Error Throwing

```javascript
// utils/errors.js
class AppError extends Error {
  constructor(code, message, httpStatus = 400, details = null) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

// Error codes constant
const ErrorCodes = {
  AUTH_001: { status: 401, message: 'Invalid email or password' },
  AUTH_002: { status: 401, message: 'Token expired' },
  AUTH_003: { status: 401, message: 'Token invalid' },
  // ... all codes
};

// Usage
throw new AppError('AUTH_001', ErrorCodes.AUTH_001.message, ErrorCodes.AUTH_001.status);
```

### Backend: Error Handler Middleware

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log error internally
  console.error(`[${err.code || 'UNKNOWN'}] ${err.message}`, {
    path: req.path,
    userId: req.user?.id,
    stack: err.stack
  });

  // Don't expose internal errors to client
  if (!err.code || err.code.startsWith('SYS_')) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Something went wrong. Please try again.'
      }
    });
  }

  return res.status(err.httpStatus || 400).json({
    success: false,
    error: {
      code: err.code,
      message: err.message,
      details: err.details
    }
  });
};
```

### Frontend: Error Handler

```javascript
// services/errorHandler.js
import { Alert } from 'react-native';
import { authStore } from '../store/auth';
import { navigationRef } from '../navigation';

const errorHandlers = {
  // Auth errors requiring logout
  AUTH_003: () => authStore.logout(),
  AUTH_004: () => authStore.logout(),
  AUTH_005: () => authStore.logout(),
  AUTH_006: () => {
    Alert.alert('Security Alert', 'Unusual activity detected. Please login again.');
    authStore.logout();
  },
  
  // Auth errors requiring refresh
  AUTH_002: () => authStore.refreshToken(),
  
  // Account status errors
  AUTH_007: (error) => navigationRef.navigate('AccountSuspended', { error }),
  AUTH_008: (error) => navigationRef.navigate('AccountBanned', { error }),
  
  // Verification required
  AUTH_009: () => navigationRef.navigate('VerifyEmail'),
  AUTH_010: () => navigationRef.navigate('VerifyPhone'),
  
  // Rate limits
  RATE_001: (error) => showRateLimitToast(error),
  RATE_002: (error) => showRateLimitToast(error),
  
  // Default: show error message
  default: (error) => Alert.alert('Error', error.message)
};

export function handleApiError(error) {
  const handler = errorHandlers[error.code] || errorHandlers.default;
  return handler(error);
}
```

### Frontend: API Interceptor

```javascript
// services/api.js
import axios from 'axios';
import { handleApiError } from './errorHandler';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const errorData = error.response?.data?.error || {
      code: 'SYS_001',
      message: 'Connection error'
    };
    
    // Handle auth token refresh automatically
    if (errorData.code === 'AUTH_002' && !error.config._retry) {
      error.config._retry = true;
      try {
        await authStore.refreshToken();
        return api(error.config);
      } catch (refreshError) {
        // Refresh failed
      }
    }
    
    handleApiError(errorData);
    return Promise.reject(errorData);
  }
);

export default api;
```

---

## Testing Error Codes

### Unit Test Template

```javascript
describe('Error Codes', () => {
  describe('AUTH_001 - Invalid credentials', () => {
    it('should return AUTH_001 for wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });
      
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_001');
    });
    
    it('should return AUTH_001 for unknown email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unknown@test.com', password: 'password' });
      
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_001');
    });
  });
  
  describe('RATE_001 - Rate limit', () => {
    it('should return RATE_001 after exceeding limit', async () => {
      // Make requests up to limit
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/v1/users/nearby');
      }
      
      // Next request should fail
      const res = await request(app).get('/api/v1/users/nearby');
      
      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_001');
      expect(res.headers['retry-after']).toBeDefined();
    });
  });
});
```

---

## Error Code Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial error code dictionary |

---

## Quick Reference

### Most Common Errors

| Code | When You'll See It |
|------|-------------------|
| `AUTH_002` | Access token expired (auto-refresh) |
| `VAL_001` | Missing required form field |
| `RATE_001` | Too many API calls |
| `SWIPE_006` | Daily swipe limit |
| `CHAT_008` | Sending messages too fast |

### Error Codes to Always Handle

```javascript
const criticalErrors = [
  'AUTH_003', // Token invalid - logout
  'AUTH_006', // Token reuse - security alert
  'AUTH_007', // Account suspended
  'AUTH_008', // Account banned
  'SYS_002',  // Service unavailable
];
```

---

**Related Documents:**
- [BLUEPRINT_AND_ROADMAP.md](./BLUEPRINT_AND_ROADMAP.md)
- [AUTHENTICATION.md](./AUTHENTICATION.md)
- [SAFETY_AND_ABUSE_MODEL.md](./SAFETY_AND_ABUSE_MODEL.md)
