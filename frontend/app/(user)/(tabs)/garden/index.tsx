import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useMyGardens, useCreateGarden, useAddPlant } from '@/src/hooks/useGardens';
import { useMyGardenerPlan } from '@/src/hooks/useGardenerPlan';
import { GardenAIChatbot } from '@/src/components/GardenAIChatbot';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useRole } from '@/src/store/role-context';
import { UnderMaintenanceView } from '@/src/components/UnderMaintenanceView';

const theme = RoleThemes.GARDENER;


export default function GardensScreen() {
  const router = useRouter();
  const { data: gardens, isLoading } = useMyGardens();
  const createGarden = useCreateGarden();
  const { data: planData } = useMyGardenerPlan();
  const { data: settings } = useAppSettings();
  const isVip = planData?.plan === 'VIP';
  const { role } = useRole();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminOrSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isMaintenanceOn = Boolean(settings?.gardenMaintenanceMode);

  if (isMaintenanceOn && !isAdminOrSuperAdmin) {
    return <UnderMaintenanceView moduleName="Gardener & Garden Experts" />;
  }

  const handleCreate = async () => {
    if (!name.trim()) return alert('Please enter a garden name');
    setIsSubmitting(true);
    try {
      await createGarden.mutateAsync({ name, location });
      setShowAdd(false);
      setName('');
      setLocation('');
    } catch (e) {
      alert('Failed to add garden');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>My Gardens</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Garden</Text>
        </TouchableOpacity>
      </View>

      {/* Advisor Banner */}
      <TouchableOpacity 
        style={[styles.advisorBanner, premiumShadow(theme.primary, 'md')]}
        onPress={() => router.push('/garden/advisors')}
      >
        <View style={styles.advisorBannerContent}>
          <View style={styles.advisorBannerText}>
            <Text style={styles.advisorBannerTitle}>Hire a Garden Expert</Text>
            <Text style={styles.advisorBannerSub}>Get personalized care plans & chat support.</Text>
          </View>
          <View style={styles.advisorBannerIcon}>
            <Ionicons name="leaf" size={24} color={theme.primary} />
          </View>
        </View>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {(!gardens || gardens.length === 0) ? (
            <View style={styles.empty}>
              <Ionicons name="flower-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>You haven't added any gardens yet.</Text>
            </View>
          ) : (
            gardens.map((g, index) => {
              // Using beautiful placeholder images for demo purposes
              const dummyImages = [
                'https://images.unsplash.com/photo-1416879598555-22008fb944e8?auto=format&fit=crop&q=80&w=800',
                'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800',
                'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&q=80&w=800'
              ];
              const bgImg = dummyImages[index % dummyImages.length];

              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.beautifulCard, premiumShadow('#0f172a', 'md')]}
                  onPress={() => router.push(`/garden/${g.id}`)}
                  activeOpacity={0.9}
                >
                  <ImageBackground source={{ uri: bgImg }} style={styles.cardImageBg} imageStyle={{ borderRadius: RADIUS.lg }}>
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                      style={styles.cardGradient}
                    >
                      <View style={styles.cardTopRow}>
                        <View style={styles.statusBadge}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>Active</Text>
                        </View>
                        <View style={styles.healthBadge}>
                          <Ionicons name="heart" size={12} color="#fff" />
                          <Text style={styles.healthText}>{g.healthScore}%</Text>
                        </View>
                      </View>
                      
                      <View style={styles.cardBottomRow}>
                        <View>
                          <Text style={styles.beautifulCardTitle}>{g.name}</Text>
                          <Text style={styles.beautifulCardSub}>
                            <Ionicons name="location" size={12} color="#cbd5e1" /> {g.location || 'Home Garden'}
                          </Text>
                        </View>
                        <View style={styles.photoCountBadge}>
                          <Ionicons name="images" size={14} color="#0f172a" />
                          <Text style={styles.photoCountText}>12 Photos</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Simple Add Garden Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Garden</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 13, fontFamily: FONT.medium, color: '#64748b', marginBottom: 4 }}>
                Enter the details of your new home or kitchen garden.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Garden Name *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. My Balcony Garden" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location (Optional)</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Terrace" />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Garden</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🌿 VIP Garden AI Chatbot — only for VIP plan holders */}
      {isVip && (
        <GardenAIChatbot
          adminWhatsapp={(settings as any)?.adminMobile || ''}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.xl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, gap: 4 },
  addBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },
  list: { padding: SPACING.xl, gap: 12 },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#64748b' },
  
  // Beautiful Card Styles
  beautifulCard: { height: 180, borderRadius: RADIUS.lg, marginBottom: SPACING.md },
  cardImageBg: { flex: 1, borderRadius: RADIUS.lg },
  cardGradient: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.lg, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  statusText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
  healthBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, gap: 4 },
  healthText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  beautifulCardTitle: { fontSize: 20, fontFamily: FONT.extraBold, color: '#ffffff', marginBottom: 2 },
  beautifulCardSub: { fontSize: 13, fontFamily: FONT.medium, color: '#e2e8f0' },
  photoCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, gap: 4 },
  photoCountText: { fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 14, borderRadius: RADIUS.lg, gap: 12 },
  iconBg: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14.5, fontFamily: FONT.bold, color: '#0f172a' },
  cardSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  scoreBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.pill },
  scoreText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#166534' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#ffffff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 20, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#0f172a' },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontFamily: FONT.medium },
  saveBtn: { flexDirection: 'row', backgroundColor: theme.primary, padding: 14, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  typeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: RADIUS.lg, borderWidth: 2, borderColor: 'transparent', gap: 12 },
  typeCardActive: { borderColor: theme.primary, backgroundColor: '#f0fdf4' },
  typeIconBg: { width: 44, height: 44, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  typeTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  typeSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  
  advisorBanner: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  advisorBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  advisorBannerText: {
    flex: 1,
  },
  advisorBannerTitle: {
    fontFamily: FONT.bold,
    fontSize: 16,
    color: '#0f172a',
  },
  advisorBannerSub: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  advisorBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
});
