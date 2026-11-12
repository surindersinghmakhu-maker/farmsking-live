import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { lookupPincode } from '@/src/api/pincode.api';
import type { VerifiedLeadStatusType, VerifiedSignupLeadItem } from '@/src/api/users.api';
import {
  useConvertVerifiedLead,
  useUpdateVerifiedLeadNotes,
  useVerifiedLeads,
} from '@/src/hooks/useUsersAdmin';
import { useExecutiveTheme } from '@/src/store/theme-context';

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  CLIENT_LOGIN_OTP: { label: 'Client Login OTP', color: '#38bdf8' },
  FIREBASE_PHONE_OTP: { label: 'Firebase Phone OTP', color: '#a78bfa' },
  REGISTER_OTP: { label: 'Registration Form OTP', color: '#10b981' },
  PARTNER_SIGNUP_OTP: { label: 'Partner Signup OTP', color: '#f59e0b' },
};

const STATUS_BADGES: Record<VerifiedLeadStatusType, { label: string; color: string }> = {
  OTP_CONFIRMED: { label: 'OTP Confirmed · Waiting Follow-Up', color: '#f59e0b' },
  CONVERTED_BY_ADMIN: { label: 'Continued by Admin', color: '#10b981' },
  COMPLETED_SELF: { label: 'Completed Self-Signup', color: '#38bdf8' },
  DISMISSED: { label: 'Dismissed', color: '#94a3b8' },
};

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function summarizeDevice(ua?: string | null): string {
  if (!ua) return 'Device metadata unavailable';
  const browser = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('Chrome/')
      ? 'Chrome'
      : ua.includes('Firefox/')
        ? 'Firefox'
        : ua.includes('Safari/')
          ? 'Safari'
          : 'Web Client';
  const os = ua.includes('Windows')
    ? 'Windows PC'
    : ua.includes('Android')
      ? 'Android Mobile'
      : ua.includes('iPhone') || ua.includes('iPad')
        ? 'Apple iOS'
        : ua.includes('Mac OS')
          ? 'Mac'
          : 'Device';
  return `${browser} · ${os}`;
}

