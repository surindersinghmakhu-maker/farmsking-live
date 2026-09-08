import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import { apiClient } from '@/src/api/client';
import { useFarmerPlanPricing, useUpdateFarmerPlanPricing } from '@/src/hooks/useFarmerPlan';
import { FarmerPlanPricing } from '@/src/api/farmerPlans.api';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SuperAdminExpenseCategoriesModal } from '@/components/SuperAdminExpenseCategoriesModal';
import { AdminInfoModal, SuperAdminWorkspaceModal, UserGuidesModal } from '@/app/(tabs)/more';

const theme = RoleThemes.SUPER_ADMIN;

interface WaBotStatus {
  isConnected: boolean;
  qrCodeDataUrl: string | null;
}

interface WhatsAppBotPanelProps {
  savedGroupJid: string;
  onSaveJid: (jid: string) => Promise<void>;
}

function WhatsAppBotPanel({ savedGroupJid, onSaveJid }: WhatsAppBotPanelProps) {
  const [status, setStatus] = useState<WaBotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Group address (always visible & editable) ──────────────────────
  const [groupInput, setGroupInput] = useState(savedGroupJid);
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupSaved, setGroupSaved] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Keep input in sync when prop loads from server
  useEffect(() => { setGroupInput(savedGroupJid); }, [savedGroupJid]);

  const fetchStatus = async () => {
    try {
      const res = await apiClient.get<WaBotStatus>('/whatsapp/qr-status');
      setStatus(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleUnlink = async () => {
    setUnlinking(true);
    setSyncResult(null);
    try {
      await apiClient.post('/whatsapp/unlink');
      setStatus(null);
      setLoading(true);
      setTimeout(fetchStatus, 2500);
    } catch {
      setSyncResult('⚠️ Unlink failed. Please try again.');
    } finally {
      setUnlinking(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await apiClient.post('/whatsapp/sync-group-members');
      const r = res.data?.result;
      setSyncResult(
        `✅ Sync Done! Added: ${r?.addedCount ?? 0}, Invited: ${r?.inviteSentCount ?? 0}, Removed: ${r?.removedCount ?? 0}`,
      );
    } catch {
      setSyncResult('⚠️ Sync failed. Check WhatsApp connection.');
    } finally {
      setSyncing(false);
    }
  };

  /** Save group address — accepts invite link or @g.us JID */
  const handleSaveGroup = async () => {
    setGroupError(null);
    const raw = groupInput.trim();
    if (!raw) {
      setGroupError('Please enter a WhatsApp Group Invite Link or Group JID.');
      return;
    }
    const isInviteLink = raw.startsWith('https://chat.whatsapp.com/');
    const isJid = raw.includes('@g.us');
    if (!isInviteLink && !isJid) {
      setGroupError('Invalid format. Use https://chat.whatsapp.com/... or a Group JID ending in @g.us');
      return;
    }
    setSavingGroup(true);
    setGroupSaved(false);
    try {
      await onSaveJid(raw);
      setGroupSaved(true);
      setTimeout(() => setGroupSaved(false), 4000);
    } catch {
      setGroupError('Save failed. Please try again.');
    } finally {
      setSavingGroup(false);
    }
  };

  const jidConfigured = savedGroupJid && savedGroupJid !== 'NOT_CONFIGURED' && savedGroupJid !== '';

  // ── Group list picker (available when bot is connected) ────────────
  const [groupsList, setGroupsList] = useState<{ jid: string; name: string; memberCount: number }[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const handleFetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await apiClient.get<{ groups: { jid: string; name: string; memberCount: number }[] }>('/whatsapp/groups');
      setGroupsList(res.data.groups ?? []);
      setShowGroupPicker(true);
    } catch {
      setGroupsList([]);
      alert('⚠️ Could not load groups. WhatsApp bot must be connected and set as group admin.');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSelectGroup = async (group: { jid: string; name: string; memberCount: number }) => {
    setShowGroupPicker(false);
    setGroupInput(group.jid);
    setSavingGroup(true);
    try {
      await onSaveJid(group.jid);
      setGroupSaved(true);
      setTimeout(() => setGroupSaved(false), 4000);
    } catch {
      setGroupError('Failed to save selected group.');
    } finally {
      setSavingGroup(false);
    }
  };

  return (
    <View style={wStyles.panel}>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — TARGET GROUP (always editable)
      ══════════════════════════════════════════════════════ */}
      <View style={wStyles.sectionHeader}>
        <Ionicons name="people-circle-outline" size={15} color="#7c3aed" />
        <Text style={[wStyles.sectionTitle, { color: '#7c3aed' }]}>📋 Target WhatsApp Group</Text>
      </View>

      {/* Current status badge */}
      <View style={[wStyles.statusBadge, jidConfigured ? {} : wStyles.statusBadgeWarn]}>
        <Ionicons
          name={jidConfigured ? 'checkmark-circle' : 'warning-outline'}
          size={13}
          color={jidConfigured ? '#16a34a' : '#b45309'}
        />
        <Text style={[wStyles.statusBadgeText, { color: jidConfigured ? '#15803d' : '#b45309' }]}>
          {jidConfigured ? 'Group configured — Sync active' : 'No target group set — Member sync is disabled'}
        </Text>
      </View>

      {/* ── Editable group address box ──────────────────────────── */}
      <View style={wStyles.groupBox}>
        <Text style={wStyles.groupBoxLabel}>Group Invite Link or JID</Text>
        <Text style={wStyles.groupBoxHint}>
          {'Open WhatsApp Group → ⋮ → Group Info → Invite Link → Copy\n'}
          {'Format: '}
          <Text style={{ fontFamily: 'monospace', fontSize: 10 }}>https://chat.whatsapp.com/XXX</Text>
          {'  or JID: '}
          <Text style={{ fontFamily: 'monospace', fontSize: 10 }}>120363XXXX@g.us</Text>
        </Text>

        <View style={wStyles.inputRow}>
          <TextInput
            style={wStyles.groupInput}
            value={groupInput}
            onChangeText={(t) => { setGroupInput(t); setGroupError(null); setGroupSaved(false); }}
            placeholder="https://chat.whatsapp.com/... or JID"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[wStyles.groupSaveBtn, { backgroundColor: groupSaved ? '#16a34a' : '#7c3aed' }]}
            onPress={handleSaveGroup}
            disabled={savingGroup}
          >
            {savingGroup ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : groupSaved ? (
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
            ) : (
              <Text style={wStyles.groupSaveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {groupSaved && <Text style={wStyles.successText}>✅ Group address saved successfully!</Text>}
        {groupError && <Text style={wStyles.errorText}>{groupError}</Text>}
      </View>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <View style={wStyles.orRow}>
        <View style={wStyles.orLine} />
        <Text style={wStyles.orText}>or select from bot's group list</Text>
        <View style={wStyles.orLine} />
      </View>

      {/* ── Select from group list button ───────────────────────── */}
      <TouchableOpacity
        style={[wStyles.actionBtn, { backgroundColor: status?.isConnected ? '#7c3aed' : '#94a3b8' }]}
        onPress={handleFetchGroups}
        disabled={loadingGroups || !status?.isConnected}
      >
        {loadingGroups ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <>
            <Ionicons name="list-outline" size={16} color="#ffffff" />
            <Text style={wStyles.actionBtnText}>
              {status?.isConnected
                ? "📋 Select Group from Bot's Group List"
                : '⚠️ Connect bot first to browse groups'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Group Picker Modal */}
      <Modal visible={showGroupPicker} transparent animationType="slide" onRequestClose={() => setShowGroupPicker(false)}>
        <View style={wStyles.modalOverlay}>
          <View style={wStyles.modalCard}>
            <View style={wStyles.modalHeader}>
              <Text style={wStyles.modalTitle}>📋 Select Target WhatsApp Group</Text>
              <TouchableOpacity onPress={() => setShowGroupPicker(false)}>
                <Ionicons name="close-circle" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={wStyles.modalSub}>
              Select the group where FARMER and ADVISOR members will be automatically added and removed:
            </Text>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {groupsList.length === 0 ? (
                <Text style={wStyles.emptyText}>
                  ⚠️ No groups found. Make sure the WhatsApp Bot is added as an Admin to your target group.
                </Text>
              ) : (
                groupsList.map((group) => (
                  <TouchableOpacity
                    key={group.jid}
                    style={[wStyles.groupRow, savedGroupJid === group.jid && wStyles.groupRowSelected]}
                    onPress={() => handleSelectGroup(group)}
                  >
                    <View style={wStyles.groupIcon}>
                      <Ionicons name="people" size={18} color="#7c3aed" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={wStyles.groupName}>{group.name}</Text>
                      <Text style={wStyles.groupJid} numberOfLines={1}>{group.jid}</Text>
                      <Text style={wStyles.groupMeta}>👥 {group.memberCount} members</Text>
                    </View>
                    {savedGroupJid === group.jid && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — BOT CONNECTION & QR CODE
      ══════════════════════════════════════════════════════ */}
      <View style={{ height: 1, backgroundColor: '#d1fae5', marginVertical: 2 }} />

      <View style={wStyles.sectionHeader}>
        <Ionicons name="qr-code-outline" size={15} color="#0369a1" />
        <Text style={wStyles.sectionTitle}>📲 WhatsApp Bot — Link & Status</Text>
      </View>

      {loading || !status ? (
        <View style={wStyles.centerBox}>
          <ActivityIndicator color="#25d366" />
          <Text style={wStyles.loadingText}>Checking connection status...</Text>
        </View>

      ) : status.isConnected ? (
        /* ── CONNECTED ─────────────────────────────── */
        <View style={{ gap: 10 }}>
          <View style={wStyles.connectedBadge}>
            <View style={wStyles.connectedDot} />
            <View style={{ flex: 1 }}>
              <Text style={wStyles.connectedText}>🟢 WhatsApp Bot Connected & Active</Text>
              <Text style={wStyles.connectedSub}>
                Bot is linked. Auto add/remove reconciliation runs every 30 minutes.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <View style={wStyles.infoChip}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#0369a1" />
              <Text style={wStyles.infoChipText}>Session Active</Text>
            </View>
            <View style={wStyles.infoChip}>
              <Ionicons name="sync-outline" size={12} color="#0369a1" />
              <Text style={wStyles.infoChipText}>Auto-Sync ON</Text>
            </View>
            {jidConfigured && (
              <View style={[wStyles.infoChip, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
                <Ionicons name="people-outline" size={12} color="#16a34a" />
                <Text style={[wStyles.infoChipText, { color: '#15803d' }]}>Group Configured</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[wStyles.actionBtn, { backgroundColor: '#25d366' }]}
            onPress={handleManualSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="sync-outline" size={15} color="#ffffff" />
                <Text style={wStyles.actionBtnText}>🔄 Run Manual Sync Now</Text>
              </>
            )}
          </TouchableOpacity>

          {syncResult ? <Text style={wStyles.syncText}>{syncResult}</Text> : null}

          <TouchableOpacity
            style={[wStyles.actionBtn, { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' }]}
            onPress={handleUnlink}
            disabled={unlinking}
          >
            {unlinking ? (
              <ActivityIndicator color="#dc2626" size="small" />
            ) : (
              <>
                <Ionicons name="unlink-outline" size={15} color="#dc2626" />
                <Text style={[wStyles.actionBtnText, { color: '#dc2626' }]}>Unlink WhatsApp Session</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      ) : status.qrCodeDataUrl ? (
        /* ── QR CODE ───────────────────────────────── */
        <View style={{ gap: 10, alignItems: 'center' }}>
          <View style={wStyles.qrInstructions}>
            <Text style={wStyles.qrInstructTitle}>📱 How to link your WhatsApp:</Text>
            <Text style={wStyles.qrStep}>1️⃣  Open WhatsApp or WhatsApp Business on your phone</Text>
            <Text style={wStyles.qrStep}>2️⃣  Tap Menu (⋮) → Settings → Linked Devices</Text>
            <Text style={wStyles.qrStep}>3️⃣  Tap "Link a Device" → scan the QR code below</Text>
            <Text style={[wStyles.qrStep, { color: '#b45309', marginTop: 4 }]}>
              ⚠️  The account you link must be Admin in the target group.
            </Text>
          </View>
          <View style={wStyles.qrImageBox}>
            <Image source={{ uri: status.qrCodeDataUrl }} style={wStyles.qrImage} resizeMode="contain" />
          </View>
          <Text style={wStyles.qrNote}>🔄 QR code auto-refreshes every 5 seconds — scan quickly</Text>
        </View>

      ) : (
        /* ── GENERATING ────────────────────────────── */
        <View style={wStyles.centerBox}>
          <ActivityIndicator color="#f59e0b" />
          <Text style={[wStyles.loadingText, { color: '#b45309' }]}>
            ⏳ Generating QR Code... Please wait a moment
          </Text>
        </View>
      )}
    </View>
  );
}

const wStyles = StyleSheet.create({
  panel: {
    backgroundColor: '#f0fdf4', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#bbf7d0', padding: 14, gap: 8,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0369a1' },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', borderRadius: RADIUS.sm,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  statusBadgeWarn: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  statusBadgeText: { fontSize: 11.5, fontFamily: FONT.semiBold, flex: 1 },

  // Group address box
  groupBox: {
    backgroundColor: '#f5f3ff', borderRadius: RADIUS.md,
    padding: 12, gap: 6, borderWidth: 1.5, borderColor: '#e9d5ff',
  },
  groupBoxLabel: { fontSize: 12, fontFamily: FONT.extraBold, color: '#7c3aed' },
  groupBoxHint: { fontSize: 10.5, fontFamily: FONT.medium, color: '#5b21b6', lineHeight: 17 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  groupInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#c4b5fd',
    borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 12, fontFamily: FONT.medium, backgroundColor: '#ffffff', color: '#0f172a',
  },
  groupSaveBtn: {
    borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', minWidth: 62,
  },
  groupSaveBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },
  successText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#16a34a', textAlign: 'center' },
  errorText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#dc2626', textAlign: 'center' },

  // Or divider
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: '#e9d5ff' },
  orText: { fontSize: 11, fontFamily: FONT.medium, color: '#7c3aed' },

  // Action buttons
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: RADIUS.md,
  },
  actionBtnText: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' },

  // Bot connection
  centerBox: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  connectedBadge: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#dcfce7', borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#86efac',
  },
  connectedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16a34a', marginTop: 3 },
  connectedText: { fontSize: 13, fontFamily: FONT.bold, color: '#15803d' },
  connectedSub: { fontSize: 11, fontFamily: FONT.medium, color: '#166534', marginTop: 2 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#eff6ff', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#bae6fd',
  },
  infoChipText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#0369a1' },
  syncText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#15803d', textAlign: 'center' },

  // QR code
  qrInstructions: {
    backgroundColor: '#eff6ff', borderRadius: RADIUS.md,
    padding: 12, gap: 4, width: '100%',
    borderWidth: 1, borderColor: '#bae6fd',
  },
  qrInstructTitle: { fontSize: 12, fontFamily: FONT.extraBold, color: '#0369a1', marginBottom: 2 },
  qrStep: { fontSize: 11.5, fontFamily: FONT.medium, color: '#1e40af' },
  qrImageBox: {
    backgroundColor: '#ffffff', padding: 10,
    borderRadius: RADIUS.lg, borderWidth: 2.5, borderColor: '#25d366',
  },
  qrImage: { width: 220, height: 220 },
  qrNote: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },

  // Group picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 16, gap: 10, ...premiumShadow('#000000', 'lg') },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  emptyText: { fontSize: 12, fontFamily: FONT.medium, color: '#b45309', textAlign: 'center', paddingVertical: 16 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8, backgroundColor: '#f8fafc' },
  groupRowSelected: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  groupIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3e8ff', alignItems: 'center', justifyContent: 'center' },
  groupName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  groupJid: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  groupMeta: { fontSize: 11, fontFamily: FONT.bold, color: '#7c3aed', marginTop: 1 },
});

interface SubCategoryFlag {
  namePa: string;
  nameEn: string;
  enabled: boolean;
}

interface CategoryFlag {
  namePa: string;
  nameEn: string;
  enabled: boolean;
  subCategories: Record<string, SubCategoryFlag>;
}

type FeatureFlagsMap = Record<string, CategoryFlag>;

function CategoryFeatureFlagPanel() {
  const [flags, setFlags] = useState<FeatureFlagsMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    shopping: false,
    telephony_comm: false,
    farmer_operations: false,
  });

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<FeatureFlagsMap>('/app-settings/feature-flags');
      setFlags(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const toggleCategory = (catKey: string) => {
    if (!flags) return;
    const currentCat = flags[catKey];
    if (!currentCat) return;

    setFlags({
      ...flags,
      [catKey]: {
        ...currentCat,
        enabled: !currentCat.enabled,
      },
    });
  };

  const toggleSubCategory = (catKey: string, subKey: string) => {
    if (!flags) return;
    const currentCat = flags[catKey];
    if (!currentCat || !currentCat.subCategories) return;
    const currentSub = currentCat.subCategories[subKey];
    if (!currentSub) return;

    setFlags({
      ...flags,
      [catKey]: {
        ...currentCat,
        subCategories: {
          ...currentCat.subCategories,
          [subKey]: {
            ...currentSub,
            enabled: !currentSub.enabled,
          },
        },
      },
    });
  };

  const handleSave = async () => {
    if (!flags) return;
    try {
      setSaving(true);
      await apiClient.patch('/app-settings/feature-flags', flags);
      alert('✅ Category feature settings saved successfully!');
    } catch {
      alert('❌ Error saving category feature settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !flags) {
    return (
      <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
        <ActivityIndicator color="#4f46e5" />
        <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 6 }}>
          Loading module feature settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1.5 }, premiumShadow('#000000', 'lg')]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setIsCollapsed((prev) => !prev)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#4f46e5' }]}>
          <Ionicons name="apps" size={20} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: '#ffffff' }]}>🛡️ Categories & Sub-Categories Switches</Text>
          <Text style={[styles.cardSub, { color: '#94a3b8' }]}>
            Toggle live ON/OFF status for any platform module or feature (Shopping, Voice Call, WhatsApp, etc.)
          </Text>
        </View>
        <Ionicons
          name={isCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
          size={22}
          color="#94a3b8"
        />
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={{ gap: 12, marginTop: 6 }}>
          <TouchableOpacity
            style={[wStyles.btn, { backgroundColor: '#4f46e5' }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={16} color="#ffffff" />
                <Text style={wStyles.btnText}>💾 Save All Feature Switches</Text>
              </>
            )}
          </TouchableOpacity>

          {Object.entries(flags).map(([catKey, category]: [string, CategoryFlag]) => {
            const isCatExpanded = !!expandedCats[catKey];
            const subCount = Object.keys(category.subCategories || {}).length;
            const activeSubCount = Object.values(category.subCategories || {}).filter(
              (s: SubCategoryFlag) => s.enabled
            ).length;

            return (
              <View
                key={catKey}
                style={{
                  backgroundColor: category.enabled ? '#1e293b' : '#090d16',
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: category.enabled ? '#334155' : '#1e293b',
                  overflow: 'hidden',
                }}
              >
                {/* Category Bar */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                  }}
                  onPress={() => setExpandedCats((prev) => ({ ...prev, [catKey]: !prev[catKey] }))}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#ffffff' }}>
                        {category.nameEn}
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8' }}>
                        ({category.namePa})
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: category.enabled ? '#38bdf8' : '#f43f5e' }}>
                      {category.enabled ? `● ON (${activeSubCount}/${subCount} Active)` : '○ Category Disabled'}
                    </Text>
                  </View>

                  <Switch
                    value={category.enabled}
                    onValueChange={() => toggleCategory(catKey)}
                    trackColor={{ false: '#334155', true: '#4f46e5' }}
                    thumbColor="#ffffff"
                  />
                </TouchableOpacity>

                {/* Sub Categories Accordion */}
                {isCatExpanded && category.subCategories && (
                  <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 8 }}>
                    {Object.entries(category.subCategories).map(([subKey, subItem]: [string, SubCategoryFlag]) => {
                      const isSubOn = category.enabled && subItem.enabled;
                      return (
                        <View
                          key={subKey}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isSubOn ? '#0f172a' : '#182234',
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            borderRadius: RADIUS.sm,
                            borderWidth: 1,
                            borderColor: isSubOn ? '#334155' : '#1e293b',
                            opacity: category.enabled ? 1 : 0.4,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#f1f5f9' }}>
                              {subItem.nameEn}
                            </Text>
                            <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#64748b' }}>
                              {subItem.namePa}
                            </Text>
                          </View>

                          <Switch
                            value={subItem.enabled && category.enabled}
                            onValueChange={() => toggleSubCategory(catKey, subKey)}
                            disabled={!category.enabled}
                            trackColor={{ false: '#334155', true: '#10b981' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ECommerceSettingsPanel() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [onlinePayEnabled, setOnlinePayEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('999');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSaveEcomSettings = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedNotice('✅ E-Commerce Settings & GST Controls Saved!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setIsCollapsed((prev) => !prev)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#0284c7' }]}>
          <Ionicons name="cart" size={20} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>🛍️ E-Commerce & Shop Control Settings</Text>
          <Text style={styles.cardSub}>
            Configure GST ON/OFF, Free Delivery threshold, COD, Gateway payments & Store maintenance mode.
          </Text>
        </View>
        <Ionicons
          name={isCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
          size={22}
          color="#64748b"
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={{ gap: 12, marginTop: 8 }}>
          {/* GST Tax Calculation Switch */}
          <View style={styles.subToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subToggleTitle}>🏷️ Enable GST Tax Calculations</Text>
              <Text style={styles.subToggleDesc}>Apply 5%, 12%, 18% GST tax rates to product prices</Text>
            </View>
            <Switch
              value={gstEnabled}
              onValueChange={setGstEnabled}
              trackColor={{ false: '#cbd5e1', true: '#0284c7' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Cash on Delivery Payment Switch */}
          <View style={styles.subToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subToggleTitle}>💵 Cash on Delivery (COD) Payment Option</Text>
              <Text style={styles.subToggleDesc}>Allow buyers to pay cash upon order delivery</Text>
            </View>
            <Switch
              value={codEnabled}
              onValueChange={setCodEnabled}
              trackColor={{ false: '#cbd5e1', true: '#16a34a' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Online Gateway Payments Switch */}
          <View style={styles.subToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subToggleTitle}>💳 Online Gateway & UPI Payments</Text>
              <Text style={styles.subToggleDesc}>Enable PhonePe / UPI instant online checkout</Text>
            </View>
            <Switch
              value={onlinePayEnabled}
              onValueChange={setOnlinePayEnabled}
              trackColor={{ false: '#cbd5e1', true: '#16a34a' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Free Shipping Threshold */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#334155' }}>
              🚚 Free Shipping Threshold Amount (₹)
            </Text>
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: '#e2e8f0',
                borderRadius: RADIUS.md,
                paddingHorizontal: 10,
                paddingVertical: 6,
                fontSize: 13,
                fontFamily: FONT.bold,
                color: '#0f172a',
                backgroundColor: '#f8fafc',
              }}
              keyboardType="numeric"
              value={freeShippingThreshold}
              onChangeText={setFreeShippingThreshold}
              placeholder="e.g. 999"
            />
          </View>

          {/* Storefront Maintenance Mode Switch */}
          <View style={styles.subToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subToggleTitle}>🔒 Storefront Maintenance Mode</Text>
              <Text style={styles.subToggleDesc}>Temporarily pause new buyer orders during inventory update</Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: '#cbd5e1', true: '#dc2626' }}
              thumbColor="#ffffff"
            />
          </View>

          {savedNotice ? (
            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#16a34a', textAlign: 'center' }}>
              {savedNotice}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[wStyles.btn, { backgroundColor: '#0284c7' }]}
            onPress={handleSaveEcomSettings}
          >
            <Ionicons name="save-outline" size={16} color="#ffffff" />
            <Text style={wStyles.btnText}>💾 Save E-Commerce Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function SuperSettingsScreen() {
  const router = useRouter();
  const { data: settings, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();
  const [error, setError] = useState<string | null>(null);

  // Sub-tabs navigation state
  const [cpanelSubTab, setCpanelSubTab] = useState<'SWITCHES' | 'MODIFICATIONS' | 'OTHERS'>('SWITCHES');

  // Modals state
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showAdminInfoModal, setShowAdminInfoModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showGuidesModal, setShowGuidesModal] = useState(false);

  // Collapsible accordion states (default collapsed)
  const [isVoiceCollapsed, setIsVoiceCollapsed] = useState(true);
  const [isWhatsappCollapsed, setIsWhatsappCollapsed] = useState(true);

  const isVoiceEnabled = (settings as any)?.groupVoiceCallEnabled ?? true;
  const isWhatsappSyncEnabled = (settings as any)?.whatsappGroupSyncEnabled ?? true;
  const isWhatsappAutoAddEnabled = (settings as any)?.whatsappAutoAddEnabled ?? true;
  const isWhatsappAutoRemoveEnabled = (settings as any)?.whatsappAutoRemoveEnabled ?? true;
  const savedGroupJid = (settings as any)?.whatsappGroupJid ?? '';

  const parseErrorMessage = (err: any): string => {
    const msg = err?.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return err?.message || 'Could not update setting.';
  };

  const handleSaveJid = async (jid: string) => {
    setError(null);
    try {
      await update.mutateAsync({ whatsappGroupJid: jid } as any);
    } catch (err: any) {
      setError(parseErrorMessage(err));
    }
  };

  const handleVoiceToggle = async (val: boolean) => {
    setError(null);
    try {
      await update.mutateAsync({ groupVoiceCallEnabled: val } as any);
    } catch (err: any) {
      setError(parseErrorMessage(err));
    }
  };

  const handleWhatsappToggle = async (val: boolean) => {
    setError(null);
    try {
      await update.mutateAsync({ whatsappGroupSyncEnabled: val } as any);
    } catch (err: any) {
      setError(parseErrorMessage(err));
    }
  };

  const handleAutoAddToggle = async (val: boolean) => {
    setError(null);
    try {
      await update.mutateAsync({ whatsappAutoAddEnabled: val } as any);
    } catch (err: any) {
      setError(parseErrorMessage(err));
    }
  };

  const handleAutoRemoveToggle = async (val: boolean) => {
    setError(null);
    try {
      await update.mutateAsync({ whatsappAutoRemoveEnabled: val } as any);
    } catch (err: any) {
      setError(parseErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <Ionicons name="options-outline" size={24} color="#ffffff" />
          <Text style={styles.heroTitle}>C-Panel — Control Center</Text>
        </View>
        <Text style={styles.heroSubtitle}>Configure system switches, module modifications & admin tools</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {/* ── Sub-Tabs Navigation Bar ── */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          {([
            { id: 'SWITCHES',       label: '🔀 Switches',       icon: 'toggle' },
            { id: 'MODIFICATIONS',  label: '✏️ Modifications',   icon: 'create' },
            { id: 'OTHERS',         label: '📦 Others',          icon: 'grid' },
          ] as const).map((tab) => {
            const active = cpanelSubTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCpanelSubTab(tab.id);
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: RADIUS.pill,
                  backgroundColor: active ? '#dc2626' : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: active ? '#dc2626' : '#e2e8f0',
                  ...premiumShadow('#0f172a', 'sm'),
                }}
              >
                <Ionicons name={tab.icon as any} size={15} color={active ? '#ffffff' : '#475569'} />
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: active ? '#ffffff' : '#334155' }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 1. SWITCHES Tab ── */}
        {cpanelSubTab === 'SWITCHES' ? (
          <View style={{ gap: 14 }}>
            {/* Group Voice Call Feature */}
            <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setIsVoiceCollapsed((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name="mic" size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>🎙️ Group Voice Call Feature</Text>
                  <Text style={styles.cardSub}>
                    Allow Advisors & Admins to host live audio conferences for active farmers.
                  </Text>
                </View>
                <Ionicons
                  name={isVoiceCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
                  size={22}
                  color="#64748b"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>

              {!isVoiceCollapsed && (
                <View style={{ gap: 12, marginTop: 4 }}>
                  <View style={styles.subToggleRow}>
                    <Text style={styles.subToggleText}>Enable Group Voice Calls</Text>
                    {isLoading ? (
                      <ActivityIndicator color={theme.primary} />
                    ) : (
                      <Switch
                        value={isVoiceEnabled}
                        onValueChange={handleVoiceToggle}
                        trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                        thumbColor="#ffffff"
                      />
                    )}
                  </View>

                  <View style={[styles.statusBox, isVoiceEnabled ? styles.statusActive : styles.statusDisabled]}>
                    <View style={[styles.statusDot, { backgroundColor: isVoiceEnabled ? '#16a34a' : '#dc2626' }]} />
                    <Text style={[styles.statusText, { color: isVoiceEnabled ? '#15803d' : '#dc2626' }]}>
                      {isVoiceEnabled
                        ? 'STATUS: ACTIVE (Group Voice Call Enabled)'
                        : 'STATUS: DISABLED (Group Voice Call Disabled)'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* WhatsApp Group Auto Member Management */}
            <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setIsWhatsappCollapsed((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#25d366' }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>💬 WhatsApp Group Member Sync</Text>
                  <Text style={styles.cardSub}>
                    Automatically add active advisor plan farmers & remove expired members from WhatsApp groups.
                  </Text>
                </View>
                <Ionicons
                  name={isWhatsappCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
                  size={22}
                  color="#64748b"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>

              {!isWhatsappCollapsed && (
                <View style={{ gap: 14, marginTop: 4 }}>
                  <View style={styles.subToggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subToggleTitle}>Master Sync Control</Text>
                      <Text style={styles.subToggleDesc}>Turn entire WhatsApp group sync module ON/OFF</Text>
                    </View>
                    {isLoading ? (
                      <ActivityIndicator color={theme.primary} />
                    ) : (
                      <Switch
                        value={isWhatsappSyncEnabled}
                        onValueChange={handleWhatsappToggle}
                        trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                        thumbColor="#ffffff"
                      />
                    )}
                  </View>

                  <View style={[styles.statusBox, isWhatsappSyncEnabled ? styles.statusActive : styles.statusDisabled]}>
                    <View style={[styles.statusDot, { backgroundColor: isWhatsappSyncEnabled ? '#16a34a' : '#dc2626' }]} />
                    <Text style={[styles.statusText, { color: isWhatsappSyncEnabled ? '#15803d' : '#dc2626' }]}>
                      {isWhatsappSyncEnabled
                        ? 'STATUS: ACTIVE (WhatsApp Group Sync Enabled)'
                        : 'STATUS: DISABLED (WhatsApp Group Sync Disabled)'}
                    </Text>
                  </View>

                  {isWhatsappSyncEnabled && (
                    <>
                      <View style={styles.subControlsCard}>
                        <Text style={styles.subControlsHeader}>⚙️ Automated Member Controls</Text>

                        <View style={styles.switchItemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.switchItemTitle}>🟢 Auto-Add Eligible Farmers</Text>
                            <Text style={styles.switchItemSub}>
                              Automatically add farmers with active advisor plans directly to group
                            </Text>
                          </View>
                          <Switch
                            value={isWhatsappAutoAddEnabled}
                            onValueChange={handleAutoAddToggle}
                            trackColor={{ false: '#cbd5e1', true: '#25d366' }}
                            thumbColor="#ffffff"
                          />
                        </View>

                        <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 2 }} />

                        <View style={styles.switchItemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.switchItemTitle}>🔴 Auto-Remove Expired Members</Text>
                            <Text style={styles.switchItemSub}>
                              Automatically remove members whose advisor plans have expired
                            </Text>
                          </View>
                          <Switch
                            value={isWhatsappAutoRemoveEnabled}
                            onValueChange={handleAutoRemoveToggle}
                            trackColor={{ false: '#cbd5e1', true: '#ef4444' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                      </View>

                      <WhatsAppBotPanel
                        savedGroupJid={savedGroupJid}
                        onSaveJid={handleSaveJid}
                      />
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Dynamic Feature Switches Accordion */}
            <CategoryFeatureFlagPanel />

            {/* E-Commerce Global Settings Panel */}
            <ECommerceSettingsPanel />
          </View>

        /* ── 2. MODIFICATIONS Tab ── */
        ) : cpanelSubTab === 'MODIFICATIONS' ? (
          <View style={{ gap: 14 }}>
            {/* 🏷️ Expense Categories Manager */}
            <View style={[styles.card, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#dc2626' }]}>
                  <Ionicons name="pricetags" size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>🏷️ Expense Categories Control</Text>
                  <Text style={styles.cardSub}>Add new categories, edit names & priority, or deactivate unwanted ones</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[wStyles.btn, { backgroundColor: '#dc2626', marginTop: 4 }]}
                onPress={() => setShowCategoriesModal(true)}
              >
                <Ionicons name="open-outline" size={16} color="#ffffff" />
                <Text style={wStyles.btnText}>Open Category Manager Console</Text>
              </TouchableOpacity>
            </View>

            {/* 👑 Admin Info & Brand Details */}
            <View style={[styles.card, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#2563eb' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>👑 Admin Info & Brand Details</Text>
                  <Text style={styles.cardSub}>App Name, Brand Logo, Tagline, Payment UPI & Super Admin Profile</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[wStyles.btn, { backgroundColor: '#2563eb', marginTop: 4 }]}
                onPress={() => setShowAdminInfoModal(true)}
              >
                <Ionicons name="create-outline" size={16} color="#ffffff" />
                <Text style={wStyles.btnText}>Open Admin Info Console</Text>
              </TouchableOpacity>
            </View>

            {/* 💰 Farmer Plan Pricing Manager */}
            <PlanPricingSection />
          </View>

        /* ── 3. OTHERS Tab ── */
        ) : (
          <View style={{ gap: 14 }}>
            {/* Super Admin Shortcuts Grid */}
            <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
              <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                ⚡ SUPER ADMIN SHORTCUTS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: RADIUS.md, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                  onPress={() => router.push('/(tabs)/super-orders' as any)}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="receipt" size={16} color="#4f46e5" />
                  </View>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>Sales Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: RADIUS.md, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                  onPress={() => setShowCategoriesModal(true)}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="pricetags" size={16} color="#dc2626" />
                  </View>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>Categories</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: RADIUS.md, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                  onPress={() => setShowWorkspaceModal(true)}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="briefcase" size={16} color="#0d9488" />
                  </View>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>Workspace</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: RADIUS.md, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                  onPress={() => setShowGuidesModal(true)}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="book" size={16} color="#15803d" />
                  </View>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>User Guides</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: RADIUS.md, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                  onPress={() => router.push('/(tabs)/super-audit-log' as any)}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="time" size={16} color="#b45309" />
                  </View>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>Audit Log</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: RADIUS.md, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                  onPress={() => router.push('/(tabs)/super-crop-edit' as any)}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="leaf" size={16} color="#16a34a" />
                  </View>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>Edit Crop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      {/* ── Modals ── */}
      <SuperAdminExpenseCategoriesModal
        visible={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
      />
      <AdminInfoModal
        visible={showAdminInfoModal}
        onClose={() => setShowAdminInfoModal(false)}
      />
      <SuperAdminWorkspaceModal
        visible={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
      />
      <UserGuidesModal
        visible={showGuidesModal}
        onClose={() => setShowGuidesModal(false)}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 24, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 4 },
  list: { padding: SPACING.lg, gap: 14, paddingBottom: SPACING.xxl },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 16, gap: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  cardSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2, lineHeight: 16 },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  statusActive: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusDisabled: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: FONT.bold },
  subToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  subToggleText: { fontSize: 13, fontFamily: FONT.bold, color: '#334155' },
  subToggleTitle: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  subToggleDesc: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  subControlsCard: {
    backgroundColor: '#f8fafc', borderRadius: RADIUS.md,
    padding: 12, gap: 10, borderWidth: 1, borderColor: '#e2e8f0',
  },
  subControlsHeader: { fontSize: 12, fontFamily: FONT.extraBold, color: '#334155', marginBottom: 2 },
  switchItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  switchItemTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#1e293b' },
  switchItemSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1, lineHeight: 15 },
  rulesBox: { backgroundColor: '#f8fafc', borderRadius: RADIUS.md, padding: 12, gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  rulesTitle: { fontSize: 12, fontFamily: FONT.extraBold, color: '#334155', marginBottom: 2 },
  ruleItem: { fontSize: 11.5, fontFamily: FONT.medium, color: '#475569', lineHeight: 17 },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12, marginTop: 4 },
  placeholderCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  placeholderText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },
  planCardContainer: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#e2e8f0', padding: SPACING.md, gap: 8 },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planCardTitle: { fontSize: 15, fontFamily: FONT.extraBold },
  planCardBadge: { fontSize: 9.5, fontFamily: FONT.bold, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.pill, overflow: 'hidden' },
  planCardSub: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569', marginTop: 1 },
  cardDivider: { height: 1, backgroundColor: '#f1f5f9' },
  cardSection: { gap: 6 },
  cardSectionTitle: { fontSize: 12, fontFamily: FONT.extraBold, color: '#334155' },
  variantRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' },
  variantTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  variantMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  variantEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md },
  variantEditBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 11 },
  featureChipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1 },
  chipOn: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  chipOff: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  featureChipText: { fontSize: 10.5, fontFamily: FONT.bold },
  chipTextOn: { color: '#15803d' },
  chipTextOff: { color: '#dc2626' },
  limitMetaText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 10 },
  sectionTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  helperText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '88%', backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  farmerChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  farmerChipText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#334155' },
  submitBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
});



export function PlanPricingSection() {
  const { data: pricing, isLoading } = useFarmerPlanPricing();
  const [editing, setEditing] = useState<FarmerPlanPricing | null>(null);

  const PLAN_ORDER = ['PRO', 'SMART', 'SUPER'];

  const groupedByPlan = PLAN_ORDER.map((planKey) => {
    const items = (pricing ?? []).filter((p) => p.plan === planKey);
    return { planKey, items };
  }).filter((group) => group.items.length > 0);

  return (
    <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Plan Pricing & Commission Splits</Text>
      <Text style={styles.helperText}>
        Each plan tier (Lite, Pro, Smart) has 1 configuration card.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
      ) : groupedByPlan.length === 0 ? (
        <Text style={styles.emptyText}>No pricing configured yet.</Text>
      ) : (
        <View style={{ gap: 14, marginTop: 4 }}>
          {groupedByPlan.map(({ planKey, items }) => {
            const planColor = planKey === 'PRO' ? '#6d28d9' : planKey === 'SMART' ? '#1d4ed8' : '#b45309';
            const sampleItem = items[0];

            return (
              <View key={planKey} style={[styles.planCardContainer, premiumShadow('#0f172a', 'sm')]}>
                <View style={styles.planCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Text style={{ fontSize: 24 }}>{planKey === 'PRO' ? '🌾' : planKey === 'SMART' ? '👑' : '🎓'}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.planCardTitle, { color: planColor }]}>
                          {planKey === 'PRO' ? 'Lite Plan' : planKey === 'SMART' ? 'Pro Plan' : 'Smart Plan'}
                        </Text>
                        <Text style={styles.planCardBadge}>{planKey}</Text>
                      </View>
                      <Text style={styles.planCardSub}>{items.length} Duration Option(s)</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>💰 Pricing & Commission Splits</Text>
                  <View style={{ gap: 6 }}>
                    {items.map((p) => (
                      <View key={p.id} style={styles.variantRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.variantTitle}>
                            {p.billingPeriodDays === 365 ? '1 Year (365 Days)' : `${p.billingPeriodDays} Days`} —{' '}
                            <Text style={{ color: '#16a34a', fontFamily: FONT.extraBold }}>₹{p.price}</Text>
                          </Text>
                          <Text style={styles.variantMeta}>
                            Partner Cut: {p.partnerShareType === 'PERCENTAGE' ? `${p.partnerShareValue}%` : `₹${p.partnerShareValue}`}
                            {p.advisorShareValue ? ` · Advisor Cut: ₹${p.advisorShareValue}` : ''}
                            {p.adminShareValue ? ` · Admin Cut: ₹${p.adminShareValue}` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.variantEditBtn, { backgroundColor: planColor }]}
                          activeOpacity={0.85}
                          onPress={() => setEditing(p)}
                        >
                          <Ionicons name="create-outline" size={13} color="#ffffff" />
                          <Text style={styles.variantEditBtnText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <EditPricingModal pricing={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

function EditPricingModal({ pricing, onClose }: { pricing: FarmerPlanPricing | null; onClose: () => void }) {
  const update = useUpdateFarmerPlanPricing();
  const [price, setPrice] = useState('');
  const [billingPeriodDays, setBillingPeriodDays] = useState('');
  const [partnerShareType, setPartnerShareType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [partnerShareValue, setPartnerShareValue] = useState('');
  const [advisorShareValue, setAdvisorShareValue] = useState('');
  const [adminShareValue, setAdminShareValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (pricing) {
      setPrice(String(pricing.price));
      setBillingPeriodDays(String(pricing.billingPeriodDays));
      setPartnerShareType(pricing.partnerShareType);
      setPartnerShareValue(String(pricing.partnerShareValue));
      setAdvisorShareValue(pricing.advisorShareValue ? String(pricing.advisorShareValue) : '');
      setAdminShareValue(pricing.adminShareValue ? String(pricing.adminShareValue) : '');
      setError(null);
    }
  }, [pricing]);

  if (!pricing) return null;

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        plan: pricing.plan,
        payload: {
          price: Number(price),
          billingPeriodDays: Number(billingPeriodDays),
          partnerShareType,
          partnerShareValue: Number(partnerShareValue),
          advisorShareValue: advisorShareValue ? Number(advisorShareValue) : undefined,
          adminShareValue: adminShareValue ? Number(adminShareValue) : undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save pricing.');
    }
  };

  return (
    <Modal visible={!!pricing} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{pricing.plan} Plan Pricing</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Text style={styles.label}>Price (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />

            <Text style={styles.label}>Billing Period (days)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={billingPeriodDays} onChangeText={setBillingPeriodDays} />

            <Text style={styles.label}>Business Partner Share ({partnerShareType === 'FIXED' ? '₹' : '%'})</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={partnerShareValue} onChangeText={setPartnerShareValue} />

            <Text style={styles.label}>Advisor Share (₹, optional)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={advisorShareValue} onChangeText={setAdvisorShareValue} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} disabled={update.isPending} onPress={handleSave}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Pricing</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
