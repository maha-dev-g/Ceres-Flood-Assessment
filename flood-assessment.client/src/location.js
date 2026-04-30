// Set to false when you want to try GPS again.
const GPS_DISABLED = true;
const FALLBACK_LOCATION = { latitude: 0, longitude: 0 };

export const getLocation = () => {
  if (GPS_DISABLED) return Promise.resolve(FALLBACK_LOCATION);

  if (!("geolocation" in navigator)) return Promise.resolve(FALLBACK_LOCATION);

  // Many mobile browsers require HTTPS for geolocation. If you're running over plain HTTP
  // (e.g. http://192.168.x.x:5173), just continue without GPS.
  if (!window.isSecureContext) return Promise.resolve(FALLBACK_LOCATION);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => resolve(FALLBACK_LOCATION),
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      }
    );
  });
};