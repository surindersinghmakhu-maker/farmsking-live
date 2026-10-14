import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '@/src/api/client';
import { useExecutiveTheme } from '@/src/store/theme-context';

export default function SellerPayoutsScreen() {
  const router = useRouter();
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalGross: 0,
    totalCommission: 0,
    totalTcs: 0,
    netPayout: 0,
  });

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/seller/store/me');
      const store = res.data;
      if (store?.payouts) {
        setPayouts(store.payouts);
        calculateSummary(store.payouts);
      }
    } catch (err: any) {
      console.log('Error fetching seller payouts:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (list: any[]) => {
    let totalGross = 0;
    let totalCommission = 0;
    let totalTcs = 0;
    let netPayout = 0;

    list.forEach((item) => {
      totalGross += Number(item.totalGrossAmount || 0);
      totalCommission += Number(item.totalCommissionAmount || 0);
      totalTcs += Number(item.totalTcsAmount || 0);
      netPayout += Number(item.netPayoutAmount || 0);
    });

    setSummary({ totalGross, totalCommission, totalTcs, netPayout });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={isLight ? '#ffffff' : '#03140a'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderBottomColor: cardBorder, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Seller Settlements & Payouts</Text>
        <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)' }]} onPress={fetchPayouts}>
          <Ionicons name="refresh" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.summaryTitle, { color: textColor }]}>💰 Settlement & Revenue Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>Gross Sales</Text>
              <Text style={[styles.summaryVal, { color: textColor }]}>₹{summary.totalGross.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>FarmsKing Fee (5%)</Text>
              <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>-₹{summary.totalCommission.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>1% GST TCS Tax</Text>
              <Text style={[styles.summaryVal, { color: '#3B82F6' }]}>-₹{summary.totalTcs.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>Net Settled</Text>
              <Text style={[styles.summaryVal, { color: isLight ? '#16a34a' : '#00ff87', fontSize: 18 }]}>₹{summary.netPayout.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payout History List */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>📜 Nodal Bank Settlement Ledger</Text>

        {loading ? (
          <ActivityIndicator size="large" color={isLight ? '#16a34a' : '#00ff87'} style={{ marginTop: 30 }} />
        ) : payouts.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={subTextColor} />
            <Text style={[styles.emptyText, { color: textColor }]}>No payouts generated yet.</Text>
            <Text style={[styles.emptySubText, { color: subTextColor }]}>Payouts are automatically logged when customer order payments clear escrow.</Text>
          </View>
        ) : (
          payouts.map((payout) => (
            <View key={payout.id} style={[styles.payoutCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.payoutHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.refNo, { color: textColor }]}>Ref: {payout.payoutRefNo}</Text>
                  <Text style={[styles.dateText, { color: subTextColor }]}>
                    Date: {new Date(payout.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: payout.status === 'SETTLED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={[styles.statusText, { color: payout.status === 'SETTLED' ? '#16a34a' : '#d97706' }]}>{payout.status}</Text>
                </View>
              </View>

              <View style={[styles.breakdownBox, { backgroundColor: innerBg, borderColor: cardBorder, borderWidth: 1 }]}>
                <Text style={[styles.breakdownText, { color: subTextColor }]}>Gross Sale Amount: ₹{payout.totalGrossAmount}</Text>
                <Text style={[styles.breakdownText, { color: subTextColor }]}>Platform Commission (5%): -₹{payout.totalCommissionAmount}</Text>
                <Text style={[styles.breakdownText, { color: subTextColor }]}>1% GST TCS Tax Deducted: -₹{payout.totalTcsAmount}</Text>
                <Text style={[styles.netText, { color: isLight ? '#16a34a' : '#00ff87' }]}>Net Bank Transfer Amount: ₹{payout.netPayoutAmount}</Text>
              </View>

              {payout.cashfreeUtrNo && (
                <View style={styles.utrBox}>
                  <FontAwesome5 name="university" size={12} color={isLight ? '#16a34a' : '#10B981'} />
                  <Text style={[styles.utrText, { color: isLight ? '#16a34a' : '#A7F3D0' }]}>UTR: {payout.cashfreeUtrNo}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 8, borderRadius: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 16 },

  summaryCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryCol: { flex: 1 },
  summaryLabel: { fontSize: 12 },
  summaryVal: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyBox: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyText: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptySubText: { fontSize: 12, textAlign: 'center', marginTop: 4 },

  payoutCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  payoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  refNo: { fontSize: 14, fontWeight: '700' },
  dateText: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },

  breakdownBox: { borderRadius: 8, padding: 10, marginVertical: 6 },
  breakdownText: { fontSize: 12, marginVertical: 2 },
  netText: { fontSize: 13, fontWeight: '700', marginTop: 4 },

  utrBox: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  utrText: { fontSize: 12, fontWeight: '600' },
});
