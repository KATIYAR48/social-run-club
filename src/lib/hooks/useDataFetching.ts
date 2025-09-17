"use client";

import { useState, useEffect, useCallback } from "react";

interface UseDataFetchingOptions {
  url: string;
  dependencies?: unknown[];
  refreshInterval?: number;
  forceRefresh?: boolean;
}

export function useDataFetching<T>({
  url,
  dependencies = [],
  refreshInterval = 30000, // 30 seconds default
  forceRefresh = false,
}: UseDataFetchingOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(
    async (force = false) => {
      try {
        setLoading(true);
        setError(null);

        // Add cache-busting parameter if force refresh is requested
        const fetchUrl = force ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url;

        const response = await fetch(fetchUrl, {
          headers: {
            "Cache-Control": force ? "no-cache" : "default",
            Pragma: force ? "no-cache" : "default",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        setLastUpdated(new Date());

        // Check if response was served from cache
        const servedFromCache = response.headers.get("X-Served-From-Cache");
        if (servedFromCache === "true") {
          console.log("Data served from cache, consider refreshing:", url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  // Initial fetch
  useEffect(() => {
    fetchData(forceRefresh);
  }, [fetchData, forceRefresh, ...dependencies]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      // Only refresh if the app is online
      if (navigator.onLine) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online, refreshing data...");
      fetchData(true); // Force refresh when coming back online
    };

    const handleOffline = () => {
      console.log("App is offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchData]);

  // Listen for service worker updates
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SW_UPDATED") {
        console.log("Service worker updated, refreshing data...");
        fetchData(true); // Force refresh after SW update
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}
