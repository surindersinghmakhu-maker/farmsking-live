import React, { useEffect, useMemo, useState } from 'react';
// Updated Records Screen with Sales tab label & syntax fix
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { useAuth } from '@/src/store/auth-context';
import { useFarms } from '@/src/hooks/useFarms';
import { usePlotsForFarm } from '@/src/hooks/usePlots';
import { useCreateExpense, useExpenseCategories, useExpensesForFarm } from '@/src/hooks/useExpenses';
import { useCrops } from '@/src/store/crops-context';
import { useMyCrops } from '@/src/hooks/useCrops';
import { useParties, useCreateParty, usePartyStatement, useRecordSaleLedger, useRecordPaymentReceived, useRecordPaymentMade } from '@/src/hooks/useParties';
import { useCreateSaleBill, useFetchSaleBill, useMySaleBillCount } from '@/src/hooks/useSaleBills';
import { useFetchPaymentReceipt, useMyPaymentReceiptCount } from '@/src/hooks/usePaymentReceipts';
import { useFarmerPlan } from '@/src/hooks/useFarmerPlan';
import { PartyPicker } from '@/src/components/PartyPicker';
import {
  BillPreview,
  PaymentReceiptPreview,
  useShareBillAsJpg,
  type SaleCartItem,
  type SavedSaleInvoice,
  type PaymentReceiptData,
} from '@/src/components/SaleBillPreview';
import { Party } from '@/src/types/api';
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
  const { user } = useAuth();
  const [recordType, setRecordType] = useState<'EXPENSES' | 'SALES' | 'OVERVIEW' | 'ANALYSIS'>('OVERVIEW');

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
  const [expenseCropId, setExpenseCropId] = useState<string | undefined>(undefined);
  const { data: myRealCrops } = useMyCrops();
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [plotId, setPlotId] = useState<string | undefined>(undefined);
  const [expensePaymentMode, setExpensePaymentMode] = useState<'CASH' | 'CREDIT'>('CASH');
  const [expenseParty, setExpenseParty] = useState<Party | null>(null);
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

  // Sales list view mode — All / Crop-wise / Buyer-wise
  const [salesViewMode, setSalesViewMode] = useState<'ALL' | 'CROP' | 'BUYER'>('ALL');
  const [expandedSalesGroup, setExpandedSalesGroup] = useState<string | null>(null);
  const [expenseViewMode, setExpenseViewMode] = useState<'ALL' | 'CROP' | 'VENDOR'>('ALL');
  const [expandedExpenseGroup, setExpandedExpenseGroup] = useState<string | null>(null);

  // Sales Form state
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleStep, setSaleStep] = useState<'FORM' | 'SAVED'>('FORM');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'PARTY'>('CASH');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [cashBuyerName, setCashBuyerName] = useState('');
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [saleQuantity, setSaleQuantity] = useState('');
  const [saleRate, setSaleRate] = useState('');
  const [saleItems, setSaleItems] = useState<SaleCartItem[]>([]);
  const [amountReceived, setAmountReceived] = useState('');
  const [amountReceivedMode, setAmountReceivedMode] = useState<'CASH' | 'UPI'>('CASH');
  const [saleError, setSaleError] = useState<string | null>(null);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<SavedSaleInvoice | null>(null);

  const { data: parties = [] } = useParties();
  const createParty = useCreateParty();
  const recordSaleLedger = useRecordSaleLedger();
  const createSaleBill = useCreateSaleBill();
  const fetchSaleBill = useFetchSaleBill();
  const fetchPaymentReceipt = useFetchPaymentReceipt();

  // Bill preview (re-share from Sales list) + JPG capture/share
  const { billShotRef, isSharingBill, shareInvoiceAsJpg: shareInvoiceAsJpgRaw } = useShareBillAsJpg();
  const [billPreviewInvoice, setBillPreviewInvoice] = useState<SavedSaleInvoice | null>(null);
  const [billPreviewVisible, setBillPreviewVisible] = useState(false);
  const [isLoadingBillPreview, setIsLoadingBillPreview] = useState(false);

  // FREE plan share limits — 50 bills + 50 receipts, then prompt to upgrade.
  const FREE_SHARE_LIMIT = 50;
  const { plan } = useFarmerPlan();
  const isFreePlan = plan === 'FREE';
  const { data: billCountData } = useMySaleBillCount();
  const { data: receiptCountData } = useMyPaymentReceiptCount();

  const showUpgradePrompt = (kind: 'bill' | 'receipt') => {
    const message =
      kind === 'bill'
        ? `Free plan par sirf ${FREE_SHARE_LIMIT} sale bill share ho sakde han. Zyada share karan layi apna plan upgrade karo.`
        : `Free plan par sirf ${FREE_SHARE_LIMIT} payment receipt share ho sakde han. Zyada share karan layi apna plan upgrade karo.`;
    if (Platform.OS === 'web') {
      alert(`🔒 Upgrade Your Plan\n\n${message}`);
    } else {
      Alert.alert('🔒 Upgrade Your Plan', message);
    }
  };

  const shareInvoiceAsJpg = async (fileName: string | undefined, kind: 'bill' | 'receipt') => {
    if (isFreePlan) {
      const count = kind === 'bill' ? billCountData?.count ?? 0 : receiptCountData?.count ?? 0;
      if (count >= FREE_SHARE_LIMIT) {
        showUpgradePrompt(kind);
        return;
      }
    }
    await shareInvoiceAsJpgRaw(fileName);
  };

  const loadBillPreviewById = async (billId: string): Promise<boolean> => {
    setIsLoadingBillPreview(true);
    try {
      const bill = await fetchSaleBill.mutateAsync(billId);
      setBillPreviewInvoice({
        billNo: bill.billNo,
        farmerName: bill.farmerName,
        partyId: bill.partyId,
        partyName: bill.partyName,
        isCash: bill.isCash,
        items: bill.items.map((i, idx) => ({ id: String(idx), ...i })),
        totalItems: bill.totalItems,
        totalAmount: bill.totalAmount,
        amountReceived: bill.amountReceived,
        thisSaleBalance: bill.thisSaleBalance,
        previousBalance: bill.previousBalance,
        netReceivable: bill.netReceivable,
        date: new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      setBillPreviewVisible(true);
      return true;
    } catch {
      Alert.alert('Bill Not Found', 'Could not load the saved bill for this sale.');
      return false;
    } finally {
      setIsLoadingBillPreview(false);
    }
  };

  const openBillPreviewForSale = async (sale: { billId?: string; cropName: string; quantity: string; unit: string; pricePerUnit: string; totalAmount: number; buyerName: string; saleDate: string }) => {
    tap();
    if (sale.billId) {
      await loadBillPreviewById(sale.billId);
      return;
    }

    // Legacy sale with no linked bill — reconstruct a minimal single-item preview.
    const isCash = sale.buyerName === 'Cash Sale';
    setBillPreviewInvoice({
      billNo: `FK-${sale.saleDate.replace(/-/g, '')}`,
      farmerName: user?.name || 'Farmer',
      partyName: isCash ? 'Cash' : sale.buyerName,
      isCash,
      items: [{ id: '0', cropId: '', cropName: sale.cropName, unit: sale.unit, qty: Number(sale.quantity), rate: Number(sale.pricePerUnit), amount: sale.totalAmount }],
      totalItems: 1,
      totalAmount: sale.totalAmount,
      amountReceived: sale.totalAmount,
      thisSaleBalance: 0,
      previousBalance: 0,
      netReceivable: 0,
      date: sale.saleDate,
      time: '',
    });
    setBillPreviewVisible(true);
  };

  // Analysis tab — Receivable / Payable sub-tabs + party statement
  const [analysisSubTab, setAnalysisSubTab] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [statementPartyId, setStatementPartyId] = useState<string | null>(null);
  const { data: statement, isLoading: isLoadingStatement } = usePartyStatement(statementPartyId ?? undefined);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const recordPaymentReceived = useRecordPaymentReceived();
  const recordPaymentMade = useRecordPaymentMade();
  const [paymentReceiptData, setPaymentReceiptData] = useState<PaymentReceiptData | null>(null);
  const [paymentReceiptVisible, setPaymentReceiptVisible] = useState(false);

  const closeStatementModal = () => {
    setStatementPartyId(null);
    setIsPaymentFormOpen(false);
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentError(null);
  };

  const handleRecordPayment = async () => {
    setPaymentError(null);
    const value = Number(paymentAmount);
    if (!value || value <= 0) {
      setPaymentError('Enter a valid amount.');
      return;
    }
    if (!statementPartyId || !statement) return;
    try {
      const isReceived = statement.balance >= 0;
      const mutation = isReceived ? recordPaymentReceived : recordPaymentMade;
      const result = await mutation.mutateAsync({ id: statementPartyId, payload: { amount: value, reason: paymentNote.trim() || undefined } });
      const now = new Date();
      setPaymentReceiptData({
        receiptNo: result.receiptNo,
        receiverName: user?.name || 'Farmer',
        partyName: statement.party.name,
        isReceived,
        previousBalance: statement.balance,
        paymentAmount: value,
        netBalance: result.balance,
        date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      setPaymentReceiptVisible(true);
      setIsPaymentFormOpen(false);
      setPaymentAmount('');
      setPaymentNote('');
    } catch (err: any) {
      setPaymentError(err?.response?.data?.message ?? 'Could not record payment.');
    }
  };

  const LEDGER_SIGN: Record<string, 1 | -1> = { SALE_CREDIT: 1, SALE_PAYMENT: -1, EXPENSE_CREDIT: -1, EXPENSE_PAYMENT: 1 };
  const entryRunningBalance = useMemo(() => {
    const map = new Map<string, { before: number; after: number }>();
    if (!statement) return map;
    const chronological = [...statement.entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let running = 0;
    chronological.forEach((e) => {
      const before = running;
      const after = before + LEDGER_SIGN[e.type] * Number(e.amount);
      map.set(e.id, { before, after });
      running = after;
    });
    return map;
  }, [statement]);

  const shareStatementSaleEntry = async (entry: { id: string; reason: string; amount: string; createdAt: string; saleBillId?: string | null }) => {
    if (!statement) return;
    tap();
    if (entry.saleBillId) {
      await loadBillPreviewById(entry.saleBillId);
      return;
    }

    // Older entry recorded before bill-linking was added — reconstruct a best-effort single-line preview.
    const now = new Date(entry.createdAt);
    setBillPreviewInvoice({
      billNo: `FK-${entry.id.slice(0, 8).toUpperCase()}`,
      farmerName: user?.name || 'Farmer',
      partyId: statement.party.id,
      partyName: statement.party.name,
      isCash: false,
      items: [{ id: entry.id, cropId: '', cropName: entry.reason || 'Sale', unit: '', qty: 1, rate: Number(entry.amount), amount: Number(entry.amount) }],
      totalItems: 1,
      totalAmount: Number(entry.amount),
      amountReceived: 0,
      thisSaleBalance: Number(entry.amount),
      previousBalance: entryRunningBalance.get(entry.id)?.before ?? 0,
      netReceivable: entryRunningBalance.get(entry.id)?.after ?? 0,
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
    setBillPreviewVisible(true);
  };

  const shareStatementPaymentEntry = async (entry: { id: string; type: string; amount: string; createdAt: string; paymentReceiptId?: string | null }) => {
    if (!statement) return;
    tap();
    if (entry.paymentReceiptId) {
      setIsLoadingBillPreview(true);
      try {
        const receipt = await fetchPaymentReceipt.mutateAsync(entry.paymentReceiptId);
        const created = new Date(receipt.createdAt);
        setPaymentReceiptData({
          receiptNo: receipt.receiptNo,
          receiverName: user?.name || 'Farmer',
          partyName: receipt.partyName,
          isReceived: receipt.isReceived,
          previousBalance: Number(receipt.previousBalance),
          paymentAmount: Number(receipt.paymentAmount),
          netBalance: Number(receipt.netBalance),
          date: created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        });
        setPaymentReceiptVisible(true);
      } catch {
        Alert.alert('Receipt Not Found', 'Could not load the saved receipt for this payment.');
      } finally {
        setIsLoadingBillPreview(false);
      }
      return;
    }

    // Older entry recorded before receipt-linking was added — reconstruct from the running ledger balance.
    const now = new Date(entry.createdAt);
    const running = entryRunningBalance.get(entry.id);
    setPaymentReceiptData({
      receiptNo: `RCT-${entry.id.slice(0, 8).toUpperCase()}`,
      receiverName: user?.name || 'Farmer',
      partyName: statement.party.name,
      isReceived: entry.type === 'SALE_PAYMENT',
      previousBalance: running?.before ?? 0,
      paymentAmount: Number(entry.amount),
      netBalance: running?.after ?? 0,
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
    setPaymentReceiptVisible(true);
  };

  const receivableParties = useMemo(
    () => parties.filter((p) => p.balance > 0).sort((a, b) => b.balance - a.balance),
    [parties],
  );
  const payableParties = useMemo(
    () => parties.filter((p) => p.balance < 0).sort((a, b) => a.balance - b.balance),
    [parties],
  );
  const totalReceivable = useMemo(() => receivableParties.reduce((sum, p) => sum + p.balance, 0), [receivableParties]);
  const totalPayable = useMemo(() => payableParties.reduce((sum, p) => sum + Math.abs(p.balance), 0), [payableParties]);
  const { data: partyStatement } = usePartyStatement(paymentMode === 'PARTY' ? selectedParty?.id : undefined);
  const previousPartyBalance = partyStatement?.balance ?? 0;

  // Keep the selected crop valid as the active crop list changes (e.g. a crop completes elsewhere)
  useEffect(() => {
    if (farmerCrops.length === 0) return;
    if (!farmerCrops.some((c) => c.id === selectedCropId)) {
      setSelectedCropId(farmerCrops[0].id);
      setSaleRate(farmerCrops[0].pricePerUnit);
    }
  }, [farmerCrops, selectedCropId]);

  const totalCartItems = saleItems.length;
  const totalCartAmount = useMemo(() => saleItems.reduce((sum, i) => sum + i.amount, 0), [saleItems]);
  const effectiveAmountReceived = paymentMode === 'CASH' ? totalCartAmount : Number(amountReceived) || 0;
  const thisSaleBalance = totalCartAmount - effectiveAmountReceived;
  const netReceivable = previousPartyBalance + thisSaleBalance;

  const totalSpent = useMemo(
    () => (expenses ?? []).reduce((acc, curr) => acc + Number(curr.amount), 0),
    [expenses]
  );

  /** Expenses grouped by crop or by vendor, each group sorted by highest total first. */
  const groupExpenses = (key: 'crop' | 'vendor') => {
    const expenseList = expenses ?? [];
    const groups = new Map<string, typeof expenseList>();
    expenseList.forEach((e) => {
      const groupKey = key === 'crop' ? e.cropCycle?.cropName || 'No Crop' : e.vendorName?.trim() || 'Unknown Vendor';
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(e);
    });
    return Array.from(groups.entries())
      .map(([name, entries]) => ({ name, entries, total: entries.reduce((sum, e) => sum + Number(e.amount), 0) }))
      .sort((a, b) => b.total - a.total);
  };
  const expensesByCrop = useMemo(() => groupExpenses('crop'), [expenses]);
  const expensesByVendor = useMemo(() => groupExpenses('vendor'), [expenses]);

  const totalSalesRevenue = useMemo(
    () => salesRecords.reduce((acc, curr) => acc + curr.totalAmount, 0),
    [salesRecords]
  );

  /** Sales grouped by crop or by buyer, each group sorted by most recent sale first. */
  const groupSales = (key: 'cropName' | 'buyerName') => {
    const groups = new Map<string, typeof salesRecords>();
    salesRecords.forEach((s) => {
      const groupKey = s[key] || 'Unknown';
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(s);
    });
    return Array.from(groups.entries())
      .map(([name, entries]) => ({ name, entries, total: entries.reduce((sum, e) => sum + e.totalAmount, 0) }))
      .sort((a, b) => b.total - a.total);
  };
  const salesByCrop = useMemo(() => groupSales('cropName'), [salesRecords]);
  const salesByBuyer = useMemo(() => groupSales('buyerName'), [salesRecords]);

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

  const resetSaleForm = () => {
    setSaleStep('FORM');
    setPaymentMode('CASH');
    setSelectedParty(null);
    setCashBuyerName('');
    setSaleQuantity('');
    setAmountReceived('');
    setAmountReceivedMode('CASH');
    setSaleItems([]);
    setSaleError(null);
    setSavedInvoice(null);
  };

  const onAddProductToCart = () => {
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
    setSaleItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        cropId: selectedFarmerCrop.id,
        cropName: selectedFarmerCrop.cropName,
        unit: selectedFarmerCrop.unit,
        qty,
        rate,
        amount: qty * rate,
      },
    ]);
    setSaleQuantity('');
  };

  const onRemoveCartItem = (id: string) => {
    tap();
    setSaleItems((prev) => prev.filter((i) => i.id !== id));
  };

  const onSaveSale = async () => {
    setSaleError(null);
    if (saleItems.length === 0) {
      setSaleError('⚠️ Kripya kam se kam ek product "Add Product" se list mein add karein.');
      return;
    }
    if (paymentMode === 'PARTY' && !selectedParty) {
      setSaleError('⚠️ Kripya party select karein ya Cash chunein.');
      return;
    }

    tap();
    setIsSavingSale(true);
    const cashName = cashBuyerName.trim();
    const buyerName = paymentMode === 'PARTY' && selectedParty ? selectedParty.name : cashName || 'Cash Sale';

    try {
      const billPayload = {
        farmerName: user?.name || 'Farmer',
        partyId: paymentMode === 'PARTY' ? selectedParty?.id : undefined,
        partyName: paymentMode === 'PARTY' && selectedParty ? selectedParty.name : cashName || 'Cash',
        partyMobile: paymentMode === 'PARTY' ? selectedParty?.mobile ?? undefined : undefined,
        isCash: paymentMode === 'CASH',
        items: saleItems.map((i) => ({ cropId: i.cropId, cropName: i.cropName, unit: i.unit, qty: i.qty, rate: i.rate, amount: i.amount })),
        totalItems: totalCartItems,
        totalAmount: totalCartAmount,
        amountReceived: effectiveAmountReceived,
        thisSaleBalance,
        previousBalance: previousPartyBalance,
        netReceivable: paymentMode === 'PARTY' ? previousPartyBalance + thisSaleBalance : 0,
      };

      // Save the bill snapshot FIRST so its id can be linked onto the ledger entry below — this is what
      // lets "Share Bill" from the Party Statement re-open the real saved bill instead of a reconstruction.
      let billNo = `FK-${Date.now().toString().slice(-8)}`;
      let billId: string | undefined;
      try {
        const savedBill = await createSaleBill.mutateAsync(billPayload);
        billNo = savedBill.billNo;
        billId = savedBill.id;
      } catch {
        // Bill snapshot storage is best-effort — the sale/ledger entry below still saves successfully.
      }

      if (paymentMode === 'PARTY' && selectedParty) {
        const reason = `Sale: ${saleItems.map((i) => i.cropName).join(', ')} (${totalCartItems} item${totalCartItems > 1 ? 's' : ''})`;
        await recordSaleLedger.mutateAsync({
          id: selectedParty.id,
          payload: { totalAmount: totalCartAmount, amountReceived: effectiveAmountReceived, reason, saleBillId: billId },
        });
      }

      saleItems.forEach((item) => {
        recordSale(item.cropId, { quantity: String(item.qty), rate: String(item.rate), buyerName, billId }).catch(() => {});
      });

      const now = new Date();
      const invoice: SavedSaleInvoice = {
        billNo,
        farmerName: billPayload.farmerName,
        partyId: billPayload.partyId,
        partyName: billPayload.partyName,
        partyMobile: billPayload.partyMobile,
        isCash: billPayload.isCash,
        items: saleItems,
        totalItems: billPayload.totalItems,
        totalAmount: billPayload.totalAmount,
        amountReceived: billPayload.amountReceived,
        thisSaleBalance: billPayload.thisSaleBalance,
        previousBalance: billPayload.previousBalance,
        netReceivable: billPayload.netReceivable,
        date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setSavedInvoice(invoice);
      setSaleStep('SAVED');
    } catch {
      setSaleError('Failed to save sale. Please try again.');
    } finally {
      setIsSavingSale(false);
    }
  };

  const resetExpenseForm = () => {
    setCategoryId(displayCategories[0].id);
    setExpenseCropId(undefined);
    setAmount('');
    setExpenseDate(todayIso());
    setPlotId(undefined);
    setExpensePaymentMode('CASH');
    setExpenseParty(null);
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
    if (expensePaymentMode === 'CREDIT' && !expenseParty) {
      setExpenseError('⚠️ Kripya party select karein ya Cash chunein.');
      return;
    }

    try {
      await createExpense.mutateAsync({
        farmId: selectedFarmId,
        categoryId: activeCatId,
        cropCycleId: expenseCropId,
        amount: amountNum,
        expenseDate,
        plotId,
        paymentMode: expensePaymentMode,
        partyId: expensePaymentMode === 'CREDIT' ? expenseParty?.id : undefined,
        vendorName: expensePaymentMode === 'CREDIT' ? expenseParty?.name : vendorName.trim() || undefined,
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
        <Text style={styles.heroTitle}>Accounts</Text>
        <Text style={styles.heroSubtitle}>Track sales revenue & combined farm expenses</Text>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, recordType === 'OVERVIEW' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setRecordType('OVERVIEW');
            }}
          >
            <Ionicons name="bar-chart" size={15} color={recordType === 'OVERVIEW' ? theme.primary : '#fff'} />
            <Text style={[styles.tabBtnText, recordType === 'OVERVIEW' && styles.tabBtnTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>

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
              Sales
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
              Expenses
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
              Payments
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
                    resetSaleForm();
                    setShowSaleForm(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                  <Text style={styles.addSalesCTAText}>Sale</Text>
                </TouchableOpacity>
              </View>

              {/* Sales List view mode */}
              <View style={styles.salesViewModeRow}>
                {(['ALL', 'CROP', 'BUYER'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.salesViewModeChip, salesViewMode === mode && styles.salesViewModeChipActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setSalesViewMode(mode);
                      setExpandedSalesGroup(null);
                    }}
                  >
                    <Text style={[styles.salesViewModeChipText, salesViewMode === mode && styles.salesViewModeChipTextActive]}>
                      {mode === 'ALL' ? 'All' : mode === 'CROP' ? 'Crop-wise' : 'Buyer-wise'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {salesRecords.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="cart-outline" size={36} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No sales recorded yet.</Text>
                  <Text style={styles.emptySub}>Tap "+ Sale" to log revenue from your harvested crops.</Text>
                </View>
              ) : salesViewMode === 'ALL' ? (
                <FlatList
                  data={salesRecords}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.list}
                  renderItem={({ item }) => (
                    <View style={styles.compactSaleRow}>
                      <Ionicons name="trending-up" size={14} color="#16a34a" />
                      <View style={styles.compactSaleBody}>
                        <Text style={styles.compactSaleTitle} numberOfLines={1}>
                          {item.cropName} · {item.buyerName}
                        </Text>
                        <Text style={styles.compactSaleMeta} numberOfLines={1}>
                          {item.quantity} {item.unit} @ ₹{item.pricePerUnit} · {item.saleDate}
                        </Text>
                      </View>
                      <Text style={styles.compactSaleAmount}>+{formatInr(item.totalAmount)}</Text>
                      <TouchableOpacity style={styles.shareBillIconBtn} onPress={() => openBillPreviewForSale(item)}>
                        <Ionicons name="share-social-outline" size={15} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                  {(salesViewMode === 'CROP' ? salesByCrop : salesByBuyer).map((group) => {
                    const isExpanded = expandedSalesGroup === group.name;
                    return (
                      <View key={group.name} style={styles.salesGroupBlock}>
                        <TouchableOpacity
                          style={styles.salesGroupHeader}
                          activeOpacity={0.7}
                          onPress={() => {
                            tap();
                            setExpandedSalesGroup((cur) => (cur === group.name ? null : group.name));
                          }}
                        >
                          <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={14} color="#64748b" />
                          <Text style={styles.salesGroupName} numberOfLines={1}>
                            {group.name} <Text style={styles.salesGroupCount}>({group.entries.length})</Text>
                          </Text>
                          <Text style={styles.salesGroupTotal}>{formatInr(group.total)}</Text>
                        </TouchableOpacity>
                        {isExpanded
                          ? group.entries.map((item) => (
                              <View key={item.id} style={styles.compactSaleRow}>
                                <Ionicons name="trending-up" size={14} color="#16a34a" />
                                <View style={styles.compactSaleBody}>
                                  <Text style={styles.compactSaleTitle} numberOfLines={1}>
                                    {salesViewMode === 'CROP' ? item.buyerName : item.cropName}
                                  </Text>
                                  <Text style={styles.compactSaleMeta} numberOfLines={1}>
                                    {item.quantity} {item.unit} @ ₹{item.pricePerUnit} · {item.saleDate}
                                  </Text>
                                </View>
                                <Text style={styles.compactSaleAmount}>+{formatInr(item.totalAmount)}</Text>
                                <TouchableOpacity style={styles.shareBillIconBtn} onPress={() => openBillPreviewForSale(item)}>
                                  <Ionicons name="share-social-outline" size={15} color="#16a34a" />
                                </TouchableOpacity>
                              </View>
                            ))
                          : null}
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* Sale Form Modal */}
              <Modal visible={showSaleForm} transparent animationType="slide" onRequestClose={() => setShowSaleForm(false)}>
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalCard, { maxHeight: '92%' }]}>
                    {saleStep === 'FORM' ? (
                      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <Text style={styles.formTitle}>New Sale</Text>
                        <Text style={styles.formSubTitle}>Log a crop sale — cash or on-account to a party</Text>

                        {/* Payment Mode */}
                        <Text style={styles.label}>Payment Mode</Text>
                        <View style={styles.paymentModeRow}>
                          <TouchableOpacity
                            style={[styles.paymentModeChip, paymentMode === 'CASH' && styles.paymentModeChipActive]}
                            onPress={() => {
                              tap();
                              setPaymentMode('CASH');
                              setSelectedParty(null);
                            }}
                          >
                            <Ionicons name="cash-outline" size={14} color={paymentMode === 'CASH' ? '#fff' : '#475569'} />
                            <Text style={[styles.paymentModeChipText, paymentMode === 'CASH' && styles.paymentModeChipTextActive]}>Cash</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.paymentModeChip, paymentMode === 'PARTY' && styles.paymentModeChipActive]}
                            onPress={() => {
                              tap();
                              setPaymentMode('PARTY');
                            }}
                          >
                            <Ionicons name="people-outline" size={14} color={paymentMode === 'PARTY' ? '#fff' : '#475569'} />
                            <Text style={[styles.paymentModeChipText, paymentMode === 'PARTY' && styles.paymentModeChipTextActive]}>Party / Credit</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Buyer / Trader — top of form, only when Party mode */}
                        {paymentMode === 'PARTY' ? (
                          <View style={{ marginTop: 10 }}>
                            <PartyPicker
                              parties={parties}
                              selectedParty={selectedParty}
                              onSelect={setSelectedParty}
                              onCreate={async (payload) => createParty.mutateAsync(payload)}
                              accentColor="#16a34a"
                            />
                          </View>
                        ) : (
                          <View style={{ marginTop: 10 }}>
                            <Text style={styles.label}>Buyer Name (Optional)</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="e.g. Local Buyer"
                              placeholderTextColor="#94a3b8"
                              value={cashBuyerName}
                              onChangeText={setCashBuyerName}
                            />
                          </View>
                        )}

                        {/* Item entry */}
                        <Text style={[styles.label, { marginTop: 14 }]}>Select Crop *</Text>
                        <View style={styles.cropSelectorRow}>
                          {farmerCrops.map((crop) => {
                            const isSelected = crop.id === selectedCropId;
                            return (
                              <TouchableOpacity
                                key={crop.id}
                                style={[styles.cropSelectorChip, isSelected && styles.cropSelectorChipActive]}
                                onPress={() => handleSelectFarmerCrop(crop.id)}
                              >
                                <Text style={[styles.cropSelectorChipText, isSelected && styles.cropSelectorChipTextActive]}>
                                  {crop.cropName}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
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

                        <TouchableOpacity style={styles.addProductBtn} activeOpacity={0.85} onPress={onAddProductToCart}>
                          <Ionicons name="add-circle-outline" size={16} color="#ffffff" />
                          <Text style={styles.addProductBtnText}>Add Product</Text>
                        </TouchableOpacity>

                        {/* Cart table */}
                        {saleItems.length > 0 && (
                          <View style={styles.cartTable}>
                            <View style={styles.cartHeaderRow}>
                              <Text style={[styles.cartHeaderCell, { flex: 1.6 }]}>Crop</Text>
                              <Text style={styles.cartHeaderCell}>Qty</Text>
                              <Text style={styles.cartHeaderCell}>Rate</Text>
                              <Text style={styles.cartHeaderCell}>Amount</Text>
                              <View style={{ width: 22 }} />
                            </View>
                            {saleItems.map((item) => (
                              <View key={item.id} style={styles.cartRow}>
                                <Text style={[styles.cartCell, { flex: 1.6, fontFamily: FONT.bold }]}>{item.cropName}</Text>
                                <Text style={styles.cartCell}>{item.qty}</Text>
                                <Text style={styles.cartCell}>₹{item.rate}</Text>
                                <Text style={styles.cartCell}>₹{item.amount.toLocaleString('en-IN')}</Text>
                                <TouchableOpacity onPress={() => onRemoveCartItem(item.id)} style={{ width: 22, alignItems: 'center' }}>
                                  <Ionicons name="close-circle" size={16} color="#dc2626" />
                                </TouchableOpacity>
                              </View>
                            ))}
                            <View style={styles.cartTotalsRow}>
                              <Text style={styles.cartTotalsLabel}>Total Items: {totalCartItems}</Text>
                              <Text style={styles.cartTotalsValue}>Total: {formatInr(totalCartAmount)}</Text>
                            </View>
                          </View>
                        )}

                        {/* Party ledger fields */}
                        {paymentMode === 'PARTY' && saleItems.length > 0 && (
                          <View style={{ marginTop: 12 }}>
                            <View style={styles.ledgerSummaryBox}>
                              <View style={styles.ledgerRow}>
                                <Text style={styles.ledgerLabel}>Balance (This Sale)</Text>
                                <Text style={styles.ledgerValue}>{formatInr(thisSaleBalance)}</Text>
                              </View>
                              <View style={styles.ledgerRow}>
                                <Text style={styles.ledgerLabel}>Previous Balance</Text>
                                <Text style={styles.ledgerValue}>{formatInr(previousPartyBalance)}</Text>
                              </View>
                              <View style={[styles.ledgerRow, { borderTopWidth: 1, borderTopColor: '#fde68a', paddingTop: 6, marginTop: 2 }]}>
                                <Text style={styles.ledgerLabelBold}>Net Receivable</Text>
                                <Text style={styles.ledgerValueBold}>{formatInr(netReceivable)}</Text>
                              </View>
                            </View>

                            <Text style={styles.label}>Amount Received (₹)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <TextInput
                                style={[styles.input, { flex: 0.6 }]}
                                placeholder="e.g. 5000"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                value={amountReceived}
                                onChangeText={setAmountReceived}
                              />
                              <TouchableOpacity
                                style={[styles.paymentModeChip, { flex: 1 }, amountReceivedMode === 'CASH' && styles.paymentModeChipActive]}
                                onPress={() => setAmountReceivedMode('CASH')}
                              >
                                <Ionicons name="cash-outline" size={14} color={amountReceivedMode === 'CASH' ? '#fff' : '#475569'} />
                                <Text style={[styles.paymentModeChipText, amountReceivedMode === 'CASH' && styles.paymentModeChipTextActive]}>Cash</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.paymentModeChip, { flex: 1 }, amountReceivedMode === 'UPI' && styles.paymentModeChipActive]}
                                onPress={() => setAmountReceivedMode('UPI')}
                              >
                                <Ionicons name="phone-portrait-outline" size={14} color={amountReceivedMode === 'UPI' ? '#fff' : '#475569'} />
                                <Text style={[styles.paymentModeChipText, amountReceivedMode === 'UPI' && styles.paymentModeChipTextActive]}>UPI</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {saleError ? <Text style={styles.errorText}>{saleError}</Text> : null}

                        <View style={styles.formActions}>
                          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowSaleForm(false)}>
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.primaryButtonWrap} onPress={onSaveSale} disabled={isSavingSale} activeOpacity={0.85}>
                            <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                              {isSavingSale ? (
                                <ActivityIndicator color="#fff" />
                              ) : (
                                <Text style={styles.primaryButtonText}>Save Sale</Text>
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    ) : (
                      /* SAVED confirmation + bill preview */
                      <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                          <Ionicons name="checkmark-circle" size={40} color="#16a34a" />
                          <Text style={styles.savedTitle}>Sale Saved ✅</Text>
                          <Text style={styles.savedSub}>Preview the bill below, then share it as an image.</Text>

                          {savedInvoice && (
                            <View style={{ marginTop: 12 }}>
                              <ViewShot ref={billShotRef} options={{ format: 'jpg', quality: 0.95 }}>
                                <BillPreview inv={savedInvoice} />
                              </ViewShot>
                            </View>
                          )}

                          <View style={[styles.formActions, { width: '100%' }]}>
                            <TouchableOpacity
                              style={styles.primaryButtonWrap}
                              onPress={() => shareInvoiceAsJpg(`Bill-${savedInvoice?.billNo}`, 'bill')}
                              disabled={isSharingBill}
                            >
                              <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                                {isSharingBill ? (
                                  <ActivityIndicator color="#ffffff" />
                                ) : (
                                  <Text style={styles.primaryButtonText}>Share Bill (JPG)</Text>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={{ marginTop: 10, paddingVertical: 8 }}
                            onPress={() => {
                              setShowSaleForm(false);
                              resetSaleForm();
                            }}
                          >
                            <Text style={{ color: '#64748b', fontFamily: FONT.bold, fontSize: 13 }}>Close</Text>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    )}
                  </View>
                </View>
              </Modal>

              {/* Bill Preview Modal — re-share a saved sale's bill from the list */}
              <Modal
                visible={billPreviewVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                  setBillPreviewVisible(false);
                  setBillPreviewInvoice(null);
                }}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalCard, { maxHeight: '92%' }]}>
                    <View style={[styles.modalHeaderRow, { justifyContent: 'space-between' }]}>
                      <Text style={styles.formTitle}>Bill Preview</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setBillPreviewVisible(false);
                          setBillPreviewInvoice(null);
                        }}
                      >
                        <Ionicons name="close" size={20} color="#475569" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {billPreviewInvoice && (
                        <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                          <ViewShot ref={billShotRef} options={{ format: 'jpg', quality: 0.95 }}>
                            <BillPreview inv={billPreviewInvoice} />
                          </ViewShot>
                          <View style={[styles.formActions, { width: '100%' }]}>
                            <TouchableOpacity
                              style={styles.primaryButtonWrap}
                              onPress={() => shareInvoiceAsJpg(`Bill-${billPreviewInvoice?.billNo}`, 'bill')}
                              disabled={isSharingBill}
                            >
                              <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                                {isSharingBill ? (
                                  <ActivityIndicator color="#ffffff" />
                                ) : (
                                  <Text style={styles.primaryButtonText}>Share Bill (JPG)</Text>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
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

              {/* Expense List view mode */}
              <View style={styles.salesViewModeRow}>
                {(['ALL', 'CROP', 'VENDOR'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.salesViewModeChip, expenseViewMode === mode && { backgroundColor: '#dc2626', borderColor: '#dc2626' }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setExpenseViewMode(mode);
                      setExpandedExpenseGroup(null);
                    }}
                  >
                    <Text style={[styles.salesViewModeChipText, expenseViewMode === mode && styles.salesViewModeChipTextActive]}>
                      {mode === 'ALL' ? 'All' : mode === 'CROP' ? 'Crop-wise' : 'Vendor-wise'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {expensesLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator color={theme.primary} size="large" />
                </View>
              ) : !expenses || expenses.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="wallet-outline" size={36} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No expenses recorded yet.</Text>
                </View>
              ) : expenseViewMode === 'ALL' ? (
                <FlatList
                  data={expenses}
                  keyExtractor={(item) => item.id}
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  contentContainerStyle={styles.list}
                  renderItem={({ item }) => (
                    <View style={styles.compactSaleRow}>
                      <Ionicons name={item.cropCycle ? 'leaf-outline' : getExpenseCategoryIcon(item.category.key)} size={14} color="#dc2626" />
                      <View style={styles.compactSaleBody}>
                        <Text style={styles.compactSaleTitle} numberOfLines={1}>
                          {item.cropCycle ? item.cropCycle.cropName : item.category.labelEn}
                          {item.vendorName ? ` · ${item.vendorName}` : ''}
                        </Text>
                        <Text style={styles.compactSaleMeta} numberOfLines={1}>
                          {new Date(item.expenseDate).toLocaleDateString('en-IN')}
                          {item.notes ? ` · ${item.notes}` : ''}
                        </Text>
                      </View>
                      <Text style={[styles.compactSaleAmount, { color: '#dc2626' }]}>-{formatInr(Number(item.amount))}</Text>
                    </View>
                  )}
                />
              ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                  {(expenseViewMode === 'CROP' ? expensesByCrop : expensesByVendor).map((group) => {
                    const isExpanded = expandedExpenseGroup === group.name;
                    return (
                      <View key={group.name} style={styles.salesGroupBlock}>
                        <TouchableOpacity
                          style={styles.salesGroupHeader}
                          activeOpacity={0.7}
                          onPress={() => {
                            tap();
                            setExpandedExpenseGroup((cur) => (cur === group.name ? null : group.name));
                          }}
                        >
                          <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={14} color="#64748b" />
                          <Text style={styles.salesGroupName} numberOfLines={1}>
                            {group.name} <Text style={styles.salesGroupCount}>({group.entries.length})</Text>
                          </Text>
                          <Text style={[styles.salesGroupTotal, { color: '#dc2626' }]}>{formatInr(group.total)}</Text>
                        </TouchableOpacity>
                        {isExpanded
                          ? group.entries.map((item) => (
                              <View key={item.id} style={styles.compactSaleRow}>
                                <Ionicons name={item.cropCycle ? 'leaf-outline' : getExpenseCategoryIcon(item.category.key)} size={14} color="#dc2626" />
                                <View style={styles.compactSaleBody}>
                                  <Text style={styles.compactSaleTitle} numberOfLines={1}>
                                    {expenseViewMode === 'CROP'
                                      ? item.vendorName || item.category.labelEn
                                      : item.cropCycle
                                        ? item.cropCycle.cropName
                                        : item.category.labelEn}
                                  </Text>
                                  <Text style={styles.compactSaleMeta} numberOfLines={1}>
                                    {new Date(item.expenseDate).toLocaleDateString('en-IN')}
                                    {item.notes ? ` · ${item.notes}` : ''}
                                  </Text>
                                </View>
                                <Text style={[styles.compactSaleAmount, { color: '#dc2626' }]}>-{formatInr(Number(item.amount))}</Text>
                              </View>
                            ))
                          : null}
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* Combined Expenses Modal Form */}
              {showExpenseForm && (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
                    <Text style={styles.formTitle}>Add Farm Expense</Text>
                    <Text style={styles.formSubTitle}>Categorized agricultural input & labor expenses</Text>

                    {/* CROP SELECTOR — so it's clear which crop this expense belongs to */}
                    <Text style={styles.label}>Select Crop</Text>
                    {!myRealCrops || myRealCrops.length === 0 ? (
                      <Text style={styles.helperTextExpense}>No crops registered yet — this expense won't be tagged to a specific crop.</Text>
                    ) : (
                      <View style={styles.categoryRow}>
                        {myRealCrops.map((c) => {
                          const isSelected = expenseCropId === c.id;
                          return (
                            <TouchableOpacity
                              key={c.id}
                              style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                              activeOpacity={0.75}
                              onPress={() => {
                                tap();
                                setExpenseCropId((cur) => (cur === c.id ? undefined : c.id));
                              }}
                            >
                              <Ionicons name="leaf-outline" size={14} color={isSelected ? '#fff' : theme.primary} />
                              <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                                {c.cropName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    <Text style={styles.label}>Expense Amount (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 2500"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />

                    <Text style={styles.label}>Payment Mode</Text>
                    <View style={styles.paymentModeRow}>
                      <TouchableOpacity
                        style={[styles.paymentModeChip, expensePaymentMode === 'CASH' && styles.paymentModeChipActive]}
                        onPress={() => {
                          tap();
                          setExpensePaymentMode('CASH');
                          setExpenseParty(null);
                        }}
                      >
                        <Ionicons name="cash-outline" size={14} color={expensePaymentMode === 'CASH' ? '#fff' : '#475569'} />
                        <Text style={[styles.paymentModeChipText, expensePaymentMode === 'CASH' && styles.paymentModeChipTextActive]}>Cash</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.paymentModeChip, expensePaymentMode === 'CREDIT' && styles.paymentModeChipActive]}
                        onPress={() => {
                          tap();
                          setExpensePaymentMode('CREDIT');
                        }}
                      >
                        <Ionicons name="people-outline" size={14} color={expensePaymentMode === 'CREDIT' ? '#fff' : '#475569'} />
                        <Text style={[styles.paymentModeChipText, expensePaymentMode === 'CREDIT' && styles.paymentModeChipTextActive]}>Credit / Party</Text>
                      </TouchableOpacity>
                    </View>

                    {expensePaymentMode === 'CREDIT' ? (
                      <View style={{ marginTop: 10 }}>
                        <PartyPicker
                          parties={parties}
                          selectedParty={expenseParty}
                          onSelect={setExpenseParty}
                          onCreate={async (name) => createParty.mutateAsync(name)}
                          accentColor="#dc2626"
                          label="Vendor / Trader Name *"
                        />
                      </View>
                    ) : (
                      <>
                        <Text style={styles.label}>Vendor / Trader Name (Optional)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Bathinda Kisan Fertilizer Center"
                          placeholderTextColor="#94a3b8"
                          value={vendorName}
                          onChangeText={setVendorName}
                        />
                      </>
                    )}

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
          ) : recordType === 'OVERVIEW' ? (
            /* OVERVIEW TAB */
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {/* Compact overall summary strip */}
              <View style={[styles.overallStrip, { borderColor: overallNet >= 0 ? '#bbf7d0' : '#fecaca' }]}>
                <View style={styles.overallStripItem}>
                  <Text style={styles.overallStripLabel}>Income</Text>
                  <Text style={[styles.overallStripValue, { color: '#16a34a' }]}>{formatInr(totalSalesRevenue)}</Text>
                </View>
                <View style={styles.overallStripDivider} />
                <View style={styles.overallStripItem}>
                  <Text style={styles.overallStripLabel}>Expense</Text>
                  <Text style={[styles.overallStripValue, { color: '#dc2626' }]}>{formatInr(totalSpent)}</Text>
                </View>
                <View style={styles.overallStripDivider} />
                <View style={styles.overallStripItem}>
                  <Text style={styles.overallStripLabel}>{overallNet >= 0 ? 'Profit' : 'Loss'}</Text>
                  <Text style={[styles.overallStripValue, { color: overallNet >= 0 ? '#16a34a' : '#dc2626' }]}>
                    {formatInr(Math.abs(overallNet))}
                  </Text>
                </View>
              </View>

              {cropAnalysis.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="bar-chart-outline" size={36} color="#cbd5e1" />
                  <Text style={styles.emptyText}>Koi active crop nahi mila.</Text>
                </View>
              ) : (
                cropAnalysis.map((c) => {
                  const isProfit = c.net >= 0;
                  return (
                    <View key={c.cropName} style={styles.compactCropRow}>
                      <View style={styles.compactCropTopRow}>
                        <Text style={styles.compactCropName} numberOfLines={1}>{c.cropName}</Text>
                        <Text style={[styles.compactCropNet, { color: isProfit ? '#16a34a' : '#dc2626' }]}>
                          {isProfit ? '▲' : '▼'} {formatInr(Math.abs(c.net))}
                        </Text>
                      </View>
                      <Text style={styles.compactCropSub}>
                        Income {formatInr(c.income)} · Expense {formatInr(c.expense)}
                      </Text>
                    </View>
                  );
                })
              )}

              {/* Total Receivable / Payable */}
              <View style={[styles.overallStrip, { marginTop: 8, marginBottom: 0 }]}>
                <TouchableOpacity
                  style={styles.overallStripItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    tap();
                    setAnalysisSubTab('RECEIVABLE');
                    setRecordType('ANALYSIS');
                  }}
                >
                  <Text style={styles.overallStripLabel}>Total Receivable</Text>
                  <Text style={[styles.overallStripValue, { color: '#16a34a' }]}>{formatInr(totalReceivable)}</Text>
                </TouchableOpacity>
                <View style={styles.overallStripDivider} />
                <TouchableOpacity
                  style={styles.overallStripItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    tap();
                    setAnalysisSubTab('PAYABLE');
                    setRecordType('ANALYSIS');
                  }}
                >
                  <Text style={styles.overallStripLabel}>Total Payable</Text>
                  <Text style={[styles.overallStripValue, { color: '#dc2626' }]}>{formatInr(totalPayable)}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* ANALYSIS (PAYMENTS) TAB — Receivable/Payable party ledgers */
            <View style={{ flex: 1 }}>
              <View style={styles.analysisSubTabRow}>
                {(['RECEIVABLE', 'PAYABLE'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.analysisSubTabBtn, analysisSubTab === tab && styles.analysisSubTabBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setAnalysisSubTab(tab);
                    }}
                  >
                    <Text style={[styles.analysisSubTabText, analysisSubTab === tab && styles.analysisSubTabTextActive]}>
                      {tab === 'RECEIVABLE' ? `Receivable ${formatInr(totalReceivable)}` : `Payable ${formatInr(totalPayable)}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FlatList
                data={analysisSubTab === 'RECEIVABLE' ? receivableParties : payableParties}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Ionicons name="people-outline" size={36} color="#cbd5e1" />
                    <Text style={styles.emptyText}>
                      {analysisSubTab === 'RECEIVABLE' ? 'Koi party aapko amount nahi de rahi.' : 'Aap kisi party ko amount nahi dete.'}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.card, premiumShadow('#000000', 'sm')]}
                    activeOpacity={0.85}
                    onPress={() => {
                      tap();
                      setIsPaymentFormOpen(false);
                      setPaymentAmount('');
                      setPaymentNote('');
                      setPaymentError(null);
                      setStatementPartyId(item.id);
                    }}
                  >
                    <View style={[styles.cardIconWrap, { backgroundColor: analysisSubTab === 'RECEIVABLE' ? '#dcfce7' : '#fee2e2' }]}>
                      <Ionicons name="person" size={18} color={analysisSubTab === 'RECEIVABLE' ? '#16a34a' : '#dc2626'} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardSubtitle}>Tap to view full statement</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={{ color: analysisSubTab === 'RECEIVABLE' ? '#16a34a' : '#dc2626', fontSize: 15, fontFamily: FONT.extraBold }}>
                        {formatInr(Math.abs(item.balance))}
                      </Text>
                      <TouchableOpacity
                        style={[styles.rowPaymentBtn, { backgroundColor: analysisSubTab === 'RECEIVABLE' ? '#16a34a' : '#dc2626' }]}
                        activeOpacity={0.85}
                        onPress={() => {
                          tap();
                          setPaymentAmount('');
                          setPaymentNote('');
                          setPaymentError(null);
                          setStatementPartyId(item.id);
                          setIsPaymentFormOpen(true);
                        }}
                      >
                        <Text style={styles.rowPaymentBtnText}>
                          {analysisSubTab === 'RECEIVABLE' ? 'Receive Amount' : 'Pay Amount'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
              />

              {/* Party Statement Modal */}
              <Modal visible={!!statementPartyId} transparent animationType="slide" onRequestClose={closeStatementModal}>
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalCard, { maxHeight: '85%' }]}>
                    {isLoadingStatement || !statement ? (
                      <View style={styles.center}>
                        <ActivityIndicator color={theme.primary} size="large" />
                      </View>
                    ) : (
                      <>
                        <View style={styles.modalHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.formTitle}>{statement.party.name}</Text>
                            <Text style={[styles.formSubTitle, { color: statement.balance >= 0 ? '#16a34a' : '#dc2626' }]}>
                              {statement.balance >= 0 ? 'Receivable' : 'Payable'}: {formatInr(Math.abs(statement.balance))}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={closeStatementModal}>
                            <Ionicons name="close-circle" size={24} color="#64748b" />
                          </TouchableOpacity>
                        </View>

                        {statement.balance !== 0 && isPaymentFormOpen ? (
                          <View style={{ gap: 8, marginBottom: 8 }}>
                            <Text style={styles.label}>Amount (₹)</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={paymentAmount}
                              onChangeText={setPaymentAmount}
                              placeholder="e.g. 500"
                              placeholderTextColor="#94a3b8"
                            />
                            <Text style={styles.label}>Note (optional)</Text>
                            <TextInput
                              style={styles.input}
                              value={paymentNote}
                              onChangeText={setPaymentNote}
                              placeholder="Cash, UPI, etc."
                              placeholderTextColor="#94a3b8"
                            />
                            {paymentError ? <Text style={styles.errorText}>{paymentError}</Text> : null}
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsPaymentFormOpen(false)}>
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.primaryButtonWrap, { borderRadius: RADIUS.md }]}
                                disabled={recordPaymentReceived.isPending || recordPaymentMade.isPending}
                                onPress={handleRecordPayment}
                              >
                                <View
                                  style={[
                                    styles.primaryButton,
                                    { backgroundColor: statement.balance >= 0 ? '#16a34a' : '#dc2626' },
                                  ]}
                                >
                                  {recordPaymentReceived.isPending || recordPaymentMade.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                  ) : (
                                    <Text style={styles.primaryButtonText}>
                                      {statement.balance >= 0 ? 'Save Payment Received' : 'Save Payment Made'}
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null}

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
                          {statement.entries.length === 0 ? (
                            <Text style={styles.emptyText}>No ledger entries yet.</Text>
                          ) : (
                            statement.entries.map((entry) => {
                              const isPositive = entry.type === 'SALE_CREDIT' || entry.type === 'EXPENSE_PAYMENT';
                              const label =
                                entry.type === 'SALE_CREDIT'
                                  ? 'Sale (Credit)'
                                  : entry.type === 'SALE_PAYMENT'
                                    ? 'Payment Received'
                                    : entry.type === 'EXPENSE_CREDIT'
                                      ? 'Expense (Credit)'
                                      : 'Payment Made';
                              return (
                                <View key={entry.id} style={styles.statementRow}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.statementLabel}>{label}</Text>
                                    <Text style={styles.statementReason} numberOfLines={2}>{entry.reason}</Text>
                                    <Text style={styles.statementDate}>{new Date(entry.createdAt).toLocaleDateString('en-IN')}</Text>
                                  </View>
                                  <Text style={[styles.statementAmount, { color: isPositive ? '#16a34a' : '#dc2626' }]}>
                                    {isPositive ? '+' : '-'}{formatInr(Number(entry.amount))}
                                  </Text>
                                  {entry.type === 'SALE_CREDIT' ? (
                                    <TouchableOpacity style={styles.shareBillIconBtn} onPress={() => shareStatementSaleEntry(entry)}>
                                      <Ionicons name="share-social-outline" size={15} color="#16a34a" />
                                    </TouchableOpacity>
                                  ) : entry.type === 'SALE_PAYMENT' || entry.type === 'EXPENSE_PAYMENT' ? (
                                    <TouchableOpacity style={styles.shareBillIconBtn} onPress={() => shareStatementPaymentEntry(entry)}>
                                      <Ionicons name="receipt-outline" size={15} color="#16a34a" />
                                    </TouchableOpacity>
                                  ) : null}
                                </View>
                              );
                            })
                          )}
                        </ScrollView>
                      </>
                    )}
                  </View>
                </View>
              </Modal>

              {/* Payment Receipt Modal — shown right after recording a payment, with Share as JPG */}
              <Modal
                visible={paymentReceiptVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                  setPaymentReceiptVisible(false);
                  setPaymentReceiptData(null);
                }}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalCard, { maxHeight: '92%' }]}>
                    <View style={[styles.modalHeaderRow, { justifyContent: 'space-between' }]}>
                      <Text style={styles.formTitle}>Payment Receipt</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setPaymentReceiptVisible(false);
                          setPaymentReceiptData(null);
                        }}
                      >
                        <Ionicons name="close" size={20} color="#475569" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {paymentReceiptData && (
                        <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                          <ViewShot ref={billShotRef} options={{ format: 'jpg', quality: 0.95 }}>
                            <PaymentReceiptPreview inv={paymentReceiptData} />
                          </ViewShot>
                          <View style={[styles.formActions, { width: '100%' }]}>
                            <TouchableOpacity
                              style={styles.primaryButtonWrap}
                              onPress={() => shareInvoiceAsJpg(`Receipt-${paymentReceiptData.receiptNo}`, 'receipt')}
                              disabled={isSharingBill}
                            >
                              <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                                {isSharingBill ? (
                                  <ActivityIndicator color="#ffffff" />
                                ) : (
                                  <Text style={styles.primaryButtonText}>Share Receipt (JPG)</Text>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </View>
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
  compactSaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  compactSaleBody: { flex: 1 },
  compactSaleTitle: { fontSize: 12.5, fontFamily: FONT.semiBold, color: theme.text },
  compactSaleMeta: { fontSize: 10.5, fontFamily: FONT.medium, color: theme.textMuted, marginTop: 1 },
  compactSaleAmount: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#16a34a' },
  shareBillIconBtn: {
    marginLeft: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
  },
  salesViewModeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  salesViewModeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  salesViewModeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  salesViewModeChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569' },
  salesViewModeChipTextActive: { color: '#ffffff' },
  salesGroupBlock: { marginBottom: 10 },
  salesGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
  },
  salesGroupName: { flex: 1, fontSize: 12.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  salesGroupCount: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8' },
  salesGroupTotal: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 6 },
  emptyText: { color: theme.text, fontSize: 15, fontFamily: FONT.bold },
  emptySub: { color: theme.textMuted, fontSize: 12.5, fontFamily: FONT.medium, textAlign: 'center' },
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
  rowPaymentBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
  rowPaymentBtnText: { color: '#ffffff', fontSize: 10.5, fontFamily: FONT.bold },
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
  helperTextExpense: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
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
  paymentModeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  paymentModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  paymentModeChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  paymentModeChipText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#475569' },
  paymentModeChipTextActive: { color: '#ffffff' },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    marginTop: 10,
  },
  addProductBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  cartTable: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  cartHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cartHeaderCell: { flex: 1, fontSize: 10.5, fontFamily: FONT.bold, color: '#64748b', textTransform: 'uppercase' },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cartCell: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#0f172a' },
  cartTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cartTotalsLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
  cartTotalsValue: { fontSize: 13, fontFamily: FONT.extraBold, color: '#16a34a' },
  ledgerSummaryBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ledgerLabel: { fontSize: 12, fontFamily: FONT.medium, color: '#92400e' },
  ledgerValue: { fontSize: 12.5, fontFamily: FONT.bold, color: '#92400e' },
  ledgerLabelBold: { fontSize: 13, fontFamily: FONT.extraBold, color: '#78350f' },
  ledgerValueBold: { fontSize: 14.5, fontFamily: FONT.extraBold, color: '#78350f' },
  savedTitle: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 10 },
  savedSub: { fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 4, textAlign: 'center' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  analysisSubTabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  analysisSubTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: '#f1f5f9',
  },
  analysisSubTabBtnActive: { backgroundColor: theme.primary },
  analysisSubTabText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569' },
  analysisSubTabTextActive: { color: '#ffffff' },
  overallStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingVertical: 10,
    marginBottom: 8,
  },
  overallStripItem: { flex: 1, alignItems: 'center' },
  overallStripLabel: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8' },
  overallStripValue: { fontSize: 13, fontFamily: FONT.extraBold, marginTop: 1 },
  overallStripDivider: { width: 1, height: 26, backgroundColor: '#f1f5f9' },
  compactCropRow: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 4,
  },
  compactCropTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compactCropName: { flex: 1, fontSize: 12.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  compactCropNet: { fontSize: 12, fontFamily: FONT.extraBold },
  compactCropSub: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 8,
  },
  statementLabel: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  statementReason: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  statementDate: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  statementAmount: { fontSize: 13.5, fontFamily: FONT.extraBold },
});
