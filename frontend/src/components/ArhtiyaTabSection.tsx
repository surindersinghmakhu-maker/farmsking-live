import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { RoleThemes } from '@/constants/Colors';
import { MandiUnit, UnifiedParty } from '@/src/api/parties.api';
import {
  useUnifiedParties,
  useCreateUnifiedParty,
  useRecordArhtiyaAdvance,
  useRecordArhtiyaCropSale,
  useArhtiyaHisab,
} from '@/src/hooks/useParties';


const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export function ArhtiyaTabSection() {
  const { data: arhtiyas = [], isLoading } = useUnifiedParties('ARHTIYA');
  const createParty = useCreateUnifiedParty();
  const recordAdvance = useRecordArhtiyaAdvance();
  const recordCropSale = useRecordArhtiyaCropSale();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showCropSaleModal, setShowCropSaleModal] = useState(false);
  const [hisabPartyId, setHisabPartyId] = useState<string | null>(null);

  // Add Arhtiya Form
  const [name, setName] = useState('');
  const [mandiName, setMandiName] = useState('');
  const [shopNumber, setShopNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Advance Form
  const [targetPartyId, setTargetPartyId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [interestRate, setInterestRate] = useState('1.5');
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  // Crop Sale Form
  const [salePartyId, setSalePartyId] = useState('');
  const [cropName, setCropName] = useState('');
  const [inputUnit, setInputUnit] = useState<MandiUnit>('QUINTAL');
  const [inputQuantity, setInputQuantity] = useState('');
  const [ratePerQuintal, setRatePerQuintal] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('2.5');
  const [otherCharges, setOtherCharges] = useState('');
  const [jFormNumber, setJFormNumber] = useState('');
  const [jFormDate, setJFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [jFormPhotoUrl, setJFormPhotoUrl] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [saleError, setSaleError] = useState<string | null>(null);

  const { data: hisabData, isLoading: isLoadingHisab } = useArhtiyaHisab(hisabPartyId ?? undefined);

  // Unit conversion helper
  const computeQuintals = (qty: number, unit: MandiUnit) => {
    if (!qty || qty <= 0) return 0;
    switch (unit) {
      case 'BAG_50KG':
        return (qty * 50) / 100;
      case 'BAG_35KG':
        return (qty * 35) / 100;
      case 'MANN':
        return (qty * 40) / 100;
      case 'KG':
        return qty / 100;
      case 'QUINTAL':
      default:
        return qty;
    }
  };

  const handleAddArhtiya = async () => {
    setAddError(null);
    if (!name.trim()) {
      setAddError('Enter Arhtiya / Firm Name.');
      return;
    }
    try {
      await createParty.mutateAsync({
        name: name.trim(),
        mandiName: mandiName.trim() || undefined,
        shopNumber: shopNumber.trim() || undefined,
        mobile: mobile.trim() || undefined,
        roles: ['ARHTIYA'],
      });
      setShowAddModal(false);
      setName('');
      setMandiName('');
      setShopNumber('');
      setMobile('');
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Could not add Arhtiya.');
    }
  };

  const handleRecordAdvance = async () => {
    setAdvanceError(null);
    const amt = Number(advanceAmount);
    if (!targetPartyId || !amt || amt <= 0) {
      setAdvanceError('Select an Arhtiya and enter a valid advance amount.');
      return;
    }
    try {
      await recordAdvance.mutateAsync({
        partyId: targetPartyId,
        amount: amt,
        transactionDate: advanceDate,
        interestRateMonthly: Number(interestRate) || 0,
        notes: advanceNotes.trim() || undefined,
      });
      setShowAdvanceModal(false);
      setAdvanceAmount('');
      setAdvanceNotes('');
    } catch (err: any) {
      setAdvanceError(err?.response?.data?.message || 'Could not record advance.');
    }
  };

  const handleRecordCropSale = async () => {
    setSaleError(null);
    const qty = Number(inputQuantity);
    const rate = Number(ratePerQuintal);
    if (!salePartyId || !cropName.trim() || !qty || qty <= 0 || !rate || rate <= 0) {
      setSaleError('Please fill in Arhtiya, Crop Name, Quantity, and Rate per Quintal.');
      return;
    }
    try {
      await recordCropSale.mutateAsync({
        partyId: salePartyId,
        cropName: cropName.trim(),
        inputUnit,
        inputQuantity: qty,
        ratePerQuintal: rate,
        transactionDate: new Date().toISOString().slice(0, 10),
        commissionPercent: Number(commissionPercent) || 0,
        otherCharges: Number(otherCharges) || 0,
        jFormNumber: jFormNumber.trim() || undefined,
        jFormDate: jFormDate || undefined,
        jFormPhotoUrl: jFormPhotoUrl.trim() || undefined,
        notes: saleNotes.trim() || undefined,
      });
      setShowCropSaleModal(false);
      setCropName('');
      setInputQuantity('');
      setRatePerQuintal('');
      setJFormNumber('');
      setJFormPhotoUrl('');
    } catch (err: any) {
      setSaleError(err?.response?.data?.message || 'Could not record crop sale.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary, flex: 1 }]}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setShowAddModal(true);
          }}
        >
          <Ionicons name="person-add" size={15} color="#ffffff" />
          <Text style={styles.actionBtnText}>Add Arhtiya</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#d97706', flex: 1 }]}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            if (arhtiyas.length > 0) setTargetPartyId(arhtiyas[0].id);
            setShowAdvanceModal(true);
          }}
        >
          <Ionicons name="cash" size={15} color="#ffffff" />
          <Text style={styles.actionBtnText}>Record Advance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#15803d', flex: 1 }]}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            if (arhtiyas.length > 0) setSalePartyId(arhtiyas[0].id);
            setShowCropSaleModal(true);
          }}
        >
          <Ionicons name="cart" size={15} color="#ffffff" />
          <Text style={styles.actionBtnText}>Record Crop Sale</Text>
        </TouchableOpacity>
      </View>

      {/* Arhtiya List */}
      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
      ) : arhtiyas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="storefront-outline" size={32} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No Arhtiyas Added Yet</Text>
          <Text style={styles.emptySub}>Add your Mandi Arhtiya / Commission Agent to track advances, mandi sales & net settlement.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {arhtiyas.map((item: UnifiedParty) => (
            <TouchableOpacity

              key={item.id}
              style={[styles.arhtiyaCard, premiumShadow('#0f172a', 'sm')]}
              activeOpacity={0.88}
              onPress={() => {
                tap();
                setHisabPartyId(item.id);
              }}
            >
              <View style={styles.arhtiyaHeader}>
                <View>
                  <Text style={styles.arhtiyaName}>{item.name}</Text>
                  {item.mandiName ? (
                    <Text style={styles.arhtiyaMandi}>
                      📍 {item.mandiName} {item.shopNumber ? `(Shop #${item.shopNumber})` : ''}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.kingIdBadge}>
                  <Text style={styles.kingIdText}>{item.kingId}</Text>
                </View>
              </View>

              <View style={styles.arhtiyaFooter}>
                <Text style={styles.arhtiyaMobile}>{item.mobile ? `📞 ${item.mobile}` : 'No phone'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.viewHisabText}>View Hisab-Kitab</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ─── ADD ARHTIYA MODAL ───────────────────────────────────────────── */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Arhtiya (Commission Agent)</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.fieldLabel}>Arhtiya / Shop Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. M/s Sharma & Sons" value={name} onChangeText={setName} />

              <Text style={styles.fieldLabel}>Mandi Market Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Khanna Grain Market" value={mandiName} onChangeText={setMandiName} />

              <Text style={styles.fieldLabel}>Shop / Phad Number</Text>
              <TextInput style={styles.input} placeholder="e.g. Shop No. 42" value={shopNumber} onChangeText={setShopNumber} />

              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <TextInput style={styles.input} placeholder="e.g. 9876543210" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />

              {addError ? <Text style={styles.errorText}>{addError}</Text> : null}

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddArhtiya}>
                <Text style={styles.submitBtnText}>Save Arhtiya</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── ADVANCE MODAL WITH AUTO-INTEREST ────────────────────────────── */}
      <Modal visible={showAdvanceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Advance</Text>
              <TouchableOpacity onPress={() => setShowAdvanceModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.fieldLabel}>Select Arhtiya *</Text>
              <View style={styles.chipRow}>
                {arhtiyas.map((a: UnifiedParty) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.chip, targetPartyId === a.id && styles.chipActive]}
                    onPress={() => setTargetPartyId(a.id)}
                  >
                    <Text style={[styles.chipText, targetPartyId === a.id && styles.chipTextActive]}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>


              <Text style={styles.fieldLabel}>Advance Amount (₹) *</Text>
              <TextInput style={styles.input} placeholder="e.g. 50000" keyboardType="numeric" value={advanceAmount} onChangeText={setAdvanceAmount} />

              <Text style={styles.fieldLabel}>Monthly Interest Rate (%)</Text>
              <TextInput style={styles.input} placeholder="1.5 (for ₹1.50 per ₹100/month)" keyboardType="numeric" value={interestRate} onChangeText={setInterestRate} />

              <View style={styles.infoBox}>
                <Ionicons name="calculator-outline" size={16} color="#b45309" />
                <Text style={styles.infoText}>
                  Interest will be auto-calculated dynamically at {interestRate}% per month up to settlement date!
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Notes / Reason</Text>
              <TextInput style={styles.input} placeholder="e.g. Seed & Sowing advance" value={advanceNotes} onChangeText={setAdvanceNotes} />

              {advanceError ? <Text style={styles.errorText}>{advanceError}</Text> : null}

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#d97706' }]} onPress={handleRecordAdvance}>
                <Text style={styles.submitBtnText}>Save Advance Loan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── CROP SALE MODAL WITH MANDI UNIT & J-FORM ─────────────────────── */}
      <Modal visible={showCropSaleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Mandi Crop Sale</Text>
              <TouchableOpacity onPress={() => setShowCropSaleModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.fieldLabel}>Select Arhtiya *</Text>
              <View style={styles.chipRow}>
                {arhtiyas.map((a: UnifiedParty) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.chip, salePartyId === a.id && styles.chipActive]}
                    onPress={() => setSalePartyId(a.id)}
                  >
                    <Text style={[styles.chipText, salePartyId === a.id && styles.chipTextActive]}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>


              <Text style={styles.fieldLabel}>Crop Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Wheat / Paddy" value={cropName} onChangeText={setCropName} />

              <Text style={styles.fieldLabel}>Unit Selection *</Text>
              <View style={styles.chipRow}>
                {(['QUINTAL', 'BAG_50KG', 'BAG_35KG', 'MANN'] as MandiUnit[]).map((u) => {
                  const labels: Record<MandiUnit, string> = {
                    QUINTAL: 'Quintal',
                    BAG_50KG: 'Bori 50kg',
                    BAG_35KG: 'Bori 35kg',
                    MANN: 'Mann 40kg',
                    KG: 'KG',
                  };
                  return (
                    <TouchableOpacity
                      key={u}
                      style={[styles.chip, inputUnit === u && styles.chipActive]}
                      onPress={() => setInputUnit(u)}
                    >
                      <Text style={[styles.chipText, inputUnit === u && styles.chipTextActive]}>{labels[u]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Quantity ({inputUnit}) *</Text>
                  <TextInput style={styles.input} placeholder="100" keyboardType="numeric" value={inputQuantity} onChangeText={setInputQuantity} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Rate / Quintal (₹) *</Text>
                  <TextInput style={styles.input} placeholder="2275" keyboardType="numeric" value={ratePerQuintal} onChangeText={setRatePerQuintal} />
                </View>
              </View>

              {inputQuantity ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Converted = {computeQuintals(Number(inputQuantity), inputUnit)} Quintals. Gross = ₹
                    {(computeQuintals(Number(inputQuantity), inputUnit) * (Number(ratePerQuintal) || 0)).toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Commission (%)</Text>
                  <TextInput style={styles.input} placeholder="2.5" keyboardType="numeric" value={commissionPercent} onChangeText={setCommissionPercent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Other Charges (₹)</Text>
                  <TextInput style={styles.input} placeholder="1500" keyboardType="numeric" value={otherCharges} onChangeText={setOtherCharges} />
                </View>
              </View>

              {/* Digital J-Form Record */}
              <View style={styles.jFormCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="document-text" size={16} color="#15803d" />
                  <Text style={styles.jFormTitle}>Digital J-Form Record</Text>
                </View>
                <TextInput style={styles.input} placeholder="J-Form Number (e.g. JF-98421)" value={jFormNumber} onChangeText={setJFormNumber} />
                <TextInput style={styles.input} placeholder="J-Form Document / Photo URL" value={jFormPhotoUrl} onChangeText={setJFormPhotoUrl} />
              </View>

              {saleError ? <Text style={styles.errorText}>{saleError}</Text> : null}

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#15803d' }]} onPress={handleRecordCropSale}>
                <Text style={styles.submitBtnText}>Save Crop Sale & J-Form</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── HISAB-KITAB STATEMENT MODAL ─────────────────────────────────── */}
      <Modal visible={!!hisabPartyId} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Arhtiya Hisab-Kitab</Text>
              <TouchableOpacity onPress={() => setHisabPartyId(null)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {isLoadingHisab || !hisabData ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView contentContainerStyle={{ gap: 12 }}>
                {/* Net Settlement Banner */}
                <View
                  style={[
                    styles.settlementCard,
                    { backgroundColor: hisabData.netBalance >= 0 ? '#f0fdf4' : '#fffbeb', borderColor: hisabData.netBalance >= 0 ? '#bbf7d0' : '#fde68a' },
                  ]}
                >
                  <Text style={styles.settlementLabel}>
                    {hisabData.netBalance >= 0 ? 'Receivable From Arhtiya' : 'Owed to Arhtiya'}
                  </Text>
                  <Text style={[styles.settlementValue, { color: hisabData.netBalance >= 0 ? '#15803d' : '#b45309' }]}>
                    ₹{Math.abs(hisabData.netBalance).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Breakdown Summary */}
                <View style={styles.breakdownGrid}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Advance Loans</Text>
                    <Text style={styles.breakdownValue}>₹{hisabData.totalAdvances.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Accrued Interest</Text>
                    <Text style={[styles.breakdownValue, { color: '#b45309' }]}>₹{hisabData.totalInterestAccrued.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Crop Sales Net</Text>
                    <Text style={[styles.breakdownValue, { color: '#15803d' }]}>₹{hisabData.totalCropSalesNet.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Transactions Timeline */}
                <Text style={styles.sectionHeader}>Transaction Ledger History</Text>
                {hisabData.transactions.map((tx: any) => (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txTitle}>
                        {tx.type === 'ADVANCE_TAKEN' ? `Advance Cash (${tx.interestRateMonthly}%/mo)` : `Crop Sale: ${tx.cropName} (${tx.quantityQuintals} Qtl)`}
                      </Text>
                      {tx.jFormNumber ? <Text style={styles.txSub}>📄 J-Form: {tx.jFormNumber}</Text> : null}
                      <Text style={styles.txDate}>{new Date(tx.transactionDate).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.txAmount, { color: tx.type === 'ADVANCE_TAKEN' ? '#b45309' : '#15803d' }]}>
                        {tx.type === 'ADVANCE_TAKEN' ? `-₹${Number(tx.amount).toLocaleString('en-IN')}` : `+₹${Number(tx.netAmount).toLocaleString('en-IN')}`}
                      </Text>
                      {tx.accruedInterest ? <Text style={styles.txInterest}>+₹{tx.accruedInterest} Interest ({tx.daysElapsed} days)</Text> : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: SPACING.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md },
  actionBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 },
  emptyCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  emptySub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' },
  arhtiyaCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  arhtiyaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  arhtiyaName: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  arhtiyaMandi: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  kingIdBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.pill },
  kingIdText: { fontSize: 11, fontFamily: FONT.extraBold, color: theme.primary },
  arhtiyaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  arhtiyaMobile: { fontSize: 12, fontFamily: FONT.medium, color: '#475569' },
  viewHisabText: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 480, maxHeight: '88%', backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, ...premiumShadow('#000000', 'lg') },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  fieldLabel: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569', marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  chipTextActive: { color: '#ffffff' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fffbeb', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fde68a' },
  infoText: { fontSize: 11, fontFamily: FONT.medium, color: '#b45309', flex: 1 },
  jFormCard: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bbf7d0', gap: 8, marginTop: 4 },
  jFormTitle: { fontSize: 12, fontFamily: FONT.extraBold, color: '#15803d' },
  submitBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },
  errorText: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 11.5 },
  settlementCard: { padding: 14, borderRadius: RADIUS.lg, borderWidth: 1.5, alignItems: 'center', gap: 4 },
  settlementLabel: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569' },
  settlementValue: { fontSize: 22, fontFamily: FONT.extraBold },
  breakdownGrid: { flexDirection: 'row', gap: 8 },
  breakdownItem: { flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' },
  breakdownLabel: { fontSize: 10, fontFamily: FONT.bold, color: '#64748b' },
  breakdownValue: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 2 },
  sectionHeader: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  txSub: { fontSize: 10.5, fontFamily: FONT.medium, color: '#15803d', marginTop: 1 },
  txDate: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  txAmount: { fontSize: 13, fontFamily: FONT.extraBold },
  txInterest: { fontSize: 9.5, fontFamily: FONT.bold, color: '#b45309', marginTop: 1 },
});
