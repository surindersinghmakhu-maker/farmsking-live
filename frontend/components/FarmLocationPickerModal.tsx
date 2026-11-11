import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCrops, CornerCoord, CropGpsData } from '@/src/store/crops-context';
import { useAuth } from '@/src/store/auth-context';
import {
  CropVideoPlayer,
  WebCameraPhotoModal,
  WebCameraVideoRecorderModal,
} from '@/components/CropVideoPlayer';
import { CropRemarksSection } from '@/components/CropRemarksSection';
import {
  computeDaysRemaining,
  deleteRemovedMediaStoreRecords,
  detectMediaCaptureSource,
  fetchCropMediaFromStore,
  fetchCropRemarkFromStore,
  formatMediaTimestamp,
  isLocalGpsMediaActive,
  MAX_REMARK_CHARS,
  MEDIA_DISPLAY_DAYS,
  MEDIA_DISPLAY_MS,
  MediaCaptureSource,
  mergeCropMediaLists,
  pickWebMediaFiles,
  resolveCropMediaDisplayUri,
  saveCropRemarkToStore,
  stampWatermarkOnImage,
  uploadSingleCropMedia,
} from '@/src/utils/crop-media';

interface FarmLocationPickerModalProps {
  visible: boolean;
  initialIsLocked?: boolean;
  cropId?: string;
  cropName?: string;
  farmerName?: string;
  farmerPhone?: string;
  plotName?: string;
  location?: string;
  existingGpsData?: CropGpsData;
  onClose: () => void;
  onSaveLocation: (locationData: {
    latitude: number;
    longitude: number;
    areaAcres: number;
    addressText: string;
    isLocked: boolean;
    corners: CornerCoord[];
    gpsData: CropGpsData;
  }) => void;
}

// Calculate area of polygon from 4 corner coordinates (lat/lng) in Acres
function calculatePolygonAreaInAcres(cornerCoords: CornerCoord[]): number {
  if (cornerCoords.length < 4) return 0;
  const R = 6378137; // Earth radius in meters
  let area = 0;
  const numCoords = cornerCoords.length;

  for (let i = 0; i < numCoords; i++) {
    const p1 = cornerCoords[i];
    const p2 = cornerCoords[(i + 1) % numCoords];
    const x1 = (p1.lng * Math.PI * R * Math.cos((p1.lat * Math.PI) / 180)) / 180;
    const y1 = (p1.lat * Math.PI * R) / 180;
    const x2 = (p2.lng * Math.PI * R * Math.cos((p2.lat * Math.PI) / 180)) / 180;
    const y2 = (p2.lat * Math.PI * R) / 180;
    area += x1 * y2 - x2 * y1;
  }

  const areaInSqMeters = Math.abs(area / 2);
  const areaInAcres = areaInSqMeters / 4046.86;
  return Math.max(0.5, +(areaInAcres.toFixed(2)));
}

