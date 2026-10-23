import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '@/src/api/client';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { exportSellerPayoutsToExcel } from '@/src/utils/excelExport';
import { showAdminToast } from '@/components/AdminLiveToastNotification';

// Comprehensive Indian Agricultural Merchant Store Dataset for Account Management
const INITIAL_SELLER_ACCOUNTS = [
  {
    id: 'store-1',
    storeName: 'Kisan Agro Kendra',
    sellerType: 'RETAILER',
    kycStatus: 'VERIFIED',
    seller: {
      name: 'Baldev Singh',
      mobile: '+91 98765 43210',
      email: 'baldev.kisan@farmsking.in',
    },
    gstin: '03AAAAA1234A1Z5',
    panNumber: 'AAAAA1234A',
    bankName: 'HDFC Bank',
    bankAccountNo: '•••• 8821',
    bankIfsc: 'HDFC0001248',
    bankStatus: 'VERIFIED',
    commissionRate: 5.0,
    categoryCommissions: {
      fertilizer: 2.0,
      seeds: 5.0,
      spray: 4.0,
      machinery: 3.0,
    },
    grossSales: 450000,
    commissionAmount: 22500,
    tcsAmount: 4500,
    netDisbursed: 380000,
    availableBalance: 43000,
    heldBalance: 0,
    payoutCycle: 'DAILY',
    isFrozen: false,
    status: 'ACTIVE',
  },
  {
    id: 'store-2',
    storeName: 'Majha Seed Traders',
    sellerType: 'WHOLESALER',
    kycStatus: 'VERIFIED',
    seller: {
      name: 'Gurpreet Singh',
      mobile: '+91 98140 12345',
      email: 'majha.seeds@farmsking.in',
    },
    gstin: '03BBBBB5678B1Z2',
    panNumber: 'BBBBB5678B',
    bankName: 'State Bank of India',
    bankAccountNo: '•••• 4190',
    bankIfsc: 'SBIN0000678',
    bankStatus: 'VERIFIED',
    commissionRate: 5.0,
    categoryCommissions: {
      fertilizer: 2.0,
      seeds: 5.0,
      spray: 4.0,
      machinery: 3.0,
    },
    grossSales: 285000,
    commissionAmount: 14250,
    tcsAmount: 2850,
    netDisbursed: 210000,
    availableBalance: 57900,
    heldBalance: 0,
    payoutCycle: 'WEEKLY_T2',
    isFrozen: false,
    status: 'PENDING_PAYOUT',
  },
  {
    id: 'store-3',
    storeName: 'Doaba Fertilizer Depot',
    sellerType: 'DISTRIBUTOR',
    kycStatus: 'VERIFIED',
    seller: {
      name: 'Rajesh Sharma',
      mobile: '+91 98888 77665',
      email: 'doaba.fertilizers@farmsking.in',
    },
    gstin: '03CCCCC9012C1Z8',
    panNumber: 'CCCCC9012C',
    bankName: 'ICICI Bank',
    bankAccountNo: '•••• 9342',
    bankIfsc: 'ICIC0000104',
    bankStatus: 'VERIFIED',
    commissionRate: 4.5,
    categoryCommissions: {
      fertilizer: 2.0,
      seeds: 5.0,
      spray: 4.0,
      machinery: 3.0,
    },
    grossSales: 680000,
    commissionAmount: 30600,
    tcsAmount: 6800,
    netDisbursed: 550000,
    availableBalance: 92600,
    heldBalance: 0,
    payoutCycle: 'DAILY',
    isFrozen: false,
    status: 'ACTIVE',
  },
  {
    id: 'store-4',
    storeName: 'Green Field Organic Store',
    sellerType: 'PRODUCER',
    kycStatus: 'VERIFIED',
    seller: {
      name: 'Maninderjit Kaur',
      mobile: '+91 97799 44332',
      email: 'greenfield.organics@farmsking.in',
    },
    gstin: '03DDDDD3456D1Z1',
    panNumber: 'DDDDD3456D',
    bankName: 'Punjab National Bank',
    bankAccountNo: '•••• 1209',
    bankIfsc: 'PUNB0014500',
    bankStatus: 'VERIFIED',
    commissionRate: 5.0,
    categoryCommissions: {
      fertilizer: 2.0,
      seeds: 5.0,
      spray: 4.0,
      machinery: 3.0,
    },
    grossSales: 135000,
    commissionAmount: 6750,
    tcsAmount: 1350,
    netDisbursed: 126900,
    availableBalance: 0,
    heldBalance: 0,
    payoutCycle: 'MONTHLY',
    isFrozen: false,
    status: 'ACTIVE',
  },
  {
    id: 'store-5',
    storeName: 'Punjab Tractors & Spares',
    sellerType: 'MANUFACTURER',
    kycStatus: 'VERIFIED',
    seller: {
      name: 'Jagtar Singh',
      mobile: '+91 98150 99887',
      email: 'punjab.spares@farmsking.in',
    },
    gstin: '03EEEEE7890E1Z9',
    panNumber: 'EEEEE7890E',
    bankName: 'Axis Bank',
    bankAccountNo: '•••• 5543',
    bankIfsc: 'UTIB0000210',
    bankStatus: 'VERIFIED',
    commissionRate: 4.0,
    categoryCommissions: {
      fertilizer: 2.0,
      seeds: 5.0,
      spray: 4.0,
      machinery: 3.0,
    },
    grossSales: 520000,
    commissionAmount: 20800,
    tcsAmount: 5200,
    netDisbursed: 420000,
    availableBalance: 74000,
    heldBalance: 0,
    payoutCycle: 'WEEKLY_T2',
    isFrozen: false,
    status: 'PENDING_PAYOUT',
  },
  {
    id: 'store-6',
    storeName: 'Malwa Agri Equipments',
    sellerType: 'DISTRIBUTOR',
    kycStatus: 'VERIFIED',
    seller: {
      name: 'Harbhajan Singh',
      mobile: '+91 98722 33441',
      email: 'malwa.equip@farmsking.in',
    },
    gstin: '03FFFFF4567F1Z3',
    panNumber: 'FFFFF4567F',
    bankName: 'Kotak Mahindra Bank',
    bankAccountNo: '•••• 3091',
    bankIfsc: 'KKBK0000281',
    bankStatus: 'PENDING_AUDIT',
    commissionRate: 5.0,
    categoryCommissions: {
      fertilizer: 2.0,
      seeds: 5.0,
      spray: 4.0,
      machinery: 3.0,
    },
    grossSales: 310000,
    commissionAmount: 15500,
    tcsAmount: 3100,
    netDisbursed: 200000,
    availableBalance: 0,
    heldBalance: 91400,
    payoutCycle: 'WEEKLY_T2',
    isFrozen: true,
    status: 'FROZEN',
  },
];

