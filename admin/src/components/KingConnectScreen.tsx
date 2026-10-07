import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  useMyConnections,
  usePendingConnections,
  useSendConnectRequest,
  useRespondToConnect,
  useToggleAutoAccept,
  usePendingSync,
  useRespondToSync,
  useSyncHistory,
  useIncomingDemands,
  useRespondToDemand,
  useOutgoingDemands,
  useIncomingPaymentRequests,
  useRespondToPaymentRequest,
  useOutgoingPaymentRequests,
  useKingActivityFeed,
} from '@/src/hooks/useKingConnect';
import type {
  KingConnectLink,
  P2pSyncRequest,
  DemandRequest,
  KingPaymentRequest,
  ActivityEvent,
} from '@/src/api/kingConnect.api';
import { useAuth } from '@/src/store/auth-context';

type KingTab = 'CONNECTIONS' | 'SYNC' | 'DEMANDS' | 'PAYMENTS' | 'ACTIVITY';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TrustBadge({ level }: { level: string }) {
  if (level === 'NONE') return null;
  const cfg = {
    BASIC: { label: 'Basic', color: '#f59e0b', bg: '#fef3c7' },
    TRUSTED: { label: '🏅 Trusted', color: '#16a34a', bg: '#dcfce7' },
    AUTO_ACCEPT: { label: '⚡ Auto-Accept', color: '#7c3aed', bg: '#ede9fe' },
  }[level] ?? null;
  if (!cfg) return null;
  return (
    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 }}>
      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pending', color: '#b45309', bg: '#fef3c7' },
    ACCEPTED: { label: '✅ Accepted', color: '#15803d', bg: '#dcfce7' },
    REJECTED: { label: '❌ Rejected', color: '#dc2626', bg: '#fef2f2' },
    EXPIRED: { label: 'Expired', color: '#6b7280', bg: '#f3f4f6' },
    COUNTER_PROPOSED: { label: '🔄 Counter', color: '#7c3aed', bg: '#ede9fe' },
    PARTIALLY_ACCEPTED: { label: '⚡ Partial', color: '#0891b2', bg: '#e0f2fe' },
    POSTPONED: { label: '📅 Postponed', color: '#7c3aed', bg: '#ede9fe' },
    CONVERTED_TO_ORDER: { label: '📦 Ordered', color: '#15803d', bg: '#dcfce7' },
  };
  const c = cfg[status] ?? { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 }}>
      <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: c.color }}>{c.label}</Text>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  collapsible,
  isCollapsed,
  onToggle,
}: {
  icon: string;
  title: string;
  count?: number;
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <TouchableOpacity
      style={s.sectionHeader}
      activeOpacity={collapsible ? 0.7 : 1}
      onPress={collapsible ? onToggle : undefined}
    >
      <Ionicons name={icon as any} size={18} color="#7c3aed" />
      <Text style={s.sectionTitle}>{title}</Text>
      {(count ?? 0) > 0 && (
        <View style={s.countBadge}>
          <Text style={s.countBadgeText}>{count}</Text>
        </View>
      )}
      {collapsible && (
        <Ionicons
          name={isCollapsed ? 'chevron-down-circle-outline' : 'chevron-up-circle-outline'}
          size={18}
          color="#7c3aed"
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function ConnectionsTab({ myId }: { myId: string }) {
  const { data: connections = [], isLoading } = useMyConnections();
  const { data: pending = [] } = usePendingConnections();
  const sendRequest = useSendConnectRequest();
  const respond = useRespondToConnect();
  const toggleAuto = useToggleAutoAccept();
  const [searchVal, setSearchVal] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleConnect = () => {
    const val = searchVal.trim();
    if (!val) return Alert.alert('Error', 'Enter a King ID (FK-XXXXXX) or Mobile Number');
    const isMobile = /^\d{10}$/.test(val);
    sendRequest.mutate(
      isMobile ? { mobile: val } : { kingId: val },
      {
        onSuccess: () => {
          setSearchVal('');
          setShowSearch(false);
          Alert.alert('✅ Request Sent!', 'Waiting for the other user to accept.');
        },
        onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send request'),
      }
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Search / Connect */}
      <TouchableOpacity style={s.connectBtn} onPress={() => setShowSearch(!showSearch)}>
        <Ionicons name="person-add-outline" size={16} color="#fff" />
        <Text style={s.connectBtnText}>+ Connect New Party</Text>
      </TouchableOpacity>
      {showSearch && (
        <View style={s.searchBox}>
          <TextInput
            style={s.searchInput}
            placeholder="Enter King ID (FK-XXXXXX) or 10-digit Mobile"
            placeholderTextColor="#9ca3af"
            value={searchVal}
            onChangeText={setSearchVal}
            autoFocus
          />
          <TouchableOpacity style={s.searchSendBtn} onPress={handleConnect} disabled={sendRequest.isPending}>
            {sendRequest.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Pending Incoming Requests */}
      {pending.length > 0 && (
        <>
          <SectionHeader icon="notifications-outline" title="Incoming Requests" count={pending.length} />
          {pending.map((link) => (
            <View key={link.id} style={s.requestCard}>
              <View style={s.requestCardLeft}>
                <View style={s.avatarCircle}>
                  <Ionicons name="person" size={20} color="#7c3aed" />
                </View>
                <View>
                  <Text style={s.requestName}>{link.initiator.name}</Text>
                  <Text style={s.requestMeta}>{link.initiator.kingId || link.initiator.mobile}</Text>
                  {link.initiator.village && <Text style={s.requestMeta}>{link.initiator.village}</Text>}
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity
                  style={s.acceptBtn}
                  onPress={() => respond.mutate({ linkId: link.id, response: 'ACCEPTED' })}
                >
                  <Text style={s.acceptBtnText}>✅ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.declineBtn}
                  onPress={() => respond.mutate({ linkId: link.id, response: 'DECLINED' })}
                >
                  <Text style={s.declineBtnText}>❌ Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* My Connections */}
      <SectionHeader icon="link-outline" title="My Connections" count={connections.length} />
      {isLoading && <ActivityIndicator color="#7c3aed" style={{ marginVertical: 20 }} />}
      {connections.length === 0 && !isLoading && (
        <Text style={s.emptyText}>No connections yet. Add parties by King ID or mobile.</Text>
      )}
      {connections.map((link) => {
        const other = link.initiatorId === myId ? link.receiver : link.initiator;
        const myAutoAccept = link.initiatorId === myId ? link.initiatorAutoAccept : link.receiverAutoAccept;
        return (
          <View key={link.id} style={s.connectionCard}>
            <View style={s.connectionLeft}>
              <View style={[s.avatarCircle, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name="person" size={20} color="#7c3aed" />
              </View>
              <View>
                <Text style={s.connectionName}>{other.name}</Text>
                <Text style={s.connectionMeta}>{other.kingId || other.mobile}</Text>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 3 }}>
                  <TrustBadge level={link.trustLevel} />
                  <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99 }}>
                    <Text style={{ fontSize: 9, color: '#6b7280', fontFamily: FONT.medium }}>
                      {link.acceptedCount} verified entries
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[s.autoAcceptToggle, { backgroundColor: myAutoAccept ? '#7c3aed' : '#e5e7eb' }]}
              onPress={() => toggleAuto.mutate(link.id)}
            >
              <Ionicons name={myAutoAccept ? 'flash' : 'flash-outline'} size={12} color={myAutoAccept ? '#fff' : '#6b7280'} />
              <Text style={[s.autoAcceptText, { color: myAutoAccept ? '#fff' : '#6b7280' }]}>
                {myAutoAccept ? 'Auto' : 'Manual'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

function SyncTab({ myId }: { myId: string }) {
  const { data: pending = [], isLoading } = usePendingSync();
  const { data: history = [] } = useSyncHistory();
  const respond = useRespondToSync();
  const [counterModal, setCounterModal] = useState<{ open: boolean; syncId: string; amount: string }>({ open: false, syncId: '', amount: '' });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; syncId: string; reason: string }>({ open: false, syncId: '', reason: '' });

  const pendingList = pending.filter((s) => s.status === 'PENDING');
  const historyList = history.filter((s) => s.status !== 'PENDING');

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionHeader icon="swap-horizontal-outline" title="Pending Sync Requests" count={pendingList.length} />
      {isLoading && <ActivityIndicator color="#7c3aed" style={{ marginVertical: 20 }} />}
      {pendingList.length === 0 && !isLoading && (
        <Text style={s.emptyText}>No pending sync requests. You're all caught up! ✅</Text>
      )}
      {pendingList.map((req) => (
        <View key={req.id} style={s.syncCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <View style={{ backgroundColor: '#ede9fe', padding: 4, borderRadius: 6 }}>
                <Ionicons name="swap-horizontal" size={14} color="#7c3aed" />
              </View>
              <Text style={s.syncFrom}>{req.sender?.name ?? 'Unknown'}</Text>
              <Ionicons name="arrow-forward" size={12} color="#9ca3af" />
              <Text style={s.syncFrom}>You</Text>
            </View>
            <Text style={s.syncReason}>{req.reason}</Text>
            <Text style={s.syncType}>{req.transactionType.replace(/_/g, ' ')}</Text>
            <Text style={s.syncAmount}>₹{Number(req.amount).toLocaleString('en-IN')}</Text>
            {req.refBillNo && <Text style={s.syncMeta}>Ref: {req.refBillNo}</Text>}
          </View>
          <View style={{ gap: 5, alignItems: 'flex-end' }}>
            <TouchableOpacity
              style={s.acceptBtn}
              onPress={() => respond.mutate({ syncId: req.id, payload: { response: 'ACCEPTED' } })}
            >
              <Text style={s.acceptBtnText}>✅ Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.declineBtn, { backgroundColor: '#ede9fe' }]}
              onPress={() => setCounterModal({ open: true, syncId: req.id, amount: String(Number(req.amount)) })}
            >
              <Text style={[s.declineBtnText, { color: '#7c3aed' }]}>🔄 Counter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.declineBtn}
              onPress={() => setRejectModal({ open: true, syncId: req.id, reason: '' })}
            >
              <Text style={s.declineBtnText}>❌ Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Sync History */}
      <SectionHeader icon="time-outline" title="Sync History" />
      {historyList.slice(0, 20).map((req) => {
        const isMine = req.senderId === myId;
        return (
          <View key={req.id} style={[s.historyCard, req.isVerified && s.verifiedCard]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {req.isVerified && (
                  <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 99 }}>
                    <Text style={{ fontSize: 9, color: '#15803d', fontFamily: FONT.bold }}>✅ Verified</Text>
                  </View>
                )}
                <Text style={s.historyName}>{isMine ? `To: ${req.receiver?.name}` : `From: ${req.sender?.name}`}</Text>
              </View>
              <Text style={s.historyReason}>{req.reason}</Text>
              <Text style={s.historyAmount}>₹{Number(req.amount).toLocaleString('en-IN')}</Text>
            </View>
            <StatusPill status={req.status} />
          </View>
        );
      })}

      {/* Counter Proposal Modal */}
      <Modal visible={counterModal.open} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>🔄 Counter Proposal</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Enter your counter amount (₹)"
              keyboardType="numeric"
              value={counterModal.amount}
              onChangeText={(v) => setCounterModal((p) => ({ ...p, amount: v }))}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#7c3aed', flex: 1 }]}
                onPress={() => {
                  respond.mutate({
                    syncId: counterModal.syncId,
                    payload: { response: 'COUNTER_PROPOSED', counterAmount: Number(counterModal.amount) },
                  });
                  setCounterModal({ open: false, syncId: '', amount: '' });
                }}
              >
                <Text style={{ color: '#fff', fontFamily: FONT.bold }}>Send Counter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#e5e7eb', flex: 1 }]}
                onPress={() => setCounterModal({ open: false, syncId: '', amount: '' })}
              >
                <Text style={{ color: '#374151', fontFamily: FONT.medium }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={rejectModal.open} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>❌ Reject Reason</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Reason for rejection (optional)"
              value={rejectModal.reason}
              onChangeText={(v) => setRejectModal((p) => ({ ...p, reason: v }))}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#dc2626', flex: 1 }]}
                onPress={() => {
                  respond.mutate({
                    syncId: rejectModal.syncId,
                    payload: { response: 'REJECTED', rejectionReason: rejectModal.reason },
                  });
                  setRejectModal({ open: false, syncId: '', reason: '' });
                }}
              >
                <Text style={{ color: '#fff', fontFamily: FONT.bold }}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#e5e7eb', flex: 1 }]}
                onPress={() => setRejectModal({ open: false, syncId: '', reason: '' })}
              >
                <Text style={{ color: '#374151', fontFamily: FONT.medium }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function DemandsTab({ myId }: { myId: string }) {
  const { data: incoming = [], isLoading } = useIncomingDemands();
  const { data: outgoing = [] } = useOutgoingDemands();
  const respond = useRespondToDemand();
  const [viewMode, setViewMode] = useState<'incoming' | 'outgoing'>('incoming');
  const [partialModal, setPartialModal] = useState<{ open: boolean; demandId: string; qty: string; maxQty: number }>({ open: false, demandId: '', qty: '', maxQty: 0 });

  const incomingPending = incoming.filter((d) => d.status === 'PENDING');
  const list = viewMode === 'incoming' ? incoming : outgoing;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Sub-filter */}
      <View style={s.subFilterRow}>
        {(['incoming', 'outgoing'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[s.subFilterBtn, viewMode === m && s.subFilterActive]}
            onPress={() => setViewMode(m)}
          >
            <Text style={[s.subFilterText, viewMode === m && s.subFilterActiveText]}>
              {m === 'incoming' ? `📩 Incoming (${incomingPending.length})` : '📤 Sent by Me'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && <ActivityIndicator color="#7c3aed" />}
      {list.length === 0 && <Text style={s.emptyText}>No {viewMode} demands yet.</Text>}

      {list.map((demand) => (
        <View key={demand.id} style={s.demandCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="leaf-outline" size={16} color="#16a34a" />
              <Text style={s.demandCrop}>{demand.cropName}</Text>
              <StatusPill status={demand.status} />
            </View>
            <Text style={s.demandQty}>
              Qty: {demand.status === 'PARTIALLY_ACCEPTED' ? `${demand.acceptedQty} / ${demand.quantity}` : demand.quantity} {demand.unit}
            </Text>
            {demand.offeredPrice && (
              <Text style={s.demandPrice}>Offered: ₹{Number(demand.offeredPrice).toLocaleString('en-IN')}</Text>
            )}
            {demand.requiredByDate && (
              <Text style={s.demandMeta}>By: {new Date(demand.requiredByDate).toLocaleDateString('en-IN')}</Text>
            )}
            <Text style={s.demandParty}>
              {viewMode === 'incoming' ? `From: ${demand.requester?.name}` : `To: ${demand.farmer?.name}`}
            </Text>
          </View>
          {viewMode === 'incoming' && demand.status === 'PENDING' && (
            <View style={{ gap: 5 }}>
              <TouchableOpacity
                style={s.acceptBtn}
                onPress={() => respond.mutate({ demandId: demand.id, payload: { response: 'ACCEPTED' } })}
              >
                <Text style={s.acceptBtnText}>✅ Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.acceptBtn, { backgroundColor: '#0891b2' }]}
                onPress={() => setPartialModal({ open: true, demandId: demand.id, qty: '', maxQty: demand.quantity })}
              >
                <Text style={s.acceptBtnText}>⚡ Partial</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.declineBtn}
                onPress={() => respond.mutate({ demandId: demand.id, payload: { response: 'REJECTED' } })}
              >
                <Text style={s.declineBtnText}>❌ Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {/* Partial Accept Modal */}
      <Modal visible={partialModal.open} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>⚡ Partial Accept</Text>
            <Text style={s.modalSubtitle}>Max quantity: {partialModal.maxQty}</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Enter quantity you can provide"
              keyboardType="numeric"
              value={partialModal.qty}
              onChangeText={(v) => setPartialModal((p) => ({ ...p, qty: v }))}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#0891b2', flex: 1 }]}
                onPress={() => {
                  respond.mutate({
                    demandId: partialModal.demandId,
                    payload: { response: 'PARTIALLY_ACCEPTED', acceptedQty: Number(partialModal.qty) },
                  });
                  setPartialModal({ open: false, demandId: '', qty: '', maxQty: 0 });
                }}
              >
                <Text style={{ color: '#fff', fontFamily: FONT.bold }}>Confirm Partial</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#e5e7eb', flex: 1 }]}
                onPress={() => setPartialModal({ open: false, demandId: '', qty: '', maxQty: 0 })}
              >
                <Text style={{ color: '#374151', fontFamily: FONT.medium }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function PaymentRequestsTab({ myId }: { myId: string }) {
  const { data: incoming = [] } = useIncomingPaymentRequests();
  const { data: outgoing = [] } = useOutgoingPaymentRequests();
  const respond = useRespondToPaymentRequest();
  const [viewMode, setViewMode] = useState<'incoming' | 'outgoing'>('incoming');
  const [partialModal, setPartialModal] = useState<{ open: boolean; reqId: string; amount: string; max: number }>({ open: false, reqId: '', amount: '', max: 0 });
  const [postponeModal, setPostponeModal] = useState<{ open: boolean; reqId: string; date: string }>({ open: false, reqId: '', date: '' });

  const pendingIncoming = incoming.filter((p) => p.status === 'PENDING' || p.status === 'POSTPONED');
  const list = viewMode === 'incoming' ? incoming : outgoing;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.subFilterRow}>
        {(['incoming', 'outgoing'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[s.subFilterBtn, viewMode === m && s.subFilterActive]}
            onPress={() => setViewMode(m)}
          >
            <Text style={[s.subFilterText, viewMode === m && s.subFilterActiveText]}>
              {m === 'incoming' ? `📩 Incoming (${pendingIncoming.length})` : '📤 Sent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {list.length === 0 && <Text style={s.emptyText}>No {viewMode} payment requests.</Text>}

      {list.map((req) => {
        const canRespond = viewMode === 'incoming' && (req.status === 'PENDING' || req.status === 'POSTPONED');
        return (
          <View key={req.id} style={s.payReqCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="cash-outline" size={16} color="#7c3aed" />
                <Text style={s.payReqAmount}>₹{Number(req.amount).toLocaleString('en-IN')}</Text>
                <StatusPill status={req.status} />
              </View>
              <Text style={s.payReqReason}>{req.reason}</Text>
              {req.refBillNo && <Text style={s.payReqMeta}>Ref: {req.refBillNo}</Text>}
              {req.dueDate && <Text style={s.payReqMeta}>Due: {new Date(req.dueDate).toLocaleDateString('en-IN')}</Text>}
              {req.postponedDate && <Text style={[s.payReqMeta, { color: '#7c3aed' }]}>Postponed to: {new Date(req.postponedDate).toLocaleDateString('en-IN')}</Text>}
              {req.acceptedAmount && <Text style={s.payReqMeta}>Accepted: ₹{Number(req.acceptedAmount).toLocaleString('en-IN')}</Text>}
              <Text style={s.payReqParty}>
                {viewMode === 'incoming' ? `From: ${req.sender?.name}` : `To: ${req.receiver?.name}`}
              </Text>
            </View>
            {canRespond && (
              <View style={{ gap: 5, alignItems: 'flex-end' }}>
                <TouchableOpacity
                  style={s.acceptBtn}
                  onPress={() => respond.mutate({ requestId: req.id, payload: { response: 'ACCEPTED' } })}
                >
                  <Text style={s.acceptBtnText}>✅ Pay Full</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.acceptBtn, { backgroundColor: '#0891b2' }]}
                  onPress={() => setPartialModal({ open: true, reqId: req.id, amount: '', max: Number(req.amount) })}
                >
                  <Text style={s.acceptBtnText}>⚡ Partial</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.acceptBtn, { backgroundColor: '#7c3aed' }]}
                  onPress={() => setPostponeModal({ open: true, reqId: req.id, date: '' })}
                >
                  <Text style={s.acceptBtnText}>📅 Postpone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.declineBtn}
                  onPress={() => respond.mutate({ requestId: req.id, payload: { response: 'REJECTED' } })}
                >
                  <Text style={s.declineBtnText}>❌ Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {/* Partial Modal */}
      <Modal visible={partialModal.open} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>⚡ Partial Payment</Text>
            <Text style={s.modalSubtitle}>Total: ₹{partialModal.max.toLocaleString('en-IN')}</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Amount paying now (₹)"
              keyboardType="numeric"
              value={partialModal.amount}
              onChangeText={(v) => setPartialModal((p) => ({ ...p, amount: v }))}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#0891b2', flex: 1 }]}
                onPress={() => {
                  respond.mutate({ requestId: partialModal.reqId, payload: { response: 'PARTIALLY_ACCEPTED', acceptedAmount: Number(partialModal.amount) } });
                  setPartialModal({ open: false, reqId: '', amount: '', max: 0 });
                }}
              >
                <Text style={{ color: '#fff', fontFamily: FONT.bold }}>Confirm Partial</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#e5e7eb', flex: 1 }]} onPress={() => setPartialModal({ open: false, reqId: '', amount: '', max: 0 })}>
                <Text style={{ color: '#374151', fontFamily: FONT.medium }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Postpone Modal */}
      <Modal visible={postponeModal.open} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>📅 Postpone Payment</Text>
            <TextInput
              style={s.modalInput}
              placeholder="New date (YYYY-MM-DD)"
              value={postponeModal.date}
              onChangeText={(v) => setPostponeModal((p) => ({ ...p, date: v }))}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#7c3aed', flex: 1 }]}
                onPress={() => {
                  respond.mutate({ requestId: postponeModal.reqId, payload: { response: 'POSTPONED', postponedDate: postponeModal.date } });
                  setPostponeModal({ open: false, reqId: '', date: '' });
                }}
              >
                <Text style={{ color: '#fff', fontFamily: FONT.bold }}>Postpone</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#e5e7eb', flex: 1 }]} onPress={() => setPostponeModal({ open: false, reqId: '', date: '' })}>
                <Text style={{ color: '#374151', fontFamily: FONT.medium }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ActivityFeedTab() {
  const { data: events = [], isLoading } = useKingActivityFeed();

  const icons: Record<string, { icon: string; color: string }> = {
    SYNC_SENT: { icon: 'arrow-up-circle-outline', color: '#7c3aed' },
    SYNC_RECEIVED: { icon: 'arrow-down-circle-outline', color: '#0891b2' },
    DEMAND_SENT: { icon: 'leaf-outline', color: '#15803d' },
    DEMAND_RECEIVED: { icon: 'leaf', color: '#16a34a' },
    PAYMENT_REQUEST_SENT: { icon: 'cash-outline', color: '#dc2626' },
    PAYMENT_REQUEST_RECEIVED: { icon: 'cash', color: '#b45309' },
    CONNECTION: { icon: 'link', color: '#7c3aed' },
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionHeader icon="pulse-outline" title="Activity Feed" />
      {isLoading && <ActivityIndicator color="#7c3aed" style={{ marginVertical: 20 }} />}
      {events.length === 0 && !isLoading && (
        <Text style={s.emptyText}>No activity yet. Connect with parties to get started!</Text>
      )}
      {events.map((event, idx) => {
        const ic = icons[event.eventType] ?? { icon: 'ellipse-outline', color: '#6b7280' };
        const otherParty = event.sender ?? event.receiver ?? event.initiator;
        const isIncoming = event.direction === 'incoming';
        return (
          <View key={`${event.id}-${idx}`} style={s.activityItem}>
            <View style={[s.activityIcon, { backgroundColor: ic.color + '20' }]}>
              <Ionicons name={ic.icon as any} size={18} color={ic.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.activityType}>{event.eventType.replace(/_/g, ' ')}</Text>
                <StatusPill status={event.status} />
              </View>
              {otherParty && (
                <Text style={s.activityParty}>{isIncoming ? `From: ${otherParty.name}` : `To: ${otherParty.name}`}</Text>
              )}
              {event.reason && <Text style={s.activityReason}>{event.reason}</Text>}
              {event.amount && <Text style={s.activityAmount}>₹{Number(event.amount).toLocaleString('en-IN')}</Text>}
              {event.cropName && <Text style={s.activityReason}>🌾 {event.cropName}</Text>}
              <Text style={s.activityTime}>{new Date(event.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function KingConnectScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<KingTab>('CONNECTIONS');

  const { data: pendingConnections = [] } = usePendingConnections();
  const { data: pendingSync = [] } = usePendingSync();
  const { data: incomingDemands = [] } = useIncomingDemands();
  const { data: incomingPayments = [] } = useIncomingPaymentRequests();

  const pendingCount = pendingConnections.length + pendingSync.filter(s => s.status === 'PENDING').length + incomingDemands.filter(d => d.status === 'PENDING').length + incomingPayments.filter(p => p.status === 'PENDING').length;

  const tabs: { key: KingTab; label: string; icon: string }[] = [
    { key: 'CONNECTIONS', label: 'Connect', icon: 'link-outline' },
    { key: 'SYNC', label: 'Sync', icon: 'swap-horizontal-outline' },
    { key: 'DEMANDS', label: 'Demands', icon: 'leaf-outline' },
    { key: 'PAYMENTS', label: 'Pay Req', icon: 'cash-outline' },
    { key: 'ACTIVITY', label: 'Activity', icon: 'pulse-outline' },
  ];

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient colors={['#7c3aed', '#4f46e5']} style={s.header}>
        <View style={s.headerContent}>
          <Ionicons name="git-network-outline" size={22} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>King Connect 🤝</Text>
            <Text style={s.headerSubtitle}>P2P Verified Transactions</Text>
          </View>
          {pendingCount > 0 && (
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {tabs.map((tab) => {
          const count = tab.key === 'CONNECTIONS' ? pendingConnections.length
            : tab.key === 'SYNC' ? pendingSync.filter(s => s.status === 'PENDING').length
            : tab.key === 'DEMANDS' ? incomingDemands.filter(d => d.status === 'PENDING').length
            : tab.key === 'PAYMENTS' ? incomingPayments.filter(p => p.status === 'PENDING').length
            : 0;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabItem, activeTab === tab.key && s.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.key ? '#7c3aed' : '#9ca3af'}
                />
                {count > 0 && (
                  <View style={s.tabBadge}>
                    <Text style={s.tabBadgeText}>{count}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: SPACING.md }}>
        {activeTab === 'CONNECTIONS' && <ConnectionsTab myId={user?.id ?? ''} />}
        {activeTab === 'SYNC' && <SyncTab myId={user?.id ?? ''} />}
        {activeTab === 'DEMANDS' && <DemandsTab myId={user?.id ?? ''} />}
        {activeTab === 'PAYMENTS' && <PaymentRequestsTab myId={user?.id ?? ''} />}
        {activeTab === 'ACTIVITY' && <ActivityFeedTab />}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: SPACING.md },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontFamily: FONT.bold, color: '#fff' },
  headerSubtitle: { fontSize: 12, fontFamily: FONT.regular, color: '#e0e7ff' },
  headerBadge: { backgroundColor: '#ef4444', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  headerBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: '#fff' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingHorizontal: 4 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#7c3aed' },
  tabLabel: { fontSize: 10, fontFamily: FONT.medium, color: '#9ca3af' },
  tabLabelActive: { color: '#7c3aed', fontFamily: FONT.bold },
  tabBadge: { position: 'absolute', top: -5, right: -8, backgroundColor: '#ef4444', width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 8, fontFamily: FONT.bold, color: '#fff' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#1e1b4b', flex: 1 },
  countBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  countBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: '#fff' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: RADIUS.md, gap: 8, marginTop: 12 },
  connectBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#fff' },
  searchBox: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: RADIUS.md, marginTop: 8, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  searchInput: { flex: 1, padding: 12, fontFamily: FONT.regular, fontSize: 13, color: '#1f2937' },
  searchSendBtn: { backgroundColor: '#7c3aed', padding: 12, alignItems: 'center', justifyContent: 'center', width: 48 },
  requestCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ede9fe', ...premiumShadow },
  requestCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  requestName: { fontSize: 14, fontFamily: FONT.bold, color: '#1e1b4b' },
  requestMeta: { fontSize: 11, fontFamily: FONT.regular, color: '#6b7280' },
  connectionCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb' },
  connectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  connectionName: { fontSize: 13, fontFamily: FONT.bold, color: '#1e1b4b' },
  connectionMeta: { fontSize: 11, fontFamily: FONT.regular, color: '#6b7280' },
  autoAcceptToggle: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 },
  autoAcceptText: { fontSize: 10, fontFamily: FONT.bold },
  acceptBtn: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, alignItems: 'center' },
  acceptBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#fff' },
  declineBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' },
  declineBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#dc2626' },
  syncCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8, flexDirection: 'row', borderWidth: 1, borderColor: '#ede9fe', ...premiumShadow },
  syncFrom: { fontSize: 13, fontFamily: FONT.bold, color: '#1e1b4b' },
  syncReason: { fontSize: 12, fontFamily: FONT.medium, color: '#374151', marginTop: 4 },
  syncType: { fontSize: 10, fontFamily: FONT.regular, color: '#6b7280' },
  syncAmount: { fontSize: 15, fontFamily: FONT.bold, color: '#7c3aed', marginTop: 3 },
  syncMeta: { fontSize: 10, fontFamily: FONT.regular, color: '#9ca3af' },
  historyCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb' },
  verifiedCard: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  historyName: { fontSize: 12, fontFamily: FONT.bold, color: '#374151' },
  historyReason: { fontSize: 11, fontFamily: FONT.regular, color: '#6b7280' },
  historyAmount: { fontSize: 13, fontFamily: FONT.bold, color: '#374151' },
  subFilterRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: RADIUS.md, padding: 3, marginTop: 12, marginBottom: 8 },
  subFilterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.sm },
  subFilterActive: { backgroundColor: '#fff', ...premiumShadow },
  subFilterText: { fontSize: 12, fontFamily: FONT.medium, color: '#6b7280' },
  subFilterActiveText: { color: '#7c3aed', fontFamily: FONT.bold },
  demandCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8, flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', ...premiumShadow },
  demandCrop: { fontSize: 14, fontFamily: FONT.bold, color: '#15803d', flex: 1 },
  demandQty: { fontSize: 12, fontFamily: FONT.medium, color: '#374151', marginTop: 3 },
  demandPrice: { fontSize: 12, fontFamily: FONT.bold, color: '#7c3aed' },
  demandMeta: { fontSize: 11, fontFamily: FONT.regular, color: '#6b7280' },
  demandParty: { fontSize: 11, fontFamily: FONT.medium, color: '#6b7280', marginTop: 3 },
  payReqCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8, flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', ...premiumShadow },
  payReqAmount: { fontSize: 16, fontFamily: FONT.bold, color: '#7c3aed' },
  payReqReason: { fontSize: 12, fontFamily: FONT.medium, color: '#374151', marginTop: 3 },
  payReqMeta: { fontSize: 11, fontFamily: FONT.regular, color: '#6b7280' },
  payReqParty: { fontSize: 11, fontFamily: FONT.medium, color: '#6b7280', marginTop: 3 },
  activityItem: { flexDirection: 'row', gap: 10, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  activityIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  activityType: { fontSize: 11, fontFamily: FONT.bold, color: '#374151' },
  activityParty: { fontSize: 11, fontFamily: FONT.medium, color: '#6b7280' },
  activityReason: { fontSize: 11, fontFamily: FONT.regular, color: '#6b7280' },
  activityAmount: { fontSize: 13, fontFamily: FONT.bold, color: '#7c3aed' },
  activityTime: { fontSize: 10, fontFamily: FONT.regular, color: '#9ca3af', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontFamily: FONT.regular, fontSize: 13, marginVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.lg, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontFamily: FONT.bold, color: '#1e1b4b', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, fontFamily: FONT.regular, color: '#6b7280', marginBottom: 12 },
  modalInput: { backgroundColor: '#f3f4f6', borderRadius: RADIUS.md, padding: 12, fontFamily: FONT.regular, fontSize: 14, color: '#1f2937' },
  modalBtn: { paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' },
});
