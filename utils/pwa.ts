/**
 * PWA Registration and Management Utilities
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Register the service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered successfully:', registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker available');
              // Optionally notify user of update
              if (confirm('A new version is available. Refresh to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('[PWA] Service Workers are not supported in this browser');
    return null;
  }
};

/**
 * Unregister all service workers
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const results = await Promise.all(
      registrations.map(registration => registration.unregister())
    );
    return results.every(result => result);
  }
  return false;
};

/**
 * Check if the app is running as a PWA
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

/**
 * Check if the app can be installed
 */
export const canInstall = (): boolean => {
  return 'BeforeInstallPromptEvent' in window ||
         ('serviceWorker' in navigator && !isPWA());
};

/**
 * Get install prompt readiness
 */
export const getInstallPrompt = (): BeforeInstallPromptEvent | null => {
  return (window as any).__beforeInstallPrompt || null;
};

/**
 * Set install prompt
 */
export const setInstallPrompt = (prompt: BeforeInstallPromptEvent | null): void => {
  (window as any).__beforeInstallPrompt = prompt;
};

/**
 * Show install prompt
 */
export const showInstallPrompt = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  const prompt = getInstallPrompt();

  if (!prompt) {
    return 'unavailable';
  }

  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
      setInstallPrompt(null);
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    return outcome;
  } catch (error) {
    console.error('[PWA] Error showing install prompt:', error);
    return 'unavailable';
  }
};

/**
 * Request persistent storage
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`[PWA] Persistent storage: ${isPersisted ? 'granted' : 'denied'}`);
    return isPersisted;
  }
  return false;
};

/**
 * Check storage quota
 */
export const checkStorageQuota = async (): Promise<{ usage: number; quota: number; percentage: number }> => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;

    console.log(`[PWA] Storage: ${(usage / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB (${percentage}%)`);

    return { usage, quota, percentage };
  }
  return { usage: 0, quota: 0, percentage: 0 };
};
