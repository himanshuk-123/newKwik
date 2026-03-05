/**
 * CameraScreen.tsx — Image Capture + Offline Queue
 *
 * Flow:
 *   1. react-native-vision-camera se image capture
 *   2. User ko preview dikhao — verify karne do
 *   3. Proceed → local save + DB entry (offline queue)
 *   4. Server upload baad mein SyncManager handle karega
 *
 * Route params:
 *   - id: leadId
 *   - side: card name e.g. "Front Side"
 *   - vehicleType: "2W", "4W" etc
 *   - appColumn: API field name e.g. "FrontSideBase64"
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ToastAndroid,
  AppState,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Orientation from 'react-native-orientation-locker';
import { COLORS } from '../constants/Colors';
import { getLocationAsync } from '../utils/geolocation';
import { saveImageLocally } from '../services/Imageuploadservice';
import { saveImageCapture } from '../database/imageCaptureDb';
import { useValuationStore } from '../store/valuation.store';
import { SyncManager } from '../services/Syncmanager';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface RouteParams {
  id: string;           // leadId
  side: string;         // Card name e.g. "Front Side"
  vehicleType: string;  // "2W", "4W" etc
  appColumn: string;    // API field name e.g. "FrontSideBase64"
  useFrontCamera?: boolean; // true for selfie cards
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const CameraScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id: leadId, side, appColumn, useFrontCamera } = route.params as RouteParams;

  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(useFrontCamera ? 'front' : 'back');
  const isFocused = useIsFocused();

  // previewUri = null → camera mode, non-null → preview mode
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Track app state — camera should stop when app is backgrounded
  const [appActive, setAppActive] = useState(true);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Camera is active only when: screen focused + app in foreground + not in preview
  const isCameraActive = isFocused && appActive && !previewUri;

  // Reset ready state when camera becomes inactive
  useEffect(() => {
    if (!isCameraActive) {
      setIsCameraReady(false);
    }
  }, [isCameraActive]);

  const { markLocalCaptured } = useValuationStore();

  // ── Landscape lock — mount pe landscape, unmount pe portrait ────────────────

  // ── Orientation — selfie portrait, normal landscape ─────────────────────

  useEffect(() => {
    if (useFrontCamera) {
      Orientation.lockToPortrait();
    } else {
      Orientation.lockToLandscapeLeft();
    }
    return () => {
      Orientation.lockToPortrait();
    };
  }, [useFrontCamera]);

  // ── Permission check ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // ── Step 1: Capture — sirf photo lo, save nahi karo ─────────────────────────

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    if (!isCameraReady) {
      ToastAndroid.show('Camera initializing... please wait', ToastAndroid.SHORT);
      return;
    }

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      // Preview mode ON — user ko image dikhao
      setPreviewUri(`file://${photo.path}`);

    } catch (e: any) {
      const msg = e?.message || e?.toString() || '';
      const isCameraClosed = msg.toLowerCase().includes('camera is closed') ||
                             msg.toLowerCase().includes('session');

      if (isCameraClosed) {
        // Race condition — camera abhi ready nahi thi, retry once after delay
        console.warn('[Camera] Camera closed, retrying in 500ms...');
        setIsCameraReady(false);
        await new Promise<void>(resolve => setTimeout(resolve, 500));

        try {
          if (cameraRef.current) {
            const retryPhoto = await cameraRef.current.takePhoto({
              flash: 'off',
              enableShutterSound: false,
            });
            setPreviewUri(`file://${retryPhoto.path}`);
            setIsCapturing(false);
            return;
          }
        } catch (retryErr) {
          console.error('[Camera] Retry also failed:', retryErr);
        }

        ToastAndroid.show('Camera not ready. Go back and try again.', ToastAndroid.SHORT);
      } else {
        console.error('[Camera] Capture failed:', e);
        ToastAndroid.show('Failed to capture. Try again.', ToastAndroid.SHORT);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isCameraReady, isCapturing]);

  // ── Step 2: Retake — preview hatao, camera wapas ───────────────────────────

  const handleRetake = useCallback(() => {
    setPreviewUri(null);
  }, []);

  // ── Step 3: Proceed — ab local save + DB entry ─────────────────────────────

  const handleProceed = useCallback(async () => {
    if (!previewUri || isSaving) return;

    try {
      setIsSaving(true);

      // 1. Local mein permanent save
      const localPath = await saveImageLocally({
        leadId,
        side,
        tempUri: previewUri,
      });

      // 2. Get GPS location — awaited, never throws (same as old app)
      const geo = await getLocationAsync();

      // 3. DB mein entry — pending upload (server baad mein karega)
      await saveImageCapture({
        leadId,
        side,
        appColumn,
        localPath,
        latitude: geo.lat,
        longitude: geo.long,
        capturedAt: geo.timeStamp,
      });

      // 3. Store update — ValuationPage pe green card dikhega
      markLocalCaptured(side, localPath);

      // 4. Pending count refresh — SyncManager baad mein upload karega
      await SyncManager.refreshPendingCount();

      console.log(`[Camera] ✅ Saved locally: ${side} (${appColumn})`);

      // 5. Wapas navigate karo
      navigation.goBack();

    } catch (e: any) {
      console.error('[Camera] Save failed:', e);
      ToastAndroid.show('Failed to save image. Try again.', ToastAndroid.SHORT);
    } finally {
      setIsSaving(false);
    }
  }, [previewUri, isSaving, leadId, side, appColumn, markLocalCaptured, navigation]);

  // ── Permission not granted ─────────────────────────────────────────────────

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="camera-off" size={48} color="#999" />
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── No device ──────────────────────────────────────────────────────────────

  if (!device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW MODE — image clicked, user verify karega
  // ─────────────────────────────────────────────────────────────────────────

  if (previewUri) {
    return (
      <View style={styles.container}>

        {/* Captured image full-screen */}
        <Image
          source={{ uri: previewUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />

        {/* Bottom buttons — Retake + Proceed */}
        <View style={styles.previewButtons}>

          {/* Retake */}
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
            <MaterialCommunityIcons name="camera-retake" size={24} color="#fff" />
            <Text style={styles.btnLabel}>Retake</Text>
          </TouchableOpacity>

          {/* Proceed — save locally */}
          <TouchableOpacity
            style={[styles.proceedBtn, isSaving && styles.btnDisabled]}
            onPress={handleProceed}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                <Text style={styles.btnLabel}>Proceed</Text>
              </>
            )}
          </TouchableOpacity>

        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CAMERA MODE — live viewfinder + shutter
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* CAMERA PREVIEW */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isCameraActive}
        photo={true}
        onInitialized={() => setIsCameraReady(true)}
        onError={(e) => console.warn('[Camera] Device error:', e)}
      />

      {/* Loading overlay while camera not ready */}
      {!isCameraReady && (
        <View style={styles.cameraLoadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.cameraLoadingText}>Starting camera...</Text>
        </View>
      )}

      {/* SHUTTER BUTTON — floating, no background */}
      <TouchableOpacity
        style={[styles.captureBtn, (!isCameraReady || isCapturing) && styles.captureBtnDisabled]}
        onPress={handleCapture}
        activeOpacity={0.8}
        disabled={!isCameraReady || isCapturing}
      >
        {isCapturing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={styles.captureInner} />
        )}
      </TouchableOpacity>

    </View>
  );
};

export default CameraScreen;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: 16,
  },

  // ── Shutter ─────────────────────────────────────────────────────────────────
  captureBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  captureBtnDisabled: {
    opacity: 0.4,
  },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 12,
  },
  cameraLoadingText: {
    color: '#fff',
    fontSize: 14,
  },

  // ── Preview mode buttons ────────────────────────────────────────────────────
  previewButtons: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  btnLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // ── Permission ──────────────────────────────────────────────────────────────
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});