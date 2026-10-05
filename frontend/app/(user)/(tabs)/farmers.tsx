import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
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

  // Determine theme based on role (Garden vs Farm)
  const isGarden = role === 'GARDEN_ADVISOR';
  const theme = isGarden ? RoleThemes.GARDENER : RoleThemes.FARM_ADVISOR;

  // Dummy Data for demonstration
  const adoptionRequests = [
    { id: '1', name: 'My Balcony Garden', gardener: 'Surinder Singh', location: 'Chandigarh', plants: 12 },
    { id: '2', name: 'Backyard Veggies', gardener: 'Amanpreet', location: 'Ludhiana', plants: 5 },
  ];

  const adoptedGardens = [
    { id: '3', name: 'Terrace Flowers', gardener: 'Harjit', healthScore: 92, lastVisit: '2 days ago' },
  ];

  const problemTickets = [
    { id: '101', gardenName: 'Terrace Flowers', plantName: 'Rose', issue: 'Leaves are turning yellow', status: 'PENDING' },
  ];

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'REQUESTS' && { backgroundColor: theme.primary }]} 
        onPress={() => setActiveTab('REQUESTS')}
      >
        <Text style={[styles.tabText, activeTab === 'REQUESTS' && styles.tabTextActive]}>
          Requests ({adoptionRequests.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'MY_ADOPTED' && { backgroundColor: theme.primary }]} 
        onPress={() => setActiveTab('MY_ADOPTED')}
      >
        <Text style={[styles.tabText, activeTab === 'MY_ADOPTED' && styles.tabTextActive]}>
          Adopted ({adoptedGardens.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'TICKETS' && { backgroundColor: theme.primary }]} 
        onPress={() => setActiveTab('TICKETS')}
      >
        <Text style={[styles.tabText, activeTab === 'TICKETS' && styles.tabTextActive]}>
          Tickets ({problemTickets.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequests = () => (
    <View style={styles.listContainer}>
      {adoptionRequests.map(req => (
        <View key={req.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name={isGarden ? 'flower' : 'leaf'} size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{req.name}</Text>
              <Text style={styles.cardSub}>By {req.gardener} • {req.location}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{req.plants} Plants</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.actionBtnText, { color: '#475569' }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={() => alert('Garden Adopted successfully!')}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Adopt Garden</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {adoptionRequests.length === 0 && <Text style={styles.emptyText}>No new adoption requests.</Text>}
    </View>
  );

  const renderAdopted = () => (
    <View style={styles.listContainer}>
      {adoptedGardens.map(g => (
        <TouchableOpacity key={g.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]} onPress={() => alert('Open Garden Details')}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{g.name}</Text>
              <Text style={styles.cardSub}>Client: {g.gardener}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.badgeText, { color: '#16a34a' }]}>Health: {g.healthScore}%</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 10 }}>
            Last interaction: {g.lastVisit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTickets = () => (
    <View style={styles.listContainer}>
      {problemTickets.map(t => (
        <TouchableOpacity key={t.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]} onPress={() => alert('Open Prescription Editor')}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="warning" size={20} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t.gardenName} - {t.plantName}</Text>
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
        <Text style={styles.headerTitle}>{isGarden ? 'Garden Advisor Portal' : 'Farm Advisor Portal'}</Text>
        <Text style={styles.headerSubtitle}>Manage your clients, adoptions, and prescriptions.</Text>
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
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#ffffff', marginHorizontal: SPACING.lg, marginTop: -20, borderRadius: RADIUS.pill, padding: 4, ...premiumShadow('#0f172a', 'sm') },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.pill },
  tabText: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  
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
