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
import { SwitchDashboardSection } from '@/src/components/SwitchDashboardSection';
import { UserGuidesModal, SuperAdminWorkspaceModal, AdminInfoModal } from './more';
import { ADMIN_PILLARS, NavigationPillar, SubTabItem } from '@/constants/navigationPillars';

const getCleanMobile = (mobile?: string | null) => {
  if (!mobile || mobile.startsWith('G_')) return '';
  return mobile;
};

export default function AdminMoreScreen() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { data: appSettings } = useAppSettings();
  const brandLogoUri = appSettings?.logoUrl ?? null;
  const { t } = useLanguage();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedPillars, setCollapsedPillars] = useState<Record<string, boolean>>({});

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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Profile Banner */}
        <LinearGradient colors={['#04140a', '#020d06']} style={styles.hero}>
          <View style={styles.avatarCircle}>
            <Ionicons name="shield-checkmark" size={32} color="#00ff87" />
          </View>
          <Text style={styles.name}>{user?.name ?? 'Admin User'}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>👑 {user?.role ?? role ?? 'ADMIN'}</Text>
          </View>
          <View style={styles.kingIdBadge}>
            <Ionicons name="key-outline" size={11} color="#ffffff" />
            <Text style={styles.kingIdText}>
              KING ID: {user?.kingId ?? 'FK-ADMIN'}{getCleanMobile(user?.mobile) ? ` · 📞 ${getCleanMobile(user?.mobile)}` : ''}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Switch Role / Dashboard Quick Section */}
          <SwitchDashboardSection />

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

          {/* 7 DOMAIN PILLARS (Fully synchronized with Desktop Sidebar) */}
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
                              {tab.shortTitle ? `Access ${tab.shortTitle} tools` : 'Configure & monitor'}
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

          {/* 🛠️ C-PANEL QUICK UTILITIES */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.pillarHeaderDot, { backgroundColor: '#6366f1' }]} />
                <Text style={styles.sectionTitle}>C-PANEL UTILITIES & TOOLS</Text>
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
  container: { flex: 1, backgroundColor: '#020d06' },
  hero: {
    paddingTop: Platform.OS === 'web' ? 36 : 50,
    paddingBottom: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  name: { fontSize: 20, fontFamily: FONT.bold, color: '#ffffff', marginBottom: 4 },
  roleTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginBottom: 8,
  },
  roleTagText: { fontSize: 11, fontFamily: FONT.extraBold, color: '#ffffff' },
  kingIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  kingIdText: { fontSize: 11, fontFamily: FONT.medium, color: '#ffffff' },
  body: { padding: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 16,
    ...premiumShadow('#000000', 'sm') as any,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#ffffff',
    padding: 0,
  },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  pillarHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#e2e8f0',
    letterSpacing: 0.3,
  },
  pillarBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    marginRight: 6,
  },
  pillarBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
    overflow: 'hidden',
    ...premiumShadow('#000000', 'sm') as any,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  rowIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  rowSubLabel: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 40,
  },
  logoutText: { fontSize: 14, fontFamily: FONT.bold, color: '#dc2626' },
});
