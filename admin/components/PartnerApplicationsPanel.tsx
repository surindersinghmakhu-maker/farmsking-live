import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS } from '@/constants/theme';
import { resolveMediaUrl } from '@/src/api/client';
import type { PartnerApplicationItem } from '@/src/api/users.api';
import {
  useApprovePartnerApplication,
  usePartnerApplications,
  useRejectPartnerApplication,
} from '@/src/hooks/useUsersAdmin';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { isStepUpCancelledError } from '@/components/AdminStepUpProvider';

export function PartnerApplicationsPanel() {
  const { isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'REJECTED' | 'APPROVED' | 'ALL'>('PENDING');
  const [searchText, setSearchText] = useState('');

  const { data: allApps = [], isLoading, refetch } = usePartnerApplications('ALL');
  const approveMutation = useApprovePartnerApplication();
  const rejectMutation = useRejectPartnerApplication();

  const [rejectTarget, setRejectTarget] = useState<PartnerApplicationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ label: string; url: string } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const counts = {
    ALL: allApps.length,
    PENDING: allApps.filter((a) => a.status === 'PENDING').length,
    REJECTED: allApps.filter((a) => a.status === 'REJECTED').length,
    APPROVED: allApps.filter((a) => a.status === 'APPROVED').length,
  };

  const filtered = allApps.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (!searchText.trim()) return true;
    const q = searchText.trim().toLowerCase();
    return (
      app.name.toLowerCase().includes(q) ||
      app.mobile.toLowerCase().includes(q) ||
      app.requestedRole.toLowerCase().includes(q) ||
      (app.panNumber || '').toLowerCase().includes(q) ||
      (app.applicantUser?.kingId || '').toLowerCase().includes(q) ||
      (app.storeName || '').toLowerCase().includes(q)
    );
  });

  const handleApprove = async (app: PartnerApplicationItem) => {
    setActionNotice(null);
    try {
      const res = await approveMutation.mutateAsync(app.id);
      setActionNotice(res.message);
      refetch();
    } catch (err: any) {
      if (isStepUpCancelledError(err)) return;
      const msg = err?.response?.data?.message || err?.message || 'Approval failed.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Approval Error', msg);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      setRejectError('Please enter a clear reason (at least 5 characters) so the applicant can fix it.');
      return;
    }
    setRejectError(null);
    try {
      const res = await rejectMutation.mutateAsync({
        id: rejectTarget.id,
        reason: rejectReason.trim(),
      });
      setActionNotice(res.message);
      setRejectTarget(null);
      setRejectReason('');
      refetch();
    } catch (err: any) {
      setRejectError(err?.response?.data?.message || err?.message || 'Could not reject application.');
    }
  };

  return (
    <View style={{ gap: 14, paddingBottom: 32 }}>
      {/* Header & Filter Bar */}
      <View
        style={[
          styles.panelHeader,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={[styles.panelTitle, { color: textColor }]}>
            Partner Self-Signup Approvals &amp; KYC Verification
          </Text>
          <Text style={[styles.panelSub, { color: subTextColor }]}>
            Review Sales Manager, Crop Doctor, Garden Advisor, and Seller KYC submissions. Approving links the role to any existing Client King ID or issues a new King ID after Step-Up 2FA verification.
          </Text>
        </View>

        <View style={[styles.searchWrap, { borderColor: cardBorder, backgroundColor: isLight ? '#f8fafc' : '#090e17' }]}>
          <Ionicons name="search" size={15} color={subTextColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search name, mobile, PAN, King ID..."
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'PENDING', label: `Pending Review (${counts.PENDING})`, color: '#f59e0b' },
            { key: 'REJECTED', label: `Rejected / Editing (${counts.REJECTED})`, color: '#ef4444' },
            { key: 'APPROVED', label: `Approved (${counts.APPROVED})`, color: '#10b981' },
            { key: 'ALL', label: `All Applications (${counts.ALL})`, color: '#38bdf8' },
          ] as const
        ).map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterPill,
                { borderColor: active ? tab.color : cardBorder, backgroundColor: active ? `${tab.color}1F` : cardBg },
              ]}
              onPress={() => setStatusFilter(tab.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, { color: active ? tab.color : subTextColor }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {actionNotice ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          <Text style={styles.successText}>{actionNotice}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginVertical: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="document-text-outline" size={40} color="#64748b" />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} Partner applications found
          </Text>
          <Text style={{ fontSize: 12, color: subTextColor, textAlign: 'center' }}>
            New Partner KYC submissions and edited re-applications will appear here automatically.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {filtered.map((app) => {
            const docs = [
              app.photoUrl ? { label: 'Profile Photo', url: app.photoUrl } : null,
              app.panDocUrl ? { label: 'PAN Card', url: app.panDocUrl } : null,
              app.aadhaarDocUrl ? { label: 'Aadhaar Front', url: app.aadhaarDocUrl } : null,
              app.aadhaarBackUrl ? { label: 'Aadhaar Back', url: app.aadhaarBackUrl } : null,
              app.chequeDocUrl ? { label: 'Cancelled Cheque', url: app.chequeDocUrl } : null,
              app.gstDocUrl ? { label: 'GST Certificate', url: app.gstDocUrl } : null,
            ].filter(Boolean) as { label: string; url: string }[];

            const badgeColor =
              app.status === 'APPROVED' ? '#10b981' : app.status === 'REJECTED' ? '#ef4444' : '#f59e0b';

            return (
              <View
                key={app.id}
                style={[styles.appCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                {/* Top Summary Row */}
                <View style={styles.appTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
                    {app.photoUrl ? (
                      <Image
                        source={{ uri: resolveMediaUrl(app.photoUrl) || app.photoUrl }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={22} color="#94a3b8" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.appName, { color: textColor }]}>{app.name}</Text>
                        <View style={[styles.rolePill, { backgroundColor: 'rgba(245, 158, 11, 0.16)', borderColor: '#f59e0b' }]}>
                          <Text style={styles.rolePillText}>
                            {app.requestedRole === 'AGENT'
                              ? 'Sales Manager'
                              : app.requestedRole === 'NURSERY_OWNER'
                                ? 'Nursery Owner (HSN 0602 Seedlings)'
                                : app.requestedRole === 'SELLER'
                                  ? 'Seller'
                                  : app.advisorType === 'GARDEN'
                                    ? 'Garden Advisor'
                                    : 'Crop Doctor / Advisor'}
                            {app.requestedRole === 'SELLER' && app.sellerType ? ` (${app.sellerType})` : ''}
                          </Text>
                        </View>
                        <View style={[styles.rolePill, { backgroundColor: `${badgeColor}1F`, borderColor: badgeColor }]}>
                          <Text style={[styles.rolePillText, { color: badgeColor }]}>{app.status}</Text>
                        </View>
                        {app.resubmissionCount > 0 ? (
                          <View style={[styles.rolePill, { backgroundColor: 'rgba(56, 189, 248, 0.14)', borderColor: '#38bdf8' }]}>
                            <Text style={[styles.rolePillText, { color: '#38bdf8' }]}>
                              Edited x{app.resubmissionCount}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.appMeta, { color: subTextColor }]}>
                        Mobile: +91 {app.mobile}
                        {app.email ? `  •  Email: ${app.email}` : ''}
                        {app.pincode ? `  •  PIN: ${app.pincode}` : ''}
                        {app.district || app.state ? ` (${[app.village, app.district, app.state].filter(Boolean).join(', ')})` : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {app.status !== 'APPROVED' ? (
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        disabled={rejectMutation.isPending}
                        onPress={() => {
                          setRejectTarget(app);
                          setRejectReason(app.rejectionReason || '');
                          setRejectError(null);
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                        <Text style={styles.rejectBtnText}>Reject with Reason</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        disabled={approveMutation.isPending}
                        onPress={() => handleApprove(app)}
                      >
                        {approveMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={16} color="#fff" />
                            <Text style={styles.approveBtnText}>Approve &amp; Activate</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {/* Existing King ID Sync Indicator */}
                {app.applicantUser ? (
                  <View style={styles.kingSyncBox}>
                    <Ionicons name="key" size={15} color="#10b981" />
                    <Text style={styles.kingSyncText}>
                      Existing User Linked — King ID: <Text style={{ fontFamily: FONT.extraBold }}>{app.applicantUser.kingId || 'Pending'}</Text>
                      {'  '}| Current Roles: {(app.applicantUser.roles?.length ? app.applicantUser.roles : [app.applicantUser.role]).join(', ')}
                      {'  '}(Approval keeps the exact same King ID!)
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.kingSyncBox, { backgroundColor: 'rgba(56, 189, 248, 0.09)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                    <Ionicons name="person-add" size={15} color="#38bdf8" />
                    <Text style={[styles.kingSyncText, { color: '#38bdf8' }]}>
                      New Partner Mobile — Approving will issue a fresh 8-digit King ID automatically.
                    </Text>
                  </View>
                )}

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={[styles.detailBlock, { borderColor: cardBorder }]}>
                    <Text style={[styles.detailHeading, { color: subTextColor }]}>STATUTORY TAX KYC</Text>
                    <Text style={[styles.detailLine, { color: textColor }]}>PAN: {app.panNumber || '—'}</Text>
                    <Text style={[styles.detailLine, { color: textColor }]}>Aadhaar Last 4: ****{app.aadhaarLast4 || '—'}</Text>
                    <Text style={[styles.detailLine, { color: textColor }]}>GSTIN: {app.gstin || 'Not Registered'}</Text>
                  </View>

                  <View style={[styles.detailBlock, { borderColor: cardBorder }]}>
                    <Text style={[styles.detailHeading, { color: subTextColor }]}>BANK &amp; PAYOUTS</Text>
                    <Text style={[styles.detailLine, { color: textColor }]}>Holder: {app.bankAccountHolderName || '—'}</Text>
                    <Text style={[styles.detailLine, { color: textColor }]}>A/C: {app.bankAccountNumber || '—'}  •  IFSC: {app.bankIfsc || '—'}</Text>
                    <Text style={[styles.detailLine, { color: textColor }]}>UPI: {app.upiId || '—'}</Text>
                  </View>

                  {(app.requestedRole === 'ADVISOR' || app.requestedRole === 'SELLER' || app.requestedRole === 'NURSERY_OWNER') ? (
                    <View style={[styles.detailBlock, { borderColor: cardBorder }]}>
                      <Text style={[styles.detailHeading, { color: subTextColor }]}>
                        {app.requestedRole === 'ADVISOR'
                          ? 'ADVISOR CREDENTIALS'
                          : app.requestedRole === 'NURSERY_OWNER'
                            ? 'NURSERY & GREENHOUSE DETAILS'
                            : 'SELLER STORE DETAILS'}
                      </Text>
                      {app.requestedRole === 'ADVISOR' ? (
                        <>
                          <Text style={[styles.detailLine, { color: textColor }]}>Qualification: {app.qualification || '—'}</Text>
                          <Text style={[styles.detailLine, { color: textColor }]}>
                            Experience: {app.yearsExperience ?? 0} yrs  •  {app.specialization || '—'}
                          </Text>
                        </>
                      ) : app.requestedRole === 'NURSERY_OWNER' ? (
                        <>
                          <Text style={[styles.detailLine, { color: textColor }]}>Nursery: {app.storeName || '—'} ({app.legalName || 'Exempt Under HSN 0602'})</Text>
                          <Text style={[styles.detailLine, { color: textColor }]}>Dispatch Hub: {app.pickupAddress || '—'}</Text>
                          <Text style={[styles.detailLine, { color: '#10b981' }]}>GST Status: 100% Tax-Exempt Live Seedlings & Root Plugs (HSN 0602)</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.detailLine, { color: textColor }]}>Store: {app.storeName || '—'} ({app.legalName || 'Individual'})</Text>
                          <Text style={[styles.detailLine, { color: textColor }]}>Pickup: {app.pickupAddress || '—'}</Text>
                        </>
                      )}
                    </View>
                  ) : null}
                </View>

                {app.rejectionReason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonText}>
                      Rejection Reason: {app.rejectionReason}
                    </Text>
                  </View>
                ) : null}

                {/* Document Gallery */}
                {docs.length > 0 ? (
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.detailHeading, { color: subTextColor }]}>
                      UPLOADED KYC DOCUMENTS (Click any document to inspect full size)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                      {docs.map((doc) => {
                        const uri = resolveMediaUrl(doc.url) || doc.url;
                        return (
                          <TouchableOpacity
                            key={doc.label}
                            style={[styles.docTile, { borderColor: cardBorder }]}
                            onPress={() => setPreviewDoc({ label: `${app.name} — ${doc.label}`, url: uri })}
                            activeOpacity={0.85}
                          >
                            <Image source={{ uri }} style={styles.docImage} resizeMode="cover" />
                            <Text style={[styles.docTileLabel, { color: textColor }]}>{doc.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* Reject Reason Modal */}
      <Modal visible={Boolean(rejectTarget)} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Reject Partner Application — {rejectTarget?.name}
            </Text>
            <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>
              Write the exact reason clearly. The applicant will see this message and can edit &amp; resubmit their profile/KYC documents.
            </Text>
            <TextInput
              style={[styles.reasonInput, { color: textColor, borderColor: cardBorder }]}
              multiline
              placeholder="e.g. PAN card photo is blurry / IFSC code mismatch with cheque"
              placeholderTextColor="#64748b"
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            {rejectError ? <Text style={{ color: '#ef4444', fontSize: 12 }}>{rejectError}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setRejectTarget(null)}>
                <Text style={{ color: subTextColor, fontFamily: FONT.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmRejectBtn}
                disabled={rejectMutation.isPending}
                onPress={handleConfirmReject}
              >
                <Text style={{ color: '#fff', fontFamily: FONT.bold }}>
                  {rejectMutation.isPending ? 'Saving...' : 'Confirm Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Document Preview Modal */}
      <Modal visible={Boolean(previewDoc)} transparent animationType="fade" onRequestClose={() => setPreviewDoc(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.previewCard, { backgroundColor: '#090e17', borderColor: '#334155' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: '#f8fafc', fontSize: 14, fontFamily: FONT.bold }}>{previewDoc?.label}</Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {previewDoc ? (
              <Image
                source={{ uri: previewDoc.url }}
                style={{ width: '100%', height: 480, borderRadius: RADIUS.md, backgroundColor: '#020617' }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  panelHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  panelTitle: { fontSize: 16, fontFamily: FONT.bold },
  panelSub: { fontSize: 12, fontFamily: FONT.regular, marginTop: 3 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 40,
    minWidth: 260,
  },
  searchInput: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontFamily: FONT.bold },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  successText: { flex: 1, color: '#10b981', fontSize: 12.5, fontFamily: FONT.bold },
  emptyCard: {
    padding: 36,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontFamily: FONT.bold },
  appCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  appTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e293b' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 15.5, fontFamily: FONT.bold },
  rolePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  rolePillText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#fbbf24' },
  appMeta: { fontSize: 12, fontFamily: FONT.regular, marginTop: 4 },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  approveBtnText: { color: '#fff', fontSize: 12.5, fontFamily: FONT.bold },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: '#ef4444',
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  rejectBtnText: { color: '#ef4444', fontSize: 12.5, fontFamily: FONT.bold },
  kingSyncBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  kingSyncText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#10b981' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailBlock: {
    flex: 1,
    minWidth: 230,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 3,
  },
  detailHeading: { fontSize: 10.5, fontFamily: FONT.bold, letterSpacing: 0.5 },
  detailLine: { fontSize: 12, fontFamily: FONT.medium },
  reasonBox: {
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  reasonText: { color: '#fca5a5', fontSize: 12, fontFamily: FONT.semiBold },
  docTile: {
    width: 140,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  docImage: { width: '100%', height: 92 },
  docTileLabel: { fontSize: 11, fontFamily: FONT.bold, padding: 6, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontFamily: FONT.bold },
  reasonInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 86,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  cancelModalBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  confirmRejectBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  previewCard: {
    width: '100%',
    maxWidth: 760,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 16,
  },
});

