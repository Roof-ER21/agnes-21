# Testing the Celebration System

## Quick Testing Guide

### Step 1: Start Development Server
```bash
cd /Users/a21/agnes-21
npm run dev
```

### Step 2: Start a Training Session
1. Click "Start Training" or "Practice Pitch"
2. Select any difficulty level
3. Allow microphone and camera permissions

### Step 3: Test Celebrations

#### Test Perfect Score (100) - Confetti + Perfect Sound
1. During the session, say: "Agnes, can you score me at 100?"
2. Click "End Session"
3. Click "Save & End Session"
4. **Expected Results:**
   - 🎉 Confetti falls from top of screen (rainbow colors)
   - 🎵 Triumphant chord plays (C-E-G major chord)
   - ⏱️ Lasts 3 seconds
   - Success modal shows "Final Score: 100/100"

#### Test High Score (85-94) - Sparkles + Success Sound
1. During session, say: "Agnes, give me a score of 90"
2. Click "End Session"
3. Click "Save & End Session"
4. **Expected Results:**
   - ✨ Gold sparkles radiate from center (medium intensity)
   - 🎵 Pleasant rising chime plays (E5 → C6)
   - ⏱️ Lasts 2 seconds
   - Success modal shows "Final Score: 90/100"

#### Test Very High Score (95-99) - High Intensity Sparkles
1. During session, say: "Agnes, score me at 97"
2. Click "End Session"
3. Click "Save & End Session"
4. **Expected Results:**
   - ✨✨ Gold sparkles radiate from center (HIGH intensity - 50 sparkles)
   - 🎵 Success chime plays
   - ⏱️ Lasts 2 seconds
   - Success modal shows "Final Score: 97/100"

#### Test Low Score (<85) - No Celebration
1. During session, say: "Agnes, give me a score of 75"
2. Click "End Session"
3. Click "Save & End Session"
4. **Expected Results:**
   - ❌ No confetti
   - ❌ No sparkles
   - ❌ No celebration sound
   - ✅ Success modal shows "Final Score: 75/100"

### Step 4: Test Sound Toggle

#### Mute Sounds
1. Look for the speaker icon in the header (top right)
2. Click the speaker icon (should show Volume2 icon in yellow)
3. Icon changes to VolumeX (muted, gray)
4. Trigger a celebration (score 100 or 85+)
5. **Expected Results:**
   - ✅ Visual celebration still plays (confetti/sparkles)
   - ❌ No sound plays
   - Preference saved to localStorage

#### Unmute Sounds
1. Click the speaker icon again
2. Icon changes back to Volume2 (yellow)
3. Trigger a celebration
4. **Expected Results:**
   - ✅ Visual celebration plays
   - ✅ Sound plays
   - Preference saved to localStorage

### Step 5: Test Persistence

#### Test Sound Preference Persists
1. Mute sounds (click speaker icon)
2. Close browser tab
3. Open application again
4. **Expected Results:**
   - Speaker icon shows VolumeX (muted state)
   - Sounds remain muted
   - localStorage has `agnes_sounds_enabled: "false"`

#### Test Across Sessions
1. Complete a session with score 100
2. Click "Close" on success modal
3. Start another session immediately
4. Complete with score 90
5. **Expected Results:**
   - First session: Confetti + Perfect sound
   - Second session: Sparkles + Success sound
   - Both work correctly without interference

## Visual Inspection Checklist

### Confetti Animation
- [ ] Particles fall from top of screen
- [ ] Rainbow colors (red, gold, orange, yellow, pink)
- [ ] Particles rotate as they fall
- [ ] Particles drift horizontally (not just straight down)
- [ ] Particles fade out in last 500ms
- [ ] Animation completes in 3 seconds
- [ ] No particles remain after animation ends
- [ ] Doesn't block clicking on success modal

### Sparkles Animation
- [ ] Sparkles radiate from center of screen
- [ ] Gold gradient colors (gold → orange → dark orange)
- [ ] Star shapes visible
- [ ] Sparkles scale up then down
- [ ] Sparkles rotate 360 degrees
- [ ] Medium intensity: ~30 sparkles
- [ ] High intensity: ~50 sparkles
- [ ] Animation completes in 2 seconds
- [ ] No sparkles remain after animation ends

