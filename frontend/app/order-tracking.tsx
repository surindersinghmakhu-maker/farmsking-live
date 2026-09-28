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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { apiClient } from '@/src/api/client';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);

  useEffect(() => {
    if (params.orderId) {
      fetchOrderDetails(params.orderId);
    }
  }, [params.orderId]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/orders/${orderId}`);
      const data = res.data;
      setOrder(data);
      if (data?.shippingLogs) {
        setTrackingLogs(data.shippingLogs);
      }
    } catch (err: any) {
      console.log('Error fetching order tracking details:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepName: string) => {
    if (!order) return 'PENDING';
    const status = order.status;

    if (stepName === 'PLACED') return 'COMPLETED';
    if (stepName === 'CONFIRMED' && ['CONFIRMED', 'PACKING', 'PACKED', 'DISPATCHED', 'DELIVERED'].includes(status))
      return 'COMPLETED';
    if (stepName === 'DISPATCHED' && ['DISPATCHED', 'DELIVERED'].includes(status)) return 'COMPLETED';
    if (stepName === 'DELIVERED' && status === 'DELIVERED') return 'COMPLETED';

    return 'PENDING';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🚚 Live Order Tracking / ਟ੍ਰੈਕਿੰਗ</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => params.orderId && fetchOrderDetails(params.orderId)}
        >
          <Ionicons name="refresh" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : !order ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Order details not found.</Text>
          </View>
        ) : (
          <>
            {/* Order Brief Card */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNoText}>Order #{order.orderNumber}</Text>
                  <Text style={styles.dateText}>
                    Placed on: {new Date(order.orderDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{order.status}</Text>
                </View>
              </View>

              <View style={styles.courierBox}>
                <FontAwesome5 name="shipping-fast" size={16} color="#10B981" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.courierName}>
                    Courier Partner: {order.courierName || 'Shiprocket Express'}
                  </Text>
                  <Text style={styles.trackingId}>
                    AWB Tracking ID: {order.trackingId || 'Assigned on Pickup'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Timeline Progress */}
            <Text style={styles.sectionTitle}>📍 Real-time Shipment Progress</Text>

            <View style={styles.timelineBox}>
              {[
                { name: 'PLACED', title: 'Order Placed & Confirmed', desc: 'Seller notified for dispatch' },
                { name: 'CONFIRMED', title: 'Packed & Ready for Pickup', desc: 'Shiprocket courier assigned' },
                { name: 'DISPATCHED', title: 'In Transit / Out for Delivery', desc: 'On the way to your farm' },
                { name: 'DELIVERED', title: 'Order Delivered', desc: 'Successfully delivered to customer' },
              ].map((step, idx) => {
                const stepState = getStepStatus(step.name);
                const isDone = stepState === 'COMPLETED';

                return (
                  <View key={step.name} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineCircle,
                          { backgroundColor: isDone ? '#10B981' : '#374151' },
                        ]}
                      >
                        <Ionicons
                          name={isDone ? 'checkmark' : 'time-outline'}
                          size={14}
                          color="#FFF"
                        />
                      </View>
                      {idx < 3 && (
                        <View
                          style={[
                            styles.timelineLine,
                            { backgroundColor: isDone ? '#10B981' : '#374151' },
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.timelineRight}>
                      <Text
                        style={[
                          styles.stepTitle,
                          { color: isDone ? '#F9FAFB' : '#6B7280' },
                        ]}
                      >
                        {step.title}
                      </Text>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
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

  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },

  card: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNoText: { color: '#F9FAFB', fontSize: 16, fontWeight: '700' },
  dateText: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  statusBadge: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  courierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  courierName: { color: '#F9FAFB', fontSize: 13, fontWeight: '700' },
  trackingId: { color: '#10B981', fontSize: 12, marginTop: 2 },

  sectionTitle: { color: '#F9FAFB', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  timelineBox: { backgroundColor: '#111827', borderRadius: 14, padding: 16 },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineLeft: { alignItems: 'center', width: 28, marginRight: 12 },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justify: 'center',
    alignItems: 'center',
  },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  timelineRight: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepDesc: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
});
