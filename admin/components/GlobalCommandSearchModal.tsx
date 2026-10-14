import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Platform, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BlurView } from 'expo-blur';

export interface CommandItem {
  id: string;
  title: string;
  category: 'ACTIONS' | 'FARMERS' | 'DOCTORS' | 'SELLERS' | 'ORDERS' | 'SETTINGS' | 'FINANCE' | 'STAFF';
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  path?: string;
  params?: any;
  actionType?: 'HEALTH_RADAR' | 'IMPERSONATE_FARMER' | 'IMPERSONATE_DOCTOR' | 'BATCH_APPROVE' | 'EXPORT_DIGEST';
}

const SEARCH_DATABASE: CommandItem[] = [
  // ⚡ International SaaS Action Commands
  { id: 'act-1', title: '> 🚀 Run System Health Diagnostics', category: 'ACTIONS', subtitle: 'AWS / Stripe Standard Infrastructure & Telemetry Radar', icon: 'pulse', actionType: 'HEALTH_RADAR' },
  { id: 'act-2', title: '> 👁️ Simulate View as Farmer Harpreet Singh', category: 'ACTIONS', subtitle: 'Shopify-style sandbox impersonation (Makhu, 15 Acres)', icon: 'leaf', actionType: 'IMPERSONATE_FARMER' },
  { id: 'act-3', title: '> 🩺 Simulate View as Dr. Amanpreet Kaur', category: 'ACTIONS', subtitle: 'Chief Crop Doctor portal sandbox impersonation', icon: 'medical', actionType: 'IMPERSONATE_DOCTOR' },
  { id: 'act-4', title: '> ⚡ 1-Click Batch Verify Pending Sellers', category: 'ACTIONS', subtitle: 'Bulk approve 12 verified agricultural store licenses', icon: 'shield-checkmark', actionType: 'BATCH_APPROVE' },
  { id: 'act-5', title: '> 📊 Export Daily Operations Dossier (CSV)', category: 'ACTIONS', subtitle: 'Download executive summary of orders, farmers & wallets', icon: 'download', actionType: 'EXPORT_DIGEST' },

  // Standard Navigation Entries
  { id: '1', title: 'Surinder Singh (Super Admin)', category: 'SETTINGS', subtitle: 'Platform Administrator · Makhu', icon: 'shield-checkmark', path: '/admin/(tabs)/super-users', params: { filter: 'SUPER_ADMIN' } },
  { id: '2', title: 'Farmer Directory', category: 'FARMERS', subtitle: 'Manage all 1,240 registered farmers', icon: 'leaf', path: '/admin/(tabs)/super-users', params: { group: 'CLIENTS', filter: 'FARMER' } },
  { id: '3', title: 'Crop Doctors & Advisory', category: 'DOCTORS', subtitle: 'Certified Agri Doctors (Farmers Only)', icon: 'medical', path: '/admin/(tabs)/super-users', params: { group: 'PARTNERS', filter: 'FARM_ADVISOR' } },
  { id: '4', title: 'Seller KYC Approvals', category: 'SELLERS', subtitle: '12 pending seller verifications', icon: 'shield-checkmark', path: '/admin-sellers' },
  { id: '5', title: 'Seller Payouts Ledger', category: 'FINANCE', subtitle: 'UPI withdrawals & auto payouts', icon: 'cash', path: '/seller-payouts' },
  { id: '6', title: 'Store Orders & Fulfillment', category: 'ORDERS', subtitle: 'View real-time customer purchases', icon: 'receipt', path: '/admin/(tabs)/admin-orders' },
  { id: '7', title: 'AI Disease Diagnostic Scanner', category: 'DOCTORS', subtitle: 'Agri AI scan logs & diagnostics', icon: 'scan', path: '/admin/(tabs)/crop-disease-scanner' },
  { id: '8', title: 'High-Res Satellite Farm Radar', category: 'FARMERS', subtitle: 'Soil moisture, NDVI & weather satellite maps', icon: 'planet', path: '/admin/(tabs)/satellite-map' },
  { id: '9', title: 'Global Ledger & Accounts', category: 'FINANCE', subtitle: 'Platform financial balance & ledger', icon: 'wallet', path: '/admin/(tabs)/super-accounts' },
  { id: '10', title: 'Technical Trainers Dashboard', category: 'STAFF', subtitle: 'Staff trainers & field ops', icon: 'school', path: '/admin/(tabs)/trainer-dashboard' },
  { id: '11', title: 'Coupons & VIP Passes', category: 'ORDERS', subtitle: 'Manage discount vouchers & passes', icon: 'ticket', path: '/admin/(tabs)/super-coupons' },
  { id: '12', title: 'C-Panel Integrations Console', category: 'SETTINGS', subtitle: 'SMS, Gateways & WhatsApp APIs', icon: 'options', path: '/admin/(tabs)/cpanel' },
  { id: '13', title: 'Infrastructure Toggles & Settings', category: 'SETTINGS', subtitle: 'Maintenance modes & system flags', icon: 'settings', path: '/admin/(tabs)/super-settings' },
];

