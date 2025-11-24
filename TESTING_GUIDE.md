# Audio Context Fix - Testing Guide

## Pre-Testing Setup

1. **Open Browser Console**
   - Press F12 (Chrome/Edge) or Cmd+Option+I (Mac)
   - Go to Console tab
   - Enable "Preserve log" to capture errors during navigation

2. **Clear Previous Errors**
   - Click console "Clear" button
   - Fresh start for accurate error counting

3. **Enable Verbose Logging**
   - Console should show all logs, warnings, and errors

## Test Scenarios

### Test 1: Basic Session End
**Goal**: Verify no errors when ending session normally

**Steps**:
1. Start a training session (any difficulty/mode)
2. Wait for Agnes to connect (see "AGNES 21 // LIVE" indicator)
3. Speak a few words to trigger Agnes response
4. While Agnes is speaking, click "End Session"
5. Click "Save & End Session"

**Expected Results**:
- ✅ Session saves successfully
- ✅ Success modal appears
- ✅ Console shows: "Session inactive, skipping audio playback"
- ✅ **ZERO** AudioBufferSourceNode errors
- ✅ **ZERO** "Connecting nodes" errors

**Pass Criteria**: No audio context errors in console

---

### Test 2: Rapid Session End
**Goal**: Test race condition under stress

**Steps**:
1. Start training session
2. Immediately click "End Session" (before Agnes speaks)
3. Click "Save & End Session"
4. Repeat 3-5 times quickly

**Expected Results**:
- ✅ All sessions save successfully
- ✅ No audio errors in console
- ✅ No memory leaks (check browser task manager)

**Pass Criteria**: Consistent clean shutdowns

---

### Test 3: End During Active Speech
**Goal**: Test shutdown while audio is actively playing

**Steps**:
1. Start training session
2. Say: "Tell me about roofing for 30 seconds"
3. Wait for Agnes to start long response
4. Mid-sentence, click "End Session"
5. Immediately click "Save & End Session"

**Expected Results**:
- ✅ Agnes speech cuts off cleanly
- ✅ No audio glitches or clicks
- ✅ Console shows "Session inactive" messages
- ✅ **ZERO** audio context errors

**Pass Criteria**: Clean audio cutoff, no errors

---

### Test 4: Discard Session Path
**Goal**: Test alternative shutdown path

**Steps**:
1. Start training session
2. Have brief conversation with Agnes
3. Click "End Session"
4. Click "Discard session without saving"

**Expected Results**:
- ✅ Returns to home immediately
- ✅ Session NOT saved in history
- ✅ No audio errors in console
- ✅ Audio stops cleanly

**Pass Criteria**: Clean discard, no errors

---

### Test 5: Browser Navigation
**Goal**: Test cleanup on page navigation

**Steps**:
1. Start training session
2. While Agnes is speaking, click browser back button
3. Or refresh the page (Cmd+R / Ctrl+R)

**Expected Results**:
- ✅ Component unmounts cleanly
- ✅ cleanup() runs automatically
- ✅ No audio errors in console

**Pass Criteria**: Clean unmount, no errors

---

### Test 6: Multiple Audio Chunks
**Goal**: Test with high audio traffic

**Steps**:
1. Start training session
2. Say: "Give me a detailed explanation of roofing types"
3. Agnes will send many audio chunks
4. While Agnes is still speaking (mid-explanation), click "End Session"
5. Click "Save & End Session"

**Expected Results**:
- ✅ All pending audio chunks silently discarded
- ✅ Console shows multiple "Session inactive, skipping" messages
- ✅ **ZERO** audio context errors
- ✅ Session saves successfully

**Pass Criteria**: All audio chunks blocked, no errors

---

### Test 7: Video Playback During Session
**Goal**: Test interaction with video player

**Steps**:
1. Start training session
2. Open Session History (if visible)
3. Try to play a previous session video while current session active
4. End current session

**Expected Results**:
- ✅ Video player doesn't interfere
- ✅ Current session ends cleanly
- ✅ No audio context conflicts

**Pass Criteria**: No cross-contamination between contexts

---

### Test 8: Extended Session
**Goal**: Test stability over longer sessions

**Steps**:
1. Start training session
2. Have 5+ minute conversation with Agnes
3. Let Agnes speak multiple times
4. End session normally

**Expected Results**:
- ✅ Session remains stable throughout
- ✅ All audio chunks play correctly
- ✅ Clean shutdown at end
- ✅ No memory leaks

