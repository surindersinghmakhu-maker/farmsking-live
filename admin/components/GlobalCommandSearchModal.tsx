import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Platform, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BlurView } from 'expo-blur';

interface CommandItem {
  id: string;
  title: string;
  category: 'FARMERS' | 'DOCTORS' | 'SELLERS' | 'ORDERS' | 'SETTINGS';
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
  params?: any;
}

const SEARCH_DATABASE: CommandItem[] = [
  { id: '1', title: 'Surinder Singh (Super Admin)', category: 'SETTINGS', subtitle: 'Platform Administrator · Makhu', icon: 'shield-checkmark', path: '/admin/(tabs)/super-users', params: { filter: 'SUPER_ADMIN' } },
  { id: '2', title: 'Farmer Directory', category: 'FARMERS', subtitle: 'Manage all 1,240 registered farmers', icon: 'leaf', path: '/admin/(tabs)/super-users', params: { group: 'CLIENTS', filter: 'FARMER' } },
  { id: '3', title: 'Crop Doctors & Advisory', category: 'DOCTORS', subtitle: 'Certified Agri Doctors (Farmers Only)', icon: 'medical', path: '/admin/(tabs)/super-users', params: { group: 'PARTNERS', filter: 'FARM_ADVISOR' } },
  { id: '4', title: 'Seller KYC Approvals', category: 'SELLERS', subtitle: '12 pending seller verifications', icon: 'shield-checkmark', path: '/admin-sellers' },
  { id: '5', title: 'Seller Payouts Ledger', category: 'SELLERS', subtitle: 'UPI withdrawals & auto payouts', icon: 'cash', path: '/seller-payouts' },
  { id: '6', title: 'Store Orders & Fulfillment', category: 'ORDERS', subtitle: 'View real-time customer purchases', icon: 'receipt', path: '/admin/(tabs)/admin-orders' },
  { id: '7', title: 'AI Disease Diagnostic Scanner', category: 'DOCTORS', subtitle: 'Agri AI scan logs & diagnostics', icon: 'scan', path: '/admin/(tabs)/crop-disease-scanner' },
  { id: '8', title: 'Plant Care Doses & Protocols', category: 'SETTINGS', subtitle: 'Gardening & urban agriculture care', icon: 'nutrition', path: '/dose' },
  { id: '9', title: 'Global Wallet & Accounts', category: 'SETTINGS', subtitle: 'Platform financial balance & ledger', icon: 'wallet', path: '/admin/(tabs)/super-accounts' },
  { id: '10', title: 'Technical Trainers Dashboard', category: 'SETTINGS', subtitle: 'Staff trainers & field ops', icon: 'school', path: '/admin/(tabs)/trainer-dashboard' },
  { id: '11', title: 'Coupons & VIP Passes', category: 'ORDERS', subtitle: 'Manage discount vouchers & passes', icon: 'ticket', path: '/admin/(tabs)/super-coupons' },
  { id: '12', title: 'C-Panel & Security Settings', category: 'SETTINGS', subtitle: 'Feature flags & platform config', icon: 'options', path: '/admin/(tabs)/super-settings' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function GlobalCommandSearchModal({ visible, onClose }: Props) {
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
          // Open trigger via window event if needed
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
    if (item.params) {
      router.push({ pathname: item.path as any, params: item.params });
    } else {
      router.push(item.path as any);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Top Search Input Header */}
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={20} color="#00ff87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Farmers, Doctors, Orders, Sellers, Settings... (Ctrl+K)"
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <TouchableOpacity style={styles.escBadge} onPress={onClose}>
              <Text style={styles.escText}>ESC</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Chips */}
          <View style={styles.categoryRow}>
            {['ALL', 'FARMERS', 'DOCTORS', 'SELLERS', 'ORDERS', 'SETTINGS'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Results List */}
          <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="search-disagree" size={32} color="#475569" />
                <Text style={styles.emptyText}>No matching admin command or user found</Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultItem}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemIconBox}>
                    <Ionicons name={item.icon} size={18} color="#00ff87" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer Shortcuts Note */}
          <View style={styles.footerRow}>
            <Text style={styles.footerNote}>💡 Tip: Use <Text style={{ color: '#00ff87', fontFamily: FONT.bold }}>Ctrl + K</Text> anywhere in Admin Portal to open spotlight search.</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 13, 6, 0.75)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  modalCard: {
    width: '90%',
    maxWidth: 680,
    maxHeight: '75%',
    backgroundColor: '#04180d',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    overflow: 'hidden',
    ...premiumShadow('#000000', 'xl') as any,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.15)',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT.medium,
    color: '#ffffff',
    outlineStyle: 'none' as any,
  },
  escBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  escText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  catChipActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderColor: '#00ff87',
  },
  catChipText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  catChipTextActive: {
    color: '#00ff87',
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
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  itemSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#34d399',
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
    borderTopColor: 'rgba(0, 255, 135, 0.15)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  footerNote: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
});
