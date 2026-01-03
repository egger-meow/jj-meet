# JJ-Meet Safety & Abuse Prevention Model 🛡️

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Specification  
> **Compliance:** Apple App Store Guidelines, Google Play Policies

---

## Table of Contents

1. [Overview](#1-overview)
2. [Threat Model](#2-threat-model)
3. [Prevention Measures](#3-prevention-measures)
4. [Detection Systems](#4-detection-systems)
5. [Response & Enforcement](#5-response--enforcement)
6. [Reporting System](#6-reporting-system)
7. [Admin Escalation Flow](#7-admin-escalation-flow)
8. [App Store Compliance](#8-app-store-compliance)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Overview

### 1.1 Safety Philosophy

JJ-Meet connects travelers with locals. This creates unique safety challenges:
- Users meeting strangers in unfamiliar locations
- Cross-cultural interactions
- Potential for tourism-targeted scams
- Physical safety concerns

**Our Commitment:** User safety is not a feature—it's a foundation.

### 1.2 Safety Goals

| Priority | Goal | Metric |
|----------|------|--------|
| P0 | Prevent physical harm | Zero incidents |
| P0 | Block explicit content | < 0.1% exposure |
| P0 | Stop financial scams | < 1% success rate |
| P1 | Reduce harassment | < 5% report rate |
| P1 | Fast response to reports | < 24h resolution |

### 1.3 Safety Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAFETY DEFENSE LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   LAYER 1: PREVENTION                                            │
│   ───────────────────                                            │
│   • Verification requirements                                    │
│   • Rate limiting                                                │
│   • Content filtering                                            │
│   • Behavioral restrictions                                      │
│                                                                  │
│   LAYER 2: DETECTION                                             │
│   ──────────────────                                             │
│   • Automated monitoring                                         │
│   • Pattern recognition                                          │
│   • User reports                                                 │
│   • Cross-reference checks                                       │
│                                                                  │
│   LAYER 3: RESPONSE                                              │
│   ─────────────────                                              │
│   • Automated actions                                            │
│   • Manual review                                                │
│   • User communication                                           │
│   • Law enforcement liaison                                      │
│                                                                  │
│   LAYER 4: RECOVERY                                              │
│   ────────────────                                               │
│   • Victim support                                               │
│   • System improvements                                          │
│   • Policy updates                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Threat Model

### 2.1 Abuse Categories

#### 🔴 Critical Threats (P0 - Immediate Action)

| Threat | Description | Risk Level |
|--------|-------------|------------|
| **Sexual predation** | Targeting minors, coerced meetings | Critical |
| **Human trafficking** | Luring victims under false pretenses | Critical |
| **Physical assault** | Using app to find victims | Critical |
| **Explicit content** | Unsolicited NSFW images/messages | Critical |
| **Doxxing** | Sharing personal info maliciously | Critical |

#### 🟠 High Threats (P1 - Same Day Action)

| Threat | Description | Risk Level |
|--------|-------------|------------|
| **Romance scams** | Fake profiles for financial fraud | High |
| **Catfishing** | Fake identity/photos | High |
| **Harassment** | Persistent unwanted contact | High |
| **Hate speech** | Discriminatory language | High |
| **Stalking** | Tracking/following users | High |

#### 🟡 Medium Threats (P2 - 24-48h Action)

| Threat | Description | Risk Level |
|--------|-------------|------------|
| **Platform abuse** | Spam, bots, fake accounts | Medium |
| **External redirect** | Directing to IG/Line/WhatsApp | Medium |
| **Commercial solicitation** | Selling services | Medium |
| **Fake reviews** | Manipulating ratings | Medium |
| **Location spoofing** | Faking location | Medium |

### 2.2 Attacker Profiles

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATTACKER PROFILES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   SCAMMER                                                        │
│   ───────                                                        │
│   Goal: Financial gain                                           │
│   Methods: Fake profiles, romance scams, advance fee fraud       │
│   Pattern: Quick emotional connection, eventual money request    │
│   Detection: Multiple accounts, scripted messages, fast escalate │
│                                                                  │
│   SPAMMER                                                        │
│   ───────                                                        │
│   Goal: Redirect traffic to external platforms                   │
│   Methods: Mass matching, copy-paste messages                    │
│   Pattern: IG/Line/WhatsApp links in early messages              │
│   Detection: High swipe rate, link patterns, message similarity  │
│                                                                  │
│   HARASSER                                                       │
│   ────────                                                       │
│   Goal: Intimidation, control                                    │
│   Methods: Persistent messaging, threats, explicit content       │
│   Pattern: Continues after rejection, creates new accounts       │
│   Detection: Report patterns, blocked account recreation         │
│                                                                  │
│   CATFISH                                                        │
│   ───────                                                        │
│   Goal: Attention, deception                                     │
│   Methods: Stolen photos, fake identity                          │
│   Pattern: Avoids video calls, inconsistent details              │
│   Detection: Reverse image search, verification avoidance        │
│                                                                  │
│   PREDATOR                                                       │
│   ────────                                                       │
│   Goal: Physical harm, exploitation                              │
│   Methods: Grooming, isolation, manipulation                     │
│   Pattern: Targets vulnerable users, pushes offline meetings     │
│   Detection: Age targeting patterns, isolation behavior          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Travel-Specific Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Tourist targeting** | Locals scamming tourists | Local verification, tourist reviews |
| **Unfamiliar area** | Meeting in unknown locations | Public place suggestions, location sharing |
| **Language barrier** | Misunderstandings escalating | Translation features, clear reporting |
| **Limited recourse** | Tourists leaving before resolution | Fast response, local authority contacts |

---

## 3. Prevention Measures

### 3.1 Account Verification Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│                 VERIFICATION TIERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   TIER 0: BASIC (Minimum to use app)                            │
│   ─────────────────────────────────                             │
│   ✅ Email verified                                              │
│   ✅ Phone number (SMS OTP)                                      │
│   ✅ Age confirmation (18+)                                      │
│   ✅ Profile photo uploaded                                      │
│   Access: Can browse, limited swipes                             │
│                                                                  │
│   TIER 1: VERIFIED (Recommended)                                 │
│   ────────────────────────────                                   │
│   ✅ All Tier 0 requirements                                     │
│   ✅ Photo verification (selfie match)                           │
│   Access: Unlimited swipes, can message                          │
│   Badge: Blue checkmark                                          │
│                                                                  │
│   TIER 2: TRUSTED (For Local Guides)                            │
│   ────────────────────────────────                               │
│   ✅ All Tier 1 requirements                                     │
│   ✅ ID verification                                             │
│   ✅ Background check (where available)                          │
│   ✅ Minimum 5 positive reviews                                  │
│   Access: Guide features, priority visibility                    │
│   Badge: Gold checkmark                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Rate Limiting

| Action | Limit | Window | Rationale |
|--------|-------|--------|-----------|
| Swipes | 100 | 24 hours | Prevent spam swiping |
| Super Likes | 5 | 24 hours | Value preservation |
| Messages (new match) | 10 | 1 hour | Prevent spam |
| Messages (total) | 200 | 24 hours | Abuse prevention |
| Reports | 10 | 24 hours | Prevent report abuse |
| Profile updates | 5 | 1 hour | Prevent evasion |
| Password attempts | 5 | 15 minutes | Brute force protection |

```javascript
// Rate limit implementation
const rateLimits = {
  swipe: { max: 100, window: '24h', key: 'user:swipe' },
  message: { max: 200, window: '24h', key: 'user:message' },
  report: { max: 10, window: '24h', key: 'user:report' },
};

async function checkRateLimit(userId, action) {
  const limit = rateLimits[action];
  const key = `${limit.key}:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, parseWindow(limit.window));
  }
  
  if (current > limit.max) {
    throw new RateLimitError(`${action} limit exceeded`);
  }
  
  return { remaining: limit.max - current };
}
```

### 3.3 Content Restrictions

#### Prohibited Content (Auto-block)
- Nudity / sexually explicit images
- Violence / gore
- Hate symbols
- Drug paraphernalia
- Weapons
- Personal contact info in photos

#### Message Filtering
```javascript
const blockedPatterns = [
  // External platform redirects
  /(?:instagram|ig|insta)[\s.:@]*/i,
  /(?:line|lineid)[\s.:@]*/i,
  /(?:whatsapp|wa)[\s.:@]*/i,
  /(?:telegram|tg)[\s.:@]*/i,
  /(?:wechat|weixin)[\s.:@]*/i,
  /(?:snapchat|snap)[\s.:@]*/i,
  
  // Financial scam indicators
  /(?:bitcoin|btc|crypto|invest)/i,
  /(?:wire|transfer|western union)/i,
  /(?:gift card|itunes card)/i,
  
  // Explicit content
  /(?:nude|naked|sex|xxx)/i,
  
  // Personal info solicitation
  /(?:address|home|where.*live)/i,
  /(?:passport|visa|id.*card)/i,
];

function filterMessage(content) {
  for (const pattern of blockedPatterns) {
    if (pattern.test(content)) {
      return {
        blocked: true,
        reason: 'prohibited_content',
        pattern: pattern.source
      };
    }
  }
  return { blocked: false };
}
```

### 3.4 Behavioral Restrictions

| Behavior | Restriction |
|----------|-------------|
| First message | No links allowed |
| First 24h | No phone numbers |
| Unmatched | Cannot message |
| Blocked by 3+ users | Review queue |
| New account | 48h cool-down on premium features |

---

## 4. Detection Systems

### 4.1 Automated Detection

```
┌─────────────────────────────────────────────────────────────────┐
│                 DETECTION PIPELINE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   INPUT                                                          │
│   ─────                                                          │
│   • User actions (swipe, message, report)                        │
│   • Profile changes                                              │
│   • Login patterns                                               │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   REAL-TIME CHECKS                                               │
│   ────────────────                                               │
│   • Rate limit validation                                        │
│   • Content filter (text, images)                                │
│   • Known bad actor check                                        │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   PATTERN ANALYSIS (Async)                                       │
│   ────────────────────────                                       │
│   • Message similarity (copy-paste detection)                    │
│   • Swipe patterns (mass right-swipe)                           │
│   • Time-based anomalies (bot-like timing)                      │
│   • Cross-account correlation                                    │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   RISK SCORING                                                   │
│   ────────────                                                   │
│   • Aggregate signals into risk score                            │
│   • Compare against thresholds                                   │
│   • Determine action tier                                        │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   ACTION                                                         │
│   ──────                                                         │
│   • None (score < 30)                                            │
│   • Flag for review (30-60)                                      │
│   • Shadow ban (60-80)                                           │
│   • Immediate ban (80+)                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Risk Scoring Model

```javascript
const riskSignals = {
  // Account signals
  newAccount: 10,              // < 7 days old
  noVerification: 15,          // No photo verification
  stockPhoto: 40,              // Detected stock/stolen photo
  multipleAccounts: 50,        // Same device/IP
  
  // Behavior signals
  massSwipeRight: 20,          // > 90% right swipes
  rapidMessages: 15,           // > 50 messages/hour
  copyPasteMessages: 30,       // Similar messages to multiple users
  externalLinks: 25,           // Links in messages
  
  // Report signals
  reported1x: 20,              // 1 report
  reported3x: 50,              // 3 reports
  reported5x: 80,              // 5 reports (auto-ban threshold)
  
  // Content signals
  explicitContent: 70,         // NSFW detected
  hateSpech: 60,               // Hate speech detected
  scamKeywords: 40,            // Money/crypto/gift card
};

function calculateRiskScore(user, signals) {
  let score = 0;
  
  for (const signal of signals) {
    score += riskSignals[signal] || 0;
  }
  
  // Cap at 100
  return Math.min(score, 100);
}
```

### 4.3 Photo Verification

```
┌─────────────────────────────────────────────────────────────────┐
│                 PHOTO VERIFICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   STEP 1: Profile Photo Upload                                   │
│   ───────────────────────────                                    │
│   • User uploads profile photos                                  │
│   • Run through NSFW detection                                   │
│   • Run through face detection                                   │
│                                                                  │
│   STEP 2: Verification Request                                   │
│   ────────────────────────────                                   │
│   • Show random pose instruction                                 │
│   • User takes real-time selfie                                  │
│   • Cannot use camera roll                                       │
│                                                                  │
│   STEP 3: Comparison                                             │
│   ──────────────────                                             │
│   • Face matching algorithm                                      │
│   • Liveness detection                                           │
│   • Match score threshold > 85%                                  │
│                                                                  │
│   STEP 4: Result                                                 │
│   ──────────                                                     │
│   • Pass → Verified badge                                        │
│   • Fail → Retry (max 3x) or manual review                      │
│   • Suspicious → Flag for review                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Cross-Account Detection

| Signal | Detection Method |
|--------|------------------|
| Same device | Device fingerprint (deviceId) |
| Same IP | IP tracking (with VPN awareness) |
| Same photos | Perceptual hash matching |
| Same phone | Phone number reuse |
| Same email pattern | Email domain + prefix analysis |
| Same behavior | Message content similarity |

---

## 5. Response & Enforcement

### 5.1 Action Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│                 ENFORCEMENT ACTIONS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   TIER 1: WARNING                                                │
│   ───────────────                                                │
│   Trigger: First minor violation                                 │
│   Action:                                                        │
│   • In-app warning message                                       │
│   • Violation logged                                             │
│   • No feature restriction                                       │
│   Duration: Permanent record                                     │
│                                                                  │
│   TIER 2: RESTRICTION                                            │
│   ──────────────────                                             │
│   Trigger: Repeat minor violation or first moderate              │
│   Action:                                                        │
│   • Feature restriction (messaging, swiping)                     │
│   • Reduced visibility                                           │
│   • Required acknowledgment                                      │
│   Duration: 24-72 hours                                          │
│                                                                  │
│   TIER 3: SHADOW BAN                                             │
│   ──────────────────                                             │
│   Trigger: Suspected spam/scam, multiple reports                 │
│   Action:                                                        │
│   • User appears normal to themselves                            │
│   • Hidden from other users                                      │
│   • Messages not delivered                                       │
│   • No notification to user                                      │
│   Duration: Until review or 7 days                               │
│                                                                  │
│   TIER 4: TEMPORARY BAN                                          │
│   ────────────────────────                                       │
│   Trigger: Serious violation, verified reports                   │
│   Action:                                                        │
│   • Account suspended                                            │
│   • User notified with reason                                    │
│   • Appeal option provided                                       │
│   Duration: 7-30 days                                            │
│                                                                  │
│   TIER 5: PERMANENT BAN                                          │
│   ────────────────────────                                       │
│   Trigger: Critical violation, repeat offender                   │
│   Action:                                                        │
│   • Account terminated                                           │
│   • Device/IP flagged                                            │
│   • Email/phone blocked                                          │
│   • Legal action consideration                                   │
│   Duration: Permanent                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Violation → Action Mapping

| Violation | First Offense | Repeat | Severe |
|-----------|--------------|--------|--------|
| External link spam | Warning | Shadow ban | Permanent |
| Harassment | Restriction | Temp ban | Permanent |
| Explicit content | Temp ban | Permanent | - |
| Scam attempt | Shadow ban | Permanent | - |
| Fake profile | Warning | Temp ban | Permanent |
| Hate speech | Temp ban | Permanent | - |
| Threats/violence | Permanent | - | Law enforcement |
| Minor safety | Permanent | - | Law enforcement |

### 5.3 Ban Evasion Detection

```javascript
async function checkBanEvasion(newUser) {
  const signals = [];
  
  // Device check
  const deviceMatch = await db('banned_devices')
    .where('device_id', newUser.deviceId)
    .first();
  if (deviceMatch) signals.push('banned_device');
  
  // IP check (with allowance for shared IPs)
  const ipMatches = await db('banned_ips')
    .where('ip_address', newUser.ip)
    .where('banned_at', '>', thirtyDaysAgo)
    .count();
  if (ipMatches > 0) signals.push('banned_ip');
  
  // Phone check
  const phoneMatch = await db('banned_phones')
    .where('phone_hash', hash(newUser.phone))
    .first();
  if (phoneMatch) signals.push('banned_phone');
  
  // Photo similarity check
  const similarPhotos = await findSimilarPhotos(newUser.photos);
  if (similarPhotos.some(p => p.isBanned)) signals.push('banned_photo');
  
  if (signals.length > 0) {
    await flagForReview(newUser, 'ban_evasion', signals);
    return { blocked: true, reason: 'ban_evasion' };
  }
  
  return { blocked: false };
}
```

---

## 6. Reporting System

### 6.1 Report Categories

```javascript
const reportCategories = {
  // Critical (Immediate review)
  UNDERAGE: {
    priority: 'critical',
    autoAction: 'suspend',
    escalate: true
  },
  THREATS: {
    priority: 'critical',
    autoAction: 'suspend',
    escalate: true
  },
  
  // High (Same-day review)
  HARASSMENT: {
    priority: 'high',
    autoAction: 'restrict',
    escalate: false
  },
  EXPLICIT_CONTENT: {
    priority: 'high',
    autoAction: 'restrict',
    escalate: false
  },
  SCAM: {
    priority: 'high',
    autoAction: 'shadowBan',
    escalate: false
  },
  
  // Medium (24-48h review)
  FAKE_PROFILE: {
    priority: 'medium',
    autoAction: 'none',
    escalate: false
  },
  SPAM: {
    priority: 'medium',
    autoAction: 'none',
    escalate: false
  },
  INAPPROPRIATE_CONTENT: {
    priority: 'medium',
    autoAction: 'none',
    escalate: false
  },
  
  // Low (Weekly review)
  OTHER: {
    priority: 'low',
    autoAction: 'none',
    escalate: false
  }
};
```

### 6.2 Report Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     REPORT FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   USER SUBMITS REPORT                                            │
│   ──────────────────                                             │
│   • Select category                                              │
│   • Optional: Add details                                        │
│   • Optional: Attach screenshots                                 │
│   • Auto: Include message history                                │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   IMMEDIATE ACTIONS                                              │
│   ─────────────────                                              │
│   • Block reported user for reporter                             │
│   • Check if threshold reached (5 reports)                       │
│   • Apply auto-action based on category                          │
│   • Send confirmation to reporter                                │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   QUEUE FOR REVIEW                                               │
│   ────────────────                                               │
│   • Add to priority queue                                        │
│   • Aggregate with other reports                                 │
│   • Attach evidence package                                      │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   MODERATOR REVIEW                                               │
│   ────────────────                                               │
│   • Review evidence                                              │
│   • Check history                                                │
│   • Make decision                                                │
│   • Document reasoning                                           │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   OUTCOME                                                        │
│   ───────                                                        │
│   • No action (false report)                                     │
│   • Warning issued                                               │
│   • Account action (restrict/ban)                                │
│   • Escalation (law enforcement)                                 │
│                                                                  │
│         ▼                                                        │
│                                                                  │
│   NOTIFICATION                                                   │
│   ────────────                                                   │
│   • Reporter: "Action taken" (no specifics)                      │
│   • Reported: Specific action + appeal info                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Report API

```javascript
// POST /api/v1/reports
const reportSchema = {
  reportedUserId: 'uuid',           // Required
  category: 'string',               // Required (from categories)
  details: 'string',                // Optional, max 1000 chars
  screenshots: ['url'],             // Optional, max 5
  messageIds: ['uuid'],             // Optional, specific messages
  includeFullHistory: 'boolean'     // Default: true
};

// Response
{
  "success": true,
  "data": {
    "reportId": "report-uuid",
    "status": "received",
    "message": "Thank you for your report. We take safety seriously and will review this within 24 hours.",
    "actionTaken": "User has been blocked from contacting you."
  }
}
```

### 6.4 Report Abuse Prevention

| Measure | Implementation |
|---------|----------------|
| Rate limit | Max 10 reports/day |
| Duplicate check | Can't report same user twice in 7 days |
| False report tracking | Track report outcomes per user |
| Reporter scoring | Weight reports by reporter reliability |
| Mutual report handling | Flag for careful review |

---

## 7. Admin Escalation Flow

### 7.1 Escalation Triggers

| Trigger | Auto-Escalate To |
|---------|------------------|
| Underage user suspected | Senior Moderator + Legal |
| Physical threat | Senior Moderator + Legal |
| 10+ reports in 24h (same user) | Senior Moderator |
| Law enforcement request | Legal Team |
| Media/PR risk | PR Team + Management |
| Technical exploit | Security Team |

### 7.2 Escalation Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                 ESCALATION HIERARCHY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   LEVEL 1: AUTOMATED SYSTEM                                      │
│   ─────────────────────────                                      │
│   • Pattern-based auto-actions                                   │
│   • Threshold-based bans                                         │
│   • Content filtering                                            │
│   Response time: Immediate                                       │
│                                                                  │
│   LEVEL 2: TIER 1 MODERATOR                                      │
│   ─────────────────────────                                      │
│   • Standard report review                                       │
│   • Warning issuance                                             │
│   • Temporary restrictions                                       │
│   Response time: < 24 hours                                      │
│                                                                  │
│   LEVEL 3: SENIOR MODERATOR                                      │
│   ─────────────────────────                                      │
│   • Complex cases                                                │
│   • Ban decisions                                                │
│   • Appeal reviews                                               │
│   Response time: < 48 hours                                      │
│                                                                  │
│   LEVEL 4: SAFETY TEAM LEAD                                      │
│   ─────────────────────────                                      │
│   • Policy decisions                                             │
│   • High-profile cases                                           │
│   • Cross-functional coordination                                │
│   Response time: < 72 hours                                      │
│                                                                  │
│   LEVEL 5: LEGAL / EXECUTIVE                                     │
│   ─────────────────────────                                      │
│   • Law enforcement liaison                                      │
│   • Legal action decisions                                       │
│   • Crisis management                                            │
│   Response time: Varies                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Admin Dashboard Requirements

| Feature | Priority |
|---------|----------|
| Report queue with filters | P0 |
| User history view | P0 |
| Bulk action tools | P1 |
| Analytics dashboard | P1 |
| Audit log | P0 |
| Escalation workflow | P1 |
| Communication templates | P2 |

---

## 8. App Store Compliance

### 8.1 Apple App Store Requirements

| Requirement | Implementation |
|-------------|----------------|
| 17+ age rating | Age verification at signup |
| Report mechanism | In-app reporting on all profiles |
| Block feature | Block from profile and chat |
| Content moderation | Photo review + message filtering |
| Safety information | Safety tips in app |
| Terms of service | Required acceptance |
| Privacy policy | Accessible in app |

### 8.2 Google Play Requirements

| Requirement | Implementation |
|-------------|----------------|
| User safety policy | Documented and enforced |
| Impersonation policy | Photo verification |
| Harassment policy | Report + enforcement system |
| Sexual content policy | NSFW detection + removal |
| Child safety | Age verification + reporting |

### 8.3 Required Documentation for Review

```
docs/
├── SAFETY_AND_ABUSE_MODEL.md     ← This document
├── PRIVACY_POLICY.md             ← User data handling
├── TERMS_OF_SERVICE.md           ← Usage rules
├── CONTENT_GUIDELINES.md         ← What's allowed
├── LAW_ENFORCEMENT_GUIDE.md      ← How to request data
└── SAFETY_TIPS.md                ← User-facing safety advice
```

---

## 9. Implementation Checklist

### 9.1 Phase 1: MVP Safety (Before Launch)

- [ ] **Account Security**
  - [ ] Email verification
  - [ ] Phone verification
  - [ ] Rate limiting on all endpoints
  - [ ] Password requirements

- [ ] **Content Safety**
  - [ ] Basic text filtering (blocked words)
  - [ ] NSFW image detection (API integration)
  - [ ] External link blocking in early messages

- [ ] **User Safety**
  - [ ] Block user feature
  - [ ] Report user feature
  - [ ] Basic report queue
  - [ ] 5-report auto-ban

- [ ] **Compliance**
  - [ ] Privacy policy
  - [ ] Terms of service
  - [ ] Age confirmation (18+)

### 9.2 Phase 2: Enhanced Safety

- [ ] **Verification**
  - [ ] Photo verification (selfie match)
  - [ ] ID verification for guides
  - [ ] Verification badges

- [ ] **Detection**
  - [ ] Copy-paste message detection
  - [ ] Mass swipe detection
  - [ ] Cross-account detection
  - [ ] Risk scoring system

- [ ] **Response**
  - [ ] Shadow ban system
  - [ ] Graduated enforcement
  - [ ] Appeal system
  - [ ] Admin dashboard

### 9.3 Phase 3: Advanced Safety

- [ ] **Detection**
  - [ ] ML-based scam detection
  - [ ] Behavioral anomaly detection
  - [ ] Network analysis (scam rings)

- [ ] **Physical Safety**
  - [ ] Meeting location suggestions
  - [ ] Location sharing (opt-in)
  - [ ] Emergency contact feature
  - [ ] Safety check-in prompts

- [ ] **Operations**
  - [ ] 24/7 moderation coverage
  - [ ] Law enforcement portal
  - [ ] Crisis response playbook

---

## Appendix A: Message Templates

### Warning Message
```
Your recent activity on JJ-Meet has violated our Community Guidelines. 
Specifically: [VIOLATION_TYPE]

This is a warning. Continued violations may result in account restrictions or termination.

Please review our Community Guidelines: [LINK]
```

### Restriction Notice
```
Your JJ-Meet account has been temporarily restricted.
Reason: [REASON]
Duration: [DURATION]

During this time, you will not be able to [RESTRICTED_FEATURES].

If you believe this is a mistake, you can appeal: [APPEAL_LINK]
```

### Ban Notice
```
Your JJ-Meet account has been permanently suspended.
Reason: [REASON]

This decision was made after reviewing your account activity and reports from other users.

If you believe this is a mistake, you can submit an appeal within 30 days: [APPEAL_LINK]
```

---

## Appendix B: Database Schema

```sql
-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users(id),
  reported_user_id UUID REFERENCES users(id),
  category VARCHAR(50) NOT NULL,
  details TEXT,
  screenshots TEXT[],
  message_ids UUID[],
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL,
  auto_action_taken VARCHAR(50),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP,
  outcome VARCHAR(50),
  outcome_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User violations table
CREATE TABLE user_violations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  violation_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  action_taken VARCHAR(50) NOT NULL,
  report_id UUID REFERENCES reports(id),
  notes TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blocked users table  
CREATE TABLE blocked_users (
  blocker_id UUID REFERENCES users(id),
  blocked_id UUID REFERENCES users(id),
  reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Banned entities table
CREATE TABLE banned_entities (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL, -- device, ip, phone, email
  entity_value VARCHAR(255) NOT NULL,
  reason VARCHAR(100),
  banned_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Jan 2026 | Team | Initial specification |

---

**Related Documents:**
- [BLUEPRINT_AND_ROADMAP.md](./BLUEPRINT_AND_ROADMAP.md)
- [AUTHENTICATION.md](./AUTHENTICATION.md)
- [ERROR_CODES.md](./ERROR_CODES.md)
