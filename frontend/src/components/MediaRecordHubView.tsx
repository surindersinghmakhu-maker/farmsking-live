import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { RegisteredCropField, useCrops } from '@/src/store/crops-context';
import {
  buildCropActivityMediaBatches,
  computeDaysRemaining,
  CropMediaHistoryBatch,
  fetchCropMediaFromStore,
  fetchCropRemarkFromStore,
  formatMediaTimestamp,
  getCalendarWeekRange,
  isLocalGpsMediaActive,
  MEDIA_DISPLAY_DAYS,
  resolveCropMediaDisplayUri,
} from '@/src/utils/crop-media';

interface MediaRecordHubViewProps {
  headerComponent?: React.ReactNode;
  crops: RegisteredCropField[];
  refreshSignal?: number;
  onOpenMediaRecord: (crop: RegisteredCropField, initialTab?: 'CURRENT' | 'ARCHIVE') => void;
  onOpenCropActivities?: (crop: RegisteredCropField) => void;
}

interface CropRecordStatus {
  isActiveCycle: boolean;
  daysRemaining: number;
  expiresAt: string | null;
  activePhotos: string[];
  activePhotoCount: number;
  hasActiveVideo: boolean;
  activeVideoUrl: string | null;
  hasActiveAudio: boolean;
  hasActiveRemark: boolean;
  totalBatches: number;
  pastBatchCount: number;
  latestSavedAt: string | null;
}

