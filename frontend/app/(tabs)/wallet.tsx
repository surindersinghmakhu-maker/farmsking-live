import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.BUSINESS_PARTNER;

const TRANSACTIONS = [
  { label: 'Order Commission', date: '20 Apr 2026', amount: 120, positive: true },
  { label: 'Order Commission', date: '18 Apr 2026', amount: 80, positive: true },
  { label: 'Withdrawal', date: '16 Apr 2026', amount: -2000, positive: false },
  { label: 'Order Commission', date: '14 Apr 2026', amount: 150, positive: true },
];

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>My Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.gradient} style={[styles.balanceCard, premiumShadow(theme.primary, 'md')]}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>₹24,560</Text>

          <View style={styles.balanceStatsRow}>
            <View>
              <Text style={styles.balanceStatLabel}>Total Earnings</Text>
              <Text style={styles.balanceStatValue}>₹24,560</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View>
              <Text style={styles.balanceStatLabel}>Withdrawn</Text>
              <Text style={styles.balanceStatValue}>₹21,110</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.withdrawButton} activeOpacity={0.85}>
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={[styles.txCard, premiumShadow('#0f172a', 'sm')]}>
          {TRANSACTIONS.map((tx, idx) => (
            <View key={idx} style={[styles.txRow, idx === TRANSACTIONS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.txIconBg, { backgroundColor: tx.positive ? theme.primaryLight : '#fef2f2' }]}>
                <Ionicons
                  name={tx.positive ? 'arrow-down' : 'arrow-up'}
                  size={15}
                  color={tx.positive ? theme.primary : '#dc2626'}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{tx.label}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.positive ? theme.primary : '#dc2626' }]}>
                {tx.positive ? '+' : '-'} ₹{Math.abs(tx.amount).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  body: { padding: SPACING.xxl },
  balanceCard: { borderRadius: RADIUS.xl, padding: SPACING.xl },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: FONT.medium },
  balanceValue: { color: '#fff', fontSize: 34, fontFamily: FONT.extraBold, marginTop: 6, letterSpacing: -0.6 },
  balanceStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 20 },
  balanceStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontFamily: FONT.medium },
  balanceStatValue: { color: '#fff', fontSize: 15, fontFamily: FONT.bold, marginTop: 3 },
  balanceDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.25)' },
  withdrawButton: { backgroundColor: '#ffffff', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 20 },
  withdrawText: { color: theme.primary, fontSize: 15, fontFamily: FONT.bold },
  sectionTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b', marginTop: 24, marginBottom: 10 },
  txCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txIconBg: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txLabel: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  txDate: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  txAmount: { fontSize: 13.5, fontFamily: FONT.extraBold },
});
