import React, { useState, useMemo, useRef } from 'react';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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
import * as Haptics from 'expo-haptics';
import {
  useLabourWorkers,
  useCreateLabourWorker,
  useUpdateLabourWorker,
  useDeleteLabourWorker,
  useCreateWorkEntry,
  useLabourWorkEntries,
  useCreateLabourPayment,
  useLabourPayments,
  useLabourWorkerStatement,
} from '@/src/hooks/useLabour';
import { LabourWorker, LabourWorkEntry, LabourPayment, PaymentMode } from '@/src/types/api';
import { formatInr } from '@/src/utils/formatInr';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { Avatar } from '@/src/components/Avatar';
import { useMyCrops } from '@/src/hooks/useCrops';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAuth } from '@/src/store/auth-context';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function LabourManagementSection() {
  const [subTab, setSubTab] = useState<'WORKERS' | 'WORK_ENTRIES' | 'PAYMENTS'>('WORKERS');

  // Queries
  const { data: workers = [], isLoading: isLoadingWorkers } = useLabourWorkers();
  const { data: workEntries = [], isLoading: isLoadingWork } = useLabourWorkEntries();
  const { data: payments = [], isLoading: isLoadingPayments } = useLabourPayments();

  // Mutations
  const createWorker = useCreateLabourWorker();
  const updateWorker = useUpdateLabourWorker();
  const deleteWorker = useDeleteLabourWorker();
  const createWorkEntry = useCreateWorkEntry();
  const createPayment = useCreateLabourPayment();

  // Modal States
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<LabourWorker | null>(null);

  const [showAddWorkModal, setShowAddWorkModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedStatementWorkerId, setSelectedStatementWorkerId] = useState<string | null>(null);

  // Form States - Worker
  const [workerName, setWorkerName] = useState('');
  const [workerMobile, setWorkerMobile] = useState('');
  const [workerAddress, setWorkerAddress] = useState('');
  const [workerDefaultRate, setWorkerDefaultRate] = useState('');
  const [workerDefaultUnit, setWorkerDefaultUnit] = useState('Days');
  const [workerNotes, setWorkerNotes] = useState('');
  const [workerError, setWorkerError] = useState<string | null>(null);

  // Form States - Work Entry
  const { data: myCrops = [] } = useMyCrops();
  const [selectedWorkerForWork, setSelectedWorkerForWork] = useState<LabourWorker | null>(null);
  const [workCropId, setWorkCropId] = useState<string | undefined>(undefined);
  const [workDate, setWorkDate] = useState(todayIso());
  const [workType, setWorkType] = useState('Sowing / Plantation');
  const [workUnit, setWorkUnit] = useState('Days');
  const [workQty, setWorkQty] = useState('1');
  const [workRate, setWorkRate] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [workError, setWorkError] = useState<string | null>(null);

  const [isWorkerDropdownOpen, setIsWorkerDropdownOpen] = useState(false);
  const [workerSearchText, setWorkerSearchText] = useState('');
  const [isWorkTypeDropdownOpen, setIsWorkTypeDropdownOpen] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  const activeCrops = useMemo(() => {
    return (myCrops ?? []).filter((c) => c.status === 'ACTIVE' || c.status === 'HARVESTING' || c.status === 'PLANNED');
  }, [myCrops]);

  const filteredWorkersForSearch = useMemo(() => {
    if (!workerSearchText.trim()) return workers;
    const q = workerSearchText.toLowerCase();
    return workers.filter((w) => w.name.toLowerCase().includes(q) || (w.mobile && w.mobile.includes(q)));
  }, [workers, workerSearchText]);

  // Form States - Payment
  const [selectedWorkerForPayment, setSelectedWorkerForPayment] = useState<LabourWorker | null>(null);
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [isPaymentWorkerDropdownOpen, setIsPaymentWorkerDropdownOpen] = useState(false);
  const [paymentWorkerSearchText, setPaymentWorkerSearchText] = useState('');

  const filteredWorkersForPaymentSearch = useMemo(() => {
    if (!paymentWorkerSearchText.trim()) return workers;
    const q = paymentWorkerSearchText.toLowerCase();
    return workers.filter((w) => w.name.toLowerCase().includes(q) || (w.mobile && w.mobile.includes(q)));
  }, [workers, paymentWorkerSearchText]);

  // Summary Metrics
  const totalWorkersCount = workers.length;
  const totalEarnedOverall = useMemo(
    () => workers.reduce((acc, w) => acc + (w.totalEarned || 0), 0),
    [workers]
  );
  const totalPaidOverall = useMemo(
    () => workers.reduce((acc, w) => acc + (w.totalPaid || 0), 0),
    [workers]
  );
  const totalPendingBalanceOverall = useMemo(
    () => workers.reduce((acc, w) => acc + (w.pendingBalance || 0), 0),
    [workers]
  );

  // Reset Worker Form
  const resetWorkerForm = () => {
    setWorkerName('');
    setWorkerMobile('');
    setWorkerAddress('');
    setWorkerDefaultRate('');
    setWorkerDefaultUnit('Days');
    setWorkerNotes('');
    setWorkerError(null);
    setEditingWorker(null);
  };

  const handleOpenAddWorker = () => {
    tap();
    resetWorkerForm();
    setShowAddWorkerModal(true);
  };

  const handleOpenEditWorker = (w: LabourWorker) => {
    tap();
    setEditingWorker(w);
    setWorkerName(w.name);
    setWorkerMobile(w.mobile || '');
    setWorkerAddress(w.address || '');
    setWorkerDefaultRate(w.defaultRate ? String(w.defaultRate) : '');
    setWorkerDefaultUnit(w.defaultUnit || 'Days');
    setWorkerNotes(w.notes || '');
    setWorkerError(null);
    setShowAddWorkerModal(true);
  };

  const handleSaveWorker = async () => {
    setWorkerError(null);
    if (!workerName.trim()) {
      setWorkerError('Worker Name is required.');
      return;
    }

    try {
      if (editingWorker) {
        await updateWorker.mutateAsync({
          id: editingWorker.id,
          payload: {
            name: workerName.trim(),
            mobile: workerMobile.trim() || undefined,
            address: workerAddress.trim() || undefined,
            defaultRate: workerDefaultRate ? Number(workerDefaultRate) : undefined,
            defaultUnit: workerDefaultUnit.trim() || 'Days',
            notes: workerNotes.trim() || undefined,
          },
        });
      } else {
        await createWorker.mutateAsync({
          name: workerName.trim(),
          mobile: workerMobile.trim() || undefined,
          address: workerAddress.trim() || undefined,
          defaultRate: workerDefaultRate ? Number(workerDefaultRate) : undefined,
          defaultUnit: workerDefaultUnit.trim() || 'Days',
          notes: workerNotes.trim() || undefined,
        });
      }
      setShowAddWorkerModal(false);
      resetWorkerForm();
    } catch (err: any) {
      setWorkerError(err?.response?.data?.message || 'Could not save worker details.');
    }
  };

  const handleDeleteWorker = (w: LabourWorker) => {
    tap();
    const confirmMessage = `Are you sure you want to delete worker "${w.name}"? All associated work entries and payments will also be removed.`;
    if (Platform.OS === 'web') {
      if (confirm(`🗑️ Delete Worker?\n\n${confirmMessage}`)) {
        deleteWorker.mutate(w.id);
      }
    } else {
      Alert.alert('Delete Worker 🗑️', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteWorker.mutate(w.id) },
      ]);
    }
  };

  // Open Work Entry Modal
  const handleOpenAddWork = (worker?: LabourWorker) => {
    tap();
    const target = worker || (workers.length > 0 ? workers[0] : null);
    setSelectedWorkerForWork(target);
    setWorkCropId(undefined);
    setWorkDate(todayIso());
    setWorkType('Sowing / Plantation');
    setWorkUnit(target?.defaultUnit || 'Days');
    setWorkQty('1');
    setWorkRate(target?.defaultRate ? String(target.defaultRate) : '');
    setWorkNotes('');
    setWorkError(null);
    setShowAddWorkModal(true);
  };

  const handleSaveWorkEntry = async () => {
    setWorkError(null);
    if (!selectedWorkerForWork) {
      setWorkError('Select a worker.');
      return;
    }
    const qtyNum = Number(workQty);
    const rateNum = Number(workRate);
    if (!qtyNum || qtyNum <= 0 || !rateNum || rateNum < 0) {
      setWorkError('Enter valid quantity and rate.');
      return;
    }

    try {
      await createWorkEntry.mutateAsync({
        workerId: selectedWorkerForWork.id,
        workDate,
        workType,
        unit: workUnit,
        quantity: qtyNum,
        rate: rateNum,
        cropCycleId: workCropId,
        notes: workNotes.trim() || undefined,
      });
      setShowAddWorkModal(false);
    } catch (err: any) {
      setWorkError(err?.response?.data?.message || 'Could not log work entry.');
    }
  };

  // Open Payment Modal
  const handleOpenAddPayment = (worker?: LabourWorker) => {
    tap();
    const target = worker || (workers.length > 0 ? workers[0] : null);
    const targetPending = target?.pendingBalance ?? 0;
    setSelectedWorkerForPayment(target);
    setPaymentDate(todayIso());
    setPaymentAmount(targetPending > 0 ? String(targetPending) : '');
    setPaymentMode('CASH');
    setPaymentNotes('');
    setPaymentError(null);
    setShowAddPaymentModal(true);
  };

  const handleSavePayment = async () => {
    setPaymentError(null);
    if (!selectedWorkerForPayment) {
      setPaymentError('Select a worker.');
      return;
    }
    const amtNum = Number(paymentAmount);
    if (!amtNum || amtNum <= 0) {
      setPaymentError('Enter a valid payment amount (> ₹0).');
      return;
    }

    try {
      await createPayment.mutateAsync({
        workerId: selectedWorkerForPayment.id,
        paymentDate,
        amount: amtNum,
        paymentMode,
        notes: paymentNotes.trim() || undefined,
      });
      setShowAddPaymentModal(false);
    } catch (err: any) {
      setPaymentError(err?.response?.data?.message || 'Could not record payment.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Summary Banner */}
      <View style={[styles.summaryCard, premiumShadow('#0f172a', 'sm')]}>
        <View style={styles.summaryTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.summaryIconBg}>
              <Ionicons name="people" size={20} color="#16a34a" />
            </View>
            <View>
              <Text style={styles.summaryTitle}>Labour Management</Text>
              <Text style={styles.summarySubtitle}>
                {totalWorkersCount} Worker{totalWorkersCount === 1 ? '' : 's'} Registered
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addWorkerTopBtn}
            activeOpacity={0.8}
            onPress={handleOpenAddWorker}
          >
            <Ionicons name="person-add" size={14} color="#ffffff" />
            <Text style={styles.addWorkerTopBtnText}>+ Add Worker</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Earned</Text>
            <Text style={[styles.metricValue, { color: '#c2410c' }]}>{formatInr(totalEarnedOverall)}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Paid</Text>
            <Text style={[styles.metricValue, { color: '#16a34a' }]}>{formatInr(totalPaidOverall)}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pending Balance</Text>
            <Text
              style={[
                styles.metricValue,
                { color: totalPendingBalanceOverall > 0 ? '#dc2626' : '#16a34a' },
              ]}
            >
              {formatInr(totalPendingBalanceOverall)}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Quick Action Bar */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}
          activeOpacity={0.8}
          onPress={() => handleOpenAddWork()}
        >
          <Ionicons name="hammer-outline" size={16} color="#ea580c" />
          <Text style={[styles.quickActionBtnText, { color: '#c2410c' }]}>+ Log Work</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
          activeOpacity={0.8}
          onPress={() => handleOpenAddPayment()}
        >
          <Ionicons name="cash-outline" size={16} color="#16a34a" />
          <Text style={[styles.quickActionBtnText, { color: '#166534' }]}>+ Give Payment</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Sub Tabs Bar */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabChip, subTab === 'WORKERS' && styles.subTabChipActive]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setSubTab('WORKERS');
          }}
        >
          <Ionicons
            name="people-outline"
            size={14}
            color={subTab === 'WORKERS' ? '#ffffff' : '#475569'}
          />
          <Text style={[styles.subTabText, subTab === 'WORKERS' && styles.subTabTextActive]}>
            Workers List ({workers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabChip, subTab === 'WORK_ENTRIES' && styles.subTabChipActive]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setSubTab('WORK_ENTRIES');
          }}
        >
          <Ionicons
            name="document-text-outline"
            size={14}
            color={subTab === 'WORK_ENTRIES' ? '#ffffff' : '#475569'}
          />
          <Text style={[styles.subTabText, subTab === 'WORK_ENTRIES' && styles.subTabTextActive]}>
            Work Log ({workEntries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabChip, subTab === 'PAYMENTS' && styles.subTabChipActive]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setSubTab('PAYMENTS');
          }}
        >
          <Ionicons
            name="wallet-outline"
            size={14}
            color={subTab === 'PAYMENTS' ? '#ffffff' : '#475569'}
          />
          <Text style={[styles.subTabText, subTab === 'PAYMENTS' && styles.subTabTextActive]}>
            Payments ({payments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Tab Content */}
      {subTab === 'WORKERS' ? (
        isLoadingWorkers ? (
          <ActivityIndicator color="#16a34a" size="large" style={{ marginVertical: 30 }} />
        ) : workers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={42} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Workers Added Yet</Text>
            <Text style={styles.emptySub}>
              Add daily wage workers, tractor drivers, or harvest laborers to manage work and payments.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} activeOpacity={0.8} onPress={handleOpenAddWorker}>
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={styles.emptyBtnText}>Add First Worker</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {workers.map((w) => {
              const pending = w.pendingBalance ?? 0;
              return (
                <View key={w.id} style={[styles.workerCard, premiumShadow('#0f172a', 'sm')]}>
                  <View style={styles.workerCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Avatar size={44} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.workerName}>{w.name}</Text>
                          <TouchableOpacity
                            style={{ padding: 2 }}
                            activeOpacity={0.7}
                            onPress={() => handleOpenEditWorker(w)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="create-outline" size={15} color="#16a34a" />
                          </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                          {w.mobile ? <Text style={styles.workerMeta}>📱 {w.mobile}</Text> : null}
                          {w.defaultRate ? (
                            <Text style={styles.workerMeta}>
                              🏷️ ₹{w.defaultRate}/{w.defaultUnit || 'Day'}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Worker Metrics: Earned, Paid & Balance Side-by-Side */}
                  <View style={styles.workerMetricsBox}>
                    <Text style={styles.workerMetricText}>
                      Earned: <Text style={{ fontFamily: FONT.bold, color: '#c2410c' }}>{formatInr(w.totalEarned ?? 0)}</Text>
                    </Text>
                    <Text style={styles.workerMetricText}>·</Text>
                    <Text style={styles.workerMetricText}>
                      Paid: <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>{formatInr(w.totalPaid ?? 0)}</Text>
                    </Text>
                    <Text style={styles.workerMetricText}>·</Text>
                    <Text style={styles.workerMetricText}>
                      Balance: <Text style={{ fontFamily: FONT.extraBold, color: pending > 0 ? '#dc2626' : '#16a34a' }}>{formatInr(pending)}</Text>
                    </Text>
                  </View>

                  {/* Card Actions: + Work | + Pay | Statement */}
                  <View style={styles.workerActionRow}>
                    <TouchableOpacity
                      style={styles.workerActionBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenAddWork(w)}
                    >
                      <Ionicons name="hammer-outline" size={14} color="#ea580c" />
                      <Text style={[styles.workerActionText, { color: '#ea580c' }]}>+ Work</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.workerActionBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenAddPayment(w)}
                    >
                      <Ionicons name="cash-outline" size={14} color="#16a34a" />
                      <Text style={[styles.workerActionText, { color: '#16a34a' }]}>+ Pay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.workerActionBtn, { borderRightWidth: 0 }]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedStatementWorkerId(w.id)}
                    >
                      <Ionicons name="document-text-outline" size={14} color="#0284c7" />
                      <Text style={[styles.workerActionText, { color: '#0284c7', fontFamily: FONT.bold }]}>Statement</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : subTab === 'WORK_ENTRIES' ? (
        isLoadingWork ? (
          <ActivityIndicator color="#16a34a" size="large" style={{ marginVertical: 30 }} />
        ) : workEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={42} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Work Entries Logged</Text>
            <Text style={styles.emptySub}>Log daily work for your labor workers here.</Text>
            <TouchableOpacity style={styles.emptyBtn} activeOpacity={0.8} onPress={() => handleOpenAddWork()}>
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={styles.emptyBtnText}>Log Work Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {workEntries.map((entry) => (
              <View key={entry.id} style={[styles.itemCard, premiumShadow('#0f172a', 'sm')]}>
                <View style={styles.itemCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="hammer-outline" size={15} color="#ea580c" />
                    <Text style={styles.itemWorkerName}>{entry.worker?.name || 'Labour Worker'}</Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {new Date(entry.workDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.itemCardBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemType}>{entry.workType}</Text>
                    <Text style={styles.itemQtyRate}>
                      {entry.quantity} {entry.unit} @ ₹{entry.rate}/{entry.unit}
                    </Text>
                  </View>
                  <Text style={styles.itemAmount}>+{formatInr(Number(entry.totalAmount))}</Text>
                </View>
                {entry.notes ? <Text style={styles.itemNotes}>📝 {entry.notes}</Text> : null}
              </View>
            ))}
          </View>
        )
      ) : isLoadingPayments ? (
        <ActivityIndicator color="#16a34a" size="large" style={{ marginVertical: 30 }} />
      ) : payments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="wallet-outline" size={42} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Labour Payments Recorded</Text>
          <Text style={styles.emptySub}>Record payments given to workers here.</Text>
          <TouchableOpacity style={styles.emptyBtn} activeOpacity={0.8} onPress={() => handleOpenAddPayment()}>
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.emptyBtnText}>Record Payment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {payments.map((p) => (
            <View key={p.id} style={[styles.itemCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.itemCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle-outline" size={15} color="#16a34a" />
                  <Text style={styles.itemWorkerName}>{p.worker?.name || 'Labour Worker'}</Text>
                </View>
                <Text style={styles.itemDate}>
                  {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.itemCardBody}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemType, { color: '#166534' }]}>
                    Payment Given ({p.paymentMode || 'CASH'})
                  </Text>
                </View>
                <Text style={[styles.itemAmount, { color: '#16a34a' }]}>-{formatInr(Number(p.amount))}</Text>
              </View>
              {p.notes ? <Text style={styles.itemNotes}>📝 {p.notes}</Text> : null}
            </View>
          ))}
        </View>
      )}

      {/* 5. ADD / EDIT WORKER MODAL */}
      <Modal visible={showAddWorkerModal} transparent animationType="slide" onRequestClose={() => setShowAddWorkerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingWorker ? 'Edit Worker Profile' : 'Add New Labour Worker'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddWorkerModal(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Worker Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Kumar / Gurpreet Singh"
                placeholderTextColor="#94a3b8"
                value={workerName}
                onChangeText={setWorkerName}
              />

              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={workerMobile}
                onChangeText={setWorkerMobile}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Default Daily Rate (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 500"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={workerDefaultRate}
                    onChangeText={setWorkerDefaultRate}
                  />
                </View>

                <View style={{ width: 120 }}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Days / Hours"
                    placeholderTextColor="#94a3b8"
                    value={workerDefaultUnit}
                    onChangeText={setWorkerDefaultUnit}
                  />
                </View>
              </View>

              <Text style={styles.label}>Village / Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Village Rampur"
                placeholderTextColor="#94a3b8"
                value={workerAddress}
                onChangeText={setWorkerAddress}
              />

              <Text style={styles.label}>Notes / Skill Details</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Tractor driver, spray expert"
                placeholderTextColor="#94a3b8"
                value={workerNotes}
                onChangeText={setWorkerNotes}
              />
            </ScrollView>

            {workerError ? <Text style={styles.errorText}>{workerError}</Text> : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddWorkerModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveWorker}
                disabled={createWorker.isPending || updateWorker.isPending}
              >
                {createWorker.isPending || updateWorker.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingWorker ? 'Update Worker' : 'Save Worker'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. ADD WORK ENTRY MODAL */}
      <Modal visible={showAddWorkModal} transparent animationType="slide" onRequestClose={() => setShowAddWorkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { zIndex: 100 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Labour Work Entry</Text>
              <TouchableOpacity onPress={() => setShowAddWorkModal(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* ROW 1: SELECT WORKER (SEARCHABLE DROPDOWN) & WORK DATE SIDE-BY-SIDE */}
              <View style={{ flexDirection: 'row', gap: 8, zIndex: 300, marginBottom: 12 }}>
                {/* SELECT WORKER SEARCHABLE DROPDOWN */}
                <View style={{ flex: 1.3, position: 'relative' }}>
                  <Text style={styles.label}>Select Worker *</Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: isWorkerDropdownOpen ? '#16a34a' : '#cbd5e1',
                      borderRadius: RADIUS.md,
                      paddingHorizontal: 8,
                      height: 40,
                      backgroundColor: '#f8fafc',
                    }}
                    activeOpacity={0.8}
                    onPress={() => setIsWorkerDropdownOpen((prev) => !prev)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Ionicons name="person-circle-outline" size={16} color="#16a34a" />
                      <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: selectedWorkerForWork ? '#0f172a' : '#94a3b8' }} numberOfLines={1}>
                        {selectedWorkerForWork ? selectedWorkerForWork.name : 'Select Worker'}
                      </Text>
                    </View>
                    <Ionicons name={isWorkerDropdownOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#64748b" />
                  </TouchableOpacity>

                  {/* Worker Search Dropdown Overlay */}
                  {isWorkerDropdownOpen && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 62,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#ffffff',
                        borderRadius: RADIUS.md,
                        borderWidth: 1.5,
                        borderColor: '#cbd5e1',
                        maxHeight: 220,
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        padding: 6,
                      }}
                    >
                      <TextInput
                        style={{
                          height: 36,
                          borderWidth: 1,
                          borderColor: '#cbd5e1',
                          borderRadius: RADIUS.sm,
                          paddingHorizontal: 8,
                          fontSize: 12,
                          fontFamily: FONT.medium,
                          backgroundColor: '#f8fafc',
                          marginBottom: 6,
                        }}
                        placeholder="Type & search worker..."
                        placeholderTextColor="#94a3b8"
                        value={workerSearchText}
                        onChangeText={setWorkerSearchText}
                        autoFocus
                      />

                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 160 }}>
                        {filteredWorkersForSearch.length === 0 ? (
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', paddingVertical: 10 }}>
                            No matching worker found
                          </Text>
                        ) : (
                          filteredWorkersForSearch.map((w) => {
                            const isSelected = selectedWorkerForWork?.id === w.id;
                            return (
                              <TouchableOpacity
                                key={w.id}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingHorizontal: 8,
                                  paddingVertical: 7,
                                  borderRadius: RADIUS.sm,
                                  backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                                  marginBottom: 2,
                                }}
                                onPress={() => {
                                  tap();
                                  setSelectedWorkerForWork(w);
                                  if (w.defaultRate) setWorkRate(String(w.defaultRate));
                                  if (w.defaultUnit) setWorkUnit(w.defaultUnit);
                                  setIsWorkerDropdownOpen(false);
                                  setWorkerSearchText('');
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                  <Ionicons name="person" size={13} color={isSelected ? '#16a34a' : '#64748b'} />
                                  <Text style={{ fontSize: 12, fontFamily: isSelected ? FONT.bold : FONT.medium, color: isSelected ? '#15803d' : '#0f172a' }}>
                                    {w.name} {w.mobile ? `(${w.mobile})` : ''}
                                  </Text>
                                </View>
                                {isSelected && <Ionicons name="checkmark" size={14} color="#16a34a" />}
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* WORK DATE ON RIGHT SIDE OF SELECT WORKER */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Work Date *</Text>
                  <TextInput
                    style={[styles.input, { height: 40 }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    value={workDate}
                    onChangeText={setWorkDate}
                  />
                </View>
              </View>

              {/* ROW 2: SELECT CROP (ONLY ACTIVE CROPS + OTHER CHIP) */}
              <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 }}>
                <Text style={[styles.label, { marginBottom: 6 }]}>Select Crop</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {activeCrops.map((c) => {
                    const isSelected = workCropId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.pickerChip,
                          isSelected && styles.pickerChipActive,
                          { paddingVertical: 5, paddingHorizontal: 10 },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          tap();
                          setWorkCropId(c.id);
                        }}
                      >
                        <Ionicons name="leaf" size={13} color={isSelected ? '#fff' : '#16a34a'} />
                        <Text style={[styles.pickerChipText, isSelected && styles.pickerChipTextActive]}>
                          {c.cropName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={[
                      styles.pickerChip,
                      !workCropId && styles.pickerChipActive,
                      { paddingVertical: 5, paddingHorizontal: 10 },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setWorkCropId(undefined);
                    }}
                  >
                    <Ionicons name="grid-outline" size={13} color={!workCropId ? '#fff' : '#475569'} />
                    <Text style={[styles.pickerChipText, !workCropId && styles.pickerChipTextActive]}>
                      Other / General Farm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ROW 3: WORK TYPE / EXPENSE CATEGORY DROPDOWN */}
              <View style={{ position: 'relative', zIndex: 200, marginBottom: 12 }}>
                <Text style={styles.label}>Work Type / Expense Category *</Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: isWorkTypeDropdownOpen ? '#16a34a' : '#cbd5e1',
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 8,
                    height: 40,
                    backgroundColor: '#f8fafc',
                  }}
                  activeOpacity={0.8}
                  onPress={() => setIsWorkTypeDropdownOpen((prev) => !prev)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="construct-outline" size={15} color="#16a34a" />
                    <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
                      {workType}
                    </Text>
                  </View>
                  <Ionicons name={isWorkTypeDropdownOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#64748b" />
                </TouchableOpacity>

                {/* Work Type Dropdown Overlay */}
                {isWorkTypeDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 62,
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      backgroundColor: '#ffffff',
                      borderRadius: RADIUS.md,
                      borderWidth: 1.5,
                      borderColor: '#cbd5e1',
                      maxHeight: 200,
                      elevation: 10,
                      shadowColor: '#000',
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                    }}
                  >
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {[
                        'Sowing / Plantation (ਬਿਜਾਈ / ਲਵਾਈ)',
                        'Harvesting & Cutting (ਵਾਢੀ / ਕਟਾਈ)',
                        'Spraying & Fertilizers (ਸਪਰੇਅ / ਖਾਦ)',
                        'Weeding & Cleaning (ਗੋਡੀ / ਨਦੀਨ)',
                        'Tractor Driving & Tillage (ਟਰੈਕਟਰ / ਵਾਹੀ)',
                        'Irrigation & Watering (ਪਾਣੀ / ਸਿੰਚਾਈ)',
                        'Loading, Unloading & Mandi (ਲੋਡਿੰਗ / ਮੰਡੀ)',
                        'General Labour Work (ਆਮ ਮਜ਼ਦੂਰੀ)',
                        'Other Farm Work (ਹੋਰ ਕੰਮ)',
                      ].map((t) => {
                        const isSelected = workType === t;
                        return (
                          <TouchableOpacity
                            key={t}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: '#f1f5f9',
                              backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                            }}
                            onPress={() => {
                              tap();
                              setWorkType(t);
                              setIsWorkTypeDropdownOpen(false);
                            }}
                          >
                            <Text style={{ fontSize: 12, fontFamily: isSelected ? FONT.bold : FONT.medium, color: isSelected ? '#16a34a' : '#0f172a' }}>
                              {t}
                            </Text>
                            {isSelected && <Ionicons name="checkmark" size={14} color="#16a34a" />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* ROW 4: QUANTITY, UNIT DROPDOWN & RATE */}
              <View style={{ flexDirection: 'row', gap: 8, zIndex: 100, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={[styles.input, { height: 40 }]}
                    placeholder="e.g. 1"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={workQty}
                    onChangeText={setWorkQty}
                  />
                </View>

                {/* UNIT DROPDOWN SELECTOR */}
                <View style={{ flex: 1.2, position: 'relative' }}>
                  <Text style={styles.label}>Unit *</Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: isUnitDropdownOpen ? '#16a34a' : '#cbd5e1',
                      borderRadius: RADIUS.md,
                      paddingHorizontal: 8,
                      height: 40,
                      backgroundColor: '#f8fafc',
                    }}
                    activeOpacity={0.8}
                    onPress={() => setIsUnitDropdownOpen((prev) => !prev)}
                  >
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
                      {workUnit}
                    </Text>
                    <Ionicons name={isUnitDropdownOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#64748b" />
                  </TouchableOpacity>

                  {/* Unit Dropdown Overlay */}
                  {isUnitDropdownOpen && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 62,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#ffffff',
                        borderRadius: RADIUS.md,
                        borderWidth: 1.5,
                        borderColor: '#cbd5e1',
                        maxHeight: 180,
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                      }}
                    >
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {[
                          'Days (ਦਿਨ / ਡੇਲੀ)',
                          'Hours (ਘੰਟੇ)',
                          'Acre / Kila (ਏਕੜ / ਕਿੱਲਾ)',
                          'Bags / Catt (ਬੋਰੀਆਂ / ਕੱਟੇ)',
                          'Quintal / Kg (ਕੁਇੰਟਲ / ਕਿੱਲੋ)',
                          'Trips (ਗੇੜੇ / ਟ੍ਰਿਪ)',
                          'Fixed Contract (ਫਿਕਸ / ਠੇਕਾ)',
                        ].map((u) => {
                          const isSelected = workUnit === u;
                          return (
                            <TouchableOpacity
                              key={u}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 8,
                                paddingVertical: 7,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f1f5f9',
                                backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                              }}
                              onPress={() => {
                                tap();
                                setWorkUnit(u);
                                setIsUnitDropdownOpen(false);
                              }}
                            >
                              <Text style={{ fontSize: 11.5, fontFamily: isSelected ? FONT.bold : FONT.medium, color: isSelected ? '#16a34a' : '#0f172a' }}>
                                {u}
                              </Text>
                              {isSelected && <Ionicons name="checkmark" size={13} color="#16a34a" />}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1.1 }}>
                  <Text style={styles.label}>Rate (₹) *</Text>
                  <TextInput
                    style={[styles.input, { height: 40 }]}
                    placeholder="e.g. 500"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={workRate}
                    onChangeText={setWorkRate}
                  />
                </View>
              </View>

              {Number(workQty) > 0 && Number(workRate) > 0 ? (
                <View style={styles.calcBox}>
                  <Text style={styles.calcTitle}>Total Earned Amount:</Text>
                  <Text style={styles.calcValue}>
                    {workQty} {workUnit} × ₹{workRate} = {formatInr(Number(workQty) * Number(workRate))}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.label}>Notes / Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Wheat sowing field 2"
                placeholderTextColor="#94a3b8"
                value={workNotes}
                onChangeText={setWorkNotes}
              />
            </ScrollView>

            {workError ? <Text style={styles.errorText}>{workError}</Text> : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddWorkModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveWorkEntry} disabled={createWorkEntry.isPending}>
                {createWorkEntry.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Log Work Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. ADD PAYMENT MODAL */}
      <Modal visible={showAddPaymentModal} transparent animationType="slide" onRequestClose={() => setShowAddPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { zIndex: 100 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Labour Payment</Text>
              <TouchableOpacity onPress={() => setShowAddPaymentModal(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* ROW 1: SELECT WORKER (SEARCHABLE DROPDOWN) & PAYMENT DATE SIDE-BY-SIDE */}
              <View style={{ flexDirection: 'row', gap: 8, zIndex: 300, marginBottom: 12 }}>
                {/* SELECT WORKER SEARCHABLE DROPDOWN */}
                <View style={{ flex: 1.3, position: 'relative' }}>
                  <Text style={styles.label}>Select Worker *</Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: isPaymentWorkerDropdownOpen ? '#16a34a' : '#cbd5e1',
                      borderRadius: RADIUS.md,
                      paddingHorizontal: 8,
                      height: 40,
                      backgroundColor: '#f8fafc',
                    }}
                    activeOpacity={0.8}
                    onPress={() => setIsPaymentWorkerDropdownOpen((prev) => !prev)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Ionicons name="person-circle-outline" size={16} color="#16a34a" />
                      <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: selectedWorkerForPayment ? '#0f172a' : '#94a3b8' }} numberOfLines={1}>
                        {selectedWorkerForPayment ? selectedWorkerForPayment.name : 'Select Worker'}
                      </Text>
                    </View>
                    <Ionicons name={isPaymentWorkerDropdownOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#64748b" />
                  </TouchableOpacity>

                  {/* Worker Search Dropdown Overlay */}
                  {isPaymentWorkerDropdownOpen && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 62,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#ffffff',
                        borderRadius: RADIUS.md,
                        borderWidth: 1.5,
                        borderColor: '#cbd5e1',
                        maxHeight: 220,
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        padding: 6,
                      }}
                    >
                      <TextInput
                        style={{
                          height: 36,
                          borderWidth: 1,
                          borderColor: '#cbd5e1',
                          borderRadius: RADIUS.sm,
                          paddingHorizontal: 8,
                          fontSize: 12,
                          fontFamily: FONT.medium,
                          backgroundColor: '#f8fafc',
                          marginBottom: 6,
                        }}
                        placeholder="Type & search worker..."
                        placeholderTextColor="#94a3b8"
                        value={paymentWorkerSearchText}
                        onChangeText={setPaymentWorkerSearchText}
                        autoFocus
                      />

                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 160 }}>
                        {filteredWorkersForPaymentSearch.length === 0 ? (
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', paddingVertical: 10 }}>
                            No matching worker found
                          </Text>
                        ) : (
                          filteredWorkersForPaymentSearch.map((w) => {
                            const isSelected = selectedWorkerForPayment?.id === w.id;
                            const pending = w.pendingBalance ?? 0;
                            return (
                              <TouchableOpacity
                                key={w.id}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingHorizontal: 8,
                                  paddingVertical: 7,
                                  borderRadius: RADIUS.sm,
                                  backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                                  marginBottom: 2,
                                }}
                                onPress={() => {
                                  tap();
                                  setSelectedWorkerForPayment(w);
                                  if (pending > 0) setPaymentAmount(String(pending));
                                  setIsPaymentWorkerDropdownOpen(false);
                                  setPaymentWorkerSearchText('');
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                  <Ionicons name="person" size={13} color={isSelected ? '#16a34a' : '#64748b'} />
                                  <Text style={{ fontSize: 12, fontFamily: isSelected ? FONT.bold : FONT.medium, color: isSelected ? '#15803d' : '#0f172a' }}>
                                    {w.name} {pending > 0 ? `(₹${pending})` : ''}
                                  </Text>
                                </View>
                                {isSelected && <Ionicons name="checkmark" size={14} color="#16a34a" />}
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* PAYMENT DATE ON RIGHT SIDE OF SELECT WORKER */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Payment Date *</Text>
                  <TextInput
                    style={[styles.input, { height: 40 }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    value={paymentDate}
                    onChangeText={setPaymentDate}
                  />
                </View>
              </View>

              {/* ROW 2: PAYMENT AMOUNT & CASH / UPI RADIO SIDE-BY-SIDE */}
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1.1 }}>
                  <Text style={styles.label}>Payment Amount (₹) *</Text>
                  <TextInput
                    style={[styles.input, { height: 40 }]}
                    placeholder="e.g. 1000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                  />
                </View>

                {/* CASH / UPI RADIO SELECTION ON RIGHT SIDE OF AMOUNT */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Mode</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[
                        styles.pickerChip,
                        paymentMode === 'CASH' && styles.pickerChipActive,
                        { paddingVertical: 6, paddingHorizontal: 12 },
                      ]}
                      onPress={() => {
                        tap();
                        setPaymentMode('CASH');
                      }}
                    >
                      <Text style={[styles.pickerChipText, paymentMode === 'CASH' && styles.pickerChipTextActive]}>
                        💵 Cash
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.pickerChip,
                        paymentMode === 'UPI' && styles.pickerChipActive,
                        { paddingVertical: 6, paddingHorizontal: 12 },
                      ]}
                      onPress={() => {
                        tap();
                        setPaymentMode('UPI');
                      }}
                    >
                      <Text style={[styles.pickerChipText, paymentMode === 'UPI' && styles.pickerChipTextActive]}>
                        📲 UPI
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Notes / Reference</Text>
              <TextInput
                style={[styles.input, { height: 38 }]}
                placeholder="e.g. Weekly advance settlement"
                placeholderTextColor="#94a3b8"
                value={paymentNotes}
                onChangeText={setPaymentNotes}
              />
            </ScrollView>

            {paymentError ? <Text style={styles.errorText}>{paymentError}</Text> : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddPaymentModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#16a34a' }]} onPress={handleSavePayment} disabled={createPayment.isPending}>
                {createPayment.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 8. WORKER STATEMENT / KHATA MODAL */}
      <WorkerStatementModal
        workerId={selectedStatementWorkerId}
        onClose={() => setSelectedStatementWorkerId(null)}
      />
    </View>
  );
}

/** Professional Multi-Page Worker Statement Modal Component */
function WorkerStatementModal({
  workerId,
  onClose,
}: {
  workerId: string | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data: statement, isLoading } = useLabourWorkerStatement(workerId || undefined);
  const statementShotRef = useRef<any>(null);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const worker = statement?.worker;
  const rawTimeline = statement?.timeline || [];
  const totalEarned = statement?.totalEarned ?? 0;
  const totalPaid = statement?.totalPaid ?? 0;
  const pendingBalance = statement?.pendingBalance ?? 0;

  const farmerName = user?.name || 'Farm Owner';
  const farmerMobile = user?.mobile || '';
  const farmerVillage = user?.village || '';

  // Sort timeline chronologically (latest entries properly processed)
  const timeline = useMemo(() => {
    return [...rawTimeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rawTimeline]);

  // Multi-Page Pagination for JPG & View
  const ITEMS_PER_PAGE = 12;
  const pages = useMemo(() => {
    if (timeline.length === 0) return [[]];
    const chunked: (typeof timeline)[] = [];
    for (let i = 0; i < timeline.length; i += ITEMS_PER_PAGE) {
      chunked.push(timeline.slice(i, i + ITEMS_PER_PAGE));
    }
    return chunked;
  }, [timeline]);

  if (!workerId) return null;

  const handleShareWhatsapp = () => {
    if (!worker) return;
    const text = `📋 Worker Statement for ${worker.name}\nTotal Earned: ${formatInr(
      totalEarned
    )}\nTotal Paid: ${formatInr(totalPaid)}\nBalance: ${formatInr(
      pendingBalance
    )}\n\nFarmsKing`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const handleDownloadJpg = async () => {
    if (!statementShotRef.current) return;
    try {
      setIsDownloadingJpg(true);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureRef(statementShotRef, {
        format: 'jpg',
        quality: 0.95,
      });

      const fileName = `Worker-Statement-${(worker?.name || 'Worker').replace(/\s+/g, '-')}.jpg`;

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = fileName;
        link.click();
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: `Download ${worker?.name} Statement`,
        });
      }
    } catch (err) {
      console.error('Failed to capture statement JPG:', err);
      Alert.alert('Error', 'Could not generate statement JPG image.');
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!worker) return;
    try {
      setIsDownloadingPdf(true);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const pdfHtml = generateWorkerStatementPdfHtml({
        workerName: worker.name,
        workerMobile: worker.mobile || '',
        farmerName,
        farmerMobile,
        farmerVillage,
        totalEarned,
        totalPaid,
        pendingBalance,
        timeline,
      });

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(pdfHtml);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 500);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: pdfHtml });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Download Worker Statement PDF`,
        });
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      Alert.alert('Error', 'Could not generate statement PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Modal visible={!!workerId} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxWidth: 580, maxHeight: '94%', padding: 12 }]}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="document-text" size={20} color="#16a34a" />
              <Text style={styles.modalTitle}>Worker Statement ({pages.length} Page{pages.length > 1 ? 's' : ''})</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading || !worker ? (
            <ActivityIndicator color="#16a34a" size="large" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Printable Statement Container Captured by ViewShot */}
              <ViewShot
                ref={statementShotRef}
                options={{ format: 'jpg', quality: 0.95 }}
                style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md }}
              >
                {pages.map((pageItems, pageIdx) => {
                  const isFirstPage = pageIdx === 0;

                  return (
                    <View
                      key={`page-${pageIdx}`}
                      style={{
                        backgroundColor: '#ffffff',
                        padding: 14,
                        borderRadius: RADIUS.md,
                        borderWidth: 1,
                        borderColor: '#cbd5e1',
                        marginBottom: pages.length > 1 ? 16 : 0,
                      }}
                    >
                      {/* 1. BRAND HEADER: FarmsKing with Logo */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottomWidth: 2.5,
                          borderBottomColor: '#16a34a',
                          paddingBottom: 10,
                          marginBottom: 12,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <BrandLogo size={36} useHdQuality />
                          <View>
                            <Text style={{ fontSize: 18, fontFamily: FONT.extraBold, color: '#15803d', letterSpacing: -0.3 }}>
                              FarmsKing
                            </Text>
                            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#64748b' }}>
                              WORKER STATEMENT / ਖਾਤਾ ਸਟੇਟਮੈਂਟ
                            </Text>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>
                            Date: {new Date().toLocaleDateString('en-IN')}
                          </Text>
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a' }}>
                            Page {pageIdx + 1} of {pages.length}
                          </Text>
                        </View>
                      </View>

                      {/* 2. FARMER & WORKER DETAILS BOX (SIDE-BY-SIDE) */}
                      {isFirstPage && (
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                          {/* Farmer Details */}
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: '#f0fdf4',
                              padding: 10,
                              borderRadius: RADIUS.sm,
                              borderWidth: 1,
                              borderColor: '#bbf7d0',
                            }}
                          >
                            <Text style={{ fontSize: 10.5, fontFamily: FONT.extraBold, color: '#15803d', marginBottom: 3 }}>
                              👨‍🌾 FARMER DETAILS
                            </Text>
                            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>{farmerName}</Text>
                            {farmerMobile ? (
                              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>
                                📱 {farmerMobile}
                              </Text>
                            ) : null}
                            {farmerVillage ? (
                              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>
                                📍 {farmerVillage}
                              </Text>
                            ) : null}
                          </View>

                          {/* Worker Details */}
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: '#f8fafc',
                              padding: 10,
                              borderRadius: RADIUS.sm,
                              borderWidth: 1,
                              borderColor: '#e2e8f0',
                            }}
                          >
                            <Text style={{ fontSize: 10.5, fontFamily: FONT.extraBold, color: '#475569', marginBottom: 3 }}>
                              👤 WORKER DETAILS
                            </Text>
                            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>{worker.name}</Text>
                            {worker.mobile ? (
                              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>
                                📱 {worker.mobile}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      )}

                      {/* 3. FINANCIAL SUMMARY METRICS */}
                      {isFirstPage && (
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: '#fff7ed',
                              padding: 8,
                              borderRadius: RADIUS.sm,
                              borderWidth: 1,
                              borderColor: '#ffedd5',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#c2410c' }}>Total Earned</Text>
                            <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#c2410c', marginTop: 2 }}>
                              {formatInr(totalEarned)}
                            </Text>
                          </View>

                          <View
                            style={{
                              flex: 1,
                              backgroundColor: '#f0fdf4',
                              padding: 8,
                              borderRadius: RADIUS.sm,
                              borderWidth: 1,
                              borderColor: '#bbf7d0',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#15803d' }}>Total Paid</Text>
                            <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#15803d', marginTop: 2 }}>
                              {formatInr(totalPaid)}
                            </Text>
                          </View>

                          <View
                            style={{
                              flex: 1,
                              backgroundColor: pendingBalance > 0 ? '#fef2f2' : '#f0fdf4',
                              padding: 8,
                              borderRadius: RADIUS.sm,
                              borderWidth: 1,
                              borderColor: pendingBalance > 0 ? '#fecdd3' : '#bbf7d0',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontFamily: FONT.bold,
                                color: pendingBalance > 0 ? '#b91c1c' : '#15803d',
                              }}
                            >
                              Balance
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                fontFamily: FONT.extraBold,
                                color: pendingBalance > 0 ? '#dc2626' : '#16a34a',
                                marginTop: 2,
                              }}
                            >
                              {formatInr(pendingBalance)}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* 4. T-LEDGER TABLE */}
                      <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.sm, overflow: 'hidden' }}>
                        {/* Table Header */}
                        <View
                          style={{
                            flexDirection: 'row',
                            backgroundColor: '#334155',
                            paddingVertical: 7,
                            paddingHorizontal: 10,
                          }}
                        >
                          <Text style={{ width: 75, fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' }}>Date</Text>
                          <Text style={{ flex: 2.2, fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' }}>
                            Particulars
                          </Text>
                          <Text style={{ flex: 1, fontSize: 11, fontFamily: FONT.bold, color: '#ffedd5', textAlign: 'right' }}>
                            Earned (+)
                          </Text>
                          <Text style={{ flex: 1, fontSize: 11, fontFamily: FONT.bold, color: '#bbf7d0', textAlign: 'right' }}>
                            Paid (-)
                          </Text>
                          <Text style={{ flex: 1.1, fontSize: 11, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'right' }}>
                            Balance
                          </Text>
                        </View>

                        {/* Table Rows */}
                        {pageItems.length === 0 ? (
                          <View style={{ paddingVertical: 16, alignItems: 'center', backgroundColor: '#ffffff' }}>
                            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8' }}>
                              No entries found.
                            </Text>
                          </View>
                        ) : (
                          pageItems.map((row, idx) => {
                            const isWork = row.type === 'WORK';
                            const isEven = idx % 2 === 0;
                            return (
                              <View
                                key={row.id}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingHorizontal: 10,
                                  paddingVertical: 8,
                                  backgroundColor: isEven ? '#ffffff' : '#f8fafc',
                                  borderBottomWidth: 1,
                                  borderBottomColor: '#f1f5f9',
                                }}
                              >
                                <Text style={{ width: 75, fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>
                                  {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </Text>

                                {/* PARTICULAR COLUMN WITH Crisp Font & Generous Space */}
                                <View style={{ flex: 2.2, paddingRight: 6 }}>
                                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
                                    {row.title}
                                  </Text>
                                  {row.description ? (
                                    <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                                      {row.description}
                                    </Text>
                                  ) : null}
                                  {row.notes ? (
                                    <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#475569', marginTop: 1, fontStyle: 'italic' }}>
                                      📝 {row.notes}
                                    </Text>
                                  ) : null}
                                </View>

                                <Text style={{ flex: 1, fontSize: 11.5, fontFamily: FONT.bold, color: '#c2410c', textAlign: 'right' }}>
                                  {isWork ? `+${formatInr(row.amount)}` : '—'}
                                </Text>

                                <Text style={{ flex: 1, fontSize: 11.5, fontFamily: FONT.bold, color: '#16a34a', textAlign: 'right' }}>
                                  {!isWork ? `-${formatInr(row.amount)}` : '—'}
                                </Text>

                                <Text
                                  style={{
                                    flex: 1.1,
                                    fontSize: 11.5,
                                    fontFamily: FONT.extraBold,
                                    color: row.runningBalance > 0 ? '#dc2626' : '#16a34a',
                                    textAlign: 'right',
                                  }}
                                >
                                  ₹{row.runningBalance.toLocaleString('en-IN')}
                                </Text>
                              </View>
                            );
                          })
                        )}
                      </View>

                      {/* Footer Page Counter */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#94a3b8' }}>
                          Generated via FarmsKing App
                        </Text>
                        <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b' }}>
                          Page {pageIdx + 1} of {pages.length}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ViewShot>

              {/* Action Buttons Row: Download JPG | Download PDF | Share WhatsApp */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    backgroundColor: '#16a34a',
                    paddingVertical: 10,
                    borderRadius: RADIUS.md,
                  }}
                  activeOpacity={0.8}
                  onPress={handleDownloadJpg}
                  disabled={isDownloadingJpg || isDownloadingPdf}
                >
                  {isDownloadingJpg ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={16} color="#ffffff" />
                      <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 }}>Download (JPG)</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    backgroundColor: '#0284c7',
                    paddingVertical: 10,
                    borderRadius: RADIUS.md,
                  }}
                  activeOpacity={0.8}
                  onPress={handleDownloadPdf}
                  disabled={isDownloadingJpg || isDownloadingPdf}
                >
                  {isDownloadingPdf ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={16} color="#ffffff" />
                      <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 }}>Download (PDF)</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    backgroundColor: '#25d366',
                    paddingVertical: 10,
                    borderRadius: RADIUS.md,
                  }}
                  activeOpacity={0.8}
                  onPress={handleShareWhatsapp}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 }}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// PDF HTML Generator Function
function generateWorkerStatementPdfHtml({
  workerName,
  workerMobile,
  farmerName,
  farmerMobile,
  farmerVillage,
  totalEarned,
  totalPaid,
  pendingBalance,
  timeline,
}: {
  workerName: string;
  workerMobile: string;
  farmerName: string;
  farmerMobile: string;
  farmerVillage: string;
  totalEarned: number;
  totalPaid: number;
  pendingBalance: number;
  timeline: any[];
}) {
  const itemsPerPage = 14;
  const pageCount = Math.max(1, Math.ceil(timeline.length / itemsPerPage));

  let pagesHtml = '';

  for (let p = 0; p < pageCount; p++) {
    const pageItems = timeline.slice(p * itemsPerPage, (p + 1) * itemsPerPage);
    const isLastPage = p === pageCount - 1;

    pagesHtml += `
      <div style="page-break-after: ${isLastPage ? 'auto' : 'always'}; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
        <!-- Brand Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #16a34a; padding-bottom: 10px; margin-bottom: 12px;">
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #15803d; letter-spacing: -0.5px;">FarmsKing</h1>
            <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">WORKER STATEMENT / ਖਾਤਾ ਸਟੇਟਮੈਂਟ</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #334155;">Date: ${new Date().toLocaleDateString('en-IN')}</p>
            <p style="margin: 2px 0 0 0; font-size: 10.5px; color: #16a34a; font-weight: 700;">Page ${p + 1} of ${pageCount}</p>
          </div>
        </div>

        <!-- Farmer & Worker Info Box -->
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px;">
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #15803d; text-transform: uppercase;">👨‍🌾 Farmer Details</p>
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${farmerName}</p>
            ${farmerMobile ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">📱 ${farmerMobile}</p>` : ''}
            ${farmerVillage ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">📍 ${farmerVillage}</p>` : ''}
          </div>

          <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">👤 Worker Details</p>
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${workerName}</p>
            ${workerMobile ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">📱 ${workerMobile}</p>` : ''}
          </div>
        </div>

        <!-- Financial Summary Banner -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <div style="flex: 1; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 6px; padding: 8px; text-align: center;">
            <p style="margin: 0; font-size: 10px; font-weight: 700; color: #c2410c;">Total Earned</p>
            <p style="margin: 2px 0 0 0; font-size: 15px; font-weight: 800; color: #c2410c;">₹${totalEarned.toLocaleString('en-IN')}</p>
          </div>
          <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px; text-align: center;">
            <p style="margin: 0; font-size: 10px; font-weight: 700; color: #15803d;">Total Paid</p>
            <p style="margin: 2px 0 0 0; font-size: 15px; font-weight: 800; color: #15803d;">₹${totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div style="flex: 1; background: ${pendingBalance > 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${pendingBalance > 0 ? '#fecdd3' : '#bbf7d0'}; border-radius: 6px; padding: 8px; text-align: center;">
            <p style="margin: 0; font-size: 10px; font-weight: 700; color: ${pendingBalance > 0 ? '#b91c1c' : '#15803d'};">Net Balance</p>
            <p style="margin: 2px 0 0 0; font-size: 15px; font-weight: 800; color: ${pendingBalance > 0 ? '#dc2626' : '#16a34a'};">
              ₹${pendingBalance.toLocaleString('en-IN')} ${pendingBalance > 0 ? 'Dr (ਦੇਣੀ)' : 'Nil'}
            </p>
          </div>
        </div>

        <!-- Ledger Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background: #334155; color: #ffffff; font-size: 11px; font-weight: 700; text-align: left;">
              <th style="padding: 8px 10px; width: 75px;">Date</th>
              <th style="padding: 8px 10px;">Particulars / Description</th>
              <th style="padding: 8px 10px; text-align: right; color: #ffedd5; width: 85px;">Earned (+)</th>
              <th style="padding: 8px 10px; text-align: right; color: #bbf7d0; width: 85px;">Paid (-)</th>
              <th style="padding: 8px 10px; text-align: right; width: 95px;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${
              pageItems.length === 0
                ? `<tr><td colspan="5" style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">No entries recorded</td></tr>`
                : pageItems
                    .map((item, idx) => {
                      const isWork = item.type === 'WORK';
                      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                      const formattedDate = new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
                      return `
                        <tr style="background: ${bg}; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                          <td style="padding: 8px 10px; color: #475569; font-weight: 600;">${formattedDate}</td>
                          <td style="padding: 8px 10px;">
                            <div style="font-weight: 700; color: #0f172a;">${item.title}</div>
                            ${item.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 1px;">${item.description}</div>` : ''}
                            ${item.notes ? `<div style="font-size: 10.5px; color: #475569; margin-top: 1px; font-style: italic;">📝 ${item.notes}</div>` : ''}
                          </td>
                          <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #c2410c;">
                            ${isWork ? `+₹${item.amount.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #16a34a;">
                            ${!isWork ? `-₹${item.amount.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: ${item.runningBalance > 0 ? '#dc2626' : '#16a34a'};">
                            ₹${item.runningBalance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      `;
                    })
                    .join('')
            }
          </tbody>
        </table>

        <!-- Page Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #64748b;">
          <div>Generated via <strong>FarmsKing App</strong> — Farm Management & Khata Ledger</div>
          <div>Page ${p + 1} of ${pageCount}</div>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Worker Statement - ${workerName}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; background: #ffffff; }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
    </html>
  `;
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  summarySubtitle: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  addWorkerTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  addWorkerTopBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 9.5, fontFamily: FONT.bold, color: '#64748b' },
  metricValue: { fontSize: 12.5, fontFamily: FONT.extraBold, marginTop: 1 },
  quickActionRow: { flexDirection: 'row', gap: 6 },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  quickActionBtnText: { fontSize: 11.5, fontFamily: FONT.bold },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.pill,
    padding: 3,
    gap: 4,
  },
  subTabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  subTabChipActive: { backgroundColor: '#16a34a' },
  subTabText: { fontSize: 11, fontFamily: FONT.bold, color: '#475569' },
  subTabTextActive: { color: '#ffffff' },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#334155' },
  emptySub: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', maxWidth: 300 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' },
  workerCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  workerCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workerName: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  workerMeta: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  balanceBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#fecdd3' },
  balanceBadgeText: { fontSize: 10.5, fontFamily: FONT.extraBold },
  workerMetricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  workerMetricText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#475569' },
  workerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
  },
  workerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    paddingVertical: 3,
  },
  workerActionText: { fontSize: 10.5, fontFamily: FONT.bold },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  itemCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemWorkerName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  itemDate: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8' },
  itemCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemType: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ea580c' },
  itemQtyRate: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  itemAmount: { fontSize: 15, fontFamily: FONT.extraBold, color: '#c2410c' },
  itemNotes: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FONT.medium,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  pickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  pickerChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  pickerChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569' },
  pickerChipTextActive: { color: '#ffffff' },
  calcBox: {
    backgroundColor: '#fff7ed',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffedd5',
    marginTop: 8,
  },
  calcTitle: { fontSize: 10.5, fontFamily: FONT.bold, color: '#9a3412' },
  calcValue: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#c2410c', marginTop: 1 },
  errorText: { color: '#dc2626', fontSize: 11.5, fontFamily: FONT.bold, marginTop: 4 },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
  },
  cancelBtnText: { color: '#475569', fontFamily: FONT.bold, fontSize: 13 },
  saveBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
  },
  saveBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  statementWorkerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  statementWorkerName: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  statementWorkerMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  callSmallBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
  statementMetricsBox: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: 12,
  },
  statementMetricItem: { flex: 1, alignItems: 'center' },
  statementMetricLabel: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b' },
  statementMetricVal: { fontSize: 12.5, fontFamily: FONT.extraBold, marginTop: 2 },
  ledgerHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: RADIUS.xs,
    marginBottom: 4,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  ledgerParticulars: { fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' },
  ledgerNotes: { fontSize: 10, fontFamily: FONT.medium, color: '#64748b' },
  ledgerVal: { fontSize: 11, fontFamily: FONT.bold, textAlign: 'right' },
  emptyLedgerBox: { padding: 20, alignItems: 'center' },
  emptyLedgerText: { fontSize: 12, color: '#94a3b8', fontFamily: FONT.medium },
  shareWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 12,
  },
  shareWaBtnText: { color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold },
});
