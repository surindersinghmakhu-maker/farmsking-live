import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Pressable, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BlurView } from 'expo-blur';

export interface QuickViewData {
  id: string;
  type: 'SELLER_KYC' | 'FARMER_PROFILE' | 'DOCTOR_PROFILE' | 'ORDER_DETAILS' | 'PAYOUT_REQUEST';
  title: string;
  subtitle: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  details: { label: string; value: string }[];
  documents?: { title: string; verified: boolean }[];
  onApprove?: () => void;
  onReject?: () => void;
}

interface Props {
  data: QuickViewData | null;
  onClose: () => void;
}

export function AdminQuickViewDrawer({ data, onClose }: Props) {
  if (!data) return null;

  return (
    <Modal visible={!!data} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Slide-in Drawer Card from Right */}
        <Pressable style={styles.drawerCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.typeBadge}>{data.type.replace('_', ' ')}</Text>
                <View style={[styles.statusBadge, data.status === 'APPROVED' ? styles.statusApproved : data.status === 'PENDING' ? styles.statusPending : styles.statusRejected]}>
                  <Text style={styles.statusBadgeText}>{data.status}</Text>
                </View>
              </View>
              <Text style={styles.drawerTitle}>{data.title}</Text>
              <Text style={styles.drawerSubtitle}>{data.subtitle}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Drawer Body Details */}
          <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>PROFILE & VERIFICATION DETAILS</Text>
            
            <View style={styles.detailsGrid}>
              {data.details.map((item, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {data.documents && data.documents.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>ATTACHED DOCUMENTS & LICENSES</Text>
                {data.documents.map((doc, idx) => (
                  <View key={idx} style={styles.docItemRow}>
                    <Ionicons name="document-text" size={18} color="#00ff87" />
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <View style={styles.verifiedTag}>
                      <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                      <Text style={styles.verifiedTagText}>Verified</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons Footer */}
          <View style={styles.drawerFooter}>
            {data.onReject && (
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => { data.onReject?.(); onClose(); }}
              >
                <Ionicons name="close-circle" size={16} color="#fb7185" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            )}

            {data.onApprove && (
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => { data.onApprove?.(); onClose(); }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#020d06" />
                <Text style={styles.approveBtnText}>Approve & Verify</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  drawerCard: {
    width: Platform.OS === 'web' ? 440 : '88%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    ...premiumShadow('#64748b', 'xl') as any,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#059669',
    letterSpacing: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  statusApproved: { backgroundColor: '#d1fae5' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusRejected: { backgroundColor: '#fee2e2' },
  statusBadgeText: { fontSize: 10, fontFamily: FONT.bold, color: '#0f172a' },
  drawerTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a' },
  drawerSubtitle: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBody: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  detailsGrid: { gap: 10 },
  detailRow: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailLabel: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  detailValue: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a', marginTop: 3 },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  docTitle: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#0f172a' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedTagText: { fontSize: 10, fontFamily: FONT.bold, color: '#10b981' },
  drawerFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
  },
  rejectBtnText: { fontSize: 13, fontFamily: FONT.bold, color: '#b91c1c' },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    ...premiumShadow('#10b981', 'sm') as any,
  },
  approveBtnText: { fontSize: 13, fontFamily: FONT.extraBold, color: '#ffffff' },
});
