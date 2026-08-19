import { ActivityIndicator, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useMyReferrals } from '@/src/hooks/useReferrals';

const theme = RoleThemes.BUSINESS_PARTNER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function ReferralsScreen() {
  const { user } = useAuth();
  const { data: referrals, isLoading } = useMyReferrals();
  const kingId = user?.kingId ?? '';

  const totalEarned = (referrals ?? []).reduce((sum, r) => sum + r.commissionEarned, 0);

  const handleShare = async () => {
    tap();
    const link = Linking.createURL('/register', { queryParams: { ref: kingId } });
    const message = `Join FarmsKing using my referral code ${kingId} and get a welcome discount coupon on your first orders!\n${link}`;
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(message);
      alert('Referral link copied to clipboard!');
      return;
    }
    try {
      await Share.share({ message });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>My Referrals</Text>
        <View style={styles.codeCard}>
          <View>
            <Text style={styles.codeLabel}>Your Referral Code (King ID)</Text>
            <Text style={styles.codeValue}>{kingId || '—'}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={handleShare} disabled={!kingId}>
            <Ionicons name="person-add-outline" size={16} color={theme.primary} />
            <Text style={styles.shareText}>Invite</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {referrals?.length ?? 0} Total Referrals · ₹{totalEarned.toLocaleString('en-IN')} earned
        </Text>
        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
        ) : !referrals || referrals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Share your referral code — anyone who signs up with it will show up here.</Text>
          </View>
        ) : (
          referrals.map((ref) => (
            <View key={ref.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.avatar}>
                <Ionicons name="person-outline" size={18} color={theme.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{ref.name}</Text>
                <Text style={styles.date}>Joined {new Date(ref.createdAt).toLocaleDateString('en-IN')}</Text>
              </View>
              <Text style={styles.comm}>₹{ref.commissionEarned.toLocaleString('en-IN')}</Text>
            </View>
          ))
        )}
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
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 50, gap: 10 },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  date: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  comm: { fontSize: 14, fontFamily: FONT.extraBold, color: theme.primary },
});
