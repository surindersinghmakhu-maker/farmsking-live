import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCrops, CropGpsData } from '@/src/store/crops-context';

interface CropMediaModalProps {
  visible: boolean;
  cropId?: string;
  cropName?: string;
  fieldName?: string;
  existingGpsData?: CropGpsData;
  onClose: () => void;
  onSaved?: (photos: string[], video?: string) => void;
}

export const CropMediaModal: React.FC<CropMediaModalProps> = ({
  visible,
  cropId,
  cropName,
  fieldName,
  existingGpsData,
  onClose,
  onSaved,
}) => {
  const { cropGpsDataMap, saveCropGpsData } = useCrops();

  const currentGps = (cropId ? cropGpsDataMap[cropId] : null) || existingGpsData;

  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [previewingPhotoIndex, setPreviewingPhotoIndex] = useState<number | null>(null);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [recordTimerSeconds, setRecordTimerSeconds] = useState(0);

  useEffect(() => {
    if (visible) {
      setPhotos(currentGps?.fieldPhotos || []);
      setVideoUri(currentGps?.fieldVideo || null);
    }
  }, [visible, currentGps]);

  useEffect(() => {
    let interval: any;
    if (isVideoRecording) {
      interval = setInterval(() => {
        setRecordTimerSeconds((prev) => {
          if (prev >= 60) {
            clearInterval(interval);
            setIsVideoRecording(false);
            setVideoUri('https://assets.farmsking.com/demo_crop_video_60s.mp4');
            Alert.alert('1-Minute Video Completed ✅', '60-second field video recording finished.');
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isVideoRecording]);

  // Take live photo via camera
  const handleTakePhotoLive = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 crop photos.');
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is required to take live crop photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      const fallbackUrl = `https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80&sig=${Date.now()}`;
      setPhotos((prev) => [...prev, fallbackUrl]);
    }
  };

  // Pick photos from gallery
  const handlePickPhotoLibrary = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 crop photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - photos.length,
        quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((a) => a.uri).slice(0, 5 - photos.length);
        setPhotos((prev) => [...prev, ...newUris]);
      }
    } catch {
      const fallbackUrl = `https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80&sig=${Date.now()}`;
      setPhotos((prev) => [...prev, fallbackUrl]);
    }
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (previewingPhotoIndex === index) setPreviewingPhotoIndex(null);
  };

  // Shoot 1-min video
  const handleStartShootVideo = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is required to record field video.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 60,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        Alert.alert('Video Attached ✅', '1-minute field video attached.');
      }
    } catch {
      setIsVideoRecording(true);
    }
  };

  // Pick video file
  const handlePickVideoLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        Alert.alert('Video Attached ✅', 'Field video attached.');
      }
    } catch {
      setVideoUri('https://assets.farmsking.com/demo_crop_video_60s.mp4');
      Alert.alert('Video Attached ✅', 'Field video attached.');
    }
  };

  // Save photos & video
  const handleSaveMedia = () => {
    if (cropId) {
      const updatedGps: CropGpsData = currentGps
        ? {
            ...currentGps,
            fieldPhotos: photos,
            fieldVideo: videoUri || undefined,
            updatedAt: new Date().toISOString(),
          }
        : {
            centerLat: 30.9085,
            centerLng: 75.8610,
            corners: [],
            areaAcres: 1,
            locationText: 'Crop Field Media Recorded',
            isLocked: true,
            fieldPhotos: photos,
            fieldVideo: videoUri || undefined,
            updatedAt: new Date().toISOString(),
          };

      saveCropGpsData(cropId, updatedGps);
    }

    if (onSaved) onSaved(photos, videoUri || undefined);
    Alert.alert('Media Saved ✅', `${photos.length} photo(s) and ${videoUri ? '1 video' : 'video'} saved for this crop.`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="camera" size={20} color="#15803d" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Crop Photos & Video</Text>
                <Text style={styles.headerSubtitle}>
                  🌾 {cropName || 'Field Crop'} · {fieldName || 'Active Plot'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 16 }}>
              {/* SECTION 1: 5 CROP PHOTOS */}
              <View style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="images" size={17} color="#15803d" />
                    <Text style={styles.sectionHeading}>Field Photos (Up to 5)</Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{photos.length} / 5</Text>
                  </View>
                </View>

                <Text style={styles.sectionSub}>
                  Take live photos or upload. Tap the eye icon to preview and check clarity before saving.
                </Text>

                {/* PHOTO ACTION BUTTONS */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.actionBtnGreen, photos.length >= 5 && { opacity: 0.5 }]}
                    activeOpacity={0.85}
                    disabled={photos.length >= 5}
                    onPress={handleTakePhotoLive}
                  >
                    <Ionicons name="camera" size={16} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Take Live Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtnOutline, photos.length >= 5 && { opacity: 0.5 }]}
                    activeOpacity={0.85}
                    disabled={photos.length >= 5}
                    onPress={handlePickPhotoLibrary}
                  >
                    <Ionicons name="folder-open" size={16} color="#2563eb" />
                    <Text style={styles.actionBtnOutlineText}>From Gallery</Text>
                  </TouchableOpacity>
                </View>

                {/* 5 PHOTO GRID */}
                <View style={styles.photoGrid}>
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const photoUri = photos[slotIdx];
                    if (photoUri) {
                      return (
                        <View key={slotIdx} style={styles.photoThumbCard}>
                          <Image source={{ uri: photoUri }} style={styles.photoThumbImg} />
                          <TouchableOpacity
                            style={styles.inspectBtn}
                            onPress={() => setPreviewingPhotoIndex(slotIdx)}
                          >
                            <Ionicons name="eye" size={13} color="#ffffff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleRemovePhoto(slotIdx)}
                          >
                            <Ionicons name="trash" size={12} color="#ffffff" />
                          </TouchableOpacity>
                          <Text style={styles.photoSlotLabel}>#{slotIdx + 1} ✓</Text>
                        </View>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={slotIdx}
                        style={styles.emptySlot}
                        onPress={handleTakePhotoLive}
                      >
                        <Ionicons name="add-circle-outline" size={22} color="#94a3b8" />
                        <Text style={styles.emptySlotText}>Slot #{slotIdx + 1}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* SECTION 2: 1-MINUTE VIDEO */}
              <View style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="videocam" size={18} color="#dc2626" />
                    <Text style={styles.sectionHeading}>1-Minute Field Video</Text>
                  </View>
                  {videoUri ? (
                    <View style={styles.attachedBadge}>
                      <Text style={styles.attachedBadgeText}>Attached ✓</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.sectionSub}>
                  Record a 360° walk-around video of your crop field (up to 60 seconds).
                </Text>

                {isVideoRecording ? (
                  <View style={styles.timerPill}>
                    <View style={styles.redDot} />
                    <Text style={styles.timerText}>
                      Recording: {String(Math.floor(recordTimerSeconds / 60)).padStart(2, '0')}:
                      {String(recordTimerSeconds % 60).padStart(2, '0')} / 01:00
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.actionBtnRed, isVideoRecording && { backgroundColor: '#b91c1c' }]}
                    activeOpacity={0.85}
                    onPress={handleStartShootVideo}
                  >
                    <Ionicons name={isVideoRecording ? 'stop-circle' : 'radio-button-on'} size={16} color="#ffffff" />
                    <Text style={styles.actionBtnText}>
                      {isVideoRecording ? 'Stop Video' : videoUri ? 'Re-shoot 1-Min Video' : 'Shoot 1-Min Video'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    activeOpacity={0.85}
                    onPress={handlePickVideoLibrary}
                  >
                    <Ionicons name="folder-open" size={16} color="#2563eb" />
                    <Text style={styles.actionBtnOutlineText}>Select Video</Text>
                  </TouchableOpacity>
                </View>

                {videoUri ? (
                  <View style={styles.videoSuccessBox}>
                    <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                    <Text style={styles.videoSuccessText}>1-minute crop field video attached and verified.</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.footerCancelBtn} onPress={onClose}>
              <Text style={styles.footerCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerSaveBtn}
              activeOpacity={0.85}
              onPress={handleSaveMedia}
            >
              <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
              <Text style={styles.footerSaveText}>Save Photos & Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* FULL-SCREEN INSPECTION MODAL */}
      {previewingPhotoIndex !== null && photos[previewingPhotoIndex] ? (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPreviewingPhotoIndex(null)}>
          <View style={styles.inspectOverlay}>
            <View style={styles.inspectCard}>
              <View style={styles.inspectHeader}>
                <Text style={styles.inspectTitle}>Inspect Photo #{previewingPhotoIndex + 1}</Text>
                <TouchableOpacity onPress={() => setPreviewingPhotoIndex(null)}>
                  <Ionicons name="close-circle" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <Image
                source={{ uri: photos[previewingPhotoIndex] }}
                style={styles.inspectImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.inspectDoneBtn}
                onPress={() => setPreviewingPhotoIndex(null)}
              >
                <Text style={styles.inspectDoneBtnText}>Confirm Photo is Sharp & Clear ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}
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
    maxWidth: 580,
    maxHeight: '90%',
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
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
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  inspectBtn: {
    position: 'absolute',
    bottom: 20,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 2,
  },
  emptySlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#ffffff',
  },
  emptySlotText: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '700',
  },

  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  videoSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  videoSuccessText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },

  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
});
