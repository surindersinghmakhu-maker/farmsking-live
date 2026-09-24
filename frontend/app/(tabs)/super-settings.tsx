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
import { useFarmerPlanPricing, useUpdateFarmerPlanPricing, useDeleteFarmerPlanPricing, PLAN_META } from '@/src/hooks/useFarmerPlan';
import { usePendingDoctorChanges, useAdminApproveDoctorChange, useAdminRejectDoctorChange } from '@/src/hooks/useAdvisorAssignments';
import { FarmerPlanPricing, FarmerPlanType } from '@/src/api/farmerPlans.api';
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
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: RADIUS.md,
  },
  btnText: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' },

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
  const { data: settings } = useAppSettings();
  const updateSettings = useUpdateAppSettings();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [onlinePayEnabled, setOnlinePayEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('999');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setMaintenanceMode(!!settings.storefrontMaintenanceMode);
    }
  }, [settings]);

  const handleToggleMaintenance = async (value: boolean) => {
    setMaintenanceMode(value);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateSettings.mutateAsync({ storefrontMaintenanceMode: value });
      setSavedNotice(value ? '🔒 Storefront Maintenance Mode ENABLED!' : '✅ Storefront Maintenance Mode DISABLED!');
      setTimeout(() => setSavedNotice(null), 3500);
    } catch (err: any) {
      const errMsg = Array.isArray(err?.response?.data?.message)
        ? err.response.data.message.join(', ')
        : (err?.response?.data?.message || err?.message || 'Could not save settings.');
      setSavedNotice(`❌ ${errMsg}`);
      setTimeout(() => setSavedNotice(null), 4000);
    }
  };

  const handleSaveEcomSettings = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateSettings.mutateAsync({ storefrontMaintenanceMode: maintenanceMode });
      setSavedNotice('✅ E-Commerce Settings Saved!');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch (err: any) {
      const errMsg = Array.isArray(err?.response?.data?.message)
        ? err.response.data.message.join(', ')
        : (err?.response?.data?.message || err?.message || 'Could not save settings.');
      setSavedNotice(`❌ ${errMsg}`);
      setTimeout(() => setSavedNotice(null), 4000);
    }
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
              onValueChange={handleToggleMaintenance}
              trackColor={{ false: '#cbd5e1', true: '#dc2626' }}
              thumbColor="#ffffff"
            />
          </View>

          {savedNotice ? (
            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: maintenanceMode ? '#dc2626' : '#16a34a', textAlign: 'center' }}>
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