export const MediaRecordHubView: React.FC<MediaRecordHubViewProps> = ({
  headerComponent,
  crops,
  refreshSignal = 0,
  onOpenMediaRecord,
  onOpenCropActivities,
}) => {
  const { isDark } = useExecutiveTheme();
  const { cropGpsDataMap } = useCrops();

  const [statusMap, setStatusMap] = useState<Record<string, CropRecordStatus>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState<boolean>(false);

  const cardBg = isDark ? '#0b1322' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const innerBg = isDark ? '#111c30' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#475569';

  useEffect(() => {
    let cancelled = false;
    if (!crops || crops.length === 0) {
      setStatusMap({});
      return;
    }

    // Immediate optimistic status from local GPS cache
    const initial: Record<string, CropRecordStatus> = {};
    crops.forEach((c) => {
      const gps = cropGpsDataMap[c.id] || c.gpsData;
      const localActive = isLocalGpsMediaActive(gps);
      const days = localActive
        ? computeDaysRemaining(gps?.mediaDisplayExpiresAt, gps?.mediaCycleSavedAt || gps?.updatedAt)
        : 0;
      const hadPrior = Boolean(
        gps &&
          ((gps.fieldPhotos && gps.fieldPhotos.length > 0) ||
            gps.fieldVideo ||
            gps.fieldAudio ||
            gps.farmerRemarks),
      );
      const localPhotos = localActive ? gps?.fieldPhotos || [] : [];
      initial[c.id] = {
        isActiveCycle: localActive && days > 0 && gps?.saveMediaToCropRecord !== false,
        daysRemaining: days,
        expiresAt: gps?.mediaDisplayExpiresAt || null,
        activePhotos: localPhotos,
        activePhotoCount: localPhotos.length,
        hasActiveVideo: localActive && Boolean(gps?.fieldVideo),
        activeVideoUrl: localActive ? gps?.fieldVideo || null : null,
        hasActiveAudio: localActive && Boolean(gps?.fieldAudio),
        hasActiveRemark: localActive && Boolean(gps?.farmerRemarks?.trim()),
        totalBatches: hadPrior ? 1 : 0,
        pastBatchCount: !localActive && hadPrior ? 1 : 0,
        latestSavedAt: gps?.mediaCycleSavedAt || gps?.updatedAt || null,
      };
    });
    setStatusMap(initial);

    // Sync accurate server statuses across active crops
    setIsLoadingStatuses(true);
    Promise.all(
      crops.map(async (c) => {
        try {
          const [mediaRes, remarkRes] = await Promise.all([
            fetchCropMediaFromStore(c.id),
            fetchCropRemarkFromStore(c.id),
          ]);
          const batches: CropMediaHistoryBatch[] = buildCropActivityMediaBatches(
            mediaRes.rawRows,
            remarkRes.history || [],
          );
          const pastCount = batches.filter((b) => !b.isActiveDisplay).length;
          const activeBatch = batches.find((b) => b.isActiveDisplay);
          const gps = cropGpsDataMap[c.id] || c.gpsData;
          const localActive = isLocalGpsMediaActive(gps);
          const expiry =
            mediaRes.activeWindowExpiresAt ||
            remarkRes.expiresAt ||
            activeBatch?.expiresAt ||
            (localActive ? gps?.mediaDisplayExpiresAt || null : null);
          const remDays = expiry ? computeDaysRemaining(expiry) : 0;
          const activeFlag =
            (mediaRes.isActiveWindowLocked ||
              remarkRes.isActiveDisplay ||
              (localActive && gps?.saveMediaToCropRecord !== false)) &&
            remDays > 0;

          const resolvedPhotos = activeFlag
            ? (mediaRes.photos.length > 0 ? mediaRes.photos : (localActive ? gps?.fieldPhotos || [] : []))
            : [];
          const resolvedVideo = activeFlag
            ? (mediaRes.video || (localActive ? gps?.fieldVideo || null : null))
            : null;

          const status: CropRecordStatus = {
            isActiveCycle: activeFlag,
            daysRemaining: activeFlag ? remDays : 0,
            expiresAt: expiry,
            activePhotos: resolvedPhotos,
            activePhotoCount: activeFlag ? resolvedPhotos.length : 0,
            hasActiveVideo: activeFlag && (Boolean(mediaRes.video) || (localActive && Boolean(gps?.fieldVideo))),
            activeVideoUrl: resolvedVideo,
            hasActiveAudio: activeFlag && (Boolean(mediaRes.audio) || (localActive && Boolean(gps?.fieldAudio))),
            hasActiveRemark:
              activeFlag &&
              (Boolean(remarkRes.remarksText) || (localActive && Boolean(gps?.farmerRemarks?.trim()))),
            totalBatches: batches.length || (localActive ? 1 : 0),
            pastBatchCount: pastCount,
            latestSavedAt: activeBatch?.savedAt || batches[0]?.savedAt || gps?.updatedAt || null,
          };
          return [c.id, status] as const;
        } catch {
          return [c.id, initial[c.id]] as const;
        }
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        const next: Record<string, CropRecordStatus> = {};
        entries.forEach(([id, st]) => {
          if (st) next[id] = st;
        });
        setStatusMap(next);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStatuses(false);
      });

    return () => {
      cancelled = true;
    };
  }, [crops, cropGpsDataMap, refreshSignal]);

  const summary = Object.values(statusMap).reduce(
    (acc, s) => {
      if (s.isActiveCycle) acc.activeRecords += 1;
      else acc.readyForNew += 1;
      acc.totalBatches += s.totalBatches;
      return acc;
    },
    { activeRecords: 0, readyForNew: 0, totalBatches: 0 },
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 42 }}
      showsVerticalScrollIndicator={false}
    >
      {headerComponent}

      <View style={styles.container}>
        {/* SLEEK CROP GALLERY OVERVIEW CARD */}
        <LinearGradient
          colors={['#090e17', '#0f172a', '#062817']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <Text style={styles.heroTitle}>Crop Gallery</Text>
              {(() => {
                const cw = getCalendarWeekRange();
                return (
                  <View style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#4ade80' }}>
                    <Text style={{ fontSize: 10, fontFamily: FONT.extraBold, color: '#4ade80', letterSpacing: 0.4 }}>
                      SUNDAY TO SATURDAY CYCLE · DAY {cw.dayNumber}/7 ({cw.dayName.toUpperCase()})
                    </Text>
                  </View>
                );
              })()}
            </View>
            <Text style={styles.heroSubtitle}>
              Upload up to 6 clear field photos with auto date & plot watermark. Active on display for 7 days (Sunday Day 1 to Saturday Day 7). If no photos are uploaded in any week, that week is left empty with No Photo Preview.
            </Text>
          </View>
        </LinearGradient>

        {/* SECTION HEADING */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="images" size={18} color={isDark ? '#4ade80' : '#15803d'} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Your Crops Gallery ({crops.length})
            </Text>
          </View>
          {isLoadingStatuses ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: subTextColor }}>
                Syncing gallery...
              </Text>
            </View>
          ) : null}
        </View>

        {crops.length === 0 ? (
          <View style={[styles.emptyHubBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="leaf-outline" size={34} color={subTextColor} />
            <Text style={[styles.emptyHubTitle, { color: textColor }]}>No Active Crops Found</Text>
            <Text style={[styles.emptyHubSub, { color: subTextColor }]}>
              Add a crop first in the Active Crops tab, then you can create 7-day Crop Gallery uploads for each plot.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {crops.map((crop) => {
              const cw = getCalendarWeekRange();
              const st = statusMap[crop.id] || {
                isActiveCycle: false,
                daysRemaining: 0,
                expiresAt: null,
                activePhotos: [],
                activePhotoCount: 0,
                hasActiveVideo: false,
                activeVideoUrl: null,
                hasActiveAudio: false,
                hasActiveRemark: false,
                totalBatches: 0,
                pastBatchCount: 0,
                latestSavedAt: null,
              };

              const hasUploadedPhotosThisWeek = Boolean(st.activePhotos && st.activePhotos.length > 0);
              const dayOfCycle = cw.dayNumber; // Sunday is 1, Saturday is 7
              const progressPct = Math.min(100, Math.max(14, Math.round((dayOfCycle / 7) * 100)));

              return (
                <View
                  key={crop.id}
                  style={[
                    styles.cropRecordCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: hasUploadedPhotosThisWeek
                        ? isDark
                          ? 'rgba(74, 222, 128, 0.35)'
                          : '#86efac'
                        : cardBorder,
                      ...premiumShadow(hasUploadedPhotosThisWeek ? '#16a34a' : '#000000', 'xs'),
                    },
                  ]}
                >
                  {/* HEADER: CROP NAME + STATUS PILL */}
                  <View style={styles.cropCardHeader}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.cropTitle, { color: textColor }]} numberOfLines={1}>
                        {crop.cropName}
                      </Text>
                      <Text style={[styles.cropSub, { color: subTextColor }]} numberOfLines={1}>
                        {crop.fieldName} {crop.area ? `· ${crop.area}` : ''}
                      </Text>
                    </View>

                    {hasUploadedPhotosThisWeek ? (
                      <View style={styles.statusPillActive}>
                        <Ionicons name="checkmark-circle" size={12} color="#15803d" />
                        <Text style={styles.statusPillActiveText}>
                          Active · Day {dayOfCycle}/7 ({cw.dayName})
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.statusPillReady, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderColor: cardBorder }]}>
                        <Ionicons name="calendar-outline" size={12} color={subTextColor} />
                        <Text style={[styles.statusPillReadyText, { color: subTextColor }]}>
                          Week Day {dayOfCycle}/7 ({cw.dayName})
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* SUNDAY TO SATURDAY CYCLE TRACKER BAR */}
                  <View
                    style={[
                      styles.cycleBox,
                      { backgroundColor: innerBg, borderColor: cardBorder },
                    ]}
                  >
                    <View style={styles.cycleLabelRow}>
                      <Text style={[styles.cycleLabel, { color: hasUploadedPhotosThisWeek ? '#15803d' : (isDark ? '#38bdf8' : '#0284c7') }]}>
                        Day {dayOfCycle} of 7 ({cw.dayName}) · Week of {cw.dateLabel}
                      </Text>
                      <Text style={[styles.cycleDateText, { color: subTextColor }]}>
                        {cw.daysRemaining} day(s) left in cycle
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: hasUploadedPhotosThisWeek ? '#16a34a' : '#0284c7' }]} />
                    </View>
                    <View style={styles.contentsChipsRow}>
                      <View style={styles.contentChip}>
                        <Ionicons name="images" size={11} color={hasUploadedPhotosThisWeek ? '#15803d' : subTextColor} />
                        <Text style={styles.contentChipText}>{st.activePhotoCount}/6 Photos</Text>
                      </View>
                      <View style={styles.contentChip}>
                        <Ionicons name="videocam" size={11} color={st.hasActiveVideo ? '#dc2626' : subTextColor} />
                        <Text style={styles.contentChipText}>
                          {st.hasActiveVideo ? 'Video Ready' : 'No Video'}
                        </Text>
                      </View>
                      <View style={styles.contentChip}>
                        <Ionicons name="mic" size={11} color={st.hasActiveAudio ? '#0284c7' : subTextColor} />
                        <Text style={styles.contentChipText}>
                          {st.hasActiveAudio ? 'Voice Note' : 'No Voice'}
                        </Text>
                      </View>
                      {st.hasActiveRemark ? (
                        <View style={styles.contentChip}>
                          <Ionicons name="chatbox-ellipses" size={11} color="#7c3aed" />
                          <Text style={styles.contentChipText}>Text Note</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* ACTIVE PHOTOS PREVIEW STRIP (WHEN SAVED) OR NO PHOTO PREVIEW */}
                  {hasUploadedPhotosThisWeek ? (
                    <View style={styles.cardPhotoStrip}>
                      {st.activePhotos.slice(0, 6).map((photoUrl, pIdx) => {
                        const resolved = resolveCropMediaDisplayUri(photoUrl) || photoUrl;
                        return (
                          <TouchableOpacity
                            key={`hub_p_${crop.id}_${pIdx}`}
                            style={styles.cardPhotoThumbWrap}
                            activeOpacity={0.85}
                            onPress={() => onOpenMediaRecord(crop, 'CURRENT')}
                          >
                            <Image
                              source={{ uri: resolved }}
                              style={styles.cardPhotoThumbImg}
                              resizeMode="cover"
                            />
                            <View style={styles.cardPhotoThumbBadge}>
                              <Text style={styles.cardPhotoThumbBadgeText}>#{pIdx + 1}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      {st.activePhotos.length < 6 ? (
                        <TouchableOpacity
                          style={styles.cardAddPhotoSlot}
                          activeOpacity={0.8}
                          onPress={() => onOpenMediaRecord(crop, 'CURRENT')}
                        >
                          <Ionicons name="camera-outline" size={16} color="#15803d" />
                          <Text style={styles.cardAddPhotoSlotText}>+ Add</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : (
                    /* NO PHOTO PREVIEW: SHOWN WHEN WEEK HAS NO UPLOADS */
                    <View
                      style={[
                        styles.cardEmptyPrompt,
                        { borderColor: cardBorder, backgroundColor: innerBg, paddingVertical: 12 },
                      ]}
                    >
                      <View style={[styles.cardEmptyPromptIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}>
                        <Ionicons name="images-outline" size={18} color={subTextColor} />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text style={[styles.cardEmptyPromptTitle, { color: textColor }]}>
                          No Photo Preview
                        </Text>
                        <Text style={[styles.cardEmptyPromptSub, { color: subTextColor }]}>
                          No pictures uploaded for this week ({cw.dateLabel}). Sunday is Day 1 of the 7-day cycle.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#16a34a',
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        activeOpacity={0.85}
                        onPress={() => onOpenMediaRecord(crop, 'CURRENT')}
                      >
                        <Ionicons name="camera" size={13} color="#ffffff" />
                        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' }}>+ Upload</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* ACTION BUTTONS */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.primaryCardBtn,
                        { backgroundColor: st.isActiveCycle ? '#0f172a' : '#16a34a' },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => onOpenMediaRecord(crop, 'CURRENT')}
                    >
                      <Ionicons
                        name={st.isActiveCycle ? 'eye' : 'add-circle'}
                        size={15}
                        color="#ffffff"
                      />
                      <Text style={styles.primaryCardBtnText}>
                        {st.isActiveCycle ? 'Open Crop Gallery' : 'Add to Crop Gallery'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.secondaryCardBtn,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                          borderColor: cardBorder,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => onOpenMediaRecord(crop, 'ARCHIVE')}
                    >
                      <Ionicons name="archive-outline" size={14} color={textColor} />
                      <Text style={[styles.secondaryCardBtnText, { color: textColor }]}>
                        Past Gallery ({st.totalBatches})
                      </Text>
                    </TouchableOpacity>

                    {onOpenCropActivities ? (
                      <TouchableOpacity
                        style={[
                          styles.iconOnlyBtn,
                          {
                            backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                            borderColor: isDark ? 'rgba(56,189,248,0.35)' : '#bfdbfe',
                          },
                        ]}
                        activeOpacity={0.85}
                        onPress={() => onOpenCropActivities(crop)}
                        accessibilityLabel={`Open Crop Activities for ${crop.cropName}`}
                      >
                        <Ionicons name="calendar-outline" size={15} color="#0284c7" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 14,
    gap: 16,
  },
  heroCard: {
    borderRadius: 14,
    padding: 13,
    borderWidth: 1.2,
    borderColor: 'rgba(74, 222, 128, 0.28)',
    gap: 9,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontFamily: FONT.extraBold,
  },
  emptyHubBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyHubTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  emptyHubSub: {
    fontSize: 12,
    fontFamily: FONT.regular,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 17,
  },
  cardsGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 14,
  },
  cropRecordCard: {
    width: Platform.OS === 'web' ? '48.8%' : '100%',
    minWidth: 290,
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cropTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
  },
  cropSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillActiveText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  statusPillReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillReadyText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#b45309',
  },
  cycleBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
    gap: 8,
  },
  cycleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  cycleLabel: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
  },
  cycleDateText: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  contentsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  contentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contentChipText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  readyExplainText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    lineHeight: 15,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryCardBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  primaryCardBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  secondaryCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryCardBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  iconOnlyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPhotoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    paddingVertical: 2,
  },
  cardPhotoThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.45)',
    backgroundColor: '#090e17',
    position: 'relative',
  },
  cardPhotoThumbImg: {
    width: '100%',
    height: '100%',
  },
  cardPhotoThumbBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardPhotoThumbBadgeText: {
    fontSize: 7.5,
    fontFamily: FONT.extraBold,
    color: '#4ade80',
  },
  cardAddPhotoSlot: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cardAddPhotoSlotText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  cardEmptyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardEmptyPromptIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmptyPromptTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  cardEmptyPromptSub: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    lineHeight: 14,
  },
});

export const CropGalleryHubView = MediaRecordHubView;
export type CropGalleryHubViewProps = MediaRecordHubViewProps;

