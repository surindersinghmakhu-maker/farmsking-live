import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useAdminConversations } from '@/src/hooks/useAdminChat';
import { AdminSupportModal } from '@/src/components/AdminSupportModal';
import { useCrops } from '@/src/store/crops-context';
import { SwitchDashboardSection } from '@/src/components/SwitchDashboardSection';

export const AdminDashboardView: React.FC = () => {
  const theme = RoleThemes.ADMIN;
  const router = useRouter();
  const { user } = useAuth();
  const { gpsUnlockRequests, acceptGpsUnlockRequest, declineGpsUnlockRequest } = useCrops();

  const { data: conversations = [], isLoading: isLoadingConversations } = useAdminConversations();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedFarmerChat, setSelectedFarmerChat] = useState<{ farmerId?: string; farmerName?: string } | null>(null);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const openModalWithFarmer = (farmerId?: string, farmerName?: string) => {
    setSelectedFarmerChat(farmerId ? { farmerId, farmerName } : null);
    setIsSupportModalOpen(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <RoleHeader
        currentRole="ADMIN"
        profileName={user?.name || 'Admin'}
        subtitle="Platform Overview"
        avatarUrl={user?.photoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
      />

      <View style={styles.content}>
        <SwitchDashboardSection />
        {/* Real-time Farmer Support Chat Card Banner */}
        <TouchableOpacity
          style={[
            styles.sectionCard,
            premiumShadow('#0f172a', 'sm'),
            { backgroundColor: '#ffffff', borderColor: '#16a34a', borderWidth: 1.5 },
          ]}
          activeOpacity={0.9}
          onPress={() => openModalWithFarmer()}
        >
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="chatbubbles" size={20} color="#16a34a" />
              <Text style={[styles.sectionTitle, { color: '#0f172a' }]}>Farmer Support Chat (Real-time)</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {totalUnread > 0 ? (
                <View style={{ backgroundColor: '#dc2626', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontFamily: FONT.extraBold }}>{totalUnread} NEW</Text>
                </View>
              ) : null}
              <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d' }}>
                  🟢 Live Socket
                </Text>
              </View>
            </View>
          </View>

          <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginBottom: 10 }}>
            Live farmer messages & support queries. Tap anywhere on this card to open the **Pop-Up Chat Modal**:
          </Text>

          {isLoadingConversations ? (
            <ActivityIndicator size="small" color="#16a34a" style={{ paddingVertical: 12 }} />
          ) : conversations.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Ionicons name="chatbox-outline" size={28} color="#cbd5e1" />
              <Text style={{ fontSize: 12, color: '#94a3b8', fontFamily: FONT.medium, marginTop: 4 }}>No active farmer messages yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {conversations.slice(0, 3).map((conv) => (
                <TouchableOpacity
                  key={conv.farmer?.id || Math.random().toString()}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc',
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    borderRadius: RADIUS.md,
                    padding: 10,
                    gap: 10,
                  }}
                  activeOpacity={0.8}
                  onPress={() => openModalWithFarmer(conv.farmer?.id, conv.farmer?.name)}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person" size={18} color="#16a34a" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>{conv.farmer?.name || 'Farmer'}</Text>
                      {conv.unreadCount > 0 ? (
                        <View style={{ backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontFamily: FONT.bold }}>{conv.unreadCount} New</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 }} numberOfLines={1}>
                      {conv.lastMessage}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Explicit Open Pop-Up Modal CTA */}
          <TouchableOpacity
            style={{
              marginTop: 10,
              backgroundColor: '#16a34a',
              borderRadius: RADIUS.md,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            onPress={() => openModalWithFarmer()}
          >
            <Ionicons name="open-outline" size={16} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold }}>Open Live Support Chat Pop-Up</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Real-Time Pop-Up Modal */}
        <AdminSupportModal
          visible={isSupportModalOpen}
          onClose={() => {
            setIsSupportModalOpen(false);
            setSelectedFarmerChat(null);
          }}
          initialFarmerId={selectedFarmerChat?.farmerId}
          initialFarmerName={selectedFarmerChat?.farmerName}
        />
        {/* Admin Level Crop Control & Advisor Dashboard Banner */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1.5 }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
              <Text style={[styles.sectionTitle, { color: '#14532d' }]}>Admin Crop Control & Advisor View</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#166534', marginBottom: 12 }}>
            Admin Power: Edit ANY crop at ANY stage (Plantation, Vegetative, Flowering, Harvesting, Completed) & manage advisor farmer rosters.
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: '#16a34a', flex: 1, paddingVertical: 10 }]}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/super-crop-edit')}
            >
              <Ionicons name="pencil" size={16} color="#ffffff" />
              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' }}>✏️ Admin Crop Editor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: '#ffffff', borderColor: '#16a34a', borderWidth: 1.5, flex: 1, paddingVertical: 10 }]}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/farm')}
            >
              <Ionicons name="leaf-outline" size={16} color="#16a34a" />
              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#16a34a' }}>🌾 View All Crops</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4 Stat Cards */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Users', value: '2,568', icon: 'people-outline' },
            { label: 'Advisors', value: '1,256', icon: 'school-outline' },
            { label: 'Orders', value: '3,256', icon: 'receipt-outline' },
            { label: 'Partners', value: '256', icon: 'briefcase-outline' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.statIconBg}>
                <Ionicons name={s.icon as any} size={17} color={theme.primary} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Sales Overview Hero */}
        <LinearGradient colors={theme.heroGradient} style={[styles.salesCard, premiumShadow(theme.primary, 'md')]}>
          <Ionicons name="stats-chart" size={104} color={theme.primary} style={styles.watermark} />
          <Text style={styles.cardLabelText}>Total Platform Sales</Text>
          <Text style={styles.salesAmount}>₹12,45,560</Text>
          <View style={styles.sparklineContainer}>
            <View style={styles.sparklineBarRow}>
              {[40, 55, 48, 65, 58, 78, 92].map((h, index) => (
                <LinearGradient key={index} colors={[theme.accent, theme.primary]} style={[styles.sparklineBar, { height: h }]} />
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Recent Orders */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text></TouchableOpacity>
          </View>

          {[
            { id: 'Order #1254', name: 'Aman Kumar', amount: '₹500', time: 'Today' },
            { id: 'Order #1255', name: 'Rakesh Kumar', amount: '₹780', time: 'Today' },
            { id: 'Order #1253', name: 'Sukhdeep Singh', amount: '₹1,240', time: 'Yesterday', last: true },
          ].map((o) => (
            <View key={o.id} style={[styles.row, o.last && { borderBottomWidth: 0 }]}>
              <View style={styles.rowIconBg}>
                <Ionicons name="receipt-outline" size={17} color={theme.primary} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{o.id}</Text>
                <Text style={styles.rowSubtitle}>{o.name} · {o.time}</Text>
              </View>
              <Text style={styles.rowAmount}>{o.amount}</Text>
            </View>
          ))}
        </View>

        {/* Management Shortcuts */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Management</Text>
          <View style={styles.toolsGrid}>
            {[
              { label: 'Users', icon: 'people-outline' },
              { label: 'Products', icon: 'cube-outline' },
              { label: 'Orders', icon: 'receipt-outline' },
              { label: 'Reports', icon: 'bar-chart-outline' },
            ].map((t) => (
              <TouchableOpacity key={t.label} style={styles.toolBtn} activeOpacity={0.7}>
                <Ionicons name={t.icon as any} size={20} color={theme.primary} />
                <Text style={styles.toolLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47.5%', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg,
  },
  statIconBg: {
    width: 32, height: 32, borderRadius: 11, backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3 },
  statLabel: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  salesCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, overflow: 'hidden' },
  watermark: { position: 'absolute', top: -12, right: -16, opacity: 0.08 },
  cardLabelText: { fontSize: 13.5, color: '#64748b', fontFamily: FONT.semiBold },
  salesAmount: { fontSize: 32, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6, letterSpacing: -0.6 },
  sparklineContainer: { marginTop: 18, height: 56, justifyContent: 'flex-end' },
  sparklineBarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 },
  sparklineBar: { width: 20, borderRadius: 6 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowIconBg: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  rowSubtitle: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  rowAmount: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  toolsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  toolBtn: { flex: 1, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 6 },
  toolLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' },
});
