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
import { CustomerAddress } from '@/src/api/addresses.api';
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
  const [locality, setLocality] = useState('');
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
      setFullName(user?.name || '');
      setLine(editingAddress.line);
      setMobile(editingAddress.mobile || getCleanMobile(user?.mobile));
      setPincode(editingAddress.pincode);
      setPostOffice(editingAddress.postOffice);
      setDistrict(editingAddress.district);
      setState(editingAddress.state);
    } else {
      reset();
    }
  }, [editingAddress, visible]);

  const reset = () => {
    setTag('HOME');
    setFullName(user?.name ?? '');
    setLine('');
    setLocality('');
    setMobile(getCleanMobile(user?.mobile));
    setPincode('');
    setPostOffice('');
    setDistrict('');
    setState('');
    setOfficeOptions([]);
    setStatus(null);
  };

  const fetchAddress = async (code: string) => {
    setIsLoading(true);
    setStatus(null);
    try {
      const result = await lookupPincode(code);
      setOfficeOptions(result.offices);
      setPostOffice(result.postOffice);
      setDistrict(result.district);
      setState(result.state);
      setIsPostOfficeExpanded(true);
    } catch (err: any) {
      setStatus(`❌ ${err?.message ?? 'Could not fetch PIN details'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!line.trim()) {
      setStatus('❌ Enter the address line (house/street/farm plot).');
      return;
    }
    if (!postOffice || !district || !state) {
      setStatus('❌ Fetch the address from the PIN code first.');
      return;
    }
    tap();
    try {
      const addressText = locality.trim() ? `${line.trim()}, ${locality.trim()}` : line.trim();
      const fullAddressLine = fullName.trim() ? `${fullName.trim()} - ${addressText}` : addressText;

      let saved: CustomerAddress;
      if (editingAddress) {
        saved = await updateAddress.mutateAsync({
          id: editingAddress.id,
          payload: { tag, line: fullAddressLine, mobile: mobile.trim() || undefined, postOffice, district, state, pincode },
        });
      } else {
        saved = await createAddress.mutateAsync({ tag, line: fullAddressLine, mobile: mobile.trim() || undefined, postOffice, district, state, pincode });
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>{editingAddress ? 'Edit Registered Address' : 'Add Delivery Address'}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {(['HOME', 'FARM', 'WORK'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[modalStyles.tagChip, tag === t && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                  onPress={() => setTag(t)}
                >
                  <Text style={[modalStyles.tagChipText, tag === t && { color: '#ffffff' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={modalStyles.inputLabel}>Full Name / Contact Person</Text>
            <TextInput
              style={modalStyles.modalInput}
              placeholder="Recipient full name *"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[modalStyles.inputLabel, { marginTop: 10 }]}>Address Line *</Text>
            <TextInput
              style={modalStyles.modalInput}
              placeholder="House no, street / farm plot"
              placeholderTextColor="#94a3b8"
              value={line}
              onChangeText={setLine}
            />

            <Text style={[modalStyles.inputLabel, { marginTop: 10 }]}>Locality / Area / Landmark (Optional)</Text>
            <TextInput
              style={modalStyles.modalInput}
              placeholder="e.g. Near Water Tank / Main Road"
              placeholderTextColor="#94a3b8"
              value={locality}
              onChangeText={setLocality}
            />

            <Text style={[modalStyles.inputLabel, { marginTop: 10 }]}>Delivery Mobile Number</Text>
            <TextInput
              style={modalStyles.modalInput}
              placeholder="10-digit mobile number for delivery *"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
            />

            <Text style={[modalStyles.inputLabel, { marginTop: 10 }]}>PIN Code</Text>
            <View style={modalStyles.pincodeRow}>
              <View style={[modalStyles.inputWrap, { flex: 1, backgroundColor: '#f8fafc' }]}>
                <TextInput
                  style={modalStyles.input}
                  placeholder="6-digit PIN"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={(t) => { setPincode(t); if (t.length === 6) fetchAddress(t); }}
                />
              </View>
              <TouchableOpacity
                style={[modalStyles.fetchBtn, { backgroundColor: primaryColor }]}
                activeOpacity={0.8}
                disabled={isLoading || pincode.length !== 6}
                onPress={() => fetchAddress(pincode)}
              >
                {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={modalStyles.fetchBtnText}>Fetch</Text>}
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.inputLabel}>Post Office / Locality</Text>
            {officeOptions.length > 0 ? (
              postOffice && !isPostOfficeExpanded ? (
                <TouchableOpacity
                  style={[modalStyles.selectedOfficeCard, { borderColor: primaryColor, backgroundColor: '#f0fdf4' }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    tap();
                    setIsPostOfficeExpanded(true);
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color={primaryColor} />
                  <Text style={[modalStyles.selectedOfficeText, { color: primaryColor }]} numberOfLines={1}>
                    {postOffice} ({district})
                  </Text>
                  <View style={[modalStyles.changePill, { borderColor: primaryColor }]}>
                    <Text style={[modalStyles.changePillText, { color: primaryColor }]}>Change</Text>
                    <Ionicons name="chevron-down" size={12} color={primaryColor} />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={modalStyles.expandedOfficeList}>
                  {officeOptions.map((office) => {
                    const isSelected = postOffice === office.name;
                    return (
                      <TouchableOpacity
                        key={office.name}
                        style={[
                          modalStyles.expandedOfficeCard,
                          isSelected && { backgroundColor: '#f0fdf4', borderColor: primaryColor },
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
                          size={16}
                          color={isSelected ? primaryColor : '#94a3b8'}
                        />
                        <Text style={[modalStyles.expandedOfficeText, isSelected && { color: primaryColor, fontFamily: FONT.bold }]}>
                          {office.name} ({office.district})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            ) : (
              <TextInput style={modalStyles.modalInput} value={postOffice} onChangeText={setPostOffice} placeholder="Auto-filled from PIN" placeholderTextColor="#94a3b8" />
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.inputLabel}>District</Text>
                <View style={modalStyles.readOnlySelector}>
                  <Ionicons name="location-outline" size={16} color="#64748b" />
                  <Text style={modalStyles.readOnlyText} numberOfLines={1}>{district || '—'}</Text>
                  <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.inputLabel}>State</Text>
                <View style={modalStyles.readOnlySelector}>
                  <Text style={modalStyles.readOnlyText} numberOfLines={1}>{state || '—'}</Text>
                  <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
                </View>
              </View>
            </View>

            {status ? <Text style={modalStyles.errorText}>{status}</Text> : null}

            <TouchableOpacity style={[modalStyles.modalSubmitBtn, { backgroundColor: primaryColor }]} onPress={handleSave} disabled={isPending}>
              {isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={modalStyles.modalSubmitText}>{editingAddress ? 'Save Changes' : 'Save Delivery Address'}</Text>
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
    padding: 20,
    width: '100%',
    maxWidth: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
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
  pincodeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  fetchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  selectedOfficeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedOfficeText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  changePillText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  expandedOfficeList: {
    maxHeight: 140,
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  expandedOfficeText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  readOnlySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  errorText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#dc2626',
    marginTop: 8,
  },
  modalSubmitBtn: {
    marginTop: 14,
    paddingVertical: 12,
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
