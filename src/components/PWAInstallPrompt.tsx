'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    // Safety check for client-side only
    if (typeof window === 'undefined') return;

    try {
      setUserAgent(navigator.userAgent);

      // Check if app is already installed
      const checkIfInstalled = () => {
        try {
          // Check for PWA display mode
          if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
          }

          // Check for iOS standalone mode
          if ((window.navigator as Navigator & { standalone?: boolean }).standalone) {
            setIsInstalled(true);
            return;
          }

          // Check if user has previously dismissed the prompt
          if (typeof localStorage !== 'undefined') {
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (dismissed) {
              const dismissedTime = parseInt(dismissed);
              const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
              if (daysSinceDismissed < 7) {
                return;
              }
            }
          }

          // Show banner after a delay if not installed
          const timer = setTimeout(() => {
            setShowBanner(true);
          }, 5000);

          return () => clearTimeout(timer);
        } catch (error) {
          console.warn('PWA install check failed:', error);
        }
      };

      const cleanup = checkIfInstalled();

      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        try {
          e.preventDefault();
          setDeferredPrompt(e as BeforeInstallPromptEvent);
          setShowBanner(true);
        } catch (error) {
          console.warn('PWA beforeinstallprompt handler failed:', error);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        if (cleanup) cleanup();
      };
    } catch (error) {
      console.warn('PWA install prompt initialization failed:', error);
    }
  }, []);

  const handleInstallClick = async () => {
    try {
      if (deferredPrompt) {
        // For browsers that support the install prompt
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setShowBanner(false);
          setIsInstalled(true);
        }

        setDeferredPrompt(null);
      } else {
        // For browsers that don't support the install prompt, show modal
        setShowModal(true);
      }
    } catch (error) {
      console.warn('PWA install prompt failed:', error);
      // Fallback to showing modal
      setShowModal(true);
    }
  };

  const handleNotNow = () => {
    try {
      setShowBanner(false);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
    } catch (error) {
      console.warn('PWA dismiss failed:', error);
      setShowBanner(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const isIOS = userAgent ? /iPad|iPhone|iPod/.test(userAgent) : false;
  const isAndroid = userAgent ? /Android/.test(userAgent) : false;

  if (isInstalled) {
    return null;
  }

  // Don't render on server-side
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 left-4 right-4 z-50 bg-black/80 backdrop-blur-sm text-white rounded-lg shadow-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
              <div>
                <p className="text-sm font-medium">Install CLOKA</p>
                <p className="text-xs text-gray-300">
                  Tap the share button and select &ldquo;Add to Home Screen&rdquo;
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-black px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleNotNow}
                className="text-gray-300 px-2 py-1 rounded text-sm hover:text-white transition-colors flex items-center justify-center"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Instructions Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Install CLOKA</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-zinc-700">
                  Get quick access to CLOKA by installing it on your home screen!
                </p>

                {isIOS && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-black">For iPhone/iPad:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700">
                      <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari</li>
                      <li>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></li>
                      <li>Tap <strong>&ldquo;Add&rdquo;</strong> in the top right corner</li>
                      <li>The CLOKA app will appear on your home screen</li>
                    </ol>
                  </div>
                )}

                {isAndroid && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-black">For Android:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700">
                      <li>Tap the <strong>Menu</strong> button (three dots) in Chrome</li>
                      <li>Tap <strong>&ldquo;Add to Home screen&rdquo;</strong></li>
                      <li>Tap <strong>&ldquo;Add&rdquo;</strong> to confirm</li>
                      <li>The CLOKA app will appear on your home screen</li>
                    </ol>
                  </div>
                )}

                {!isIOS && !isAndroid && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-black">For Desktop:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700">
                      <li>Look for the <strong>install icon</strong> in your browser&rsquo;s address bar</li>
                      <li>Click the install icon and follow the prompts</li>
                      <li>Or use your browser&rsquo;s menu to find &ldquo;Install CLOKA&rdquo; option</li>
                    </ol>
                  </div>
                )}

                <div className="bg-zinc-100 p-3">
                  <p className="text-sm text-zinc-700">
                    <strong>Benefits:</strong> Faster access, offline capability, and a native app experience!
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}