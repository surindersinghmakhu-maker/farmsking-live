import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useGardenPlants } from '@/src/hooks/useGardens';

const theme = RoleThemes.GARDENER;

export default function ReportIssueScreen() {
  const router = useRouter();
  const { gardenId } = useLocalSearchParams<{ gardenId: string }>();
  
  // Use mock plants if gardenId is not passed for demo, else fetch real plants
  const { data: plants, isLoading: isPlantsLoading } = useGardenPlants(gardenId || '');

  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return alert('Camera permission needed.');
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return alert('Gallery permission needed.');
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0].uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      alert('Error picking image.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlantId) return alert('Please select a plant.');
    if (!photoUri) return alert('Please add a photo of the problem.');
    
    setIsSubmitting(true);
    // Mock API Call delay
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Problem reported to your Advisor successfully!');
      router.back();
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.primary, '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report a Problem</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Send a detailed report to your Garden Advisor</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        
        {/* Step 1: Select Plant */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>1. Which plant has an issue? *</Text>
          {isPlantsLoading ? <ActivityIndicator color={theme.primary} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
              {plants && plants.length > 0 ? plants.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.plantPill, selectedPlantId === p.id && styles.plantPillActive]}
                  onPress={() => setSelectedPlantId(p.id)}
                >
                  <Ionicons name="leaf" size={16} color={selectedPlantId === p.id ? '#ffffff' : theme.primary} />
                  <Text style={[styles.plantPillText, selectedPlantId === p.id && styles.plantPillTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              )) : (
                <Text style={styles.noPlantsText}>No plants found. Please add plants first.</Text>
              )}
            </ScrollView>
          )}
        </View>

        {/* Step 2: Upload Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>2. Upload clear photo of the disease *</Text>
          {photoUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                <Ionicons name="trash" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtonsRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(true)}>
                <Ionicons name="camera" size={24} color={theme.primary} />
                <Text style={styles.photoBtnText}>Open Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(false)}>
                <Ionicons name="images" size={24} color={theme.primary} />
                <Text style={styles.photoBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Step 3: Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>3. Describe the problem</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. The leaves are turning yellow and falling off..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

      </ScrollView>

      {/* Footer Submit */}
      <View style={[styles.footer, premiumShadow('#0f172a', 'md')]}>
        <TouchableOpacity 
          style={[styles.submitBtn, (!selectedPlantId || !photoUri) && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={!selectedPlantId || !photoUri || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>Send to Advisor</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: SPACING.xxl, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: SPACING.xs },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: FONT.extraBold, color: '#ffffff' },
  headerSubtitle: { textAlign: 'center', fontSize: 13, fontFamily: FONT.medium, color: '#cbd5e1', marginTop: 8 },
  
  scrollBody: { padding: SPACING.lg, paddingBottom: 100 },
  section: { marginBottom: SPACING.xl },
  sectionLabel: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a', marginBottom: SPACING.md },
  
  plantPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#cbd5e1', gap: 6 },
  plantPillActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  plantPillText: { fontSize: 13, fontFamily: FONT.bold, color: '#334155' },
  plantPillTextActive: { color: '#ffffff' },
  noPlantsText: { fontSize: 13, fontFamily: FONT.medium, color: '#64748b', fontStyle: 'italic' },
  
  photoButtonsRow: { flexDirection: 'row', gap: SPACING.md },
  photoBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: RADIUS.lg, paddingVertical: SPACING.xl, gap: 8 },
  photoBtnText: { fontSize: 13, fontFamily: FONT.bold, color: '#475569' },
  photoPreviewContainer: { width: '100%', height: 200, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  removePhotoBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(220, 38, 38, 0.9)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  
  textInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a', minHeight: 100 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, paddingVertical: 14, borderRadius: RADIUS.lg, gap: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' }
});