**Pass Criteria**: Stable long session, clean end

---

## Error Monitoring

### Console Filters

**To find audio errors** (should be zero):
```
AudioBufferSourceNode
Connecting nodes
context is closed
context has been closed
```

**To verify fix is working** (should see these):
```
Session inactive, skipping audio playback
```

### Browser DevTools Memory Check

1. Open DevTools → Performance → Memory
2. Start training session
3. End session
4. Force garbage collection (click trash icon)
5. Verify memory drops back to baseline

**Expected**: No memory leaks, audio contexts properly closed

---

## Success Metrics

### Before Fix (Baseline - DO NOT RETEST)
```
End single session:
  277x "Construction of AudioBufferSourceNode..."
  554x "Connecting nodes after context closed..."
  ────────────────────────────────────────────
  831 ERRORS per session end
```

### After Fix (Target - TEST NOW)
```
End single session:
  0x AudioBufferSourceNode errors
  0x Connecting nodes errors
  ────────────────────────────────────────────
  0 ERRORS per session end ✅
```

### What You Should See in Console

**Good Output** (Expected):
```
Gemini Live Session Opened
Recording started
Session inactive, skipping audio playback
Session inactive, skipping audio playback
Session inactive, skipping audio playback
Recording stopped
✅ Video recording saved successfully
Session abc123 saved successfully
Gemini Live Session Closed
```

**Bad Output** (Should NOT see):
```
❌ Error: Construction of AudioBufferSourceNode is not useful when context is closed
❌ Error: Connecting nodes after the context has been closed is not useful
```

---

## Regression Testing

After confirming the fix works, test these to ensure nothing broke:

1. **Audio Playback Quality**
   - ✅ Agnes voice sounds normal
   - ✅ No distortion or clipping
   - ✅ Smooth playback during session

2. **Video Recording**
   - ✅ Video saves successfully
   - ✅ Playback works in Session History
   - ✅ Thumbnail generates correctly

3. **Session Saving**
   - ✅ Transcripts save correctly
   - ✅ Scores persist
   - ✅ Duration tracked accurately

4. **UI Responsiveness**
   - ✅ End Session button works
   - ✅ Modals appear correctly
   - ✅ Navigation smooth

---

## Troubleshooting

### If You Still See Errors

1. **Hard refresh**: Ctrl+Shift+R (PC) or Cmd+Shift+R (Mac)
2. **Clear cache**: DevTools → Application → Clear storage
3. **Verify build**: Check console for correct bundle hash
4. **Check file**: View source, verify `sessionActiveRef` exists

### If Audio Doesn't Play at All

- Check: `sessionActiveRef.current` should be `true` during active session
- Check: Don't see "Session inactive" messages TOO early
- Check: Audio contexts created successfully

### If Session Doesn't Save

- Unrelated to this fix
- Check localStorage not full
- Check IndexedDB available

---

## Automated Test (Optional)

If you want to write an automated test:

```javascript
// Pseudo-code for automated testing
test('Audio context cleanup prevents errors', async () => {
  // Start session
  const { unmount } = render(<PitchTrainer ... />);

  // Simulate audio chunks arriving
  mockGeminiAudioChunks(10);

  // End session while audio playing
  fireEvent.click(getByText('End Session'));
  fireEvent.click(getByText('Save & End Session'));

  // Verify no errors
  expect(console.error).not.toHaveBeenCalledWith(
    expect.stringContaining('AudioBufferSourceNode')
  );

  expect(console.error).not.toHaveBeenCalledWith(
    expect.stringContaining('Connecting nodes')
  );
});
```

---

## Sign-Off Checklist

After testing, verify:

- [ ] Test 1 (Basic End) - PASS
- [ ] Test 2 (Rapid End) - PASS
- [ ] Test 3 (During Speech) - PASS
- [ ] Test 4 (Discard) - PASS
- [ ] Test 5 (Navigation) - PASS
- [ ] Test 6 (Multiple Chunks) - PASS
- [ ] Test 7 (Video Interaction) - PASS (if applicable)
- [ ] Test 8 (Extended Session) - PASS
- [ ] Zero console errors confirmed
- [ ] No regressions detected
- [ ] Memory usage normal

**Tester Name**: _________________
**Date**: _________________
**Result**: PASS / FAIL

---

**Testing Duration**: ~15-20 minutes for full suite
**Priority Tests**: 1, 3, 6 (core race condition scenarios)
