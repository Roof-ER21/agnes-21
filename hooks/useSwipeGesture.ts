import { useEffect, useRef, RefObject } from 'react';

export interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeConfig {
  threshold?: number;
  velocityThreshold?: number;
  timeout?: number;
}

const DEFAULT_CONFIG: Required<SwipeConfig> = {
  threshold: 50,
  velocityThreshold: 0.3,
  timeout: 300
};

/**
 * Hook to detect swipe gestures on touch-enabled devices
 */
export const useSwipeGesture = (
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
): RefObject<HTMLDivElement> => {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Calculate velocity
      const velocityX = absX / deltaTime;
      const velocityY = absY / deltaTime;

      // Only trigger if within timeout and meets threshold
      if (deltaTime <= mergedConfig.timeout) {
        // Horizontal swipe
        if (
          absX > absY &&
          absX > mergedConfig.threshold &&
          velocityX > mergedConfig.velocityThreshold
        ) {
          if (deltaX > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        }

        // Vertical swipe
        if (
          absY > absX &&
          absY > mergedConfig.threshold &&
          velocityY > mergedConfig.velocityThreshold
        ) {
          if (deltaY > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [callbacks, mergedConfig]);

  return elementRef;
};
