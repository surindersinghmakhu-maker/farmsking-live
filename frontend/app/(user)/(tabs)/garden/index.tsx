import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ImageBackground,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  useMyGardens,
  useCreateGarden,
  useAllPlants,
  useAddPlant,
  useAddStandalonePlant,
  useCareTasks,
  useAddCareSchedule,
  useCompleteCareTask,
  useAiCreditStatus,
} from '@/src/hooks/useGardens';
import { useMyGardenerPlan } from '@/src/hooks/useGardenerPlan';
import { GardenAIChatbot } from '@/src/components/GardenAIChatbot';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useRole } from '@/src/store/role-context';
import { UnderMaintenanceView } from '@/src/components/UnderMaintenanceView';
import { GardenType, PlantCareType } from '@/src/api/gardens.api';

const theme = RoleThemes.GARDENER;

const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

const GARDEN_TYPES: { value: GardenType; label: string; icon: any }[] = [
  { value: 'BALCONY', label: 'Balcony Garden', icon: 'sunny-outline' },
  { value: 'TERRACE', label: 'Terrace / Rooftop', icon: 'cloud-outline' },
  { value: 'INDOOR', label: 'Indoor Garden', icon: 'home-outline' },
  { value: 'BACKYARD', label: 'Backyard Garden', icon: 'leaf-outline' },
  { value: 'OUTDOOR', label: 'Outdoor Lawn', icon: 'earth-outline' },
  { value: 'COMMERCIAL_NURSERY', label: 'Nursery / Greenhouse', icon: 'storefront-outline' },
];

const CARE_TYPE_CONFIG: Record<PlantCareType, { label: string; icon: any; color: string; bg: string }> = {
  WATERING: { label: 'Watering', icon: 'water', color: '#0284c7', bg: '#e0f2fe' },
  FERTILIZER: { label: 'Fertilizer & Nutrition', icon: 'flask', color: '#16a34a', bg: '#dcfce7' },
  PRUNING: { label: 'Pruning & Trimming', icon: 'cut', color: '#b45309', bg: '#fef3c7' },
  REPOTTING: { label: 'Repotting & Soil Mix', icon: 'cube', color: '#9333ea', bg: '#f3e8ff' },
  PEST_INSPECTION: { label: 'Pest Inspection', icon: 'bug', color: '#dc2626', bg: '#fee2e2' },
  MISTING: { label: 'Foliage Misting', icon: 'cloud-download', color: '#0d9488', bg: '#ccfbf1' },
  SUNLIGHT_ROTATION: { label: 'Sunlight Rotation', icon: 'sunny', color: '#ea580c', bg: '#ffedd5' },
};

const SUNLIGHT_OPTIONS = [
  { value: 'FULL_SUN', label: 'Full Sunlight (6+ hrs)' },
  { value: 'PARTIAL_SHADE', label: 'Partial Shade (3-6 hrs)' },
  { value: 'INDIRECT_LIGHT', label: 'Bright Indirect Light' },
  { value: 'LOW_LIGHT', label: 'Low Indoor Light' },
];

const WATERING_OPTIONS = [
  { value: 'DRIP_IRRIGATION', label: 'Drip System' },
  { value: 'MANUAL_HOSE', label: 'Garden Hose' },
  { value: 'CAN_WATERING', label: 'Watering Can' },
  { value: 'AUTOMATIC_MIST', label: 'Auto Mist' },
];

const POT_TYPES = ['Ceramic', 'Terracotta / Clay', 'Plastic Planter', 'Fabric Grow Bag', 'Cement Urn', 'Hanging Basket'];

const GARDEN_BG_IMAGES = [
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1416879598555-22008fb944e8?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1000',
];

