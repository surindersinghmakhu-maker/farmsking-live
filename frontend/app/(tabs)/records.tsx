import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { UniversalVoucherSlipModal, UniversalVoucherData } from '@/src/components/UniversalVoucherSlip';
import { UniversalStatementModal, RawStatementEntry } from '@/src/components/UniversalStatementModal';
import { useFarms } from '@/src/hooks/useFarms';
import { usePlotsForFarm } from '@/src/hooks/usePlots';
import { useCreateExpense, useUpdateExpense, useExpenseCategories, useExpensesForFarm } from '@/src/hooks/useExpenses';
import { useCrops, CropSaleRecord } from '@/src/store/crops-context';
import { useMyCrops } from '@/src/hooks/useCrops';
import { useParties, useCreateParty, usePartyStatement, useRecordSaleLedger, useRecordPaymentReceived, useRecordPaymentMade } from '@/src/hooks/useParties';
import { useCreateSaleBill, useFetchSaleBill, useMySaleBillCount, useUpdateSaleBill, useSaleBills } from '@/src/hooks/useSaleBills';
import * as saleBillsApi from '@/src/api/saleBills.api';
import { useFetchPaymentReceipt, useMyPaymentReceiptCount } from '@/src/hooks/usePaymentReceipts';
import { useFarmerPlan } from '@/src/hooks/useFarmerPlan';
import { PartyPicker } from '@/src/components/PartyPicker';
import { PaymentVoucherModal, type VoucherType } from '@/src/components/PaymentVoucherModal';
import { LabourManagementSection } from '@/src/components/LabourManagementSection';
import { AllPartiesSection } from '@/src/components/AllPartiesSection';
import { buildPartyLedgerRows } from '@/src/utils/partyLedger';
import { ProfessionalOverviewView } from '@/src/components/ProfessionalOverviewView';
import { PaymentMode } from '@/src/types/api';
import { useLabourWorkers } from '@/src/hooks/useLabour';
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
import { formatDateDDMMYYYY } from '@/src/utils/formatDate';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Individual Agricultural Work & Farming Expense Categories
export const COMBINED_EXPENSE_CATEGORIES = [
  {
    id: 'cat_cultivation',
    key: 'cultivation',
    labelEn: 'Cultivation & Tillage',
    labelPa: 'Cultivation & Tillage',
    labelHi: 'Cultivation & Tillage',
    icon: 'build-outline',
  },
  {
    id: 'cat_sowing_seeds',
    key: 'sowing_seeds',
    labelEn: 'Seeds & Sowing',
    labelPa: 'Seeds & Sowing',
    labelHi: 'Seeds & Sowing',
    icon: 'leaf-outline',
  },
  {
    id: 'cat_fertilizer',
    key: 'fertilizer',
    labelEn: 'Fertilizers & FYM Manure',
    labelPa: 'Fertilizers & FYM Manure',
    labelHi: 'Fertilizers & FYM Manure',
    icon: 'flask-outline',
  },
  {
    id: 'cat_crop_care',
    key: 'crop_care',
    labelEn: 'Crop Care & Protection',
    labelPa: 'Crop Care & Protection',
    labelHi: 'Crop Care & Protection',
    icon: 'medkit-outline',
  },
  {
    id: 'cat_irrig_power',
    key: 'irrigation_power',
    labelEn: 'Irrigation, Diesel & Electricity',
    labelPa: 'Irrigation, Diesel & Electricity',
    labelHi: 'Irrigation, Diesel & Electricity',
    icon: 'water-outline',
  },
  {
    id: 'cat_spray_pest',
    key: 'spray_pesticide',
    labelEn: 'Spray & Pesticides',
    labelPa: 'Spray & Pesticides',
    labelHi: 'Spray & Pesticides',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'cat_labour',
    key: 'labour',
    labelEn: 'Labour & Daily Wages',
    labelPa: 'Labour & Daily Wages',
    labelHi: 'Labour & Daily Wages',
    icon: 'people-outline',
  },
  {
    id: 'cat_machinery',
    key: 'machinery_equipment',
    labelEn: 'Machinery & Tractor Rent',
    labelPa: 'Machinery & Tractor Rent',
    labelHi: 'Machinery & Tractor Rent',
    icon: 'construct-outline',
  },
  {
    id: 'cat_harvesting',
    key: 'harvesting',
    labelEn: 'Harvesting & Threshing',
    labelPa: 'Harvesting & Threshing',
    labelHi: 'Harvesting & Threshing',
    icon: 'cut-outline',
  },
  {
    id: 'cat_transport',
    key: 'transport',
    labelEn: 'Transport & Freight',
    labelPa: 'Transport & Freight',
    labelHi: 'Transport & Freight',
    icon: 'bus-outline',
  },
  {
    id: 'cat_mandi_pack',
    key: 'mandi_packing',
    labelEn: 'Packing & Mandi Charges',
    labelPa: 'Packing & Mandi Charges',
    labelHi: 'Packing & Mandi Charges',
    icon: 'cube-outline',
  },
  {
    id: 'cat_other',
    key: 'other',
    labelEn: 'Other Farm Expenses',
    labelPa: 'Other Farm Expenses',
    labelHi: 'Other Farm Expenses',
    icon: 'ellipsis-horizontal-outline',
  },
];

const LABOUR_WORK_TYPES = [
  { id: 'harvesting', label: '🌾 Harvesting' },
  { id: 'sowing', label: '🌱 Sowing & Planting' },
  { id: 'weeding', label: '🌿 Weeding' },
  { id: 'spraying', label: '🧴 Spraying' },
  { id: 'loading', label: '📦 Packing & Loading' },
  { id: 'irrigation', label: '💧 Irrigation' },
  { id: 'general', label: '🚜 General Labour' },
];

