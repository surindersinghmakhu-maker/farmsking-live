import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface GardenerProfile {
  id: string;
  name: string;
  phone: string;
  zone: string;
  rating: number;
  activeGardens: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'BUSY';
  specialty: string;
}

const SAMPLE_GARDENERS: GardenerProfile[] = [
  { id: '1', name: 'Ramesh Singh', phone: '+91 98765-43210', zone: 'North Sector A', rating: 4.9, activeGardens: 6, status: 'ACTIVE', specialty: 'Lawn Care & Shrub Sculpting' },
  { id: '2', name: 'Gurpreet Kaur', phone: '+91 98123-45678', zone: 'South Green Belt', rating: 4.8, activeGardens: 4, status: 'ACTIVE', specialty: 'Organic Floral Nutrition' },
  { id: '3', name: 'Sukhwinder Pal', phone: '+91 97890-12345', zone: 'West Gardens Zone', rating: 4.7, activeGardens: 5, status: 'BUSY', specialty: 'Hydroponics & Drip Irrigation' },
  { id: '4', name: 'Harpreet Verma', phone: '+91 99887-76655', zone: 'East Sector Urban', rating: 4.6, activeGardens: 3, status: 'ACTIVE', specialty: 'Fruit Trees & Pruning' },
];

export default function GardenersScreen() {
  const [search, setSearch] = useState('');
  const [gardeners] = useState<GardenerProfile[]>(SAMPLE_GARDENERS);

  const filtered = gardeners.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.zone.toLowerCase().includes(search.toLowerCase()) ||
      g.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="people" size={20} color="#ec4899" />
            <Text style={styles.title}>Gardeners Network</Text>
          </View>
          <Text style={styles.subtitle}>Manage active certified gardeners, assigned estates & zones</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filtered.length} Gardeners</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#ec4899" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search gardener by name, zone, or specialty..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#64748b" />
          </TouchableOpacity>
        ) : null}
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
                <Ionicons name="person" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)' }]}>
                    <Text style={[styles.statusBadgeText, { color: item.status === 'ACTIVE' ? '#22c55e' : '#eab308' }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.phone}>{item.phone}</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color="#94a3b8" />
                <Text style={styles.detailText}>{item.zone}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="star" size={14} color="#facc15" />
                <Text style={styles.detailText}>{item.rating} Rating</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="leaf-outline" size={14} color="#ec4899" />
                <Text style={styles.detailText}>{item.activeGardens} Estates</Text>
              </View>
            </View>

            <View style={styles.specialtyBox}>
              <Text style={styles.specialtyLabel}>Specialty:</Text>
              <Text style={styles.specialtyValue}>{item.specialty}</Text>
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
    backgroundColor: '#0c050a',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236, 72, 153, 0.15)',
    backgroundColor: '#140812',
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#fdf2f8',
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#f472b6',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#170a15',
    margin: 12,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
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
    backgroundColor: '#150913',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
    gap: 10,
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
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  phone: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c0c1a',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  specialtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specialtyLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ec4899',
  },
  specialtyValue: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
});
