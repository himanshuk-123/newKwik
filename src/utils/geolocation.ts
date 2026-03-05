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

export const getLocationAsync = async (): Promise<LocationCoords> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn('[Geo] ⚠️ Location permission denied');
    return { lat: '0', long: '0', timeStamp: new Date().toISOString() };
  }

  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const coords: LocationCoords = {
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
          timeStamp: new Date().toISOString(),
        };
        console.log('[Geo] 📍 Location captured:', coords.lat, coords.long);
        resolve(coords);
      },
      (error) => {
        console.warn('[Geo] ⚠️ GPS failed:', error.message, `(code: ${error.code})`);
        resolve({ lat: '0', long: '0', timeStamp: new Date().toISOString() });
      },
      {
        enableHighAccuracy: false,  // Network/WiFi — fast, works indoors
        timeout: 5000,              // 5 seconds max
        maximumAge: 10000,          // Accept cached position up to 10s old
      }
    );
  });
};