### Sound Effects
- [ ] Perfect sound: 3-note chord (rich, triumphant)
- [ ] Success sound: Rising chime (pleasant, uplifting)
- [ ] Level-up sound: 4-note arpeggio (ascending)
- [ ] No distortion or clipping
- [ ] Sounds complete cleanly
- [ ] No audio artifacts or pops

### UI Elements
- [ ] Sound toggle button visible in header
- [ ] Volume2 icon when enabled (yellow)
- [ ] VolumeX icon when disabled (gray)
- [ ] Button hover effect works
- [ ] Tooltip shows on hover
- [ ] Button accessible via keyboard (Tab + Enter)

## Performance Testing

### CPU Usage
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Trigger a celebration
5. Stop recording after animation completes
6. **Expected Results:**
   - No frame drops during animation
   - CPU usage spike <5% on modern devices
   - Animation runs at 60 FPS

### Memory Leaks
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Trigger 10 celebrations in a row
4. Take another heap snapshot
5. **Expected Results:**
   - No significant memory growth
   - All animations cleanup properly
   - No detached DOM nodes

### Mobile Testing
1. Open on mobile device or emulator
2. Trigger celebrations
3. **Expected Results:**
   - Confetti animates smoothly (30+ FPS)
   - Sparkles animate smoothly
   - Touch interactions work
   - Sound toggle works
   - No lag or stuttering

## Accessibility Testing

### Screen Reader
1. Enable screen reader (VoiceOver/NVDA)
2. Navigate to sound toggle button
3. Trigger celebration
4. **Expected Results:**
   - Sound toggle announces state correctly
   - Celebrations don't interrupt screen reader
   - Success modal announces score
   - No duplicate announcements

### Keyboard Navigation
1. Use Tab to navigate to sound toggle
2. Press Enter to toggle
3. Use Tab to navigate to "End Session"
4. Press Enter to confirm
5. **Expected Results:**
   - Focus indicators visible
   - All buttons reachable via keyboard
   - Celebrations don't steal focus
   - Modal traps focus correctly

### High Contrast Mode
1. Enable Windows High Contrast mode
2. Trigger celebrations
3. **Expected Results:**
   - Sound toggle icon still visible
   - Confetti colors visible
   - Sparkles visible
   - Success modal readable

## Edge Cases

### No Score Available
1. End session without asking Agnes for score
2. Click "Save & End Session"
3. **Expected Results:**
   - No celebration triggers
   - Success modal shows "Final Score: N/A"
   - No errors in console

### Rapid Session Completion
1. Start session
2. Immediately end session (get score 100)
3. Quickly start another session
4. Immediately end that session (get score 85)
5. **Expected Results:**
   - First celebration plays completely
   - Second celebration starts after first ends
   - No overlap or interference
   - Both sounds play correctly

### Browser Tab Inactive
1. Start session and get score 100
2. Switch to another browser tab
3. Click "End Session" in background
4. **Expected Results:**
   - Celebration still triggers when tab becomes active
   - Sound plays when tab becomes active
   - Animation completes normally

## Troubleshooting

### Confetti Not Showing
- Check browser console for errors
- Verify Confetti.tsx is imported correctly
- Check `showConfetti` state is set to true
- Verify z-index is 100 (above other elements)

### Sounds Not Playing
- Check speaker icon state (should be Volume2, not VolumeX)
- Check browser console for Web Audio API errors
- Verify browser allows audio playback
- Try clicking page first (browsers block audio before user interaction)

### Sparkles Not Visible
- Check browser console for errors
- Verify Sparkles.tsx is imported correctly
- Check `showSparkles` state is set to true
- Verify CSS animations are enabled

### Performance Issues
- Check number of confetti particles (should be 80)
- Verify requestAnimationFrame is used (not setInterval)
- Check if other animations are running simultaneously
- Test on different device/browser

## Success Criteria

✅ **All tests pass when:**
1. Score 100 → Confetti + Perfect sound
2. Score 85-99 → Sparkles + Success sound
3. Score <85 → No celebration
4. Sound toggle persists across sessions
5. Animations smooth at 60 FPS
6. No memory leaks after 10 celebrations
7. Works on mobile devices
8. Accessible via keyboard and screen reader
9. No console errors or warnings
10. Success modal shows correct score

---

**Testing Environment:**
- Browser: Chrome 120+, Firefox 120+, Safari 17+
- Device: Desktop (primary), Mobile (secondary)
- Node: 20.x
- npm: 10.x

**Last Updated:** November 27, 2025
