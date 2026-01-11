# Architecture Decisions — JJ-Meet

> **Last Updated:** January 2026  
> **Related Docs:** [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md), [AUTHENTICATION.md](./AUTHENTICATION.md)

This document records the key architectural and product-engineering decisions
behind JJ-Meet. Its purpose is to clarify **why** certain designs were chosen,
what trade-offs were considered, and what is intentionally deferred.

This is a living document and should be updated when major decisions change.

---

## 1. Guiding Principles

### 1.1 MVP Survival > Feature Completeness
JJ-Meet is designed to reach a usable MVP with a small team.  
Decisions prioritize:
- Clear scope control
- Low operational complexity
- Ability to iterate quickly based on real users

Non-essential or high-risk features are explicitly deferred.

### 1.2 Safety Is a System Concern, Not a Feature
Because JJ-Meet combines **dating + travel**, safety is treated as a
cross-cutting concern affecting:
- Authentication
- Matching
- Chat
- Reporting & moderation

Even when features are deferred, safety **must be considered at design time**.

### 1.3 Location + Time Is the Core Differentiator
Unlike traditional dating apps, JJ-Meet’s core value comes from:
- Geospatial overlap
- Temporal overlap (future trips)

All architectural decisions around data modeling and caching reflect this.

---

## 2. Technology Stack Decisions

### 2.1 Backend: Node.js + Express
**Why chosen**
- Fast iteration speed
- Large ecosystem
- Familiar for small teams

**Trade-offs**
- Requires discipline (service layer) to avoid controller bloat
- Not ideal for CPU-heavy workloads (not required here)

### 2.2 Database: PostgreSQL + PostGIS
**Why chosen**
- Native geospatial queries (ST_DWithin, ST_Intersects)
- Strong consistency guarantees
- Mature tooling

**Decision**
PostGIS is mandatory for location-based discovery.  
No external geo service is used for core matching logic.

### 2.3 Redis

**Usage**
- Caching geo query results
- Socket.io scaling (pub/sub adapter)
- Rate limiting
- Session / refresh token storage
- Real-time presence

**Hosting Strategy**

| Environment | Provider | Rationale |
|-------------|----------|-----------|
| Local Dev | Docker (self-hosted) | Zero cost, debuggable, resettable |
| Production | Managed (Upstash) | High availability, low ops risk, global edge |

> Production Redis is hosted using a managed provider (e.g., Upstash) to ensure high availability and low operational risk. Local development uses a self-hosted Redis instance for parity.

**Why Managed for Production?**
- Dating + meeting → real-time reliability critical
- Auth / socket / presence → cannot tolerate downtime
- Small team → maintenance burden unacceptable
- Upstash: serverless-friendly, sleep-free, low latency at edge

### 2.4 Frontend: React Native (Expo)
**Why React Native**
- Shared codebase for iOS / Android
- Faster MVP delivery than native Swift/Kotlin

**Known Risks**
- Gesture handling (swipe UX)
- Background location behavior
- Native module limitations

**Mitigation**
- Early testing on real devices
- 20–30% time buffer in migration phase

---

## 3. Authentication & Session Strategy

### 3.1 JWT with Refresh Tokens
- Access Token: short-lived (minutes)
- Refresh Token: long-lived (days)

**Why**
- Limits damage if access token leaks
- Enables persistent login without re-authentication

**Design Note**
Refresh token expiration ≠ forced logout every X days.  
Tokens are rotated and extended on active use.

(See `AUTHENTICATION.md` for full details.)

---

## 4. Service Layer Requirement (Non-Negotiable)

### Decision
All business logic **must live in services**, not controllers.

**Rationale**
- Matching, swipe limits, safety checks, and travel logic are complex
- Controllers must remain thin and stateless
- Enables unit testing and future refactors

**Rule of Thumb**
- Controllers: request/response only
- Services: rules, validation, decisions

This is a blocking requirement before Phase 2 features.

---

## 5. Scope Control (Explicit Non-Goals)

The following are intentionally out of scope for MVP:

- Voice / video calls
- In-app payments or tipping
- AI-driven matchmaking
- Government ID verification

**Reason**
These introduce regulatory, privacy, and operational risks that
would delay launch without validating core demand.

---

## 6. Localization & Market Fit (Taiwan)

### Design-Time Considerations
Even if not implemented immediately, the system is designed to support:
- Traditional Chinese / English (i18n)
- Local transportation context
- Cultural expectations around respectful interaction

### Implementation Strategy
- Localization hooks exist early
- Actual translations and integrations are phased later

---

## 7. Observability & Risk Awareness

### What We Intentionally Monitor
- Authentication failures
- Match creation rate
- Message delivery latency
- Refresh token failures

### What We Accept for MVP
- Limited analytics
- Manual moderation fallback
- No automated abuse detection initially

---

## 8. Location Tracking Strategy

### Design Principle
JJ-Meet prioritizes **city-level spatial accuracy** over continuous fine-grained tracking to balance battery usage, privacy, and relevance.

### Context-Aware Location Updates

| State | Frequency | Purpose |
|-------|-----------|---------|
| App foreground | 20–30s | Discovery / real-time relevance |
| Background (active trip) | 5–10 min | Presence / overlap estimation |
| Idle / no trip | ❌ Stopped | No tracking |

### Event-Driven vs Interval-Driven

Prefer **event-driven** triggers over fixed intervals:
- App open / resume
- City-level movement detected
- Trip start / trip end
- Significant location change (>200–500m)

### Configuration Reference

```javascript
// Foreground
foregroundInterval = 20000–30000  // 20–30s

// Background (only if trip active)
backgroundInterval = 300000–600000  // 5–10 min

// Distance filter
distanceFilter = 200–500  // meters
```

**Why This Matters:**
- 30s continuous background = battery killer + iOS restrictions
- Users will delete app if battery drain is noticeable
- City-level matching doesn't need meter-level GPS precision

---

## 9. Revisit Criteria

This document should be revisited when:
- User base exceeds initial target region
- Monetization is introduced
- Safety incidents reveal new threat models
- Matching logic becomes a bottleneck

---
