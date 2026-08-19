import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { usePlot } from '@/src/hooks/usePlots';
import { useCreateCrop, useCropsForPlot, useSubmitCropToAdvisor } from '@/src/hooks/useCrops';
import { useCreateCropProblem } from '@/src/hooks/useCropProblems';
import { uploadPhoto } from '@/src/api/uploads.api';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { CROP_CATEGORIES } from '@/src/constants/cropCategories';
import { CropCategory, CropCycle, CropProblemSeverity } from '@/src/types/api';

const theme = RoleThemes.FARMER;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#64748b',
  ACTIVE: theme.primary,
  HARVESTING: '#c2410c',
  COMPLETED: '#1d4ed8',
  FAILED: '#dc2626',
};

export default function PlotDetailScreen() {
  const { plotId } = useLocalSearchParams<{ farmId: string; plotId: string }>();
  const router = useRouter();
  const { data: plot } = usePlot(plotId);
  const { data: crops, isLoading, refetch, isRefetching } = useCropsForPlot(plotId);
  const createCrop = useCreateCrop();
  const submitToAdvisor = useSubmitCropToAdvisor();

  const [problemCrop, setProblemCrop] = useState<CropCycle | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<CropCategory>('VEGETABLES');
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [plantCount, setPlantCount] = useState('');
  const [plantationDate, setPlantationDate] = useState(todayIso());
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = CROP_CATEGORIES.find((c) => c.value === category)!;

  const resetForm = () => {
    setCategory('VEGETABLES');
    setCropName('');
    setVariety('');
    setPlantCount('');
    setPlantationDate(todayIso());
    setRemarks('');
  };

  const onAddCrop = async () => {
    setError(null);
    const plants = plantCount ? Number(plantCount) : undefined;

    if (!cropName.trim()) {
      setError('Enter the crop name.');
      return;
    }
    if (plantCount && (!plants || plants <= 0)) {
      setError('Number of plants must be a positive number.');
      return;
    }
    if (!DATE_REGEX.test(plantationDate)) {
      setError('Enter the date of plantation as YYYY-MM-DD.');
      return;
    }

    try {
      await createCrop.mutateAsync({
        plotId: plotId as string,
        category,
        cropName: cropName.trim(),
        variety: variety.trim() || undefined,
        plantCount: plants,
        sowingDate: plantationDate,
        notes: remarks.trim() || undefined,
      });
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create crop cycle.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroIconWrap}>
            <Ionicons name="flower" size={20} color="#fff" />
          </View>
        </View>
        <Text style={styles.heroTitle}>{plot?.name ?? 'Plot'}</Text>
        {plot ? (
          <Text style={styles.heroSubtitle}>
            {plot.area} {plot.areaUnit.toLowerCase()}
          </Text>
        ) : null}
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={crops}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="flower-outline" size={36} color="#cbd5e1" />
              <Text style={styles.emptyText}>No crops yet. Add your first crop cycle below.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="flower" size={18} color={theme.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.cropName}</Text>
                <Text style={styles.cardSubtitle}>
                  {[item.variety, item.plantCount ? `${item.plantCount} plants` : null].filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>
              {item.advisorReviewStatus === 'ACCEPTED' ? (
                <View style={[styles.advisorReviewBadge, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
                  <Ionicons name="checkmark-circle" size={12} color="#15803d" />
                  <Text style={[styles.advisorReviewBadgeText, { color: '#15803d' }]}>Accepted</Text>
                </View>
              ) : item.advisorReviewStatus === 'PENDING' ? (
                <View style={[styles.advisorReviewBadge, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
                  <Ionicons name="time-outline" size={12} color="#92400e" />
                  <Text style={[styles.advisorReviewBadgeText, { color: '#92400e' }]}>With Advisor</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.submitAdvisorBtn}
                  activeOpacity={0.8}
                  disabled={submitToAdvisor.isPending}
                  onPress={async () => {
                    try {
                      await submitToAdvisor.mutateAsync(item.id);
                    } catch (err: any) {
                      const message = err?.response?.data?.message ?? 'Could not submit crop to advisor.';
                      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
                    }
                  }}
                >
                  <Ionicons name="paper-plane-outline" size={13} color={theme.primary} />
                  <Text style={styles.submitAdvisorBtnText}>Send to Advisor</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.reportProblemBtn}
                activeOpacity={0.8}
                onPress={() => setProblemCrop(item)}
              >
                <Ionicons name="medkit-outline" size={15} color="#dc2626" />
              </TouchableOpacity>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#64748b' }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
          )}
        />
      )}

      {showForm ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.formTitle}>Add Crop</Text>

            <Text style={styles.label}>Crop Category</Text>
            <View style={styles.categoryRow}>
              {CROP_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.categoryChip, category === c.value && styles.categoryChipActive]}
                  activeOpacity={0.75}
                  onPress={() => setCategory(c.value)}>
                  <Ionicons name={c.icon} size={14} color={category === c.value ? '#fff' : theme.primary} />
                  <Text style={[styles.categoryChipText, category === c.value && styles.categoryChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Crop Name</Text>
            <TextInput
              style={styles.input}
              placeholder={selectedCategory.example}
              placeholderTextColor="#94a3b8"
              value={cropName}
              onChangeText={setCropName}
            />

            <Text style={styles.label}>Variety Name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pusa Narangi"
              placeholderTextColor="#94a3b8"
              value={variety}
              onChangeText={setVariety}
            />

            <Text style={styles.label}>Number of Plants (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={plantCount}
              onChangeText={setPlantCount}
            />

            <Text style={styles.label}>Date of Plantation</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={plantationDate}
              onChangeText={setPlantationDate}
            />

            <Text style={styles.label}>Remarks (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any notes about this crop"
              placeholderTextColor="#94a3b8"
              value={remarks}
              onChangeText={setRemarks}
              multiline
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowForm(false);
                  setError(null);
                }}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButtonWrap}
                onPress={onAddCrop}
                disabled={createCrop.isPending}
                activeOpacity={0.85}>
                <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                  {createCrop.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Save Crop</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <TouchableOpacity style={styles.fabWrap} onPress={() => setShowForm(true)} activeOpacity={0.85}>
          <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fab}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.fabText}>Add Crop</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <ReportProblemModal crop={problemCrop} onClose={() => setProblemCrop(null)} />
    </View>
  );
}

