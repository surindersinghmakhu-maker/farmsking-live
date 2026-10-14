import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface WorkforceMember {
  id: string;
  name: string;
  role: 'SUPERVISOR' | 'FIELD_LABOUR' | 'OPERATOR';
  assignedFarm: string;
  phone: string;
  attendance: 'PRESENT' | 'ON_DUTY' | 'ABSENT';
}

const SAMPLE_WORKFORCE: WorkforceMember[] = [
  { id: '1', name: 'Baldev Singh', role: 'SUPERVISOR', assignedFarm: 'Makhu East Parcel (40 Acres)', phone: '+91 98111-22334', attendance: 'ON_DUTY' },
  { id: '2', name: 'Kuldeep Ram', role: 'FIELD_LABOUR', assignedFarm: 'Ferozepur Canal Block', phone: '+91 98222-33445', attendance: 'PRESENT' },
  { id: '3', name: 'Jagtar Singh', role: 'FIELD_LABOUR', assignedFarm: 'Sukh Farm - Sector 4', phone: '+91 98333-44556', attendance: 'PRESENT' },
  { id: '4', name: 'Manjit Kaur', role: 'SUPERVISOR', assignedFarm: 'Green Valley Organic Beds', phone: '+91 98444-55667', attendance: 'ON_DUTY' },
];

export default function WorkforceScreen() {
  const [search, setSearch] = useState('');
  const [list] = useState<WorkforceMember[]>(SAMPLE_WORKFORCE);

  const filtered = list.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.assignedFarm.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="construct" size={20} color="#16a34a" />
            <Text style={styles.title}>Field Workforce & Labour</Text>
          </View>
          <Text style={styles.subtitle}>Supervisors, farm labour attendance & field assignments</Text>
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="person-add" size={15} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Worker</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#16a34a" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search worker by name, parcel, or role..."
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
              <View style={[styles.avatar, { backgroundColor: item.role === 'SUPERVISOR' ? '#16a34a' : '#0284c7' }]}>
                <Ionicons name={item.role === 'SUPERVISOR' ? 'shield-checkmark' : 'person'} size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.attendance === 'ON_DUTY' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(14, 165, 233, 0.2)' }]}>
                    <Text style={[styles.statusText, { color: item.attendance === 'ON_DUTY' ? '#4ade80' : '#38bdf8' }]}>
                      {item.attendance}
                    </Text>
                  </View>
                </View>
                <Text style={styles.roleTag}>{item.role.replace('_', ' ')} • {item.phone}</Text>
              </View>
            </View>

            <View style={styles.parcelRow}>
              <Ionicons name="business-outline" size={14} color="#86efac" />
              <Text style={styles.parcelText}>Assigned: {item.assignedFarm}</Text>
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
    backgroundColor: '#07170c',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c2414',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22, 163, 74, 0.2)',
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#f0fdf4',
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#86efac',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2817',
    margin: 12,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
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
    backgroundColor: '#0c2414',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  roleTag: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  parcelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#112f1b',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  parcelText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#dcfce7',
  },
});
