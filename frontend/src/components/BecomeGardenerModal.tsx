import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useBecomeGardener } from '../hooks/useBecomeRole';
import { useAuth } from '../store/auth-context';

const theme = RoleThemes.GARDENER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface BecomeGardenerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
}

export function BecomeGardenerModal({ visible, onClose, onSuccess }: BecomeGardenerModalProps) {
  const { user } = useAuth();
  const becomeGardener = useBecomeGardener();

  const [gardenName, setGardenName] = useState<string>(user?.name ? `${user.name}'s Kitchen Garden` : '');
  const [gardenLocation, setGardenLocation] = useState<string>(
    [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (user && visible) {
      if (!gardenName) setGardenName(user.name ? `${user.name}'s Kitchen Garden` : '');
      if (!gardenLocation) setGardenLocation([user.village, user.district, user.state].filter(Boolean).join(', ') || '');
    }
  }, [user, visible]);

  const isValid = gardenName.trim().length > 0 && gardenLocation.trim().length > 0;

  const handleSubmit = async () => {
    tap();
    if (!gardenName.trim()) {
      setErrorMessage('Please enter your Garden Name.');
      return;
    }
    if (!gardenLocation.trim()) {
      setErrorMessage('Please enter your Garden Location.');
      return;
    }
    setErrorMessage(null);

    try {
      // In a real app, you might pass gardenName and location to the backend
      // so it can create the default garden immediately during role activation.
      // For now we just mutate role, and the dashboard handles the rest if needed.
      const updatedUser = await becomeGardener.mutateAsync();
      onSuccess(updatedUser);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Could not save gardener profile details. Please try again.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBg, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="flower" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>🪴 Become a Gardener</Text>
                <Text style={styles.headerSub}>Setup your home garden profile</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.noticeBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#0369a1" />
              <Text style={styles.noticeText}>
                Activate the Gardener Dashboard to get AI care for your indoor & outdoor plants.
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#ef4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.fieldSection}>
              <Text style={styles.label}>Garden Name <Text style={styles.req}>*</Text></Text>
              <View style={styles.inputContainer}>
                <Ionicons name="leaf-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. My Balcony Garden"
                  placeholderTextColor="#94a3b8"
                  value={gardenName}
                  onChangeText={setGardenName}
                />
              </View>
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>Location / Address <Text style={styles.req}>*</Text></Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sector 14, Chandigarh"
                  placeholderTextColor="#94a3b8"
                  value={gardenLocation}
                  onChangeText={setGardenLocation}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: theme.primary },
                !isValid && styles.saveBtnDisabled,
                premiumShadow(theme.primary, 'sm'),
              ]}
              activeOpacity={0.85}
              disabled={!isValid || becomeGardener.isPending}
              onPress={handleSubmit}
            >
              {becomeGardener.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Save & Activate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xs,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...premiumShadow('#0f172a', 'md'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerIconBg: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  headerSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, gap: 16 },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  noticeText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#0369a1' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#ef4444' },
  fieldSection: { gap: 6 },
  label: { fontSize: 12.5, fontFamily: FONT.bold, color: '#334155' },
  req: { color: '#ef4444' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: { flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a', height: '100%' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: RADIUS.md },
  cancelBtnText: { fontSize: 13.5, fontFamily: FONT.bold, color: '#64748b' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
});
