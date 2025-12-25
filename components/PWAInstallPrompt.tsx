import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { showInstallPrompt, isPWA, BeforeInstallPromptEvent, setInstallPrompt } from '../utils/pwa';

/**
 * PWA Install Prompt Component
 * Shows a banner to prompt users to install the app
 */
const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isPWA()) {
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);

      // Show prompt after 30 seconds of using the app
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const result = await showInstallPrompt();

    if (result === 'accepted') {
      setShowPrompt(false);
    } else if (result === 'dismissed') {
      handleDismiss();
    }

    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-2xl mx-auto bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-2xl border border-red-500/20 overflow-hidden">
        <div className="relative p-6">
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute top-3 right-3 p-3 hover:bg-white/20 rounded-full transition-colors z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Dismiss install prompt"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Content */}
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-2">
                Install Agnes-21
              </h3>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">
                Install our app for a better experience! Access your training offline, get faster load times, and quick access from your home screen.
              </p>

              {/* Install button */}
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex items-center space-x-2 px-6 py-3 bg-white text-red-600 rounded-full font-bold hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
              </button>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
