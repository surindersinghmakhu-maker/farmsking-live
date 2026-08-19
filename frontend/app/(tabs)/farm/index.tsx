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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { useAuth } from '@/src/store/auth-context';
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
  const { user, logout } = useAuth();
  const { cropFields, cropHistory, salesRecords, addCrop, removeCrop, updateCropStage, recordSale } = useCrops();
  const { plan } = useFarmerPlan();
  const isPaid = plan !== 'FREE';

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

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
      const message = `Free plan par sirf ${FREE_SHARE_LIMIT} sale bill share ho sakde han. Zyada share karan layi apna plan upgrade karo.`;
      if (Platform.OS === 'web') {
        alert(`🔒 Upgrade Your Plan\n\n${message}`);
      } else {
        Alert.alert('🔒 Upgrade Your Plan', message);
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
        setBillPreviewInvoice({
          billNo: bill.billNo,
          farmerName: bill.farmerName,
          partyId: bill.partyId,
          partyName: bill.partyName,
          partyMobile: bill.partyMobile,
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
    setBillPreviewInvoice({
      billNo: `FK-${sale.saleDate.replace(/-/g, '')}`,
      farmerName: user?.name || 'Farmer',
      partyName: isCash ? 'Cash' : sale.buyerName,
      isCash,
      items: [{ id: '0', cropId: sale.cropId, cropName: sale.cropName, unit: sale.unit, qty: Number(sale.quantity), rate: Number(sale.pricePerUnit), amount: sale.totalAmount }],
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
        alert(
          '🔒 Paid User Exclusive Feature\n\nFull crop audit breakdown & itemized sale transaction records are available exclusively for Subscribed / Paid Farmers.'
        );
      } else {
        Alert.alert(
          '🔒 Paid User Exclusive Feature',
          'Full crop audit breakdown & itemized sale transaction records are available exclusively for Subscribed / Paid Farmers.'
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
      await addCrop(values);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not add this crop. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Could Not Add Crop', message);
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
        alert('🔒 Stage Locked! Fasal next stage pe aane ke baad pichli stage par vapas nahi ja sakti.');
      } else {
        Alert.alert(
          'Stage Locked 🔒',
          'Fasal next stage pe aane ke baad pichli stage par vapas nahi ja sakti!'
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
    try {
      await updateCropStage(pendingStageUpdate.id, pendingStageUpdate.targetStage);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not update crop stage. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Could Not Update Stage', message);
      }
    }
    setStageConfirmModalVisible(false);
    setPendingStageUpdate(null);
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
    const cropSales = salesRecords.filter((s) => s.cropId === cropId);

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

  const activeCropFields = useMemo(
    () => cropFields.filter((crop) => crop.status === 'ACTIVE' && crop.stage !== 'COMPLETED'),
    [cropFields]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroGreeting}>My Crops & Fields</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.logoutButton} onPress={() => logout()} activeOpacity={0.75}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Active Crops & Completed History List */}
      <FlatList
        data={activeCropFields}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.marketCardWrap}>
            <Text style={styles.sectionTitle}>Active Crops ({activeCropFields.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="leaf-outline" size={36} color="#cbd5e1" />
            <Text style={styles.emptyText}>No active crops right now.</Text>
            <Text style={styles.emptySub}>Click "+ Add New Crop" to register new crop plots & unit rates.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isHarvestingReady = item.stage === 'HARVESTING';

          return (
            <View style={[styles.card, premiumShadow('#000000', 'sm')]}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>📍 {item.fieldName}</Text>
                  <View style={styles.cropBadge}>
                    <Text style={styles.cropBadgeText}>🌾 {item.cropName}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.cardMetaText}>
                📏 {item.area}{item.sowingDate ? ` · 📅 ${item.sowingDate}` : ''}{item.variety ? ` · 🌱 ${item.variety}` : ''}
              </Text>

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

              <TouchableOpacity
                style={[
                  styles.saleCropCardBtn,
                  isHarvestingReady
                    ? { backgroundColor: '#16a34a', borderColor: '#15803d' }
                    : { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
                ]}
                activeOpacity={0.8}
                onPress={() => openSaleModal(item, false)}
              >
                <Ionicons
                  name={isHarvestingReady ? 'cart' : 'lock-closed'}
                  size={14}
                  color={isHarvestingReady ? '#ffffff' : '#64748b'}
                />
                <Text
                  style={[
                    styles.saleCropCardBtnText,
                    isHarvestingReady ? { color: '#ffffff', fontFamily: FONT.bold } : { color: '#64748b' },
                  ]}
                >
                  {isHarvestingReady ? `💰 Sell ${item.cropName}` : `🔒 Sell ${item.cropName}`}
                </Text>
              </TouchableOpacity>
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
                        <Text style={styles.historyCropName}>📍 {hItem.fieldName}</Text>
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

      {/* STAGE CHANGE WARNING CONFIRMATION MODAL */}
      <Modal visible={stageConfirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalCard}>
            <View style={styles.warningIconWrap}>
              <Ionicons name="warning" size={32} color="#d97706" />
            </View>

            <Text style={styles.warningTitle}>Stage Change Warning ⚠️</Text>
            <Text style={styles.warningDesc}>
              Kya aap <Text style={{ fontFamily: FONT.bold, color: '#0f172a' }}>{pendingStageUpdate?.cropName}</Text> ki stage badal kar{' '}
              <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>
                {pendingStageUpdate ? STAGE_LABELS[pendingStageUpdate.targetStage] : ''}
              </Text>{' '}
              karna chahte hain?
            </Text>

            <View style={styles.warningHighlightBox}>
              <Ionicons name="lock-closed" size={16} color="#b45309" />
              <Text style={styles.warningHighlightText}>
                ⚠️ Dhyan den: Ek baar next stage par aane ke baad aap pichli stage par vapas NAHI ja sakte!
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
                <Text style={styles.cancelBtnText}>Cancel (रद्द करें)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmWarningBtn}
                onPress={confirmCropStageChange}
              >
                <Ionicons name="arrow-forward-circle" size={18} color="#ffffff" />
                <Text style={styles.confirmSaleText}>Haan, Stage Badlein</Text>
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
                      Field: {selectedCropForSale.fieldName} · Unit: {selectedCropForSale.unit}
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
                  <Text style={styles.detailValue}>{selectedHistoryCrop.fieldName}</Text>
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
                                <Ionicons name="share-social-outline" size={13} color="#16a34a" />
                                <Text style={styles.shareBillBtnText}>Share Bill</Text>
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
                    <Ionicons name="share-social-outline" size={16} color="#ffffff" />
                    <Text style={styles.confirmSaleText}>{isSharingBill ? 'Preparing...' : 'Share Bill (JPG)'}</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom CTA to Add Crop */}
      <TouchableOpacity
        style={styles.fabWrap}
        onPress={() => {
          tap();
          setIsCropModalOpen(true);
        }}
        activeOpacity={0.85}
      >
        <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fab}>
          <Ionicons name="add-circle" size={22} color="#fff" />
          <Text style={styles.fabText}>+ Add New Crop & Unit Rates</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Crop Category & Name Selector with attached form */}
      <CropCategorySelectorModal
        visible={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        onSaveCropForm={handleSaveCropForm}
      />

    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
});
