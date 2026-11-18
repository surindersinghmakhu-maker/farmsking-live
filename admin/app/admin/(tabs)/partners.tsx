import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/src/api/client';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { showAdminToast } from '@/components/AdminLiveToastNotification';
import { playKycAlertChime } from '@/src/utils/audioAlert';
import { exportAccountsToExcel } from '@/src/utils/excelExport';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

type PartnerTabKey = 'OVERVIEW' | 'NEW_APPROVALS' | 'EDIT_APPROVALS' | 'FINANCES' | 'OPERATIONS' | 'REPORTS';
type PartnerRoleFilter = 'ALL' | 'SELLER' | 'ADVISOR' | 'AGENT' | 'NURSERY' | 'TRAINER';

interface PartnerAccount {
  id: string;
  kingId: string;
  name: string;
  mobile: string;
  email?: string;
  role: 'SELLER' | 'ADVISOR' | 'AGENT' | 'NURSERY' | 'TRAINER';
  advisorType?: 'FARM' | 'GARDEN' | null;
  businessName?: string;
  district: string;
  state: string;
  status: 'ACTIVE' | 'PENDING' | 'DEACTIVATED' | 'LOCKED';
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  walletBalance: number;
  totalEarnings: number;
  pendingPayout: number;
  commissionRate: number; // For Seller/Agent: platform commission %; For Doctor: doctor share %
  rating: number;
  totalJobs: number; // Consultations, Orders or Referrals
  bankAccount: string;
  bankName: string;
  bankIfsc: string;
  upiId?: string;
  joinedDate: string;
  licenseNumber?: string;
  specialization?: string;
}

interface NewApprovalApplication {
  id: string;
  applicantName: string;
  mobile: string;
  kingId?: string;
  role: 'SELLER' | 'ADVISOR' | 'AGENT' | 'NURSERY';
  advisorType?: 'FARM' | 'GARDEN';
  businessName: string;
  location: string;
  appliedDate: string;
  submittedDocs: {
    pan?: string;
    aadhaar?: string;
    gstin?: string;
    degreeOrLicense?: string;
    documentUrl?: string;
  };
  specialization?: string;
  yearsExperience?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface EditApprovalRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  kingId: string;
  role: string;
  requestType: 'BANK_ACCOUNT' | 'UPI_ID' | 'STORE_NAME' | 'CLINIC_HOURS' | 'CONSULTATION_FEE';
  currentValue: string;
  requestedValue: string;
  reason: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface PayoutRequestItem {
  id: string;
  partnerName: string;
  kingId: string;
  role: string;
  amount: number;
  paymentMode: 'UPI' | 'IMPS_BANK';
  targetAddress: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function PartnersGovernanceScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  // Active Tab & Filters
  const initialTab = (searchParams.tab as PartnerTabKey) || 'OVERVIEW';
  const [activeTab, setActiveTab] = useState<PartnerTabKey>(initialTab);
  const [roleFilter, setRoleFilter] = useState<PartnerRoleFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Dialogs
  const [selectedPartnerForDossier, setSelectedPartnerForDossier] = useState<PartnerAccount | null>(null);
  const [showA4PrintModal, setShowA4PrintModal] = useState(false);
  const [approveModalItem, setApproveModalItem] = useState<NewApprovalApplication | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<NewApprovalApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customCommissionInput, setCustomCommissionInput] = useState('85.0');
  const [payoutProcessModal, setPayoutProcessModal] = useState<PayoutRequestItem | null>(null);
  const [utrReferenceInput, setUtrReferenceInput] = useState('');
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Synchronize deep links
  useEffect(() => {
    if (searchParams.tab && ['OVERVIEW', 'NEW_APPROVALS', 'EDIT_APPROVALS', 'FINANCES', 'OPERATIONS', 'REPORTS'].includes(searchParams.tab as string)) {
      setActiveTab(searchParams.tab as PartnerTabKey);
    }
  }, [searchParams.tab]);

  // Master Registered Partners Dataset
  const [partners, setPartners] = useState<PartnerAccount[]>([
    {
      id: 'p-1',
      kingId: 'FK-DOC-701',
      name: 'Dr. Surinder Kumar',
      mobile: '+91 98720 66901',
      email: 'surinder.doc@farmsking.in',
      role: 'ADVISOR',
      advisorType: 'FARM',
      businessName: 'Green Agroscience Tele-Clinic',
      district: 'Tarn Taran',
      state: 'Punjab',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      walletBalance: 24850,
      totalEarnings: 184500,
      pendingPayout: 12000,
      commissionRate: 85.0, // 85% to agronomist, 15% platform
      rating: 4.9,
      totalJobs: 382,
      bankName: 'HDFC Bank',
      bankAccount: '•••• 4921',
      bankIfsc: 'HDFC0001824',
      upiId: 'surinder.crop@okaxis',
      licenseNumber: 'PAU/AGRI/DOC/2018/884',
      specialization: 'Wheat, Paddy & Cotton Pathology',
      joinedDate: '2026-03-12',
    },
    {
      id: 'p-2',
      kingId: 'FK-RET-842',
      name: 'Baldev Singh',
      mobile: '+91 98765 43210',
      email: 'baldev.kisan@farmsking.in',
      role: 'SELLER',
      businessName: 'Kisan Agro Super Kendra',
      district: 'Amritsar',
      state: 'Punjab',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      walletBalance: 43000,
      totalEarnings: 450000,
      pendingPayout: 35000,
      commissionRate: 5.0, // 5% marketplace commission
      rating: 4.8,
      totalJobs: 1290,
      bankName: 'HDFC Bank',
      bankAccount: '•••• 8821',
      bankIfsc: 'HDFC0001248',
      upiId: 'baldev.agro@okhdfc',
      licenseNumber: 'PB/ASR/FERT/2021/104',
      joinedDate: '2026-02-18',
    },
    {
      id: 'p-3',
      kingId: 'FK-AGT-109',
      name: 'Harpreet Singh',
      mobile: '+91 98140 11223',
      role: 'AGENT',
      businessName: 'Majha Agro Sales & Distribution',
      district: 'Gurdaspur',
      state: 'Punjab',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      walletBalance: 16500,
      totalEarnings: 98000,
      pendingPayout: 8500,
      commissionRate: 4.0,
      rating: 4.7,
      totalJobs: 640,
      bankName: 'State Bank of India',
      bankAccount: '•••• 1109',
      bankIfsc: 'SBIN0000691',
      upiId: 'harpreet.agent@oksbi',
      joinedDate: '2026-04-01',
    },
    {
      id: 'p-4',
      kingId: 'FK-NUR-303',
      name: 'Gurvinder Kaur',
      mobile: '+91 98888 77665',
      role: 'NURSERY',
      businessName: 'Khalsa High-Yield Plant Nursery',
      district: 'Kapurthala',
      state: 'Punjab',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      walletBalance: 32000,
      totalEarnings: 280000,
      pendingPayout: 18000,
      commissionRate: 6.0,
      rating: 5.0,
      totalJobs: 512,
      bankName: 'Punjab National Bank',
      bankAccount: '•••• 9942',
      bankIfsc: 'PUNB0182400',
      upiId: 'khalsa.nursery@paytm',
      licenseNumber: 'NHB/PB/NUR/2023/491',
      joinedDate: '2026-01-20',
    },
    {
      id: 'p-5',
      kingId: 'FK-DOC-702',
      name: 'Dr. Priya Sharma',
      mobile: '+91 94170 33445',
      role: 'ADVISOR',
      advisorType: 'GARDEN',
      businessName: 'Urban Flora & Garden Tele-Clinic',
      district: 'Chandigarh',
      state: 'Punjab',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      walletBalance: 14200,
      totalEarnings: 76000,
      pendingPayout: 6000,
      commissionRate: 85.0,
      rating: 4.9,
      totalJobs: 194,
      bankName: 'ICICI Bank',
      bankAccount: '•••• 3312',
      bankIfsc: 'ICIC0000104',
      upiId: 'priya.garden@icici',
      licenseNumber: 'ICAR/HORT/2022/339',
      specialization: 'Balcony Gardening, Hydroponics & Roses',
      joinedDate: '2026-05-10',
    },
  ]);

