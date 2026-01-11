# JJ-Meet Database Schema

> **Last Updated:** January 2026  
> **Database:** PostgreSQL 14+ with PostGIS extension  
> **Migrations:** 17 files in `backend/migrations/`

## Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";     -- Geospatial queries
```

---

## Tables Overview

| # | Table | Migration | Purpose |
|---|-------|-----------|---------|
| 1 | `users` | 001, 010 | User accounts & profiles |
| 2 | `swipes` | 002, 011 | Swipe actions (like/pass) |
| 3 | `matches` | 003 | Mutual likes |
| 4 | `messages` | 004 | Chat messages |
| 5 | `reviews` | 005 | User ratings/reviews |
| 6 | `trips` | 006 | Travel plans |
| 7 | `refresh_tokens` | 007 | Auth token rotation |
| 8 | `blocks` | 008 | User blocks |
| 9 | `reports` | 009 | Abuse reports |

---

## 1. users

Primary table for user accounts and profiles.

```sql
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               VARCHAR UNIQUE NOT NULL,
  phone               VARCHAR UNIQUE,
  password            VARCHAR NOT NULL,
  name                VARCHAR NOT NULL,
  birth_date          DATE NOT NULL,
  gender              ENUM('male', 'female', 'other'),
  bio                 TEXT(500),
  user_type           ENUM('tourist', 'local', 'both') DEFAULT 'both',
  is_guide            BOOLEAN DEFAULT true,
  has_car             BOOLEAN DEFAULT false,
  has_motorcycle      BOOLEAN DEFAULT false,
  speaks_english      BOOLEAN DEFAULT false,  -- Added in 010
  speaks_local        BOOLEAN DEFAULT false,  -- Added in 010
  flexible_schedule   BOOLEAN DEFAULT false,  -- Added in 010
  photos              TEXT[],
  profile_photo       VARCHAR,
  languages           TEXT[],
  interests           TEXT[],
  rating              FLOAT DEFAULT 0,
  rating_count        INTEGER DEFAULT 0,
  is_verified         BOOLEAN DEFAULT false,
  email_verified      BOOLEAN DEFAULT false,
  phone_verified      BOOLEAN DEFAULT false,
  location            GEOGRAPHY(POINT, 4326),
  city                VARCHAR,
  country             VARCHAR,
  last_active         TIMESTAMP DEFAULT NOW(),
  last_location_update TIMESTAMP,             -- Added in 010
  is_active           BOOLEAN DEFAULT true,
  preferences         JSON DEFAULT '{}',
  max_distance        INTEGER DEFAULT 50,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX users_location_gist_idx ON users USING GIST(location);  -- Added in 010
```

### Notes
- `location` uses PostGIS geography for accurate distance calculations
- `user_type` defaults to 'both' (all users can be travelers and guides)
- `preferences` JSON field for flexible profile extensions

---

## 2. swipes

Tracks user swipe actions.

```sql
CREATE TABLE swipes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  swiped_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  direction   ENUM('like', 'pass', 'super_like') NOT NULL,
  is_seen     BOOLEAN DEFAULT false,  -- Added in 011
  created_at  TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(swiper_id, swiped_id)
);

-- Indexes
CREATE INDEX idx_swipes_swiper_created ON swipes(swiper_id, created_at);
CREATE INDEX idx_swipes_swiped_direction ON swipes(swiped_id, direction);
CREATE INDEX swipes_unseen_idx ON swipes(swiped_id, is_seen) WHERE is_seen = false;  -- Added in 011
```

### Notes
- Unique constraint prevents duplicate swipes
- `is_seen` enables "new likes" badge feature
- Partial index for efficient unseen queries

---

## 3. matches

Stores mutual likes between users.

```sql
CREATE TABLE matches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  matched_at        TIMESTAMP DEFAULT NOW(),
  is_active         BOOLEAN DEFAULT true,
  last_interaction  TIMESTAMP,
  
  UNIQUE(user1_id, user2_id)
);

-- Indexes
CREATE INDEX idx_matches_user1_active ON matches(user1_id, is_active);
CREATE INDEX idx_matches_user2_active ON matches(user2_id, is_active);
```

### Notes
- `is_active` allows soft-delete (unmatch)
- `last_interaction` updated on new messages

---

## 4. messages

Chat messages within matches.

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT,
  attachment_url  VARCHAR,
  attachment_type ENUM('image', 'location', 'audio'),
  is_read         BOOLEAN DEFAULT false,
  read_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_match_created ON messages(match_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

---

## 5. reviews

User reviews and ratings.

```sql
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  is_guide_review BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(reviewer_id, reviewed_id)
);

