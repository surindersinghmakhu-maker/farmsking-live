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
import { useMyGardens } from '@/src/hooks/useGardens';

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

const CAT_MAP = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.value, c]));

export default function GardenExpensesScreen() {
  const router = useRouter();
  const { colors } = useExecutiveTheme();
  const { data: expenses = [], isLoading } = useGardenExpenses();
  const { data: gardens = [] } = useMyGardens();
  const addExpense = useAddGardenExpense();
  const deleteExpense = useDeleteGardenExpense();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('SEEDS');
  const [note, setNote] = useState('');
  const [selectedGarden, setSelectedGarden] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalSpent = useMemo(() => expenses.reduce((s: number, e: any) => s + Number(e.amount), 0), [expenses]);

  const filtered = filterCat ? expenses.filter((e: any) => e.category === filterCat) : expenses;

  const handleSave = async () => {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <LinearGradient colors={['#14532d', '#166534', '#15803d']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Garden Expenses</Text>
          <Text style={styles.headerSub}>ਬਾਗ ਦੇ ਖਰਚੇ ਦਾ ਹਿਸਾਬ</Text>
        </View>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => { tap(); setShowAddModal(true); }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* TOTAL SUMMARY CARD */}
      <View style={[styles.summaryCard, premiumShadow('#000', 'sm')]}>
        <LinearGradient colors={['#dcfce7', '#bbf7d0']} style={styles.summaryGradient}>
          <Ionicons name="cash" size={28} color="#16a34a" />
          <View>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryAmount}>₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.summaryCount}>
            <Text style={styles.summaryCountText}>{expenses.length}</Text>
            <Text style={styles.summaryCountLabel}>Entries</Text>
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
            <Text style={styles.emptyText}>Tap + to add your first garden expense</Text>
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
                    {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
      </ScrollView>

      {/* ADD EXPENSE MODAL */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Garden Expense</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Expense Title e.g. Rose Seeds"
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
                  style={[
                    styles.catChip,
                    selectedCat === cat.value && { backgroundColor: cat.color, borderColor: cat.color }
                  ]}
                  onPress={() => setSelectedCat(cat.value)}
                >
                  <Ionicons name={cat.icon as any} size={14} color={selectedCat === cat.value ? '#fff' : '#64748b'} />
                  <Text style={[styles.catChipText, selectedCat === cat.value && { color: '#fff' }]}>
                    {cat.label.split('/')[0].trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {gardens.length > 0 && (
              <>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Link Garden (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {gardens.map((g: any) => (
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

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Expense</Text>
                </>
              )}
            </TouchableOpacity>
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
  addHeaderBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryCard: { margin: 16, borderRadius: RADIUS.lg, overflow: 'hidden' },
  summaryGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16,
  },
  summaryLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#166534' },
  summaryAmount: { fontSize: 22, fontFamily: FONT.extraBold, color: '#14532d' },
  summaryCount: { marginLeft: 'auto', alignItems: 'center' },
  summaryCountText: { fontSize: 20, fontFamily: FONT.extraBold, color: '#14532d' },
  summaryCountLabel: { fontSize: 10, fontFamily: FONT.medium, color: '#166534' },
  chipRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontSize: 12, fontFamily: FONT.bold, color: '#475569' },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#334155' },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },
  expenseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 14,
  },
  catIcon: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  expenseMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  expenseDate: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  expenseRight: { alignItems: 'flex-end', gap: 6 },
  expenseAmount: { fontSize: 16, fontFamily: FONT.extraBold, color: '#16a34a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 20, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 17, fontFamily: FONT.bold },
  input: {
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, fontFamily: FONT.medium,
  },
  inputLabel: { fontSize: 12, fontFamily: FONT.bold, marginBottom: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc', marginRight: 8,
  },
  catChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#16a34a', padding: 15, borderRadius: RADIUS.md, marginTop: 4,
  },
  saveBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#fff' },
});
