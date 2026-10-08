import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Image, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useCart } from '@/src/store/cart-context';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const UltraPremiumEcomHub: React.FC = () => {
  const { totalAmount, wholesaleSavings } = useCart();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showReelModal, setShowReelModal] = useState(false);
  const [showGroupBuyModal, setShowGroupBuyModal] = useState(false);
  const [priceAlertSet, setPriceAlertSet] = useState(false);
  const [userCoins, setUserCoins] = useState(350); // 350 Coins = ₹350 Value

  return (
    <View style={styles.container}>
      {/* 🏆 1. KISAN LOYALTY COINS BANNER */}
      <View style={styles.coinsCard}>
        <View style={styles.coinsLeft}>
          <View style={styles.coinIconBg}>
            <Ionicons name="ribbon" size={20} color="#f59e0b" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.coinsTitle}>FarmsKing Kisan Rewards</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>VIP GOLD</Text>
              </View>
            </View>
            <Text style={styles.coinsSubtitle}>
              Earn 10 Coins / ₹100 • Redeem for instant Cash Discounts
            </Text>
          </View>
        </View>
        <View style={styles.coinsRight}>
          <Text style={styles.coinsValue}>🪙 {userCoins}</Text>
          <Text style={styles.coinsWorth}>₹{userCoins} Discount</Text>
        </View>
      </View>

      {/* 🎬 2. REEL / SHORT VIDEO DEMO & AI CROP RECOMMENDATION ROW */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowGrid}>
        {/* Short Video Demo Card */}
        <TouchableOpacity
          style={styles.featureCardVideo}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setShowReelModal(true);
          }}
        >
          <View style={styles.videoBadge}>
            <Ionicons name="play-circle" size={14} color="#ffffff" />
            <Text style={styles.videoBadgeText}>15s DEMO REEL</Text>
          </View>
          <Text style={styles.cardTitleLight}>🎬 Live Product Demo Video</Text>
          <Text style={styles.cardSubLight}>See real spray results on Wheat crops in Bathinda</Text>
        </TouchableOpacity>

        {/* AI Crop Recommendation Card */}
        <View style={styles.featureCardAi}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={13} color="#00ff87" />
            <Text style={styles.aiBadgeText}>AI CROP DOCTOR MATCH</Text>
          </View>
          <Text style={styles.cardTitleLight}>🌾 Wheat Crop (Day 45)</Text>
          <Text style={styles.cardSubLight}>Optimal Fertilizer & PGR Spray recommended for current growth stage</Text>
        </View>
      </ScrollView>

      {/* 👥 3. VILLAGE GROUP BUYING CLUB & 🛡️ GENUINE QR VERIFICATION */}
      <View style={styles.twoColGrid}>
        <TouchableOpacity
          style={styles.halfCardGroup}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setShowGroupBuyModal(true);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="people" size={18} color="#0284c7" />
            <Text style={styles.halfTitle}>👥 Village Group Buy</Text>
          </View>
          <Text style={styles.halfSub}>Combine order with 3 village farmers to get extra 10% OFF & free tractor transport!</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.halfCardQr}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setShowQrModal(true);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="qr-code" size={18} color="#059669" />
            <Text style={styles.halfTitle}>🛡️ Genuine Product QR</Text>
          </View>
          <Text style={styles.halfSub}>Scan product box QR code in-app for 100% Genuine Brand Certificate.</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 4. PRICE HISTORY & PRICE DROP ALERT */}
      <View style={styles.priceTrendCard}>
        <View style={styles.priceTrendLeft}>
          <Ionicons name="trending-down" size={20} color="#00ff87" />
          <View>
            <Text style={styles.priceTrendTitle}>Price Dropped by ₹50 Today!</Text>
            <Text style={styles.priceTrendSub}>30-Day Lowest Price Trend Guaranteed</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.alertBtn, priceAlertSet && styles.alertBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setPriceAlertSet(!priceAlertSet);
          }}
        >
          <Ionicons name={priceAlertSet ? 'notifications' : 'notifications-outline'} size={14} color={priceAlertSet ? '#020d06' : '#00ff87'} />
          <Text style={[styles.alertBtnText, priceAlertSet && styles.alertBtnTextActive]}>
            {priceAlertSet ? 'Alert Active' : 'Set Price Alert'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🎬 MODAL 1: REEL VIDEO DEMO */}
      <Modal visible={showReelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="play-circle" size={20} color="#00ff87" />
                <Text style={styles.modalTitle}>Live Spray Demo Video</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReelModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.videoPlayerBox}>
              <Ionicons name="play" size={48} color="#00ff87" />
              <Text style={{ color: '#ffffff', fontFamily: FONT.bold, marginTop: 10 }}>Playing 15-Second Spray Demo Reel</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11, fontFamily: FONT.medium, marginTop: 4 }}>
                Tested on Wheat Crop in Bathinda Mandi • 100% Proven Result
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalBuyBtn}
              onPress={() => {
                setShowReelModal(false);
                Alert.alert('Item Added!', 'Demo item added to your cart with 1-Click Express Checkout.');
              }}
            >
              <Ionicons name="flash" size={16} color="#020d06" />
              <Text style={styles.modalBuyText}>1-Click Express Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🛡️ MODAL 2: GENUINE QR VERIFICATION */}
      <Modal visible={showQrModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛡️ Genuine Certified Product</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', paddingVertical: 16, gap: 10 }}>
              <View style={styles.qrWrapper}>
                <Ionicons name="qr-code-outline" size={100} color="#00ff87" />
              </View>
              <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#00ff87', textAlign: 'center' }}>
                CERTIFICATE #FK-GENUINE-9821
              </Text>
              <Text style={{ fontSize: 11.5, color: '#cbd5e1', textAlign: 'center', fontFamily: FONT.medium }}>
                Scan this QR code printed on your product box to verify batch expiry, manufacturer GSTIN, and lab test certificate.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* 👥 MODAL 3: VILLAGE GROUP BUYING CLUB */}
      <Modal visible={showGroupBuyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Village Group Buying Club</Text>
              <TouchableOpacity onPress={() => setShowGroupBuyModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, paddingVertical: 10 }}>
              <View style={styles.groupMemberRow}>
                <Ionicons name="checkmark-circle" size={18} color="#00ff87" />
                <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12.5 }}>Farmer 1: Balwinder Singh (Bathinda)</Text>
              </View>
              <View style={styles.groupMemberRow}>
                <Ionicons name="checkmark-circle" size={18} color="#00ff87" />
                <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12.5 }}>Farmer 2: Gurpreet Singh (Bathinda)</Text>
              </View>
              <View style={styles.groupMemberRow}>
                <Ionicons name="add-circle-outline" size={18} color="#38bdf8" />
                <Text style={{ color: '#38bdf8', fontFamily: FONT.bold, fontSize: 12.5 }}>Farmer 3: Waiting for 1 more village farmer...</Text>
              </View>

              <TouchableOpacity
                style={styles.modalBuyBtn}
                onPress={() => {
                  setShowGroupBuyModal(false);
                  Alert.alert('Group Joined!', 'You joined the Village Group Buy. Extra 10% discount unlocked!');
                }}
              >
                <Text style={styles.modalBuyText}>Join Village Group Buy & Save 10%</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12, marginVertical: 10 },
  coinsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  coinsLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  coinIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' },
  badgePill: { backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  badgePillText: { fontSize: 9, fontFamily: FONT.extraBold, color: '#000000' },
  coinsSubtitle: { fontSize: 10.5, color: '#94a3b8', fontFamily: FONT.medium, marginTop: 2 },
  coinsRight: { alignItems: 'flex-end' },
  coinsValue: { fontSize: 15, fontFamily: FONT.extraBold, color: '#f59e0b' },
  coinsWorth: { fontSize: 10, color: '#00ff87', fontFamily: FONT.bold },
  rowGrid: { gap: 10 },
  featureCardVideo: {
    width: 220,
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 6,
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dc2626',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  videoBadgeText: { color: '#ffffff', fontSize: 9.5, fontFamily: FONT.extraBold },
  cardTitleLight: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' },
  cardSubLight: { fontSize: 10.5, color: '#94a3b8', fontFamily: FONT.medium, lineHeight: 14 },
  featureCardAi: {
    width: 220,
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  aiBadgeText: { color: '#38bdf8', fontSize: 9.5, fontFamily: FONT.extraBold },
  twoColGrid: { flexDirection: 'row', gap: 10 },
  halfCardGroup: {
    flex: 1,
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 4,
  },
  halfCardQr: {
    flex: 1,
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 4,
  },
  halfTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },
  halfSub: { fontSize: 10, color: '#94a3b8', fontFamily: FONT.medium, lineHeight: 13 },
  priceTrendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  priceTrendLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  priceTrendTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#00ff87' },
  priceTrendSub: { fontSize: 10, color: '#64748b', fontFamily: FONT.medium },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#00ff87',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  alertBtnActive: { backgroundColor: '#00ff87' },
  alertBtnText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#00ff87' },
  alertBtnTextActive: { color: '#020d06' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 13, 6, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#ffffff' },
  videoPlayerBox: {
    height: 180,
    backgroundColor: '#020d06',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
  },
  modalBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00ff87',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  modalBuyText: { color: '#020d06', fontSize: 13.5, fontFamily: FONT.extraBold },
  qrWrapper: {
    width: 140,
    height: 140,
    backgroundColor: '#020d06',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  groupMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#020d06',
    padding: 10,
    borderRadius: RADIUS.md,
  },
});