-- Indexes
CREATE INDEX idx_reviews_reviewed_rating ON reviews(reviewed_id, rating);
```

### Notes
- One review per user pair
- `is_guide_review` distinguishes guide-specific ratings

---

## 6. trips

Travel plans for trip-aware discovery.

```sql
CREATE TABLE trips (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  destination_geom    GEOMETRY(Point, 4326),
  destination_name    VARCHAR(255) NOT NULL,
  destination_country VARCHAR(100),
  destination_city    VARCHAR(100),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  description         TEXT,
  travel_style        VARCHAR(50),
  is_active           BOOLEAN DEFAULT true,
  is_public           BOOLEAN DEFAULT true,
  preferences         JSONB DEFAULT '{}',
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX idx_trips_active ON trips(is_active);
CREATE INDEX idx_trips_destination_gist ON trips USING GIST(destination_geom);
```

### Notes
- `destination_geom` uses PostGIS for spatiotemporal matching
- `travel_style` values: adventure, relaxed, cultural, nightlife, foodie, budget, luxury
- GiST index enables fast `ST_DWithin` queries

---

## 7. refresh_tokens

Secure token rotation and device tracking.

```sql
CREATE TABLE refresh_tokens (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  device_id      UUID NOT NULL,
  device_name    VARCHAR(255),
  platform       VARCHAR(20),
  token_hash     VARCHAR(64) NOT NULL,
  family_id      UUID NOT NULL,
  status         VARCHAR(20) DEFAULT 'active',
  expires_at     TIMESTAMP NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  last_used_at   TIMESTAMP DEFAULT NOW(),
  used_at        TIMESTAMP,
  revoked_at     TIMESTAMP,
  revoked_reason VARCHAR(50),
  ip_address     VARCHAR(45),
  user_agent     TEXT
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_status ON refresh_tokens(status);
CREATE INDEX idx_refresh_tokens_device ON refresh_tokens(device_id);
```

### Notes
- `family_id` enables token rotation detection
- `status` values: active, used, revoked, expired
- See `docs/AUTHENTICATION.md` for rotation logic

---

## 8. blocks

User blocking for safety.

```sql
CREATE TABLE blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  blocked_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason      VARCHAR(100),
  created_at  TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(blocker_id, blocked_id)
);

-- Indexes
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);
```

### Notes
- Bidirectional exclusion from discovery
- Indexed for fast filtering in swipe queries

---

## 9. reports

Abuse reporting and moderation.

```sql
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reported_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason       VARCHAR(100) NOT NULL,
  description  TEXT,
  status       VARCHAR(20) DEFAULT 'pending',
  reviewed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes  TEXT,
  action_taken VARCHAR(50),
  created_at   TIMESTAMP DEFAULT NOW(),
  reviewed_at  TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported ON reports(reported_id);
CREATE INDEX idx_reports_status ON reports(status);
```

### Notes
- `status` workflow: pending → reviewed → actioned
- `action_taken` values: warning, temporary_ban, permanent_ban, dismissed

---

## Entity Relationship Diagram

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  users  │──1:M─│ swipes  │      │  trips  │
└────┬────┘      └─────────┘      └────┬────┘
     │                                  │
     │ 1:M                         1:M  │
     ▼                                  │
┌─────────┐                            │
│ matches │◄───────────────────────────┘
└────┬────┘        (discovery context)
     │
     │ 1:M
     ▼
┌──────────┐
│ messages │
└──────────┘

┌─────────┐      ┌─────────┐      ┌─────────┐
│ reviews │      │ blocks  │      │ reports │
└─────────┘      └─────────┘      └─────────┘
     ▲                ▲                ▲
     │                │                │
     └────────────────┴────────────────┘
              All reference users
```

---

## Migration History

| # | File | Description |
|---|------|-------------|
| 001 | `001_create_users_table.js` | Users + PostGIS setup |
| 002 | `002_create_swipes_table.js` | Swipe actions |
| 003 | `003_create_matches_table.js` | Mutual matches |
| 004 | `004_create_messages_table.js` | Chat messages |
| 005 | `005_create_reviews_table.js` | Reviews/ratings |
| 006 | `006_create_trips_table.js` | Travel plans |
| 007 | `007_create_refresh_tokens_table.js` | Token rotation |
| 008 | `008_create_blocks_table.js` | User blocking |
| 009 | `009_create_reports_table.js` | Abuse reports |
| 010 | `010_add_missing_user_fields.js` | User characteristics + GiST |
| 011 | `011_add_swipes_is_seen.js` | New likes badge |
| 012 | `012_add_user_moderation_fields.js` | Shadow ban + ban fields |
| 013 | `013_create_verification_tokens.js` | Email verification tokens |
| 014 | `014_add_guide_profile_fields.js` | Guide specialties, availability, rate |
| 015 | `015_create_meeting_locations.js` | Meeting locations + proposals |
| 016 | `016_create_emergency_contacts.js` | Emergency contacts + meeting shares |
| 017 | `017_create_moderation_logs.js` | Moderation action logging |

---

## Running Migrations

```bash
cd backend

# Apply all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Check migration status
npx knex migrate:status
```

---

## Performance Notes

### Hot Queries (optimized)
1. **Discovery** - `ST_DWithin(users.location, ?, 50km)` → GiST index
2. **Match list** - `matches WHERE user_id = ? AND is_active` → Compound index
3. **Trip overlap** - `ST_DWithin(trips.destination_geom, ?)` → GiST index
4. **Unseen likes** - `swipes WHERE is_seen = false` → Partial index

### Size Estimates (10K users, 1 year)
| Table | Rows | Size |
|-------|------|------|
| users | 10K | ~5 MB |
| swipes | 500K | ~50 MB |
| matches | 25K | ~3 MB |
| messages | 200K | ~100 MB |
| trips | 15K | ~2 MB |
| **Total** | — | **~160 MB** |
