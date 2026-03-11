/**
 * geolocation.ts — GPS Location Utility
 *
 * Promisified wrapper around react-native-geolocation-service.
 * Returns { lat, long, timeStamp } — EXACT same format as old app.
 *
 * Config (matching old working app):
 *   - enableHighAccuracy: false  → network/WiFi location (fast, works indoors)
 *   - timeout: 5000              → 5 second timeout
 *   - maximumAge: 10000          → cached position acceptable up to 10s
 *
 * NEVER throws — always resolves with { lat: '0', long: '0' } on failure.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — match old app format exactly (strings, timeStamp with capital S)
// ─────────────────────────────────────────────────────────────────────────────

export interface LocationCoords {
  lat: string;
  long: string;
  timeStamp: string;  // ISO string — capital S to match server expectation
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST PERMISSION — Android only
// ─────────────────────────────────────────────────────────────────────────────

const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') return true;

  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted) return true;

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET LOCATION — Promisified, never throws
// ─────────────────────────────────────────────────────────────────────────────

const getPosition = (highAccuracy: boolean, timeout: number): Promise<LocationCoords> =>
  new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const coords: LocationCoords = {
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
          timeStamp: new Date().toISOString(),
        };
        console.log(`[Geo] 📍 Location captured (highAccuracy=${highAccuracy}):`, coords.lat, coords.long);
        resolve(coords);
      },
      (error) => {
        console.warn(`[Geo] ⚠️ GPS failed (highAccuracy=${highAccuracy}):`, error.message, `(code: ${error.code})`);
        resolve({ lat: '', long: '', timeStamp: '' }); // empty = signal to retry
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge: 60000,   // Accept cached position up to 60s old (Expo default)
      }
    );
  });

export const getLocationAsync = async (): Promise<LocationCoords> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn('[Geo] ⚠️ Location permission denied');
    return { lat: '0', long: '0', timeStamp: new Date().toISOString() };
  }

  // Try 1: High accuracy (GPS), 10s timeout — matches Expo Accuracy.Balanced
  let coords = await getPosition(true, 10000);
  if (coords.lat && coords.lat !== '0') return coords;

  // Try 2: Low accuracy (Network/WiFi), 10s timeout — fallback
  coords = await getPosition(false, 10000);
  if (coords.lat && coords.lat !== '0') return coords;

  // Both failed — return zeros
  console.warn('[Geo] ⚠️ All location attempts failed, using 0,0');
  return { lat: '0', long: '0', timeStamp: new Date().toISOString() };
};
