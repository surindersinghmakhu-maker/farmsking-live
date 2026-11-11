import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useCrops, CropGpsData } from '@/src/store/crops-context';
import { useAuth } from '@/src/store/auth-context';
import {
  CropVideoPlayer,
  WebCameraPhotoModal,
  WebCameraVideoRecorderModal,
} from '@/components/CropVideoPlayer';
import { CropRemarksSection } from '@/components/CropRemarksSection';
import {
  buildCropActivityMediaBatches,
  computeDaysRemaining,
  CropMediaHistoryBatch,
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

interface CropMediaModalProps {
  visible: boolean;
  cropId?: string;
  cropName?: string;
  farmerName?: string;
  fieldName?: string;
  existingGpsData?: CropGpsData;
  initialTab?: 'CURRENT' | 'ARCHIVE';
  onClose: () => void;
  onSaved?: (photos: string[], video?: string) => void;
  onOpenActivities?: () => void;
}

export const CropMediaModal: React.FC<CropMediaModalProps> = ({
  visible,
  cropId,
  cropName = 'Registered Crop',
  farmerName: farmerNameProp,
  fieldName = 'Field Plot',
  existingGpsData,
  initialTab = 'CURRENT',
  onClose,
  onSaved,
  onOpenActivities,
}) => {
  const { user } = useAuth();
  const { cropGpsDataMap, saveCropGpsData, addCropActivity } = useCrops();

  const effectiveFarmerName = (farmerNameProp || user?.farmName || user?.name || 'Registered Farmer').trim();
  const currentGps = (cropId ? cropGpsDataMap[cropId] : null) || existingGpsData;

  const [activeTab, setActiveTab] = useState<'CURRENT' | 'ARCHIVE'>(initialTab);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoSources, setPhotoSources] = useState<Record<string, MediaCaptureSource>>({});
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoRecordedAt, setVideoRecordedAt] = useState<string | Date | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioRecordedAt, setAudioRecordedAt] = useState<string | Date | null>(null);
  const [remarksText, setRemarksText] = useState<string>('');
  const [saveToCropRecord, setSaveToCropRecord] = useState<boolean>(true);
  const [isActiveCycleLocked, setIsActiveCycleLocked] = useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [expiresAtIso, setExpiresAtIso] = useState<string | null>(null);
  const [hasExpiredArchive, setHasExpiredArchive] = useState<boolean>(false);
  const [pastBatches, setPastBatches] = useState<CropMediaHistoryBatch[]>([]);
  const [previewingPhotoIndex, setPreviewingPhotoIndex] = useState<number | null>(null);
  const [archivePreviewPhoto, setArchivePreviewPhoto] = useState<{
    url: string;
    source: MediaCaptureSource;
    label: string;
  } | null>(null);
  const [showWebPhotoCamera, setShowWebPhotoCamera] = useState(false);
  const [showWebVideoRecorder, setShowWebVideoRecorder] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recordsByUrlRef = useRef<Record<string, string>>({});
  const initialUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setErrorMessage(null);
      setPreviewingPhotoIndex(null);
      setArchivePreviewPhoto(null);
      setShowWebPhotoCamera(false);
      setShowWebVideoRecorder(false);
      return;
    }

    let cancelled = false;
    setErrorMessage(null);
    setActiveTab(initialTab);
    setArchivePreviewPhoto(null);

    const localSnapshot = (cropId ? cropGpsDataMap[cropId] : null) || existingGpsData;
    const localActive = isLocalGpsMediaActive(localSnapshot);

    const sanitizedInitial = localActive
      ? mergeCropMediaLists(
          [],
          localSnapshot?.fieldPhotos,
          null,
          localSnapshot?.fieldVideo || null,
          null,
          localSnapshot?.fieldAudio || null,
        )
      : { photos: [], video: null, audio: null };

    const initialSourceMap: Record<string, MediaCaptureSource> = {};
    sanitizedInitial.photos.forEach((p) => {
      initialSourceMap[p] = detectMediaCaptureSource(p);
    });

    setPhotos(sanitizedInitial.photos);
    setPhotoSources(initialSourceMap);
    setVideoUri(sanitizedInitial.video);
    setVideoRecordedAt(localActive ? localSnapshot?.updatedAt || null : null);
    setAudioUri(sanitizedInitial.audio);
    setAudioRecordedAt(localActive ? localSnapshot?.updatedAt || null : null);
    setRemarksText(
      localActive ? String(localSnapshot?.farmerRemarks || '').slice(0, MAX_REMARK_CHARS) : '',
    );

    const localExpiry =
      localActive && localSnapshot?.mediaDisplayExpiresAt
        ? localSnapshot.mediaDisplayExpiresAt
        : localActive && localSnapshot?.updatedAt
          ? new Date(new Date(localSnapshot.updatedAt).getTime() + MEDIA_DISPLAY_MS).toISOString()
          : null;
    const localHasCycleLock = Boolean(
      localActive &&
        localSnapshot?.saveMediaToCropRecord !== false &&
        (localSnapshot?.mediaCycleSavedAt || localSnapshot?.mediaDisplayExpiresAt),
    );
    const localHadPriorMedia = Boolean(
      localSnapshot &&
        ((localSnapshot.fieldPhotos && localSnapshot.fieldPhotos.length > 0) ||
          localSnapshot.fieldVideo ||
          localSnapshot.fieldAudio ||
          localSnapshot.farmerRemarks),
    );

    setSaveToCropRecord(localSnapshot?.saveMediaToCropRecord !== false);
    setIsActiveCycleLocked(localHasCycleLock);
    setExpiresAtIso(localExpiry);
    setDaysRemaining(localExpiry ? computeDaysRemaining(localExpiry) : 0);
    setHasExpiredArchive(!localActive && localHadPriorMedia);

    const localBatchList: CropMediaHistoryBatch[] = [];
    if (localHadPriorMedia && localSnapshot) {
      const savedAt = localSnapshot.mediaCycleSavedAt || localSnapshot.updatedAt || new Date().toISOString();
      const expAt =
        localSnapshot.mediaDisplayExpiresAt ||
        new Date(new Date(savedAt).getTime() + MEDIA_DISPLAY_MS).toISOString();
      const remD = computeDaysRemaining(expAt);
      const localSan = mergeCropMediaLists(
        [],
        localSnapshot.fieldPhotos,
        null,
        localSnapshot.fieldVideo || null,
        null,
        localSnapshot.fieldAudio || null,
      );
      if (
        localSan.photos.length > 0 ||
        localSan.video ||
        localSan.audio ||
        localSnapshot.farmerRemarks?.trim()
      ) {
        localBatchList.push({
          batchKey: `local-${savedAt}`,
          dateLabel: formatMediaTimestamp(savedAt).dateStr,
          savedAt,
          expiresAt: expAt,
          isActiveDisplay: remD > 0,
          daysRemaining: remD,
          photos: localSan.photos.map((u) => ({
            url: u,
            source: detectMediaCaptureSource(u),
            createdAt: savedAt,
          })),
          video: localSan.video,
          audio: localSan.audio,
          remarksText: String(localSnapshot.farmerRemarks || '').trim(),
        });
      }
    }
    setPastBatches(localBatchList);

    initialUrlsRef.current = [
      ...sanitizedInitial.photos,
      ...(sanitizedInitial.video ? [sanitizedInitial.video] : []),
      ...(sanitizedInitial.audio ? [sanitizedInitial.audio] : []),
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
          const serverBatches = buildCropActivityMediaBatches(
            storeMedia.rawRows,
            savedRemark.history || [],
          );
          setPastBatches(serverBatches.length > 0 ? serverBatches : localBatchList);

          const activeStoreExists = storeMedia.isActiveWindowLocked || savedRemark.isActiveDisplay;
          const anyArchivedOnServer =
            storeMedia.hasExpiredArchive ||
            savedRemark.history.some((h) => !h.isActiveDisplay);

          const merged = mergeCropMediaLists(
            storeMedia.photos,
            localActive ? localSnapshot?.fieldPhotos : undefined,
            storeMedia.video,
            localActive ? localSnapshot?.fieldVideo || null : null,
            storeMedia.audio,
            localActive ? localSnapshot?.fieldAudio || null : null,
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

          const finalRemark = (
            savedRemark.remarksText ||
            (localActive ? localSnapshot?.farmerRemarks || '' : '')
          ).slice(0, MAX_REMARK_CHARS);
          setRemarksText(finalRemark);

          const resolvedExpiry =
            storeMedia.activeWindowExpiresAt || savedRemark.expiresAt || localExpiry;
          const remaining = resolvedExpiry ? computeDaysRemaining(resolvedExpiry) : 0;
          const cycleShouldLock =
            (activeStoreExists || localHasCycleLock) &&
            remaining > 0 &&
            localSnapshot?.saveMediaToCropRecord !== false;

          setExpiresAtIso(resolvedExpiry);
          setDaysRemaining(cycleShouldLock ? remaining : activeStoreExists ? remaining : 0);
          setIsActiveCycleLocked(cycleShouldLock);
          setHasExpiredArchive(
            anyArchivedOnServer || (!localActive && localHadPriorMedia),
          );

          initialUrlsRef.current = [
            ...merged.photos,
            ...(merged.video ? [merged.video] : []),
            ...(merged.audio ? [merged.audio] : []),
          ];
        })
        .catch(() => {
          // Keep sanitized local cache if server fetch fails temporarily
        })
        .finally(() => {
          if (!cancelled) setIsLoadingMedia(false);
        });
    }

    return () => {
      cancelled = true;
    };
    // Hydrate cleanly only when modal opens or active crop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cropId]);

  // Take live photo via real camera (tagged LIVE; never silently falls back to gallery)
  const handleTakePhotoLive = async () => {
    if (isActiveCycleLocked) return;
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'You can save a maximum of 6 crop photos.');
      return;
    }
    setErrorMessage(null);

    if (Platform.OS === 'web') {
      setShowWebPhotoCamera(true);
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is required to capture live crop photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const rawUri = result.assets[0].uri;
        const stamped = await stampWatermarkOnImage(rawUri, {
          sourceType: 'LIVE',
          farmerName: effectiveFarmerName,
          plotName: fieldName,
          cropName,
        });
        setPhotos((prev) => [...prev, stamped].slice(0, 6));
        setPhotoSources((prev) => ({ ...prev, [stamped]: 'LIVE' }));
      }
    } catch {
      setErrorMessage('Camera could not open on this device. Use "From Gallery" for saved photos.');
    }
  };

  // Pick photos from gallery (tagged UPLOADED)
  const handlePickPhotoLibrary = async () => {
    if (isActiveCycleLocked) return;
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'You can save a maximum of 6 crop photos.');
      return;
    }
    setErrorMessage(null);
    const stampGalleryUri = (uri: string) =>
      stampWatermarkOnImage(uri, {
        sourceType: 'UPLOADED',
        farmerName: effectiveFarmerName,
        plotName: fieldName,
        cropName,
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
      setErrorMessage('Could not open image gallery. Please try again.');
    }
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    if (isActiveCycleLocked) return;
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

  // Shoot live video ONLY (camera capture; gallery video uploads disabled)
  const handleStartShootVideo = async () => {
    if (isActiveCycleLocked) return;
    setErrorMessage(null);
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
      setErrorMessage('Live video recording unavailable on this device.');
    }
  };

  // Save photos, live video, voice feedback & written remarks
  const hasAnythingToSave =
    photos.length > 0 || Boolean(videoUri) || Boolean(audioUri) || remarksText.trim().length > 0;

  const handleSaveMedia = async () => {
    if (isActiveCycleLocked) {
      Alert.alert(
        'Active 7-Day Display Locked',
        `Saved media is currently displayed for ${daysRemaining} more day(s). Fresh uploads unlock automatically after 7 days; older records remain permanently inside Crop Activities.`,
      );
      return;
    }
    if (!hasAnythingToSave) {
      const msg = 'Please add at least 1 photo, live video, voice audio, or written remark before saving.';
      setErrorMessage(msg);
      Alert.alert('No Media or Remarks Attached', msg);
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const expiresIso = new Date(Date.now() + MEDIA_DISPLAY_MS).toISOString();

      const uploadedPhotoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const srcType = photoSources[p] || detectMediaCaptureSource(p);
        const savedUrl = await uploadSingleCropMedia(p, {
          cropId: cropId || undefined,
          mediaType: 'IMAGE',
          sourceType: srcType,
          filenamePrefix: `crop_${cropId || 'field'}_${srcType.toLowerCase()}_p${i + 1}`,
        });
        uploadedPhotoUrls.push(savedUrl);
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

      const currentSavedUrls = [
        ...uploadedPhotoUrls,
        ...(finalVideoUrl ? [finalVideoUrl] : []),
        ...(finalAudioUrl ? [finalAudioUrl] : []),
      ];
      await deleteRemovedMediaStoreRecords(
        initialUrlsRef.current,
        currentSavedUrls,
        recordsByUrlRef.current,
      );

      if (cropId) {
        const updatedGps: CropGpsData = currentGps
          ? {
              ...currentGps,
              fieldPhotos: uploadedPhotoUrls,
              fieldVideo: finalVideoUrl,
              fieldAudio: finalAudioUrl,
              farmerRemarks: trimmedRemarks || undefined,
              mediaCycleSavedAt: nowIso,
              mediaDisplayExpiresAt: expiresIso,
              saveMediaToCropRecord: saveToCropRecord,
              updatedAt: nowIso,
            }
          : {
              centerLat: 30.9085,
              centerLng: 75.8610,
              corners: [],
              areaAcres: 1,
              locationText: 'Crop Field Media Recorded',
              isLocked: false,
              fieldPhotos: uploadedPhotoUrls,
              fieldVideo: finalVideoUrl,
              fieldAudio: finalAudioUrl,
              farmerRemarks: trimmedRemarks || undefined,
              mediaCycleSavedAt: nowIso,
              mediaDisplayExpiresAt: expiresIso,
              saveMediaToCropRecord: saveToCropRecord,
              updatedAt: nowIso,
            };

        saveCropGpsData(cropId, updatedGps);

        if (saveToCropRecord) {
          const summaryParts: string[] = [];
          if (uploadedPhotoUrls.length > 0) summaryParts.push(`${uploadedPhotoUrls.length} Photo(s)`);
          if (finalVideoUrl) summaryParts.push('1 Live Video');
          if (finalAudioUrl) summaryParts.push('1 Voice Audio');
          if (trimmedRemarks) summaryParts.push('Written Remarks');

          try {
            await addCropActivity(cropId, {
              cropId,
              type: 'NOTE',
              title: 'Crop Record Media & Remarks Saved',
              date: formatMediaTimestamp(nowIso).dateStr,
              quantity: summaryParts.join(', '),
              notes: trimmedRemarks
                ? `Remarks: "${trimmedRemarks}". Display window: ${MEDIA_DISPLAY_DAYS} days (archived permanently in Crop Activities thereafter).`
                : `Saved ${summaryParts.join(', ')} to Crop Record (${MEDIA_DISPLAY_DAYS}-day active display + permanent archive in Crop Activities).`,
            });
          } catch {
            // Activity note failure should not block media save confirmation
          }
        }
      }

      if (onSaved) onSaved(uploadedPhotoUrls, finalVideoUrl);
      Alert.alert(
        saveToCropRecord ? 'Saved to Crop Record (7-Day Display)' : 'Media & Remarks Saved',
        saveToCropRecord
          ? `${uploadedPhotoUrls.length} photo(s)${finalVideoUrl ? ', 1 live video' : ''}${finalAudioUrl ? ', 1 voice note' : ''}${trimmedRemarks ? ', and written remarks' : ''} saved to Crop Record. Visible on display for ${MEDIA_DISPLAY_DAYS} days, then archived permanently in Crop Activities.`
          : `${uploadedPhotoUrls.length} photo(s)${finalVideoUrl ? ', 1 live video' : ''}${finalAudioUrl ? ', 1 voice note' : ''}${trimmedRemarks ? ', and written remarks' : ''} saved securely.`,
      );
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not upload media to server. Please check your connection and sign-in status.';
      setErrorMessage(msg);
      Alert.alert('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const dayOfCycle = isActiveCycleLocked
    ? Math.min(MEDIA_DISPLAY_DAYS, Math.max(1, MEDIA_DISPLAY_DAYS - daysRemaining + 1))
    : 0;
  const cycleProgressPct = isActiveCycleLocked
    ? Math.min(100, Math.max(14, Math.round((dayOfCycle / MEDIA_DISPLAY_DAYS) * 100)))
    : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* PREMIUM DARK OBSIDIAN HEADER + MODULE TABS */}
          <LinearGradient
            colors={['#090e17', '#0f172a', '#052e16']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 }}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="film" size={20} color="#4ade80" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={styles.headerTitle}>Media Record</Text>
                    <View
                      style={[
                        styles.headerStatusPill,
                        isActiveCycleLocked
                          ? { backgroundColor: 'rgba(22, 163, 74, 0.25)', borderColor: 'rgba(74, 222, 128, 0.5)' }
                          : { backgroundColor: 'rgba(245, 158, 11, 0.22)', borderColor: 'rgba(251, 191, 36, 0.45)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerStatusPillText,
                          { color: isActiveCycleLocked ? '#4ade80' : '#fbbf24' },
                        ]}
                      >
                        {isActiveCycleLocked
                          ? `ACTIVE · ${daysRemaining}D LEFT`
                          : hasExpiredArchive
                            ? 'NEW RECORD UNLOCKED'
                            : '7-DAY RECORD'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {effectiveFarmerName} · {fieldName} ({cropName})
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#e2e8f0" />
              </TouchableOpacity>
            </View>

            {/* BUILT-IN TAB SWITCHER: CURRENT RECORD (7 DAYS) vs PAST RECORDS ARCHIVE */}
            <View style={styles.modalTabRow}>
              <TouchableOpacity
                style={[styles.modalTabBtn, activeTab === 'CURRENT' && styles.modalTabBtnActive]}
                activeOpacity={0.85}
                onPress={() => setActiveTab('CURRENT')}
              >
                <Ionicons
                  name={isActiveCycleLocked ? 'eye' : 'add-circle'}
                  size={14}
                  color={activeTab === 'CURRENT' ? '#04160c' : '#cbd5e1'}
                />
                <Text
                  style={[
                    styles.modalTabText,
                    activeTab === 'CURRENT' && styles.modalTabTextActive,
                  ]}
                >
                  {isActiveCycleLocked ? 'Current Record (7 Days)' : 'New Media Record'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalTabBtn, activeTab === 'ARCHIVE' && styles.modalTabBtnActive]}
                activeOpacity={0.85}
                onPress={() => setActiveTab('ARCHIVE')}
              >
                <Ionicons
                  name="archive"
                  size={14}
                  color={activeTab === 'ARCHIVE' ? '#04160c' : '#cbd5e1'}
                />
                <Text
                  style={[
                    styles.modalTabText,
                    activeTab === 'ARCHIVE' && styles.modalTabTextActive,
                  ]}
                >
                  Past Records ({pastBatches.length})
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 18, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 15 }}>
              {isLoadingMedia && (
                <View style={styles.loadingMediaBanner}>
                  <ActivityIndicator size="small" color="#15803d" />
                  <Text style={styles.loadingMediaText}>Loading Media Record...</Text>
                </View>
              )}

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {activeTab === 'CURRENT' ? (
                <>
                  {/* QUICK SUMMARY CHIPS STRIP */}
                  <View style={styles.summaryStripRow}>
                    <View style={styles.summaryChip}>
                      <Ionicons name="images" size={13} color="#15803d" />
                      <Text style={styles.summaryChipText}>Photos: {photos.length}/6</Text>
                    </View>
                    <View style={styles.summaryChip}>
                      <Ionicons name="videocam" size={13} color="#dc2626" />
                      <Text style={styles.summaryChipText}>
                        Video: {videoUri ? 'Recorded ✓' : '0/1'}
                      </Text>
                    </View>
                    <View style={styles.summaryChip}>
                      <Ionicons name="mic" size={13} color="#0284c7" />
                      <Text style={styles.summaryChipText}>
                        Voice: {audioUri ? 'Recorded ✓' : '0/1'}
                      </Text>
                    </View>
                    <View style={styles.summaryChip}>
                      <Ionicons name="document-text" size={13} color="#7c3aed" />
                      <Text style={styles.summaryChipText}>
                        Note: {remarksText.trim().length}/{MAX_REMARK_CHARS}
                      </Text>
                    </View>
                  </View>

                  {isActiveCycleLocked && (
                    <View style={styles.activeCycleBanner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Ionicons name="shield-checkmark" size={17} color="#15803d" />
                          <Text style={styles.activeCycleTitle}>
                            Active Media Record · {daysRemaining} Day{daysRemaining === 1 ? '' : 's'} Left
                          </Text>
                        </View>
                        <View style={styles.activeDaysPill}>
                          <Text style={styles.activeDaysPillText}>
                            DAY {dayOfCycle} OF {MEDIA_DISPLAY_DAYS}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.modalProgressTrack}>
                        <View style={[styles.modalProgressFill, { width: `${cycleProgressPct}%` }]} />
                      </View>
                      <Text style={styles.activeCycleDesc}>
                        Visible on display until{' '}
                        {expiresAtIso ? formatMediaTimestamp(expiresAtIso).dateStr : `${MEDIA_DISPLAY_DAYS} days`}.
                        After 7 days, this record moves to Past Records and you can add a New Media Record.
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                        <TouchableOpacity
                          style={styles.openActivitiesLinkBtn}
                          activeOpacity={0.85}
                          onPress={() => setActiveTab('ARCHIVE')}
                        >
                          <Ionicons name="archive-outline" size={14} color="#15803d" />
                          <Text style={styles.openActivitiesLinkText}>
                            View Past Records ({pastBatches.length})
                          </Text>
                        </TouchableOpacity>
                        {onOpenActivities ? (
                          <TouchableOpacity
                            style={styles.openActivitiesLinkBtn}
                            activeOpacity={0.85}
                            onPress={onOpenActivities}
                          >
                            <Ionicons name="calendar-outline" size={14} color="#15803d" />
                            <Text style={styles.openActivitiesLinkText}>Open Crop Activities</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  )}

                  {!isActiveCycleLocked && hasExpiredArchive && (
                    <View style={styles.expiredArchiveBanner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="refresh-circle" size={18} color="#b45309" />
                        <Text style={styles.expiredArchiveTitle}>
                          7 Days Complete · Ready for New Media Record
                        </Text>
                      </View>
                      <Text style={styles.expiredArchiveDesc}>
                        Your last Media Record is saved in Past Records ({pastBatches.length}). You can add a fresh record below for the next 7 days.
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        <TouchableOpacity
                          style={styles.openArchiveLinkBtn}
                          activeOpacity={0.85}
                          onPress={() => setActiveTab('ARCHIVE')}
                        >
                          <Ionicons name="archive-outline" size={14} color="#b45309" />
                          <Text style={styles.openArchiveLinkText}>
                            View Past Records ({pastBatches.length})
                          </Text>
                        </TouchableOpacity>
                        {onOpenActivities ? (
                          <TouchableOpacity
                            style={styles.openArchiveLinkBtn}
                            activeOpacity={0.85}
                            onPress={onOpenActivities}
                          >
                            <Ionicons name="calendar-outline" size={14} color="#b45309" />
                            <Text style={styles.openArchiveLinkText}>Open Crop Activities</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  )}

                  {/* STEP 1: CROP PHOTOS (UP TO 6) */}
                  <View style={styles.sectionCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View style={styles.stepTagGreen}>
                          <Text style={styles.stepTagText}>STEP 1</Text>
                        </View>
                        <Text style={styles.sectionHeading}>Crop Photos (Up to 6)</Text>
                      </View>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{photos.length} / 6 Added</Text>
                      </View>
                    </View>

                    <Text style={styles.sectionSub}>
                      Take clear photos of leaves or crop field, or choose from gallery. Each photo automatically gets date, time, farmer, and plot stamp.
                    </Text>

                    {/* PHOTO ACTION BUTTONS */}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[
                          styles.actionBtnGreen,
                          (photos.length >= 6 || isActiveCycleLocked) && { opacity: 0.45 },
                        ]}
                        activeOpacity={0.85}
                        disabled={photos.length >= 6 || isActiveCycleLocked}
                        onPress={handleTakePhotoLive}
                      >
                        <Ionicons name="camera" size={16} color="#ffffff" />
                        <Text style={styles.actionBtnText}>Take Live Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionBtnOutline,
                          (photos.length >= 6 || isActiveCycleLocked) && { opacity: 0.45 },
                        ]}
                        activeOpacity={0.85}
                        disabled={photos.length >= 6 || isActiveCycleLocked}
                        onPress={handlePickPhotoLibrary}
                      >
                        <Ionicons name="folder-open" size={16} color="#2563eb" />
                        <Text style={styles.actionBtnOutlineText}>From Gallery</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 6-SLOT PHOTO GRID: SAVED PHOTOS FIRST, REMAINING SHOW "NO PHOTO" */}
                    <View style={styles.photoGrid}>
                      {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                        const photoUri = photos[slotIdx];
                        if (photoUri) {
                          const resolvedPhotoUri = resolveCropMediaDisplayUri(photoUri) || photoUri;
                          return (
                            <View key={slotIdx} style={styles.photoThumbCard}>
                              <TouchableOpacity
                                style={styles.photoImageWrap}
                                activeOpacity={0.9}
                                onPress={() => setPreviewingPhotoIndex(slotIdx)}
                              >
                                <Image source={{ uri: resolvedPhotoUri }} style={styles.photoThumbImg} resizeMode="contain" />
                              </TouchableOpacity>

                              <View style={styles.photoActionFooter}>
                                <Text style={styles.photoSlotCaption}>Photo #{slotIdx + 1}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <TouchableOpacity
                                    style={styles.inspectBtn}
                                    onPress={() => setPreviewingPhotoIndex(slotIdx)}
                                    accessibilityLabel={`Inspect Photo ${slotIdx + 1}`}
                                  >
                                    <Ionicons name="eye" size={13} color="#ffffff" />
                                  </TouchableOpacity>
                                  {!isActiveCycleLocked && (
                                    <TouchableOpacity
                                      style={styles.deleteBtn}
                                      onPress={() => handleRemovePhoto(slotIdx)}
                                      accessibilityLabel={`Delete Photo ${slotIdx + 1}`}
                                    >
                                      <Ionicons name="trash" size={12} color="#ffffff" />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            </View>
                          );
                        }
                        return (
                          <View key={slotIdx} style={styles.emptySlot}>
                            <Ionicons name="image-outline" size={22} color="#94a3b8" />
                            <Text style={styles.emptySlotText}>No Photo</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* STEP 2: LIVE FIELD VIDEO ONLY */}
                  <View style={styles.sectionCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View style={[styles.stepTagGreen, { backgroundColor: '#fee2e2' }]}>
                          <Text style={[styles.stepTagText, { color: '#dc2626' }]}>STEP 2</Text>
                        </View>
                        <Text style={styles.sectionHeading}>Live Field Video (Max 1 Min)</Text>
                      </View>
                      {videoUri ? (
                        <View style={styles.attachedBadge}>
                          <Text style={styles.attachedBadgeText}>Recorded ✓</Text>
                        </View>
                      ) : (
                        <View style={[styles.attachedBadge, { backgroundColor: '#f1f5f9' }]}>
                          <Text style={[styles.attachedBadgeText, { color: '#64748b' }]}>Optional</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.sectionSub}>
                      Record a quick live camera video up to 60 seconds showing your field. You can play and check it anytime.
                    </Text>

                    <TouchableOpacity
                      style={[styles.actionBtnRed, isActiveCycleLocked && { opacity: 0.45 }]}
                      activeOpacity={0.85}
                      disabled={isActiveCycleLocked}
                      onPress={handleStartShootVideo}
                    >
                      <Ionicons name="radio-button-on" size={16} color="#ffffff" />
                      <Text style={styles.actionBtnText}>
                        {videoUri ? 'Re-record Live Video' : 'Record Live Video'}
                      </Text>
                    </TouchableOpacity>

                    {videoUri ? (
                      <CropVideoPlayer
                        videoUri={videoUri}
                        cropName={cropName}
                        fieldName={fieldName}
                        farmerName={effectiveFarmerName}
                        recordedAt={videoRecordedAt}
                        height={220}
                        onRemove={isActiveCycleLocked ? undefined : () => setVideoUri(null)}
                      />
                    ) : (
                      <View style={styles.noVideoBox}>
                        <Ionicons name="videocam-off-outline" size={22} color="#94a3b8" />
                        <Text style={styles.noVideoText}>No Video Recorded</Text>
                      </View>
                    )}
                  </View>

                  {/* STEP 3: FARMER VOICE AUDIO OR WRITTEN REMARKS */}
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
                    fieldName={fieldName}
                    cropName={cropName}
                    readOnly={isActiveCycleLocked}
                  />

                  {/* SAVE TO MEDIA RECORD (7-DAY ACTIVE DISPLAY) OPTION */}
                  {!isActiveCycleLocked && (
                    <TouchableOpacity
                      style={styles.recordOptionCard}
                      activeOpacity={0.85}
                      onPress={() => setSaveToCropRecord((prev) => !prev)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <View
                          style={[
                            styles.recordCheckbox,
                            saveToCropRecord && styles.recordCheckboxChecked,
                          ]}
                        >
                          {saveToCropRecord ? (
                            <Ionicons name="checkmark" size={14} color="#ffffff" />
                          ) : null}
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.recordOptionTitle}>
                            Save as Media Record ({MEDIA_DISPLAY_DAYS}-Day Display)
                          </Text>
                          <Text style={styles.recordOptionDesc}>
                            Stays visible for {MEDIA_DISPLAY_DAYS} days, then moves to Past Records and Crop Activities so you can add a new Media Record.
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                /* TAB 2: PAST MEDIA RECORDS (PERMANENT ARCHIVE) */
                <View style={{ gap: 14 }}>
                  <View style={styles.archiveIntroCard}>
                    <Ionicons name="archive" size={18} color="#0284c7" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.archiveIntroTitle}>
                        Past Media Records ({pastBatches.length})
                      </Text>
                      <Text style={styles.archiveIntroSub}>
                        Every saved 7-day Media Record stays permanently here. Older records remain safe even after a new record starts.
                      </Text>
                    </View>
                  </View>

                  {pastBatches.length === 0 ? (
                    <View style={styles.emptyArchiveCard}>
                      <Ionicons name="images-outline" size={32} color="#94a3b8" />
                      <Text style={styles.emptyArchiveTitle}>No Past Media Records Yet</Text>
                      <Text style={styles.emptyArchiveSub}>
                        Save your first Media Record under the New Media Record tab. It will appear here automatically.
                      </Text>
                    </View>
                  ) : (
                    pastBatches.map((batch) => (
                      <View key={batch.batchKey} style={styles.archiveBatchCard}>
                        <View style={styles.archiveBatchHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="calendar-outline" size={14} color="#475569" />
                            <Text style={styles.archiveBatchDate}>Saved {batch.dateLabel}</Text>
                          </View>
                          {batch.isActiveDisplay ? (
                            <View style={styles.archiveBadgeActive}>
                              <Text style={styles.archiveBadgeActiveText}>
                                Active Display · {batch.daysRemaining}d Left
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.archiveBadgePast}>
                              <Text style={styles.archiveBadgePastText}>
                                Completed · Archived Archive
                              </Text>
                            </View>
                          )}
                        </View>

                        {batch.photos.length > 0 ? (
                          <View style={styles.photoGrid}>
                            {batch.photos.map((photoItem, idx) => {
                              const resolvedP =
                                resolveCropMediaDisplayUri(photoItem.url) || photoItem.url;
                              return (
                                <View key={`${batch.batchKey}_p${idx}`} style={styles.photoThumbCard}>
                                  <TouchableOpacity
                                    style={styles.photoImageWrap}
                                    activeOpacity={0.9}
                                    onPress={() =>
                                      setArchivePreviewPhoto({
                                        url: resolvedP,
                                        source: photoItem.source,
                                        label: `Photo #${idx + 1} · ${batch.dateLabel}`,
                                      })
                                    }
                                  >
                                    <Image
                                      source={{ uri: resolvedP }}
                                      style={styles.photoThumbImg}
                                      resizeMode="contain"
                                    />
                                  </TouchableOpacity>
                                  <View style={styles.photoActionFooter}>
                                    <Text style={styles.photoSlotCaption}>
                                      Photo #{idx + 1} · {photoItem.source}
                                    </Text>
                                    <TouchableOpacity
                                      style={styles.inspectBtn}
                                      onPress={() =>
                                        setArchivePreviewPhoto({
                                          url: resolvedP,
                                          source: photoItem.source,
                                          label: `Photo #${idx + 1} · ${batch.dateLabel}`,
                                        })
                                      }
                                      accessibilityLabel={`Inspect Archived Photo ${idx + 1}`}
                                    >
                                      <Ionicons name="eye" size={13} color="#ffffff" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <View style={styles.noVideoBox}>
                            <Ionicons name="image-outline" size={20} color="#94a3b8" />
                            <Text style={styles.noVideoText}>No Photo in this record</Text>
                          </View>
                        )}

                        {batch.video ? (
                          <CropVideoPlayer
                            videoUri={batch.video}
                            cropName={cropName}
                            fieldName={fieldName}
                            farmerName={effectiveFarmerName}
                            recordedAt={batch.savedAt}
                            height={200}
                            compact
                          />
                        ) : null}

                        {batch.audio || batch.remarksText ? (
                          <CropRemarksSection
                            remarksText={batch.remarksText}
                            audioUri={batch.audio}
                            audioRecordedAt={batch.savedAt}
                            farmerName={effectiveFarmerName}
                            fieldName={fieldName}
                            cropName={cropName}
                            readOnly
                          />
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.footerCancelBtn} onPress={onClose}>
              <Text style={styles.footerCancelText}>
                {isActiveCycleLocked || activeTab === 'ARCHIVE' ? 'Close' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            {activeTab === 'ARCHIVE' ? (
              !isActiveCycleLocked ? (
                <TouchableOpacity
                  style={styles.footerSaveBtn}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab('CURRENT')}
                >
                  <Ionicons name="add-circle" size={16} color="#ffffff" />
                  <Text style={styles.footerSaveText}>Add New Media Record</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.footerSaveBtn, { backgroundColor: '#0f172a' }]}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab('CURRENT')}
                >
                  <Ionicons name="eye" size={16} color="#4ade80" />
                  <Text style={styles.footerSaveText}>Back to Active Display</Text>
                </TouchableOpacity>
              )
            ) : isActiveCycleLocked ? (
              onOpenActivities ? (
                <TouchableOpacity
                  style={styles.footerSaveBtn}
                  activeOpacity={0.85}
                  onPress={onOpenActivities}
                >
                  <Ionicons name="calendar-outline" size={16} color="#ffffff" />
                  <Text style={styles.footerSaveText}>
                    Open Crop Activities ({daysRemaining}d Display Left)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.footerSaveBtn, { backgroundColor: '#64748b' }]}>
                  <Ionicons name="lock-closed" size={15} color="#ffffff" />
                  <Text style={styles.footerSaveText}>
                    Active for {daysRemaining} Day(s) · New Record Unlocks After 7d
                  </Text>
                </View>
              )
            ) : (
              <TouchableOpacity
                style={[
                  styles.footerSaveBtn,
                  (!hasAnythingToSave || isSaving) && { backgroundColor: '#94a3b8', opacity: 0.65 },
                ]}
                activeOpacity={hasAnythingToSave && !isSaving ? 0.85 : 1}
                disabled={!hasAnythingToSave || isSaving}
                onPress={handleSaveMedia}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                ) : (
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                )}
                <Text style={styles.footerSaveText}>
                  {isSaving
                    ? 'Saving Media Record...'
                    : saveToCropRecord
                      ? 'Save Media Record (7-Day Display)'
                      : 'Save Media & Remarks'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* FULL-SCREEN PHOTO INSPECTION MODAL (ACTIVE OR PAST ARCHIVE PHOTO) */}
      {(previewingPhotoIndex !== null && photos[previewingPhotoIndex]) || archivePreviewPhoto ? (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setPreviewingPhotoIndex(null);
            setArchivePreviewPhoto(null);
          }}
        >
          <View style={styles.inspectOverlay}>
            <View style={styles.inspectCard}>
              <View style={styles.inspectHeader}>
                <Text style={styles.inspectTitle}>
                  {archivePreviewPhoto
                    ? `${archivePreviewPhoto.label} · ${archivePreviewPhoto.source}`
                    : `Photo ${(previewingPhotoIndex ?? 0) + 1} · ${(photoSources[photos[previewingPhotoIndex ?? 0]] || detectMediaCaptureSource(photos[previewingPhotoIndex ?? 0])) === 'UPLOADED' ? 'UPLOADED' : 'LIVE'}`}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setPreviewingPhotoIndex(null);
                    setArchivePreviewPhoto(null);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.inspectImageContainer}>
                <Image
                  source={{
                    uri: archivePreviewPhoto
                      ? archivePreviewPhoto.url
                      : resolveCropMediaDisplayUri(photos[previewingPhotoIndex ?? 0]) ||
                        photos[previewingPhotoIndex ?? 0],
                  }}
                  style={styles.inspectImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.inspectMetaBar}>
                <Text style={styles.inspectMetaText}>
                  Farmer: {effectiveFarmerName} · Plot: {fieldName} ({cropName})
                </Text>
              </View>

              <TouchableOpacity
                style={styles.inspectDoneBtn}
                onPress={() => {
                  setPreviewingPhotoIndex(null);
                  setArchivePreviewPhoto(null);
                }}
              >
                <Text style={styles.inspectDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}

      <WebCameraPhotoModal
        visible={showWebPhotoCamera}
        farmerName={effectiveFarmerName}
        plotName={fieldName}
        cropName={cropName}
        onClose={() => setShowWebPhotoCamera(false)}
        onCaptured={(stampedDataUrl) => {
          setPhotos((prev) => [...prev, stampedDataUrl].slice(0, 6));
          setPhotoSources((prev) => ({ ...prev, [stampedDataUrl]: 'LIVE' }));
        }}
      />

      <WebCameraVideoRecorderModal
        visible={showWebVideoRecorder}
        farmerName={effectiveFarmerName}
        plotName={fieldName}
        cropName={cropName}
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
    maxWidth: 880,
    maxHeight: '94%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
  },
  headerGradient: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 222, 128, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  headerStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerStatusPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#cbd5e1',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTabRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  modalTabBtnActive: {
    backgroundColor: '#4ade80',
  },
  modalTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  modalTabTextActive: {
    color: '#04160c',
    fontWeight: '900',
  },

  sectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  countBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  attachedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attachedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },

  actionBtnGreen: {
    flex: 1,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnRed: {
    flex: 1,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnOutline: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnOutlineText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    height: 152,
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
  photoSlotCaption: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  loadingMediaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingMediaText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
  },

  // THUMBNAIL WATERMARK STYLES
  thumbTopWatermark: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dc2626',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  liveDotRed: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
  },
  liveTextSmall: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  brandIconSmallPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  brandLogoThumb: {
    width: 48,
    height: 12,
  },

  thumbBottomWatermark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 4,
    paddingVertical: 2.5,
  },
  thumbDateText: {
    fontSize: 7.5,
    color: '#fde047',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  thumbBrandTag: {
    fontSize: 7,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 0.3,
  },
  photoSlotLabel: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },

  inspectBtn: {
    backgroundColor: '#1e293b',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: '31%',
    height: 189,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
  },
  emptySlotText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '700',
  },
  noVideoBox: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  noVideoText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '700',
  },
  inspectMetaBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inspectMetaText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },

  // VIDEO VIEWFINDER CARD & WATERMARK
  videoPlayerCard: {
    backgroundColor: '#090e17',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 4,
  },
  videoTopWatermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandWatermarkPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoCenterBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  recordingAnimBox: {
    alignItems: 'center',
    gap: 6,
  },
  recordingPulseCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingTimerBig: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ef4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  recordingPromptSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  attachedVideoBox: {
    alignItems: 'center',
    gap: 8,
  },
  videoPlayCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  videoPlayLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#f8fafc',
  },
  videoBottomWatermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  videoWatermarkCrop: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  videoWatermarkVerified: {
    fontSize: 9,
    color: '#4ade80',
    fontWeight: '700',
    marginTop: 1,
  },
  videoWatermarkDateTime: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fde047',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  videoWatermarkLive: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ef4444',
    marginTop: 1,
    letterSpacing: 0.5,
  },

  minPhotosRequirementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 10,
  },
  minPhotosRequirementText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
    flex: 1,
  },
  minPhotosSatisfiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 10,
  },
  minPhotosSatisfiedText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '700',
    flex: 1,
  },

  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  footerCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  footerSaveBtn: {
    flex: 1.8,
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 8,
  },
  footerSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // FULL-SCREEN INSPECTION WATERMARK STYLES
  inspectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  inspectCard: {
    width: '100%',
    maxWidth: 580,
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
  inspectImageContainer: {
    position: 'relative',
    width: '100%',
    height: 380,
    backgroundColor: '#020617',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  inspectImage: {
    width: '100%',
    height: '100%',
  },
  inspectTopWatermark: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inspectLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveDotRedLarge: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ffffff',
  },
  inspectLiveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inspectBrandBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inspectBrandLogo: {
    width: 95,
    height: 22,
  },
  inspectBottomWatermark: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  inspectCropName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  inspectVerifiedStamp: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4ade80',
  },
  inspectDateTime: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#fde047',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inspectGpsReady: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 0.5,
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
  activeCycleBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  activeCycleTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803d',
  },
  activeDaysPill: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeDaysPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  activeCycleDesc: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  openActivitiesLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    marginTop: 2,
  },
  openActivitiesLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  expiredArchiveBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  expiredArchiveTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
  },
  expiredArchiveDesc: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 15,
  },
  openArchiveLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    marginTop: 2,
  },
  openArchiveLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  recordOptionCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
  },
  recordCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  recordCheckboxChecked: {
    backgroundColor: '#16a34a',
  },
  recordOptionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#14532d',
  },
  recordOptionDesc: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  summaryStripRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalProgressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(22, 163, 74, 0.16)',
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  stepTagGreen: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  stepTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  archiveIntroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
  },
  archiveIntroTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  archiveIntroSub: {
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 15,
    marginTop: 2,
  },
  emptyArchiveCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 26,
    alignItems: 'center',
    gap: 6,
  },
  emptyArchiveTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyArchiveSub: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 16,
  },
  archiveBatchCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  archiveBatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  archiveBatchDate: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  archiveBadgeActive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  archiveBadgeActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  archiveBadgePast: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  archiveBadgePastText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
});
