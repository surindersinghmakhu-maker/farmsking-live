import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface ManagerProfile {
  id: string;
  name: string;
  region: string;
  phone: string;
  department: string;
  status: 'ACTIVE' | 'ON_CALL';
}

const SAMPLE_MANAGERS: ManagerProfile[] = [
  { id: '1', name: 'Sukhdev Singh', region: 'Punjab Central (Ludhiana/Ferozepur)', phone: '+91 98777-11223', department: 'Regional Field Operations', status: 'ACTIVE' },
  { id: '2', name: 'Manish Sharma', region: 'Haryana North (Ambala/Karnal)', phone: '+91 98666-22334', department: 'Mandi Logistics & Supply', status: 'ACTIVE' },
  { id: '3', name: 'Pooja Rani', region: 'Headquarters Dispatch', phone: '+91 98555-33445', department: 'Quality Assurance & Customer SLA', status: 'ON_CALL' },
];

export default function ManagersScreen() {
  const [search, setSearch] = useState('');
  const [list] = useState<ManagerProfile[]>(SAMPLE_MANAGERS);

  const filtered = list.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.region.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="briefcase" size={20} color="#6366f1" />
            <Text style={styles.title}>Operations Managers</Text>
          </View>
          <Text style={styles.subtitle}>Branch managers, regional coordinators & escalations</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6366f1" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search manager by name, region, or department..."
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
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.phone}>{item.phone}</Text>
              </View>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.deptText}>{item.department}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="location-outline" size={13} color="#a5b4fc" />
                <Text style={styles.regionText}>{item.region}</Text>
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
    borderBottomColor: 'rgba(99, 102, 241, 0.25)',
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#e0e7ff',
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#a5b4fc',
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
    borderColor: 'rgba(99, 102, 241, 0.3)',
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
    borderColor: 'rgba(99, 102, 241, 0.25)',
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
    backgroundColor: '#6366f1',
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
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#4ade80',
  },
  detailBox: {
    backgroundColor: '#1d1754',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  deptText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  regionText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#c7d2fe',
  },
});
