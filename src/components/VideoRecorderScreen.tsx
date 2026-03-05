/**
 * VideoRecorderScreen.tsx — 60s Mandatory Video Recorder
 *
 * Features:
 *   - Landscape-only recording
 *   - 60 seconds mandatory — NO manual stop button
 *   - Auto-stop + auto-save after 60s
 *   - Circular countdown timer UI with SVG
 *   - Offline-first: saves locally → SyncManager uploads later
 *
 * Route params:
 *   - id: leadId
 *   - side: "Video"
 *   - vehicleType: "2W", "4W" etc
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  useCameraFormat,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Orientation from 'react-native-orientation-locker';
import Svg, { Circle } from 'react-native-svg';
import { getLocationAsync } from '../utils/geolocation';
import { saveVideoLocally } from '../services/Imageuploadservice';
import { saveImageCapture } from '../database/imageCaptureDb';
import { useValuationStore } from '../store/valuation.store';
import { SyncManager } from '../services/Syncmanager';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const RECORDING_DURATION = 60; // seconds — mandatory, no manual stop

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface RouteParams {
  id: string;           // leadId
  side: string;         // "Video"
  vehicleType: string;  // "2W", "4W" etc
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const VideoRecorderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id: leadId, side } = route.params as RouteParams;

  const cameraRef = useRef<Camera>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef(false); // guard against double stop

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  // 720p format keeps file size small; videoBitRate 'low' further compresses
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RECORDING_DURATION);
  const [isSaving, setIsSaving] = useState(false);

  const { markLocalCaptured } = useValuationStore();

  // ── Landscape lock — mount pe landscape, unmount pe portrait ────────────────

  useEffect(() => {
    Orientation.lockToLandscapeRight();
    return () => {
      Orientation.lockToPortrait();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Permission check ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // ── Handle recording finished — save video locally + DB entry ───────────────

  const handleRecordingFinished = useCallback(async (videoFile: { path: string; duration: number }) => {
    if (isSaving) return;
    setIsSaving(true);
    recordingRef.current = false;

    try {
      const tempUri = `file://${videoFile.path}`;
      console.log(`[VideoRecorder] 🎬 Recording finished: ${videoFile.duration?.toFixed(1)}s, path: ${videoFile.path}`);

      // 1. Save locally (permanent location)
      const localPath = await saveVideoLocally({
        leadId,
        side,
        tempUri,
      });

      // 2. Get GPS location — awaited, never throws (same as old app)
      const geo = await getLocationAsync();

      // 3. DB entry — pending upload (SyncManager baad mein upload karega)
      await saveImageCapture({
        leadId,
        side,
        appColumn: 'Video1',
        localPath,
        mediaType: 'video',
        latitude: geo.lat,
        longitude: geo.long,
        capturedAt: geo.timeStamp,
      });

      // 3. Store update — ValuationPage pe green card dikhega
      markLocalCaptured(side, localPath);

      // 4. Pending count refresh
      await SyncManager.refreshPendingCount();

      console.log(`[VideoRecorder] ✅ Video saved successfully: ${side}`);
      ToastAndroid.show('Video saved successfully!', ToastAndroid.SHORT);

      // 5. Wapas navigate karo
      navigation.goBack();

    } catch (e: any) {
      console.error('[VideoRecorder] Save failed:', e);
      ToastAndroid.show('Failed to save video. Try again.', ToastAndroid.LONG);
      setIsSaving(false);
      setIsRecording(false);
    }
  }, [isSaving, leadId, side, markLocalCaptured, navigation]);

  // ── Start recording — 60s countdown, auto-stop ─────────────────────────────

  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording || recordingRef.current) return;

    try {
      setIsRecording(true);
      setSecondsLeft(RECORDING_DURATION);
      recordingRef.current = true;

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            // ⏰ Time's up — stop recording
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;

            // Stop recording (triggers onRecordingFinished callback)
            if (recordingRef.current) {
              cameraRef.current?.stopRecording();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start vision-camera video recording
      // videoCodec h265 gives ~50% smaller files than h264
      cameraRef.current.startRecording({
        videoCodec: 'h265',
        onRecordingFinished: handleRecordingFinished,
        onRecordingError: (error) => {
          console.error('[VideoRecorder] Recording error:', error);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          recordingRef.current = false;
          setIsRecording(false);
          ToastAndroid.show('Recording failed. Try again.', ToastAndroid.LONG);
        },
      });

      console.log('[VideoRecorder] 🎬 Recording started — 60s countdown');

    } catch (e: any) {
      console.error('[VideoRecorder] Start recording failed:', e);
      recordingRef.current = false;
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      ToastAndroid.show('Failed to start recording', ToastAndroid.SHORT);
    }
  }, [isRecording, handleRecordingFinished]);

  // ── Circular countdown timer UI ─────────────────────────────────────────────

  const renderCountdown = () => {
    const size = 100;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = secondsLeft / RECORDING_DURATION;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <View style={styles.countdownContainer}>
        <Svg width={size} height={size}>
          {/* Background circle (dark) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={strokeWidth}
            fill="rgba(0,0,0,0.4)"
          />
          {/* Progress circle (red) — depletes as time runs out */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FF4444"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        {/* Countdown number in center */}
        <View style={styles.countdownTextContainer}>
          <Text style={styles.countdownNumber}>{secondsLeft}</Text>
          <Text style={styles.countdownLabel}>sec</Text>
        </View>

        {/* REC indicator below timer */}
        <View style={styles.recIndicator}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>REC</Text>
        </View>
      </View>
    );
  };

  // ── Permission not granted ─────────────────────────────────────────────────

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="camera-off" size={48} color="#999" />
        <Text style={styles.infoText}>Camera permission required</Text>
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
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.infoText}>Loading camera...</Text>
      </View>
    );
  }

  // ── Saving state — full screen overlay ─────────────────────────────────────

  if (isSaving) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF4444" />
        <Text style={styles.savingText}>Saving video...</Text>
        <Text style={styles.savingSubtext}>Please wait</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Camera + UI overlay
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* CAMERA PREVIEW — full screen */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        format={format}
        videoBitRate={'low'}
      />

      {/* ── RECORDING MODE: Countdown timer (top-right) ── */}
      {isRecording && renderCountdown()}

      {/* ── PRE-RECORDING: Start button + instructions ── */}
      {!isRecording && (
        <View style={styles.startOverlay}>
          {/* Top instructions */}
          <View style={styles.instructionContainer}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#fff" />
            <Text style={styles.instructionText}>
              60-second video recording
            </Text>
          </View>

          {/* Center: Start button */}
          <View style={styles.startBtnWrapper}>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={handleStartRecording}
              activeOpacity={0.8}
            >
              <View style={styles.startBtnInner}>
                <MaterialCommunityIcons name="video" size={32} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.startBtnLabel}>Tap to Start</Text>
          </View>

          {/* Bottom warning */}
          <View style={styles.warningContainer}>
            <MaterialCommunityIcons name="timer-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.warningText}>
              Video will auto-stop after 60 seconds. No manual stop.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default VideoRecorderScreen;

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
    gap: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },

  // ── Saving state ────────────────────────────────────────────────────────────
  savingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  savingSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },

  // ── Pre-recording overlay ───────────────────────────────────────────────────
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },

  startBtnWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  startBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  startBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },

  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  warningText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },

  // ── Countdown timer (during recording) ──────────────────────────────────────
  countdownContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'center',
  },
  countdownTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: -4,
  },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4444',
  },
  recText: {
    color: '#FF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // ── Permission ──────────────────────────────────────────────────────────────
  permissionBtn: {
    backgroundColor: '#FF4444',
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
