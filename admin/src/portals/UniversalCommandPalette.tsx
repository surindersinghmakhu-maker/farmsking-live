import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { PortalId, PORTALS } from './portalConfig';
import { listProducts } from '../api/products.api';
import { listAllOrders } from '../api/orders.api';
import { listUsers } from '../api/users.api';
import { searchSprayProductCatalog } from '../api/spraySchedules.api';
import { Product, CustomerOrder, AdminUser, SprayProductCatalogItem } from '../types/api';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  portal: PortalId | 'ALL';
  path: string;
}

interface LiveSearchResult {
  id: string;
  type: 'ORDER' | 'PRODUCT' | 'USER' | 'DOSE';
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeColor?: string;
  icon: string;
  actionPath: string;
}

const STATIC_COMMANDS: CommandItem[] = [
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

const SCOPES: { id: PortalId | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Portals' },
  { id: 'ADMIN_HQ', label: 'Admin HQ' },
  { id: 'SHOP', label: 'Shop' },
  { id: 'FARMER', label: 'Farmer' },
  { id: 'GARDEN', label: 'Garden' },
  { id: 'STAFF', label: 'Staff' },
];

export function UniversalCommandPalette({ activePortalId }: { activePortalId?: PortalId }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 768));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<PortalId | 'ALL'>(activePortalId || 'ALL');
  const [liveResults, setLiveResults] = useState<LiveSearchResult[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sync activePortalId when prop changes
  useEffect(() => {
    if (activePortalId) setSelectedScope(activePortalId);
  }, [activePortalId]);

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

  // Live Database Search with 300ms Debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLiveResults([]);
      setIsSearchingDb(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDb(true);
      const results: LiveSearchResult[] = [];
      const lowerQ = trimmed.toLowerCase();

      try {
        const promises: Promise<any>[] = [];

        // 1. Search Products (Shop, HQ, or ALL)
        if (selectedScope === 'ALL' || selectedScope === 'SHOP' || selectedScope === 'ADMIN_HQ') {
          promises.push(
            listProducts(true)
              .then((products: Product[]) => {
                const matches = (products || [])
                  .filter((p) => p.name?.toLowerCase().includes(lowerQ) || p.category?.toLowerCase().includes(lowerQ))
                  .slice(0, 4);
                for (const p of matches) {
                  results.push({
                    id: `product-${p.id}`,
                    type: 'PRODUCT',
                    title: p.name,
                    subtitle: `Category: ${p.category || 'General'} • Stock: ${p.stockQty ?? 0} ${p.unit || 'units'}`,
                    badgeText: `₹${p.price}`,
                    badgeColor: '#0284c7',
                    icon: 'cube',
                    actionPath: `/shop/(tabs)/products`,
                  });
                }
              })
              .catch(() => {})
          );
        }

        // 2. Search Orders (Shop, HQ, or ALL)
        if (selectedScope === 'ALL' || selectedScope === 'SHOP' || selectedScope === 'ADMIN_HQ') {
          promises.push(
            listAllOrders()
              .then((orders: CustomerOrder[]) => {
                const matches = (orders || [])
                  .filter(
                    (o) =>
                      o.orderNumber?.toLowerCase().includes(lowerQ) ||
                      o.customer?.name?.toLowerCase().includes(lowerQ) ||
                      o.customer?.mobile?.includes(lowerQ)
                  )
                  .slice(0, 4);
                for (const o of matches) {
                  results.push({
                    id: `order-${o.id}`,
                    type: 'ORDER',
                    title: `Order #${o.orderNumber}`,
                    subtitle: `${o.customer?.name || 'Customer'} • ₹${o.totalAmount} • ${o.paymentMode}`,
                    badgeText: o.status,
                    badgeColor:
                      o.status === 'DELIVERED' ? '#10b981' : o.status === 'CANCELLED' ? '#ef4444' : '#f59e0b',
                    icon: 'cart',
                    actionPath: `/shop/(tabs)/orders`,
                  });
                }
              })
              .catch(() => {})
          );
        }

        // 3. Search Users / Farmers (HQ, Farmer, Staff, or ALL)
        if (selectedScope === 'ALL' || selectedScope === 'ADMIN_HQ' || selectedScope === 'FARMER' || selectedScope === 'STAFF') {
          promises.push(
            listUsers({ search: trimmed, limit: 4 })
              .then((resp) => {
                const usersList = (resp as any)?.items || (resp as any)?.users || [];
                for (const u of usersList) {
                  results.push({
                    id: `user-${u.id}`,
                    type: 'USER',
                    title: u.name || 'User Account',
                    subtitle: `${u.mobile} • ${u.kingId ? `King ID: ${u.kingId}` : ''} ${u.village ? `• ${u.village}` : ''}`,
                    badgeText: u.role,
                    badgeColor: '#16a34a',
                    icon: 'person',
                    actionPath: `/admin/(tabs)/super-users`,
                  });
                }
              })
              .catch(() => {})
          );
        }

        // 4. Search Plant Doses & Catalog (Garden, HQ, or ALL)
        if (selectedScope === 'ALL' || selectedScope === 'GARDEN' || selectedScope === 'ADMIN_HQ') {
          promises.push(
            searchSprayProductCatalog(trimmed)
              .then((items: SprayProductCatalogItem[]) => {
                const matches = (items || []).slice(0, 3);
                for (const item of matches) {
                  const itemAny = item as any;
                  results.push({
                    id: `dose-${item.id}`,
                    type: 'DOSE',
                    title: item.name || itemAny.productName || 'Plant Dose Item',
                    subtitle: `Category: ${item.sprayType || itemAny.category || 'Agri Care'}`,
                    badgeText: 'DOSE',
                    badgeColor: '#ec4899',
                    icon: 'medkit',
                    actionPath: `/admin/(tabs)/dose`,
                  });
                }
              })
              .catch(() => {})
          );
        }

        await Promise.allSettled(promises);
        setLiveResults(results);
      } catch {
        // Safe fallback
      } finally {
        setIsSearchingDb(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedScope]);

  // Filter static commands
  const filteredCommands = useMemo(() => {
    return STATIC_COMMANDS.filter((item) => {
      const matchesScope = selectedScope === 'ALL' || item.portal === selectedScope || item.portal === 'ALL';
      const matchesQuery =
        query.trim() === '' ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase());
      return matchesScope && matchesQuery;
    });
  }, [selectedScope, query]);

  const handleSelectCommand = (cmd: CommandItem) => {
    setOpen(false);
    setQuery('');
    router.push(cmd.path as any);
  };

  const handleSelectLiveResult = (res: LiveSearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(res.actionPath as any);
  };

  return (
    <>
      {/* Spotlight Modal (Opens via keyboard shortcut Ctrl+K/Cmd+K or global event) */}

      {/* Spotlight Modal */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            {/* Search Input Bar */}
            <View style={styles.inputRow}>
              <Ionicons name="search" size={18} color="#10b981" />
              <TextInput
                style={styles.input}
                placeholder="Search live orders, products, farmers, doses, tools..."
                placeholderTextColor="#64748b"
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
              {isSearchingDb && <ActivityIndicator size="small" color="#10b981" style={{ marginRight: 8 }} />}
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={16} color="#64748b" />
                </TouchableOpacity>
              )}
              <View style={styles.escBadge}>
                <Text style={styles.escText}>ESC</Text>
              </View>
            </View>

            {/* Portal Scope Selector Pills */}
            <View style={styles.scopeBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeScroll}>
                {SCOPES.map((sc) => {
                  const isSelected = selectedScope === sc.id;
                  return (
                    <TouchableOpacity
                      key={sc.id}
                      style={[styles.scopePill, isSelected && styles.scopePillActive]}
                      onPress={() => setSelectedScope(sc.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.scopePillText, isSelected && styles.scopePillTextActive]}>
                        {sc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Results Scroll Area */}
            <ScrollView style={styles.scrollList} keyboardShouldPersistTaps="handled">
              {/* SECTION 1: LIVE DATABASE RESULTS */}
              {liveResults.length > 0 && (
                <View style={styles.sectionHeaderBox}>
                  <Ionicons name="pulse" size={13} color="#10b981" />
                  <Text style={styles.sectionHeaderText}>LIVE DATABASE RECORDS ({liveResults.length})</Text>
                </View>
              )}

              {liveResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.liveItemRow}
                  activeOpacity={0.7}
                  onPress={() => handleSelectLiveResult(item)}
                >
                  <View style={[styles.itemIconBox, { backgroundColor: item.badgeColor || '#3b82f6' }]}>
                    <Ionicons name={item.icon as any} size={15} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {item.badgeText && (
                        <View style={[styles.inlineBadge, { backgroundColor: `${item.badgeColor || '#3b82f6'}22`, borderColor: item.badgeColor || '#3b82f6' }]}>
                          <Text style={[styles.inlineBadgeText, { color: item.badgeColor || '#3b82f6' }]}>
                            {item.badgeText}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={18} color="#64748b" />
                </TouchableOpacity>
              ))}

              {/* SECTION 2: SYSTEM NAVIGATION COMMANDS */}
              <View style={[styles.sectionHeaderBox, liveResults.length > 0 && { marginTop: 14 }]}>
                <Ionicons name="compass-outline" size={13} color="#94a3b8" />
                <Text style={styles.sectionHeaderText}>SYSTEM TOOLS & NAVIGATION ({filteredCommands.length})</Text>
              </View>

              {filteredCommands.length === 0 && liveResults.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="search-outline" size={32} color="#334155" />
                  <Text style={styles.emptyText}>No matching records or commands found.</Text>
                  <Text style={styles.emptySubtext}>Try searching by order number, customer name, crop, or switch portal scope above.</Text>
                </View>
              ) : (
                filteredCommands.map((item) => {
                  const pTheme = item.portal !== 'ALL' ? PORTALS[item.portal] : null;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemRow}
                      activeOpacity={0.7}
                      onPress={() => handleSelectCommand(item)}
                    >
                      <View style={[styles.itemIconBox, pTheme && { backgroundColor: pTheme.primaryColor }]}>
                        <Ionicons name={item.icon as any} size={15} color="#ffffff" />
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

            {/* Footer with tips */}
            <View style={styles.modalFooter}>
              <Text style={styles.footerTip}>
                {isDesktop ? (
                  <>
                    Tip: Press <Text style={styles.footerKbd}>Ctrl+K</Text> anywhere to open • <Text style={styles.footerKbd}>ESC</Text> to exit
                  </>
                ) : (
                  'Tap anywhere outside to close search'
                )}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.82)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 70 : 50,
  },
  modalBox: {
    width: '92%',
    maxWidth: 680,
    maxHeight: '82%',
    backgroundColor: '#0b1329',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#1e293b',
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
    backgroundColor: '#0f172a',
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
    paddingVertical: 2.5,
    borderRadius: RADIUS.xs,
  },
  escText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  scopeBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#091122',
    paddingVertical: 7,
  },
  scopeScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  scopePill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scopePillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  scopePillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  scopePillTextActive: {
    color: '#022c22',
    fontFamily: FONT.bold,
  },
  scrollList: {
    padding: 10,
    maxHeight: 460,
  },
  sectionHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    letterSpacing: 0.6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  inlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  inlineBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: FONT.regular,
    textAlign: 'center',
    maxWidth: 320,
  },
  liveItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 9,
    borderRadius: RADIUS.md,
    marginBottom: 4,
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
    marginTop: 2,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#091122',
    alignItems: 'center',
  },
  footerTip: {
    fontSize: 10.5,
    color: '#64748b',
    fontFamily: FONT.regular,
  },
  footerKbd: {
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
});

