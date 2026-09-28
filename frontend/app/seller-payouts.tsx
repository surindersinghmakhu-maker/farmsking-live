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

export default function SellerPayoutsScreen() {
  const router = useRouter();
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💳 Seller Payouts & Tax Ledger</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPayouts}>
          <Ionicons name="refresh" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>💰 Total Earnings & Settlement Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Gross Sales</Text>
              <Text style={styles.summaryVal}>₹{summary.totalGross.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>FarmsKing Fee (5%)</Text>
              <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>-₹{summary.totalCommission.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>1% GST TCS Tax</Text>
              <Text style={[styles.summaryVal, { color: '#3B82F6' }]}>-₹{summary.totalTcs.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Net Settled</Text>
              <Text style={[styles.summaryVal, { color: '#10B981', fontSize: 18 }]}>₹{summary.netPayout.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payout History List */}
        <Text style={styles.sectionTitle}>📜 Cashfree Bank Transfer History</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 30 }} />
        ) : payouts.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>No payouts generated yet.</Text>
            <Text style={styles.emptySubText}>Payouts are automatically generated when customer payments are confirmed.</Text>
          </View>
        ) : (
          payouts.map((payout) => (
            <View key={payout.id} style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.refNo}>Ref: {payout.payoutRefNo}</Text>
                  <Text style={styles.dateText}>
                    Date: {new Date(payout.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: payout.status === 'SETTLED' ? '#065F46' : '#92400E' }]}>
                  <Text style={styles.statusText}>{payout.status}</Text>
                </View>
              </View>

              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownText}>Gross Sale Amount: ₹{payout.totalGrossAmount}</Text>
                <Text style={styles.breakdownText}>Platform Commission (5%): -₹{payout.totalCommissionAmount}</Text>
                <Text style={styles.breakdownText}>1% GST TCS Tax Deducted: -₹{payout.totalTcsAmount}</Text>
                <Text style={styles.netText}>Net Bank Transfer Amount: ₹{payout.netPayoutAmount}</Text>
              </View>

              {payout.cashfreeUtrNo && (
                <View style={styles.utrBox}>
                  <FontAwesome5 name="university" size={12} color="#10B981" />
                  <Text style={styles.utrText}>Bank UTR: {payout.cashfreeUtrNo}</Text>
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
  container: { flex: 1, backgroundColor: '#0B0F17' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  refreshBtn: { backgroundColor: '#065F46', padding: 8, borderRadius: 8 },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 16 },

  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#059669',
  },
  summaryTitle: { color: '#F9FAFB', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryCol: { flex: 1 },
  summaryLabel: { color: '#9CA3AF', fontSize: 12 },
  summaryVal: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 2 },

  sectionTitle: { color: '#F9FAFB', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyBox: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyText: { color: '#9CA3AF', fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptySubText: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 4 },

  payoutCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  payoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  refNo: { color: '#F9FAFB', fontSize: 14, fontWeight: '700' },
  dateText: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  breakdownBox: { backgroundColor: '#111827', borderRadius: 8, padding: 10, marginVertical: 6 },
  breakdownText: { color: '#9CA3AF', fontSize: 12, marginVertical: 2 },
  netText: { color: '#10B981', fontSize: 13, fontWeight: '700', marginTop: 4 },

  utrBox: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  utrText: { color: '#A7F3D0', fontSize: 12, fontWeight: '600' },
});
