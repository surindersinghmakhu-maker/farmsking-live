import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const theme = RoleThemes.GARDENER;
const { width } = Dimensions.get('window');

// Dummy data for the marketplace
const ADVISORS = [
  {
    id: '1',
    name: 'Dr. Rahul Sharma',
    expertise: ['Kitchen Garden', 'Organic Vegetables'],
    rating: 4.9,
    reviews: 124,
    image: 'https://i.pravatar.cc/150?img=11',
    fees: {
      basic: '₹299/mo',
      yearly: '₹2,499/yr'
    },
    verified: true,
    description: 'Expert in urban balcony gardening and organic vegetable production. I help you grow pesticide-free food at home.'
  },
  {
    id: '2',
    name: 'Anita Desai',
    expertise: ['Home Garden', 'Ornamental Plants', 'Bonsai'],
    rating: 4.7,
    reviews: 89,
    image: 'https://i.pravatar.cc/150?img=5',
    fees: {
      basic: '₹199/mo',
      yearly: '₹1,999/yr'
    },
    verified: true,
    description: 'Specialist in rare indoor plants, bonsai care, and aesthetic balcony layouts. Turn your home into a green paradise.'
  },
  {
    id: '3',
    name: 'Vikram Singh',
    expertise: ['Kitchen Garden', 'Composting', 'Herbs'],
    rating: 4.8,
    reviews: 210,
    image: 'https://i.pravatar.cc/150?img=13',
    fees: {
      basic: '₹349/mo',
      yearly: '₹2,999/yr'
    },
    verified: true,
    description: 'Master of herbs and DIY composting. I guide you on how to convert kitchen waste into black gold for your plants.'
  }
];

export default function AdvisorsMarketplaceScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'KITCHEN' | 'HOME'>('ALL');

  const filteredAdvisors = ADVISORS.filter(a => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'KITCHEN') return a.expertise.includes('Kitchen Garden');
    if (selectedCategory === 'HOME') return a.expertise.includes('Home Garden');
    return true;
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#e2f1e7', '#f8fafc']} style={styles.headerGradient}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Garden Advisors</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSubtitle}>Hire a certified expert to guide your garden.</Text>
        
        {/* Filters */}
        <View style={styles.filterRow}>
          {(['ALL', 'KITCHEN', 'HOME'] as const).map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.filterBtn, selectedCategory === cat && styles.filterBtnActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                {cat === 'ALL' ? 'All Experts' : cat === 'KITCHEN' ? 'Kitchen Garden' : 'Home Plants'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredAdvisors.map((advisor) => (
          <View key={advisor.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.cardHeader}>
              <Image source={{ uri: advisor.image }} style={styles.avatar} />
              <View style={styles.headerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{advisor.name}</Text>
                  {advisor.verified && <Ionicons name="checkmark-circle" size={16} color={theme.primary} style={{ marginLeft: 4 }} />}
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.ratingText}>{advisor.rating}</Text>
                  <Text style={styles.reviewText}>({advisor.reviews} reviews)</Text>
                </View>
              </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>{advisor.description}</Text>

            <View style={styles.expertiseRow}>
              {advisor.expertise.map((exp, idx) => (
                <View key={idx} style={styles.expertiseBadge}>
                  <Text style={styles.expertiseText}>{exp}</Text>
                </View>
              ))}
            </View>

            <View style={styles.footerRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Starting from</Text>
                <Text style={styles.priceValue}>{advisor.fees.basic}</Text>
              </View>
              <TouchableOpacity 
                style={styles.hireBtn} 
                onPress={() => {
                  router.push({
                    pathname: '/(user)/advisor-checkout',
                    params: {
                      advisorId: advisor.id,
                      advisorName: advisor.name,
                      planPrice: advisor.fees.basic,
                      planType: 'monthly'
                    }
                  });
                }}
              >
                <Text style={styles.hireBtnText}>Hire Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: SPACING.xl * 1.5,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: 20,
    color: '#0f172a',
  },
  headerSubtitle: {
    fontFamily: FONT.medium,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  filterBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterText: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
  },
  headerInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: FONT.bold,
    fontSize: 16,
    color: '#0f172a',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: '#334155',
    marginLeft: 4,
  },
  reviewText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  description: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  expertiseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  expertiseBadge: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  expertiseText: {
    fontFamily: FONT.medium,
    fontSize: 11,
    color: '#475569',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: SPACING.md,
  },
  priceContainer: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontFamily: FONT.regular,
    fontSize: 11,
    color: '#64748b',
  },
  priceValue: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: '#0f172a',
  },
  hireBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  hireBtnText: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#ffffff',
  }
});
