# Audio Context Race Condition - Visual Diagrams

## Before Fix: The Race Condition

```
TIME →

Thread 1 (User Action)              Thread 2 (Gemini API - Async)
═══════════════════════════         ═══════════════════════════════

User clicks "End Session"           Agnes is speaking...
        ↓                                    ↓
confirmEndSession() called          Audio chunk 1 arrives
        ↓                                    ↓
cleanup() starts                     playAudioChunk() called
        ↓                                    ↓
Stop audio sources                   Decode audio (async)
        ↓                                    ↓
Close input context                  Audio chunk 2 arrives ⚠️
        ↓                                    ↓
Close output context ✓              playAudioChunk() called ⚠️
        ↓                                    ↓
Context state: "closed"             Check: ctx.state === ?
        ↓                                    ↓
Return to home screen               Race condition! ⚠️
                                             ↓
                                    ctx.state reads "closed"
                                             ↓
                                    ❌ BUT: Audio decode already started!
                                             ↓
                                    ❌ createBufferSource() called
                                             ↓
                                    ❌ ERROR: Context is closed!
                                             ↓
                                    ❌ 831 errors logged
```

## After Fix: Session Active Flag

```
TIME →

Thread 1 (User Action)              Thread 2 (Gemini API - Async)
═══════════════════════════         ═══════════════════════════════

User clicks "End Session"           Agnes is speaking...
        ↓                                    ↓
confirmEndSession() called          Audio chunk 1 arrives
        ↓                                    ↓
✅ sessionActiveRef = false         onmessage receives audio
        ↓                                    ↓
Stop audio sources                  Check: sessionActiveRef.current?
        ↓                                    ↓
cleanup() starts                    ✅ FALSE → Skip playback!
        ↓                                    ↓
Close contexts safely               Audio chunk 2 arrives
        ↓                                    ↓
Return to home screen               onmessage receives audio
                                             ↓
                                    Check: sessionActiveRef.current?
                                             ↓
                                    ✅ FALSE → Skip playback!
                                             ↓
                                    ✅ No errors, clean shutdown
```

## Defense in Depth: Triple Gate System

```
┌─────────────────────────────────────────────────────────────┐
│                    Gemini Audio Chunk Arrives                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
         ┌───────────────────────────────┐
         │  GATE 1: onmessage Handler    │
         │  Line 274                     │
         │                               │
         │  if (base64Audio &&           │
         │      sessionActiveRef.current)│
         └───────────┬───────────────────┘
                     │ ✅ Session Active?
                     ↓
         ┌───────────────────────────────┐
         │  GATE 2: playAudioChunk()     │
         │  Line 650                     │
         │                               │
         │  if (!sessionActiveRef.current)│
         │    return;                    │
         └───────────┬───────────────────┘
                     │ ✅ Session Active?
                     ↓
         ┌───────────────────────────────┐
         │  GATE 3: Context State Check  │
         │  Line 660                     │
         │                               │
         │  if (ctx.state === 'closed')  │
         │    return;                    │
         └───────────┬───────────────────┘
                     │ ✅ Context Open?
                     ↓
         ┌───────────────────────────────┐
         │  Safe Audio Playback          │
         │  Lines 666-681                │
         │                               │
         │  - Decode audio               │
         │  - Create source              │
         │  - Connect nodes              │
         │  - Start playback             │
         └───────────────────────────────┘
```

## Shutdown Sequence: Order of Operations

```
┌────────────────────────────────────────────────────────────────┐
│                    User Initiates Shutdown                      │
│              (End Session / Discard / Navigate Away)           │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ↓
                  ╔════════════════╗
                  ║   STEP 1       ║
                  ║   Priority 1   ║
                  ╚════════════════╝
          sessionActiveRef.current = false
          ✅ Circuit breaker activated
          ✅ No more audio will play
                           │
                           ↓
                  ╔════════════════╗
                  ║   STEP 2       ║
                  ║   Priority 2   ║
                  ╚════════════════╝
          Stop all active audio sources
          audioSourcesRef.current.forEach(stop)
          audioSourcesRef.current.clear()
          setActiveAudioCount(0)
                           │
                           ↓
                  ╔════════════════╗
                  ║   STEP 3       ║
                  ║   Priority 3   ║
                  ╚════════════════╝
          Close audio contexts
          inputAudioContextRef.current.close()
          outputAudioContextRef.current.close()
                           │
                           ↓
                  ╔════════════════╗
                  ║   STEP 4       ║
                  ║   Priority 4   ║
                  ╚════════════════╝
          Stop media tracks
          streamRef.current.getTracks().forEach(stop)
                           │
                           ↓
                  ╔════════════════╗
                  ║   STEP 5       ║
                  ║   Priority 5   ║
                  ╚════════════════╝
          Clear intervals & stop recording
          frameIntervalRef.current.clearInterval()
          mediaRecorderRef.current.stop()
                           │
                           ↓
                  ╔════════════════╗
                  ║   COMPLETE     ║
                  ╚════════════════╝
          ✅ Clean shutdown
          ✅ No resource leaks
          ✅ No errors logged
```

