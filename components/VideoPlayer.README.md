# VideoPlayer Component

A comprehensive custom video player with synchronized transcript overlay for the Agnes-21 pitch training platform.

## Overview

The VideoPlayer component provides a full-featured video playback experience with real-time transcript synchronization. It loads video recordings from IndexedDB and session transcripts from localStorage, displaying them in an elegant cyberpunk-themed interface.

## Features

### Video Playback
- **Custom Video Controls**: Full set of playback controls with cyberpunk aesthetic
- **Progress Bar**: Click-to-seek timeline with hover preview
- **Playback Speed**: Toggle between 0.5x, 1x, 1.5x, and 2x speeds
- **Volume Control**: Slider with mute toggle (hover to reveal)
- **Fullscreen Support**: Toggle fullscreen mode
- **Skip Controls**: Jump backward/forward 5 seconds
- **Loading States**: Spinner and error handling

### Synchronized Transcript
- **Auto-Scroll**: Automatically scrolls to current message
- **Active Highlighting**: Current message highlighted in red
- **Click-to-Jump**: Click any message to seek to that point
- **Score Badges**: Display scores on Agnes messages
- **Speaker Colors**: Color-coded speakers (Agnes = red, User = blue)
- **Timestamps**: Show time for each message

### Keyboard Shortcuts
- **Space** or **K**: Play/Pause
- **Left Arrow**: Skip backward 5 seconds
- **Right Arrow**: Skip forward 5 seconds
- **Up Arrow**: Increase volume
- **Down Arrow**: Decrease volume
- **F**: Toggle fullscreen
- **M**: Toggle mute
- **Escape**: Close player (or exit fullscreen if active)

### Performance
- **Throttled Updates**: Timeline updates throttled to 100ms
- **Smooth Scrolling**: Smooth auto-scroll for transcript
- **Memory Management**: Automatic cleanup of blob URLs
- **Efficient Rendering**: Memoized calculations for active message

## Installation

The component is already created at `/Users/a21/agnes-21/components/VideoPlayer.tsx`.

No additional dependencies required beyond what's already in the project:
- React 19
- lucide-react (icons)
- Tailwind CSS (styling)

## Usage

### Basic Usage

```tsx
import { VideoPlayer } from './components/VideoPlayer'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  return (
    <>
      <button onClick={() => {
        setSessionId('session_1234567890_abc123')
        setIsOpen(true)
      }}>
        Watch Replay
      </button>

      {isOpen && sessionId && (
        <VideoPlayer
          sessionId={sessionId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
```

### Integration with Session History

```tsx
import { VideoPlayer } from './components/VideoPlayer'
import { hasVideoRecording } from '../utils/videoStorage'
import { getSessions } from '../utils/sessionStorage'

function SessionHistory() {
  const [playingSession, setPlayingSession] = useState<string | null>(null)
  const sessions = getSessions()

  return (
    <div>
      {sessions.map(session => (
        <div key={session.sessionId}>
          <h3>{session.mode} - {session.difficulty}</h3>
          <p>Score: {session.finalScore}</p>

          <button onClick={async () => {
            const hasVideo = await hasVideoRecording(session.sessionId)
            if (hasVideo) {
              setPlayingSession(session.sessionId)
            } else {
              alert('Video not available for this session')
            }
          }}>
            Watch Replay
          </button>
        </div>
      ))}

      {playingSession && (
        <VideoPlayer
          sessionId={playingSession}
          onClose={() => setPlayingSession(null)}
        />
      )}
    </div>
  )
}
```

## Props

### VideoPlayerProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | `string` | Yes | Session ID to load video and transcript |
| `onClose` | `() => void` | Yes | Callback when user closes the player |

## Data Requirements

### Video Recording (IndexedDB)
The component expects video recordings to be stored in IndexedDB using the `videoStorage` utility:

```typescript
interface VideoRecording {
  sessionId: string
  recordedAt: Date
  duration: number
  size: number
  mimeType: string
  videoBlob: Blob
  thumbnail?: string
  metadata?: {
    difficulty?: string
    mode?: string
    finalScore?: number
  }
}
```

### Session Data (localStorage)
The component expects session data to be stored in localStorage using the `sessionStorage` utility:

```typescript
interface SessionData {
  sessionId: string
  timestamp: Date
  difficulty: DifficultyLevel
  mode: PitchMode
  script: string
  transcript: TranscriptMessage[]
  finalScore?: number
  duration?: number
}

interface TranscriptMessage {
  role: 'user' | 'agnes'
  text: string
  timestamp: Date
  score?: number
}
```

## Component Architecture

### State Management
- **Video State**: URL, loading, error, playback state
- **Playback State**: Playing, time, duration, volume, speed
- **Transcript State**: Messages, session start time, active index
- **UI State**: Fullscreen, volume slider visibility