  // Master New Applications Dataset
  const [newApplications, setNewApplications] = useState<NewApprovalApplication[]>([
    {
      id: 'app-1',
      applicantName: 'Dr. Manjit Singh B.Sc (Agri)',
      mobile: '+91 98150 99887',
      kingId: 'FK-DOC-790',
      role: 'ADVISOR',
      advisorType: 'FARM',
      businessName: 'Doaba Crop Protection Clinic',
      location: 'Jalandhar, Punjab',
      appliedDate: '2026-11-14',
      submittedDocs: {
        pan: 'BSKPM4921A',
        aadhaar: 'XXXX-XXXX-8921',
        degreeOrLicense: 'PAU Ludhiana B.Sc Agriculture Degree Certificate #2019/AG/182',
        documentUrl: 'https://cdn.farmsking.com/kyc/pau-degree-sample.pdf',
      },
      specialization: 'Pesticide Dosages, Paddy Blast & Wheat Rust Management',
      yearsExperience: 8,
      status: 'PENDING',
    },
    {
      id: 'app-2',
      applicantName: 'Jaswinder Fertilizer & Seed Store',
      mobile: '+91 98722 44556',
      kingId: 'FK-RET-899',
      role: 'SELLER',
      businessName: 'Jaswinder Agro Supplies',
      location: 'Moga, Punjab',
      appliedDate: '2026-11-13',
      submittedDocs: {
        pan: 'AAACJ1294K',
        gstin: '03AAACJ1294K1Z2',
        degreeOrLicense: 'Punjab Agriculture Dept Seed & Fertilizer License #2026/MG/84',
        documentUrl: 'https://cdn.farmsking.com/kyc/moga-store-license.pdf',
      },
      status: 'PENDING',
    },
    {
      id: 'app-3',
      applicantName: 'Amrit Exotic Fruit Plants Nursery',
      mobile: '+91 97800 66554',
      kingId: 'FK-NUR-380',
      role: 'NURSERY',
      businessName: 'Amrit Horticulture Botanical Nursery',
      location: 'Hoshiarpur, Punjab',
      appliedDate: '2026-11-15',
      submittedDocs: {
        pan: 'AMKPK9920B',
        aadhaar: 'XXXX-XXXX-3341',
        degreeOrLicense: 'National Horticulture Board Certified Nursery License #NHB-PB-994',
        documentUrl: 'https://cdn.farmsking.com/kyc/amrit-nhb.pdf',
      },
      status: 'PENDING',
    },
  ]);

  // Master Edit Requests Dataset
  const [editRequests, setEditRequests] = useState<EditApprovalRequest[]>([
    {
      id: 'ed-1',
      partnerId: 'p-1',
      partnerName: 'Dr. Surinder Kumar',
      kingId: 'FK-DOC-701',
      role: 'Farm Advisor',
      requestType: 'BANK_ACCOUNT',
      currentValue: 'HDFC Bank (A/C: •••• 4921, IFSC: HDFC0001824)',
      requestedValue: 'State Bank of India (A/C: •••• 9012, IFSC: SBIN0001420)',
      reason: 'Switched primary salary account to SBI Branch in Goindwal Sahib.',
      requestedAt: '2026-11-15 14:20',
      status: 'PENDING',
      riskLevel: 'HIGH',
    },
    {
      id: 'ed-2',
      partnerId: 'p-2',
      partnerName: 'Baldev Singh (Kisan Agro Kendra)',
      kingId: 'FK-RET-842',
      role: 'Seller Store',
      requestType: 'STORE_NAME',
      currentValue: 'Kisan Agro Kendra',
      requestedValue: 'Kisan Agro Kendra & Kisan Super Mall',
      reason: 'Expanded physical premises into regional agri-mall.',
      requestedAt: '2026-11-14 18:05',
      status: 'PENDING',
      riskLevel: 'LOW',
    },
    {
      id: 'ed-3',
      partnerId: 'p-4',
      partnerName: 'Gurvinder Kaur',
      kingId: 'FK-NUR-303',
      role: 'Nursery Partner',
      requestType: 'UPI_ID',
      currentValue: 'khalsa.nursery@paytm',
      requestedValue: 'khalsa.plants@okhdfcbank',
      reason: 'Upgraded to HDFC current account business VPA.',
      requestedAt: '2026-11-15 09:45',
      status: 'PENDING',
      riskLevel: 'MEDIUM',
    },
  ]);

  // Master Payout Requests Dataset
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestItem[]>([
    {
      id: 'pay-1',
      partnerName: 'Dr. Surinder Kumar',
      kingId: 'FK-DOC-701',
      role: 'Farm Advisor',
      amount: 12000,
      paymentMode: 'UPI',
      targetAddress: 'surinder.crop@okaxis',
      requestedAt: '2026-11-15 11:30',
      status: 'PENDING',
    },
    {
      id: 'pay-2',
      partnerName: 'Baldev Singh (Kisan Agro)',
      kingId: 'FK-RET-842',
      role: 'Seller Store',
      amount: 35000,
      paymentMode: 'IMPS_BANK',
      targetAddress: 'HDFC Bank •••• 8821 (IFSC: HDFC0001248)',
      requestedAt: '2026-11-14 20:15',
      status: 'PENDING',
    },
    {
      id: 'pay-3',
      partnerName: 'Harpreet Singh',
      kingId: 'FK-AGT-109',
      role: 'Sales Manager',
      amount: 8500,
      paymentMode: 'UPI',
      targetAddress: 'harpreet.agent@oksbi',
      requestedAt: '2026-11-15 13:00',
      status: 'PENDING',
    },
  ]);

