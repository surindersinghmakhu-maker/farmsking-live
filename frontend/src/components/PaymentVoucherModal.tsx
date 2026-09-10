import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PartyPicker } from '@/src/components/PartyPicker';
import { UniversalVoucherSlipModal, UniversalVoucherData } from '@/src/components/UniversalVoucherSlip';
import { useAuth } from '@/src/store/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { useRecordPaymentReceived, useRecordPaymentMade, useRecordSaleLedger, useCreateParty } from '@/src/hooks/useParties';
import { useCreateLabourPayment } from '@/src/hooks/useLabour';
import { Party } from '@/src/types/api';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { formatInr } from '@/src/utils/formatInr';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export type VoucherType = 'RECEIPT_IN' | 'PAYMENT_OUT' | 'ACCOUNT_TRANSFER' | 'DIRECT_INCOME' | 'DIRECT_EXPENSE';

interface PaymentVoucherModalProps {
  visible: boolean;
  initialType?: VoucherType;
  lockType?: boolean;
  initialParty?: Party | null;
  lockParty?: boolean;
  parties: Party[];
  labourWorkers: any[];
  onClose: () => void;
  onSuccess?: (voucherData: any) => void;
}

export function PaymentVoucherModal({
  visible,
  initialType = 'RECEIPT_IN',
  lockType = true,
  initialParty = null,
  lockParty = false,
  parties = [],
  labourWorkers = [],
  onClose,
  onSuccess,
}: PaymentVoucherModalProps) {
  const queryClient = useQueryClient();
  const [voucherType, setVoucherType] = useState<VoucherType>(initialType);

  // Selected Parties
  const [sourceParty, setSourceParty] = useState<Party | null>(initialParty);
  const [targetParty, setTargetParty] = useState<Party | null>(null);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [voucherDate, setVoucherDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Sync initialType and initialParty whenever modal opens
  React.useEffect(() => {
    if (visible) {
      setVoucherType(initialType);
      setSourceParty(initialParty || null);
      setTargetParty(null);
      setAmount('');
      setNote('');
      setPaymentMode('CASH');
      setVoucherDate(new Date().toISOString().slice(0, 10));
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [visible, initialType, initialParty]);

  const { user } = useAuth();
  const [showVoucherSlipModal, setShowVoucherSlipModal] = useState(false);
  const [activeVoucherData, setActiveVoucherData] = useState<UniversalVoucherData | null>(null);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Hooks
  const createParty = useCreateParty();
  const recordPaymentReceived = useRecordPaymentReceived();
  const recordPaymentMade = useRecordPaymentMade();
  const recordSaleLedger = useRecordSaleLedger();
  const createLabourPayment = useCreateLabourPayment();

  const isLabourWorker = useMemo(() => {
    if (!sourceParty) return false;
    if ((sourceParty as any).__type === 'LABOUR' || (sourceParty as any).isWorker) return true;
    if (sourceParty.address === 'Labour Worker' || sourceParty.address?.includes('Labour Worker')) return true;
    const cleanId = sourceParty.id.replace(/^labour_/, '');
    return (labourWorkers || []).some((w: any) => w.id === cleanId || w.id === sourceParty.id || `labour_${w.id}` === sourceParty.id);
  }, [labourWorkers, sourceParty]);

  const resetForm = () => {
    setAmount('');
    setNote('');
    setPaymentMode('CASH');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleVoucherTypeChange = (type: VoucherType) => {
    tap();
    setVoucherType(type);
    resetForm();
  };

  // Live balance calculations
  const sourceBalance = sourceParty?.balance || 0;
  const targetBalance = targetParty?.balance || 0;
  const numAmount = Number(amount) || 0;

  const calculatedSourceNet = useMemo(() => {
    if (voucherType === 'RECEIPT_IN') return sourceBalance - numAmount;
    if (voucherType === 'PAYMENT_OUT') return sourceBalance + numAmount;
    if (voucherType === 'ACCOUNT_TRANSFER') return sourceBalance - numAmount;
    if (voucherType === 'DIRECT_INCOME') return sourceBalance - numAmount;
    if (voucherType === 'DIRECT_EXPENSE') return sourceBalance + numAmount;
    return sourceBalance;
  }, [voucherType, sourceBalance, numAmount]);

  const calculatedTargetNet = useMemo(() => {
    if (voucherType === 'ACCOUNT_TRANSFER') return targetBalance + numAmount;
    return targetBalance;
  }, [voucherType, targetBalance, numAmount]);

  const handleSubmit = async () => {
    if (!sourceParty) {
      setErrorMsg('Please select a Party/Account first.');
      return;
    }

    if (numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (voucherType === 'ACCOUNT_TRANSFER' && !targetParty) {
      setErrorMsg('Please select the Target Party to transfer to.');
      return;
    }

    if (voucherType === 'ACCOUNT_TRANSFER' && sourceParty.id === targetParty?.id) {
      setErrorMsg('Source and Target party accounts cannot be the same.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const modeTag = paymentMode === 'UPI' ? ' (UPI / Online)' : ' (Cash)';
      const userMemo = note.trim();
      const baseReason = userMemo || (voucherType === 'RECEIPT_IN' ? 'Payment Received' : voucherType === 'PAYMENT_OUT' ? 'Payment Made' : 'Party Entry');
      const finalReason = `${baseReason}${modeTag}`;

      const cleanWorkerId = sourceParty.id.replace(/^labour_/, '');

      if (isLabourWorker && (voucherType === 'PAYMENT_OUT' || voucherType === 'RECEIPT_IN')) {
        const workerNotes = voucherType === 'RECEIPT_IN' ? `[Refund / Received] ${finalReason}` : finalReason;
        await createLabourPayment.mutateAsync({
          workerId: cleanWorkerId,
          amount: numAmount,
          paymentDate: voucherDate,
          paymentMode,
          notes: workerNotes,
        });
      } else if (voucherType === 'RECEIPT_IN') {
        try {
          await recordPaymentReceived.mutateAsync({
            id: sourceParty.id,
            payload: { amount: numAmount, reason: finalReason },
          });
        } catch (err: any) {
          const is404 = err?.response?.status === 404 || err?.response?.data?.message?.includes('Party not found') || err?.message?.includes('Party not found');
          if (is404) {
            await createLabourPayment.mutateAsync({
              workerId: cleanWorkerId,
              amount: numAmount,
              paymentDate: voucherDate,
              paymentMode,
              notes: `[Refund / Received] ${finalReason}`,
            });
          } else {
            throw err;
          }
        }
      } else if (voucherType === 'PAYMENT_OUT') {
        try {
          await recordPaymentMade.mutateAsync({
            id: sourceParty.id,
            payload: { amount: numAmount, reason: finalReason },
          });
        } catch (err: any) {
          const is404 = err?.response?.status === 404 || err?.response?.data?.message?.includes('Party not found') || err?.message?.includes('Party not found');
          if (is404) {
            await createLabourPayment.mutateAsync({
              workerId: cleanWorkerId,
              amount: numAmount,
              paymentDate: voucherDate,
              paymentMode,
              notes: finalReason,
            });
          } else {
            throw err;
          }
        }
      } else if (voucherType === 'ACCOUNT_TRANSFER' && targetParty) {
        // Double-entry transfer: deduct from Source, add to Target
        await recordPaymentReceived.mutateAsync({
          id: sourceParty.id,
          payload: { amount: numAmount, reason: `Account Transfer to ${targetParty.name}${modeTag}${userMemo ? ` (${userMemo})` : ''}` },
        });
        await recordPaymentMade.mutateAsync({
          id: targetParty.id,
          payload: { amount: numAmount, reason: `Account Transfer from ${sourceParty.name}${modeTag}${userMemo ? ` (${userMemo})` : ''}` },
        });
      } else if (voucherType === 'DIRECT_INCOME') {
        await recordSaleLedger.mutateAsync({
          id: sourceParty.id,
          payload: { totalAmount: numAmount, reason: `${userMemo || 'Party Direct Income Entry'}${modeTag}` },
        });
      } else if (voucherType === 'DIRECT_EXPENSE') {
        await recordSaleLedger.mutateAsync({
          id: sourceParty.id,
          payload: { totalAmount: -numAmount, reason: `${userMemo || 'Party Direct Expense Entry'}${modeTag}` },
        });
      }

      // Invalidate queries so that parties, labour workers & ledgers update instantly
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['labour-workers'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['arhtiya-hisab'] });

      const slipData: UniversalVoucherData = {
        voucherType: voucherType === 'RECEIPT_IN' ? 'PAYMENT_IN' : voucherType === 'PAYMENT_OUT' ? 'PAYMENT_OUT' : 'PARTY_STATEMENT',
        title: voucherType === 'RECEIPT_IN' ? '💰 PAYMENT RECEIPT' : voucherType === 'PAYMENT_OUT' ? '💸 PAYMENT OUT VOUCHER' : '🧾 ACCOUNT TRANSFER VOUCHER',
        voucherNo: `VCH-${Date.now().toString().slice(-6)}`,
        date: voucherDate,
        farmerName: user?.name || 'Farmer',
        farmerPhone: user?.mobile || '',
        farmerVillage: user?.village || '',
        partyName: sourceParty.name,
        partyPhone: sourceParty.mobile || undefined,
        amount: numAmount,
        paymentMode: paymentMode === 'UPI' ? '📱 UPI / Online' : '💵 CASH',
        description: finalReason,
        previousBalance: sourceBalance,
        newBalance: calculatedSourceNet,
      };

      setSuccessMsg('✅ Voucher posted successfully!');
      setActiveVoucherData(slipData);
      setShowVoucherSlipModal(true);
      onSuccess?.({
        voucherType,
        sourceParty,
        targetParty,
        amount: numAmount,
        note,
        date: voucherDate,
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to post voucher entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeaderInfo = () => {
    if (voucherType === 'RECEIPT_IN') {
      return {
        title: '💰 Payment In (Receipt Voucher)',
        subtitle: 'Record payment received from party, trader or worker',
        badgeLabel: 'Payment In (Receipt)',
        badgeColor: '#16a34a',
        badgeIcon: 'arrow-down-circle' as const,
      };
    }
    if (voucherType === 'PAYMENT_OUT') {
      return {
        title: '💸 Payment Out (Payment Voucher)',
        subtitle: 'Record payment made to party, trader or worker',
        badgeLabel: 'Payment Out (Payment)',
        badgeColor: '#dc2626',
        badgeIcon: 'arrow-up-circle' as const,
      };
    }
    return {
      title: '🧾 Voucher & General Journal (JV)',
      subtitle: 'Record payments, transfers & direct party entries',
      badgeLabel: 'General Voucher',
      badgeColor: '#2563eb',
      badgeIcon: 'receipt-outline' as const,
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.title}>{headerInfo.title}</Text>
              <Text style={styles.subtitle}>{headerInfo.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Full Tab Scroll (Only shown if unlocked) */}
          {!lockType && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
              <TouchableOpacity
                style={[styles.tabChip, voucherType === 'RECEIPT_IN' && styles.tabReceiptActive]}
                onPress={() => handleVoucherTypeChange('RECEIPT_IN')}
              >
                <Ionicons name="arrow-down-circle" size={14} color={voucherType === 'RECEIPT_IN' ? '#fff' : '#16a34a'} />
                <Text style={[styles.tabText, voucherType === 'RECEIPT_IN' && styles.tabTextActive]}>Payment In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabChip, voucherType === 'PAYMENT_OUT' && styles.tabPaymentActive]}
                onPress={() => handleVoucherTypeChange('PAYMENT_OUT')}
              >
                <Ionicons name="arrow-up-circle" size={14} color={voucherType === 'PAYMENT_OUT' ? '#fff' : '#dc2626'} />
                <Text style={[styles.tabText, voucherType === 'PAYMENT_OUT' && styles.tabTextActive]}>Payment Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabChip, voucherType === 'ACCOUNT_TRANSFER' && styles.tabTransferActive]}
                onPress={() => handleVoucherTypeChange('ACCOUNT_TRANSFER')}
              >
                <Ionicons name="swap-horizontal" size={14} color={voucherType === 'ACCOUNT_TRANSFER' ? '#fff' : '#2563eb'} />
                <Text style={[styles.tabText, voucherType === 'ACCOUNT_TRANSFER' && styles.tabTextActive]}>Account Transfer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabChip, voucherType === 'DIRECT_INCOME' && styles.tabIncomeActive]}
                onPress={() => handleVoucherTypeChange('DIRECT_INCOME')}
              >
                <Ionicons name="trending-up" size={14} color={voucherType === 'DIRECT_INCOME' ? '#fff' : '#059669'} />
                <Text style={[styles.tabText, voucherType === 'DIRECT_INCOME' && styles.tabTextActive]}>Party Income</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabChip, voucherType === 'DIRECT_EXPENSE' && styles.tabExpenseActive]}
                onPress={() => handleVoucherTypeChange('DIRECT_EXPENSE')}
              >
                <Ionicons name="trending-down" size={14} color={voucherType === 'DIRECT_EXPENSE' ? '#fff' : '#c2410c'} />
                <Text style={[styles.tabText, voucherType === 'DIRECT_EXPENSE' && styles.tabTextActive]}>Party Expense</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {/* Source Party Picker / Locked Read-Only Party Box */}
            {lockParty && sourceParty ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Party / Account Name *</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 12,
                    height: 40,
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="person-circle" size={20} color="#16a34a" />
                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>
                      {sourceParty.name}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#e2e8f0',
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      borderRadius: RADIUS.sm,
                    }}
                  >
                    <Ionicons name="lock-closed" size={12} color="#64748b" />
                    <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b' }}>Read Only</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <PartyPicker
                  label={
                    voucherType === 'ACCOUNT_TRANSFER'
                      ? 'From Account / Debited Party *'
                      : 'Party / Account Name *'
                  }
                  parties={parties}
                  labourWorkers={labourWorkers}
                  selectedParty={sourceParty}
                  onSelect={setSourceParty}
                  onCreate={async (p) => {
                    const newParty = await createParty.mutateAsync(p);
                    return newParty;
                  }}
                  accentColor="#2563eb"
                />
              </View>
            )}

            {/* Target Party Picker (Only for Account Transfer) */}
            {voucherType === 'ACCOUNT_TRANSFER' && (
              <View style={{ marginTop: 12 }}>
                <PartyPicker
                  label="To Account / Credited Party *"
                  parties={parties.filter((p) => p.id !== sourceParty?.id)}
                  labourWorkers={labourWorkers}
                  selectedParty={targetParty}
                  onSelect={setTargetParty}
                  onCreate={async (p) => {
                  const newParty = await createParty.mutateAsync(p);
                  return newParty;
                }}
                  accentColor="#16a34a"
                />
              </View>
            )}

            {/* Live Balance Summary */}
            {sourceParty && (
              <View style={styles.balanceBox}>
                <Text style={styles.balanceText}>
                  {sourceParty.name} Current Balance:{' '}
                  <Text style={{ fontFamily: FONT.bold }}>
                    {sourceBalance > 0
                      ? `${formatInr(sourceBalance)} (Receivable)`
                      : sourceBalance < 0
                        ? `${formatInr(Math.abs(sourceBalance))} (Payable)`
                        : '₹0 (Settled)'}
                  </Text>
                </Text>
                <Text style={[styles.balanceText, { marginTop: 4 }]}>
                  ➔ New Balance:{' '}
                  <Text style={{ fontFamily: FONT.extraBold, color: calculatedSourceNet >= 0 ? '#16a34a' : '#dc2626' }}>
                    {calculatedSourceNet > 0
                      ? `${formatInr(calculatedSourceNet)} (Receivable)`
                      : calculatedSourceNet < 0
                        ? `${formatInr(Math.abs(calculatedSourceNet))} (Payable)`
                        : '₹0 (Settled)'}
                  </Text>
                </Text>
                {voucherType === 'ACCOUNT_TRANSFER' && targetParty && (
                  <Text style={[styles.balanceText, { marginTop: 4 }]}>
                    {targetParty.name} Current Balance:{' '}
                    <Text style={{ fontFamily: FONT.bold }}>
                      {targetBalance > 0
                        ? `${formatInr(targetBalance)} (Receivable)`
                        : targetBalance < 0
                          ? `${formatInr(Math.abs(targetBalance))} (Payable)`
                          : '₹0 (Settled)'}
                    </Text>
                    {' ➔ '}New Balance:{' '}
                    <Text style={{ fontFamily: FONT.extraBold, color: calculatedTargetNet >= 0 ? '#16a34a' : '#dc2626' }}>
                      {calculatedTargetNet > 0
                        ? `${formatInr(calculatedTargetNet)} (Receivable)`
                        : calculatedTargetNet < 0
                          ? `${formatInr(Math.abs(calculatedTargetNet))} (Payable)`
                          : '₹0 (Settled)'}
                    </Text>
                  </Text>
                )}
              </View>
            )}

            {/* Amount Field & Inline Radio Buttons */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>
                {voucherType === 'PAYMENT_OUT' ? 'Paid Amount (₹) *' : 'Received Amount (₹) *'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Compact Text Input Box */}
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="e.g. 5000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                {/* Inline Radio Buttons in front of input box */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.modePill,
                      paymentMode === 'CASH' && styles.modePillCashActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setPaymentMode('CASH');
                    }}
                  >
                    <Ionicons
                      name={paymentMode === 'CASH' ? 'radio-button-on' : 'radio-button-off'}
                      size={14}
                      color={paymentMode === 'CASH' ? '#ffffff' : '#16a34a'}
                    />
                    <Text style={[styles.modePillText, paymentMode === 'CASH' && styles.modePillTextActive]}>Cash</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modePill,
                      paymentMode === 'UPI' && styles.modePillUpiActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setPaymentMode('UPI');
                    }}
                  >
                    <Ionicons
                      name={paymentMode === 'UPI' ? 'radio-button-on' : 'radio-button-off'}
                      size={14}
                      color={paymentMode === 'UPI' ? '#ffffff' : '#2563eb'}
                    />
                    <Text style={[styles.modePillText, paymentMode === 'UPI' && styles.modePillTextActive]}>UPI/Online</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Note / Description */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Land Rent, Advance, Bill payment..."
                placeholderTextColor="#94a3b8"
                value={note}
                onChangeText={setNote}
              />
            </View>
          </ScrollView>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: voucherType === 'PAYMENT_OUT' ? '#dc2626' : '#16a34a' },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {voucherType === 'RECEIPT_IN'
                    ? 'Save Payment Received'
                    : voucherType === 'PAYMENT_OUT'
                      ? 'Save Payment Made'
                      : 'Post Voucher Entry'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <UniversalVoucherSlipModal
        visible={showVoucherSlipModal}
        data={activeVoucherData}
        onClose={() => {
          setShowVoucherSlipModal(false);
          onClose();
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  closeBtn: {
    padding: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f1f5f9',
  },
  title: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  subtitle: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  tabScroll: { flexDirection: 'row', gap: 6, marginVertical: 10, flexGrow: 0 },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tabText: { fontSize: 11, fontFamily: FONT.bold, color: '#475569' },
  tabTextActive: { color: '#ffffff' },
  tabReceiptActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  tabPaymentActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  tabTransferActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  tabIncomeActive: { backgroundColor: '#059669', borderColor: '#059669' },
  tabExpenseActive: { backgroundColor: '#c2410c', borderColor: '#c2410c' },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  modePillCashActive: {
    backgroundColor: '#16a34a',
    borderColor: '#15803d',
  },
  modePillUpiActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  modePillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  modePillTextActive: {
    color: '#ffffff',
  },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    fontFamily: FONT.medium,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  balanceBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 8,
    marginTop: 10,
  },
  balanceText: { fontSize: 11, fontFamily: FONT.medium, color: '#166534' },
  errorText: { color: '#dc2626', fontSize: 11.5, fontFamily: FONT.bold, marginTop: 8 },
  successText: { color: '#16a34a', fontSize: 12, fontFamily: FONT.bold, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md },
  cancelBtnText: { color: '#475569', fontFamily: FONT.bold, fontSize: 13 },
  saveBtn: { flex: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', borderRadius: RADIUS.md },
  saveBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
});
