import React, { useEffect, useMemo, useState } from 'react';
// Updated Records Screen with Sales tab label & syntax fix
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useFarms } from '@/src/hooks/useFarms';
import { usePlotsForFarm } from '@/src/hooks/usePlots';
import { useCreateExpense, useExpenseCategories, useExpensesForFarm } from '@/src/hooks/useExpenses';
import { useCrops } from '@/src/store/crops-context';
import { getExpenseCategoryIcon } from '@/src/constants/expenseCategoryIcons';
import { formatInr } from '@/src/utils/formatInr';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// 5 Combined Essential Agricultural Expense Categories
export const COMBINED_EXPENSE_CATEGORIES = [
  {
    id: 'cat_seeds_fert',
    key: 'seeds_fertilizer',
    labelEn: 'Seeds, Fertilizers & Pesticides',
    labelHi: 'खाद, बीज व दवाई',
    icon: 'leaf-outline',
  },
  {
    id: 'cat_labour_mach',
    key: 'labour_machinery',
    labelEn: 'Labor, Tractor & Machinery',
    labelHi: 'मजदूरी, ट्रैक्टर व उपकरण',
    icon: 'people-outline',
  },
  {
    id: 'cat_irrig_power',
    key: 'irrigation_power',
    labelEn: 'Irrigation, Diesel & Electricity',
    labelHi: 'सिंचाई, डीजल व बिजली',
    icon: 'water-outline',
  },
  {
    id: 'cat_trans_pack',
    key: 'transport_packing',
    labelEn: 'Transport, Mandi & Packing',
    labelHi: 'परिवहन, मंडी व पैकिंग',
    icon: 'bus-outline',
  },
  {
    id: 'cat_other',
    key: 'other',
    labelEn: 'Other Farm Expenses',
    labelHi: 'अन्य कृषि खर्च',
    icon: 'ellipsis-horizontal-outline',
  },
];

