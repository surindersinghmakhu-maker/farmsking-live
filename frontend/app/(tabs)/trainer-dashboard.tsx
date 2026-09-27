import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { AssignedFarmerLog, getMyAssignedFarmers } from '@/src/api/trainers.api';
import { getMyWallet } from '@/src/api/wallet.api';

export default function TechnicalTrainerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<AssignedFarmerLog[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDashboardData = async () => {
    try {
      const [assignedLogs, walletData] = await Promise.all([
        getMyAssignedFarmers(),
        getMyWallet(),
      ]);
      setFarmers(assignedLogs || []);
      setWalletBalance(walletData?.balance || 0);
    } catch {
      // Best effort
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const handleCallFarmer = (mobile: string) => {
    if (mobile) {
      Linking.openURL(`tel:${mobile}`);
    }
  };

  const handleWhatsAppFarmer = (mobile: string, name: string) => {
    const cleanNum = mobile ? mobile.replace(/\D/g, '').slice(-10) : '';
    if (cleanNum) {
      const text = encodeURIComponent(
        `🌾 *FarmsKing App Welcome & Training Support* 🙏\n\nHello *${name || 'Farmer'}* ji,\nMain FarmsKing App valo Technical Trainer bol reha haan. Tuhadi app setup ya UPI QR code vich madad lyi call kr reha haan. 🌾🚜`
      );
      Linking.openURL(`https://wa.me/91${cleanNum}?text=${text}`);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#15803d', '#16a34a', '#059669']} style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🎓 Technical Trainer Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            State/District Farmer Welcome Calls & Training
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.walletBadge}
          onPress={() => router.push('/(tabs)/wallet')}
        >
          <Ionicons name="wallet-outline" size={16} color="#15803d" />
          <Text style={styles.walletBadgeText}>₹{walletBalance}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboardData();
            }}
          />
        }
      >
        {/* Wallet Balance Card */}
        <View style={[styles.walletCard, premiumShadow('#15803d', 'sm')]}>
          <View style={styles.walletCardHeader}>
            <View style={styles.walletIconBg}>
              <Ionicons name="cash" size={22} color="#15803d" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.walletTitle}>Technical Trainer Rewards Wallet</Text>
              <Text style={styles.walletBalanceText}>₹{walletBalance.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => router.push('/(tabs)/wallet')}
            >
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.walletSubInfo}>
            💡 Reward Rules: 5-Star Rating = ₹25 Wallet Credit | 4-Star Rating = ₹15 Wallet Credit
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={18} color="#0f172a" />
          <Text style={styles.sectionTitle}>
            Assigned Farmers List ({farmers.length})
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#16a34a" size="large" style={{ marginTop: 20 }} />
        ) : farmers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={42} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Pending Welcome Calls</Text>
            <Text style={styles.emptySub}>
              Newly registered farmers in your state/district will appear here automatically.
            </Text>
          </View>
        ) : (
          farmers.map((log) => {
            const isVerified = log.status === 'VERIFIED_AND_PAID';
            return (
              <View key={log.id} style={[styles.farmerCard, premiumShadow('#0f172a', 'sm')]}>
                <View style={styles.farmerCardHeader}>
                  <View style={styles.farmerAvatarBg}>
                    <Ionicons name="person" size={20} color="#15803d" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.farmerName}>{log.farmer.name || 'Farmer'}</Text>
                    <Text style={styles.farmerMeta}>
                      📱 {log.farmer.mobile} • {log.farmer.district || log.state || 'Punjab'}
                    </Text>
                    <Text style={styles.farmerDate}>
                      Registered: {new Date(log.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, isVerified ? styles.statusBadgeVerified : styles.statusBadgePending]}>
                    <Ionicons
                      name={isVerified ? 'checkmark-circle' : 'time'}
                      size={13}
                      color={isVerified ? '#16a34a' : '#d97706'}
                    />
                    <Text style={[styles.statusBadgeText, isVerified ? styles.statusBadgeTextVerified : styles.statusBadgeTextPending]}>
                      {isVerified ? `Verified (+₹${log.payoutAmount})` : 'Pending Rating'}
                    </Text>
                  </View>
                </View>

                {/* Farmer Details Checklist */}
                <View style={styles.detailsRow}>
                  <Text style={styles.detailTag}>
                    UPI ID: <Text style={{ fontFamily: FONT.bold, color: log.farmer.upiId ? '#15803d' : '#94a3b8' }}>{log.farmer.upiId || 'Not set'}</Text>
                  </Text>
                  <Text style={styles.detailTag}>
                    Tank: <Text style={{ fontFamily: FONT.bold, color: log.farmer.sprayTankSizeL ? '#15803d' : '#94a3b8' }}>{log.farmer.sprayTankSizeL ? `${log.farmer.sprayTankSizeL}L` : 'Not set'}</Text>
                  </Text>
                </View>

                {/* Action Buttons: 1-Click Call & 1-Click WhatsApp */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    activeOpacity={0.8}
                    onPress={() => handleCallFarmer(log.farmer.mobile)}
                  >
                    <Ionicons name="call" size={15} color="#ffffff" />
                    <Text style={styles.callBtnText}>Call Farmer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    activeOpacity={0.8}
                    onPress={() => handleWhatsAppFarmer(log.farmer.mobile, log.farmer.name)}
                  >
                    <Ionicons name="logo-whatsapp" size={15} color="#ffffff" />
                    <Text style={styles.whatsappBtnText}>WhatsApp Welcome</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  headerTitle: { color: '#ffffff', fontSize: 17, fontFamily: FONT.extraBold },
  headerSubtitle: { color: '#e2e8f0', fontSize: 11, fontFamily: FONT.medium },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  walletBadgeText: { fontSize: 13, fontFamily: FONT.extraBold, color: '#15803d' },
  scrollContent: { padding: SPACING.md, paddingBottom: 40, gap: 14 },
  walletCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  walletCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  walletBalanceText: { fontSize: 20, fontFamily: FONT.extraBold, color: '#15803d' },
  withdrawBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  withdrawBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },
  walletSubInfo: { fontSize: 11, fontFamily: FONT.medium, color: '#166534', backgroundColor: '#f0fdf4', padding: 6, borderRadius: RADIUS.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#334155' },
  emptySub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' },
  farmerCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  farmerCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  farmerAvatarBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  farmerName: { fontSize: 14.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  farmerMeta: { fontSize: 12, fontFamily: FONT.medium, color: '#475569', marginTop: 1 },
  farmerDate: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  statusBadgePending: { backgroundColor: '#fef3c7' },
  statusBadgeVerified: { backgroundColor: '#dcfce7' },
  statusBadgeText: { fontSize: 11, fontFamily: FONT.bold },
  statusBadgeTextPending: { color: '#b45309' },
  statusBadgeTextVerified: { color: '#15803d' },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  detailTag: { fontSize: 11.5, fontFamily: FONT.medium, color: '#475569' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  callBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  whatsappBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },
});
