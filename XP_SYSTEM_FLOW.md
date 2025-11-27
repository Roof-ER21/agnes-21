# XP System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGNES-21 XP SYSTEM FLOW                      │
└─────────────────────────────────────────────────────────────────┘

                          NEW USER LOGIN
                                │
                                ▼
                    ┌───────────────────────┐
                    │   getUserProgress()   │
                    │   Returns: Level 1    │
                    │   Unlocked: BEGINNER  │
                    └───────────┬───────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                      HOME SCREEN                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  DIFFICULTY SELECTION                                    │ │
│  │  ✅ BEGINNER     (Available)                            │ │
│  │  🔒 ROOKIE       (Unlock at Level 3)                    │ │
│  │  🔒 PRO          (Unlock at Level 7)                    │ │
│  │  🔒 ELITE        (Unlock at Level 12)                   │ │
│  │  🔒 NIGHTMARE    (Unlock at Level 20)                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   START SESSION       │
                    │   (BEGINNER mode)     │
                    └───────────┬───────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                   TRAINING SESSION                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Header:                                                 │ │
│  │  [AGNES 21 // LIVE]  [BEGINNER]  [🔥 Streak]  [XPBar]  │ │
│  │                                                          │ │
│  │  XP Bar Display:                                         │ │
│  │  🏆 Level 1 | 0/100 XP  [░░░░░░░░░░]                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  User practices pitch → Agnes responds → Score tracked        │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   END SESSION         │
                    │   Final Score: 85     │
                    │   Duration: 3 min     │
                    └───────────┬───────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                   XP CALCULATION                               │
│                                                                │
│  calculateSessionXP(sessionData, streakData)                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Base XP:           50                                   │ │
│  │  Score Bonus:      +15  (85 - 70)                       │ │
│  │  Perfect Bonus:      0  (score < 100)                   │ │
│  │  Streak Bonus:       0  (no streak yet)                 │ │
│  │  ─────────────────────                                  │ │
│  │  Subtotal:          65                                   │ │
│  │  Multiplier:      x1.0  (BEGINNER)                      │ │
│  │  ═════════════════════                                  │ │
│  │  TOTAL XP:          65                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   awardXP(65)         │
                    │   Total XP: 0 → 65    │
                    │   Level: 1 → 1        │
                    │   leveledUp: false    │
                    └───────────┬───────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                   SUCCESS MODAL                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ✓ Session Saved                                         │ │
│  │  📊 Score: 85/100                                        │ │
│  │  ⏱️  Duration: 3 minutes                                 │ │
│  │  💾 Video Saved                                          │ │
│  │                                                          │ │
│  │  [Close]                                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   RETURN TO HOME      │
                    │   XP Bar shows:       │
                    │   Level 1 | 65/100 XP │
                    └───────────┬───────────┘
                                │
                                │
                    [USER COMPLETES MORE SESSIONS]
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                   SESSION #4                                   │
│  Score: 90                                                     │
│  XP Earned: 70                                                 │
│  Total XP: 235 → 305                                           │
│  Level: 2 → 3  ⚡ LEVEL UP!                                    │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│              🎉 LEVEL UP MODAL 🎉                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │              ⭐ ⭐ ⭐ ⭐ ⭐                                │ │
│  │                                                          │ │
│  │                  🏆 LEVEL UP!                            │ │
│  │                                                          │ │
│  │          Level 2  ⚡  Level 3                            │ │
│  │                                                          │ │
│  │        ✨ NEW UNLOCKS ✨                                 │ │
│  │     ROOKIE Difficulty Unlocked!                          │ │
│  │                                                          │ │
│  │  🏆 Level 3 | 55/250 XP  [██░░░░░░░░]                   │ │
│  │                                                          │ │
│  │         [Continue Training]                              │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  🔊 Level-up sound plays (C5→E5→G5→C6)                        │
│  ✨ Animations: rays spinning, particles floating             │
│  ⏱️  Auto-closes in 5 seconds                                 │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                      HOME SCREEN (UPDATED)                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  DIFFICULTY SELECTION                                    │ │
│  │  ✅ BEGINNER     (Available)                            │ │
│  │  ✅ ROOKIE       (NOW UNLOCKED!)                        │ │
│  │  🔒 PRO          (Unlock at Level 7)                    │ │
│  │  🔒 ELITE        (Unlock at Level 12)                   │ │
│  │  🔒 NIGHTMARE    (Unlock at Level 20)                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    User can now train in ROOKIE mode!
                    (1.2x XP multiplier - faster progression)


═══════════════════════════════════════════════════════════════

                    LEVEL PROGRESSION CHART

Level 1  ──────▶  0 XP      │  Unlocks: BEGINNER
Level 2  ──────▶  100 XP    │
Level 3  ──────▶  250 XP    │  Unlocks: ROOKIE (1.2x XP)
Level 4  ──────▶  450 XP    │
Level 5  ──────▶  700 XP    │
Level 6  ──────▶  1,050 XP  │
Level 7  ──────▶  1,750 XP  │  Unlocks: PRO (1.5x XP)
Level 10 ──────▶  2,500 XP  │
Level 12 ──────▶  5,000 XP  │  Unlocks: ELITE (2.0x XP)
Level 15 ──────▶  7,500 XP  │
Level 20 ──────▶ 10,000 XP  │  Unlocks: NIGHTMARE (3.0x XP)

═══════════════════════════════════════════════════════════════

                    XP MULTIPLIER IMPACT

┌────────────┬──────────┬────────────┬──────────────┐
│ Difficulty │  Score   │   Streak   │  Total XP    │
├────────────┼──────────┼────────────┼──────────────┤
│ BEGINNER   │    85    │     0      │    65 XP     │
│ ROOKIE     │    85    │     0      │    78 XP     │
│ PRO        │    85    │     0      │    97 XP     │
│ ELITE      │    85    │     0      │   130 XP     │
│ NIGHTMARE  │    85    │     0      │   195 XP     │
├────────────┼──────────┼────────────┼──────────────┤
│ PRO        │    100   │     5      │   285 XP     │
│ ELITE      │    100   │     5      │   380 XP     │
│ NIGHTMARE  │    100   │     5      │   570 XP     │
└────────────┴──────────┴────────────┴──────────────┘

═══════════════════════════════════════════════════════════════

                    COMPONENT STRUCTURE

App.tsx
  │
  ├─▶ LoginScreen (if not authenticated)
  │
  └─▶ AppContent (main app)
       │
       ├─▶ Home Screen
       │    │
       │    ├─▶ Difficulty Buttons (with lock logic)
       │    │    │
       │    │    └─▶ getUserProgress() → Check unlocked
       │    │
       │    └─▶ [Start Session]
       │
       └─▶ PitchTrainer
            │
            ├─▶ Header
            │    │
            │    ├─▶ StreakCounter
            │    └─▶ XPBar (compact mode)
            │
            ├─▶ [Training Session]
            │
            ├─▶ [End Session]
            │    │
            │    └─▶ calculateSessionXP()
            │         └─▶ awardXP()
            │              └─▶ if leveledUp:
            │                   ├─▶ playLevelUp()
            │                   └─▶ show LevelUpModal
            │
            ├─▶ LevelUpModal (if leveled up)
            │    │
            │    ├─▶ Animations (rays, particles)
            │    ├─▶ Trophy icon
            │    ├─▶ Level transition
            │    ├─▶ Unlocks list
            │    ├─▶ XPBar (expanded)
            │    └─▶ Auto-close timer
            │
            └─▶ SuccessModal (after level-up modal)

═══════════════════════════════════════════════════════════════

                    DATA FLOW

┌─────────────────────────────────────────────────────────────┐
│  localStorage                                               │
│  ┌────────────────────────────────────────────────────────┐│
│  │ agnes_progress_{userId}                                ││
│  │ {                                                      ││
│  │   "userId": "user_123",                                ││
│  │   "totalXP": 305                                       ││
│  │ }                                                      ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                           │
                           │ getUserProgress()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Computed UserProgress                                      │
│  ┌────────────────────────────────────────────────────────┐│
│  │ {                                                      ││
│  │   userId: "user_123",                                  ││
│  │   totalXP: 305,                                        ││
│  │   currentLevel: 3,        ← getLevelForXP(305)        ││
│  │   xpToNextLevel: 145,     ← 450 - 305                 ││
│  │   unlockedDifficulties: [ ← getUnlockedDifficulties(3)││
│  │     BEGINNER,                                          ││
│  │     ROOKIE                                             ││
│  │   ]                                                    ││
│  │ }                                                      ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

## Key Features

### ✅ Progressive Difficulty Unlocking
- Users start with only BEGINNER
- Must earn XP to unlock harder difficulties
- Creates clear progression goals

### ✅ XP Rewards for Performance
- Higher scores = more XP
- Active streaks multiply rewards
- Perfect scores get bonus XP

### ✅ Difficulty Multipliers
- Harder difficulties = more XP
- Encourages users to challenge themselves
- Faster progression at higher levels

### ✅ Celebration System
- Level-up modal with animations
- Sound effects for achievements
- Visual feedback for progress

### ✅ Persistence
- All data saved to localStorage
- Progress survives page refreshes
- Multi-user support with user IDs

### ✅ Integration
- Works with existing achievements
- Integrates with streak system
- Compatible with session history