export default function GardensScreen() {
  const router = useRouter();
  const { role } = useRole();
  const { data: settings } = useAppSettings();
  const { data: planData } = useMyGardenerPlan();
  const isVip = planData?.plan === 'VIP';

  // API Queries
  const { data: gardens = [], isLoading: isGardensLoading } = useMyGardens();
  const { data: allPlants = [], isLoading: isPlantsLoading } = useAllPlants();
  const { data: careTasks = [], isLoading: isTasksLoading } = useCareTasks(false);
  const { data: creditStatus } = useAiCreditStatus();

  // Mutations
  const createGardenMutation = useCreateGarden();
  const addPlantToGardenMutation = useAddPlant();
  const addStandalonePlantMutation = useAddStandalonePlant();
  const addCareScheduleMutation = useAddCareSchedule();
  const completeCareTaskMutation = useCompleteCareTask();

  // Filter States
  const [gardenFilter, setGardenFilter] = useState<string>('ALL');
  const [plantFilter, setPlantFilter] = useState<'ALL' | 'IN_GARDEN' | 'STANDALONE'>('ALL');

  // Modal Visibility States
  const [showAddGardenModal, setShowAddGardenModal] = useState(false);
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Add Garden Form State
  const [gardenName, setGardenName] = useState('');
  const [selectedGardenType, setSelectedGardenType] = useState<GardenType>('BALCONY');
  const [gardenLocation, setGardenLocation] = useState('');
  const [gardenSunlight, setGardenSunlight] = useState('FULL_SUN');
  const [gardenWatering, setGardenWatering] = useState('CAN_WATERING');
  const [isSubmittingGarden, setIsSubmittingGarden] = useState(false);

  // Add Plant Form State
  const [plantName, setPlantName] = useState('');
  const [plantVariety, setPlantVariety] = useState('');
  const [targetGardenId, setTargetGardenId] = useState<string>(''); // empty string = standalone pot
  const [plantLocationType, setPlantLocationType] = useState('Balcony Railing');
  const [potSize, setPotSize] = useState('10');
  const [selectedPotType, setSelectedPotType] = useState('Ceramic');
  const [isSubmittingPlant, setIsSubmittingPlant] = useState(false);

  // Schedule Form State
  const [schedulePlantId, setSchedulePlantId] = useState('');
  const [scheduleCareType, setScheduleCareType] = useState<PlantCareType>('WATERING');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleIntervalDays, setScheduleIntervalDays] = useState('3');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Maintenance check
  const isAdminOrSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isMaintenanceOn = Boolean(settings?.gardenMaintenanceMode);

  if (isMaintenanceOn && !isAdminOrSuperAdmin) {
    return <UnderMaintenanceView moduleName="Gardener & Garden Experts" />;
  }

  // Filtered lists
  const filteredGardens = useMemo(() => {
    if (gardenFilter === 'ALL') return gardens;
    return gardens.filter((g) => g.gardenType === gardenFilter);
  }, [gardens, gardenFilter]);

  const filteredPlants = useMemo(() => {
    if (plantFilter === 'ALL') return allPlants;
    if (plantFilter === 'IN_GARDEN') return allPlants.filter((p) => Boolean(p.gardenId));
    if (plantFilter === 'STANDALONE') return allPlants.filter((p) => !p.gardenId);
    return allPlants;
  }, [allPlants, plantFilter]);

  // Tasks due today or overdue
  const todayDueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return careTasks.filter((t) => new Date(t.nextDueDate) <= today);
  }, [careTasks]);

  // Handlers
  const handleCreateGarden = async () => {
    if (!gardenName.trim()) {
      alert('Please enter a garden name.');
      return;
    }
    setIsSubmittingGarden(true);
    try {
      await createGardenMutation.mutateAsync({
        name: gardenName.trim(),
        gardenType: selectedGardenType,
        location: gardenLocation.trim() || undefined,
        sunlightExposure: gardenSunlight,
        wateringSource: gardenWatering,
      });
      setShowAddGardenModal(false);
      setGardenName('');
      setGardenLocation('');
    } catch {
      alert('Failed to create garden space. Please try again.');
    } finally {
      setIsSubmittingGarden(false);
    }
  };

  const handleCreatePlant = async () => {
    if (!plantName.trim()) {
      alert('Please enter the plant name.');
      return;
    }
    setIsSubmittingPlant(true);
    try {
      const payload = {
        name: plantName.trim(),
        species: plantVariety.trim() || undefined,
        locationType: plantLocationType.trim() || undefined,
        potSizeInches: potSize ? parseFloat(potSize) : undefined,
        potType: selectedPotType,
        gardenId: targetGardenId || undefined,
      };

      if (targetGardenId) {
        await addPlantToGardenMutation.mutateAsync({
          gardenId: targetGardenId,
          payload,
        });
      } else {
        await addStandalonePlantMutation.mutateAsync(payload);
      }

      setShowAddPlantModal(false);
      setPlantName('');
      setPlantVariety('');
      setTargetGardenId('');
    } catch {
      alert('Failed to register plant. Please try again.');
    } finally {
      setIsSubmittingPlant(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!schedulePlantId) {
      alert('Please select a plant for this care reminder.');
      return;
    }
    const days = parseInt(scheduleIntervalDays, 10);
    if (isNaN(days) || days < 1) {
      alert('Please enter a valid interval in days (minimum 1).');
      return;
    }
    setIsSubmittingSchedule(true);
    try {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + days);

      await addCareScheduleMutation.mutateAsync({
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
      alert('Failed to create care reminder schedule.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleCompleteTask = async (taskId: string, plantNameTitle: string) => {
    tap();
    try {
      await completeCareTaskMutation.mutateAsync(taskId);
    } catch {
      alert('Could not update task. Please verify your connection.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.desktopContainer}>
          {/* TOP EXECUTIVE BANNER & HEADER */}
          <View style={styles.topHeader}>
            <View style={styles.headerInfo}>
              <View style={styles.isoBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.isoBadgeText}>ISO 9001:2015 & ISO 27001 SECURED</Text>
              </View>
              <Text style={styles.mainTitle}>Gardener Portal</Text>
              <Text style={styles.mainSubtitle}>
                Complete Urban Gardening, Balcony Farming & Plant Health Management
              </Text>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerBtnPrimary}
                onPress={() => {
                  tap();
                  setShowAddGardenModal(true);
                }}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.headerBtnPrimaryText}>Add Garden</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerBtnSecondary}
                onPress={() => {
                  tap();
                  setShowAddPlantModal(true);
                }}
              >
                <Ionicons name="leaf" size={15} color="#065f46" />
                <Text style={styles.headerBtnSecondaryText}>Add Plant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerBtnOutline}
                onPress={() => {
                  tap();
                  setShowScheduleModal(true);
                }}
              >
                <Ionicons name="alarm" size={15} color="#0f172a" />
                <Text style={styles.headerBtnOutlineText}>Care Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* EXECUTIVE TELEMETRY METRIC STRIP */}
          <View style={styles.telemetryGrid}>
            {/* Metric 1: Gardens */}
            <View style={[styles.metricCard, premiumShadow('#0f172a', 'xs')]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="business" size={22} color="#16a34a" />
              </View>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricValue}>{gardens.length}</Text>
                <Text style={styles.metricLabel}>Garden Spaces</Text>
                <Text style={styles.metricHint}>Active balcony & terrace zones</Text>
              </View>
            </View>

            {/* Metric 2: Plants */}
            <View style={[styles.metricCard, premiumShadow('#0f172a', 'xs')]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="flower" size={22} color="#0284c7" />
              </View>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricValue}>{allPlants.length}</Text>
                <Text style={styles.metricLabel}>Monitored Plants</Text>
                <Text style={styles.metricHint}>Potted & in-ground botanicals</Text>
              </View>
            </View>

            {/* Metric 3: Care Tasks Due */}
            <View style={[styles.metricCard, premiumShadow('#0f172a', 'xs')]}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: todayDueTasks.length > 0 ? '#fee2e2' : '#fef3c7' },
                ]}
              >
                <Ionicons
                  name={todayDueTasks.length > 0 ? 'alert-circle' : 'checkmark-done'}
                  size={22}
                  color={todayDueTasks.length > 0 ? '#dc2626' : '#d97706'}
                />
              </View>
              <View style={styles.metricTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.metricValue}>{todayDueTasks.length}</Text>
                  {todayDueTasks.length > 0 && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>Due Today</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.metricLabel}>Pending Care Tasks</Text>
                <Text style={styles.metricHint}>Watering & fertilizer actions</Text>
              </View>
            </View>

            {/* Metric 4: AI Plant Doctor */}
            <View style={[styles.metricCard, premiumShadow('#0f172a', 'xs')]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="scan" size={22} color="#9333ea" />
              </View>
              <View style={styles.metricTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.metricValue}>
                    {creditStatus?.isUnlimited
                      ? 'Unlimited'
                      : `${creditStatus?.remainingCredits ?? 5}`}
                  </Text>
                  <View style={styles.planPill}>
                    <Text style={styles.planPillText}>{isVip ? 'VIP Plan' : 'Free Tier'}</Text>
                  </View>
                </View>
                <Text style={styles.metricLabel}>AI Diagnostic Scans</Text>
                <Text style={styles.metricHint}>Instant leaf disease diagnosis</Text>
              </View>
            </View>
          </View>

          {/* FEATURED SERVICES STRIP */}
          <View style={styles.servicesGrid}>
            {/* Service 1: AI Plant Doctor Banner */}
            <TouchableOpacity
              style={[styles.serviceCard, styles.serviceCardDoctor, premiumShadow('#e11d48', 'xs')]}
              onPress={() => router.push('/crop-disease-scanner' as any)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#fff1f2', '#ffe4e6']}
                style={styles.serviceGradient}
              >
                <View style={styles.serviceIconCircle}>
                  <Ionicons name="camera" size={22} color="#e11d48" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>AI Plant Doctor & Leaf Scanner</Text>
                  <Text style={styles.serviceDescription}>
                    Diagnose terrace, pot, and garden leaf diseases in 5 seconds with organic remedies.
                  </Text>
                </View>
                <View style={styles.serviceActionBtn}>
                  <Text style={styles.serviceActionBtnText}>Scan Leaf →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Service 2: Garden Accounts & Harvest */}
            <TouchableOpacity
              style={[styles.serviceCard, styles.serviceCardAccounts, premiumShadow('#059669', 'xs')]}
              onPress={() => router.push('/garden/expenses' as any)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#f0fdf4', '#dcfce7']}
                style={styles.serviceGradient}
              >
                <View style={[styles.serviceIconCircle, { backgroundColor: '#ffffff', borderColor: '#bbf7d0' }]}>
                  <Ionicons name="wallet" size={22} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceTitle, { color: '#14532d' }]}>Garden Accounts & Harvest</Text>
                  <Text style={[styles.serviceDescription, { color: '#166534' }]}>
                    Track soil, seed, and pot expenses. Record vegetable harvests and calculate total savings.
                  </Text>
                </View>
                <View style={[styles.serviceActionBtn, { backgroundColor: '#16a34a' }]}>
                  <Text style={styles.serviceActionBtnText}>View Accounts →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Service 3: Certified Garden Expert */}
            <TouchableOpacity
              style={[styles.serviceCard, styles.serviceCardAdvisor, premiumShadow('#0284c7', 'xs')]}
              onPress={() => router.push('/garden/advisors' as any)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#f0f9ff', '#e0f2fe']}
                style={styles.serviceGradient}
              >
                <View style={[styles.serviceIconCircle, { backgroundColor: '#ffffff', borderColor: '#bae6fd' }]}>
                  <Ionicons name="person" size={22} color="#0284c7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceTitle, { color: '#0c4a6e' }]}>Certified Garden Doctors</Text>
                  <Text style={[styles.serviceDescription, { color: '#0369a1' }]}>
                    Hire professional agronomists for monthly custom garden visits, layouts, and care plans.
                  </Text>
                </View>
                <View style={[styles.serviceActionBtn, { backgroundColor: '#0284c7' }]}>
                  <Text style={styles.serviceActionBtnText}>Consult Doctor →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* TODAY'S CARE REMINDERS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionTitle}>Today's Plant Care Tasks</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{todayDueTasks.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Timely watering, fertilizer application, and plant maintenance schedules
              </Text>
            </View>

            <TouchableOpacity
              style={styles.scheduleAddQuickBtn}
              onPress={() => {
                tap();
                setShowScheduleModal(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={16} color="#065f46" />
              <Text style={styles.scheduleAddQuickText}>New Schedule</Text>
            </TouchableOpacity>
          </View>

          {todayDueTasks.length === 0 ? (
            <View style={[styles.emptyTaskCard, premiumShadow('#0f172a', 'xs')]}>
              <View style={styles.emptyTaskIcon}>
                <Ionicons name="checkmark-done-circle" size={36} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyTaskTitle}>All Plants are Well Cared For Today!</Text>
                <Text style={styles.emptyTaskDesc}>
                  No pending care tasks scheduled for today. Automated reminders will notify you when watering or nutrition is due.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.scheduleTaskMiniBtn}
                onPress={() => setShowScheduleModal(true)}
              >
                <Text style={styles.scheduleTaskMiniBtnText}>+ Add Routine</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tasksGrid}>
              {todayDueTasks.map((task) => {
                const cfg = CARE_TYPE_CONFIG[task.careType] || CARE_TYPE_CONFIG.WATERING;
                return (
                  <View
                    key={task.id}
                    style={[styles.taskItemCard, premiumShadow('#0f172a', 'xs')]}
                  >
                    <View style={[styles.taskTypeBadge, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={15} color={cfg.color} />
                      <Text style={[styles.taskTypeBadgeText, { color: cfg.color }]}>
                        {cfg.label}
                      </Text>
                    </View>

                    <View style={styles.taskCardMain}>
                      <Text style={styles.taskPlantName}>
                        {task.plant?.name || 'Assigned Plant'}
                      </Text>
                      <Text style={styles.taskTitleText}>{task.title}</Text>
                      {task.instructions && (
                        <Text style={styles.taskInstructions} numberOfLines={2}>
                          {task.instructions}
                        </Text>
                      )}
                      <View style={styles.taskScheduleMeta}>
                        <Ionicons name="repeat" size={13} color="#64748b" />
                        <Text style={styles.taskIntervalText}>Every {task.intervalDays} days</Text>
                        {task.garden?.name && (
                          <>
                            <Text style={{ color: '#cbd5e1' }}>•</Text>
                            <Text style={styles.taskGardenText}>{task.garden.name}</Text>
                          </>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.taskCompleteBtn}
                      onPress={() => handleCompleteTask(task.id, task.plant?.name || '')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                      <Text style={styles.taskCompleteBtnText}>Mark Done</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* GARDENS & BALCONIES SECTION */}
          <View style={[styles.sectionHeaderRow, { marginTop: SPACING.xl }]}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionTitle}>My Gardens & Balconies</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{gardens.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Manage your terrace, balcony, and backyard green spaces
              </Text>
            </View>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipRow}
            >
              <TouchableOpacity
                style={[styles.filterChip, gardenFilter === 'ALL' && styles.filterChipActive]}
                onPress={() => setGardenFilter('ALL')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    gardenFilter === 'ALL' && styles.filterChipTextActive,
                  ]}
                >
                  All Spaces
                </Text>
              </TouchableOpacity>
              {GARDEN_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.filterChip, gardenFilter === t.value && styles.filterChipActive]}
                  onPress={() => setGardenFilter(t.value)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      gardenFilter === t.value && styles.filterChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isGardensLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 30 }} />
          ) : filteredGardens.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="leaf-outline" size={32} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Garden Spaces Found</Text>
              <Text style={styles.emptySub}>
                You haven't set up any garden spaces yet. Create your balcony, terrace, or indoor garden now.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setShowAddGardenModal(true)}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.emptyActionBtnText}>Create Garden Space</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.gardensGrid}>
              {filteredGardens.map((garden, idx) => {
                const bg = GARDEN_BG_IMAGES[idx % GARDEN_BG_IMAGES.length];
                const plantCount = (garden.plants || []).length;
                return (
                  <TouchableOpacity
                    key={garden.id}
                    style={[styles.gardenCard, premiumShadow('#0f172a', 'md')]}
                    onPress={() => router.push(`/garden/${garden.id}` as any)}
                    activeOpacity={0.92}
                  >
                    <ImageBackground
                      source={{ uri: bg }}
                      style={styles.gardenBg}
                      imageStyle={{ borderRadius: RADIUS.lg }}
                    >
                      <LinearGradient
                        colors={['rgba(15, 23, 42, 0.25)', 'rgba(15, 23, 42, 0.92)']}
                        style={styles.gardenOverlay}
                      >
                        {/* Top Badges */}
                        <View style={styles.gardenTopRow}>
                          <View style={styles.gardenTypeTag}>
                            <Text style={styles.gardenTypeTagText}>
                              {garden.gardenType.replace('_', ' ')}
                            </Text>
                          </View>
                          <View style={styles.gardenHealthScore}>
                            <Ionicons name="shield-checkmark" size={12} color="#4ade80" />
                            <Text style={styles.gardenHealthScoreText}>
                              {garden.healthScore}% ISO Health
                            </Text>
                          </View>
                        </View>

                        {/* Bottom Information */}
                        <View style={styles.gardenBottomRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.gardenNameText} numberOfLines={1}>
                              {garden.name}
                            </Text>
                            <Text style={styles.gardenLocationText}>
                              <Ionicons name="location-sharp" size={13} color="#94a3b8" />{' '}
                              {garden.location || 'Home Residence'}
                            </Text>
                            <View style={styles.gardenTagRow}>
                              {garden.sunlightExposure && (
                                <View style={styles.gardenMiniTag}>
                                  <Ionicons name="sunny-outline" size={11} color="#fcd34d" />
                                  <Text style={styles.gardenMiniTagText}>
                                    {garden.sunlightExposure.replace('_', ' ')}
                                  </Text>
                                </View>
                              )}
                              {garden.wateringSource && (
                                <View style={styles.gardenMiniTag}>
                                  <Ionicons name="water-outline" size={11} color="#7dd3fc" />
                                  <Text style={styles.gardenMiniTagText}>
                                    {garden.wateringSource.replace('_', ' ')}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View style={styles.plantBadgeWrap}>
                            <Ionicons name="leaf" size={14} color="#059669" />
                            <Text style={styles.plantBadgeCount}>{plantCount} Plants</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* POTTED PLANTS & BOTANICALS COLLECTION */}
          <View style={[styles.sectionHeaderRow, { marginTop: SPACING.xxl }]}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionTitle}>Plant & Pot Collection</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{allPlants.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Individual indoor pots, balcony planters, and garden botanicals
              </Text>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterChipRow}>
              <TouchableOpacity
                style={[styles.filterChip, plantFilter === 'ALL' && styles.filterChipActive]}
                onPress={() => setPlantFilter('ALL')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    plantFilter === 'ALL' && styles.filterChipTextActive,
                  ]}
                >
                  All Plants ({allPlants.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, plantFilter === 'IN_GARDEN' && styles.filterChipActive]}
                onPress={() => setPlantFilter('IN_GARDEN')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    plantFilter === 'IN_GARDEN' && styles.filterChipTextActive,
                  ]}
                >
                  In Gardens
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, plantFilter === 'STANDALONE' && styles.filterChipActive]}
                onPress={() => setPlantFilter('STANDALONE')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    plantFilter === 'STANDALONE' && styles.filterChipTextActive,
                  ]}
                >
                  Standalone Pots
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isPlantsLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 30 }} />
          ) : filteredPlants.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="flower-outline" size={32} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Plants Found</Text>
              <Text style={styles.emptySub}>
                Add your indoor plants, balcony herbs, or potted saplings to track their watering schedules and health history.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setShowAddPlantModal(true)}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.emptyActionBtnText}>Add Your First Plant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.plantsGrid}>
              {filteredPlants.map((plant) => {
                const isStandalone = !plant.gardenId;
                return (
                  <View
                    key={plant.id}
                    style={[styles.plantCard, premiumShadow('#0f172a', 'xs')]}
                  >
                    <View style={styles.plantHeaderRow}>
                      <View style={styles.plantIconWrap}>
                        <Ionicons name="leaf" size={20} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plantTitle} numberOfLines={1}>
                          {plant.name}
                        </Text>
                        <Text style={styles.plantSub} numberOfLines={1}>
                          {plant.species || plant.variety || 'Botanical Species'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.plantStatusPill,
                          {
                            backgroundColor:
                              plant.healthStatus === 'NEEDS_CARE' ? '#fef3c7' : '#dcfce7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.plantStatusPillText,
                            {
                              color:
                                plant.healthStatus === 'NEEDS_CARE' ? '#b45309' : '#166534',
                            },
                          ]}
                        >
                          {plant.healthStatus || 'HEALTHY'}
                        </Text>
                      </View>
                    </View>

                    {/* Plant Spec Details */}
                    <View style={styles.plantDetailsBox}>
                      <View style={styles.plantDetailRow}>
                        <Ionicons name="location-outline" size={13} color="#64748b" />
                        <Text style={styles.plantDetailText}>
                          {isStandalone
                            ? `Standalone Pot • ${plant.locationType || 'Indoors'}`
                            : plant.garden?.name || 'In Garden'}
                        </Text>
                      </View>
                      {(plant.potSizeInches || plant.potType) && (
                        <View style={styles.plantDetailRow}>
                          <Ionicons name="cube-outline" size={13} color="#64748b" />
                          <Text style={styles.plantDetailText}>
                            {plant.potSizeInches ? `${plant.potSizeInches}" ` : ''}
                            {plant.potType || 'Planter'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Quick Schedule Button */}
                    <TouchableOpacity
                      style={styles.plantActionBtn}
                      onPress={() => {
                        setSchedulePlantId(plant.id);
                        setShowScheduleModal(true);
                      }}
                    >
                      <Ionicons name="alarm-outline" size={14} color="#065f46" />
                      <Text style={styles.plantActionBtnText}>Set Care Reminder</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* VIP CHATBOT DOCK */}
          {isVip && (
            <GardenAIChatbot adminWhatsapp={(settings as any)?.adminMobile || ''} />
          )}
        </View>
      </ScrollView>

      {/* ================= MODAL 1: ADD GARDEN MODAL ================= */}
      <Modal visible={showAddGardenModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create Garden Space</Text>
                <Text style={styles.modalSubtitle}>
                  Register a balcony, terrace, or home gardening zone
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddGardenModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Garden Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Garden Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Master Balcony Garden"
                  value={gardenName}
                  onChangeText={setGardenName}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Garden Type Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Space Type</Text>
                <View style={styles.choiceGrid}>
                  {GARDEN_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.choicePill,
                        selectedGardenType === t.value && styles.choicePillActive,
                      ]}
                      onPress={() => setSelectedGardenType(t.value)}
                    >
                      <Ionicons
                        name={t.icon}
                        size={14}
                        color={selectedGardenType === t.value ? '#ffffff' : '#475569'}
                      />
                      <Text
                        style={[
                          styles.choicePillText,
                          selectedGardenType === t.value && styles.choicePillTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Physical Location / Floor (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 2nd Floor South Balcony"
                  value={gardenLocation}
                  onChangeText={setGardenLocation}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Sunlight Exposure */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sunlight Exposure</Text>
                <View style={styles.choiceGrid}>
                  {SUNLIGHT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.choicePill,
                        gardenSunlight === opt.value && styles.choicePillActive,
                      ]}
                      onPress={() => setGardenSunlight(opt.value)}
                    >
                      <Text
                        style={[
                          styles.choicePillText,
                          gardenSunlight === opt.value && styles.choicePillTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Watering Source */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary Watering Source</Text>
                <View style={styles.choiceGrid}>
                  {WATERING_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.choicePill,
                        gardenWatering === opt.value && styles.choicePillActive,
                      ]}
                      onPress={() => setGardenWatering(opt.value)}
                    >
                      <Text
                        style={[
                          styles.choicePillText,
                          gardenWatering === opt.value && styles.choicePillTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSubmittingGarden && { opacity: 0.7 }]}
                onPress={handleCreateGarden}
                disabled={isSubmittingGarden}
              >
                {isSubmittingGarden ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={styles.modalSubmitBtnText}>Create Garden Space</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: ADD PLANT MODAL ================= */}
      <Modal visible={showAddPlantModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Potted Plant</Text>
                <Text style={styles.modalSubtitle}>
                  Register a new plant in a garden or standalone planter
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddPlantModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Plant Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Plant Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sansevieria Snake Plant / Cherry Tomato"
                  value={plantName}
                  onChangeText={setPlantName}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Variety / Species */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Variety or Botanical Name (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Laurentii / Organic Hybrid"
                  value={plantVariety}
                  onChangeText={setPlantVariety}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Assign to Garden or Standalone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Space Assignment</Text>
                <View style={styles.choiceGrid}>
                  <TouchableOpacity
                    style={[
                      styles.choicePill,
                      targetGardenId === '' && styles.choicePillActive,
                    ]}
                    onPress={() => setTargetGardenId('')}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={14}
                      color={targetGardenId === '' ? '#ffffff' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.choicePillText,
                        targetGardenId === '' && styles.choicePillTextActive,
                      ]}
                    >
                      Standalone Pot (No Garden)
                    </Text>
                  </TouchableOpacity>
                  {gardens.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.choicePill,
                        targetGardenId === g.id && styles.choicePillActive,
                      ]}
                      onPress={() => setTargetGardenId(g.id)}
                    >
                      <Ionicons
                        name="leaf-outline"
                        size={14}
                        color={targetGardenId === g.id ? '#ffffff' : '#475569'}
                      />
                      <Text
                        style={[
                          styles.choicePillText,
                          targetGardenId === g.id && styles.choicePillTextActive,
                        ]}
                      >
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location Tag */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Placement / Location Tag</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Living Room Window Sill / Balcony Railing"
                  value={plantLocationType}
                  onChangeText={setPlantLocationType}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Pot Size & Type */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Pot Size (Inches)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="10"
                    value={potSize}
                    onChangeText={setPotSize}
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>Pot Material</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {POT_TYPES.map((pt) => (
                      <TouchableOpacity
                        key={pt}
                        style={[
                          styles.choicePill,
                          selectedPotType === pt && styles.choicePillActive,
                          { marginRight: 6 },
                        ]}
                        onPress={() => setSelectedPotType(pt)}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            selectedPotType === pt && styles.choicePillTextActive,
                          ]}
                        >
                          {pt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSubmittingPlant && { opacity: 0.7 }]}
                onPress={handleCreatePlant}
                disabled={isSubmittingPlant}
              >
                {isSubmittingPlant ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={styles.modalSubmitBtnText}>Register Plant</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: SCHEDULE CARE REMINDER MODAL ================= */}
      <Modal visible={showScheduleModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Set Care Reminder Schedule</Text>
                <Text style={styles.modalSubtitle}>
                  Create automated watering, fertilizing, or repotting cycles
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Select Plant */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Plant *</Text>
                {allPlants.length === 0 ? (
                  <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                    Please add a plant first before setting a care schedule.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {allPlants.map((p) => (
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
                          color={schedulePlantId === p.id ? '#ffffff' : '#059669'}
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
                )}
              </View>

              {/* Care Type Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Care Action Type</Text>
                <View style={styles.choiceGrid}>
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
                          size={14}
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

              {/* Custom Title / Instructions */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Task Note or Instructions</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Deep soak with seaweed bio-liquid fertilizer"
                  value={scheduleTitle}
                  onChangeText={setScheduleTitle}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Repeat Interval Days */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Repeat Frequency (Days)</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  {['1', '2', '3', '7', '14', '30'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.choicePill,
                        scheduleIntervalDays === d && styles.choicePillActive,
                      ]}
                      onPress={() => setScheduleIntervalDays(d)}
                    >
                      <Text
                        style={[
                          styles.choicePillText,
                          scheduleIntervalDays === d && styles.choicePillTextActive,
                        ]}
                      >
                        {d === '1' ? 'Daily' : `Every ${d}d`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  (!schedulePlantId || isSubmittingSchedule) && { opacity: 0.7 },
                ]}
                onPress={handleCreateSchedule}
                disabled={!schedulePlantId || isSubmittingSchedule}
              >
                {isSubmittingSchedule ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="alarm" size={18} color="#ffffff" />
                    <Text style={styles.modalSubmitBtnText}>Save Schedule</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#090e17', // Deep obsidian executive background
  },
  scrollContent: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  desktopContainer: {
    maxWidth: 1360,
    width: '100%',
    marginHorizontal: 'auto',
  },

  // Top Executive Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    padding: SPACING.xl,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: SPACING.lg,
  },
  headerInfo: {
    flex: 1,
    minWidth: 280,
  },
  isoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#064e3b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: 8,
  },
  isoBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#6ee7b7',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  headerBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  headerBtnPrimaryText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  headerBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  headerBtnSecondaryText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#065f46',
  },
  headerBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  headerBtnOutlineText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },

  // Executive Metric Strip
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: SPACING.xl,
  },
  metricCard: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  metricIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextWrap: {
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
    marginTop: 2,
  },
  metricHint: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  urgentBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  urgentBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  planPill: {
    backgroundColor: '#581c87',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  planPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#d8b4fe',
  },

  // Services Strip
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: SPACING.xl,
  },
  serviceCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  serviceCardDoctor: {
    borderWidth: 1.2,
    borderColor: '#fecdd3',
  },
  serviceCardAccounts: {
    borderWidth: 1.2,
    borderColor: '#bbf7d0',
  },
  serviceCardAdvisor: {
    borderWidth: 1.2,
    borderColor: '#bae6fd',
  },
  serviceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  serviceTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#9f1239',
  },
  serviceDescription: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#be123c',
    marginTop: 2,
    lineHeight: 16,
  },
  serviceActionBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  serviceActionBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countBadgeText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#38bdf8',
  },
  scheduleAddQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  scheduleAddQuickText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#065f46',
  },

  // Today Tasks
  emptyTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: SPACING.lg,
  },
  emptyTaskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTaskTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  emptyTaskDesc: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 17,
  },
  scheduleTaskMiniBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  scheduleTaskMiniBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  tasksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: SPACING.lg,
  },
  taskItemCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  taskTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: 10,
  },
  taskTypeBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  taskCardMain: {
    marginBottom: 12,
  },
  taskPlantName: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  taskTitleText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    marginTop: 2,
  },
  taskInstructions: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  taskScheduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  taskIntervalText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  taskGardenText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#38bdf8',
  },
  taskCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  taskCompleteBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // Filters
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  // Gardens Grid
  gardensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gardenCard: {
    flex: 1,
    minWidth: 360,
    height: 220,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  gardenBg: {
    flex: 1,
  },
  gardenOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  gardenTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gardenTypeTag: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gardenTypeTagText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  gardenHealthScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 46, 22, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  gardenHealthScoreText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#4ade80',
  },
  gardenBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  gardenNameText: {
    fontSize: 19,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  gardenLocationText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginTop: 2,
  },
  gardenTagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  gardenMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  gardenMiniTagText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },
  plantBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  plantBadgeCount: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },

  // Plants Grid
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  plantCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: RADIUS.lg,
    padding: 16,
    justifyContent: 'space-between',
  },
  plantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  plantIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  plantSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  plantStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  plantStatusPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  plantDetailsBox: {
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  plantDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plantDetailText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  plantActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  plantActionBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#065f46',
  },

  // Empty View
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: RADIUS.xl,
    gap: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    marginTop: 8,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    maxWidth: 580,
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalBody: {
    padding: 18,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
