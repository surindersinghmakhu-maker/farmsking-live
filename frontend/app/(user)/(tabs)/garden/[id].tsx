import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  useGarden,
  useGardenPlants,
  useAddPlant,
  useCareTasks,
  useCompleteCareTask,
  useAddCareSchedule,
} from '@/src/hooks/useGardens';
import { PlantCareType } from '@/src/api/gardens.api';

const theme = RoleThemes.GARDENER;

const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

type TabType = 'OVERVIEW' | 'PLANTS' | 'SCHEDULE' | 'MEDICAL' | 'SHOP';

const CARE_TYPE_CONFIG: Record<PlantCareType, { label: string; icon: any; color: string; bg: string }> = {
  WATERING: { label: 'Watering', icon: 'water', color: '#0284c7', bg: '#082f49' },
  FERTILIZER: { label: 'Fertilizer & Nutrition', icon: 'flask', color: '#16a34a', bg: '#052e16' },
  PRUNING: { label: 'Pruning & Trimming', icon: 'cut', color: '#b45309', bg: '#451a03' },
  REPOTTING: { label: 'Repotting & Soil', icon: 'cube', color: '#9333ea', bg: '#3b0764' },
  PEST_INSPECTION: { label: 'Pest Inspection', icon: 'bug', color: '#dc2626', bg: '#450a0a' },
  MISTING: { label: 'Foliage Misting', icon: 'cloud-download', color: '#0d9488', bg: '#134e4a' },
  SUNLIGHT_ROTATION: { label: 'Sunlight Rotation', icon: 'sunny', color: '#ea580c', bg: '#431407' },
};

const RECOMMENDED_SUPPLIES = [
  { id: '1', title: 'Organic Neem Seed Cake & Bio-Fertilizer', price: '₹280', rating: '4.9', icon: 'leaf' },
  { id: '2', title: 'Compressed High-Yield Cocopeat Block (5kg)', price: '₹199', rating: '4.8', icon: 'cube' },
  { id: '3', title: 'Liquid Seaweed Extract Foliar Spray (500ml)', price: '₹349', rating: '5.0', icon: 'flask' },
  { id: '4', title: 'Stainless Steel Ergonomic Garden Hand Trowel', price: '₹220', rating: '4.7', icon: 'construct' },
];

