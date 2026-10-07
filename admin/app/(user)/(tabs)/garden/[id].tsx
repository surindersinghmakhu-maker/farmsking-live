import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Image, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useGarden, useGardenPlants, useAddPlant } from '@/src/hooks/useGardens';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

const theme = RoleThemes.GARDENER;

type TabType = 'OVERVIEW' | 'PLANTS' | 'SCHEDULE' | 'MEDICAL' | 'SHOP';

export default function GardenDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: garden, isLoading: isGardenLoading } = useGarden(id);
  const { data: plants, isLoading: isPlantsLoading } = useGardenPlants(id);
  const addPlant = useAddPlant();
  
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  const handleCreatePlant = async () => {
    if (!name.trim()) return alert('Please enter plant name');
    try {
      await addPlant.mutateAsync({ gardenId: id, payload: { name, species, healthNotes } });
      setShowAdd(false);
      setName('');
      setSpecies('');
      setHealthNotes('');
    } catch (e) {
      alert('Failed to add plant');
    }
  };

  if (isGardenLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (!garden) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Garden not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        {(['OVERVIEW', 'PLANTS', 'SCHEDULE', 'MEDICAL', 'SHOP'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'OVERVIEW' ? 'Dashboard' : 
               tab === 'PLANTS' ? 'My Plants' : 
               tab === 'SCHEDULE' ? 'Care Schedule' : 
               tab === 'MEDICAL' ? 'Medical Records' : 'FarmsKing Shop'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.contentPadding}>
      <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
          <View>
            <Text style={styles.cardHeaderTitle}>Garden Health</Text>
            <Text style={styles.cardHeaderSub}>Overall ISO compliance score</Text>
          </View>
          <View style={[styles.scoreCircle, { borderColor: theme.primary }]}>
            <Text style={styles.scoreCircleText}>{garden.healthScore}%</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.reportBtn} onPress={() => router.push(`/garden/report-issue?gardenId=${id}`)}>
          <Ionicons name="warning" size={18} color="#ffffff" />
          <Text style={styles.reportBtnText}>Report a Problem</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.advisorBanner, premiumShadow(theme.primary, 'md')]} onPress={() => router.push('/garden/advisors')}>
        <View style={styles.advisorBannerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.advisorBannerTitle}>No Active Advisor</Text>
            <Text style={styles.advisorBannerSub}>Hire an expert for personalized care & prescriptions.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.primary} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderPlants = () => (
    <View style={styles.contentPadding}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
        <Text style={styles.sectionTitle}>Digital Garden ({(plants || []).length} / 5+)</Text>
        <TouchableOpacity style={styles.addPlantBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={14} color="#ffffff" />
          <Text style={styles.addPlantBtnText}>Add Plant</Text>
        </TouchableOpacity>
      </View>

      {isPlantsLoading ? <ActivityIndicator color={theme.primary} /> : (
        <View style={styles.plantsGrid}>
          {plants?.map(p => (
            <View key={p.id} style={[styles.plantCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.plantImagePlaceholder}>
                <Ionicons name="leaf" size={24} color="#a7f3d0" />
              </View>
              <View style={styles.plantInfo}>
                <Text style={styles.plantName}>{p.name}</Text>
                <Text style={styles.plantSpecies}>{p.species || 'Unknown Variety'}</Text>
                <View style={styles.lifecycleBadge}>
                  <Text style={styles.lifecycleText}>Growing 🌱</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderPlaceholder = (title: string, sub: string, icon: any) => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Ionicons name={icon} size={32} color={theme.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
      <TouchableOpacity style={styles.hireBtn} onPress={() => router.push('/garden/advisors')}>
        <Text style={styles.hireBtnText}>Hire Advisor Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.primary, '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{garden.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerLocation}>
          <Ionicons name="location" size={12} color="#cbd5e1" /> {garden.location || 'Home Location'}
        </Text>
      </LinearGradient>

      {renderTabs()}

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {activeTab === 'OVERVIEW' && renderOverview()}
        {activeTab === 'PLANTS' && renderPlants()}
        {activeTab === 'SCHEDULE' && renderPlaceholder('No Care Schedule', 'Hire an advisor to get your daily watering & care tasks.', 'calendar')}
        {activeTab === 'MEDICAL' && renderPlaceholder('No Medical Records', 'Prescriptions and disease history will appear here.', 'medkit')}
        {activeTab === 'SHOP' && renderPlaceholder('FarmsKing Shop', 'Buy verified organic fertilizers and seeds recommended by your advisor.', 'cart')}
      </ScrollView>

      {/* Add Plant Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Plant</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plant Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Tomato" value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Variety (Optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. Cherry Tomato" value={species} onChangeText={setSpecies} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreatePlant}>
              <Text style={styles.saveBtnText}>Save Plant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: SPACING.xxl, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: SPACING.xs },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: FONT.extraBold, color: '#ffffff' },
  headerLocation: { textAlign: 'center', fontSize: 12, fontFamily: FONT.medium, color: '#cbd5e1', marginTop: 4 },
  
  tabContainer: { backgroundColor: '#ffffff', marginTop: -15, marginHorizontal: SPACING.lg, borderRadius: RADIUS.pill, ...premiumShadow('#0f172a', 'sm') },
  tabScroll: { paddingHorizontal: 4, paddingVertical: 4, gap: 4 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.pill },
  tabBtnActive: { backgroundColor: theme.primary },
  tabText: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  
  scrollBody: { paddingBottom: 40 },
  contentPadding: { padding: SPACING.lg },
  
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  cardHeaderTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#0f172a' },
  cardHeaderSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  scoreCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreCircleText: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  
  reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', padding: 12, borderRadius: RADIUS.md, gap: 8, marginTop: SPACING.md },
  reportBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  
  advisorBanner: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  advisorBannerContent: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  advisorBannerTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  advisorBannerSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  
  sectionTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  addPlantBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, gap: 4 },
  addPlantBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },
  
  plantsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.md },
  plantCard: { width: '47%', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, overflow: 'hidden' },
  plantImagePlaceholder: { height: 100, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  plantInfo: { padding: 10 },
  plantName: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  plantSpecies: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  lifecycleBadge: { backgroundColor: '#f0fdf4', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm, marginTop: 6 },
  lifecycleText: { fontSize: 10, fontFamily: FONT.bold, color: '#166534' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 20 },
  emptyIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#0f172a', marginBottom: 4 },
  emptySub: { fontSize: 13, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 },
  hireBtn: { backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.pill, marginTop: 20 },
  hireBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#ffffff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 20, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#0f172a' },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, padding: 12, fontSize: 14, fontFamily: FONT.medium },
  saveBtn: { backgroundColor: theme.primary, padding: 14, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  errorText: { fontSize: 16, fontFamily: FONT.bold, color: '#dc2626', marginBottom: 16 },
  backBtn: { backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.pill },
  backBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' }
});
