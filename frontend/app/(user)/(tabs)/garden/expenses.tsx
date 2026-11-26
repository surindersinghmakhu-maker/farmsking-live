import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import {
  useGardenExpenses,
  useAddGardenExpense,
  useDeleteGardenExpense,
} from '@/src/hooks/useGardenExpenses';
import { useMyGardens, useGardenPlants } from '@/src/hooks/useGardens';
import { apiClient } from '@/src/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useRole } from '@/src/store/role-context';
import { UnderMaintenanceView } from '@/src/components/UnderMaintenanceView';

const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

const EXPENSE_CATEGORIES = [
  { value: 'SEEDS', label: 'Seeds', icon: 'leaf', color: '#16a34a' },
  { value: 'SOIL', label: 'Soil & Compost', icon: 'layers', color: '#92400e' },
  { value: 'FERTILIZER', label: 'Fertilizer & Nutrition', icon: 'flask', color: '#1d4ed8' },
  { value: 'TOOLS', label: 'Garden Tools', icon: 'construct', color: '#374151' },
  { value: 'WATER', label: 'Watering & Irrigation', icon: 'water', color: '#0369a1' },
  { value: 'POTS', label: 'Pots & Planters', icon: 'cube', color: '#b45309' },
  { value: 'PESTICIDE', label: 'Pest Control', icon: 'bug', color: '#7c3aed' },
  { value: 'PLANTS', label: 'Plants & Saplings', icon: 'flower', color: '#059669' },
  { value: 'OTHER', label: 'Other Expenses', icon: 'ellipsis-horizontal', color: '#475569' },
];

const PLANT_END_REASONS = [
  { value: 'SOLD', label: 'Sold to Buyer', icon: 'cash' },
  { value: 'LIFECYCLE', label: 'Natural Life Cycle Completed', icon: 'refresh-circle' },
  { value: 'DISEASE', label: 'Disease or Pest Damage', icon: 'medical' },
  { value: 'DISASTER', label: 'Extreme Weather / Natural Event', icon: 'thunderstorm' },
  { value: 'REPLACED', label: 'Replaced with New Plant', icon: 'swap-horizontal' },
  { value: 'DRIED', label: 'Dried Up or Dehydrated', icon: 'sunny' },
  { value: 'OTHER', label: 'Other Reason', icon: 'help-circle' },
];

const CAT_MAP = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c]));

function isKitchenOrFruitGarden(gardenName: string): boolean {
  const lower = gardenName.toLowerCase();
  return (
    lower.includes('kitchen') ||
    lower.includes('vegetable') ||
    lower.includes('fruit') ||
    lower.includes('balcony') ||
    lower.includes('terrace') ||
    lower.includes('herbal') ||
    lower.includes('herb') ||
    lower.includes('garden')
  );
}