export const FarmLocationPickerModal: React.FC<FarmLocationPickerModalProps> = ({
  visible,
  initialIsLocked = false,
  cropId,
  cropName,
  farmerName,
  farmerPhone,
  plotName,
  location,
  existingGpsData,
  onClose,
  onSaveLocation,
}) => {
  const { user } = useAuth();
  const { cropGpsDataMap, requestCropGpsUnlock, updateCropLocation, saveCropGpsData, lockCropGps, addCropActivity } = useCrops();
  const router = useRouter();

  const effectiveFarmerName = (farmerName || user?.farmName || user?.name || 'Registered Farmer').trim();
  const effectivePlotName = (plotName || 'Field Plot').trim();
  const effectiveInitialGps = (cropId ? cropGpsDataMap[cropId] : undefined) || existingGpsData;

  // Wizard active step for Setup: 1 = Boundary, 2 = 5 Photos, 3 = 1-Min Video
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);

  // Monitoring tab when locked: 'HEALTH' | 'MEDIA' | 'SETTINGS'
  const [monitoringTab, setMonitoringTab] = useState<'HEALTH' | 'MEDIA' | 'SETTINGS'>('HEALTH');

  // GPS Coordinates & 4 Corners
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    effectiveInitialGps ? { lat: effectiveInitialGps.centerLat, lng: effectiveInitialGps.centerLng } : { lat: 30.9085, lng: 75.8610 }
  );
  const [corners, setCorners] = useState<CornerCoord[]>(
    effectiveInitialGps?.corners && effectiveInitialGps.corners.length === 4
      ? effectiveInitialGps.corners
      : [
          { label: 'C1 (NW)', lat: 30.9097, lng: 75.8595 },
          { label: 'C2 (NE)', lat: 30.9099, lng: 75.8626 },
          { label: 'C3 (SE)', lat: 30.9074, lng: 75.8623 },
          { label: 'C4 (SW)', lat: 30.9072, lng: 75.8596 },
        ]
  );
  const [cornersMarked, setCornersMarked] = useState<number>(effectiveInitialGps ? 4 : 4);
  const [calculatedAcres, setCalculatedAcres] = useState<number>(effectiveInitialGps?.areaAcres || 3.8);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [captureMode, setCaptureMode] = useState<'WALK' | 'REMOTE'>('REMOTE');

  // Photos (Up to 6) & Live Video
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoSources, setPhotoSources] = useState<Record<string, MediaCaptureSource>>({});
  const [previewingPhotoIndex, setPreviewingPhotoIndex] = useState<number | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoRecordedAt, setVideoRecordedAt] = useState<string | Date | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioRecordedAt, setAudioRecordedAt] = useState<string | Date | null>(null);
  const [remarksText, setRemarksText] = useState<string>('');
  const [showWebPhotoCamera, setShowWebPhotoCamera] = useState(false);
  const [showWebVideoRecorder, setShowWebVideoRecorder] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaDaysRemaining, setMediaDaysRemaining] = useState<number>(0);
  const [hasExpiredMediaArchive, setHasExpiredMediaArchive] = useState<boolean>(false);

  const recordsByUrlRef = useRef<Record<string, string>>({});
  const initialUrlsRef = useRef<string[]>([]);

  // Lock & Unlock State
  const [isLocked, setIsLocked] = useState<boolean>(initialIsLocked);
  const [unlockedSubTab, setUnlockedSubTab] = useState<'SETUP' | 'HEALTH'>('SETUP');
  const [showReasonBox, setShowReasonBox] = useState<boolean>(false);
  const [unlockReasonInput, setUnlockReasonInput] = useState<string>('');
  const [isUnlockRequested, setIsUnlockRequested] = useState<boolean>(false);

  useEffect(() => {
    setIsLocked(initialIsLocked);
  }, [initialIsLocked]);

  useEffect(() => {
    if (!visible) {
      setMediaError(null);
      setPreviewingPhotoIndex(null);
      setShowWebPhotoCamera(false);
      setShowWebVideoRecorder(false);
      return;
    }

    let cancelled = false;
    setMediaError(null);

    const snapshot = (cropId ? cropGpsDataMap[cropId] : undefined) || existingGpsData;
    const localActive = isLocalGpsMediaActive(snapshot);
    setSelectedCoords(
      snapshot ? { lat: snapshot.centerLat, lng: snapshot.centerLng } : { lat: 30.9085, lng: 75.8610 },
    );
    setCorners(
      snapshot?.corners && snapshot.corners.length === 4
        ? snapshot.corners
        : [
            { label: 'C1 (NW)', lat: 30.9097, lng: 75.8595 },
            { label: 'C2 (NE)', lat: 30.9099, lng: 75.8626 },
            { label: 'C3 (SE)', lat: 30.9074, lng: 75.8623 },
            { label: 'C4 (SW)', lat: 30.9072, lng: 75.8596 },
          ],
    );
    setCalculatedAcres(snapshot?.areaAcres || 3.8);

    const sanitizedLocal = localActive
      ? mergeCropMediaLists(
          [],
          snapshot?.fieldPhotos,
          null,
          snapshot?.fieldVideo || null,
          null,
          snapshot?.fieldAudio || null,
        )
      : { photos: [], video: null, audio: null };
    const initialSourceMap: Record<string, MediaCaptureSource> = {};
    sanitizedLocal.photos.forEach((p) => {
      initialSourceMap[p] = detectMediaCaptureSource(p);
    });
    setPhotos(sanitizedLocal.photos);
    setPhotoSources(initialSourceMap);
    setVideoUri(sanitizedLocal.video);
    setVideoRecordedAt(localActive ? snapshot?.updatedAt || null : null);
    setAudioUri(sanitizedLocal.audio);
    setAudioRecordedAt(localActive ? snapshot?.updatedAt || null : null);
    setRemarksText(
      localActive ? String(snapshot?.farmerRemarks || '').slice(0, MAX_REMARK_CHARS) : '',
    );

    const localExpiry =
      localActive && snapshot?.mediaDisplayExpiresAt
        ? snapshot.mediaDisplayExpiresAt
        : localActive && snapshot?.updatedAt
          ? new Date(new Date(snapshot.updatedAt).getTime() + MEDIA_DISPLAY_MS).toISOString()
          : null;
    const localHadPriorMedia = Boolean(
      snapshot &&
        ((snapshot.fieldPhotos && snapshot.fieldPhotos.length > 0) ||
          snapshot.fieldVideo ||
          snapshot.fieldAudio ||
          snapshot.farmerRemarks),
    );
    setMediaDaysRemaining(localExpiry ? computeDaysRemaining(localExpiry) : 0);
    setHasExpiredMediaArchive(!localActive && localHadPriorMedia);

    initialUrlsRef.current = [
      ...sanitizedLocal.photos,
      ...(sanitizedLocal.video ? [sanitizedLocal.video] : []),
      ...(sanitizedLocal.audio ? [sanitizedLocal.audio] : []),
    ];
    recordsByUrlRef.current = {};

    if (cropId) {
      setIsLoadingMedia(true);
      Promise.all([
        fetchCropMediaFromStore(cropId),
        fetchCropRemarkFromStore(cropId),
      ])
        .then(([storeMedia, savedRemark]) => {
          if (cancelled) return;
          recordsByUrlRef.current = storeMedia.recordsByUrl;
          const merged = mergeCropMediaLists(
            storeMedia.photos,
            localActive ? snapshot?.fieldPhotos : undefined,
            storeMedia.video,
            localActive ? snapshot?.fieldVideo || null : null,
            storeMedia.audio,
            localActive ? snapshot?.fieldAudio || null : null,
          );
          const mergedSourceMap: Record<string, MediaCaptureSource> = {};
          merged.photos.forEach((p) => {
            mergedSourceMap[p] = storeMedia.sourcesByUrl[p] || detectMediaCaptureSource(p);
          });
          setPhotos(merged.photos);
          setPhotoSources(mergedSourceMap);
          setVideoUri(merged.video);
          setAudioUri(merged.audio);
          if (merged.video && storeMedia.datesByUrl[merged.video]) {
            setVideoRecordedAt(storeMedia.datesByUrl[merged.video]);
          }
          if (merged.audio && storeMedia.datesByUrl[merged.audio]) {
            setAudioRecordedAt(storeMedia.datesByUrl[merged.audio]);
          }
          setRemarksText(
            (savedRemark.remarksText || (localActive ? snapshot?.farmerRemarks || '' : '')).slice(
              0,
              MAX_REMARK_CHARS,
            ),
          );
          const resolvedExpiry =
            storeMedia.activeWindowExpiresAt || savedRemark.expiresAt || localExpiry;
          setMediaDaysRemaining(resolvedExpiry ? computeDaysRemaining(resolvedExpiry) : 0);
          setHasExpiredMediaArchive(
            storeMedia.hasExpiredArchive ||
              savedRemark.history.some((h) => !h.isActiveDisplay) ||
              (!localActive && localHadPriorMedia),
          );
          initialUrlsRef.current = [
            ...merged.photos,
            ...(merged.video ? [merged.video] : []),
            ...(merged.audio ? [merged.audio] : []),
          ];
        })
        .catch(() => {
          // Keep sanitized local cache if server fetch is temporarily unreachable
        })
        .finally(() => {
          if (!cancelled) setIsLoadingMedia(false);
        });
    }

    return () => {
      cancelled = true;
    };
    // Hydrate only when modal opens or active cropId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cropId]);

  // Handle Mark Corner Step (Walk Mode)
  const handleMarkCornerStep = () => {
    if (cornersMarked >= 4) return;
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
      const nextStep = cornersMarked + 1;
      setCornersMarked(nextStep);
      if (nextStep === 4) {
        const acres = calculatePolygonAreaInAcres(corners);
        setCalculatedAcres(acres);
        Alert.alert('All 4 Corners Marked! 🎯', `4 field corners recorded. Field Area: ${acres} Acres.`);
      }
    }, 600);
  };

  // Add Photo via Live Camera ONLY (tagged LIVE; never silently falls back to gallery)
  const handleTakePhotoLive = async () => {
    if (photos.length >= 6) {
      Alert.alert('Maximum Reached', 'You can save a maximum of 6 field photos.');
      return;
    }
    setMediaError(null);
    if (Platform.OS === 'web') {
      setShowWebPhotoCamera(true);
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is required to capture live field photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const stamped = await stampWatermarkOnImage(result.assets[0].uri, {
          sourceType: 'LIVE',
          farmerName: effectiveFarmerName,
          plotName: effectivePlotName,
          cropName: cropName || 'Field Crop',
        });
        setPhotos((prev) => [...prev, stamped].slice(0, 6));
        setPhotoSources((prev) => ({ ...prev, [stamped]: 'LIVE' }));
      }
    } catch {
      setMediaError('Camera unavailable. Use "Upload from Gallery" for gallery photos.');
    }
  };

  // Add Photo via Library (tagged UPLOADED)
  const handlePickPhotoLibrary = async () => {
    if (photos.length >= 6) {
      Alert.alert('Maximum Reached', 'You can save a maximum of 6 field photos.');
      return;
    }
    setMediaError(null);
    const stampGalleryUri = (uri: string) =>
      stampWatermarkOnImage(uri, {
        sourceType: 'UPLOADED',
        farmerName: effectiveFarmerName,
        plotName: effectivePlotName,
        cropName: cropName || 'Field Crop',
      });

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 6 - photos.length,
        quality: 0.85,
      });
      if (!result.canceled && result.assets) {
        const stampedList = await Promise.all(
          result.assets.slice(0, 6 - photos.length).map((a) => stampGalleryUri(a.uri)),
        );
        setPhotos((prev) => [...prev, ...stampedList].slice(0, 6));
        setPhotoSources((prev) => {
          const next = { ...prev };
          stampedList.forEach((u) => {
            next[u] = 'UPLOADED';
          });
          return next;
        });
      }
    } catch {
      if (Platform.OS === 'web') {
        const picked = await pickWebMediaFiles('image/*', true);
        if (picked.length > 0) {
          const stampedList = await Promise.all(
            picked.slice(0, 6 - photos.length).map((u) => stampGalleryUri(u)),
          );
          setPhotos((prev) => [...prev, ...stampedList].slice(0, 6));
          setPhotoSources((prev) => {
            const next = { ...prev };
            stampedList.forEach((u) => {
              next[u] = 'UPLOADED';
            });
            return next;
          });
          return;
        }
      }
      setMediaError('Could not open photo library. Please try selecting images again.');
    }
  };

  // Remove Photo
  const handleRemovePhoto = (index: number) => {
    const removedUri = photos[index];
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (removedUri) {
      setPhotoSources((prev) => {
        const next = { ...prev };
        delete next[removedUri];
        return next;
      });
    }
    if (previewingPhotoIndex === index) setPreviewingPhotoIndex(null);
  };

  // Video Shoot LIVE ONLY (Camera only — no gallery upload)
  const handleStartShootVideo = async () => {
    setMediaError(null);
    if (Platform.OS === 'web') {
      setShowWebVideoRecorder(true);
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is required to record live field video.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 60,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setVideoRecordedAt(new Date().toISOString());
      }
    } catch {
      setMediaError('Live video camera unavailable on this device.');
    }
  };

  // Final Submit & Lock Field (Allows saving 1-6 photos + optional live video)
  const handleFinalSubmitAndLock = async () => {
    if (cornersMarked < 4) {
      Alert.alert('Set Location First 📍', 'Please mark all 4 boundary corners of the field.');
      setSetupStep(1);
      return;
    }

    if (photos.length === 0 && !videoUri) {
      Alert.alert(
        'Media Required',
        'Please capture or upload at least 1 crop photo or record a live field video before submitting.',
      );
      setSetupStep(2);
      return;
    }

    setMediaError(null);
    setIsSavingMedia(true);
    try {
      const uploadedPhotos: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const srcType = photoSources[p] || detectMediaCaptureSource(p);
        const savedUrl = await uploadSingleCropMedia(p, {
          cropId: cropId || undefined,
          mediaType: 'IMAGE',
          sourceType: srcType,
          filenamePrefix: `crop_${cropId || 'field'}_${srcType.toLowerCase()}_p${i + 1}`,
        });
        uploadedPhotos.push(savedUrl);
      }

      let finalVideoUrl: string | undefined;
      if (videoUri) {
        finalVideoUrl = await uploadSingleCropMedia(videoUri, {
          cropId: cropId || undefined,
          mediaType: 'VIDEO',
          sourceType: 'LIVE',
          filenamePrefix: `crop_${cropId || 'field'}_live_vid`,
        });
      }

      let finalAudioUrl: string | undefined;
      if (audioUri) {
        finalAudioUrl = await uploadSingleCropMedia(audioUri, {
          cropId: cropId || undefined,
          mediaType: 'AUDIO',
          sourceType: 'LIVE',
          filenamePrefix: `crop_${cropId || 'field'}_voice_note`,
        });
      }

      const trimmedRemarks = remarksText.trim().slice(0, MAX_REMARK_CHARS);
      if (cropId && trimmedRemarks) {
        await saveCropRemarkToStore(cropId, trimmedRemarks);
      }

      const currentUrls = [
        ...uploadedPhotos,
        ...(finalVideoUrl ? [finalVideoUrl] : []),
        ...(finalAudioUrl ? [finalAudioUrl] : []),
      ];
      await deleteRemovedMediaStoreRecords(
        initialUrlsRef.current,
        currentUrls,
        recordsByUrlRef.current,
      );

      const nowIso = new Date().toISOString();
      const expiresIso = new Date(Date.now() + MEDIA_DISPLAY_MS).toISOString();
      const hasAttachedMediaOrRemarks =
        uploadedPhotos.length > 0 ||
        Boolean(finalVideoUrl) ||
        Boolean(finalAudioUrl) ||
        trimmedRemarks.length > 0;

      const centerLat = selectedCoords?.lat || 30.9085;
      const centerLng = selectedCoords?.lng || 75.8610;
      const locText = `📍 ${centerLat.toFixed(4)}° N, ${centerLng.toFixed(4)}° E (${calculatedAcres} Acres · 4 Corners)`;

      const gpsDataToSave: CropGpsData = {
        centerLat,
        centerLng,
        corners,
        areaAcres: calculatedAcres,
        locationText: locText,
        isLocked: true,
        fieldPhotos: uploadedPhotos,
        fieldVideo: finalVideoUrl,
        fieldAudio: finalAudioUrl,
        farmerRemarks: trimmedRemarks || undefined,
        mediaCycleSavedAt: hasAttachedMediaOrRemarks ? nowIso : undefined,
        mediaDisplayExpiresAt: hasAttachedMediaOrRemarks ? expiresIso : undefined,
        saveMediaToCropRecord: hasAttachedMediaOrRemarks ? true : undefined,
        updatedAt: nowIso,
      };

      if (cropId) {
        saveCropGpsData(cropId, gpsDataToSave);
        updateCropLocation(cropId, locText);
        lockCropGps(cropId);

        if (hasAttachedMediaOrRemarks) {
          const summaryParts: string[] = [];
          if (uploadedPhotos.length > 0) summaryParts.push(`${uploadedPhotos.length} Photo(s)`);
          if (finalVideoUrl) summaryParts.push('1 Live Video');
          if (finalAudioUrl) summaryParts.push('1 Voice Audio');
          if (trimmedRemarks) summaryParts.push('Written Remarks');

          try {
            await addCropActivity(cropId, {
              cropId,
              type: 'NOTE',
              title: 'Field Verification & Crop Media Saved',
              date: formatMediaTimestamp(nowIso).dateStr,
              quantity: summaryParts.join(', '),
              notes: trimmedRemarks
                ? `Remarks: "${trimmedRemarks}". Shown on display for ${MEDIA_DISPLAY_DAYS} days and stored permanently in Crop Activities.`
                : `Saved ${summaryParts.join(', ')} to Crop Record (${MEDIA_DISPLAY_DAYS}-day display + permanent archive in Crop Activities).`,
            });
          } catch {
            // Do not fail plot lock if activity log note temporarily fails
          }
        }
      }

      onSaveLocation({
        latitude: centerLat,
        longitude: centerLng,
        areaAcres: calculatedAcres,
        addressText: locText,
        isLocked: true,
        corners,
        gpsData: gpsDataToSave,
      });

      setIsLocked(true);
      Alert.alert(
        'Field Verified & Locked 🔒',
        `Satellite telemetry is now active for ${cropName || 'Field Plot'}.\n\n• Center: ${centerLat.toFixed(4)}° N, ${centerLng.toFixed(4)}° E\n• Area: ${calculatedAcres} Acres\n• Photos: ${uploadedPhotos.length} Verified\n• Video: ${finalVideoUrl ? 'Video Attached' : 'None'}\n\nField is now locked for satellite monitoring.`,
      );
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not upload field photos or video to server. Please try again.';
      setMediaError(msg);
      Alert.alert('Upload Failed', msg);
    } finally {
      setIsSavingMedia(false);
    }
  };

  // Direct Unlock Request to Operator
  const handleDirectUnlockRequest = () => {
    if (!unlockReasonInput.trim() || unlockReasonInput.trim().length < 5) {
      Alert.alert('Reason Required', 'Please enter a clear reason (minimum 5 characters) for unlocking this field so the Operator can review.');
      return;
    }
    setIsUnlockRequested(true);
    requestCropGpsUnlock(
      cropId || 'c1',
      unlockReasonInput.trim(),
      farmerName,
      farmerPhone,
      cropName,
      plotName,
      location
    );
    setShowReasonBox(false);
    setUnlockReasonInput('');
    Alert.alert(
      'Unlock Request Sent 📩',
      `Your request has been forwarded to the Operator.\n\nReason: "${unlockReasonInput.trim()}"\n\nYou will be notified once reviewed.`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.headerIconCircle, { backgroundColor: isLocked ? '#dcfce7' : '#eff6ff' }]}>
                <Ionicons name={isLocked ? 'shield-checkmark' : 'planet'} size={20} color={isLocked ? '#15803d' : '#2563eb'} />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isLocked ? 'Satellite Field Monitoring' : 'Satellite Setup & Verification'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  🌾 {cropName || 'Field Crop'} · {plotName || 'Plot #1'} · {calculatedAcres} Acres
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* SUB-TAB TOGGLE FOR UNLOCKED STATE */}
              {!isLocked && (
                <View style={{ flexDirection: 'row', gap: 3, backgroundColor: '#f1f5f9', padding: 3, borderRadius: 8 }}>
                  <TouchableOpacity
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor: unlockedSubTab === 'SETUP' ? '#ffffff' : 'transparent',
                    }}
                    onPress={() => setUnlockedSubTab('SETUP')}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: unlockedSubTab === 'SETUP' ? '#2563eb' : '#64748b' }}>
                      GPS Boundary
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor: unlockedSubTab === 'HEALTH' ? '#ffffff' : 'transparent',
                    }}
                    onPress={() => setUnlockedSubTab('HEALTH')}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: unlockedSubTab === 'HEALTH' ? '#15803d' : '#64748b' }}>
                      Live Health (NDVI)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* MAIN CONTENT AREA */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* ========================================================= */}
            {/* CASE 1: UNLOCKED -> 3-STEP SETUP WIZARD (NO CLUTTER)      */}
            {/* ========================================================= */}
            {!isLocked && unlockedSubTab === 'SETUP' ? (
              <View style={{ gap: 14 }}>
                {/* 3-STEP PROGRESS NAVIGATION */}
                <View style={styles.stepNavRow}>
                  <TouchableOpacity
                    style={[styles.stepNavItem, setupStep === 1 && styles.stepNavItemActive]}
                    onPress={() => setSetupStep(1)}
                  >
                    <Ionicons name="location" size={14} color={setupStep === 1 ? '#2563eb' : '#64748b'} />
                    <Text style={[styles.stepNavText, setupStep === 1 && styles.stepNavTextActive]}>
                      1. Boundary
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.stepNavItem, setupStep === 2 && styles.stepNavItemActive]}
                    onPress={() => setSetupStep(2)}
                  >
                    <Ionicons name="camera" size={14} color={setupStep === 2 ? '#2563eb' : '#64748b'} />
                    <Text style={[styles.stepNavText, setupStep === 2 && styles.stepNavTextActive]}>
                      2. Photos ({photos.length}/6)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.stepNavItem, setupStep === 3 && styles.stepNavItemActive]}
                    onPress={() => setSetupStep(3)}
                  >
                    <Ionicons name="videocam" size={14} color={setupStep === 3 ? '#2563eb' : '#64748b'} />
                    <Text style={[styles.stepNavText, setupStep === 3 && styles.stepNavTextActive]}>
                      3. Video (Optional)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* STEP 1: BOUNDARY & LOCATION */}
                {setupStep === 1 && (
                  <View style={styles.stepContainer}>
                    <View style={styles.stepHeaderRow}>
                      <Text style={styles.stepHeading}>Step 1: Set Field Boundary & 4 Corners</Text>
                      <Text style={styles.stepSub}>Mark corners via walking GPS or pin on satellite map.</Text>
                    </View>

                    {/* MODE SELECTOR */}
                    <View style={styles.modeToggleRow}>
                      <TouchableOpacity
                        style={[styles.modeToggleBtn, captureMode === 'WALK' && styles.modeToggleBtnActive]}
                        onPress={() => setCaptureMode('WALK')}
                      >
                        <Ionicons name="walk" size={15} color={captureMode === 'WALK' ? '#15803d' : '#64748b'} />
                        <Text style={[styles.modeToggleText, captureMode === 'WALK' && styles.modeToggleTextActive]}>
                          Walk Field (GPS)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modeToggleBtn, captureMode === 'REMOTE' && styles.modeToggleBtnActive]}
                        onPress={() => setCaptureMode('REMOTE')}
                      >
                        <Ionicons name="map" size={15} color={captureMode === 'REMOTE' ? '#1d4ed8' : '#64748b'} />
                        <Text style={[styles.modeToggleText, captureMode === 'REMOTE' && styles.modeToggleTextActive]}>
                          Satellite World Map
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* LOCATION SUMMARY CARD */}
                    <View style={styles.coordsSummaryBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.coordsLabel}>Center Coordinates & Area:</Text>
                        <View style={styles.acresBadge}>
                          <Text style={styles.acresBadgeText}>{calculatedAcres} Acres</Text>
                        </View>
                      </View>
                      <Text style={styles.coordsValue}>
                        📍 {selectedCoords ? `${selectedCoords.lat.toFixed(4)}° N, ${selectedCoords.lng.toFixed(4)}° E` : 'Not Set'}
                      </Text>
                      <Text style={styles.coordsStatus}>
                        {cornersMarked === 4 ? '🟢 4 Boundary Corners Set (C1 to C4)' : `⚠️ Marked ${cornersMarked}/4 Corners`}
                      </Text>
                    </View>

                    {/* ACTION FOR STEP 1 */}
                    {captureMode === 'WALK' ? (
                      <TouchableOpacity
                        style={styles.gpsWalkBtn}
                        activeOpacity={0.85}
                        disabled={isLocating || cornersMarked >= 4}
                        onPress={handleMarkCornerStep}
                      >
                        {isLocating ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <Ionicons name={cornersMarked === 4 ? 'checkmark-circle' : 'navigate'} size={18} color="#ffffff" />
                            <Text style={styles.gpsWalkBtnText}>
                              {cornersMarked === 0
                                ? 'Tap to Mark Corner 1 (C1 - NW)'
                                : cornersMarked === 1
                                ? 'Tap to Mark Corner 2 (C2 - NE)'
                                : cornersMarked === 2
                                ? 'Tap to Mark Corner 3 (C3 - SE)'
                                : cornersMarked === 3
                                ? 'Tap to Mark Corner 4 (C4 - SW)'
                                : 'All 4 Corners Successfully Marked ✓'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.remoteAutoBox}>
                        <Ionicons name="checkmark-done-circle" size={20} color="#15803d" />
                        <Text style={styles.remoteAutoText}>
                          Boundary calibrated with Sentinel-2 Satellite telemetry for {calculatedAcres} Acres.
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.nextStepBtn}
                      activeOpacity={0.85}
                      onPress={() => setSetupStep(2)}
                    >
                      <Text style={styles.nextStepBtnText}>Continue to Field Photos (Step 2/3)</Text>
                      <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* STEP 2: 5 CROP PHOTOS (NEW CLEAN DIALOG / SECTION) */}
                {setupStep === 2 && (
                  <View style={styles.stepContainer}>
                    <View style={styles.stepHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.stepHeading}>Step 2: Crop Photos (Up to 6)</Text>
                        <Text style={styles.photoCountBadge}>
                          {photos.length} / 6 Saved
                        </Text>
                      </View>
                      <Text style={styles.stepSub}>
                        Live camera photos carry LIVE; gallery photos carry UPLOADED. All watermarks show the FarmsKing favicon, date, time, farmer name, and plot name.
                      </Text>
                    </View>

                    {/* CAPTURE BUTTONS */}
                    {mediaError ? (
                      <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 10 }}>
                        <Text style={{ color: '#b91c1c', fontSize: 12, fontWeight: '600' }}>{mediaError}</Text>
                      </View>
                    ) : null}

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={[styles.mediaActionBtn, photos.length >= 6 && { opacity: 0.6 }]}
                        activeOpacity={0.85}
                        disabled={photos.length >= 6}
                        onPress={handleTakePhotoLive}
                      >
                        <Ionicons name="camera" size={18} color="#ffffff" />
                        <Text style={styles.mediaActionBtnText}>Take Live Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.mediaActionBtnOutline, photos.length >= 6 && { opacity: 0.6 }]}
                        activeOpacity={0.85}
                        disabled={photos.length >= 6}
                        onPress={handlePickPhotoLibrary}
                      >
                        <Ionicons name="images" size={18} color="#2563eb" />
                        <Text style={styles.mediaActionBtnOutlineText}>Upload from Gallery</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 6-PHOTO GRID: SAVED PHOTOS FIRST, REMAINING SHOW "NO PHOTO" */}
                    <View style={styles.photoGrid}>
                      {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                        const photoUri = photos[slotIdx];
                        if (photoUri) {
                          const resolvedThumb = resolveCropMediaDisplayUri(photoUri) || photoUri;
                          return (
                            <View key={slotIdx} style={styles.photoThumbCard}>
                              <TouchableOpacity
                                style={styles.photoImageWrap}
                                activeOpacity={0.9}
                                onPress={() => setPreviewingPhotoIndex(slotIdx)}
                              >
                                <Image source={{ uri: resolvedThumb }} style={styles.photoThumbImg} resizeMode="contain" />
                              </TouchableOpacity>
                              <View style={styles.photoActionFooter}>
                                <Text style={styles.photoFooterCaption}>Photo #{slotIdx + 1}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                  <TouchableOpacity
                                    style={styles.photoInspectBadge}
                                    onPress={() => setPreviewingPhotoIndex(slotIdx)}
                                  >
                                    <Ionicons name="eye" size={13} color="#ffffff" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.photoDeleteBadge}
                                    onPress={() => handleRemovePhoto(slotIdx)}
                                  >
                                    <Ionicons name="trash" size={12} color="#ffffff" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          );
                        }
                        return (
                          <View key={slotIdx} style={styles.photoEmptySlot}>
                            <Ionicons name="image-outline" size={22} color="#94a3b8" />
                            <Text style={styles.photoEmptySlotText}>No Photo</Text>
                          </View>
                        );
                      })}
                    </View>

                    {photos.length > 0 ? (
                      <View style={styles.checkNoticeBox}>
                        <Ionicons name="information-circle-outline" size={16} color="#0369a1" />
                        <Text style={styles.checkNoticeText}>
                          Tap the eye icon on any photo to inspect clarity before final submit.
                        </Text>
                      </View>
                    ) : null}

                    {/* NAVIGATION BUTTONS */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                      <TouchableOpacity
                        style={styles.backStepBtn}
                        onPress={() => setSetupStep(1)}
                      >
                        <Ionicons name="arrow-back" size={16} color="#475569" />
                        <Text style={styles.backStepBtnText}>Back</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.nextStepBtn, { flex: 2 }]}
                        activeOpacity={0.85}
                        onPress={() => setSetupStep(3)}
                      >
                        <Text style={styles.nextStepBtnText}>Continue to 1-Min Video (Step 3/3)</Text>
                        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* STEP 3: 1-MINUTE VIDEO SHOOT & FINAL SUBMIT */}
                {setupStep === 3 && (
                  <View style={styles.stepContainer}>
                    <View style={styles.stepHeaderRow}>
                      <Text style={styles.stepHeading}>Step 3: 1-Minute Crop Field Video</Text>
                      <Text style={styles.stepSub}>
                        Shoot a live 360° walk-around video of your crop (up to 60 seconds).
                      </Text>
                    </View>

                    {/* VIDEO SHOOT ACTION CARD (LIVE CAMERA ONLY) */}
                    <View style={styles.videoCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={[styles.videoIconCircle, videoUri ? { backgroundColor: '#dcfce7' } : {}]}>
                            <Ionicons name={videoUri ? 'checkmark-circle' : 'videocam'} size={22} color={videoUri ? '#15803d' : '#dc2626'} />
                          </View>
                          <View>
                            <Text style={styles.videoTitle}>
                              {videoUri ? 'Live Field Video Captured' : 'Record Live Field Video (Camera Only)'}
                            </Text>
                            <Text style={styles.videoSub}>
                              {videoUri ? 'Play below to check video before locking field' : 'Max duration: 60 Seconds · Live recording only'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* LIVE RECORD BUTTON ONLY */}
                      <View style={{ marginTop: 8 }}>
                        <TouchableOpacity
                          style={styles.videoActionBtn}
                          activeOpacity={0.85}
                          onPress={handleStartShootVideo}
                        >
                          <Ionicons name="radio-button-on" size={18} color="#ffffff" />
                          <Text style={styles.videoActionBtnText}>
                            {videoUri ? 'Re-record Live Video' : 'Record Live Video'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {videoUri ? (
                        <View style={{ marginTop: 10 }}>
                          <CropVideoPlayer
                            videoUri={videoUri}
                            cropName={cropName || 'Field Crop'}
                            fieldName={effectivePlotName}
                            farmerName={effectiveFarmerName}
                            recordedAt={videoRecordedAt}
                            height={210}
                            onRemove={() => setVideoUri(null)}
                          />
                        </View>
                      ) : (
                        <View style={{ marginTop: 10, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#64748b' }}>No Video Recorded</Text>
                        </View>
                      )}
                    </View>

                    {/* VOICE AUDIO OR WRITTEN REMARKS SECTION */}
                    <CropRemarksSection
                      remarksText={remarksText}
                      onChangeRemarksText={setRemarksText}
                      audioUri={audioUri}
                      onChangeAudioUri={(uri) => {
                        setAudioUri(uri);
                        if (uri) setAudioRecordedAt(new Date().toISOString());
                      }}
                      audioRecordedAt={audioRecordedAt}
                      farmerName={effectiveFarmerName}
                      fieldName={effectivePlotName}
                      cropName={cropName || 'Field Crop'}
                    />

                    {mediaError ? (
                      <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                        <Text style={{ color: '#b91c1c', fontSize: 12, fontWeight: '600' }}>{mediaError}</Text>
                      </View>
                    ) : null}

                    {/* FINAL SUBMIT & LOCK CARD */}
                    <View style={styles.finalSubmitSummaryCard}>
                      <Text style={styles.finalSubmitTitle}>Ready to Verify & Lock Field</Text>
                      <Text style={styles.finalSubmitSub}>
                        Once submitted, field coordinates will be locked for satellite accuracy.
                      </Text>

                      <View style={styles.summaryList}>
                        <View style={styles.summaryItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                          <Text style={styles.summaryItemText}>
                            GPS Boundary: {calculatedAcres} Acres · 4 Corners
                          </Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Ionicons name={photos.length >= 1 ? 'checkmark-circle' : 'alert-circle'} size={16} color={photos.length >= 1 ? '#15803d' : '#d97706'} />
                          <Text style={styles.summaryItemText}>
                            Crop Photos: {photos.length} of 6 Saved
                          </Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Ionicons name={videoUri ? 'checkmark-circle' : 'checkmark-circle-outline'} size={16} color={videoUri ? '#15803d' : '#64748b'} />
                          <Text style={styles.summaryItemText}>
                            Field Video: {videoUri ? 'Live Video Attached ✓' : 'Optional (Not Recorded)'}
                          </Text>
                        </View>
                      </View>

                      {/* BIG LOCK & SUBMIT BUTTON */}
                      <TouchableOpacity
                        style={[
                          styles.bigSubmitLockBtn,
                          ((photos.length === 0 && !videoUri) || isSavingMedia) && { backgroundColor: '#94a3b8', opacity: 0.7 },
                        ]}
                        activeOpacity={(photos.length > 0 || Boolean(videoUri)) && !isSavingMedia ? 0.85 : 1}
                        disabled={(photos.length === 0 && !videoUri) || isSavingMedia}
                        onPress={handleFinalSubmitAndLock}
                      >
                        {isSavingMedia ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Ionicons name={photos.length > 0 || Boolean(videoUri) ? 'lock-closed' : 'alert-circle'} size={18} color="#ffffff" />
                        )}
                        <Text style={styles.bigSubmitLockBtnText}>
                          {isSavingMedia
                            ? 'Uploading & Storing Media...'
                            : 'Submit & Lock Satellite Field'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* BACK BUTTON */}
                    <TouchableOpacity
                      style={styles.backStepBtn}
                      onPress={() => setSetupStep(2)}
                    >
                      <Ionicons name="arrow-back" size={16} color="#475569" />
                      <Text style={styles.backStepBtnText}>Back to Photos</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* ========================================================= */
              /* CASE 2: LOCKED -> CLEAN SATELLITE MONITORING (NIGRANI)    */
              /* ========================================================= */
              <View style={{ gap: 14 }}>
                {/* STATUS BANNER */}
                <View style={[styles.lockedMonitoringBanner, { backgroundColor: isLocked ? '#f0fdf4' : '#eff6ff', borderColor: isLocked ? '#bbf7d0' : '#bfdbfe' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name={isLocked ? "shield-checkmark" : "lock-open"} size={24} color={isLocked ? "#15803d" : "#2563eb"} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lockedMonitoringTitle, { color: isLocked ? '#15803d' : '#1d4ed8' }]}>
                        {isLocked ? 'Satellite Telemetry Active (Locked)' : 'Satellite Field GPS Unlocked · Fully Editable'}
                      </Text>
                      <Text style={styles.lockedMonitoringSub}>
                        {isLocked
                          ? 'Field coordinates and ground-truth media are locked for orbital satellite calibration.'
                          : 'Coordinates and boundary are unlocked. You can freely edit GPS corners or view live NDVI.'}
                      </Text>
                    </View>
                  </View>

                  {isUnlockRequested ? (
                    <View style={styles.pendingBadgeBox}>
                      <Ionicons name="time" size={14} color="#b45309" />
                      <Text style={styles.pendingBadgeText}>Unlock request pending Operator review</Text>
                    </View>
                  ) : null}
                </View>

                {/* MONITORING NAVIGATION TABS */}
                <View style={styles.stepNavRow}>
                  <TouchableOpacity
                    style={[styles.stepNavItem, monitoringTab === 'HEALTH' && styles.stepNavItemActive]}
                    onPress={() => setMonitoringTab('HEALTH')}
                  >
                    <Ionicons name="planet" size={14} color={monitoringTab === 'HEALTH' ? '#2563eb' : '#64748b'} />
                    <Text style={[styles.stepNavText, monitoringTab === 'HEALTH' && styles.stepNavTextActive]}>
                      Live Health (NDVI)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.stepNavItem, monitoringTab === 'MEDIA' && styles.stepNavItemActive]}
                    onPress={() => setMonitoringTab('MEDIA')}
                  >
                    <Ionicons name="images" size={14} color={monitoringTab === 'MEDIA' ? '#2563eb' : '#64748b'} />
                    <Text style={[styles.stepNavText, monitoringTab === 'MEDIA' && styles.stepNavTextActive]}>
                      Verified Media ({photos.length}P · {videoUri ? '1V' : '0V'})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.stepNavItem, monitoringTab === 'SETTINGS' && styles.stepNavItemActive]}
                    onPress={() => setMonitoringTab('SETTINGS')}
                  >
                    <Ionicons name="lock-open" size={14} color={monitoringTab === 'SETTINGS' ? '#2563eb' : '#64748b'} />
                    <Text style={[styles.stepNavText, monitoringTab === 'SETTINGS' && styles.stepNavTextActive]}>
                      Unlock Request
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* TAB 1: SATELLITE HEALTH & DIAGNOSTICS */}
                {monitoringTab === 'HEALTH' && (
                  <View style={{ gap: 12 }}>
                    {/* OPTICAL SATELLITE IMAGERY */}
                    <View style={styles.satellitePhotoCard}>
                      <Image
                        source={require('@/assets/images/satellite_field_live_view.png')}
                        style={styles.satellitePhotoImg}
                        resizeMode="cover"
                      />
                      <View style={styles.satellitePhotoOverlay}>
                        <Ionicons name="planet" size={14} color="#ffffff" />
                        <Text style={styles.satellitePhotoOverlayText}>
                          Sentinel-2 Orbital Field Telemetry · {calculatedAcres} Acres
                        </Text>
                      </View>
                    </View>

                    {/* HEALTH SCORES MATRIX */}
                    <View style={styles.healthGrid}>
                      <View style={styles.healthCard}>
                        <Ionicons name="leaf" size={20} color="#15803d" />
                        <Text style={styles.healthCardValue}>0.82</Text>
                        <Text style={styles.healthCardLabel}>NDVI Health Index</Text>
                        <Text style={styles.healthCardBadgeGreen}>Vigorous Growth</Text>
                      </View>

                      <View style={styles.healthCard}>
                        <Ionicons name="water" size={20} color="#0284c7" />
                        <Text style={styles.healthCardValue}>48.3%</Text>
                        <Text style={styles.healthCardLabel}>Soil Moisture</Text>
                        <Text style={styles.healthCardBadgeBlue}>Optimal Level</Text>
                      </View>

                      <View style={styles.healthCard}>
                        <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
                        <Text style={styles.healthCardValue}>12%</Text>
                        <Text style={styles.healthCardLabel}>Disease Risk</Text>
                        <Text style={styles.healthCardBadgeGreen}>Low / Safe</Text>
                      </View>
                    </View>

                    {/* SIMPLE WEATHER & ACTION NOTE */}
                    <View style={styles.actionNoteBox}>
                      <Ionicons name="sunny-outline" size={18} color="#d97706" />
                      <Text style={styles.actionNoteText}>
                        <Text style={{ fontWeight: '800' }}>Weather & Advisory:</Text> Clear conditions expected for next 4 days. Suitable for fertilizer application or light morning irrigation.
                      </Text>
                    </View>

                    {/* OPEN FULLSCREEN SATELLITE MAP */}
                    <TouchableOpacity
                      style={styles.openInteractiveMapBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        onClose();
                        router.push({
                          pathname: '/satellite-map' as any,
                          params: {
                            cropId: cropId || 'c1',
                            cropName: cropName || 'Wheat',
                            farmerName: farmerName,
                            plotName: plotName,
                            location: location,
                            lat: String(selectedCoords?.lat || 30.9085),
                            lng: String(selectedCoords?.lng || 75.8610),
                          },
                        });
                      }}
                    >
                      <Ionicons name="planet" size={16} color="#ffffff" />
                      <Text style={styles.openInteractiveMapBtnText}>
                        Open Fullscreen Interactive Satellite Map
                      </Text>
                      <Ionicons name="chevron-forward" size={15} color="#93c5fd" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* TAB 2: VERIFIED GROUND PHOTOS & VIDEO */}
                {monitoringTab === 'MEDIA' && (
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={styles.stepHeading}>Verified Ground Truth Photos & Video</Text>
                      {mediaDaysRemaining > 0 && (photos.length > 0 || Boolean(videoUri) || Boolean(audioUri) || Boolean(remarksText)) ? (
                        <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803d' }}>
                            7-Day Display · {mediaDaysRemaining}d Left
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {isLoadingMedia ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                        <ActivityIndicator size="small" color="#15803d" />
                        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>Loading saved crop media...</Text>
                      </View>
                    ) : null}

                    {photos.length === 0 && !videoUri && !audioUri && !remarksText && !isLoadingMedia ? (
                      <View style={styles.emptyMediaBox}>
                        <Ionicons name="images-outline" size={32} color="#94a3b8" />
                        <Text style={styles.emptyMediaText}>
                          {hasExpiredMediaArchive
                            ? '7-Day Display Completed · Past Records Are Saved in Crop Activities'
                            : 'No Photo or Video Saved'}
                        </Text>
                      </View>
                    ) : null}

                    {photos.length > 0 ? (
                      <View style={styles.photoGrid}>
                        {photos.map((pUri, pIdx) => {
                          const resolvedP = resolveCropMediaDisplayUri(pUri) || pUri;
                          return (
                            <TouchableOpacity
                              key={pIdx}
                              style={styles.photoThumbCard}
                              onPress={() => setPreviewingPhotoIndex(pIdx)}
                            >
                              <View style={styles.photoImageWrap}>
                                <Image source={{ uri: resolvedP }} style={styles.photoThumbImg} resizeMode="contain" />
                              </View>
                              <View style={styles.photoActionFooter}>
                                <Text style={styles.photoFooterCaption}>Photo #{pIdx + 1}</Text>
                                <View style={styles.photoInspectBadge}>
                                  <Ionicons name="eye" size={13} color="#ffffff" />
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : !isLoadingMedia && (videoUri || audioUri || remarksText) ? (
                      <View style={styles.emptyMediaBox}>
                        <Ionicons name="image-outline" size={26} color="#94a3b8" />
                        <Text style={styles.emptyMediaText}>No Photo</Text>
                      </View>
                    ) : null}

                    {videoUri ? (
                      <CropVideoPlayer
                        videoUri={videoUri}
                        cropName={cropName || 'Field Crop'}
                        fieldName={effectivePlotName}
                        farmerName={effectiveFarmerName}
                        recordedAt={videoRecordedAt}
                        height={210}
                      />
                    ) : null}

                    {(audioUri || remarksText) ? (
                      <CropRemarksSection
                        remarksText={remarksText}
                        audioUri={audioUri}
                        audioRecordedAt={audioRecordedAt}
                        farmerName={effectiveFarmerName}
                        fieldName={effectivePlotName}
                        cropName={cropName || 'Field Crop'}
                        readOnly
                      />
                    ) : null}
                  </View>
                )}

                {/* TAB 3: OPERATOR UNLOCK REQUEST */}
                {monitoringTab === 'SETTINGS' && (
                  <View style={styles.unlockSectionCard}>
                    <Text style={styles.unlockSectionTitle}>Field Coordinates Locked</Text>
                    <Text style={styles.unlockSectionSub}>
                      Coordinates: {selectedCoords?.lat.toFixed(4)}° N, {selectedCoords?.lng.toFixed(4)}° E ({calculatedAcres} Acres).
                    </Text>

                    {isUnlockRequested ? (
                      <View style={styles.pendingMessageBox}>
                        <Ionicons name="hourglass" size={18} color="#b45309" />
                        <Text style={styles.pendingMessageText}>
                          Your unlock request is currently under review by our Operator. You will be able to edit once approved.
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.requestUnlockBigBtn}
                        activeOpacity={0.85}
                        onPress={() => setShowReasonBox(true)}
                      >
                        <Ionicons name="lock-open-outline" size={18} color="#b45309" />
                        <Text style={styles.requestUnlockBigBtnText}>
                          Request Unlock from Operator (Provide Reason)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.footerCloseBtn} onPress={onClose}>
              <Text style={styles.footerCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* FULL-SCREEN PHOTO PREVIEW MODAL */}
      {previewingPhotoIndex !== null && photos[previewingPhotoIndex] ? (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPreviewingPhotoIndex(null)}>
          <View style={styles.inspectOverlay}>
            <View style={styles.inspectCard}>
              <View style={styles.inspectHeader}>
                <Text style={styles.inspectTitle}>
                  Photo #{previewingPhotoIndex + 1} · {(photoSources[photos[previewingPhotoIndex]] || detectMediaCaptureSource(photos[previewingPhotoIndex])) === 'UPLOADED' ? 'UPLOADED' : 'LIVE'}
                </Text>
                <TouchableOpacity onPress={() => setPreviewingPhotoIndex(null)}>
                  <Ionicons name="close-circle" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={{ position: 'relative', width: '100%', height: 390, backgroundColor: '#020617', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
                <Image
                  source={{ uri: resolveCropMediaDisplayUri(photos[previewingPhotoIndex]) || photos[previewingPhotoIndex] }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>

              <View style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#334155' }}>
                <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>
                  Farmer: {effectiveFarmerName} · Plot: {effectivePlotName} ({cropName || 'Field Crop'})
                </Text>
              </View>

              <TouchableOpacity
                style={styles.inspectDoneBtn}
                onPress={() => setPreviewingPhotoIndex(null)}
              >
                <Text style={styles.inspectDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* REASON BOX MODAL FOR OPERATOR UNLOCK REQUEST */}
      <Modal visible={showReasonBox} transparent animationType="fade" onRequestClose={() => setShowReasonBox(false)}>
        <View style={styles.reasonOverlay}>
          <View style={styles.reasonCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="lock-open" size={18} color="#b45309" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Request Field Unlock</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Operator approval required to edit</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowReasonBox(false)}>
                <Ionicons name="close-circle" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
              Reason for Unlocking <Text style={{ color: '#dc2626' }}>*</Text>
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Explain why you need to unlock (e.g. boundary shifted, land leveled, marked wrong corner)..."
              placeholderTextColor="#94a3b8"
              multiline
              value={unlockReasonInput}
              onChangeText={setUnlockReasonInput}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.reasonCancelBtn}
                onPress={() => setShowReasonBox(false)}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reasonSubmitBtn}
                activeOpacity={0.85}
                onPress={handleDirectUnlockRequest}
              >
                <Ionicons name="send" size={14} color="#ffffff" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>Submit to Operator</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <WebCameraPhotoModal
        visible={showWebPhotoCamera}
        farmerName={effectiveFarmerName}
        plotName={effectivePlotName}
        cropName={cropName || 'Field Crop'}
        onClose={() => setShowWebPhotoCamera(false)}
        onCaptured={(stampedDataUrl) => {
          setPhotos((prev) => [...prev, stampedDataUrl].slice(0, 6));
          setPhotoSources((prev) => ({ ...prev, [stampedDataUrl]: 'LIVE' }));
        }}
      />

      <WebCameraVideoRecorderModal
        visible={showWebVideoRecorder}
        farmerName={effectiveFarmerName}
        plotName={effectivePlotName}
        cropName={cropName || 'Field Crop'}
        onClose={() => setShowWebVideoRecorder(false)}
        onRecorded={(blobUrl) => {
          setVideoUri(blobUrl);
          setVideoRecordedAt(new Date().toISOString());
        }}
      />
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
  card: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },

  stepNavRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  stepNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stepNavItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNavText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  stepNavTextActive: {
    color: '#1e293b',
    fontWeight: '800',
  },

  stepContainer: {
    gap: 12,
  },
  stepHeaderRow: {
    gap: 2,
  },
  stepHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  stepSub: {
    fontSize: 11,
    color: '#64748b',
  },

  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modeToggleBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  modeToggleTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },

  coordsSummaryBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 4,
  },
  coordsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  acresBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  acresBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  coordsValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  coordsStatus: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700',
  },

  gpsWalkBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  gpsWalkBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  remoteAutoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  remoteAutoText: {
    fontSize: 11.5,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },

  nextStepBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  nextStepBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  backStepBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backStepBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },

  photoCountBadge: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediaActionBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  mediaActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  mediaActionBtnOutline: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  mediaActionBtnOutlineText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800',
  },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  photoThumbCard: {
    width: '31%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#090e17',
  },
  photoImageWrap: {
    width: '100%',
    height: 136,
    backgroundColor: '#090e17',
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  photoActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  photoFooterCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  photoInspectBadge: {
    backgroundColor: '#1e293b',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  photoDeleteBadge: {
    backgroundColor: '#dc2626',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotLabel: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
  },
  photoEmptySlot: {
    width: '31%',
    height: 173,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
  },
  photoEmptySlotText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },

  checkNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
  },
  checkNoticeText: {
    fontSize: 10.5,
    color: '#0369a1',
    fontWeight: '600',
    flex: 1,
  },

  videoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  videoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  videoSub: {
    fontSize: 11,
    color: '#64748b',
  },
  recordingTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  redDotBlink: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  recordingTimerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  videoActionBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  videoActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  videoActionBtnOutline: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  videoActionBtnOutlineText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  finalSubmitSummaryCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86efac',
    gap: 10,
    marginTop: 6,
  },
  finalSubmitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  finalSubmitSub: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  summaryList: {
    gap: 6,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532d',
  },
  bigSubmitLockBtn: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  bigSubmitLockBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  lockedMonitoringBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#86efac',
    gap: 8,
  },
  lockedMonitoringTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  lockedMonitoringSub: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  pendingBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    padding: 6,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },

  satellitePhotoCard: {
    height: 170,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  satellitePhotoImg: {
    width: '100%',
    height: '100%',
  },
  satellitePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  satellitePhotoOverlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  healthGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  healthCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 3,
  },
  healthCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  healthCardLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  healthCardBadgeGreen: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  healthCardBadgeBlue: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },

  actionNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  actionNoteText: {
    fontSize: 11.5,
    color: '#78350f',
    lineHeight: 16,
    flex: 1,
  },

  emptyMediaBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyMediaText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  unlockSectionCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 10,
  },
  unlockSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b45309',
  },
  unlockSectionSub: {
    fontSize: 11.5,
    color: '#78350f',
  },
  requestUnlockBigBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  requestUnlockBigBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
  },
  pendingMessageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
  },
  pendingMessageText: {
    fontSize: 11.5,
    color: '#b45309',
    fontWeight: '600',
    flex: 1,
  },

  footerRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerCloseBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  inspectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inspectCard: {
    width: '100%',
    maxWidth: 520,
    height: '75%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  inspectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inspectTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  inspectImage: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
  },
  inspectDoneBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  inspectDoneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  reasonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  reasonCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  reasonInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 12.5,
    color: '#0f172a',
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  reasonCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonSubmitBtn: {
    flex: 1.6,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  openInteractiveMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1d4ed8',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 4,
  },
  openInteractiveMapBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
