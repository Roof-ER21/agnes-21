# XP System Testing Guide

## System Overview

The Agnes-21 XP and Levels system is now fully integrated. Here's what you need to know:

### XP Formula

**Base XP per session: 50**

**Bonuses:**
- Score bonus: +1 XP per point above 70 (max +30 for score 100)
- Perfect score (100): +50 bonus XP
- Streak bonus: +10 XP per day in current streak

**Difficulty Multipliers:**
- BEGINNER: 1.0x
- ROOKIE: 1.2x
- PRO: 1.5x
- ELITE: 2.0x
- NIGHTMARE: 3.0x

**Example Calculations:**
```
Beginner, Score 80, No Streak:
Base: 50
Score Bonus: 10 (80-70)
Multiplier: 1.0x
Total: 60 XP

PRO, Score 95, 3-day Streak:
Base: 50
Score Bonus: 25 (95-70)
Streak Bonus: 30 (3 * 10)
Multiplier: 1.5x
Total: (50 + 25 + 30) * 1.5 = 157 XP

NIGHTMARE, Perfect Score 100, 5-day Streak:
Base: 50
Score Bonus: 30 (100-70)
Perfect Bonus: 50
Streak Bonus: 50 (5 * 10)
Multiplier: 3.0x
Total: (50 + 30 + 50 + 50) * 3.0 = 570 XP
```

### Level Progression

**Level Curve:** XP = 50 * level^2

| Level | Total XP Required | Unlocks |
|-------|------------------|---------|
| 1     | 0 XP             | BEGINNER |
| 2     | 100 XP           | - |
| 3     | 250 XP           | ROOKIE |
| 4     | 450 XP           | - |
| 5     | 700 XP           | - |
| 7     | 1,750 XP         | PRO |
| 10    | 2,500 XP         | - |
| 12    | 5,000 XP         | ELITE |
| 15    | 7,500 XP         | - |
| 20    | 10,000 XP        | NIGHTMARE |
| 30    | 22,500 XP        | - |
| 50    | 100,000 XP       | - |

## Testing Checklist

### ✅ Phase 1: Visual Integration

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Check Home Screen:**
   - [ ] Login with any user
   - [ ] Verify only BEGINNER difficulty is unlocked (not grayed out)
   - [ ] Verify ROOKIE, PRO, ELITE, NIGHTMARE are locked (grayed out with lock icon)
   - [ ] Hover over locked difficulties shows "Unlock at Level X"

### ✅ Phase 2: XP Bar Display

1. **Start a training session:**
   - [ ] Select BEGINNER difficulty
   - [ ] Start any script
   - [ ] Check top-right header for XP Bar (compact mode)
   - [ ] Should show "Level 1 | 0/100 XP" with empty progress bar

### ✅ Phase 3: First Session XP Award

1. **Complete a session:**
   - [ ] Practice for 1-2 minutes
   - [ ] End session and save
   - [ ] Console should log XP calculation
   - [ ] Return to home
   - [ ] Check if XP bar updated (should show progress toward Level 2)

2. **Expected Result:**
   ```
   Score 70: ~50 XP (base only)
   Score 80: ~60 XP
   Score 90: ~70 XP
   ```

### ✅ Phase 4: Level-Up Flow

**To quickly reach Level 3 (unlock ROOKIE):**
- Complete 3-4 BEGINNER sessions with scores 80-90
- Total needed: 250 XP
- OR use browser console:

```javascript
// Reset progress
localStorage.removeItem('agnes_progress');

// Award 250 XP manually (Level 3)
const { awardXP } = await import('/src/utils/gamification.ts');
awardXP(250);
```

**Test Level-Up Modal:**
1. [ ] After earning enough XP to level up, level-up modal should appear
2. [ ] Modal shows:
   - "LEVEL UP!" headline with animations
   - Previous level → New level
   - Trophy icon with animations
   - Unlocks (if any): "ROOKIE Difficulty Unlocked!"
   - XP bar showing new level progress
   - Sound effect plays
3. [ ] Click "Continue Training" or wait 5 seconds for auto-close
4. [ ] Return to home screen
5. [ ] Verify ROOKIE difficulty is now unlocked

### ✅ Phase 5: Difficulty Unlocking

**Test Each Unlock:**

1. **Level 3 - ROOKIE:**
   ```javascript
   localStorage.setItem('agnes_progress', JSON.stringify({ totalXP: 250 }));
   location.reload();
   ```
   - [ ] ROOKIE unlocked, BEGINNER unlocked
   - [ ] PRO, ELITE, NIGHTMARE still locked

2. **Level 7 - PRO:**
   ```javascript
   localStorage.setItem('agnes_progress', JSON.stringify({ totalXP: 1750 }));
   location.reload();
   ```
   - [ ] BEGINNER, ROOKIE, PRO unlocked
   - [ ] ELITE, NIGHTMARE locked

3. **Level 12 - ELITE:**
   ```javascript
   localStorage.setItem('agnes_progress', JSON.stringify({ totalXP: 5000 }));
   location.reload();
   ```
   - [ ] BEGINNER, ROOKIE, PRO, ELITE unlocked
   - [ ] NIGHTMARE locked

4. **Level 20 - NIGHTMARE:**
   ```javascript
   localStorage.setItem('agnes_progress', JSON.stringify({ totalXP: 10000 }));
   location.reload();
   ```
   - [ ] All difficulties unlocked