export function VerifiedLeadsPanel() {
  const { isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  const [statusFilter, setStatusFilter] = useState<VerifiedLeadStatusType | 'ALL'>('OTP_CONFIRMED');
  const [searchText, setSearchText] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useVerifiedLeads({
    status: statusFilter,
    search: searchText.trim() || undefined,
  });

  const updateNotesMutation = useUpdateVerifiedLeadNotes();
  const convertMutation = useConvertVerifiedLead();

  // Notes modal state
  const [notesLead, setNotesLead] = useState<VerifiedSignupLeadItem | null>(null);
  const [notesText, setNotesText] = useState('');
  const [notesName, setNotesName] = useState('');
  const [notesPincode, setNotesPincode] = useState('');
  const [notesDistrict, setNotesDistrict] = useState('');
  const [notesState, setNotesState] = useState('');
  const [notesVillage, setNotesVillage] = useState('');
  const [notesError, setNotesError] = useState<string | null>(null);

  // Convert-to-User modal state
  const [convertLead, setConvertLead] = useState<VerifiedSignupLeadItem | null>(null);
  const [convName, setConvName] = useState('');
  const [convRole, setConvRole] = useState<'CUSTOMER' | 'FARMER' | 'GARDENER'>('FARMER');
  const [convPincode, setConvPincode] = useState('');
  const [convPostOffice, setConvPostOffice] = useState('');
  const [convVillage, setConvVillage] = useState('');
  const [convDistrict, setConvDistrict] = useState('');
  const [convState, setConvState] = useState('');
  const [convEmail, setConvEmail] = useState('');
  const [convTankSize, setConvTankSize] = useState<number | null>(null);
  const [convReferralCode, setConvReferralCode] = useState('');
  const [convNotes, setConvNotes] = useState('');
  const [convError, setConvError] = useState<string | null>(null);
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);

  const counts = data?.counts ?? {
    total: 0,
    otpConfirmed: 0,
    completedSelf: 0,
    convertedByAdmin: 0,
    dismissed: 0,
  };
  const items = data?.items ?? [];

  const openNotesModal = (lead: VerifiedSignupLeadItem) => {
    setNotesLead(lead);
    setNotesText(lead.adminNotes || '');
    setNotesName(lead.capturedName || '');
    setNotesPincode(lead.pincode || '');
    setNotesDistrict(lead.district || '');
    setNotesState(lead.state || '');
    setNotesVillage(lead.village || '');
    setNotesError(null);
  };

  const handleSaveNotes = async () => {
    if (!notesLead) return;
    if (notesPincode.trim() && !/^\d{6}$/.test(notesPincode.trim())) {
      setNotesError('PIN code must be exactly 6 digits.');
      return;
    }
    setNotesError(null);
    try {
      const res = await updateNotesMutation.mutateAsync({
        id: notesLead.id,
        payload: {
          adminNotes: notesText.trim(),
          capturedName: notesName.trim() || undefined,
          pincode: notesPincode.trim() || undefined,
          district: notesDistrict.trim() || undefined,
          state: notesState.trim() || undefined,
          village: notesVillage.trim() || undefined,
        },
      });
      setActionNotice(res.message);
      setNotesLead(null);
      refetch();
    } catch (err: any) {
      setNotesError(err?.response?.data?.message || err?.message || 'Could not save notes.');
    }
  };

  const handleToggleDismiss = async (lead: VerifiedSignupLeadItem) => {
    setActionNotice(null);
    const nextStatus = lead.status === 'DISMISSED' ? 'OTP_CONFIRMED' : 'DISMISSED';
    try {
      const res = await updateNotesMutation.mutateAsync({
        id: lead.id,
        payload: { status: nextStatus },
      });
      setActionNotice(res.message);
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not update lead status.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Update Failed', msg);
    }
  };

  const openConvertModal = (lead: VerifiedSignupLeadItem) => {
    setConvertLead(lead);
    setConvName(lead.capturedName || '');
    const defaultRole =
      lead.intendedRole === 'GARDENER'
        ? 'GARDENER'
        : lead.intendedRole === 'CUSTOMER'
          ? 'CUSTOMER'
          : 'FARMER';
    setConvRole(defaultRole);
    setConvPincode(lead.pincode || '');
    setConvPostOffice('');
    setConvVillage(lead.village || '');
    setConvDistrict(lead.district || '');
    setConvState(lead.state || '');
    setConvEmail(lead.capturedEmail || '');
    setConvTankSize(null);
    setConvReferralCode(lead.referralCode || '');
    setConvNotes(lead.adminNotes || '');
    setConvError(null);
  };

  const handlePinLookup = async () => {
    const cleanPin = convPincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setConvError('Enter a valid 6-digit PIN code first.');
      return;
    }
    setConvError(null);
    setIsLookingUpPin(true);
    try {
      const res = await lookupPincode(cleanPin);
      setConvPostOffice(res.postOffice);
      setConvDistrict(res.district);
      setConvState(res.state);
    } catch (err: any) {
      setConvError(err?.message || 'PIN code lookup failed.');
    } finally {
      setIsLookingUpPin(false);
    }
  };

  const handleConfirmConvert = async () => {
    if (!convertLead) return;
    if (!convName.trim()) {
      setConvError('Please enter the user full name before creating the account.');
      return;
    }
    if (convPincode.trim() && !/^\d{6}$/.test(convPincode.trim())) {
      setConvError('PIN code must be exactly 6 digits.');
      return;
    }
    setConvError(null);
    try {
      const res = await convertMutation.mutateAsync({
        id: convertLead.id,
        payload: {
          name: convName.trim(),
          role: convRole,
          pincode: convPincode.trim() || undefined,
          postOffice: convPostOffice.trim() || undefined,
          village: convVillage.trim() || undefined,
          district: convDistrict.trim() || undefined,
          state: convState.trim() || undefined,
          email: convEmail.trim() || undefined,
          sprayTankSizeL: convRole === 'FARMER' && convTankSize ? convTankSize : undefined,
          referralCode: convReferralCode.trim() || undefined,
          adminNotes: convNotes.trim() || undefined,
        },
      });
      setActionNotice(res.message);
      setConvertLead(null);
      refetch();
    } catch (err: any) {
      setConvError(err?.response?.data?.message || err?.message || 'Account creation failed.');
    }
  };

  const filterPills: { key: VerifiedLeadStatusType | 'ALL'; label: string; color: string }[] = [
    { key: 'OTP_CONFIRMED', label: `Waiting Follow-Up (${counts.otpConfirmed})`, color: '#f59e0b' },
    { key: 'CONVERTED_BY_ADMIN', label: `Continued by Admin (${counts.convertedByAdmin})`, color: '#10b981' },
    { key: 'COMPLETED_SELF', label: `Self-Completed (${counts.completedSelf})`, color: '#38bdf8' },
    { key: 'DISMISSED', label: `Dismissed (${counts.dismissed})`, color: '#94a3b8' },
    { key: 'ALL', label: `All Verified (${counts.total})`, color: '#a78bfa' },
  ];

  return (
    <View style={{ gap: 14, paddingBottom: 32 }}>
      {/* Header Banner */}
      <View style={[styles.panelHeader, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={{ flex: 1, minWidth: 260, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="shield-checkmark" size={18} color="#10b981" />
            <Text style={[styles.panelTitle, { color: textColor }]}>
              First-Time Verified OTP Signup Leads
            </Text>
          </View>
          <Text style={[styles.panelSub, { color: subTextColor }]}>
            Strictly logs unregistered phone numbers only after OTP confirmation succeeds (mistyped unconfirmed numbers are excluded). Follow up with the caller, add details, or continue their profile into an active account.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <View style={[styles.searchWrap, { borderColor: cardBorder, backgroundColor: isLight ? '#f8fafc' : '#090e17' }]}>
            <Ionicons name="search" size={15} color={subTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search mobile, name, location, King ID..."
              placeholderTextColor="#64748b"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: cardBorder, backgroundColor: cardBg }]}
            onPress={() => refetch()}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={15} color="#10b981" />
            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#10b981' }}>
              {isFetching ? 'Syncing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {filterPills.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterPill,
                {
                  borderColor: active ? tab.color : cardBorder,
                  backgroundColor: active ? `${tab.color}1F` : cardBg,
                },
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
        <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 40 }} />
      ) : items.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="call-outline" size={40} color="#64748b" />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No verified first-time OTP leads match this filter
          </Text>
          <Text style={{ fontSize: 12, color: subTextColor, textAlign: 'center', maxWidth: 460 }}>
            Whenever a brand-new visitor enters their mobile number and successfully confirms OTP during login or signup, their verified record appears here automatically.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {items.map((lead) => {
            const channelMeta = CHANNEL_LABELS[lead.sourceChannel] || {
              label: lead.sourceChannel,
              color: '#38bdf8',
            };
            const statusMeta = STATUS_BADGES[lead.status] || STATUS_BADGES.OTP_CONFIRMED;
            const locationParts = [lead.village, lead.district, lead.state, lead.pincode ? `PIN ${lead.pincode}` : null].filter(Boolean);

            return (
              <View
                key={lead.id}
                style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                {/* Top Summary Bar */}
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1, minWidth: 260, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={[styles.mobileText, { color: textColor }]}>+91 {lead.mobile}</Text>

                      <View style={[styles.badge, { borderColor: channelMeta.color, backgroundColor: `${channelMeta.color}1C` }]}>
                        <Text style={[styles.badgeText, { color: channelMeta.color }]}>{channelMeta.label}</Text>
                      </View>

                      {lead.portal ? (
                        <View style={[styles.badge, { borderColor: '#64748b', backgroundColor: 'rgba(100,116,139,0.14)' }]}>
                          <Text style={[styles.badgeText, { color: isLight ? '#334155' : '#cbd5e1' }]}>{lead.portal} PORTAL</Text>
                        </View>
                      ) : null}

                      <View style={[styles.badge, { borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.14)' }]}>
                        <Text style={[styles.badgeText, { color: '#a78bfa' }]}>
                          OTP Confirmed {lead.attemptCount}x
                        </Text>
                      </View>

                      <View style={[styles.badge, { borderColor: statusMeta.color, backgroundColor: `${statusMeta.color}1F` }]}>
                        <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      First Confirmed: <Text style={{ color: textColor, fontFamily: FONT.semiBold }}>{formatDateTime(lead.otpVerifiedAt)}</Text>
                      {'  ·  '}
                      Latest Confirmation: <Text style={{ color: textColor, fontFamily: FONT.semiBold }}>{formatDateTime(lead.lastAttemptAt)}</Text>
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {lead.status !== 'COMPLETED_SELF' && lead.status !== 'CONVERTED_BY_ADMIN' ? (
                      <>
                        <TouchableOpacity
                          style={styles.convertBtn}
                          onPress={() => openConvertModal(lead)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="person-add" size={14} color="#041b11" />
                          <Text style={styles.convertBtnText}>Continue &amp; Create Account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.secondaryBtn, { borderColor: cardBorder }]}
                          onPress={() => openNotesModal(lead)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="create-outline" size={14} color="#38bdf8" />
                          <Text style={[styles.secondaryBtnText, { color: '#38bdf8' }]}>Call Notes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.secondaryBtn, { borderColor: lead.status === 'DISMISSED' ? '#10b981' : '#64748b' }]}
                          onPress={() => handleToggleDismiss(lead)}
                          disabled={updateNotesMutation.isPending}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={lead.status === 'DISMISSED' ? 'refresh-circle-outline' : 'close-circle-outline'}
                            size={14}
                            color={lead.status === 'DISMISSED' ? '#10b981' : '#94a3b8'}
                          />
                          <Text
                            style={[
                              styles.secondaryBtnText,
                              { color: lead.status === 'DISMISSED' ? '#10b981' : '#94a3b8' },
                            ]}
                          >
                            {lead.status === 'DISMISSED' ? 'Restore Lead' : 'Dismiss'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[styles.secondaryBtn, { borderColor: cardBorder }]}
                        onPress={() => openNotesModal(lead)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="document-text-outline" size={14} color="#38bdf8" />
                        <Text style={[styles.secondaryBtnText, { color: '#38bdf8' }]}>Edit Notes</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Active User Sync Banner when completed or continued */}
                {lead.convertedUser ? (
                  <View style={styles.kingSyncBox}>
                    <Ionicons name="link" size={16} color="#10b981" />
                    <Text style={styles.kingSyncText}>
                      Active Account Linked: <Text style={{ fontFamily: FONT.bold }}>{lead.convertedUser.name}</Text>
                      {' · '}King ID: <Text style={{ fontFamily: FONT.bold }}>{lead.convertedUser.kingId || 'Pending'}</Text>
                      {' · '}Role: {lead.convertedUser.role}
                      {lead.convertedBy ? ` · Created by Admin ${lead.convertedBy.name}` : ''}
                      {lead.convertedAt ? ` on ${formatDateTime(lead.convertedAt)}` : ''}
                    </Text>
                  </View>
                ) : null}

                {/* 2-Column Metadata Grid */}
                <View style={styles.detailsGrid}>
                  <View style={[styles.detailBlock, { borderColor: cardBorder }]}>
                    <Text style={[styles.detailHeading, { color: '#10b981' }]}>CAPTURED SIGNUP DETAILS</Text>
                    <Text style={[styles.detailLine, { color: textColor }]}>
                      Name: {lead.capturedName || 'Not entered yet'}
                    </Text>
                    <Text style={[styles.detailLine, { color: subTextColor }]}>
                      Intended Role: {lead.intendedRole || 'Dropped before role choice'}
                    </Text>
                    <Text style={[styles.detailLine, { color: subTextColor }]}>
                      Location: {locationParts.length > 0 ? locationParts.join(', ') : 'Not captured'}
                    </Text>
                    <Text style={[styles.detailLine, { color: subTextColor }]}>
                      Referral / Email: {lead.referralCode || 'Direct'} · {lead.capturedEmail || 'No email'}
                    </Text>
                  </View>

                  <View style={[styles.detailBlock, { borderColor: cardBorder }]}>
                    <Text style={[styles.detailHeading, { color: '#38bdf8' }]}>VERIFICATION TELEMETRY &amp; FOLLOW-UP</Text>
                    <Text style={[styles.detailLine, { color: textColor }]}>
                      Device: {summarizeDevice(lead.userAgent)}
                    </Text>
                    <Text style={[styles.detailLine, { color: subTextColor }]}>
                      IP Address: {lead.ipAddress || 'Unavailable'}
                    </Text>
                    <Text style={[styles.detailLine, { color: subTextColor }]} numberOfLines={2}>
                      Follow-Up Notes: {lead.adminNotes || 'No call notes added yet'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Call Notes Modal */}
      <Modal
        visible={Boolean(notesLead)}
        transparent
        animationType="fade"
        onRequestClose={() => setNotesLead(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: isLight ? '#fff' : '#0f172a', borderColor: cardBorder }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Follow-Up Details (+91 {notesLead?.mobile})
            </Text>
            <Text style={{ fontSize: 12, color: subTextColor }}>
              Save caller details from phone follow-up before creating their account.
            </Text>

            <View style={{ gap: 10 }}>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                placeholder="Caller Full Name"
                placeholderTextColor="#64748b"
                value={notesName}
                onChangeText={setNotesName}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                  placeholder="6-digit PIN Code"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={notesPincode}
                  onChangeText={setNotesPincode}
                />
                <TextInput
                  style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                  placeholder="Village / Town"
                  placeholderTextColor="#64748b"
                  value={notesVillage}
                  onChangeText={setNotesVillage}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                  placeholder="District"
                  placeholderTextColor="#64748b"
                  value={notesDistrict}
                  onChangeText={setNotesDistrict}
                />
                <TextInput
                  style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                  placeholder="State"
                  placeholderTextColor="#64748b"
                  value={notesState}
                  onChangeText={setNotesState}
                />
              </View>
              <TextInput
                style={[styles.reasonInput, { color: textColor, borderColor: cardBorder }]}
                multiline
                placeholder="Call outcome / Admin follow-up notes..."
                placeholderTextColor="#64748b"
                value={notesText}
                onChangeText={setNotesText}
              />
            </View>

            {notesError ? <Text style={styles.errorText}>{notesError}</Text> : null}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setNotesLead(null)}>
                <Text style={{ color: subTextColor, fontFamily: FONT.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmGreenBtn}
                disabled={updateNotesMutation.isPending}
                onPress={handleSaveNotes}
              >
                <Text style={styles.confirmGreenBtnText}>
                  {updateNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Continue Lead to Active User Account Modal */}
      <Modal
        visible={Boolean(convertLead)}
        transparent
        animationType="fade"
        onRequestClose={() => setConvertLead(null)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScrollCenter} style={{ width: '100%' }}>
            <View style={[styles.modalCard, { maxWidth: 560, backgroundColor: isLight ? '#fff' : '#0f172a', borderColor: cardBorder }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Continue Verified Lead to Active Account
              </Text>
              <Text style={{ fontSize: 12.5, color: subTextColor }}>
                Creates an active FarmsKing account for <Text style={{ color: '#10b981', fontFamily: FONT.bold }}>+91 {convertLead?.mobile}</Text> with a fresh 8-digit King ID, personal invite code, welcome bonus, and WhatsApp activation message.
              </Text>

              <View style={{ gap: 10 }}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>FULL NAME *</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                  placeholder="Enter user full name"
                  placeholderTextColor="#64748b"
                  value={convName}
                  onChangeText={setConvName}
                />

                <Text style={[styles.fieldLabel, { color: subTextColor }]}>SELECT ACCOUNT ROLE *</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(
                    [
                      { key: 'FARMER', label: 'Farmer', color: '#10b981' },
                      { key: 'GARDENER', label: 'Gardener', color: '#38bdf8' },
                      { key: 'CUSTOMER', label: 'Buyer / Customer', color: '#a78bfa' },
                    ] as const
                  ).map((r) => {
                    const selected = convRole === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[
                          styles.rolePickBtn,
                          {
                            borderColor: selected ? r.color : cardBorder,
                            backgroundColor: selected ? `${r.color}22` : 'transparent',
                          },
                        ]}
                        onPress={() => setConvRole(r.key)}
                      >
                        <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: selected ? r.color : subTextColor }}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.fieldLabel, { color: subTextColor }]}>ADDRESS &amp; PIN CODE (OPTIONAL)</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                    placeholder="6-digit PIN Code"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={convPincode}
                    onChangeText={setConvPincode}
                  />
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: '#38bdf8', paddingVertical: 11 }]}
                    onPress={handlePinLookup}
                    disabled={isLookingUpPin}
                  >
                    <Ionicons name="location" size={14} color="#38bdf8" />
                    <Text style={[styles.secondaryBtnText, { color: '#38bdf8' }]}>
                      {isLookingUpPin ? 'Looking up...' : 'Auto-Fill PIN'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                    placeholder="Village / Town"
                    placeholderTextColor="#64748b"
                    value={convVillage}
                    onChangeText={setConvVillage}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                    placeholder="Post Office"
                    placeholderTextColor="#64748b"
                    value={convPostOffice}
                    onChangeText={setConvPostOffice}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                    placeholder="District"
                    placeholderTextColor="#64748b"
                    value={convDistrict}
                    onChangeText={setConvDistrict}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                    placeholder="State"
                    placeholderTextColor="#64748b"
                    value={convState}
                    onChangeText={setConvState}
                  />
                </View>

                {convRole === 'FARMER' ? (
                  <>
                    <Text style={[styles.fieldLabel, { color: subTextColor }]}>SPRAY TANK SIZE (OPTIONAL)</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[15, 20, 25].map((liters) => {
                        const selected = convTankSize === liters;
                        return (
                          <TouchableOpacity
                            key={liters}
                            style={[
                              styles.rolePickBtn,
                              {
                                borderColor: selected ? '#10b981' : cardBorder,
                                backgroundColor: selected ? 'rgba(16,185,129,0.2)' : 'transparent',
                              },
                            ]}
                            onPress={() => setConvTankSize(selected ? null : liters)}
                          >
                            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: selected ? '#10b981' : subTextColor }}>
                              {liters} Liters
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                    placeholder="Email (optional)"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={convEmail}
                    onChangeText={setConvEmail}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, color: textColor, borderColor: cardBorder }]}
                    placeholder="Referral King ID / Code"
                    placeholderTextColor="#64748b"
                    value={convReferralCode}
                    onChangeText={setConvReferralCode}
                  />
                </View>

                <TextInput
                  style={[styles.reasonInput, { minHeight: 68, color: textColor, borderColor: cardBorder }]}
                  multiline
                  placeholder="Call follow-up notes..."
                  placeholderTextColor="#64748b"
                  value={convNotes}
                  onChangeText={setConvNotes}
                />
              </View>

              {convError ? <Text style={styles.errorText}>{convError}</Text> : null}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setConvertLead(null)}>
                  <Text style={{ color: subTextColor, fontFamily: FONT.semiBold }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmGreenBtn}
                  disabled={convertMutation.isPending}
                  onPress={handleConfirmConvert}
                >
                  <Text style={styles.confirmGreenBtnText}>
                    {convertMutation.isPending ? 'Creating Account...' : 'Create Account & Send Welcome'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  panelHeader: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: { fontSize: 16, fontFamily: FONT.bold },
  panelSub: { fontSize: 12, fontFamily: FONT.regular, lineHeight: 17 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    minWidth: 250,
    height: 38,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FONT.medium },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 38,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterText: { fontSize: 12, fontFamily: FONT.bold },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  successText: { flex: 1, fontSize: 13, fontFamily: FONT.semiBold, color: '#10b981' },
  emptyCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontFamily: FONT.bold },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  mobileText: { fontSize: 16, fontFamily: FONT.bold },
  badge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10.5, fontFamily: FONT.bold, letterSpacing: 0.4 },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  convertBtnText: { color: '#041b11', fontSize: 12.5, fontFamily: FONT.bold },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  secondaryBtnText: { fontSize: 12.5, fontFamily: FONT.bold },
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
    minWidth: 250,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 4,
  },
  detailHeading: { fontSize: 10.5, fontFamily: FONT.bold, letterSpacing: 0.5 },
  detailLine: { fontSize: 12, fontFamily: FONT.medium },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  modalScrollCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 16, fontFamily: FONT.bold },
  fieldLabel: { fontSize: 11, fontFamily: FONT.bold, letterSpacing: 0.4, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 84,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  rolePickBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    alignItems: 'center',
  },
  errorText: { fontSize: 12.5, color: '#ef4444', fontFamily: FONT.semiBold },
  cancelModalBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  confirmGreenBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  confirmGreenBtnText: { color: '#041b11', fontSize: 13, fontFamily: FONT.bold },
});

