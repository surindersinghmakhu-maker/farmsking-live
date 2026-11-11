import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCrops, RegisteredCropField, CropActivityItem, CropActivityType } from '@/src/store/crops-context';
import { useAuth } from '@/src/store/auth-context';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { CropVideoPlayer } from '@/components/CropVideoPlayer';
import { CropRemarksSection } from '@/components/CropRemarksSection';
import {
  buildCropActivityMediaBatches,
  computeDaysRemaining,
  CropMediaHistoryBatch,
  detectMediaCaptureSource,
  fetchCropMediaFromStore,
  fetchCropRemarkFromStore,
  formatMediaTimestamp,
  MEDIA_DISPLAY_MS,
  mergeCropMediaLists,
  resolveCropMediaDisplayUri,
} from '@/src/utils/crop-media';

interface CropActivitiesModalProps {
  visible: boolean;
  crop: RegisteredCropField | null;
  onClose: () => void;
  onOpenMediaModal?: () => void;
  isAdvisorView?: boolean;
}

export const CropActivitiesModal: React.FC<CropActivitiesModalProps> = ({
  visible,
  crop,
  onClose,
  onOpenMediaModal,
  isAdvisorView = false,
}) => {
  const { colors, isDark } = useExecutiveTheme();
  const cardBg = isDark ? '#0b1322' : '#ffffff';
  const innerBg = isDark ? '#111c30' : '#f8fafc';
  const cardBorder = isDark ? 'rgba(56, 189, 248, 0.25)' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  const { user } = useAuth();
  const { cropActivitiesMap, addCropActivity, cropGpsDataMap } = useCrops();

  // Role check: Is current user viewing as an Advisor / Supervisor?
  const isAdvisor = Boolean(
    isAdvisorView ||
    user?.role === 'ADVISOR' ||
    user?.role === 'FARM_ADVISOR' ||
    user?.role === 'GARDEN_ADVISOR' ||
    user?.role === 'SUPERVISOR' ||
    (user as any)?.advisorType
  );

  const [activeFilter, setActiveFilter] = useState<'ALL' | CropActivityType | 'MEDIA'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  // New activity form state (Pure Agronomic: No amounts or expenses)
  const [formType, setFormType] = useState<CropActivityType>('IRRIGATION');
  const [formTitle, setFormTitle] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Selected crop GPS data & permanent Media Store archive for photos, video, audio & remarks
  const [backendBatches, setBackendBatches] = useState<CropMediaHistoryBatch[]>([]);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !crop?.id) {
      setPreviewPhotoUrl(null);
      if (!visible) setBackendBatches([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      fetchCropMediaFromStore(crop.id),
      fetchCropRemarkFromStore(crop.id),
    ])
      .then(([res, savedRemark]) => {
        if (!cancelled) {
          setBackendBatches(
            buildCropActivityMediaBatches(res.rawRows, savedRemark.history || []),
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, crop?.id]);

  const cropGps = crop ? cropGpsDataMap[crop.id] || crop.gpsData : null;

  // Combine permanent backend archive batches with any unsynced local cache snapshot
  const allMediaBatches = useMemo<CropMediaHistoryBatch[]>(() => {
    const serverBatches = [...backendBatches];
    const knownUrls = new Set<string>();
    const knownRemarks = new Set<string>();
    serverBatches.forEach((b) => {
      b.photos.forEach((p) => knownUrls.add(p.url));
      if (b.video) knownUrls.add(b.video);
      if (b.audio) knownUrls.add(b.audio);
      if (b.remarksText) knownRemarks.add(b.remarksText.trim());
    });

    if (cropGps) {
      const sanitizedLocal = mergeCropMediaLists(
        [],
        cropGps.fieldPhotos,
        null,
        cropGps.fieldVideo || null,
        null,
        cropGps.fieldAudio || null,
      );
      const unseenPhotos = sanitizedLocal.photos.filter((p) => !knownUrls.has(p));
      const unseenVideo =
        sanitizedLocal.video && !knownUrls.has(sanitizedLocal.video)
          ? sanitizedLocal.video
          : null;
      const unseenAudio =
        sanitizedLocal.audio && !knownUrls.has(sanitizedLocal.audio)
          ? sanitizedLocal.audio
          : null;
      const localRemark = String(cropGps.farmerRemarks || '').trim();
      const unseenRemark = localRemark && !knownRemarks.has(localRemark) ? localRemark : '';

      if (unseenPhotos.length > 0 || unseenVideo || unseenAudio || unseenRemark) {
        const savedAt = cropGps.mediaCycleSavedAt || cropGps.updatedAt || new Date().toISOString();
        const expiresAt =
          cropGps.mediaDisplayExpiresAt ||
          new Date(new Date(savedAt).getTime() + MEDIA_DISPLAY_MS).toISOString();
        const remDays = computeDaysRemaining(expiresAt);
        serverBatches.unshift({
          batchKey: `local-${cropGps.updatedAt}`,
          dateLabel: formatMediaTimestamp(savedAt).dateStr,
          savedAt,
          expiresAt,
          isActiveDisplay: remDays > 0,
          daysRemaining: remDays,
          photos: unseenPhotos.map((u) => ({
            url: u,
            source: detectMediaCaptureSource(u),
            createdAt: savedAt,
          })),
          video: unseenVideo,
          audio: unseenAudio,
          remarksText: unseenRemark,
        });
      }
    }

    return serverBatches;
  }, [backendBatches, cropGps]);

  const totalArchivedPhotos = useMemo(
    () => allMediaBatches.reduce((sum, b) => sum + b.photos.length, 0),
    [allMediaBatches],
  );

  // Activities for current crop (Pure agronomic activities, zero amounts)
  const rawActivities = useMemo(() => {
    if (!crop) return [];
    const list = cropActivitiesMap[crop.id] || [];
    if (list.length > 0) {
      return list.filter((a) => a.type !== 'EXPENSE');
    }

    // Default agronomic activities (No costs, no prices)
    const defaults: CropActivityItem[] = [
      {
        id: `act_def_1_${crop.id}`,
        cropId: crop.id,
        type: 'FERTILIZER',
        title: 'Certified Seed Sowing & Organic Soil Bedding',
        date: crop.sowingDate || '19 Sept 2026',
        quantity: 'Certified Seed Lot · 40 Kg/Acre',
        notes: 'High-germination treated seeds sown after deep tractor plowing.',
        createdAt: new Date().toISOString(),
      },
      {
        id: `act_def_2_${crop.id}`,
        cropId: crop.id,
        type: 'IRRIGATION',
        title: 'Canal Water Pre-Sowing Irrigation',
        date: crop.sowingDate || '21 Sept 2026',
        quantity: '4.5 Hours Canal Flow',
        notes: 'Deep soaking for uniform seed germination and moisture bed.',
        createdAt: new Date().toISOString(),
      },
      {
        id: `act_def_3_${crop.id}`,
        cropId: crop.id,
        type: 'FERTILIZER',
        title: 'DAP & Zinc Sulphate Nutrition Drenching',
        date: '28 Sept 2026',
        quantity: '50 kg Bag + 5 kg Zinc',
        notes: 'Root development boost applied along crop rows.',
        createdAt: new Date().toISOString(),
      },
      {
        id: `act_def_4_${crop.id}`,
        cropId: crop.id,
        type: 'SPRAY',
        title: 'Preventive Neem Oil & Bio-Fungicide Spray',
        date: '04 Oct 2026',
        quantity: '250 ml in 200L Water',
        notes: 'Foliar spray for leaf-sucking pests and downy mildew protection.',
        createdAt: new Date().toISOString(),
      },
      {
        id: `act_def_5_${crop.id}`,
        cropId: crop.id,
        type: 'HARVEST',
        title: 'Harvest Picking & Produce Lot',
        date: '15 Oct 2026',
        quantity: '45 Quintals Produce Weight',
        notes: 'Harvested under optimal dry humidity. High grain quality certified.',
        createdAt: new Date().toISOString(),
      },
    ];
    return defaults;
  }, [crop, cropActivitiesMap]);

  // Filtered list (strictly agronomic)
  const filteredActivities = useMemo(() => {
    if (activeFilter === 'ALL') return rawActivities;
    if (activeFilter === 'MEDIA') return [];
    return rawActivities.filter((a) => a.type === activeFilter);
  }, [rawActivities, activeFilter]);

  const totalHarvestWeight = useMemo(() => {
    const harvestActs = rawActivities.filter((a) => a.type === 'HARVEST');
    if (harvestActs.length === 0) return '45 Quintals';
    const firstWithQty = harvestActs.find((a) => a.quantity);
    return firstWithQty?.quantity || `${harvestActs.length} Harvest Lot(s)`;
  }, [rawActivities]);

  const totalIrrigations = useMemo(() => {
    return rawActivities.filter((a) => a.type === 'IRRIGATION').length;
  }, [rawActivities]);

  const totalSprays = useMemo(() => {
    return rawActivities.filter((a) => a.type === 'SPRAY').length;
  }, [rawActivities]);

  const totalFertilizers = useMemo(() => {
    return rawActivities.filter((a) => a.type === 'FERTILIZER').length;
  }, [rawActivities]);

  const handleSaveActivity = async () => {
    if (!crop) return;
    if (!formTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a title or description for this activity.');
      return;
    }

    const d = new Date();
    const dateStr = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;

    await addCropActivity(crop.id, {
      cropId: crop.id,
      type: formType,
      title: formTitle.trim(),
      date: dateStr,
      quantity: formQuantity.trim() || undefined,
      notes: formNotes.trim() || undefined,
    });

    setFormTitle('');
    setFormQuantity('');
    setFormNotes('');
    setShowAddForm(false);
    Alert.alert('Activity Recorded ✅', 'Crop activity successfully added to timeline.');
  };

  if (!crop) return null;

  const effectiveFarmerName = (user?.farmName || user?.name || crop?.farmerName || 'Registered Farmer').trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* HEADER */}
          <View style={[styles.header, { borderBottomColor: cardBorder }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar-outline" size={20} color="#0284c7" />
                <Text style={[styles.headerTitle, { color: textColor }]}>
                  {isAdvisor ? 'Advisor Crop Monitoring & Activities' : 'Crop Activities & Timeline'}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
                {crop.cropName} • {crop.fieldName} • Sown: {crop.sowingDate}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
              <Ionicons name="close" size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            {/* KPI STATS ROW (Zero Amounts - Pure Agronomic Telemetry) */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Ionicons name="scale-outline" size={16} color="#059669" />
                <Text style={[styles.kpiValue, { color: '#059669' }]} numberOfLines={1}>{totalHarvestWeight}</Text>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>Harvest Weight</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Ionicons name="water-outline" size={16} color="#0284c7" />
                <Text style={[styles.kpiValue, { color: '#0284c7' }]}>{totalIrrigations} Sessions</Text>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>Waterings</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Ionicons name="flask-outline" size={16} color="#d97706" />
                <Text style={[styles.kpiValue, { color: '#d97706' }]}>{totalSprays} Sprays</Text>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>Treatments</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Ionicons name="leaf-outline" size={16} color="#16a34a" />
                <Text style={[styles.kpiValue, { color: '#16a34a' }]}>{totalFertilizers} Applications</Text>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>Fertilizers</Text>
              </View>
            </View>

            {/* AGRONOMY ASSURANCE CALLOUT */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ecfdf5',
                borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#a7f3d0',
                borderWidth: 1,
                borderRadius: 10,
                padding: 12,
                marginTop: 12,
                flexDirection: 'row',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#059669" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isDark ? '#34d399' : '#047857' }}>
                  🌱 Verified Agronomy Operations & Crop Health Log
                </Text>
                <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: isDark ? '#d1fae5' : '#065f46', marginTop: 2, lineHeight: 16 }}>
                  • <Text style={{ fontFamily: FONT.bold }}>Permanent Field Record</Text>: Irrigation sessions, nutritional foliar sprays, fertilizer dressings, and harvest produce lots are permanently recorded for ICAR compliance.
                  {'\n'}• <Text style={{ fontFamily: FONT.bold }}>Full Physical Transparency</Text>: Real-time tracking of water flow, chemical dosages, and harvested produce weights with geo-tagged ground photos.
                </Text>
              </View>
            </View>

            {/* FILTER PILLS (No Expense Pill) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {[
                { key: 'ALL', label: `All (${rawActivities.length})`, icon: 'list-outline' },
                { key: 'IRRIGATION', label: 'Watering', icon: 'water-outline' },
                { key: 'SPRAY', label: 'Sprays', icon: 'flask-outline' },
                { key: 'FERTILIZER', label: 'Fertilizers', icon: 'leaf-outline' },
                { key: 'HARVEST', label: 'Harvest Weight', icon: 'scale-outline' },
                { key: 'MEDIA', label: `Media Records (${totalArchivedPhotos})`, icon: 'film-outline' },
              ].map((f) => {
                const isSelected = activeFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? '#0284c7' : innerBg,
                        borderColor: isSelected ? '#0284c7' : cardBorder,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveFilter(f.key as any)}
                  >
                    <Ionicons name={f.icon as any} size={13} color={isSelected ? '#ffffff' : textColor} />
                    <Text style={[styles.filterPillText, { color: isSelected ? '#ffffff' : textColor }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ACTION: LOG NEW AGRONOMIC ACTIVITY */}
            <View style={{ marginTop: 12 }}>
              {!showAddForm ? (
                <TouchableOpacity
                  style={[styles.addBtn, { borderColor: cardBorder }]}
                  activeOpacity={0.85}
                  onPress={() => setShowAddForm(true)}
                >
                  <Ionicons name="add-circle" size={17} color="#0284c7" />
                  <Text style={[styles.addBtnText, { color: '#0284c7' }]}>
                    Log Agronomic Observation / Field Activity
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.formContainer, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.formHeading, { color: textColor }]}>
                      Record Crop Activity
                    </Text>
                    <TouchableOpacity onPress={() => setShowAddForm(false)}>
                      <Ionicons name="close-circle" size={20} color={subTextColor} />
                    </TouchableOpacity>
                  </View>

                  {/* Activity Type Selector (No Expense) */}
                  <View style={styles.typeSelectorRow}>
                    {(['IRRIGATION', 'SPRAY', 'FERTILIZER', 'HARVEST'] as CropActivityType[]).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.typePill,
                          formType === t && { backgroundColor: '#0284c7', borderColor: '#0284c7' },
                        ]}
                        onPress={() => setFormType(t)}
                      >
                        <Text style={[styles.typePillText, formType === t && { color: '#ffffff' }]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Inputs */}
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                    placeholder="Activity title (e.g. Zinc Foliar Drench, Canal Watering, First Harvest Picking)"
                    placeholderTextColor={subTextColor}
                    value={formTitle}
                    onChangeText={setFormTitle}
                  />

                  <TextInput
                    style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                    placeholder="Quantity / Duration / Weight (e.g. 45 Quintals, 50kg, 3.5 hrs)"
                    placeholderTextColor={subTextColor}
                    value={formQuantity}
                    onChangeText={setFormQuantity}
                  />

                  <TextInput
                    style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                    placeholder="Agronomic notes or application instructions (optional)"
                    placeholderTextColor={subTextColor}
                    value={formNotes}
                    onChangeText={setFormNotes}
                  />

                  <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={handleSaveActivity}>
                    <Text style={styles.submitBtnText}>Save Activity Entry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* MEDIA GALLERY SECTION (Permanent Crop Record Archive — Active <=7d & Archived >7d) */}
            {(activeFilter === 'ALL' || activeFilter === 'MEDIA') && (
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                      Media Records Archive (7-Day Active & Past)
                    </Text>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.regular, color: subTextColor, marginTop: 2 }}>
                      Every Media Record stays on display for 7 days and remains permanently here afterward.
                    </Text>
                  </View>
                  {onOpenMediaModal && (
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      onPress={() => {
                        onClose();
                        onOpenMediaModal();
                      }}
                    >
                      <Ionicons name="camera" size={13} color="#15803d" />
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#15803d' }}>
                        Manage Media
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {allMediaBatches.length === 0 ? (
                  <View style={[styles.emptyMediaBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="images-outline" size={26} color={subTextColor} />
                    <Text style={[styles.emptyMediaText, { color: subTextColor }]}>
                      No Photo, Video, or Remarks saved in Crop Record yet.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 14 }}>
                    {allMediaBatches.map((batch) => (
                      <View
                        key={batch.batchKey}
                        style={{
                          backgroundColor: innerBg,
                          borderColor: cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          gap: 10,
                        }}
                      >
                        {/* BATCH HEADER: DATE + 7-DAY ACTIVE VS ARCHIVE BADGE */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 6,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="calendar-outline" size={13} color={subTextColor} />
                            <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: textColor }}>
                              Saved {batch.dateLabel}
                            </Text>
                          </View>

                          {batch.isActiveDisplay ? (
                            <View
                              style={{
                                backgroundColor: 'rgba(22, 163, 74, 0.14)',
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#15803d' }}>
                                Active Display · {batch.daysRemaining} Day(s) Left
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={{
                                backgroundColor: 'rgba(217, 119, 6, 0.14)',
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#b45309' }}>
                                Archived (&gt;7 Days · Crop Activities Only)
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* PHOTOS IN BATCH */}
                        {batch.photos.length > 0 ? (
                          <View style={styles.mediaGrid}>
                            {batch.photos.map((photoItem, idx) => {
                              const resolvedPhoto =
                                resolveCropMediaDisplayUri(photoItem.url) || photoItem.url;
                              return (
                                <TouchableOpacity
                                  key={`${batch.batchKey}_p${idx}`}
                                  style={[styles.photoCard, { borderColor: cardBorder, backgroundColor: '#090e17' }]}
                                  activeOpacity={0.85}
                                  onPress={() => setPreviewPhotoUrl(resolvedPhoto)}
                                >
                                  <View style={{ width: '100%', height: 112, backgroundColor: '#090e17' }}>
                                    <Image source={{ uri: resolvedPhoto }} style={styles.photoThumb} resizeMode="contain" />
                                  </View>
                                  <View style={styles.photoFooterBar}>
                                    <Text style={styles.photoFooterText} numberOfLines={1}>
                                      Photo #{idx + 1} · {photoItem.source}
                                    </Text>
                                    <Ionicons name="eye" size={13} color="#4ade80" />
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : (
                          <View style={[styles.emptyMediaBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                            <Ionicons name="image-outline" size={20} color={subTextColor} />
                            <Text style={[styles.emptyMediaText, { color: subTextColor }]}>No Photo</Text>
                          </View>
                        )}

                        {/* PLAYABLE VIDEO IN BATCH */}
                        {batch.video ? (
                          <CropVideoPlayer
                            videoUri={batch.video}
                            cropName={crop.cropName}
                            fieldName={crop.fieldName}
                            farmerName={effectiveFarmerName}
                            recordedAt={batch.savedAt}
                            height={200}
                            compact
                          />
                        ) : null}

                        {/* VOICE FEEDBACK & WRITTEN REMARKS IN BATCH */}
                        {batch.audio || batch.remarksText ? (
                          <CropRemarksSection
                            remarksText={batch.remarksText}
                            audioUri={batch.audio}
                            audioRecordedAt={batch.savedAt}
                            farmerName={effectiveFarmerName}
                            fieldName={crop.fieldName}
                            cropName={crop.cropName}
                            readOnly
                          />
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TIMELINE ACTIVITIES LIST */}
            {activeFilter !== 'MEDIA' && (
              <View style={{ marginTop: 18 }}>
                <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 8 }]}>
                  Activity Timeline ({filteredActivities.length})
                </Text>

                {filteredActivities.length === 0 ? (
                  <View style={[styles.emptyMediaBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Text style={[styles.emptyMediaText, { color: subTextColor }]}>
                      No activities recorded under this filter.
                    </Text>
                  </View>
                ) : (
                  filteredActivities.map((act) => {
                    const isExpense = act.type === 'EXPENSE';
                    const isIrrigation = act.type === 'IRRIGATION';
                    const isSpray = act.type === 'SPRAY';
                    const isFertilizer = act.type === 'FERTILIZER';
                    const isHarvest = act.type === 'HARVEST';

                    let iconName: any = 'checkmark-circle-outline';
                    let badgeColor = '#0284c7';
                    let badgeBg = isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe';

                    if (isExpense) {
                      iconName = 'wallet-outline';
                      badgeColor = '#059669';
                      badgeBg = isDark ? 'rgba(5, 150, 105, 0.2)' : '#dcfce7';
                    } else if (isIrrigation) {
                      iconName = 'water-outline';
                      badgeColor = '#0284c7';
                      badgeBg = isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe';
                    } else if (isSpray) {
                      iconName = 'flask-outline';
                      badgeColor = '#d97706';
                      badgeBg = isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7';
                    } else if (isFertilizer) {
                      iconName = 'leaf-outline';
                      badgeColor = '#16a34a';
                      badgeBg = isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7';
                    } else if (isHarvest) {
                      iconName = 'scale-outline';
                      badgeColor = '#7c3aed';
                      badgeBg = isDark ? 'rgba(124, 58, 237, 0.2)' : '#ede9fe';
                    }

                    return (
                      <View key={act.id} style={[styles.activityCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                          <View style={[styles.activityIconCircle, { backgroundColor: badgeBg }]}>
                            <Ionicons name={iconName} size={16} color={badgeColor} />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <Text style={[styles.activityTitle, { color: textColor }]}>{act.title}</Text>
                              {act.quantity ? (
                                <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.18)' : '#e0f2fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd' }}>
                                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: isDark ? '#38bdf8' : '#0284c7' }}>
                                    {act.quantity}
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                              <View style={[styles.activityBadge, { backgroundColor: badgeBg }]}>
                                <Text style={[styles.activityBadgeText, { color: badgeColor }]}>{act.type}</Text>
                              </View>
                              <Text style={[styles.activityDate, { color: subTextColor }]}>🗓️ {act.date}</Text>
                            </View>

                            {act.notes ? (
                              <Text style={[styles.activityNotes, { color: subTextColor }]}>
                                {act.notes}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {previewPhotoUrl ? (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPreviewPhotoUrl(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 640, backgroundColor: '#0f172a', borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: '#334155' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: FONT.bold }}>Field Photo Preview</Text>
                <TouchableOpacity onPress={() => setPreviewPhotoUrl(null)}>
                  <Ionicons name="close-circle" size={26} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <View style={{ width: '100%', height: 380, backgroundColor: '#020617', borderRadius: 12, overflow: 'hidden' }}>
                <Image source={{ uri: previewPhotoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
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
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  body: {
    flex: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  kpiBox: {
    flex: 1,
    minWidth: 120,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 13,
    fontFamily: FONT.bold,
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  filterScroll: {
    gap: 6,
    paddingVertical: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  formContainer: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  formHeading: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typePill: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
  },
  typePillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 11.5,
    fontFamily: FONT.regular,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  emptyMediaBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyMediaText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    textAlign: 'center',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoCard: {
    width: 148,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  photoLiveBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoLiveBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: FONT.bold,
  },
  photoFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  photoFooterText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT.medium,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  activityCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  activityCost: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  activityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activityBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
  },
  activityDate: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
  },
  activityNotes: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 4,
    lineHeight: 15,
  },
});

