# Matching Logic — JJ-Meet

> **Last Updated:** January 2026  
> **Implementation:** `backend/src/services/swipe.service.js` → `getTripAwareDiscovery()`, `calculateMatchScore()`

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

### Design Philosophy Note

JJ-Meet intentionally avoids heavy interest-based or language-based filtering to **preserve serendipity** in travel encounters. Matching prioritizes feasibility, timing, and safety, while leaving chemistry to human interaction.

---

## 2. Matching Dimensions

### 2.1 Spatial Dimension
- Stored using PostGIS geography types
- Queries use radius-based search (e.g., ST_DWithin)

**Radius Strategy:**

| Purpose | Radius | Notes |
|---------|--------|-------|
| Discovery (fetch) | 50km | Ensures sufficient candidate pool |
| Rank boost | <10km | Strongly favored in ranking |
| Meeting confidence | <5km | "High chance to meet" indicator |

> While a default radius of 50km is used for initial candidate retrieval, ranking strongly favors closer proximity to encourage realistic meetups.

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
```

---

## 5. Context Resolution (Now vs Future) 🕒📍

Matching in JJ-Meet is **context-dependent**.
A user may exist in multiple spatial–temporal contexts, but **only one is active at a time**.

### 5.1 Active Context Selection

At discovery time, the system resolves exactly **one active context**:

| Priority | Context                          |
| -------- | -------------------------------- |
| 1        | User-selected future trip        |
| 2        | Current physical location        |
| 3        | Default home location (fallback) |

```ts
ActiveContext {
  location: GeographyPoint
  startDate: Date
  endDate: Date
  source: "current" | "trip" | "fallback"
}
```

> This prevents ambiguous matching (e.g. appearing in two cities simultaneously).

---

## 6. Time-Overlap Matching Rules 📆

### 6.1 Overlap Definition

Two users are considered temporally compatible if:

```text
max(startA, startB) ≤ min(endA, endB)
```

### 6.2 Minimum Overlap Threshold

To avoid low-quality matches, JJ-Meet enforces:

| Scenario            | Minimum Overlap     |
| ------------------- | ------------------- |
| Traveler ↔ Local    | ≥ 1 day             |
| Traveler ↔ Traveler | ≥ 2 days            |
| Local ↔ Local       | ≥ 0 days (optional) |

> This prevents “passing-by” matches with no realistic chance to meet.

---

## 7. Mode Compatibility Logic 🧭✈️

Matching is **intent-aware**, not intent-exclusive.

### 7.1 Compatibility Matrix

| Viewer Mode | Candidate Mode           | Allowed | Priority          |
| ----------- | ------------------------ | ------- | ----------------- |
| Traveler    | Local Guide              | ✅       | High              |
| Traveler    | Traveler                 | ✅       | Medium            |
| Traveler    | Local Guide (Unverified) | ⚠️      | Reduced           |
| Local Guide | Traveler                 | ✅       | High              |
| Local Guide | Local Guide              | ⚠️      | Low               |
| Any         | Same mode only           | ❌       | (optional toggle) |

### 7.2 Mode Is a Ranking Signal

Mode compatibility affects **ranking**, not eligibility:

```ts
modeWeight ∈ [0.2 – 1.0]
```

This allows flexibility without fragmenting the user pool.

---

## 8. Ranking Factors (Conceptual) 📊

After filtering, candidates are ranked using a weighted score.

```ts
finalScore =
  baseScore
  × distanceWeight
  × timeOverlapWeight
  × modeWeight
  × activityWeight
  × safetyWeight
  × urgencyWeight
  × guideQualityWeight  // Local Guides only
```

### 8.1 Distance Weight

| Distance | Weight |
| -------- | ------ |
| < 2 km   | 1.0    |
| 2–10 km  | 0.8    |
| 10–30 km | 0.5    |
| > 30 km  | 0.2    |

### 8.2 Time Overlap Weight

| Overlap Duration | Weight |
| ---------------- | ------ |
| ≥ 7 days         | 1.0    |
| 3–6 days         | 0.8    |
| 1–2 days         | 0.5    |

### 8.3 Urgency-Aware Ranking ⏰

JJ-Meet prioritizes matches with **imminent real-world overlap**. This ensures time-sensitive opportunities are surfaced early.

Travel is inherently time-sensitive. Static feasibility is not enough—**dynamic urgency** matters.

```ts
daysUntilOverlap = max(overlapStartDate - today, 0)