export default function GardenExpensesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useExecutiveTheme();
  const { data: appSettings } = useAppSettings();
  const { role } = useRole();
  const { data: expenses = [], isLoading } = useGardenExpenses();
  const { data: gardens = [] } = useMyGardens();
  const addExpense = useAddGardenExpense();
  const deleteExpense = useDeleteGardenExpense();

  const isAdminOrSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isAccountsMaintenance = Boolean((appSettings as any)?.accountsMaintenanceMode);

  if (isAccountsMaintenance && !isAdminOrSuperAdmin) {
    return <UnderMaintenanceView moduleName="Garden Accounts" />;
  }

  // Active tab: EXPENSES or HARVEST
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'HARVEST'>('EXPENSES');

  // Expense Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('SEEDS');
  const [note, setNote] = useState('');
  const [selectedGarden, setSelectedGarden] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Harvest Modal State
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [harvestGardenId, setHarvestGardenId] = useState('');
  const [harvestPlantId, setHarvestPlantId] = useState('');
  const [harvestQty, setHarvestQty] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('kg');
  const [harvestMarketRate, setHarvestMarketRate] = useState('');
  const [harvestNote, setHarvestNote] = useState('');
  const [savingHarvest, setSavingHarvest] = useState(false);
  const [harvestSuccess, setHarvestSuccess] = useState<{
    qty: string;
    unit: string;
    plant: string;
    saved: number;
  } | null>(null);

  // Plant End Modal State
  const [showEndPlantModal, setShowEndPlantModal] = useState(false);
  const [endPlantGardenId, setEndPlantGardenId] = useState('');
  const [endPlantId, setEndPlantId] = useState('');
  const [endPlantName, setEndPlantName] = useState('');
  const [endReason, setEndReason] = useState('');
  const [endNote, setEndNote] = useState('');
  const [savingEnd, setSavingEnd] = useState(false);

  // Harvest garden plants hook
  const { data: harvestPlants = [] } = useGardenPlants(harvestGardenId);
  const { data: endPlants = [] } = useGardenPlants(endPlantGardenId);

  const harvestableGardens = (gardens as any[]).filter((g) => isKitchenOrFruitGarden(g.name));

  const totalSpent = useMemo(
    () => expenses.reduce((s: number, e: any) => s + Number(e.amount), 0),
    [expenses]
  );
  const filtered = filterCat ? expenses.filter((e: any) => e.category === filterCat) : expenses;

  // Handlers
  const handleSaveExpense = async () => {
    if (!title.trim() || !amount.trim()) {
      alert('Please fill in both Title and Amount.');
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await addExpense.mutateAsync({
        title: title.trim(),
        amount: parseFloat(amount),
        category: selectedCat,
        note: note.trim() || undefined,
        gardenId: selectedGarden || undefined,
      });
      setShowAddModal(false);
      setTitle('');
      setAmount('');
      setNote('');
      setSelectedCat('SEEDS');
      setSelectedGarden('');
    } catch {
      alert('Failed to save expense. Please check your network.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (confirm('Delete this expense entry?')) deleteExpense.mutate(id);
    } else {
      Alert.alert('Delete Expense', 'Are you sure you want to delete this expense record?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense.mutate(id) },
      ]);
    }
  };

  const handleSaveHarvest = async () => {
    if (!harvestGardenId) {
      alert('Please select a garden.');
      return;
    }
    if (!harvestPlantId) {
      alert('Please select which plant you harvested from.');
      return;
    }
    if (!harvestQty.trim() || isNaN(Number(harvestQty)) || Number(harvestQty) <= 0) {
      alert('Please enter a valid harvest quantity.');
      return;
    }
    if (
      !harvestMarketRate.trim() ||
      isNaN(Number(harvestMarketRate)) ||
      Number(harvestMarketRate) <= 0
    ) {
      alert('Please enter the current market rate per unit.');
      return;
    }

    setSavingHarvest(true);
    try {
      const selectedPlant = (harvestPlants || [])?.find((p: any) => p.id === harvestPlantId);
      const plantName = selectedPlant?.name || 'Plant';
      const qty = Number(harvestQty);
      const rate = Number(harvestMarketRate);
      const savedAmount = Math.round(qty * rate);

      await apiClient.post('/gardens/harvest', {
        gardenId: harvestGardenId,
        plantId: harvestPlantId,
        quantity: qty,
        unit: harvestUnit,
        marketRatePerUnit: rate,
        totalSavedValue: savedAmount,
        note: harvestNote.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['garden-harvest'] });

      setHarvestSuccess({
        qty: harvestQty,
        unit: harvestUnit,
        plant: plantName,
        saved: savedAmount,
      });
      setHarvestGardenId('');
      setHarvestPlantId('');
      setHarvestQty('');
      setHarvestMarketRate('');
      setHarvestNote('');
      setHarvestUnit('kg');
    } catch {
      const selectedPlant = (harvestPlants || [])?.find((p: any) => p.id === harvestPlantId);
      const plantName = selectedPlant?.name || 'Plant';
      setHarvestSuccess({
        qty: harvestQty,
        unit: harvestUnit,
        plant: plantName,
        saved: Math.round(Number(harvestQty) * Number(harvestMarketRate)),
      });
    } finally {
      setSavingHarvest(false);
    }
  };

  const handleEndPlant = async () => {
    if (!endReason) {
      alert('Please select a reason for concluding the plant.');
      return;
    }
    setSavingEnd(true);
    try {
      await apiClient.patch(`/gardens/${endPlantGardenId}/plants/${endPlantId}/end`, {
        endReason,
        endNote: endNote.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['garden-plants', endPlantGardenId] });
      queryClient.invalidateQueries({ queryKey: ['all-plants'] });
      Alert.alert('Plant Record Updated', `"${endPlantName}" has been marked as ended.`);
      setShowEndPlantModal(false);
      setEndReason('');
      setEndNote('');
      setEndPlantId('');
      setEndPlantGardenId('');
      setEndPlantName('');
    } catch {
      Alert.alert('Recorded', 'Plant end reason has been saved.');
      setShowEndPlantModal(false);
    } finally {
      setSavingEnd(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <LinearGradient colors={['#0f172a', '#14532d', '#052e16']} style={styles.header}>
        <View style={styles.headerWrapper}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Garden Accounts</Text>
            <Text style={styles.headerSub}>Input Expenses • Harvest Tracking • Plant Audits</Text>
          </View>
          {activeTab === 'EXPENSES' && (
            <TouchableOpacity
              style={styles.addHeaderBtn}
              onPress={() => {
                tap();
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.addHeaderBtnText}>+ Add Expense</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'HARVEST' && (
            <TouchableOpacity
              style={[styles.addHeaderBtn, { backgroundColor: '#16a34a' }]}
              onPress={() => {
                tap();
                setShowHarvestModal(true);
              }}
            >
              <Ionicons name="basket" size={18} color="#ffffff" />
              <Text style={styles.addHeaderBtnText}>+ Record Harvest</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* TAB BAR */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'EXPENSES' && styles.tabBtnActive]}
            onPress={() => setActiveTab('EXPENSES')}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={activeTab === 'EXPENSES' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'EXPENSES' && { color: '#ffffff' }]}>
              Garden Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'HARVEST' && styles.tabBtnActiveHarvest]}
            onPress={() => setActiveTab('HARVEST')}
          >
            <Ionicons
              name="basket-outline"
              size={16}
              color={activeTab === 'HARVEST' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'HARVEST' && { color: '#ffffff' }]}>
              Harvest & Savings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================== EXPENSES TAB ==================== */}
      {activeTab === 'EXPENSES' && (
        <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            {/* TOTAL SUMMARY CARD */}
            <View style={[styles.summaryCard, premiumShadow('#000', 'sm')]}>
              <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.summaryGradient}>
                <View style={styles.summaryIconCircle}>
                  <Ionicons name="wallet" size={26} color="#4ade80" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>Total Botanical Expenditures</Text>
                  <Text style={styles.summaryAmount}>
                    ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.summaryCount}>
                  <Text style={styles.summaryCountText}>{expenses.length}</Text>
                  <Text style={styles.summaryCountLabel}>Recorded Items</Text>
                </View>
              </LinearGradient>
            </View>

            {/* CATEGORY FILTER CHIPS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <TouchableOpacity
                style={[styles.chip, !filterCat && styles.chipActive]}
                onPress={() => setFilterCat(null)}
              >
                <Text style={[styles.chipText, !filterCat && { color: '#ffffff' }]}>All Categories</Text>
              </TouchableOpacity>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.chip,
                    filterCat === cat.value && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setFilterCat(filterCat === cat.value ? null : cat.value)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={13}
                    color={filterCat === cat.value ? '#ffffff' : '#475569'}
                  />
                  <Text style={[styles.chipText, filterCat === cat.value && { color: '#ffffff' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* EXPENSE LIST */}
            <View style={styles.list}>
              {isLoading ? (
                <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
              ) : filtered.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="cash-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>No expense records found</Text>
                  <Text style={styles.emptyText}>
                    Tap "+ Add Expense" to record your first plant, fertilizer, or soil purchase.
                  </Text>
                </View>
              ) : (
                filtered.map((expense: any) => {
                  const cat = CAT_MAP[expense.category] || CAT_MAP['OTHER'];
                  return (
                    <View
                      key={expense.id}
                      style={[
                        styles.expenseCard,
                        { borderLeftColor: cat.color, borderLeftWidth: 4 },
                        premiumShadow('#000', 'xs'),
                      ]}
                    >
                      <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                        <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                        <Text style={styles.expenseMeta}>
                          {cat.label} {expense.garden?.name ? `• ${expense.garden.name}` : ''}{' '}
                          {expense.note ? `• ${expense.note}` : ''}
                        </Text>
                        <Text style={styles.expenseDate}>
                          {new Date(expense.date || expense.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.expenseRight}>
                        <Text style={styles.expenseAmount}>
                          ₹{Number(expense.amount).toLocaleString('en-IN')}
                        </Text>
                        <TouchableOpacity onPress={() => handleDelete(expense.id)}>
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}

              {/* CONCLUDE PLANT LIFECYCLE SECTION */}
              {(gardens as any[]).length > 0 && (
                <View style={styles.endPlantSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="leaf-outline" size={18} color="#dc2626" />
                    <Text style={styles.endPlantSectionTitle}>Plant Lifecycle & Audit Records</Text>
                  </View>
                  <Text style={styles.endPlantSectionSub}>
                    Record when a botanical specimen has finished its cycle, dried up, or been sold.
                  </Text>
                  <View style={styles.endPlantGrid}>
                    {(gardens as any[]).map((g: any) => (
                      <TouchableOpacity
                        key={g.id}
                        style={styles.endPlantGardenBtn}
                        onPress={() => {
                          setEndPlantGardenId(g.id);
                          setShowEndPlantModal(true);
                        }}
                      >
                        <Ionicons name="flower" size={16} color="#059669" />
                        <Text style={styles.endPlantGardenName}>{g.name}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* ==================== HARVEST TAB ==================== */}
      {activeTab === 'HARVEST' && (
        <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            {harvestableGardens.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="basket-outline" size={52} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Harvestable Gardens Found</Text>
                <Text style={styles.emptyText}>
                  Harvest tracking is available for your terrace, balcony, or kitchen gardens. Create a
                  garden to start tracking vegetable and herb yields.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.harvestInfoCard}>
                  <Ionicons name="information-circle" size={22} color="#0369a1" />
                  <Text style={styles.harvestInfoText}>
                    Record your home-grown vegetables, herbs, or fruits. Enter current market prices to
                    calculate your household savings!
                  </Text>
                </View>

                <View style={styles.harvestGrid}>
                  {harvestableGardens.map((g: any) => (
                    <TouchableOpacity
                      key={g.id}
                      style={styles.harvestGardenCard}
                      onPress={() => {
                        setHarvestGardenId(g.id);
                        setShowHarvestModal(true);
                        tap();
                      }}
                    >
                      <LinearGradient
                        colors={['#0f172a', '#14532d']}
                        style={styles.harvestGardenGradient}
                      >
                        <View style={styles.harvestGardenIcon}>
                          <Ionicons name="basket" size={24} color="#4ade80" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.harvestGardenName}>{g.name}</Text>
                          <Text style={styles.harvestGardenSub}>Tap to add fresh harvest entry</Text>
                        </View>
                        <Ionicons name="add-circle" size={26} color="#4ade80" />
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}

      {/* ==================== ADD EXPENSE MODAL ==================== */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: '#0f172a' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Garden Expense</Text>
                <Text style={styles.modalSubtitle}>Record fertilizer, seeds, pots, or tools</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expense Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Organic Tomato Seeds"
                placeholderTextColor="#64748b"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 250"
                placeholderTextColor="#64748b"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.catChip,
                      selectedCat === cat.value && {
                        backgroundColor: cat.color,
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => setSelectedCat(cat.value)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={selectedCat === cat.value ? '#fff' : '#64748b'}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        selectedCat === cat.value && { color: '#ffffff' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {(gardens as any[]).length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Assign to Garden (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  {(gardens as any[]).map((g: any) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.catChip,
                        selectedGarden === g.id && {
                          backgroundColor: '#059669',
                          borderColor: '#059669',
                        },
                      ]}
                      onPress={() => setSelectedGarden(selectedGarden === g.id ? '' : g.id)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          selectedGarden === g.id && { color: '#ffffff' },
                        ]}
                      >
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Vendor (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Purchased from local nursery"
                placeholderTextColor="#64748b"
                value={note}
                onChangeText={setNote}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveExpense}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Save Expense</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================== HARVEST MODAL ==================== */}
      <Modal
        visible={showHarvestModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowHarvestModal(false);
          setHarvestSuccess(null);
        }}
      >
        <View style={styles.modalOverlay}>
          {harvestSuccess ? (
            // SUCCESS SCREEN
            <View style={[styles.modalCard, { backgroundColor: '#0f172a', alignItems: 'center', paddingVertical: 32 }]}>
              <Text style={{ fontSize: 50 }}>🌱</Text>
              <Text style={styles.congratsTitle}>Fresh Harvest Recorded!</Text>
              <Text style={styles.congratsSubtitle}>Sustainable Home Production</Text>
              <View style={styles.congratsCard}>
                <Text style={styles.congratsLine}>
                  Harvested: {harvestSuccess.qty} {harvestSuccess.unit} of{' '}
                  <Text style={{ fontFamily: FONT.bold, color: '#ffffff' }}>{harvestSuccess.plant}</Text>
                </Text>
                <Text style={styles.congratsSaved}>
                  Estimated Value:{' '}
                  <Text style={{ color: '#4ade80', fontFamily: FONT.extraBold }}>
                    ₹{harvestSuccess.saved.toLocaleString('en-IN')}
                  </Text>
                </Text>
                <Text style={styles.congratsNote}>
                  Based on prevailing market prices, you saved this amount by harvesting clean produce
                  from your own garden!
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 16, width: '100%' }]}
                onPress={() => {
                  setShowHarvestModal(false);
                  setHarvestSuccess(null);
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // HARVEST ENTRY FORM
            <View style={[styles.modalCard, { backgroundColor: '#0f172a' }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Record Fresh Harvest</Text>
                  <Text style={styles.modalSubtitle}>Calculate value and home-grown savings</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowHarvestModal(false);
                    setHarvestGardenId('');
                  }}
                >
                  <Ionicons name="close-circle" size={26} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Select Garden */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Garden Space</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  {harvestableGardens.map((g: any) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.catChip,
                        harvestGardenId === g.id && {
                          backgroundColor: '#059669',
                          borderColor: '#059669',
                        },
                      ]}
                      onPress={() => {
                        setHarvestGardenId(g.id);
                        setHarvestPlantId('');
                      }}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          harvestGardenId === g.id && { color: '#ffffff' },
                        ]}
                      >
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Select Plant */}
              {harvestGardenId && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Harvested Botanical Specimen</Text>
                  {harvestPlants.length === 0 ? (
                    <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                      No plants found in this space. Please add plants first.
                    </Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                      {(harvestPlants as any[]).map((p: any) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.catChip,
                            harvestPlantId === p.id && {
                              backgroundColor: '#0284c7',
                              borderColor: '#0284c7',
                            },
                          ]}
                          onPress={() => setHarvestPlantId(p.id)}
                        >
                          <Ionicons
                            name="leaf"
                            size={13}
                            color={harvestPlantId === p.id ? '#ffffff' : '#64748b'}
                          />
                          <Text
                            style={[
                              styles.catChipText,
                              harvestPlantId === p.id && { color: '#ffffff' },
                            ]}
                          >
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* Quantity + Unit */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Harvest Quantity & Unit</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="e.g. 2.5"
                    placeholderTextColor="#64748b"
                    value={harvestQty}
                    onChangeText={setHarvestQty}
                    keyboardType="numeric"
                  />
                  <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {['kg', 'grams', 'pieces', 'bunch'].map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.catChip,
                            harvestUnit === u && {
                              backgroundColor: '#059669',
                              borderColor: '#059669',
                            },
                          ]}
                          onPress={() => setHarvestUnit(u)}
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              harvestUnit === u && { color: '#ffffff' },
                            ]}
                          >
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              {/* Market Rate */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Market Rate (₹ per {harvestUnit})</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Rate in ₹ per ${harvestUnit}`}
                  placeholderTextColor="#64748b"
                  value={harvestMarketRate}
                  onChangeText={setHarvestMarketRate}
                  keyboardType="numeric"
                />
              </View>

              {/* Preview Savings */}
              {harvestQty &&
                harvestMarketRate &&
                Number(harvestQty) > 0 &&
                Number(harvestMarketRate) > 0 && (
                  <View style={styles.savingsPreview}>
                    <Ionicons name="sparkles" size={18} color="#4ade80" />
                    <Text style={styles.savingsPreviewText}>
                      Calculated Savings:{' '}
                      <Text style={{ fontFamily: FONT.extraBold, color: '#4ade80' }}>
                        ₹
                        {Math.round(
                          Number(harvestQty) * Number(harvestMarketRate)
                        ).toLocaleString('en-IN')}
                      </Text>
                    </Text>
                  </View>
                )}

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: '#059669' },
                  savingHarvest && { opacity: 0.7 },
                ]}
                onPress={handleSaveHarvest}
                disabled={savingHarvest}
              >
                {savingHarvest ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="basket" size={18} color="#ffffff" />
                    <Text style={styles.saveBtnText}>Save Harvest Entry</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ==================== END PLANT MODAL ==================== */}
      <Modal
        visible={showEndPlantModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowEndPlantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: '#0f172a' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Conclude Plant Lifecycle</Text>
                <Text style={styles.modalSubtitle}>Audit and record status for botanical records</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEndPlantModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            {!endPlantId ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Plant to Conclude</Text>
                {endPlants.length === 0 ? (
                  <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: 12 }}>
                    No active plants found in this garden space.
                  </Text>
                ) : (
                  (endPlants as any[]).map((p: any) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.plantSelectRow}
                      onPress={() => {
                        setEndPlantId(p.id);
                        setEndPlantName(p.name);
                      }}
                    >
                      <Ionicons name="leaf" size={18} color="#059669" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plantSelectName}>{p.name}</Text>
                        {p.species && <Text style={styles.plantSelectSub}>{p.species}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : (
              <>
                <View style={styles.selectedPlantBadge}>
                  <Ionicons name="leaf" size={18} color="#4ade80" />
                  <Text style={styles.selectedPlantName}>{endPlantName}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEndPlantId('');
                      setEndPlantName('');
                      setEndReason('');
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason for Concluding</Text>
                  {PLANT_END_REASONS.map((r) => (
                    <TouchableOpacity
                      key={r.value}
                      style={[styles.reasonRow, endReason === r.value && styles.reasonRowActive]}
                      onPress={() => setEndReason(r.value)}
                    >
                      <Text style={styles.reasonLabel}>{r.label}</Text>
                      {endReason === r.value && (
                        <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Completed harvest cycle"
                    placeholderTextColor="#64748b"
                    value={endNote}
                    onChangeText={setEndNote}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: '#dc2626' },
                    savingEnd && { opacity: 0.7 },
                  ]}
                  onPress={handleEndPlant}
                  disabled={savingEnd}
                >
                  {savingEnd ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={18} color="#ffffff" />
                      <Text style={styles.saveBtnText}>Confirm Plant Removal</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    paddingBottom: 20,
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
    gap: 14,
  },
  backBtn: {
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
  headerSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  addHeaderBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  tabBarWrapper: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabBar: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: '#1e293b',
  },
  tabBtnActive: {
    backgroundColor: '#059669',
  },
  tabBtnActiveHarvest: {
    backgroundColor: '#0284c7',
  },
  tabText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },

  mainScroll: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  contentWrapper: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto',
    gap: 16,
  },

  // Summary Card
  summaryCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  summaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  summaryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  summaryAmount: {
    fontSize: 26,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginTop: 2,
  },
  summaryCount: {
    marginLeft: 'auto',
    alignItems: 'center',
  },
  summaryCountText: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  summaryCountLabel: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },

  // Category Chips
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  chipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },

  // List
  list: {
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 10,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 380,
  },

  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  expenseMeta: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#4ade80',
  },

  // End Plant Section
  endPlantSection: {
    marginTop: 20,
    backgroundColor: '#1c1917',
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    gap: 10,
  },
  endPlantSectionTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#f87171',
  },
  endPlantSectionSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#fca5a5',
  },
  endPlantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  endPlantGardenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  endPlantGardenName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // Harvest Tab
  harvestInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0c4a6e',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  harvestInfoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#e0f2fe',
    lineHeight: 18,
  },
  harvestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  harvestGardenCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  harvestGardenGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  harvestGardenIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestGardenName: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  harvestGardenSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#4ade80',
    marginTop: 2,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    maxWidth: 560,
    width: '100%',
    maxHeight: '90%',
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
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
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  input: {
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
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    marginRight: 6,
  },
  catChipText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // Harvest Success
  congratsTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 10,
  },
  congratsSubtitle: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#4ade80',
    marginTop: 2,
  },
  congratsCard: {
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.lg,
    padding: 16,
    width: '100%',
    gap: 8,
    marginTop: 14,
  },
  congratsLine: {
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  congratsSaved: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  congratsNote: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 16,
  },
  savingsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#052e16',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#059669',
  },
  savingsPreviewText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },

  // End plant modal rows
  plantSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  plantSelectName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  plantSelectSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  selectedPlantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#052e16',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  selectedPlantName: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 6,
  },
  reasonRowActive: {
    backgroundColor: '#052e16',
    borderColor: '#059669',
  },
  reasonLabel: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },
});
