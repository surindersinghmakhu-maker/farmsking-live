import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.BUSINESS_PARTNER;

const REFERRALS = [
  { name: 'Rakesh Kumar', date: 'Joined on 18 May 2026', comm: '₹750' },
  { name: 'Sukhdeep Singh', date: 'Joined on 17 May 2026', comm: '₹750' },
  { name: 'Harpreet Kaur', date: 'Joined on 16 May 2026', comm: '₹750' },
  { name: 'Aman Verma', date: 'Joined on 14 May 2026', comm: '₹500' },
];

export default function ReferralsScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>My Referrals</Text>
        <View style={styles.codeCard}>
          <View>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <Text style={styles.codeValue}>BP12S6</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={16} color={theme.primary} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>128 Total Referrals</Text>
        {REFERRALS.map((ref) => (
          <View key={ref.name} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{ref.name}</Text>
              <Text style={styles.date}>{ref.date}</Text>
            </View>
            <Text style={styles.comm}>{ref.comm}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.2, marginBottom: 16 },
  codeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: RADIUS.md, padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  codeLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontFamily: FONT.medium },
  codeValue: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: 1, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', borderRadius: RADIUS.pill, paddingHorizontal: 14, paddingVertical: 9 },
  shareText: { color: theme.primary, fontSize: 12.5, fontFamily: FONT.bold },
  list: { padding: SPACING.xxl, gap: 10 },
  sectionTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b', marginBottom: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  date: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  comm: { fontSize: 14, fontFamily: FONT.extraBold, color: theme.primary },
});
