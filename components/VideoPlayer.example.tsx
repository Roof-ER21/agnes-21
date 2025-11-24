/**
 * VideoPlayer Component - Usage Example
 *
 * This file demonstrates how to use the VideoPlayer component
 * in your Agnes-21 application.
 */

import React, { useState } from 'react'
import { VideoPlayer } from './VideoPlayer'

export function VideoPlayerExample() {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  // Example: Opening the video player from a session list
  const handleViewSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setIsPlayerOpen(true)
  }

  // Example: Closing the video player
  const handleClosePlayer = () => {
    setIsPlayerOpen(false)
    setSelectedSessionId(null)
  }

  return (
    <div>
      {/* Example button to open video player */}
      <button
        onClick={() => handleViewSession('session_1234567890_abc123')}
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
      >
        Watch Session Replay
      </button>

      {/* Render VideoPlayer when open */}
      {isPlayerOpen && selectedSessionId && (
        <VideoPlayer
          sessionId={selectedSessionId}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  )
}

/**
 * Integration Example with SessionHistory Component
 *
 * Here's how you might integrate the VideoPlayer with an existing
 * session history list:
 */

export function SessionHistoryWithVideo() {
  const [playingSessionId, setPlayingSessionId] = useState<string | null>(null)

  // Mock session data - replace with actual data from getSessions()
  const sessions = [
    {
      sessionId: 'session_1234567890_abc123',
      timestamp: new Date(),
      difficulty: 'PRO',
      mode: 'ROLEPLAY',
      finalScore: 85,
      hasVideo: true // Indicates video recording exists
    }
  ]

  return (
    <div className="p-6">
      <h2 className="text-white text-2xl font-bold mb-4">Session History</h2>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className="bg-neutral-900 rounded-lg p-4 border border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">
                  {session.mode} - {session.difficulty}
                </p>
                <p className="text-gray-400 text-sm">
                  Score: {session.finalScore}
                </p>
                <p className="text-gray-500 text-xs">
                  {session.timestamp.toLocaleString()}
                </p>
              </div>

              {session.hasVideo && (
                <button
                  onClick={() => setPlayingSessionId(session.sessionId)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Watch Replay
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {playingSessionId && (
        <VideoPlayer
          sessionId={playingSessionId}
          onClose={() => setPlayingSessionId(null)}
        />
      )}
    </div>
  )
}

/**
 * Notes for Integration:
 *
 * 1. Session ID Format:
 *    - Use the sessionId from your session data
 *    - Format: session_<timestamp>_<random>
 *    - Example: session_1234567890_abc123
 *
 * 2. Check if Video Exists:
 *    ```typescript
 *    import { hasVideoRecording } from '../utils/videoStorage'
 *
 *    const hasVideo = await hasVideoRecording(sessionId)
 *    if (hasVideo) {
 *      // Show "Watch Replay" button
 *    }
 *    ```
 *
 * 3. Loading States:
 *    - The VideoPlayer component handles its own loading states
 *    - Shows spinner while loading video from IndexedDB
 *    - Shows error message if video/session not found
 *
 * 4. Keyboard Shortcuts:
 *    - Space: Play/Pause
 *    - Left/Right arrows: Skip ±5 seconds
 *    - Up/Down arrows: Volume control
 *    - F: Toggle fullscreen
 *    - M: Toggle mute
 *    - Escape: Close player
 *
 * 5. Transcript Features:
 *    - Auto-scrolls to current message
 *    - Click any message to jump to that point in video
 *    - Highlights active message in red
 *    - Shows scores on Agnes messages
 *    - Color-coded speakers (Agnes = red, User = blue)
 *
 * 6. Video Controls:
 *    - Custom progress bar (click to seek)
 *    - Play/Pause button
 *    - Skip backward/forward (5 seconds)
 *    - Volume slider (hover to show)
 *    - Playback speed (0.5x, 1x, 1.5x, 2x)
 *    - Fullscreen toggle
 *
 * 7. Mobile Considerations:
 *    - Uses playsInline attribute for iOS
 *    - Touch-friendly controls
 *    - Transcript scrollable on mobile
 *    - Responsive layout
 */
