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
import { decodeQrFromImageUri } from '../utils/qrDecoder';
import jsQR from 'jsqr';

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
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isDecodingImage, setIsDecodingImage] = useState(false);

  // Confirmation state for decoded QR photo preview
  const [pendingDecodedResult, setPendingDecodedResult] = useState<ParsedUpiResult | null>(null);

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
    setPendingDecodedResult(null);
    onClose();
  };

  const handleQrDecodedFromLiveCamera = (rawText: string) => {
    const parsed = parseUpiQrCode(rawText);
    if (!parsed) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setErrorMessage('Invalid UPI QR Code! Please scan a valid GPay/PhonePe/Paytm UPI QR.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Directly confirm or show result
    stopCameraStream();
    onScanSuccess(parsed);
    onClose();
  };

  // Direct Camera permission prompt and stream start
  const requestCameraPermissionAndStart = async () => {
    setErrorMessage(null);
    setIsRequestingPermission(true);
    isDestroyedRef.current = false;

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Camera access is not supported on this browser. Please select a QR photo from gallery.');
      setIsRequestingPermission(false);
      setHasCameraPermission(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (isDestroyedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      setHasCameraPermission(true);
      setIsScanning(true);
      setIsRequestingPermission(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play().catch(() => {});
        startScanLoop();
      }
    } catch (err: any) {
      console.warn('Camera permission denied or error:', err);
      setHasCameraPermission(false);
      setIsScanning(false);
      setIsRequestingPermission(false);
      setErrorMessage('Camera permission was denied. Click "Allow Camera Access" or pick a QR photo below.');
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
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    let lastScanTime = 0;

    const scanFrame = async (timestamp: number) => {
      if (isDestroyedRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA && timestamp - lastScanTime >= 100) {
        lastScanTime = timestamp;
        try {
          // Priority 1: Native BarcodeDetector (Chrome Android / Desktop Chrome)
          if (barcodeDetector) {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleQrDecodedFromLiveCamera(barcodes[0].rawValue);
              return;
            }
          }

          // Priority 2: jsQR Engine on canvas (iOS Safari, Firefox Mobile, Samsung Browser, Chrome Android fallback)
          if (canvas && ctx) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (qrCode && qrCode.data) {
              handleQrDecodedFromLiveCamera(qrCode.data);
              return;
            }
          }
        } catch (err) {}
      }

      if (!isDestroyedRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // Image select & decode flow with preview confirmation
  const handlePickQrImage = async () => {
    setErrorMessage(null);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to select a QR photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setIsDecodingImage(true);
        const imageUri = result.assets[0].uri;

        const rawText = await decodeQrFromImageUri(imageUri);
        setIsDecodingImage(false);

        if (!rawText) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          setErrorMessage('Could not find a valid QR code in the selected photo. Please select a clear QR code image.');
          return;
        }

        const parsed = parseUpiQrCode(rawText);
        if (!parsed) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          setErrorMessage('QR code found, but it is not a valid UPI ID / Payment QR code.');
          return;
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Pause camera stream and show confirmation preview modal
        stopCameraStream();
        setPendingDecodedResult(parsed);
      }
    } catch (err) {
      setIsDecodingImage(false);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const handleConfirmAddUpi = () => {
    if (pendingDecodedResult) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onScanSuccess(pendingDecodedResult);
      setPendingDecodedResult(null);
      onClose();
    }
  };

  useEffect(() => {
    if (visible) {
      setPendingDecodedResult(null);
      if (Platform.OS === 'web') {
        setTimeout(() => requestCameraPermissionAndStart(), 150);
      } else {
        setIsScanning(true);
      }
    } else {
      stopCameraStream();
      setHasCameraPermission(null);
      setPendingDecodedResult(null);
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
              <Text style={styles.headerTitle}>
                {pendingDecodedResult ? 'Decoded QR Code' : 'Scan UPI QR Code'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.75}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* IF PREVIEW CONFIRMATION STEP FOR PHOTO DECODED QR */}
          {pendingDecodedResult ? (
            <View style={styles.previewContainer}>
              <View style={styles.successIconBadge}>
                <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
              </View>

              <Text style={styles.previewSuccessTitle}>QR Code Successfully Decoded! 🎉</Text>
              <Text style={styles.previewSub}>
                Verify the decoded UPI ID details below and click OK to add to text box.
              </Text>

              {/* Decoded Details Card */}
              <View style={styles.decodedCard}>
                <View style={styles.decodedRow}>
                  <Text style={styles.decodedLabel}>Decoded UPI ID:</Text>
                  <Text style={styles.decodedValueUpi}>{pendingDecodedResult.upiId}</Text>
                </View>

                {pendingDecodedResult.payeeName ? (
                  <View style={[styles.decodedRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 }]}>
                    <Text style={styles.decodedLabel}>Payee Name:</Text>
                    <Text style={styles.decodedValueName}>{pendingDecodedResult.payeeName}</Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons: Yes, Save UPI code & Rescan / Cancel */}
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={styles.okConfirmBtn}
                  activeOpacity={0.85}
                  onPress={handleConfirmAddUpi}
                >
                  <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                  <Text style={styles.okConfirmBtnText}>Yes, Save UPI code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rescanBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setPendingDecodedResult(null);
                    requestCameraPermissionAndStart();
                  }}
                >
                  <Ionicons name="refresh-outline" size={16} color="#334155" />
                  <Text style={styles.rescanBtnText}>🔄 Rescan / Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* REGULAR CAMERA / SCANNER STEP */
            <>
              <Text style={styles.subtitle}>
                Point camera at QR code or click "Select QR Photo" to decode from gallery.
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
                {isDecodingImage ? (
                  <View style={styles.decodingBox}>
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text style={styles.decodingText}>Decoding QR code from photo...</Text>
                  </View>
                ) : hasCameraPermission === false ? (
                  <View style={styles.permissionDeniedBox}>
                    <Ionicons name="camera-outline" size={42} color="#f59e0b" />
                    <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                    <Text style={styles.permissionSub}>
                      Please click allow to enable your camera and scan live QR codes directly.
                    </Text>
                    <TouchableOpacity
                      style={styles.allowCameraBtn}
                      activeOpacity={0.85}
                      disabled={isRequestingPermission}
                      onPress={requestCameraPermissionAndStart}
                    >
                      {isRequestingPermission ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="videocam" size={16} color="#ffffff" />
                          <Text style={styles.allowCameraBtnText}>Allow Camera Access & Scan</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : Platform.OS === 'web' ? (
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
                {hasCameraPermission !== false && !isDecodingImage ? (
                  <View style={styles.targetFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                ) : null}
              </View>

              {/* Bottom Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.galleryBtn}
                  activeOpacity={0.8}
                  disabled={isDecodingImage}
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
            </>
          )}
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
  decodingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  decodingText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  permissionDeniedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  permissionTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  permissionSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 15,
  },
  allowCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    marginTop: 6,
  },
  allowCameraBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  nativeCameraFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
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

  // Decoded Preview Confirmation Styles
  previewContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  successIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSuccessTitle: {
    fontSize: 15.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
    textAlign: 'center',
  },
  previewSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
    textAlign: 'center',
  },
  decodedCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 8,
  },
  decodedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  decodedLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  decodedValueUpi: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#0284c7',
  },
  decodedValueName: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  confirmBtnRow: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  okConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    height: 44,
  },
  okConfirmBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
  },
  rescanBtnText: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#334155',
  },
});
