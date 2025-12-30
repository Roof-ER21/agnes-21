# Voice Options Fix - Agnes 21

## Problem Summary
Voice options were not showing up in the Agnes 21 app. The custom voice toggle was conditionally hidden when TTS backend was unavailable, providing no feedback to users.

## Root Causes Identified

### Issue 1: Hidden Toggle Button
- **Location**: `/Users/a21/agnes-21/components/PitchTrainer.tsx` (line 951)
- **Problem**: Custom voice toggle only rendered when `ttsAvailable === true`
- **Impact**: Users couldn't see the feature existed if TTS backend wasn't running

### Issue 2: No UI Feedback
- **Problem**: When TTS unavailable, no indication why or how to enable
- **Impact**: Poor user experience, confusion about missing feature

### Issue 3: Missing Script Voice Selection UI
- **Location**: `/Users/a21/agnes-21/utils/phoneScripts.ts` (line 12)
- **Problem**: Voice property defined but no UI component to select voices
- **Impact**: Script voice options not accessible to users

## Fixes Implemented

### Fix 1: Always-Visible Voice Toggle with Status Indicators

**File**: `/Users/a21/agnes-21/components/PitchTrainer.tsx`

**Changes**:
1. Removed conditional rendering (`{ttsAvailable && ...}`)
2. Added three visual states:
   - **Loading** (gray, cursor-wait): Checking TTS availability
   - **Disabled** (gray, opacity-50, red dot): TTS unavailable
   - **Active** (purple glow, purple dot): Custom voice enabled
   - **Inactive** (neutral, hover effects): Custom voice available but off

3. Added visual indicators:
   - Red dot badge when TTS unavailable
   - Purple pulsing dot when custom voice active
   - Disabled state with `cursor-not-allowed`

4. Enhanced tooltips:
   - "Checking custom voice availability..." (loading)
   - "Custom voice unavailable (TTS backend not running)" (disabled)
   - "Using Reeses Piecies custom voice (click for standard Gemini voice)" (active)
   - "Switch to Reeses Piecies custom voice" (inactive)

### Fix 2: Enhanced Console Logging

**File**: `/Users/a21/agnes-21/components/PitchTrainer.tsx` (lines 207-229)

**Added detailed console feedback**:
```typescript
// When TTS available:
✅ Chatterbox TTS is available - custom voice enabled
   Voice: Reeses Piecies
   Press "C" or click the wand icon to toggle custom voice

// When TTS unavailable:
⚠️ Chatterbox TTS backend not responding
   Custom voice will be disabled
   To enable: Start TTS backend at http://localhost:8000
```

### Fix 3: Updated Keyboard Shortcuts Panel

**File**: `/Users/a21/agnes-21/components/PitchTrainer.tsx` (lines 1205-1211)

**Changes**:
- Removed conditional rendering of "Toggle Custom Voice" shortcut
- Always show "C" key shortcut with status indicator
- Display "(disabled)" label when TTS unavailable

## User Experience Improvements

### Before
- No visible toggle when TTS backend down
- No indication feature exists
- Confusing for users expecting voice options

### After
- Toggle always visible with clear status
- Visual indicators (red/purple dots)
- Helpful tooltips explaining state
- Console logs guide setup
- Keyboard shortcut always discoverable

## How to Test

### Test 1: TTS Backend Running
1. Start TTS backend: `cd /path/to/chatterbox && python app.py`
2. Open Agnes 21 app
3. Start a training session
4. Check console for: "✅ Chatterbox TTS is available"
5. Verify wand icon is enabled (neutral/purple state)
6. Click wand icon - should toggle to purple with pulsing dot
7. Press "C" key - should toggle custom voice

### Test 2: TTS Backend Not Running
1. Ensure TTS backend is NOT running
2. Open Agnes 21 app
3. Start a training session
4. Check console for: "⚠️ Chatterbox TTS backend not responding"
5. Verify wand icon shows with red dot badge
6. Hover wand icon - tooltip says "Custom voice unavailable"
7. Click wand icon - should do nothing (disabled state)
8. Press "?" to see shortcuts - "Toggle Custom Voice (disabled)"

### Test 3: Visual States
1. On session start, wand icon should show loading state (gray, cursor-wait)
2. After health check (~1s), should change to available/unavailable state
3. When custom voice enabled, purple pulsing dot appears
4. Button has proper hover states and transitions

## Technical Details

### Component State Flow
```typescript
ttsAvailable: boolean | null
  null → Checking (initial state)
  true → TTS available (enable toggle)
  false → TTS unavailable (disable toggle, show red dot)

useCustomVoice: boolean
  true → Custom voice active (show purple dot)
  false → Standard Gemini voice
```

### Voice Options Available
From `/Users/a21/agnes-21/utils/chatterboxTTS.ts`:
- `reeses_piecies` (default feedback voice)
- `agnes_21` (default homeowner voice)
- `21` (default salesperson voice)
- `rufus` (additional voice)

### Script Voice Options
From `/Users/a21/agnes-21/utils/phoneScripts.ts`:
- Scripts can specify voice property
- Example: `voice: 'agnes_21'` (line 161)
- Currently no UI to select - future enhancement needed

## Future Enhancements

### Recommended
1. Add voice selector dropdown in script view
2. Allow per-script voice customization
3. Add voice preview/test button
4. Show available voices list in UI
5. Add TTS backend connection status in header

### Optional
1. Retry TTS health check periodically
2. Auto-reconnect when backend becomes available
3. Fallback voice chain visualization
4. Voice waveform color coding by voice type

## Files Modified

1. `/Users/a21/agnes-21/components/PitchTrainer.tsx`
   - Lines 950-993: Custom voice toggle (always visible with states)
   - Lines 207-229: Enhanced TTS health check logging
   - Lines 1205-1211: Keyboard shortcuts panel update

## Dependencies

- Chatterbox TTS backend must run at: `http://localhost:8000`
- Health check endpoint: `http://localhost:8000/api/tts/health`
- Voice generation endpoint: `http://localhost:8000/api/tts/generate`

## Environment Variables

```bash
VITE_TTS_API_URL=http://localhost:8000  # Default if not set
```

## Verification Checklist

- [x] Custom voice toggle always visible
- [x] Three states: loading, available, unavailable
- [x] Visual indicators (red/purple dots)
- [x] Tooltips provide context
- [x] Console logs guide setup
- [x] Keyboard shortcut always shown
- [x] Disabled state prevents clicks
- [x] TypeScript compilation (warnings unrelated to changes)
- [x] Accessibility attributes updated

## Notes

- The fix ensures graceful degradation when TTS backend unavailable
- Users can now discover the feature exists and understand how to enable it
- Script voice selection UI is a separate enhancement (not in this fix)
- All changes maintain backward compatibility
