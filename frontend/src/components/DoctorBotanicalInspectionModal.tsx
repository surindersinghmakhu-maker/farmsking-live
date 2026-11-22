import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { resolveMediaUrl } from '@/src/api/client';
import { PlantCareType } from '@/src/api/gardens.api';
import {
  useGardenerBotanicalProfile,
  usePrescribePlantCare,
  useRecordDoctorConsultationNote,
} from '@/src/hooks/useGardens';

const theme = RoleThemes.GARDEN_ADVISOR;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface DoctorBotanicalInspectionModalProps {
  visible: boolean;
  gardenerId: string | null;
  onClose: () => void;
}

type ModalTab = 'SPACES' | 'PLANTS' | 'PATHOLOGY' | 'PRESCRIBE';

const CARE_TYPE_OPTIONS: { type: PlantCareType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { type: 'WATERING', label: 'Watering Cycle', icon: 'water-outline', color: '#38bdf8' },
  { type: 'FERTILIZER', label: 'Nutrient Feed', icon: 'nutrition-outline', color: '#4ade80' },
  { type: 'PEST_INSPECTION', label: 'Pest Spray (Neem/Organic)', icon: 'bug-outline', color: '#f43f5e' },
  { type: 'PRUNING', label: 'Pruning & Trimming', icon: 'cut-outline', color: '#fbbf24' },
  { type: 'REPOTTING', label: 'Pot & Soil Mix', icon: 'cube-outline', color: '#a855f7' },
  { type: 'SUNLIGHT_ROTATION', label: 'Sunlight Exposure', icon: 'sunny-outline', color: '#fb923c' },
];