### Refs
- `videoRef`: Reference to HTML video element
- `containerRef`: Reference to fullscreen container
- `progressRef`: Reference to progress bar for click handling
- `transcriptContainerRef`: Reference to transcript scroll container
- `activeMessageRef`: Reference to currently active message

### Effects
1. **Data Loading**: Loads video from IndexedDB and transcript from localStorage
2. **Cleanup**: Revokes blob URL on unmount
3. **Keyboard Listeners**: Adds/removes keyboard event handlers
4. **Auto-Scroll**: Scrolls transcript to active message

### Callbacks
- `togglePlay`: Play/pause video
- `handleSeek`: Seek to specific time
- `skipTime`: Skip forward/backward
- `handleVolumeChange`: Adjust volume
- `toggleMute`: Mute/unmute
- `changePlaybackSpeed`: Cycle through speeds
- `toggleFullscreen`: Enter/exit fullscreen
- `handleMessageClick`: Jump to message timestamp

## Styling

The component uses Tailwind CSS with a cyberpunk dark theme:
- **Background**: `bg-neutral-950` (almost black)
- **Panels**: `bg-neutral-900` (dark gray)
- **Borders**: `border-neutral-800` (subtle borders)
- **Accents**: Red (`bg-red-500`, `text-red-500`)
- **Glassmorphism**: `bg-black/80 backdrop-blur-sm`

### Custom Styles
- Progress bar with hover effects
- Volume slider with custom range input styling
- Transcript messages with conditional highlighting
- Smooth transitions and animations

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus states
- **Screen Reader Support**: Semantic HTML structure

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Video Formats**: Supports WebM (VP9/VP8) and MP4
- **Fullscreen API**: Standard Fullscreen API support required
- **IndexedDB**: IndexedDB support required

### Mobile Support
- `playsInline` attribute for iOS
- Touch-friendly controls
- Responsive layout
- Scrollable transcript

## Performance Considerations

### Optimizations
1. **Throttled Updates**: Video time updates throttled to 100ms
2. **Memoized Calculations**: Active message index memoized
3. **Callback Memoization**: useCallback for all event handlers
4. **Efficient Rendering**: Conditional rendering for active states

### Memory Management
- Blob URLs are created and revoked properly
- Event listeners cleaned up on unmount
- No memory leaks from refs or state

### Large Videos
- Videos loaded from IndexedDB as blobs
- Object URLs created on-demand
- Supports videos up to browser storage limits
- Automatic cleanup on component unmount

## Error Handling

The component handles various error scenarios:

1. **Video Not Found**: Shows error screen
2. **Session Not Found**: Shows error screen
3. **Video Load Failure**: Shows error message
4. **Playback Errors**: Catches and displays playback errors
5. **Fullscreen Errors**: Gracefully handles fullscreen API failures

### Error States
```tsx
if (error || !videoUrl) {
  return (
    <div className="error-screen">
      <p>{error || 'Video not found'}</p>
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

## Troubleshooting

### Video Won't Play
1. Check if video recording exists in IndexedDB
2. Verify video blob is valid
3. Check browser console for errors
4. Ensure video format is supported

### Transcript Not Syncing
1. Verify session data has transcript with timestamps
2. Check that timestamps are Date objects
3. Ensure session start time is set correctly
4. Verify video currentTime updates

### Keyboard Shortcuts Not Working
1. Ensure no input elements have focus
2. Check browser console for errors
3. Verify event listeners are attached
4. Test in different browsers

### Performance Issues
1. Check video file size
2. Verify throttling is working (100ms)
3. Check browser performance tools
4. Ensure no memory leaks

## Future Enhancements

Potential improvements for future versions:

- **Picture-in-Picture**: Support for PiP mode
- **Thumbnails**: Preview thumbnails on progress bar hover
- **Chapters**: Support for chapter markers
- **Annotations**: Allow adding notes/comments
- **Export**: Export transcript or video segments
- **Analytics**: Track viewing statistics
- **Multi-Language**: Support for transcript translations
- **Captions**: Support for closed captions

## License

Part of the Agnes-21 training platform.

## Support

For issues or questions:
1. Check this documentation
2. Review the example file (`VideoPlayer.example.tsx`)
3. Check browser console for errors
4. Verify data integrity in IndexedDB/localStorage

## Related Files

- `/Users/a21/agnes-21/components/VideoPlayer.tsx` - Main component
- `/Users/a21/agnes-21/components/VideoPlayer.example.tsx` - Usage examples
- `/Users/a21/agnes-21/utils/videoStorage.ts` - Video storage utilities
- `/Users/a21/agnes-21/utils/sessionStorage.ts` - Session storage utilities
- `/Users/a21/agnes-21/types.ts` - TypeScript type definitions
