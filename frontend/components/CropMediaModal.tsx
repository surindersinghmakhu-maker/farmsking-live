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
import { FONT, RADIUS } from '@/constants/theme';
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
  downloadCropPhoto,
  fetchCropMediaFromStore,
  fetchCropRemarkFromStore,
  formatMediaTimestamp,
  getCalendarWeekRange,
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
  const [slotPickerTarget, setSlotPickerTarget] = useState<number | null>(null);
  const [previewingVideo, setPreviewingVideo] = useState(false);
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
      setPreviewingVideo(false);
      setSlotPickerTarget(null);
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

  // Take live photo via real camera (tagged LIVE; allowed for slots 1 to 5)
  const handleTakePhotoLive = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can save a maximum of 5 crop photos in Crop Gallery.');
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
        setPhotos((prev) => [...prev, stamped].slice(0, 5));
        setPhotoSources((prev) => ({ ...prev, [stamped]: 'LIVE' }));
      }
    } catch {
      setErrorMessage('Camera could not open on this device. Use "From Gallery" for top 3 photos.');
    }
  };

  // Pick photos from gallery (tagged UPLOADED; allowed ONLY for top 3 slots)
  const handlePickPhotoLibrary = async () => {
    if (photos.length >= 3) {
      Alert.alert(
        'Live Camera Required',
        'Gallery upload is only allowed for the first 3 photos (Slots 1 to 3). Photos 4 and 5 must strictly be captured live on the field via camera.',
      );
      return;
    }
    const maxAllowedFromGallery = 3 - photos.length;
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
        selectionLimit: maxAllowedFromGallery,
        quality: 0.85,
      });
      if (!result.canceled && result.assets) {
        const stampedList = await Promise.all(
          result.assets.slice(0, maxAllowedFromGallery).map((a) => stampGalleryUri(a.uri)),
        );
        setPhotos((prev) => [...prev, ...stampedList].slice(0, 3));
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
            picked.slice(0, maxAllowedFromGallery).map((u) => stampGalleryUri(u)),
          );
          setPhotos((prev) => [...prev, ...stampedList].slice(0, 3));
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

  // Confirm and delete photo with auto-sync if already saved
  const confirmDeletePhoto = (index: number) => {
    const photoNumber = index + 1;
    const msg = `Are you sure you want to delete Photo #${photoNumber} from Crop Gallery?`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(msg);
      if (confirmed) {
        handleRemovePhoto(index);
      }
      return;
    }

    Alert.alert(
      'Delete Photo',
      msg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleRemovePhoto(index),
        },
      ],
      { cancelable: true },
    );
  };

  // Remove photo with optional immediate store sync
  const handleRemovePhoto = async (index: number) => {
    const removedUri = photos[index];
    if (!removedUri) return;
    const nextPhotos = photos.filter((_, i) => i !== index);
    setPhotos(nextPhotos);
    setPhotoSources((prev) => {
      const next = { ...prev };
      delete next[removedUri];
      return next;
    });
    if (previewingPhotoIndex === index) {
      setPreviewingPhotoIndex(null);
    } else if (previewingPhotoIndex !== null && previewingPhotoIndex > index) {
      setPreviewingPhotoIndex(previewingPhotoIndex - 1);
    }

    // If active cycle is saved in crop GPS data, sync the deletion to storage immediately
    if (cropId && (isActiveCycleLocked || currentGps?.fieldPhotos?.includes(removedUri))) {
      try {
        const nowIso = new Date().toISOString();
        if (currentGps) {
          const updatedGps: CropGpsData = {
            ...currentGps,
            fieldPhotos: nextPhotos,
            updatedAt: nowIso,
          };
          saveCropGpsData(cropId, updatedGps);
        }
        await deleteRemovedMediaStoreRecords(
          [removedUri],
          [],
          recordsByUrlRef.current,
        );
        onSaved?.(nextPhotos, videoUri || undefined);
      } catch (err) {
        console.warn('[CropMediaModal] Failed to sync photo deletion:', err);
      }
    }
  };

  // Confirm and delete live field video
  const confirmDeleteVideo = () => {
    const msg = 'Are you sure you want to delete the Live Video from Crop Gallery?';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(msg)) {
        setVideoUri(null);
        setPreviewingVideo(false);
      }
      return;
    }
    Alert.alert(
      'Delete Live Video',
      msg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVideoUri(null);
            setPreviewingVideo(false);
          },
        },
      ],
      { cancelable: true },
    );
  };

  // Shoot live video ONLY (camera capture; gallery video uploads disabled)
  const handleStartShootVideo = async () => {
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
      const currentCalWeek = getCalendarWeekRange();
      const expiresIso = currentCalWeek.weekEndSaturday.toISOString();

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
        const effectiveExpiry = (isActiveCycleLocked && expiresAtIso) ? expiresAtIso : expiresIso;
        const updatedGps: CropGpsData = currentGps
          ? {
              ...currentGps,
              fieldPhotos: uploadedPhotoUrls,
              fieldVideo: finalVideoUrl,
              fieldAudio: finalAudioUrl,
              farmerRemarks: trimmedRemarks || undefined,
              mediaCycleSavedAt: nowIso,
              mediaDisplayExpiresAt: effectiveExpiry,
              saveMediaToCropRecord: saveToCropRecord,
              updatedAt: nowIso,
            }
          : {
              centerLat: 30.9085,
              centerLng: 75.8610,
              corners: [],
              areaAcres: 1,
              locationText: 'Crop Gallery Recorded',
              isLocked: false,
              fieldPhotos: uploadedPhotoUrls,
              fieldVideo: finalVideoUrl,
              fieldAudio: finalAudioUrl,
              farmerRemarks: trimmedRemarks || undefined,
              mediaCycleSavedAt: nowIso,
              mediaDisplayExpiresAt: effectiveExpiry,
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
              title: isActiveCycleLocked && daysRemaining > 0 ? 'Crop Gallery Updated' : 'Crop Gallery Saved',
              date: formatMediaTimestamp(nowIso).dateStr,
              quantity: summaryParts.join(', '),
              notes: trimmedRemarks
                ? `Remarks: "${trimmedRemarks}". Display window: ${daysRemaining > 0 ? daysRemaining : MEDIA_DISPLAY_DAYS} days remaining (archived permanently in Crop Activities thereafter).`
                : `Saved ${summaryParts.join(', ')} to Crop Gallery (${daysRemaining > 0 ? daysRemaining : MEDIA_DISPLAY_DAYS}-day active display + permanent archive in Crop Activities).`,
            });
          } catch {
            // Activity note failure should not block media save confirmation
          }
        }
      }

      if (onSaved) onSaved(uploadedPhotoUrls, finalVideoUrl);
      const isCycleUpdate = Boolean(isActiveCycleLocked && daysRemaining > 0);
      Alert.alert(
        isCycleUpdate ? 'Crop Gallery Updated' : 'Saved to Crop Gallery (7-Day Display)',
        isCycleUpdate
          ? `Crop Gallery updated with ${uploadedPhotoUrls.length} photo(s)${finalVideoUrl ? ', 1 live video' : ''}${finalAudioUrl ? ', 1 voice note' : ''}${trimmedRemarks ? ', and written remarks' : ''}. Active on display for ${daysRemaining} more day(s).`
          : `${uploadedPhotoUrls.length} photo(s)${finalVideoUrl ? ', 1 live video' : ''}${finalAudioUrl ? ', 1 voice note' : ''}${trimmedRemarks ? ', and written remarks' : ''} saved to Crop Gallery (7-day active display + permanent archive in Crop Activities).`,
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

  const currentCalWeek = getCalendarWeekRange();
  const dayOfCycle = currentCalWeek.dayNumber; // 1 to 7 (Sunday = 1, Saturday = 7)
  const cycleProgressPct = Math.min(100, Math.max(14, Math.round((dayOfCycle / MEDIA_DISPLAY_DAYS) * 100)));

  const renderSlotCard = (slotIdx: number) => {
    const photoUri = photos[slotIdx];
    const isTop3 = slotIdx < 3;
    if (photoUri) {
      const resolvedPhotoUri = resolveCropMediaDisplayUri(photoUri) || photoUri;
      const detectedSource = photoSources[photoUri] || detectMediaCaptureSource(photoUri);
      const isLive = detectedSource === 'LIVE';

      return (
        <View key={slotIdx} style={styles.photoThumbCard}>
          <TouchableOpacity
            style={styles.photoImageWrap}
            activeOpacity={0.9}
            onPress={() => setPreviewingPhotoIndex(slotIdx)}
          >
            <Image source={{ uri: resolvedPhotoUri }} style={styles.photoThumbImg} resizeMode="cover" />
            <View style={[styles.cardSourceBadge, isLive ? styles.cardSourceBadgeLive : styles.cardSourceBadgeUploaded]}>
              <Ionicons name={isLive ? 'camera' : 'folder-open'} size={9} color="#ffffff" />
              <Text style={styles.cardSourceBadgeText}>{isLive ? 'LIVE' : 'UP'}</Text>
            </View>
            <TouchableOpacity
              style={styles.cardCornerDeleteBtn}
              activeOpacity={0.8}
              onPress={() => confirmDeletePhoto(slotIdx)}
              accessibilityLabel={`Delete photo ${slotIdx + 1}`}
            >
              <Ionicons name="trash" size={11} color="#ffffff" />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.photoActionFooter}>
            <Text style={styles.photoSlotCaption}>Photo #{slotIdx + 1}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity
                style={styles.inspectBtn}
                onPress={() => setPreviewingPhotoIndex(slotIdx)}
                accessibilityLabel={`Inspect Photo ${slotIdx + 1}`}
              >
                <Ionicons name="eye" size={11} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.downloadSmallBtn}
                onPress={() =>
                  downloadCropPhoto(
                    resolvedPhotoUri,
                    `crop_${cropName.toLowerCase().replace(/\s+/g, '_')}_p${slotIdx + 1}.jpg`,
                  )
                }
                accessibilityLabel={`Download Photo ${slotIdx + 1}`}
              >
                <Ionicons name="download-outline" size={11} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDeletePhoto(slotIdx)}
                accessibilityLabel={`Delete Photo ${slotIdx + 1}`}
              >
                <Ionicons name="trash" size={11} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    if (isTop3) {
      return (
        <TouchableOpacity
          key={slotIdx}
          style={[styles.emptySlot, styles.emptySlotTop3]}
          activeOpacity={0.8}
          onPress={() => setSlotPickerTarget(slotIdx)}
          accessibilityLabel={`Add photo slot ${slotIdx + 1}`}
        >
          <View style={[styles.emptySlotCircle, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="add" size={15} color="#15803d" />
          </View>
          <Text style={styles.emptySlotText}>+ Photo {slotIdx + 1}</Text>
          <View style={styles.slotPermitPillGreen}>
            <Text style={styles.slotPermitPillGreenText}>Live / Gallery</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={slotIdx}
        style={[styles.emptySlot, styles.emptySlotBottom3]}
        activeOpacity={0.8}
        onPress={handleTakePhotoLive}
        accessibilityLabel={`Take live photo slot ${slotIdx + 1}`}
      >
        <View style={[styles.emptySlotCircle, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="camera" size={14} color="#b45309" />
        </View>
        <Text style={[styles.emptySlotText, { color: '#92400e' }]}>+ Photo {slotIdx + 1}</Text>
        <View style={styles.slotPermitPillAmber}>
          <Ionicons name="lock-closed" size={8} color="#b45309" />
          <Text style={styles.slotPermitPillAmberText}>Live Only</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVideoSlotCard = () => {
    if (videoUri) {
      return (
        <View key="slot-video" style={[styles.photoThumbCard, styles.videoThumbCardBorder]}>
          <TouchableOpacity
            style={styles.photoImageWrap}
            activeOpacity={0.9}
            onPress={() => setPreviewingVideo(true)}
            accessibilityLabel="Play live recorded video"
          >
            <View style={styles.videoCardPlaceholder}>
              <View style={styles.videoPlayCircle}>
                <Ionicons name="play" size={18} color="#ffffff" style={{ marginLeft: 2 }} />
              </View>
              <Text style={styles.videoThumbPreviewText}>Live Video</Text>
            </View>
            <View style={[styles.cardSourceBadge, styles.cardSourceBadgeVideo]}>
              <Ionicons name="videocam" size={9} color="#ffffff" />
              <Text style={styles.cardSourceBadgeText}>LIVE VIDEO</Text>
            </View>
            <TouchableOpacity
              style={styles.cardCornerDeleteBtn}
              activeOpacity={0.8}
              onPress={confirmDeleteVideo}
              accessibilityLabel="Delete live video"
            >
              <Ionicons name="trash" size={11} color="#ffffff" />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.photoActionFooter}>
            <Text style={[styles.photoSlotCaption, { color: '#dc2626' }]}>Video #6</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity
                style={[styles.inspectBtn, { backgroundColor: '#dc2626', borderColor: '#b91c1c' }]}
                onPress={() => setPreviewingVideo(true)}
                accessibilityLabel="Play live video"
              >
                <Ionicons name="play" size={11} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reRecordSmallBtn}
                onPress={handleStartShootVideo}
                accessibilityLabel="Re-record live video"
              >
                <Ionicons name="radio-button-on" size={11} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={confirmDeleteVideo}
                accessibilityLabel="Delete live video"
              >
                <Ionicons name="trash" size={11} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key="slot-video-empty"
        style={[styles.emptySlot, styles.emptySlotVideo]}
        activeOpacity={0.8}
        onPress={handleStartShootVideo}
        accessibilityLabel="Record live field video"
      >
        <View style={[styles.emptySlotCircle, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="videocam" size={15} color="#dc2626" />
        </View>
        <Text style={[styles.emptySlotText, { color: '#dc2626' }]}>+ Live Video</Text>
        <View style={styles.slotPermitPillRed}>
          <Ionicons name="lock-closed" size={8} color="#dc2626" />
          <Text style={styles.slotPermitPillRedText}>Live (60s)</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* PREMIUM DARK OBSIDIAN HEADER + MODULE TABS */}
          <LinearGradient
            colors={['#090e17', '#0f172a', '#062817']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* STATUTORY & ISO COMPLIANCE STRIP */}
            <View style={styles.modalCorporateStrip}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                <Ionicons name="shield-checkmark" size={11} color="#4ade80" />
                <Text style={styles.modalCorporateText} numberOfLines={1}>
                  FARMSKING · ISO 9001 & ISO 27001
                </Text>
              </View>
              <View style={styles.modalIcarBadge}>
                <Text style={styles.modalIcarText}>ICAR ALIGNED</Text>
              </View>
            </View>

            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 }}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="images" size={20} color="#4ade80" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={styles.headerTitle}>Crop Gallery</Text>
                    <View
                      style={[
                        styles.headerStatusPill,
                        daysRemaining > 0
                          ? { backgroundColor: 'rgba(22, 163, 74, 0.25)', borderColor: 'rgba(74, 222, 128, 0.5)' }
                          : { backgroundColor: 'rgba(245, 158, 11, 0.22)', borderColor: 'rgba(251, 191, 36, 0.45)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerStatusPillText,
                          { color: daysRemaining > 0 ? '#4ade80' : '#fbbf24' },
                        ]}
                      >
                        {daysRemaining > 0
                          ? `ACTIVE · ${daysRemaining}D LEFT`
                          : 'NEW UPLOAD'}
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

            {/* TAB SWITCHER */}
            <View style={styles.modalTabRow}>
              <TouchableOpacity
                style={[styles.modalTabBtn, activeTab === 'CURRENT' && styles.modalTabBtnActive]}
                activeOpacity={0.85}
                onPress={() => setActiveTab('CURRENT')}
              >
                <Ionicons
                  name={daysRemaining > 0 ? 'eye' : 'add-circle'}
                  size={14}
                  color={activeTab === 'CURRENT' ? '#04160c' : '#cbd5e1'}
                />
                <Text
                  style={[
                    styles.modalTabText,
                    activeTab === 'CURRENT' && styles.modalTabTextActive,
                  ]}
                >
                  {daysRemaining > 0 ? 'Active (7 Days)' : 'New Upload'}
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
                  Past Archive ({pastBatches.length})
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 10 }}>
              {isLoadingMedia && (
                <View style={styles.loadingMediaBanner}>
                  <ActivityIndicator size="small" color="#15803d" />
                  <Text style={styles.loadingMediaText}>Loading gallery...</Text>
                </View>
              )}

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={15} color="#dc2626" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {activeTab === 'CURRENT' ? (
                <>
                  {isActiveCycleLocked && (
                    <View style={styles.activeCycleCompactStrip}>
                      <Ionicons name="time-outline" size={13} color="#15803d" />
                      <Text style={styles.activeCycleCompactText}>
                        Day {dayOfCycle}/7 ({currentCalWeek.dayName}) · {currentCalWeek.daysRemaining} days left
                      </Text>
                      <View style={styles.activeCycleMiniBar}>
                        <View style={[styles.activeCycleMiniFill, { width: `${cycleProgressPct}%` }]} />
                      </View>
                    </View>
                  )}

                  {!isActiveCycleLocked && hasExpiredArchive && (
                    <View style={styles.expiredArchiveCompactStrip}>
                      <Ionicons name="checkmark-done-circle" size={13} color="#b45309" />
                      <Text style={styles.expiredArchiveCompactText}>Previous cycle complete · Ready for new upload</Text>
                      <TouchableOpacity onPress={() => setActiveTab('ARCHIVE')}>
                        <Text style={styles.expiredArchiveLinkText}>Past ({pastBatches.length}) →</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* STEP 1: FIELD PHOTOS & LIVE VIDEO (COMPACT 3x2 GRID) */}
                  <View style={styles.sectionCard}>
                    <View style={styles.mediaCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="images" size={15} color="#15803d" />
                        <Text style={styles.sectionHeading}>Field Photos & Live Video</Text>
                      </View>
                      <Text style={styles.mediaHeaderCount}>
                        {photos.length}/5 Photos · {videoUri ? '1' : '0'}/1 Video
                      </Text>
                    </View>

                    {/* UNIFIED 6-SLOT COMPACT GRID */}
                    <View style={styles.photoGrid}>
                      {[0, 1, 2, 3, 4].map(renderSlotCard)}
                      {renderVideoSlotCard()}
                    </View>
                  </View>

                  {/* STEP 2: VOICE NOTE & WRITTEN REMARKS */}
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
                    readOnly={false}
                  />

                  {/* COMPACT 1-LINE SAVE TO GALLERY OPTION */}
                  <TouchableOpacity
                    style={styles.compactSaveCheckRow}
                    activeOpacity={0.85}
                    onPress={() => setSaveToCropRecord((prev) => !prev)}
                  >
                    <View
                      style={[
                        styles.compactCheckbox,
                        saveToCropRecord && styles.compactCheckboxChecked,
                      ]}
                    >
                      {saveToCropRecord ? (
                        <Ionicons name="checkmark" size={11} color="#ffffff" />
                      ) : null}
                    </View>
                    <Text style={styles.compactSaveCheckText}>
                      {isActiveCycleLocked && daysRemaining > 0
                        ? `Keep in Active 7-Day Gallery (${daysRemaining}d left)`
                        : 'Save to 7-Day Active Crop Gallery'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* TAB 2: PAST CROP GALLERY (PERMANENT ARCHIVE) */
                <View style={{ gap: 10 }}>
                  {pastBatches.length === 0 ? (
                    <View style={styles.emptyArchiveCard}>
                      <Ionicons name="folder-open-outline" size={26} color="#94a3b8" />
                      <Text style={styles.emptyArchiveTitle}>No Past Records</Text>
                    </View>
                  ) : (
                    pastBatches.map((batch) => (
                      <View key={batch.batchKey} style={styles.archiveBatchCard}>
                        <View style={styles.archiveBatchHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="calendar-outline" size={13} color="#475569" />
                            <Text style={styles.archiveBatchDate}>Saved {batch.dateLabel}</Text>
                          </View>
                          {batch.isActiveDisplay ? (
                            <View style={styles.archiveBadgeActive}>
                              <Text style={styles.archiveBadgeActiveText}>
                                Active · {batch.daysRemaining}d left
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.archiveBadgePast}>
                              <Text style={styles.archiveBadgePastText}>
                                Archived
                              </Text>
                            </View>
                          )}
                        </View>

                        {batch.photos.length > 0 ? (
                          <View style={styles.archivePhotoStrip}>
                            {batch.photos.map((photoItem, idx) => {
                              const resolvedP =
                                resolveCropMediaDisplayUri(photoItem.url) || photoItem.url;
                              const isLive = photoItem.source === 'LIVE';
                              return (
                                <TouchableOpacity
                                  key={`${batch.batchKey}_p${idx}`}
                                  style={styles.archiveThumbCard}
                                  activeOpacity={0.85}
                                  onPress={() =>
                                    setArchivePreviewPhoto({
                                      url: resolvedP,
                                      source: photoItem.source,
                                      label: `Photo #${idx + 1} · ${batch.dateLabel}`,
                                    })
                                  }
                                  accessibilityLabel={`Inspect Archived Photo ${idx + 1}`}
                                >
                                  <Image
                                    source={{ uri: resolvedP }}
                                    style={styles.archiveThumbImg}
                                    resizeMode="cover"
                                  />
                                  <View style={styles.archiveThumbCornerBadge}>
                                    <Text style={styles.archiveThumbCornerText}>#{idx + 1}</Text>
                                  </View>
                                  <View style={[styles.archiveSourceTag, isLive ? styles.archiveSourceTagLive : styles.archiveSourceTagUpload]}>
                                    <Text style={styles.archiveSourceTagText}>{isLive ? 'LIVE' : 'UP'}</Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : (
                          <View style={styles.noVideoBox}>
                            <Ionicons name="image-outline" size={18} color="#94a3b8" />
                            <Text style={styles.noVideoText}>No photos in this record</Text>
                          </View>
                        )}

                        {batch.video ? (
                          <CropVideoPlayer
                            videoUri={batch.video}
                            cropName={cropName}
                            fieldName={fieldName}
                            farmerName={effectiveFarmerName}
                            recordedAt={batch.savedAt}
                            height={180}
                            compact
                          />
                        ) : (
                          <View style={styles.archivedVideosPurgedTag}>
                            <Ionicons name="videocam-off-outline" size={11} color="#64748b" />
                            <Text style={styles.archivedVideosPurgedText}>
                              Field videos purged on completion · Live photos preserved
                            </Text>
                          </View>
                        )}

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
              <TouchableOpacity
                style={styles.footerSaveBtn}
                activeOpacity={0.85}
                onPress={() => setActiveTab('CURRENT')}
              >
                <Ionicons name={daysRemaining > 0 ? 'eye' : 'add-circle'} size={16} color="#ffffff" />
                <Text style={styles.footerSaveText}>
                  {daysRemaining > 0 ? 'Back to Active' : 'New Upload'}
                </Text>
              </TouchableOpacity>
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
                    ? 'Saving...'
                    : daysRemaining > 0
                      ? `Update Gallery (${daysRemaining}d Left)`
                      : 'Save 7-Day Gallery'}
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

              <View style={styles.inspectFooterRow}>
                {previewingPhotoIndex !== null && !archivePreviewPhoto && (
                  <TouchableOpacity
                    style={styles.inspectDeleteBtn}
                    activeOpacity={0.85}
                    onPress={() => confirmDeletePhoto(previewingPhotoIndex)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ffffff" />
                    <Text style={styles.inspectDeleteBtnText}>Delete Photo</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.inspectDownloadBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    const urlToDownload = archivePreviewPhoto
                      ? archivePreviewPhoto.url
                      : resolveCropMediaDisplayUri(photos[previewingPhotoIndex ?? 0]) ||
                        photos[previewingPhotoIndex ?? 0];
                    downloadCropPhoto(
                      urlToDownload,
                      `farmsking_${cropName.toLowerCase().replace(/\s+/g, '_')}_photo.jpg`,
                    );
                  }}
                >
                  <Ionicons name="download-outline" size={16} color="#ffffff" />
                  <Text style={styles.inspectDownloadBtnText}>Download Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inspectDoneBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    setPreviewingPhotoIndex(null);
                    setArchivePreviewPhoto(null);
                  }}
                >
                  <Text style={styles.inspectDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* SLOT PICKER MODAL (FOR TOP 3 SLOTS: LIVE OR GALLERY) */}
      <Modal
        visible={slotPickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSlotPickerTarget(null)}
      >
        <View style={styles.chooserOverlay}>
          <View style={styles.chooserCard}>
            <View style={styles.chooserHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="add-circle" size={22} color="#15803d" />
                <Text style={styles.chooserTitle}>
                  Add Photo #{slotPickerTarget !== null ? slotPickerTarget + 1 : 1}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSlotPickerTarget(null)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={styles.chooserOptionLive}
                activeOpacity={0.85}
                onPress={() => {
                  setSlotPickerTarget(null);
                  handleTakePhotoLive();
                }}
              >
                <View style={styles.chooserOptionIconLive}>
                  <Ionicons name="camera" size={20} color="#ffffff" />
                </View>
                <Text style={styles.chooserOptionTitle}>Take Live Photo</Text>
                <Ionicons name="chevron-forward" size={18} color="#15803d" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chooserOptionGallery}
                activeOpacity={0.85}
                onPress={() => {
                  setSlotPickerTarget(null);
                  handlePickPhotoLibrary();
                }}
              >
                <View style={styles.chooserOptionIconGallery}>
                  <Ionicons name="images" size={20} color="#ffffff" />
                </View>
                <Text style={styles.chooserOptionTitle}>Choose From Gallery</Text>
                <Ionicons name="chevron-forward" size={18} color="#2563eb" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL VIDEO PLAYER MODAL */}
      {previewingVideo && videoUri ? (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewingVideo(false)}
        >
          <View style={styles.inspectOverlay}>
            <View style={[styles.inspectCard, { maxWidth: 540 }]}>
              {/* CLEAN EXECUTIVE HEADER */}
              <View style={styles.videoModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={styles.videoModalLiveBadge}>
                    <View style={styles.videoModalLiveDot} />
                    <Text style={styles.videoModalLiveText}>LIVE VIDEO</Text>
                  </View>
                  <Text style={styles.videoModalTitle} numberOfLines={1}>
                    {cropName} · {fieldName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPreviewingVideo(false)} style={styles.videoModalCloseBtn}>
                  <Ionicons name="close" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              </View>

              {/* VIDEO VIEWPORT IN CLEAN MODE */}
              <View style={styles.videoPlayerContainer}>
                <CropVideoPlayer
                  videoUri={videoUri}
                  cropName={cropName}
                  fieldName={fieldName}
                  farmerName={effectiveFarmerName}
                  recordedAt={videoRecordedAt}
                  height={300}
                  cleanMode={true}
                />
              </View>

              {/* BALANCED 3-BUTTON FOOTER ROW */}
              <View style={styles.videoModalFooterRow}>
                <TouchableOpacity
                  style={styles.videoFooterBtnReRecord}
                  activeOpacity={0.85}
                  onPress={() => {
                    setPreviewingVideo(false);
                    handleStartShootVideo();
                  }}
                >
                  <Ionicons name="radio-button-on" size={14} color="#ef4444" />
                  <Text style={styles.videoFooterBtnText}>Re-record</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.videoFooterBtnDelete}
                  activeOpacity={0.85}
                  onPress={confirmDeleteVideo}
                >
                  <Ionicons name="trash-outline" size={14} color="#ffffff" />
                  <Text style={styles.videoFooterBtnText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.videoFooterBtnDone}
                  activeOpacity={0.85}
                  onPress={() => setPreviewingVideo(false)}
                >
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                  <Text style={styles.videoFooterBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
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
          setPhotos((prev) => [...prev, stampedDataUrl].slice(0, 5));
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
    maxWidth: 840,
    maxHeight: '94%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 16,
  },
  modalCorporateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 6,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCorporateText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#86efac',
    letterSpacing: 0.3,
  },
  modalIcarBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.35)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  modalIcarText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#7dd3fc',
    letterSpacing: 0.4,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 222, 128, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  headerStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerStatusPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 1,
    fontWeight: '600',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTabRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalTabBtnActive: {
    backgroundColor: '#4ade80',
  },
  modalTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  modalTabTextActive: {
    color: '#04160c',
    fontWeight: '900',
  },

  sectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  mediaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  mediaHeaderCount: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  emptyPreviewBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#92400e',
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
    gap: 7,
  },
  photoThumbCard: {
    width: '31.6%',
    height: 106,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#090e17',
  },
  photoImageWrap: {
    width: '100%',
    height: 78,
    backgroundColor: '#090e17',
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  photoActionFooter: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  photoSlotCaption: {
    fontSize: 9.5,
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
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadSmallBtn: {
    backgroundColor: '#0284c7',
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: '31.6%',
    height: 106,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#86efac',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(22, 163, 74, 0.04)',
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  emptySlotCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
    marginBottom: 1,
  },
  emptySlotText: {
    fontSize: 10.5,
    color: '#15803d',
    fontWeight: '800',
  },
  emptySlotSub: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  noVideoBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderStyle: 'dashed',
    backgroundColor: '#fff5f5',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  noVideoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 2,
  },
  noVideoText: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '800',
  },
  noVideoSub: {
    fontSize: 10.5,
    color: '#7f1d1d',
    fontWeight: '500',
    textAlign: 'center',
  },
  inspectMetaBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
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
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  footerCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCancelText: {
    fontSize: 12.5,
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
    paddingVertical: 9,
    borderRadius: 8,
  },
  footerSaveText: {
    fontSize: 12.5,
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
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 2,
  },
  videoModalLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dc2626',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  videoModalLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  videoModalLiveText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  videoModalTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
    flex: 1,
  },
  videoModalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 4,
  },
  videoModalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  videoFooterBtnReRecord: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  videoFooterBtnDelete: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  videoFooterBtnDone: {
    flex: 1.2,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  videoFooterBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
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
  inspectFooterRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  inspectDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
  },
  inspectDownloadBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  inspectDoneBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectDoneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  institutionalTrustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 6,
  },
  institutionalTrustText: {
    flex: 1,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    lineHeight: 15,
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

  // Slot Groups & Badges
  slotGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  slotGroupTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  slotGroupBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  slotGroupBadgeGreenText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  slotGroupBadgeAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  slotGroupBadgeAmberText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#b45309',
  },

  // Card Badges & Delete Buttons
  cardSourceBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
    zIndex: 5,
  },
  cardSourceBadgeLive: {
    backgroundColor: '#16a34a',
  },
  cardSourceBadgeUploaded: {
    backgroundColor: '#2563eb',
  },
  cardSourceBadgeText: {
    fontSize: 8,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  cardCornerDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  emptySlotTop3: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  emptySlotBottom3: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  slotPermitPillGreen: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  slotPermitPillGreenText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  slotPermitPillAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  slotPermitPillAmberText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#b45309',
  },

  // Video Slot Card Styles (Slot #6)
  videoThumbCardBorder: {
    borderColor: '#fca5a5',
  },
  videoCardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#090e17',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  videoPlayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(220, 38, 38, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  videoThumbPreviewText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#fca5a5',
  },
  cardSourceBadgeVideo: {
    backgroundColor: '#dc2626',
  },
  reRecordSmallBtn: {
    backgroundColor: '#dc2626',
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotVideo: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
  },
  slotPermitPillRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  slotPermitPillRedText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#dc2626',
  },

  // Sleek 1-line Compact Banners & Options
  activeCycleCompactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeCycleCompactText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  activeCycleMiniBar: {
    width: 50,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    overflow: 'hidden',
  },
  activeCycleMiniFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  expiredArchiveCompactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  expiredArchiveCompactText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  expiredArchiveLinkText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#b45309',
    textDecorationLine: 'underline',
  },
  compactSaveCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  compactCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCheckboxChecked: {
    backgroundColor: '#16a34a',
  },
  compactSaveCheckText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },

  // Inspect Delete Button
  inspectDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  inspectDeleteBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // Slot Chooser Modal
  chooserOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  chooserCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  chooserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chooserTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  chooserSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 12,
  },
  chooserOptionLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 12,
  },
  chooserOptionGallery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
  },
  chooserOptionIconLive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooserOptionIconGallery: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooserOptionTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  chooserOptionDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },

  // Compact Past Gallery (Archive) Thumbnails
  archivePhotoStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  archiveThumbCard: {
    width: 74,
    height: 74,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#090e17',
    position: 'relative',
  },
  archiveThumbImg: {
    width: '100%',
    height: '100%',
  },
  archiveThumbCornerBadge: {
    position: 'absolute',
    top: 3,
    left: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  archiveThumbCornerText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  archiveSourceTag: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  archiveSourceTagLive: {
    backgroundColor: 'rgba(22, 163, 74, 0.92)',
  },
  archiveSourceTagUpload: {
    backgroundColor: 'rgba(37, 99, 235, 0.92)',
  },
  archiveSourceTagText: {
    fontSize: 8,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  archivedVideosPurgedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  archivedVideosPurgedText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
});
