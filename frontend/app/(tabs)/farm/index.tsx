import React, { useState, useMemo } from 'react';
// Updated Farm & Crop Registration Screen with Mandatory Sale Entry for Crop Completion & Completed History Section
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useCrops, CropStage, CropHistoryEntry, RegisteredCropField, CropSaleRecord, STAGE_ORDER } from '@/src/store/crops-context';
import { useFarmerPlan } from '@/src/hooks/useFarmerPlan';
import { useFetchSaleBill, useMySaleBillCount } from '@/src/hooks/useSaleBills';
import { BillPreview, useShareBillAsJpg, type SavedSaleInvoice } from '@/src/components/SaleBillPreview';
import { PartyPicker } from '@/src/components/PartyPicker';
import { useParties, useCreateParty } from '@/src/hooks/useParties';
import { Party } from '@/src/types/api';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { CropCategorySelectorModal, CropFormValues } from '@/components/CropCategorySelectorModal';
import { FarmerPlanUpgradeModal } from '@/src/components/FarmerPlanUpgradeModal';
import { FarmLocationPickerModal } from '@/components/FarmLocationPickerModal';
import { CropLocationGuideModal } from '@/components/CropLocationGuideModal';
import { PaymentVoucherModal, VoucherType } from '@/src/components/PaymentVoucherModal';
import { useLabourWorkers } from '@/src/hooks/useLabour';
import { useMyAdvisor, useAvailableAdvisors, useChooseAdvisor, useMyPendingRequest, useCancelPendingRequest } from '@/src/hooks/useAdvisorAssignments';
import { useSubmitCropToAdvisor, useCancelCropSubmission } from '@/src/hooks/useCrops';
import { CropCompletionReviewModal } from '@/src/components/CropCompletionReviewModal';
import { CropCompletionReview } from '@/src/store/crops-context';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const STAGE_LABELS: Record<CropStage, string> = {
  PLANTATION: '🌱 Plantation',
  SOWING: '🌱 Plantation / Sowing',
  VEGETATIVE: '🌿 Vegetative',
  GROWTH: '🌿 Vegetative Growth',
  FLOWERING: '🌸 Flowering',
  HARVESTING: '🌾 Harvesting',
  COMPLETED: '🏁 Completed',
};

const STAGE_PICKER_OPTIONS: { key: CropStage; label: string; color: string }[] = [
  { key: 'PLANTATION', label: '🌱 Plantation', color: '#d97706' },
  { key: 'VEGETATIVE', label: '🌿 Vegetative', color: '#0284c7' },
  { key: 'FLOWERING', label: '🌸 Flowering', color: '#e11d48' },
  { key: 'HARVESTING', label: '🌾 Harvesting', color: '#16a34a' },
  { key: 'COMPLETED', label: '🏁 Completed', color: '#475569' },
];

const STAGE_META: Record<CropStage, { label: string; color: string }> = {
  PLANTATION: { label: '🌱 Plantation', color: '#d97706' },
  SOWING: { label: '🌱 Plantation', color: '#d97706' },
  VEGETATIVE: { label: '🌿 Vegetative', color: '#0284c7' },
  GROWTH: { label: '🌿 Vegetative', color: '#0284c7' },
  FLOWERING: { label: '🌸 Flowering', color: '#e11d48' },
  HARVESTING: { label: '🌾 Harvesting', color: '#16a34a' },
  COMPLETED: { label: '🏁 Completed', color: '#475569' },
};

