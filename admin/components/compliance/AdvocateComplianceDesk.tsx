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
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import {
  ComplianceCategory,
  ComplianceStatus,
  StatutoryComplianceRecord,
  printA4StatutoryReport,
} from '@/src/api/compliance.api';
import {
  useCaSummary,
  useCreateComplianceRecord,
  useUpdateComplianceRecord,
} from '@/src/hooks/useCompliance';

const CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  MCA_ROC: 'MCA / ROC',
  GST: 'GST / GSTR-8',
  INCOME_TAX_TDS: 'Income Tax TDS',
  AGRI_LICENSE: 'Agri / FSSAI',
  PAYMENT_GATEWAY: 'Payment Gateway',
  LEGAL_NOTICE: 'Legal Notice',
  AGREEMENT: 'Agreement',
};

const STATUS_META: Record<ComplianceStatus, { label: string; color: string; bg: string }> = {
  COMPLIANT: { label: 'Compliant / Filed', color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  IN_PROGRESS: { label: 'In Progress', color: '#0284c7', bg: 'rgba(2,132,199,0.14)' },
  PENDING: { label: 'Action Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  OVERDUE: { label: 'Overdue', color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
};

export function AdvocateComplianceDesk({ mode = 'EMBEDDED' }: { mode?: 'EMBEDDED' | 'STANDALONE' }) {
  const { isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  const { data: summary, isLoading, refetch } = useCaSummary();
  const createRecord = useCreateComplianceRecord();
  const updateRecord = useUpdateComplianceRecord();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ComplianceCategory>('ALL');
  const [auditTab, setAuditTab] = useState<'FILINGS' | 'STORES_KYC' | 'PARTNERS_KYC' | 'GATEWAY'>('FILINGS');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<StatutoryComplianceRecord | null>(null);
  const [printingA4, setPrintingA4] = useState(false);

  // Modal Form States
  const [formCategory, setFormCategory] = useState<ComplianceCategory>('MCA_ROC');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthority, setFormAuthority] = useState('');
  const [formRefNo, setFormRefNo] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState<'ADVOCATE' | 'CA' | 'ACCOUNTANT' | 'DIRECTOR'>('ADVOCATE');
  const [formStatus, setFormStatus] = useState<ComplianceStatus>('PENDING');
  const [formNotes, setFormNotes] = useState('');

  const openCreateModal = () => {
    setEditingRec(null);
    setFormCategory('MCA_ROC');
    setFormTitle('');
    setFormAuthority('');
    setFormRefNo('');
    setFormAssignedTo('ADVOCATE');
    setFormStatus('PENDING');
    setFormNotes('');
    setIsAddOpen(true);
  };

  const openEditModal = (rec: StatutoryComplianceRecord) => {
    setEditingRec(rec);
    setFormCategory(rec.category);
    setFormTitle(rec.title);
    setFormAuthority(rec.authority || '');
    setFormRefNo(rec.referenceNo || '');
    setFormAssignedTo((rec.assignedTo as any) || 'ADVOCATE');
    setFormStatus(rec.status);
    setFormNotes(rec.notes || '');
    setIsAddOpen(true);
  };

  const handleSaveRecord = async () => {
    if (!formTitle.trim()) {
      const msg = 'Please enter a filing title or legal task description.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Required', msg);
      return;
    }
    try {
      const payload = {
        category: formCategory,
        title: formTitle.trim(),
        authority: formAuthority.trim() || undefined,
        referenceNo: formRefNo.trim() || undefined,
        assignedTo: formAssignedTo,
        status: formStatus,
        filedDate: formStatus === 'COMPLIANT' ? new Date().toISOString() : undefined,
        notes: formNotes.trim() || undefined,
      };
      if (editingRec) {
        await updateRecord.mutateAsync({ id: editingRec.id, payload });
      } else {
        await createRecord.mutateAsync(payload);
      }
      setIsAddOpen(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save record.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const handleQuickMarkCompliant = async (rec: StatutoryComplianceRecord) => {
    await updateRecord.mutateAsync({
      id: rec.id,
      payload: {
        status: rec.status === 'COMPLIANT' ? 'PENDING' : 'COMPLIANT',
        filedDate: rec.status === 'COMPLIANT' ? undefined : new Date().toISOString(),
      },
    });
  };

  const handlePrintA4 = async () => {
    if (!summary) return;
    try {
      setPrintingA4(true);
      await printA4StatutoryReport(summary, 'ADVOCATE_STATUTORY');
    } finally {
      setPrintingA4(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <View style={{ padding: 40, alignItems: 'center', gap: 10 }}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ color: subTextColor, fontSize: 13, fontFamily: FONT.medium }}>
          Loading Advocate Statutory Filings, KYC Audits &amp; Payment Gateway Checks...
        </Text>
      </View>
    );
  }

  const co = summary.companyRegistryReadiness;
  const audit = summary.kycComplianceAudit;
  const records = summary.statutoryRecords.filter(
    (r) => categoryFilter === 'ALL' || r.category === categoryFilter,
  );

  return (
    <View style={{ gap: 14 }}>
      {/* Header Banner */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: isLight ? '#eff6ff' : '#0b182d', borderColor: isLight ? '#93c5fd' : '#1e3a8a' },
          premiumShadow('#0284c7', 'sm'),
        ]}
      >
        <View style={{ flex: 1, minWidth: 260 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="shield-checkmark" size={19} color="#0284c7" />
            <Text style={[styles.heroTitle, { color: textColor }]}>
              Advocate &amp; Legal Compliance Desk
            </Text>
            <View style={styles.modularBadge}>
              <Text style={styles.modularBadgeText}>
                {mode === 'STANDALONE' ? 'STANDALONE ADVOCATE MODULE' : 'ROLE-READY MODULE'}
              </Text>
            </View>
          </View>
          <Text style={[styles.heroSub, { color: subTextColor }]}>
            Tracks MCA/ROC filings, GST/TDS challans, Seed/Pesticide/FSSAI licenses, legal notices &amp; Payment Gateway readiness. Designed to split into an independent ADVOCATE role login.
          </Text>
        </View>

        <View style={styles.actionBtnGroup}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0284c7' }]} onPress={openCreateModal}>
            <Ionicons name="add-circle-outline" size={16} color="#ffffff" />
            <Text style={styles.actionBtnText}>Add Govt Filing / Notice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#059669' }]}
            onPress={handlePrintA4}
            disabled={printingA4}
          >
            <Ionicons name="print-outline" size={15} color="#ffffff" />
            <Text style={styles.actionBtnText}>{printingA4 ? 'Preparing...' : 'A4 Legal Dossier'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={15} color={isLight ? '#0f172a' : '#e2e8f0'} />
            <Text style={[styles.actionBtnText, { color: isLight ? '#0f172a' : '#e2e8f0' }]}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Corporate Identity & Readiness Snapshot */}
      <View style={styles.snapshotGrid}>
        <View style={[styles.snapCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.snapLabel, { color: subTextColor }]}>Corporate MCA / ROC</Text>
          <Text style={[styles.snapVal, { color: textColor }]}>{co.cin}</Text>
          <Text style={[styles.snapSub, { color: subTextColor }]}>{co.rocJurisdiction}</Text>
        </View>
        <View style={[styles.snapCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.snapLabel, { color: subTextColor }]}>Company GSTIN / PAN / TAN</Text>
          <Text style={[styles.snapVal, { color: co.gstinConfigured && co.panConfigured ? '#10b981' : '#f59e0b' }]}>
            {co.gstinConfigured ? 'GST Active' : 'GST Pending'} · {co.panConfigured ? 'PAN Active' : 'PAN Pending'} · {co.tanConfigured ? 'TAN Active' : 'TAN Pending'}
          </Text>
          <Text style={[styles.snapSub, { color: subTextColor }]}>Set real numbers in C-Panel / AppSettings</Text>
        </View>
        <View style={[styles.snapCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.snapLabel, { color: subTextColor }]}>Seller Stores Audit</Text>
          <Text style={[styles.snapVal, { color: audit.nonCompliantStoresCount > 0 ? '#ef4444' : '#10b981' }]}>
            {audit.stores.length - audit.nonCompliantStoresCount} / {audit.stores.length} Compliant
          </Text>
          <Text style={[styles.snapSub, { color: subTextColor }]}>{audit.nonCompliantStoresCount} stores need KYC / license action</Text>
        </View>
        <View style={[styles.snapCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.snapLabel, { color: subTextColor }]}>Advisors &amp; Agents KYC</Text>
          <Text style={[styles.snapVal, { color: audit.nonCompliantPartnersCount > 0 ? '#f59e0b' : '#10b981' }]}>
            {audit.partners.length - audit.nonCompliantPartnersCount} / {audit.partners.length} PAN/Bank Ready
          </Text>
          <Text style={[styles.snapSub, { color: subTextColor }]}>{audit.tradersWithoutGstinCount} / {audit.tradersCount} Traders without GSTIN</Text>
        </View>
      </View>

      {/* Sub-Section Switcher */}
      <View style={styles.tabRow}>
        {[
          { id: 'FILINGS' as const, label: `Govt Filings & Notices (${summary.statutoryRecords.length})` },
          { id: 'STORES_KYC' as const, label: `Seller Store KYC & Licenses (${audit.nonCompliantStoresCount} Issues)` },
          { id: 'PARTNERS_KYC' as const, label: `Partner / Doctor PAN Audit (${audit.nonCompliantPartnersCount} Pending)` },
          { id: 'GATEWAY' as const, label: 'Payment Gateway & Policy Checklist' },
        ].map((t) => {
          const active = auditTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setAuditTab(t.id)}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: active ? '#0284c7' : cardBg,
                  borderColor: active ? '#0284c7' : cardBorder,
                },
              ]}
            >
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: active ? '#ffffff' : textColor }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 1. Statutory Government Filings & Legal Notices */}
      {auditTab === 'FILINGS' && (
        <View style={[styles.panel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.filterRow}>
            {(['ALL', 'MCA_ROC', 'GST', 'INCOME_TAX_TDS', 'AGRI_LICENSE', 'PAYMENT_GATEWAY', 'LEGAL_NOTICE', 'AGREEMENT'] as const).map(
              (c) => {
                const active = categoryFilter === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategoryFilter(c)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? '#1e40af' : isLight ? '#f1f5f9' : '#0f172a',
                        borderColor: active ? '#1e40af' : cardBorder,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: active ? '#ffffff' : subTextColor }}>
                      {c === 'ALL' ? 'All Records' : CATEGORY_LABELS[c]}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>

          <View style={{ gap: 8 }}>
            {records.map((rec) => {
              const st = STATUS_META[rec.status] || STATUS_META.PENDING;
              return (
                <View
                  key={rec.id}
                  style={[styles.recordRow, { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: cardBorder }]}
                >
                  <View style={{ flex: 1, minWidth: 240 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{CATEGORY_LABELS[rec.category] || rec.category}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                      <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: subTextColor }}>
                        Owner: {rec.assignedTo || 'ADVOCATE'}
                      </Text>
                    </View>
                    <Text style={[styles.recTitle, { color: textColor }]}>{rec.title}</Text>
                    <Text style={[styles.recMeta, { color: subTextColor }]}>
                      Authority: {rec.authority || 'N/A'} · Ref/SRN: {rec.referenceNo || 'Not Filed Yet'}
                    </Text>
                    {rec.notes ? (
                      <Text style={[styles.recNotes, { color: subTextColor }]}>{rec.notes}</Text>
                    ) : null}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: rec.status === 'COMPLIANT' ? '#334155' : '#059669' }]}
                      onPress={() => handleQuickMarkCompliant(rec)}
                    >
                      <Ionicons name={rec.status === 'COMPLIANT' ? 'refresh' : 'checkmark-done'} size={14} color="#ffffff" />
                      <Text style={styles.smallBtnText}>
                        {rec.status === 'COMPLIANT' ? 'Reopen' : 'Mark Filed'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#1e40af' }]} onPress={() => openEditModal(rec)}>
                      <Ionicons name="create-outline" size={14} color="#ffffff" />
                      <Text style={styles.smallBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 2. Seller Store KYC & Expiry Audit */}
      {auditTab === 'STORES_KYC' && (
        <View style={[styles.panel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {audit.stores.length === 0 ? (
            <Text style={{ color: subTextColor, fontSize: 13 }}>No seller stores registered yet.</Text>
          ) : (
            audit.stores.map((s) => (
              <View
                key={s.storeId}
                style={[styles.recordRow, { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: s.isCompliant ? cardBorder : '#ef4444' }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recTitle, { color: textColor }]}>
                    {s.storeName} ({s.sellerType}) · KYC: {s.kycStatus}
                  </Text>
                  <Text style={[styles.recMeta, { color: subTextColor }]}>
                    Owner: {s.ownerName || '-'} ({s.ownerMobile || '-'}) · PAN: {s.panMasked || 'Missing'} · GSTIN: {s.gstin || 'Unregistered'} · Cashfree Vendor: {s.cashfreeOnboarded ? 'Linked' : 'Not Onboarded'}
                  </Text>
                  {s.issues.length > 0 ? (
                    <Text style={{ color: '#ef4444', fontSize: 11.5, fontFamily: FONT.bold, marginTop: 4 }}>
                      Missing / Expired: {s.issues.join(' | ')}
                    </Text>
                  ) : (
                    <Text style={{ color: '#10b981', fontSize: 11.5, fontFamily: FONT.bold, marginTop: 4 }}>
                      All KYC &amp; statutory license checks passed
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* 3. Partner / Advisor PAN & Aadhaar Audit */}
      {auditTab === 'PARTNERS_KYC' && (
        <View style={[styles.panel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {audit.partners.length === 0 ? (
            <Text style={{ color: subTextColor, fontSize: 13 }}>No advisors or agents registered yet.</Text>
          ) : (
            audit.partners.map((p) => (
              <View
                key={p.userId}
                style={[styles.recordRow, { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: p.isKycReady ? cardBorder : '#f59e0b' }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recTitle, { color: textColor }]}>
                    {p.name} ({p.role}) · {p.kingId || p.mobile}
                  </Text>
                  <Text style={[styles.recMeta, { color: subTextColor }]}>
                    PAN: {p.panMasked || 'MISSING'} · Bank: {p.hasBank ? 'Ready' : 'Missing'} · Aadhaar: {p.hasAadhaar ? 'Verified' : 'Missing'}
                  </Text>
                  {p.missing.length > 0 ? (
                    <Text style={{ color: '#f59e0b', fontSize: 11.5, fontFamily: FONT.bold, marginTop: 4 }}>
                      Pending: {p.missing.join(' | ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* 4. Payment Gateway & Policy Website Checklist */}
      {auditTab === 'GATEWAY' && (
        <View style={[styles.panel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.recTitle, { color: textColor }]}>
            Payment Gateway &amp; RBI PA/PG Onboarding Readiness
          </Text>
          {[
            { label: `Active Gateway Mode (${co.paymentGateways.activeGateway})`, ok: !co.paymentGateways.isSandbox, detail: co.paymentGateways.isSandbox ? 'Currently Sandbox — switch to Production keys after PG approval' : 'Production Live Mode Enabled' },
            { label: 'Cashfree Marketplace Split / Vendors Credentials', ok: co.paymentGateways.cashfreeConfigured, detail: co.paymentGateways.cashfreeConfigured ? 'Live Cashfree App ID & Secret configured' : 'Test/missing Cashfree production App ID & Secret' },
            { label: 'Razorpay Production Credentials', ok: co.paymentGateways.razorpayConfigured, detail: co.paymentGateways.razorpayConfigured ? 'Configured in environment' : 'Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET after KYC approval' },
            { label: 'PhonePe Payment Gateway Credentials', ok: co.paymentGateways.phonepeConfigured, detail: co.paymentGateways.phonepeConfigured ? 'Configured in environment' : 'Set PHONEPE_CLIENT_ID & PHONEPE_CLIENT_SECRET' },
            { label: 'Shiprocket Courier & Webhook Secret', ok: co.paymentGateways.shiprocketConfigured, detail: co.paymentGateways.shiprocketConfigured ? 'Configured in environment' : 'Set SHIPROCKET_EMAIL & SHIPROCKET_WEBHOOK_SECRET' },
            { label: 'Public Legal Pages (/terms, /privacy-policy, /refund-policy, /shipping-policy)', ok: true, detail: `All 4 statutory pages published under ${co.companyLegalName} (CIN ${co.cin})` },
            { label: `Sec 79 Named Grievance Officer (${co.grievanceOfficerName})`, ok: true, detail: `Email: ${co.grievanceOfficerEmail} | Phone: ${co.supportPhone}` },
            { label: 'Company Permanent Tax Registrations (GSTIN, PAN, TAN)', ok: co.gstinConfigured && co.panConfigured && co.tanConfigured, detail: 'Mandatory before activating live e-Commerce settlements & TDS Challan 281 deposits' },
          ].map((item) => (
            <View
              key={item.label}
              style={[styles.recordRow, { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: cardBorder }]}
            >
              <Ionicons
                name={item.ok ? 'checkmark-circle' : 'alert-circle'}
                size={22}
                color={item.ok ? '#10b981' : '#f59e0b'}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.recTitle, { color: textColor }]}>{item.label}</Text>
                <Text style={[styles.recMeta, { color: subTextColor }]}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add / Edit Statutory Compliance Record Modal */}
      <Modal visible={isAddOpen} transparent animationType="fade" onRequestClose={() => setIsAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: isLight ? '#ffffff' : '#0f172a', borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.recTitle, { color: textColor, fontSize: 16 }]}>
                {editingRec ? 'Update Statutory Filing / Notice' : 'Add Government Filing / Legal Record'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10 }}>
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(Object.keys(CATEGORY_LABELS) as ComplianceCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setFormCategory(cat)}
                    style={[
                      styles.filterChip,
                      { backgroundColor: formCategory === cat ? '#0284c7' : 'transparent', borderColor: formCategory === cat ? '#0284c7' : cardBorder },
                    ]}
                  >
                    <Text style={{ fontSize: 11, color: formCategory === cat ? '#ffffff' : textColor, fontFamily: FONT.bold }}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Filing / Compliance Title *</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                placeholder="e.g. Form MGT-7 Annual Return / GST Return"
                placeholderTextColor="#64748b"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Government Department / Authority</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                placeholder="e.g. ROC Punjab, CBIC GST, Income Tax Dept"
                placeholderTextColor="#64748b"
                value={formAuthority}
                onChangeText={setFormAuthority}
              />

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Acknowledgement / SRN / Challan / License No.</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: cardBorder }]}
                placeholder="Enter reference or SRN number"
                placeholderTextColor="#64748b"
                value={formRefNo}
                onChangeText={setFormRefNo}
              />

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Assigned Desk</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(['ADVOCATE', 'CA', 'ACCOUNTANT', 'DIRECTOR'] as const).map((roleOwner) => (
                  <TouchableOpacity
                    key={roleOwner}
                    onPress={() => setFormAssignedTo(roleOwner)}
                    style={[
                      styles.filterChip,
                      { backgroundColor: formAssignedTo === roleOwner ? '#059669' : 'transparent', borderColor: formAssignedTo === roleOwner ? '#059669' : cardBorder },
                    ]}
                  >
                    <Text style={{ fontSize: 11, color: formAssignedTo === roleOwner ? '#ffffff' : textColor, fontFamily: FONT.bold }}>
                      {roleOwner}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(['PENDING', 'IN_PROGRESS', 'COMPLIANT', 'OVERDUE'] as ComplianceStatus[]).map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setFormStatus(st)}
                    style={[
                      styles.filterChip,
                      { backgroundColor: formStatus === st ? STATUS_META[st].color : 'transparent', borderColor: formStatus === st ? STATUS_META[st].color : cardBorder },
                    ]}
                  >
                    <Text style={{ fontSize: 11, color: formStatus === st ? '#ffffff' : textColor, fontFamily: FONT.bold }}>
                      {STATUS_META[st].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Legal Notes / Action Plan</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: cardBorder, minHeight: 70 }]}
                placeholder="Notes for CA, Advocate or Directors..."
                placeholderTextColor="#64748b"
                multiline
                value={formNotes}
                onChangeText={setFormNotes}
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRecord}>
              <Text style={styles.saveBtnText}>{editingRec ? 'Update Compliance Record' : 'Save Compliance Record'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: { fontSize: 16, fontFamily: FONT.extraBold },
  heroSub: { fontSize: 11.5, fontFamily: FONT.medium, marginTop: 4, lineHeight: 17 },
  modularBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modularBadgeText: { color: '#38bdf8', fontSize: 9.5, fontFamily: FONT.extraBold },
  actionBtnGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  actionBtnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  snapCard: {
    flex: 1,
    minWidth: 210,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 3,
  },
  snapLabel: { fontSize: 10.5, fontFamily: FONT.bold },
  snapVal: { fontSize: 14, fontFamily: FONT.extraBold },
  snapSub: { fontSize: 10.5, fontFamily: FONT.medium },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabBtn: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8 },
  panel: { borderWidth: 1, borderRadius: RADIUS.lg, padding: 14, gap: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  recordRow: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  catBadge: { backgroundColor: 'rgba(148,163,184,0.16)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#38bdf8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusText: { fontSize: 10, fontFamily: FONT.bold },
  recTitle: { fontSize: 13.5, fontFamily: FONT.bold, marginTop: 4 },
  recMeta: { fontSize: 11.5, fontFamily: FONT.medium, marginTop: 2 },
  recNotes: { fontSize: 11, fontFamily: FONT.regular, marginTop: 4, lineHeight: 16 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  smallBtnText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.bold },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 18,
    gap: 8,
  },
  inputLabel: { fontSize: 11.5, fontFamily: FONT.bold },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: { color: '#ffffff', fontSize: 13.5, fontFamily: FONT.extraBold },
});

