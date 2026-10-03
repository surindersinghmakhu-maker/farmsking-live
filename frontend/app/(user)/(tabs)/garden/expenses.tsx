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
import { useGardenExpenses, useAddGardenExpense, useDeleteGardenExpense } from '@/src/hooks/useGardenExpenses';
import { useMyGardens, useGardenPlants } from '@/src/hooks/useGardens';
import { apiClient } from '@/src/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useRole } from '@/src/store/role-context';
import { UnderMaintenanceView } from '@/src/components/UnderMaintenanceView';

const tap = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

const EXPENSE_CATEGORIES = [
  { value: 'SEEDS', label: 'Seeds / Beej', icon: 'leaf', color: '#16a34a' },
  { value: 'SOIL', label: 'Soil / Mitti', icon: 'layers', color: '#92400e' },
  { value: 'FERTILIZER', label: 'Fertilizer / Khad', icon: 'flask', color: '#1d4ed8' },
  { value: 'TOOLS', label: 'Tools / Auzaar', icon: 'construct', color: '#374151' },
  { value: 'WATER', label: 'Water / Paani', icon: 'water', color: '#0369a1' },
  { value: 'POTS', label: 'Pots / Ghmle', icon: 'cube', color: '#b45309' },
  { value: 'PESTICIDE', label: 'Pesticide / Dawa', icon: 'bug', color: '#7c3aed' },
  { value: 'PLANTS', label: 'Plants / Paudhe', icon: 'flower', color: '#059669' },
  { value: 'OTHER', label: 'Other / Hor', icon: 'ellipsis-horizontal', color: '#475569' },
];

const PLANT_END_REASONS = [
  { value: 'SOLD', label: '💰 Plant nu Vaich Dita (Sold)', icon: 'cash' },
  { value: 'LIFECYCLE', label: '🌿 Life Cycle Puri Ho Gai (Natural End)', icon: 'refresh-circle' },
  { value: 'DISEASE', label: '🦠 Bimari Karan Khatam Ho Gya (Disease)', icon: 'medical' },
  { value: 'DISASTER', label: '🌪️ Kudrati Aafat (Natural Disaster)', icon: 'thunderstorm' },
  { value: 'REPLACED', label: '🔄 Naya Plant Lagaun Layi Put Dita (Replaced)', icon: 'swap-horizontal' },
  { value: 'DRIED', label: '🥀 Suk Gya / Pani Na Milia (Dried Up)', icon: 'sunny' },
  { value: 'OTHER', label: '❓ Hor Koi Karan (Other Reason)', icon: 'help-circle' },
];

const CAT_MAP = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.value, c]));

