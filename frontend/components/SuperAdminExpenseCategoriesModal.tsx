import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useAllExpenseCategoriesForAdmin,
  useCreateAdminExpenseCategory,
  useUpdateAdminExpenseCategory,
  useDeleteAdminExpenseCategory,
} from '@/src/hooks/useExpenses';
import { getExpenseCategoryIcon } from '@/src/constants/expenseCategoryIcons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SuperAdminExpenseCategoriesModal({ visible, onClose }: Props) {
  const { data: categories = [], isLoading, refetch } = useAllExpenseCategoriesForAdmin();
  const createCat = useCreateAdminExpenseCategory();
  const updateCat = useUpdateAdminExpenseCategory();
  const deleteCat = useDeleteAdminExpenseCategory();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [key, setKey] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [sortOrder, setSortOrder] = useState('10');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setKey('');
    setLabelEn('');
    setSortOrder('10');
    setErrorMsg(null);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingId(cat.id);
    setKey(cat.key);
    setLabelEn(cat.labelEn);
    setSortOrder(String(cat.sortOrder || 10));
    setShowAddForm(true);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (!labelEn.trim()) {
      setErrorMsg('Category English/Main Name is required.');
      return;
    }

    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (editingId) {
        await updateCat.mutateAsync({
          id: editingId,
          payload: {
            labelEn: labelEn.trim(),
            sortOrder: Number(sortOrder) || 10,
          },
        });
      } else {
        if (!key.trim()) {
          setErrorMsg('Key identifier is required for new category.');
          return;
        }
        const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        await createCat.mutateAsync({
          key: cleanKey,
          labelEn: labelEn.trim(),
          sortOrder: Number(sortOrder) || 10,
        });
      }
      refetch();
      resetForm();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Could not save category.');
    }
  };

  const handleToggleActive = async (cat: any) => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateCat.mutateAsync({
        id: cat.id,
        payload: { isActive: !cat.isActive },
      });
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update status');
    }
  };

  const handleDelete = async (id: string, label: string) => {
    const confirmAction = async () => {
      try {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await deleteCat.mutateAsync(id);
        refetch();
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Could not delete category');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to deactivate "${label}" category?`)) {
        confirmAction();
      }
    } else {
      Alert.alert('Deactivate Category', `Are you sure you want to deactivate "${label}" category?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: confirmAction },
      ]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, premiumShadow('#0f172a', 'md')]}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconBg}>
                <Ionicons name="pricetags" size={20} color="#dc2626" />
              </View>
              <View>
                <Text style={styles.title}>Expense Categories Control Panel</Text>
                <Text style={styles.subtitle}>Super Admin Management — Add, Edit & Deactivate</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Add Category CTA Bar */}
          {!showAddForm ? (
            <TouchableOpacity
              style={styles.addCtaBtn}
              activeOpacity={0.85}
              onPress={() => {
                resetForm();
                setShowAddForm(true);
              }}
            >
              <Ionicons name="add-circle" size={18} color="#ffffff" />
              <Text style={styles.addCtaBtnText}>Add New Expense Category</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {editingId ? 'Edit Category' : 'Add New Category'}
                </Text>
                <TouchableOpacity onPress={resetForm}>
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {!editingId && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category Key (Unique ID, e.g. crop_care)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. crop_care"
                    placeholderTextColor="#94a3b8"
                    value={key}
                    onChangeText={setKey}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name (English / Main) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Crop Care & Protection"
                  placeholderTextColor="#94a3b8"
                  value={labelEn}
                  onChangeText={setLabelEn}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sort Order Priority</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={sortOrder}
                  onChangeText={setSortOrder}
                />
              </View>

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={createCat.isPending || updateCat.isPending}
                >
                  {createCat.isPending || updateCat.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingId ? 'Save Changes' : 'Create Category'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* List of Categories */}
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <ActivityIndicator color="#dc2626" style={{ marginTop: 20 }} />
            ) : categories.length === 0 ? (
              <Text style={styles.emptyText}>No expense categories found.</Text>
            ) : (
              categories.map((cat) => (
                <View key={cat.id} style={[styles.catRow, !cat.isActive && styles.catRowInactive]}>
                  <View style={styles.catLeft}>
                    <View style={[styles.catIconBg, !cat.isActive && { backgroundColor: '#f1f5f9' }]}>
                      <Ionicons
                        name={getExpenseCategoryIcon(cat.key)}
                        size={18}
                        color={cat.isActive ? '#dc2626' : '#94a3b8'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.catName, !cat.isActive && { color: '#94a3b8' }]}>
                          {cat.labelEn}
                        </Text>
                        {!cat.isActive ? (
                          <View style={styles.inactiveBadge}>
                            <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.catMeta}>
                        Priority: {cat.sortOrder}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Right */}
                  <View style={styles.catActions}>
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => handleOpenEdit(cat)}
                    >
                      <Ionicons name="create-outline" size={16} color="#2563eb" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionIconButton,
                        { backgroundColor: cat.isActive ? '#fef2f2' : '#f0fdf4' },
                      ]}
                      onPress={() => handleToggleActive(cat)}
                    >
                      <Ionicons
                        name={cat.isActive ? 'power' : 'checkmark-circle'}
                        size={16}
                        color={cat.isActive ? '#dc2626' : '#16a34a'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  closeBtn: {
    padding: 4,
  },
  addCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addCtaBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  formCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  inputGroup: {
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  errorText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#dc2626',
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#e2e8f0',
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#dc2626',
  },
  saveBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 20,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  catRowInactive: {
    backgroundColor: '#f8fafc',
    opacity: 0.75,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  catIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  catMeta: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  inactiveBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  inactiveBadgeText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#64748b',
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
