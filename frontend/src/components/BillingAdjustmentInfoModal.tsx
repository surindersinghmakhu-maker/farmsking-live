import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface BillingAdjustmentInfoModalProps {
  visible: boolean;
  balance: number;
  onClose: () => void;
}

export function BillingAdjustmentInfoModal({
  visible,
  balance,
  onClose,
}: BillingAdjustmentInfoModalProps) {
  const router = useRouter();

  const handleGoToShop = () => {
    onClose();
    try {
      router.push('/shop' as any);
    } catch {
      // fallback
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.titleContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="receipt-outline" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Billing Wallet Adjustment</Text>
                <Text style={styles.modalSubTitle}>Client Account Policy</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Current Balance Card */}
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#0369a1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Available Billing Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.balanceValue}>{balance.toLocaleString('en-IN')}</Text>
            </View>
            <Text style={styles.balanceHint}>Ready to be adjusted against your next order</Text>
          </LinearGradient>

          {/* Information Points */}
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconBg, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="cart-outline" size={18} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Use for Orders & Services</Text>
                <Text style={styles.infoDesc}>
                  Apply your wallet balance at checkout for genuine seeds, fertilizers, farm tools, AI crop doctor plans, and soil tests.
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIconBg, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkbox-outline" size={18} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Automatic Bill Deduction</Text>
                <Text style={styles.infoDesc}>
                  On the order checkout screen, check &quot;Use Wallet Balance&quot; to instantly deduct your wallet funds from the total payable amount.
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIconBg, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Strict Non-Cash Benefit</Text>
                <Text style={styles.infoDesc}>
                  Client wallet balances cannot be withdrawn in cash or transferred to bank accounts. Only partners, admins, and company employees can request direct cash payouts.
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.shopBtn} activeOpacity={0.85} onPress={handleGoToShop}>
              <LinearGradient colors={['#16a34a', '#15803d', '#14532d']} style={styles.shopBtnGradient}>
                <Ionicons name="bag-handle-outline" size={16} color="#ffffff" />
                <Text style={styles.shopBtnText}>Shop Now &amp; Use Balance</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeActionBtn} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.closeActionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 20,
    gap: 16,
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  modalSubTitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    padding: 2,
  },
  balanceCard: {
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  balanceLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 4,
  },
  currencySymbol: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
  },
  balanceValue: {
    fontSize: 32,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  balanceHint: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginTop: 4,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  infoTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  infoDesc: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  shopBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    minHeight: 44,
  },
  shopBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  shopBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  closeActionBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    minHeight: 44,
  },
  closeActionText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#475569',
  },
});