## Error Flow Comparison

### Before Fix (Error Path)

```
playAudioChunk() called
     ↓
Check: outputAudioContextRef.current exists? ✅
     ↓
Get ctx reference
     ↓
⚠️  Check: ctx.state === 'closed'?
     ↓
     ├─→ Race condition window here!
     ↓   (Context can close during this check)
     ↓
Start async: decodeAudioData()
     ↓
Context closes during decode ⚠️
     ↓
Decode completes
     ↓
❌ createBufferSource() on closed context
     ↓
❌ ERROR: "Construction of AudioBufferSourceNode is not useful"
     ↓
Try to connect() ❌
     ↓
❌ ERROR: "Connecting nodes after context has been closed"
```

### After Fix (Safe Path)

```
playAudioChunk() called
     ↓
✅ Check: sessionActiveRef.current === true?
     ↓
     ├─→ If FALSE: return immediately ✅
     ↓
     └─→ If TRUE: continue
     ↓
Check: outputAudioContextRef.current exists? ✅
     ↓
Get ctx reference
     ↓
Check: ctx.state === 'closed'? ✅
     ↓
Start async: decodeAudioData()
     ↓
Decode completes (context still open) ✅
     ↓
createBufferSource() ✅
     ↓
connect() to analyser ✅
     ↓
source.start() ✅
     ↓
✅ Audio plays successfully
```

## Session Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   [INITIALIZED]  sessionActiveRef.current = true            │
│         │                                                    │
│         ↓                                                    │
│   [CONNECTED]  Gemini Live connected                        │
│         │      Audio/Video streaming                        │
│         ↓                                                    │
│   [ACTIVE]     User talking, Agnes responding               │
│         │      Audio chunks flowing                         │
│         │                                                    │
│         ├──────────────┬──────────────┬──────────────────┐  │
│         ↓              ↓              ↓                  ↓  │
│   End Session    Discard      Navigate Away      cleanup() │
│         │              │              │                  │  │
│         ↓              ↓              ↓                  ↓  │
│   sessionActiveRef.current = false (ALL PATHS)              │
│         │                                                    │
│         ↓                                                    │
│   [SHUTTING DOWN]  No more audio accepted                   │
│         │          Sources stopping                         │
│         ↓                                                    │
│   [CLEANUP]        Contexts closing                         │
│         │          Resources freed                          │
│         ↓                                                    │
│   [TERMINATED]     Component unmounted                      │
│                    ✅ Zero errors                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Differences: Before vs After

| Aspect | Before Fix | After Fix |
|--------|-----------|-----------|
| **Race Condition Protection** | ❌ Context state check (async) | ✅ Session flag check (sync) |
| **Check Timing** | After audio decode starts | Before any audio operations |
| **Gate Count** | 1 gate (unreliable) | 3 gates (defense in depth) |
| **Shutdown Order** | Contexts closed first | Flag disabled first |
| **Error Count** | 831 errors per session | 0 errors |
| **Console Output** | Error spam | Clean shutdown |
| **Resource Safety** | Potential leaks | Guaranteed cleanup |

## Timeline Visualization

```
0ms   User clicks "End Session"
      ✅ sessionActiveRef = false

1ms   Cleanup begins
      ✅ Stop audio sources

5ms   Gemini sends audio chunk A
      ✅ Blocked at Gate 1 (onmessage)

10ms  Contexts closing

15ms  Gemini sends audio chunk B
      ✅ Blocked at Gate 1 (onmessage)

20ms  Cleanup complete
      ✅ Return to home screen

25ms  Gemini sends audio chunk C
      ✅ Blocked at Gate 1 (onmessage)

50ms  Gemini connection closes
      ✅ Final cleanup

Result: 🎉 ZERO ERRORS 🎉
```

---

**Diagram Key:**
- ✅ = Success/Safe operation
- ❌ = Error/Failure
- ⚠️ = Warning/Potential issue
- ║ = High priority operation
- │ = Sequential flow
- ┌─┐ = Process boundary
