import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS } from '@/constants/theme';
import { parseUpiQrCode, ParsedUpiResult } from '../utils/upiQrParser';

interface UpiQrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (result: ParsedUpiResult) => void;
}

export const UpiQrScannerModal: React.FC<UpiQrScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const [cameraStatus, setCameraStatus] = useState<'IDLE' | 'STARTING' | 'ACTIVE' | 'FAILED'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isDestroyedRef = useRef(false);

  const stopCameraStream = () => {
    isDestroyedRef.current = true;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    setCameraStatus('IDLE');
  };

  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  const handleQrDecodedSuccess = (rawText: string) => {
    const parsed = parseUpiQrCode(rawText);
    if (!parsed) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setErrorMessage('Invalid UPI QR Code! Please scan a valid GPay/PhonePe/Paytm UPI QR.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Stop camera immediately after scan
    stopCameraStream();
    onScanSuccess(parsed);
    onClose();
  };

  // Web camera initialization and scanning loop
  const startWebCamera = async () => {
    setErrorMessage(null);
    setCameraStatus('STARTING');
    isDestroyedRef.current = false;

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('FAILED');
      setErrorMessage('Camera access is not supported on this browser. Try uploading a QR image file.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      if (isDestroyedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      setCameraStatus('ACTIVE');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();

        startScanLoop();
      }
    } catch (err: any) {
      console.warn('Camera permission or device error:', err);
      setCameraStatus('FAILED');
      setErrorMessage('Camera permission denied or camera unavailable. Please grant camera permission or select QR photo from gallery.');
    }
  };

  const startScanLoop = () => {
    if (isDestroyedRef.current) return;

    let barcodeDetector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {}
    }

    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    const ctx = canvas?.getContext('2d');

    const scanFrame = async () => {
      if (isDestroyedRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          if (barcodeDetector) {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleQrDecodedSuccess(barcodes[0].rawValue);
              return;
            }
          } else if (canvas && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        } catch (err) {}
      }

      if (!isDestroyedRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // Image upload fallback decoding
  const handlePickQrImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to select QR image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const imageUri = result.assets[0].uri;

        if (Platform.OS === 'web' && typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = async () => {
            try {
              const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
              const barcodes = await detector.detect(img);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                handleQrDecodedSuccess(barcodes[0].rawValue);
              } else {
                Alert.alert('QR Code Not Found', 'Could not detect a valid QR code in the selected image.');
              }
            } catch (err) {
              Alert.alert('Scan Failed', 'Could not read QR code from image.');
            }
          };
          img.src = imageUri;
        } else {
          Alert.alert(
            'QR Image Selected',
            'Please paste your UPI ID directly or scan using live camera stream.'
          );
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  useEffect(() => {
    if (visible) {
      if (Platform.OS === 'web') {
        // Try auto starting web camera
        setTimeout(() => startWebCamera(), 150);
      }
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="qr-code" size={22} color="#16a34a" />
              <Text style={styles.headerTitle}>Scan UPI QR Code</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.75}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Subtitle instructions */}
          <Text style={styles.subtitle}>
            Point camera at PhonePe, GPay, Paytm or Bank QR code to auto-decode UPI ID.
          </Text>

          {/* Error / Warning Alert */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Camera Viewfinder Container */}
          <View style={styles.viewfinderContainer}>
            {cameraStatus === 'ACTIVE' ? (
              <video
                ref={videoRef as any}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: RADIUS.md,
                }}
                playsInline
                muted
              />
            ) : cameraStatus === 'STARTING' ? (
              <View style={styles.statusBox}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.statusText}>Connecting to Camera...</Text>
              </View>
            ) : (
              /* Idle or Failed State: Show Turn On Camera CTA */
              <View style={styles.statusBox}>
                <View style={styles.cameraIconCircle}>
                  <Ionicons name="camera" size={32} color="#22c55e" />
                </View>
                <Text style={styles.cameraTitleText}>Camera Access Required</Text>
                <Text style={styles.cameraSubText}>Click the button below to turn ON camera access</Text>

                <TouchableOpacity
                  style={styles.turnOnCameraBtn}
                  activeOpacity={0.85}
                  onPress={startWebCamera}
                >
                  <Ionicons name="videocam" size={18} color="#ffffff" />
                  <Text style={styles.turnOnCameraBtnText}>🎥 Turn On Camera (ਕੈਮਰਾ ਚਾਲੂ ਕਰੋ)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Target Frame Box Over Video when Active */}
            {cameraStatus === 'ACTIVE' && (
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            )}
          </View>

          {/* Bottom Actions Row */}
          <View style={styles.actionsRow}>
            {cameraStatus !== 'ACTIVE' ? (
              <TouchableOpacity
                style={styles.turnOnCameraActionBtn}
                activeOpacity={0.8}
                onPress={startWebCamera}
              >
                <Ionicons name="videocam" size={18} color="#ffffff" />
                <Text style={styles.turnOnCameraActionBtnText}>🎥 Turn On Camera</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.stopCameraActionBtn}
                activeOpacity={0.8}
                onPress={stopCameraStream}
              >
                <Ionicons name="stop-circle" size={18} color="#dc2626" />
                <Text style={styles.stopCameraActionBtnText}>Stop Camera</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.galleryBtn}
              activeOpacity={0.8}
              onPress={handlePickQrImage}
            >
              <Ionicons name="image-outline" size={18} color="#059669" />
              <Text style={styles.galleryBtnText}>Select QR Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={handleClose}
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 18,
    gap: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  errorText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#dc2626',
    flex: 1,
  },
  viewfinderContainer: {
    width: '100%',
    height: 260,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  cameraIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#22c55e',
  },
  cameraTitleText: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  cameraSubText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },
  turnOnCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    marginTop: 4,
  },
  turnOnCameraBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  statusText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  targetFrame: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#22c55e',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  turnOnCameraActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#16a34a',
  },
  turnOnCameraActionBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  stopCameraActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  stopCameraActionBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#dc2626',
  },
  galleryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  galleryBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#475569',
  },
});
