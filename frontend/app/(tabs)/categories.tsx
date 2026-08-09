import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.CUSTOMER;

const CATEGORIES = [
  { name: 'Seeds', icon: 'leaf-outline', bg: '#f0fdf4', color: '#166534' },
  { name: 'Fertilizers', icon: 'flask-outline', bg: theme.primaryLight, color: theme.primary },
  { name: 'Pesticides', icon: 'shield-outline', bg: '#fefce8', color: '#ca8a04' },
  { name: 'Tools', icon: 'build-outline', bg: '#fcf4ff', color: '#9333ea' },
  { name: 'Organic', icon: 'nutrition-outline', bg: '#fff1f2', color: '#e11d48' },
  { name: 'Irrigation', icon: 'water-outline', bg: '#eff6ff', color: '#1d4ed8' },
  { name: 'Machinery', icon: 'construct-outline', bg: '#fff7ed', color: '#c2410c' },
  { name: 'More', icon: 'grid-outline', bg: '#f1f5f9', color: '#64748b' },
];

export default function CategoriesScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Categories</Text>
        <Text style={styles.heroSubtitle}>Browse everything your farm needs</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.name} style={[styles.card, premiumShadow('#0f172a', 'sm')]} activeOpacity={0.75}>
            <View style={[styles.iconBg, { backgroundColor: cat.bg }]}>
              <Ionicons name={cat.icon as any} size={24} color={cat.color} />
            </View>
            <Text style={styles.label}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13.5, fontFamily: FONT.medium, marginTop: 2 },
  grid: {
    padding: SPACING.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  card: {
    width: '47%', backgroundColor: '#ffffff', borderRadius: RADIUS.lg,
    paddingVertical: 22, alignItems: 'center', gap: 10,
  },
  iconBg: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
});
