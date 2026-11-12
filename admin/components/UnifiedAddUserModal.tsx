import React, { useEffect, useState } from 'react';
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
import { FONT, RADIUS } from '@/constants/theme';
import {
  AdminCreateCategory,
  AdminCreateExistingUserSummary,
  AdminCreateRoleKey,
  AdminCreateUserPayload,
  lookupByKingId,
  sendAdminCreateUserOtp,
  verifyAdminCreateUserOtp,
} from '@/src/api/users.api';
import { lookupPincode } from '@/src/api/pincode.api';
import { useAdminCreateUser } from '@/src/hooks/useUsersAdmin';
import { useExecutiveTheme } from '@/src/store/theme-context';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface CategoryOption {
  id: AdminCreateCategory;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'STAFF',
    title: '1. Staff',
    subtitle: 'Admin Panel, Manager, Operator, Trainer & CA accounts',
    icon: 'shield-checkmark',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.14)',
  },
  {
    id: 'PARTNERS',
    title: '2. Partners',
    subtitle: 'Sales Managers, Sellers, Crop Doctors, Garden Advisors & Traders',
    icon: 'briefcase',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.14)',
  },
  {
    id: 'CLIENTS',
    title: '3. Clients',
    subtitle: 'Farmers, Gardeners, Customers & Farm Supervisors',
    icon: 'people',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.14)',
  },
];

interface RoleOption {
  value: AdminCreateRoleKey;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  superAdminOnly?: boolean;
}

const ROLES_BY_CATEGORY: Record<AdminCreateCategory, RoleOption[]> = {
  STAFF: [
    { value: 'ADMIN', label: 'Admin', desc: 'Full Admin Console access', icon: 'shield-half-outline', superAdminOnly: true },
    { value: 'MANAGER', label: 'Manager', desc: 'Regional platform manager', icon: 'briefcase-outline', superAdminOnly: true },
    { value: 'OPERATOR', label: 'Operator', desc: 'Orders, printing & read-only console', icon: 'print-outline' },
    { value: 'TECHNICAL_TRAINER', label: 'Technical Staff', desc: 'Field training & state onboarding', icon: 'school-outline' },
    { value: 'ACCOUNTANT', label: 'Accountant (CA)', desc: 'GST, TDS, payouts & audit desk', icon: 'calculator-outline' },
  ],
  PARTNERS: [
    { value: 'AGENT', label: 'Sales Manager', desc: 'Coupons, referrals & sales commission', icon: 'briefcase-outline' },
    { value: 'SELLER', label: 'Seller', desc: 'Verified marketplace store & inventory', icon: 'storefront-outline' },
    { value: 'FARM_ADVISOR', label: 'Crop Doctor', desc: 'Field agronomy & prescription desk', icon: 'medical-outline' },
    { value: 'GARDEN_ADVISOR', label: 'Garden Advisor', desc: 'Kitchen garden & terrace care expert', icon: 'sunny-outline' },
    { value: 'TRADER', label: 'Trader & Buyer', desc: 'Bulk mandi trade & buyer contracts', icon: 'swap-horizontal-outline' },
  ],
  CLIENTS: [
    { value: 'FARMER', label: 'Farmer', desc: 'Farms, AI crop doctor & free plan', icon: 'leaf-outline' },
    { value: 'GARDENER', label: 'Gardener', desc: 'Home garden plots & plant care', icon: 'flower-outline' },
    { value: 'CUSTOMER', label: 'Customer', desc: 'Marketplace buyer account', icon: 'cart-outline' },
    { value: 'SUPERVISOR', label: 'Supervisor', desc: 'Farm supervisor linked to a Farmer', icon: 'shield-checkmark-outline' },
  ],
};

const SOIL_TYPES = ['ALLUVIAL', 'BLACK', 'RED', 'SANDY', 'CLAY', 'LOAMY', 'OTHER'] as const;
const WATER_TYPES = ['CANAL', 'BOREWELL', 'RAINWATER', 'RIVER', 'MIXED'] as const;
const SELLER_TYPES = ['COMMERCIAL', 'FARMER'] as const;

