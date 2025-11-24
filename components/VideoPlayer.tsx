"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Loader2, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { getVideoRecording } from '../utils/videoStorage'
import { getSessionById, type TranscriptMessage } from '../utils/sessionStorage'

interface VideoPlayerProps {
  sessionId: string
  onClose: () => void
}

interface ScoreMoment {
  time: number // seconds from session start
  score: number
  text: string
  index: number
}

export function VideoPlayer({ sessionId, onClose }: VideoPlayerProps) {
  // Video state
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)
  const [recordedDuration, setRecordedDuration] = useState<number | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const transcriptContainerRef = useRef<HTMLDivElement>(null)
  const activeMessageRef = useRef<HTMLDivElement>(null)

  // Throttle state updates to avoid excessive re-renders
  const lastUpdateRef = useRef(0)

  // Load video and transcript data
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading video and transcript for session:', sessionId)
      setIsLoading(true)
      setError(null)

      try {
        // Load video from IndexedDB
        const recording = await getVideoRecording(sessionId)
        if (!recording) {
          throw new Error('Video recording not found')
        }

        // Create blob URL for video
        const url = URL.createObjectURL(recording.videoBlob)
        setVideoUrl(url)
        setRecordedDuration(recording.duration)
        console.log('Video loaded successfully:', {
          size: recording.size,
          duration: recording.duration,
          mimeType: recording.mimeType
        })

        // Load session transcript from localStorage
        const sessionData = getSessionById(sessionId)
        if (!sessionData) {
          throw new Error('Session data not found')
        }

        setTranscript(sessionData.transcript)
        setSessionStartTime(sessionData.timestamp)
        console.log('Transcript loaded:', sessionData.transcript.length, 'messages')
      } catch (err) {
        console.error('Failed to load video or transcript:', err)
        setError(err instanceof Error ? err.message : 'Failed to load video')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Cleanup blob URL on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [sessionId])

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return

    // Throttle updates to every 100ms
    const now = Date.now()
    if (now - lastUpdateRef.current < 100) return
    lastUpdateRef.current = now

    setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return
    const videoDuration = videoRef.current.duration

    // Handle videos without proper duration metadata
    if (videoDuration === Infinity || isNaN(videoDuration)) {
      console.warn('Video duration is invalid, using recorded duration from metadata')
      // Use duration from recording metadata
      if (recordedDuration) {
        setDuration(recordedDuration)
        console.log('Using recorded duration:', recordedDuration, 'seconds')
      } else {
        // Fallback: Allow playback but show unknown duration
        setDuration(0)
        console.warn('Duration unavailable, playback may have issues')
      }
    } else {
      setDuration(videoDuration)
      console.log('Video metadata loaded, duration:', videoDuration, 'seconds')
    }
  }, [recordedDuration])

  const handlePlay = useCallback(() => setIsPlaying(true), [])
  const handlePause = useCallback(() => setIsPlaying(false), [])

  const handleVideoError = useCallback(() => {
    console.error('Video playback error')
    setError('Failed to play video. The video format may not be supported.')
  }, [])

  // Playback controls
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play().catch(err => {
        console.error('Failed to play video:', err)
        setError('Failed to play video')
      })
    }
  }, [isPlaying])

  const handleSeek = useCallback((newTime: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [])

  const skipTime = useCallback((seconds: number) => {
    if (!videoRef.current) return
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    handleSeek(newTime)
  }, [currentTime, duration, handleSeek])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const volumeValue = parseFloat(e.target.value)
    videoRef.current.volume = volumeValue
    setVolume(volumeValue)
    setIsMuted(volumeValue === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return

    if (isMuted) {
      videoRef.current.volume = volume || 0.5
      setIsMuted(false)
    } else {
      videoRef.current.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const changePlaybackSpeed = useCallback(() => {
    if (!videoRef.current) return

    const speeds = [0.5, 1, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % speeds.length
    const newSpeed = speeds[nextIndex]

    videoRef.current.playbackRate = newSpeed
    setPlaybackRate(newSpeed)
  }, [playbackRate])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Failed to enter fullscreen:', err))
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Failed to exit fullscreen:', err))
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skipTime(-5)
          break
        case 'ArrowRight':
          e.preventDefault()
          skipTime(5)
          break
        case 'ArrowUp':
          e.preventDefault()
          if (videoRef.current) {
            const newVolume = Math.min(1, (isMuted ? 0 : volume) + 0.1)
            videoRef.current.volume = newVolume
            setVolume(newVolume)
            setIsMuted(false)
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (videoRef.current) {
            const newVolume = Math.max(0, (isMuted ? 0 : volume) - 0.1)
            videoRef.current.volume = newVolume
            setVolume(newVolume)
            setIsMuted(newVolume === 0)
          }
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, skipTime, toggleFullscreen, toggleMute, onClose, isMuted, volume])

  // Calculate score moments from transcript
  const scoreMoments = useMemo((): ScoreMoment[] => {
    if (!sessionStartTime || transcript.length === 0) return []

    const moments: ScoreMoment[] = []
    transcript.forEach((message, index) => {
      if (message.score !== undefined && message.role === 'agnes') {
        const messageTime = new Date(message.timestamp).getTime() - sessionStartTime.getTime()
        moments.push({
          time: messageTime / 1000, // convert to seconds
          score: message.score,
          text: message.text,
          index
        })
      }
    })
    return moments
  }, [transcript, sessionStartTime])

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (scoreMoments.length === 0) {
      return {
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        feedbackCount: 0,
        trend: 'neutral' as 'up' | 'down' | 'neutral'
      }
    }

    const scores = scoreMoments.map(m => m.score)
    const averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    const highestScore = Math.max(...scores)
    const lowestScore = Math.min(...scores)

    // Calculate trend (compare first half vs second half)
    let trend: 'up' | 'down' | 'neutral' = 'neutral'
    if (scores.length >= 4) {
      const halfPoint = Math.floor(scores.length / 2)
      const firstHalfAvg = scores.slice(0, halfPoint).reduce((sum, s) => sum + s, 0) / halfPoint
      const secondHalfAvg = scores.slice(halfPoint).reduce((sum, s) => sum + s, 0) / (scores.length - halfPoint)

      if (secondHalfAvg > firstHalfAvg + 5) trend = 'up'
      else if (secondHalfAvg < firstHalfAvg - 5) trend = 'down'
    }

    return {
      averageScore,
      highestScore,
      lowestScore,
      feedbackCount: scoreMoments.length,
      trend
    }
  }, [scoreMoments])

  // Find active transcript message based on video time
  const activeMessageIndex = useMemo(() => {
    if (!sessionStartTime || transcript.length === 0) return -1

    // Calculate elapsed time since session start
    const elapsedMs = currentTime * 1000

    // Find the last message that should have been sent by this time
    let activeIndex = -1
    for (let i = 0; i < transcript.length; i++) {
      const message = transcript[i]
      const messageTime = new Date(message.timestamp).getTime() - sessionStartTime.getTime()

      if (messageTime <= elapsedMs) {
        activeIndex = i
      } else {
        break
      }
    }

    return activeIndex
  }, [currentTime, transcript, sessionStartTime])

  // Find active score overlay (show score 0.5s before message until 3s after)
  const activeScoreOverlay = useMemo(() => {
    if (scoreMoments.length === 0) return null

    for (const moment of scoreMoments) {
      const showStart = moment.time - 0.5
      const showEnd = moment.time + 3

      if (currentTime >= showStart && currentTime <= showEnd) {
        return moment
      }
    }
    return null
  }, [scoreMoments, currentTime])

  // Auto-scroll transcript to active message
  useEffect(() => {
    if (activeMessageRef.current && transcriptContainerRef.current) {
      const container = transcriptContainerRef.current
      const element = activeMessageRef.current

      // Get container bounds
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()

      // Check if element is out of view
      const isOutOfView =
        elementRect.top < containerRect.top ||
        elementRect.bottom > containerRect.bottom

      if (isOutOfView) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [activeMessageIndex])

  // Handle transcript message click (jump to that point in video)
  const handleMessageClick = useCallback((index: number) => {
    if (!sessionStartTime || !videoRef.current) return

    const message = transcript[index]
    const messageTime = new Date(message.timestamp).getTime() - sessionStartTime.getTime()
    const timeInSeconds = messageTime / 1000

    handleSeek(Math.max(0, Math.min(duration, timeInSeconds)))
  }, [transcript, sessionStartTime, duration, handleSeek])

  // Handle score marker click (jump to that feedback moment)
  const handleScoreMomentClick = useCallback((moment: ScoreMoment) => {
    handleSeek(Math.max(0, Math.min(duration, moment.time)))
  }, [duration, handleSeek])

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50', solid: 'bg-green-500' }
    if (score >= 60) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50', solid: 'bg-yellow-500' }
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50', solid: 'bg-red-500' }
  }

  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration
    handleSeek(newTime)
  }, [duration, handleSeek])

  // Render loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg">Loading video...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (error || !videoUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">Error Loading Video</h2>
          <p className="text-gray-400 mb-6">{error || 'Video not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-transparent border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/50'
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-neutral-950 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-900/50 border-b border-neutral-800">
        <h2 className="text-white text-xl font-bold">Session Replay</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors"
          aria-label="Close video player"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Section */}
        <div className="flex-1 flex flex-col bg-black relative">
          {/* Video Element */}
          <div className="flex-1 flex items-center justify-center relative group">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onError={handleVideoError}
              playsInline
            />

            {/* Center Play/Pause Overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-20 w-20 text-white/80" />
              ) : (
                <Play className="h-20 w-20 text-white/80" />
              )}
            </button>

            {/* Floating Score Overlay */}
            {activeScoreOverlay && (
              <div className="absolute top-6 right-6 animate-fade-in pointer-events-none">
                <div className={`px-4 py-3 rounded-lg border-2 backdrop-blur-md shadow-2xl ${getScoreColor(activeScoreOverlay.score).bg} ${getScoreColor(activeScoreOverlay.score).border}`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold ${getScoreColor(activeScoreOverlay.score).text}`}>
                      {activeScoreOverlay.score}
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-400 font-semibold">Agnes Score</div>
                      <div className={`text-sm font-semibold ${getScoreColor(activeScoreOverlay.score).text}`}>
                        {activeScoreOverlay.score >= 80 ? 'Great!' : activeScoreOverlay.score >= 60 ? 'Good' : 'Keep Trying'}
                      </div>
                    </div>
                  </div>
                  {activeScoreOverlay.text && (
                    <div className="mt-2 text-xs text-gray-300 max-w-xs">
                      {activeScoreOverlay.text.substring(0, 100)}{activeScoreOverlay.text.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="bg-gradient-to-t from-black/90 to-transparent p-4">
            {/* Score Timeline Track */}
            {scoreMoments.length > 0 && (
              <div className="w-full h-6 mb-2 relative">
                {scoreMoments.map((moment, idx) => {
                  const position = duration > 0 ? (moment.time / duration) * 100 : 0
                  const colors = getScoreColor(moment.score)

                  return (
                    <div
                      key={idx}
                      className="absolute top-0 group/marker cursor-pointer"
                      style={{ left: `${position}%` }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleScoreMomentClick(moment)
                      }}
                    >
                      {/* Score Dot */}
                      <div className={`w-3 h-3 rounded-full ${colors.solid} border-2 border-white shadow-lg transform -translate-x-1/2 transition-transform group-hover/marker:scale-150`} />

                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className={`px-3 py-2 rounded-lg border ${colors.bg} ${colors.border} backdrop-blur-sm whitespace-nowrap`}>
                          <div className={`text-sm font-bold ${colors.text}`}>Score: {moment.score}</div>
                          <div className="text-xs text-gray-400 mt-1">{formatTime(moment.time)}</div>
                          <div className="text-xs text-gray-300 mt-1 max-w-xs truncate">{moment.text.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Progress Bar with Feedback Markers */}
            <div className="relative">
              <div
                ref={progressRef}
                className="w-full h-2 bg-neutral-800 rounded-full cursor-pointer mb-4 group relative"
                onClick={handleProgressClick}
                role="slider"
                aria-label="Video progress"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    skipTime(-5);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    skipTime(5);
                  }
                }}
              >
                {/* Feedback moment markers */}
                {scoreMoments.map((moment, idx) => {
                  const position = duration > 0 ? (moment.time / duration) * 100 : 0
                  const colors = getScoreColor(moment.score)
                  const isActive = activeScoreOverlay?.index === moment.index

                  return (
                    <div
                      key={idx}
                      className={`absolute top-0 w-1 h-full ${colors.solid} transition-all ${
                        isActive ? 'opacity-100 w-2' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ left: `${position}%` }}
                    />
                  )
                })}

                {/* Progress fill */}
                <div
                  className="h-full bg-red-500 rounded-full relative group-hover:bg-red-400 transition-colors z-10"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>

                {/* Skip Backward */}
                <button
                  onClick={() => skipTime(-5)}
                  className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                  aria-label="Skip backward 5 seconds"
                >
                  <SkipBack className="h-5 w-5" />
                </button>

                {/* Skip Forward */}
                <button
                  onClick={() => skipTime(5)}
                  className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                  aria-label="Skip forward 5 seconds"
                >
                  <SkipForward className="h-5 w-5" />
                </button>

                {/* Time Display */}
                <span className="text-white text-sm font-mono ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Volume Control */}
                <div
                  className="flex items-center gap-2 relative"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    onClick={toggleMute}
                    className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-20' : 'w-0'}`}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                      aria-label="Volume"
                    />
                  </div>
                </div>

                {/* Playback Speed */}
                <button
                  onClick={changePlaybackSpeed}
                  className="px-3 py-1 text-white hover:bg-white/10 rounded-md transition-colors font-mono text-sm"
                  aria-label={`Playback speed: ${playbackRate}x`}
                >
                  {playbackRate}x
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Panel */}
        <div className="w-96 bg-neutral-900 border-l border-neutral-800 flex flex-col">
          {/* Performance Summary Panel */}
          {scoreMoments.length > 0 && (
            <div className="border-b border-neutral-800">
              <button
                onClick={() => setShowPerformancePanel(!showPerformancePanel)}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-400" />
                  <h3 className="text-white font-semibold">Performance Summary</h3>
                </div>
                {showPerformancePanel ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {showPerformancePanel && (
                <div className="p-4 space-y-4 bg-neutral-950/50">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                      <div className="text-xs text-gray-400 mb-1">Average Score</div>
                      <div className={`text-2xl font-bold ${getScoreColor(performanceMetrics.averageScore).text}`}>
                        {performanceMetrics.averageScore}
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                      <div className="text-xs text-gray-400 mb-1">Feedback Count</div>
                      <div className="text-2xl font-bold text-white">
                        {performanceMetrics.feedbackCount}
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                      <div className="text-xs text-gray-400 mb-1">Highest Score</div>
                      <div className={`text-2xl font-bold ${getScoreColor(performanceMetrics.highestScore).text}`}>
                        {performanceMetrics.highestScore}
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                      <div className="text-xs text-gray-400 mb-1">Lowest Score</div>
                      <div className={`text-2xl font-bold ${getScoreColor(performanceMetrics.lowestScore).text}`}>
                        {performanceMetrics.lowestScore}
                      </div>
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                    <div className="text-xs text-gray-400 mb-2">Performance Trend</div>
                    <div className="flex items-center gap-2">
                      {performanceMetrics.trend === 'up' && (
                        <>
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          <span className="text-sm text-green-400 font-semibold">Improving</span>
                        </>
                      )}
                      {performanceMetrics.trend === 'down' && (
                        <>
                          <TrendingDown className="h-5 w-5 text-red-400" />
                          <span className="text-sm text-red-400 font-semibold">Declining</span>
                        </>
                      )}
                      {performanceMetrics.trend === 'neutral' && (
                        <>
                          <div className="h-0.5 w-5 bg-gray-400" />
                          <span className="text-sm text-gray-400 font-semibold">Steady</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Jump to Key Moments */}
                  <div>
                    <div className="text-xs text-gray-400 mb-2 font-semibold">Jump to Key Moments</div>
                    <div className="space-y-2">
                      {scoreMoments
                        .filter(m => m.score === performanceMetrics.highestScore)
                        .slice(0, 1)
                        .map((moment) => (
                          <button
                            key={`high-${moment.index}`}
                            onClick={() => handleScoreMomentClick(moment)}
                            className="w-full p-2 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-green-400 font-semibold">Best Score</span>
                              <span className="text-xs text-gray-400">{formatTime(moment.time)}</span>
                            </div>
                            <div className="text-sm text-green-400 font-bold mt-1">{moment.score}</div>
                          </button>
                        ))}
                      {scoreMoments
                        .filter(m => m.score === performanceMetrics.lowestScore)
                        .slice(0, 1)
                        .map((moment) => (
                          <button
                            key={`low-${moment.index}`}
                            onClick={() => handleScoreMomentClick(moment)}
                            className="w-full p-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-red-400 font-semibold">Needs Work</span>
                              <span className="text-xs text-gray-400">{formatTime(moment.time)}</span>
                            </div>
                            <div className="text-sm text-red-400 font-bold mt-1">{moment.score}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-b border-neutral-800">
            <h3 className="text-white font-semibold">Conversation Transcript</h3>
            <p className="text-gray-400 text-sm mt-1">{transcript.length} messages</p>
          </div>

          <div className="flex-1 overflow-y-auto" ref={transcriptContainerRef}>
            <div className="p-4 space-y-3">
              {transcript.map((message, index) => {
                const isActive = index === activeMessageIndex
                const isAgnes = message.role === 'agnes'

                return (
                  <div
                    key={index}
                    ref={isActive ? activeMessageRef : null}
                    onClick={() => handleMessageClick(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-red-500/20 border-2 border-red-500 shadow-lg shadow-red-500/20'
                        : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs font-semibold ${isAgnes ? 'text-red-400' : 'text-blue-400'}`}>
                        {isAgnes ? 'Agnes 21' : 'You'}
                      </span>
                      {message.score !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getScoreBadgeColor(message.score)}`}>
                          {message.score}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {message.text}
                    </p>
                    <span className="text-xs text-gray-500 mt-2 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-20 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">
        <div className="font-semibold text-white mb-2">Keyboard Shortcuts</div>
        <div className="space-y-1">
          <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">Space</kbd> Play/Pause</div>
          <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">←/→</kbd> Skip ±5s</div>
          <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">↑/↓</kbd> Volume</div>
          <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">F</kbd> Fullscreen</div>
          <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">M</kbd> Mute</div>
          <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">Esc</kbd> Close</div>
        </div>
      </div>
    </div>
  )
}
