# VideoPlayer - Quick Reference Card

## Import
```tsx
import { VideoPlayer } from './components/VideoPlayer'
```

## Usage
```tsx
<VideoPlayer
  sessionId="session_1234567890_abc123"
  onClose={() => setIsOpen(false)}
/>
```

## Props
- `sessionId`: string (required) - Session to load
- `onClose`: function (required) - Close handler

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space / K | Play/Pause |
| ← / → | Skip ±5s |
| ↑ / ↓ | Volume |
| F | Fullscreen |
| M | Mute |
| Esc | Close |

## Features
✅ Custom video controls
✅ Click-to-seek timeline
✅ Playback speed (0.5x, 1x, 1.5x, 2x)
✅ Volume slider with mute
✅ Fullscreen support
✅ Synchronized transcript
✅ Auto-scroll to current message
✅ Click message to jump
✅ Score badges
✅ Color-coded speakers

## Check Video Availability
```tsx
import { hasVideoRecording } from '../utils/videoStorage'

if (await hasVideoRecording(sessionId)) {
  // Show replay button
}
```

## Data Sources
- **Video**: IndexedDB (`getVideoRecording`)
- **Transcript**: localStorage (`getSessionById`)

## Styling
- Theme: Cyberpunk dark (black/red)
- Backgrounds: `neutral-950`, `neutral-900`
- Accent: `red-500`
- Glassmorphism effects

## Files
- Component: `components/VideoPlayer.tsx`
- Examples: `components/VideoPlayer.example.tsx`
- Docs: `components/VideoPlayer.README.md`
- Utils: `lib/utils.ts`

## Common Issues
**Video won't play**: Check IndexedDB for video blob
**Transcript not syncing**: Verify timestamps in session data
**Keyboard shortcuts not working**: Check if input has focus
**Performance issues**: Check video file size and throttling

## Browser Support
✅ Chrome/Edge/Firefox/Safari (modern versions)
✅ Mobile: iOS, Android (playsInline enabled)

---
**Status**: Production Ready ✅
**Created**: November 24, 2025