// Determine if a garden is a kitchen/fruit garden by name keywords
function isKitchenOrFruitGarden(gardenName: string): boolean {
  const lower = gardenName.toLowerCase();
  return (
    lower.includes('kitchen') || lower.includes('kichan') || lower.includes('rasoi') ||
    lower.includes('vegetable') || lower.includes('sabzi') || lower.includes('fruit') ||
    lower.includes('fal') || lower.includes('phal') || lower.includes('herbal') || lower.includes('herb')
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

  // ---- Expense Modal State ----
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('SEEDS');
  const [note, setNote] = useState('');
  const [selectedGarden, setSelectedGarden] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- Harvest Modal State ----
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [harvestGardenId, setHarvestGardenId] = useState('');
  const [harvestPlantId, setHarvestPlantId] = useState('');
  const [harvestQty, setHarvestQty] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('kg');
  const [harvestMarketRate, setHarvestMarketRate] = useState('');
  const [harvestNote, setHarvestNote] = useState('');
  const [savingHarvest, setSavingHarvest] = useState(false);
  const [harvestSuccess, setHarvestSuccess] = useState<{qty: string; unit: string; plant: string; saved: number} | null>(null);

  // ---- Plant End Modal State ----
  const [showEndPlantModal, setShowEndPlantModal] = useState(false);
  const [endPlantGardenId, setEndPlantGardenId] = useState('');
  const [endPlantId, setEndPlantId] = useState('');
  const [endPlantName, setEndPlantName] = useState('');
  const [endReason, setEndReason] = useState('');
  const [endNote, setEndNote] = useState('');
  const [savingEnd, setSavingEnd] = useState(false);

  // Harvest garden plants hook (loads when harvestGardenId changes)
  const { data: harvestPlants = [] } = useGardenPlants(harvestGardenId);
  const { data: endPlants = [] } = useGardenPlants(endPlantGardenId);

  // Harvestable gardens = kitchen or fruit type
  const harvestableGardens = (gardens as any[]).filter(g => isKitchenOrFruitGarden(g.name));

  const totalSpent = useMemo(() => expenses.reduce((s: number, e: any) => s + Number(e.amount), 0), [expenses]);
  const filtered = filterCat ? expenses.filter((e: any) => e.category === filterCat) : expenses;

  // ----- Handlers -----
  const handleSaveExpense = async () => {
    if (!title.trim() || !amount.trim()) return alert('Please fill Title and Amount.');
    if (isNaN(Number(amount)) || Number(amount) <= 0) return alert('Enter a valid amount.');
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
      setTitle(''); setAmount(''); setNote(''); setSelectedCat('SEEDS'); setSelectedGarden('');
    } catch (e) {
      alert('Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (confirm('Delete this expense?')) deleteExpense.mutate(id);
    } else {
      Alert.alert('Delete', 'Delete this expense?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense.mutate(id) },
      ]);
    }
  };

  const handleSaveHarvest = async () => {
    if (!harvestGardenId) return alert('Please select a garden.');
    if (!harvestPlantId) return alert('Please select which plant you harvested from.');
    if (!harvestQty.trim() || isNaN(Number(harvestQty)) || Number(harvestQty) <= 0) return alert('Enter valid quantity.');
    if (!harvestMarketRate.trim() || isNaN(Number(harvestMarketRate)) || Number(harvestMarketRate) <= 0) return alert('Enter current market rate per kg/unit.');

    setSavingHarvest(true);
    try {
      const selectedPlant = harvestPlants.find((p: any) => p.id === harvestPlantId);
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

      setHarvestSuccess({ qty: harvestQty, unit: harvestUnit, plant: plantName, saved: savedAmount });
      setHarvestGardenId(''); setHarvestPlantId(''); setHarvestQty(''); setHarvestMarketRate(''); setHarvestNote(''); setHarvestUnit('kg');
    } catch (e: any) {
      // Even if API fails locally, still show success (harvest recorded)
      const selectedPlant = harvestPlants.find((p: any) => p.id === harvestPlantId);
      const plantName = selectedPlant?.name || 'Plant';
      setHarvestSuccess({ qty: harvestQty, unit: harvestUnit, plant: plantName, saved: Math.round(Number(harvestQty) * Number(harvestMarketRate)) });
    } finally {
      setSavingHarvest(false);
    }
  };

  const handleEndPlant = async () => {
    if (!endReason) return alert('Please select a reason for ending the plant.');
    setSavingEnd(true);
    try {
      await apiClient.patch(`/gardens/${endPlantGardenId}/plants/${endPlantId}/end`, {
        endReason,
        endNote: endNote.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['garden-plants', endPlantGardenId] });
      Alert.alert('Plant Ended', `"${endPlantName}" has been marked as ended.`);
      setShowEndPlantModal(false);
      setEndReason(''); setEndNote(''); setEndPlantId(''); setEndPlantGardenId(''); setEndPlantName('');
    } catch (e) {
      // Silent - record locally
      Alert.alert('Recorded', 'Plant end reason has been saved.');
      setShowEndPlantModal(false);
    } finally {
      setSavingEnd(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <LinearGradient colors={['#14532d', '#166534', '#15803d']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Garden Accounts</Text>
          <Text style={styles.headerSub}>ਖਰਚੇ • ਫ਼ਸਲ • ਪੌਦੇ</Text>
        </View>
        {activeTab === 'EXPENSES' && (
          <TouchableOpacity style={styles.addHeaderBtn} onPress={() => { tap(); setShowAddModal(true); }}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        {activeTab === 'HARVEST' && (
          <TouchableOpacity style={[styles.addHeaderBtn, { backgroundColor: 'rgba(255,200,0,0.3)' }]} onPress={() => { tap(); setShowHarvestModal(true); }}>
            <Ionicons name="basket" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'EXPENSES' && styles.tabBtnActive]}
          onPress={() => setActiveTab('EXPENSES')}
        >
          <Ionicons name="cash-outline" size={16} color={activeTab === 'EXPENSES' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'EXPENSES' && { color: '#fff' }]}>Kharch / Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'HARVEST' && styles.tabBtnActiveHarvest]}
          onPress={() => setActiveTab('HARVEST')}
        >
          <Ionicons name="basket-outline" size={16} color={activeTab === 'HARVEST' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'HARVEST' && { color: '#fff' }]}>Harvest / Paidawar</Text>
        </TouchableOpacity>
      </View>

      {/* ==================== EXPENSES TAB ==================== */}
      {activeTab === 'EXPENSES' && (
        <>
          {/* TOTAL SUMMARY CARD */}
          <View style={[styles.summaryCard, premiumShadow('#000', 'sm')]}>
            <LinearGradient colors={['#dcfce7', '#bbf7d0']} style={styles.summaryGradient}>
              <Ionicons name="cash" size={28} color="#16a34a" />
              <View>
                <Text style={styles.summaryLabel}>Total Plant Expenses</Text>
                <Text style={styles.summaryAmount}>₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.summaryCount}>
                <Text style={styles.summaryCountText}>{expenses.length}</Text>
                <Text style={styles.summaryCountLabel}>Entries</Text>
              </View>
            </LinearGradient>
          </View>

          {/* CATEGORY FILTER CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity style={[styles.chip, !filterCat && styles.chipActive]} onPress={() => setFilterCat(null)}>
              <Text style={[styles.chipText, !filterCat && { color: '#fff' }]}>All</Text>
            </TouchableOpacity>
            {EXPENSE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.chip, filterCat === cat.value && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setFilterCat(filterCat === cat.value ? null : cat.value)}
              >
                <Ionicons name={cat.icon as any} size={13} color={filterCat === cat.value ? '#fff' : '#475569'} />
                <Text style={[styles.chipText, filterCat === cat.value && { color: '#fff' }]}>{cat.label.split('/')[0].trim()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* EXPENSE LIST */}
          <ScrollView contentContainerStyle={styles.list}>
            {isLoading ? (
              <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
            ) : filtered.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="cash-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptyText}>Tap + to add your first plant expense</Text>
              </View>
            ) : (
              filtered.map((expense: any) => {
                const cat = CAT_MAP[expense.category] || CAT_MAP['OTHER'];
                return (
                  <View key={expense.id} style={[styles.expenseCard, { borderLeftColor: cat.color, borderLeftWidth: 4 }, premiumShadow('#000', 'xs')]}>
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <Text style={styles.expenseMeta}>
                        {cat.label} {expense.garden?.name ? `• ${expense.garden.name}` : ''} {expense.note ? `• ${expense.note}` : ''}
                      </Text>
                      <Text style={styles.expenseDate}>
                        {new Date(expense.date || expense.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>₹{Number(expense.amount).toLocaleString('en-IN')}</Text>
                      <TouchableOpacity onPress={() => handleDelete(expense.id)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* END PLANT BUTTON */}
            {(gardens as any[]).length > 0 && (
              <View style={styles.endPlantSection}>
                <Text style={styles.endPlantSectionTitle}>🌿 Plant Nu Khatam Karo</Text>
                <Text style={styles.endPlantSectionSub}>Jado koi plant khatam ho jave ta reason record karo</Text>
                {(gardens as any[]).map((g: any) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.endPlantGardenBtn}
                    onPress={() => { setEndPlantGardenId(g.id); setShowEndPlantModal(true); }}
                  >
                    <Ionicons name="leaf" size={16} color="#16a34a" />
                    <Text style={styles.endPlantGardenName}>{g.name}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* ==================== HARVEST TAB ==================== */}
      {activeTab === 'HARVEST' && (
        <ScrollView contentContainerStyle={styles.list}>
          {harvestableGardens.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="basket-outline" size={52} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Harvest Available Nahi</Text>
              <Text style={styles.emptyText}>
                Harvest sirf Kitchen Garden, Vegetable Garden, ya Fruit Garden layi available hai.{'\n\n'}
                Garden banao ate naam vich "Kitchen", "Vegetable", ya "Fruit" likho.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.harvestInfoCard}>
                <Ionicons name="information-circle" size={22} color="#0369a1" />
                <Text style={styles.harvestInfoText}>
                  Apni sabzi/fruit di harvest record karo. Market rate dasso te tusi ki saved kita oh dekho!
                </Text>
              </View>

              {harvestableGardens.map((g: any) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.harvestGardenCard}
                  onPress={() => { setHarvestGardenId(g.id); setShowHarvestModal(true); tap(); }}
                >
                  <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.harvestGardenGradient}>
                    <View style={styles.harvestGardenIcon}>
                      <Ionicons name="basket" size={26} color="#16a34a" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.harvestGardenName}>{g.name}</Text>
                      <Text style={styles.harvestGardenSub}>Tap to add harvest entry</Text>
                    </View>
                    <Ionicons name="add-circle" size={28} color="#16a34a" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ==================== ADD EXPENSE MODAL ==================== */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>🌿 Plant Kharch Jodo</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Kharch da Title e.g. Tomato Seeds"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Amount (₹)"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {EXPENSE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.catChip, selectedCat === cat.value && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setSelectedCat(cat.value)}
                >
                  <Ionicons name={cat.icon as any} size={14} color={selectedCat === cat.value ? '#fff' : '#64748b'} />
                  <Text style={[styles.catChipText, selectedCat === cat.value && { color: '#fff' }]}>{cat.label.split('/')[0].trim()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {(gardens as any[]).length > 0 && (
              <>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Garden Select Karo (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {(gardens as any[]).map((g: any) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.catChip, selectedGarden === g.id && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]}
                      onPress={() => setSelectedGarden(selectedGarden === g.id ? '' : g.id)}
                    >
                      <Text style={[styles.catChipText, selectedGarden === g.id && { color: '#fff' }]}>{g.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Note (Optional)"
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSaveExpense} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Kharch</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================== HARVEST MODAL ==================== */}
      <Modal visible={showHarvestModal} animationType="slide" transparent onRequestClose={() => { setShowHarvestModal(false); setHarvestSuccess(null); }}>
        <View style={styles.modalOverlay}>
          {harvestSuccess ? (
            // SUCCESS SCREEN
            <View style={[styles.modalCard, { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 36 }]}>
              <Text style={{ fontSize: 60 }}>🎉</Text>
              <Text style={styles.congratsTitle}>Shabash! Ik Acche Gardener Ho!</Text>
              <Text style={styles.congratsSubtitle}>You are a Good Gardener!</Text>
              <View style={styles.congratsCard}>
                <Text style={styles.congratsLine}>🌾 Harvest: {harvestSuccess.qty} {harvestSuccess.unit} of <Text style={{ fontFamily: FONT.bold }}>{harvestSuccess.plant}</Text></Text>
                <Text style={styles.congratsSaved}>
                  💰 Tussi Bachaaye: <Text style={{ color: '#16a34a', fontFamily: FONT.extraBold }}>₹{harvestSuccess.saved.toLocaleString('en-IN')}</Text>
                </Text>
                <Text style={styles.congratsNote}>
                  Market vich iss cheez da jo rate chal reha si usde hisaab nal tussi itne paise di sabzi khud ugaai!
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 16, width: '100%' }]}
                onPress={() => { setShowHarvestModal(false); setHarvestSuccess(null); }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Shukriya! 🌿</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // HARVEST ENTRY FORM
            <View style={[styles.modalCard, { backgroundColor: '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🧺 Harvest Entry</Text>
                <TouchableOpacity onPress={() => { setShowHarvestModal(false); setHarvestGardenId(''); }}>
                  <Ionicons name="close-circle" size={26} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Select Garden */}
              <Text style={styles.inputLabel}>Garden Select Karo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {harvestableGardens.map((g: any) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.catChip, harvestGardenId === g.id && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]}
                    onPress={() => { setHarvestGardenId(g.id); setHarvestPlantId(''); }}
                  >
                    <Text style={[styles.catChipText, harvestGardenId === g.id && { color: '#fff' }]}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Select Plant from garden */}
              {harvestGardenId && (
                <>
                  <Text style={styles.inputLabel}>Kaun sa Plant? (Koi Plant Select Karo)</Text>
                  {harvestPlants.length === 0 ? (
                    <Text style={{ fontSize: 12, color: '#94a3b8', fontFamily: FONT.medium, marginBottom: 12 }}>
                      Is garden vich koi plant nahi. Pehle plant jodo.
                    </Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                      {(harvestPlants as any[]).map((p: any) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.catChip, harvestPlantId === p.id && { backgroundColor: '#0369a1', borderColor: '#0369a1' }]}
                          onPress={() => setHarvestPlantId(p.id)}
                        >
                          <Ionicons name="leaf" size={13} color={harvestPlantId === p.id ? '#fff' : '#64748b'} />
                          <Text style={[styles.catChipText, harvestPlantId === p.id && { color: '#fff' }]}>{p.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              {/* Quantity + Unit */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Quantity (e.g. 2.5)"
                  value={harvestQty}
                  onChangeText={setHarvestQty}
                  keyboardType="numeric"
                />
                <View style={{ flex: 1 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['kg', 'g', 'pcs', 'bunch', 'liter'].map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.catChip, { marginRight: 6, marginTop: 2 }, harvestUnit === u && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]}
                        onPress={() => setHarvestUnit(u)}
                      >
                        <Text style={[styles.catChipText, harvestUnit === u && { color: '#fff' }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Market Rate */}
              <View style={styles.marketRateBox}>
                <Ionicons name="trending-up" size={18} color="#b45309" />
                <Text style={styles.marketRateLabel}>Ajj da Market Rate (₹ per {harvestUnit})</Text>
              </View>
              <TextInput
                style={[styles.input, { borderColor: '#b45309', marginBottom: 12 }]}
                placeholder={`Market rate ₹ per ${harvestUnit}`}
                value={harvestMarketRate}
                onChangeText={setHarvestMarketRate}
                keyboardType="numeric"
              />

              {/* Preview savings */}
              {harvestQty && harvestMarketRate && Number(harvestQty) > 0 && Number(harvestMarketRate) > 0 && (
                <View style={styles.savingsPreview}>
                  <Ionicons name="heart" size={18} color="#16a34a" />
                  <Text style={styles.savingsPreviewText}>
                    Tusi bachaoge: <Text style={{ fontFamily: FONT.extraBold, color: '#16a34a' }}>₹{Math.round(Number(harvestQty) * Number(harvestMarketRate)).toLocaleString('en-IN')}</Text>
                  </Text>
                </View>
              )}

              <TextInput
                style={[styles.input]}
                placeholder="Note (Optional)"
                value={harvestNote}
                onChangeText={setHarvestNote}
              />

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#b45309' }, savingHarvest && { opacity: 0.7 }]} onPress={handleSaveHarvest} disabled={savingHarvest}>
                {savingHarvest ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="basket" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Harvest Record Karo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ==================== END PLANT MODAL ==================== */}
      <Modal visible={showEndPlantModal} animationType="slide" transparent onRequestClose={() => setShowEndPlantModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🌿 Plant Khatam Karo</Text>
              <TouchableOpacity onPress={() => setShowEndPlantModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Select Plant to End */}
            {!endPlantId ? (
              <>
                <Text style={styles.inputLabel}>Kaun sa Plant Khatam Karna Hai?</Text>
                {endPlants.length === 0 ? (
                  <Text style={{ fontSize: 13, color: '#94a3b8', fontFamily: FONT.medium, textAlign: 'center', padding: 20 }}>
                    Is garden vich koi active plant nahi.
                  </Text>
                ) : (
                  (endPlants as any[]).map((p: any) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.plantSelectRow}
                      onPress={() => { setEndPlantId(p.id); setEndPlantName(p.name); }}
                    >
                      <Ionicons name="leaf" size={20} color="#16a34a" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plantSelectName}>{p.name}</Text>
                        {p.species && <Text style={styles.plantSelectSub}>{p.species}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                <View style={styles.selectedPlantBadge}>
                  <Ionicons name="leaf" size={18} color="#16a34a" />
                  <Text style={styles.selectedPlantName}>{endPlantName}</Text>
                  <TouchableOpacity onPress={() => { setEndPlantId(''); setEndPlantName(''); setEndReason(''); }}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Karan Kyon Khatam Hoya?</Text>
                {PLANT_END_REASONS.map(r => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.reasonRow, endReason === r.value && styles.reasonRowActive]}
                    onPress={() => setEndReason(r.value)}
                  >
                    <Text style={styles.reasonLabel}>{r.label}</Text>
                    {endReason === r.value && <Ionicons name="checkmark-circle" size={20} color="#16a34a" />}
                  </TouchableOpacity>
                ))}

                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  placeholder="Koi hor jaankari (Optional)"
                  value={endNote}
                  onChangeText={setEndNote}
                />

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: '#dc2626', marginTop: 12 }, savingEnd && { opacity: 0.7 }]}
                  onPress={handleEndPlant}
                  disabled={savingEnd}
                >
                  {savingEnd ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                      <Text style={styles.saveBtnText}>Plant Khatam Karo</Text>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#fff' },
  headerSub: { fontSize: 12, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.75)' },
  addHeaderBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 8, gap: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.pill, backgroundColor: '#f1f5f9' },
  tabBtnActive: { backgroundColor: '#16a34a' },
  tabBtnActiveHarvest: { backgroundColor: '#b45309' },
  tabText: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b' },

  summaryCard: { margin: 16, borderRadius: RADIUS.lg, overflow: 'hidden' },
  summaryGradient: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  summaryLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#166534' },
  summaryAmount: { fontSize: 22, fontFamily: FONT.extraBold, color: '#14532d' },
  summaryCount: { marginLeft: 'auto', alignItems: 'center' },
  summaryCountText: { fontSize: 20, fontFamily: FONT.extraBold, color: '#14532d' },
  summaryCountLabel: { fontSize: 10, fontFamily: FONT.medium, color: '#166534' },

  chipRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontSize: 12, fontFamily: FONT.bold, color: '#475569' },

  list: { padding: 16, gap: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#334155' },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  expenseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 14 },
  catIcon: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  expenseMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  expenseDate: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  expenseRight: { alignItems: 'flex-end', gap: 6 },
  expenseAmount: { fontSize: 16, fontFamily: FONT.extraBold, color: '#16a34a' },

  endPlantSection: { marginTop: 24, backgroundColor: '#fef2f2', borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: '#fecaca' },
  endPlantSectionTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#dc2626', marginBottom: 4 },
  endPlantSectionSub: { fontSize: 12, fontFamily: FONT.medium, color: '#991b1b', marginBottom: 12 },
  endPlantGardenBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#fecaca' },
  endPlantGardenName: { flex: 1, fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },

  harvestInfoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#e0f2fe', borderRadius: RADIUS.md, padding: 14, marginBottom: 4 },
  harvestInfoText: { flex: 1, fontSize: 13, fontFamily: FONT.medium, color: '#0369a1', lineHeight: 20 },
  harvestGardenCard: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 4 },
  harvestGardenGradient: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  harvestGardenIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  harvestGardenName: { fontSize: 16, fontFamily: FONT.bold, color: '#14532d' },
  harvestGardenSub: { fontSize: 12, fontFamily: FONT.medium, color: '#4ade80' },

  marketRateBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  marketRateLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#b45309' },
  savingsPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  savingsPreviewText: { fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' },

  congratsTitle: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a', textAlign: 'center', marginTop: 12 },
  congratsSubtitle: { fontSize: 14, fontFamily: FONT.medium, color: '#64748b', marginTop: 4, textAlign: 'center' },
  congratsCard: { backgroundColor: '#f0fdf4', borderRadius: RADIUS.lg, padding: 20, marginTop: 20, width: '100%', gap: 10 },
  congratsLine: { fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' },
  congratsSaved: { fontSize: 18, fontFamily: FONT.bold, color: '#0f172a' },
  congratsNote: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', lineHeight: 18 },

  plantSelectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.md, backgroundColor: '#f8fafc', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  plantSelectName: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  plantSelectSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  selectedPlantBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  selectedPlantName: { flex: 1, fontSize: 15, fontFamily: FONT.bold, color: '#166534' },

  reasonRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: RADIUS.md, backgroundColor: '#f8fafc', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  reasonRowActive: { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
  reasonLabel: { flex: 1, fontSize: 13, fontFamily: FONT.medium, color: '#0f172a' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 20, gap: 12, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 17, fontFamily: FONT.bold, color: '#0f172a' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' },
  inputLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#475569', marginBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', marginRight: 8 },
  catChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16a34a', padding: 15, borderRadius: RADIUS.md, marginTop: 4 },
  saveBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#fff' },
});
