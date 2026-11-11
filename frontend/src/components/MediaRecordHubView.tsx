import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  isLocalGpsMediaActive,
  MEDIA_DISPLAY_DAYS,
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
  activePhotoCount: number;
  hasActiveVideo: boolean;
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
      initial[c.id] = {
        isActiveCycle: localActive && days > 0 && gps?.saveMediaToCropRecord !== false,
        daysRemaining: days,
        expiresAt: gps?.mediaDisplayExpiresAt || null,
        activePhotoCount: localActive ? gps?.fieldPhotos?.length || 0 : 0,
        hasActiveVideo: localActive && Boolean(gps?.fieldVideo),
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

          const status: CropRecordStatus = {
            isActiveCycle: activeFlag,
            daysRemaining: activeFlag ? remDays : 0,
            expiresAt: expiry,
            activePhotoCount: activeFlag
              ? mediaRes.photos.length || (localActive ? gps?.fieldPhotos?.length || 0 : 0)
              : 0,
            hasActiveVideo: activeFlag && (Boolean(mediaRes.video) || (localActive && Boolean(gps?.fieldVideo))),
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
        {/* PREMIUM OBSIDIAN MEDIA RECORD OVERVIEW CARD */}
        <LinearGradient
          colors={['#090e17', '#0f172a', '#052e16']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.modulePillRow}>
                <View style={styles.modulePill}>
                  <Ionicons name="film" size={12} color="#4ade80" />
                  <Text style={styles.modulePillText}>MEDIA RECORD MODULE</Text>
                </View>
                <View style={styles.cycleRulePill}>
                  <Ionicons name="shield-checkmark" size={11} color="#93c5fd" />
                  <Text style={styles.cycleRulePillText}>7-DAY DISPLAY · SAFE ARCHIVE</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Crop Media Records</Text>
              <Text style={styles.heroSubtitle}>
                Save crop photos, live video, voice notes, and feedback in one simple record. Every record stays visible for 7 days, then moves safely to Past Records so you can add a new Media Record.
              </Text>
            </View>
          </View>

          {/* 3-STEP EASY GUIDE */}
          <View style={styles.stepsGrid}>
            <View style={styles.stepBox}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Add Media Record</Text>
                <Text style={styles.stepDesc}>
                  Up to 6 photos, 1-min live video, 1-min voice note, and 150-char text note.
                </Text>
              </View>
            </View>

            <View style={styles.stepBox}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>7-Day Active Display</Text>
                <Text style={styles.stepDesc}>
                  Photos, video, and voice stay visible cleanly on display for {MEDIA_DISPLAY_DAYS} full days.
                </Text>
              </View>
            </View>

            <View style={styles.stepBox}>
              <View style={[styles.stepNumBadge, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>New Record After 7 Days</Text>
                <Text style={styles.stepDesc}>
                  After 7 days, old media saves in Past Records and new Media Record unlocks automatically.
                </Text>
              </View>
            </View>
          </View>

          {/* KPI STRIP */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiNumber}>{crops.length}</Text>
              <Text style={styles.kpiLabel}>Active Crops</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiNumber, { color: '#4ade80' }]}>{summary.activeRecords}</Text>
              <Text style={styles.kpiLabel}>Active 7-Day Records</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiNumber, { color: '#fbbf24' }]}>{summary.readyForNew}</Text>
              <Text style={styles.kpiLabel}>Ready for New Record</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiNumber, { color: '#38bdf8' }]}>{summary.totalBatches}</Text>
              <Text style={styles.kpiLabel}>Saved Total Batches</Text>
            </View>
          </View>
        </LinearGradient>

        {/* SECTION HEADING */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="albums" size={18} color={isDark ? '#4ade80' : '#15803d'} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Your Crops Media Records ({crops.length})
            </Text>
          </View>
          {isLoadingStatuses ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: subTextColor }}>
                Syncing records...
              </Text>
            </View>
          ) : null}
        </View>

        {crops.length === 0 ? (
          <View style={[styles.emptyHubBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="leaf-outline" size={34} color={subTextColor} />
            <Text style={[styles.emptyHubTitle, { color: textColor }]}>No Active Crops Found</Text>
            <Text style={[styles.emptyHubSub, { color: subTextColor }]}>
              Add a crop first in the Active Crops tab, then you can create 7-day Media Records for each plot.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {crops.map((crop) => {
              const st = statusMap[crop.id] || {
                isActiveCycle: false,
                daysRemaining: 0,
                expiresAt: null,
                activePhotoCount: 0,
                hasActiveVideo: false,
                hasActiveAudio: false,
                hasActiveRemark: false,
                totalBatches: 0,
                pastBatchCount: 0,
                latestSavedAt: null,
              };
              const dayOfCycle = st.isActiveCycle
                ? Math.min(MEDIA_DISPLAY_DAYS, Math.max(1, MEDIA_DISPLAY_DAYS - st.daysRemaining + 1))
                : 0;
              const progressPct = st.isActiveCycle
                ? Math.min(100, Math.max(14, Math.round((dayOfCycle / MEDIA_DISPLAY_DAYS) * 100)))
                : 0;

              return (
                <View
                  key={crop.id}
                  style={[
                    styles.cropRecordCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: st.isActiveCycle
                        ? isDark
                          ? 'rgba(74, 222, 128, 0.35)'
                          : '#86efac'
                        : cardBorder,
                      ...premiumShadow(st.isActiveCycle ? '#16a34a' : '#000000', 'xs'),
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

                    {st.isActiveCycle ? (
                      <View style={styles.statusPillActive}>
                        <Ionicons name="checkmark-circle" size={12} color="#15803d" />
                        <Text style={styles.statusPillActiveText}>
                          Active · {st.daysRemaining}d Left
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.statusPillReady}>
                        <Ionicons name="add-circle" size={12} color="#b45309" />
                        <Text style={styles.statusPillReadyText}>New Record Ready</Text>
                      </View>
                    )}
                  </View>

                  {/* 7-DAY CYCLE TRACKER BAR */}
                  <View
                    style={[
                      styles.cycleBox,
                      { backgroundColor: innerBg, borderColor: cardBorder },
                    ]}
                  >
                    {st.isActiveCycle ? (
                      <>
                        <View style={styles.cycleLabelRow}>
                          <Text style={[styles.cycleLabel, { color: '#15803d' }]}>
                            Day {dayOfCycle} of {MEDIA_DISPLAY_DAYS} Active Display
                          </Text>
                          <Text style={[styles.cycleDateText, { color: subTextColor }]}>
                            {st.expiresAt
                              ? `New unlocks ${formatMediaTimestamp(st.expiresAt).dateStr}`
                              : `${st.daysRemaining} day(s) remaining`}
                          </Text>
                        </View>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                        </View>
                        <View style={styles.contentsChipsRow}>
                          <View style={styles.contentChip}>
                            <Ionicons name="images" size={11} color="#15803d" />
                            <Text style={styles.contentChipText}>{st.activePhotoCount}/6 Photos</Text>
                          </View>
                          <View style={styles.contentChip}>
                            <Ionicons name="videocam" size={11} color={st.hasActiveVideo ? '#dc2626' : '#64748b'} />
                            <Text style={styles.contentChipText}>
                              {st.hasActiveVideo ? 'Video Ready' : 'No Video'}
                            </Text>
                          </View>
                          <View style={styles.contentChip}>
                            <Ionicons name="mic" size={11} color={st.hasActiveAudio ? '#0284c7' : '#64748b'} />
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
                      </>
                    ) : (
                      <>
                        <View style={styles.cycleLabelRow}>
                          <Text style={[styles.cycleLabel, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                            {st.totalBatches > 0
                              ? '7 Days Finished · New Record Unlocked'
                              : 'No Media Record Yet'}
                          </Text>
                          {st.totalBatches > 0 ? (
                            <Text style={[styles.cycleDateText, { color: subTextColor }]}>
                              {st.totalBatches} past record(s) saved
                            </Text>
                          ) : null}
                        </View>
                        <Text style={[styles.readyExplainText, { color: subTextColor }]}>
                          Upload fresh crop photos, live video, voice note, or remarks. It will stay on display for {MEDIA_DISPLAY_DAYS} days.
                        </Text>
                      </>
                    )}
                  </View>

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
                        {st.isActiveCycle ? 'Open Media Record' : 'Add New Media Record'}
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
                        Past Records ({st.totalBatches})
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
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modulePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  modulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  modulePillText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#4ade80',
    letterSpacing: 0.6,
  },
  cycleRulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cycleRulePillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#bfdbfe',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  stepsGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 10,
  },
  stepBox: {
    flex: 1,
    minWidth: 210,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 11,
  },
  stepNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  stepTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 15,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  kpiNumber: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  kpiLabel: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#94a3b8',
    textAlign: 'center',
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
});