  // Aggregate Metrics
  const totalActivePartners = partners.filter((p) => p.status === 'ACTIVE').length;
  const pendingApprovalsCount = newApplications.filter((a) => a.status === 'PENDING').length;
  const pendingEditsCount = editRequests.filter((e) => e.status === 'PENDING').length;
  const totalPartnerEarnings = partners.reduce((sum, p) => sum + p.totalEarnings, 0);
  const totalPendingPayouts = payoutRequests.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);

  // Filtered Partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchRole =
        roleFilter === 'ALL'
          ? true
          : roleFilter === 'SELLER'
          ? p.role === 'SELLER'
          : roleFilter === 'ADVISOR'
          ? p.role === 'ADVISOR'
          : roleFilter === 'AGENT'
          ? p.role === 'AGENT'
          : roleFilter === 'NURSERY'
          ? p.role === 'NURSERY'
          : roleFilter === 'TRAINER'
          ? p.role === 'TRAINER'
          : true;

      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.kingId.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        (p.businessName && p.businessName.toLowerCase().includes(q)) ||
        p.district.toLowerCase().includes(q);

      return matchRole && matchQuery;
    });
  }, [partners, roleFilter, searchQuery]);

  // Handlers
  const handleApproveApplication = (app: NewApprovalApplication) => {
    setNewApplications((prev) =>
      prev.map((item) => (item.id === app.id ? { ...item, status: 'APPROVED' } : item))
    );
    const assignedKingId = app.kingId || `FK-${app.role.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;
    setPartners((prev) => [
      {
        id: `p-${Date.now()}`,
        kingId: assignedKingId,
        name: app.applicantName,
        mobile: app.mobile,
        role: app.role,
        advisorType: app.advisorType || (app.role === 'ADVISOR' ? 'FARM' : null),
        businessName: app.businessName,
        district: app.location.split(',')[0]?.trim() || 'Punjab',
        state: 'Punjab',
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        walletBalance: 0,
        totalEarnings: 0,
        pendingPayout: 0,
        commissionRate: parseFloat(customCommissionInput) || (app.role === 'ADVISOR' ? 85.0 : 5.0),
        rating: 5.0,
        totalJobs: 0,
        bankName: 'Verified Bank',
        bankAccount: '•••• 0000',
        bankIfsc: 'HDFC0000001',
        joinedDate: new Date().toISOString().split('T')[0],
        specialization: app.specialization,
      },
      ...prev,
    ]);
    setApproveModalItem(null);
    showAdminToast('SUCCESS', 'Partner Approved', `${app.applicantName} granted King ID ${assignedKingId} with ${customCommissionInput}% revenue rate.`);
  };

  const handleRejectApplication = (app: NewApprovalApplication) => {
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please specify the exact statutory reason for rejecting this partner application.');
      return;
    }
    setNewApplications((prev) =>
      prev.map((item) => (item.id === app.id ? { ...item, status: 'REJECTED' } : item))
    );
    setRejectModalItem(null);
    setRejectionReason('');
    showAdminToast('ALERT', 'Application Rejected', `Reason logged and sent: "${rejectionReason.trim()}".`);
  };

  const handleApproveEditRequest = (req: EditApprovalRequest) => {
    setEditRequests((prev) =>
      prev.map((item) => (item.id === req.id ? { ...item, status: 'APPROVED' } : item))
    );
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id !== req.partnerId) return p;
        if (req.requestType === 'STORE_NAME') return { ...p, businessName: req.requestedValue };
        if (req.requestType === 'UPI_ID') return { ...p, upiId: req.requestedValue };
        if (req.requestType === 'BANK_ACCOUNT') return { ...p, bankAccount: req.requestedValue };
        return p;
      })
    );
    showAdminToast('SUCCESS', 'Edit Approved', `Updated ${req.requestType} for ${req.partnerName}.`);
  };

  const handleDeclineEditRequest = (req: EditApprovalRequest) => {
    setEditRequests((prev) =>
      prev.map((item) => (item.id === req.id ? { ...item, status: 'REJECTED' } : item))
    );
    showAdminToast('WARNING', 'Edit Declined', `Declined ${req.requestType} request for ${req.partnerName}.`);
  };

  const handleDisbursePayout = (payout: PayoutRequestItem) => {
    if (!utrReferenceInput.trim()) {
      Alert.alert('UTR Required', 'Please enter bank UTR reference number or payment transaction ID.');
      return;
    }
    setPayoutRequests((prev) =>
      prev.map((p) => (p.id === payout.id ? { ...p, status: 'APPROVED' } : p))
    );
    setPartners((prev) =>
      prev.map((p) => {
        if (p.kingId !== payout.kingId) return p;
        return {
          ...p,
          pendingPayout: Math.max(0, p.pendingPayout - payout.amount),
          walletBalance: Math.max(0, p.walletBalance - payout.amount),
        };
      })
    );
    setPayoutProcessModal(null);
    setUtrReferenceInput('');
    showAdminToast('SUCCESS', 'Payout Disbursed', `Transferred ₹${payout.amount.toLocaleString('en-IN')} to ${payout.partnerName} via ${payout.paymentMode} (UTR: ${utrReferenceInput.trim()}).`);
  };

  const handleExportExcel = () => {
    try {
      const data = partners.map((p) => ({
        'King ID': p.kingId,
        'Partner Name': p.name,
        'Mobile': p.mobile,
        'Role': p.role,
        'Advisor / Business': p.businessName || 'N/A',
        'District': p.district,
        'Status': p.status,
        'Wallet Balance (₹)': p.walletBalance,
        'Gross Earnings (₹)': p.totalEarnings,
        'Pending Payout (₹)': p.pendingPayout,
        'Commission / Share (%)': p.commissionRate,
        'Rating': p.rating,
        'Jobs Completed': p.totalJobs,
        'Joined Date': p.joinedDate,
      }));
      exportAccountsToExcel(data as any, 'FarmsKing_Partners_Governance_Master');
      showAdminToast('SUCCESS', 'Excel Export Ready', 'Partner registry exported cleanly to XLSX format.');
    } catch (e: any) {
      Alert.alert('Export Error', e?.message || 'Failed to export partner data.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#f8fafc' : '#090e17' }]}>
      {/* 🏛️ 1. COMPACT INSTITUTIONAL ISO HEADER BANNER */}
      <View style={[styles.institutionalHeader, { backgroundColor: isLight ? '#ffffff' : '#0c1322', borderColor: isLight ? '#e2e8f0' : 'rgba(245, 158, 11, 0.25)' }]}>
        <View style={styles.instTopRow}>
          <View style={styles.instLeftBrand}>
            <View style={styles.instLogoShield}>
              <Ionicons name="briefcase" size={20} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={[styles.instTitle, { color: textColor }]}>Partners Command Hub</Text>
                <View style={styles.instLiveBadge}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.instLiveText}>LIVE RADAR</Text>
                </View>
                <View style={[styles.instIsoPill, { borderColor: 'rgba(16, 185, 129, 0.35)', backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Ionicons name="shield-checkmark" size={11} color="#10b981" />
                  <Text style={styles.instIsoText}>ISO 9001 & 27001 Verified</Text>
                </View>
              </View>
              <Text style={[styles.instSubtitle, { color: subTextColor }]} numberOfLines={1}>
                FARMSKING TECHNOLOGIES PRIVATE LIMITED · CIN: U62013PB2026PTC070389 · Regd. Office: C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Punjab
              </Text>
            </View>
          </View>

          <View style={styles.instRightActions}>
            <TouchableOpacity
              style={[styles.btnOutline, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}
              onPress={handleExportExcel}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={13} color={textColor} />
              <Text style={[styles.btnOutlineText, { color: textColor }]}>Export XLSX</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnOutline, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}
              onPress={() => setShowA4PrintModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="print-outline" size={13} color={textColor} />
              <Text style={[styles.btnOutlineText, { color: textColor }]}>Print A4 Dossier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSolidAmber, { backgroundColor: '#f59e0b' }]}
              onPress={() => setActiveTab('NEW_APPROVALS')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add" size={13} color="#000000" />
              <Text style={[styles.btnSolidText, { color: '#000000' }]}>
                KYC Radar ({pendingApprovalsCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 📊 2. SLEEK COMPACT KPI TELEMETRY STRIP (HIGH-DENSITY PC VIEW) */}
      <View style={[styles.kpiWrapper, { backgroundColor: isLight ? '#f8fafc' : '#080d16', borderBottomColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiContainer}
        >
          {/* Metric 1: Active Partners */}
          <TouchableOpacity
            style={[styles.kpiBox, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : 'rgba(16, 185, 129, 0.3)' }]}
            activeOpacity={0.85}
            onPress={() => { setRoleFilter('ALL'); setActiveTab('OVERVIEW'); }}
          >
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="people" size={17} color="#10b981" />
            </View>
            <View style={styles.kpiTextCol}>
              <View style={styles.kpiTopLine}>
                <Text style={[styles.kpiBigNumber, { color: textColor }]}>{totalActivePartners}</Text>
                <View style={styles.kpiPillGreen}>
                  <Text style={styles.kpiPillTextGreen}>+14%</Text>
                </View>
              </View>
              <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>Active Partners</Text>
            </View>
          </TouchableOpacity>

          {/* Metric 2: Pending KYC Approvals */}
          <TouchableOpacity
            style={[styles.kpiBox, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : 'rgba(245, 158, 11, 0.35)' }]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('NEW_APPROVALS')}
          >
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="shield-outline" size={17} color="#f59e0b" />
            </View>
            <View style={styles.kpiTextCol}>
              <View style={styles.kpiTopLine}>
                <Text style={[styles.kpiBigNumber, { color: '#f59e0b' }]}>{pendingApprovalsCount}</Text>
                <View style={styles.kpiPillAmber}>
                  <Text style={styles.kpiPillTextAmber}>3 KYC</Text>
                </View>
              </View>
              <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>New Applications</Text>
            </View>
          </TouchableOpacity>

          {/* Metric 3: Profile & Bank Edits */}
          <TouchableOpacity
            style={[styles.kpiBox, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : 'rgba(56, 189, 248, 0.3)' }]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('EDIT_APPROVALS')}
          >
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="key-outline" size={17} color="#38bdf8" />
            </View>
            <View style={styles.kpiTextCol}>
              <View style={styles.kpiTopLine}>
                <Text style={[styles.kpiBigNumber, { color: '#38bdf8' }]}>{pendingEditsCount}</Text>
                <View style={styles.kpiPillCyan}>
                  <Text style={styles.kpiPillTextCyan}>3 Edits</Text>
                </View>
              </View>
              <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>Pending Edits</Text>
            </View>
          </TouchableOpacity>

          {/* Metric 4: Gross Sales & Escrow */}
          <TouchableOpacity
            style={[styles.kpiBox, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : 'rgba(168, 85, 247, 0.3)' }]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('FINANCES')}
          >
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="pie-chart" size={17} color="#a855f7" />
            </View>
            <View style={styles.kpiTextCol}>
              <View style={styles.kpiTopLine}>
                <Text style={[styles.kpiBigNumber, { color: textColor }]}>₹{(totalPartnerEarnings / 100000).toFixed(2)}L</Text>
                <View style={styles.kpiPillPurple}>
                  <Text style={styles.kpiPillTextPurple}>Escrow</Text>
                </View>
              </View>
              <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>Gross Sales</Text>
            </View>
          </TouchableOpacity>

          {/* Metric 5: Pending Payout Backlog */}
          <TouchableOpacity
            style={[styles.kpiBox, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : 'rgba(239, 68, 68, 0.35)' }]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('FINANCES')}
          >
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="card" size={17} color="#ef4444" />
            </View>
            <View style={styles.kpiTextCol}>
              <View style={styles.kpiTopLine}>
                <Text style={[styles.kpiBigNumber, { color: '#ef4444' }]}>₹{(totalPendingPayouts / 1000).toFixed(1)}k</Text>
                <View style={styles.kpiPillRed}>
                  <Text style={styles.kpiPillTextRed}>IMPS</Text>
                </View>
              </View>
              <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>Pending Payouts</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 🧭 3. MASTER INTERACTIVE NAVIGATION CONSOLE */}
      <View style={[styles.tabNavigationConsole, { backgroundColor: isLight ? '#ffffff' : '#0c1322', borderColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabNavScroll}>
          {[
            { key: 'OVERVIEW', label: 'Overview & Matrix', icon: 'grid-outline' },
            { key: 'NEW_APPROVALS', label: `KYC Approvals (${pendingApprovalsCount})`, icon: 'shield-checkmark-outline', badgeCount: pendingApprovalsCount },
            { key: 'EDIT_APPROVALS', label: `Profile Edits (${pendingEditsCount})`, icon: 'create-outline', badgeCount: pendingEditsCount },
            { key: 'FINANCES', label: 'Finances & Payouts (Hisab-Kitab)', icon: 'cash-outline' },
            { key: 'OPERATIONS', label: 'Data Sharing & Operations', icon: 'share-social-outline' },
            { key: 'REPORTS', label: 'Reports & Tax Audits', icon: 'document-text-outline' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.navTabPill,
                  isActive && [styles.navTabPillActive, { borderBottomColor: '#f59e0b' }],
                ]}
                onPress={() => setActiveTab(tab.key as PartnerTabKey)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? '#f59e0b' : subTextColor}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.navTabText, { color: isActive ? textColor : subTextColor }, isActive && { fontFamily: FONT.bold }]}>
                  {tab.label}
                </Text>
                {tab.badgeCount && tab.badgeCount > 0 ? (
                  <View style={styles.navTabBadge}>
                    <Text style={styles.navTabBadgeText}>{tab.badgeCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 🗂️ 4. MAIN PANELS BODY */}
      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainScrollContent}>
        {/* ==================== 1. OVERVIEW & PARTNER MATRIX ==================== */}
        {activeTab === 'OVERVIEW' && (
          <View style={{ gap: 16 }}>
            {/* Filter and Search Bar */}
            <View style={[styles.filterBarCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              {/* Channel Selector Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {[
                  { key: 'ALL', label: 'All Channels (42)' },
                  { key: 'ADVISOR', label: '🌾 Crop Doctors (Farm & Garden)' },
                  { key: 'SELLER', label: '🏪 Agri Stores & Retailers' },
                  { key: 'AGENT', label: '🤝 Sales Managers (Agents)' },
                  { key: 'NURSERY', label: '🌱 Plant Nurseries' },
                  { key: 'TRAINER', label: '🎓 Technical Trainers' },
                ].map((item) => {
                  const isSelected = roleFilter === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.channelChip,
                        isSelected && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
                        !isSelected && isLight && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                      ]}
                      onPress={() => setRoleFilter(item.key as PartnerRoleFilter)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.channelChipText, isSelected && { color: '#000000', fontFamily: FONT.bold }, !isSelected && { color: subTextColor }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* High-Contrast Search Bar */}
              <View style={[styles.searchBoxWrap, { backgroundColor: isLight ? '#f1f5f9' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                <Ionicons name="search" size={18} color={subTextColor} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder="Search partner by King ID (e.g. FK-DOC-701), name, mobile number, district, or clinic..."
                  placeholderTextColor={subTextColor}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={subTextColor} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Partner Cards Grid */}
            <View style={{ gap: 12 }}>
              {filteredPartners.map((partner) => {
                const isAdvisor = partner.role === 'ADVISOR';
                const isSeller = partner.role === 'SELLER';
                const isAgent = partner.role === 'AGENT';
                const isNursery = partner.role === 'NURSERY';

                return (
                  <View
                    key={partner.id}
                    style={[
                      styles.partnerMasterCard,
                      { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder },
                      premiumShadow('#000', 'sm'),
                    ]}
                  >
                    <View style={styles.partnerCardTop}>
                      {/* Avatar & Identifiers */}
                      <View style={[styles.partnerAvatar, { backgroundColor: isAdvisor ? 'rgba(16, 185, 129, 0.15)' : isSeller ? 'rgba(2, 132, 199, 0.15)' : isAgent ? 'rgba(245, 158, 11, 0.15)' : 'rgba(168, 85, 247, 0.15)' }]}>
                        <Ionicons
                          name={isAdvisor ? 'medkit' : isSeller ? 'storefront' : isAgent ? 'briefcase' : 'leaf'}
                          size={24}
                          color={isAdvisor ? '#10b981' : isSeller ? '#0284c7' : isAgent ? '#f59e0b' : '#a855f7'}
                        />
                      </View>

                      <View style={{ flex: 1, minWidth: 220 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={[styles.partnerNameHeader, { color: textColor }]}>{partner.name}</Text>
                          <View style={styles.kingIdGoldBadge}>
                            <Ionicons name="shield-checkmark" size={11} color="#f59e0b" style={{ marginRight: 3 }} />
                            <Text style={styles.kingIdGoldText}>{partner.kingId}</Text>
                          </View>
                          <View style={[styles.verifiedStatusPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                            <Text style={{ color: '#10b981', fontSize: 10.5, fontFamily: FONT.bold }}>VERIFIED</Text>
                          </View>
                          {partner.rating ? (
                            <View style={styles.ratingBadge}>
                              <Ionicons name="star" size={11} color="#fbbf24" style={{ marginRight: 2 }} />
                              <Text style={styles.ratingText}>{partner.rating}</Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={[styles.partnerBusinessSubtitle, { color: subTextColor }]}>
                          🏢 {partner.businessName} · 📍 {partner.district}, {partner.state}
                        </Text>
                        <Text style={[styles.partnerContactSubtitle, { color: subTextColor }]}>
                          📞 {partner.mobile} {partner.email ? `· ✉️ ${partner.email}` : ''}
                        </Text>
                        {partner.specialization && (
                          <Text style={[styles.partnerSpecTag, { color: '#10b981' }]}>
                            🌱 Specialization: {partner.specialization}
                          </Text>
                        )}
                      </View>

                      {/* Bank & Payout Status Pill */}
                      <View style={[styles.bankStatusCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="business-outline" size={14} color="#38bdf8" />
                          <Text style={[styles.bankNameText, { color: textColor }]}>{partner.bankName}</Text>
                        </View>
                        <Text style={[styles.bankAccountText, { color: subTextColor }]}>
                          {partner.bankAccount} (IFSC: {partner.bankIfsc})
                        </Text>
                        {partner.upiId && (
                          <Text style={[styles.upiText, { color: '#10b981' }]}>
                            ⚡ UPI: {partner.upiId}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Metrics Telemetry Bar */}
                    <View style={[styles.partnerMetricsStrip, { backgroundColor: isLight ? '#f1f5f9' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                      <View style={styles.miniMetric}>
                        <Text style={[styles.miniMetricLabel, { color: subTextColor }]}>Current Wallet</Text>
                        <Text style={[styles.miniMetricVal, { color: '#10b981' }]}>₹{partner.walletBalance.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.metricDivider} />

                      <View style={styles.miniMetric}>
                        <Text style={[styles.miniMetricLabel, { color: subTextColor }]}>Gross Earnings</Text>
                        <Text style={[styles.miniMetricVal, { color: textColor }]}>₹{partner.totalEarnings.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.metricDivider} />

                      <View style={styles.miniMetric}>
                        <Text style={[styles.miniMetricLabel, { color: subTextColor }]}>Pending Payout</Text>
                        <Text style={[styles.miniMetricVal, { color: partner.pendingPayout > 0 ? '#f59e0b' : subTextColor }]}>
                          ₹{partner.pendingPayout.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.metricDivider} />

                      <View style={styles.miniMetric}>
                        <Text style={[styles.miniMetricLabel, { color: subTextColor }]}>Rate / Share</Text>
                        <Text style={[styles.miniMetricVal, { color: textColor }]}>
                          {partner.commissionRate}% {isAdvisor ? 'Share' : 'Fee'}
                        </Text>
                      </View>
                      <View style={styles.metricDivider} />

                      <View style={styles.miniMetric}>
                        <Text style={[styles.miniMetricLabel, { color: subTextColor }]}>Total Volume</Text>
                        <Text style={[styles.miniMetricVal, { color: textColor }]}>
                          {partner.totalJobs} {isAdvisor ? 'calls' : isSeller ? 'orders' : 'referrals'}
                        </Text>
                      </View>

                      {/* Direct Quick Actions */}
                      <View style={styles.actionButtonGroup}>
                        <TouchableOpacity
                          style={[styles.actionBtnOutline, { borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}
                          onPress={() => setSelectedPartnerForDossier(partner)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="document-text-outline" size={13} color="#38bdf8" />
                          <Text style={{ color: '#38bdf8', fontSize: 11.5, fontFamily: FONT.bold }}>Inspect Dossier</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtnOutline, { borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}
                          onPress={() => setActiveTab('FINANCES')}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="wallet-outline" size={13} color="#f59e0b" />
                          <Text style={{ color: '#f59e0b', fontSize: 11.5, fontFamily: FONT.bold }}>Hisab-Kitab</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ==================== 2. NEW APPROVALS (KYC RADAR) ==================== */}
        {activeTab === 'NEW_APPROVALS' && (
          <View style={{ gap: 14 }}>
            <View style={[styles.guidanceBanner, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <Ionicons name="shield-checkmark" size={22} color="#f59e0b" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: textColor, fontSize: 13, fontFamily: FONT.bold }}>
                  Statutory KYC & Professional Accreditation Radar
                </Text>
                <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                  Verify applicant identity, state agriculture department licenses, National Horticulture Board certificates, and agronomy degrees before assigning an official King ID.
                </Text>
              </View>
            </View>

            {newApplications.map((app) => (
              <View
                key={app.id}
                style={[
                  styles.approvalWorkstationCard,
                  { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder },
                  premiumShadow('#000', 'sm'),
                ]}
              >
                <View style={styles.workstationHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={[styles.applicantHeaderTitle, { color: textColor }]}>{app.applicantName}</Text>
                      <View style={[styles.roleTagPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <Text style={{ color: '#f59e0b', fontSize: 11, fontFamily: FONT.bold }}>{app.role}</Text>
                      </View>
                      <View style={[styles.pendingWarningPill, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                        <Text style={{ color: '#ef4444', fontSize: 11, fontFamily: FONT.bold }}>PENDING KYC</Text>
                      </View>
                    </View>
                    <Text style={[styles.applicantSubtitle, { color: subTextColor }]}>
                      🏢 {app.businessName} · 📍 {app.location} · 📅 Applied {app.appliedDate}
                    </Text>
                  </View>
                </View>

                {/* Submitted Documents Vault */}
                <View style={[styles.docVaultBox, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <View style={styles.vaultHeaderRow}>
                    <Ionicons name="folder-open" size={16} color="#38bdf8" />
                    <Text style={[styles.vaultTitle, { color: textColor }]}>Submitted Regulatory & KYC Credentials</Text>
                  </View>

                  <View style={styles.vaultGrid}>
                    {app.submittedDocs.pan && (
                      <View style={styles.vaultCell}>
                        <Text style={[styles.cellLabel, { color: subTextColor }]}>PAN Number (Income Tax)</Text>
                        <Text style={[styles.cellVal, { color: textColor }]}>{app.submittedDocs.pan}</Text>
                      </View>
                    )}
                    {app.submittedDocs.gstin && (
                      <View style={styles.vaultCell}>
                        <Text style={[styles.cellLabel, { color: subTextColor }]}>GSTIN (Verified Active)</Text>
                        <Text style={[styles.cellVal, { color: '#10b981' }]}>{app.submittedDocs.gstin}</Text>
                      </View>
                    )}
                    {app.submittedDocs.degreeOrLicense && (
                      <View style={[styles.vaultCell, { flex: 2 }]}>
                        <Text style={[styles.cellLabel, { color: subTextColor }]}>Degree / Dept License</Text>
                        <Text style={[styles.cellVal, { color: textColor }]}>{app.submittedDocs.degreeOrLicense}</Text>
                      </View>
                    )}
                    {app.specialization && (
                      <View style={[styles.vaultCell, { flex: 2 }]}>
                        <Text style={[styles.cellLabel, { color: subTextColor }]}>Agronomy Specialization</Text>
                        <Text style={[styles.cellVal, { color: '#10b981' }]}>{app.specialization}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Administrative Decision Matrix */}
                <View style={styles.decisionRow}>
                  <TouchableOpacity
                    style={[styles.btnActionSecondary, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    onPress={() => setRejectModalItem(app)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontSize: 13, fontFamily: FONT.bold }}>Reject Application</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnActionPrimary, { backgroundColor: '#10b981' }]}
                    onPress={() => {
                      setCustomCommissionInput(app.role === 'ADVISOR' ? '85.0' : '5.0');
                      setApproveModalItem(app);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontSize: 13, fontFamily: FONT.bold }}>Approve & Grant King ID</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==================== 3. EDIT APPROVALS (DIFF REVIEW) ==================== */}
        {activeTab === 'EDIT_APPROVALS' && (
          <View style={{ gap: 14 }}>
            <View style={[styles.guidanceBanner, { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
              <Ionicons name="lock-closed" size={22} color="#38bdf8" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: textColor, fontSize: 13, fontFamily: FONT.bold }}>
                  ISO 27001 Protected Profile & Banking Modifications
                </Text>
                <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                  All bank accounts, UPI IDs, trade names, and consultation fees require administrative two-person rule verification before modifications take effect.
                </Text>
              </View>
            </View>

            {editRequests.map((req) => (
              <View
                key={req.id}
                style={[
                  styles.approvalWorkstationCard,
                  { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder },
                  premiumShadow('#000', 'sm'),
                ]}
              >
                <View style={styles.workstationHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={[styles.applicantHeaderTitle, { color: textColor }]}>{req.partnerName}</Text>
                      <View style={styles.kingIdGoldBadge}>
                        <Text style={styles.kingIdGoldText}>{req.kingId}</Text>
                      </View>
                      <View style={[styles.roleTagPill, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                        <Text style={{ color: '#38bdf8', fontSize: 11, fontFamily: FONT.bold }}>{req.requestType}</Text>
                      </View>
                      <View style={[styles.riskBadge, { backgroundColor: req.riskLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                        <Text style={{ color: req.riskLevel === 'HIGH' ? '#ef4444' : '#f59e0b', fontSize: 10.5, fontFamily: FONT.bold }}>
                          {req.riskLevel} SECURITY RISK
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.applicantSubtitle, { color: subTextColor }]}>
                      {req.role} · Requested on {req.requestedAt}
                    </Text>
                  </View>
                </View>

                {/* Side-by-Side Diff Compare */}
                <View style={styles.diffComparisonRow}>
                  <View style={[styles.diffCardHalf, { backgroundColor: 'rgba(239, 68, 68, 0.06)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="close-circle" size={14} color="#ef4444" />
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#ef4444' }}>CURRENT VALUE IN SYSTEM</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: textColor, fontFamily: FONT.medium }}>{req.currentValue}</Text>
                  </View>

                  <View style={[styles.diffCardHalf, { backgroundColor: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#10b981' }}>REQUESTED NEW VALUE</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: textColor, fontFamily: FONT.bold }}>{req.requestedValue}</Text>
                  </View>
                </View>

                <View style={[styles.reasonCallout, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <Text style={{ fontSize: 12, color: subTextColor }}>
                    <Text style={{ fontFamily: FONT.bold, color: textColor }}>Applicant Reason: </Text>
                    "{req.reason}"
                  </Text>
                </View>

                <View style={styles.decisionRow}>
                  <TouchableOpacity
                    style={[styles.btnActionSecondary, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    onPress={() => handleDeclineEditRequest(req)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={16} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontSize: 13, fontFamily: FONT.bold }}>Decline Modification</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnActionPrimary, { backgroundColor: '#38bdf8' }]}
                    onPress={() => handleApproveEditRequest(req)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark" size={16} color="#000000" />
                    <Text style={{ color: '#000000', fontSize: 13, fontFamily: FONT.bold }}>Approve Modification</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==================== 4. FINANCES & HISAB-KITAB ==================== */}
        {activeTab === 'FINANCES' && (
          <View style={{ gap: 16 }}>
            {/* Payout Disbursements Queue */}
            <View style={[styles.executiveSectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.secHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="card-outline" size={20} color="#f59e0b" />
                  <Text style={[styles.secTitle, { color: textColor }]}>Active Withdrawal Payout Queue</Text>
                  <View style={[styles.badgeCountPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Text style={{ color: '#f59e0b', fontSize: 11, fontFamily: FONT.bold }}>
                      {payoutRequests.filter((p) => p.status === 'PENDING').length} Requests
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ gap: 10, marginTop: 10 }}>
                {payoutRequests.map((p) => (
                  <View
                    key={p.id}
                    style={[styles.payoutListItem, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}
                  >
                    <View style={{ flex: 1, minWidth: 220 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.payoutPartnerTitle, { color: textColor }]}>{p.partnerName}</Text>
                        <View style={styles.kingIdGoldBadge}>
                          <Text style={styles.kingIdGoldText}>{p.kingId}</Text>
                        </View>
                      </View>
                      <Text style={[styles.payoutTargetText, { color: subTextColor }]}>
                        {p.paymentMode}: {p.targetAddress} · Requested {p.requestedAt}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={[styles.payoutAmountBig, { color: '#10b981' }]}>₹{p.amount.toLocaleString('en-IN')}</Text>
                      {p.status === 'PENDING' ? (
                        <TouchableOpacity
                          style={[styles.btnSolidGreen, { backgroundColor: '#10b981' }]}
                          onPress={() => setPayoutProcessModal(p)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="paper-plane" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                          <Text style={[styles.btnSolidText, { fontSize: 12, color: '#ffffff' }]}>Disburse with UTR</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.verifiedStatusPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                          <Text style={{ color: '#10b981', fontSize: 11, fontFamily: FONT.bold }}>DISBURSED</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Platform Commission & Fee Share Matrix */}
            <View style={[styles.executiveSectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.secHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="pie-chart-outline" size={20} color="#10b981" />
                  <Text style={[styles.secTitle, { color: textColor }]}>Category Commission & Revenue Sharing Matrix</Text>
                </View>
              </View>

              <View style={styles.matrixGrid}>
                <View style={[styles.matrixCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <Text style={[styles.matrixTitle, { color: subTextColor }]}>🌾 Crop Doctor Consultations</Text>
                  <Text style={[styles.matrixPercent, { color: '#10b981' }]}>85% Doctor / 15% Platform</Text>
                  <Text style={[styles.matrixSub, { color: subTextColor }]}>Doctor keeps 85% of ₹149 consultation fee</Text>
                </View>

                <View style={[styles.matrixCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <Text style={[styles.matrixTitle, { color: subTextColor }]}>🏪 Fertilizer & Bulk Inputs</Text>
                  <Text style={[styles.matrixPercent, { color: '#0284c7' }]}>2.0% Marketplace Fee</Text>
                  <Text style={[styles.matrixSub, { color: subTextColor }]}>Low-margin volume category with GSTR-8 TCS 0.5%</Text>
                </View>

                <View style={[styles.matrixCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <Text style={[styles.matrixTitle, { color: subTextColor }]}>🧪 High-Yield Seeds & Sprays</Text>
                  <Text style={[styles.matrixPercent, { color: '#f59e0b' }]}>5.0% Marketplace Fee</Text>
                  <Text style={[styles.matrixSub, { color: subTextColor }]}>Full merchant settlement with invoice generation</Text>
                </View>

                <View style={[styles.matrixCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <Text style={[styles.matrixTitle, { color: subTextColor }]}>🌱 Nursery Plant Pre-Bookings</Text>
                  <Text style={[styles.matrixPercent, { color: '#a855f7' }]}>6.0% Escrow Commission</Text>
                  <Text style={[styles.matrixSub, { color: subTextColor }]}>Funds released upon customer physical receipt</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ==================== 5. OPERATIONS & DATA SHARING ==================== */}
        {activeTab === 'OPERATIONS' && (
          <View style={{ gap: 16 }}>
            <View style={[styles.executiveSectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.secHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="git-network-outline" size={20} color="#38bdf8" />
                  <Text style={[styles.secTitle, { color: textColor }]}>Live Telemetry & Field Operational Hub</Text>
                </View>
              </View>

              <View style={styles.opsGridMatrix}>
                <View style={[styles.opsMetricCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <View style={styles.opsIconWrapGreen}>
                    <Ionicons name="call" size={22} color="#10b981" />
                  </View>
                  <Text style={[styles.opsMetricBig, { color: textColor }]}>24 Doctors</Text>
                  <Text style={[styles.opsMetricLabel, { color: subTextColor }]}>Active On Duty Live</Text>
                  <Text style={[styles.opsMetricSub, { color: '#10b981' }]}>Avg response time: 2.4 mins</Text>
                </View>

                <View style={[styles.opsMetricCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <View style={styles.opsIconWrapBlue}>
                    <Ionicons name="cube" size={22} color="#0284c7" />
                  </View>
                  <Text style={[styles.opsMetricBig, { color: textColor }]}>1,420 SKUs</Text>
                  <Text style={[styles.opsMetricLabel, { color: subTextColor }]}>Store Inventory Synchronized</Text>
                  <Text style={[styles.opsMetricSub, { color: '#0284c7' }]}>Zero stockout escalations</Text>
                </View>

                <View style={[styles.opsMetricCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <View style={styles.opsIconWrapAmber}>
                    <Ionicons name="people" size={22} color="#f59e0b" />
                  </View>
                  <Text style={[styles.opsMetricBig, { color: textColor }]}>3,890 Farmers</Text>
                  <Text style={[styles.opsMetricLabel, { color: subTextColor }]}>Managed Under Sales Agents</Text>
                  <Text style={[styles.opsMetricSub, { color: '#f59e0b' }]}>Active coupon usage: 78.4%</Text>
                </View>

                <View style={[styles.opsMetricCard, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <View style={styles.opsIconWrapPurple}>
                    <Ionicons name="flower" size={22} color="#a855f7" />
                  </View>
                  <Text style={[styles.opsMetricBig, { color: textColor }]}>48 Batches</Text>
                  <Text style={[styles.opsMetricLabel, { color: subTextColor }]}>Nursery Seedlings Tracked</Text>
                  <Text style={[styles.opsMetricSub, { color: '#a855f7' }]}>Dispatch readiness: 94.1%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ==================== 6. REPORTS & STATUTORY AUDITS ==================== */}
        {activeTab === 'REPORTS' && (
          <View style={{ gap: 16 }}>
            <View style={[styles.executiveSectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.secHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="document-text" size={20} color="#f59e0b" />
                  <Text style={[styles.secTitle, { color: textColor }]}>Statutory Tax Deductions & Financial Dossiers</Text>
                </View>
              </View>

              <View style={{ gap: 12, marginTop: 10 }}>
                <View style={[styles.reportRowBox, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <Ionicons name="receipt-outline" size={24} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reportRowTitle, { color: textColor }]}>GSTR-8 TCS (0.5% CGST + 0.5% SGST)</Text>
                    <Text style={[styles.reportRowDesc, { color: subTextColor }]}>
                      Monthly Tax Collected at Source deducted on net e-commerce sales of registered merchants under GSTIN.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnOutline, isLight && { backgroundColor: '#f1f5f9' }]}
                    onPress={() => router.push('/admin/(tabs)/super-accounts?section=CA_ACCOUNTS' as any)}
                  >
                    <Text style={[styles.btnOutlineText, { color: textColor }]}>Inspect GSTR-8</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.reportRowBox, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#0284c7" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reportRowTitle, { color: textColor }]}>Section 194-H & 194-J TDS Certificates</Text>
                    <Text style={[styles.reportRowDesc, { color: subTextColor }]}>
                      Statutory Income Tax TDS certificates for agronomist doctor fees (10%) and agent sales manager commissions (5%).
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnOutline, isLight && { backgroundColor: '#f1f5f9' }]}
                    onPress={() => router.push('/admin/(tabs)/legal-compliance' as any)}
                  >
                    <Text style={[styles.btnOutlineText, { color: textColor }]}>Legal Desk</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.reportRowBox, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <Ionicons name="print-outline" size={24} color="#f59e0b" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reportRowTitle, { color: textColor }]}>Standard A4 Partner Master Registry Dossier</Text>
                    <Text style={[styles.reportRowDesc, { color: subTextColor }]}>
                      Printable institutional dossier complying strictly with 210mm × 297mm A4 layout with running corporate headers.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnSolidAmber, { backgroundColor: '#f59e0b' }]}
                    onPress={() => setShowA4PrintModal(true)}
                  >
                    <Text style={[styles.btnSolidText, { color: '#000000' }]}>Generate A4 PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 🌟 MODAL: APPROVE PARTNER APPLICATION */}
      {approveModalItem && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.dialogCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.dialogHeader}>
                <Ionicons name="checkmark-circle" size={26} color="#10b981" />
                <Text style={[styles.dialogTitle, { color: textColor }]}>Approve Partner Application</Text>
              </View>

              <Text style={[styles.dialogBodyText, { color: subTextColor }]}>
                You are approving <Text style={{ fontFamily: FONT.bold, color: textColor }}>{approveModalItem.applicantName}</Text> for the channel role of <Text style={{ fontFamily: FONT.bold, color: '#f59e0b' }}>{approveModalItem.role}</Text>.
              </Text>

              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.dialogFieldLabel, { color: subTextColor }]}>
                  {approveModalItem.role === 'ADVISOR' ? 'Doctor Consultation Share (%)' : 'Platform Marketplace Fee (%)'}
                </Text>
                <TextInput
                  style={[styles.dialogInput, { color: textColor, backgroundColor: isLight ? '#f1f5f9' : innerBg, borderColor: isLight ? '#cbd5e1' : cardBorder }]}
                  value={customCommissionInput}
                  onChangeText={setCustomCommissionInput}
                  keyboardType="numeric"
                  placeholder="e.g. 85.0"
                  placeholderTextColor={subTextColor}
                />
              </View>

              <View style={styles.dialogActions}>
                <TouchableOpacity style={styles.btnOutline} onPress={() => setApproveModalItem(null)}>
                  <Text style={[styles.btnOutlineText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSolidGreen, { backgroundColor: '#10b981' }]}
                  onPress={() => handleApproveApplication(approveModalItem)}
                >
                  <Text style={[styles.btnSolidText, { color: '#ffffff' }]}>Confirm & Assign King ID</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 🌟 MODAL: REJECT PARTNER APPLICATION */}
      {rejectModalItem && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.dialogCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.dialogHeader}>
                <Ionicons name="close-circle" size={26} color="#ef4444" />
                <Text style={[styles.dialogTitle, { color: textColor }]}>Reject Partner Application</Text>
              </View>

              <Text style={[styles.dialogBodyText, { color: subTextColor }]}>
                Specify statutory grounds for rejecting <Text style={{ fontFamily: FONT.bold, color: textColor }}>{rejectModalItem.applicantName}</Text>. The applicant will receive this exact message to rectify documents.
              </Text>

              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.dialogFieldLabel, { color: subTextColor }]}>Statutory Rejection Ground *</Text>
                <TextInput
                  style={[styles.dialogTextArea, { color: textColor, backgroundColor: isLight ? '#f1f5f9' : innerBg, borderColor: isLight ? '#cbd5e1' : cardBorder }]}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder="e.g. Blurred PAU degree certificate, invalid GSTIN status on portal, or missing NHB nursery approval."
                  placeholderTextColor={subTextColor}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.dialogActions}>
                <TouchableOpacity style={styles.btnOutline} onPress={() => setRejectModalItem(null)}>
                  <Text style={[styles.btnOutlineText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSolidRed, { backgroundColor: '#ef4444' }]}
                  onPress={() => handleRejectApplication(rejectModalItem)}
                >
                  <Text style={[styles.btnSolidText, { color: '#ffffff' }]}>Reject Application</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 🌟 MODAL: PROCESS PAYOUT WITH UTR */}
      {payoutProcessModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.dialogCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.dialogHeader}>
                <Ionicons name="paper-plane" size={26} color="#10b981" />
                <Text style={[styles.dialogTitle, { color: textColor }]}>Confirm Bank / UPI Disbursement</Text>
              </View>

              <Text style={[styles.dialogBodyText, { color: subTextColor }]}>
                Disbursing <Text style={{ fontFamily: FONT.bold, color: '#10b981' }}>₹{payoutProcessModal.amount.toLocaleString('en-IN')}</Text> to <Text style={{ fontFamily: FONT.bold, color: textColor }}>{payoutProcessModal.partnerName}</Text> ({payoutProcessModal.targetAddress}).
              </Text>

              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.dialogFieldLabel, { color: subTextColor }]}>Bank UTR Reference / Payment Transaction ID *</Text>
                <TextInput
                  style={[styles.dialogInput, { color: textColor, backgroundColor: isLight ? '#f1f5f9' : innerBg, borderColor: isLight ? '#cbd5e1' : cardBorder }]}
                  value={utrReferenceInput}
                  onChangeText={setUtrReferenceInput}
                  placeholder="e.g. UTR492182049182 / UPI Ref #492180"
                  placeholderTextColor={subTextColor}
                />
              </View>

              <View style={styles.dialogActions}>
                <TouchableOpacity style={styles.btnOutline} onPress={() => setPayoutProcessModal(null)}>
                  <Text style={[styles.btnOutlineText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSolidGreen, { backgroundColor: '#10b981' }]}
                  onPress={() => handleDisbursePayout(payoutProcessModal)}
                >
                  <Text style={[styles.btnSolidText, { color: '#ffffff' }]}>Confirm & Disburse</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 🌟 MODAL: PARTNER DOSSIER VIEW */}
      {selectedPartnerForDossier && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.dialogCard, { maxWidth: 660, backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.dialogHeader}>
                <Ionicons name="shield-checkmark" size={26} color="#f59e0b" />
                <View>
                  <Text style={[styles.dialogTitle, { color: textColor }]}>Partner Master Dossier</Text>
                  <Text style={{ fontSize: 12, color: subTextColor }}>King ID: {selectedPartnerForDossier.kingId}</Text>
                </View>
              </View>

              <View style={[styles.dossierTable, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                <View style={styles.dossierTableRow}>
                  <Text style={[styles.dossierRowKey, { color: subTextColor }]}>Full Legal Name:</Text>
                  <Text style={[styles.dossierRowVal, { color: textColor }]}>{selectedPartnerForDossier.name}</Text>
                </View>
                <View style={styles.dossierTableRow}>
                  <Text style={[styles.dossierRowKey, { color: subTextColor }]}>Primary Partner Role:</Text>
                  <Text style={[styles.dossierRowVal, { color: '#f59e0b', fontFamily: FONT.bold }]}>{selectedPartnerForDossier.role}</Text>
                </View>
                <View style={styles.dossierTableRow}>
                  <Text style={[styles.dossierRowKey, { color: subTextColor }]}>Business / Clinic Name:</Text>
                  <Text style={[styles.dossierRowVal, { color: textColor }]}>{selectedPartnerForDossier.businessName}</Text>
                </View>
                <View style={styles.dossierTableRow}>
                  <Text style={[styles.dossierRowKey, { color: subTextColor }]}>Registered Mobile:</Text>
                  <Text style={[styles.dossierRowVal, { color: textColor }]}>{selectedPartnerForDossier.mobile}</Text>
                </View>
                <View style={styles.dossierTableRow}>
                  <Text style={[styles.dossierRowKey, { color: subTextColor }]}>Bank Account Details:</Text>
                  <Text style={[styles.dossierRowVal, { color: textColor }]}>
                    {selectedPartnerForDossier.bankName} ({selectedPartnerForDossier.bankAccount}, IFSC: {selectedPartnerForDossier.bankIfsc})
                  </Text>
                </View>
                <View style={styles.dossierTableRow}>
                  <Text style={[styles.dossierRowKey, { color: subTextColor }]}>UPI Virtual Address:</Text>
                  <Text style={[styles.dossierRowVal, { color: '#10b981' }]}>{selectedPartnerForDossier.upiId || 'N/A'}</Text>
                </View>
                <View style={styles.dossierTableRow}>
                  <Text style={[styles.dossierRowKey, { color: subTextColor }]}>Wallet Available Balance:</Text>
                  <Text style={[styles.dossierRowVal, { color: '#10b981', fontFamily: FONT.bold }]}>
                    ₹{selectedPartnerForDossier.walletBalance.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.dossierTableRow}>
                  <Text style={[styles.dossierRowKey, { color: subTextColor }]}>Revenue / Fee Rate:</Text>
                  <Text style={[styles.dossierRowVal, { color: textColor }]}>{selectedPartnerForDossier.commissionRate}%</Text>
                </View>
                {selectedPartnerForDossier.licenseNumber && (
                  <View style={styles.dossierTableRow}>
                    <Text style={[styles.dossierRowKey, { color: subTextColor }]}>Dept License / NHB Cert:</Text>
                    <Text style={[styles.dossierRowVal, { color: textColor }]}>{selectedPartnerForDossier.licenseNumber}</Text>
                  </View>
                )}
              </View>

              <View style={styles.dialogActions}>
                <TouchableOpacity style={styles.btnOutline} onPress={() => setSelectedPartnerForDossier(null)}>
                  <Text style={[styles.btnOutlineText, { color: textColor }]}>Close Dossier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSolidAmber, { backgroundColor: '#f59e0b' }]}
                  onPress={() => {
                    setSelectedPartnerForDossier(null);
                    setActiveTab('FINANCES');
                  }}
                >
                  <Text style={[styles.btnSolidText, { color: '#000000' }]}>Inspect Ledgers</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 🌟 MODAL: STRICT A4 PRINTABLE REPORT (RULE 4 COMPLIANCE) */}
      {showA4PrintModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.dialogCard, { maxWidth: 760, backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
              <View style={styles.dialogHeader}>
                <Ionicons name="print" size={24} color="#f59e0b" />
                <View>
                  <Text style={[styles.dialogTitle, { color: textColor }]}>Print Standard A4 Dossier Report</Text>
                  <Text style={{ fontSize: 11.5, color: subTextColor }}>210mm × 297mm Standard A4 Page Setup with Running Headers</Text>
                </View>
              </View>

              <View style={[styles.a4PreviewBox, { backgroundColor: isLight ? '#f8fafc' : innerBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                {/* A4 Running Header */}
                <View style={styles.a4Header}>
                  <Text style={styles.a4CompanyTitle}>FARMSKING TECHNOLOGIES PRIVATE LIMITED</Text>
                  <Text style={styles.a4CompanySub}>
                    CIN: U62013PB2026PTC070389 · Regd. Office: C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Punjab - 144601
                  </Text>
                  <Text style={styles.a4DocTitle}>OFFICIAL PARTNER GOVERNANCE & SETTLEMENT REGISTRY</Text>
                </View>

                {/* A4 Table */}
                <View style={styles.a4Table}>
                  <View style={styles.a4TableRowHead}>
                    <Text style={[styles.a4Th, { flex: 1.2 }]}>King ID</Text>
                    <Text style={[styles.a4Th, { flex: 2 }]}>Partner Name</Text>
                    <Text style={[styles.a4Th, { flex: 1.5 }]}>Role / Channel</Text>
                    <Text style={[styles.a4Th, { flex: 1.5 }]}>District</Text>
                    <Text style={[styles.a4Th, { flex: 1.5, textAlign: 'right' }]}>Wallet (₹)</Text>
                  </View>
                  {partners.map((p) => (
                    <View key={p.id} style={styles.a4TableRow}>
                      <Text style={[styles.a4Td, { flex: 1.2, fontFamily: FONT.bold }]}>{p.kingId}</Text>
                      <Text style={[styles.a4Td, { flex: 2 }]}>{p.name}</Text>
                      <Text style={[styles.a4Td, { flex: 1.5 }]}>{p.role}</Text>
                      <Text style={[styles.a4Td, { flex: 1.5 }]}>{p.district}</Text>
                      <Text style={[styles.a4Td, { flex: 1.5, textAlign: 'right', fontFamily: FONT.bold }]}>₹{p.walletBalance.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.a4Footer}>
                  <Text style={styles.a4FooterText}>
                    Generated under ISO 9001:2015 & ISO 27001:2022 Data Security Standards · Authorized Signatory
                  </Text>
                </View>
              </View>

              <View style={styles.dialogActions}>
                <TouchableOpacity style={styles.btnOutline} onPress={() => setShowA4PrintModal(false)}>
                  <Text style={[styles.btnOutlineText, { color: textColor }]}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSolidAmber, { backgroundColor: '#f59e0b' }]}
                  onPress={() => {
                    if (typeof window !== 'undefined') window.print();
                    setShowA4PrintModal(false);
                  }}
                >
                  <Ionicons name="print" size={15} color="#000000" style={{ marginRight: 4 }} />
                  <Text style={[styles.btnSolidText, { color: '#000000' }]}>Trigger Print (A4)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  institutionalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  instTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  instLeftBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
  },
  instLogoShield: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  instTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
  },
  instSubtitle: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  instLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulsingGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  instLiveText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#10b981',
    letterSpacing: 0.5,
  },
  instIsoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  instIsoText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  instRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  btnSolidAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
  },
  btnSolidGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
  },
  btnSolidRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
  },
  btnSolidText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  kpiWrapper: {
    borderBottomWidth: 1,
    width: '100%',
  },
  kpiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    gap: 8,
    width: '100%',
    minWidth: 880,
  },
  kpiBox: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 9,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  kpiTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  kpiBigNumber: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
  },
  kpiTitle: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  kpiPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  kpiPillTextGreen: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  kpiPillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  kpiPillTextAmber: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#f59e0b',
  },
  kpiPillCyan: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  kpiPillTextCyan: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#38bdf8',
  },
  kpiPillPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  kpiPillTextPurple: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#a855f7',
  },
  kpiPillRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  kpiPillTextRed: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#ef4444',
  },
  tabNavigationConsole: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabNavScroll: {
    flexDirection: 'row',
    gap: 4,
  },
  navTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabPillActive: {
    borderBottomWidth: 2,
  },
  navTabText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  navTabBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    marginLeft: 6,
  },
  navTabBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#000000',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterBarCard: {
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 8,
  },
  channelChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  channelChipText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  searchBoxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  partnerMasterCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 10,
  },
  partnerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerNameHeader: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
  },
  kingIdGoldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  kingIdGoldText: {
    color: '#f59e0b',
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  verifiedStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  partnerBusinessSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  partnerContactSubtitle: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  partnerSpecTag: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  bankStatusCard: {
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    minWidth: 200,
    gap: 2,
  },
  bankNameText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  bankAccountText: {
    fontSize: 11,
    fontFamily: FONT.regular,
  },
  upiText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
  partnerMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 10,
  },
  miniMetric: {
    minWidth: 80,
  },
  miniMetricLabel: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
  },
  miniMetricVal: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  guidanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  approvalWorkstationCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 10,
  },
  workstationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applicantHeaderTitle: {
    fontSize: 15.5,
    fontFamily: FONT.bold,
  },
  applicantSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  roleTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  pendingWarningPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  docVaultBox: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 10,
  },
  vaultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  vaultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  vaultCell: {
    minWidth: 160,
  },
  cellLabel: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
  cellVal: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    marginTop: 2,
  },
  decisionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  btnActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  diffComparisonRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  diffCardHalf: {
    flex: 1,
    minWidth: 220,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  reasonCallout: {
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  executiveSectionCard: {
    padding: 18,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  secTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  badgeCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  payoutListItem: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  payoutPartnerTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  payoutTargetText: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  payoutAmountBig: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  matrixCard: {
    flex: 1,
    minWidth: 220,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  matrixTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  matrixPercent: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
  },
  matrixSub: {
    fontSize: 11,
    fontFamily: FONT.regular,
  },
  opsGridMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  opsMetricCard: {
    flex: 1,
    minWidth: 200,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  opsIconWrapGreen: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opsIconWrapBlue: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opsIconWrapAmber: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opsIconWrapPurple: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opsMetricBig: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
  },
  opsMetricLabel: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  opsMetricSub: {
    fontSize: 11,
    fontFamily: FONT.regular,
  },
  reportRowBox: {
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reportRowTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  reportRowDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 540,
    padding: 22,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 12,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontFamily: FONT.bold,
  },
  dialogBodyText: {
    fontSize: 13,
    fontFamily: FONT.regular,
    lineHeight: 18,
  },
  dialogFieldLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginBottom: 6,
  },
  dialogInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  dialogTextArea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    fontSize: 13,
    fontFamily: FONT.regular,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  dossierTable: {
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 8,
  },
  dossierTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  dossierRowKey: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
  },
  dossierRowVal: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  a4PreviewBox: {
    padding: 20,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 12,
  },
  a4Header: {
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(245, 158, 11, 0.4)',
    paddingBottom: 10,
    gap: 2,
  },
  a4CompanyTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  a4CompanySub: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
  },
  a4DocTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  a4Table: {
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  a4TableRowHead: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  a4Th: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#f59e0b',
  },
  a4TableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  a4Td: {
    fontSize: 10,
    fontFamily: FONT.regular,
    color: '#e2e8f0',
  },
  a4Footer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  a4FooterText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
});
