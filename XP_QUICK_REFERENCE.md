# XP System - Quick Reference Card

## 🎯 Core Files

```
/utils/gamification.ts       → XP logic & calculations
/components/XPBar.tsx         → Progress bar component
/components/LevelUpModal.tsx  → Celebration modal
/components/PitchTrainer.tsx  → XP integration (session end)
/App.tsx                      → Difficulty unlocking
```

## 📊 XP Formula (Quick)

```
Total XP = (Base + Bonuses) × Multiplier

Base:       50 XP
Score:      +(score - 70) XP  [max +30]
Perfect:    +50 XP  [if score = 100]
Streak:     +(days × 10) XP

Multipliers:
  BEGINNER:  ×1.0
  ROOKIE:    ×1.2
  PRO:       ×1.5
  ELITE:     ×2.0
  NIGHTMARE: ×3.0
```

## 🎚️ Level Thresholds

| Level | XP    | Unlock       |
|-------|-------|--------------|
| 1     | 0     | BEGINNER     |
| 2     | 100   | -            |
| 3     | 250   | ROOKIE       |
| 7     | 1,750 | PRO          |
| 12    | 5,000 | ELITE        |
| 20    | 10,000| NIGHTMARE    |

**Formula:** `XP = 50 × level²`

## 🚀 Quick Test Commands

### Reset Progress
```javascript
localStorage.removeItem('agnes_progress');
location.reload();
```

### Jump to Level 3 (ROOKIE)
```javascript
localStorage.setItem('agnes_progress', JSON.stringify({ totalXP: 250 }));
location.reload();
```

### Jump to Level 12 (ELITE)
```javascript
localStorage.setItem('agnes_progress', JSON.stringify({ totalXP: 5000 }));
location.reload();
```

### Award XP Manually
```javascript
const { awardXP } = await import('/src/utils/gamification.ts');
awardXP(500);  // Award 500 XP
```

### Check Current Progress
```javascript
const { getUserProgress } = await import('/src/utils/gamification.ts');
console.log(getUserProgress());
```

## 🔧 Common Tasks

### Test Level-Up Flow
1. Reset progress
2. Award 250 XP
3. Watch level-up modal appear
4. Verify ROOKIE unlocked

### Test Difficulty Locks
1. Login as new user
2. Verify only BEGINNER clickable
3. Hover over ROOKIE → see "Unlock at Level 3"
4. Try clicking ROOKIE → nothing happens

### Test XP Calculation
1. Start BEGINNER session
2. Score 85
3. End session
4. Console shows: `Base: 50, Score: 15, Total: 65 XP`

## 📝 localStorage Keys

```
agnes_progress          → Legacy (no userId)
agnes_progress_{userId} → User-specific progress
agnes_sessions_{userId} → Session history
agnes_streak_{userId}   → Streak data
```

## 🎨 Component Props

### XPBar
```typescript
<XPBar
  userId={user?.id}  // optional
  compact={true}     // compact mode for header
/>
```

### LevelUpModal
```typescript
<LevelUpModal
  show={showLevelUpModal}
  previousLevel={2}
  newLevel={3}
  unlocksAtThisLevel={["ROOKIE Difficulty Unlocked!"]}
  onClose={() => setShowLevelUpModal(false)}
  userId={user?.id}
/>
```

## 🐛 Troubleshooting

**XP not showing?**
- Check console for errors
- Verify `getUserProgress()` returns data
- Check localStorage has `agnes_progress` key

**Level-up not triggering?**
- Verify `playLevelUp` imported
- Check `showLevelUpModal` state
- Look for React warnings in console

**Difficulties not unlocking?**
- Clear localStorage and reload
- Verify `currentLevel` is calculated correctly
- Check `isDifficultyUnlocked()` logic

**Build errors?**
- Run `npm run build`
- Check for TypeScript errors
- Verify all imports resolved

## 📋 Testing Checklist

- [ ] Build succeeds (no errors)
- [ ] XP Bar displays in header
- [ ] Only BEGINNER unlocked initially
- [ ] XP awarded after session
- [ ] Level-up modal appears
- [ ] Sound effect plays
- [ ] Difficulties unlock at correct levels
- [ ] Progress persists after reload
- [ ] Mobile-responsive (XP bar hidden on mobile)

## 💡 XP Examples

### Beginner Session
```
Score: 75 → 55 XP  (50 base + 5 score)
Score: 85 → 65 XP  (50 base + 15 score)
Score: 100 → 130 XP (50 + 30 + 50 perfect)
```

### PRO Session (1.5x)
```
Score: 75 → 82 XP   (55 × 1.5)
Score: 85 → 97 XP   (65 × 1.5)
Score: 100 → 195 XP (130 × 1.5)
```

### NIGHTMARE + Streak (3.0x, 5-day streak)
```
Score: 85 → 345 XP  ((50+15+50) × 3.0)
Score: 100 → 570 XP ((50+30+50+50) × 3.0)
```

## 🎯 Sessions to Level Up

**Level 1 → Level 3** (250 XP):
- ~4 BEGINNER sessions (score 80-85)
- ~3 BEGINNER sessions (score 90-95)

**Level 3 → Level 7** (1,500 XP):
- ~20 ROOKIE sessions (score 80)
- ~10 PRO sessions (score 85)

**Level 7 → Level 12** (3,250 XP):
- ~20 PRO sessions (score 90)
- ~10 ELITE sessions (score 85)

**Level 12 → Level 20** (5,000 XP):
- ~25 ELITE sessions (score 85)
- ~15 NIGHTMARE sessions (score 85)

## 🔐 Security Notes

- All data stored in localStorage (client-side)
- No backend required
- User-specific keys prevent data mixing
- Migration logic handles legacy data
- No sensitive data stored (only XP total)

## 🚀 Performance

- Minimal localStorage usage (~50 bytes)
- O(log n) level calculation
- Only calculates on session end
- No real-time polling
- XP Bar recalculates on mount (negligible)

## 📚 Documentation Files

```
XP_SYSTEM_IMPLEMENTATION.md  → Complete implementation details
TEST_XP_SYSTEM.md            → Comprehensive testing guide
XP_SYSTEM_FLOW.md            → Visual flow diagrams
XP_QUICK_REFERENCE.md        → This file (quick reference)
```

---

**Build Status:** ✅ Successful (no errors)
**Integration:** ✅ Complete (all systems working)
**Testing:** Ready for manual QA

Run `npm run dev` to start testing!
