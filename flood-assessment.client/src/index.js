// Avoid caching issues during local dev; keep SW for production/offline demos.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}