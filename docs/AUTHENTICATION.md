# JJ-Meet Authentication Deep Dive 🔐
This document defines authentication and session behavior.
Storage implementation details may vary by platform.

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Token Architecture](#2-token-architecture)
3. [Token Lifecycle](#3-token-lifecycle)
4. [Refresh Token Rotation](#4-refresh-token-rotation)
5. [Multi-Device Strategy](#5-multi-device-strategy)
6. [Token Theft Mitigation](#6-token-theft-mitigation)
7. [Mobile Token Storage](#7-mobile-token-storage)
8. [Implementation Guide](#8-implementation-guide)
9. [Security Checklist](#9-security-checklist)
10. [Auth Error Codes Reference](#10-auth-error-codes-reference)

---

## 1. Overview

### 1.1 Authentication Goals

| Goal | Description |
|------|-------------|
| **Security** | Protect user accounts from unauthorized access |
| **UX** | Seamless login experience, minimal re-authentication |
| **Multi-device** | Support multiple devices per user |
| **Recovery** | Clear path when tokens are compromised |

### 1.2 Auth Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Mobile App                    Backend                          │
│   ──────────                    ───────                          │
│       │                             │                            │
│       │  POST /api/v1/auth/login    │                            │
│       │  {email, password}          │                            │
│       │────────────────────────────▶│                            │
│       │                             │ Validate credentials       │
│       │                             │ Generate tokens            │
│       │                             │ Store refresh token        │
│       │◀────────────────────────────│                            │
│       │  {accessToken, refreshToken}│                            │
│       │                             │                            │
│       │  Store in SecureStore       │                            │
│       │                             │                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Token Architecture

### 2.1 Token Types

| Token | Purpose | Lifetime | Storage |
|-------|---------|----------|---------|
| **Access Token** | API authorization | 15 minutes | Memory only |
| **Refresh Token** | Obtain new access token | 30 days | SecureStore only |
| **Device ID** | Identify device | Permanent | SecureStore |

> ⚠️ **Why Access Token is Memory Only:**
> - SecureStore is async + requires native bridge = performance cost on every API call
> - Access tokens are short-lived (15 min), no need to persist
> - On app restart, access token is reissued via refresh token
> - This is the industry standard approach (OAuth 2.0 best practices)

### 2.2 Access Token Structure (JWT)

```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "user-uuid",           // User ID
  "iat": 1704326400,            // Issued at
  "exp": 1704327300,            // Expires (15 min)
  "type": "access",
  "deviceId": "device-uuid"     // Device identifier
}

// Signature
HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

### 2.3 Refresh Token Structure

```javascript
// Stored in database, NOT a JWT
{
  "id": "refresh-token-uuid",
  "userId": "user-uuid",
  "deviceId": "device-uuid",
  "deviceName": "iPhone 14 Pro",
  "tokenHash": "sha256-hash",   // Hashed token value
  "familyId": "family-uuid",    // For rotation detection
  "expiresAt": "2026-02-04",
  "createdAt": "2026-01-04",
  "lastUsedAt": "2026-01-04",
  "isRevoked": false
}
```

### 2.4 Why This Architecture?

| Decision | Reason |
|----------|--------|
| Short access token | Limits damage window if stolen |
| Long refresh token | Better UX, less frequent login |
| Refresh in DB | Can revoke, track, rotate |
| Device binding | Detect token theft across devices |

---

## 3. Token Lifecycle

### 3.1 Complete Lifecycle Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     TOKEN LIFECYCLE                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────┐     ┌─────────────┐     ┌─────────────┐                 │
│  │  LOGIN  │────▶│ ACTIVE      │────▶│ EXPIRED     │                 │
│  └─────────┘     │ (15 min)    │     │ (Access)    │                 │
│                  └──────┬──────┘     └──────┬──────┘                 │
│                         │                   │                         │
│                         │ API Calls         │ Refresh                 │
│                         ▼                   ▼                         │
│                  ┌─────────────┐     ┌─────────────┐                 │
│                  │   SUCCESS   │     │  REFRESH    │                 │
│                  │   200 OK    │     │  New tokens │                 │
│                  └─────────────┘     └──────┬──────┘                 │
│                                             │                         │
│                         ┌───────────────────┴───────────────────┐    │
│                         ▼                                       ▼    │
│                  ┌─────────────┐                         ┌──────────┐│
│                  │   SUCCESS   │                         │  LOGOUT  ││
│                  │ Continue    │                         │  Revoke  ││
│                  └─────────────┘                         └──────────┘│
│                                                                       │
│  FAILURE STATES:                                                      │
│  ───────────────                                                      │
│  • Refresh expired (30 days) → Force re-login                        │
│  • Refresh revoked           → Force re-login + security alert       │
│  • Token reuse detected      → Revoke family + force re-login        │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Token Expiration Strategy

| Scenario | Action |
|----------|--------|
| Access token expired | Silent refresh using refresh token |
| Refresh token expired | Redirect to login |
| Refresh token revoked | Redirect to login + show security alert |
| User inactive 30+ days | Require re-login |

> **Important:** Access tokens are **never** refreshed or extended.
> Only refresh tokens can issue new access tokens.

### 3.3 Auto-Refresh Implementation

```javascript
// Frontend: API interceptor pattern
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newTokens = await refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        await logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 4. Refresh Token Rotation

### 4.1 What is Token Rotation?

Every time a refresh token is used, it is **invalidated** and a **new one** is issued. This limits the window for stolen token abuse.

### 4.2 Rotation Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                  REFRESH TOKEN ROTATION                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   Request:                          Response:                         │
│   ────────                          ─────────                         │
│   POST /api/v1/auth/refresh         {                                 │
│   {                                   accessToken: "new-jwt",         │
│     refreshToken: "token-A"           refreshToken: "token-B" ← NEW   │
│   }                                 }                                 │
│                                                                       │
│   Server Actions:                                                     │
│   ───────────────                                                     │
│   1. Validate token-A exists and not revoked                         │
│   2. ⚠️ Verify refreshToken.deviceId === request.deviceId            │
│   3. Mark token-A as USED (not deleted yet)                          │
│   4. Generate token-B with same familyId                             │
│   5. Return new tokens                                                │
│   6. After grace period (30s), delete token-A                        │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.3 Token Family (Theft Detection)

All refresh tokens from the same login session share a `familyId`. If a **used** token is presented again, the entire family is revoked.

> ⚠️ **Device Binding Requirement:**
> The refresh request **MUST** include `deviceId`. The server **MUST** verify that:
> - `refreshToken.deviceId === request.deviceId`
> 
> Otherwise, treat as token theft. This prevents an attacker who steals only
> the refresh token from using it on a different device.

> ⚠️ **Grace Period Concurrency Protection:**
> The 30-second grace period can cause race conditions (network retries, etc.).
> 
> **Protection Rule:** Only ONE active refresh request is allowed per device.
> Concurrent refresh requests must be rejected with `AUTH_CONCURRENT_REFRESH`.
> 
> **Implementation:** Use Redis lock `refresh:{deviceId}` or DB transaction.

> 📋 **Refresh Token Idle Timeout:**
> If a refresh token has not been used for **14 days**, it may be revoked
> during cleanup. This prevents "zombie devices" from accumulating.

```
┌────────────────────────────────────────────────────────────────────┐
│               TOKEN THEFT DETECTION                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   NORMAL FLOW:                                                      │
│   ────────────                                                      │
│   Login → Token-A (family: X)                                       │
│   Refresh → Token-B (family: X) ← Token-A marked used              │
│   Refresh → Token-C (family: X) ← Token-B marked used              │
│   ✅ All good                                                       │
│                                                                     │
│   THEFT DETECTED:                                                   │
│   ───────────────                                                   │
│   Attacker steals Token-A                                           │
│   User refreshes → Token-B (Token-A marked used)                    │
│   Attacker uses Token-A → ⚠️ REUSE DETECTED                        │
│                                                                     │
│   Response:                                                         │
│   1. Revoke ALL tokens in family X                                  │
│   2. Force logout on ALL devices                                    │
│   3. Send security alert to user                                    │
│   4. Log incident for security review                               │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 4.4 Database Schema for Rotation

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL,
  device_name VARCHAR(255),
  token_hash VARCHAR(64) NOT NULL,     -- SHA256 hash
  family_id UUID NOT NULL,             -- For theft detection
  status VARCHAR(20) DEFAULT 'active', -- active, used, revoked
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,                   -- When it was rotated
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(50)           -- logout, theft, admin
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

## 5. Multi-Device Strategy

### 5.1 Device Registration

Each device gets a unique `deviceId` on first launch, stored permanently.

```javascript
// On app first launch
const getOrCreateDeviceId = async () => {
  let deviceId = await SecureStore.getItemAsync('deviceId');
  
  if (!deviceId) {
    deviceId = uuid.v4();
    await SecureStore.setItemAsync('deviceId', deviceId);
  }
  
  return deviceId;
};
```

### 5.2 Device Tracking

| Field | Description |
|-------|-------------|
| `deviceId` | UUID generated on first launch |
| `deviceName` | User-friendly name (e.g., "iPhone 14") |
| `platform` | ios / android |
| `lastActive` | Last API call timestamp |
| `pushToken` | For push notifications |

### 5.3 Device Management API

```
GET    /api/v1/auth/devices        # List all devices
DELETE /api/v1/auth/devices/:id    # Logout specific device
DELETE /api/v1/auth/devices        # Logout all devices (except current)
```

### 5.4 Concurrent Session Limits

| User Type | Max Devices |
|-----------|-------------|
| Free | 3 |
| Premium | 10 |

When limit exceeded:
1. Show device list
2. Force user to remove a device
3. Or auto-remove oldest inactive device

### 5.5 Device Trust Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVICE TRUST LEVELS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   TRUSTED (Known Device)                                         │
│   ──────────────────────                                         │
│   • Has logged in before                                         │
│   • Full access to all features                                  │
│   • Normal token lifetime                                        │
│                                                                  │
│   NEW DEVICE                                                     │
│   ──────────                                                     │
│   • First login from this device                                 │
│   • Requires additional verification (email code)                │
│   • Shorter initial token lifetime (24h)                         │
│   • Notification sent to other devices                           │
│                                                                  │
│   SUSPICIOUS                                                     │
│   ──────────                                                     │
│   • Unusual location                                             │
│   • Multiple failed attempts                                     │
│   • Requires 2FA + email verification                            │
│   • Manual review flag                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Token Theft Mitigation

### 6.1 Prevention Measures

| Measure | Implementation |
|---------|----------------|
| HTTPS only | Force TLS in production |
| Secure storage | SecureStore (Keychain/Keystore) |
| Token rotation | New refresh token on each use |
| Device binding | Tokens tied to deviceId |
| Short access tokens | 15 min expiry |

### 6.2 Detection Signals

| Signal | Risk Level | Action |
|--------|------------|--------|
| Refresh token reuse | 🔴 Critical | Revoke family, force logout |
| New device login | 🟡 Medium | Email notification |
| Unusual location | 🟡 Medium | Additional verification |
| Rapid token refresh | 🟠 High | Rate limit, investigate |
| Multiple failed refreshes | 🟠 High | Temporary lockout |

### 6.3 Response Procedures

#### Token Reuse Detected (Critical)
```javascript
async function handleTokenReuse(familyId, userId) {
  // 1. Revoke all tokens in family
  await db('refresh_tokens')
    .where({ family_id: familyId })
    .update({ 
      status: 'revoked',
      revoked_at: new Date(),
      revoked_reason: 'theft_detected'
    });
  
  // 2. Log security incident
  await logSecurityIncident({
    type: 'TOKEN_REUSE',
    userId,
    familyId,
    severity: 'critical'
  });
  
  // 3. Notify user
  await sendSecurityAlert(userId, {
    type: 'suspicious_activity',
    message: 'We detected unusual activity. You have been logged out of all devices.',
    action: 'Please change your password.'
  });
  
  // 4. Force password reset (optional, based on policy)
  // await requirePasswordReset(userId);
}
```

#### Suspicious Device Login
```javascript
async function handleSuspiciousLogin(userId, deviceInfo, location) {
  // 1. Require additional verification
  const verificationCode = generateCode();
  await sendVerificationEmail(userId, verificationCode);
  
  // 2. Notify other devices
  await notifyOtherDevices(userId, {
    message: `New login attempt from ${deviceInfo.name} in ${location.city}`,
    action: 'Approve or deny'
  });
  
  // 3. Log for review
  await logSecurityIncident({
    type: 'SUSPICIOUS_LOGIN',
    userId,
    deviceInfo,
    location,
    severity: 'medium'
  });
}
```

### 6.4 User-Initiated Security Actions

| Action | Endpoint | Effect |
|--------|----------|--------|
| Change password | PATCH /api/v1/auth/password | Revoke all tokens |
| Logout all devices | DELETE /api/v1/auth/devices | Revoke all tokens |
| Report compromised | POST /api/v1/auth/report-compromised | Lock account, revoke tokens |

---

## 7. Mobile Token Storage

### 7.1 Storage Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                   MOBILE TOKEN STORAGE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐     ┌─────────────────┐                   │
│   │   SecureStore   │     │     Memory      │                   │
│   │   (Encrypted)   │     │   (Runtime)     │                   │
│   ├─────────────────┤     ├─────────────────┤                   │
│   │ • refreshToken  │     │ • accessToken   │                   │
│   │ • deviceId      │     │ • user object   │                   │
│   │ (backup: access)│     │                 │                   │
│   └─────────────────┘     └─────────────────┘                   │
│                                                                  │
│   WHY:                                                           │
│   ────                                                           │
│   • SecureStore = Keychain (iOS) / Keystore (Android)           │
│   • Hardware-backed encryption                                   │
│   • Survives app restart                                         │
│   • Memory = fastest access, cleared on app kill                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Expo SecureStore Implementation

```javascript
// services/tokenStorage.js
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'jjmeet_access_token',
  REFRESH_TOKEN: 'jjmeet_refresh_token',
  DEVICE_ID: 'jjmeet_device_id',
};

export const tokenStorage = {
  // Access Token
  async getAccessToken() {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },
  
  async setAccessToken(token) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },
  
  // Refresh Token
  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },
  
  async setRefreshToken(token) {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },
  
  // Device ID (permanent)
  async getDeviceId() {
    let deviceId = await SecureStore.getItemAsync(KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = generateUUID();
      await SecureStore.setItemAsync(KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  },
  
  // Clear all (logout)
  async clearAll() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    // ⚠️ DO NOT delete deviceId - intentionally persistent
    // Reasons:
    // 1. Detect device re-registration after reinstall
    // 2. Support device-based trust history
    // 3. Prevent attackers from resetting identity by reinstalling
  },
};
```

### 7.3 App Startup Auth Flow

```javascript
// App initialization
async function initializeAuth() {
  const accessToken = await tokenStorage.getAccessToken();
  const refreshToken = await tokenStorage.getRefreshToken();
  
  if (!refreshToken) {
    // No tokens - user must login
    return { isAuthenticated: false };
  }
  
  if (accessToken && !isTokenExpired(accessToken)) {
    // Valid access token - proceed
    return { isAuthenticated: true, accessToken };
  }
  
  // Access token missing or expired - try refresh
  try {
    const tokens = await refreshTokens(refreshToken);
    await tokenStorage.setAccessToken(tokens.accessToken);
    await tokenStorage.setRefreshToken(tokens.refreshToken);
    return { isAuthenticated: true, accessToken: tokens.accessToken };
  } catch (error) {
    // Refresh failed - user must login
    await tokenStorage.clearAll();
    return { isAuthenticated: false };
  }
}
```

### 7.4 Security Considerations

| Risk | Mitigation |
|------|------------|
| Jailbreak/Root | Detect and warn user (don't block) |
| Screen capture | Mark sensitive screens |
| Clipboard | Never copy tokens |
| Debug logs | Never log tokens |
| Backup | Exclude tokens from backup |

```javascript
// Prevent backup (app.json)
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSExcludeActivityFromBackup": true
      }
    }
  }
}
```

---

## 8. Implementation Guide

### 8.1 Backend Endpoints

```
POST   /api/v1/auth/register          # Create account
POST   /api/v1/auth/login             # Login, get tokens
POST   /api/v1/auth/refresh           # Refresh tokens
POST   /api/v1/auth/logout            # Logout current device
DELETE /api/v1/auth/logout-all        # Logout all devices
GET    /api/v1/auth/devices           # List logged-in devices
DELETE /api/v1/auth/devices/:id       # Logout specific device
POST   /api/v1/auth/verify-email      # Verify email
POST   /api/v1/auth/forgot-password   # Initiate password reset
POST   /api/v1/auth/reset-password    # Complete password reset
PATCH  /api/v1/auth/change-password   # Change password (logged in)
```

### 8.2 Login Request/Response

```javascript
// Request
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "securepassword",
  "deviceId": "device-uuid",
  "deviceName": "iPhone 14 Pro",
  "platform": "ios"
}

// Response (Success)
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "rt_abc123...",
    "expiresIn": 900  // seconds
  }
}