### ✅ Phase 6: Multi-Session Progression

**Natural Flow Test:**
1. [ ] Reset to Level 1
2. [ ] Complete 5 BEGINNER sessions (scores 70-90)
3. [ ] Should reach Level 2-3
4. [ ] Switch to ROOKIE (if unlocked)
5. [ ] Complete 3 ROOKIE sessions
6. [ ] XP should accumulate faster (1.2x multiplier)
7. [ ] Level up should trigger with new unlocks

### ✅ Phase 7: Streak Integration

**With Active Streak:**
1. [ ] Set up a 5-day streak manually:
   ```javascript
   const today = new Date().toISOString().split('T')[0];
   const dates = [];
   for (let i = 0; i < 5; i++) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     dates.push(d.toISOString().split('T')[0]);
   }
   localStorage.setItem('agnes_streak', JSON.stringify({
     currentStreak: 5,
     longestStreak: 5,
     lastPracticeDate: today,
     practiceDates: dates,
     milestones: { sevenDays: false, thirtyDays: false, hundredDays: false }
   }));
   location.reload();
   ```

2. [ ] Complete a session with score 80
3. [ ] Expected XP calculation:
   ```
   Base: 50
   Score Bonus: 10
   Streak Bonus: 50 (5 * 10)
   Total: 110 XP (before difficulty multiplier)
   ```

### ✅ Phase 8: Animations & Polish

**Check All Animations:**
1. [ ] XP Bar fill animation is smooth
2. [ ] Level-up modal scales in nicely
3. [ ] Fireworks/rays animation in level-up modal
4. [ ] Floating stars animation
5. [ ] Sound effect plays on level up
6. [ ] Level-up modal auto-closes after 5 seconds

**Check Visual Polish:**
1. [ ] Locked difficulties have lock icon
2. [ ] Locked difficulties show level requirement
3. [ ] XP bar uses red/gold gradient
4. [ ] Level-up modal has yellow/red theme
5. [ ] Trophy icon appears correctly

### ✅ Phase 9: Persistence

**Test Data Persistence:**
1. [ ] Complete a session, earn XP
2. [ ] Close tab completely
3. [ ] Reopen application
4. [ ] Verify XP and level are preserved
5. [ ] Verify unlocked difficulties are still unlocked

### ✅ Phase 10: Edge Cases

**Test Edge Cases:**

1. **Perfect Score:**
   - Complete session with score 100
   - Should award +50 perfect bonus XP
   - Confetti animation should trigger
   - Level-up sound plays (if leveled up)

2. **Multiple Level-Ups:**
   ```javascript
   // Give enough XP to jump multiple levels
   localStorage.setItem('agnes_progress', JSON.stringify({ totalXP: 0 }));
   const { awardXP } = await import('/src/utils/gamification.ts');
   awardXP(1000); // Jump from Level 1 to Level 5
   ```
   - [ ] Only shows one level-up modal (most recent)
   - [ ] Unlocks display correctly

3. **Zero/Low Scores:**
   - Complete session with score 50
   - Should still award base XP (50 XP)
   - No score bonus

## Console Testing Commands

**Useful console commands for testing:**

```javascript
// View current progress
const { getUserProgress } = await import('/src/utils/gamification.ts');
getUserProgress();

// Award specific XP amount
const { awardXP } = await import('/src/utils/gamification.ts');
awardXP(500);

// Check if difficulty is unlocked
const { isDifficultyUnlocked } = await import('/src/utils/gamification.ts');
isDifficultyUnlocked('PRO', 7); // true
isDifficultyUnlocked('PRO', 5); // false

// Reset progress
localStorage.removeItem('agnes_progress');
location.reload();

// View all localStorage data
Object.keys(localStorage).filter(k => k.startsWith('agnes_')).forEach(k => {
  console.log(k, JSON.parse(localStorage.getItem(k)));
});
```

## Success Criteria

**XP System is considered successful if:**

1. ✅ XP is awarded correctly after each session
2. ✅ Level-up modal appears at correct XP thresholds
3. ✅ Difficulties unlock at correct levels
4. ✅ XP Bar displays correctly in header
5. ✅ All animations are smooth and polished
6. ✅ Sound effects play at appropriate times
7. ✅ Data persists across sessions
8. ✅ No console errors during normal use
9. ✅ Mobile-responsive (XP bar shows on desktop, hidden on mobile)
10. ✅ Works with existing achievement and streak systems

## Known Behaviors

- XP Bar is hidden on mobile devices (md: breakpoint)
- Locked difficulties cannot be selected (click does nothing)
- Level-up modal appears BEFORE success modal
- Sound effects respect user's sound toggle setting
- First time users start at Level 1 with only BEGINNER unlocked

## Troubleshooting

**If XP not awarding:**
- Check console for errors
- Verify `getStreak()` is not throwing errors
- Check that `saveSession()` completed successfully

**If level-up modal not showing:**
- Verify `playLevelUp()` function exists
- Check state: `showLevelUpModal` should be true
- Look for React key warnings in console

**If difficulties not unlocking:**
- Clear localStorage and reload
- Check `getUserProgress()` returns correct level
- Verify `isDifficultyUnlocked()` logic

## Report

After testing, document:
1. All checked items from checklist
2. Any bugs or issues found
3. Screenshots of level-up modal
4. Console logs from XP calculations
5. Suggestions for improvements