export default function GardenDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: garden, isLoading: isGardenLoading } = useGarden(id);
  const { data: plants = [], isLoading: isPlantsLoading } = useGardenPlants(id);
  const { data: allCareTasks = [] } = useCareTasks(false);

  const addPlant = useAddPlant();
  const completeCareTask = useCompleteCareTask();
  const addCareSchedule = useAddCareSchedule();

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Add Plant Modal State
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [plantName, setPlantName] = useState('');
  const [plantSpecies, setPlantSpecies] = useState('');
  const [potSize, setPotSize] = useState('10');
  const [potType, setPotType] = useState('Ceramic');
  const [isSubmittingPlant, setIsSubmittingPlant] = useState(false);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulePlantId, setSchedulePlantId] = useState('');
  const [scheduleCareType, setScheduleCareType] = useState<PlantCareType>('WATERING');
  const [scheduleDays, setScheduleDays] = useState('3');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Filter schedules that belong to this garden or its plants
  const gardenSchedules = allCareTasks.filter(
    (s) => s.gardenId === id || plants.some((p) => p.id === s.plantId)
  );

  const handleCreatePlant = async () => {
    if (!plantName.trim()) {
      alert('Please enter a plant name.');
      return;
    }
    setIsSubmittingPlant(true);
    try {
      await addPlant.mutateAsync({
        gardenId: id,
        payload: {
          name: plantName.trim(),
          species: plantSpecies.trim() || undefined,
          potSizeInches: potSize ? parseFloat(potSize) : undefined,
          potType,
        },
      });
      setShowAddPlantModal(false);
      setPlantName('');
      setPlantSpecies('');
    } catch {
      alert('Failed to register plant.');
    } finally {
      setIsSubmittingPlant(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!schedulePlantId) {
      alert('Please select a plant.');
      return;
    }
    const days = parseInt(scheduleDays, 10);
    if (isNaN(days) || days < 1) {
      alert('Please enter a valid interval in days.');
      return;
    }
    setIsSubmittingSchedule(true);
    try {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + days);

      await addCareSchedule.mutateAsync({
        plantId: schedulePlantId,
        careType: scheduleCareType,
        title: scheduleTitle.trim() || `${CARE_TYPE_CONFIG[scheduleCareType].label} Routine`,
        intervalDays: days,
        nextDueDate: nextDue.toISOString(),
      });
      setShowScheduleModal(false);
      setSchedulePlantId('');
      setScheduleTitle('');
    } catch {
      alert('Failed to schedule care task.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    tap();
    try {
      await completeCareTask.mutateAsync(taskId);
    } catch {
      alert('Failed to complete task.');
    }
  };

  if (isGardenLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (!garden) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Garden Space Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Gardens</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        {(['OVERVIEW', 'PLANTS', 'SCHEDULE', 'MEDICAL', 'SHOP'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => {
              tap();
              setActiveTab(tab);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'OVERVIEW'
                ? 'Overview'
                : tab === 'PLANTS'
                ? `Plants (${plants.length})`
                : tab === 'SCHEDULE'
                ? `Care Routine (${gardenSchedules.length})`
                : tab === 'MEDICAL'
                ? 'Plant Pathology'
                : 'FarmsKing Supplies'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Garden Health & Specification Card */}
      <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardHeaderTitle}>Garden Health & Telemetry</Text>
            <Text style={styles.cardHeaderSub}>ISO 9001:2015 agronomic standards rating</Text>
          </View>
          <View style={[styles.scoreCircle, { borderColor: '#10b981' }]}>
            <Text style={styles.scoreCircleText}>{garden.healthScore}%</Text>
          </View>
        </View>

        <View style={styles.specGrid}>
          <View style={styles.specItem}>
            <Ionicons name="sunny-outline" size={16} color="#f59e0b" />
            <Text style={styles.specLabel}>Sunlight</Text>
            <Text style={styles.specValue}>
              {garden.sunlightExposure ? garden.sunlightExposure.replace('_', ' ') : 'Full Sunlight'}
            </Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="water-outline" size={16} color="#0284c7" />
            <Text style={styles.specLabel}>Watering</Text>
            <Text style={styles.specValue}>
              {garden.wateringSource ? garden.wateringSource.replace('_', ' ') : 'Manual Hose'}
            </Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="leaf-outline" size={16} color="#10b981" />
            <Text style={styles.specLabel}>Total Plants</Text>
            <Text style={styles.specValue}>{plants.length} Cultivated</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="calendar-outline" size={16} color="#8b5cf6" />
            <Text style={styles.specLabel}>Care Routines</Text>
            <Text style={styles.specValue}>{gardenSchedules.length} Active</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => setShowAddPlantModal(true)}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.actionBtnText}>Add Plant</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => router.push(`/garden/report-issue?gardenId=${id}` as any)}
          >
            <Ionicons name="warning-outline" size={16} color="#dc2626" />
            <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Report Plant Issue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Certified Advisor Banner */}
      <TouchableOpacity
        style={[styles.advisorBanner, premiumShadow('#0f172a', 'xs')]}
        onPress={() => router.push('/garden/advisors' as any)}
      >
        <LinearGradient colors={['#0f172a', '#14532d']} style={styles.advisorBannerContent}>
          <View style={styles.advisorIconCircle}>
            <Ionicons name="person" size={22} color="#4ade80" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.advisorBannerTitle}>Certified Garden Doctor Consultation</Text>
            <Text style={styles.advisorBannerSub}>
              Connect with university-certified plant agronomists for monthly garden visits & care plans.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4ade80" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPlants = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Plants in this Garden ({plants.length})</Text>
        <TouchableOpacity style={styles.addPlantBtn} onPress={() => setShowAddPlantModal(true)}>
          <Ionicons name="add" size={15} color="#ffffff" />
          <Text style={styles.addPlantBtnText}>+ Add Plant</Text>
        </TouchableOpacity>
      </View>

      {isPlantsLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 30 }} />
      ) : plants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flower-outline" size={40} color="#64748b" />
          <Text style={styles.emptyTitle}>No Plants Added Yet</Text>
          <Text style={styles.emptySub}>
            Register your flowers, herbs, vegetable saplings, or shrubs in this garden.
          </Text>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setShowAddPlantModal(true)}>
            <Text style={styles.actionBtnText}>Add First Plant</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.plantsGrid}>
          {plants.map((p) => (
            <View key={p.id} style={[styles.plantCard, premiumShadow('#0f172a', 'xs')]}>
              <View style={styles.plantIconWrap}>
                <Ionicons name="leaf" size={22} color="#10b981" />
              </View>
              <View style={styles.plantInfo}>
                <Text style={styles.plantName}>{p.name}</Text>
                <Text style={styles.plantSpecies}>{p.species || 'Botanical Variety'}</Text>
                <View style={styles.lifecycleBadge}>
                  <Text style={styles.lifecycleText}>
                    {p.potSizeInches ? `${p.potSizeInches}" Pot` : 'Standard Pot'} • {p.healthStatus || 'HEALTHY'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.scheduleMiniBtn}
                onPress={() => {
                  setSchedulePlantId(p.id);
                  setShowScheduleModal(true);
                }}
              >
                <Ionicons name="alarm" size={14} color="#059669" />
                <Text style={styles.scheduleMiniBtnText}>Set Routine</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Care & Watering Routines</Text>
        <TouchableOpacity style={styles.addPlantBtn} onPress={() => setShowScheduleModal(true)}>
          <Ionicons name="add" size={15} color="#ffffff" />
          <Text style={styles.addPlantBtnText}>+ New Routine</Text>
        </TouchableOpacity>
      </View>

      {gardenSchedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alarm-outline" size={40} color="#64748b" />
          <Text style={styles.emptyTitle}>No Care Routines Configured</Text>
          <Text style={styles.emptySub}>
            Set up automatic reminders for watering, bio-fertilizer feeding, pruning, or repotting.
          </Text>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setShowScheduleModal(true)}>
            <Text style={styles.actionBtnText}>Schedule Care Reminder</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tasksList}>
          {gardenSchedules.map((task) => {
            const cfg = CARE_TYPE_CONFIG[task.careType] || CARE_TYPE_CONFIG.WATERING;
            return (
              <View key={task.id} style={[styles.taskCard, premiumShadow('#0f172a', 'xs')]}>
                <View style={[styles.taskIconCircle, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskPlantName}>{task.plant?.name || 'Plant'}</Text>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskInterval}>
                    Interval: Every {task.intervalDays} days • Next Due:{' '}
                    {new Date(task.nextDueDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.taskDoneBtn}
                  onPress={() => handleCompleteTask(task.id)}
                >
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                  <Text style={styles.taskDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderMedical = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Plant Pathology & Health Records</Text>
      </View>
      <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
        <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
          <View style={styles.scannerIconBg}>
            <Ionicons name="scan" size={32} color="#e11d48" />
          </View>
          <Text style={styles.scannerTitle}>AI Leaf Disease Scanner</Text>
          <Text style={styles.scannerSub}>
            Take a clear photo of discolored leaves, yellow veins, or pests to get instant organic
            remedies.
          </Text>
          <TouchableOpacity
            style={styles.scannerBtn}
            onPress={() => router.push('/crop-disease-scanner' as any)}
          >
            <Ionicons name="camera" size={18} color="#ffffff" />
            <Text style={styles.scannerBtnText}>Scan Leaf Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderShop = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Verified Organic Supplies</Text>
      </View>
      <View style={styles.shopGrid}>
        {RECOMMENDED_SUPPLIES.map((item) => (
          <View key={item.id} style={[styles.shopCard, premiumShadow('#0f172a', 'xs')]}>
            <View style={styles.shopIconCircle}>
              <Ionicons name={item.icon as any} size={22} color="#059669" />
            </View>
            <Text style={styles.shopTitle}>{item.title}</Text>
            <View style={styles.shopBottomRow}>
              <Text style={styles.shopPrice}>{item.price}</Text>
              <View style={styles.shopRating}>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text style={styles.shopRatingText}>{item.rating}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.shopBuyBtn}
              onPress={() => router.push('/(user)/(tabs)/shop' as any)}
            >
              <Text style={styles.shopBuyBtnText}>Order on FarmsKing</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#14532d']} style={styles.header}>
        <View style={styles.headerWrapper}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {garden.name}
            </Text>
            <Text style={styles.headerLocation}>
              <Ionicons name="location" size={12} color="#cbd5e1" />{' '}
              {garden.location || 'Home Residence'} • {garden.gardenType.replace('_', ' ')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push('/garden/expenses' as any)}
          >
            <Ionicons name="wallet-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {renderTabs()}

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.desktopContainer}>
          {activeTab === 'OVERVIEW' && renderOverview()}
          {activeTab === 'PLANTS' && renderPlants()}
          {activeTab === 'SCHEDULE' && renderSchedule()}
          {activeTab === 'MEDICAL' && renderMedical()}
          {activeTab === 'SHOP' && renderShop()}
        </View>
      </ScrollView>

      {/* Add Plant Modal */}
      <Modal visible={showAddPlantModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Plant to {garden.name}</Text>
              <TouchableOpacity onPress={() => setShowAddPlantModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plant Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Basil / Money Plant / Rosemary"
                placeholderTextColor="#64748b"
                value={plantName}
                onChangeText={setPlantName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Botanical Variety (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ocimum basilicum"
                placeholderTextColor="#64748b"
                value={plantSpecies}
                onChangeText={setPlantSpecies}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Pot Size (Inches)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor="#64748b"
                  value={potSize}
                  onChangeText={setPotSize}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Pot Material</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ceramic / Terracotta"
                  placeholderTextColor="#64748b"
                  value={potType}
                  onChangeText={setPotType}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSubmittingPlant && { opacity: 0.7 }]}
              onPress={handleCreatePlant}
              disabled={isSubmittingPlant}
            >
              {isSubmittingPlant ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Plant</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Schedule Care Reminder Modal */}
      <Modal visible={showScheduleModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Care Routine</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Plant *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {plants.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.choicePill,
                      schedulePlantId === p.id && styles.choicePillActive,
                      { marginRight: 8 },
                    ]}
                    onPress={() => setSchedulePlantId(p.id)}
                  >
                    <Ionicons
                      name="leaf"
                      size={13}
                      color={schedulePlantId === p.id ? '#ffffff' : '#10b981'}
                    />
                    <Text
                      style={[
                        styles.choicePillText,
                        schedulePlantId === p.id && styles.choicePillTextActive,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Care Action Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(Object.keys(CARE_TYPE_CONFIG) as PlantCareType[]).map((ct) => {
                  const cfg = CARE_TYPE_CONFIG[ct];
                  return (
                    <TouchableOpacity
                      key={ct}
                      style={[
                        styles.choicePill,
                        scheduleCareType === ct && styles.choicePillActive,
                      ]}
                      onPress={() => setScheduleCareType(ct)}
                    >
                      <Ionicons
                        name={cfg.icon}
                        size={13}
                        color={scheduleCareType === ct ? '#ffffff' : cfg.color}
                      />
                      <Text
                        style={[
                          styles.choicePillText,
                          scheduleCareType === ct && styles.choicePillTextActive,
                        ]}
                      >
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency (Days)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3"
                placeholderTextColor="#64748b"
                value={scheduleDays}
                onChangeText={setScheduleDays}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!schedulePlantId || isSubmittingSchedule) && { opacity: 0.7 },
              ]}
              onPress={handleCreateSchedule}
              disabled={!schedulePlantId || isSubmittingSchedule}
            >
              {isSubmittingSchedule ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Routine</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090e17',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerWrapper: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  headerLocation: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginTop: 2,
  },

  tabContainer: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabScroll: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: '#1e293b',
  },
  tabBtnActive: {
    backgroundColor: '#059669',
  },
  tabText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },

  scrollBody: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  desktopContainer: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto',
  },
  tabContent: {
    gap: 16,
  },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  cardHeaderSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#052e16',
  },
  scoreCircleText: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#4ade80',
  },

  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  specItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 4,
  },
  specLabel: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  specValue: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  advisorBanner: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  advisorBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  advisorIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorBannerTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  advisorBannerSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  addPlantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  addPlantBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  plantCard: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  plantIconWrap: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  plantSpecies: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  lifecycleBadge: {
    marginTop: 4,
  },
  lifecycleText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#4ade80',
  },
  scheduleMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  scheduleMiniBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#4ade80',
  },

  tasksList: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  taskIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskPlantName: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  taskTitle: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginTop: 2,
  },
  taskInterval: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  taskDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  taskDoneBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  scannerIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#450a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  scannerSub: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 18,
  },
  scannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e11d48',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: RADIUS.pill,
    marginTop: 6,
  },
  scannerBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shopCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'space-between',
  },
  shopIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shopTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
    lineHeight: 18,
  },
  shopBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  shopPrice: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#4ade80',
  },
  shopRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  shopRatingText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#f59e0b',
  },
  shopBuyBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  shopBuyBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    maxWidth: 520,
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },
  choicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  choicePillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  choicePillText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  choicePillTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  saveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#ef4444',
    marginVertical: 12,
  },
  backBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
