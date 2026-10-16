import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useLanguage } from '@/src/store/language-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import { Avatar } from '@/src/components/Avatar';
import { SuperAdminExpenseCategoriesModal } from '@/components/SuperAdminExpenseCategoriesModal';
import { UserGuidesModal, SuperAdminWorkspaceModal, AdminInfoModal } from '@/components/AdminMoreModals';
import { ADMIN_PILLARS, NavigationPillar, SubTabItem } from '@/constants/navigationPillars';
import { useExecutiveTheme } from '@/src/store/theme-context';

const getCleanMobile = (mobile?: string | null) => {
  if (!mobile || mobile.startsWith('G_')) return '';
  return mobile;
};

export default function AdminMoreScreen() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { colors, isLight, cardBg, textColor } = useExecutiveTheme();
  const { data: appSettings } = useAppSettings();
  const brandLogoUri = appSettings?.logoUrl ?? null;
  const { t } = useLanguage();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedPillars, setCollapsedPillars] = useState<Record<string, boolean>>({
    ECOSYSTEM: true,
    PLATFORM: true,
  });

  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showGuidesModal, setShowGuidesModal] = useState(false);
  const updateSettings = useUpdateAppSettings();
  const isGroupVoiceCallEnabled = (appSettings as any)?.groupVoiceCallEnabled ?? true;

  const togglePillar = (pillarId: string) => {
    setCollapsedPillars((prev) => ({
      ...prev,
      [pillarId]: !prev[pillarId],
    }));
  };

  const handleNavigateSubTab = (tab: SubTabItem) => {
    if (tab.params) {
      const queryString = new URLSearchParams(tab.params as Record<string, string>).toString();
      router.push(`${tab.path}?${queryString}` as any);
    } else {
      router.push(tab.path as any);
    }
  };

  const filteredPillars = useMemo(() => {
    if (!searchQuery.trim()) return ADMIN_PILLARS;
    const q = searchQuery.toLowerCase();
    return ADMIN_PILLARS.map((pillar) => {
      const matchingTabs = pillar.subTabs.filter(
        (tab) =>
          tab.title.toLowerCase().includes(q) ||
          (tab.shortTitle && tab.shortTitle.toLowerCase().includes(q))
      );
      if (pillar.title.toLowerCase().includes(q) || matchingTabs.length > 0) {
        return {
          ...pillar,
          subTabs: matchingTabs.length > 0 ? matchingTabs : pillar.subTabs,
        };
      }
      return null;
    }).filter(Boolean) as NavigationPillar[];
  }, [searchQuery]);

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* 🌟 Compact 1-2 Rows Executive User Card */}
          <View
            style={[
              styles.compactUserCard,
              isLight && styles.compactUserCardLight,
            ]}
          >
            <LinearGradient
              colors={isLight ? ['#ffffff', '#f8fafc'] : ['rgba(4, 20, 10, 0.95)', 'rgba(2, 13, 6, 0.95)']}
              style={styles.compactUserGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Row 1: Avatar, Name + Role Tag + Quick Logout */}
              <View style={styles.userRow1}>
                <View style={[styles.compactAvatar, isLight && styles.compactAvatarLight]}>
                  <Ionicons name="shield-checkmark" size={17} color={isLight ? '#16a34a' : '#00ff87'} />
                </View>

                <View style={styles.userInfoCol}>
                  <View style={styles.userNameLine}>
                    <Text style={[styles.compactName, isLight && { color: '#0f172a' }]} numberOfLines={1}>
                      {user?.name ?? 'Admin User'}
                    </Text>
                    <View style={[styles.compactRoleTag, isLight && styles.compactRoleTagLight]}>
                      <Text style={[styles.compactRoleText, isLight && { color: '#16a34a' }]}>
                        👑 {user?.role ?? role ?? 'ADMIN'}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: King ID, Phone & Online Badge */}
                  <View style={styles.userSubRow}>
                    <View style={[styles.kingIdPill, isLight && styles.kingIdPillLight]}>
                      <Ionicons name="key-outline" size={10} color={isLight ? '#16a34a' : '#00ff87'} />
                      <Text style={[styles.compactKingText, isLight && { color: '#475569' }]}>
                        ID: {user?.kingId ?? 'FK-ADMIN'}
                      </Text>
                    </View>

                    {getCleanMobile(user?.mobile) ? (
                      <View style={[styles.phonePill, isLight && styles.phonePillLight]}>
                        <Ionicons name="call-outline" size={10} color={isLight ? '#2563eb' : '#38bdf8'} />
                        <Text style={[styles.compactKingText, isLight && { color: '#475569' }]}>
                          {getCleanMobile(user?.mobile)}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={[styles.liveText, isLight && { color: '#16a34a' }]}>Active</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.quickLogoutBtn, isLight && styles.quickLogoutBtnLight]}
                  activeOpacity={0.7}
                  onPress={() => logout()}
                  accessibilityLabel="Logout"
                >
                  <Ionicons name="log-out-outline" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Tool Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search admin tools, settings, users..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* 4 COMMAND HUBS (Synchronized with Desktop Sidebar & Mobile Navigation) */}
          {filteredPillars.map((pillar) => {
            const isCollapsed = collapsedPillars[pillar.id] ?? false;

            return (
              <View key={pillar.id} style={styles.section}>
                {/* Pillar Header (Tap to toggle collapse) */}
                <TouchableOpacity
                  style={styles.sectionHeader}
                  activeOpacity={0.8}
                  onPress={() => togglePillar(pillar.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={[styles.pillarHeaderDot, { backgroundColor: pillar.color || '#059669' }]} />
                    <Text style={styles.sectionTitle}>{pillar.title}</Text>
                  </View>
                  <View style={styles.pillarBadge}>
                    <Text style={[styles.pillarBadgeText, { color: pillar.color || '#059669' }]}>
                      {pillar.badge}
                    </Text>
                  </View>
                  <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color="#94a3b8"
                  />
                </TouchableOpacity>

                {/* Sub-Tools List */}
                {!isCollapsed && (
                  <View style={styles.sectionCard}>
                    {pillar.subTabs.map((tab, idx) => {
                      const isLast = idx === pillar.subTabs.length - 1;
                      return (
                        <TouchableOpacity
                          key={tab.id}
                          style={[styles.row, isLast && { borderBottomWidth: 0 }]}
                          activeOpacity={0.7}
                          onPress={() => handleNavigateSubTab(tab)}
                        >
                          <View
                            style={[
                              styles.rowIconBg,
                              { backgroundColor: `${pillar.color || '#059669'}15` },
                            ]}
                          >
                            <Ionicons
                              name={tab.icon}
                              size={18}
                              color={pillar.color || '#059669'}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>{tab.title}</Text>
                            <Text style={styles.rowSubLabel}>
                              {tab.description || (tab.shortTitle ? `Access ${tab.shortTitle} tools` : 'Configure & monitor')}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* 🛠️ SYSTEM QUICK UTILITIES */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.pillarHeaderDot, { backgroundColor: '#6366f1' }]} />
                <Text style={styles.sectionTitle}>SYSTEM UTILITIES & TOOLS</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setShowCategoriesModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="pricetags-outline" size={18} color="#dc2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Expense Categories Manager</Text>
                  <Text style={styles.rowSubLabel}>Add, edit & deactivate farm expense categories</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setShowAboutModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Admin Info & Branding Console</Text>
                  <Text style={styles.rowSubLabel}>App name, brand logo, tagline & payment UPI</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() =>
                  updateSettings.mutateAsync({
                    groupVoiceCallEnabled: !isGroupVoiceCallEnabled,
                  } as any)
                }
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#ecfdf5' }]}>
                  <Ionicons name="mic-outline" size={18} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Group Voice Conference</Text>
                  <Text style={styles.rowSubLabel}>
                    {isGroupVoiceCallEnabled ? 'STATUS: ACTIVE (ENABLED)' : 'STATUS: DISABLED'}
                  </Text>
                </View>
                <Ionicons
                  name={isGroupVoiceCallEnabled ? 'toggle' : 'toggle-outline'}
                  size={26}
                  color={isGroupVoiceCallEnabled ? '#059669' : '#cbd5e1'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setShowWorkspaceModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#ccfbf1' }]}>
                  <Ionicons name="briefcase-outline" size={18} color="#0d9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Workspace (Backup & Tools)</Text>
                  <Text style={styles.rowSubLabel}>System data exports & developer diagnostics</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.row, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => setShowGuidesModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="book-outline" size={18} color="#15803d" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Admin User Guides</Text>
                  <Text style={styles.rowSubLabel}>Guidelines, documentation & platform manuals</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={() => logout()}
          >
            <Ionicons name="log-out-outline" size={19} color="#dc2626" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SuperAdminExpenseCategoriesModal
        visible={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
      />
      <SuperAdminWorkspaceModal
        visible={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
      />
      <UserGuidesModal
        visible={showGuidesModal}
        onClose={() => setShowGuidesModal(false)}
      />
      <AdminInfoModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d06', ...(typeof window !== 'undefined' ? { height: '100%', overflow: 'hidden' } as any : {}) },
  body: { padding: 10 },
  compactUserCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    overflow: 'hidden',
    marginBottom: 10,
    ...premiumShadow('#000000', 'sm') as any,
  },
  compactUserCardLight: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: '#ffffff',
    shadowColor: '#16a34a',
  },
  compactUserGradient: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1.5,
    borderColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatarLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  userInfoCol: {
    flex: 1,
    gap: 3,
  },
  userNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactName: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  compactRoleTag: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  compactRoleTagLight: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderColor: 'rgba(22, 163, 74, 0.3)',
  },
  compactRoleText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  userSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  kingIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kingIdPillLight: {
    backgroundColor: '#f1f5f9',
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  phonePillLight: {
    backgroundColor: '#f1f5f9',
  },
  compactKingText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#22c55e',
  },
  quickLogoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLogoutBtnLight: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    marginBottom: 10,
    ...premiumShadow('#000000', 'sm') as any,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#ffffff',
    padding: 0,
  },
  section: { marginBottom: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 5,
  },
  pillarHeaderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#e2e8f0',
    letterSpacing: 0.3,
  },
  pillarBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    marginRight: 6,
  },
  pillarBadgeText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
    overflow: 'hidden',
    ...premiumShadow('#000000', 'sm') as any,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  rowIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  rowSubLabel: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 11,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  logoutText: { fontSize: 13, fontFamily: FONT.bold, color: '#dc2626' },
});