export default function FarmListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { role: currentRole } = useRole();
  const isAdminOrSuperAdmin = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';
  const { cropFields, cropHistory, salesRecords, cropGpsDataMap, unlockedCropIds, lockCropGps, unlockCropDirectly, addCrop, editCrop, removeCrop, updateCropStage, recordSale, recordCompletionReview } = useCrops();
  const { plan, limits } = useFarmerPlan();
  const isPaid = plan !== 'FREE';

  const [activeSubTab, setActiveSubTab] = useState<'CROPS' | 'CROP_CARE'>('CROPS');
  const [isChoosingAdvisor, setIsChoosingAdvisor] = useState(false);
  const { data: myAdvisorData } = useMyAdvisor();
  const { data: availableAdvisors = [] } = useAvailableAdvisors();
  const { data: myPendingRequest } = useMyPendingRequest();
  const chooseAdvisor = useChooseAdvisor();
  const cancelPendingRequest = useCancelPendingRequest();
  const submitCropToAdvisor = useSubmitCropToAdvisor();
  const cancelCropSubmission = useCancelCropSubmission();
  const activeAdvisor = myAdvisorData?.advisor;
  const [submittingCropId, setSubmittingCropId] = useState<string | null>(null);

  const handleSubmitCropForAdoption = async (cropId: string, cropName: string) => {
    tap();
    if (!activeAdvisor) {
      if (Platform.OS === 'web') {
        alert('🩺 Please choose and assign a Crop Doctor first before submitting crops for Crop Care Plan adoption.');
      } else {
        Alert.alert('Assign Doctor First', 'Please choose and assign a Crop Doctor first before submitting crops for Crop Care Plan adoption.');
      }
      setIsChoosingAdvisor(true);
      return;
    }
    setSubmittingCropId(cropId);
    try {
      await submitCropToAdvisor.mutateAsync(cropId);
      if (Platform.OS === 'web') alert(`✅ Request sent to ${activeAdvisor.name} to adopt "${cropName}" under Crop Care Plan!`);
      else Alert.alert('Request Sent', `Request sent to ${activeAdvisor.name} to adopt "${cropName}" under Crop Care Plan!`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not submit crop for adoption.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSubmittingCropId(null);
    }
  };

  const handleCancelCropAdoptionRequest = async (cropId: string, cropName: string) => {
    tap();
    setSubmittingCropId(cropId);
    try {
      await cancelCropSubmission.mutateAsync(cropId);
      if (Platform.OS === 'web') alert(`✅ Adoption request for "${cropName}" cancelled.`);
      else Alert.alert('Cancelled', `Adoption request for "${cropName}" cancelled.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not cancel request.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSubmittingCropId(null);
    }
  };

  const handleCancelHireRequest = async () => {
    tap();
    try {
      await cancelPendingRequest.mutateAsync();
      if (Platform.OS === 'web') alert('✅ Hire request cancelled successfully.');
      else Alert.alert('Cancelled', 'Your hire request has been cancelled.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not cancel request.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };


  const handleRequestAdvisor = async (advisorId: string) => {
    tap();
    try {
      await chooseAdvisor.mutateAsync(advisorId);
      setIsChoosingAdvisor(false);
      if (Platform.OS === 'web') alert('✅ Hire request sent! Doctor will accept your hire request shortly.');
      else Alert.alert('Success', 'Hire request sent! Doctor will accept your hire request shortly.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not choose advisor.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<RegisteredCropField | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isCropAdoptionExpanded, setIsCropAdoptionExpanded] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedCropForGps, setSelectedCropForGps] = useState<RegisteredCropField | null>(null);
  const [completionReviewModalVisible, setCompletionReviewModalVisible] = useState(false);
  const [cropToComplete, setCropToComplete] = useState<RegisteredCropField | null>(null);

  // Quick Payment Voucher Modal State
  const [showPaymentVoucherModal, setShowPaymentVoucherModal] = useState(false);
  const [voucherInitialType, setVoucherInitialType] = useState<VoucherType>('RECEIPT_IN');
  const { data: labourWorkers = [] } = useLabourWorkers();
  const { data: parties = [] } = useParties();

  // Share Bill preview for individual sale entries
  const fetchSaleBill = useFetchSaleBill();
  const { billShotRef, isSharingBill, shareInvoiceAsJpg: shareInvoiceAsJpgRaw } = useShareBillAsJpg();
  const [billPreviewInvoice, setBillPreviewInvoice] = useState<SavedSaleInvoice | null>(null);
  const [billPreviewVisible, setBillPreviewVisible] = useState(false);
  const [isLoadingBillPreview, setIsLoadingBillPreview] = useState(false);

  // FREE plan share limit — 50 bills, then prompt to upgrade.
  const FREE_SHARE_LIMIT = 50;
  const { data: billCountData } = useMySaleBillCount();
  const shareInvoiceAsJpg = async (fileName: string | undefined) => {
    if (!isPaid && (billCountData?.count ?? 0) >= FREE_SHARE_LIMIT) {
      const message = `Only ${FREE_SHARE_LIMIT} sale bills can be shared on the Free plan. Upgrade your plan to share more.`;
      if (Platform.OS === 'web') {
        if (confirm(`🔒 Upgrade Your Plan\n\n${message}\n\nWould you like to view plan comparison table & upgrade now?`)) {
          setIsUpgradeModalOpen(true);
        }
      } else {
        Alert.alert('🔒 Upgrade Your Plan', message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Plan 👑', onPress: () => setIsUpgradeModalOpen(true) },
        ]);
      }
      return;
    }
    await shareInvoiceAsJpgRaw(fileName);
  };

  const openBillPreviewForSale = async (sale: CropSaleRecord) => {
    tap();
    if (sale.billId) {
      setIsLoadingBillPreview(true);
      try {
        const bill = await fetchSaleBill.mutateAsync(sale.billId);
        const rcvdAmt = bill.amountReceived !== undefined && bill.amountReceived !== null ? Number(bill.amountReceived) : 0;
        const totalAmt = Number(bill.totalAmount || 0);
        const prevBal = Number(bill.previousBalance || 0);
        const thisBal = bill.thisSaleBalance !== undefined ? Number(bill.thisSaleBalance) : Math.max(0, totalAmt - rcvdAmt);
        const netRecv = bill.netReceivable !== undefined ? Number(bill.netReceivable) : prevBal + thisBal;

        setBillPreviewInvoice({
          billNo: bill.billNo,
          farmerName: bill.farmerName,
          partyId: bill.partyId,
          partyName: bill.partyName,
          partyMobile: bill.partyMobile,
          partyAddress: bill.partyAddress,
          isCash: bill.isCash,
          amountReceivedMode: (bill as any).amountReceivedMode || 'CASH',
          items: (bill.items || []).map((i: any, idx: number) => ({ id: String(idx), ...i })),
          totalItems: bill.totalItems,
          totalAmount: totalAmt,
          amountReceived: rcvdAmt,
          thisSaleBalance: thisBal,
          previousBalance: prevBal,
          netReceivable: netRecv,
          date: new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        });
        setBillPreviewVisible(true);
      } catch {
        if (Platform.OS === 'web') {
          alert('Could not load the saved bill for this sale.');
        } else {
          Alert.alert('Bill Not Found', 'Could not load the saved bill for this sale.');
        }
      } finally {
        setIsLoadingBillPreview(false);
      }
      return;
    }

    // Legacy sale with no linked bill — reconstruct a minimal single-item preview.
    const isCash = !sale.buyerName || sale.buyerName === 'Local Mandi Trader' || sale.buyerName === 'Cash Sale';
    const rcvdAmt = sale.amountReceived !== undefined && sale.amountReceived !== null ? Number(sale.amountReceived) : (isCash ? sale.totalAmount : 0);
    const prevBal = sale.previousBalance !== undefined ? Number(sale.previousBalance) : 0;
    const thisBal = Math.max(0, sale.totalAmount - rcvdAmt);

    setBillPreviewInvoice({
      billNo: `FK-${sale.saleDate ? sale.saleDate.replace(/-/g, '') : '260901'}`,
      farmerName: user?.name || 'Farmer',
      partyName: isCash ? 'Cash' : sale.buyerName,
      isCash,
      amountReceivedMode: sale.amountReceivedMode || 'CASH',
      items: [{ id: '0', cropId: sale.cropId, cropName: sale.cropName, unit: sale.unit, qty: Number(sale.quantity), rate: Number(sale.pricePerUnit), amount: sale.totalAmount }],
      totalItems: 1,
      totalAmount: sale.totalAmount,
      amountReceived: rcvdAmt,
      thisSaleBalance: thisBal,
      previousBalance: prevBal,
      netReceivable: prevBal + thisBal,
      date: sale.saleDate,
      time: '',
    });
    setBillPreviewVisible(true);
  };

  // Quick Sale Modal state
  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [selectedCropForSale, setSelectedCropForSale] = useState<RegisteredCropField | null>(null);
  const [saleQty, setSaleQty] = useState('');
  const [saleRate, setSaleRate] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [selectedSaleParty, setSelectedSaleParty] = useState<Party | null>(null);
  const { data: saleParties = [] } = useParties();
  const createParty = useCreateParty();
  const [saleNotice, setSaleNotice] = useState<string | null>(null);
  const [isCompletingWithSale, setIsCompletingWithSale] = useState(false);

  // Stage Change Warning Modal state
  const [stageConfirmModalVisible, setStageConfirmModalVisible] = useState(false);
  const [pendingStageUpdate, setPendingStageUpdate] = useState<{
    id: string;
    targetStage: CropStage;
    cropName: string;
  } | null>(null);

  // Update Stage picker modal state
  const [stagePickerVisible, setStagePickerVisible] = useState(false);
  const [stagePickerCrop, setStagePickerCrop] = useState<RegisteredCropField | null>(null);

  // Completed Crop Full Details Modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedHistoryCrop, setSelectedHistoryCrop] = useState<CropHistoryEntry | null>(null);

  const openHistoryDetail = (hItem: CropHistoryEntry) => {
    if (!isPaid) {
      tap();
      if (Platform.OS === 'web') {
        if (confirm('🔒 Paid User Exclusive Feature\n\nFull crop audit breakdown & itemized sale transaction records are available exclusively for Subscribed / Paid Farmers.\n\nWould you like to view plan comparison table & upgrade now?')) {
          setIsUpgradeModalOpen(true);
        }
      } else {
        Alert.alert(
          '🔒 Paid User Exclusive Feature',
          'Full crop audit breakdown & itemized sale transaction records are available exclusively for Subscribed / Paid Farmers.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Plan 👑', onPress: () => setIsUpgradeModalOpen(true) },
          ]
        );
      }
      return;
    }

    tap();
    setSelectedHistoryCrop(hItem);
    setDetailModalVisible(true);
  };

  const handleSaveCropForm = async (values: CropFormValues) => {
    tap();
    try {
      if (editingCrop) {
        await editCrop(editingCrop.id, values);
      } else {
        await addCrop(values);
      }
      setEditingCrop(null);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not save this crop. Please try again.';
      if (message.toLowerCase().includes('upgrade')) {
        if (Platform.OS === 'web') {
          if (confirm(`🔒 Upgrade Your Plan\n\n${message}\n\nWould you like to view plan comparison table & upgrade now?`)) {
            setIsUpgradeModalOpen(true);
          }
        } else {
          Alert.alert('🔒 Upgrade Your Plan', message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Plan 👑', onPress: () => setIsUpgradeModalOpen(true) },
          ]);
        }
      } else {
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Could Not Save Crop', message);
        }
      }
    }
  };

  const requestCropStageChange = (
    item: RegisteredCropField,
    currentStage: CropStage,
    targetStage: CropStage
  ) => {
    const currLevel = STAGE_ORDER[currentStage];
    const targetLevel = STAGE_ORDER[targetStage];

    if (targetLevel === currLevel) return;

    // STRICT ONE-WAY PROGRESSION RULE: Cannot go back to a lower stage level
    if (targetLevel < currLevel) {
      if (Platform.OS === 'web') {
        alert('🔒 Stage Locked! Once moved to the next stage, a crop cannot return to previous stages.');
      } else {
        Alert.alert(
          'Stage Locked 🔒',
          'Once moved to the next stage, a crop cannot return to previous stages!'
        );
      }
      return;
    }

    // Direct COMPLETED stage chip press: triggers mandatory sale / completion flow
    if (targetStage === 'COMPLETED') {
      handleCompleteCropRequest(item);
      return;
    }

    // Show Confirmation Warning Modal before advancing
    tap();
    setPendingStageUpdate({ id: item.id, targetStage, cropName: item.cropName });
    setStageConfirmModalVisible(true);
  };

  const confirmCropStageChange = async () => {
    if (!pendingStageUpdate) return;
    tap();
    const targetStage = pendingStageUpdate.targetStage;
    const targetCropId = pendingStageUpdate.id;
    setStageConfirmModalVisible(false);
    setPendingStageUpdate(null);

    if (targetStage === 'COMPLETED') {
      const cropItem = cropFields.find((c) => c.id === targetCropId);
      if (cropItem) {
        setCropToComplete(cropItem);
        setCompletionReviewModalVisible(true);
        return;
      }
    }

    try {
      await updateCropStage(targetCropId, targetStage);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not update crop stage. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Could Not Update Stage', message);
      }
    }
  };

  const handleReviewSubmitted = async (cropId: string, review: CropCompletionReview) => {
    try {
      await recordCompletionReview(cropId, review);
      await updateCropStage(cropId, 'COMPLETED');
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not submit completion review.';
      if (Platform.OS === 'web') alert(message);
      else Alert.alert('Review Error', message);
    }
  };

  const openSaleModal = (crop: RegisteredCropField, isFinalCompletion: boolean = false) => {
    if (crop.stage !== 'HARVESTING') {
      if (Platform.OS === 'web') {
        alert(`🔒 ${crop.cropName} is not in Harvesting Stage! Change crop stage to "Harvesting Ready 🌾" to enable sale.`);
      } else {
        Alert.alert(
          'Sale Locked 🔒',
          `${crop.cropName} is not in Harvesting Stage! Change crop stage to "Harvesting Ready 🌾" first.`
        );
      }
      return;
    }

    tap();
    setSelectedCropForSale(crop);
    setSaleQty('');
    setSaleRate(crop.pricePerUnit || '');
    setBuyerName('');
    setIsCompletingWithSale(isFinalCompletion);
    setSaleNotice(null);
    setSaleModalVisible(true);
  };

  const handleCompleteCropRequest = (crop: RegisteredCropField) => {
    // For ONE_TIME crops without prior sale, mandate a sale entry before final completion
    if (crop.harvestType === 'ONE_TIME') {
      const hasExistingSale = salesRecords.some((s) => s.cropId === crop.id);
      if (!hasExistingSale) {
        openSaleModal(crop, true);
        return;
      }
    }

    // For CONTINUOUS (daily) crops, sale entry is NOT mandatory to complete
    tap();
    setPendingStageUpdate({ id: crop.id, targetStage: 'COMPLETED', cropName: crop.cropName });
    setStageConfirmModalVisible(true);
  };

  const submitQuickSale = async () => {
    if (!saleQty.trim() || Number(saleQty) <= 0 || !saleRate.trim() || Number(saleRate) <= 0) {
      setSaleNotice('⚠️ Please enter valid sale quantity and rate.');
      return;
    }
    if (!selectedCropForSale) return;

    tap();
    try {
      // recordSale auto-completes ONE_TIME crops; CONTINUOUS (daily) crops remain ACTIVE for ongoing daily sales.
      await recordSale(selectedCropForSale.id, { quantity: saleQty, rate: saleRate, buyerName });
      setSaleModalVisible(false);
      setIsCompletingWithSale(false);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not record this sale. Please try again.';
      setSaleNotice(`⚠️ ${message}`);
    }
  };

  const getCompletedCropSummary = (cropId: string, hItem: CropHistoryEntry) => {
    const cropSales = salesRecords.filter((s) => s.cropId === cropId || (hItem.cropId && s.cropId === hItem.cropId));

    let totalWeight = 0;
    let totalAmount = 0;

    if (cropSales.length > 0) {
      totalWeight = cropSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      totalAmount = cropSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    } else if (hItem.soldQuantity) {
      totalWeight = Number(hItem.soldQuantity) || 0;
      totalAmount = hItem.totalRevenue || 0;
    }

    const count = cropSales.length || (hItem.soldQuantity ? 1 : 0);

    return {
      totalWeight: `${totalWeight.toLocaleString('en-IN')} ${hItem.unit}`,
      totalAmount: `₹${totalAmount.toLocaleString('en-IN')}`,
      count,
    };
  };

  const handleOpenAddCropModal = () => {
    tap();
    const maxTotalCrops = limits?.maxTotalCrops;
    const maxActiveCrops = limits?.maxActiveCrops;
    const totalCropsCount = cropFields.length;

    const planDisplayName =
      plan === 'PRO' ? 'Lite Plan' : plan === 'SMART' ? 'Pro Plan' : plan === 'SUPER' ? 'Smart Plan' : 'Free Plan';

    if (maxTotalCrops != null && maxTotalCrops > 0 && totalCropsCount >= maxTotalCrops) {
      const message = `Your current plan (${planDisplayName}) allows adding a maximum of ${maxTotalCrops} crop(s). Please upgrade your plan to add more crops.`;
      if (Platform.OS === 'web') {
        if (confirm(`🔒 Upgrade Your Plan\n\n${message}\n\nWould you like to view plan comparison table & upgrade now?`)) {
          setIsUpgradeModalOpen(true);
        }
      } else {
        Alert.alert('🔒 Upgrade Your Plan', message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Plan 👑', onPress: () => setIsUpgradeModalOpen(true) },
        ]);
      }
      return;
    }

    if (maxActiveCrops != null && maxActiveCrops > 0) {
      const activeCropsCount = cropFields.filter((c) => c.status === 'ACTIVE').length;
      if (activeCropsCount >= maxActiveCrops) {
        const message = `Your current plan (${planDisplayName}) allows a maximum of ${maxActiveCrops} active crop(s) at a time. Please upgrade your plan to add more active crops.`;
        if (Platform.OS === 'web') {
          if (confirm(`🔒 Upgrade Your Plan\n\n${message}\n\nWould you like to view plan comparison table & upgrade now?`)) {
            setIsUpgradeModalOpen(true);
          }
        } else {
          Alert.alert('🔒 Upgrade Your Plan', message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Plan 👑', onPress: () => setIsUpgradeModalOpen(true) },
          ]);
        }
        return;
      }
    }

    setEditingCrop(null);
    setIsCropModalOpen(true);
  };

  const activeCropFields = useMemo(
    () => cropFields.filter((crop) => crop.status === 'ACTIVE' && crop.stage !== 'COMPLETED'),
    [cropFields]
  );

  const adoptedCropFields = useMemo(
    () => activeCropFields.filter((crop) => crop.advisorStatus === 'ACCEPTED'),
    [activeCropFields]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
        <View style={styles.heroTopRow}>
          <Text style={styles.heroGreeting} numberOfLines={1}>🌾 My Crops & Doctor Advisory</Text>
        </View>

        {/* Sub-Tab Switcher: Active Crops vs Crop Doctor Care */}
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'CROPS' && styles.subTabItemActive]}
            onPress={() => { tap(); setActiveSubTab('CROPS'); }}
          >
            <Ionicons name="leaf" size={14} color={activeSubTab === 'CROPS' ? '#ffffff' : '#cbd5e1'} />
            <Text style={[styles.subTabText, activeSubTab === 'CROPS' && styles.subTabTextActive]}>
              🌾 Active Crops ({activeCropFields.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'CROP_CARE' && styles.subTabItemActive]}
            onPress={() => { tap(); setActiveSubTab('CROP_CARE'); }}
          >
            <Ionicons name="medical" size={14} color={activeSubTab === 'CROP_CARE' ? '#ffffff' : '#cbd5e1'} />
            <Text style={[styles.subTabText, activeSubTab === 'CROP_CARE' && styles.subTabTextActive]}>
              🩺 Crop Doctor Care
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeSubTab === 'CROPS' ? (
        /* Main Active Crops & Completed History List */
        <FlatList
          data={activeCropFields}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>Active Crops ({activeCropFields.length})</Text>
              <TouchableOpacity
                style={[styles.topAddCropBtn, { backgroundColor: '#15803d' }]}
                activeOpacity={0.85}
                onPress={handleOpenAddCropModal}
              >
                <Ionicons name="add-circle" size={16} color="#ffffff" />
                <Text style={[styles.topAddCropBtnText, { color: '#ffffff' }]}>+ Add Crop</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="leaf-outline" size={36} color="#cbd5e1" />
              <Text style={styles.emptyText}>No active crops right now.</Text>
              <Text style={styles.emptySub}>Click "+ Add Crop" below to register new crop plots & unit rates.</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#15803d', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}
                activeOpacity={0.85}
                onPress={handleOpenAddCropModal}
              >
                <Ionicons name="add-circle" size={18} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 }}>+ Add Crop</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isHarvestingReady = item.stage === 'HARVESTING';
            const isEditableStage = item.stage === 'PLANTATION' || item.stage === 'SOWING' || isAdminOrSuperAdmin;

            return (
              <View style={[styles.card, premiumShadow('#000000', 'sm')]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      📍 {item.fieldName} <Text style={styles.cropIdSubText}>(ID: {item.cropId || item.id})</Text>
                    </Text>
                    <View style={styles.cropBadge}>
                      <Text style={styles.cropBadgeText}>🌾 {item.cropName}</Text>
                    </View>
                  </View>
                  {isEditableStage && (
                    <TouchableOpacity
                      style={styles.editCropBadgeBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        setEditingCrop(item);
                        setIsCropModalOpen(true);
                      }}
                    >
                      <Ionicons name="pencil" size={13} color="#0284c7" />
                      <Text style={styles.editCropBadgeText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.cardMetaText}>
                  📏 {item.area}{item.sowingDate ? ` · 📅 ${item.sowingDate.replace(/\s*\([^)]*\)/g, '').trim()}` : ''}{item.variety ? ` · 🌱 ${item.variety}` : ''}{item.plantCount ? ` · 🪴 ${item.plantCount} Plants` : ''}
                </Text>

                {/* Crop GPS Location & Advisor Remote Sync Section — Dynamic based on GPS locked status */}
                <View style={{ marginTop: 6, gap: 6 }}>
                  {(() => {
                    const cropGps = cropGpsDataMap[item.id] || item.gpsData;
                    const isGpsLocked = cropGps?.isLocked || false;

                    if (!isGpsLocked) {
                      return (
                        <>
                          {/* Row 1: 📍 Set Crop GPS Location + ❓ How Process Works */}
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              style={{
                                flex: 1.3,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                backgroundColor: '#16a34a',
                                paddingVertical: 7,
                                paddingHorizontal: 8,
                                borderRadius: 8,
                              }}
                              activeOpacity={0.85}
                              onPress={() => {
                                tap();
                                unlockCropDirectly(item.id);
                                setSelectedCropForGps(item);
                                setShowLocationModal(true);
                              }}
                            >
                              <Ionicons name="location" size={13} color="#ffffff" />
                              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' }}>
                                📍 Set Crop GPS Location
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                backgroundColor: '#f0fdf4',
                                borderWidth: 1,
                                borderColor: '#bbf7d0',
                                paddingVertical: 7,
                                paddingHorizontal: 8,
                                borderRadius: 8,
                              }}
                              activeOpacity={0.85}
                              onPress={() => {
                                tap();
                                setShowGuideModal(true);
                              }}
                            >
                              <Ionicons name="help-circle-outline" size={13} color="#166534" />
                              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#166534' }}>
                                How Process Works
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* Row 2: 🔒 Satellite Advisor (Lock Location First) */}
                          <TouchableOpacity
                            style={{
                              width: '100%',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              backgroundColor: '#fff7ed',
                              borderWidth: 1,
                              borderColor: '#ffedd5',
                              paddingVertical: 7,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                            }}
                            activeOpacity={0.85}
                            onPress={() => {
                              tap();
                              Alert.alert(
                                'Location Not Locked 🔒',
                                'Please tap "📍 Set Crop GPS Location" to mark & lock 4 field corners first before accessing Satellite Advisor.'
                              );
                            }}
                          >
                            <Ionicons name="lock-closed" size={13} color="#d97706" />
                            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#b45309' }}>
                              🔒 Satellite Advisor (Lock Location First)
                            </Text>
                          </TouchableOpacity>
                        </>
                      );
                    } else {
                      // GPS Locked: Show active Satellite Map action button + Edit GPS
                      return (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={{
                              flex: 1.8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              backgroundColor: '#2563eb',
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              borderRadius: 8,
                            }}
                            activeOpacity={0.85}
                            onPress={() => {
                              tap();
                              router.push({
                                pathname: '/(tabs)/satellite-map',
                                params: {
                                  cropId: item.id,
                                  cropName: item.cropName,
                                  farmerName: item.farmerName || user?.name,
                                  plotName: item.fieldName,
                                  area: item.area,
                                  location: cropGps?.locationText || item.location,
                                  lat: String(cropGps?.centerLat || ''),
                                  lng: String(cropGps?.centerLng || ''),
                                },
                              });
                            }}
                          >
                            <Ionicons name="planet" size={15} color="#ffffff" />
                            <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' }}>
                              🛰️ View Satellite Health Map
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              backgroundColor: '#f0fdf4',
                              borderWidth: 1,
                              borderColor: '#bbf7d0',
                              paddingVertical: 8,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                            }}
                            activeOpacity={0.85}
                            onPress={() => {
                              tap();
                              setSelectedCropForGps(item);
                              setShowLocationModal(true);
                            }}
                          >
                            <Ionicons name="location-outline" size={13} color="#166534" />
                            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#166534' }}>
                              📍 Edit GPS
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }
                  })()}
                </View>

                <View style={styles.stageInlineRow}>
                  {(() => {
                    const st = STAGE_META[item.stage];
                    return (
                      <View style={[styles.stageChip, { backgroundColor: st.color, borderColor: st.color }]}>
                        <Text style={[styles.stageChipText, { color: '#ffffff', fontFamily: FONT.bold }]}>
                          {st.label}
                        </Text>
                      </View>
                    );
                  })()}
                  {item.stage !== 'COMPLETED' && (
                    <TouchableOpacity
                      style={styles.updateStageBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        setStagePickerCrop(item);
                        setStagePickerVisible(true);
                      }}
                    >
                      <Ionicons name="repeat" size={12} color={theme.primary} />
                      <Text style={styles.updateStageBtnText}>Update Stage</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}

          /* COMPLETED CROPS HISTORY SECTION AT THE BOTTOM */
          ListFooterComponent={
            <View style={styles.historySectionContainer}>
              <TouchableOpacity
                style={styles.historySectionHeader}
                activeOpacity={0.75}
                onPress={() => {
                  tap();
                  setIsHistoryExpanded((v) => !v);
                }}
              >
                <Ionicons name="time" size={18} color="#475569" />
                <Text style={[styles.historySectionTitle, { flex: 1 }]}>
                  Completed Crops History ({cropHistory.length})
                </Text>
                <Ionicons name={isHistoryExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
              </TouchableOpacity>

              {!isHistoryExpanded ? null : cropHistory.length > 0 ? (
                cropHistory.map((hItem) => {
                  const summary = getCompletedCropSummary(hItem.id, hItem);
                  return (
                    <TouchableOpacity
                      key={hItem.id}
                      style={[styles.historyCard, premiumShadow('#000000', 'sm')]}
                      activeOpacity={0.8}
                      onPress={() => openHistoryDetail(hItem)}
                    >
                      <View style={styles.historyCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.historyCropName}>
                            📍 {hItem.fieldName} <Text style={styles.cropIdSubText}>(ID: {hItem.cropId || hItem.id})</Text>
                          </Text>
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>🏁 COMPLETED</Text>
                          </View>
                        </View>
                        <Text style={styles.historyDate}>{hItem.completedDate}</Text>
                      </View>

                      <Text style={styles.historyCropSub}>🌾 {hItem.cropName} · {hItem.categoryName}</Text>

                      <View style={styles.historyRevenueBox}>
                        <Ionicons name="cash" size={16} color="#16a34a" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyRevenueText}>
                            Total Sale Weight: <Text style={{ fontFamily: FONT.bold, color: '#0f172a' }}>{summary.totalWeight}</Text>
                          </Text>
                          <Text style={styles.historyRevenueText}>
                            Total Sale Amount: <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>{summary.totalAmount}</Text>
                            {summary.count > 0 ? ` (${summary.count} sales logged)` : ''}
                          </Text>
                        </View>
                      </View>

                      {isPaid ? (
                        <View style={styles.historyViewMoreRow}>
                          <Ionicons name="sparkles" size={13} color="#16a34a" />
                          <Text style={[styles.historyViewMoreText, { color: '#16a34a', fontFamily: FONT.bold }]}>
                            ✨ Tap to view full sales audit details
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.historyViewMoreRow, { backgroundColor: '#fff7ed', borderColor: '#ffedd5', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.xs }]}>
                          <Ionicons name="lock-closed" size={13} color="#d97706" />
                          <Text style={[styles.historyViewMoreText, { color: '#b45309', fontFamily: FONT.bold }]}>
                            🔒 Full Details (Paid Users Only)
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.historyEmptyBox}>
                  <Ionicons name="checkmark-done-circle-outline" size={32} color="#cbd5e1" />
                  <Text style={styles.historyEmptyText}>No completed crops yet.</Text>
                  <Text style={styles.historyEmptySub}>
                    Completed crops will appear here with total sale weight and revenue summary.
                  </Text>
                </View>
              )}
            </View>
          }
        />
      ) : (
        /* CROP DOCTOR / CROP CARE ADVISORY SECTION */
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* Active Assigned Doctor Card */}
          <View style={[styles.doctorCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.doctorAvatarCircle}>
                <Ionicons name="medical" size={26} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorCardSub}>HIRED CROP DOCTOR</Text>
                <Text style={styles.doctorCardName}>
                  {activeAdvisor ? activeAdvisor.name : 'No Doctor Hired Yet'}
                </Text>
                <Text style={styles.doctorCardSpec}>
                  {activeAdvisor?.specialization || 'Specialized Farm & Crop Care Doctor'}
                </Text>
              </View>
            </View>

            {activeAdvisor ? (
              <View style={styles.doctorActionsRow}>
                <TouchableOpacity
                  style={[styles.doctorActionBtn, { backgroundColor: '#e0f2fe' }]}
                  onPress={() => router.push('/(tabs)/chat')}
                >
                  <Ionicons name="chatbubble-ellipses" size={15} color="#0284c7" />
                  <Text style={[styles.doctorActionText, { color: '#0284c7' }]}>Chat Doctor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.doctorActionBtn, { backgroundColor: '#dcfce7' }]}
                  onPress={() => router.push('/(tabs)/market')}
                >
                  <Ionicons name="call" size={15} color="#16a34a" />
                  <Text style={[styles.doctorActionText, { color: '#16a34a' }]}>Call Doctor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.doctorActionBtn, { backgroundColor: '#f1f5f9' }]}
                  onPress={() => setIsChoosingAdvisor(true)}
                >
                  <Ionicons name="swap-horizontal" size={15} color="#475569" />
                  <Text style={[styles.doctorActionText, { color: '#475569' }]}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : myPendingRequest ? (
              <View style={{ marginTop: 12, gap: 8 }}>
                <View style={{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', padding: 10, borderRadius: RADIUS.md }}>
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#b45309' }}>
                    ⏳ Hire Request Sent to {myPendingRequest.advisor?.name || 'Doctor'}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#92400e', marginTop: 2 }}>
                    Awaiting Doctor approval... You can cancel or choose another doctor anytime.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.doctorActionBtn, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}
                  disabled={cancelPendingRequest.isPending}
                  onPress={handleCancelHireRequest}
                >
                  {cancelPendingRequest.isPending ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={15} color="#dc2626" />
                      <Text style={[styles.doctorActionText, { color: '#dc2626' }]}>Cancel Hire Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.assignDoctorBtn, { backgroundColor: '#0284c7', marginTop: 12 }]}
                onPress={() => setIsChoosingAdvisor(true)}
              >
                <Text style={styles.assignDoctorBtnText}>+ Choose & Hire Crop Doctor 🩺</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Active Crops Advisory Recommendations (Only Adopted Crops) */}
          <Text style={styles.sectionHeaderTitle}>FIELD CROP ADVISORY & SPRAY SCHEDULES</Text>

          {adoptedCropFields.length === 0 ? (
            <View style={styles.historyEmptyBox}>
              <Ionicons name="medical-outline" size={32} color="#0284c7" />
              <Text style={styles.historyEmptyText}>No Crops Adopted Under Crop Care Plan</Text>
              <Text style={styles.historyEmptySub}>Submit your active crops below for Doctor adoption. Once accepted by your Crop Doctor, stage-wise advisory & spray schedules will appear here.</Text>
            </View>
          ) : (
            adoptedCropFields.map((crop) => {
              const st = STAGE_META[crop.stage];
              return (
                <View key={crop.id} style={[styles.card, premiumShadow('#000000', 'sm')]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        📍 {crop.fieldName}
                      </Text>
                      <View style={styles.cropBadge}>
                        <Text style={styles.cropBadgeText}>🌾 {crop.cropName}</Text>
                      </View>
                    </View>
                    <View style={[styles.stageChip, { backgroundColor: st.color, borderColor: st.color }]}>
                      <Text style={[styles.stageChipText, { color: '#ffffff', fontFamily: FONT.bold }]}>
                        {st.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.advisoryRecommendationBox}>
                    <Ionicons name="information-circle" size={18} color="#0284c7" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisoryStageTitle}>Doctor Recommended Action:</Text>
                      <Text style={styles.advisoryStageText}>
                        {crop.stage === 'PLANTATION' || crop.stage === 'SOWING'
                          ? '🌱 Ensure adequate seed treatment and soil moisture. Apply basal fertilizer dose as advised by Doctor.'
                          : crop.stage === 'VEGETATIVE' || crop.stage === 'GROWTH'
                          ? '🌿 Monitor nitrogen intake, weed control, and check leaf underside for early pest/fungal symptoms.'
                          : crop.stage === 'FLOWERING'
                          ? '🌸 Critical Flowering Stage! Spray recommended micronutrients/fungicides. Maintain steady irrigation.'
                          : crop.stage === 'HARVESTING'
                          ? '🌾 Harvesting Stage Ready! Stop chemical sprays. Plan harvesting schedule and log crop sales.'
                          : '🏁 Crop Cycle Completed.'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.doctorActionBtn, { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }]}
                      onPress={() => router.push('/(tabs)/crop-disease-scanner')}
                    >
                      <Ionicons name="camera" size={14} color="#16a34a" />
                      <Text style={[styles.doctorActionText, { color: '#16a34a' }]}>AI Disease Check</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.doctorActionBtn, { backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#bae6fd' }]}
                      onPress={() => router.push('/(tabs)/chat')}
                    >
                      <Ionicons name="medical" size={14} color="#0284c7" />
                      <Text style={[styles.doctorActionText, { color: '#0284c7' }]}>Consult Doctor</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* My Crops Crop Care Adoption Section (Collapsible & Below Advisory) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              tap();
              setIsCropAdoptionExpanded((prev) => !prev);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 14,
              marginBottom: 8,
              paddingHorizontal: 2,
            }}
          >
            <Text style={[styles.sectionHeaderTitle, { marginBottom: 0 }]}>
              MY CROPS — CROP CARE PLAN ADOPTION ({activeCropFields.length})
            </Text>
            <Ionicons
              name={isCropAdoptionExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
              size={22}
              color="#0284c7"
            />
          </TouchableOpacity>

          {isCropAdoptionExpanded && (
            activeCropFields.length === 0 ? (
              <View style={styles.historyEmptyBox}>
                <Ionicons name="leaf-outline" size={32} color="#cbd5e1" />
                <Text style={styles.historyEmptyText}>No Active Crops Registered</Text>
                <Text style={styles.historyEmptySub}>Register active crops first to send adoption requests to your Crop Doctor.</Text>
              </View>
            ) : (
              activeCropFields.map((crop) => {
                const isAccepted = crop.advisorStatus === 'ACCEPTED';
                const isPending = crop.advisorStatus === 'PENDING';
                return (
                  <View key={`adopt-${crop.id}`} style={[styles.card, { padding: 12, marginBottom: 10 }, premiumShadow('#000000', 'sm')]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>📍 {crop.fieldName}</Text>
                        <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>
                          🌾 {crop.cropName} · 📏 {crop.area}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {isAccepted ? (
                          <View style={{ backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                            <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#16a34a' }}>✅ Adopted</Text>
                          </View>
                        ) : isPending ? (
                          <TouchableOpacity
                            style={{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            disabled={submittingCropId === crop.id}
                            onPress={() => handleCancelCropAdoptionRequest(crop.id, crop.cropName)}
                          >
                            {submittingCropId === crop.id ? (
                              <ActivityIndicator size="small" color="#d97706" />
                            ) : (
                              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#b45309' }}>⏳ Pending Approval (Cancel)</Text>
                            )}
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={{ backgroundColor: '#0284c7', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            disabled={submittingCropId === crop.id}
                            onPress={() => handleSubmitCropForAdoption(crop.id, crop.cropName)}
                          >
                            {submittingCropId === crop.id ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' }}>+ Request Adoption 🩺</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )
          )}

          {/* Doctor Advisory Packages */}
          <Text style={styles.sectionHeaderTitle}>DOCTOR CARE ADVISORY PACKAGES</Text>

          {/* Package 1 */}
          <View style={[styles.planCard, { borderColor: '#0284c7', borderWidth: 1.5 }, premiumShadow('#000000', 'sm')]}>
            <View style={styles.planHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTitle, { color: '#0284c7' }]}>🩺 5-Crop Care Advisory</Text>
                <Text style={styles.planPrice}>₹499 <Text style={styles.planPeriod}>/ Full Crop Season</Text></Text>
              </View>
            </View>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✓ 1-on-1 Assigned Crop Care Doctor</Text>
              <Text style={styles.featureItem}>✓ Up to 5 Crop Plots Monitored</Text>
              <Text style={styles.featureItem}>✓ Stage-wise Spray & Fertilizer Schedules</Text>
              <Text style={styles.featureItem}>✓ Direct Phone & Chat Advisory</Text>
            </View>
            <TouchableOpacity
              style={[styles.assignDoctorBtn, { backgroundColor: '#0284c7' }]}
              onPress={() => setIsChoosingAdvisor(true)}
            >
              <Text style={styles.assignDoctorBtnText}>Subscribe 5-Crop Care Advisory 🩺</Text>
            </TouchableOpacity>
          </View>

          {/* Package 2 */}
          <View style={[styles.planCard, { borderColor: '#7c3aed', borderWidth: 2 }, premiumShadow('#7c3aed', 'sm')]}>
            <View style={[styles.vipTag, { backgroundColor: '#7c3aed' }]}>
              <Text style={styles.vipTagText}>🌟 VIP FULL FARM ADVISORY</Text>
            </View>
            <View style={styles.planHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTitle, { color: '#7c3aed' }]}>🩺 10-Crop VIP Advisory</Text>
                <Text style={styles.planPrice}>₹999 <Text style={styles.planPeriod}>/ Full Crop Season</Text></Text>
              </View>
            </View>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✓ Up to 10 Crop Plots Monitored Daily</Text>
              <Text style={styles.featureItem}>✓ High-Resolution ISRO Satellite Health Sync</Text>
              <Text style={styles.featureItem}>✓ Direct Audio/Video Doctor Calls</Text>
              <Text style={styles.featureItem}>✓ Emergency Disease Diagnosis & Visit Support</Text>
            </View>
            <TouchableOpacity
              style={[styles.assignDoctorBtn, { backgroundColor: '#7c3aed' }]}
              onPress={() => setIsChoosingAdvisor(true)}
            >
              <Text style={styles.assignDoctorBtnText}>Subscribe 10-Crop VIP Advisory 🌟</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* STAGE CHANGE WARNING CONFIRMATION MODAL */}
      <Modal visible={stageConfirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalCard}>
            <View style={styles.warningIconWrap}>
              <Ionicons name="warning" size={32} color="#d97706" />
            </View>

            <Text style={styles.warningTitle}>Stage Change Warning ⚠️</Text>
            <Text style={styles.warningDesc}>
              Are you sure you want to change the stage of <Text style={{ fontFamily: FONT.bold, color: '#0f172a' }}>{pendingStageUpdate?.cropName}</Text> to{' '}
              <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>
                {pendingStageUpdate ? STAGE_LABELS[pendingStageUpdate.targetStage] : ''}
              </Text>?
            </Text>

            <View style={styles.warningHighlightBox}>
              <Ionicons name="lock-closed" size={16} color="#b45309" />
              <Text style={styles.warningHighlightText}>
                ⚠️ Note: Once advanced to the next stage, you CANNOT revert to previous stages!
              </Text>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  tap();
                  setStageConfirmModalVisible(false);
                  setPendingStageUpdate(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmWarningBtn}
                onPress={confirmCropStageChange}
              >
                <Ionicons name="arrow-forward-circle" size={18} color="#ffffff" />
                <Text style={styles.confirmSaleText}>Yes, Change Stage</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* UPDATE STAGE PICKER MODAL */}
      <Modal visible={stagePickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Update Stage — {stagePickerCrop?.cropName}</Text>
              <TouchableOpacity
                onPress={() => {
                  setStagePickerVisible(false);
                  setStagePickerCrop(null);
                }}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {stagePickerCrop &&
              STAGE_PICKER_OPTIONS.filter((st) => STAGE_ORDER[st.key] > STAGE_ORDER[stagePickerCrop.stage]).map((st) => (
                <TouchableOpacity
                  key={st.key}
                  style={styles.stagePickerRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    setStagePickerVisible(false);
                    if (stagePickerCrop) {
                      requestCropStageChange(stagePickerCrop, stagePickerCrop.stage, st.key);
                    }
                    setStagePickerCrop(null);
                  }}
                >
                  <View style={[styles.stagePickerDot, { backgroundColor: st.color }]} />
                  <Text style={styles.stagePickerLabel}>{st.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </Modal>

      {/* Quick Crop Sale Logger Modal */}
      <Modal visible={saleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.saleModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>
                {isCompletingWithSale ? `Final Sale & Complete ${selectedCropForSale?.cropName}` : `Sale ${selectedCropForSale?.cropName}`}
              </Text>
              <TouchableOpacity onPress={() => setSaleModalVisible(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedCropForSale ? (
              <>
                <View style={styles.saleCropBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>{selectedCropForSale.cropName} · 🌾 Ready for Harvest</Text>
                    <Text style={styles.bannerSub}>
                      Field: {selectedCropForSale.fieldName} (ID: {selectedCropForSale.cropId || selectedCropForSale.id}) · Unit: {selectedCropForSale.unit}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalLabel}>Sale Quantity (in {selectedCropForSale.unit}) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={`e.g. 50 ${selectedCropForSale.unit}`}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={saleQty}
                  onChangeText={setSaleQty}
                />

                <Text style={styles.modalLabel}>Selling Price per {selectedCropForSale.unit} (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={`Rate per ${selectedCropForSale.unit}`}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={saleRate}
                  onChangeText={setSaleRate}
                />

                {Number(saleQty) > 0 && Number(saleRate) > 0 ? (
                  <View style={styles.revenueCalcBox}>
                    <Text style={styles.revTitle}>Total Sale Revenue:</Text>
                    <Text style={styles.revValue}>
                      {saleQty} {selectedCropForSale.unit} × ₹{saleRate} = ₹
                      {(Number(saleQty) * Number(saleRate)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}

                <PartyPicker
                  parties={saleParties}
                  selectedParty={selectedSaleParty}
                  onSelect={(party) => {
                    setSelectedSaleParty(party);
                    setBuyerName(party?.name ?? '');
                  }}
                  onTextChange={setBuyerName}
                  onCreate={async (payload) => createParty.mutateAsync(payload)}
                  accentColor={theme.primary}
                  label="Buyer / Mandi Trader Name"
                  placeholder="e.g. Bathinda Mandi Merchant"
                />

                {selectedCropForSale.harvestType === 'CONTINUOUS' ? (
                  <View style={[styles.warningHighlightBox, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]}>
                    <Ionicons name="information-circle" size={16} color="#0284c7" />
                    <Text style={[styles.warningHighlightText, { color: '#0369a1' }]}>
                      ℹ️ Daily Sale Log: Logging this sale records daily revenue for {selectedCropForSale.cropName}. The crop stays active for future sales.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.warningHighlightBox}>
                    <Ionicons name="alert-circle" size={16} color="#b45309" />
                    <Text style={styles.warningHighlightText}>
                      ⚠️ Seasonal One-Time Sale: Confirming this sale completes the crop cycle and moves it to Completed History.
                    </Text>
                  </View>
                )}

                {saleNotice ? <Text style={styles.errorNoticeText}>{saleNotice}</Text> : null}

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setSaleModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmSaleBtn}
                    onPress={submitQuickSale}
                  >
                    <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                    <Text style={styles.confirmSaleText}>Confirm & Log Revenue</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Completed Crop Full Details Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.saleModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>
                {selectedHistoryCrop ? `${selectedHistoryCrop.cropName} · Full Details` : 'Crop Details'}
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedHistoryCrop ? (
              <View style={styles.detailListWrap}>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>🏁 COMPLETED · {selectedHistoryCrop.completedDate}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📍 Field</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistoryCrop.fieldName} <Text style={{ fontSize: 12, color: '#64748b', fontFamily: FONT.medium }}>(ID: {selectedHistoryCrop.cropId || selectedHistoryCrop.id})</Text>
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🌾 Crop</Text>
                  <Text style={styles.detailValue}>{selectedHistoryCrop.cropName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🗂 Category</Text>
                  <Text style={styles.detailValue}>{selectedHistoryCrop.categoryName}</Text>
                </View>
                {selectedHistoryCrop.variety ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🌱 Variety</Text>
                    <Text style={styles.detailValue}>{selectedHistoryCrop.variety}</Text>
                  </View>
                ) : null}
                {selectedHistoryCrop.season ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🗓 Season</Text>
                    <Text style={styles.detailValue}>{selectedHistoryCrop.season}</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📏 Area</Text>
                  <Text style={styles.detailValue}>{selectedHistoryCrop.area}</Text>
                </View>
                {selectedHistoryCrop.sowingDate ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 Sown On</Text>
                    <Text style={styles.detailValue}>{selectedHistoryCrop.sowingDate}</Text>
                  </View>
                ) : null}
                {selectedHistoryCrop.irrigationType ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>💧 Irrigation</Text>
                    <Text style={styles.detailValue}>{selectedHistoryCrop.irrigationType}</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🔄 Harvest Type</Text>
                  <Text style={styles.detailValue}>
                    {(selectedHistoryCrop.harvestType || 'CONTINUOUS') === 'CONTINUOUS' ? 'Daily / Continuous' : 'One-Time'}
                  </Text>
                </View>

                {(() => {
                  const summary = getCompletedCropSummary(selectedHistoryCrop.id, selectedHistoryCrop);
                  const cropSales = salesRecords.filter((s) => s.cropId === selectedHistoryCrop.id);

                  return (
                    <View style={{ marginTop: 12 }}>
                      <View style={styles.historyRevenueBox}>
                        <Ionicons name="cash" size={18} color="#16a34a" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyRevenueText}>
                            Total Sale Weight: <Text style={{ fontFamily: FONT.bold, color: '#0f172a' }}>{summary.totalWeight}</Text>
                          </Text>
                          <Text style={styles.historyRevenueText}>
                            Total Sale Amount: <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>{summary.totalAmount}</Text>
                            {summary.count > 0 ? ` (${summary.count} sales logged)` : ''}
                          </Text>
                        </View>
                      </View>

                      {/* Crop Completion Review & Doctor Grading Details */}
                      {selectedHistoryCrop.completionReview ? (
                        <View style={{ marginTop: 12, backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Ionicons name="ribbon" size={16} color="#16a34a" />
                            <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#16a34a' }}>
                              Farmer Completion Audit & Rating
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
                            App Benefit Rating: {'⭐'.repeat(selectedHistoryCrop.completionReview.farmskingRating || 5)} ({selectedHistoryCrop.completionReview.farmskingRating || 5}/5 Stars)
                          </Text>
                          {selectedHistoryCrop.completionReview.farmskingBenefitAmount ? (
                            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#15803d', marginTop: 2 }}>
                              Estimated Extra Profit / Benefit: <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>{selectedHistoryCrop.completionReview.farmskingBenefitAmount}</Text>
                            </Text>
                          ) : null}
                          {selectedHistoryCrop.completionReview.farmskingFeedback ? (
                            <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#475569', marginTop: 4 }}>
                              💬 "{selectedHistoryCrop.completionReview.farmskingFeedback}"
                            </Text>
                          ) : null}

                          {selectedHistoryCrop.completionReview.doctorRating ? (
                            <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#dcfce7' }}>
                              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0369a1' }}>
                                🩺 Doctor Rating: {'⭐'.repeat(selectedHistoryCrop.completionReview.doctorRating)} (Grade: {selectedHistoryCrop.completionReview.doctorGrade || 'EXCELLENT'})
                              </Text>
                              {selectedHistoryCrop.completionReview.doctorFeedback ? (
                                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#334155', marginTop: 2 }}>
                                  Doctor Review: "{selectedHistoryCrop.completionReview.doctorFeedback}"
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      {/* Itemized Sale Audit Logs Breakdown for Subscribed Paid Farmers */}
                      <View style={styles.salesBreakdownWrap}>
                        <View style={styles.salesBreakdownHeaderRow}>
                          <Text style={styles.salesBreakdownTitle}>
                            📋 Recorded Sale Audit Log ({cropSales.length})
                          </Text>
                          <View style={styles.paidBadge}>
                            <Ionicons name="star" size={11} color="#b45309" />
                            <Text style={styles.paidBadgeText}>PAID USER</Text>
                          </View>
                        </View>

                        {cropSales.length > 0 ? (
                          cropSales.map((entry, idx) => (
                            <View key={entry.id || idx} style={styles.saleEntryCard}>
                              <View style={styles.saleEntryTopRow}>
                                <Text style={styles.saleEntryDate}>📅 {entry.saleDate}</Text>
                                <Text style={styles.saleEntryAmount}>₹{entry.totalAmount.toLocaleString('en-IN')}</Text>
                              </View>
                              <View style={styles.saleEntryMetaRow}>
                                <Text style={styles.saleEntryDetail}>
                                  📦 {entry.quantity} {entry.unit} @ ₹{entry.pricePerUnit} / {entry.unit}
                                </Text>
                                <Text style={styles.saleEntryBuyer}>👤 {entry.buyerName || 'Local Trader'}</Text>
                              </View>
                              <TouchableOpacity style={styles.shareBillBtn} activeOpacity={0.8} onPress={() => openBillPreviewForSale(entry)}>
                                <Ionicons name="download-outline" size={13} color="#16a34a" />
                                <Text style={styles.shareBillBtnText}>Download Bill</Text>
                              </TouchableOpacity>
                            </View>
                          ))
                        ) : (
                          <View style={{ padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, marginTop: 4 }}>
                            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b' }}>
                              No detailed individual sales entries logged for this crop.
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Bill Preview Modal — share an individual sale entry's bill as JPG */}
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
          <View style={styles.saleModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Bill Preview</Text>
              <TouchableOpacity
                onPress={() => {
                  setBillPreviewVisible(false);
                  setBillPreviewInvoice(null);
                }}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            {isLoadingBillPreview ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Ionicons name="hourglass-outline" size={22} color="#94a3b8" />
              </View>
            ) : (
              billPreviewInvoice && (
                <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                  <ViewShot ref={billShotRef} options={{ format: 'jpg', quality: 0.95 }}>
                    <BillPreview inv={billPreviewInvoice} />
                  </ViewShot>
                  <TouchableOpacity
                    style={[styles.confirmSaleBtn, { marginTop: 14, width: '100%' }]}
                    onPress={() => shareInvoiceAsJpg(`Bill-${billPreviewInvoice.billNo}`)}
                    disabled={isSharingBill}
                  >
                    <Ionicons name="download-outline" size={16} color="#ffffff" />
                    <Text style={styles.confirmSaleText}>{isSharingBill ? 'Preparing...' : 'Download Bill (JPG)'}</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        </View>
      </Modal>


      {/* Crop Category & Name Selector with attached form */}
      <CropCategorySelectorModal
        visible={isCropModalOpen}
        editingCrop={editingCrop}
        onClose={() => {
          setIsCropModalOpen(false);
          setEditingCrop(null);
        }}
        onSaveCropForm={handleSaveCropForm}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
      />

      <FarmerPlanUpgradeModal
        visible={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* Farm GPS Location Picker Modal */}
      <FarmLocationPickerModal
        visible={showLocationModal}
        initialIsLocked={selectedCropForGps ? !unlockedCropIds[selectedCropForGps.id] : true}
        cropId={selectedCropForGps?.id}
        cropName={selectedCropForGps?.cropName}
        farmerName={user?.name || selectedCropForGps?.farmerName}
        farmerPhone={user?.mobile || selectedCropForGps?.farmerPhone}
        plotName={selectedCropForGps?.fieldName}
        location={selectedCropForGps?.location}
        existingGpsData={selectedCropForGps?.gpsData}
        onClose={() => setShowLocationModal(false)}
        onSaveLocation={() => {
          if (selectedCropForGps) {
            lockCropGps(selectedCropForGps.id);
          }
          setShowLocationModal(false);
        }}
      />

      {/* Crop Location Process Guide Modal */}
      <CropLocationGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onOpenGpsPicker={() => setShowLocationModal(true)}
      />

      {/* Payment Voucher Modal Component for Quick Payments In/Out */}
      <PaymentVoucherModal
        visible={showPaymentVoucherModal}
        initialType={voucherInitialType}
        parties={parties}
        labourWorkers={labourWorkers}
        onClose={() => setShowPaymentVoucherModal(false)}
      />

      {/* Crop Completion Review & Doctor Grading Modal */}
      <CropCompletionReviewModal
        visible={completionReviewModalVisible}
        crop={cropToComplete}
        onClose={() => {
          setCompletionReviewModalVisible(false);
          setCropToComplete(null);
        }}
        onSubmitReview={handleReviewSubmitted}
      />

      {/* Choose Doctor Modal */}
      <Modal visible={isChoosingAdvisor} transparent animationType="slide" onRequestClose={() => setIsChoosingAdvisor(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.advisorModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>🩺 Available Crop Care Doctors</Text>
              <TouchableOpacity onPress={() => setIsChoosingAdvisor(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
              {availableAdvisors.length === 0 ? (
                <Text style={styles.emptyText}>No crop care doctors available right now.</Text>
              ) : (
                availableAdvisors.map((adv) => (
                  <View key={adv.id} style={styles.advisorItemRow}>
                    <View style={styles.doctorAvatarCircleSmall}>
                      <Ionicons name="person" size={18} color="#0284c7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisorName}>{adv.name}</Text>
                      <Text style={styles.advisorSub}>{adv.specialization || 'Specialized Farm Doctor'} · 📍 {adv.district || 'Punjab'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.chooseBtn}
                      disabled={chooseAdvisor.isPending}
                      onPress={() => handleRequestAdvisor(adv.id)}
                    >
                      <Text style={styles.chooseBtnText}>Hire 🩺</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  quickAccountsCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 10,
    gap: 8,
  },
  quickAccountsTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  quickAccountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickAccountsBtn: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  quickAccountsBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  cropGpsBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 10,
    marginVertical: 8,
    gap: 8,
  },
  gpsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsLocTitle: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  gpsBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  setGpsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  setGpsBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  guideGpsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  guideGpsBtnText: {
    color: '#166534',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },

  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: SPACING.xxl, overflow: 'hidden' },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: theme.accent, opacity: 0.18 },
  glowTop: { top: -70, right: -50 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroGreeting: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: FONT.medium, marginTop: 2 },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topAddCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  topAddCropBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  headerTitleRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  headerSectionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    elevation: 2,
  },
  headerSectionAddBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  list: { padding: SPACING.lg, paddingBottom: 80, flexGrow: 1 },
  marketCardWrap: { marginBottom: SPACING.xs },
  sectionTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#334155', marginBottom: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 6 },
  emptyText: { color: theme.text, fontSize: 15, fontFamily: FONT.bold, textAlign: 'center' },
  emptySub: { color: theme.textMuted, fontSize: 12.5, fontFamily: FONT.medium, textAlign: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  cardTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  cropIdSubText: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  cardMetaText: { fontSize: 12, fontFamily: FONT.medium, color: '#475569', marginTop: 3 },
  stageInlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  cropBadge: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs },
  cropBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: '#15803d' },
  categoryBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.xs },
  categoryBadgeText: { fontSize: 10, fontFamily: FONT.bold },
  rateBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  rateBadgeText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  metaText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  varietyText: { fontSize: 11, fontFamily: FONT.medium, color: '#16a34a', marginTop: 3 },
  stageChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  stageChipText: {
    fontSize: 10,
  },
  updateStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  updateStageBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  stagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stagePickerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stagePickerLabel: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONT.semiBold,
    color: '#0f172a',
  },
  saleCropCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 8,
  },
  saleCropCardBtnText: {
    fontSize: 12,
  },
  completeCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    backgroundColor: '#475569',
  },
  completeCropBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  deleteBtn: { padding: 4 },
  historySectionContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  historySectionTitle: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#334155',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCropName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  completedBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  completedBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  historyDate: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  historyCropSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 3,
  },
  historyRevenueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: RADIUS.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  historyRevenueText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#15803d',
    flex: 1,
  },
  historyMetaText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 4,
  },
  historyViewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  historyViewMoreText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  detailListWrap: { gap: 2, marginTop: 4 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  historyEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  historyEmptyText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  historyEmptySub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  warningModalCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    ...premiumShadow('#000000', 'lg'),
  },
  warningIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    marginBottom: 6,
  },
  warningDesc: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  warningHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 16,
  },
  warningHighlightText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#b45309',
    lineHeight: 15,
  },
  confirmWarningBtn: {
    flex: 1.5,
    backgroundColor: '#d97706',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saleModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 32,
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  saleCropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 10,
  },
  bannerTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  bannerSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#16a34a',
    marginTop: 2,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    fontFamily: FONT.medium,
  },
  revenueCalcBox: {
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  revTitle: { fontSize: 11.5, fontFamily: FONT.bold, color: '#b45309' },
  revValue: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#92400e', marginTop: 2 },
  errorNoticeText: { fontSize: 12, fontFamily: FONT.bold, color: '#dc2626', marginTop: 8 },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#334155', fontFamily: FONT.semiBold, fontSize: 13.5 },
  confirmSaleBtn: {
    flex: 1.5,
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmSaleText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },
  fabWrap: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: RADIUS.md,
    ...premiumShadow(theme.primary, 'md'),
  },
  fab: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 15, fontFamily: FONT.bold },
  salesBreakdownWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  salesBreakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  salesBreakdownTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  paidBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  saleEntryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saleEntryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  saleEntryDate: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  saleEntryAmount: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  saleEntryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleEntryDetail: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  saleEntryBuyer: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  shareBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  shareBillBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  editCropBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  editCropBadgeText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 3,
    borderRadius: RADIUS.pill,
    marginTop: 12,
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  subTabItemActive: {
    backgroundColor: theme.primary,
  },
  subTabText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  subTabTextActive: {
    color: '#ffffff',
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  doctorAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorCardSub: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  doctorCardName: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  doctorCardSpec: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  doctorActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  doctorActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  doctorActionText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  assignDoctorBtn: {
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignDoctorBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 13,
  },
  advisoryRecommendationBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  advisoryStageTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  advisoryStageText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#0c4a6e',
    marginTop: 2,
    lineHeight: 16,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  vipTag: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  vipTagText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  planPrice: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    marginTop: 2,
  },
  planPeriod: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  featureList: {
    gap: 5,
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  advisorModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 16,
    maxHeight: '80%',
  },
  advisorItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  doctorAvatarCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  advisorSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  chooseBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  chooseBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
});
