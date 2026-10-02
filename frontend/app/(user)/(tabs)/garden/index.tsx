import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useMyGardens, useCreateGarden } from '@/src/hooks/useGardens';
import { useMyGardenerPlan } from '@/src/hooks/useGardenerPlan';
import { GardenAIChatbot } from '@/src/components/GardenAIChatbot';
import { useAppSettings } from '@/src/hooks/useAppSettings';

const theme = RoleThemes.GARDENER;


export default function GardensScreen() {
  const router = useRouter();
  const { data: gardens, isLoading } = useMyGardens();
  const createGarden = useCreateGarden();
  const { data: planData } = useMyGardenerPlan();
  const { data: settings } = useAppSettings();
  const isVip = planData?.plan === 'VIP';
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return alert('Please enter a garden name');
    try {
      await createGarden.mutateAsync({ name, location });
      setShowAdd(false);
      setName('');
      setLocation('');
    } catch (e) {
      alert('Failed to create garden');
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
            gardens.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.card, premiumShadow('#0f172a', 'sm')]}
                onPress={() => router.push(`/garden/${g.id}`)}
              >
                <View style={styles.iconBg}>
                  <Ionicons name="flower" size={20} color={theme.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{g.name}</Text>
                  {g.location ? <Text style={styles.cardSub}>📍 {g.location}</Text> : null}
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>Health {g.healthScore}%</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Garden</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Garden Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Backyard Garden" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location (Optional)</Text>
              <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Home Terrace" />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={createGarden.isPending}>
              {createGarden.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Garden</Text>}
            </TouchableOpacity>
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
  saveBtn: { backgroundColor: theme.primary, padding: 14, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
});
