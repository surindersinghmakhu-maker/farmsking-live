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
import { useAuth } from '@/src/store/auth-context';
import { useCrops, CropStage, CropHistoryEntry, RegisteredCropField, STAGE_ORDER } from '@/src/store/crops-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { CropCategorySelectorModal, CropFormValues } from '@/components/CropCategorySelectorModal';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const STAGE_LABELS: Record<CropStage, string> = {
  SOWING: '🌱 Sowing (बुवाई)',
  GROWTH: '🌿 Growth (बढ़वार)',
  HARVESTING: '🌾 Harvesting Ready (कटाई योग्य)',
  COMPLETED: '🏁 Completed (पूर्ण)',
};

export default function FarmListScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cropFields, cropHistory, salesRecords, addCrop, removeCrop, updateCropStage, recordSale } = useCrops();

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Quick Sale Modal state
  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [selectedCropForSale, setSelectedCropForSale] = useState<RegisteredCropField | null>(null);
  const [saleQty, setSaleQty] = useState('');
  const [saleRate, setSaleRate] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [saleNotice, setSaleNotice] = useState<string | null>(null);
  const [isCompletingWithSale, setIsCompletingWithSale] = useState(false);

  // Stage Change Warning Modal state
  const [stageConfirmModalVisible, setStageConfirmModalVisible] = useState(false);
  const [pendingStageUpdate, setPendingStageUpdate] = useState<{
    id: string;
    targetStage: CropStage;
    cropName: string;
  } | null>(null);

  // Completed Crop Full Details Modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedHistoryCrop, setSelectedHistoryCrop] = useState<CropHistoryEntry | null>(null);

  const openHistoryDetail = (hItem: CropHistoryEntry) => {
    tap();
    setSelectedHistoryCrop(hItem);
    setDetailModalVisible(true);
  };

  const handleSaveCropForm = (values: CropFormValues) => {
    tap();
    addCrop(values);
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

  const confirmCropStageChange = () => {
    if (!pendingStageUpdate) return;
    tap();
    updateCropStage(pendingStageUpdate.id, pendingStageUpdate.targetStage);
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
          `${crop.cropName} is not in Harvesting Stage! Kripya pehle crop ka status "Harvesting Ready 🌾" karein.`
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
    setSaleNotice(
      isFinalCompletion
        ? '⚠️ Crop ko complete karke History me bhejne ke liye pehle sale entry (बिक्री रिकॉर्ड) darj karna zaroori hai.'
        : null
    );
    setSaleModalVisible(true);
  };

  const handleCompleteCropRequest = (crop: RegisteredCropField) => {
    const hasExistingSale = salesRecords.some((s) => s.cropId === crop.id);

    // Mandate sale entry before completing harvest
    if (crop.harvestType === 'ONE_TIME' || !hasExistingSale) {
      openSaleModal(crop, true);
    } else {
      tap();
      updateCropStage(crop.id, 'COMPLETED');
    }
  };

  const submitQuickSale = () => {
    if (!saleQty.trim() || Number(saleQty) <= 0 || !saleRate.trim() || Number(saleRate) <= 0) {
      setSaleNotice('⚠️ Kripya valid sale quantity aur rate enter karein.');
      return;
    }
    if (!selectedCropForSale) return;

    tap();
    recordSale(selectedCropForSale.id, { quantity: saleQty, rate: saleRate, buyerName });

    if (isCompletingWithSale || selectedCropForSale.harvestType === 'ONE_TIME') {
      updateCropStage(selectedCropForSale.id, 'COMPLETED');
    }

    setSaleModalVisible(false);
    setIsCompletingWithSale(false);
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
            <Text style={styles.heroSubtitle}>{user?.name} · Managed Crops & Sequential Growth Lifecycle</Text>
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
            <Text style={styles.sectionTitle}>Active Crop Plots ({activeCropFields.length})</Text>
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
          const isCont = (item.harvestType || 'CONTINUOUS') === 'CONTINUOUS';
          const isHarvestingReady = item.stage === 'HARVESTING';
          const currentLevel = STAGE_ORDER[item.stage];

          return (
            <View style={[styles.card, premiumShadow('#000000', 'sm')]}>
              <View style={[styles.cardIconWrap, { backgroundColor: item.categoryBg }]}>
                <Ionicons name="leaf" size={20} color={item.categoryColor} />
              </View>

              <View style={styles.cardBody}>
                {/* Top Header: Plot Name + Crop Name Tag + Status Badge */}
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>📍 {item.fieldName}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', borderWidth: 1 }]}>
                    <Text style={[styles.categoryBadgeText, { color: '#16a34a' }]}>🟢 ACTIVE</Text>
                  </View>
                  <View style={[styles.cropBadge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 }]}>
                    <Text style={styles.cropBadgeText}>🌾 {item.cropName}</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: item.categoryBg }]}>
                    <Text style={[styles.categoryBadgeText, { color: item.categoryColor }]}>
                      {item.categoryName}
                    </Text>
                  </View>
                  <View style={[styles.categoryBadge, isCont ? { backgroundColor: '#e0f2fe' } : { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.categoryBadgeText, isCont ? { color: '#0369a1' } : { color: '#b45309' }]}>
                      {isCont ? '🔄 Daily' : '🌾 One-Time'}
                    </Text>
                  </View>
                </View>

                {/* Rate & Unit Badge */}
                <View style={styles.rateBadgeWrap}>
                  <Ionicons name="pricetag" size={13} color="#16a34a" />
                  <Text style={styles.rateBadgeText}>
                    Previous Sale Price: {item.pricePerUnit && item.pricePerUnit.trim() !== '' ? `₹${item.pricePerUnit} / ${item.unit}` : '-'}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>📏 {item.area}</Text>
                  {item.irrigationType ? (
                    <Text style={styles.metaText}>💧 Water: {item.irrigationType}</Text>
                  ) : null}
                  {item.sowingDate ? <Text style={styles.metaText}>📅 Sown: {item.sowingDate}</Text> : null}
                </View>

                {item.variety ? <Text style={styles.varietyText}>Variety: {item.variety}</Text> : null}

                {/* Step-by-Step One-Way Sequential Stage Progression */}
                <View style={styles.stageProgressWrap}>
                  <Text style={styles.stageControlLabel}>
                    Crop Growth Stage (Step-by-Step Progress):
                  </Text>
                  <View style={styles.stageToggleRow}>
                    {[
                      { key: 'SOWING', label: '🌱 Sowing', color: '#d97706', bg: '#fef3c7', level: 1 },
                      { key: 'GROWTH', label: '🌿 Growth', color: '#0284c7', bg: '#e0f2fe', level: 2 },
                      { key: 'HARVESTING', label: '🌾 Harvesting', color: '#16a34a', bg: '#dcfce7', level: 3 },
                      { key: 'COMPLETED', label: '🏁 Completed', color: '#475569', bg: '#f1f5f9', level: 4 },
                    ].map((st) => {
                      const isCurrent = item.stage === st.key;
                      const isPast = st.level < currentLevel;
                      const isFuture = st.level > currentLevel;

                      return (
                        <TouchableOpacity
                          key={st.key}
                          style={[
                            styles.stageChip,
                            isCurrent && { backgroundColor: st.color, borderColor: st.color },
                            isPast && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', opacity: 0.8 },
                            isFuture && { backgroundColor: '#ffffff', borderColor: st.color },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => requestCropStageChange(item, item.stage, st.key as CropStage)}
                        >
                          <Text
                            style={[
                              styles.stageChipText,
                              isCurrent && { color: '#ffffff', fontFamily: FONT.bold },
                              isPast && { color: '#64748b', fontFamily: FONT.medium },
                              isFuture && { color: st.color, fontFamily: FONT.bold },
                            ]}
                          >
                            {isPast ? `✔️ ${st.label}` : isFuture ? `⏩ ${st.label}` : st.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* ACTION BUTTONS (Enabled ONLY in Harvesting Stage) */}
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
                    size={15}
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

              <TouchableOpacity style={styles.deleteBtn} onPress={() => removeCrop(item.id)}>
                <Ionicons name="trash-outline" size={17} color="#dc2626" />
              </TouchableOpacity>
            </View>
          );
        }}

        /* COMPLETED CROPS HISTORY SECTION AT THE BOTTOM */
        ListFooterComponent={
          <View style={styles.historySectionContainer}>
            <View style={styles.historySectionHeader}>
              <Ionicons name="time" size={18} color="#475569" />
              <Text style={styles.historySectionTitle}>
                Completed Crops History (पूर्ण फसलों का इतिहास) ({cropHistory.length})
              </Text>
            </View>

            {cropHistory.length > 0 ? (
              cropHistory.map((hItem) => (
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

                  {hItem.soldQuantity ? (
                    <View style={styles.historyRevenueBox}>
                      <Ionicons name="cash" size={15} color="#16a34a" />
                      <Text style={styles.historyRevenueText}>
                        Sold: {hItem.soldQuantity} {hItem.unit} @ ₹{hItem.soldRate} / {hItem.unit} = ₹{(hItem.totalRevenue ?? 0).toLocaleString('en-IN')} ({hItem.buyerName})
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.historyMetaText}>Completed Crop Harvest</Text>
                  )}

                  <View style={styles.historyViewMoreRow}>
                    <Ionicons name="eye-outline" size={13} color="#0284c7" />
                    <Text style={styles.historyViewMoreText}>Tap to view full details (पूरी जानकारी देखें)</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.historyEmptyBox}>
                <Ionicons name="checkmark-done-circle-outline" size={32} color="#cbd5e1" />
                <Text style={styles.historyEmptyText}>Abhi koi crop complete nahi hui hai.</Text>
                <Text style={styles.historyEmptySub}>
                  Harvesting ready hone par sale darj karke complete karne par crop yahan history me chali jayegi.
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

                <Text style={styles.modalLabel}>Buyer / Mandi Trader Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Bathinda Mandi Merchant"
                  placeholderTextColor="#94a3b8"
                  value={buyerName}
                  onChangeText={setBuyerName}
                />

                {(selectedCropForSale.harvestType === 'ONE_TIME' || isCompletingWithSale) ? (
                  <View style={styles.warningHighlightBox}>
                    <Ionicons name="alert-circle" size={16} color="#b45309" />
                    <Text style={styles.warningHighlightText}>
                      ⚠️ Mandatory Sale Entry: Sale confirm karte hi ye crop "🏁 Completed" ho jayegi aur Active Crops se hat kar Completed Crops History me shamil ho jayegi.
                    </Text>
                  </View>
                ) : null}

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

                {selectedHistoryCrop.soldQuantity ? (
                  <View style={styles.historyRevenueBox}>
                    <Ionicons name="cash" size={15} color="#16a34a" />
                    <Text style={styles.historyRevenueText}>
                      Sold: {selectedHistoryCrop.soldQuantity} {selectedHistoryCrop.unit} @ ₹{selectedHistoryCrop.soldRate} / {selectedHistoryCrop.unit} = ₹{(selectedHistoryCrop.totalRevenue ?? 0).toLocaleString('en-IN')} ({selectedHistoryCrop.buyerName})
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  cropBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.xs },
  cropBadgeText: { fontSize: 12, fontFamily: FONT.bold, color: '#15803d' },
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
  stageProgressWrap: {
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stageControlLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 4,
  },
  stageToggleRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  stageChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  stageChipText: {
    fontSize: 10.5,
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
});
