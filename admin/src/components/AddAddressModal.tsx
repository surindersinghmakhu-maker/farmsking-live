import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/store/auth-context';
import { useCreateAddress, useUpdateAddress } from '@/src/hooks/useAddresses';
import { CustomerAddress, CreateAddressPayload } from '@/src/api/addresses.api';
import { lookupPincode, PincodeOffice } from '@/src/api/pincode.api';
import { FONT, RADIUS } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

const getCleanMobile = (mobile?: string | null): string => {
  if (!mobile) return '';
  return mobile.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);
};

export interface AddAddressModalProps {
  visible: boolean;
  editingAddress?: CustomerAddress | null;
  onClose: () => void;
  onSaved?: (address: CustomerAddress) => void;
  primaryColor?: string;
}

export default function AddAddressModal({
  visible,
  editingAddress,
  onClose,
  onSaved,
  primaryColor = '#15803d',
}: AddAddressModalProps) {
  const { user } = useAuth();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const [tag, setTag] = useState<'HOME' | 'FARM' | 'WORK'>('HOME');
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [line, setLine] = useState('');
  const [mobile, setMobile] = useState(getCleanMobile(user?.mobile));
  const [pincode, setPincode] = useState('');
  const [postOffice, setPostOffice] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [officeOptions, setOfficeOptions] = useState<PincodeOffice[]>([]);
  const [isPostOfficeExpanded, setIsPostOfficeExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (editingAddress) {
      setTag(editingAddress.tag);
      setFullName(editingAddress.name || user?.name || '');
      setLine(editingAddress.line);
      setMobile(editingAddress.mobile || getCleanMobile(user?.mobile));
      setPincode(editingAddress.pincode);
      setPostOffice(editingAddress.postOffice);
      setDistrict(editingAddress.district);
      setState(editingAddress.state);
      setOfficeOptions([]);
    } else {
      reset();
    }
  }, [editingAddress, visible]);

  const reset = () => {
    setTag('HOME');
    setFullName(user?.name ?? '');
    setLine('');
    setMobile(getCleanMobile(user?.mobile));
    setPincode('');
    setPostOffice('');
    setDistrict('');
    setState('');
    setOfficeOptions([]);
    setIsPostOfficeExpanded(false);
    setStatus(null);
  };

  const handlePincodeChange = async (code: string) => {
    setPincode(code);
    setStatus(null);
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      setIsLoading(true);
      try {
        const result = await lookupPincode(code);
        setOfficeOptions(result.offices || []);
        setPostOffice(result.postOffice);
        setDistrict(result.district);
        setState(result.state);
        if (result.offices && result.offices.length > 1) {
          setIsPostOfficeExpanded(true);
        }
      } catch (err: any) {
        setOfficeOptions([]);
        setPostOffice('');
        setDistrict('');
        setState('');
        setStatus('Invalid PIN code — no matching post office branch found.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setOfficeOptions([]);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setStatus('Please enter recipient full name.');
      return;
    }
    if (!line.trim()) {
      setStatus('Please enter House No. / Street / Village line.');
      return;
    }
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      setStatus('Please enter a valid 6-digit PIN code.');
      return;
    }
    if (!postOffice || !district || !state) {
      setStatus('Please select your Post Office from the branches.');
      return;
    }
    tap();
    try {
      const payload: CreateAddressPayload = {
        tag,
        name: fullName.trim(),
        line: line.trim(),
        mobile: mobile.trim() || undefined,
        postOffice: postOffice.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      };

      let saved: CustomerAddress;
      if (editingAddress) {
        saved = await updateAddress.mutateAsync({
          id: editingAddress.id,
          payload,
        });
      } else {
        saved = await createAddress.mutateAsync(payload);
      }
      reset();
      onClose();
      if (onSaved) onSaved(saved);
    } catch (err: any) {
      setStatus(`❌ ${err?.response?.data?.message ?? 'Could not save this address.'}`);
    }
  };

  const isPending = createAddress.isPending || updateAddress.isPending;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { reset(); onClose(); }}>
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location-sharp" size={18} color={primaryColor} />
              <Text style={modalStyles.modalTitle}>
                {editingAddress ? 'Edit Registered Address' : 'Add Registered Address'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={{ padding: 2 }}>
              <Ionicons name="close-circle" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {/* Address Tag Selector */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 2 }}>
              {(['HOME', 'FARM', 'WORK'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    modalStyles.tagChip,
                    tag === t && { backgroundColor: primaryColor, borderColor: primaryColor },
                  ]}
                  onPress={() => { tap(); setTag(t); }}
                >
                  <Text style={[modalStyles.tagChipText, tag === t && { color: '#ffffff' }]}>
                    {t === 'HOME' ? '🏠 HOME' : t === 'FARM' ? '🌾 FARM' : '🏢 WORK'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Field 1: Recipient Full Name */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={modalStyles.inputLabel}>Recipient Full Name *</Text>
                <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b' }}>Default: your name (editable)</Text>
              </View>
              <TextInput
                style={modalStyles.modalInput}
                placeholder="Recipient full name *"
                placeholderTextColor="#94a3b8"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Field 2: House No. / Street / Village Line */}
            <View>
              <Text style={modalStyles.inputLabel}>House No. / Street / Village Line *</Text>
              <TextInput
                style={modalStyles.modalInput}
                placeholder="e.g. House #14, Main Street / Village"
                placeholderTextColor="#94a3b8"
                value={line}
                onChangeText={setLine}
              />
            </View>

            {/* Field 3: 6-Digit PIN Code */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={modalStyles.inputLabel}>6-Digit PIN Code *</Text>
                {isLoading ? (
                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: primaryColor }}>Fetching branches...</Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[modalStyles.modalInput, { flex: 1, fontFamily: FONT.bold, letterSpacing: 1 }]}
                  placeholder="Enter 6-digit PIN code *"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={handlePincodeChange}
                />
                {isLoading ? (
                  <ActivityIndicator size="small" color={primaryColor} />
                ) : pincode.length === 6 && district ? (
                  <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
                ) : null}
              </View>
            </View>

            {/* Field 4: Post Office Branch (Select from branches) */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <Text style={[modalStyles.inputLabel, { marginBottom: 0 }]}>Post Office Branch *</Text>
                {officeOptions.length > 1 && (
                  <TouchableOpacity onPress={() => setIsPostOfficeExpanded((prev) => !prev)}>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#0369a1' }}>
                      {isPostOfficeExpanded ? '▲ Hide Branches' : `▼ Change Branch (${officeOptions.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {officeOptions.length > 0 ? (
                postOffice && !isPostOfficeExpanded ? (
                  <TouchableOpacity
                    style={[modalStyles.selectedOfficeCard, { borderColor: '#86efac', backgroundColor: '#f0fdf4' }]}
                    activeOpacity={0.85}
                    onPress={() => setIsPostOfficeExpanded(true)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Ionicons name="checkmark-circle" size={16} color={primaryColor} />
                      <Text style={[modalStyles.selectedOfficeText, { color: primaryColor }]}>
                        {postOffice}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569' }}>
                        ({district})
                      </Text>
                    </View>
                    <View style={modalStyles.changePill}>
                      <Text style={[modalStyles.changePillText, { color: primaryColor }]}>Select</Text>
                      <Ionicons name="chevron-down" size={12} color={primaryColor} />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={modalStyles.expandedOfficeList}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                      {officeOptions.map((office) => {
                        const isSelected = postOffice === office.name;
                        return (
                          <TouchableOpacity
                            key={office.name}
                            style={[
                              modalStyles.expandedOfficeCard,
                              isSelected && { backgroundColor: '#f0fdf4' },
                            ]}
                            onPress={() => {
                              tap();
                              setPostOffice(office.name);
                              setDistrict(office.district);
                              setState(office.state);
                              setIsPostOfficeExpanded(false);
                            }}
                          >
                            <Ionicons
                              name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                              size={14}
                              color={isSelected ? primaryColor : '#94a3b8'}
                            />
                            <Text style={[modalStyles.expandedOfficeText, isSelected && { color: primaryColor, fontFamily: FONT.bold }]}>
                              {office.name} ({office.district})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )
              ) : (
                <View style={{ paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md }}>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.regular, color: '#94a3b8' }}>
                    Auto-fetched when you enter 6-digit PIN code
                  </Text>
                </View>
              )}
            </View>

            {/* Field 5 & 6: District * & State * (Read Only from PIN) */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <Text style={[modalStyles.inputLabel, { fontSize: 11, marginBottom: 0 }]}>District *</Text>
                  <Ionicons name="lock-closed" size={10} color="#94a3b8" />
                </View>
                <TextInput
                  style={[modalStyles.modalInput, { backgroundColor: '#f1f5f9', color: '#475569', fontSize: 12 }]}
                  placeholder="District (from PIN)"
                  placeholderTextColor="#94a3b8"
                  value={district}
                  editable={false}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <Text style={[modalStyles.inputLabel, { fontSize: 11, marginBottom: 0 }]}>State *</Text>
                  <Ionicons name="lock-closed" size={10} color="#94a3b8" />
                </View>
                <TextInput
                  style={[modalStyles.modalInput, { backgroundColor: '#f1f5f9', color: '#475569', fontSize: 12 }]}
                  placeholder="State (from PIN)"
                  placeholderTextColor="#94a3b8"
                  value={state}
                  editable={false}
                />
              </View>
            </View>

            {/* Contact Mobile Number */}
            <View>
              <Text style={modalStyles.inputLabel}>Contact Mobile Number *</Text>
              <TextInput
                style={modalStyles.modalInput}
                placeholder="10-digit delivery mobile *"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
              />
            </View>

            {status ? <Text style={modalStyles.errorText}>{status}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[modalStyles.modalSubmitBtn, { backgroundColor: primaryColor }]}
              onPress={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={modalStyles.modalSubmitText}>
                  💾 {editingAddress ? 'Update & Save Address' : 'Save Delivery Address'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 18,
    width: '100%',
    maxWidth: 460,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 3,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 11,
    paddingVertical: 7,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  tagChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  selectedOfficeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  selectedOfficeText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  changePillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  expandedOfficeList: {
    maxHeight: 130,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  expandedOfficeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  expandedOfficeText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#334155',
    flex: 1,
  },
  errorText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#dc2626',
    marginTop: 2,
  },
  modalSubmitBtn: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
  },
});