export default function RecordsScreen() {
  const [recordType, setRecordType] = useState<'EXPENSES' | 'SALES' | 'ANALYSIS'>('SALES');

  const { data: farms, isLoading: farmsLoading } = useFarms();
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedFarmId && farms && farms.length > 0) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  const { data: apiCategories } = useExpenseCategories();
  const { data: plots } = usePlotsForFarm(selectedFarmId);
  const { data: expenses, isLoading: expensesLoading, refetch, isRefetching } = useExpensesForFarm(selectedFarmId);
  const createExpense = useCreateExpense();

  // Combine categories: use api categories if available, else fall back to COMBINED_EXPENSE_CATEGORIES
  const displayCategories = useMemo(() => {
    if (apiCategories && apiCategories.length > 0 && apiCategories.length <= 8) {
      return apiCategories;
    }
    return COMBINED_EXPENSE_CATEGORIES;
  }, [apiCategories]);

  // Expense Form state
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [categoryId, setCategoryId] = useState<string | undefined>(displayCategories[0].id);
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [plotId, setPlotId] = useState<string | undefined>(undefined);
  const [vendorName, setVendorName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // Active crops & their sales — shared with the Crops tab. Once a crop reaches
  // the Completed stage it drops out of cropFields, so it naturally stops
  // contributing here too; its sale record only lives on in Crop History.
  const { cropFields: farmerCrops, salesRecords: allSalesRecords, recordSale } = useCrops();
  const salesRecords = useMemo(
    () => allSalesRecords.filter((s) => farmerCrops.some((c) => c.id === s.cropId)),
    [allSalesRecords, farmerCrops]
  );

  // Sales Form state
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [saleQuantity, setSaleQuantity] = useState('');
  const [saleRate, setSaleRate] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [saleError, setSaleError] = useState<string | null>(null);

  // Keep the selected crop valid as the active crop list changes (e.g. a crop completes elsewhere)
  useEffect(() => {
    if (farmerCrops.length === 0) return;
    if (!farmerCrops.some((c) => c.id === selectedCropId)) {
      setSelectedCropId(farmerCrops[0].id);
      setSaleRate(farmerCrops[0].pricePerUnit);
    }
  }, [farmerCrops, selectedCropId]);

  const totalSpent = useMemo(
    () => (expenses ?? []).reduce((acc, curr) => acc + Number(curr.amount), 0),
    [expenses]
  );

  const totalSalesRevenue = useMemo(
    () => salesRecords.reduce((acc, curr) => acc + curr.totalAmount, 0),
    [salesRecords]
  );

  // Crop-wise breakdown for the Analysis tab. Expenses are logged per-farm, not
  // per-crop, so each active crop is given an even share of total expenses.
  const cropAnalysis = useMemo(() => {
    const expenseShare = farmerCrops.length > 0 ? totalSpent / farmerCrops.length : 0;
    return farmerCrops.map((crop) => {
      const income = salesRecords
        .filter((s) => s.cropId === crop.id)
        .reduce((acc, s) => acc + s.totalAmount, 0);
      return {
        cropName: crop.cropName,
        income,
        expense: expenseShare,
        net: income - expenseShare,
      };
    });
  }, [farmerCrops, salesRecords, totalSpent]);

  const maxCropValue = Math.max(1, ...cropAnalysis.map((c) => Math.max(c.income, c.expense)));
  const overallNet = totalSalesRevenue - totalSpent;
  const maxOverallValue = Math.max(1, totalSalesRevenue, totalSpent);

  const selectedFarmerCrop = farmerCrops.find((c) => c.id === selectedCropId) ?? farmerCrops[0];

  const handleSelectFarmerCrop = (cropId: string) => {
    tap();
    setSelectedCropId(cropId);
    const found = farmerCrops.find((c) => c.id === cropId);
    if (found) {
      setSaleRate(found.pricePerUnit);
    }
  };

  const onAddSaleRecord = () => {
    setSaleError(null);
    const qty = Number(saleQuantity);
    const rate = Number(saleRate);
    if (!selectedFarmerCrop) {
      setSaleError('⚠️ Kripya Pehle My Crops Tab Se Crop Add Karein!');
      return;
    }
    if (!qty || qty <= 0 || !rate || rate <= 0) {
      setSaleError('⚠️ Kripya Valid Sale Quantity aur Rate bharein');
      return;
    }

    tap();
    recordSale(selectedFarmerCrop.id, { quantity: saleQuantity, rate: saleRate, buyerName });
    setSaleQuantity('');
    setBuyerName('');
    setShowSaleForm(false);
  };

  const resetExpenseForm = () => {
    setCategoryId(displayCategories[0].id);
    setAmount('');
    setExpenseDate(todayIso());
    setPlotId(undefined);
    setVendorName('');
    setQuantity('');
    setUnit('');
    setNotes('');
  };

  const onAddExpense = async () => {
    setExpenseError(null);
    const amountNum = Number(amount);
    if (!selectedFarmId) return;
    const activeCatId = categoryId || displayCategories[0].id;

    if (!amountNum || amountNum <= 0) {
      setExpenseError('⚠️ Enter a valid expense amount.');
      return;
    }

    try {
      await createExpense.mutateAsync({
        farmId: selectedFarmId,
        categoryId: activeCatId,
        amount: amountNum,
        expenseDate,
        plotId,
        vendorName: vendorName.trim() || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        unit: unit.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      resetExpenseForm();
      setShowExpenseForm(false);
    } catch {
      setExpenseError('Failed to save expense. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Sales & Expense Records</Text>
        <Text style={styles.heroSubtitle}>Track sales revenue & combined farm expenses</Text>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, recordType === 'SALES' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setRecordType('SALES');
            }}
          >
            <Ionicons name="trending-up" size={15} color={recordType === 'SALES' ? theme.primary : '#fff'} />
            <Text style={[styles.tabBtnText, recordType === 'SALES' && styles.tabBtnTextActive]}>
              Sales ({salesRecords.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, recordType === 'EXPENSES' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setRecordType('EXPENSES');
            }}
          >
            <Ionicons name="receipt" size={15} color={recordType === 'EXPENSES' ? theme.primary : '#fff'} />
            <Text style={[styles.tabBtnText, recordType === 'EXPENSES' && styles.tabBtnTextActive]}>
              Expenses ({(expenses ?? []).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, recordType === 'ANALYSIS' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setRecordType('ANALYSIS');
            }}
          >
            <Ionicons name="stats-chart" size={15} color={recordType === 'ANALYSIS' ? theme.primary : '#fff'} />
            <Text style={[styles.tabBtnText, recordType === 'ANALYSIS' && styles.tabBtnTextActive]}>
              Analysis
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      {farmsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : (
        <>
          {recordType === 'SALES' ? (
            /* CROP SALES TAB */
            <View style={{ flex: 1 }}>
              {/* Sales Summary Bar */}
              <View style={styles.summaryBar}>
                <View>
                  <Text style={styles.totalLabel}>Total Sales Revenue</Text>
                  <Text style={styles.salesValue}>{formatInr(totalSalesRevenue)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addSalesCTA}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setShowSaleForm(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                  <Text style={styles.addSalesCTAText}>Sale</Text>
                </TouchableOpacity>
              </View>

              {/* Sales List */}
              <FlatList
                data={salesRecords}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Ionicons name="cart-outline" size={36} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No sales recorded yet.</Text>
                    <Text style={styles.emptySub}>Tap "+ Sale" to log revenue from your harvested crops.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={[styles.card, premiumShadow('#000000', 'sm')]}>
                    <View style={[styles.cardIconWrap, { backgroundColor: '#dcfce7' }]}>
                      <Ionicons name="trending-up" size={18} color="#16a34a" />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{item.cropName}</Text>
                      <Text style={styles.cardSubtitle}>
                        📍 {item.fieldName} · Buyer: {item.buyerName}
                      </Text>
                      <Text style={styles.saleMetaText}>
                        Quantity: {item.quantity} {item.unit} @ ₹{item.pricePerUnit} / {item.unit} · {item.saleDate}
                      </Text>
                    </View>
                    <Text style={styles.salesAmount}>+{formatInr(item.totalAmount)}</Text>
                  </View>
                )}
              />

              {/* Sale Form Modal */}
              {showSaleForm && (
                <View style={styles.modalOverlay}>
                  <View style={styles.modalCard}>
                    <Text style={styles.formTitle}>Sale Crop Harvest</Text>
                    <Text style={styles.formSubTitle}>Log crop sale revenue for your active fields</Text>

                    <Text style={styles.label}>Select Crop *</Text>
                    <View style={styles.cropSelectorRow}>
                      {farmerCrops.map((crop) => {
                        const isSelected = crop.id === selectedCropId;
                        return (
                          <TouchableOpacity
                            key={crop.id}
                            style={[
                              styles.cropSelectorChip,
                              isSelected && styles.cropSelectorChipActive,
                            ]}
                            onPress={() => handleSelectFarmerCrop(crop.id)}
                          >
                            <Text
                              style={[
                                styles.cropSelectorChipText,
                                isSelected && styles.cropSelectorChipTextActive,
                              ]}
                            >
                              {crop.cropName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.label}>Field / Plot Name</Text>
                    <View style={styles.readOnlyBox}>
                      <Text style={styles.readOnlyText}>📍 {selectedFarmerCrop?.fieldName}</Text>
                    </View>

                    <Text style={styles.label}>Sale Quantity (in {selectedFarmerCrop?.unit}) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`e.g. 50 ${selectedFarmerCrop?.unit}`}
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={saleQuantity}
                      onChangeText={setSaleQuantity}
                    />

                    <Text style={styles.label}>Selling Rate per {selectedFarmerCrop?.unit} (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Rate per ${selectedFarmerCrop?.unit}`}
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={saleRate}
                      onChangeText={setSaleRate}
                    />

                    {Number(saleQuantity) > 0 && Number(saleRate) > 0 ? (
                      <View style={styles.revCalcBox}>
                        <Text style={styles.revCalcTitle}>Calculated Total Sale Value:</Text>
                        <Text style={styles.revCalcValue}>
                          {saleQuantity} {selectedFarmerCrop?.unit} × ₹{saleRate} = ₹
                          {(Number(saleQuantity) * Number(saleRate)).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ) : null}

                    <Text style={styles.label}>Buyer / Trader Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Bathinda Mandi Merchant"
                      placeholderTextColor="#94a3b8"
                      value={buyerName}
                      onChangeText={setBuyerName}
                    />

                    {saleError ? <Text style={styles.errorText}>{saleError}</Text> : null}

                    <View style={styles.formActions}>
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setShowSaleForm(false)}
                      >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.primaryButtonWrap}
                        onPress={onAddSaleRecord}
                      >
                        <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                          <Text style={styles.primaryButtonText}>Save Sale Record</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : recordType === 'EXPENSES' ? (
            /* FARM EXPENSES TAB */
            <>
              <View style={styles.summaryBar}>
                <View>
                  <Text style={styles.totalLabel}>Total Expenses</Text>
                  <Text style={styles.totalValue}>{formatInr(totalSpent)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addSalesCTA, { backgroundColor: '#dc2626' }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setShowExpenseForm(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                  <Text style={styles.addSalesCTAText}>Expense</Text>
                </TouchableOpacity>
              </View>

              {expensesLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator color={theme.primary} size="large" />
                </View>
              ) : (
                <FlatList
                  data={expenses}
                  keyExtractor={(item) => item.id}
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  contentContainerStyle={styles.list}
                  ListEmptyComponent={
                    <View style={styles.center}>
                      <Ionicons name="wallet-outline" size={36} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No expenses recorded yet.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={[styles.card, premiumShadow('#000000', 'sm')]}>
                      <View style={styles.cardIconWrap}>
                        <Ionicons name={getExpenseCategoryIcon(item.category.key)} size={18} color={theme.primary} />
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle}>{item.category.labelEn}</Text>
                        <Text style={styles.cardSubtitle}>
                          {[item.vendorName, new Date(item.expenseDate).toLocaleDateString('en-IN')].filter(Boolean).join(' · ')}
                        </Text>

                        {/* REMARKS DISPLAY BELOW EXPENSE */}
                        {item.notes ? (
                          <View style={styles.remarksBox}>
                            <Text style={styles.remarksText}>📝 Remarks: {item.notes}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.cardAmount}>-{formatInr(Number(item.amount))}</Text>
                    </View>
                  )}
                />
              )}

              {/* Combined Expenses Modal Form */}
              {showExpenseForm && (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
                    <Text style={styles.formTitle}>Add Farm Expense</Text>
                    <Text style={styles.formSubTitle}>Categorized agricultural input & labor expenses</Text>

                    {/* COMBINED ESSENTIAL EXPENSE CATEGORIES SELECTOR */}
                    <Text style={styles.label}>Select Combined Category *</Text>
                    <View style={styles.categoryRow}>
                      {displayCategories.map((c: any) => {
                        const isSelected = categoryId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                            activeOpacity={0.75}
                            onPress={() => {
                              tap();
                              setCategoryId(c.id);
                            }}
                          >
                            <Ionicons
                              name={getExpenseCategoryIcon(c.key || c.icon)}
                              size={14}
                              color={isSelected ? '#fff' : theme.primary}
                            />
                            <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                              {c.labelHi ? `${c.labelHi}` : c.labelEn}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.label}>Expense Amount (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 2500"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />

                    <Text style={styles.label}>Vendor / Trader Name (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Bathinda Kisan Fertilizer Center"
                      placeholderTextColor="#94a3b8"
                      value={vendorName}
                      onChangeText={setVendorName}
                    />

                    {/* REMARKS / NOTES INPUT FIELD */}
                    <Text style={styles.label}>Remarks / Notes (रिमार्क्स / टिप्पणी)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 2 bags DAP fertilizer + 1 bottle pesticide"
                      placeholderTextColor="#94a3b8"
                      value={notes}
                      onChangeText={setNotes}
                    />

                    <Text style={styles.label}>Expense Date *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={expenseDate}
                      onChangeText={setExpenseDate}
                    />

                    {expenseError ? <Text style={styles.errorText}>{expenseError}</Text> : null}

                    <View style={styles.formActions}>
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => {
                          setShowExpenseForm(false);
                          setExpenseError(null);
                        }}
                      >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.primaryButtonWrap}
                        onPress={onAddExpense}
                        disabled={createExpense.isPending}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                          {createExpense.isPending ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.primaryButtonText}>Save Expense</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </KeyboardAvoidingView>
              )}
            </>
          ) : (
            /* ANALYSIS TAB */
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Crop-wise Income vs Expense</Text>
              <Text style={styles.analysisHint}>
                Expenses farm-wide log hote hain, isliye har active crop ko total expense ka barabar hissa diya gaya hai.
              </Text>

              {cropAnalysis.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="bar-chart-outline" size={36} color="#cbd5e1" />
                  <Text style={styles.emptyText}>Koi active crop nahi mila.</Text>
                </View>
              ) : (
                cropAnalysis.map((c) => {
                  const isProfit = c.net >= 0;
                  return (
                    <View key={c.cropName} style={[styles.analysisCard, premiumShadow('#000000', 'sm')]}>
                      <View style={styles.analysisCardHeader}>
                        <Text style={styles.analysisCropName}>{c.cropName}</Text>
                        <Text style={[styles.analysisNet, { color: isProfit ? '#16a34a' : '#dc2626' }]}>
                          {isProfit ? '▲' : '▼'} {formatInr(Math.abs(c.net))} {isProfit ? 'Profit' : 'Loss'}
                        </Text>
                      </View>

                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>Income</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${(c.income / maxCropValue) * 100}%`, backgroundColor: '#16a34a' }]} />
                        </View>
                        <Text style={styles.barValue}>{formatInr(c.income)}</Text>
                      </View>

                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>Expense</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${(c.expense / maxCropValue) * 100}%`, backgroundColor: '#dc2626' }]} />
                        </View>
                        <Text style={styles.barValue}>{formatInr(c.expense)}</Text>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Overall Summary */}
              <View
                style={[
                  styles.overallCard,
                  premiumShadow('#000000', 'md'),
                  { borderColor: overallNet >= 0 ? '#bbf7d0' : '#fecaca' },
                ]}
              >
                <Text style={styles.sectionTitle}>Overall Farm Summary</Text>

                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>Income</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(totalSalesRevenue / maxOverallValue) * 100}%`, backgroundColor: '#16a34a' }]} />
                  </View>
                  <Text style={styles.barValue}>{formatInr(totalSalesRevenue)}</Text>
                </View>

                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>Expense</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(totalSpent / maxOverallValue) * 100}%`, backgroundColor: '#dc2626' }]} />
                  </View>
                  <Text style={styles.barValue}>{formatInr(totalSpent)}</Text>
                </View>

                <View
                  style={[
                    styles.overallNetBox,
                    { backgroundColor: overallNet >= 0 ? '#f0fdf4' : '#fef2f2' },
                  ]}
                >
                  <Ionicons
                    name={overallNet >= 0 ? 'trending-up' : 'trending-down'}
                    size={20}
                    color={overallNet >= 0 ? '#16a34a' : '#dc2626'}
                  />
                  <Text style={[styles.overallNetText, { color: overallNet >= 0 ? '#16a34a' : '#dc2626' }]}>
                    {overallNet >= 0 ? 'Overall Profit: ' : 'Overall Loss: '}
                    {formatInr(Math.abs(overallNet))}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 18, paddingBottom: 14, paddingHorizontal: SPACING.lg },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontFamily: FONT.medium, marginTop: 2 },
  tabRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabBtnActive: { backgroundColor: '#ffffff' },
  tabBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },
  tabBtnTextActive: { color: theme.primary },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  totalLabel: { color: '#64748b', fontSize: 12, fontFamily: FONT.medium },
  salesValue: { color: '#16a34a', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.5 },
  totalValue: { color: '#dc2626', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.5 },
  addSalesCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  addSalesCTAText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  list: { padding: SPACING.lg, gap: SPACING.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 12,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { color: theme.text, fontSize: 14, fontFamily: FONT.bold },
  cardSubtitle: { color: theme.textMuted, fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  saleMetaText: { color: '#16a34a', fontSize: 11.5, fontFamily: FONT.bold, marginTop: 3 },
  remarksBox: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  remarksText: { fontSize: 11, fontFamily: FONT.medium, color: '#b45309' },
  salesAmount: { color: '#16a34a', fontSize: 15, fontFamily: FONT.extraBold },
  cardAmount: { color: '#dc2626', fontSize: 15, fontFamily: FONT.extraBold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 6 },
  emptyText: { color: theme.text, fontSize: 15, fontFamily: FONT.bold },
  emptySub: { color: theme.textMuted, fontSize: 12.5, fontFamily: FONT.medium, textAlign: 'center' },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  analysisHint: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 4, marginBottom: 14 },
  analysisCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 10,
  },
  analysisCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  analysisCropName: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  analysisNet: { fontSize: 12.5, fontFamily: FONT.extraBold },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  barLabel: { width: 52, fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 74, textAlign: 'right', fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' },
  overallCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: 8,
    borderWidth: 1.5,
  },
  overallNetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 14,
  },
  overallNetText: { fontSize: 15, fontFamily: FONT.extraBold },
  form: {
    maxHeight: 460,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...premiumShadow('#000000', 'lg'),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 100,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 32,
    ...premiumShadow('#000000', 'lg'),
  },
  formTitle: { fontSize: 17, fontFamily: FONT.extraBold, color: theme.text },
  formSubTitle: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginBottom: 10 },
  label: { fontSize: 12, fontFamily: FONT.bold, color: theme.text, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: theme.text,
    backgroundColor: '#f8fafc',
    fontFamily: FONT.medium,
  },
  cropSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  cropSelectorChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cropSelectorChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  cropSelectorChipText: { fontSize: 12, fontFamily: FONT.medium, color: '#475569' },
  cropSelectorChipTextActive: { color: '#ffffff', fontFamily: FONT.bold },
  readOnlyBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  readOnlyText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#334155' },
  revCalcBox: {
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  revCalcTitle: { fontSize: 11.5, fontFamily: FONT.bold, color: '#b45309' },
  revCalcValue: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#92400e', marginTop: 2 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  categoryChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  categoryChipText: { fontSize: 11.5, fontFamily: FONT.medium, color: theme.text },
  categoryChipTextActive: { color: '#fff', fontFamily: FONT.bold },
  errorText: { color: '#dc2626', fontSize: 12, fontFamily: FONT.bold, marginTop: 8 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: theme.text, fontFamily: FONT.semiBold, fontSize: 13.5 },
  primaryButtonWrap: { flex: 1.5, borderRadius: RADIUS.md, ...premiumShadow(theme.primary, 'sm') },
  primaryButton: { borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontFamily: FONT.bold, fontSize: 13.5 },
});
