# Matching Logic — JJ-Meet

This document defines the conceptual and technical matching logic
used by JJ-Meet, a travel-oriented dating application.

The goal is to explain **how matching differs from standard dating apps**
and to provide a clear foundation for implementation and iteration.

---

## 1. Core Difference from Traditional Dating Apps

### Traditional Dating Apps
- Match based on:
  - Current location
  - Static preferences
- Assumption:
  - Users are co-located now

### JJ-Meet
- Match based on:
  - Current location OR future location
  - Time overlap
  - Mode (Traveler / Local Guide)

**Key Insight**
> A match is only meaningful if two users are in the same place
> at the same time (now or in the future).

---

## 2. Matching Dimensions

### 2.1 Spatial Dimension
- Stored using PostGIS geography types
- Queries use radius-based search (e.g., ST_DWithin)

Examples:
- Nearby locals within X km
- Travelers arriving within a city boundary

### 2.2 Temporal Dimension
Each user may have:
- Current presence
- One or more future trips

A valid match requires **date overlap**.

Example:
- User A: Taipei (Jan 10–15)
- User B: Taipei (Jan 12–20)
→ Overlap exists → eligible

### 2.3 Mode Dimension
Users operate in one of two modes:
- Traveler mode
- Local guide mode

Matching rules may differ:
- Traveler ↔ Local (guide intent)
- Traveler ↔ Traveler (companionship)
- Local ↔ Local (optional / low priority)

---

## 3. High-Level Matching Flow

1. User opens discovery screen
2. System determines active context:
   - Current location OR selected future trip
3. Spatial query retrieves candidate users
4. Temporal filtering removes non-overlapping users
5. Safety filters applied (blocks, reports, bans)
6. Results ranked and returned

---

## 4. Simplified Pseudocode

```pseudo
candidates = geoQuery(center, radius)

for user in candidates:
    if not timeOverlap(currentUser, user):
        skip
    if isBlocked(currentUser, user):
        skip
    if not modeCompatible(currentUser, user):
        skip

rank(user)