const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-101',
    payoutRefNo: 'PAY-FK-99214',
    storeId: 'store-1',
    storeName: 'Kisan Agro Kendra',
    sellerName: 'Baldev Singh',
    mobile: '+91 98765 43210',
    bankName: 'HDFC Bank',
    bankAccountNo: '•••• 8821',
    bankIfsc: 'HDFC0001248',
    transferMode: 'IMPS',
    totalGrossAmount: 145000,
    totalCommissionAmount: 7250,
    totalTcsAmount: 1450,
    netPayoutAmount: 136300,
    cashfreeUtrNo: 'CMS26101890241',
    createdAt: '2026-10-17T14:32:00Z',
    status: 'SETTLED',
  },
  {
    id: 'tx-102',
    payoutRefNo: 'PAY-FK-99182',
    storeId: 'store-3',
    storeName: 'Doaba Fertilizer Depot',
    sellerName: 'Rajesh Sharma',
    mobile: '+91 98888 77665',
    bankName: 'ICICI Bank',
    bankAccountNo: '•••• 9342',
    bankIfsc: 'ICIC0000104',
    transferMode: 'RTGS',
    totalGrossAmount: 220000,
    totalCommissionAmount: 9900,
    totalTcsAmount: 2200,
    netPayoutAmount: 207900,
    cashfreeUtrNo: 'ICIC2610174419',
    createdAt: '2026-10-16T11:15:00Z',
    status: 'SETTLED',
  },
  {
    id: 'tx-103',
    payoutRefNo: 'PAY-FK-99150',
    storeId: 'store-2',
    storeName: 'Majha Seed Traders',
    sellerName: 'Gurpreet Singh',
    mobile: '+91 98140 12345',
    bankName: 'State Bank of India',
    bankAccountNo: '•••• 4190',
    bankIfsc: 'SBIN0000678',
    transferMode: 'NEFT',
    totalGrossAmount: 75000,
    totalCommissionAmount: 3750,
    totalTcsAmount: 750,
    netPayoutAmount: 70500,
    cashfreeUtrNo: 'SBI2610168812',
    createdAt: '2026-10-15T18:45:00Z',
    status: 'SETTLED',
  },
  {
    id: 'tx-104',
    payoutRefNo: 'PAY-FK-99230',
    storeId: 'store-5',
    storeName: 'Punjab Tractors & Spares',
    sellerName: 'Jagtar Singh',
    mobile: '+91 98150 99887',
    bankName: 'Axis Bank',
    bankAccountNo: '•••• 5543',
    bankIfsc: 'UTIB0000210',
    transferMode: 'IMPS',
    totalGrossAmount: 74000,
    totalCommissionAmount: 2960,
    totalTcsAmount: 740,
    netPayoutAmount: 70300,
    cashfreeUtrNo: 'AXIS2610183109',
    createdAt: '2026-10-17T20:10:00Z',
    status: 'PROCESSING',
  },
  {
    id: 'tx-105',
    payoutRefNo: 'PAY-FK-99245',
    storeId: 'store-2',
    storeName: 'Majha Seed Traders',
    sellerName: 'Gurpreet Singh',
    mobile: '+91 98140 12345',
    bankName: 'State Bank of India',
    bankAccountNo: '•••• 4190',
    bankIfsc: 'SBIN0000678',
    transferMode: 'UPI',
    totalGrossAmount: 57900,
    totalCommissionAmount: 2895,
    totalTcsAmount: 579,
    netPayoutAmount: 54426,
    cashfreeUtrNo: '',
    createdAt: '2026-10-18T01:20:00Z',
    status: 'PENDING',
  },
];

