import { ActivityIndicator, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useMyReferralNetwork } from '@/src/hooks/useReferralNetwork';

const theme = RoleThemes.BUSINESS_PARTNER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function ReferralsScreen() {
  const { user } = useAuth();
  const { data: network, isLoading } = useMyReferralNetwork();
  const kingId = network?.kingId || user?.kingId || '';

  const handleShare = async () => {
    tap();
    const link = network?.inviteUrl || `https://farmsking.in/register?ref=${kingId}`;
    const message = `🌾 *FarmsKing (फ़ार्मਸਕਿੰਗ) — भारत का भरोसेमंद स्मार्ट डिजिटल कृषि प्लेटफॉर्म* 🚜✨\n\nनमस्ते! 👨‍🌾\nमैं FarmsKing App का उपयोग अपनी खेती के प्रबंधन और फसल सुरक्षा के लिए कर रहा हूँ। आप भी इस फ्री ऐप को जॉइन करें और पाएँ ये बेहतरीन सुविधाएँ:\n\n📊 *1. लाइव मंडी भाव व सटीक मौसम जानकारी:*\nपंजाब व देश की सभी मंडियों के रोजाना भाव और आपके गाँव के मौसम की पल-पल अपडेट।\n\n🩺 *2. AI Crop Doctor व रोग पहचान:*\nपौधे/फसल की फोटो खींचकर 2 सेकंड में रोग की पहचान करें और एक्सपर्ट डॉक्टरों से दवा/स्प्रे सलाह पाएँ।\n\n🏪 *3. एग्रीस्टोर व डायरेक्ट फसल बिक्री:*\nअसली बीज, खाद व कीटनाशक बेस्ट रेट पर ऑर्डर करें और अपनी फसल सीधे खरीदारों को बेचें।\n\n📘 *4. डिजिटल फार्म खाता व लेबर मैनेजमेंट:*\nखेती का पूरा हिसाब-किताब, डीजल-स्प्रे का खर्चा और मजदूरों की हाजिरी आसानी से मैनेज करें।\n\n👇 *नीचे दिए गए लिंक से मुफ़्त में ऐप डाउनलोड व रजिस्टर करें:*\n👉 ${link}\n\n---\n👑 *FarmsKing Platform* · _स्मार्ट खेती, बेहतर उपज, अधिक मुनाफ़ा!_ 🌾`;
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(message);
      alert('Full invitation message & link copied to clipboard!');
      return;
    }
    try {
      await Share.share({ message });
    } catch {
      // share sheet dismissed
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Farm Network & Lifetime Royalties</Text>
        <View style={styles.codeCard}>
          <View>
            <Text style={styles.codeLabel}>Your King ID (Referral Link)</Text>
            <Text style={styles.codeValue}>{kingId || '—'}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={handleShare} disabled={!kingId}>
            <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
            <Text style={styles.shareText}>Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Network Stats Cards */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Direct Friends (L1)</Text>
            <Text style={styles.statValue}>{network?.directCount ?? 0}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Extended Network (L2)</Text>
            <Text style={styles.statValue}>{network?.extendedCount ?? 0}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Royalties</Text>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>₹{(network?.totalRoyaltiesEarned ?? 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          Farm Network ({network?.totalNetworkCount ?? 0} Connected Farmers)
        </Text>
        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
        ) : !network || (network.directReferrals.length === 0 && network.extendedReferrals.length === 0) ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Share your King ID link — anyone who joins will be added to your Farm Network & earn you Lifetime Royalties!</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {network.directReferrals.map((ref) => (
              <View key={ref.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={18} color={theme.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{ref.referredUser.name}</Text>
                  <Text style={styles.date}>King ID: {ref.referredUser.kingId || '—'} · Level 1 Direct</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>1% Share</Text>
                </View>
              </View>
            ))}

            {network.extendedReferrals.map((ref) => (
              <View key={ref.id} style={[styles.card, premiumShadow('#0f172a', 'sm'), { opacity: 0.9 }]}>
                <View style={[styles.avatar, { backgroundColor: '#f1f5f9' }]}>
                  <Ionicons name="people-outline" size={18} color="#64748b" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{ref.referredUser.name}</Text>
                  <Text style={styles.date}>King ID: {ref.referredUser.kingId || '—'} · Level 2 Extended</Text>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.levelBadgeText, { color: '#b45309' }]}>0.5% Share</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2, marginBottom: 12 },
  codeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: RADIUS.md, padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  codeLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: FONT.medium },
  codeValue: { color: '#fff', fontSize: 19, fontFamily: FONT.extraBold, letterSpacing: 1, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', borderRadius: RADIUS.pill, paddingHorizontal: 14, paddingVertical: 9 },
  shareText: { color: '#16a34a', fontSize: 12.5, fontFamily: FONT.bold },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 9.5, fontFamily: FONT.bold, textTransform: 'uppercase' },
  statValue: { color: '#ffffff', fontSize: 15, fontFamily: FONT.extraBold, marginTop: 2 },
  list: { padding: SPACING.xxl, gap: 10 },
  sectionTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b', marginBottom: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 50, gap: 10 },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  date: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  levelBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.pill },
  levelBadgeText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#15803d' },
});

