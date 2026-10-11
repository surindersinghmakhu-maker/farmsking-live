import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, THEME_4D, neonGlow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useAdminConversations } from '@/src/hooks/useAdminChat';
import { AdminSupportModal } from '@/src/components/AdminSupportModal';
import { useCrops } from '@/src/store/crops-context';
import { SwitchDashboardSection } from '@/src/components/SwitchDashboardSection';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FuturisticGridBackground } from '../ui/FuturisticGridBackground';
import { GlassCard4D } from '../ui/GlassCard4D';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export const AdminDashboardView: React.FC = () => {
  const theme = RoleThemes.ADMIN;
  const { colors: tConfig } = useExecutiveTheme();
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
    <FuturisticGridBackground style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <RoleHeader
          currentRole="ADMIN"
          profileName={user?.name || 'Admin'}
          subtitle="Platform Overview"
        />

        <View style={styles.content}>
          <SwitchDashboardSection />

          {/* Real-time Farmer Support Chat Card Banner */}
          <GlassCard4D
            glowColor={THEME_4D.neonEmerald}
            intensity="high"
            style={styles.chatCardBanner}
            onPress={() => openModalWithFarmer()}
          >
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.beaconIconWrapper}>
                  <Ionicons name="chatbubbles" size={20} color={THEME_4D.neonEmerald} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Farmer Support Chat</Text>
                  <Text style={styles.sectionSubtitle}>Real-time WebSocket link</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {totalUnread > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{totalUnread} NEW</Text>
                  </View>
                ) : null}
                <View style={styles.liveSocketBadge}>
                  <View style={styles.liveSocketDot} />
                  <Text style={styles.liveSocketText}>LIVE SOCKET</Text>
                </View>
              </View>
            </View>

            <Text style={styles.cardPromptText}>
              Direct farmer queries & audio calls. Click anywhere to activate modal console:
            </Text>

            {isLoadingConversations ? (
              <ActivityIndicator size="small" color={THEME_4D.neonEmerald} style={{ paddingVertical: 14 }} />
            ) : conversations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbox-ellipses-outline" size={26} color={THEME_4D.textDim} />
                <Text style={styles.emptyText}>No active farmer conversations currently open.</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {conversations.slice(0, 3).map((conv) => (
                  <TouchableOpacity
                    key={conv.farmer?.id || Math.random().toString()}
                    style={styles.convItemRow}
                    activeOpacity={0.8}
                    onPress={() => openModalWithFarmer(conv.farmer?.id, conv.farmer?.name)}
                  >
                    <View style={styles.convAvatarWrapper}>
                      <Ionicons name="person" size={16} color={THEME_4D.neonEmerald} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.convFarmerName}>{conv.farmer?.name || 'Farmer'}</Text>
                        {conv.unreadCount > 0 ? (
                          <View style={styles.convMiniUnreadBadge}>
                            <Text style={styles.convMiniUnreadText}>{conv.unreadCount} New</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.convLastMsg} numberOfLines={1}>
                        {conv.lastMessage}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color={THEME_4D.neonEmerald} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Explicit Open Pop-Up Modal CTA */}
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              onPress={() => openModalWithFarmer()}
            >
              <LinearGradient
                colors={['rgba(0, 255, 135, 0.25)', 'rgba(16, 185, 129, 0.4)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButtonGradient}
              >
                <Ionicons name="open-outline" size={16} color={THEME_4D.neonEmerald} />
                <Text style={styles.ctaButtonText}>Open Live Support Console</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard4D>

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
          <GlassCard4D
            glowColor={THEME_4D.cyberCyan}
            intensity="medium"
            style={styles.cropControlCard}
          >
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.beaconIconWrapper, { borderColor: 'rgba(0, 242, 254, 0.4)' }]}>
                  <Ionicons name="shield-checkmark" size={20} color={THEME_4D.cyberCyan} />
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: THEME_4D.textPrimary }]}>
                    Admin Crop Control & Stages
                  </Text>
                  <Text style={styles.sectionSubtitle}>Omni-stage field override</Text>
                </View>
              </View>
            </View>
            <Text style={styles.cardPromptText}>
              Platform Power: Modify crop status at ANY stage (Plantation, Vegetative, Flowering, Harvesting) & orchestrate advisor rosters.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/super-crop-edit' as never)}
              >
                <Ionicons name="pencil" size={15} color="#020905" />
                <Text style={styles.actionBtnPrimaryText}>Admin Crop Editor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/farm' as never)}
              >
                <Ionicons name="leaf-outline" size={15} color={THEME_4D.neonEmerald} />
                <Text style={styles.actionBtnSecondaryText}>View All Crops</Text>
              </TouchableOpacity>
            </View>
          </GlassCard4D>

          {/* 4 Stat Cards with 4D Perspective & Animated Counters */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Active Users', value: 2568, prefix: '', suffix: '', icon: 'people-outline', color: THEME_4D.neonEmerald },
              { label: 'Agri Advisors', value: 1256, prefix: '', suffix: '', icon: 'school-outline', color: THEME_4D.cyberCyan },
              { label: 'Total Orders', value: 3256, prefix: '', suffix: '', icon: 'receipt-outline', color: THEME_4D.cyberGold },
              { label: 'Biz Partners', value: 256, prefix: '', suffix: '', icon: 'briefcase-outline', color: '#a78bfa' },
            ].map((s) => (
              <GlassCard4D
                key={s.label}
                glowColor={s.color}
                intensity="medium"
                style={styles.statCard}
              >
                <View style={[styles.statIconBg, { borderColor: s.color + '55' }]}>
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                </View>
                <Text style={styles.statValue}>
                  <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                </Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </GlassCard4D>
            ))}
          </View>

          {/* Sales Overview Hero */}
          <GlassCard4D
            glowColor={THEME_4D.neonEmerald}
            intensity="high"
            style={styles.salesHeroCard}
          >
            <Ionicons name="stats-chart" size={120} color={THEME_4D.neonEmerald} style={styles.watermark} />
            <Text style={styles.salesCardLabel}>TOTAL PLATFORM VOLUME</Text>
            <Text style={styles.salesAmount}>
              <AnimatedCounter value={1245560} prefix="₹" />
            </Text>
            <View style={styles.sparklineContainer}>
              <View style={styles.sparklineBarRow}>
                {[40, 55, 48, 65, 58, 78, 92].map((h, index) => (
                  <View
                    key={index}
                    style={[
                      styles.sparklineBar,
                      {
                        height: h,
                        backgroundColor: index === 6 ? THEME_4D.neonEmerald : 'rgba(0, 255, 135, 0.45)',
                        shadowColor: THEME_4D.neonEmerald,
                        shadowOpacity: index === 6 ? 0.8 : 0.2,
                        shadowRadius: 8,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </GlassCard4D>

          {/* Recent Orders */}
          <GlassCard4D
            glowColor={THEME_4D.cyberGold}
            intensity="low"
            style={styles.ordersSectionCard}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {[
              { id: 'Order #1254', name: 'Aman Kumar', amount: '₹500', time: 'Today' },
              { id: 'Order #1255', name: 'Rakesh Kumar', amount: '₹780', time: 'Today' },
              { id: 'Order #1253', name: 'Sukhdeep Singh', amount: '₹1,240', time: 'Yesterday', last: true },
            ].map((o) => (
              <View key={o.id} style={[styles.orderRow, o.last && { borderBottomWidth: 0 }]}>
                <View style={styles.orderIconBg}>
                  <Ionicons name="receipt-outline" size={16} color={THEME_4D.cyberGold} />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle}>{o.id}</Text>
                  <Text style={styles.orderSubtitle}>{o.name} · {o.time}</Text>
                </View>
                <Text style={styles.orderAmount}>{o.amount}</Text>
              </View>
            ))}
          </GlassCard4D>

          {/* Management Shortcuts */}
          <GlassCard4D
            glowColor={THEME_4D.neonEmerald}
            intensity="low"
            style={styles.mgmtSectionCard}
          >
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Platform Hub</Text>
            <View style={styles.toolsGrid}>
              {[
                { label: 'Users', icon: 'people-outline', color: THEME_4D.neonEmerald },
                { label: 'Products', icon: 'cube-outline', color: THEME_4D.cyberCyan },
                { label: 'Orders', icon: 'receipt-outline', color: THEME_4D.cyberGold },
                { label: 'Reports', icon: 'bar-chart-outline', color: '#a78bfa' },
              ].map((t) => (
                <TouchableOpacity key={t.label} style={styles.toolBtn} activeOpacity={0.7}>
                  <Ionicons name={t.icon as any} size={20} color={t.color} />
                  <Text style={styles.toolLabel}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard4D>
        </View>
      </ScrollView>
    </FuturisticGridBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xxl },
  chatCardBanner: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
  },
  beaconIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: THEME_4D.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: THEME_4D.neonEmerald,
    letterSpacing: 0.3,
  },
  unreadBadge: {
    backgroundColor: THEME_4D.criticalRed,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: FONT.extraBold,
  },
  liveSocketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
  },
  liveSocketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME_4D.neonEmerald,
    shadowColor: THEME_4D.neonEmerald,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  liveSocketText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: THEME_4D.neonEmerald,
    letterSpacing: 0.6,
  },
  cardPromptText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: THEME_4D.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  emptyText: {
    fontSize: 12,
    color: THEME_4D.textDim,
    fontFamily: FONT.medium,
  },
  convItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 18, 10, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.18)',
    borderRadius: RADIUS.lg,
    padding: 10,
    gap: 10,
  },
  convAvatarWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convFarmerName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: THEME_4D.textPrimary,
  },
  convMiniUnreadBadge: {
    backgroundColor: THEME_4D.criticalRed,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  convMiniUnreadText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  convLastMsg: {
    fontSize: 11.5,
    color: THEME_4D.textMuted,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  ctaButton: {
    marginTop: 10,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
  },
  ctaButtonGradient: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaButtonText: {
    color: THEME_4D.neonEmerald,
    fontSize: 13,
    fontFamily: FONT.bold,
    letterSpacing: 0.3,
  },
  cropControlCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: THEME_4D.neonEmerald,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: THEME_4D.neonEmerald,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#020905',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(8, 34, 20, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: THEME_4D.neonEmerald,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.5%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: THEME_4D.textPrimary,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 11.5,
    color: THEME_4D.textMuted,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  salesHeroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    top: -12,
    right: -16,
    opacity: 0.08,
  },
  salesCardLabel: {
    fontSize: 12,
    color: THEME_4D.neonEmerald,
    fontFamily: FONT.bold,
    letterSpacing: 0.8,
  },
  salesAmount: {
    fontSize: 34,
    fontFamily: FONT.extraBold,
    color: THEME_4D.textPrimary,
    marginTop: 6,
    letterSpacing: -0.6,
  },
  sparklineContainer: {
    marginTop: 18,
    height: 60,
    justifyContent: 'flex-end',
  },
  sparklineBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sparklineBar: {
    width: 22,
    borderRadius: 6,
  },
  ordersSectionCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: THEME_4D.neonEmerald,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  orderIconBg: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: THEME_4D.textPrimary,
  },
  orderSubtitle: {
    fontSize: 11.5,
    color: THEME_4D.textMuted,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: THEME_4D.cyberGold,
  },
  mgmtSectionCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  toolsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: 'rgba(4, 18, 10, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.22)',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toolLabel: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: THEME_4D.textSecondary,
  },
});
