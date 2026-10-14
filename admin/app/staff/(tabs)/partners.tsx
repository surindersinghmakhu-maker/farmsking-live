import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface PartnerProfile {
  id: string;
  name: string;
  firmName: string;
  tier: 'GOLD' | 'PLATINUM' | 'DIRECT';
  referralCode: string;
  activeFarmers: number;
  walletBalance: number;
}

const SAMPLE_PARTNERS: PartnerProfile[] = [
  { id: '1', name: 'Surinder Kumar', firmName: 'Surinder Agro & Seeds', tier: 'PLATINUM', referralCode: 'SKMAKHU', activeFarmers: 340, walletBalance: 45200 },
  { id: '2', name: 'Amrik Singh Sandhu', firmName: 'Sandhu Kheti Sewa Kendra', tier: 'GOLD', referralCode: 'SANDHU99', activeFarmers: 185, walletBalance: 24800 },
  { id: '3', name: 'Davinder Pal', firmName: 'Malwa Agri Solutions', tier: 'DIRECT', referralCode: 'MALWA2026', activeFarmers: 92, walletBalance: 12400 },
];

export default function PartnersScreen() {
  const [search, setSearch] = useState('');
  const [list] = useState<PartnerProfile[]>(SAMPLE_PARTNERS);

  const filtered = list.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.firmName.toLowerCase().includes(search.toLowerCase()) ||
      p.referralCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="people" size={20} color="#f59e0b" />
            <Text style={styles.title}>Strategic Business Partners</Text>
          </View>
          <Text style={styles.subtitle}>Partner alliances, referral codes, active farmer networks & payouts</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#f59e0b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search partner by name, firm, or referral code..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Ionicons name="briefcase" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: item.tier === 'PLATINUM' ? '#4f46e5' : '#d97706' }]}>
                    <Text style={styles.tierText}>{item.tier}</Text>
                  </View>
                </View>
                <Text style={styles.firm}>{item.firmName}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Referral Code</Text>
                <Text style={styles.codeText}>{item.referralCode}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Farmers Linked</Text>
                <Text style={styles.statVal}>{item.activeFarmers}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Partner Ledger</Text>
                <Text style={[styles.statVal, { color: '#4ade80' }]}>₹{item.walletBalance.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0a21',
  },
  header: {
    padding: 16,
    backgroundColor: '#141038',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#fef3c7',
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#fde68a',
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161244',
    margin: 12,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  list: {
    padding: 12,
    gap: 10,
  },
  card: {
    backgroundColor: '#141038',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    gap: 12,
    ...premiumShadow('#000000', 'sm'),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  firm: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  tierText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1d1754',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  statItem: {
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  codeText: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#f59e0b',
  },
  statVal: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