const SEVERITY_OPTIONS: { value: CropProblemSeverity; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: '#15803d' },
  { value: 'MEDIUM', label: 'Medium', color: '#b45309' },
  { value: 'HIGH', label: 'High', color: '#c2410c' },
  { value: 'CRITICAL', label: 'Critical', color: '#dc2626' },
];

function ReportProblemModal({ crop, onClose }: { crop: CropCycle | null; onClose: () => void }) {
  const createProblem = useCreateCropProblem();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<CropProblemSeverity>('MEDIUM');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setSeverity('MEDIUM');
    setLocalPhotoUri(null);
    setPhotoUrl(null);
    setError(null);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to attach a picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setLocalPhotoUri(uri);
    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadPhoto(uri);
      setPhotoUrl(uploaded.fileUrl);
    } catch {
      Alert.alert('Upload failed', 'Could not upload the photo. You can still submit without it.');
      setLocalPhotoUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!crop) return;
    if (!title.trim() || !description.trim()) {
      setError('Enter both a title and description of the problem.');
      return;
    }
    try {
      await createProblem.mutateAsync({
        cropCycleId: crop.id,
        title: title.trim(),
        description: description.trim(),
        severity,
        photoUrls: photoUrl ? [photoUrl] : undefined,
      });
      reset();
      onClose();
      const message = 'Your advisor has been notified and will respond soon.';
      Platform.OS === 'web' ? alert(`Problem reported ✅\n${message}`) : Alert.alert('Problem Reported ✅', message);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not submit the report.');
    }
  };

  return (
    <Modal visible={!!crop} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <View style={modalStyles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.title}>Crop Disease Solution</Text>
              <Text style={modalStyles.sub}>{crop?.cropName}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
            <Text style={modalStyles.label}>Severity</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = opt.value === severity;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      modalStyles.severityChip,
                      isSelected && { backgroundColor: opt.color, borderColor: opt.color },
                    ]}
                    onPress={() => setSeverity(opt.value)}
                  >
                    <Text style={[modalStyles.severityChipText, isSelected && { color: '#ffffff' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={modalStyles.label}>Problem Title</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="e.g. Yellow spots on leaves"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={modalStyles.label}>Description</Text>
            <TextInput
              style={[modalStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Describe what you're seeing, since when, affected area..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={modalStyles.label}>Photo (optional)</Text>
            <TouchableOpacity style={modalStyles.photoPicker} onPress={pickPhoto} activeOpacity={0.85}>
              {localPhotoUri ? (
                <Image source={{ uri: localPhotoUri }} style={modalStyles.photoPreview} />
              ) : (
                <View style={modalStyles.photoPlaceholder}>
                  <Ionicons name="camera" size={20} color={theme.primary} />
                </View>
              )}
              <Text style={modalStyles.photoPickerText}>
                {isUploadingPhoto ? 'Uploading...' : localPhotoUri ? 'Change photo' : 'Attach a photo'}
              </Text>
            </TouchableOpacity>

            {error ? <Text style={modalStyles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={modalStyles.submitBtn}
              activeOpacity={0.85}
              disabled={createProblem.isPending || isUploadingPhoto}
              onPress={handleSubmit}
            >
              {createProblem.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={modalStyles.submitBtnText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  card: { width: '100%', maxWidth: 440, maxHeight: '85%', backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, ...premiumShadow('#000000', 'lg') },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  sub: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary, marginTop: 2 },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginTop: 4 },
  severityChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  severityChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  input: { borderWidth: 1.5, borderColor: '#eef2f6', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  photoPicker: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#eef2f6', padding: 10 },
  photoPreview: { width: 44, height: 44, borderRadius: RADIUS.sm },
  photoPlaceholder: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  photoPickerText: { fontSize: 12.5, fontFamily: FONT.bold, color: theme.primary },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { backgroundColor: '#dc2626', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: SPACING.xxl, overflow: 'hidden' },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: theme.accent, opacity: 0.18 },
  glowTop: { top: -70, right: -50 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  backButton: {
    width: 34, height: 34, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  heroIconWrap: {
    width: 40, height: 40, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13.5, fontFamily: FONT.medium, marginTop: 4 },
  list: { padding: SPACING.xxl, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyText: { color: theme.textMuted, fontSize: 14.5, fontFamily: FONT.medium, textAlign: 'center' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, textAlign: 'center', marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 12,
    ...premiumShadow('#000000', 'sm'),
  },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: RADIUS.sm,
    backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: FONT.bold, color: theme.text },
  cardSubtitle: { fontSize: 13, color: theme.textMuted, fontFamily: FONT.medium, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
  badgeText: { color: '#fff', fontSize: 10.5, fontFamily: FONT.bold },
  submitAdvisorBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.primary, paddingHorizontal: 8, paddingVertical: 5, borderRadius: RADIUS.pill },
  submitAdvisorBtnText: { fontSize: 10, fontFamily: FONT.bold, color: theme.primary },
  advisorReviewBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, borderRadius: RADIUS.pill },
  advisorReviewBadgeText: { fontSize: 10, fontFamily: FONT.bold },
  reportProblemBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWrap: { margin: SPACING.xxl, borderRadius: RADIUS.md, ...premiumShadow(theme.primary, 'md') },
  fab: {
    flexDirection: 'row', gap: 8, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 15.5, fontFamily: FONT.bold },
  form: {
    maxHeight: '78%',
    backgroundColor: theme.cardBg,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...premiumShadow('#000000', 'lg'),
  },
  formTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: theme.text, marginBottom: 4 },
  label: { fontSize: 13, color: '#334155', fontFamily: FONT.bold, marginBottom: 7, marginTop: 14 },
  input: {
    borderWidth: 1.5,
    borderColor: '#eef2f6',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15.5,
    fontFamily: FONT.medium,
    backgroundColor: '#f8fafc',
    color: theme.text,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#eef2f6',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  categoryChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  categoryChipText: { color: '#334155', fontSize: 12.5, fontFamily: FONT.semiBold },
  categoryChipTextActive: { color: '#fff', fontFamily: FONT.bold },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  primaryButtonWrap: { flex: 1, borderRadius: RADIUS.md },
  primaryButton: { borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontFamily: FONT.bold, fontSize: 15 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#334155', fontFamily: FONT.semiBold },
});
