/**
 * PermissionService.ts — App start par sabhi required permissions ek saath request karo
 *
 * Permissions:
 *   1. CAMERA        — photo + video capture ke liye
 *   2. RECORD_AUDIO  — video recording mein audio ke liye
 *   3. ACCESS_FINE_LOCATION — location tracking ke liye
 *
 * Usage: App.tsx mein bootstrap ke andar `requestAllPermissions()` call karo
 *        Login hone se pehle hi permissions le lo
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

// Permissions jo hume chahiye
const REQUIRED_PERMISSIONS = [
  PermissionsAndroid.PERMISSIONS.CAMERA,
  PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
];

/**
 * Sabhi permissions ek saath request karo — App start par call hoga
 * Returns true agar sabhi granted hain
 */
export const requestAllPermissions = async (): Promise<boolean> => {
  // iOS pe alag handling — yahan sirf Android
  if (Platform.OS !== 'android') return true;

  try {
    // Pehle check karo kaunsi already granted hain
    const statuses = await Promise.all(
      REQUIRED_PERMISSIONS.map((p) => PermissionsAndroid.check(p))
    );

    const notGranted = REQUIRED_PERMISSIONS.filter((_, i) => !statuses[i]);

    // Agar sabhi already granted hain
    if (notGranted.length === 0) {
      console.log('[Permissions] All permissions already granted');
      return true;
    }

    console.log('[Permissions] Requesting:', notGranted);

    // Ek saath sabhi missing permissions request karo
    const results = await PermissionsAndroid.requestMultiple(notGranted);

    // Check karo kaunsi deny/never_ask_again hui
    const denied: string[] = [];
    const blocked: string[] = [];

    for (const [permission, result] of Object.entries(results)) {
      const label = getPermissionLabel(permission);
      if (result === PermissionsAndroid.RESULTS.DENIED) {
        denied.push(label);
      } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        blocked.push(label);
      }
    }

    // Agar koi blocked hai (never_ask_again) → Settings page kholo
    if (blocked.length > 0) {
      Alert.alert(
        'Permissions Required',
        `The following permissions are blocked:\n\n${blocked.join('\n')}\n\nPlease enable them in App Settings to use all features.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    // Agar koi denied hai → inform karo
    if (denied.length > 0) {
      console.warn('[Permissions] Denied:', denied);
      return false;
    }

    console.log('[Permissions] All permissions granted');
    return true;
  } catch (error) {
    console.error('[Permissions] Error requesting permissions:', error);
    return false;
  }
};

/**
 * Check karo sabhi permissions granted hain ya nahi
 */
export const checkAllPermissions = async (): Promise<{
  camera: boolean;
  audio: boolean;
  location: boolean;
  allGranted: boolean;
}> => {
  if (Platform.OS !== 'android') {
    return { camera: true, audio: true, location: true, allGranted: true };
  }

  const [camera, audio, location] = await Promise.all([
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA),
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO),
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
  ]);

  return {
    camera,
    audio,
    location,
    allGranted: camera && audio && location,
  };
};

// ── Helpers ──

const getPermissionLabel = (permission: string): string => {
  if (permission.includes('CAMERA')) return '• Camera';
  if (permission.includes('RECORD_AUDIO')) return '• Microphone (Audio)';
  if (permission.includes('LOCATION')) return '• Location';
  return `• ${permission}`;
};
