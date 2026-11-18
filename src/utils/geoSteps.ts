const EARTH_RADIUS_M = 6371000;
const AVERAGE_STRIDE_METERS = 0.74;

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Filters GPS drift (< 1.8m) and vehicle/teleport spikes (> 4.5 m/s),
 * returning valid walking distance in meters.
 */
export function computeValidWalkingMeters(prev: GeoPoint, next: GeoPoint): number {
  if (next.accuracy > 50) return 0;
  const meters = haversineDistanceMeters(prev, next);
  if (meters < 1.8 || meters > 120) return 0;

  const elapsedSec = Math.max(1, (next.timestamp - prev.timestamp) / 1000);
  const speedMps = meters / elapsedSec;
  if (speedMps > 4.5) return 0;

  return meters;
}

export function metersToSteps(meters: number): number {
  return Math.max(0, Math.floor(meters / AVERAGE_STRIDE_METERS));
}
