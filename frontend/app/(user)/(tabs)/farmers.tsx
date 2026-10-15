import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRole } from '@/src/store/role-context';

export default function AdvisorDashboardScreen() {
  const router = useRouter();
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'MY_ADOPTED' | 'TICKETS'>('REQUESTS');

  // Animated sliding pill for advisor tabs
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const idx = activeTab === 'REQUESTS' ? 0 : activeTab === 'MY_ADOPTED' ? 1 : 2;
    Animated.spring(tabSlideAnim, {
      toValue: idx,
      friction: 9,
      tension: 65,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  // Determine theme based on role (Garden vs Farm)
  const isGarden = role === 'GARDEN_ADVISOR';
  const theme = isGarden ? RoleThemes.GARDENER : RoleThemes.FARM_ADVISOR;

  const adoptionRequests = isGarden
    ? [
        { id: '1', name: 'My Balcony Garden', client: 'Surinder Singh', location: 'Chandigarh', metric: '12 Plants' },
        { id: '2', name: 'Backyard Veggies', client: 'Amanpreet', location: 'Ludhiana', metric: '5 Plants' },
      ]
    : [
        { id: '1', name: 'Main Farm - Wheat 1121', client: 'Jagtar Singh', location: 'Ferozepur', metric: '4.5 Acres' },
        { id: '2', name: 'Canal Plot - Mustard', client: 'Harpreet Kaur', location: 'Moga', metric: '2.0 Acres' },
      ];

  const adoptedHoldings = isGarden
    ? [
        { id: '3', name: 'Terrace Flowers', client: 'Harjit', healthScore: 92, lastVisit: '2 days ago' },
      ]
    : [
        { id: '3', name: 'South Field - Basmati Paddy', client: 'Gursewak Singh', healthScore: 94, lastVisit: 'Yesterday' },
      ];

  const problemTickets = isGarden
    ? [
        { id: '101', holdingName: 'Terrace Flowers', item: 'Rose Plant', issue: 'Leaves are turning yellow', status: 'PENDING' },
      ]
    : [
        { id: '101', holdingName: 'South Field', item: 'Wheat Crop', issue: 'Suspected Yellow Rust spots on upper leaf', status: 'PENDING' },
      ];

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <Animated.View
        style={[
          styles.slidingTabPill,
          {
            backgroundColor: theme.primary,
            left: tabSlideAnim.interpolate({
              inputRange: [0, 1, 2],
              outputRange: ['0.8%', '34.1%', '67.4%'],
            }),
          },
        ]}
      />
      <TouchableOpacity 
        style={styles.tabBtn} 
        onPress={() => setActiveTab('REQUESTS')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, activeTab === 'REQUESTS' && styles.tabTextActive]}>
          Requests ({adoptionRequests.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.tabBtn} 
        onPress={() => setActiveTab('MY_ADOPTED')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, activeTab === 'MY_ADOPTED' && styles.tabTextActive]}>
          {isGarden ? 'Gardens' : 'Farms'} ({adoptedHoldings.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.tabBtn} 
        onPress={() => setActiveTab('TICKETS')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, activeTab === 'TICKETS' && styles.tabTextActive]}>
          Tickets ({problemTickets.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequests = () => (
    <View style={styles.listContainer}>
      {adoptionRequests.map((req) => (
        <View key={req.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name={isGarden ? 'flower' : 'leaf'} size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{req.name}</Text>
              <Text style={styles.cardSub}>By {req.client} • {req.location}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{req.metric}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.actionBtnText, { color: '#475569' }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              onPress={() => alert(isGarden ? 'Garden Adopted successfully!' : 'Farm Plot Adopted successfully!')}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>
                {isGarden ? 'Adopt Garden' : 'Adopt Farm Plot'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {adoptionRequests.length === 0 && <Text style={styles.emptyText}>No new adoption requests.</Text>}
    </View>
  );

  const renderAdopted = () => (
    <View style={styles.listContainer}>
      {adoptedHoldings.map((h) => (
        <TouchableOpacity key={h.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]} onPress={() => alert(isGarden ? 'Open Garden Details' : 'Open Farm Details')}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{h.name}</Text>
              <Text style={styles.cardSub}>Client: {h.client}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.badgeText, { color: '#16a34a' }]}>Health: {h.healthScore}%</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 10 }}>
            Last interaction: {h.lastVisit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTickets = () => (
    <View style={styles.listContainer}>
      {problemTickets.map((t) => (
        <TouchableOpacity key={t.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]} onPress={() => alert('Open Prescription Editor')}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="warning" size={20} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t.holdingName} - {t.item}</Text>
              <Text style={[styles.cardSub, { color: '#ef4444', fontFamily: FONT.bold }]}>{t.issue}</Text>
            </View>
          </View>
          <View style={[styles.cardActions, { marginTop: 12 }]}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary, width: '100%' }]}>
              <Ionicons name="medkit" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Write Prescription</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.primary, '#0f172a']} style={styles.header}>
        <Text style={styles.headerTitle}>{isGarden ? 'Garden Advisor Portal' : 'Crop Doctor Portal'}</Text>
        <Text style={styles.headerSubtitle}>
          {isGarden
            ? 'Manage gardeners, residential plant care and horticultural prescriptions.'
            : 'Manage farmers, agricultural field plots and crop disease prescriptions.'}
        </Text>
      </LinearGradient>

      {renderTabs()}

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {activeTab === 'REQUESTS' && renderRequests()}
        {activeTab === 'MY_ADOPTED' && renderAdopted()}
        {activeTab === 'TICKETS' && renderTickets()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: SPACING.xxl, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FONT.extraBold, color: '#ffffff' },
  headerSubtitle: { fontSize: 13, fontFamily: FONT.medium, color: '#cbd5e1', marginTop: 4 },
  
  tabContainer: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: SPACING.lg,
    marginTop: -20,
    borderRadius: RADIUS.pill,
    padding: 4,
    ...premiumShadow('#0f172a', 'sm'),
  },
  slidingTabPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '31.8%',
    borderRadius: RADIUS.pill,
    ...premiumShadow('#000000', 'xs'),
    zIndex: 0,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    position: 'relative',
    zIndex: 1,
  },
  tabText: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  tabTextActive: { color: '#ffffff', fontFamily: FONT.extraBold },
  
  scrollBody: { paddingBottom: 100 },
  listContainer: { padding: SPACING.lg, gap: SPACING.md },
  
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  cardSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
  badgeText: { fontSize: 11, fontFamily: FONT.bold, color: '#334155' },
  
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS.md, gap: 6 },
  actionBtnText: { fontSize: 13, fontFamily: FONT.bold },
  
  emptyText: { textAlign: 'center', fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 40 }
});