export default function RecordsScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const { user } = useAuth();
  const [recordType, setRecordType] = useState<'EXPENSES' | 'SALES' | 'OVERVIEW' | 'LABOUR' | 'ANALYSIS' | 'PARTIES'>('OVERVIEW');

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
  const updateExpense = useUpdateExpense();
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

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
  const [expenseCropType, setExpenseCropType] = useState<'CROP' | 'OTHER'>('CROP');
  const [expenseCropId, setExpenseCropId] = useState<string | undefined>(undefined);
  const { data: myRealCrops } = useMyCrops();

  const activeCrops = useMemo(() => {
    return (myRealCrops ?? []).filter((c) => c.status === 'ACTIVE' || c.status === 'HARVESTING' || c.status === 'PLANNED');
  }, [myRealCrops]);
  const { data: expenseLabourWorkers = [] } = useLabourWorkers();
  const [expenseRecipientType, setExpenseRecipientType] = useState<'SUPPLIER' | 'LABOUR' | 'CASH'>('CASH');
  const [selectedLabourWorkerId, setSelectedLabourWorkerId] = useState<string | undefined>(undefined);
  const [labourWorkType, setLabourWorkType] = useState<string>('general');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [plotId, setPlotId] = useState<string | undefined>(undefined);
  const [expensePaymentMode, setExpensePaymentMode] = useState<PaymentMode>('CASH');
  const [expenseParty, setExpenseParty] = useState<Party | null>(null);
  const [isExpenseCategoryDropdownOpen, setIsExpenseCategoryDropdownOpen] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // Universal Voucher & Statement Slip Modal state
  const [showVoucherSlipModal, setShowVoucherSlipModal] = useState(false);
  const [activeVoucherData, setActiveVoucherData] = useState<UniversalVoucherData | null>(null);
  const [showFullStatementModal, setShowFullStatementModal] = useState(false);

  // Active crops & their sales — shared with the Crops tab. Once a crop reaches
  // the Completed stage it drops out of cropFields, so it naturally stops
  // contributing here too; its sale record only lives on in Crop History.
  const { cropFields: farmerCrops, salesRecords: allSalesRecords, recordSale, updateSale, deleteSale } = useCrops();

  const { data: rawSaleBillsList } = useSaleBills();
  const saleBillsMap = useMemo(() => {
    const map = new Map<string, any>();
    (rawSaleBillsList || []).forEach((b) => {
      if (b.id) map.set(b.id, b);
      if (b.billNo) map.set(b.billNo, b);
    });
    return map;
  }, [rawSaleBillsList]);

  // Unified list of ALL sales (DB Sale Bills + Local Offline Sales)
  const unifiedSalesRecords = useMemo(() => {
    const list: CropSaleRecord[] = [];
    const dbBillIds = new Set<string>();

    // 1. Include DB Sale Bills
    if (rawSaleBillsList && Array.isArray(rawSaleBillsList)) {
      rawSaleBillsList.forEach((b) => {
        if (b.id) dbBillIds.add(b.id);
        if (b.billNo) dbBillIds.add(b.billNo);

        const cropSummary = (b.items && b.items.length > 0)
          ? b.items.map((i: any) => `${i.cropName} (${i.qty} ${i.unit} @ ₹${i.rate})`).join(', ')
          : 'Crop Sale';

        list.push({
          id: b.id,
          cropId: b.items?.[0]?.cropId || '',
          cropName: cropSummary,
          fieldName: b.partyName || 'Sale',
          quantity: String(b.items?.[0]?.qty || 1),
          unit: b.items?.[0]?.unit || 'kg',
          pricePerUnit: String(b.items?.[0]?.rate || b.totalAmount),
          totalAmount: Number(b.totalAmount),
          amountReceived: b.amountReceived !== undefined && b.amountReceived !== null ? Number(b.amountReceived) : undefined,
          previousBalance: b.previousBalance !== undefined && b.previousBalance !== null ? Number(b.previousBalance) : undefined,
          amountReceivedMode: (b as any).amountReceivedMode as 'CASH' | 'UPI' | undefined,
          buyerName: b.partyName || (b.isCash ? 'Cash Sale' : 'Direct Cash'),
          saleDate: b.createdAt ? (typeof b.createdAt === 'string' ? b.createdAt.slice(0, 10) : new Date(b.createdAt).toISOString().slice(0, 10)) : todayIso(),
          billId: b.id,
          billNo: b.billNo,
          partyId: b.partyId,
        });
      });
    }

    // 2. Include local sales records from context/AsyncStorage if not already present in DB list
    (allSalesRecords || []).forEach((s) => {
      if (!dbBillIds.has(s.id) && !dbBillIds.has(s.billId || '') && !dbBillIds.has(s.billNo || '')) {
        list.push(s);
      }
    });

    return list;
  }, [rawSaleBillsList, allSalesRecords]);

  const renderSaleRowItem = (item: CropSaleRecord, idx: number) => {
    const matchedBill = item.billId ? saleBillsMap.get(item.billId) : (item.billNo ? saleBillsMap.get(item.billNo) : null);
    const formattedBillNo = matchedBill?.billNo || item.billNo || (item.billId ? `FK-${item.billId.slice(-4).toUpperCase()}` : 'FK-2601');
    
    const billTotal = matchedBill ? Number(matchedBill.totalAmount) : item.totalAmount;
    const isCashSale = !item.partyId || item.buyerName === 'Cash Sale' || item.buyerName === 'Direct / Cash';
    const billRecd = matchedBill ? Number(matchedBill.amountReceived) : (isCashSale ? billTotal : 0);
    const remainingBal = matchedBill && matchedBill.thisSaleBalance !== undefined
      ? Number(matchedBill.thisSaleBalance)
      : Math.max(0, billTotal - billRecd);

    const buyerDisplayName = matchedBill?.partyName || (matchedBill?.isCash ? 'Cash Sale' : item.buyerName || 'Cash Sale');

    const cropDetailText = matchedBill && matchedBill.items && matchedBill.items.length > 0
      ? matchedBill.items.map((i: any) => `${i.cropName} (${i.qty} ${i.unit} @ ₹${i.rate})`).join(', ')
      : `${item.cropName} (${item.quantity} ${item.unit} @ ₹${item.pricePerUnit})`;

    const displayDateStr = matchedBill?.createdAt
      ? formatDateDDMMYYYY(matchedBill.createdAt)
      : (item.saleDate ? formatDateDDMMYYYY(item.saleDate) : 'Today');

    return (
      <View
        key={item.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 8,
          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
          minWidth: 690,
        }}
      >
        {/* 1. Bill No */}
        <View style={{ width: 75 }}>
          <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-start', maxWidth: 72 }}>
            <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#1d4ed8' }} numberOfLines={1}>
              {formattedBillNo}
            </Text>
          </View>
        </View>

        {/* 2. Date */}
        <Text style={{ width: 70, fontSize: 10, fontFamily: FONT.bold, color: '#475569' }}>
          {displayDateStr}
        </Text>

        {/* 3. Party */}
        <View style={{ width: 105, paddingRight: 4 }}>
          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
            🤝 {buyerDisplayName}
          </Text>
        </View>

        {/* 4. Bill Items */}
        <View style={{ flex: 1.5, minWidth: 140, paddingRight: 4 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.semiBold, color: '#16a34a' }} numberOfLines={2}>
            🌾 {cropDetailText}
          </Text>
        </View>

        {/* 5. Net Sale Amount */}
        <Text style={{ width: 110, fontSize: 11, fontFamily: FONT.bold, color: '#0f172a', textAlign: 'right', paddingRight: 6 }}>
          ₹{billTotal.toLocaleString('en-IN')}
        </Text>

        {/* 6. Action Buttons (Edit & Download) */}
        <View style={{ width: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingLeft: 2 }}>
          <TouchableOpacity
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: '#f0fdf4',
              borderWidth: 1,
              borderColor: '#bbf7d0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
            onPress={() => handleOpenEditSale(item)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="create-outline" size={13} color="#16a34a" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: '#eff6ff',
              borderWidth: 1,
              borderColor: '#bfdbfe',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
            onPress={() => openBillPreviewForSale(item)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="download-outline" size={13} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Sales list view mode — Month / Today / Custom Period Range / Buyer-wise / All Time
  const [salesViewMode, setSalesViewMode] = useState<'MONTH' | 'TODAY' | 'PERIOD' | 'BUYER' | 'ALL'>('MONTH');
  const [expandedSalesGroup, setExpandedSalesGroup] = useState<string | null>(null);

  // Custom Period Date Range state (Default to start of current month till today)
  const [salesFromDate, setSalesFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [salesToDate, setSalesToDate] = useState<string>(todayIso());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  // Helper to extract clean YYYY-MM-DD from any date representation
  const getCleanIsoDate = (dateStr?: string): string => {
    if (!dateStr) return todayIso();
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
      const parts = str.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return str;
  };

  // 1. Filter sales for Current Calendar Month
  const currentMonthPrefix = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const salesThisMonth = useMemo(() => {
    return unifiedSalesRecords.filter((s) => {
      if (!s.saleDate) return true;
      const iso = getCleanIsoDate(s.saleDate);
      return iso.slice(0, 7) === currentMonthPrefix;
    });
  }, [unifiedSalesRecords, currentMonthPrefix]);

  // 2. Filter sales for Today
  const todayDateStr = useMemo(() => todayIso(), []);
  const salesToday = useMemo(() => {
    return unifiedSalesRecords.filter((s) => {
      if (!s.saleDate) return false;
      const iso = getCleanIsoDate(s.saleDate);
      return iso === todayDateStr;
    });
  }, [unifiedSalesRecords, todayDateStr]);

  // 3. Filter sales for Custom Period Date Range (From Date -> To Date)
  const salesInPeriod = useMemo(() => {
    return unifiedSalesRecords.filter((s) => {
      if (!s.saleDate) return true;
      const iso = getCleanIsoDate(s.saleDate);
      return iso >= salesFromDate && iso <= salesToDate;
    });
  }, [unifiedSalesRecords, salesFromDate, salesToDate]);

  // Active filtered list depending on selected view mode (fallback to unifiedSalesRecords if selected month filter is empty but total sales exist)
  const activeSalesList = useMemo(() => {
    if (salesViewMode === 'MONTH') {
      if (salesThisMonth.length > 0) return salesThisMonth;
      if (unifiedSalesRecords.length > 0) return unifiedSalesRecords; // Fallback so entries are never hidden
      return salesThisMonth;
    }
    if (salesViewMode === 'TODAY') return salesToday;
    if (salesViewMode === 'PERIOD') return salesInPeriod;
    return unifiedSalesRecords;
  }, [salesViewMode, salesThisMonth, salesToday, salesInPeriod, unifiedSalesRecords]);

  // Dynamic Total Sales Revenue for selected filter
  const totalSalesRevenue = useMemo(() => {
    return activeSalesList.reduce((acc, item) => {
      const matchedBill = item.billId ? saleBillsMap.get(item.billId) : (item.billNo ? saleBillsMap.get(item.billNo) : null);
      return acc + (matchedBill ? Number(matchedBill.totalAmount) : (Number(item.totalAmount) || 0));
    }, 0);
  }, [activeSalesList, saleBillsMap]);

  // 3. Group sales Buyer-wise
  const salesByBuyer = useMemo(() => {
    const map = new Map<string, CropSaleRecord[]>();
    unifiedSalesRecords.forEach((item) => {
      const name = item.buyerName || 'Cash Sale';
      const existing = map.get(name) || [];
      map.set(name, [...existing, item]);
    });
    return Array.from(map.entries()).map(([buyer, entries]) => {
      const total = entries.reduce((acc, e) => {
        const matchedBill = e.billId ? saleBillsMap.get(e.billId) : (e.billNo ? saleBillsMap.get(e.billNo) : null);
        return acc + (matchedBill ? Number(matchedBill.totalAmount) : e.totalAmount);
      }, 0);
      return {
        name: buyer,
        entries,
        total,
      };
    });
  }, [unifiedSalesRecords, saleBillsMap]);

  const [expenseViewMode, setExpenseViewMode] = useState<'ALL' | 'CROP' | 'VENDOR'>('ALL');
  const [expandedExpenseGroup, setExpandedExpenseGroup] = useState<string | null>(null);

  // Voucher modal state
  const [showPaymentVoucherModal, setShowPaymentVoucherModal] = useState(false);
  const [voucherInitialType, setVoucherInitialType] = useState<VoucherType>('RECEIPT_IN');

  // Sales Form state
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleStep, setSaleStep] = useState<'FORM' | 'SAVED'>('FORM');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'PARTY'>('CASH');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [cashBuyerName, setCashBuyerName] = useState('');
  const [cashBuyerMobile, setCashBuyerMobile] = useState('');
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [saleQuantity, setSaleQuantity] = useState('');
  const [saleRate, setSaleRate] = useState('');
  const [saleDate, setSaleDate] = useState(todayIso());
  const [saleItems, setSaleItems] = useState<SaleCartItem[]>([]);
  const [amountReceived, setAmountReceived] = useState('');
  const [amountReceivedMode, setAmountReceivedMode] = useState<'CASH' | 'UPI'>('CASH');
  const [saleError, setSaleError] = useState<string | null>(null);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<SavedSaleInvoice | null>(null);
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
  const [showSaleDatePicker, setShowSaleDatePicker] = useState(false);
  const [saleDiscount, setSaleDiscount] = useState('');
  const [saleDelivery, setSaleDelivery] = useState('');
  const [saleDescription, setSaleDescription] = useState('');

  // Main Form Edit Bill State
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editingBillNo, setEditingBillNo] = useState<string | null>(null);
  const [editingPreviousBalance, setEditingPreviousBalance] = useState<number | null>(null);
  // ✅ ਇਹ track ਕਰਦਾ ਹੈ ਕਿ save ਤੋਂ ਪਹਿਲਾਂ edit mode ਸੀ ਜਾਂ ਨਹੀਂ
  const [wasEditingBill, setWasEditingBill] = useState(false);

  // Handle incoming route params (e.g. action: 'NEW_SALE' or action: 'NEW_EXPENSE' from Quick Accounts Card)
  const { action, t } = useLocalSearchParams<{ action?: string; t?: string }>();

  useEffect(() => {
    if (action === 'NEW_SALE') {
      setRecordType('SALES');
      setSaleStep('FORM');
      setShowSaleForm(true);
    } else if (action === 'SALES') {
      setRecordType('SALES');
    } else if (action === 'NEW_EXPENSE') {
      setRecordType('EXPENSES');
      resetExpenseForm();
      setShowExpenseForm(true);
    } else if (action === 'EXPENSES') {
      setRecordType('EXPENSES');
    }
  }, [action, t]);

  const handleOpenEditSale = async (item: CropSaleRecord) => {
    tap();
    const isParty = Boolean(item.partyId || (item.buyerName && item.buyerName !== 'Cash Sale' && item.buyerName !== 'Direct / Cash'));

    const foundParty = parties.find(p => p.id === item.partyId || (p.name && p.name.trim().toLowerCase() === item.buyerName?.trim().toLowerCase()));
    const partyObj = foundParty || (isParty ? ({ id: item.partyId || `party-${Date.now()}`, name: item.buyerName || 'Party', mobile: item.partyMobile || '' } as Party) : null);

    let loadedItems: Array<{ id: string; cropId: string; cropName: string; unit: string; qty: number; rate: number; amount: number }> = [];
    let billNoToUse = item.billNo || (item.billId ? `FK-${item.billId.slice(-4).toUpperCase()}` : 'FK-2601');
    let realBillIdToUse = item.billId || item.id;
    let loadedAmountReceived: string | null = null;
    let loadedPreviousBalance: number | null = null;
    let loadedReceivedMode: 'CASH' | 'UPI' = 'CASH';

    const matchedBill = item.billId ? saleBillsMap.get(item.billId) : (item.billNo ? saleBillsMap.get(item.billNo) : (item.id ? saleBillsMap.get(item.id) : null));

    if (matchedBill) {
      realBillIdToUse = matchedBill.id;
      billNoToUse = matchedBill.billNo || billNoToUse;
      if (matchedBill.amountReceived !== undefined && matchedBill.amountReceived !== null) {
        loadedAmountReceived = String(matchedBill.amountReceived);
      }
      if (matchedBill.previousBalance !== undefined && matchedBill.previousBalance !== null) {
        loadedPreviousBalance = Number(matchedBill.previousBalance);
      }
      if (matchedBill.amountReceivedMode) {
        loadedReceivedMode = matchedBill.amountReceivedMode as 'CASH' | 'UPI';
      }
      if (Array.isArray(matchedBill.items) && matchedBill.items.length > 0) {
        loadedItems = (matchedBill.items as any[]).map((bi: any, idx: number) => ({
          id: bi.id || `bill-item-${idx}-${Date.now()}`,
          cropId: bi.cropId || item.cropId,
          cropName: bi.cropName || item.cropName,
          unit: bi.unit || item.unit || 'Quintal',
          qty: Number(bi.qty) || 1,
          rate: Number(bi.rate) || 0,
          amount: Number(bi.amount) || ((Number(bi.qty) || 1) * (Number(bi.rate) || 0)),
        }));
      }
    } else if (item.billId || item.billNo || item.id) {
      try {
        const bill = await saleBillsApi.getSaleBill(item.billId || item.billNo || item.id!);
        if (bill) {
          realBillIdToUse = bill.id;
          billNoToUse = bill.billNo || billNoToUse;
          if (bill.amountReceived !== undefined && bill.amountReceived !== null) {
            loadedAmountReceived = String(bill.amountReceived);
          }
          if (bill.previousBalance !== undefined && bill.previousBalance !== null) {
            loadedPreviousBalance = Number(bill.previousBalance);
          }
          if ((bill as any).amountReceivedMode) {
            loadedReceivedMode = (bill as any).amountReceivedMode as 'CASH' | 'UPI';
          }
          if (Array.isArray(bill.items) && bill.items.length > 0) {
            loadedItems = (bill.items as any[]).map((bi: any, idx: number) => ({
              id: bi.id || `bill-item-${idx}-${Date.now()}`,
              cropId: bi.cropId || item.cropId,
              cropName: bi.cropName || item.cropName,
              unit: bi.unit || item.unit || 'Quintal',
              qty: Number(bi.qty) || 1,
              rate: Number(bi.rate) || 0,
              amount: Number(bi.amount) || ((Number(bi.qty) || 1) * (Number(bi.rate) || 0)),
            }));
          }
        }
      } catch {
        // fallback
      }
    }

    if (loadedAmountReceived === null && item.amountReceived !== undefined && item.amountReceived !== null) {
      loadedAmountReceived = String(item.amountReceived);
    }
    if (loadedPreviousBalance === null && item.previousBalance !== undefined && item.previousBalance !== null) {
      loadedPreviousBalance = Number(item.previousBalance);
    }
    if (item.amountReceivedMode) {
      loadedReceivedMode = item.amountReceivedMode;
    }

    if (loadedItems.length === 0) {
      loadedItems = [
        {
          id: item.id,
          cropId: item.cropId,
          cropName: item.cropName,
          unit: item.unit || 'Quintal',
          qty: Number(item.quantity) || 1,
          rate: Number(item.pricePerUnit) || 0,
          amount: Number(item.totalAmount) || (Number(item.quantity) * Number(item.pricePerUnit)) || 0,
        }
      ];
    }

    setPaymentMode(isParty ? 'PARTY' : 'CASH');
    setSelectedParty(partyObj);
    setCashBuyerName(item.buyerName || '');
    setCashBuyerMobile(item.partyMobile || '');
    setSaleItems(loadedItems);
    setSaleDiscount('');
    setSaleDelivery('');
    setEditingPreviousBalance(loadedPreviousBalance);
    const defaultRecd = !isParty ? String(item.totalAmount) : '';
    setAmountReceived(loadedAmountReceived !== null ? loadedAmountReceived : defaultRecd);
    setAmountReceivedMode(loadedReceivedMode);
    setSaleDescription(item.notes || '');
    // ✅ FIX: sale date ਵੀ form ਵਿੱਚ ਭਰੋ
    if (item.saleDate) {
      setSaleDate(item.saleDate.slice(0, 10));
    }
    setEditingBillId(realBillIdToUse);
    setEditingBillNo(billNoToUse);
    setSaleStep('FORM');
    setShowSaleForm(true);
    setRecordType('SALES');
  };

  const onDeleteEditingBill = async () => {
    if (!editingBillId) return;
    try {
      tap();
      await deleteSale(editingBillId);
      // resetSaleForm(); // Assuming resetSaleForm exists in your context
      setShowSaleForm(false);
    } catch (err) {
      console.error('Failed to delete bill:', err);
    }
  };

  // Get calendar data for a given month
  const getCalendarMonth = (isoDate: string) => {
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { year, month, firstDay, daysInMonth };
  };

  const calData = getCalendarMonth(saleDate);
  const calMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const calDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const shiftCalMonth = (dir: -1 | 1) => {
    const d = new Date(saleDate);
    d.setMonth(d.getMonth() + dir);
    setSaleDate(d.toISOString().slice(0, 10));
  };

  const selectCalDay = (day: number) => {
    const mm = String(calData.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setSaleDate(`${calData.year}-${mm}-${dd}`);
    setShowSaleDatePicker(false);
  };

  // Render interactive grid calendar modal for Custom Period Date Range
  const renderPeriodCalendarModal = (
    title: string,
    currentDateIso: string,
    onSelectDate: (iso: string) => void,
    visible: boolean,
    onClose: () => void
  ) => {
    if (!visible) return null;
    const d = new Date(currentDateIso || todayIso());
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const year = validDate.getFullYear();
    const month = validDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const calDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const shiftMonth = (dir: -1 | 1) => {
      const next = new Date(validDate);
      next.setMonth(next.getMonth() + dir);
      onSelectDate(next.toISOString().slice(0, 10));
    };

    const pickDay = (dayNum: number) => {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      onSelectDate(`${year}-${mm}-${dd}`);
      onClose();
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, width: 290, borderWidth: 1, borderColor: '#cbd5e1', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 }}>
              <Text style={{ fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' }}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 2 }}>
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} style={{ padding: 5, borderRadius: RADIUS.sm, backgroundColor: '#f1f5f9' }}>
                <Ionicons name="chevron-back" size={16} color="#334155" />
              </TouchableOpacity>
              <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>
                {calMonthNames[month]} {year}
              </Text>
              <TouchableOpacity onPress={() => shiftMonth(1)} style={{ padding: 5, borderRadius: RADIUS.sm, backgroundColor: '#f1f5f9' }}>
                <Ionicons name="chevron-forward" size={16} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Days of Week Header */}
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              {calDayNames.map((dn) => (
                <Text key={dn} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8' }}>{dn}</Text>
              ))}
            </View>

            {/* Day Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`empty-${i}`} style={{ width: '14.28%', height: 32 }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selDay = validDate.getDate();
                const isSelected = day === selDay;
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => pickDay(day)}
                    style={{
                      width: '14.28%',
                      height: 32,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 16,
                      backgroundColor: isSelected ? '#16a34a' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: isSelected ? FONT.bold : FONT.medium, color: isSelected ? '#ffffff' : '#1e293b' }}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <TouchableOpacity
                onPress={() => {
                  onSelectDate(todayIso());
                  onClose();
                }}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }}
              >
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a' }}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.md, backgroundColor: '#16a34a' }}
              >
                <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const queryClient = useQueryClient();
  const { data: parties = [] } = useParties();
  const createParty = useCreateParty();
  const recordSaleLedger = useRecordSaleLedger();
  const createSaleBill = useCreateSaleBill();
  const updateSaleBill = useUpdateSaleBill();
  const fetchSaleBill = useFetchSaleBill();
  const fetchPaymentReceipt = useFetchPaymentReceipt();

  // Bill preview (re-share from Sales list) + JPG capture/share
  const { billShotRef, isSharingBill, shareInvoiceAsJpg: shareInvoiceAsJpgRaw, shareInvoiceAsPdf: shareInvoiceAsPdfRaw } = useShareBillAsJpg();
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
        ? `On the Free plan, you can share up to ${FREE_SHARE_LIMIT} sale bills. Please upgrade your plan to share unlimited bills.`
        : `On the Free plan, you can share up to ${FREE_SHARE_LIMIT} payment receipts. Please upgrade your plan to share unlimited receipts.`;
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

  const shareInvoiceAsPdf = async (inv: SavedSaleInvoice | null | undefined, fileName?: string) => {
    if (!inv) return;
    if (isFreePlan) {
      const count = billCountData?.count ?? 0;
      if (count >= FREE_SHARE_LIMIT) {
        showUpgradePrompt('bill');
        return;
      }
    }
    await shareInvoiceAsPdfRaw(inv, fileName);
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
        date: formatDateDDMMYYYY(bill.createdAt),
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
      date: formatDateDDMMYYYY(sale.saleDate),
      time: '',
    });
    setBillPreviewVisible(true);
  };

  // Analysis tab — Receivable / Payable sub-tabs + party statement
  const [analysisSubTab, setAnalysisSubTab] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [statementPartyId, setStatementPartyId] = useState<string | null>(null);
  const [statementSortAsc, setStatementSortAsc] = useState(false);
  const { data: statement, isLoading: isLoadingStatement } = usePartyStatement(statementPartyId ?? undefined);
  const statementLedgerRows = useMemo(() => {
    const rows = buildPartyLedgerRows(statement?.entries || []);
    if (statementSortAsc) {
      return [...rows].sort((a, b) => a.srNo - b.srNo);
    }
    return rows;
  }, [statement?.entries, statementSortAsc]);
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
        date: formatDateDDMMYYYY(now.toISOString().slice(0, 10)),
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
  const livePartyBalance = partyStatement?.balance ?? selectedParty?.balance ?? 0;
  const previousPartyBalance = editingBillId && editingPreviousBalance !== null
    ? editingPreviousBalance
    : livePartyBalance;

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
  const totalCartQty = useMemo(() => saleItems.reduce((sum, i) => sum + Number(i.qty), 0), [saleItems]);
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

  /** Sales grouped by crop or by buyer, each group sorted by most recent sale first. */
  const groupSales = (key: 'cropName' | 'buyerName') => {
    const groups = new Map<string, typeof unifiedSalesRecords>();
    unifiedSalesRecords.forEach((s) => {
      const groupKey = s[key] || 'Unknown';
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(s);
    });
    return Array.from(groups.entries())
      .map(([name, entries]) => ({ name, entries, total: entries.reduce((sum, e) => sum + e.totalAmount, 0) }))
      .sort((a, b) => b.total - a.total);
  };
  const salesByCrop = useMemo(() => groupSales('cropName'), [unifiedSalesRecords]);

  // Crop-wise breakdown for the Analysis tab. Expenses are logged per-farm, not
  // per-crop, so each active crop field is given an even share of total expenses.
  // Group all fields/items of the same crop into a single row.
  const cropAnalysis = useMemo(() => {
    const totalFields = farmerCrops.length;
    const perFieldExpense = totalFields > 0 ? totalSpent / totalFields : 0;

    const getBaseCropName = (name: string): string => {
      if (!name) return 'Unknown Crop';
      const cleaned = name.split('(')[0].trim();
      return cleaned || name.trim();
    };

    const cropGroupsMap = new Map<
      string,
      {
        cropName: string;
        fieldCount: number;
        cropIds: Set<string>;
      }
    >();

    farmerCrops.forEach((crop) => {
      const baseName = getBaseCropName(crop.cropName);
      const groupKey = baseName.toLowerCase();

      if (!cropGroupsMap.has(groupKey)) {
        cropGroupsMap.set(groupKey, {
          cropName: baseName,
          fieldCount: 0,
          cropIds: new Set<string>(),
        });
      }

      const grp = cropGroupsMap.get(groupKey)!;
      grp.fieldCount += 1;
      if (crop.id) grp.cropIds.add(crop.id);
    });

    return Array.from(cropGroupsMap.values()).map((grp) => {
      const groupKey = grp.cropName.toLowerCase();

      const income = unifiedSalesRecords
        .filter((s) => {
          if (s.cropId && grp.cropIds.has(s.cropId)) return true;
          const sBase = getBaseCropName(s.cropName || '').toLowerCase();
          return sBase === groupKey;
        })
        .reduce((acc, s) => acc + s.totalAmount, 0);

      const expense = grp.fieldCount * perFieldExpense;
      const net = income - expense;

      return {
        cropName: grp.cropName,
        fieldCount: grp.fieldCount,
        income,
        expense,
        net,
      };
    });
  }, [farmerCrops, unifiedSalesRecords, totalSpent]);

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
    setCashBuyerMobile('');
    setSaleQuantity('');
    setAmountReceived('');
    setAmountReceivedMode('CASH');
    setSaleItems([]);
    setSaleError(null);
    setSavedInvoice(null);
    setIsCropDropdownOpen(false);
    setSaleDiscount('');
    setSaleDelivery('');
    setSaleDescription('');
    setEditingBillId(null);
    setEditingBillNo(null);
    setWasEditingBill(false);
    setEditingPreviousBalance(null);
  };

  const getCropMaxRateDetails = (cropName: string, userSetPrice?: string | number) => {
    const baseName = cropName.split('(')[0].trim().toLowerCase();

    // 1. All prices from farmer crops across the system
    const cropRates = (farmerCrops || [])
      .filter((c) => c.cropName.split('(')[0].trim().toLowerCase() === baseName)
      .map((c) => Number(c.maxPricePerUnit || c.pricePerUnit || 0))
      .filter((r) => r > 0);

    // 2. All sales rates from all sales records across the system
    const salesRates = (allSalesRecords || [])
      .filter((s) => s.cropName.split('(')[0].trim().toLowerCase() === baseName)
      .map((s) => Number(s.pricePerUnit || 0))
      .filter((r) => r > 0);

    const ownRate = Number(userSetPrice || 0);
    const allRates = [...cropRates, ...salesRates, ownRate];

    // Highest rate across all farmers
    const highestFarmerRate = allRates.length > 0 ? Math.max(...allRates) : 100;

    // Allowed rate is at most 10% above the highest rate across all farmers
    const maxAllowedRate = Math.round((highestFarmerRate > 0 ? highestFarmerRate : 100) * 1.10);

    return {
      highestFarmerRate,
      maxAllowedRate,
    };
  };

  const getCropEstimatedMaxRate = (cropName: string, userSetPrice?: string | number): number => {
    return getCropMaxRateDetails(cropName, userSetPrice).maxAllowedRate;
  };

  const onAddProductToCart = () => {
    setSaleError(null);
    const qty = Number(saleQuantity);
    const rate = Number(saleRate);
    if (!selectedFarmerCrop) {
      setSaleError('⚠️ Please select a crop first!');
      return;
    }
    if (!qty || qty <= 0 || !rate || rate <= 0) {
      setSaleError('⚠️ Please enter a valid sale quantity and rate.');
      return;
    }

    // Maximum rate rule: highest rate across all farmers + 10% max cap
    const { highestFarmerRate, maxAllowedRate } = getCropMaxRateDetails(
      selectedFarmerCrop.cropName,
      selectedFarmerCrop.maxPricePerUnit || selectedFarmerCrop.pricePerUnit
    );

    if (rate > maxAllowedRate) {
      setSaleError(
        `⚠️ Rate ₹${rate}/${selectedFarmerCrop.unit || 'unit'} exceeds maximum allowed limit! (Max allowed: ₹${maxAllowedRate.toLocaleString('en-IN')}/${selectedFarmerCrop.unit || 'unit'} [10% cap above highest farmer rate ₹${highestFarmerRate.toLocaleString('en-IN')}]).`
      );
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
      setSaleError('⚠️ Please add at least one product to the sale list.');
      return;
    }
    if (paymentMode === 'PARTY' && !selectedParty) {
      setSaleError('⚠️ Please select a party or choose Cash.');
      return;
    }

    // Validate estimated max rate (+10% cap over all farmers) for all items in the cart
    for (const item of saleItems) {
      const crop = farmerCrops.find((c) => c.id === item.cropId);
      const { highestFarmerRate, maxAllowedRate } = getCropMaxRateDetails(
        item.cropName,
        crop?.maxPricePerUnit || crop?.pricePerUnit
      );
      if (item.rate > maxAllowedRate) {
        setSaleError(
          `⚠️ Rate for ${item.cropName} (₹${item.rate}/${item.unit || 'unit'}) exceeds maximum allowed limit! (Max allowed: ₹${maxAllowedRate.toLocaleString('en-IN')}/${item.unit || 'unit'} [10% cap above highest farmer rate ₹${highestFarmerRate.toLocaleString('en-IN')}]).`
        );
        return;
      }
    }

    tap();
    setIsSavingSale(true);
    const cashName = cashBuyerName.trim();
    const buyerName = paymentMode === 'PARTY' && selectedParty ? selectedParty.name : cashName || 'Cash Sale';

    try {
      const currentReceivedMode = paymentMode === 'PARTY' ? amountReceivedMode : 'CASH';
      const billPayload = {
        billNo: editingBillNo || undefined,
        farmerName: user?.name || 'Farmer',
        partyId: paymentMode === 'PARTY' ? selectedParty?.id : undefined,
        partyName: paymentMode === 'PARTY' && selectedParty ? selectedParty.name : cashName || 'Cash',
        partyMobile: paymentMode === 'PARTY' ? selectedParty?.mobile ?? undefined : cashBuyerMobile.trim() || undefined,
        isCash: paymentMode === 'CASH',
        amountReceivedMode: currentReceivedMode,
        items: saleItems.map((i) => ({ cropId: i.cropId, cropName: i.cropName, unit: i.unit, qty: i.qty, rate: i.rate, amount: i.amount })),
        totalItems: totalCartItems,
        totalAmount: totalCartAmount,
        amountReceived: effectiveAmountReceived,
        thisSaleBalance,
        previousBalance: previousPartyBalance,
        netReceivable: paymentMode === 'PARTY' ? previousPartyBalance + thisSaleBalance : 0,
      };

      // Save/update the bill snapshot FIRST so its real DB id can be linked onto the ledger entry.
      let billNo = editingBillNo || `FK-${Date.now().toString().slice(-8)}`;
      let realDbBillId: string | undefined = undefined;
      
      if (editingBillId) {
        try {
          const updatedBill = await updateSaleBill.mutateAsync({
            id: editingBillId,
            payload: billPayload,
          });
          billNo = updatedBill.billNo || editingBillNo || billNo;
          realDbBillId = updatedBill.id;
        } catch {
          // If updating by ID failed, try updating by billNo if editingBillNo exists
          if (editingBillNo) {
            try {
              const updatedBill = await updateSaleBill.mutateAsync({
                id: editingBillNo,
                payload: billPayload,
              });
              billNo = updatedBill.billNo || editingBillNo;
              realDbBillId = updatedBill.id;
            } catch {
              try {
                const newBill = await createSaleBill.mutateAsync(billPayload);
                billNo = newBill.billNo || editingBillNo;
                realDbBillId = newBill.id;
              } catch {
                realDbBillId = undefined;
              }
            }
          } else {
            try {
              const newBill = await createSaleBill.mutateAsync(billPayload);
              billNo = newBill.billNo;
              realDbBillId = newBill.id;
            } catch {
              realDbBillId = undefined;
            }
          }
        }
      } else {
        try {
          const savedBill = await createSaleBill.mutateAsync(billPayload);
          billNo = savedBill.billNo;
          realDbBillId = savedBill.id;
        } catch {
          realDbBillId = undefined;
        }
      }

      if (paymentMode === 'PARTY' && selectedParty) {
        const modeLabel = effectiveAmountReceived > 0 ? ` (${currentReceivedMode})` : '';
        const realBillNoStr = billNo ? ` (${billNo})` : '';
        const reason = `Sale: ${saleItems.map((i) => i.cropName).join(', ')} (${totalCartItems} item${totalCartItems > 1 ? 's' : ''})${modeLabel}${realBillNoStr}`;
        try {
          const validBillIdToPass = realDbBillId || (editingBillId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingBillId) ? editingBillId : undefined);
          await recordSaleLedger.mutateAsync({
            id: selectedParty.id,
            payload: {
              totalAmount: totalCartAmount,
              amountReceived: effectiveAmountReceived,
              reason,
              saleBillId: validBillIdToPass,
            },
          });
        } catch (ledgerErr) {
          console.warn('Could not record party ledger entry:', ledgerErr);
        }
      }

      if (editingBillId) {
        const targetBillId = realDbBillId || editingBillId;
        const existingSales = allSalesRecords.filter(
          (s) =>
            (s.billId && (s.billId === editingBillId || s.billId === editingBillNo || (realDbBillId && s.billId === realDbBillId))) ||
            (s.billNo && (s.billNo === editingBillNo || s.billNo === editingBillId)) ||
            s.id === editingBillId
        );

        if (existingSales.length > 0) {
          saleItems.forEach((item, index) => {
            if (index < existingSales.length) {
              const existing = existingSales[index];
              updateSale(existing.id, {
                cropName: item.cropName,
                quantity: String(item.qty),
                pricePerUnit: String(item.rate),
                buyerName,
                totalAmount: item.amount,
                amountReceived: effectiveAmountReceived,
                previousBalance: previousPartyBalance,
                amountReceivedMode: currentReceivedMode,
                notes: saleDescription.trim(),
                billId: targetBillId,
                billNo,
                partyId: paymentMode === 'PARTY' ? selectedParty?.id : undefined,
              }).catch(() => {});
            } else if (item.cropId) {
              recordSale(item.cropId, {
                quantity: String(item.qty),
                rate: String(item.rate),
                buyerName,
                billId: targetBillId,
                amountReceived: effectiveAmountReceived,
                previousBalance: previousPartyBalance,
                amountReceivedMode: currentReceivedMode,
              }).catch(() => {});
            }
          });

          if (existingSales.length > saleItems.length) {
            for (let i = saleItems.length; i < existingSales.length; i++) {
              deleteSale(existingSales[i].id).catch(() => {});
            }
          }
        }
      } else {
        saleItems.forEach((item) => {
          if (item.cropId) {
            recordSale(item.cropId, {
              quantity: String(item.qty),
              rate: String(item.rate),
              buyerName,
              billId: realDbBillId,
              amountReceived: effectiveAmountReceived,
              previousBalance: previousPartyBalance,
              amountReceivedMode: currentReceivedMode,
            }).catch(() => {});
          }
        });
      }

      await queryClient.refetchQueries({ queryKey: ['sale-bills', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['sale-bills'] });
      queryClient.invalidateQueries({ queryKey: ['market-rates'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-crops'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['parties', 'statement'] });

      const now = new Date();
      const invoice: SavedSaleInvoice = {
        billNo,
        farmerName: billPayload.farmerName,
        partyId: billPayload.partyId,
        partyName: billPayload.partyName,
        partyMobile: billPayload.partyMobile,
        isCash: billPayload.isCash,
        amountReceivedMode: currentReceivedMode,
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
      setWasEditingBill(Boolean(editingBillId));
      setEditingBillId(null);
      setEditingBillNo(null);
      setSavedInvoice(invoice);
      setSaleStep('SAVED');
    } catch (err: any) {
      console.error('Save sale failed:', err);
      const serverMsg = err?.response?.data?.message || err?.message;
      const displayMsg = Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg;
      setSaleError(displayMsg ? `⚠️ ${displayMsg}` : 'Failed to save sale. Please try again.');
    } finally {
      setIsSavingSale(false);
    }
  };

  const resetExpenseForm = () => {
    setEditingExpenseId(null);
    setAmount('');
    setVendorName('');
    setQuantity('');
    setUnit('');
    setNotes('');
    setExpenseError(null);
    setExpenseCropType('CROP');
    setExpenseCropId(undefined);
  };

  const handleOpenEditExpense = (item: any) => {
    tap();
    setEditingExpenseId(item.id);
    setAmount(String(item.amount));
    setExpenseDate(item.expenseDate ? item.expenseDate.slice(0, 10) : todayIso());
    if (item.categoryId) setCategoryId(item.categoryId);
    setVendorName(item.vendorName || '');
    setNotes(item.notes || '');
    setQuantity(item.quantity ? String(item.quantity) : '');
    setUnit(item.unit || '');
    if (item.cropCycleId) {
      setExpenseCropType('CROP');
      setExpenseCropId(item.cropCycleId);
    } else {
      setExpenseCropType('OTHER');
      setExpenseCropId(undefined);
    }
    setExpenseError(null);
    setShowExpenseForm(true);
  };

  const onAddExpense = async () => {
    setExpenseError(null);
    const amountNum = Number(amount);
    if (!selectedFarmId) {
      setExpenseError('⚠️ Please select a farm first.');
      return;
    }
    const activeCatId = categoryId || displayCategories[0]?.id;

    if (!amountNum || amountNum <= 0) {
      setExpenseError('⚠️ Enter a valid expense amount.');
      return;
    }
    if ((expensePaymentMode === 'CREDIT' || expenseRecipientType === 'SUPPLIER' || expenseRecipientType === 'LABOUR') && !expenseParty) {
      if (expenseRecipientType === 'SUPPLIER' || expenseRecipientType === 'LABOUR') {
        setExpenseError('⚠️ Kripya party ya worker select karein.');
        return;
      }
    }

    // Determine target farmId and plotId from crop if tagged to a crop
    let targetFarmId = selectedFarmId;
    let targetPlotId = plotId;

    if (expenseCropId) {
      const targetCrop = (myRealCrops ?? []).find((c) => c.id === expenseCropId);
      if (targetCrop && targetCrop.plot) {
        if (targetCrop.plot.farmId) targetFarmId = targetCrop.plot.farmId;
        if (targetCrop.plot.id) targetPlotId = targetCrop.plot.id;
      }
    }

    // Compose notes with labour work type & quantity if applicable
    const noteParts: string[] = [];
    if (expenseRecipientType === 'LABOUR') {
      const selectedWorkTypeObj = LABOUR_WORK_TYPES.find((w) => w.id === labourWorkType);
      if (selectedWorkTypeObj) {
        noteParts.push(`Work: ${selectedWorkTypeObj.label}`);
      }
    }
    if (quantity) {
      noteParts.push(`Qty: ${quantity} ${unit || ''}`.trim());
    }
    if (notes.trim()) {
      noteParts.push(notes.trim());
    }
    const combinedNotes = noteParts.length > 0 ? noteParts.join(' | ') : undefined;

    try {
      if (editingExpenseId) {
        await updateExpense.mutateAsync({
          id: editingExpenseId,
          payload: {
            categoryId: activeCatId,
            cropCycleId: expenseCropId,
            amount: amountNum,
            expenseDate: expenseDate || todayIso(),
            plotId: targetPlotId,
            paymentMode: expensePaymentMode,
            partyId: expenseRecipientType !== 'CASH' ? expenseParty?.id : undefined,
            vendorName: expenseRecipientType === 'CASH' ? vendorName.trim() || undefined : expenseParty?.name,
            quantity: quantity ? Number(quantity) : undefined,
            unit: unit.trim() || undefined,
            notes: combinedNotes,
          },
        });
      } else {
        await createExpense.mutateAsync({
          farmId: targetFarmId,
          categoryId: activeCatId,
          cropCycleId: expenseCropId,
          amount: amountNum,
          expenseDate: expenseDate || todayIso(),
          plotId: targetPlotId,
          paymentMode: expensePaymentMode,
          partyId: expenseRecipientType !== 'CASH' ? expenseParty?.id : undefined,
          vendorName: expenseRecipientType === 'CASH' ? vendorName.trim() || undefined : expenseParty?.name,
          quantity: quantity ? Number(quantity) : undefined,
          unit: unit.trim() || undefined,
          notes: combinedNotes,
        });
      }

      const createdVoucherData: UniversalVoucherData = {
        voucherType: 'EXPENSE',
        title: editingExpenseId ? '🔴 UPDATED FARM EXPENSE SLIP' : '🔴 FARM EXPENSE STATEMENT SLIP',
        voucherNo: editingExpenseId ? `EXP-${editingExpenseId.slice(0, 6).toUpperCase()}` : `EXP-${Date.now().toString().slice(-6)}`,
        date: expenseDate || todayIso(),
        farmerName: user?.name || 'Farmer',
        farmerPhone: user?.mobile || '',
        farmerVillage: user?.village || '',
        partyName: expenseParty?.name || vendorName.trim() || (expenseRecipientType === 'LABOUR' ? 'Labour Worker' : 'Direct / Cash Vendor'),
        partyPhone: expenseParty?.mobile || undefined,
        partyRole: expenseRecipientType === 'LABOUR' ? 'Labour Worker' : expenseRecipientType === 'SUPPLIER' ? 'Supplier / Trader' : 'Cash Vendor',
        amount: amountNum,
        paymentMode: expensePaymentMode === 'CREDIT' ? 'CREDIT / Khata' : 'CASH / Direct',
        categoryOrWorkType: displayCategories.find((c) => c.id === activeCatId)?.labelEn || (expenseRecipientType === 'LABOUR' ? labourWorkType : 'Farm Expense'),
        description: combinedNotes,
      };

      resetExpenseForm();
      setShowExpenseForm(false);
      setActiveVoucherData(createdVoucherData);
      setShowVoucherSlipModal(true);
    } catch (err: any) {
      console.error('Create expense error:', err);
      const serverMsg = err?.response?.data?.message || err?.message;
      const displayMsg = Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg;
      setExpenseError(displayMsg ? `⚠️ ${displayMsg}` : 'Failed to save expense. Please try again.');
    }
  };

  const openExpenseSlipPreview = (item: any) => {
    tap();
    setActiveVoucherData({
      voucherType: 'EXPENSE',
      title: '🔴 FARM EXPENSE STATEMENT SLIP',
      voucherNo: `EXP-${item.id.slice(0, 6).toUpperCase()}`,
      date: item.expenseDate ? item.expenseDate.slice(0, 10) : todayIso(),
      farmerName: user?.name || 'Farmer',
      farmerPhone: user?.mobile || '',
      farmerVillage: user?.village || '',
      partyName: item.vendorName || (item.party ? item.party.name : 'Direct Cash Vendor'),
      partyPhone: item.party ? item.party.mobile : undefined,
      partyRole: item.vendorName ? 'Vendor / Merchant' : 'Farm Expense',
      amount: Number(item.amount),
      paymentMode: item.paymentMode || 'CASH',
      categoryOrWorkType: item.category ? item.category.labelEn : 'Farm Input Expense',
      description: item.notes || undefined,
    });
    setShowVoucherSlipModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Accounts</Text>
        <Text style={styles.heroSubtitle}>Track sales revenue & combined farm expenses</Text>

        {/* Tab Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingRight: 16 }}>
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

          <TouchableOpacity
            style={[styles.tabBtn, recordType === 'LABOUR' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setRecordType('LABOUR');
            }}
          >
            <Ionicons name="people" size={15} color={recordType === 'LABOUR' ? theme.primary : '#fff'} />
            <Text style={[styles.tabBtnText, recordType === 'LABOUR' && styles.tabBtnTextActive]}>
              Labour
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, recordType === 'PARTIES' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setRecordType('PARTIES');
            }}
          >
            <Ionicons name="people-circle-outline" size={15} color={recordType === 'PARTIES' ? theme.primary : '#fff'} />
            <Text style={[styles.tabBtnText, recordType === 'PARTIES' && styles.tabBtnTextActive]}>
              Parties
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
                {(
                  [
                    { id: 'MONTH', label: '📅 This Month' },
                    { id: 'TODAY', label: '📆 Today' },
                    { id: 'PERIOD', label: '🗓️ Custom Period' },
                    { id: 'BUYER', label: '🤝 Buyer-wise' },
                    { id: 'ALL', label: '🌐 All Time' },
                  ] as const
                ).map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.salesViewModeChip, salesViewMode === mode.id && styles.salesViewModeChipActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setSalesViewMode(mode.id);
                      setExpandedSalesGroup(null);
                    }}
                  >
                    <Text style={[styles.salesViewModeChipText, salesViewMode === mode.id && styles.salesViewModeChipTextActive]}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Period Date Range Bar */}
              {salesViewMode === 'PERIOD' && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  borderRadius: RADIUS.md,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  marginBottom: 8,
                  gap: 8,
                }}>
                  {/* From Date */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#64748b', marginBottom: 2 }}>FROM DATE</Text>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 5 }}
                      onPress={() => { tap(); setShowFromDatePicker(true); }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>{formatDateDDMMYYYY(salesFromDate)}</Text>
                      <Ionicons name="calendar" size={14} color="#16a34a" />
                    </TouchableOpacity>
                  </View>

                  <Ionicons name="arrow-forward" size={14} color="#64748b" style={{ marginTop: 12 }} />

                  {/* To Date */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#64748b', marginBottom: 2 }}>TO DATE</Text>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 5 }}
                      onPress={() => { tap(); setShowToDatePicker(true); }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>{formatDateDDMMYYYY(salesToDate)}</Text>
                      <Ionicons name="calendar" size={14} color="#16a34a" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Interactive Calendar Modals for Custom Period Selection */}
              {renderPeriodCalendarModal(
                '📅 Select From Date',
                salesFromDate,
                setSalesFromDate,
                showFromDatePicker,
                () => setShowFromDatePicker(false)
              )}
              {renderPeriodCalendarModal(
                '📅 Select To Date',
                salesToDate,
                setSalesToDate,
                showToDatePicker,
                () => setShowToDatePicker(false)
              )}

              {activeSalesList.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="cart-outline" size={36} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No sales recorded for this period.</Text>
                  <Text style={styles.emptySub}>Tap "+ Sale" to log revenue from your harvested crops.</Text>
                </View>
              ) : (salesViewMode !== 'BUYER') ? (
                <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, overflow: 'hidden', backgroundColor: '#ffffff', marginBottom: 16 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: 560, flexGrow: 1 }}>
                    <View style={{ flex: 1, minWidth: 560 }}>
                      {/* Table Header Row */}
                      <View style={{ flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', minWidth: 560 }}>
                        <Text style={{ width: 75, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>BILL NO.</Text>
                        <Text style={{ width: 70, fontSize: 9.5, fontFamily: FONT.bold, color: '#e2e8f0' }}>DATE</Text>
                        <Text style={{ width: 105, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>PARTY</Text>
                        <Text style={{ flex: 1.5, minWidth: 140, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>BILL ITEMS</Text>
                        <Text style={{ width: 110, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'right', paddingRight: 6 }}>NET SALE AMT</Text>
                        <Text style={{ width: 60, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'center' }}>ACTION</Text>
                      </View>

                      {/* Table Body Rows */}
                      <FlatList
                        data={activeSalesList}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => renderSaleRowItem(item, index)}
                      />
                    </View>
                  </ScrollView>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                  {salesByBuyer.map((group) => {
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
                            🤝 Buyer: {group.name} <Text style={styles.salesGroupCount}>({group.entries.length})</Text>
                          </Text>
                          <Text style={styles.salesGroupTotal}>{formatInr(group.total)}</Text>
                        </TouchableOpacity>
                        {isExpanded ? (
                          <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, overflow: 'hidden', backgroundColor: '#ffffff', marginTop: 6 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: 560, flexGrow: 1 }}>
                              <View style={{ flex: 1, minWidth: 560 }}>
                                <View style={{ flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 7, paddingHorizontal: 8, alignItems: 'center', minWidth: 560 }}>
                                  <Text style={{ width: 75, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>BILL NO.</Text>
                                  <Text style={{ width: 70, fontSize: 9.5, fontFamily: FONT.bold, color: '#e2e8f0' }}>DATE</Text>
                                  <Text style={{ width: 105, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>PARTY</Text>
                                  <Text style={{ flex: 1.5, minWidth: 140, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>BILL ITEMS</Text>
                                  <Text style={{ width: 110, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'right', paddingRight: 6 }}>NET SALE AMT</Text>
                                  <Text style={{ width: 60, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'center' }}>ACTION</Text>
                                </View>
                                {group.entries.map((item, idx) => renderSaleRowItem(item, idx))}
                              </View>
                            </ScrollView>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* Sale Form Modal */}
              <Modal visible={showSaleForm} transparent animationType="slide" onRequestClose={() => setShowSaleForm(false)}>
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalCard, { width: '96%', maxWidth: 600, maxHeight: '94%', padding: isMobile ? 10 : 16, paddingBottom: 20 }]}>
                    {saleStep === 'FORM' ? (
                      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* Header Bar with Date at Top */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                          <View>
                            <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: theme.text }}>
                              {editingBillId ? `✏️ Edit Sale / Bill #${editingBillNo}` : 'New Sale / Billing'}
                            </Text>
                            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                              {editingBillId ? `Updating record for Bill #${editingBillNo} (Bill # stays unchanged)` : 'Vyapar Billing POS — Cash or Party Credit Sale'}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {/* Date Field at Top — Calendar Picker */}
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6 }}
                              onPress={() => { tap(); setShowSaleDatePicker(true); }}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="calendar-outline" size={14} color="#16a34a" />
                              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>{formatDateDDMMYYYY(saleDate)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setShowSaleForm(false)}
                              style={{ padding: 4, borderRadius: RADIUS.pill, backgroundColor: '#f1f5f9' }}
                            >
                              <Ionicons name="close" size={18} color="#475569" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Mini Calendar Date Picker Overlay */}
                        {showSaleDatePicker && (
                          <View style={{ position: 'relative', zIndex: 999 }}>
                            <TouchableOpacity style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' }} onPress={() => setShowSaleDatePicker(false)} activeOpacity={1} />
                            <View style={{ position: 'absolute', top: 0, right: 0, zIndex: 1000, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, width: 260, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
                              {/* Month/Year Navigation */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <TouchableOpacity onPress={() => shiftCalMonth(-1)} style={{ padding: 4 }}>
                                  <Ionicons name="chevron-back" size={18} color="#475569" />
                                </TouchableOpacity>
                                <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>{calMonthNames[calData.month]} {calData.year}</Text>
                                <TouchableOpacity onPress={() => shiftCalMonth(1)} style={{ padding: 4 }}>
                                  <Ionicons name="chevron-forward" size={18} color="#475569" />
                                </TouchableOpacity>
                              </View>
                              {/* Day Names Header */}
                              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                                {calDayNames.map((dn) => (
                                  <Text key={dn} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8' }}>{dn}</Text>
                                ))}
                              </View>
                              {/* Day Grid */}
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {Array.from({ length: calData.firstDay }).map((_, i) => (
                                  <View key={`empty-${i}`} style={{ width: '14.28%', height: 32 }} />
                                ))}
                                {Array.from({ length: calData.daysInMonth }).map((_, i) => {
                                  const day = i + 1;
                                  const selDay = parseInt(saleDate.split('-')[2], 10);
                                  const isSelected = day === selDay;
                                  return (
                                    <TouchableOpacity
                                      key={day}
                                      onPress={() => selectCalDay(day)}
                                      style={{ width: '14.28%', height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 16, backgroundColor: isSelected ? '#16a34a' : 'transparent' }}
                                    >
                                      <Text style={{ fontSize: 12, fontFamily: isSelected ? FONT.bold : FONT.medium, color: isSelected ? '#ffffff' : '#334155' }}>{day}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                              {/* Today Button */}
                              <TouchableOpacity
                                onPress={() => { setSaleDate(todayIso()); setShowSaleDatePicker(false); }}
                                style={{ marginTop: 8, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 5, borderRadius: RADIUS.pill, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }}
                              >
                                <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' }}>Today</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {/* Payment Mode & Party Picker Bar (Responsive!) */}
                        <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 }}>
                          <View style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8 }}>
                            {/* Payment Mode Toggles */}
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                              <TouchableOpacity
                                style={[styles.paymentModeChip, { flex: isMobile ? 1 : 0, paddingVertical: 6, paddingHorizontal: 10 }, paymentMode === 'CASH' && styles.paymentModeChipActive]}
                                onPress={() => {
                                  tap();
                                  setPaymentMode('CASH');
                                  setSelectedParty(null);
                                }}
                              >
                                <Ionicons name="cash-outline" size={13} color={paymentMode === 'CASH' ? '#fff' : '#475569'} />
                                <Text style={[styles.paymentModeChipText, { fontSize: 11.5 }, paymentMode === 'CASH' && styles.paymentModeChipTextActive]}>Cash</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.paymentModeChip, { flex: isMobile ? 1 : 0, paddingVertical: 6, paddingHorizontal: 10 }, paymentMode === 'PARTY' && styles.paymentModeChipActive]}
                                onPress={() => {
                                  tap();
                                  setPaymentMode('PARTY');
                                }}
                              >
                                <Ionicons name="people-outline" size={13} color={paymentMode === 'PARTY' ? '#fff' : '#475569'} />
                                <Text style={[styles.paymentModeChipText, { fontSize: 11.5 }, paymentMode === 'PARTY' && styles.paymentModeChipTextActive]}>Party</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Party Search + Add Party Button */}
                            {paymentMode === 'PARTY' ? (
                              <View style={{ flex: 1 }}>
                                <PartyPicker
                                  parties={parties}
                                  labourWorkers={expenseLabourWorkers}
                                  selectedParty={selectedParty}
                                  onSelect={setSelectedParty}
                                  onCreate={async (payload) => createParty.mutateAsync(payload)}
                                  accentColor="#16a34a"
                                  hideLabel
                                  inlineAddButton
                                  placeholder="Select or search party..."
                                />
                              </View>
                            ) : (
                              <View style={{ flex: 1, flexDirection: isMobile ? 'column' : 'row', gap: 6 }}>
                                <TextInput
                                  style={[styles.input, { flex: 1, paddingVertical: 5, fontSize: 12, height: 38 }]}
                                  placeholder="Buyer Name (Optional)"
                                  placeholderTextColor="#94a3b8"
                                  value={cashBuyerName}
                                  onChangeText={setCashBuyerName}
                                />
                                <TextInput
                                  style={[styles.input, { flex: 1, paddingVertical: 5, fontSize: 12, height: 38 }]}
                                  placeholder="Buyer Mobile (Optional)"
                                  placeholderTextColor="#94a3b8"
                                  keyboardType="phone-pad"
                                  maxLength={10}
                                  value={cashBuyerMobile}
                                  onChangeText={setCashBuyerMobile}
                                />
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Product Entry Box — Responsive Mobile & Desktop Layout */}
                        <View style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10, zIndex: 50 }}>
                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155', marginBottom: 6 }}>📦 Add Item</Text>

                          {isMobile ? (
                            <View style={{ gap: 8 }}>
                              {/* 1. Product Dropdown (Full Width on Mobile - Inline Touch Responsive) */}
                              <View style={{ width: '100%' }}>
                                <TouchableOpacity
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderWidth: 1.5,
                                    borderColor: isCropDropdownOpen ? '#16a34a' : '#cbd5e1',
                                    borderRadius: RADIUS.md,
                                    paddingHorizontal: 10,
                                    height: 40,
                                    backgroundColor: '#f8fafc',
                                  }}
                                  onPress={() => { tap(); setIsCropDropdownOpen((prev) => !prev); }}
                                  activeOpacity={0.8}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                    <Ionicons name="cube-outline" size={16} color="#16a34a" />
                                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: selectedFarmerCrop ? '#0f172a' : '#94a3b8' }} numberOfLines={1}>
                                      {selectedFarmerCrop ? `${selectedFarmerCrop.cropName} (${selectedFarmerCrop.unit})` : 'Select Product / Crop'}
                                    </Text>
                                  </View>
                                  <Ionicons name={isCropDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#64748b" />
                                </TouchableOpacity>

                                {isCropDropdownOpen && (
                                  <View style={{
                                    marginTop: 6,
                                    backgroundColor: '#ffffff',
                                    borderRadius: RADIUS.md,
                                    borderWidth: 1.5,
                                    borderColor: '#16a34a',
                                    maxHeight: 200,
                                    padding: 4,
                                  }}>
                                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                      {farmerCrops.map((crop) => (
                                        <TouchableOpacity
                                          key={crop.id}
                                          style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingHorizontal: 12,
                                            paddingVertical: 9,
                                            borderRadius: RADIUS.sm,
                                            marginBottom: 3,
                                            backgroundColor: crop.id === selectedCropId ? '#f0fdf4' : '#f8fafc',
                                            borderWidth: 1,
                                            borderColor: crop.id === selectedCropId ? '#bbf7d0' : '#e2e8f0',
                                          }}
                                          onPress={() => {
                                            tap();
                                            handleSelectFarmerCrop(crop.id);
                                            setIsCropDropdownOpen(false);
                                          }}
                                        >
                                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Ionicons name="leaf-outline" size={16} color={crop.id === selectedCropId ? '#16a34a' : '#64748b'} />
                                            <Text style={{ fontSize: 13, fontFamily: crop.id === selectedCropId ? FONT.bold : FONT.medium, color: crop.id === selectedCropId ? '#16a34a' : '#0f172a' }}>
                                              {crop.cropName}
                                            </Text>
                                          </View>
                                          <View style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>{crop.unit}</Text>
                                          </View>
                                        </TouchableOpacity>
                                      ))}
                                    </ScrollView>
                                  </View>
                                )}
                              </View>

                              {/* 2. QTY, Rate, Amount Row */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <View style={{ flex: 1 }}>
                                  <TextInput
                                    style={[styles.input, { height: 38, paddingVertical: 4, paddingHorizontal: 5, fontSize: 12 }]}
                                    placeholder={`QTY (${selectedFarmerCrop?.unit || 'Kg'})`}
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={saleQuantity}
                                    onChangeText={setSaleQuantity}
                                  />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <TextInput
                                    style={[styles.input, { height: 38, paddingVertical: 4, paddingHorizontal: 5, fontSize: 12 }]}
                                    placeholder="RATE (₹)"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={saleRate}
                                    onChangeText={setSaleRate}
                                  />
                                </View>
                                <View style={{
                                  flex: 1.2,
                                  height: 38,
                                  backgroundColor: '#f0fdf4',
                                  borderWidth: 1,
                                  borderColor: '#bbf7d0',
                                  borderRadius: RADIUS.md,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  paddingHorizontal: 2,
                                }}>
                                  <Text style={{ fontSize: 9, fontFamily: FONT.medium, color: '#15803d' }}>AMOUNT</Text>
                                  <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#16a34a' }} numberOfLines={1}>
                                    ₹{((Number(saleQuantity) || 0) * (Number(saleRate) || 0)).toLocaleString('en-IN')}
                                  </Text>
                                </View>
                              </View>

                              {/* 3. Full width Add button on mobile */}
                              <TouchableOpacity
                                style={{
                                  height: 38,
                                  backgroundColor: '#16a34a',
                                  borderRadius: RADIUS.md,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4,
                                }}
                                activeOpacity={0.85}
                                onPress={onAddProductToCart}
                              >
                                <Ionicons name="add-circle" size={16} color="#ffffff" />
                                <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12.5 }}>Add Item to List</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              {/* 1. Product Dropdown */}
                              <View style={{ flex: 2, position: 'relative' }}>
                                <TouchableOpacity
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderWidth: 1.5,
                                    borderColor: isCropDropdownOpen ? '#16a34a' : '#cbd5e1',
                                    borderRadius: RADIUS.md,
                                    paddingHorizontal: 8,
                                    height: 38,
                                    backgroundColor: '#f8fafc',
                                  }}
                                  onPress={() => { tap(); setIsCropDropdownOpen((prev) => !prev); }}
                                >
                                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: selectedFarmerCrop ? '#0f172a' : '#94a3b8' }} numberOfLines={1}>
                                    {selectedFarmerCrop ? selectedFarmerCrop.cropName : 'Select Product'}
                                  </Text>
                                  <Ionicons name={isCropDropdownOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#64748b" />
                                </TouchableOpacity>

                                {isCropDropdownOpen && (
                                  <View style={{
                                    position: 'absolute',
                                    top: 42,
                                    left: 0,
                                    right: 0,
                                    zIndex: 100,
                                    backgroundColor: '#ffffff',
                                    borderRadius: RADIUS.md,
                                    borderWidth: 1.5,
                                    borderColor: '#16a34a',
                                    maxHeight: 190,
                                    elevation: 8,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.15,
                                    shadowRadius: 6,
                                    shadowOffset: { width: 0, height: 3 },
                                  }}>
                                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                      {farmerCrops.map((crop) => (
                                        <TouchableOpacity
                                          key={crop.id}
                                          style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 8,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f1f5f9',
                                            backgroundColor: crop.id === selectedCropId ? '#f0fdf4' : '#ffffff',
                                          }}
                                          onPress={() => {
                                            tap();
                                            handleSelectFarmerCrop(crop.id);
                                            setIsCropDropdownOpen(false);
                                          }}
                                        >
                                          <Text style={{ fontSize: 12, fontFamily: crop.id === selectedCropId ? FONT.bold : FONT.medium, color: crop.id === selectedCropId ? '#16a34a' : '#0f172a' }}>
                                            🌾 {crop.cropName} ({crop.unit})
                                          </Text>
                                        </TouchableOpacity>
                                      ))}
                                    </ScrollView>
                                  </View>
                                )}
                              </View>

                              {/* 2. Quantity Input */}
                              <View style={{ flex: 1 }}>
                                <TextInput
                                  style={[styles.input, { height: 38, paddingVertical: 4, paddingHorizontal: 5, fontSize: 12 }]}
                                  placeholder={`QTY (${selectedFarmerCrop?.unit || 'Kg'})`}
                                  placeholderTextColor="#94a3b8"
                                  keyboardType="numeric"
                                  value={saleQuantity}
                                  onChangeText={setSaleQuantity}
                                />
                              </View>

                              {/* 3. Rate Input */}
                              <View style={{ flex: 1 }}>
                                <TextInput
                                  style={[styles.input, { height: 38, paddingVertical: 4, paddingHorizontal: 5, fontSize: 12 }]}
                                  placeholder="RATE (₹)"
                                  placeholderTextColor="#94a3b8"
                                  keyboardType="numeric"
                                  value={saleRate}
                                  onChangeText={setSaleRate}
                                />
                              </View>

                              {/* 4. Amount Subtotal */}
                              <View style={{
                                flex: 1.2,
                                height: 38,
                                backgroundColor: '#f0fdf4',
                                borderWidth: 1,
                                borderColor: '#bbf7d0',
                                borderRadius: RADIUS.md,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 2,
                              }}>
                                <Text style={{ fontSize: 9, fontFamily: FONT.medium, color: '#15803d' }}>AMOUNT</Text>
                                <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#16a34a' }} numberOfLines={1}>
                                  ₹{((Number(saleQuantity) || 0) * (Number(saleRate) || 0)).toLocaleString('en-IN')}
                                </Text>
                              </View>

                              {/* 5. Add Item Button */}
                              <TouchableOpacity
                                style={{
                                  flex: 1.1,
                                  height: 38,
                                  backgroundColor: '#16a34a',
                                  borderRadius: RADIUS.md,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 2,
                                  paddingHorizontal: 4,
                                }}
                                activeOpacity={0.85}
                                onPress={onAddProductToCart}
                              >
                                <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 }}>Add</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>

                        {/* Cart Table with Column-aligned Totals! */}
                        {saleItems.length > 0 && (
                          <View style={[styles.cartTable, { marginTop: 4, marginBottom: 10 }]}>
                            <View style={[styles.cartHeaderRow, { paddingVertical: 5 }]}>
                              <Text style={[styles.cartHeaderCell, { flex: 1.8, fontSize: 10 }]}>PRODUCT</Text>
                              <Text style={[styles.cartHeaderCell, { flex: 1, fontSize: 10, textAlign: 'right' }]}>QTY</Text>
                              <Text style={[styles.cartHeaderCell, { flex: 1, fontSize: 10, textAlign: 'right' }]}>RATE</Text>
                              <Text style={[styles.cartHeaderCell, { flex: 1.2, fontSize: 10, textAlign: 'right' }]}>AMOUNT</Text>
                              <View style={{ width: 20 }} />
                            </View>
                            {saleItems.map((item) => (
                              <View key={item.id} style={[styles.cartRow, { paddingVertical: 5 }]}>
                                <Text style={[styles.cartCell, { flex: 1.8, fontFamily: FONT.bold, fontSize: 11.5 }]}>{item.cropName}</Text>
                                <Text style={[styles.cartCell, { flex: 1, fontSize: 11.5, textAlign: 'right' }]}>{item.qty} {item.unit}</Text>
                                <Text style={[styles.cartCell, { flex: 1, fontSize: 11.5, textAlign: 'right' }]}>₹{item.rate}</Text>
                                <Text style={[styles.cartCell, { flex: 1.2, fontSize: 11.5, fontFamily: FONT.bold, color: '#16a34a', textAlign: 'right' }]}>₹{item.amount.toLocaleString('en-IN')}</Text>
                                <TouchableOpacity onPress={() => onRemoveCartItem(item.id)} style={{ width: 20, alignItems: 'center' }}>
                                  <Ionicons name="close-circle" size={15} color="#dc2626" />
                                </TouchableOpacity>
                              </View>
                            ))}
                            {/* Summary Footer Row - Totals strictly under their respective columns! */}
                            <View style={[styles.cartTotalsRow, { paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }]}>
                              <Text style={[styles.cartTotalsLabel, { flex: 1.8, fontSize: 11 }]}>Items Total: {totalCartItems}</Text>
                              <Text style={[styles.cartTotalsLabel, { flex: 1, fontSize: 11, color: '#0f172a', textAlign: 'right' }]}>Qty: {totalCartQty}</Text>
                              <View style={{ flex: 1 }} />
                              <Text style={[styles.cartTotalsValue, { flex: 1.2, fontSize: 12.5, textAlign: 'right' }]}>Total: {formatInr(totalCartAmount)}</Text>
                              <View style={{ width: 20 }} />
                            </View>
                          </View>
                        )}

                        {/* Billing Calculation Section */}
                        {saleItems.length > 0 && (
                          <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md, padding: 10, marginBottom: 10 }}>
                            {/* Top Row: Sale Amount, Discount (-), Delivery (+) */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                                Sale Amount: <Text style={{ fontFamily: FONT.bold, color: '#0f172a' }}>{formatInr(totalCartAmount)}</Text>
                              </Text>

                              {/* Discount & Delivery inline */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fef2f2', borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#fecaca' }}>
                                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#dc2626' }}>Discount (-)</Text>
                                  <TextInput
                                    style={{ fontSize: 11, fontFamily: FONT.bold, color: '#dc2626', padding: 0, width: 42, textAlign: 'right' }}
                                    placeholder="0"
                                    placeholderTextColor="#fca5a5"
                                    keyboardType="numeric"
                                    value={saleDiscount}
                                    onChangeText={setSaleDiscount}
                                  />
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#eff6ff', borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#bfdbfe' }}>
                                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#2563eb' }}>Delivery (+)</Text>
                                  <TextInput
                                    style={{ fontSize: 11, fontFamily: FONT.bold, color: '#2563eb', padding: 0, width: 42, textAlign: 'right' }}
                                    placeholder="0"
                                    placeholderTextColor="#93c5fd"
                                    keyboardType="numeric"
                                    value={saleDelivery}
                                    onChangeText={setSaleDelivery}
                                  />
                                </View>
                              </View>
                            </View>

                            <View style={{ borderTopWidth: 1, borderTopColor: '#cbd5e1', borderStyle: 'dashed', marginBottom: 8 }} />

                            {/* Net Sale Amount & Previous Balance Breakdown */}
                            <View style={{ backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>Net Sale Amount:</Text>
                                <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                                  {formatInr(totalCartAmount - (Number(saleDiscount) || 0) + (Number(saleDelivery) || 0))}
                                </Text>
                              </View>

                              {paymentMode === 'PARTY' && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#d97706' }}>Previous Balance (+):</Text>
                                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#d97706' }}>{formatInr(previousPartyBalance)}</Text>
                                </View>
                              )}

                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 4, marginTop: 2 }}>
                                <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#16a34a' }}>
                                  {paymentMode === 'CASH' ? 'Cash Received:' : 'Net Receivable Amount:'}
                                </Text>
                                <Text style={{ fontSize: 12.5, fontFamily: FONT.extraBold, color: '#16a34a' }}>
                                  {formatInr(
                                    (totalCartAmount - (Number(saleDiscount) || 0) + (Number(saleDelivery) || 0)) +
                                    (paymentMode === 'PARTY' ? previousPartyBalance : 0)
                                  )}
                                </Text>
                              </View>
                            </View>

                            {/* Received Amount Input: [Label Left] [Radio Cash/UPI Middle] [TextInput Right Aligned] */}
                            {paymentMode === 'PARTY' ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
                                {/* 1. Label on left */}
                                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' }}>
                                  Amount Received Now (₹)
                                </Text>

                                {/* 2. Cash / UPI Radio Options in middle */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                      tap();
                                      setAmountReceivedMode('CASH');
                                    }}
                                  >
                                    <Ionicons
                                      name={amountReceivedMode === 'CASH' ? 'radio-button-on' : 'radio-button-off'}
                                      size={14}
                                      color={amountReceivedMode === 'CASH' ? '#16a34a' : '#94a3b8'}
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontFamily: amountReceivedMode === 'CASH' ? FONT.bold : FONT.medium,
                                        color: amountReceivedMode === 'CASH' ? '#16a34a' : '#64748b',
                                      }}
                                    >
                                      Cash
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                      tap();
                                      setAmountReceivedMode('UPI');
                                    }}
                                  >
                                    <Ionicons
                                      name={amountReceivedMode === 'UPI' ? 'radio-button-on' : 'radio-button-off'}
                                      size={14}
                                      color={amountReceivedMode === 'UPI' ? '#0284c7' : '#94a3b8'}
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontFamily: amountReceivedMode === 'UPI' ? FONT.bold : FONT.medium,
                                        color: amountReceivedMode === 'UPI' ? '#0284c7' : '#64748b',
                                      }}
                                    >
                                      UPI
                                    </Text>
                                  </TouchableOpacity>
                                </View>

                                {/* 3. Right-aligned TextInput on right */}
                                <TextInput
                                  style={{
                                    flex: 1,
                                    maxWidth: 110,
                                    borderWidth: 1,
                                    borderColor: '#cbd5e1',
                                    borderRadius: RADIUS.md,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    fontSize: 12.5,
                                    fontFamily: FONT.bold,
                                    color: '#0f172a',
                                    backgroundColor: '#fff',
                                    height: 34,
                                    textAlign: 'right',
                                  }}
                                  placeholder="0"
                                  placeholderTextColor="#94a3b8"
                                  keyboardType="numeric"
                                  value={amountReceived}
                                  onChangeText={setAmountReceived}
                                />
                              </View>
                            ) : null}

                            {/* Remaining Balance Row */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1.5, borderTopColor: '#16a34a', marginBottom: 6 }}>
                              <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#16a34a' }}>Remaining Balance</Text>
                              <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: paymentMode === 'CASH' ? '#16a34a' : '#0f172a' }}>
                                {paymentMode === 'CASH'
                                  ? '₹0'
                                  : formatInr(
                                    ((totalCartAmount - (Number(saleDiscount) || 0) + (Number(saleDelivery) || 0)) +
                                      previousPartyBalance) -
                                    (Number(amountReceived) || 0)
                                  )}
                              </Text>
                            </View>

                            {/* Description Field */}
                            <View style={{ marginTop: 2 }}>
                              <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b', marginBottom: 3 }}>Description</Text>
                              <TextInput
                                style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 5, fontSize: 12, fontFamily: FONT.medium, color: '#0f172a', backgroundColor: '#fff', minHeight: 34 }}
                                placeholder="Add note / description..."
                                placeholderTextColor="#94a3b8"
                                value={saleDescription}
                                onChangeText={setSaleDescription}
                                multiline
                              />
                            </View>
                          </View>
                        )}



                        {saleError ? <Text style={[styles.errorText, { marginBottom: 6, marginTop: 0 }]}>{saleError}</Text> : null}

                        {/* Modal Action Buttons */}
                        <View style={[styles.formActions, { marginTop: 8, marginBottom: 4, gap: 6 }]}>
                          {editingBillId && (
                            <TouchableOpacity
                              style={{
                                height: 38,
                                paddingHorizontal: 10,
                                backgroundColor: '#fef2f2',
                                borderWidth: 1,
                                borderColor: '#fecaca',
                                borderRadius: RADIUS.md,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                gap: 4,
                              }}
                              onPress={onDeleteEditingBill}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="trash-outline" size={15} color="#dc2626" />
                              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#dc2626' }}>Delete Bill</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity style={[styles.secondaryButton, { paddingVertical: 9, flex: editingBillId ? undefined : 1 }]} onPress={() => setShowSaleForm(false)}>
                            <Text style={[styles.secondaryButtonText, { fontSize: 12.5 }]}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.primaryButtonWrap, { flex: editingBillId ? 1.5 : 1 }]} onPress={onSaveSale} disabled={isSavingSale} activeOpacity={0.85}>
                            <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.primaryButton, { paddingVertical: 9 }]}>
                              {isSavingSale ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <Text style={[styles.primaryButtonText, { fontSize: 12.5 }]}>
                                  {editingBillId ? `Update Bill #${editingBillNo}` : 'Save Sale'}
                                </Text>
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
                          <Text style={styles.savedTitle}>{wasEditingBill ? 'Bill Updated ✅' : 'Sale Saved ✅'}</Text>
                          <Text style={styles.savedSub}>{wasEditingBill ? 'Bill successfully updated. Same Bill # preserved.' : 'Preview the bill below, then share it as an image.'}</Text>

                          {savedInvoice && (
                            <View style={{ marginTop: 12 }}>
                              <ViewShot ref={billShotRef} options={{ format: 'jpg', quality: 0.95 }}>
                                <BillPreview inv={savedInvoice} />
                              </ViewShot>
                            </View>
                          )}

                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, width: '100%' }}>
                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={() => shareInvoiceAsJpg(`Bill-${savedInvoice?.billNo}`, 'bill')}
                              disabled={isSharingBill}
                              activeOpacity={0.8}
                            >
                              <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.primaryButton, { paddingVertical: 11 }]}>
                                {isSharingBill ? (
                                  <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                  <Text style={styles.primaryButtonText}>🖼️ Download JPG</Text>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={() => shareInvoiceAsPdf(savedInvoice, `Bill-${savedInvoice?.billNo}`)}
                              disabled={isSharingBill}
                              activeOpacity={0.8}
                            >
                              <View style={[styles.primaryButton, { backgroundColor: '#0284c7', paddingVertical: 11 }]}>
                                {isSharingBill ? (
                                  <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                  <Text style={styles.primaryButtonText}>📄 Download PDF</Text>
                                )}
                              </View>
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
                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, width: '100%' }}>
                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={() => shareInvoiceAsJpg(`Bill-${billPreviewInvoice?.billNo}`, 'bill')}
                              disabled={isSharingBill}
                              activeOpacity={0.8}
                            >
                              <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.primaryButton, { paddingVertical: 11 }]}>
                                {isSharingBill ? (
                                  <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                  <Text style={styles.primaryButtonText}>🖼️ Download JPG</Text>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={() => shareInvoiceAsPdf(billPreviewInvoice, `Bill-${billPreviewInvoice?.billNo}`)}
                              disabled={isSharingBill}
                              activeOpacity={0.8}
                            >
                              <View style={[styles.primaryButton, { backgroundColor: '#0284c7', paddingVertical: 11 }]}>
                                {isSharingBill ? (
                                  <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                  <Text style={styles.primaryButtonText}>📄 Download PDF</Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              {/* Payment Voucher Modal Component */}
              <PaymentVoucherModal
                visible={showPaymentVoucherModal}
                initialType={voucherInitialType}
                parties={parties}
                labourWorkers={expenseLabourWorkers}
                onClose={() => setShowPaymentVoucherModal(false)}
              />
            </View>
          ) : recordType === 'LABOUR' ? (
            /* LABOUR MANAGEMENT TAB */
            <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              <LabourManagementSection />
            </ScrollView>
          ) : recordType === 'PARTIES' ? (
            /* ALL PEOPLE ACCOUNTS LIST TAB */
            <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              <AllPartiesSection />
            </ScrollView>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.compactSaleAmount, { color: '#dc2626' }]}>-{formatInr(Number(item.amount))}</Text>
                        <TouchableOpacity
                          style={{
                            width: 27,
                            height: 27,
                            borderRadius: 14,
                            backgroundColor: '#f0fdf4',
                            borderWidth: 1,
                            borderColor: '#bbf7d0',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          activeOpacity={0.7}
                          onPress={() => handleOpenEditExpense(item)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="create-outline" size={14} color="#16a34a" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            width: 27,
                            height: 27,
                            borderRadius: 14,
                            backgroundColor: '#fff1f2',
                            borderWidth: 1,
                            borderColor: '#fecdd3',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          activeOpacity={0.7}
                          onPress={() => openExpenseSlipPreview(item)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="download-outline" size={14} color="#e11d48" />
                        </TouchableOpacity>
                      </View>
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
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={[styles.compactSaleAmount, { color: '#dc2626' }]}>-{formatInr(Number(item.amount))}</Text>
                                <TouchableOpacity
                                  style={{
                                    width: 27,
                                    height: 27,
                                    borderRadius: 14,
                                    backgroundColor: '#f0fdf4',
                                    borderWidth: 1,
                                    borderColor: '#bbf7d0',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  activeOpacity={0.7}
                                  onPress={() => handleOpenEditExpense(item)}
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                  <Ionicons name="create-outline" size={14} color="#16a34a" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={{
                                    width: 27,
                                    height: 27,
                                    borderRadius: 14,
                                    backgroundColor: '#fff1f2',
                                    borderWidth: 1,
                                    borderColor: '#fecdd3',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  activeOpacity={0.7}
                                  onPress={() => openExpenseSlipPreview(item)}
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                  <Ionicons name="download-outline" size={14} color="#e11d48" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))
                          : null}
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* Combined Expenses Modal Window Popup */}
              <Modal
                visible={showExpenseForm}
                transparent
                animationType="slide"
                onRequestClose={() => {
                  setShowExpenseForm(false);
                  setExpenseError(null);
                }}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalCard, { maxHeight: '90%', width: '100%', maxWidth: 480, padding: 16 }]}>
                    {/* Header */}
                    <View style={[styles.modalHeaderRow, { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10, marginBottom: 12 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.formTitle, { fontSize: 16 }]}>🔴 Add Farm Expense (+ ਖਰਚਾ)</Text>
                        <Text style={styles.formSubTitle}>Record crop-specific or general farm input expenses</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setShowExpenseForm(false);
                          setExpenseError(null);
                        }}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="close-circle" size={22} color="#64748b" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
                      {/* ROW 1: EXPENSE DATE & EXPENSE CATEGORY SIDE-BY-SIDE */}
                      <View style={{ flexDirection: 'row', gap: 8, zIndex: 100 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.label}>Expense Date *</Text>
                          <TextInput
                            style={[styles.input, { height: 40 }]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#94a3b8"
                            value={expenseDate}
                            onChangeText={setExpenseDate}
                          />
                        </View>

                        <View style={{ flex: 1.2 }}>
                          <Text style={styles.label}>Expense Category *</Text>
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderWidth: 1,
                              borderColor: isExpenseCategoryDropdownOpen ? '#dc2626' : '#cbd5e1',
                              borderRadius: RADIUS.md,
                              paddingHorizontal: 8,
                              height: 40,
                              backgroundColor: '#f8fafc',
                            }}
                            onPress={() => { tap(); setIsExpenseCategoryDropdownOpen((prev) => !prev); }}
                            activeOpacity={0.8}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                              <Ionicons
                                name={(displayCategories.find((c) => c.id === categoryId)?.icon as any) || 'pricetag-outline'}
                                size={15}
                                color="#dc2626"
                              />
                              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
                                {(() => {
                                  const selected = displayCategories.find((c) => c.id === categoryId);
                                  if (!selected) return 'Select Category';
                                  return (selected as any).labelPa
                                    ? `${selected.labelEn} (${(selected as any).labelPa})`
                                    : selected.labelEn;
                                })()}
                              </Text>
                            </View>
                            <Ionicons name={isExpenseCategoryDropdownOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#64748b" />
                          </TouchableOpacity>

                          {/* Dropdown Menu Inline List */}
                          {isExpenseCategoryDropdownOpen && (
                            <View
                              style={{
                                marginTop: 6,
                                backgroundColor: '#ffffff',
                                borderRadius: RADIUS.md,
                                borderWidth: 1.5,
                                borderColor: '#dc2626',
                                maxHeight: 200,
                                padding: 4,
                              }}
                            >
                              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                {displayCategories.map((cat) => {
                                  const isSelected = categoryId === cat.id;
                                  return (
                                    <TouchableOpacity
                                      key={cat.id}
                                      style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: 10,
                                        paddingVertical: 8,
                                        borderRadius: RADIUS.sm,
                                        marginBottom: 2,
                                        backgroundColor: isSelected ? '#fef2f2' : '#f8fafc',
                                        borderWidth: 1,
                                        borderColor: isSelected ? '#fecaca' : '#e2e8f0',
                                      }}
                                      onPress={() => {
                                        tap();
                                        setCategoryId(cat.id);
                                        setIsExpenseCategoryDropdownOpen(false);
                                      }}
                                    >
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                        <Ionicons name={cat.icon as any} size={15} color={isSelected ? '#dc2626' : '#475569'} />
                                        <Text style={{ fontSize: 12, fontFamily: isSelected ? FONT.bold : FONT.medium, color: isSelected ? '#dc2626' : '#0f172a' }}>
                                          {cat.labelEn}{' '}
                                          {(cat as any).labelPa ? (
                                            <Text style={{ fontSize: 10.5, color: isSelected ? '#b91c1c' : '#64748b' }}>
                                              ({(cat as any).labelPa})
                                            </Text>
                                          ) : null}
                                        </Text>
                                      </View>
                                      {isSelected && <Ionicons name="checkmark" size={15} color="#dc2626" />}
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* ROW 2: EXPENSE AMOUNT WITH INLINE CASH / UPI RADIOS ON THE RIGHT SIDE OF TEXTBOX */}
                      <View>
                        <Text style={styles.label}>Expense Amount (₹) *</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {/* Amount Input Box */}
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: RADIUS.md, backgroundColor: '#ffffff', paddingHorizontal: 10, height: 42 }}>
                            <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#dc2626', marginRight: 6 }}>₹</Text>
                            <TextInput
                              style={{ flex: 1, fontSize: 15, fontFamily: FONT.bold, color: '#0f172a', padding: 0 }}
                              placeholder="e.g. 2500"
                              placeholderTextColor="#94a3b8"
                              keyboardType="numeric"
                              value={amount}
                              onChangeText={setAmount}
                            />
                          </View>

                          {/* Cash / UPI Radio Buttons directly on the right side of text box */}
                          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                            <TouchableOpacity
                              style={[
                                styles.modePill,
                                expensePaymentMode === 'CASH' && { backgroundColor: '#16a34a', borderColor: '#15803d' },
                                { height: 42, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
                              ]}
                              activeOpacity={0.8}
                              onPress={() => {
                                tap();
                                setExpensePaymentMode('CASH');
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="cash-outline" size={13} color={expensePaymentMode === 'CASH' ? '#fff' : '#16a34a'} />
                                <Text style={[styles.modePillText, { fontSize: 11.5 }, expensePaymentMode === 'CASH' && { color: '#fff', fontFamily: FONT.bold }]}>
                                  Cash
                                </Text>
                              </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.modePill,
                                expensePaymentMode === 'UPI' && { backgroundColor: '#0284c7', borderColor: '#0369a1' },
                                { height: 42, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
                              ]}
                              activeOpacity={0.8}
                              onPress={() => {
                                tap();
                                setExpensePaymentMode('UPI');
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="qr-code-outline" size={13} color={expensePaymentMode === 'UPI' ? '#fff' : '#0284c7'} />
                                <Text style={[styles.modePillText, { fontSize: 11.5 }, expensePaymentMode === 'UPI' && { color: '#fff', fontFamily: FONT.bold }]}>
                                  UPI
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* ROW 3: RECIPIENT / PAID TO */}
                      <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.label, { marginBottom: 0 }]}>Paid To / Recipient *</Text>
                          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                            <TouchableOpacity
                              style={[
                                styles.modePill,
                                expenseRecipientType === 'CASH' && { backgroundColor: '#16a34a', borderColor: '#15803d' },
                                { paddingVertical: 4, paddingHorizontal: 7 },
                              ]}
                              onPress={() => {
                                tap();
                                setExpenseRecipientType('CASH');
                                setExpensePaymentMode('CASH');
                                setExpenseParty(null);
                              }}
                            >
                              <Ionicons name="cash" size={12} color={expenseRecipientType === 'CASH' ? '#fff' : '#16a34a'} />
                              <Text style={[styles.modePillText, expenseRecipientType === 'CASH' && { color: '#fff' }]}>Direct / Cash</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.modePill,
                                expenseRecipientType === 'SUPPLIER' && { backgroundColor: '#dc2626', borderColor: '#b91c1c' },
                                { paddingVertical: 4, paddingHorizontal: 7 },
                              ]}
                              onPress={() => {
                                tap();
                                setExpenseRecipientType('SUPPLIER');
                                setExpensePaymentMode('CREDIT');
                              }}
                            >
                              <Ionicons name="business" size={12} color={expenseRecipientType === 'SUPPLIER' ? '#fff' : '#dc2626'} />
                              <Text style={[styles.modePillText, expenseRecipientType === 'SUPPLIER' && { color: '#fff' }]}>Supplier / Party</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Recipient Details based on Selection */}
                        {expenseRecipientType === 'SUPPLIER' ? (
                          <View style={{ marginTop: 2 }}>
                            <PartyPicker
                              parties={parties}
                              labourWorkers={expenseLabourWorkers}
                              selectedParty={expenseParty}
                              onSelect={setExpenseParty}
                              onCreate={async (name) => createParty.mutateAsync(name)}
                              accentColor="#dc2626"
                              label="Supplier / Trader Name *"
                              inlineAddButton
                            />
                          </View>
                        ) : (
                          <View style={{ marginTop: 2 }}>
                            <TextInput
                              style={[styles.input, { height: 38 }]}
                              placeholder="Vendor / Shop Name (Optional)"
                              placeholderTextColor="#94a3b8"
                              value={vendorName}
                              onChangeText={setVendorName}
                            />
                          </View>
                        )}
                      </View>

                      {/* ROW 4: CROP SELECTOR (UNDER PAID TO / RECIPIENT) */}
                      <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={[styles.label, { marginBottom: 6 }]}>Expense Type / Crop Selection *</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {activeCrops.map((c) => {
                            const isSelected = expenseCropType === 'CROP' && expenseCropId === c.id;
                            return (
                              <TouchableOpacity
                                key={c.id}
                                style={[
                                  styles.categoryChip,
                                  isSelected && { backgroundColor: '#16a34a', borderColor: '#15803d' },
                                  { paddingVertical: 5, paddingHorizontal: 10 },
                                ]}
                                activeOpacity={0.8}
                                onPress={() => {
                                  tap();
                                  setExpenseCropType('CROP');
                                  setExpenseCropId(c.id);
                                }}
                              >
                                <Ionicons name="leaf" size={13} color={isSelected ? '#fff' : '#16a34a'} />
                                <Text style={[styles.categoryChipText, isSelected && { color: '#fff', fontFamily: FONT.bold }]}>
                                  {c.cropName}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}

                          <TouchableOpacity
                            style={[
                              styles.categoryChip,
                              expenseCropType === 'OTHER' && { backgroundColor: '#475569', borderColor: '#334155' },
                              { paddingVertical: 5, paddingHorizontal: 10 },
                            ]}
                            activeOpacity={0.8}
                            onPress={() => {
                              tap();
                              setExpenseCropType('OTHER');
                              setExpenseCropId(undefined);
                            }}
                          >
                            <Ionicons name="grid-outline" size={13} color={expenseCropType === 'OTHER' ? '#fff' : '#475569'} />
                            <Text style={[styles.categoryChipText, expenseCropType === 'OTHER' && { color: '#fff', fontFamily: FONT.bold }]}>
                              Other
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* ROW 5: REMARKS / NOTES */}
                      <View>
                        <Text style={styles.label}>Remarks / Notes</Text>
                        <TextInput
                          style={[styles.input, { height: 38 }]}
                          placeholder="e.g. 2 bags DAP fertilizer / diesel payment..."
                          placeholderTextColor="#94a3b8"
                          value={notes}
                          onChangeText={setNotes}
                        />
                      </View>

                      {expenseError ? <Text style={styles.errorText}>{expenseError}</Text> : null}

                      {/* Action Buttons */}
                      <View style={[styles.formActions, { marginTop: 6 }]}>
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
                  </View>
                </View>
              </Modal>
            </>
          ) : recordType === 'OVERVIEW' ? (
            /* OVERVIEW TAB */
            <ProfessionalOverviewView
              totalSalesRevenue={totalSalesRevenue}
              totalSpent={totalSpent}
              overallNet={overallNet}
              totalReceivable={totalReceivable}
              totalPayable={totalPayable}
              salesCount={unifiedSalesRecords.length}
              expenseCount={expenses?.length ?? 0}
              cropAnalysis={cropAnalysis}
              salesRecords={unifiedSalesRecords}
              expenses={expenses}
              onNavigateTab={(tab, subTab) => {
                if (subTab) setAnalysisSubTab(subTab);
                setRecordType(tab);
              }}
              onOpenSaleForm={() => {
                resetSaleForm();
                setShowSaleForm(true);
              }}
              onOpenExpenseForm={() => {
                setShowExpenseForm(true);
              }}
            />
          ) : (
            /* ANALYSIS (PAYMENTS) TAB — Receivable/Payable party ledgers */
            <View style={{ flex: 1 }}>
              {/* Quick Action Bar: + Receipt (Money In) & + Payment (Money Out) */}
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#f0fdf4',
                    borderWidth: 1.5,
                    borderColor: '#bbf7d0',
                    paddingVertical: 9,
                    borderRadius: RADIUS.md,
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setVoucherInitialType('RECEIPT_IN');
                    setShowPaymentVoucherModal(true);
                  }}
                >
                  <Ionicons name="arrow-down-circle" size={16} color="#16a34a" />
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.extraBold, color: '#15803d' }}>+ Receipt (Money In)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#fff1f2',
                    borderWidth: 1.5,
                    borderColor: '#fecdd3',
                    paddingVertical: 9,
                    borderRadius: RADIUS.md,
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setVoucherInitialType('PAYMENT_OUT');
                    setShowPaymentVoucherModal(true);
                  }}
                >
                  <Ionicons name="arrow-up-circle" size={16} color="#dc2626" />
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.extraBold, color: '#b91c1c' }}>+ Payment (Money Out)</Text>
                </TouchableOpacity>
              </View>

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

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginVertical: 6 }}>
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.md }}
                            onPress={() => {
                              tap();
                              setShowFullStatementModal(true);
                            }}
                          >
                            <Ionicons name="document-text-outline" size={15} color="#16a34a" />
                            <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#16a34a' }}>
                              📜 View / PDF
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.md }}
                            onPress={() => {
                              tap();
                              setStatementSortAsc(!statementSortAsc);
                            }}
                          >
                            <Ionicons name="swap-vertical" size={14} color="#0284c7" />
                            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0369a1' }}>
                              {statementSortAsc ? '🔼 Seq (#1 -> #N)' : '🔽 Newest First'}
                            </Text>
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
                          <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                            <View style={{ flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 7, paddingHorizontal: 6, alignItems: 'center' }}>
                              <Text style={{ width: 32, fontSize: 9.5, fontFamily: FONT.bold, color: '#fbbf24' }}>Sr.</Text>
                              <Text style={{ width: 52, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>Date</Text>
                              <Text style={{ width: 62, fontSize: 9.5, fontFamily: FONT.bold, color: '#e2e8f0' }}>Bill No.</Text>
                              <Text style={{ flex: 1, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>Particulars</Text>
                              <Text style={{ width: 55, fontSize: 9.5, fontFamily: FONT.bold, color: '#fca5a5', textAlign: 'right' }}>Dr. (₹)</Text>
                              <Text style={{ width: 55, fontSize: 9.5, fontFamily: FONT.bold, color: '#86efac', textAlign: 'right' }}>Cr. (₹)</Text>
                              <Text style={{ width: 70, fontSize: 9.5, fontFamily: FONT.bold, color: '#38bdf8', textAlign: 'right' }}>Balance</Text>
                            </View>

                            {statementLedgerRows.length === 0 ? (
                              <View style={{ padding: 16, alignItems: 'center' }}>
                                <Text style={styles.emptyText}>No ledger entries yet.</Text>
                              </View>
                            ) : (
                              statementLedgerRows.map((row, idx) => (
                                <View key={row.id || idx} style={{ flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 7, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' }}>
                                  <Text style={{ width: 32, fontSize: 9.5, fontFamily: FONT.bold, color: '#0369a1' }}>
                                    {row.entryNo || `#${row.srNo}`}
                                  </Text>

                                  <Text style={{ width: 52, fontSize: 9.5, fontFamily: FONT.medium, color: '#475569' }}>
                                    {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  </Text>

                                  <View style={{ width: 62 }}>
                                    {row.billNo && row.billNo !== '—' ? (
                                      <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1, alignSelf: 'flex-start' }}>
                                        <Text style={{ fontSize: 8.5, fontFamily: FONT.bold, color: '#1d4ed8' }}>{row.billNo}</Text>
                                      </View>
                                    ) : (
                                      <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#94a3b8' }}>—</Text>
                                    )}
                                  </View>

                                  <Text style={{ flex: 1, fontSize: 10, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={2}>
                                    {row.reason}
                                  </Text>

                                  <Text style={{ width: 55, fontSize: 10, fontFamily: FONT.bold, color: row.drAmount > 0 ? '#b91c1c' : '#94a3b8', textAlign: 'right' }}>
                                    {row.drAmount > 0 ? `₹${row.drAmount.toLocaleString('en-IN')}` : '—'}
                                  </Text>

                                  <Text style={{ width: 55, fontSize: 10, fontFamily: FONT.bold, color: row.crAmount > 0 ? '#15803d' : '#94a3b8', textAlign: 'right' }}>
                                    {row.crAmount > 0 ? `₹${row.crAmount.toLocaleString('en-IN')}` : '—'}
                                  </Text>

                                  <Text style={{ width: 75, fontSize: 9.5, fontFamily: FONT.extraBold, color: row.runningBalance >= 0 ? '#16a34a' : '#dc2626', textAlign: 'right' }}>
                                    ₹{Math.abs(row.runningBalance).toLocaleString('en-IN')} {row.runningBalance >= 0 ? 'Dr' : 'Cr'}
                                  </Text>
                                </View>
                              ))
                            )}
                          </View>
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

      {/* Universal Voucher Slip & Statement Modals (Accessible across ALL Tabs) */}
      <UniversalVoucherSlipModal
        visible={showVoucherSlipModal}
        data={activeVoucherData}
        onClose={() => setShowVoucherSlipModal(false)}
      />

      <UniversalStatementModal
        visible={showFullStatementModal && !!statement}
        onClose={() => setShowFullStatementModal(false)}
        partyName={statement?.party.name || 'Party Account'}
        partyPhone={statement?.party.mobile || undefined}
        entries={(statement?.entries || []).map((e) => ({
          id: e.id,
          date: e.createdAt || todayIso(),
          type: e.type,
          reason: e.reason || 'Ledger entry',
          amount: Number(e.amount),
        }))}
      />
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
  list: { padding: SPACING.lg, gap: SPACING.sm, paddingBottom: 140 },
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
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  modePillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#475569',
  },
});