urgencyWeight = 1 / (daysUntilOverlap + 1)
```

| Days Until Overlap | Urgency Weight |
| ------------------ | -------------- |
| 0 (today)          | 1.0            |
| 1 (tomorrow)       | 0.5            |
| 7 days             | 0.125          |
| 30 days            | 0.032          |

**Impact:**
- Arriving tomorrow → almost always ranked first
- A month out → still eligible, but doesn't steal exposure

> Urgency affects **ranking only**, not eligibility. Serendipity is preserved.

### 8.4 Guide Quality Weight (Local Guides Only) 🏅

For Local Guide mode users, a soft quality signal ensures **baseline reliability** without turning JJ-Meet into a marketplace.

```ts
guideQualityWeight = clamp(
  (positiveReviews * 0.1) +
  (responseRate * 0.3) +
  (verificationBonus),
  0.5,
  1.2
)
```

| Factor             | Weight Contribution |
| ------------------ | ------------------- |
| Positive reviews   | +0.1 per review     |
| Response rate      | +0.3 × rate         |
| Verified local     | +0.2 bonus          |

> Guide quality is used only to ensure baseline reliability, not to optimize commercial outcomes.

---

## 9. Safety & Trust Filters 🛡️

Before ranking, the system applies **hard safety exclusions**:

* Blocked users
* Mutually reported users
* Banned or shadow-banned users
* Under review (critical flags)

### 9.1 Safety Weight

```ts
safetyWeight = {
  verifiedUser: 1.0
  unverified: 0.7
  newAccount: 0.5
  flagged: 0.0
}
```

> Safety signals always override engagement optimization.

---

## 10. Deferred Matching (Match Later) 🔮

Travel plans change. JJ-Meet captures **potential future matches** even when current timing doesn't align.

### 10.1 Problem

- No current overlap → system skips the user
- But travel plans are fluid and may change

### 10.2 Solution: Deferred Candidates Pool

```ts
if (spatialMatch && !timeOverlap) {
  saveToFutureCandidates(userA, userB)
}
```

When either user:
- Modifies their trip dates
- Enters the overlap window

→ System sends notification / unlocks matching

### 10.3 Trigger Conditions

| Event                      | Action                          |
| -------------------------- | ------------------------------- |
| User updates trip dates    | Re-evaluate deferred candidates |
| Overlap window begins      | Notify both users               |
| User enters city           | Surface deferred matches        |

> This makes matching feel intelligent while keeping logic clean.

---

## 11. Multi-City Trip Awareness 🗺️

JJ-Meet maintains **single active context** for matching (see §5). However, secondary overlap signals can enhance the user experience.

### 11.1 Principle

- Does **not** affect core matching or ranking
- Does **not** mix into the swipe pool
- Used only for **hints and future possibilities**

### 11.2 Secondary Overlap Definition

```ts
SecondaryOverlap {
  city: string
  startDate: Date
  daysUntil: number
}
```

### 11.3 Example

> "You won't overlap now, but you'll both be in Osaka in 6 days."

### 11.4 UX Applications

- Display in profile footer
- Add to "Match Later" queue
- Show as future trip badge

> This is a **product layer enhancement**, not matching core logic.

---

## 12. Meeting Feasibility Score (Display Only) 🎯

A trust signal shown to users to set realistic expectations. **Does not affect ranking.**

### 12.1 Input Factors

- Distance between users
- Overlap duration (days)
- Urgency (days until overlap)

### 12.2 Output (Semantic Levels)

| Level    | Display             |
| -------- | ------------------- |
| High     | "High chance to meet"     |
| Moderate | "Moderate chance"         |
| Low      | "Low chance"              |

> Never show numeric scores. Use semantic labels only.

### 12.3 Purpose

- Builds user trust
- Sets realistic expectations
- Encourages action on high-feasibility matches

---

## 13. Cold Start & Fairness Handling ❄️⚖️

To avoid starvation:

* New users receive a temporary **exploration boost**
* High-activity users are slightly dampened
* Previously unseen profiles are prioritized

```ts
if user.isNew && impressions < threshold:
  boost += 0.3
```

---

## 14. Non-Goals (Explicit)

The matching system does **not**:

* Guarantee meetings
* Optimize for conversion to offline behavior
* Prioritize monetization over safety
* Act as a booking or tour marketplace

JJ-Meet enables **discovery**, not transactions.

---

## 15. Design Philosophy Summary

> JJ-Meet matching is **spatiotemporal**, **intent-aware**, and **safety-first**.
> Matches are generated only when real-world meetings are realistically possible.