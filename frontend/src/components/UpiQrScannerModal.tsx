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
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

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
    setIsScanning(false);
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
    // Stop camera immediately as requested by user
    stopCameraStream();
    onScanSuccess(parsed);
    onClose();
  };

  // Web camera initialization and scanning loop
  const startWebCamera = async () => {
    setErrorMessage(null);
    setIsScanning(true);
    isDestroyedRef.current = false;

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Camera access is not supported on this browser. Try uploading a QR image file.');
      setIsScanning(false);
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
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();

        startScanLoop();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setHasCameraPermission(false);
      setIsScanning(false);
      setErrorMessage('Camera permission denied or camera unavailable. You can pick a QR image from gallery below.');
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
          // Priority 1: Native browser BarcodeDetector API
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
        setTimeout(() => startWebCamera(), 200);
      } else {
        setIsScanning(true);
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
            Point your camera at any PhonePe, GPay, Paytm or Bank QR code to auto-decode UPI ID.
          </Text>

          {/* Error / Warning Alert */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Camera Viewfinder Box */}
          <View style={styles.viewfinderContainer}>
            {Platform.OS === 'web' ? (
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
            ) : (
              <View style={styles.nativeCameraFallback}>
                <Ionicons name="camera" size={48} color="#94a3b8" />
                <Text style={styles.fallbackText}>Live Web Scanner Active</Text>
              </View>
            )}

            {/* Target Frame Box Over Video */}
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionsRow}>
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
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
    maxWidth: 420,
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
    height: 250,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeCameraFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 12,
    fontFamily: FONT.semibold,
    color: '#94a3b8',
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
    gap: 10,
    marginTop: 4,
  },
  galleryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
  },
  galleryBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#475569',
  },
});
