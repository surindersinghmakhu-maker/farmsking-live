import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { PortalId, PORTALS } from './portalConfig';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  portal: PortalId | 'ALL';
  path: string;
}

const COMMANDS: CommandItem[] = [
  // Admin HQ Commands
  { id: 'cpanel', title: 'C-Panel Control Hub', subtitle: 'Manage servers, configurations, and core settings', icon: 'settings', portal: 'ADMIN_HQ', path: '/admin/(tabs)/cpanel' },
  { id: 'super-users', title: 'Super Users Directory', subtitle: 'Manage all platform users, staff, and access roles', icon: 'people', portal: 'ADMIN_HQ', path: '/admin/(tabs)/super-users' },
  { id: 'wallet-ledger', title: 'Global Wallet & Accounts Ledger', subtitle: 'Master treasury, bank transactions, and payouts', icon: 'wallet', portal: 'ADMIN_HQ', path: '/admin/(tabs)/wallet' },
  { id: 'audit-logs', title: 'Security Audit Logs', subtitle: 'Track administrative logins, data mutations, and events', icon: 'shield-checkmark', portal: 'ADMIN_HQ', path: '/admin/(tabs)/super-audit-log' },

  // Garden Commands
  { id: 'garden-overview', title: 'GreenSpace™ Dashboard', subtitle: 'Horticulture advisory overview and active consultations', icon: 'flower', portal: 'GARDEN', path: '/garden/(tabs)' },
  { id: 'garden-doses', title: 'Plant Nutrition & Dose Formulator', subtitle: 'Manage disease remedies, fertilizers, and sprays', icon: 'medkit', portal: 'GARDEN', path: '/garden/(tabs)/doses' },
  { id: 'garden-advisors', title: 'Horticulture Advisors Network', subtitle: 'Verify specialist profiles and active consultations', icon: 'ribbon', portal: 'GARDEN', path: '/garden/(tabs)/advisors' },
  { id: 'garden-store', title: 'Flora & Nursery Store', subtitle: 'Plant saplings, seeds, and specialized gardening tools', icon: 'basket', portal: 'GARDEN', path: '/garden/(tabs)/flora-store' },

  // Shop Commands
  { id: 'shop-catalog', title: 'Product Catalog Management', subtitle: 'Manage live products, inventory, prices, and stock', icon: 'cube', portal: 'SHOP', path: '/shop/(tabs)/products' },
  { id: 'shop-orders', title: 'Commerce Orders Desk', subtitle: 'Process incoming orders, dispatch, and tracking', icon: 'cart', portal: 'SHOP', path: '/shop/(tabs)/orders' },
  { id: 'shop-sellers', title: 'Verified Sellers & Directory', subtitle: 'Manage vendors, KYC compliance, and commission rates', icon: 'business', portal: 'SHOP', path: '/shop/(tabs)/sellers' },
  { id: 'shop-coupons', title: 'VIP Passes & Coupons Hub', subtitle: 'Create promotional discount codes and vouchers', icon: 'pricetag', portal: 'SHOP', path: '/shop/(tabs)/coupons' },

  // Farmer Commands
  { id: 'farmer-hub', title: 'Agri-Hub Command', subtitle: 'Field analytics, mandi rates, and crop radar', icon: 'leaf', portal: 'FARMER', path: '/farmer/(tabs)' },
  { id: 'crop-intelligence', title: 'Crop Intelligence Engine', subtitle: 'Sowing calendar, weather forecasts, and soil health', icon: 'analytics', portal: 'FARMER', path: '/farmer/(tabs)/crop-intelligence' },
  { id: 'satellite-map', title: 'Satellite Farm Radar', subtitle: 'Field boundary mapping and NDVI moisture health', icon: 'planet', portal: 'FARMER', path: '/farmer/(tabs)/satellite-map' },
  { id: 'farmer-workforce', title: 'Field Workforce & Supervisors', subtitle: 'Manage supervisors, farm labour, and field assignments', icon: 'people-circle', portal: 'FARMER', path: '/farmer/(tabs)/workforce' },

  // Staff Commands
  { id: 'staff-desk', title: 'Operations Command Desk', subtitle: 'Fleet operations, dispatch, and field activities', icon: 'compass', portal: 'STAFF', path: '/staff/(tabs)' },
  { id: 'staff-trainers', title: 'Technical Field Trainers', subtitle: 'Manage agricultural field trainers and workshops', icon: 'school', portal: 'STAFF', path: '/staff/(tabs)/trainers' },
  { id: 'staff-operators', title: 'Logistics Operators', subtitle: 'Coordinate order dispatch, warehousing, and delivery', icon: 'swap-horizontal', portal: 'STAFF', path: '/staff/(tabs)/operators' },
  { id: 'staff-partners', title: 'Strategic Business Partners', subtitle: 'Partner earnings, referral codes, and alliance hubs', icon: 'briefcase', portal: 'STAFF', path: '/staff/(tabs)/partners' },
];

export function UniversalCommandPalette({ activePortalId }: { activePortalId?: PortalId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = COMMANDS.filter((item) => {
    const matchesPortal = !activePortalId || item.portal === activePortalId || item.portal === 'ALL';
    const matchesQuery =
      query.trim() === '' ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase());
    return matchesPortal && matchesQuery;
  });

  const handleSelect = (cmd: CommandItem) => {
    setOpen(false);
    setQuery('');
    router.push(cmd.path as any);
  };

  return (
    <>
      {/* Floating Spotlight Launcher Button (Visible on mobile/tablet) */}
      <TouchableOpacity
        style={styles.floatingTrigger}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="flash" size={14} color="#10b981" />
        <Text style={styles.floatingTriggerText}>Cmd+K</Text>
      </TouchableOpacity>

      {/* Spotlight Modal */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            {/* Search Input */}
            <View style={styles.inputRow}>
              <Ionicons name="search" size={18} color="#10b981" />
              <TextInput
                style={styles.input}
                placeholder="Type a command, screen, or tool..."
                placeholderTextColor="#64748b"
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
              <View style={styles.escBadge}>
                <Text style={styles.escText}>ESC</Text>
              </View>
            </View>

            {/* List */}
            <ScrollView style={styles.scrollList} keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No matching commands in this portal.</Text>
                </View>
              ) : (
                filtered.map((item) => {
                  const pTheme = item.portal !== 'ALL' ? PORTALS[item.portal] : null;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemRow}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(item)}
                    >
                      <View style={[styles.itemIconBox, pTheme && { backgroundColor: pTheme.primaryColor }]}>
                        <Ionicons name={item.icon as any} size={16} color="#ffffff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#64748b" />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingTrigger: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 9999,
    ...premiumShadow('#000000', 'md'),
  },
  floatingTriggerText: {
    color: '#f8fafc',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  modalBox: {
    width: '90%',
    maxWidth: 620,
    maxHeight: '75%',
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    ...premiumShadow('#000000', 'lg'),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  escBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  escText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  scrollList: {
    padding: 8,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  itemSubtitle: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
});
