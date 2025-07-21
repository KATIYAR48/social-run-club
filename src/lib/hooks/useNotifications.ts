"use client";

import { useState, useEffect, useCallback } from "react";

interface NotificationState {
  permission: NotificationPermission | null;
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
}

interface UseNotificationsReturn extends NotificationState {
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  checkSubscription: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    permission: null,
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    isLoading: true,
    error: null,
  });

  // Check if service worker and push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window === "undefined") return;

      const isSupported =
        "serviceWorker" in navigator && "PushManager" in window;

      setState((prev) => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : null,
        isLoading: false,
      }));

      // Check subscription if supported
      if (isSupported) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();

          setState((prev) => ({
            ...prev,
            subscription,
            isSubscribed: !!subscription,
          }));
        } catch (error) {
          console.error("Error checking subscription:", error);
          setState((prev) => ({
            ...prev,
            error: "Failed to check subscription status",
          }));
        }
      }
    };

    checkSupport();
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator && "PushManager" in window)) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState((prev) => ({
        ...prev,
        subscription,
        isSubscribed: !!subscription,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error checking subscription:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to check subscription status",
        isLoading: false,
      }));
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator && "PushManager" in window)) {
      setState((prev) => ({
        ...prev,
        error: "Push notifications are not supported in this browser",
      }));
      return false;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const permission = await Notification.requestPermission();

      setState((prev) => ({
        ...prev,
        permission,
        isLoading: false,
      }));

      if (permission === "granted") {
        return true;
      } else if (permission === "denied") {
        setState((prev) => ({
          ...prev,
          error: "Notification permission denied",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: "Notification permission dismissed",
        }));
      }

      return false;
    } catch (error) {
      console.error("Error requesting permission:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to request notification permission",
        isLoading: false,
      }));
      return false;
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator && "PushManager" in window)) {
      setState((prev) => ({
        ...prev,
        error: "Push notifications are not supported",
      }));
      return false;
    }

    // Check current permission
    const currentPermission = Notification.permission;
    if (currentPermission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      console.log("🔔 Starting subscription process...");
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      console.log("🔔 Waiting for service worker...");

      // Check current SW state
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log("🔔 Current SW registrations:", registrations);
      console.log("🔔 SW controller:", navigator.serviceWorker.controller);

      // If no registration exists, register the service worker manually
      if (registrations.length === 0) {
        console.log("🔔 No SW found, registering manually...");
        await navigator.serviceWorker.register("/sw.js");
        console.log("🔔 SW registered manually");
      }

      const registration = await navigator.serviceWorker.ready;
      console.log("🔔 Service worker ready:", registration);

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      console.log("🔔 VAPID key available:", !!vapidPublicKey);

      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      console.log("🔔 Creating push subscription...");
      console.log("🔔 VAPID public key:", vapidPublicKey);

      let applicationServerKey;
      try {
        applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        console.log(
          "🔔 VAPID key converted successfully, length:",
          applicationServerKey.length
        );

        // VAPID public key should be exactly 65 bytes (uncompressed P-256 public key)
        if (applicationServerKey.length !== 65) {
          throw new Error(
            `Invalid VAPID key length: ${applicationServerKey.length} bytes (expected 65)`
          );
        }
      } catch (keyError) {
        console.error("🔔 Error converting VAPID key:", keyError);
        throw new Error(
          `Invalid VAPID public key: ${
            keyError instanceof Error ? keyError.message : "Unknown error"
          }`
        );
      }

      // Check if there's an existing subscription
      const existingSubscription =
        await registration.pushManager.getSubscription();
      console.log("🔔 Existing subscription:", existingSubscription);

      if (existingSubscription) {
        console.log("🔔 Unsubscribing from existing subscription...");
        await existingSubscription.unsubscribe();
      }

      // Log the subscription request details
      const subscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      };
      console.log("🔔 Subscription options:", {
        userVisibleOnly: subscriptionOptions.userVisibleOnly,
        applicationServerKeyLength: applicationServerKey.length,
        pushManagerExists: !!registration.pushManager,
      });

      let subscription;
      try {
        subscription = await registration.pushManager.subscribe(
          subscriptionOptions
        );
        console.log("🔔 Push subscription created successfully:", subscription);
        console.log("🔔 Subscription endpoint:", subscription.endpoint);
        console.log("🔔 Subscription keys:", {
          p256dh: subscription.getKey("p256dh")?.byteLength,
          auth: subscription.getKey("auth")?.byteLength,
        });
      } catch (subscriptionError) {
        console.error("🔔 Push subscription failed:", subscriptionError);
        console.error("🔔 Error details:", {
          name:
            subscriptionError instanceof Error
              ? subscriptionError.name
              : "Unknown",
          message:
            subscriptionError instanceof Error
              ? subscriptionError.message
              : "Unknown",
          stack:
            subscriptionError instanceof Error
              ? subscriptionError.stack
              : "Unknown",
        });

        if (subscriptionError instanceof Error) {
          if (subscriptionError.name === "AbortError") {
            // Try Chrome-specific workaround for subdomain issues
            console.log("🔔 Attempting Chrome subdomain workaround...");
            try {
              // Wait a bit and try again with different options
              await new Promise((resolve) => setTimeout(resolve, 1000));
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey as BufferSource,
              });
              console.log("🔔 Chrome workaround successful:", subscription);
            } catch (retryError) {
              console.error("🔔 Chrome workaround failed:", retryError);
              throw new Error(
                `Push service rejected the subscription. This may be due to invalid VAPID configuration or domain restrictions. Chrome subdomain workaround also failed: ${
                  retryError instanceof Error
                    ? retryError.message
                    : "Unknown error"
                }`
              );
            }
          } else if (subscriptionError.name === "NotSupportedError") {
            throw new Error(
              "Push notifications are not supported on this browser/device."
            );
          } else {
            throw new Error(
              `Push subscription failed: ${subscriptionError.message}`
            );
          }
        } else {
          throw new Error("Push subscription failed with unknown error");
        }
      }

      // Send subscription to server
      console.log("🔔 Sending subscription to server...");
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      });

      console.log("🔔 Server response status:", response.status);
      const result = await response.json();
      console.log("🔔 Server response data:", result);

      if (!result.success) {
        throw new Error(result.message || "Failed to register subscription");
      }

      console.log("🔔 Updating state to subscribed...");
      setState((prev) => ({
        ...prev,
        subscription,
        isSubscribed: true,
        isLoading: false,
      }));

      console.log("🔔 Subscription process completed successfully!");
      return true;
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to subscribe to notifications",
        isLoading: false,
      }));
      return false;
    }
  }, [requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      setState((prev) => ({ ...prev, error: "No active subscription found" }));
      return false;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Unsubscribe from push manager
      await state.subscription.unsubscribe();

      // Remove subscription from server
      const response = await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: state.subscription.endpoint }),
      });

      const result = await response.json();

      if (!result.success) {
        console.warn(
          "Failed to remove subscription from server:",
          result.message
        );
      }

      setState((prev) => ({
        ...prev,
        subscription: null,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to unsubscribe from notifications",
        isLoading: false,
      }));
      return false;
    }
  }, [state.subscription]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
