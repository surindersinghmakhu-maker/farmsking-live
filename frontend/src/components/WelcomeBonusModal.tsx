import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { apiClient } from '../api/client';
import { useAuth } from '../store/auth-context';
import { useAppSettings } from '../hooks/useAppSettings';
import { BrandLogo } from './BrandLogo';
import * as AppStorage from '../lib/storage';

interface WelcomeBonusModalProps {
  visible: boolean;
  onClose: () => void;
}

export function WelcomeBonusModal({ visible, onClose }: WelcomeBonusModalProps) {
  const { user } = useAuth();
  const { data: appSettings } = useAppSettings();
  const queryClient = useQueryClient();
  const bonusAmount = Number((appSettings as any)?.newUserSignupBonusAmount ?? 10);
  const [isClaiming, setIsClaiming] = useState(false);

  // Pulsing animation for the gift badge
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.16, duration: 750, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.0, duration: 750, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible, scaleAnim]);

  const handleDismiss = async () => {
    if (user?.id) {
      await AppStorage.setItemAsync(`farmsking_welcome_popup_dismissed_${user.id}`, 'true');
    }
    onClose();
  };

  const handleClaimBonus = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsClaiming(true);
    try {
      await apiClient.post('/wallet/claim-welcome-bonus');
      queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
      Alert.alert(
        '🎉 Congratulations!',
        `₹${bonusAmount} Welcome Cash Bonus has been credited to your FarmsKing Wallet! 💶✨`
      );
    } catch {
      // fallback
    } finally {
      setIsClaiming(false);
      await handleDismiss();
    }
  };

  const userKingId = user?.kingId || user?.mobile?.slice(-6) || 'KING';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, premiumShadow('#0f172a', 'lg')]}>
          {/* Top Header Row */}
          <View style={styles.headerRow}>
            <BrandLogo size={30} useHdQuality />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.brandTitle}>FarmsKing Welcome Offer</Text>
              <Text style={styles.brandSubtitle}>King ID: {userKingId}</Text>
            </View>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* UNCLAIMED WELCOME BONUS CARD */}
          <View style={styles.unclaimedBox}>
            <LinearGradient colors={['#16a34a', '#15803d', '#0f766e']} style={styles.bannerGradient}>
              <Animated.View style={[styles.badgeCircle, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.badgeEmoji}>🎁</Text>
              </Animated.View>
              <Text style={styles.welcomeHeading}>Welcome Cash Reward! 🎉</Text>
              <Text style={styles.welcomeSub}>A free welcome cashback is waiting for you</Text>

              <View style={styles.bonusAmountWrap}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.bonusAmountText}>{bonusAmount}</Text>
              </View>
              <Text style={styles.bonusTagline}>Direct Wallet Cashback 💶</Text>
            </LinearGradient>

            <TouchableOpacity
              style={styles.claimBtnWrap}
              onPress={handleClaimBonus}
              disabled={isClaiming}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#eab308', '#ca8a04']} style={styles.claimBtn}>
                {isClaiming ? (
                  <ActivityIndicator color="#0f172a" size="small" />
                ) : (
                  <View style={styles.btnRow}>
                    <Ionicons name="sparkles" size={18} color="#0f172a" />
                    <Text style={styles.claimBtnText}>Claim ₹{bonusAmount} Welcome Bonus Now ✨</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Note: If skipped now, you can claim this bonus anytime from your Wallet page.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  brandTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  brandSubtitle: { fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' },
  closeBtn: { padding: 4 },
  unclaimedBox: { gap: 12, alignItems: 'center' },
  bannerGradient: {
    width: '100%',
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  badgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 2,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeEmoji: { fontSize: 26 },
  welcomeHeading: { fontSize: 19, fontFamily: FONT.extraBold, color: '#ffffff', textAlign: 'center' },
  welcomeSub: { fontSize: 12, fontFamily: FONT.medium, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', marginTop: 2 },
  bonusAmountWrap: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  currencySymbol: { fontSize: 24, fontFamily: FONT.extraBold, color: '#fef08a' },
  bonusAmountText: { fontSize: 44, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: -1 },
  bonusTagline: { fontSize: 11, fontFamily: FONT.bold, color: '#bbf7d0', marginTop: 2 },
  claimBtnWrap: { width: '100%', borderRadius: RADIUS.md, overflow: 'hidden' },
  claimBtn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  claimBtnText: { color: '#0f172a', fontSize: 14.5, fontFamily: FONT.extraBold },
  footerNote: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', marginTop: 2 },
});
