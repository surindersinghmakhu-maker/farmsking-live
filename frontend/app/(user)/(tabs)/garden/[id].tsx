import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useGarden, useGardenPlants, useAddPlant } from '@/src/hooks/useGardens';
import dayjs from 'dayjs';

const theme = RoleThemes.GARDENER;

export default function GardenDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: garden, isLoading: isGardenLoading } = useGarden(id);
  const { data: plants, isLoading: isPlantsLoading } = useGardenPlants(id);
  const addPlant = useAddPlant();
  
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{garden.name}</Text>
          {garden.location ? <Text style={styles.headerSub}>{garden.location}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Garden Stats */}
        <View style={[styles.statsCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Health Score</Text>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{garden.healthScore}%</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Plants</Text>
            <Text style={styles.statValue}>{plants ? plants.length : 0}</Text>
          </View>
        </View>

        {/* Plants Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Plants in this Garden</Text>
          <TouchableOpacity style={styles.addPlantBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={14} color="#ffffff" />
            <Text style={styles.addPlantBtnText}>Add Plant</Text>
          </TouchableOpacity>
        </View>

        {isPlantsLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (!plants || plants.length === 0) ? (
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={32} color="#cbd5e1" />
            <Text style={styles.emptyText}>No plants added to this garden.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {plants.map(p => (
              <View key={p.id} style={[styles.plantCard, premiumShadow('#0f172a', 'sm')]}>
                <View style={styles.plantIconBg}>
                  <Ionicons name="leaf" size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plantName}>{p.name}</Text>
                  {p.species ? <Text style={styles.plantSpecies}>{p.species}</Text> : null}
                  {p.healthNotes ? (
                    <Text style={styles.plantNotes} numberOfLines={2}>Note: {p.healthNotes}</Text>
                  ) : null}
                </View>
                <Text style={styles.plantDate}>{dayjs(p.createdAt).format('DD MMM')}</Text>
              </View>
            ))}
          </View>
        )}
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
              <Text style={styles.label}>Plant Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Rose Bush" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Species / Variety (Optional)</Text>
              <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholder="e.g. Rosa rubiginosa" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Health Notes (Optional)</Text>
              <TextInput style={styles.input} value={healthNotes} onChangeText={setHealthNotes} placeholder="e.g. Leaves turning slightly yellow" />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreatePlant} disabled={addPlant.isPending}>
              {addPlant.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Plant</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerBack: { padding: 8, marginRight: 8, marginLeft: -8 },
  headerTitle: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a' },
  headerSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  errorText: { fontSize: 14, fontFamily: FONT.bold, color: '#ef4444', marginBottom: 16 },
  backBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md },
  backBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
  content: { padding: SPACING.xl, gap: 16 },
  
  statsCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 16, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#64748b' },
  statValue: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a' },
  statDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  addPlantBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, gap: 4 },
  addPlantBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },

  empty: { alignItems: 'center', padding: 30, gap: 8, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#f1f5f9', borderStyle: 'dashed' },
  emptyText: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8' },

  plantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: RADIUS.md, gap: 12 },
  plantIconBg: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: '#84cc16', alignItems: 'center', justifyContent: 'center' },
  plantName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  plantSpecies: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  plantNotes: { fontSize: 10, fontFamily: FONT.medium, color: '#0ea5e9', marginTop: 4 },
  plantDate: { fontSize: 10, fontFamily: FONT.bold, color: '#cbd5e1' },

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
