import React, { useState, useMemo } from 'react';
// India States & Districts dataset enabled - Updated Profile & Address Modal
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/store/auth-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { INDIA_STATES_AND_DISTRICTS } from '@/constants/indiaStatesDistricts';

interface SavedAddress {
  id: string;
  tag: string;
  name: string;
  mobile: string;
  houseNo: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
];

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = RoleThemes.FARMER;

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ADDRESSES'>('PROFILE');

  // Profile Form state
  const [name, setName] = useState(user?.name ?? 'Farmer User');
  const [mobile, setMobile] = useState(user?.mobile ?? '9876543210');
  const [email, setEmail] = useState(user?.email ?? 'user@farmsking.com');
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  );
  
  // Photo Modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  // Pincode & Location Auto-fill states (Profile tab)
  const [pincode, setPincode] = useState('151001');
  const [postOffice, setPostOffice] = useState('Bathinda H.O');
  const [postOfficeList, setPostOfficeList] = useState<string[]>(['Bathinda H.O', 'Bathinda City']);
  const [selectedState, setSelectedState] = useState(user?.state ?? 'Punjab');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district ?? 'Bathinda');
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<string | null>('✨ Address Loaded for 151001');
  const [isSaved, setIsSaved] = useState(false);

  // Picker Modal states
  const [isStatePickerOpen, setIsStatePickerOpen] = useState(false);
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);
  const [isPostOfficePickerOpen, setIsPostOfficePickerOpen] = useState(false);
  const [searchStateQuery, setSearchStateQuery] = useState('');
  const [searchDistrictQuery, setSearchDistrictQuery] = useState('');

  // Fetch Location from India Post PIN Code API (Profile)
  const fetchLocationFromPincode = async (codeToFetch?: string) => {
    const target = codeToFetch || pincode;
    if (!target || target.length < 6) {
      setPincodeStatus('⚠️ Please enter a valid 6-digit PIN Code first');
      return;
    }

    setIsPincodeLoading(true);
    setPincodeStatus(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${target}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const poList = data[0].PostOffice;
        const apiState = poList[0].State;
        const apiDistrict = poList[0].District;
        const poNames: string[] = poList.map((po: any) => po.Name);

        // Find matching state in dataset
        const matchedState = INDIA_STATES_AND_DISTRICTS.find(
          (s) => s.state.toLowerCase() === apiState.toLowerCase()
        );
        if (matchedState) {
          setSelectedState(matchedState.state);
          const matchedDist = matchedState.districts.find(
            (d) => d.toLowerCase() === apiDistrict.toLowerCase()
          );
          if (matchedDist) {
            setSelectedDistrict(matchedDist);
          } else {
            setSelectedDistrict(apiDistrict);
          }
        } else {
          setSelectedState(apiState);
          setSelectedDistrict(apiDistrict);
        }

        setPostOfficeList(poNames);
        setPostOffice(poNames[0]);
        setPincodeStatus(`✨ Address Fetched: ${poNames[0]}, ${apiDistrict}, ${apiState}`);
      } else {
        setPincodeStatus('❌ Invalid PIN Code or not found');
      }
    } catch (err) {
      setPincodeStatus('⚠️ Could not fetch PIN details online');
    } finally {
      setIsPincodeLoading(false);
    }
  };

  // Get available districts for currently selected state
  const currentDistricts = useMemo(() => {
    const found = INDIA_STATES_AND_DISTRICTS.find(
      (s) => s.state.toLowerCase() === selectedState.toLowerCase()
    );
    return found ? found.districts : INDIA_STATES_AND_DISTRICTS[0].districts;
  }, [selectedState]);

  // Filtered states for search
  const filteredStates = useMemo(() => {
    if (!searchStateQuery.trim()) return INDIA_STATES_AND_DISTRICTS;
    return INDIA_STATES_AND_DISTRICTS.filter((s) =>
      s.state.toLowerCase().includes(searchStateQuery.toLowerCase())
    );
  }, [searchStateQuery]);

  // Filtered districts for search
  const filteredDistricts = useMemo(() => {
    if (!searchDistrictQuery.trim()) return currentDistricts;
    return currentDistricts.filter((d) =>
      d.toLowerCase().includes(searchDistrictQuery.toLowerCase())
    );
  }, [currentDistricts, searchDistrictQuery]);

  // Address List state
  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      id: '1',
      tag: 'HOME',
      name: user?.name ?? 'Balwinder Singh',
      mobile: user?.mobile ?? '9876543210',
      houseNo: 'House No. 42, St. 3',
      locality: 'Green Park Extension',
      city: 'Bathinda',
      state: 'Punjab',
      pincode: '151001',
      isDefault: true,
    },
    {
      id: '2',
      tag: 'FARM / GARDEN',
      name: user?.name ?? 'Balwinder Singh',
      mobile: user?.mobile ?? '9876543210',
      houseNo: 'Plot A, Canal Road',
      locality: 'Near Bathinda Mandi',
      city: 'Bathinda',
      state: 'Punjab',
      pincode: '151002',
      isDefault: false,
    },
  ]);

  // Add Address Form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTag, setNewTag] = useState<'HOME' | 'FARM / GARDEN' | 'WORK'>('HOME');
  const [addrName, setAddrName] = useState(user?.name ?? 'Balwinder Singh');
  const [addrMobile, setAddrMobile] = useState(user?.mobile ?? '9876543210');
  const [addressText, setAddressText] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Bathinda');
  const [addrState, setAddrState] = useState('Punjab');
  const [addrDistrict, setAddrDistrict] = useState('Bathinda');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrPostOffice, setAddrPostOffice] = useState('Select Branch');
  const [addrPostOfficeList, setAddrPostOfficeList] = useState<string[]>([]);
  const [isAddrPinLoading, setIsAddrPinLoading] = useState(false);
  const [addrPinStatus, setAddrPinStatus] = useState<string | null>(null);
  const [isAddrPostOfficePickerOpen, setIsAddrPostOfficePickerOpen] = useState(false);

  const fetchAddrPincodeLocation = async (codeToFetch?: string) => {
    const target = codeToFetch || addrPincode;
    if (!target || target.length < 6) {
      setAddrPinStatus('⚠️ Please enter a valid 6-digit PIN Code');
      return;
    }
    setIsAddrPinLoading(true);
    setAddrPinStatus(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${target}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const poList = data[0].PostOffice;
        const apiState = poList[0].State;
        const apiDistrict = poList[0].District;
        const poNames: string[] = poList.map((po: any) => po.Name);

        setAddrState(apiState);
        setAddrDistrict(apiDistrict);
        setAddrPostOfficeList(poNames);
        setAddrPostOffice(poNames[0]);
        setLocality(poNames[0]);
        setCity(apiDistrict);
        setAddrPinStatus(`✨ Fetched: ${poNames[0]}, ${apiDistrict}, ${apiState}`);
      } else {
        setAddrPinStatus('❌ Invalid PIN Code');
      }
    } catch (err) {
      setAddrPinStatus('⚠️ Fetch failed online');
    } finally {
      setIsAddrPinLoading(false);
    }
  };

  const handleSelectState = (stateName: string) => {
    tap();
    setSelectedState(stateName);
    const item = INDIA_STATES_AND_DISTRICTS.find((s) => s.state === stateName);
    if (item && item.districts.length > 0) {
      setSelectedDistrict(item.districts[0]);
    }
    setIsStatePickerOpen(false);
    setSearchStateQuery('');
  };

  const handleSelectDistrict = (districtName: string) => {
    tap();
    setSelectedDistrict(districtName);
    setIsDistrictPickerOpen(false);
    setSearchDistrictQuery('');
  };

  const saveProfile = () => {
    tap();
    if (!pincode || pincode.trim().length !== 6) {
      setPincodeStatus('❌ PIN Code compulsory hai! Kripya 6-digit PIN Code bharein.');
      return;
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const addAddress = () => {
    if (!addrPincode || addrPincode.trim().length !== 6) {
      setAddrPinStatus('❌ PIN Code compulsory hai! Kripya 6-digit PIN Code bharein.');
      return;
    }
    if (!addressText.trim()) {
      if (Platform.OS === 'web') alert('Please fill in Address');
      return;
    }
    tap();
    const newAddr: SavedAddress = {
      id: Date.now().toString(),
      tag: newTag,
      name: addrName || name,
      mobile: addrMobile || mobile,
      houseNo: addressText,
      locality: addrPostOffice || locality || 'Main Area',
      city: addrDistrict || city || 'Bathinda',
      state: addrState || selectedState || 'Punjab',
      pincode: addrPincode || '151001',
      isDefault: addresses.length === 0,
    };
    setAddresses([...addresses, newAddr]);
    setAddressText('');
    setLocality('');
    setCity('');
    setAddrPincode('');
    setAddrPinStatus(null);
    setIsAddModalOpen(false);
  };

  const deleteAddress = (id: string) => {
    tap();
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    tap();
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <LinearGradient colors={theme.gradient} style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile & Address</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Tabs Row */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PROFILE' && styles.activeTabBtn]}
          onPress={() => {
            tap();
            setActiveTab('PROFILE');
          }}
        >
          <Ionicons name="person-outline" size={17} color={activeTab === 'PROFILE' ? theme.primary : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'PROFILE' && { color: theme.primary }]}>My Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ADDRESSES' && styles.activeTabBtn]}
          onPress={() => {
            tap();
            setActiveTab('ADDRESSES');
          }}
        >
          <Ionicons name="location-outline" size={17} color={activeTab === 'ADDRESSES' ? theme.primary : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'ADDRESSES' && { color: theme.primary }]}>
            My Addresses ({addresses.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'PROFILE' ? (
          <View style={styles.card}>
            {/* Avatar Section with Save Photo option */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarRingBig}
                activeOpacity={0.85}
                onPress={() => setIsPhotoModalOpen(true)}
              >
                <Image source={{ uri: avatarUrl }} style={styles.avatarBig} />
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color="#ffffff" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsPhotoModalOpen(true)}>
                <Text style={styles.changePhotoText}>📷 Change & Save Profile Photo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={name} onChangeText={setName} />
            </View>

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={mobile} keyboardType="phone-pad" onChangeText={setMobile} />
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} />
            </View>

            {/* PIN Code with Action Button right NEXT to it */}
            <Text style={styles.inputLabel}>PIN Code * <Text style={{ color: '#dc2626', fontSize: 11 }}>(Compulsory)</Text></Text>
            <View style={styles.pincodeRow}>
              <View style={[styles.inputWrap, { flex: 1 }]}>
                <Ionicons name="navigate-outline" size={16} color={theme.primary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit PIN"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={(t) => {
                    setPincode(t);
                    if (t.length === 6) fetchLocationFromPincode(t);
                  }}
                />
              </View>

              <TouchableOpacity
                style={[styles.fetchBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
                onPress={() => fetchLocationFromPincode(pincode)}
                disabled={isPincodeLoading}
              >
                {isPincodeLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="search" size={14} color="#ffffff" />
                    <Text style={styles.fetchBtnText}>Fetch Address</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {pincodeStatus ? (
              <Text style={[styles.pincodeStatusText, pincodeStatus.includes('❌') && { color: '#dc2626' }]}>
                {pincodeStatus}
              </Text>
            ) : null}

            {/* Post Office Selector */}
            <Text style={styles.inputLabel}>Post Office / Locality</Text>
            <TouchableOpacity
              style={styles.pickerSelector}
              activeOpacity={0.8}
              onPress={() => setIsPostOfficePickerOpen(true)}
            >
              <Ionicons name="home-outline" size={16} color={theme.primary} />
              <Text style={styles.pickerText} numberOfLines={1}>
                {postOffice || 'Select Post Office'}
              </Text>
              <Ionicons name="chevron-down" size={15} color="#94a3b8" />
            </TouchableOpacity>

            {/* District & State (Read Only — Auto-filled from PIN Code) */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Read-Only District */}
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>District</Text>
                <View style={styles.readOnlySelector}>
                  <Ionicons name="location-outline" size={16} color="#64748b" />
                  <Text style={styles.readOnlyText} numberOfLines={1}>
                    {selectedDistrict}
                  </Text>
                  <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
                </View>
              </View>

              {/* Read-Only State / Local Mandi */}
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>State / Local Mandi</Text>
                <View style={styles.readOnlySelector}>
                  <Ionicons name="map-outline" size={16} color="#64748b" />
                  <Text style={styles.readOnlyText} numberOfLines={1}>
                    {selectedState}
                  </Text>
                  <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
                </View>
              </View>
            </View>

            {isSaved && (
              <View style={styles.savedNotice}>
                <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                <Text style={styles.savedNoticeText}>Profile Details Saved Successfully!</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <TouchableOpacity style={styles.addAddressCTA} activeOpacity={0.8} onPress={() => setIsAddModalOpen(true)}>
              <Ionicons name="add-circle" size={22} color={theme.primary} />
              <Text style={[styles.addAddressText, { color: theme.primary }]}>+ Add New Address</Text>
            </TouchableOpacity>

            {addresses.map((addr) => (
              <View key={addr.id} style={[styles.addressCard, premiumShadow('#0f172a', 'sm')]}>
                <View style={styles.addrHeaderRow}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{addr.tag}</Text>
                  </View>
                  {addr.isDefault ? (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultPillText}>DEFAULT</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setDefaultAddress(addr.id)}>
                      <Text style={{ fontSize: 11.5, color: theme.primary, fontFamily: FONT.bold }}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.addrName}>{addr.name}</Text>
                <Text style={styles.addrText}>
                  {addr.houseNo}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}
                </Text>
                <Text style={styles.addrMobile}>Phone: +91 {addr.mobile}</Text>

                <View style={styles.addrActions}>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteAddress(addr.id)}>
                    <Ionicons name="trash-outline" size={15} color="#dc2626" />
                    <Text style={styles.deleteBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Change & Save Photo Modal */}
      {isPhotoModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Profile Photo</Text>
              <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Choose Avatar Preset</Text>
            <View style={styles.presetGrid}>
              {AVATAR_PRESETS.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.presetItem, avatarUrl === url && { borderColor: theme.primary, borderWidth: 3 }]}
                  onPress={() => {
                    tap();
                    setAvatarUrl(url);
                  }}
                >
                  <Image source={{ uri: url }} style={styles.presetImg} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Or Enter Image URL</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://example.com/my-photo.jpg"
              value={customPhotoInput}
              onChangeText={setCustomPhotoInput}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                tap();
                if (customPhotoInput.trim()) {
                  setAvatarUrl(customPhotoInput.trim());
                }
                setIsPhotoModalOpen(false);
              }}
            >
              <Text style={styles.modalSubmitText}>Save Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Post Office Selection Modal (Profile) */}
      <Modal visible={isPostOfficePickerOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Post Office ({postOfficeList.length})</Text>
              <TouchableOpacity onPress={() => setIsPostOfficePickerOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {postOfficeList.map((poName) => {
                const isSelected = poName === postOffice;
                return (
                  <TouchableOpacity
                    key={poName}
                    style={[styles.pickerOptionRow, isSelected && styles.pickerOptionSelected]}
                    onPress={() => {
                      tap();
                      setPostOffice(poName);
                      setIsPostOfficePickerOpen(false);
                    }}
                  >
                    <Ionicons
                      name="business"
                      size={18}
                      color={isSelected ? theme.primary : '#94a3b8'}
                    />
                    <Text style={[styles.pickerOptionText, isSelected && { color: theme.primary, fontFamily: FONT.bold }]}>
                      {poName}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Post Office Branch Selection Modal (Add Address Modal) */}
      <Modal visible={isAddrPostOfficePickerOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Post Office Branch ({addrPostOfficeList.length})</Text>
              <TouchableOpacity onPress={() => setIsAddrPostOfficePickerOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {addrPostOfficeList.length > 0 ? (
                addrPostOfficeList.map((poName) => {
                  const isSelected = poName === addrPostOffice;
                  return (
                    <TouchableOpacity
                      key={poName}
                      style={[styles.pickerOptionRow, isSelected && styles.pickerOptionSelected]}
                      onPress={() => {
                        tap();
                        setAddrPostOffice(poName);
                        setLocality(poName);
                        setIsAddrPostOfficePickerOpen(false);
                      }}
                    >
                      <Ionicons
                        name="business"
                        size={18}
                        color={isSelected ? theme.primary : '#94a3b8'}
                      />
                      <Text style={[styles.pickerOptionText, isSelected && { color: theme.primary, fontFamily: FONT.bold }]}>
                        {poName}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ padding: 16, color: '#64748b', textAlign: 'center', fontFamily: FONT.medium }}>
                  Please enter 6-digit PIN Code and click Fetch Address first.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* State Selection Modal */}
      <Modal visible={isStatePickerOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State / UT ({INDIA_STATES_AND_DISTRICTS.length})</Text>
              <TouchableOpacity onPress={() => setIsStatePickerOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search State..."
                placeholderTextColor="#94a3b8"
                value={searchStateQuery}
                onChangeText={setSearchStateQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {filteredStates.map((item) => {
                const isSelected = item.state === selectedState;
                return (
                  <TouchableOpacity
                    key={item.state}
                    style={[styles.pickerOptionRow, isSelected && styles.pickerOptionSelected]}
                    onPress={() => handleSelectState(item.state)}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color={isSelected ? theme.primary : '#94a3b8'}
                    />
                    <Text style={[styles.pickerOptionText, isSelected && { color: theme.primary, fontFamily: FONT.bold }]}>
                      {item.state}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* District Selection Modal */}
      <Modal visible={isDistrictPickerOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select District in {selectedState} ({currentDistricts.length})
              </Text>
              <TouchableOpacity onPress={() => setIsDistrictPickerOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search District in ${selectedState}...`}
                placeholderTextColor="#94a3b8"
                value={searchDistrictQuery}
                onChangeText={setSearchDistrictQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {filteredDistricts.map((dist) => {
                const isSelected = dist === selectedDistrict;
                return (
                  <TouchableOpacity
                    key={dist}
                    style={[styles.pickerOptionRow, isSelected && styles.pickerOptionSelected]}
                    onPress={() => handleSelectDistrict(dist)}
                  >
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={isSelected ? theme.primary : '#94a3b8'}
                    />
                    <Text style={[styles.pickerOptionText, isSelected && { color: theme.primary, fontFamily: FONT.bold }]}>
                      {dist}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Address Form Modal */}
      {isAddModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Delivery Address</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Address Tag</Text>
              <View style={styles.tagSelectorRow}>
                {(['HOME', 'FARM / GARDEN', 'WORK'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagItem, newTag === t && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setNewTag(t)}
                  >
                    <Text style={[styles.tagItemText, newTag === t && { color: '#ffffff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Separate Name & Mobile fields */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Recipient Name"
                    value={addrName}
                    onChangeText={setAddrName}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="10-digit mobile"
                    keyboardType="phone-pad"
                    value={addrMobile}
                    onChangeText={setAddrMobile}
                  />
                </View>
              </View>

              {/* PIN Code with Action Button right NEXT to it */}
              <Text style={styles.inputLabel}>PIN Code</Text>
              <View style={styles.pincodeRow}>
                <View style={[styles.modalInputWrap, { flex: 1 }]}>
                  <Ionicons name="navigate-outline" size={16} color={theme.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit PIN"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    maxLength={6}
                    value={addrPincode}
                    onChangeText={(t) => {
                      setAddrPincode(t);
                      if (t.length === 6) fetchAddrPincodeLocation(t);
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.fetchBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                  onPress={() => fetchAddrPincodeLocation(addrPincode)}
                  disabled={isAddrPinLoading}
                >
                  {isAddrPinLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="search" size={14} color="#ffffff" />
                      <Text style={styles.fetchBtnText}>Fetch Address</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {addrPinStatus ? (
                <Text style={[styles.pincodeStatusText, addrPinStatus.includes('❌') && { color: '#dc2626' }]}>
                  {addrPinStatus}
                </Text>
              ) : null}

              {/* Post Office Branch List Selector */}
              <Text style={styles.inputLabel}>Post Office Branch</Text>
              <TouchableOpacity
                style={styles.pickerSelector}
                activeOpacity={0.8}
                onPress={() => setIsAddrPostOfficePickerOpen(true)}
              >
                <Ionicons name="home-outline" size={16} color={theme.primary} />
                <Text style={styles.pickerText} numberOfLines={1}>
                  {addrPostOffice || 'Select Branch'}
                </Text>
                <Ionicons name="chevron-down" size={15} color="#94a3b8" />
              </TouchableOpacity>

              {/* Renamed House No. / Flat / Farm Plot -> Address */}
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="House No, Street / Farm Plot address"
                value={addressText}
                onChangeText={setAddressText}
              />

              {/* District & State (Read Only — Auto-filled from PIN Code) */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Read-Only District */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>District</Text>
                  <View style={styles.readOnlySelector}>
                    <Ionicons name="location-outline" size={16} color="#64748b" />
                    <Text style={styles.readOnlyText} numberOfLines={1}>
                      {addrDistrict}
                    </Text>
                    <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
                  </View>
                </View>

                {/* Read-Only State / Local Mandi */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>State / Local Mandi</Text>
                  <View style={styles.readOnlySelector}>
                    <Ionicons name="map-outline" size={16} color="#64748b" />
                    <Text style={styles.readOnlyText} numberOfLines={1}>
                      {addrState}
                    </Text>
                    <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={addAddress}>
                <Text style={styles.modalSubmitText}>Save Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    paddingTop: Platform.OS === 'web' ? 18 : 44,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 17, fontFamily: FONT.extraBold },
  tabContainer: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  activeTabBtn: { borderBottomColor: '#16a34a' },
  tabText: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b' },
  scrollContent: { padding: SPACING.md, paddingBottom: 32, alignItems: 'center' },
  card: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, ...premiumShadow('#0f172a', 'sm') },
  avatarSection: { alignItems: 'center', marginBottom: 14 },
  avatarRingBig: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#16a34a', padding: 2, position: 'relative', marginBottom: 6 },
  avatarBig: { width: 60, height: 60, borderRadius: 30 },
  cameraBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#16a34a', position: 'absolute', bottom: 0, right: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#ffffff' },
  changePhotoText: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a' },
  pincodeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  fetchBtn: { height: 42, paddingHorizontal: 12, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  fetchBtnText: { color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold },
  pincodeStatusText: { fontSize: 11, fontFamily: FONT.bold, color: '#15803d', marginTop: 5 },
  inputLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#334155', marginTop: 10, marginBottom: 4 },
  inputWrap: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, backgroundColor: '#ffffff', paddingHorizontal: 10 },
  modalInputWrap: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, backgroundColor: '#f8fafc', paddingHorizontal: 10 },
  input: { flex: 1, paddingVertical: 6, fontSize: 13.5, fontFamily: FONT.medium, color: '#0f172a' },
  pickerSelector: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
  },
  pickerText: { flex: 1, fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  readOnlySelector: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
  },
  readOnlyText: { flex: 1, fontSize: 13, fontFamily: FONT.bold, color: '#475569' },
  saveBtn: { marginTop: 18, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 14.5, fontFamily: FONT.bold },
  savedNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', padding: 8, borderRadius: RADIUS.md, marginTop: 10 },
  savedNoticeText: { color: '#16a34a', fontSize: 12, fontFamily: FONT.bold },
  addAddressCTA: { width: '100%', maxWidth: 460, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, paddingVertical: 12, borderWidth: 1.5, borderColor: '#dcfce7', ...premiumShadow('#0f172a', 'sm') },
  addAddressText: { fontSize: 14, fontFamily: FONT.bold },
  addressCard: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md },
  addrHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tagBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.xs },
  tagText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#475569' },
  defaultPill: { backgroundColor: '#dcfce7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.xs },
  defaultPillText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#15803d' },
  addrName: { fontSize: 14.5, fontFamily: FONT.bold, color: '#0f172a' },
  addrText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#475569', marginTop: 3, lineHeight: 17 },
  addrMobile: { fontSize: 12, fontFamily: FONT.semiBold, color: '#64748b', marginTop: 5 },
  addrActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtnText: { color: '#dc2626', fontSize: 11.5, fontFamily: FONT.bold },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 999 },
  modalContent: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.xl },
  pickerModalContent: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.xl, ...premiumShadow('#0f172a', 'lg') },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, backgroundColor: '#f8fafc', paddingHorizontal: 10, marginBottom: 10 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 13.5, color: '#0f172a', fontFamily: FONT.medium },
  pickerOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: RADIUS.md, marginBottom: 4 },
  pickerOptionSelected: { backgroundColor: '#f0fdf4' },
  pickerOptionText: { flex: 1, fontSize: 13.5, fontFamily: FONT.medium, color: '#334155' },
  tagSelectorRow: { flexDirection: 'row', gap: 8 },
  tagItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  tagItemText: { fontSize: 11, fontFamily: FONT.bold, color: '#64748b' },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13.5, color: '#0f172a', backgroundColor: '#f8fafc' },
  modalSubmitBtn: { marginTop: 16, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  modalSubmitText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14.5 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 10 },
  presetItem: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  presetImg: { width: '100%', height: '100%' },
});
