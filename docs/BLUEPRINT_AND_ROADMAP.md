# JJ-Meet Blueprint & Development Roadmap 🗺️

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Active Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Implementation Status](#2-current-implementation-status)
3. [Architecture Overview](#3-architecture-overview)
4. [Development Roadmap](#4-development-roadmap)
5. [Testing Strategy](#5-testing-strategy)
6. [Bug Fixing Methodology](#6-bug-fixing-methodology)
7. [Code Standards & Conventions](#7-code-standards--conventions)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Quick Reference Commands](#9-quick-reference-commands)

---

## 1. Project Overview

### 1.1 Vision
JJ-Meet is a travel-oriented dating app connecting travelers with local guides and fellow explorers through location-based matching.

### 1.2 Core Features
| Feature | Priority | Status |
|---------|----------|--------|
| User Authentication | P0 | ✅ Backend Ready |
| Profile Management | P0 | ✅ Backend Ready |
| Location-based Discovery | P0 | 🔄 In Progress |
| Swipe Matching | P0 | ✅ Backend Ready |
| Real-time Chat | P0 | ✅ Backend Ready |
| Local Guide Mode | P1 | 🔄 In Progress |
| Transportation Display | P1 | ✅ Schema Ready |
| Safety & Verification | P1 | ⏳ Pending |
| Reviews & Ratings | P2 | ✅ Schema Ready |

### 1.3 Non-Goals (Explicitly Out of Scope)

> **Important:** These items are intentionally excluded from current scope to prevent scope creep.

| Feature | Status | Rationale |
|---------|--------|----------|
| Voice/Video Calling | Phase 6+ | Complexity, infrastructure cost |
| In-app Payments | Phase 6+ | Regulatory compliance required |
| AI Matchmaking | Post-MVP | Requires data collection first |
| Web Application | Post-MVP | Mobile-first strategy |
| Group Matching | Not Planned | Out of core use case |
| Social Media Integration | Phase 5+ | Privacy concerns |
| Cryptocurrency Payments | Not Planned | Regulatory risk |
| Desktop App | Not Planned | Mobile-first focus |

**Why This Matters:**
- Prevents feature creep during development
- Keeps team focused on core value proposition
- Enables faster MVP delivery
- Can be revisited after successful launch

### 1.4 Target Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Backend** | Node.js + Express | REST API |
| **Database** | PostgreSQL + PostGIS | Geospatial queries |
| **Real-time** | Socket.io + Redis Adapter | Required for scaling |
| **Auth** | JWT + bcrypt | Access + Refresh tokens |
| **Cache** | Redis | Sessions + Geo cache |
| **Storage** | Cloudinary | Images |
| **Frontend** | React Native + Expo | SDK 50+ |
| **Navigation** | Expo Router | File-based routing, auto deep links |
| **UI Kit** | Tamagui or RN Paper | Don't build from scratch |
| **Styling** | NativeWind (Tailwind RN) | Familiar syntax |
| **State** | Context → Redux Toolkit | Start simple |
| **Data Fetching** | TanStack Query | Caching + sync |

#### Why Expo Router over React Navigation?

| Feature | Expo Router | React Navigation |
|---------|-------------|------------------|
| Deep linking | Automatic | Manual config |
| File structure | Intuitive (like Next.js) | Config-heavy |
| Web support | Built-in | Extra setup |
| Typed routes | Automatic | Manual |

```javascript
// Expo Router file structure
app/
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── swipe.tsx
│   ├── matches.tsx
│   └── profile.tsx
├── chat/[matchId].tsx    ← Deep link: jjmeet://chat/123
└── _layout.tsx
```

---

## 2. Current Implementation Status

### 2.1 Backend ( ~70% Complete)
### 2.1 Backend (✅ ~70% Complete)

```
backend/
├── src/
│   ├── server.js           ✅ Complete
│   ├── config/             ✅ Complete
│   ├── controllers/
│   │   └── auth.controller.js  ✅ Complete
│   ├── middleware/
│   │   ├── auth.js         ✅ Complete
│   │   └── errorHandler.js ✅ Complete
│   ├── models/             🔄 Needs expansion
│   ├── routes/
│   │   ├── auth.routes.js    ✅ Complete
│   │   ├── user.routes.js    ✅ Complete
│   │   ├── swipe.routes.js   ✅ Complete
│   │   ├── match.routes.js   ✅ Complete
│   │   └── message.routes.js ✅ Complete
│   └── socket/
│       └── socketHandlers.js ✅ Complete
└── migrations/
    ├── 001_create_users_table.js    ✅
    ├── 002_create_swipes_table.js   ✅
    ├── 003_create_matches_table.js  ✅
    ├── 004_create_messages_table.js ✅
    └── 005_create_reviews_table.js  ✅
```

**What's Missing in Backend:**
- [ ] Controllers for swipe, match, message, user (only inline handlers exist)
- [ ] ⚠️ **Service layer abstraction** (BLOCKING: Must complete before Phase 2)
- [ ] Input sanitization middleware
- [ ] File upload handling (Cloudinary integration)
- [ ] Email verification service
- [ ] Push notification service
- [ ] Unit tests
- [ ] API documentation (Swagger/OpenAPI)

### 2.2 Frontend (⚠️ Requires Migration)

**Current State:** React Web (Vite + Tailwind)  
**Target State:** React Native + Expo

```
frontend/src/
├── App.jsx              ✅ Routing logic (needs migration)
├── pages/
│   ├── LandingPage.jsx  ✅ (Web only)
│   ├── Login.jsx        ✅ → Screen
│   ├── Register.jsx     ✅ → Screen
│   ├── Swipe.jsx        ✅ → Screen
│   ├── Matches.jsx      ✅ → Screen
│   ├── Chat.jsx         ✅ → Screen
│   ├── Profile.jsx      ✅ → Screen
│   └── Settings.jsx     ✅ → Screen
├── services/            ✅ Reusable (minor changes)
├── store/               ✅ Reusable
└── components/          🔄 Needs RN conversion
```

### 2.3 Database Schema Status

```sql
-- Tables Created:
✅ users        -- Full user profile with PostGIS location
✅ swipes       -- Swipe history (like/pass/superlike)
✅ matches      -- Mutual matches
✅ messages     -- Chat messages
✅ reviews      -- User ratings/reviews

-- Tables Needed:
⏳ trips         -- 🌍 CRITICAL: Future travel plans (Traveler Mode)
⏳ reports       -- Safety reports
⏳ blocks        -- User blocks
⏳ notifications -- Push notification queue
⏳ verifications -- ID/photo verification
⏳ refresh_tokens -- Token rotation (see AUTHENTICATION.md)
```

---

## 3. Architecture Overview

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│                 (React Native + Expo Router)                      │
├─────────────────────────────────────────────────────────────────┤
│  Screens  │  Expo Router  │  Redux/Context  │  TanStack Query  │
└──────┬─────┴──────┬───────┴────────┬────────┴────────┬─────────┘
       │             │                │                 │
       ▼             ▼                ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                 │
│         REST API (Express) + WebSocket (Socket.io + Redis)        │
├──────────────────────────────────────────────────────────────────┤
│  Auth  │  Users  │  Swipes  │  Matches  │  Messages  │  Trips  │
└────┬───┴────┬────┴────┬─────┴─────┬─────┴─────┬──────┴───┬────┘
      │          │         │           │           │          │
      ▼          ▼         ▼           ▼           ▼          ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                  │
├─────────────────┬─────────────────────────┬──────────────────────┤
│   PostgreSQL    │           Redis           │      Cloudinary      │
│   + PostGIS     │  Sessions + Geo + Pub/Sub │       (Images)       │
└─────────────────┴─────────────────────────┴──────────────────────┘
```

### 3.2 Socket.io Redis Adapter (⚠️ REQUIRED for Scaling)

> **Problem:** When you scale to multiple server instances, Socket.io breaks.
> Client connects to Server A, but their match is on Server B → messages don't arrive.

```javascript
// socket/socketHandlers.js - MUST implement before production
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### 3.3 PostGIS Indexing Strategy

```sql
-- REQUIRED: GiST index for fast geo queries
CREATE INDEX users_location_idx ON users USING GIST (location);
CREATE INDEX trips_dest_idx ON trips USING GIST (destination_geom);

-- Query example: Find users within 50km
SELECT * FROM users 
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(-73.935242, 40.730610)::geography,
  50000  -- meters
);
```

### 3.4 Guide vs Dating Profile (Flexible Schema)

> **Problem:** Guides need different fields than daters (languages, rates, favorite spots)
> **Solution:** Use `jsonb` column for flexible profile extensions

```sql
-- In users table (already exists)
ALTER TABLE users ADD COLUMN profile_details JSONB DEFAULT '{}';

-- Guide profile example
UPDATE users SET profile_details = '{
  "is_guide": true,
  "languages": ["English", "Japanese", "Mandarin"],
  "rate": {"type": "free", "currency": null, "amount": null},
  "favorite_spots": ["Shibuya Crossing", "Senso-ji Temple"],
  "availability": ["weekends", "evenings"]
}'::jsonb WHERE id = 'guide-user-id';

-- Dater profile example  
UPDATE users SET profile_details = '{
  "is_guide": false,
  "looking_for": "local_guide",
  "travel_style": "adventure",
  "budget": "mid-range"
}'::jsonb WHERE id = 'dater-user-id';
```

### 3.5 Folder Structure (Target)

```
jj-meet/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment config
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models/queries
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── routes/          # API routes
│   │   ├── socket/          # WebSocket handlers
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Entry point
│   ├── migrations/          # Database migrations
│   ├── seeds/               # Test data
│   └── tests/               # Backend tests
│
├── frontend/                # React Native + Expo
│   ├── src/
│   │   ├── screens/         # Screen components
│   │   ├── components/      # Reusable UI components
│   │   ├── navigation/      # React Navigation config
│   │   ├── services/        # API service calls
│   │   ├── store/           # Redux store & slices
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Helper functions
│   │   └── constants/       # App constants
│   ├── assets/              # Images, fonts
│   └── __tests__/           # Frontend tests
│
└── docs/                    # Documentation
    ├── BLUEPRINT_AND_ROADMAP.md
    ├── API.md
    └── CONTRIBUTING.md
```

### 3.6 Data Flow

```
User Action → Screen → Service → API → Controller → Service → Model → DB
                ↑                                                    │
                └──────────────── Response ←─────────────────────────┘
```

---

## 4. Development Roadmap

### Phase 0: Foundation (Current) ✅
**Duration:** Completed  
**Goal:** Basic infrastructure

- [x] Backend server setup
- [x] Database schema design
- [x] Authentication system
- [x] Basic API routes
- [x] Web frontend prototype

### Phase 1: React Native Migration 🔄
**Duration:** 3-4 weeks (solo dev: 4 weeks)  
**Goal:** Convert web app to mobile

> ⚠️ **Reality Check:** React Web → React Native is NOT copy-paste.
> - `<div>` → `<View>`
> - CSS → StyleSheet/NativeWind
> - React Router → Expo Router
> - Web APIs → Native modules

| Task | Priority | Est. Time |
|------|----------|-----------|
| Initialize Expo project + Expo Router | P0 | 1 day |
| Setup UI Kit (Tamagui/RN Paper) | P0 | 1 day |
| Setup NativeWind | P0 | 1 day |
| Migrate auth screens (Login/Register) | P0 | 3 days |
| Migrate Swipe screen | P0 | 4 days |
| Migrate Matches screen | P0 | 2 days |
| Migrate Chat screen | P0 | 3 days |
| Migrate Profile screen | P0 | 3 days |
| Migrate Settings screen | P1 | 2 days |
| Setup push notifications (Expo) | P1 | 2 days |
| **Basic verification (social link)** | P0 | 2 days |

**Checklist:**
- [ ] Create new Expo project with Expo Router
- [ ] Configure `app.config.js` (not app.json for dynamic config)
- [ ] Install UI kit (Tamagui recommended)
- [ ] Setup NativeWind for Tailwind syntax
- [ ] Port services layer (update base URLs)
- [ ] Port Redux store (works as-is)
- [ ] Convert each screen component
- [ ] Implement native features (camera, location)
- [ ] ⚠️ **Require Instagram/social link at signup** (low-tech safety)

### ⚠️ BLOCKING: Service Layer Requirement

> **Before starting Phase 2, the Service Layer MUST be implemented.**

**Why This is Blocking:**
- Swipe/Match/Chat have complex business logic
- Controllers should not contain business logic
- Services enable proper unit testing
- Technical debt compounds quickly without this

**Service Layer Rules:**
```
┌─────────────────────────────────────────────────────────────┐
│  CONTROLLER RESPONSIBILITY (≤50 lines)                       │
│  ─────────────────────────────────────                       │
│  • Parse request parameters                                  │
│  • Call service method                                       │
│  • Return response                                           │
│  • NO business logic                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SERVICE RESPONSIBILITY                                      │
│  ──────────────────────                                      │
│  • All business logic                                        │
│  • Database operations via models                            │
│  • External API calls                                        │
│  • Independently testable                                    │
└─────────────────────────────────────────────────────────────┘
```

**Required Services:**
- [ ] `auth.service.js` - Authentication logic
- [ ] `user.service.js` - User management
- [ ] `swipe.service.js` - Swipe & discovery logic
- [ ] `match.service.js` - Match creation & management
- [ ] `message.service.js` - Chat operations
- [ ] `upload.service.js` - File upload handling

---

### Phase 1.5: Location Engine 🌍 (THE BRIDGE)
**Duration:** 1-2 weeks  
**Goal:** Travel-specific location logic
**Prerequisites:** ✅ Phase 1 Complete

> **Why This Phase Exists:**
> Standard dating apps: "Show users within X km of me NOW"
> JJ-Meet: "Show users where I AM now OR where I'm GOING next week"

| Task | Priority | Est. Time |
|------|----------|-----------|
| Background geolocation setup | P0 | 2 days |
| Redis geo-spatial cache | P0 | 2 days |
| Trips table + migration | P0 | 1 day |
| "I'm going to..." UI flow | P0 | 2 days |
| Traveler matching algorithm | P0 | 3 days |
| Location permission UX | P1 | 1 day |

#### The "Teleport" / Trip Mode

```
┌─────────────────────────────────────────────────────────────┐
│           TRAVELER MATCHING LOGIC                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   User A (in New York) wants to see:                        │
│                                                             │
│   1. People CURRENTLY in New York          ← Standard       │
│   2. People COMING TO New York soon        ← Trip Mode      │
│   3. Locals in Tokyo (User A going there)  ← Teleport       │
│                                                             │
│   SQL Logic:                                                │
│   WHERE                                                     │
│     (UserB.location NEAR UserA.location)                    │
│     OR (UserB.location NEAR UserA.trip_destination          │
│         AND UserA.trip_dates OVERLAP UserB.availability)    │
│     OR (UserB.trip_destination NEAR UserA.location          │
│         AND UserB.trip_dates OVERLAP now)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Trips Table Schema

```sql
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    destination_geom GEOMETRY(Point, 4326),  -- City center
    destination_name VARCHAR(255),            -- "Tokyo, Japan"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,                         -- "Looking for food tour guide"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for finding people coming to a specific area
CREATE INDEX trips_dest_idx ON trips USING GIST (destination_geom);
CREATE INDEX trips_dates_idx ON trips (start_date, end_date);
CREATE INDEX trips_user_idx ON trips (user_id);
```

#### Redis Write-Behind Pattern (Battery + Server Saver)

```
┌─────────────────────────────────────────────────────────────┐
│           LOCATION UPDATE STRATEGY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ❌ DON'T: Update PostgreSQL on every GPS tick              │
│      - Kills battery                                        │
│      - Overloads database                                   │
│                                                             │
│   ✅ DO: Write-Behind Pattern                                │
│                                                             │
│   Mobile App                                                │
│       │                                                     │
│       │ Every movement                                      │
│       ▼                                                     │
│   Redis (GEOADD)  ←── Real-time geo queries here            │
│       │                                                     │
│       │ Every 5-10 minutes (batch)                          │
│       ▼                                                     │
│   PostgreSQL      ←── Permanent storage                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```javascript
// Redis geo commands for nearby users
await redis.geoadd('user_locations', longitude, latitude, odegen);
const nearby = await redis.georadius('user_locations', lng, lat, 50, 'km');
```

---

### Phase 2: Core Features Polish + Safety 🛡️
**Duration:** 2-3 weeks  
**Goal:** Complete MVP functionality + Core Safety
**Prerequisites:** ✅ Service Layer Complete, ✅ Phase 1.5 Complete

> ⚠️ **Safety is P0 for Travel Apps.** If a traveler feels unsafe meeting
> a local in a foreign country, the app dies. Moved from Phase 3.

| Task | Priority | Est. Time |
|------|----------|-----------|
| **Selfie verification (AWS Rekognition)** | P0 | 3 days |
| **Report user system** | P0 | 2 days |
| **Block user system** | P0 | 1 day |
| Image upload (Cloudinary) | P0 | 2 days |
| Real-time chat completion | P0 | 3 days |
| Swipe animations | P1 | 2 days |
| Profile photo management | P1 | 2 days |
| Local guide toggle | P1 | 1 day |
| Transportation badges | P2 | 1 day |

### Phase 3: Trust & Polish
**Duration:** 2 weeks  
**Goal:** Enhanced trust features

| Task | Priority | Est. Time |
|------|----------|-----------|
| Email verification | P0 | 2 days |
| Phone verification | P1 | 2 days |
| Review/rating system | P1 | 2 days |
| Guide-specific profile fields | P1 | 2 days |
| Meeting location suggestions | P1 | 2 days |
| Emergency contact feature | P2 | 1 day |

### Phase 4: Enhancement & Optimization
**Duration:** 2 weeks  
**Goal:** Polish and performance

| Task | Priority | Est. Time |
|------|----------|-----------|
| Performance optimization | P1 | 3 days |
| Offline support | P2 | 2 days |
| Analytics integration | P2 | 1 day |
| Error tracking (Sentry) | P1 | 1 day |
| Localization (i18n) | P2 | 2 days |
| Accessibility | P2 | 2 days |

### Phase 5: Launch Preparation
**Duration:** 1-2 weeks  
**Goal:** Production ready

| Task | Priority | Est. Time |
|------|----------|-----------|
| Security audit | P0 | 2 days |
| Load testing | P1 | 2 days |
| App store assets | P0 | 2 days |
| Privacy policy/ToS | P0 | 1 day |
| CI/CD pipeline | P1 | 2 days |
| Production deployment | P0 | 2 days |

---

## 5. Testing Strategy

### 5.1 Testing Pyramid

```
        ┌───────────┐
        │   E2E     │  ← Few, critical paths only
        │  Tests    │
       ─┴───────────┴─
      ┌───────────────┐
      │  Integration  │  ← API & component tests
      │    Tests      │
     ─┴───────────────┴─
    ┌───────────────────┐
    │    Unit Tests     │  ← Many, fast tests
    │                   │
    └───────────────────┘
```

### 5.2 Backend Testing

**Framework:** Jest + Supertest

**Test Categories:**
```
backend/tests/
├── unit/
│   ├── controllers/     # Controller logic tests
│   ├── services/        # Business logic tests
│   ├── middleware/      # Middleware tests
│   └── utils/           # Utility function tests
├── integration/
│   ├── auth.test.js     # Auth flow tests
│   ├── users.test.js    # User API tests
│   ├── swipes.test.js   # Swipe API tests
│   ├── matches.test.js  # Match API tests
│   └── messages.test.js # Message API tests
└── fixtures/
    └── testData.js      # Mock data
```

**Example Test Structure:**
```javascript
// backend/tests/integration/auth.test.js
describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {});
    it('should reject invalid email format', async () => {});
    it('should reject duplicate email', async () => {});
    it('should hash password before storing', async () => {});
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {});
    it('should reject invalid password', async () => {});
    it('should return JWT token on success', async () => {});
  });
});
```

**Run Backend Tests:**
```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch         # Watch mode
npm test -- auth.test.js    # Specific file
```

### 5.3 Frontend Testing

**Framework:** Vitest + React Native Testing Library

**Test Categories:**
```
frontend/__tests__/
├── unit/
│   ├── components/      # Component unit tests
│   ├── hooks/           # Custom hook tests
│   ├── utils/           # Utility function tests
│   └── store/           # Redux slice tests
├── integration/
│   ├── screens/         # Screen integration tests
│   └── navigation/      # Navigation flow tests
└── e2e/
    └── flows/           # Critical user flows
```

**Example Test Structure:**
```javascript
// frontend/__tests__/unit/components/SwipeCard.test.js
describe('SwipeCard', () => {
  it('should render user profile information', () => {});
  it('should trigger onSwipeLeft callback', () => {});
  it('should trigger onSwipeRight callback', () => {});
  it('should display distance correctly', () => {});
});
```

**Run Frontend Tests:**
```bash
cd frontend
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch         # Watch mode
```

### 5.4 Test Coverage Requirements

| Category | Minimum Coverage |
|----------|------------------|
| Controllers | 80% |
| Services | 90% |
| Utils | 95% |
| Components | 70% |
| Screens | 60% |
| Redux Slices | 85% |

### 5.5 Pre-Commit Test Checklist

Before every commit:
- [ ] All unit tests pass
- [ ] No linting errors
- [ ] New code has tests
- [ ] Coverage not decreased

---

## 6. Bug Fixing Methodology

### 6.1 Bug Triage Process

```
┌─────────────────────────────────────────────────────────────┐
│                    BUG REPORTED                              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: REPRODUCE                                           │
│  - Get exact steps to reproduce                              │
│  - Note environment (device, OS, version)                    │
│  - Check if reproducible consistently                        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: CLASSIFY                                            │
│  - P0 (Critical): App crash, data loss, security             │
│  - P1 (High): Feature broken, blocks user                    │
│  - P2 (Medium): Feature partially broken                     │
│  - P3 (Low): Cosmetic, minor inconvenience                   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: ISOLATE                                             │
│  - Frontend or Backend?                                      │
│  - Which component/module?                                   │
│  - Which function/line?                                      │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: ROOT CAUSE                                          │
│  - Add debug logging                                         │
│  - Check recent changes (git blame/log)                      │
│  - Write failing test                                        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: FIX                                                 │
│  - Make minimal change to fix root cause                     │
│  - Avoid workarounds                                         │
│  - Update/add tests                                          │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: VERIFY                                              │
│  - Run test suite                                            │
│  - Manual verification                                       │
│  - Check for regressions                                     │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Bug Report Template

```markdown
## Bug Report

**Title:** [Brief description]

**Severity:** P0 / P1 / P2 / P3

**Environment:**
- Device: [e.g., iPhone 14, Samsung Galaxy S23]
- OS: [e.g., iOS 17.2, Android 14]
- App Version: [e.g., 1.0.0]
- Backend Version: [e.g., 1.0.0]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots/Logs:**
[Attach if available]

**Additional Context:**
[Any other relevant information]
```

### 6.3 Debugging Commands

**Backend Debugging:**
```bash
# Check logs
cd backend
npm run dev                    # Watch mode with logs

# Database debugging
npx knex migrate:status        # Check migration status
npx knex migrate:rollback      # Rollback last migration

# Test specific endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

**Frontend Debugging:**
```bash
# Start with debugging
cd frontend
npx expo start --clear         # Clear cache and start

# Check logs
npx expo start                 # Then press 'j' for debugger

# Reset everything
rm -rf node_modules
rm -rf .expo
npm install
npx expo start --clear
```

### 6.4 Common Issues & Solutions

#### Issue: API Connection Failed
```
Error: Network request failed
```
**Solution:**
1. Check backend is running: `curl http://localhost:5000/health`
2. Check CORS settings in `server.js`
3. For mobile: Use machine IP instead of `localhost`
4. Check `.env` file has correct `API_URL`

#### Issue: Database Connection Error
```
Error: ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify connection string in `.env`
3. Check database exists: `psql -l`
4. Run migrations: `npm run db:migrate`

#### Issue: JWT Token Invalid
```
Error: jwt malformed / invalid signature
```
**Solution:**
1. Clear app storage/AsyncStorage
2. Check `JWT_SECRET` matches between environments
3. Check token expiration settings
4. Verify token is being sent in `Authorization` header

#### Issue: Location Permission Denied
```
Error: Location permission not granted
```
**Solution:**
1. Check `app.json` has location permissions
2. Ensure user granted permission
3. Test on physical device (not simulator for GPS)
4. Add fallback for denied permissions

#### Issue: Socket Connection Failed
```
Error: WebSocket connection failed
```
**Solution:**
1. Check Socket.io server is running
2. Verify `SOCKET_URL` in frontend config
3. Check firewall/proxy settings
4. Ensure authentication token is valid

### 6.5 Git Workflow for Bug Fixes

```bash
# 1. Create bug fix branch
git checkout -b fix/bug-description

# 2. Make changes and test
npm test

# 3. Commit with conventional format
git commit -m "fix: resolve [issue description]

- Root cause: [explanation]
- Solution: [what was changed]
- Tested: [how it was verified]

Fixes #[issue-number]"

# 4. Push and create PR
git push origin fix/bug-description
```

---

## 7. Code Standards & Conventions

### 7.1 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `SwipeCard.jsx` |
| Files (utilities) | camelCase | `formatDate.js` |
| Files (routes) | kebab-case | `auth.routes.js` |
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE | `MAX_PHOTOS` |
| Functions | camelCase | `getUserById` |
| Components | PascalCase | `ProfileHeader` |
| Database tables | snake_case | `user_profiles` |
| Database columns | snake_case | `created_at` |
| API endpoints | kebab-case | `/api/user-profile` |

### 7.2 File Structure Pattern

**Backend Controller:**
```javascript
// controllers/user.controller.js
const userService = require('../services/user.service');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
```

**Backend Service:**
```javascript
// services/user.service.js
const db = require('../config/database');

exports.findById = async (id) => {
  return db('users').where({ id }).first();
};
```

**Frontend Screen:**
```javascript
// screens/ProfileScreen.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services';

export default function ProfileScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <View>
      <Text>{data.name}</Text>
    </View>
  );
}
```

### 7.3 API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### 7.4 Git Commit Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructure
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(auth): add email verification flow
fix(chat): resolve message ordering issue
docs(api): update endpoint documentation
refactor(swipe): extract card component
test(auth): add login integration tests
```

---

## 8. Deployment Strategy

### 8.1 Environments

| Environment | Purpose | Backend URL | Database |
|-------------|---------|-------------|----------|
| Local | Development | localhost:5000 | Local PostgreSQL |
| Staging | Testing | staging-api.jjmeet.com | Staging DB |
| Production | Live | api.jjmeet.com | Production DB |

### 8.2 Backend Deployment (Railway/Render)

```yaml
# railway.toml or render.yaml
services:
  - name: jj-meet-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - NODE_ENV=production
      - DATABASE_URL=<from_secrets>
      - JWT_SECRET=<from_secrets>
```

### 8.3 Mobile Deployment (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for testing
eas build --platform all --profile preview

# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 8.4 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm ci
      - run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm ci
      - run: cd frontend && npm test

  deploy:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to production"
```

---

## 9. Quick Reference Commands

### 9.1 Development

```bash
# Start backend
cd backend && npm run dev

# Start frontend (Expo)
cd frontend && npx expo start

# Run all tests
cd backend && npm test
cd frontend && npm test

# Database
cd backend
npm run db:migrate          # Run migrations
npm run db:rollback         # Rollback
npm run db:seed             # Seed data
```

### 9.2 Debugging

```bash
# Check backend health
curl http://localhost:5000/health

# View backend logs
cd backend && npm run dev

# Clear Expo cache
cd frontend && npx expo start --clear

# Reset node_modules
rm -rf node_modules && npm install
```

### 9.3 Git

```bash
# Feature branch
git checkout -b feat/feature-name

# Bug fix branch
git checkout -b fix/bug-description

# Update from main
git fetch origin && git rebase origin/main
```

### 9.4 Build & Deploy

```bash
# Build mobile app (preview)
cd frontend && eas build --profile preview

# Build mobile app (production)
cd frontend && eas build --profile production

# Submit to app stores
cd frontend && eas submit
```

---

## API Versioning Strategy

### Current Version: v1

All API endpoints MUST be versioned:

```
✅ /api/v1/auth/login
✅ /api/v1/users/nearby
✅ /api/v1/swipes

❌ /api/auth/login      (NO - unversioned)
❌ /auth/login          (NO - missing /api prefix)
```

### Versioning Rules

| Version | Purpose | Breaking Changes |
|---------|---------|------------------|
| v1 | MVP features | N/A (initial) |
| v2 | Future | Only when absolutely necessary |

### When to Increment Version

**DO increment (v1 → v2):**
- Removing an endpoint
- Changing response structure
- Changing required parameters
- Changing authentication method

**DON'T increment:**
- Adding new endpoints
- Adding optional parameters
- Adding new response fields
- Bug fixes

### Deprecation Policy

1. Announce deprecation 3 months before removal
2. Return `Deprecation` header with sunset date
3. Log usage of deprecated endpoints
4. Remove after sunset date

```javascript
// Deprecation header example
res.set('Deprecation', 'true');
res.set('Sunset', 'Sat, 01 Jun 2026 00:00:00 GMT');
res.set('Link', '</api/v2/users>; rel="successor-version"');
```

---

## Observability & Monitoring

### Key Metrics to Track

| Category | Metric | Alert Threshold |
|----------|--------|----------------|
| **Auth** | Login success rate | < 95% |
| **Auth** | Token refresh failure rate | > 5% |
| **Matching** | Match creation success rate | < 99% |
| **Chat** | Message delivery latency | > 2s p95 |
| **Chat** | Message delivery success rate | < 99.9% |
| **API** | Error rate (5xx) | > 1% |
| **API** | Response time p95 | > 500ms |

### Logging Standards

```javascript
// Structured logging format
{
  "timestamp": "2026-01-04T12:00:00Z",
  "level": "info",
  "service": "jj-meet-api",
  "traceId": "abc123",
  "userId": "user-uuid",
  "action": "swipe",
  "duration": 45,
  "success": true
}
```

### Future: Feature Flags

For gradual rollouts (Phase 4+):

```javascript
// Feature flag check
const flags = {
  LOCAL_GUIDE_MODE: { enabled: true, percentage: 100 },
  NEW_MATCHING_ALGO: { enabled: true, percentage: 10 },
  PHOTO_VERIFICATION: { enabled: false, percentage: 0 },
};

function isFeatureEnabled(flag, userId) {
  const feature = flags[flag];
  if (!feature?.enabled) return false;
  if (feature.percentage === 100) return true;
  return hashUserId(userId) % 100 < feature.percentage;
}
```

---

## Appendix A: Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/jjmeet

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# External APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-google-maps-key
```

---

## Appendix B: API Endpoints Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/auth/profile | Get profile | Yes |
| PATCH | /api/auth/profile | Update profile | Yes |
| GET | /api/users/nearby | Get nearby users | Yes |
| GET | /api/users/:id | Get user by ID | Yes |
| POST | /api/swipes | Record swipe | Yes |
| GET | /api/matches | Get matches | Yes |
| GET | /api/matches/:id | Get match details | Yes |
| POST | /api/messages | Send message | Yes |
| GET | /api/messages/:matchId | Get chat history | Yes |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Jan 2026 | Team | Initial blueprint |

---

**Next Steps:**
1. Complete Phase 1: React Native Migration
2. Set up testing infrastructure
3. Complete missing backend controllers
4. Begin Phase 2: Core Features Polish