export function UnifiedAddUserModal({
  visible,
  isSuperAdmin,
  onClose,
}: {
  visible: boolean;
  isSuperAdmin: boolean;
  onClose: () => void;
}) {
  const { isLight } = useExecutiveTheme();
  const createUserMutation = useAdminCreateUser();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<AdminCreateCategory | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminCreateRoleKey | null>(null);

  // Step 2: Mandatory Mobile OTP state
  const [mobile, setMobile] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInfoMsg, setOtpInfoMsg] = useState<string | null>(null);
  const [otpVerificationToken, setOtpVerificationToken] = useState<string | null>(null);
  const [existingUserSummary, setExistingUserSummary] = useState<AdminCreateExistingUserSummary | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Step 3: Profile fields (common + role-specific)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pincode, setPincode] = useState('');
  const [postOffice, setPostOffice] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [address, setAddress] = useState('');
  const [isPinLoading, setIsPinLoading] = useState(false);

  // Farmer fields
  const [farmName, setFarmName] = useState('');
  const [sprayTankSizeL, setSprayTankSizeL] = useState<number>(20);
  const [soilType, setSoilType] = useState<string>('');
  const [waterType, setWaterType] = useState<string>('');

  // Advisor fields
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [bio, setBio] = useState('');

  // Seller / Agent / Trader fields
  const [storeName, setStoreName] = useState('');
  const [sellerType, setSellerType] = useState<string>('COMMERCIAL');
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [alternativeMobile, setAlternativeMobile] = useState('');
  const [bankAccountHolderName, setBankAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Supervisor field
  const [employerFarmerQuery, setEmployerFarmerQuery] = useState('');
  const [employerFound, setEmployerFound] = useState<{ name: string; kingId: string | null; mobile: string } | null>(null);
  const [isEmployerSearching, setIsEmployerSearching] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    name: string;
    kingId: string | null;
    mobile: string;
    role: string;
    tempPassword: string | null;
  } | null>(null);

  const resetAll = () => {
    setStep(1);
    setCategory(null);
    setSelectedRole(null);
    setMobile('');
    setOtpInput('');
    setOtpSent(false);
    setOtpInfoMsg(null);
    setOtpVerificationToken(null);
    setExistingUserSummary(null);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
    setName('');
    setEmail('');
    setPassword('');
    setPincode('');
    setPostOffice('');
    setVillage('');
    setDistrict('');
    setStateName('');
    setAddress('');
    setIsPinLoading(false);
    setFarmName('');
    setSprayTankSizeL(20);
    setSoilType('');
    setWaterType('');
    setSpecialization('');
    setQualification('');
    setYearsExperience('');
    setConsultationFee('');
    setBio('');
    setStoreName('');
    setSellerType('COMMERCIAL');
    setGstin('');
    setPanNumber('');
    setUpiId('');
    setAlternativeMobile('');
    setBankAccountHolderName('');
    setBankAccountNumber('');
    setBankIfsc('');
    setEmployerFarmerQuery('');
    setEmployerFound(null);
    setIsEmployerSearching(false);
    setError(null);
    setCreatedResult(null);
  };

  useEffect(() => {
    if (!visible) {
      resetAll();
    }
  }, [visible]);

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleSelectCategory = (cat: AdminCreateCategory) => {
    tap();
    setCategory(cat);
    const available = ROLES_BY_CATEGORY[cat].filter((r) => !r.superAdminOnly || isSuperAdmin);
    setSelectedRole(available[0]?.value ?? null);
    setError(null);
    setStep(2);
  };

  const applyExistingPrefill = (eu: AdminCreateExistingUserSummary | null | undefined) => {
    setExistingUserSummary(eu ?? null);
    if (!eu) return;
    if (eu.name) setName(eu.name);
    if (eu.email) setEmail(eu.email);
    if (eu.pincode) setPincode(eu.pincode);
    if (eu.postOffice) setPostOffice(eu.postOffice);
    if (eu.village) setVillage(eu.village);
    if (eu.district) setDistrict(eu.district);
    if (eu.state) setStateName(eu.state);
    if (eu.farmName) setFarmName(eu.farmName);
  };

  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(-10);
    setMobile(cleaned);
    if (otpVerificationToken || otpSent) {
      setOtpVerificationToken(null);
      setExistingUserSummary(null);
      setOtpSent(false);
      setOtpInput('');
      setOtpInfoMsg(null);
    }
    setError(null);
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError(null);
    setIsSendingOtp(true);
    try {
      const res = await sendAdminCreateUserOtp(mobile, category ?? undefined);
      setOtpSent(true);
      setOtpVerificationToken(null);
      applyExistingPrefill(res.existingUser);
      setOtpInfoMsg(res.devOtp ? `${res.message} (Test OTP: ${res.devOtp})` : res.message);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Could not send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.trim().length < 4) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setError(null);
    setIsVerifyingOtp(true);
    try {
      const res = await verifyAdminCreateUserOtp(mobile, otpInput.trim(), category ?? undefined);
      setOtpVerificationToken(res.otpVerificationToken);
      applyExistingPrefill(res.existingUser);
      setOtpInfoMsg(res.message);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid OTP code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePincodeChange = async (code: string) => {
    const digits = code.replace(/\D/g, '').slice(0, 6);
    setPincode(digits);
    if (digits.length === 6) {
      setIsPinLoading(true);
      try {
        const res = await lookupPincode(digits);
        setPostOffice(res.postOffice);
        if (!village) setVillage(res.postOffice);
        setDistrict(res.district);
        setStateName(res.state);
      } catch {
        // Admin can still type manually if PIN service unreachable
      } finally {
        setIsPinLoading(false);
      }
    }
  };

  const handleLookupEmployerFarmer = async () => {
    if (!employerFarmerQuery.trim()) return;
    setIsEmployerSearching(true);
    setError(null);
    setEmployerFound(null);
    try {
      const found = await lookupByKingId(employerFarmerQuery.trim());
      setEmployerFound({ name: found.name, kingId: found.kingId, mobile: found.mobile });
    } catch {
      setError('Employer Farmer not found by that King ID or Mobile Number.');
    } finally {
      setIsEmployerSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!category || !selectedRole) {
      setError('Please select a category and role.');
      return;
    }
    if (!otpVerificationToken) {
      setError('Please verify the user mobile number with OTP first.');
      setStep(2);
      return;
    }
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (selectedRole === 'SELLER' && !storeName.trim()) {
      setError('Store name is required for Seller accounts.');
      return;
    }
    if (selectedRole === 'SUPERVISOR' && !employerFarmerQuery.trim()) {
      setError('Employer Farmer King ID or Mobile Number is required for Supervisor.');
      return;
    }

    setError(null);
    const payload: AdminCreateUserPayload = {
      otpVerificationToken,
      category,
      role: selectedRole,
      mobile,
      name: name.trim(),
      ...(email.trim() ? { email: email.trim().toLowerCase() } : {}),
      ...(password.trim() ? { password: password.trim() } : {}),
      ...(pincode.trim() ? { pincode: pincode.trim() } : {}),
      ...(postOffice.trim() ? { postOffice: postOffice.trim() } : {}),
      ...(village.trim() ? { village: village.trim() } : {}),
      ...(district.trim() ? { district: district.trim() } : {}),
      ...(stateName.trim() ? { state: stateName.trim() } : {}),
      ...(address.trim() ? { address: address.trim() } : {}),
      ...(selectedRole === 'FARMER'
        ? {
            ...(farmName.trim() ? { farmName: farmName.trim() } : {}),
            sprayTankSizeL,
            ...(soilType ? { soilType } : {}),
            ...(waterType ? { waterType } : {}),
          }
        : {}),
      ...(selectedRole === 'FARM_ADVISOR' || selectedRole === 'GARDEN_ADVISOR'
        ? {
            ...(specialization.trim() ? { specialization: specialization.trim() } : {}),
            ...(qualification.trim() ? { qualification: qualification.trim() } : {}),
            ...(yearsExperience.trim() ? { yearsExperience: Number(yearsExperience) || 0 } : {}),
            ...(consultationFee.trim() ? { doctorConsultationFee: Number(consultationFee) || 0 } : {}),
            ...(bio.trim() ? { bio: bio.trim() } : {}),
          }
        : {}),
      ...(category === 'PARTNERS'
        ? {
            ...(panNumber.trim() ? { panNumber: panNumber.trim().toUpperCase() } : {}),
            ...(upiId.trim() ? { upiId: upiId.trim() } : {}),
            ...(alternativeMobile.trim() ? { alternativeMobile: alternativeMobile.trim() } : {}),
            ...(bankAccountHolderName.trim() ? { bankAccountHolderName: bankAccountHolderName.trim() } : {}),
            ...(bankAccountNumber.trim() ? { bankAccountNumber: bankAccountNumber.trim() } : {}),
            ...(bankIfsc.trim() ? { bankIfsc: bankIfsc.trim().toUpperCase() } : {}),
          }
        : {}),
      ...(selectedRole === 'SELLER'
        ? {
            storeName: storeName.trim(),
            sellerType,
            ...(gstin.trim() ? { gstin: gstin.trim().toUpperCase() } : {}),
          }
        : {}),
      ...(selectedRole === 'SUPERVISOR'
        ? {
            employerFarmerKingIdOrMobile: employerFound?.kingId || employerFarmerQuery.trim(),
          }
        : {}),
    };

    try {
      const res = await createUserMutation.mutateAsync(payload);
      setCreatedResult({
        name: res.user.name,
        kingId: res.user.kingId,
        mobile: res.user.mobile,
        role: selectedRole.replace(/_/g, ' '),
        tempPassword: res.tempPassword,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Could not create user account.');
    }
  };

  const copyText = (val: string, label: string) => {
    tap();
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      alert(`Copied ${label}: ${val}`);
    }
  };

  const currentRoles = category ? ROLES_BY_CATEGORY[category].filter((r) => !r.superAdminOnly || isSuperAdmin) : [];
  const selectedRoleMeta = currentRoles.find((r) => r.value === selectedRole);

  const cardBg = isLight ? '#ffffff' : '#061a10';
  const subSurface = isLight ? '#f8fafc' : '#020d06';
  const borderCol = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const titleCol = isLight ? '#0f172a' : '#f8fafc';
  const mutedCol = isLight ? '#64748b' : '#94a3b8';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: cardBg, borderColor: borderCol }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.headerIconBadge}>
                <Ionicons name="person-add" size={18} color="#00ff87" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: titleCol }]}>Add New User</Text>
                <Text style={[styles.headerSub, { color: mutedCol }]}>
                  3-Step Onboarding • Category, Role, Mobile OTP & Profile
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={26} color={mutedCol} />
            </TouchableOpacity>
          </View>

          {/* Stepper Pill Bar */}
          {!createdResult && (
            <View style={[styles.stepperRow, { backgroundColor: subSurface, borderColor: borderCol }]}>
              {[
                { num: 1 as const, label: '1. Category' },
                { num: 2 as const, label: '2. Role & OTP' },
                { num: 3 as const, label: '3. Profile Data' },
              ].map((s) => {
                const isActive = step === s.num;
                const isDone = step > s.num;
                return (
                  <TouchableOpacity
                    key={s.num}
                    disabled={s.num === 3 && (!selectedRole || !otpVerificationToken)}
                    onPress={() => {
                      if (s.num === 1) setStep(1);
                      else if (s.num === 2 && category) setStep(2);
                      else if (s.num === 3 && category && selectedRole && otpVerificationToken) setStep(3);
                    }}
                    style={[
                      styles.stepChip,
                      isActive && styles.stepChipActive,
                      isDone && styles.stepChipDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepChipText,
                        { color: isActive ? '#020d06' : isDone ? '#00ff87' : mutedCol },
                      ]}
                      numberOfLines={1}
                    >
                      {isDone ? `✓ ${s.label}` : s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <ScrollView style={{ maxHeight: 540 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {createdResult ? (
              <View style={{ gap: 12, paddingVertical: 8 }}>
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={26} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.successTitle}>User Account Created & Verified</Text>
                    <Text style={styles.successSub}>
                      {createdResult.name} ({createdResult.role}) is now active in the Directory.
                    </Text>
                  </View>
                </View>

                <View style={[styles.resultCard, { backgroundColor: subSurface, borderColor: borderCol }]}>
                  <Text style={[styles.resultRow, { color: titleCol }]}>
                    Mobile: <Text style={{ fontFamily: FONT.bold }}>{createdResult.mobile}</Text> (OTP Verified)
                  </Text>
                  {createdResult.kingId ? (
                    <TouchableOpacity
                      style={styles.copyRowBtn}
                      onPress={() => copyText(createdResult.kingId!, 'King ID')}
                    >
                      <Text style={{ color: '#00ff87', fontFamily: FONT.bold, fontSize: 13 }}>
                        King ID: {createdResult.kingId}
                      </Text>
                      <Ionicons name="copy-outline" size={14} color="#00ff87" />
                    </TouchableOpacity>
                  ) : null}
                  {createdResult.tempPassword ? (
                    <TouchableOpacity
                      style={styles.copyRowBtn}
                      onPress={() => copyText(createdResult.tempPassword!, 'Temporary Password')}
                    >
                      <Text style={{ color: '#fbbf24', fontFamily: FONT.bold, fontSize: 13 }}>
                        Temporary Password: {createdResult.tempPassword}
                      </Text>
                      <Ionicons name="copy-outline" size={14} color="#fbbf24" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { flex: 1, borderColor: borderCol }]}
                    onPress={resetAll}
                  >
                    <Text style={[styles.secondaryBtnText, { color: titleCol }]}>Add Another User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleClose}>
                    <Text style={styles.primaryBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : step === 1 ? (
              /* STEP 1: Select 1 of 3 Categories */
              <View style={{ gap: 10 }}>
                <Text style={[styles.sectionPrompt, { color: mutedCol }]}>
                  Choose which directory category the new account belongs to:
                </Text>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryCard, { backgroundColor: subSurface, borderColor: borderCol }]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectCategory(cat.id)}
                  >
                    <View style={[styles.categoryIconBox, { backgroundColor: cat.bgColor }]}>
                      <Ionicons name={cat.icon} size={22} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.categoryTitle, { color: titleCol }]}>{cat.title}</Text>
                      <Text style={[styles.categorySub, { color: mutedCol }]}>{cat.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={mutedCol} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : step === 2 ? (
              /* STEP 2: Select Role within Category + Mandatory Mobile OTP Verification */
              <View style={{ gap: 12 }}>
                <Text style={[styles.sectionLabel, { color: titleCol }]}>
                  Select Role ({category})
                </Text>
                <View style={styles.roleGrid}>
                  {currentRoles.map((r) => {
                    const active = selectedRole === r.value;
                    return (
                      <TouchableOpacity
                        key={r.value}
                        style={[
                          styles.rolePillCard,
                          { backgroundColor: subSurface, borderColor: borderCol },
                          active && styles.rolePillCardActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          tap();
                          setSelectedRole(r.value);
                          setError(null);
                        }}
                      >
                        <Ionicons name={r.icon} size={15} color={active ? '#00ff87' : mutedCol} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rolePillLabel, { color: active ? '#00ff87' : titleCol }]}>
                            {r.label}
                          </Text>
                          <Text style={[styles.rolePillDesc, { color: mutedCol }]} numberOfLines={1}>
                            {r.desc}
                          </Text>
                        </View>
                        {active && <Ionicons name="checkmark-circle" size={16} color="#00ff87" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {category === 'CLIENTS' && (
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: mutedCol }}>
                    Note: Labour Workers are added directly by their Farmer and receive a King ID on first OTP login.
                  </Text>
                )}

                {/* Mandatory Mobile OTP Box */}
                <View style={[styles.otpBox, { backgroundColor: subSurface, borderColor: otpVerificationToken ? '#16a34a' : borderCol }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[styles.sectionLabel, { color: titleCol, marginBottom: 0 }]}>
                      Mobile Number OTP Verification (Required)
                    </Text>
                    {otpVerificationToken ? (
                      <View style={styles.verifiedTag}>
                        <Ionicons name="checkmark-circle" size={12} color="#00ff87" />
                        <Text style={styles.verifiedTagText}>Verified</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: cardBg }]}
                      placeholder="10-digit mobile number"
                      placeholderTextColor={mutedCol}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={mobile}
                      onChangeText={handleMobileChange}
                    />
                    <TouchableOpacity
                      style={[styles.otpActionBtn, isSendingOtp && { opacity: 0.6 }]}
                      disabled={isSendingOtp}
                      onPress={handleSendOtp}
                    >
                      {isSendingOtp ? (
                        <ActivityIndicator color="#020d06" size="small" />
                      ) : (
                        <Text style={styles.otpActionBtnText}>{otpSent ? 'Resend OTP' : 'Send OTP'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {otpSent && !otpVerificationToken && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: cardBg }]}
                        placeholder="Enter 6-digit OTP"
                        placeholderTextColor={mutedCol}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otpInput}
                        onChangeText={(v) => {
                          setOtpInput(v.replace(/\D/g, '').slice(0, 6));
                          setError(null);
                        }}
                      />
                      <TouchableOpacity
                        style={[styles.verifyBtn, isVerifyingOtp && { opacity: 0.6 }]}
                        disabled={isVerifyingOtp}
                        onPress={handleVerifyOtp}
                      >
                        {isVerifyingOtp ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.verifyBtnText}>Verify OTP</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {otpInfoMsg ? (
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: otpVerificationToken ? '#22c55e' : '#38bdf8', marginTop: 6 }}>
                      {otpInfoMsg}
                    </Text>
                  ) : null}
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { flex: 1, borderColor: borderCol }]}
                    onPress={() => {
                      setError(null);
                      setStep(1);
                    }}
                  >
                    <Text style={[styles.secondaryBtnText, { color: titleCol }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { flex: 2 },
                      (!selectedRole || !otpVerificationToken) && { opacity: 0.45 },
                    ]}
                    disabled={!selectedRole || !otpVerificationToken}
                    onPress={() => {
                      setError(null);
                      setStep(3);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Next: Fill Profile Data</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* STEP 3: Full Role-Specific Form */
              <View style={{ gap: 10 }}>
                <View style={[styles.summaryStrip, { backgroundColor: subSurface, borderColor: borderCol }]}>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#00ff87' }}>
                    {category} • {selectedRoleMeta?.label} • ✓ {mobile}
                  </Text>
                  <TouchableOpacity onPress={() => setStep(2)}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: '#38bdf8' }}>Change</Text>
                  </TouchableOpacity>
                </View>

                {existingUserSummary && (
                  <View
                    style={{
                      padding: 10,
                      borderRadius: RADIUS.md,
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      borderWidth: 1,
                      borderColor: 'rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#34d399' }}>
                      ✓ Existing Account Found — King ID: {existingUserSummary.kingId}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: mutedCol, marginTop: 2 }}>
                      Existing profile data is pre-filled below (editable). Adding {selectedRoleMeta?.label} links it to this exact same King ID.
                    </Text>
                  </View>
                )}

                <Text style={[styles.sectionLabel, { color: titleCol }]}>
                  {selectedRole === 'SELLER'
                    ? 'Owner / Proprietor Name (Editable) *'
                    : category === 'STAFF'
                    ? 'Staff Member Name *'
                    : 'Personal Name (Editable) *'}
                </Text>
                <TextInput
                  style={[styles.input, { color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                  placeholder={
                    selectedRole === 'SELLER'
                      ? 'Owner / Proprietor Legal Name *'
                      : category === 'STAFF'
                      ? 'Staff Member Full Name *'
                      : 'Client Personal Name *'
                  }
                  placeholderTextColor={mutedCol}
                  value={name}
                  onChangeText={setName}
                />

                <View style={styles.twoColRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                    placeholder="Email (optional)"
                    placeholderTextColor={mutedCol}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  {(category === 'STAFF' || category === 'PARTNERS') && (
                    <TextInput
                      style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                      placeholder="Initial Password (auto if blank)"
                      placeholderTextColor={mutedCol}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  )}
                </View>

                <Text style={[styles.sectionLabel, { color: titleCol }]}>Location & Address</Text>
                <View style={styles.twoColRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                      placeholder="6-digit PIN Code"
                      placeholderTextColor={mutedCol}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={pincode}
                      onChangeText={handlePincodeChange}
                    />
                    {isPinLoading ? <ActivityIndicator size="small" color="#00ff87" style={{ marginLeft: 6 }} /> : null}
                  </View>
                  <TextInput
                    style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                    placeholder="Village / Town / Post Office"
                    placeholderTextColor={mutedCol}
                    value={village}
                    onChangeText={setVillage}
                  />
                </View>

                <View style={styles.twoColRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                    placeholder="District"
                    placeholderTextColor={mutedCol}
                    value={district}
                    onChangeText={setDistrict}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                    placeholder="State"
                    placeholderTextColor={mutedCol}
                    value={stateName}
                    onChangeText={setStateName}
                  />
                </View>

                <TextInput
                  style={[styles.input, { color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                  placeholder="Full Street / Shop / Farm Address (optional)"
                  placeholderTextColor={mutedCol}
                  value={address}
                  onChangeText={setAddress}
                />

                {/* Farmer-specific fields */}
                {selectedRole === 'FARMER' && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionLabel, { color: '#16a34a' }]}>Farmer Details</Text>
                    <TextInput
                      style={[styles.input, { color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                      placeholder="Farm Name (optional)"
                      placeholderTextColor={mutedCol}
                      value={farmName}
                      onChangeText={setFarmName}
                    />
                    <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: mutedCol }}>Spray Tank Size (Liters)</Text>
                    <View style={styles.chipRow}>
                      {[15, 20, 25].map((sz) => (
                        <TouchableOpacity
                          key={sz}
                          style={[styles.choiceChip, sprayTankSizeL === sz && styles.choiceChipActive]}
                          onPress={() => setSprayTankSizeL(sz)}
                        >
                          <Text style={[styles.choiceChipText, sprayTankSizeL === sz && { color: '#020d06' }]}>{sz}L</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: mutedCol }}>Soil Type</Text>
                    <View style={styles.chipRow}>
                      {SOIL_TYPES.map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.choiceChip, soilType === st && styles.choiceChipActive]}
                          onPress={() => setSoilType(soilType === st ? '' : st)}
                        >
                          <Text style={[styles.choiceChipText, soilType === st && { color: '#020d06' }]}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: mutedCol }}>Water Source</Text>
                    <View style={styles.chipRow}>
                      {WATER_TYPES.map((wt) => (
                        <TouchableOpacity
                          key={wt}
                          style={[styles.choiceChip, waterType === wt && styles.choiceChipActive]}
                          onPress={() => setWaterType(waterType === wt ? '' : wt)}
                        >
                          <Text style={[styles.choiceChipText, waterType === wt && { color: '#020d06' }]}>{wt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Crop Doctor / Garden Advisor fields */}
                {(selectedRole === 'FARM_ADVISOR' || selectedRole === 'GARDEN_ADVISOR') && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionLabel, { color: '#38bdf8' }]}>Advisor Credentials</Text>
                    <View style={styles.twoColRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Specialization (e.g. Wheat & Paddy)"
                        placeholderTextColor={mutedCol}
                        value={specialization}
                        onChangeText={setSpecialization}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Qualification (e.g. B.Sc Agri)"
                        placeholderTextColor={mutedCol}
                        value={qualification}
                        onChangeText={setQualification}
                      />
                    </View>
                    <View style={styles.twoColRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Years Experience"
                        placeholderTextColor={mutedCol}
                        keyboardType="number-pad"
                        value={yearsExperience}
                        onChangeText={setYearsExperience}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Consultation Fee (INR)"
                        placeholderTextColor={mutedCol}
                        keyboardType="number-pad"
                        value={consultationFee}
                        onChangeText={setConsultationFee}
                      />
                    </View>
                    <TextInput
                      style={[styles.input, { color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                      placeholder="Short Bio (optional)"
                      placeholderTextColor={mutedCol}
                      value={bio}
                      onChangeText={setBio}
                    />
                  </View>
                )}

                {/* Seller Store fields */}
                {selectedRole === 'SELLER' && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionLabel, { color: '#f59e0b' }]}>
                      Firm / Store Details (Mandatory for Seller) *
                    </Text>
                    <View style={styles.twoColRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Firm / Store Name *"
                        placeholderTextColor={mutedCol}
                        value={storeName}
                        onChangeText={setStoreName}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="GSTIN (optional)"
                        placeholderTextColor={mutedCol}
                        autoCapitalize="characters"
                        value={gstin}
                        onChangeText={setGstin}
                      />
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: mutedCol }}>Seller Type</Text>
                    <View style={styles.chipRow}>
                      {SELLER_TYPES.map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.choiceChip, sellerType === st && styles.choiceChipActive]}
                          onPress={() => setSellerType(st)}
                        >
                          <Text style={[styles.choiceChipText, sellerType === st && { color: '#020d06' }]}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Partner KYC / Payout fields (Agent, Seller, Advisor, Trader) */}
                {category === 'PARTNERS' && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionLabel, { color: titleCol }]}>KYC & Payout Details (Optional)</Text>
                    <View style={styles.twoColRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="PAN Number (e.g. ABCDE1234F)"
                        placeholderTextColor={mutedCol}
                        autoCapitalize="characters"
                        maxLength={10}
                        value={panNumber}
                        onChangeText={setPanNumber}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="UPI ID"
                        placeholderTextColor={mutedCol}
                        value={upiId}
                        onChangeText={setUpiId}
                      />
                    </View>
                    <View style={styles.twoColRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Bank Account Holder"
                        placeholderTextColor={mutedCol}
                        value={bankAccountHolderName}
                        onChangeText={setBankAccountHolderName}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Bank Account Number"
                        placeholderTextColor={mutedCol}
                        value={bankAccountNumber}
                        onChangeText={setBankAccountNumber}
                      />
                    </View>
                    <View style={styles.twoColRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="IFSC Code"
                        placeholderTextColor={mutedCol}
                        autoCapitalize="characters"
                        maxLength={11}
                        value={bankIfsc}
                        onChangeText={setBankIfsc}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Alternative Mobile"
                        placeholderTextColor={mutedCol}
                        keyboardType="phone-pad"
                        value={alternativeMobile}
                        onChangeText={setAlternativeMobile}
                      />
                    </View>
                  </View>
                )}

                {/* Supervisor employer Farmer field */}
                {selectedRole === 'SUPERVISOR' && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionLabel, { color: '#16a34a' }]}>Employer Farmer Link *</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1, color: titleCol, borderColor: borderCol, backgroundColor: subSurface }]}
                        placeholder="Farmer King ID or 10-digit Mobile *"
                        placeholderTextColor={mutedCol}
                        value={employerFarmerQuery}
                        onChangeText={(v) => {
                          setEmployerFarmerQuery(v);
                          setEmployerFound(null);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.verifyBtn}
                        disabled={isEmployerSearching}
                        onPress={handleLookupEmployerFarmer}
                      >
                        {isEmployerSearching ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.verifyBtnText}>Verify Farmer</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {employerFound ? (
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.semiBold, color: '#22c55e' }}>
                        ✓ Farmer Found: {employerFound.name} (King ID: {employerFound.kingId || employerFound.mobile})
                      </Text>
                    ) : null}
                  </View>
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { flex: 1, borderColor: borderCol }]}
                    onPress={() => setStep(2)}
                  >
                    <Text style={[styles.secondaryBtnText, { color: titleCol }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 2 }, createUserMutation.isPending && { opacity: 0.7 }]}
                    disabled={createUserMutation.isPending}
                    onPress={handleSubmit}
                  >
                    {createUserMutation.isPending ? (
                      <ActivityIndicator color="#020d06" size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Create {selectedRoleMeta?.label}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 660,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 135, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  headerSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  stepChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  stepChipActive: {
    backgroundColor: '#00ff87',
  },
  stepChipDone: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
  },
  stepChipText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  sectionPrompt: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    marginBottom: 4,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  categoryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
  },
  categorySub: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePillCard: {
    minWidth: 185,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  rolePillCardActive: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
  },
  rolePillLabel: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  rolePillDesc: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
  },
  otpBox: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0, 255, 135, 0.14)',
  },
  verifiedTagText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  otpActionBtn: {
    backgroundColor: '#00ff87',
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpActionBtnText: {
    color: '#020d06',
    fontSize: 12,
    fontFamily: FONT.extraBold,
  },
  verifyBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  choiceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  choiceChipActive: {
    backgroundColor: '#00ff87',
    borderColor: '#00ff87',
  },
  choiceChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  primaryBtn: {
    backgroundColor: '#00ff87',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#020d06',
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  secondaryBtn: {
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(22, 163, 74, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.4)',
  },
  successTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#22c55e',
  },
  successSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  resultCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 8,
  },
  resultRow: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  copyRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