// Response (New Device - requires verification)
{
  "success": false,
  "error": {
    "code": "AUTH_NEW_DEVICE",
    "message": "New device detected. Check email for verification code."
  }
}
```

### 8.3 Refresh Request/Response

```javascript
// Request
POST /api/v1/auth/refresh
{
  "refreshToken": "rt_abc123...",
  "deviceId": "device-uuid"       // REQUIRED for device binding
}

// Response (Success)
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "rt_def456...",  // NEW token
    "expiresIn": 900
  }
}

// Response (Token Reuse Detected)
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_REUSE",
    "message": "Security alert: Token reuse detected. Please login again."
  }
}
```

### 8.4 Migration Steps

```sql
-- Migration: Add refresh_tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL,
  device_name VARCHAR(255),
  platform VARCHAR(20),
  token_hash VARCHAR(64) NOT NULL,
  family_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_status ON refresh_tokens(status);
```

---

## 9. Security Checklist

### 9.1 Pre-Launch Checklist

- [ ] **Tokens**
  - [ ] Access token lifetime ≤ 15 minutes
  - [ ] Refresh token lifetime ≤ 30 days
  - [ ] Refresh token rotation implemented
  - [ ] Token family tracking for theft detection
  - [ ] Tokens never logged

- [ ] **Storage**
  - [ ] Using SecureStore (not AsyncStorage)
  - [ ] Tokens excluded from backup
  - [ ] Memory cleared on logout

- [ ] **Transport**
  - [ ] HTTPS only in production
  - [ ] Certificate pinning (optional, advanced)
  - [ ] No tokens in URL parameters

- [ ] **API**
  - [ ] Rate limiting on auth endpoints
  - [ ] Account lockout after failed attempts
  - [ ] Password strength requirements
  - [ ] Email verification required

- [ ] **Monitoring**
  - [ ] Failed login attempts logged
  - [ ] Token reuse incidents alerted
  - [ ] New device logins notified

### 9.2 Security Incident Response

| Incident | Response Time | Action |
|----------|---------------|--------|
| Token reuse detected | Immediate | Auto-revoke, alert user |
| Mass failed logins | < 1 hour | Investigate, rate limit |
| User reports compromise | < 1 hour | Lock account, revoke tokens |
| Suspicious activity pattern | < 24 hours | Manual review |

---

## 10. Auth Error Codes Reference

See [ERROR_CODES.md](./ERROR_CODES.md) for complete error code dictionary.

| Code | Meaning | Frontend Action |
|------|---------|----------------|
| `AUTH_001` | Invalid credentials | Show error, clear form |
| `AUTH_002` | Token expired | Silent refresh |
| `AUTH_003` | Token invalid | Force logout |
| `AUTH_004` | Refresh token expired | Force re-login |
| `AUTH_005` | Account locked | Show lockout message |
| `AUTH_006` | Email not verified | Redirect to verification |
| `AUTH_007` | Device limit reached | Show device management |
| `AUTH_008` | New device detected | Request verification code |
| `AUTH_TOKEN_REUSE` | Token reuse detected | Force logout, security alert |
| `AUTH_DEVICE_MISMATCH` | Device ID doesn't match | Force logout, security alert |
| `AUTH_CONCURRENT_REFRESH` | Concurrent refresh rejected | Retry after delay |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Jan 2026 | Team | Initial specification |
| 1.1.0 | Jan 2026 | Team | Fixed access token storage, added device binding, concurrency protection |

---

**Related Documents:**
- [BLUEPRINT_AND_ROADMAP.md](./BLUEPRINT_AND_ROADMAP.md)
- [ERROR_CODES.md](./ERROR_CODES.md)
- [SAFETY_AND_ABUSE_MODEL.md](./SAFETY_AND_ABUSE_MODEL.md)