export function DoctorBotanicalInspectionModal({
  visible,
  gardenerId,
  onClose,
}: DoctorBotanicalInspectionModalProps) {
  const { colors, isLight } = useExecutiveTheme();
  const { data: profile, isLoading, refetch } = useGardenerBotanicalProfile(visible ? gardenerId : null);
  const prescribeMutation = usePrescribePlantCare();
  const consultationNoteMutation = useRecordDoctorConsultationNote();

  const [activeTab, setActiveTab] = useState<ModalTab>('SPACES');

  // Prescription Form State
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [selectedCareType, setSelectedCareType] = useState<PlantCareType>('WATERING');
  const [prescTitle, setPrescTitle] = useState('');
  const [prescInstructions, setPrescInstructions] = useState('');
  const [prescInterval, setPrescInterval] = useState('7');
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false);

  // Quick Clinical Note
  const [doctorNote, setDoctorNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const gardener = profile?.gardener;
  const gardens = profile?.gardens || [];
  const standalonePlants = profile?.standalonePlants || [];
  const diagnoses = profile?.diagnoses || [];

  const allPlants = [
    ...standalonePlants,
    ...gardens.flatMap((g) => (g.plants || []).map((p) => ({ ...p, gardenName: g.name }))),
  ];

  const handlePrescribeCare = async () => {
    if (!gardenerId) return;
    if (!prescTitle.trim()) {
      const msg = 'Please enter a prescription title or remedy name.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Required', msg);
      return;
    }

    const intervalDays = parseInt(prescInterval, 10);
    if (isNaN(intervalDays) || intervalDays < 1) {
      const msg = 'Please enter a valid interval in days (minimum 1 day).';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Invalid Interval', msg);
      return;
    }

    tap();
    setIsSubmittingPrescription(true);
    try {
      await prescribeMutation.mutateAsync({
        gardenerId,
        plantId: selectedPlantId || undefined,
        careType: selectedCareType,
        title: prescTitle.trim(),
        instructions: prescInstructions.trim() || undefined,
        intervalDays,
      });

      const successMsg = 'Digital care prescription generated and synced with client schedule!';
      if (Platform.OS === 'web') alert('✅ ' + successMsg);
      else Alert.alert('Prescription Issued', successMsg);

      setPrescTitle('');
      setPrescInstructions('');
      refetch();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to issue prescription.';
      if (Platform.OS === 'web') alert('❌ ' + errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmittingPrescription(false);
    }
  };

  const handleSaveConsultationNote = async () => {
    if (!gardenerId || !selectedPlantId) {
      const msg = 'Please select a specific plant before saving clinical consultation notes.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Select Plant', msg);
      return;
    }
    if (!doctorNote.trim()) return;

    tap();
    setIsSavingNote(true);
    try {
      await consultationNoteMutation.mutateAsync({
        gardenerId,
        plantId: selectedPlantId,
        notes: doctorNote.trim(),
        conditionStatus: 'DOCTOR_PRESCRIBED',
      });

      const successMsg = 'Clinical consultation note saved to plant health timeline.';
      if (Platform.OS === 'web') alert('✅ ' + successMsg);
      else Alert.alert('Note Saved', successMsg);

      setDoctorNote('');
      refetch();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save note.';
      if (Platform.OS === 'web') alert('❌ ' + errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isLight ? '#ffffff' : '#090e17',
              borderColor: isLight ? '#cbd5e1' : 'rgba(168, 85, 247, 0.3)',
            },
          ]}
        >
          {/* Header Bar */}
          <LinearGradient colors={['#1a0b2e', '#0f051d']} style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.doctorBadge}>
                <Ionicons name="medical" size={13} color="#a855f7" />
                <Text style={styles.doctorBadgeText}>Horticultural Clinical Audit</Text>
              </View>
              <Text style={styles.clientTitle}>{gardener?.name || 'Patient Botanical Profile'}</Text>
              <Text style={styles.clientSubtitle}>
                {[gardener?.kingId, gardener?.village, gardener?.district, gardener?.state]
                  .filter(Boolean)
                  .join(' • ') || 'Verified FarmsKing Gardener'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Quick Contact & Plan Strip */}
          <View
            style={[
              styles.contactStrip,
              {
                backgroundColor: isLight ? '#f8fafc' : '#0c1322',
                borderColor: isLight ? '#e2e8f0' : '#1e293b',
              },
            ]}
          >
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={15} color="#38bdf8" />
              <TouchableOpacity
                onPress={() => gardener?.mobile && Linking.openURL(`tel:${gardener.mobile}`)}
                activeOpacity={0.7}
              >
                <Text style={[styles.contactText, { color: '#38bdf8' }]}>
                  {gardener?.mobile || 'No Mobile'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactItem}>
              <Ionicons name="leaf-outline" size={15} color="#4ade80" />
              <Text style={[styles.contactText, { color: isLight ? '#334155' : '#94a3b8' }]}>
                {allPlants.length} Plants in Care
              </Text>
            </View>

            <View style={styles.planPill}>
              <Ionicons name="shield-checkmark" size={12} color="#a855f7" />
              <Text style={styles.planPillText}>
                {gardener?.gardenerPlan?.plan || 'GARDEN PASS'}
              </Text>
            </View>
          </View>

          {/* Multi-Tab Navigation */}
          <View style={[styles.tabsRow, { borderBottomColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
            {(
              [
                { key: 'SPACES', label: '🏡 Gardens', count: gardens.length },
                { key: 'PLANTS', label: '🪴 Plants & Pots', count: allPlants.length },
                { key: 'PATHOLOGY', label: '🔬 AI Leaf Pathology', count: diagnoses.length },
                { key: 'PRESCRIBE', label: '💊 Prescribe Routine', count: undefined },
              ] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
                onPress={() => {
                  tap();
                  setActiveTab(tab.key);
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                  {tab.label}
                  {tab.count !== undefined ? ` (${tab.count})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content Area */}
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#a855f7" />
              <Text style={[styles.loadingText, { color: isLight ? '#64748b' : '#94a3b8' }]}>
                Loading patient botanical records...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyScrollContent}>
              {/* TAB 1: SPACES (GARDENS) */}
              {activeTab === 'SPACES' && (
                <View style={styles.tabContentBlock}>
                  {gardens.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons name="flower-outline" size={40} color="#64748b" />
                      <Text style={styles.emptyTitle}>No Garden Spaces Added</Text>
                      <Text style={styles.emptySub}>
                        This gardener has potted plants recorded without dedicated balcony/terrace spaces.
                      </Text>
                    </View>
                  ) : (
                    gardens.map((g) => (
                      <View
                        key={g.id}
                        style={[
                          styles.gardenCard,
                          {
                            backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                            borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                          },
                        ]}
                      >
                        <View style={styles.gardenHeaderRow}>
                          <View>
                            <Text style={[styles.gardenName, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                              {g.name}
                            </Text>
                            <Text style={styles.gardenMeta}>
                              {g.gardenType} • Sunlight: {g.sunlightExposure || 'Natural'} • Water: {g.wateringSource || 'Tap'}
                            </Text>
                          </View>
                          <View style={styles.healthScoreBox}>
                            <Text style={styles.healthScoreVal}>{g.healthScore}%</Text>
                            <Text style={styles.healthScoreLbl}>Vitality</Text>
                          </View>
                        </View>

                        <View style={styles.plantChipsRow}>
                          {(g.plants || []).map((p) => (
                            <View key={p.id} style={styles.plantChip}>
                              <Text style={styles.plantChipText}>{p.name}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TAB 2: PLANTS & POTS */}
              {activeTab === 'PLANTS' && (
                <View style={styles.tabContentBlock}>
                  {allPlants.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons name="leaf-outline" size={40} color="#64748b" />
                      <Text style={styles.emptyTitle}>No Monitored Plants Found</Text>
                      <Text style={styles.emptySub}>Client has not registered botanical pots yet.</Text>
                    </View>
                  ) : (
                    <View style={styles.plantsGrid}>
                      {allPlants.map((plant: any) => {
                        const isSelected = selectedPlantId === plant.id;
                        const isCritical =
                          plant.healthStatus === 'CRITICAL' || plant.healthStatus === 'NEEDS_CARE';
                        return (
                          <TouchableOpacity
                            key={plant.id}
                            style={[
                              styles.plantCard,
                              {
                                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                                borderColor: isSelected
                                  ? '#a855f7'
                                  : isCritical
                                  ? 'rgba(239, 68, 68, 0.4)'
                                  : isLight
                                  ? '#e2e8f0'
                                  : 'rgba(255, 255, 255, 0.08)',
                              },
                            ]}
                            onPress={() => {
                              tap();
                              setSelectedPlantId(plant.id);
                              setPrescTitle(`Clinical Care for ${plant.name}`);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={styles.plantCardHeader}>
                              {plant.photoUrl ? (
                                <Image
                                  source={{ uri: resolveMediaUrl(plant.photoUrl) }}
                                  style={styles.plantThumb}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={[styles.plantThumb, styles.plantThumbPlaceholder]}>
                                  <Ionicons name="leaf" size={20} color="#a855f7" />
                                </View>
                              )}

                              <View style={styles.plantMainInfo}>
                                <Text
                                  style={[
                                    styles.plantCardName,
                                    { color: isLight ? '#0f172a' : '#ffffff' },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {plant.name}
                                </Text>
                                <Text style={styles.plantCardSub} numberOfLines={1}>
                                  {plant.species || plant.variety || 'Domestic Flora'}
                                </Text>
                                <View
                                  style={[
                                    styles.statusPill,
                                    {
                                      backgroundColor: isCritical
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : 'rgba(74, 222, 128, 0.15)',
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusPillText,
                                      { color: isCritical ? '#f87171' : '#4ade80' },
                                    ]}
                                  >
                                    {plant.healthStatus || 'HEALTHY'}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View style={styles.plantCardDetails}>
                              <Text style={styles.detailText}>
                                Pot: {plant.potSizeInches ? `${plant.potSizeInches}" ` : ''}
                                {plant.potType || 'Container'} • {plant.locationType || 'Indoor'}
                              </Text>
                              {plant.gardenName ? (
                                <Text style={styles.gardenTagText}>Space: {plant.gardenName}</Text>
                              ) : null}
                            </View>

                            <TouchableOpacity
                              style={[
                                styles.selectPlantBtn,
                                isSelected && { backgroundColor: '#a855f7' },
                              ]}
                              onPress={() => {
                                tap();
                                setSelectedPlantId(plant.id);
                                setActiveTab('PRESCRIBE');
                                setPrescTitle(`Target Routine: ${plant.name}`);
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={isSelected ? 'checkmark-circle' : 'create-outline'}
                                size={14}
                                color={isSelected ? '#ffffff' : '#a855f7'}
                              />
                              <Text
                                style={[
                                  styles.selectPlantBtnText,
                                  isSelected && { color: '#ffffff' },
                                ]}
                              >
                                {isSelected ? 'Selected for Rx' : 'Prescribe Routine'}
                              </Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* TAB 3: AI LEAF PATHOLOGY */}
              {activeTab === 'PATHOLOGY' && (
                <View style={styles.tabContentBlock}>
                  {diagnoses.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons name="scan-outline" size={40} color="#64748b" />
                      <Text style={styles.emptyTitle}>No AI Leaf Scans On Record</Text>
                      <Text style={styles.emptySub}>
                        When the gardener scans their plant leaves, AI diagnostic cards will appear here for doctor review.
                      </Text>
                    </View>
                  ) : (
                    diagnoses.map((diag) => (
                      <View
                        key={diag.id}
                        style={[
                          styles.diagCard,
                          {
                            backgroundColor: isLight ? '#ffffff' : '#0f172a',
                            borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                          },
                        ]}
                      >
                        <View style={styles.diagHeader}>
                          {diag.leafPhotoUrl ? (
                            <Image
                              source={{ uri: resolveMediaUrl(diag.leafPhotoUrl) }}
                              style={styles.diagPhoto}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.diagPhoto, styles.plantThumbPlaceholder]}>
                              <Ionicons name="image-outline" size={24} color="#64748b" />
                            </View>
                          )}

                          <View style={styles.diagInfo}>
                            <View style={styles.diagBadgeRow}>
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{diag.category}</Text>
                              </View>
                              <Text style={styles.confidenceText}>{diag.confidence} match</Text>
                            </View>

                            <Text style={[styles.diagIssue, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                              {diag.detectedIssue}
                            </Text>

                            <Text style={styles.diagPlantTag}>
                              {diag.plant?.name ? `Bound to: ${diag.plant.name}` : 'Unbound Leaf Scan'}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.remedyBox,
                            { backgroundColor: isLight ? '#f0fdf4' : 'rgba(74, 222, 128, 0.08)' },
                          ]}
                        >
                          <Text style={styles.remedyTitle}>🌿 AI Organic Remedy:</Text>
                          <Text style={[styles.remedyBody, { color: isLight ? '#166534' : '#86efac' }]}>
                            {diag.organicRemedy}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.applyRemedyBtn}
                          onPress={() => {
                            tap();
                            if (diag.plantId) setSelectedPlantId(diag.plantId);
                            setPrescTitle(`Remedy for ${diag.detectedIssue}`);
                            setPrescInstructions(diag.organicRemedy);
                            setSelectedCareType('PEST_INSPECTION');
                            setActiveTab('PRESCRIBE');
                          }}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="medical-outline" size={15} color="#a855f7" />
                          <Text style={styles.applyRemedyBtnText}>Adopt as Doctor Prescription</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TAB 4: PRESCRIBE ROUTINE */}
              {activeTab === 'PRESCRIBE' && (
                <View style={styles.tabContentBlock}>
                  <View
                    style={[
                      styles.prescriptionBox,
                      {
                        backgroundColor: isLight ? '#ffffff' : '#0f172a',
                        borderColor: isLight ? '#e2e8f0' : 'rgba(168, 85, 247, 0.25)',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                      Digital Horticultural Prescription
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Configure watering, organic feeding, pest sprays, or soil recommendations directly to the gardener's daily calendar.
                    </Text>

                    {/* Target Plant Selector */}
                    <Text style={styles.inputLabel}>1. Select Target Plant (Optional - Garden-wide if empty):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plantSelectorScroll}>
                      <TouchableOpacity
                        style={[
                          styles.plantSelectorPill,
                          !selectedPlantId && styles.plantSelectorPillActive,
                        ]}
                        onPress={() => {
                          tap();
                          setSelectedPlantId('');
                        }}
                      >
                        <Text
                          style={[
                            styles.plantSelectorPillText,
                            !selectedPlantId && styles.plantSelectorPillTextActive,
                          ]}
                        >
                          🌿 Entire Garden Space
                        </Text>
                      </TouchableOpacity>

                      {allPlants.map((plant: any) => (
                        <TouchableOpacity
                          key={plant.id}
                          style={[
                            styles.plantSelectorPill,
                            selectedPlantId === plant.id && styles.plantSelectorPillActive,
                          ]}
                          onPress={() => {
                            tap();
                            setSelectedPlantId(plant.id);
                          }}
                        >
                          <Text
                            style={[
                              styles.plantSelectorPillText,
                              selectedPlantId === plant.id && styles.plantSelectorPillTextActive,
                            ]}
                          >
                            🪴 {plant.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Care Type Options */}
                    <Text style={styles.inputLabel}>2. Care Routine Type:</Text>
                    <View style={styles.careTypeGrid}>
                      {CARE_TYPE_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.type}
                          style={[
                            styles.careTypeCard,
                            selectedCareType === opt.type && {
                              borderColor: opt.color,
                              backgroundColor: `${opt.color}15`,
                            },
                          ]}
                          onPress={() => {
                            tap();
                            setSelectedCareType(opt.type);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={opt.icon} size={18} color={opt.color} />
                          <Text style={[styles.careTypeCardLabel, { color: opt.color }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Title Input */}
                    <Text style={styles.inputLabel}>3. Prescription Title / Remedy Name:</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isLight ? '#f8fafc' : '#090e17',
                          color: isLight ? '#0f172a' : '#ffffff',
                          borderColor: isLight ? '#cbd5e1' : '#334155',
                        },
                      ]}
                      value={prescTitle}
                      onChangeText={setPrescTitle}
                      placeholder="e.g. Cold-Pressed Neem Oil Spray at Sunset"
                      placeholderTextColor="#64748b"
                    />

                    {/* Frequency Interval */}
                    <Text style={styles.inputLabel}>4. Repeat Frequency (Every N Days):</Text>
                    <View style={styles.intervalRow}>
                      {['1', '2', '3', '7', '14', '30'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[
                            styles.intervalPill,
                            prescInterval === d && styles.intervalPillActive,
                          ]}
                          onPress={() => {
                            tap();
                            setPrescInterval(d);
                          }}
                        >
                          <Text
                            style={[
                              styles.intervalPillText,
                              prescInterval === d && styles.intervalPillTextActive,
                            ]}
                          >
                            {d === '1' ? 'Daily' : `Every ${d}d`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Clinical Instructions */}
                    <Text style={styles.inputLabel}>5. Doctor Instructions & Application Guide:</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        {
                          backgroundColor: isLight ? '#f8fafc' : '#090e17',
                          color: isLight ? '#0f172a' : '#ffffff',
                          borderColor: isLight ? '#cbd5e1' : '#334155',
                        },
                      ]}
                      value={prescInstructions}
                      onChangeText={setPrescInstructions}
                      placeholder="e.g. Dilute 5ml neem oil with 1L water and 2 drops mild soap. Spray underside of leaves at dusk. Avoid midday sun."
                      placeholderTextColor="#64748b"
                      multiline
                      numberOfLines={4}
                    />

                    {/* Action Button */}
                    <TouchableOpacity
                      style={[
                        styles.prescribeSubmitBtn,
                        isSubmittingPrescription && { opacity: 0.6 },
                      ]}
                      onPress={handlePrescribeCare}
                      disabled={isSubmittingPrescription}
                      activeOpacity={0.8}
                    >
                      {isSubmittingPrescription ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                          <Text style={styles.prescribeSubmitBtnText}>
                            Issue Digital Care Prescription
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Quick Clinical Note Section */}
                  {selectedPlantId ? (
                    <View
                      style={[
                        styles.prescriptionBox,
                        {
                          marginTop: 16,
                          backgroundColor: isLight ? '#ffffff' : '#0f172a',
                          borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                        },
                      ]}
                    >
                      <Text style={[styles.sectionHeading, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                        Record Clinical Plant Health Note
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.textArea,
                          {
                            backgroundColor: isLight ? '#f8fafc' : '#090e17',
                            color: isLight ? '#0f172a' : '#ffffff',
                            borderColor: isLight ? '#cbd5e1' : '#334155',
                          },
                        ]}
                        value={doctorNote}
                        onChangeText={setDoctorNote}
                        placeholder="Log clinical observation, root health, foliage discoloration notes..."
                        placeholderTextColor="#64748b"
                        multiline
                        numberOfLines={3}
                      />
                      <TouchableOpacity
                        style={[styles.saveNoteBtn, isSavingNote && { opacity: 0.6 }]}
                        onPress={handleSaveConsultationNote}
                        disabled={isSavingNote}
                        activeOpacity={0.8}
                      >
                        {isSavingNote ? (
                          <ActivityIndicator size="small" color="#a855f7" />
                        ) : (
                          <>
                            <Ionicons name="save-outline" size={16} color="#a855f7" />
                            <Text style={styles.saveNoteBtnText}>Save Consultation Note</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '90%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerLeft: {
    flex: 1,
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    marginBottom: 6,
  },
  doctorBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#c084fc',
    textTransform: 'uppercase',
  },
  clientTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  clientSubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  planPillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#a855f7',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#a855f7',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  tabBtnTextActive: {
    color: '#a855f7',
    fontFamily: FONT.bold,
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  bodyScroll: {
    flex: 1,
  },
  bodyScrollContent: {
    padding: 18,
  },
  tabContentBlock: {
    gap: 14,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 400,
  },
  gardenCard: {
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 12,
  },
  gardenHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gardenName: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  gardenMeta: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  healthScoreBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  healthScoreVal: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#4ade80',
  },
  healthScoreLbl: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#4ade80',
    textTransform: 'uppercase',
  },
  plantChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  plantChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  plantChipText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#c084fc',
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  plantCard: {
    width: '48.5%',
    minWidth: 260,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  plantCardHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  plantThumb: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
  },
  plantThumbPlaceholder: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantMainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  plantCardName: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  plantCardSub: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  plantCardDetails: {
    gap: 2,
  },
  detailText: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#64748b',
  },
  gardenTagText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#a855f7',
  },
  selectPlantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    marginTop: 4,
  },
  selectPlantBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#a855f7',
  },
  diagCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 10,
  },
  diagHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  diagPhoto: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
  },
  diagInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  diagBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#f87171',
    textTransform: 'uppercase',
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  diagIssue: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    marginTop: 4,
  },
  diagPlantTag: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#38bdf8',
    marginTop: 2,
  },
  remedyBox: {
    padding: 10,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  remedyTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#4ade80',
  },
  remedyBody: {
    fontSize: 12,
    fontFamily: FONT.regular,
    lineHeight: 18,
  },
  applyRemedyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  applyRemedyBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
  prescriptionBox: {
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: -6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
  },
  plantSelectorScroll: {
    flexDirection: 'row',
  },
  plantSelectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 8,
  },
  plantSelectorPillActive: {
    backgroundColor: '#a855f7',
  },
  plantSelectorPillText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  plantSelectorPillTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  careTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  careTypeCard: {
    width: '31.5%',
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  careTypeCardLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  input: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    fontFamily: FONT.medium,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  intervalPillActive: {
    backgroundColor: '#a855f7',
  },
  intervalPillText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  intervalPillTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  prescribeSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  prescribeSubmitBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    marginTop: 4,
  },
  saveNoteBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
});