function OtpDeliveryChannelPanel() {
  const { data: settings } = useAppSettings();
  const update = useUpdateAppSettings();
  const [selectedChannel, setSelectedChannel] = useState<string>((settings as any)?.otpDeliveryChannel ?? 'WHATSAPP');
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if ((settings as any)?.otpDeliveryChannel) {
      setSelectedChannel((settings as any).otpDeliveryChannel);
    }
  }, [settings]);

  const handleSelectChannel = async (channel: string) => {
    setSelectedChannel(channel);
    try {
      await update.mutateAsync({ otpDeliveryChannel: channel } as any);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      alert('Failed to update OTP Delivery Channel');
    }
  };

  const CHANNELS = [
    { id: 'WHATSAPP', label: '💬 WhatsApp Direct', icon: 'logo-whatsapp', desc: 'Send OTP via WhatsApp Bot' },
    { id: 'SMS', label: '📱 SMS Text Message', icon: 'chatbox-text-outline', desc: 'Send OTP via Mobile SMS' },
    { id: 'EMAIL', label: '📧 Email OTP', icon: 'mail-outline', desc: 'Send OTP via User Email' },
    { id: 'ALL', label: '⚡ All Channels', icon: 'flash-outline', desc: 'Send OTP across WhatsApp, SMS & Email simultaneously' },
  ];

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#faf5ff', borderColor: '#e9d5ff', borderWidth: 1 }]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setIsCollapsed((prev) => !prev)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#9333ea' }]}>
          <Ionicons name="key" size={20} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>🔑 New User OTP Delivery Channel</Text>
          <Text style={styles.cardSub}>Select channel to deliver OTP codes for registration & forgot password</Text>
        </View>
        <Ionicons
          name={isCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
          size={22}
          color="#64748b"
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={{ gap: 8, marginTop: 8 }}>
          {CHANNELS.map((ch) => {
            const isSelected = selectedChannel === ch.id;
            return (
              <TouchableOpacity
                key={ch.id}
                style={[
                  styles.subToggleRow,
                  { paddingVertical: 10, paddingHorizontal: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: isSelected ? '#9333ea' : '#e9d5ff', backgroundColor: isSelected ? '#f3e8ff' : '#ffffff' }
                ]}
                onPress={() => handleSelectChannel(ch.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: isSelected ? '#7e22ce' : '#334155' }}>{ch.label}</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>{ch.desc}</Text>
                </View>
                <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? '#9333ea' : '#cbd5e1'} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ReferralBonusSettingsPanel() {
  const { data: settings } = useAppSettings();
  const update = useUpdateAppSettings();
  const [referralBonus, setReferralBonus] = useState<string>('10');
  const [newUserBonus, setNewUserBonus] = useState<string>('10');
  const [paidPlanBonus, setPaidPlanBonus] = useState<string>('50');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setReferralBonus(String(settings.referralSignupBonusAmount ?? 10));
      setNewUserBonus(String(settings.newUserSignupBonusAmount ?? 10));
      setPaidPlanBonus(String(settings.referralPaidPlanBonusAmount ?? 50));
    }
  }, [settings]);

  const handleSave = async () => {
    const refVal = parseFloat(referralBonus);
    const newVal = parseFloat(newUserBonus);
    const paidVal = parseFloat(paidPlanBonus);
    if (isNaN(refVal) || refVal < 0 || isNaN(newVal) || newVal < 0 || isNaN(paidVal) || paidVal < 0) {
      alert('Please enter valid non-negative bonus amounts.');
      return;
    }

    try {
      setSaving(true);
      await update.mutateAsync({
        referralSignupBonusAmount: refVal,
        newUserSignupBonusAmount: newVal,
        referralPaidPlanBonusAmount: paidVal,
      });
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSavedNotice('✅ Referral & Signup Wallet Bonus amounts saved successfully!');
      setTimeout(() => setSavedNotice(null), 3500);
    } catch {
      alert('❌ Failed to update referral bonus settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1.5, padding: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={[styles.iconCircle, { backgroundColor: '#16a34a', width: 34, height: 34, borderRadius: 17 }]}>
            <Ionicons name="gift" size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' }}>🎁 Referral & Welcome Bonus Settings</Text>
            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#166534' }}>Set instant signup, welcome offer & referee paid plan bonuses</Text>
          </View>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', gap: 5 }}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={15} color="#ffffff" />
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 3 Bonus Inputs in Single Compact Row Grid */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#86efac', gap: 4 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#166534' }} numberOfLines={1}>
            🤝 Referrer Bonus (₹)
          </Text>
          <TextInput
            style={{
              height: 34,
              borderWidth: 1,
              borderColor: '#cbd5e1',
              borderRadius: RADIUS.sm,
              paddingHorizontal: 8,
              fontSize: 13,
              fontFamily: FONT.extraBold,
              color: '#0f172a',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
            }}
            keyboardType="numeric"
            value={referralBonus}
            onChangeText={setReferralBonus}
            placeholder="10"
          />
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#86efac', gap: 4 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#166534' }} numberOfLines={1}>
            🎉 New User Offer (₹)
          </Text>
          <TextInput
            style={{
              height: 34,
              borderWidth: 1,
              borderColor: '#cbd5e1',
              borderRadius: RADIUS.sm,
              paddingHorizontal: 8,
              fontSize: 13,
              fontFamily: FONT.extraBold,
              color: '#0f172a',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
            }}
            keyboardType="numeric"
            value={newUserBonus}
            onChangeText={setNewUserBonus}
            placeholder="10"
          />
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#86efac', gap: 4 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d' }} numberOfLines={1}>
            👑 Paid Plan Bonus (₹)
          </Text>
          <TextInput
            style={{
              height: 34,
              borderWidth: 1,
              borderColor: '#cbd5e1',
              borderRadius: RADIUS.sm,
              paddingHorizontal: 8,
              fontSize: 13,
              fontFamily: FONT.extraBold,
              color: '#0f172a',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
            }}
            keyboardType="numeric"
            value={paidPlanBonus}
            onChangeText={setPaidPlanBonus}
            placeholder="50"
          />
        </View>
      </View>

      {savedNotice ? (
        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#16a34a', marginTop: 4, textAlign: 'center' }}>
          {savedNotice}
        </Text>
      ) : null}
    </View>
  );

}

import { APP_VERSION } from '@/src/constants/version';

function AppDownloadSettingsPanel() {
  const { data: settings } = useAppSettings();
  const update = useUpdateAppSettings();
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [version, setVersion] = useState<string>(APP_VERSION);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setDownloadUrl(settings.appDownloadUrl || 'https://farmsking.tech/download/farmsking.apk');
      setVersion(settings.latestAppVersion || APP_VERSION);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await update.mutateAsync({
        appDownloadUrl: downloadUrl.trim(),
        latestAppVersion: version.trim() || APP_VERSION,
      });
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSavedNotice('✅ App Download & Version saved!');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch {
      alert('❌ Failed to update App Download settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderWidth: 1.5, padding: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={[styles.iconCircle, { backgroundColor: '#0284c7', width: 34, height: 34, borderRadius: 17 }]}>
            <Ionicons name="logo-android" size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' }}>📱 App Download & Auto Update Link</Text>
            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#0369a1' }}>APK link & latest app version configuration</Text>
          </View>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#0284c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', gap: 5 }}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={15} color="#ffffff" />
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 2 Input Fields in Single Compact Row Grid */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <View style={{ flex: 2.2, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#7dd3fc', gap: 4 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#0369a1' }} numberOfLines={1}>
            🔗 APK / Play Store Link
          </Text>
          <TextInput
            style={{
              height: 34,
              borderWidth: 1,
              borderColor: '#cbd5e1',
              borderRadius: RADIUS.sm,
              paddingHorizontal: 8,
              fontSize: 12,
              fontFamily: FONT.medium,
              color: '#0f172a',
              backgroundColor: '#f8fafc',
            }}
            value={downloadUrl}
            onChangeText={setDownloadUrl}
            placeholder="https://farmsking.tech/download/farmsking.apk"
            autoCapitalize="none"
          />
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#7dd3fc', gap: 4 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#0369a1' }} numberOfLines={1}>
            🏷️ App Version
          </Text>
          <TextInput
            style={{
              height: 34,
              borderWidth: 1,
              borderColor: '#cbd5e1',
              borderRadius: RADIUS.sm,
              paddingHorizontal: 8,
              fontSize: 13,
              fontFamily: FONT.extraBold,
              color: '#0f172a',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
            }}
            value={version}
            onChangeText={setVersion}
            placeholder={APP_VERSION}
          />
        </View>
      </View>

      {savedNotice ? (
        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0284c7', marginTop: 4, textAlign: 'center' }}>
          {savedNotice}
        </Text>
      ) : null}
    </View>
  );
}

function FreeTrialSettingsPanel() {
  const { data: settings } = useAppSettings();
  const update = useUpdateAppSettings();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [days, setDays] = useState<string>('14');
  const [targetPlan, setTargetPlan] = useState<'PRO' | 'SMART' | 'SUPER'>('SUPER');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.freeTrialEnabled ?? true);
      setDays(String(settings.freeTrialDays ?? 14));
      setTargetPlan(settings.freeTrialPlan ?? 'SUPER');
    }
  }, [settings]);

  const handleSave = async () => {
    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays <= 0) {
      alert('Please enter valid trial days.');
      return;
    }
    try {
      setSaving(true);
      await update.mutateAsync({
        freeTrialEnabled: enabled,
        freeTrialDays: numDays,
        freeTrialPlan: targetPlan,
      });
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSavedNotice('✅ Free Trial saved!');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch {
      alert('❌ Failed to update Free Trial settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#fdf4ff', borderColor: '#f5d0fe', borderWidth: 1.5, padding: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={[styles.iconCircle, { backgroundColor: '#c026d3', width: 34, height: 34, borderRadius: 17 }]}>
            <Ionicons name="gift-outline" size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' }}>🎁 Free Membership Trial Settings</Text>
            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#86198f' }}>Configure free trial status, duration & plan tier</Text>
          </View>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#c026d3', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', gap: 5 }}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={15} color="#ffffff" />
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 3 Controls in Single Compact Row Grid */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
        {/* Col 1: Switch */}
        <View style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#f5d0fe', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#86198f' }}>
            Enable Trial
          </Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#cbd5e1', true: '#c026d3' }}
            thumbColor="#ffffff"
            style={{ transform: Platform.OS === 'web' ? [] : [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>

        {/* Col 2: Days */}
        <View style={{ width: 80, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#f5d0fe', gap: 4 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#86198f' }} numberOfLines={1}>
            ⏳ Days
          </Text>
          <TextInput
            style={{
              height: 34,
              borderWidth: 1,
              borderColor: '#cbd5e1',
              borderRadius: RADIUS.sm,
              paddingHorizontal: 8,
              fontSize: 13,
              fontFamily: FONT.extraBold,
              color: '#0f172a',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
            }}
            keyboardType="numeric"
            value={days}
            onChangeText={setDays}
            placeholder="14"
          />
        </View>

        {/* Col 3: Plan Tier */}
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#f5d0fe', gap: 4 }}>
          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#86198f' }} numberOfLines={1}>
            👑 Target Plan Tier
          </Text>
          <View style={{ flexDirection: 'row', gap: 4, height: 34, alignItems: 'center' }}>
            {(['PRO', 'SMART', 'SUPER'] as const).map((p) => {
              const isSelected = targetPlan === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRadius: RADIUS.sm,
                    borderWidth: 1,
                    borderColor: isSelected ? '#c026d3' : '#cbd5e1',
                    backgroundColor: isSelected ? '#c026d3' : '#f8fafc',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => setTargetPlan(p)}
                >
                  <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: isSelected ? '#ffffff' : '#334155' }}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {savedNotice ? (
        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#c026d3', marginTop: 4, textAlign: 'center' }}>
          {savedNotice}
        </Text>
      ) : null}
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
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroHeaderRow}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="options" size={18} color="#ffffff" />
              </View>
              <Text style={styles.heroTitle}>⚡ C-Panel — Control Center</Text>
            </View>
            <Text style={styles.heroSubtitle}>System Feature Switches · Plan Pricing & Splits · Admin Tools</Text>
          </View>
          <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#334155', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#4ade80' }}>LIVE</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {/* ── Sub-Tabs Navigation Bar ── */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
          {([
            { id: 'SWITCHES',       label: '🔀 Switches',       sub: 'System Toggles', icon: 'toggle' },
            { id: 'MODIFICATIONS',  label: '💰 Plans & Pricing',  sub: 'Pricing & Splits', icon: 'cash' },
            { id: 'OTHERS',         label: '📦 Shortcuts',       sub: 'Admin Tools',    icon: 'grid' },
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
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: RADIUS.lg,
                  backgroundColor: active ? '#dc2626' : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: active ? '#dc2626' : '#e2e8f0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...premiumShadow('#0f172a', 'sm'),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={tab.icon as any} size={15} color={active ? '#ffffff' : '#475569'} />
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.extraBold, color: active ? '#ffffff' : '#0f172a' }}>
                    {tab.label}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: active ? 'rgba(255,255,255,0.85)' : '#64748b', marginTop: 2 }}>
                  {tab.sub}
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

            {/* OTP Delivery Channel Selector */}
            <OtpDeliveryChannelPanel />

            {/* E-Commerce Global Settings Panel */}
            <ECommerceSettingsPanel />
          </View>

        /* ── 2. MODIFICATIONS Tab ── */
        ) : cpanelSubTab === 'MODIFICATIONS' ? (
          <View style={{ gap: 14 }}>
            {/* 🎁 Referral & Signup Wallet Bonus Options */}
            <ReferralBonusSettingsPanel />

            {/* 📱 App Download & APK Update Link Panel */}
            <AppDownloadSettingsPanel />

            {/* 🎁 Free Membership Trial Settings Panel */}
            <FreeTrialSettingsPanel />

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

            {/* 🩺 Doctor Change Approvals Section */}
            <PendingDoctorChangeApprovalsSection />

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



export function PendingDoctorChangeApprovalsSection() {
  const { data: pendingRequests = [], isLoading } = usePendingDoctorChanges();
  const approveMutation = useAdminApproveDoctorChange();
  const rejectMutation = useAdminRejectDoctorChange();

  if (isLoading || pendingRequests.length === 0) return null;

  return (
    <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1.5, marginBottom: 16 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="medical" size={20} color="#d97706" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: '#92400e' }]}>🩺 Doctor Change Approvals ({pendingRequests.length})</Text>
          <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#b45309' }}>
            Farmers requesting to change crop doctors. Inform current doctor before approving.
          </Text>
        </View>
      </View>

      <View style={{ gap: 10, marginTop: 6 }}>
        {pendingRequests.map((req: any) => (
          <View key={req.id} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fde68a' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' }}>🧑‍🌾 {req.farmer?.name} ({req.farmer?.kingId || req.farmer?.mobile})</Text>
                <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' }}>📍 {req.farmer?.district}, {req.farmer?.state}</Text>
              </View>
              <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill }}>
                <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#d97706' }}>PENDING ADMIN</Text>
              </View>
            </View>

            <View style={{ marginTop: 8, padding: 8, backgroundColor: '#f8fafc', borderRadius: RADIUS.sm, gap: 2 }}>
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>🩺 Requested Doctor: Dr. {req.advisor?.name}</Text>
              {req.notes ? <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#dc2626' }}>{req.notes}</Text> : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 36, backgroundColor: '#10b981', borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' }}
                disabled={approveMutation.isPending}
                onPress={() => approveMutation.mutate(req.id)}
              >
                <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 }}>
                  {approveMutation.isPending ? 'Approving...' : 'Approve & Forward to Doctor'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, height: 36, backgroundColor: '#ef4444', borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' }}
                disabled={rejectMutation.isPending}
                onPress={() => rejectMutation.mutate({ id: req.id, reason: 'Doctor change request rejected by Super Admin' })}
              >
                <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 }}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function PlanPricingSection() {
  const { data: pricing, isLoading } = useFarmerPlanPricing();
  const removePricing = useDeleteFarmerPlanPricing();
  const [editingPlanKey, setEditingPlanKey] = useState<string | null>(null);
  const [isSoftwareCollapsed, setIsSoftwareCollapsed] = useState(false);
  const [isCareCollapsed, setIsCareCollapsed] = useState(false);

  const SOFTWARE_PLANS = ['PRO', 'SMART', 'SUPER'];
  const CARE_PLANS = ['SILVER', 'GOLD', 'ROYAL'];

  const softwareGroups = SOFTWARE_PLANS.map((planKey) => ({
    planKey,
    items: (pricing ?? []).filter((p) => p.plan === planKey),
  }));

  const careGroups = CARE_PLANS.map((planKey) => ({
    planKey,
    items: (pricing ?? []).filter((p) => p.plan === planKey),
  }));

  const editingItems = editingPlanKey ? (pricing ?? []).filter((p) => p.plan === editingPlanKey) : [];

  return (
    <View style={{ gap: 16 }}>
      {/* Category 1: Farmer Software Membership Plans */}
      <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1 }]}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}
          onPress={() => setIsSoftwareCollapsed((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="apps" size={20} color="#0284c7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>🎫 Membership Plans</Text>
            <Text style={styles.helperText}>Add, edit & delete software membership plans, MRP, discounted prices, duration days & commission splits</Text>
          </View>
          <Ionicons
            name={isSoftwareCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
            size={22}
            color="#64748b"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        {!isSoftwareCollapsed && (
          isLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
          ) : (
            <View style={{ gap: 12, marginTop: 8 }}>
              {softwareGroups.map(({ planKey, items }) => {
                const meta = PLAN_META[planKey as FarmerPlanType] || { label: planKey, emoji: '🌾', color: '#0284c7' };
                return (
                  <PlanCardGroup
                    key={planKey}
                    planKey={planKey}
                    meta={meta}
                    items={items}
                    onEditTier={() => setEditingPlanKey(planKey)}
                    onDeleteItem={(id) => removePricing.mutate(id)}
                  />
                );
              })}
            </View>
          )
        )}
      </View>

      {/* Category 2: Doctor Crop Care Advisory Plans (Collapsible) */}
      <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1.5 }]}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}
          onPress={() => setIsCareCollapsed((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="medical" size={20} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.sectionTitle, { color: '#92400e' }]}>🩺 Crop Care Plans</Text>
              <View style={{ backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill }}>
                <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>CARE PLANS</Text>
              </View>
            </View>
            <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#b45309', marginTop: 2 }}>
              Dedicated Crop Doctor packages (Silver, Gold, Royal) with plot monitoring & spray schedules
            </Text>
          </View>
          <Ionicons
            name={isCareCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
            size={22}
            color="#b45309"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        {!isCareCollapsed && (
          isLoading ? (
            <ActivityIndicator color="#d97706" style={{ marginVertical: 16 }} />
          ) : (
            <View style={{ gap: 12, marginTop: 8 }}>
              {careGroups.map(({ planKey, items }) => {
                const meta = PLAN_META[planKey as FarmerPlanType] || { label: planKey, emoji: '🩺', color: '#d97706' };
                return (
                  <PlanCardGroup
                    key={planKey}
                    planKey={planKey}
                    meta={meta}
                    items={items}
                    onEditTier={() => setEditingPlanKey(planKey)}
                    onDeleteItem={(id) => removePricing.mutate(id)}
                  />
                );
              })}
            </View>
          )
        )}
      </View>

      <UnifiedPlanManagerModal
        initialPlanKey={editingPlanKey}
        allPricingItems={pricing ?? []}
        onClose={() => setEditingPlanKey(null)}
      />
    </View>
  );
}

function PlanCardGroup({
  planKey,
  meta,
  items,
  onEditTier,
  onDeleteItem,
}: {
  planKey: string;
  meta: { label: string; emoji: string; color: string };
  items: FarmerPlanPricing[];
  onEditTier: () => void;
  onDeleteItem: (id: string) => void;
}) {
  return (
    <View style={[styles.planCardContainer, { borderColor: meta.color + '40', backgroundColor: '#ffffff' }, premiumShadow('#0f172a', 'sm')]}>
      <View style={styles.planCardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.planCardTitle, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.planCardSub}>{items.length} Duration Option(s)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.variantEditBtn, { backgroundColor: meta.color }]}
          activeOpacity={0.85}
          onPress={onEditTier}
        >
          <Ionicons name="create-outline" size={14} color="#ffffff" />
          <Text style={styles.variantEditBtnText}>Edit {meta.label}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardSection}>
        <Text style={styles.cardSectionTitle}>💰 Duration Plans, Prices & Cuts</Text>
        {items.length === 0 ? (
          <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', fontStyle: 'italic' }}>
            No duration options added yet. Click "Edit {meta.label}" above to add duration plans.
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {items.map((p) => (
              <View key={p.id} style={styles.variantRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.variantTitle}>
                    {p.billingPeriodDays === 365 ? '1 Year (365 Days)' : `${p.billingPeriodDays} Days`} —{' '}
                    {p.mrp && Number(p.mrp) > Number(p.price) ? (
                      <Text style={{ textDecorationLine: 'line-through', color: '#94a3b8', fontSize: 12 }}>
                        ₹{p.mrp}{' '}
                      </Text>
                    ) : null}
                    <Text style={{ color: '#16a34a', fontFamily: FONT.extraBold }}>₹{p.price}</Text>
                    {p.isOffer && (
                      <Text style={{ color: '#d97706', fontSize: 11, fontFamily: FONT.bold }}>
                        {' '}🔥 Offer: {p.offerName || 'Special'} @ ₹{p.offerPrice || p.price}
                        {p.offerValidTill ? ` (Till ${formatToDDMMYY(String(p.offerValidTill))})` : ''}
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.variantMeta}>
                    {['SILVER', 'GOLD', 'ROYAL'].includes(planKey) ? 'Advisor Fee' : 'Partner Commission'}: {p.partnerShareType === 'PERCENTAGE' ? `${p.partnerShareValue}%` : `₹${p.partnerShareValue}`}
                    {p.advisorShareValue ? ` · Doctor Fee: ₹${p.advisorShareValue}` : ''}
                    {p.adminShareValue ? ` · Platform Fee: ₹${p.adminShareValue}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ padding: 6, borderRadius: RADIUS.sm, backgroundColor: '#fef2f2' }}
                  onPress={() => onDeleteItem(p.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function formatToDDMMYY(val?: string | null): string {
  if (!val) return '';
  const clean = val.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy.slice(-2)}`;
  }
  return val;
}

function parseDDMMYYToISO(val?: string | null): string | undefined {
  if (!val || !val.trim()) return undefined;
  const str = val.trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const [dd, mm, yy] = parts;
      const yyyy = yy.length === 2 ? `20${yy}` : yy;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
  }
  return str;
}

const SOFTWARE_PLAN_KEYS = ['PRO', 'SMART', 'SUPER'] as const;
const CARE_PLAN_KEYS = ['SILVER', 'GOLD', 'ROYAL'] as const;

function UnifiedPlanManagerModal({
  initialPlanKey,
  allPricingItems,
  onClose,
}: {
  initialPlanKey: string | null;
  allPricingItems: FarmerPlanPricing[];
  onClose: () => void;
}) {
  const update = useUpdateFarmerPlanPricing();
  const remove = useDeleteFarmerPlanPricing();

  const [activeTab, setActiveTab] = useState<string>('PRO');
  const [formItems, setFormItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCareCategory = initialPlanKey ? (CARE_PLAN_KEYS as readonly string[]).includes(initialPlanKey) : false;
  const activePlanTabs = isCareCategory ? CARE_PLAN_KEYS : SOFTWARE_PLAN_KEYS;

  // Plan Feature Switches state
  const [features, setFeatures] = useState<Record<string, boolean>>({
    weather: true,
    satellite: true,
    doctor: true,
    shopDiscount: true,
    mandiRates: true,
    prioritySupport: false,
  });

  useEffect(() => {
    if (initialPlanKey) {
      setActiveTab(initialPlanKey);
    }
  }, [initialPlanKey]);

  useEffect(() => {
    if (!initialPlanKey) return;
    const currentTabItems = allPricingItems.filter((p) => p.plan === activeTab);
    if (currentTabItems.length > 0) {
      setFormItems(
        currentTabItems.map((item) => {
          const mrpNum = Number(item.mrp ?? item.price ?? 0);
          const defaultPlat = Math.round(mrpNum * 0.10);
          const adminFee = item.adminShareValue ? String(item.adminShareValue) : String(defaultPlat);
          const platNum = Number(adminFee || 0);
          const docFeeNum = Number(item.advisorShareValue || 0);
          
          const valNum = Number(item.partnerShareValue ?? 0);
          const type = item.partnerShareType ?? 'FIXED';
          const calculatedAdvisorFee = Math.max(0, Math.round(mrpNum - platNum - docFeeNum));
          const pAmount = item.partnerShareValue ? String(valNum) : String(calculatedAdvisorFee);
          const pPercent = mrpNum > 0 ? String(Math.round((Number(pAmount) / mrpNum) * 100)) : '0';

          return {
            id: item.id,
            mrp: String(item.mrp ?? item.price ?? ''),
            price: String(item.price ?? ''),
            billingPeriodDays: String(item.billingPeriodDays ?? 365),
            isOffer: !!item.isOffer,
            offerName: item.offerName || '',
            offerPrice: item.offerPrice ? String(item.offerPrice) : '',
            offerValidTill: item.offerValidTill ? formatToDDMMYY(item.offerValidTill) : '',
            partnerShareType: type,
            partnerShareValue: pAmount,
            partnerSharePercent: pPercent,
            partnerShareAmount: pAmount,
            advisorShareValue: item.advisorShareValue ? String(item.advisorShareValue) : '',
            adminShareValue: adminFee,
          };
        })
      );
    } else {
      setFormItems([
        {
          id: `new_${Date.now()}`,
          mrp: '1999',
          price: '1999',
          billingPeriodDays: '365',
          isOffer: false,
          offerName: '',
          offerPrice: '',
          offerValidTill: '',
          partnerShareType: 'FIXED',
          partnerShareValue: '1699',
          partnerSharePercent: '85',
          partnerShareAmount: '1699',
          advisorShareValue: '100',
          adminShareValue: '200',
        },
      ]);
    }
    setError(null);
  }, [activeTab, initialPlanKey, allPricingItems]);

  if (!initialPlanKey) return null;

  const handleAddDurationRow = () => {
    setFormItems((prev) => [
      ...prev,
      {
        id: `new_${Date.now()}`,
        mrp: '499',
        price: '299',
        billingPeriodDays: '30',
        isOffer: false,
        offerName: '',
        offerPrice: '',
        offerValidTill: '',
        partnerShareType: 'FIXED',
        partnerShareValue: '399',
        partnerSharePercent: '80',
        partnerShareAmount: '399',
        advisorShareValue: '50',
        adminShareValue: '50',
      },
    ]);
  };

  const handleRemoveDurationRow = async (index: number, itemId?: string) => {
    if (itemId && !itemId.startsWith('new_')) {
      try {
        await remove.mutateAsync(itemId);
      } catch {}
    }
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemField = (index: number, field: string, value: any) => {
    setFormItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      const mrpNum = Number(field === 'mrp' ? value : item.mrp || 0);

      if (field === 'mrp') {
        const platFee = Math.round(mrpNum * 0.10);
        item.adminShareValue = mrpNum > 0 ? String(platFee) : '';
        const docFee = Number(item.advisorShareValue || 0);
        const advisorFee = Math.max(0, Math.round(mrpNum - platFee - docFee));
        item.partnerShareAmount = mrpNum > 0 ? String(advisorFee) : '';
        if (mrpNum > 0 && advisorFee > 0) {
          item.partnerSharePercent = String(Math.round((advisorFee / mrpNum) * 100));
        }
      } else if (field === 'adminShareValue') {
        const platFee = Number(value || 0);
        const docFee = Number(item.advisorShareValue || 0);
        const advisorFee = Math.max(0, Math.round(mrpNum - platFee - docFee));
        item.partnerShareAmount = mrpNum > 0 ? String(advisorFee) : '';
        if (mrpNum > 0 && advisorFee > 0) {
          item.partnerSharePercent = String(Math.round((advisorFee / mrpNum) * 100));
        }
      } else if (field === 'advisorShareValue') {
        const docFee = Number(value || 0);
        const platFee = Number(item.adminShareValue || Math.round(mrpNum * 0.10));
        const advisorFee = Math.max(0, Math.round(mrpNum - platFee - docFee));
        item.partnerShareAmount = mrpNum > 0 ? String(advisorFee) : '';
        if (mrpNum > 0 && advisorFee > 0) {
          item.partnerSharePercent = String(Math.round((advisorFee / mrpNum) * 100));
        }
      } else if (field === 'partnerShareAmount') {
        item.partnerShareType = 'FIXED';
        item.partnerShareValue = value;
        const advFee = Number(value || 0);
        const platFee = Number(item.adminShareValue || Math.round(mrpNum * 0.10));
        const docFee = Math.max(0, Math.round(mrpNum - platFee - advFee));
        item.advisorShareValue = mrpNum > 0 ? String(docFee) : item.advisorShareValue;
        if (mrpNum > 0) {
          item.partnerSharePercent = String(Math.round((advFee / mrpNum) * 100));
        }
      } else if (field === 'partnerSharePercent') {
        item.partnerShareType = 'PERCENTAGE';
        item.partnerShareValue = value;
        const pct = Number(value || 0);
        const advFee = Math.round(mrpNum * (pct / 100));
        item.partnerShareAmount = mrpNum > 0 && value !== '' ? String(advFee) : '';
        const platFee = Number(item.adminShareValue || Math.round(mrpNum * 0.10));
        const docFee = Math.max(0, Math.round(mrpNum - platFee - advFee));
        item.advisorShareValue = mrpNum > 0 ? String(docFee) : item.advisorShareValue;
      }

      copy[index] = item;
      return copy;
    });
  };

  const handleSaveAll = async () => {
    if (formItems.length === 0) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      for (const item of formItems) {
        await update.mutateAsync({
          plan: activeTab,
          payload: {
            mrp: Number(item.mrp || item.price),
            price: Number(item.mrp || item.price),
            billingPeriodDays: Number(item.billingPeriodDays),
            isOffer: !!item.isOffer,
            offerName: item.offerName || undefined,
            offerPrice: item.offerPrice ? Number(item.offerPrice) : undefined,
            offerValidTill: parseDDMMYYToISO(item.offerValidTill),
            partnerShareType: isCareCategory ? 'FIXED' : item.partnerShareType,
            partnerShareValue: isCareCategory ? Number(item.partnerShareAmount || 0) : Number(item.partnerShareValue || 0),
            advisorShareValue: item.advisorShareValue ? Number(item.advisorShareValue) : undefined,
            adminShareValue: item.adminShareValue ? Number(item.adminShareValue) : undefined,
          },
        });
      }
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save pricing plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const planMeta = PLAN_META[activeTab as FarmerPlanType] || { label: activeTab, emoji: '🎫', color: '#0284c7' };

  return (
    <Modal visible={!!initialPlanKey} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxWidth: 580, maxHeight: '92%', borderRadius: RADIUS.xl, padding: 16 }]}>
          {/* Header */}
          <View style={[styles.modalHeaderRow, { marginBottom: 10 }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: (planMeta.color || '#0284c7') + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>{planMeta.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: '#0f172a', fontSize: 15 }]}>
                  {isCareCategory ? '🩺 Crop Care Plan' : '🎫 Membership Plan'} — {planMeta?.label}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                  {isCareCategory
                    ? 'Doctor Fees, Platform Fees, MRP, Offers & Duration Options'
                    : 'Membership Prices, MRP, Platform Fees, Partner Cuts & Special Offers'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={26} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Separate Plan Category Tabs Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>
            {activePlanTabs.map((key) => {
              const meta = PLAN_META[key as FarmerPlanType] || { label: key, emoji: '🌾', color: '#0284c7' };
              const isSelected = activeTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: RADIUS.pill,
                    borderWidth: 1.5,
                    borderColor: isSelected ? meta.color : '#e2e8f0',
                    backgroundColor: isSelected ? meta.color : '#ffffff',
                  }}
                  onPress={() => setActiveTab(key)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13 }}>{meta.emoji}</Text>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: isSelected ? '#ffffff' : '#334155' }}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
            {/* Feature ON/OFF Toggles for Active Plan */}
            <View style={{ backgroundColor: '#f8fafc', borderRadius: RADIUS.lg, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 6 }}>
              <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#334155' }}>
                ⚙️ {planMeta?.label} Features (ON / OFF)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { key: 'weather', label: '🌦️ Weather', val: features.weather },
                  { key: 'satellite', label: '🛰️ Satellite', val: features.satellite },
                  { key: 'doctor', label: '🩺 Doctor Care', val: features.doctor },
                  { key: 'shopDiscount', label: '🛒 Discounts', val: features.shopDiscount },
                  { key: 'mandiRates', label: '📊 Mandi Rates', val: features.mandiRates },
                  { key: 'prioritySupport', label: '⚡ Priority', val: features.prioritySupport },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: RADIUS.pill,
                      borderWidth: 1,
                      borderColor: f.val ? '#bbf7d0' : '#fecaca',
                      backgroundColor: f.val ? '#f0fdf4' : '#fef2f2',
                    }}
                    onPress={() => setFeatures((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={f.val ? 'checkmark-circle' : 'close-circle'} size={13} color={f.val ? '#16a34a' : '#ef4444'} />
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: f.val ? '#15803d' : '#dc2626' }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration Options in Compact Rows */}
            {formItems.map((item, idx) => (
              <View
                key={item.id || idx}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: RADIUS.lg,
                  padding: 10,
                  borderWidth: 1.5,
                  borderColor: item.isOffer ? '#fde68a' : '#e2e8f0',
                  gap: 8,
                  ...premiumShadow('#0f172a', 'sm'),
                }}
              >
                {/* Single Combined Row: Days -> MRP -> Platform Fee -> Doctor Fee -> Advisor Fee -> Trash */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* 1. Days */}
                  <View style={{ width: 60 }}>
                    <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#475569', marginBottom: 2 }} numberOfLines={1}>
                      📅 Days
                    </Text>
                    <TextInput
                      style={{
                        height: 34,
                        borderWidth: 1,
                        borderColor: '#cbd5e1',
                        borderRadius: RADIUS.sm,
                        paddingHorizontal: 4,
                        fontSize: 11,
                        fontFamily: FONT.bold,
                        color: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textAlign: 'center',
                      }}
                      keyboardType="numeric"
                      placeholder="365"
                      value={item.billingPeriodDays}
                      onChangeText={(val) => handleUpdateItemField(idx, 'billingPeriodDays', val)}
                    />
                  </View>

                  {/* 2. MRP */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#475569', marginBottom: 2 }} numberOfLines={1}>
                      🏷️ MRP (₹)
                    </Text>
                    <TextInput
                      style={{
                        height: 34,
                        borderWidth: 1,
                        borderColor: '#cbd5e1',
                        borderRadius: RADIUS.sm,
                        paddingHorizontal: 6,
                        fontSize: 11,
                        fontFamily: FONT.bold,
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                      }}
                      keyboardType="numeric"
                      placeholder="1999"
                      value={item.mrp}
                      onChangeText={(val) => handleUpdateItemField(idx, 'mrp', val)}
                    />
                  </View>

                  {/* 3. Platform Fee (₹) immediately to the right of MRP */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#334155', marginBottom: 2 }} numberOfLines={1}>
                      ⚡ Platform (₹)
                    </Text>
                    <TextInput
                      style={{
                        height: 34,
                        borderWidth: 1,
                        borderColor: '#cbd5e1',
                        borderRadius: RADIUS.sm,
                        paddingHorizontal: 6,
                        fontSize: 11,
                        fontFamily: FONT.bold,
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                      }}
                      keyboardType="numeric"
                      placeholder="10%"
                      value={item.adminShareValue}
                      onChangeText={(val) => handleUpdateItemField(idx, 'adminShareValue', val)}
                    />
                  </View>

                  {/* 4. Doctor Fee (₹) (only for Crop Care plans) */}
                  {isCareCategory && (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#334155', marginBottom: 2 }} numberOfLines={1}>
                        🩺 Doctor (₹)
                      </Text>
                      <TextInput
                        style={{
                          height: 34,
                          borderWidth: 1,
                          borderColor: '#cbd5e1',
                          borderRadius: RADIUS.sm,
                          paddingHorizontal: 6,
                          fontSize: 11,
                          fontFamily: FONT.bold,
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                        keyboardType="numeric"
                        placeholder="Manual"
                        value={item.advisorShareValue}
                        onChangeText={(val) => handleUpdateItemField(idx, 'advisorShareValue', val)}
                      />
                    </View>
                  )}

                  {/* Commision % (for membership plans) */}
                  {!isCareCategory && (
                    <View style={{ flex: 0.8 }}>
                      <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#334155', marginBottom: 2 }} numberOfLines={1}>
                        🤝 Comm %
                      </Text>
                      <TextInput
                        style={{
                          height: 34,
                          borderWidth: 1,
                          borderColor: '#cbd5e1',
                          borderRadius: RADIUS.sm,
                          paddingHorizontal: 6,
                          fontSize: 11,
                          fontFamily: FONT.bold,
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                        keyboardType="numeric"
                        placeholder="%"
                        value={item.partnerSharePercent}
                        onChangeText={(val) => handleUpdateItemField(idx, 'partnerSharePercent', val)}
                      />
                    </View>
                  )}

                  {/* 5. Advisor Fee (₹) / Commision (₹) */}
                  <View style={{ flex: 1.1 }}>
                    <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#334155', marginBottom: 2 }} numberOfLines={1}>
                      {isCareCategory ? '🤝 Advisor (₹)' : '🤝 Commision (₹)'}
                    </Text>
                    <TextInput
                      style={{
                        height: 34,
                        borderWidth: 1,
                        borderColor: '#cbd5e1',
                        borderRadius: RADIUS.sm,
                        paddingHorizontal: 6,
                        fontSize: 11,
                        fontFamily: FONT.bold,
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                      }}
                      keyboardType="numeric"
                      placeholder="Auto"
                      value={item.partnerShareAmount}
                      onChangeText={(val) => handleUpdateItemField(idx, 'partnerShareAmount', val)}
                    />
                  </View>

                  {/* 6. Trash / Delete */}
                  <TouchableOpacity
                    style={{ padding: 6, borderRadius: RADIUS.sm, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', marginTop: 14 }}
                    onPress={() => handleRemoveDurationRow(idx, item.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {/* Compact Row 3: Special Offer (isOffer, offerName, offerPrice, offerValidTill) */}
                <View style={{ backgroundColor: item.isOffer ? '#fffbeb' : '#f8fafc', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: item.isOffer ? '#fde68a' : '#e2e8f0', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: item.isOffer ? '#b45309' : '#475569' }}>
                        🎁 Special Offer Active
                      </Text>
                    </View>
                    <Switch
                      value={item.isOffer}
                      onValueChange={(val) => handleUpdateItemField(idx, 'isOffer', val)}
                      trackColor={{ false: '#cbd5e1', true: '#f59e0b' }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  {item.isOffer && (
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                      <View style={{ flex: 1.5 }}>
                        <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#b45309', marginBottom: 2 }}>Offer Name</Text>
                        <TextInput
                          style={{
                            height: 30, borderWidth: 1, borderColor: '#fde68a', borderRadius: RADIUS.sm,
                            paddingHorizontal: 6, fontSize: 11, fontFamily: FONT.bold, color: '#0f172a', backgroundColor: '#ffffff',
                          }}
                          placeholder="e.g. Festival Offer"
                          value={item.offerName}
                          onChangeText={(val) => handleUpdateItemField(idx, 'offerName', val)}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#b45309', marginBottom: 2 }}>Offer Price (₹)</Text>
                        <TextInput
                          style={{
                            height: 30, borderWidth: 1, borderColor: '#fde68a', borderRadius: RADIUS.sm,
                            paddingHorizontal: 6, fontSize: 11, fontFamily: FONT.bold, color: '#16a34a', backgroundColor: '#ffffff',
                          }}
                          keyboardType="numeric"
                          placeholder="e.g. 499"
                          value={item.offerPrice}
                          onChangeText={(val) => handleUpdateItemField(idx, 'offerPrice', val)}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#b45309', marginBottom: 2 }}>Valid Till</Text>
                        <TextInput
                          style={{
                            height: 30, borderWidth: 1, borderColor: '#fde68a', borderRadius: RADIUS.sm,
                            paddingHorizontal: 6, fontSize: 11, fontFamily: FONT.bold, color: '#0f172a', backgroundColor: '#ffffff',
                          }}
                          placeholder="DD/MM/YY"
                          value={item.offerValidTill}
                          onChangeText={(val) => handleUpdateItemField(idx, 'offerValidTill', val)}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* + Add Duration Plan Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 9,
                borderWidth: 1.5,
                borderColor: planMeta?.color || '#0284c7',
                borderStyle: 'dashed',
                borderRadius: RADIUS.lg,
                backgroundColor: (planMeta?.color || '#0284c7') + '0D',
              }}
              onPress={handleAddDurationRow}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={16} color={planMeta?.color || '#0284c7'} />
              <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: planMeta?.color || '#0284c7' }}>
                + Add Duration Option (e.g. 30 Days)
              </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: planMeta?.color || '#0284c7', borderRadius: RADIUS.lg, height: 42, marginTop: 4 }]}
              disabled={isSubmitting}
              onPress={handleSaveAll}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="save-outline" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Save {planMeta?.label} Plan</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


