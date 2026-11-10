import React, { useState, useMemo } from 'react';
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
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

interface CropActivitiesModalProps {
  visible: boolean;
  crop: RegisteredCropField | null;
  onClose: () => void;
  onOpenMediaModal?: () => void;
}

export const CropActivitiesModal: React.FC<CropActivitiesModalProps> = ({
  visible,
  crop,
  onClose,
  onOpenMediaModal,
}) => {
  const { colors, isDark, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();
  const { cropActivitiesMap, addCropActivity, cropGpsDataMap } = useCrops();

  const [activeFilter, setActiveFilter] = useState<'ALL' | CropActivityType | 'MEDIA'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  // New activity form state
  const [formType, setFormType] = useState<CropActivityType>('EXPENSE');
  const [formTitle, setFormTitle] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Selected crop GPS data for photos & video
  const cropGps = crop ? cropGpsDataMap[crop.id] || crop.gpsData : null;
  const fieldPhotos = cropGps?.fieldPhotos || [];
  const fieldVideo = cropGps?.fieldVideo;

  // Activities for current crop
  const rawActivities = useMemo(() => {
    if (!crop) return [];
    const list = cropActivitiesMap[crop.id] || [];
    if (list.length > 0) return list;

    // Seed realistic default activities if none recorded yet
    const defaults: CropActivityItem[] = [
      {
        id: `act_def_1_${crop.id}`,
        cropId: crop.id,
        type: 'EXPENSE',
        title: 'Seeds & Organic Soil Treatment',
        date: crop.sowingDate || '19 Sept 2026',
        cost: 1850,
        quantity: 'Certified Seed Lot',
        notes: 'High-germination treated seeds sown after field deep plowing.',
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
        cost: 1450,
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
        cost: 420,
        quantity: '250 ml in 200L Water',
        notes: 'Foliar spray for leaf-sucking pests and downy mildew protection.',
        createdAt: new Date().toISOString(),
      },
    ];
    return defaults;
  }, [crop, cropActivitiesMap]);

  // Filtered list
  const filteredActivities = useMemo(() => {
    if (activeFilter === 'ALL') return rawActivities;
    if (activeFilter === 'MEDIA') return [];
    return rawActivities.filter((a) => a.type === activeFilter);
  }, [rawActivities, activeFilter]);

  // Totals
  const totalExpense = useMemo(() => {
    return rawActivities.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
  }, [rawActivities]);

  const totalIrrigations = useMemo(() => {
    return rawActivities.filter((a) => a.type === 'IRRIGATION').length;
  }, [rawActivities]);

  const totalSprays = useMemo(() => {
    return rawActivities.filter((a) => a.type === 'SPRAY').length;
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
      cost: formCost ? Number(formCost) : undefined,
      quantity: formQuantity.trim() || undefined,
      notes: formNotes.trim() || undefined,
    });

    setFormTitle('');
    setFormCost('');
    setFormQuantity('');
    setFormNotes('');
    setShowAddForm(false);
    Alert.alert('Activity Recorded ✅', 'Crop activity successfully added to timeline.');
  };

  if (!crop) return null;

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
                  Crop Activities & Timeline
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
            {/* KPI STATS ROW */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Ionicons name="wallet-outline" size={16} color="#059669" />
                <Text style={[styles.kpiValue, { color: '#059669' }]}>₹{totalExpense.toLocaleString('en-IN')}</Text>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>Total Expenses</Text>
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
                <Ionicons name="camera-outline" size={16} color="#7c3aed" />
                <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>{fieldPhotos.length} / 6 Photos</Text>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>{fieldVideo ? '1 Video' : 'No Video'}</Text>
              </View>
            </View>

            {/* DATA RETENTION & AUTO-ARCHIVE POLICY CALLOUT */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff',
                borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#bae6fd',
                borderWidth: 1,
                borderRadius: 10,
                padding: 12,
                marginTop: 12,
                flexDirection: 'row',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Ionicons name="information-circle" size={20} color="#0284c7" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isDark ? '#38bdf8' : '#0369a1' }}>
                  Smart Retention & Completion Policy
                </Text>
                <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: isDark ? '#e0f2fe' : '#075985', marginTop: 2, lineHeight: 16 }}>
                  • <Text style={{ fontFamily: FONT.bold }}>Permanent Activity Ledger</Text>: All expenses, waterings, sprays, and fertilizer records are <Text style={{ fontFamily: FONT.bold }}>permanently preserved forever</Text> in your Farm Records for auditing and yield comparisons.
                  {'\n'}• <Text style={{ fontFamily: FONT.bold }}>Photos & Video 30-Day Window</Text>: When marked 'Completed', high-resolution field photos and videos remain accessible for 30 days to review harvest quality or export your Crop Dossier before cloud archiving.
                </Text>
              </View>
            </View>

            {/* FILTER PILLS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {[
                { key: 'ALL', label: `All (${rawActivities.length})`, icon: 'list-outline' },
                { key: 'EXPENSE', label: 'Expenses', icon: 'cash-outline' },
                { key: 'IRRIGATION', label: 'Watering', icon: 'water-outline' },
                { key: 'SPRAY', label: 'Sprays', icon: 'flask-outline' },
                { key: 'FERTILIZER', label: 'Fertilizers', icon: 'leaf-outline' },
                { key: 'MEDIA', label: `Photos & Video (${fieldPhotos.length})`, icon: 'camera-outline' },
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

            {/* ACTION: LOG NEW ACTIVITY */}
            <View style={{ marginTop: 12 }}>
              {!showAddForm ? (
                <TouchableOpacity
                  style={[styles.addBtn, { borderColor: cardBorder }]}
                  activeOpacity={0.85}
                  onPress={() => setShowAddForm(true)}
                >
                  <Ionicons name="add-circle" size={17} color="#0284c7" />
                  <Text style={[styles.addBtnText, { color: '#0284c7' }]}>Log New Activity or Expense</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.formContainer, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.formHeading, { color: textColor }]}>Record Crop Activity</Text>
                    <TouchableOpacity onPress={() => setShowAddForm(false)}>
                      <Ionicons name="close-circle" size={20} color={subTextColor} />
                    </TouchableOpacity>
                  </View>

                  {/* Activity Type Selector */}
                  <View style={styles.typeSelectorRow}>
                    {(['EXPENSE', 'IRRIGATION', 'SPRAY', 'FERTILIZER'] as CropActivityType[]).map((t) => (
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
                    placeholder="Activity title (e.g. Urea Top Dressing, Diesel, Drip Watering)"
                    placeholderTextColor={subTextColor}
                    value={formTitle}
                    onChangeText={setFormTitle}
                  />

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                      placeholder="Expense (₹, optional)"
                      placeholderTextColor={subTextColor}
                      keyboardType="numeric"
                      value={formCost}
                      onChangeText={setFormCost}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                      placeholder="Quantity / Duration (e.g. 50kg, 3 hrs)"
                      placeholderTextColor={subTextColor}
                      value={formQuantity}
                      onChangeText={setFormQuantity}
                    />
                  </View>

                  <TextInput
                    style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                    placeholder="Notes or dosage details (optional)"
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

            {/* MEDIA GALLERY SECTION (Shown when ALL or MEDIA filter is selected) */}
            {(activeFilter === 'ALL' || activeFilter === 'MEDIA') && (
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    Field Photos & 1-Minute Live Video
                  </Text>
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

                {fieldPhotos.length === 0 && !fieldVideo ? (
                  <View style={[styles.emptyMediaBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="images-outline" size={26} color={subTextColor} />
                    <Text style={[styles.emptyMediaText, { color: subTextColor }]}>
                      No ground photos or video captured yet. Tap "Manage Media" to upload watermarked field photos.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.mediaGrid}>
                    {fieldPhotos.map((url, idx) => (
                      <View key={idx} style={[styles.photoCard, { borderColor: cardBorder }]}>
                        <Image source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
                        <View style={styles.photoLiveBadge}>
                          <Text style={styles.photoLiveBadgeText}>● LIVE</Text>
                        </View>
                        <View style={styles.photoFooter}>
                          <Text style={styles.photoFooterText} numberOfLines={1}>Photo #{idx + 1}</Text>
                        </View>
                      </View>
                    ))}

                    {fieldVideo ? (
                      <View style={[styles.photoCard, { borderColor: cardBorder, backgroundColor: '#0f172a' }]}>
                        <View style={styles.videoPlaceholder}>
                          <Ionicons name="videocam" size={24} color="#38bdf8" />
                          <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#38bdf8', marginTop: 4 }}>
                            1-Min Field Video
                          </Text>
                          <View style={[styles.photoLiveBadge, { top: 6, left: 6 }]}>
                            <Text style={styles.photoLiveBadgeText}>● LIVE</Text>
                          </View>
                        </View>
                      </View>
                    ) : null}
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
                    }

                    return (
                      <View key={act.id} style={[styles.activityCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                          <View style={[styles.activityIconCircle, { backgroundColor: badgeBg }]}>
                            <Ionicons name={iconName} size={16} color={badgeColor} />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                              <Text style={[styles.activityTitle, { color: textColor }]}>{act.title}</Text>
                              {act.cost ? (
                                <Text style={[styles.activityCost, { color: '#059669' }]}>
                                  ₹{act.cost.toLocaleString('en-IN')}
                                </Text>
                              ) : null}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <View style={[styles.activityBadge, { backgroundColor: badgeBg }]}>
                                <Text style={[styles.activityBadgeText, { color: badgeColor }]}>{act.type}</Text>
                              </View>
                              <Text style={[styles.activityDate, { color: subTextColor }]}>🗓️ {act.date}</Text>
                              {act.quantity ? (
                                <Text style={[styles.activityDate, { color: subTextColor }]}>• {act.quantity}</Text>
                              ) : null}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
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
    width: 105,
    height: 105,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
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

