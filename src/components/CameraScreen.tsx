/**
 * CameraScreen.tsx — Image Capture + Offline Queue
 *
 * Flow:
 *   1. react-native-vision-camera se image capture
 *   2. RNFS se local mein save (permanent storage)
 *   3. DB mein entry (imageCaptureDb) — pending status
 *   4. ValuationStore update — UI green ho jaaye
 *   5. SyncManager auto-upload karta hai agar online
 *
 * Route params:
 *   - id: leadId
 *   - side: card name e.g. "Front Side"
 *   - vehicleType: "2W", "4W" etc
 *   - appColumn: API field name e.g. "FrontSideBase64"
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/Colors';
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
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const CameraScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id: leadId, side, appColumn } = route.params as RouteParams;

  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [isSaving, setIsSaving] = useState(false);
  const [_capturedUri, setCapturedUri] = useState<string | null>(null);

  const { markLocalCaptured } = useValuationStore();

  // ── Permission check ────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // ── Capture ─────────────────────────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isSaving) return;

    try {
      setIsSaving(true);

      // 1. Photo capture
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      const tempUri = `file://${photo.path}`;
      setCapturedUri(tempUri);

      // 2. Local mein permanent save
      const localPath = await saveImageLocally({
        leadId,
        side,
        tempUri,
      });

      // 3. DB mein entry — pending upload
      await saveImageCapture({
        leadId,
        side,
        appColumn,
        localPath,
      });

      // 4. Store update — ValuationPage pe green card dikhega
      markLocalCaptured(side, localPath);

      // 5. SyncManager ko notify karo — agar online hai toh upload start hoga
      await SyncManager.refreshPendingCount();

      console.log(`[Camera] ✅ Captured & saved: ${side} (${appColumn})`);

      // 6. Wapas navigate karo
      navigation.goBack();

    } catch (e: any) {
      console.error('[Camera] Capture failed:', e);
      ToastAndroid.show('Failed to capture image. Try again.', ToastAndroid.SHORT);
    } finally {
      setIsSaving(false);
    }
  }, [cameraRef, isSaving, leadId, side, appColumn, markLocalCaptured, navigation]);

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
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{side}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* CAMERA PREVIEW */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* OVERLAY — Grid lines for framing */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.gridHorizontal} />
        <View style={styles.gridVertical} />
      </View>

      {/* BOTTOM CONTROLS */}
      <View style={styles.controls}>

        {/* Capture guide text */}
        <Text style={styles.guideText}>
          Position the {side.toLowerCase()} in frame
        </Text>

        {/* Capture Button */}
        <View style={styles.captureRow}>

          {/* Galley / empty placeholder */}
          <View style={styles.captureRowSpacer} />

          {/* Shutter */}
          <TouchableOpacity
            style={[styles.captureBtn, isSaving && styles.captureBtnDisabled]}
            onPress={handleCapture}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>

          {/* Back button (small) */}
          <TouchableOpacity style={styles.cancelSmall} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Saving indicator */}
        {isSaving && (
          <Text style={styles.savingText}>Saving image...</Text>
        )}
      </View>

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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    gap: 20,
  },
  guideText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 16,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  cancelSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    color: '#fff',
    fontSize: 13,
    paddingBottom: 8,
  },
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
  headerSpacer: {
    width: 40,
  },
  captureRowSpacer: {
    width: 44,
  },
});