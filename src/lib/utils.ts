import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Age in years or null if invalid
 */
export function calculateAgeFromDateOfBirth(
  dateOfBirth: Date | string | null
): number | null {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}

// PWA Cache Management Utilities
export const pwaUtils = {
  // Clear all PWA caches
  clearAllCaches: async () => {
    if (typeof window !== 'undefined' && "caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log("All PWA caches cleared");
    }
  },

  // Clear specific cache by name
  clearCache: async (cacheName: string) => {
    if (typeof window !== 'undefined' && "caches" in window) {
      await caches.delete(cacheName);
      console.log(`Cache ${cacheName} cleared`);
    }
  },

  // Clear events-related caches
  clearEventsCache: async () => {
    if (typeof navigator !== 'undefined' && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_EVENTS_CACHE",
      });
      console.log("Events cache cleared");
    }
    // Also clear browser cache for events endpoints
    if (typeof window !== 'undefined' && "caches" in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        const eventKeys = keys.filter(
          (request) =>
            request.url.includes("/api/events") ||
            request.url.includes("/api/user/events") ||
            request.url.includes("/api/feed")
        );
        await Promise.all(eventKeys.map((key) => cache.delete(key)));
      }
    }
  },

  // Invalidate cache for specific URL pattern
  invalidateCache: async (urlPattern: string) => {
    if (typeof navigator !== 'undefined' && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "INVALIDATE_CACHE",
        urlPattern,
      });
      console.log(`Cache invalidated for pattern: ${urlPattern}`);
    }
  },

  // Force refresh events data
  refreshEventsData: async () => {
    await pwaUtils.clearEventsCache();
    // Trigger a page refresh to fetch fresh data
    window.location.reload();
  },

  // Get cache size information
  getCacheInfo: async () => {
    if (typeof window !== 'undefined' && "caches" in window) {
      const cacheNames = await caches.keys();
      const cacheInfo = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return {
            name,
            size: keys.length,
            urls: keys.map((req) => req.url),
          };
        })
      );
      return cacheInfo;
    }
    return [];
  },

  // Force refresh the app
  forceRefresh: () => {
    if (typeof navigator !== 'undefined' && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
    // Fallback to window reload
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },

  // Check if app is installed as PWA
  isPWAInstalled: () => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );
  },

  // Check if app is online
  isOnline: () => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  // Add network status listener
  onNetworkChange: (callback: (online: boolean) => void) => {
    if (typeof window === 'undefined') {
      return () => {}; // Return empty cleanup function for SSR
    }
    
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  },
};
