import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface FloraProduct {
  id: string;
  name: string;
  category: 'PLANTS' | 'FERTILIZERS' | 'SEEDS' | 'TOOLS';
  price: number;
  stock: number;
  status: 'IN_STOCK' | 'LOW_STOCK';
}

const SAMPLE_FLORA_PRODUCTS: FloraProduct[] = [
  { id: '1', name: 'Bonsai Ficus Microcarpa (Indoor)', category: 'PLANTS', price: 850, stock: 24, status: 'IN_STOCK' },
  { id: '2', name: 'Organic Rose Bloom Booster (1 Kg)', category: 'FERTILIZERS', price: 340, stock: 65, status: 'IN_STOCK' },
  { id: '3', name: 'Hybrid Exotic Petunia Seeds (Pack of 50)', category: 'SEEDS', price: 180, stock: 9, status: 'LOW_STOCK' },
  { id: '4', name: 'Heavy Duty Hedge Shears & Pruner Set', category: 'TOOLS', price: 1250, stock: 15, status: 'IN_STOCK' },
  { id: '5', name: 'Adenium Desert Rose Hybrid', category: 'PLANTS', price: 620, stock: 18, status: 'IN_STOCK' },
];

export default function FloraStoreScreen() {
  const [filter, setFilter] = useState<'ALL' | 'PLANTS' | 'FERTILIZERS' | 'SEEDS' | 'TOOLS'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_FLORA_PRODUCTS.filter((p) => {
    const matchesFilter = filter === 'ALL' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="basket" size={20} color="#ec4899" />
            <Text style={styles.title}>GreenSpace™ Flora Store</Text>
          </View>
          <Text style={styles.subtitle}>Curated horticulture plants, nursery saplings & garden care</Text>
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add-circle" size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Plant/Item</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['ALL', 'PLANTS', 'FERTILIZERS', 'SEEDS', 'TOOLS'] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
          >
            <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <View style={[styles.categoryTag, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <Text style={styles.categoryTagText}>{item.category}</Text>
                </View>
                <Text style={styles.productName}>{item.name}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>₹{item.price}</Text>
                <View style={[styles.stockBadge, { backgroundColor: item.status === 'IN_STOCK' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.stockText, { color: item.status === 'IN_STOCK' ? '#22c55e' : '#ef4444' }]}>
                    {item.stock} in stock
                  </Text>
                </View>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ec4899',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#130711',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#1c0c19',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  filterChipTextActive: {
    color: '#ffffff',
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
    ...premiumShadow('#000000', 'sm'),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#f472b6',
  },
  productName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  price: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#f472b6',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: 4,
  },
  stockText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
});
