import { useEffect, useRef, RefObject } from 'react';

export interface PinchCallbacks {
  onPinchStart?: (distance: number) => void;
  onPinchMove?: (scale: number, distance: number) => void;
  onPinchEnd?: (scale: number) => void;
}

export interface PinchConfig {
  minScale?: number;
  maxScale?: number;
}

const DEFAULT_CONFIG: Required<PinchConfig> = {
  minScale: 0.5,
  maxScale: 3
};

/**
 * Calculate distance between two touch points
 */
const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Hook to detect pinch-to-zoom gestures on touch-enabled devices
 */
export const usePinchZoom = (
  callbacks: PinchCallbacks,
  config: PinchConfig = {}
): RefObject<HTMLDivElement> => {
  const elementRef = useRef<HTMLDivElement>(null);
  const initialDistance = useRef<number>(0);
  const currentScale = useRef<number>(1);

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance.current = getTouchDistance(e.touches[0], e.touches[1]);
        callbacks.onPinchStart?.(initialDistance.current);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance.current;

        // Clamp scale within min/max bounds
        const clampedScale = Math.min(
          Math.max(scale * currentScale.current, mergedConfig.minScale),
          mergedConfig.maxScale
        );

        callbacks.onPinchMove?.(clampedScale, currentDistance);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && initialDistance.current > 0) {
        const currentDistance = getTouchDistance(e.changedTouches[0], e.changedTouches[1]);
        const scale = currentDistance / initialDistance.current;

        // Clamp scale within min/max bounds
        const clampedScale = Math.min(
          Math.max(scale * currentScale.current, mergedConfig.minScale),
          mergedConfig.maxScale
        );

        currentScale.current = clampedScale;
        callbacks.onPinchEnd?.(clampedScale);
        initialDistance.current = 0;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [callbacks, mergedConfig]);

  return elementRef;
};
