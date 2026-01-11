# UX Feedback Log

## Feedback #1: Registration Step 3 Simplification
**Date:** 2026-01-05  
**Source:** jjmow

### Original Feedback
> I think register part (page, the third one) don't have to ask people to choose traveler or guide or both, since the people use the app is already open mind to meet and be both, but the page can still have some like for example i have moto or car (now exist), or other characteristic or condition relate to user for user to fill or check.

### Changes Applied ✅
- **Removed**: "I am a tourist/local/both" selection
- **Default**: All users set to `user_type: 'both'` and `is_guide: true`
- **Kept**: Transportation options (car, motorcycle)
- **Added**: New characteristics:
  - "I speak English"
  - "I speak local language"  
  - "Flexible schedule"

### Rationale
Users of JJ-Meet are inherently open to both traveling and guiding. Forcing a choice creates unnecessary friction and doesn't reflect actual user behavior. The focus shifted to **practical characteristics** that help others decide who to meet.

### Files Modified
- `mobile/app/(auth)/register.tsx` - Step 3 UI redesign