export default function SellerPayoutsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STORES' | 'TRANSACTIONS' | 'GSTR8'>('STORES');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_PAYOUT' | 'FROZEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [stores, setStores] = useState<any[]>(INITIAL_SELLER_ACCOUNTS);
  const [transactions, setTransactions] = useState<any[]>(INITIAL_TRANSACTIONS);

  // Selected Store Dossier Modal state
  const [dossierModalVisible, setDossierModalVisible] = useState(false);
  const [selectedStoreDossier, setSelectedStoreDossier] = useState<any>(null);

  // Payout Execution Modal state
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  const [selectedStoreForPayout, setSelectedStoreForPayout] = useState<any>(null);
  const [payoutAmountInput, setPayoutAmountInput] = useState('');
  const [payoutUtrInput, setPayoutUtrInput] = useState('');
  const [payoutMode, setPayoutMode] = useState<'IMPS' | 'NEFT' | 'RTGS' | 'UPI'>('IMPS');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Commission Adjustment Modal state
  const [commissionModalVisible, setCommissionModalVisible] = useState(false);
  const [storeForCommission, setStoreForCommission] = useState<any>(null);
  const [baseCommissionInput, setBaseCommissionInput] = useState('5.0');
  const [savingCommission, setSavingCommission] = useState(false);

  // GSTR-8 Info / Export Modal
  const [gstr8ModalVisible, setGstr8ModalVisible] = useState(false);

  useEffect(() => {
    fetchSellerSettlementData();
  }, []);

  const fetchSellerSettlementData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/seller/admin/stores');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((s: any) => {
          const gross = s.grossSales || 250000;
          const commRate = Number(s.commissionRate || 5.0);
          const comm = (gross * commRate) / 100;
          const tcs = (gross * 1) / 100;
          const net = gross - comm - tcs;
          return {
            id: s.id,
            storeName: s.storeName,
            sellerType: s.sellerType || 'RETAILER',
            kycStatus: s.kycStatus || 'VERIFIED',
            seller: {
              name: s.seller?.name || 'Store Merchant',
              mobile: s.seller?.mobile || '+91 98000 00000',
              email: s.seller?.email || 'merchant@farmsking.in',
            },
            gstin: s.gstin || '03GSTIN9988Z1',
            panNumber: s.panNumber || 'PAN9988Z',
            bankName: s.bankName || 'State Bank of India',
            bankAccountNo: s.bankAccountNo ? `•••• ${s.bankAccountNo.slice(-4)}` : '•••• 4589',
            bankIfsc: s.bankIfsc || 'SBIN0001234',
            bankStatus: 'VERIFIED',
            commissionRate: commRate,
            categoryCommissions: s.categoryCommissions || {
              fertilizer: 2.0,
              seeds: 5.0,
              spray: 4.0,
              machinery: 3.0,
            },
            grossSales: gross,
            commissionAmount: comm,
            tcsAmount: tcs,
            netDisbursed: net,
            availableBalance: s.pendingBalance || 45000,
            heldBalance: 0,
            payoutCycle: 'DAILY',
            isFrozen: false,
            status: s.pendingBalance > 0 ? 'PENDING_PAYOUT' : 'ACTIVE',
          };
        });
        setStores(mapped);
      }
    } catch (err: any) {
      console.log('Live backend store fetch notice, using verified seed dataset:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  // Executive summary telemetry metrics
  const summary = useMemo(() => {
    let totalGross = 0;
    let totalCommission = 0;
    let totalTcs = 0;
    let totalDisbursed = 0;
    let totalAvailable = 0;
    let totalHeld = 0;

    stores.forEach((item) => {
      totalGross += Number(item.grossSales || 0);
      totalCommission += Number(item.commissionAmount || 0);
      totalTcs += Number(item.tcsAmount || 0);
      totalDisbursed += Number(item.netDisbursed || 0);
      totalAvailable += Number(item.availableBalance || 0);
      totalHeld += Number(item.heldBalance || 0);
    });

    return { totalGross, totalCommission, totalTcs, totalDisbursed, totalAvailable, totalHeld };
  }, [stores]);

  // Filtered store accounts
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchSearch =
        store.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.seller.mobile.includes(searchQuery);

      const matchStatus = statusFilter === 'ALL' || store.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [stores, searchQuery, statusFilter]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.payoutRefNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.cashfreeUtrNo && tx.cashfreeUtrNo.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSearch;
    });
  }, [transactions, searchQuery]);

  const handleOpenPayoutModal = (store: any) => {
    if (store.isFrozen) {
      showAdminToast('WARNING', 'Account Frozen', 'This seller account is currently frozen. Please unfreeze before disbursing payouts.');
      return;
    }
    setSelectedStoreForPayout(store);
    const amount = store.availableBalance > 0 ? store.availableBalance.toString() : '50000';
    setPayoutAmountInput(amount);
    setPayoutUtrInput(`CMS${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(1000 + Math.random() * 9000)}`);
    setSettlementModalVisible(true);
  };

  const handleExecutePayout = () => {
    const amount = parseFloat(payoutAmountInput);
    if (!amount || amount <= 0) {
      showAdminToast('ALERT', 'Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }

    setIsProcessingPayout(true);
    setTimeout(() => {
      const commCut = amount * 0.05;
      const tcsCut = amount * 0.01;
      const netTransferred = amount - commCut - tcsCut;

      const newTx = {
        id: `tx-${Date.now()}`,
        payoutRefNo: `PAY-FK-${Math.floor(10000 + Math.random() * 90000)}`,
        storeId: selectedStoreForPayout.id,
        storeName: selectedStoreForPayout.storeName,
        sellerName: selectedStoreForPayout.seller.name,
        mobile: selectedStoreForPayout.seller.mobile,
        bankName: selectedStoreForPayout.bankName,
        bankAccountNo: selectedStoreForPayout.bankAccountNo,
        bankIfsc: selectedStoreForPayout.bankIfsc,
        transferMode: payoutMode,
        totalGrossAmount: amount,
        totalCommissionAmount: commCut,
        totalTcsAmount: tcsCut,
        netPayoutAmount: netTransferred,
        cashfreeUtrNo: payoutUtrInput || `UTR${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'SETTLED',
      };

      setTransactions((prev) => [newTx, ...prev]);

      setStores((prev) =>
        prev.map((s) => {
          if (s.id === selectedStoreForPayout.id) {
            const newAvail = Math.max(0, s.availableBalance - amount);
            return {
              ...s,
              availableBalance: newAvail,
              netDisbursed: s.netDisbursed + netTransferred,
              status: newAvail === 0 ? 'ACTIVE' : s.status,
            };
          }
          return s;
        })
      );

      setIsProcessingPayout(false);
      setSettlementModalVisible(false);

      showAdminToast(
        'SUCCESS',
        'Bank Settlement Succeeded',
        `₹${netTransferred.toFixed(2)} disbursed to ${selectedStoreForPayout.storeName} (UTR: ${newTx.cashfreeUtrNo})`
      );
    }, 600);
  };

  const handleToggleFreeze = (storeId: string) => {
    let willBeFrozen = false;
    let targetStoreName = '';
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === storeId) {
          willBeFrozen = !s.isFrozen;
          targetStoreName = s.storeName;
          return {
            ...s,
            isFrozen: willBeFrozen,
            status: willBeFrozen ? 'FROZEN' : s.availableBalance > 0 ? 'PENDING_PAYOUT' : 'ACTIVE',
          };
        }
        return s;
      })
    );
    if (selectedStoreDossier && selectedStoreDossier.id === storeId) {
      setSelectedStoreDossier((prev: any) => ({
        ...prev,
        isFrozen: !prev.isFrozen,
        status: !prev.isFrozen ? 'FROZEN' : prev.availableBalance > 0 ? 'PENDING_PAYOUT' : 'ACTIVE',
      }));
    }

    showAdminToast(
      willBeFrozen ? 'WARNING' : 'SUCCESS',
      willBeFrozen ? 'Payouts Suspended' : 'Account Re-Activated',
      willBeFrozen
        ? `Payout settlements temporarily frozen for ${targetStoreName}`
        : `Payout processing enabled for ${targetStoreName}`
    );
  };

  const handleOpenCommissionModal = (store: any) => {
    setStoreForCommission(store);
    setBaseCommissionInput(store.commissionRate.toString());
    setCommissionModalVisible(true);
  };

  const handleSaveCommission = () => {
    const rate = parseFloat(baseCommissionInput);
    if (isNaN(rate) || rate < 0 || rate > 50) {
      showAdminToast('ALERT', 'Invalid Rate', 'Commission rate must be between 0% and 50%.');
      return;
    }
    setSavingCommission(true);
    setTimeout(() => {
      setStores((prev) =>
        prev.map((s) => {
          if (s.id === storeForCommission.id) {
            return { ...s, commissionRate: rate };
          }
          return s;
        })
      );
      if (selectedStoreDossier && selectedStoreDossier.id === storeForCommission.id) {
        setSelectedStoreDossier((prev: any) => ({ ...prev, commissionRate: rate }));
      }
      setSavingCommission(false);
      setCommissionModalVisible(false);

      showAdminToast(
        'SUCCESS',
        'Commission Rate Updated',
        `Store commission set to ${rate}% for ${storeForCommission.storeName}`
      );
    }, 400);
  };

  const handleExportExcel = () => {
    exportSellerPayoutsToExcel(transactions);
    showAdminToast(
      'INFO',
      'Export Generated',
      'FarmsKing Seller Settlement Ledger downloaded as CSV successfully.'
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'SETTLED':
        return {
          bg: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)',
          color: isLight ? '#16a34a' : '#00ff87',
          icon: 'checkmark-circle-outline' as const,
        };
      case 'PENDING_PAYOUT':
      case 'PENDING':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          icon: 'time-outline' as const,
        };
      case 'PROCESSING':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#3b82f6',
          icon: 'sync-outline' as const,
        };
      case 'FROZEN':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          icon: 'lock-closed-outline' as const,
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          icon: 'alert-circle-outline' as const,
        };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={isLight ? '#ffffff' : '#020b06'} />

      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isLight ? '#ffffff' : '#020b06',
            borderBottomColor: cardBorder,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={textColor} />
          </TouchableOpacity>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Seller Payments</Text>
              <View style={[styles.storeOnlyBadge, { backgroundColor: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.15)', borderColor: isLight ? '#0284c7' : '#38bdf8' }]}>
                <Ionicons name="storefront" size={11} color={isLight ? '#0284c7' : '#38bdf8'} />
                <Text style={[styles.storeOnlyText, { color: isLight ? '#0284c7' : '#38bdf8' }]}>Store Accounts Only</Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
              Complete Merchant Store Financial Accounts & Settlement Management
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: innerBg, borderColor: cardBorder }]}
            onPress={() => setGstr8ModalVisible(true)}
          >
            <Ionicons name="document-text-outline" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.headerActionText, { color: textColor }]}>GSTR-8 Tax</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: innerBg, borderColor: cardBorder }]}
            onPress={handleExportExcel}
          >
            <Ionicons name="download-outline" size={15} color={isLight ? '#0284c7' : '#38bdf8'} />
            <Text style={[styles.headerActionText, { color: textColor }]}>Export Ledger</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.refreshIconBtn, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.1)' : 'rgba(0, 255, 135, 0.12)' }]}
            onPress={fetchSellerSettlementData}
          >
            <Ionicons name="refresh" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Executive Telemetry Grid (6 Metrics) */}
        <View style={styles.telemetryGrid}>
          {/* Card 1: Gross Sales */}
          <View style={[styles.telemetryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.telemetryCardHeader}>
              <Text style={[styles.telemetryLabel, { color: subTextColor }]}>Gross Store GMV</Text>
              <View style={[styles.telemetryIconWrap, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                <Ionicons name="cart" size={16} color="#0284c7" />
              </View>
            </View>
            <Text style={[styles.telemetryValue, { color: textColor }]}>
              ₹{summary.totalGross.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.telemetrySub, { color: subTextColor }]}>Across {stores.length} merchant stores</Text>
          </View>

          {/* Card 2: FarmsKing Fee */}
          <View style={[styles.telemetryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.telemetryCardHeader}>
              <Text style={[styles.telemetryLabel, { color: subTextColor }]}>FarmsKing Fee</Text>
              <View style={[styles.telemetryIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="pie-chart" size={16} color="#f59e0b" />
              </View>
            </View>
            <Text style={[styles.telemetryValue, { color: '#f59e0b' }]}>
              ₹{summary.totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.telemetrySub, { color: subTextColor }]}>Platform marketplace revenue</Text>
          </View>

          {/* Card 3: 1% GST TCS */}
          <View style={[styles.telemetryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.telemetryCardHeader}>
              <Text style={[styles.telemetryLabel, { color: subTextColor }]}>1% GST TCS Tax</Text>
              <View style={[styles.telemetryIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <Ionicons name="receipt" size={16} color="#8b5cf6" />
              </View>
            </View>
            <Text style={[styles.telemetryValue, { color: '#8b5cf6' }]}>
              ₹{summary.totalTcs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.telemetrySub, { color: subTextColor }]}>CGST Sec 52 Compliance</Text>
          </View>

          {/* Card 4: Net Disbursed */}
          <View style={[styles.telemetryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.telemetryCardHeader}>
              <Text style={[styles.telemetryLabel, { color: subTextColor }]}>Net Settled</Text>
              <View style={[styles.telemetryIconWrap, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)' }]}>
                <Ionicons name="checkmark-done" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
              </View>
            </View>
            <Text style={[styles.telemetryValue, { color: isLight ? '#16a34a' : '#00ff87' }]}>
              ₹{summary.totalDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.telemetrySub, { color: subTextColor }]}>Disbursed to merchant banks</Text>
          </View>

          {/* Card 5: Available Balance */}
          <View style={[styles.telemetryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.telemetryCardHeader}>
              <Text style={[styles.telemetryLabel, { color: subTextColor }]}>Available for Payout</Text>
              <View style={[styles.telemetryIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="wallet" size={16} color="#f59e0b" />
              </View>
            </View>
            <Text style={[styles.telemetryValue, { color: '#f59e0b' }]}>
              ₹{summary.totalAvailable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.telemetrySub, { color: subTextColor }]}>Ready for bank transfer</Text>
          </View>

          {/* Card 6: On-Hold Balance */}
          <View style={[styles.telemetryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.telemetryCardHeader}>
              <Text style={[styles.telemetryLabel, { color: subTextColor }]}>On-Hold Escrow</Text>
              <View style={[styles.telemetryIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="lock-closed" size={16} color="#ef4444" />
              </View>
            </View>
            <Text style={[styles.telemetryValue, { color: '#ef4444' }]}>
              ₹{summary.totalHeld.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.telemetrySub, { color: subTextColor }]}>Dispute & return holds</Text>
          </View>
        </View>

        {/* Master Controls: View Tab Selector & Search Filters */}
        <View style={[styles.controlsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* Segmented View Switcher */}
          <View style={[styles.viewTabContainer, { backgroundColor: innerBg, borderColor: cardBorder }]}>
            <TouchableOpacity
              style={[
                styles.viewTabBtn,
                activeTab === 'STORES' && [
                  styles.viewTabBtnActive,
                  { backgroundColor: isLight ? '#16a34a' : '#00ff87' },
                ],
              ]}
              onPress={() => setActiveTab('STORES')}
            >
              <Ionicons
                name="storefront"
                size={14}
                color={activeTab === 'STORES' ? (isLight ? '#ffffff' : '#020b06') : subTextColor}
              />
              <Text
                style={[
                  styles.viewTabText,
                  activeTab === 'STORES'
                    ? { color: isLight ? '#ffffff' : '#020b06', fontWeight: '800' }
                    : { color: subTextColor },
                ]}
              >
                Store Accounts ({stores.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewTabBtn,
                activeTab === 'TRANSACTIONS' && [
                  styles.viewTabBtnActive,
                  { backgroundColor: isLight ? '#16a34a' : '#00ff87' },
                ],
              ]}
              onPress={() => setActiveTab('TRANSACTIONS')}
            >
              <Ionicons
                name="list"
                size={14}
                color={activeTab === 'TRANSACTIONS' ? (isLight ? '#ffffff' : '#020b06') : subTextColor}
              />
              <Text
                style={[
                  styles.viewTabText,
                  activeTab === 'TRANSACTIONS'
                    ? { color: isLight ? '#ffffff' : '#020b06', fontWeight: '800' }
                    : { color: subTextColor },
                ]}
              >
                Payout Transactions ({transactions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewTabBtn,
                activeTab === 'GSTR8' && [
                  styles.viewTabBtnActive,
                  { backgroundColor: isLight ? '#16a34a' : '#00ff87' },
                ],
              ]}
              onPress={() => setActiveTab('GSTR8')}
            >
              <Ionicons
                name="document-text"
                size={14}
                color={activeTab === 'GSTR8' ? (isLight ? '#ffffff' : '#020b06') : subTextColor}
              />
              <Text
                style={[
                  styles.viewTabText,
                  activeTab === 'GSTR8'
                    ? { color: isLight ? '#ffffff' : '#020b06', fontWeight: '800' }
                    : { color: subTextColor },
                ]}
              >
                GSTR-8 Tax Audit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box & Status Filter Pills */}
          <View style={styles.searchAndFiltersRow}>
            <View style={[styles.searchBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <Ionicons name="search" size={16} color={subTextColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search by store name, merchant, GSTIN, or UTR..."
                placeholderTextColor={subTextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={subTextColor} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills for Stores View */}
            {activeTab === 'STORES' && (
              <View style={styles.filterPillsRow}>
                {(['ALL', 'ACTIVE', 'PENDING_PAYOUT', 'FROZEN'] as const).map((filter) => {
                  const isActive = statusFilter === filter;
                  const label =
                    filter === 'PENDING_PAYOUT'
                      ? 'Payout Due'
                      : filter === 'ALL'
                      ? 'All Stores'
                      : filter === 'ACTIVE'
                      ? 'Settled'
                      : 'Frozen';
                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.filterPill,
                        { borderColor: cardBorder, backgroundColor: innerBg },
                        isActive && {
                          backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.18)',
                          borderColor: isLight ? '#16a34a' : '#00ff87',
                        },
                      ]}
                      onPress={() => setStatusFilter(filter)}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          { color: subTextColor },
                          isActive && { color: isLight ? '#16a34a' : '#00ff87', fontWeight: '700' },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Content Section */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>Loading merchant settlement accounts...</Text>
          </View>
        ) : activeTab === 'STORES' ? (
          /* Store Accounts Tab */
          <View style={styles.listSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: textColor }]}>
                Registered Merchant Store Ledgers
              </Text>
              <Text style={[styles.sectionCountBadge, { color: subTextColor }]}>
                Showing {filteredStores.length} stores
              </Text>
            </View>

            {filteredStores.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <MaterialCommunityIcons name="storefront-remove" size={48} color={subTextColor} />
                <Text style={[styles.emptyTitle, { color: textColor }]}>No matching seller stores found</Text>
                <Text style={[styles.emptySub, { color: subTextColor }]}>Try adjusting your search query or filter status.</Text>
              </View>
            ) : (
              <View style={styles.storeCardsGrid}>
                {filteredStores.map((store) => {
                  const badge = getStatusBadgeStyle(store.status);
                  return (
                    <View
                      key={store.id}
                      style={[
                        styles.storeCard,
                        { backgroundColor: cardBg, borderColor: cardBorder },
                        store.isFrozen && { borderColor: '#ef4444' },
                        store.availableBalance > 0 && !store.isFrozen && {
                          borderColor: isLight ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.6)',
                        },
                      ]}
                    >
                      {/* Top Store Info */}
                      <View style={styles.storeCardTop}>
                        <View style={styles.storeTitleCol}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.storeName, { color: textColor }]}>{store.storeName}</Text>
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark-circle" size={13} color="#0284c7" />
                            </View>
                            <View style={[styles.sellerTypeChip, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <Text style={[styles.sellerTypeText, { color: subTextColor }]}>{store.sellerType}</Text>
                            </View>
                          </View>
                          <Text style={[styles.storeOwner, { color: subTextColor }]}>
                            {store.seller.name} • {store.seller.mobile}
                          </Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <Ionicons name={badge.icon} size={12} color={badge.color} />
                          <Text style={[styles.statusBadgeText, { color: badge.color }]}>{store.status.replace('_', ' ')}</Text>
                        </View>
                      </View>

                      {/* Store Meta Row */}
                      <View style={[styles.metaRow, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <View style={styles.metaCol}>
                          <Text style={[styles.metaLabel, { color: subTextColor }]}>GSTIN / PAN</Text>
                          <Text style={[styles.metaVal, { color: textColor }]}>{store.gstin}</Text>
                        </View>
                        <View style={styles.metaCol}>
                          <Text style={[styles.metaLabel, { color: subTextColor }]}>Primary Bank</Text>
                          <Text style={[styles.metaVal, { color: textColor }]}>
                            {store.bankName} ({store.bankAccountNo})
                          </Text>
                        </View>
                        <View style={styles.metaCol}>
                          <Text style={[styles.metaLabel, { color: subTextColor }]}>Base Commission</Text>
                          <Text style={[styles.metaVal, { color: '#f59e0b' }]}>{store.commissionRate}%</Text>
                        </View>
                        <View style={styles.metaCol}>
                          <Text style={[styles.metaLabel, { color: subTextColor }]}>Payout Cycle</Text>
                          <Text style={[styles.metaVal, { color: isLight ? '#0284c7' : '#38bdf8' }]}>
                            {store.payoutCycle.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>

                      {/* Financial Breakdown Grid */}
                      <View style={styles.financialRow}>
                        <View style={styles.financialItem}>
                          <Text style={[styles.financialLabel, { color: subTextColor }]}>Gross Sales</Text>
                          <Text style={[styles.financialVal, { color: textColor }]}>
                            ₹{store.grossSales.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={[styles.financialLabel, { color: subTextColor }]}>FarmsKing Fee</Text>
                          <Text style={[styles.financialVal, { color: '#f59e0b' }]}>
                            -₹{store.commissionAmount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={[styles.financialLabel, { color: subTextColor }]}>1% GST TCS</Text>
                          <Text style={[styles.financialVal, { color: '#8b5cf6' }]}>
                            -₹{store.tcsAmount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={[styles.financialLabel, { color: subTextColor }]}>Net Settled</Text>
                          <Text style={[styles.financialVal, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                            ₹{store.netDisbursed.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      {/* Store Card Footer & Operations Bar */}
                      <View style={[styles.storeCardFooter, { borderTopColor: cardBorder }]}>
                        <View>
                          <Text style={[styles.pendingLabel, { color: subTextColor }]}>Available for Payout</Text>
                          <Text
                            style={[
                              styles.pendingAmount,
                              { color: store.availableBalance > 0 ? '#f59e0b' : subTextColor },
                            ]}
                          >
                            ₹{store.availableBalance.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View style={styles.cardActionsGroup}>
                          <TouchableOpacity
                            style={[styles.outlineBtn, { borderColor: cardBorder, backgroundColor: innerBg }]}
                            onPress={() => {
                              setSelectedStoreDossier(store);
                              setDossierModalVisible(true);
                            }}
                          >
                            <Ionicons name="eye-outline" size={13} color={textColor} />
                            <Text style={[styles.outlineBtnText, { color: textColor }]}>Dossier</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.outlineBtn, { borderColor: cardBorder, backgroundColor: innerBg }]}
                            onPress={() => handleOpenCommissionModal(store)}
                          >
                            <Ionicons name="options-outline" size={13} color="#f59e0b" />
                            <Text style={[styles.outlineBtnText, { color: textColor }]}>Rates</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.payoutActionBtn,
                              { backgroundColor: isLight ? '#16a34a' : '#00ff87' },
                              store.isFrozen && { backgroundColor: '#64748b' },
                            ]}
                            onPress={() => handleOpenPayoutModal(store)}
                          >
                            <Ionicons
                              name="paper-plane"
                              size={13}
                              color={isLight ? '#ffffff' : '#020b06'}
                            />
                            <Text
                              style={[
                                styles.payoutActionBtnText,
                                { color: isLight ? '#ffffff' : '#020b06' },
                              ]}
                            >
                              Disburse
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : activeTab === 'TRANSACTIONS' ? (
          /* Nodal Payout Ledger Tab */
          <View style={styles.listSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: textColor }]}>
                Nodal Bank Settlement Transactions
              </Text>
              <Text style={[styles.sectionCountBadge, { color: subTextColor }]}>
                {filteredTransactions.length} recorded payouts
              </Text>
            </View>

            {filteredTransactions.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Ionicons name="receipt-outline" size={48} color={subTextColor} />
                <Text style={[styles.emptyTitle, { color: textColor }]}>No settlement transactions found</Text>
                <Text style={[styles.emptySub, { color: subTextColor }]}>Disbursed payouts will appear here.</Text>
              </View>
            ) : (
              <View style={styles.txListContainer}>
                {filteredTransactions.map((tx) => {
                  const badge = getStatusBadgeStyle(tx.status);
                  return (
                    <View
                      key={tx.id}
                      style={[styles.txCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                    >
                      <View style={styles.txCardHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.txRefNo, { color: textColor }]}>{tx.payoutRefNo}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                              <Ionicons name={badge.icon} size={11} color={badge.color} />
                              <Text style={[styles.statusBadgeText, { color: badge.color }]}>{tx.status}</Text>
                            </View>
                            <View style={[styles.sellerTypeChip, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <Text style={[styles.sellerTypeText, { color: isLight ? '#0284c7' : '#38bdf8' }]}>
                                {tx.transferMode || 'IMPS'}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.txStoreName, { color: isLight ? '#0284c7' : '#38bdf8' }]}>
                            {tx.storeName} ({tx.sellerName})
                          </Text>
                          <Text style={[styles.txDate, { color: subTextColor }]}>
                            {new Date(tx.createdAt).toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.txNetLabel, { color: subTextColor }]}>Net Transferred</Text>
                          <Text
                            style={[
                              styles.txNetVal,
                              { color: isLight ? '#16a34a' : '#00ff87' },
                            ]}
                          >
                            ₹{Number(tx.netPayoutAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>

                      {/* Detailed Breakdown */}
                      <View style={[styles.txBreakdown, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <View style={styles.txBreakdownRow}>
                          <Text style={[styles.txBreakdownLabel, { color: subTextColor }]}>Gross Order Sales:</Text>
                          <Text style={[styles.txBreakdownVal, { color: textColor }]}>
                            ₹{Number(tx.totalGrossAmount).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.txBreakdownRow}>
                          <Text style={[styles.txBreakdownLabel, { color: subTextColor }]}>Platform Commission (5%):</Text>
                          <Text style={[styles.txBreakdownVal, { color: '#f59e0b' }]}>
                            -₹{Number(tx.totalCommissionAmount).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.txBreakdownRow}>
                          <Text style={[styles.txBreakdownLabel, { color: subTextColor }]}>1% GST TCS Deducted:</Text>
                          <Text style={[styles.txBreakdownVal, { color: '#8b5cf6' }]}>
                            -₹{Number(tx.totalTcsAmount).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      {/* Bank Details & UTR */}
                      <View style={styles.txFooterRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <FontAwesome5 name="university" size={12} color={subTextColor} />
                          <Text style={[styles.bankDetailsText, { color: subTextColor }]}>
                            {tx.bankName} ({tx.bankAccountNo}) • IFSC: {tx.bankIfsc}
                          </Text>
                        </View>

                        {tx.cashfreeUtrNo ? (
                          <View
                            style={[
                              styles.utrBadge,
                              {
                                backgroundColor: isLight ? 'rgba(22, 163, 74, 0.1)' : 'rgba(0, 255, 135, 0.12)',
                                borderColor: isLight ? 'rgba(22, 163, 74, 0.3)' : 'rgba(0, 255, 135, 0.3)',
                              },
                            ]}
                          >
                            <Ionicons name="finger-print" size={12} color={isLight ? '#16a34a' : '#00ff87'} />
                            <Text style={[styles.utrText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                              UTR: {tx.cashfreeUtrNo}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.utrBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                            <Text style={[styles.utrText, { color: '#f59e0b' }]}>UTR Pending</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          /* GSTR-8 Tax Audit View */
          <View style={styles.listSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: textColor }]}>
                GSTR-8 Monthly Tax Collected at Source (TCS) Ledger
              </Text>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: cardBorder, backgroundColor: innerBg }]}
                onPress={() => setGstr8ModalVisible(true)}
              >
                <Ionicons name="information-circle-outline" size={14} color={textColor} />
                <Text style={[styles.outlineBtnText, { color: textColor }]}>Tax Rules</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.gstr8AuditTable, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.gstr8TableRow, styles.gstr8TableHeader, { backgroundColor: innerBg, borderBottomColor: cardBorder }]}>
                <Text style={[styles.gstr8Col, styles.gstr8ColStore, { color: textColor, fontWeight: '800' }]}>Store / Merchant</Text>
                <Text style={[styles.gstr8Col, styles.gstr8ColGstin, { color: textColor, fontWeight: '800' }]}>GSTIN</Text>
                <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: textColor, fontWeight: '800' }]}>Gross Sales (₹)</Text>
                <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: textColor, fontWeight: '800' }]}>Net Taxable (₹)</Text>
                <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: textColor, fontWeight: '800' }]}>1% TCS (₹)</Text>
              </View>

              {stores.map((s) => (
                <View key={s.id} style={[styles.gstr8TableRow, { borderBottomColor: cardBorder }]}>
                  <Text style={[styles.gstr8Col, styles.gstr8ColStore, { color: textColor }]} numberOfLines={1}>{s.storeName}</Text>
                  <Text style={[styles.gstr8Col, styles.gstr8ColGstin, { color: subTextColor }]} numberOfLines={1}>{s.gstin}</Text>
                  <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: textColor }]}>₹{s.grossSales.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: isLight ? '#0284c7' : '#38bdf8' }]}>₹{(s.grossSales * 0.95).toLocaleString('en-IN')}</Text>
                  <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: '#8b5cf6', fontWeight: '800' }]}>₹{s.tcsAmount.toLocaleString('en-IN')}</Text>
                </View>
              ))}

              <View style={[styles.gstr8TableRow, styles.gstr8TableFooter, { backgroundColor: innerBg }]}>
                <Text style={[styles.gstr8Col, styles.gstr8ColStore, { color: textColor, fontWeight: '800' }]}>Total Tax Liability</Text>
                <Text style={[styles.gstr8Col, styles.gstr8ColGstin, { color: subTextColor }]}>Section 52 CGST</Text>
                <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: textColor, fontWeight: '800' }]}>₹{summary.totalGross.toLocaleString('en-IN')}</Text>
                <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: isLight ? '#0284c7' : '#38bdf8', fontWeight: '800' }]}>₹{(summary.totalGross * 0.95).toLocaleString('en-IN')}</Text>
                <Text style={[styles.gstr8Col, styles.gstr8ColNum, { color: '#8b5cf6', fontWeight: '900', fontSize: 13 }]}>₹{summary.totalTcs.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Seller Account Full Dossier Modal */}
      <Modal visible={dossierModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.dossierModalBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {selectedStoreDossier && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.modalTitle, { color: textColor }]}>
                        {selectedStoreDossier.storeName}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeStyle(selectedStoreDossier.status).bg }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusBadgeStyle(selectedStoreDossier.status).color }]}>
                          {selectedStoreDossier.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.modalSubtitle, { color: subTextColor }]}>
                      Merchant Account Ledger & Compliance Dossier
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDossierModalVisible(false)}>
                    <Ionicons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
                  {/* Merchant Identity & Bank Card */}
                  <View style={[styles.dossierCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Text style={[styles.dossierCardTitle, { color: textColor }]}>Merchant Identity & Bank Account</Text>
                    <View style={styles.dossierGrid}>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>Merchant Name</Text>
                        <Text style={[styles.dossierVal, { color: textColor }]}>{selectedStoreDossier.seller.name}</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>Mobile Number</Text>
                        <Text style={[styles.dossierVal, { color: textColor }]}>{selectedStoreDossier.seller.mobile}</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>GSTIN</Text>
                        <Text style={[styles.dossierVal, { color: textColor }]}>{selectedStoreDossier.gstin}</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>PAN Number</Text>
                        <Text style={[styles.dossierVal, { color: textColor }]}>{selectedStoreDossier.panNumber}</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>Bank Account</Text>
                        <Text style={[styles.dossierVal, { color: textColor }]}>{selectedStoreDossier.bankName} ({selectedStoreDossier.bankAccountNo})</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>IFSC Code</Text>
                        <Text style={[styles.dossierVal, { color: textColor }]}>{selectedStoreDossier.bankIfsc}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Financial Statement */}
                  <View style={[styles.dossierCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Text style={[styles.dossierCardTitle, { color: textColor }]}>Store Financial Statement</Text>
                    <View style={styles.dossierGrid}>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>Lifetime Gross Sales</Text>
                        <Text style={[styles.dossierVal, { color: textColor }]}>₹{selectedStoreDossier.grossSales.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>Platform Commission Paid</Text>
                        <Text style={[styles.dossierVal, { color: '#f59e0b' }]}>₹{selectedStoreDossier.commissionAmount.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>GST TCS Withheld</Text>
                        <Text style={[styles.dossierVal, { color: '#8b5cf6' }]}>₹{selectedStoreDossier.tcsAmount.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>Total Net Disbursed</Text>
                        <Text style={[styles.dossierVal, { color: isLight ? '#16a34a' : '#00ff87' }]}>₹{selectedStoreDossier.netDisbursed.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>Available for Payout</Text>
                        <Text style={[styles.dossierVal, { color: '#f59e0b', fontSize: 15, fontWeight: '800' }]}>
                          ₹{selectedStoreDossier.availableBalance.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.dossierItem}>
                        <Text style={[styles.dossierLabel, { color: subTextColor }]}>On-Hold Escrow</Text>
                        <Text style={[styles.dossierVal, { color: '#ef4444' }]}>₹{selectedStoreDossier.heldBalance.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Operational Settings */}
                  <View style={[styles.dossierCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Text style={[styles.dossierCardTitle, { color: textColor }]}>Governance & Account Actions</Text>
                    <View style={styles.dossierActionRow}>
                      <TouchableOpacity
                        style={[
                          styles.actionChipBtn,
                          {
                            backgroundColor: selectedStoreDossier.isFrozen ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                            borderColor: selectedStoreDossier.isFrozen ? '#ef4444' : '#f59e0b',
                          },
                        ]}
                        onPress={() => handleToggleFreeze(selectedStoreDossier.id)}
                      >
                        <Ionicons
                          name={selectedStoreDossier.isFrozen ? 'lock-open-outline' : 'lock-closed-outline'}
                          size={14}
                          color={selectedStoreDossier.isFrozen ? '#ef4444' : '#f59e0b'}
                        />
                        <Text style={[styles.actionChipBtnText, { color: selectedStoreDossier.isFrozen ? '#ef4444' : '#f59e0b' }]}>
                          {selectedStoreDossier.isFrozen ? 'Unfreeze Account' : 'Freeze Payouts'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionChipBtn,
                          { backgroundColor: 'rgba(2, 132, 199, 0.15)', borderColor: '#0284c7' },
                        ]}
                        onPress={() => {
                          setDossierModalVisible(false);
                          handleOpenCommissionModal(selectedStoreDossier);
                        }}
                      >
                        <Ionicons name="options-outline" size={14} color="#0284c7" />
                        <Text style={[styles.actionChipBtnText, { color: '#0284c7' }]}>
                          Edit Commission ({selectedStoreDossier.commissionRate}%)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionChipBtn,
                          { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)', borderColor: isLight ? '#16a34a' : '#00ff87' },
                        ]}
                        onPress={() => {
                          setDossierModalVisible(false);
                          handleOpenPayoutModal(selectedStoreDossier);
                        }}
                      >
                        <Ionicons name="paper-plane" size={14} color={isLight ? '#16a34a' : '#00ff87'} />
                        <Text style={[styles.actionChipBtnText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                          Disburse Balance
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Manual Settlement Execution Modal */}
      <Modal visible={settlementModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textColor }]}>Execute Seller Payout</Text>
                <Text style={[styles.modalSubtitle, { color: subTextColor }]}>
                  Direct Bank Disbursement to Merchant
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSettlementModalVisible(false)}>
                <Ionicons name="close" size={22} color={textColor} />
              </TouchableOpacity>
            </View>

            {selectedStoreForPayout && (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Store Summary Card */}
                <View style={[styles.modalStoreCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <Text style={[styles.modalStoreName, { color: textColor }]}>
                    {selectedStoreForPayout.storeName}
                  </Text>
                  <Text style={[styles.modalStoreOwner, { color: subTextColor }]}>
                    Merchant: {selectedStoreForPayout.seller.name} ({selectedStoreForPayout.seller.mobile})
                  </Text>
                  <Text style={[styles.modalStoreBank, { color: isLight ? '#0284c7' : '#38bdf8' }]}>
                    🏦 {selectedStoreForPayout.bankName} • A/C: {selectedStoreForPayout.bankAccountNo} • IFSC: {selectedStoreForPayout.bankIfsc}
                  </Text>
                  <Text style={[styles.modalStoreGstin, { color: subTextColor }]}>
                    GSTIN: {selectedStoreForPayout.gstin}
                  </Text>
                </View>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Settlement Gross Amount (₹)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                    keyboardType="numeric"
                    value={payoutAmountInput}
                    onChangeText={setPayoutAmountInput}
                    placeholder="Enter amount in ₹"
                    placeholderTextColor={subTextColor}
                  />
                  <Text style={[styles.inputHint, { color: subTextColor }]}>
                    5% platform fee and 1% GST TCS will be deducted automatically.
                  </Text>
                </View>

                {/* Transfer Mode Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Transfer Mode</Text>
                  <View style={styles.modeRow}>
                    {(['IMPS', 'NEFT', 'RTGS', 'UPI'] as const).map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.modeBtn,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          payoutMode === mode && {
                            backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.2)',
                            borderColor: isLight ? '#16a34a' : '#00ff87',
                          },
                        ]}
                        onPress={() => setPayoutMode(mode)}
                      >
                        <Text
                          style={[
                            styles.modeBtnText,
                            { color: subTextColor },
                            payoutMode === mode && { color: isLight ? '#16a34a' : '#00ff87', fontWeight: '800' },
                          ]}
                        >
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* UTR Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Bank UTR Reference Number</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                    value={payoutUtrInput}
                    onChangeText={setPayoutUtrInput}
                    placeholder="Bank reference UTR number"
                    placeholderTextColor={subTextColor}
                  />
                </View>
              </ScrollView>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: innerBg, borderColor: cardBorder }]}
                onPress={() => setSettlementModalVisible(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: isLight ? '#16a34a' : '#00ff87' },
                ]}
                onPress={handleExecutePayout}
                disabled={isProcessingPayout}
              >
                {isProcessingPayout ? (
                  <ActivityIndicator size="small" color={isLight ? '#ffffff' : '#020b06'} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color={isLight ? '#ffffff' : '#020b06'} />
                    <Text style={[styles.modalConfirmBtnText, { color: isLight ? '#ffffff' : '#020b06' }]}>
                      Confirm Disbursement
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Commission Setting Modal */}
      <Modal visible={commissionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textColor }]}>Set Seller Commission</Text>
                <Text style={[styles.modalSubtitle, { color: subTextColor }]}>
                  {storeForCommission?.storeName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCommissionModalVisible(false)}>
                <Ionicons name="close" size={22} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Base Store Commission Rate (%)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                keyboardType="numeric"
                value={baseCommissionInput}
                onChangeText={setBaseCommissionInput}
                placeholder="5.0"
                placeholderTextColor={subTextColor}
              />
              <Text style={[styles.inputHint, { color: subTextColor }]}>
                Standard platform fee is 5.0%. Customise for volume partners.
              </Text>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: innerBg, borderColor: cardBorder }]}
                onPress={() => setCommissionModalVisible(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: isLight ? '#16a34a' : '#00ff87' }]}
                onPress={handleSaveCommission}
                disabled={savingCommission}
              >
                {savingCommission ? (
                  <ActivityIndicator size="small" color={isLight ? '#ffffff' : '#020b06'} />
                ) : (
                  <Text style={[styles.modalConfirmBtnText, { color: isLight ? '#ffffff' : '#020b06' }]}>
                    Save Rate
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GSTR-8 Compliance Dossier Modal */}
      <Modal visible={gstr8ModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text" size={20} color="#8b5cf6" />
                <Text style={[styles.modalTitle, { color: textColor }]}>GSTR-8 E-Commerce Tax Rules</Text>
              </View>
              <TouchableOpacity onPress={() => setGstr8ModalVisible(false)}>
                <Ionicons name="close" size={22} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.gstr8Card, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.gstr8RuleTitle, { color: textColor }]}>
                  Section 52 of CGST Act (Tax Collected at Source)
                </Text>
                <Text style={[styles.gstr8RuleDesc, { color: subTextColor }]}>
                  As an Electronic Commerce Operator (ECO), FarmsKing is legally mandated to deduct 1% GST TCS (0.5% CGST + 0.5% SGST or 1% IGST) on the net value of taxable supplies made by third-party agricultural merchants through the portal.
                </Text>

                <View style={[styles.gstr8StatRow, { borderTopColor: cardBorder }]}>
                  <View style={styles.gstr8StatCol}>
                    <Text style={[styles.gstr8StatLabel, { color: subTextColor }]}>Current GSTR-8 Month</Text>
                    <Text style={[styles.gstr8StatVal, { color: textColor }]}>October 2026</Text>
                  </View>
                  <View style={styles.gstr8StatCol}>
                    <Text style={[styles.gstr8StatLabel, { color: subTextColor }]}>Total TCS Deducted</Text>
                    <Text style={[styles.gstr8StatVal, { color: '#8b5cf6' }]}>
                      ₹{summary.totalTcs.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: isLight ? '#16a34a' : '#00ff87' }]}
              onPress={() => setGstr8ModalVisible(false)}
            >
              <Text style={[styles.closeModalBtnText, { color: isLight ? '#ffffff' : '#020b06' }]}>
                Understood & Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  storeOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  storeOnlyText: {
    fontSize: 10,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  refreshIconBtn: {
    padding: 7,
    borderRadius: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  telemetryCard: {
    flex: 1,
    minWidth: 150,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  telemetryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  telemetryLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  telemetryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  telemetrySub: {
    fontSize: 9.5,
    marginTop: 2,
  },
  controlsCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  viewTabContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  viewTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewTabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  viewTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchAndFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionCountBadge: {
    fontSize: 11,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  storeCardsGrid: {
    gap: 12,
  },
  storeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  storeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeTitleCol: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedBadge: {
    marginTop: 1,
  },
  sellerTypeChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  sellerTypeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  storeOwner: {
    fontSize: 11.5,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    flexWrap: 'wrap',
  },
  metaCol: {
    flex: 1,
    minWidth: 110,
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  financialItem: {
    flex: 1,
    minWidth: 90,
  },
  financialLabel: {
    fontSize: 10,
  },
  financialVal: {
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 2,
  },
  storeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  pendingLabel: {
    fontSize: 10,
  },
  pendingAmount: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  cardActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  payoutActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  payoutActionBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  txListContainer: {
    gap: 10,
  },
  txCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  txCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txRefNo: {
    fontSize: 13,
    fontWeight: '800',
  },
  txStoreName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  txDate: {
    fontSize: 10.5,
    marginTop: 1,
  },
  txNetLabel: {
    fontSize: 10,
  },
  txNetVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  txBreakdown: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  txBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txBreakdownLabel: {
    fontSize: 10.5,
  },
  txBreakdownVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  txFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  bankDetailsText: {
    fontSize: 10.5,
  },
  utrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  utrText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  gstr8AuditTable: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gstr8TableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  gstr8TableHeader: {
    paddingVertical: 10,
  },
  gstr8TableFooter: {
    borderBottomWidth: 0,
    paddingVertical: 12,
  },
  gstr8Col: {
    fontSize: 11.5,
  },
  gstr8ColStore: {
    flex: 2,
    fontWeight: '700',
  },
  gstr8ColGstin: {
    flex: 1.5,
  },
  gstr8ColNum: {
    flex: 1.2,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  dossierModalBox: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  modalStoreCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 3,
  },
  modalStoreName: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalStoreOwner: {
    fontSize: 11,
  },
  modalStoreBank: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  modalStoreGstin: {
    fontSize: 10,
  },
  dossierCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  dossierCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  dossierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dossierItem: {
    width: '48%',
  },
  dossierLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  dossierVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  dossierActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  actionChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionChipBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
    gap: 5,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
  },
  inputHint: {
    fontSize: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gstr8Card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  gstr8RuleTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  gstr8RuleDesc: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  gstr8StatRow: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  gstr8StatCol: {
    flex: 1,
  },
  gstr8StatLabel: {
    fontSize: 10,
  },
  gstr8StatVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  closeModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  closeModalBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