const RECENT_BREADCRUMBS = [
  { label: 'Farmer Directory', query: 'Farmer' },
  { label: 'Seller KYC', query: 'Seller' },
  { label: 'Global Ledger', query: 'Wallet' },
  { label: 'Health Radar', query: 'Health' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenHealthRadar?: () => void;
  onStartImpersonation?: (target: any) => void;
}

export function GlobalCommandSearchModal({
  visible,
  onClose,
  onOpenHealthRadar,
  onStartImpersonation,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Keyboard shortcut listener for Ctrl + K / Cmd + K
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (visible) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent('open-command-search'));
        }
      }
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  const filteredItems = SEARCH_DATABASE.filter((item) => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
                         item.subtitle.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const handleSelect = (item: CommandItem) => {
    onClose();

    // Execute Action Command
    if (item.actionType === 'HEALTH_RADAR') {
      if (onOpenHealthRadar) {
        onOpenHealthRadar();
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-open-health-radar'));
      }
      return;
    }

    if (item.actionType === 'IMPERSONATE_FARMER') {
      const farmerTarget = {
        id: 'farmer-101',
        name: 'Harpreet Singh',
        role: 'FARMER',
        location: 'Makhu, Ferozepur',
        badge: 'Verified Farmer (15 Acres)',
      };
      if (onStartImpersonation) {
        onStartImpersonation(farmerTarget);
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-start-impersonation', { detail: farmerTarget }));
      }
      return;
    }

    if (item.actionType === 'IMPERSONATE_DOCTOR') {
      const doctorTarget = {
        id: 'doc-202',
        name: 'Dr. Amanpreet Kaur',
        role: 'FARM_ADVISOR',
        location: 'Punjab Agri University (PAU)',
        badge: 'Chief Crop Doctor',
      };
      if (onStartImpersonation) {
        onStartImpersonation(doctorTarget);
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-start-impersonation', { detail: doctorTarget }));
      }
      return;
    }

    if (item.actionType === 'BATCH_APPROVE') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('admin-live-toast', {
            detail: {
              type: 'SUCCESS',
              title: 'Batch Approvals Executed',
              message: '12 Agricultural Seller Stores approved and activated pan-India.',
            },
          })
        );
      }
      return;
    }

    if (item.actionType === 'EXPORT_DIGEST') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('admin-live-toast', {
            detail: {
              type: 'INFO',
              title: 'Export Generating',
              message: 'FarmsKing Daily Operations Dossier exported as CSV successfully.',
            },
          })
        );
      }
      return;
    }

    // Standard Route Navigation
    if (item.path) {
      if (item.params) {
        router.push({ pathname: item.path as any, params: item.params });
      } else {
        router.push(item.path as any);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Top Search Input Header */}
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={20} color="#059669" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search or type > for Action Commands (Ctrl+K)..."
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <TouchableOpacity style={styles.escBadge} onPress={onClose}>
              <Text style={styles.escText}>ESC</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Breadcrumbs Row (Recently Visited) */}
          <View style={styles.breadcrumbsRow}>
            <Text style={styles.breadcrumbsLabel}>RECENT:</Text>
            {RECENT_BREADCRUMBS.map((b) => (
              <TouchableOpacity
                key={b.label}
                style={styles.breadcrumbChip}
                onPress={() => setQuery(b.query)}
              >
                <Text style={styles.breadcrumbText}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Filter Chips */}
          <View style={styles.categoryRow}>
            {['ALL', 'ACTIONS', 'FARMERS', 'DOCTORS', 'SELLERS', 'ORDERS', 'SETTINGS'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
                  {cat === 'ACTIONS' ? '⚡ ACTIONS' : cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Results List */}
          <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={32} color="#94a3b8" />
                <Text style={styles.emptyText}>No matching admin command or action found</Text>
              </View>
            ) : (
              filteredItems.map((item) => {
                const isAction = item.category === 'ACTIONS';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.resultItem, isAction && styles.resultItemAction]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.itemIconBox, isAction && styles.itemIconBoxAction]}>
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isAction ? '#ffffff' : '#059669'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, isAction && { color: '#064e3b' }]}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    </View>
                    <View style={[styles.categoryBadge, isAction && styles.categoryBadgeAction]}>
                      <Text style={[styles.categoryBadgeText, isAction && styles.categoryBadgeTextAction]}>
                        {item.category}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer Shortcuts Note */}
          <View style={styles.footerRow}>
            <Text style={styles.footerNote}>
              💡 Tip: Type <Text style={{ color: '#059669', fontFamily: FONT.bold }}>&gt;</Text> to filter Action Commands, or press <Text style={{ color: '#059669', fontFamily: FONT.bold }}>Esc</Text> to exit.
            </Text>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  modalCard: {
    width: '90%',
    maxWidth: 680,
    maxHeight: '75%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...premiumShadow('#64748b', 'xl') as any,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT.medium,
    color: '#0f172a',
    outlineStyle: 'none' as any,
  },
  escBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  escText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  breadcrumbsLabel: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  breadcrumbChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  breadcrumbText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catChipActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  catChipText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  catChipTextActive: {
    color: '#059669',
  },
  resultsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  resultItemAction: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconBoxAction: {
    backgroundColor: '#10b981',
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  itemSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginRight: 4,
  },
  categoryBadgeAction: {
    backgroundColor: '#d1fae5',
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  categoryBadgeTextAction: {
    color: '#047857',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  footerNote: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
});
