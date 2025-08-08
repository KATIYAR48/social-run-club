// Register service worker with better update handling
if ("serviceWorker" in navigator) {
  let refreshing = false;

  // Handle service worker updates
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is available
              console.log("New service worker available");

              // Show update notification to user
              if (
                confirm(
                  "A new version of CLOKA is available. Would you like to update now?"
                )
              ) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "SW_UPDATED") {
            console.log("Service worker updated:", event.data.message);
          }
        });
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed: ", error);
      });
  });

  // Add cache management functions to window object
  window.clearPWACache = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
    }
  };

  window.checkForUpdates = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
  };
}
