import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { FONT, RADIUS } from '@/constants/theme';
import { resolveMediaUrl } from '@/src/api/client';
import { lookupPincode } from '@/src/api/pincode.api';
import {
  PartnerApplicationDto,
  PartnerUserSummary,
  sendPartnerOtpApi,
  submitPartnerApplicationApi,
  uploadPartnerKycDocApi,
  verifyPartnerOtpApi,
} from '@/src/api/auth.api';

interface PartnerSignupModalProps {
  visible: boolean;
  onClose: () => void;
  initialMobile?: string;
  initialPartnerUploadToken?: string | null;
  initialExistingUserSummary?: PartnerUserSummary | null;
  initialExistingApplication?: PartnerApplicationDto | null;
}

type DocFieldKey =
  | 'photoUrl'
  | 'panDocUrl'
  | 'aadhaarDocUrl'
  | 'aadhaarBackUrl'
  | 'chequeDocUrl'
  | 'gstDocUrl';

type PartnerRoleKey = 'NURSERY_OWNER' | 'SELLER' | 'FARM_ADVISOR' | 'GARDEN_ADVISOR' | 'AGENT';

interface PartnerRoleCardConfig {
  id: PartnerRoleKey;
  role: 'AGENT' | 'ADVISOR' | 'SELLER' | 'NURSERY_OWNER';
  advisorType?: 'FARM' | 'GARDEN';
  title: string;
  badge: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}

const PARTNER_ROLE_CARDS: PartnerRoleCardConfig[] = [
  {
    id: 'NURSERY_OWNER',
    role: 'NURSERY_OWNER',
    title: 'Nursery Owner',
    badge: 'HSN 0602 Exempt',
    subtitle: 'Live flower, vegetable & paddy seedlings hub',
    icon: 'leaf-outline',
    accent: '#10b981',
  },
  {
    id: 'AGENT',
    role: 'AGENT',
    title: 'Sales Manager',
    badge: '2% Comm + TDS 194-H',
    subtitle: 'Farmer outreach, coupons & referral network',
    icon: 'briefcase-outline',
    accent: '#f59e0b',
  },
  {
    id: 'FARM_ADVISOR',
    role: 'ADVISOR',
    advisorType: 'FARM',
    title: 'Crop Doctor',
    badge: 'Field Agronomy',
    subtitle: 'Crop prescriptions, spray plans & farm visits',
    icon: 'medkit-outline',
    accent: '#38bdf8',
  },
  {
    id: 'GARDEN_ADVISOR',
    role: 'ADVISOR',
    advisorType: 'GARDEN',
    title: 'Garden Advisor',
    badge: 'Urban Flora',
    subtitle: 'Kitchen garden, terrace plants & landscaping',
    icon: 'sunny-outline',
    accent: '#ec4899',
  },
  {
    id: 'SELLER',
    role: 'SELLER',
    title: 'Seller',
    badge: 'Marketplace Store',
    subtitle: 'Agri inputs, seeds, bio-fertilizers & tools',
    icon: 'storefront-outline',
    accent: '#8b5cf6',
  },
];

function formatPartnerRoleLabel(role: 'AGENT' | 'ADVISOR' | 'SELLER' | 'NURSERY_OWNER', advType?: 'FARM' | 'GARDEN' | null) {
  if (role === 'NURSERY_OWNER') return 'Nursery Owner';
  if (role === 'SELLER') return 'Seller';
  if (role === 'AGENT') return 'Sales Manager';
  return advType === 'GARDEN' ? 'Garden Advisor' : 'Crop Doctor / Advisor';
}

export function PartnerSignupModal({
  visible,
  onClose,
  initialMobile = '',
  initialPartnerUploadToken = null,
  initialExistingUserSummary = null,
  initialExistingApplication = null,
}: PartnerSignupModalProps) {
  // Wizard Steps: 1 (Role & OTP) -> 2 (Profile & Hub) -> 3 (KYC & Payouts) -> 4 (Submitted)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // OTP & Mobile state
  const [mobile, setMobile] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [existingUser, setExistingUser] = useState<PartnerUserSummary | null>(null);
  const [existingApp, setExistingApp] = useState<PartnerApplicationDto | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string>('');

  const [busyOtp, setBusyOtp] = useState(false);
  const [busyPin, setBusyPin] = useState(false);
  const [busySubmit, setBusySubmit] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<DocFieldKey | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile fields
  const [selectedRoleCardId, setSelectedRoleCardId] = useState<PartnerRoleKey>('NURSERY_OWNER');
  const [requestedRole, setRequestedRole] = useState<'AGENT' | 'ADVISOR' | 'SELLER' | 'NURSERY_OWNER'>('NURSERY_OWNER');
  const [advisorType, setAdvisorType] = useState<'FARM' | 'GARDEN'>('FARM');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pincode, setPincode] = useState('');
  const [postOffice, setPostOffice] = useState('');
  const [postOffices, setPostOffices] = useState<string[]>([]);
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');

  // Role-Specific fields
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');
  const [storeName, setStoreName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [sellerType, setSellerType] = useState<'FARMER' | 'COMMERCIAL'>('FARMER');
  const [pickupAddress, setPickupAddress] = useState('');

  // Statutory KYC & Bank fields
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [gstin, setGstin] = useState('');
  const [bankAccountHolderName, setBankAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

  // Documents
  const [photoUrl, setPhotoUrl] = useState('');
  const [panDocUrl, setPanDocUrl] = useState('');
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');
  const [chequeDocUrl, setChequeDocUrl] = useState('');
  const [gstDocUrl, setGstDocUrl] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const applyPrefillFromServer = (
    userSummary: PartnerUserSummary | null,
    app: PartnerApplicationDto | null,
  ) => {
    setExistingUser(userSummary);
    setExistingApp(app);

    if (app) {
      setRequestedRole(app.requestedRole);
      if (app.advisorType) {
        setAdvisorType(app.advisorType);
        setSelectedRoleCardId(app.advisorType === 'GARDEN' ? 'GARDEN_ADVISOR' : 'FARM_ADVISOR');
      } else if (app.requestedRole === 'NURSERY_OWNER') {
        setSelectedRoleCardId('NURSERY_OWNER');
      } else if (app.requestedRole === 'SELLER') {
        setSelectedRoleCardId('SELLER');
      } else {
        setSelectedRoleCardId('AGENT');
      }

      setName(app.name || userSummary?.name || '');
      setEmail(app.email || userSummary?.email || '');
      setPincode(app.pincode || userSummary?.pincode || '');
      setPostOffice(app.postOffice || userSummary?.postOffice || '');
      setVillage(app.village || userSummary?.village || '');
      setDistrict(app.district || userSummary?.district || '');
      setStateName(app.state || userSummary?.state || '');
      setQualification(app.qualification || userSummary?.qualification || '');
      setSpecialization(app.specialization || userSummary?.specialization || '');
      setYearsExperience(
        app.yearsExperience != null
          ? String(app.yearsExperience)
          : userSummary?.yearsExperience != null
          ? String(userSummary.yearsExperience)
          : '',
      );
      setBio(app.bio || userSummary?.bio || '');
      setStoreName(app.storeName || '');
      setLegalName(app.legalName || '');
      if (app.sellerType) setSellerType(app.sellerType);
      setPickupAddress(app.pickupAddress || '');
      setPanNumber(app.panNumber || userSummary?.panNumber || '');
      setAadhaarLast4(app.aadhaarLast4 || userSummary?.aadhaarLast4 || '');
      setGstin(app.gstin || userSummary?.gstin || '');
      setBankAccountHolderName(app.bankAccountHolderName || userSummary?.bankAccountHolderName || app.name || '');
      setBankAccountNumber(app.bankAccountNumber || userSummary?.bankAccountNumber || '');
      setBankIfsc(app.bankIfsc || userSummary?.bankIfsc || '');
      setUpiId(app.upiId || userSummary?.upiId || '');
      setPhotoUrl(app.photoUrl || userSummary?.photoUrl || '');
      setPanDocUrl(app.panDocUrl || userSummary?.panDocUrl || '');
      setAadhaarDocUrl(app.aadhaarDocUrl || userSummary?.aadhaarDocUrl || '');
      setAadhaarBackUrl(app.aadhaarBackUrl || userSummary?.aadhaarBackUrl || '');
      setChequeDocUrl(app.chequeDocUrl || userSummary?.chequeDocUrl || '');
      setGstDocUrl(app.gstDocUrl || userSummary?.gstDocUrl || '');
    } else if (userSummary) {
      setName(userSummary.name || '');
      setEmail(userSummary.email || '');
      setPincode(userSummary.pincode || '');
      setPostOffice(userSummary.postOffice || '');
      setVillage(userSummary.village || '');
      setDistrict(userSummary.district || '');
      setStateName(userSummary.state || '');
      setQualification(userSummary.qualification || '');
      setSpecialization(userSummary.specialization || '');
      setYearsExperience(userSummary.yearsExperience != null ? String(userSummary.yearsExperience) : '');
      setBio(userSummary.bio || '');
      setPanNumber(userSummary.panNumber || '');
      setAadhaarLast4(userSummary.aadhaarLast4 || '');
      setGstin(userSummary.gstin || '');
      setBankAccountHolderName(userSummary.bankAccountHolderName || userSummary.name || '');
      setBankAccountNumber(userSummary.bankAccountNumber || '');
      setBankIfsc(userSummary.bankIfsc || '');
      setUpiId(userSummary.upiId || '');
      setPhotoUrl(userSummary.photoUrl || '');
      setPanDocUrl(userSummary.panDocUrl || '');
      setAadhaarDocUrl(userSummary.aadhaarDocUrl || '');
      setAadhaarBackUrl(userSummary.aadhaarBackUrl || '');
      setChequeDocUrl(userSummary.chequeDocUrl || '');
    }
  };

  useEffect(() => {
    if (visible) {
      setErrorMsg(null);
      if (initialMobile) {
        setMobile(initialMobile.replace(/\D/g, '').slice(-10));
      }
      if (initialPartnerUploadToken) {
        setUploadToken(initialPartnerUploadToken);
      }
      if (initialExistingUserSummary || initialExistingApplication) {
        applyPrefillFromServer(initialExistingUserSummary, initialExistingApplication);
      }
    } else {
      // Reset wizard
      setCurrentStep(1);
      setMobile('');
      setOtpInput('');
      setOtpSent(false);
      setDevOtp(null);
      setUploadToken(null);
      setExistingUser(null);
      setExistingApp(null);
      setSubmittedMessage('');
      setErrorMsg(null);
      setSelectedRoleCardId('NURSERY_OWNER');
      setRequestedRole('NURSERY_OWNER');
      setAdvisorType('FARM');
      setName('');
      setEmail('');
      setPassword('');
      setPincode('');
      setPostOffice('');
      setPostOffices([]);
      setVillage('');
      setDistrict('');
      setStateName('');
      setQualification('');
      setSpecialization('');
      setYearsExperience('');
      setBio('');
      setStoreName('');
      setLegalName('');
      setSellerType('FARMER');
      setPickupAddress('');
      setPanNumber('');
      setAadhaarLast4('');
      setGstin('');
      setBankAccountHolderName('');
      setBankAccountNumber('');
      setBankIfsc('');
      setUpiId('');
      setPhotoUrl('');
      setPanDocUrl('');
      setAadhaarDocUrl('');
      setAadhaarBackUrl('');
      setChequeDocUrl('');
      setGstDocUrl('');
      setTermsAccepted(false);
    }
  }, [visible, initialMobile, initialPartnerUploadToken, initialExistingUserSummary, initialExistingApplication]);

  const handleSelectRole = (card: PartnerRoleCardConfig) => {
    setSelectedRoleCardId(card.id);
    setRequestedRole(card.role);
    if (card.advisorType) {
      setAdvisorType(card.advisorType);
    }
  };

  const handleSendOtp = async () => {
    const clean = mobile.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setBusyOtp(true);
    setErrorMsg(null);
    try {
      const res = await sendPartnerOtpApi(clean);
      setOtpSent(true);
      setDevOtp(res.devOtp ? String(res.devOtp) : null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to send OTP.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setBusyOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const clean = mobile.replace(/\D/g, '').slice(-10);
    const code = otpInput.trim();
    if (code.length < 4) {
      setErrorMsg('Please enter the 4-digit OTP code.');
      return;
    }
    setBusyOtp(true);
    setErrorMsg(null);
    try {
      const res = await verifyPartnerOtpApi(clean, code);
      setUploadToken(res.partnerUploadToken);
      applyPrefillFromServer(res.existingUserSummary, res.existingApplication);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'OTP verification failed.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setBusyOtp(false);
    }
  };

  const handleLookupPin = async () => {
    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit Postal PIN code first.');
      return;
    }
    setBusyPin(true);
    setErrorMsg(null);
    try {
      const res = await lookupPincode(cleanPin);
      const offices = (res.offices || []).map((o) => o.name);
      setPostOffices(offices);
      setPostOffice(res.postOffice || offices[0] || '');
      setDistrict(res.district || '');
      setStateName(res.state || '');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not fetch PIN code details.');
    } finally {
      setBusyPin(false);
    }
  };

  const handlePickAndUpload = async (field: DocFieldKey, setter: (url: string) => void) => {
    if (!uploadToken) {
      setErrorMsg('Mobile OTP session missing. Please verify OTP first.');
      return;
    }
    setErrorMsg(null);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.78,
        allowsEditing: false,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      setUploadingKey(field);
      const uploaded = await uploadPartnerKycDocApi(res.assets[0].uri, uploadToken);
      setter(uploaded.fileUrl);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Document upload failed. Try again.');
    } finally {
      setUploadingKey(null);
    }
  };

  const validateStep1 = () => {
    setErrorMsg(null);
    const clean = mobile.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return false;
    }
    if (!uploadToken) {
      setErrorMsg('Please verify your mobile number with OTP before continuing.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg(null);
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter your full legal name as per PAN.');
      return false;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com) or leave it empty.');
      return false;
    }
    if (!existingApp?.hasPassword && !existingUser && (!password.trim() || password.trim().length < 8)) {
      setErrorMsg('Please set a Partner login password of at least 8 characters.');
      return false;
    }
    if (password.trim() && password.trim().length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return false;
    }
    if (requestedRole === 'NURSERY_OWNER') {
      if (!storeName.trim()) {
        setErrorMsg('Nursery / GreenHouse business name is required.');
        return false;
      }
      if (!pickupAddress.trim()) {
        setErrorMsg('GreenHouse / Hub dispatch address is required for tray couriers.');
        return false;
      }
      if (!/^\d{6}$/.test(pincode.trim())) {
        setErrorMsg('Valid 6-digit Postal PIN Code is required for nursery dispatch.');
        return false;
      }
    }
    if (requestedRole === 'ADVISOR' && !qualification.trim()) {
      setErrorMsg('Academic qualification / agronomy degree is required for Advisors.');
      return false;
    }
    if (requestedRole === 'SELLER') {
      if (!storeName.trim() || !pickupAddress.trim() || !/^\d{6}$/.test(pincode.trim())) {
        setErrorMsg('Store Name, Full Pickup Address, and 6-digit PIN Code are required for Sellers.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase())) {
      setErrorMsg('Valid 10-character PAN is required (e.g. ABCDE1234F).');
      return;
    }
    if (!panDocUrl) {
      setErrorMsg('Please upload a clear photo of your PAN Card.');
      return;
    }
    if (!/^\d{4}$/.test(aadhaarLast4.trim())) {
      setErrorMsg('Please enter the exact last 4 digits of your Aadhaar card.');
      return;
    }
    if (!aadhaarDocUrl) {
      setErrorMsg('Please upload your Aadhaar Card front photo.');
      return;
    }
    if (!bankAccountHolderName.trim() || !bankAccountNumber.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc.trim().toUpperCase())) {
      setErrorMsg('Valid Bank Account Holder Name, Account Number, and 11-character IFSC Code are required.');
      return;
    }
    if (!chequeDocUrl) {
      setErrorMsg('Please upload a Cancelled Cheque or Bank Passbook photo.');
      return;
    }
    if (!photoUrl) {
      setErrorMsg('Please upload your Passport Profile Photo.');
      return;
    }
    if (requestedRole === 'SELLER' && sellerType === 'COMMERCIAL') {
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase()) || !gstDocUrl) {
        setErrorMsg('Valid 15-character GSTIN and GST Certificate photo are mandatory for Commercial Sellers.');
        return;
      }
    }
    if (!termsAccepted) {
      setErrorMsg('Please accept the Partner Terms & Income Tax TDS / GST Compliance declaration.');
      return;
    }

    setBusySubmit(true);
    const cleanMob = mobile.replace(/\D/g, '').slice(-10);
    try {
      const res = await submitPartnerApplicationApi({
        mobile: cleanMob,
        requestedRole,
        advisorType: requestedRole === 'ADVISOR' ? advisorType : undefined,
        name: name.trim(),
        email: email.trim() || undefined,
        password: password.trim() || undefined,
        pincode: pincode.trim() || undefined,
        postOffice: postOffice.trim() || undefined,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: stateName.trim() || undefined,
        qualification: qualification.trim() || undefined,
        specialization: specialization.trim() || undefined,
        yearsExperience: yearsExperience.trim() ? Number(yearsExperience.trim()) : undefined,
        bio: bio.trim() || undefined,
        panNumber: panNumber.trim().toUpperCase(),
        panDocUrl,
        aadhaarLast4: aadhaarLast4.trim(),
        aadhaarDocUrl,
        aadhaarBackUrl: aadhaarBackUrl || undefined,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
        gstDocUrl: gstDocUrl || undefined,
        bankAccountHolderName: bankAccountHolderName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        upiId: upiId.trim() || undefined,
        chequeDocUrl,
        photoUrl,
        storeName: requestedRole === 'SELLER' || requestedRole === 'NURSERY_OWNER' ? storeName.trim() : undefined,
        legalName: requestedRole === 'SELLER' || requestedRole === 'NURSERY_OWNER' ? legalName.trim() || undefined : undefined,
        sellerType: requestedRole === 'SELLER' ? sellerType : undefined,
        pickupAddress: requestedRole === 'SELLER' || requestedRole === 'NURSERY_OWNER' ? pickupAddress.trim() : undefined,
        termsAccepted: true,
      });
      setSubmittedMessage(res.message);
      setCurrentStep(4);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed. Check your entries and try again.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setBusySubmit(false);
    }
  };

  const renderUploadCard = (
    field: DocFieldKey,
    label: string,
    urlValue: string,
    setter: (v: string) => void,
    required = true,
  ) => {
    const isUploading = uploadingKey === field;
    const isUploaded = Boolean(urlValue);
    const resolvedUrl = urlValue ? resolveMediaUrl(urlValue) || urlValue : null;

    return (
      <View style={styles.uploadCard}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={isUploaded ? 'checkmark-circle' : 'document-attach-outline'}
              size={16}
              color={isUploaded ? '#00ff87' : '#94a3b8'}
            />
            <Text style={styles.uploadLabel} numberOfLines={1}>
              {label} {required ? '*' : '(Optional)'}
            </Text>
          </View>
          <Text style={styles.uploadSub} numberOfLines={1}>
            {isUploaded ? 'Document Attached & Verified' : 'JPG, PNG or WebP image'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.uploadActionBtn, isUploaded && styles.uploadActionBtnDone]}
          onPress={() => handlePickAndUpload(field, setter)}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#00ff87" />
          ) : isUploaded ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {resolvedUrl ? (
                <Image source={{ uri: resolvedUrl }} style={styles.uploadMiniThumb} />
              ) : null}
              <Text style={styles.uploadBtnTextDone}>Change</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="cloud-upload-outline" size={13} color="#020d06" />
              <Text style={styles.uploadBtnText}>Upload</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Top Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.headerIconBadge}>
                <Ionicons name="briefcase" size={18} color="#00ff87" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Apply for FarmsKing Partner Account</Text>
                <Text style={styles.headerSub}>3-Step Onboarding • Role & OTP, Profile Details, KYC & Bank</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={26} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Stepper Navigation */}
          {currentStep !== 4 && (
            <View style={styles.stepperRow}>
              {[
                { num: 1, label: '1. Role & OTP' },
                { num: 2, label: '2. Profile & Hub' },
                { num: 3, label: '3. KYC & Bank' },
              ].map((s) => {
                const isActive = currentStep === s.num;
                const isDone = currentStep > s.num;
                const canClick = s.num === 1 || (s.num === 2 && Boolean(uploadToken)) || (s.num === 3 && Boolean(uploadToken) && name.trim().length >= 2);

                return (
                  <TouchableOpacity
                    key={s.num}
                    disabled={!canClick}
                    onPress={() => {
                      if (s.num === 1) setCurrentStep(1);
                      else if (s.num === 2 && validateStep1()) setCurrentStep(2);
                      else if (s.num === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
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
                        { color: isActive ? '#020d06' : isDone ? '#00ff87' : '#94a3b8' },
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

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#f87171" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Scrollable Wizard Body */}
          <ScrollView
            style={{ maxHeight: Platform.OS === 'web' ? 560 : 500 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingBottom: 6 }}
          >
            {/* ================= STEP 1: ROLE & OTP ================= */}
            {currentStep === 1 && (
              <View style={{ gap: 14 }}>
                {/* Existing App Notice if any */}
                {existingApp && (
                  <View style={styles.existingAppBanner}>
                    <Ionicons name="information-circle" size={18} color="#f59e0b" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.existingAppTitle}>
                        Existing Application Found: {formatPartnerRoleLabel(existingApp.requestedRole, existingApp.advisorType)}
                      </Text>
                      <Text style={styles.existingAppSub}>
                        Status: <Text style={{ color: '#fbbf24', fontFamily: FONT.bold }}>{existingApp.status}</Text>. You can edit details and submit an updated application.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Role Selection */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.sectionLabel}>Select Role (PARTNERS)</Text>
                  <View style={styles.roleGrid}>
                    {PARTNER_ROLE_CARDS.map((card) => {
                      const selected = selectedRoleCardId === card.id;
                      const alreadyActive = existingUser?.activeRoles?.includes(card.role);

                      return (
                        <TouchableOpacity
                          key={card.id}
                          style={[
                            styles.roleCard,
                            selected && styles.roleCardActive,
                            alreadyActive && { opacity: 0.5 },
                          ]}
                          disabled={Boolean(alreadyActive)}
                          onPress={() => handleSelectRole(card)}
                          activeOpacity={0.85}
                        >
                          <View style={[styles.roleIconBadge, { backgroundColor: selected ? 'rgba(0, 255, 135, 0.15)' : `${card.accent}1f` }]}>
                            <Ionicons name={card.icon} size={17} color={selected ? '#00ff87' : card.accent} />
                          </View>
                          <Text
                            style={[
                              styles.roleCardTitle,
                              selected && styles.roleCardTitleActive,
                            ]}
                            numberOfLines={1}
                          >
                            {card.title}
                          </Text>
                          <Ionicons
                            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={18}
                            color={selected ? '#00ff87' : 'rgba(148, 163, 184, 0.35)'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Mobile Number OTP Box */}
                <View style={styles.otpBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.sectionLabel}>Mobile Number OTP Verification (Required)</Text>
                    {uploadToken ? (
                      <View style={styles.verifiedTag}>
                        <Ionicons name="checkmark-circle" size={13} color="#00ff87" />
                        <Text style={styles.verifiedTagText}>Verified</Text>
                      </View>
                    ) : null}
                  </View>

                  {!uploadToken ? (
                    <View style={{ gap: 8 }}>
                      <View style={styles.twoColRow}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: RADIUS.md, backgroundColor: '#020d06', paddingHorizontal: 10 }}>
                          <Text style={{ color: '#94a3b8', fontSize: 13, fontFamily: FONT.bold, marginRight: 6 }}>+91</Text>
                          <TextInput
                            style={[styles.inputBare, { flex: 1 }]}
                            placeholder="10-digit mobile number"
                            placeholderTextColor="#64748b"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={mobile}
                            onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))}
                            editable={!otpSent || busyOtp}
                          />
                        </View>
                        <TouchableOpacity
                          style={[styles.primaryActionBtn, (mobile.length !== 10 || busyOtp) && styles.btnDisabled]}
                          onPress={handleSendOtp}
                          disabled={mobile.length !== 10 || busyOtp}
                        >
                          {busyOtp && !otpSent ? (
                            <ActivityIndicator size="small" color="#020d06" />
                          ) : (
                            <Text style={styles.primaryActionBtnText}>{otpSent ? 'Resend' : 'Send OTP'}</Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* OTP Input Row */}
                      {otpSent && (
                        <View style={{ gap: 6, marginTop: 4 }}>
                          <View style={styles.twoColRow}>
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              placeholder="Enter 4-digit OTP"
                              placeholderTextColor="#64748b"
                              keyboardType="number-pad"
                              maxLength={6}
                              value={otpInput}
                              onChangeText={setOtpInput}
                            />
                            <TouchableOpacity
                              style={[styles.verifyBtn, (otpInput.length < 4 || busyOtp) && styles.btnDisabled]}
                              onPress={handleVerifyOtp}
                              disabled={otpInput.length < 4 || busyOtp}
                            >
                              {busyOtp ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={styles.verifyBtnText}>Verify OTP</Text>
                              )}
                            </TouchableOpacity>
                          </View>

                          {devOtp ? (
                            <View style={styles.devPill}>
                              <Text style={styles.devPillText}>Local Server OTP: {devOtp}</Text>
                              <TouchableOpacity onPress={() => setOtpInput(devOtp)}>
                                <Text style={styles.devFillText}>Auto-Fill</Text>
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.verifiedStrip}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Ionicons name="shield-checkmark" size={20} color="#00ff87" />
                        <View>
                          <Text style={styles.verifiedPhone}>+91 {mobile}</Text>
                          <Text style={styles.verifiedMeta}>
                            {existingUser?.kingId ? `Linked to King ID: ${existingUser.kingId}` : 'Mobile verified for document upload'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setUploadToken(null);
                          setOtpSent(false);
                          setOtpInput('');
                        }}
                      >
                        <Text style={styles.changePhoneText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ================= STEP 2: PROFILE & HUB ================= */}
            {currentStep === 2 && (
              <View style={{ gap: 14 }}>
                {/* Personal Information */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.sectionLabel}>Personal & Account Information</Text>
                  <View style={styles.gridTwo}>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Full Legal Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name (matches PAN)"
                        placeholderTextColor="#64748b"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Email Address (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="email@example.com"
                        placeholderTextColor="#64748b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.label}>
                      Partner Login Password {existingApp?.hasPassword || existingUser ? '(Optional — leave blank to keep current)' : '* (Minimum 8 characters)'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Create secure password for Partner Login"
                      placeholderTextColor="#64748b"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>

                {/* Postal Address */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.sectionLabel}>Address & Postal PIN Code</Text>
                  <View style={styles.gridTwo}>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Postal PIN Code {requestedRole === 'SELLER' || requestedRole === 'NURSERY_OWNER' ? '*' : ''}</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="6-digit PIN"
                          placeholderTextColor="#64748b"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={pincode}
                          onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                        />
                        <TouchableOpacity style={styles.lookupBtn} onPress={handleLookupPin} disabled={busyPin}>
                          {busyPin ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.lookupBtnText}>Lookup</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Post Office / Village</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Village / Town"
                        placeholderTextColor="#64748b"
                        value={village || postOffice}
                        onChangeText={(t) => {
                          setVillage(t);
                          if (!postOffice) setPostOffice(t);
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.gridTwo}>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>District</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: '#0f172a' }]}
                        placeholder="District"
                        placeholderTextColor="#64748b"
                        value={district}
                        onChangeText={setDistrict}
                      />
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>State</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: '#0f172a' }]}
                        placeholder="State"
                        placeholderTextColor="#64748b"
                        value={stateName}
                        onChangeText={setStateName}
                      />
                    </View>
                  </View>
                </View>

                {/* Role Specific Configuration */}
                {requestedRole === 'NURSERY_OWNER' && (
                  <View style={styles.roleSpecificBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.sectionLabel}>Nursery & Greenhouse Dispatch Hub</Text>
                      <View style={[styles.miniBadge, { borderColor: '#10b981' }]}>
                        <Text style={[styles.miniBadgeText, { color: '#10b981' }]}>HSN 0602 GST-Exempt</Text>
                      </View>
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Nursery Business / Farm Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Green Valley Plant Nursery"
                        placeholderTextColor="#64748b"
                        value={storeName}
                        onChangeText={setStoreName}
                      />
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Greenhouse / Hub Dispatch Address *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Complete pickup address for bus & train bilty parcel dispatch"
                        placeholderTextColor="#64748b"
                        value={pickupAddress}
                        onChangeText={setPickupAddress}
                      />
                    </View>
                    <View style={styles.complianceNoteBox}>
                      <Ionicons name="shield-checkmark" size={15} color="#10b981" />
                      <Text style={styles.complianceNoteText}>
                        HSN 0602 Statutory Note: Live plants, seedlings, and root plugs are 100% exempt from GST under Indian agricultural tax laws.
                      </Text>
                    </View>
                  </View>
                )}

                {requestedRole === 'ADVISOR' && (
                  <View style={styles.roleSpecificBox}>
                    <Text style={styles.sectionLabel}>Advisor Credentials & Experience</Text>
                    <View style={styles.gridTwo}>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Academic Qualification / Certification *</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. B.Sc Agriculture / Horticulture Diploma"
                          placeholderTextColor="#64748b"
                          value={qualification}
                          onChangeText={setQualification}
                        />
                      </View>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Years of Experience</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 5"
                          placeholderTextColor="#64748b"
                          keyboardType="number-pad"
                          value={yearsExperience}
                          onChangeText={setYearsExperience}
                        />
                      </View>
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Specialization</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Paddy & Wheat Agronomy, Organic Pest Control"
                        placeholderTextColor="#64748b"
                        value={specialization}
                        onChangeText={setSpecialization}
                      />
                    </View>
                  </View>
                )}

                {requestedRole === 'SELLER' && (
                  <View style={styles.roleSpecificBox}>
                    <Text style={styles.sectionLabel}>Seller Store & Pickup Details</Text>
                    <View style={styles.gridTwo}>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Store Display Name *</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Kisan Agro Center"
                          placeholderTextColor="#64748b"
                          value={storeName}
                          onChangeText={setStoreName}
                        />
                      </View>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Seller Category *</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          {(['FARMER', 'COMMERCIAL'] as const).map((st) => {
                            const isSel = sellerType === st;
                            return (
                              <TouchableOpacity
                                key={st}
                                style={[styles.choiceChip, isSel && styles.choiceChipActive]}
                                onPress={() => setSellerType(st)}
                              >
                                <Text style={[styles.choiceChipText, isSel && { color: '#020d06' }]}>
                                  {st === 'FARMER' ? 'Farmer / Producer' : 'Commercial (GST)'}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Warehouse / Shop Pickup Address *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Complete address for courier parcel pickup"
                        placeholderTextColor="#64748b"
                        value={pickupAddress}
                        onChangeText={setPickupAddress}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ================= STEP 3: KYC & BANK ================= */}
            {currentStep === 3 && (
              <View style={{ gap: 14 }}>
                {/* Identity Verification */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.sectionLabel}>Statutory Identity Verification (Income Tax & Compliance)</Text>
                  <View style={styles.gridTwo}>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>10-Character PAN Number *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="ABCDE1234F"
                        placeholderTextColor="#64748b"
                        autoCapitalize="characters"
                        maxLength={10}
                        value={panNumber}
                        onChangeText={(t) => setPanNumber(t.toUpperCase().trim())}
                      />
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Aadhaar Card (Last 4 Digits) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 5678"
                        placeholderTextColor="#64748b"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={aadhaarLast4}
                        onChangeText={(t) => setAadhaarLast4(t.replace(/\D/g, '').slice(0, 4))}
                      />
                    </View>
                  </View>

                  {/* Commercial Seller GSTIN */}
                  {requestedRole === 'SELLER' && sellerType === 'COMMERCIAL' && (
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>15-Character GSTIN *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="03AAAAA0000A1Z5"
                        placeholderTextColor="#64748b"
                        autoCapitalize="characters"
                        maxLength={15}
                        value={gstin}
                        onChangeText={(t) => setGstin(t.toUpperCase().trim())}
                      />
                    </View>
                  )}

                  {/* Upload Document Cards Grid */}
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {renderUploadCard('panDocUrl', 'PAN Card Photo', panDocUrl, setPanDocUrl, true)}
                    {renderUploadCard('aadhaarDocUrl', 'Aadhaar Card Front', aadhaarDocUrl, setAadhaarDocUrl, true)}
                    {renderUploadCard('aadhaarBackUrl', 'Aadhaar Card Back', aadhaarBackUrl, setAadhaarBackUrl, false)}
                    {requestedRole === 'SELLER' && sellerType === 'COMMERCIAL' &&
                      renderUploadCard('gstDocUrl', 'GST Registration Certificate', gstDocUrl, setGstDocUrl, true)}
                  </View>
                </View>

                {/* Bank Account Setup */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.sectionLabel}>Bank Account & Escrow Payouts (Direct Deposit)</Text>
                  <View style={styles.gridTwo}>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Bank Account Holder Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Name as printed on passbook"
                        placeholderTextColor="#64748b"
                        value={bankAccountHolderName}
                        onChangeText={setBankAccountHolderName}
                      />
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>Bank Account Number *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Account number"
                        placeholderTextColor="#64748b"
                        keyboardType="number-pad"
                        value={bankAccountNumber}
                        onChangeText={setBankAccountNumber}
                      />
                    </View>
                  </View>

                  <View style={styles.gridTwo}>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>11-Character IFSC Code *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. SBIN0001234"
                        placeholderTextColor="#64748b"
                        autoCapitalize="characters"
                        maxLength={11}
                        value={bankIfsc}
                        onChangeText={(t) => setBankIfsc(t.toUpperCase().trim())}
                      />
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.label}>UPI ID (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="username@bank"
                        placeholderTextColor="#64748b"
                        autoCapitalize="none"
                        value={upiId}
                        onChangeText={setUpiId}
                      />
                    </View>
                  </View>

                  <View style={{ gap: 8, marginTop: 4 }}>
                    {renderUploadCard('chequeDocUrl', 'Cancelled Cheque / Passbook Copy', chequeDocUrl, setChequeDocUrl, true)}
                    {renderUploadCard('photoUrl', 'Passport Profile Photo', photoUrl, setPhotoUrl, true)}
                  </View>
                </View>

                {/* Statutory Terms Acceptance */}
                <TouchableOpacity
                  style={styles.termsRow}
                  activeOpacity={0.8}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                >
                  <Ionicons
                    name={termsAccepted ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={termsAccepted ? '#00ff87' : '#94a3b8'}
                  />
                  <Text style={styles.termsText}>
                    I confirm that the statutory details and documents provided are accurate. I accept the{' '}
                    <Text style={{ color: '#00ff87', fontFamily: FONT.bold }}>FarmsKing Partner Terms of Service</Text>{' '}
                    and acknowledge Section 194-O / 194-H Income Tax TDS compliance deductions.
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ================= STEP 4: SUBMITTED SUCCESS ================= */}
            {currentStep === 4 && (
              <View style={styles.successContainer}>
                <View style={styles.successIconBadge}>
                  <Ionicons name="checkmark-circle" size={44} color="#00ff87" />
                </View>
                <Text style={styles.successTitle}>Application Submitted Successfully!</Text>
                <Text style={styles.successSub}>
                  {submittedMessage || 'Your Partner KYC documents have been received and are now under review.'}
                </Text>

                <View style={styles.successMetaCard}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaKey}>Partner Role:</Text>
                    <Text style={styles.metaVal}>{formatPartnerRoleLabel(requestedRole, advisorType)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaKey}>Mobile Number:</Text>
                    <Text style={styles.metaVal}>+91 {mobile}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaKey}>Verification Desk:</Text>
                    <Text style={[styles.metaVal, { color: '#fbbf24' }]}>Pending Admin Verification</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={onClose}>
                  <Text style={styles.primaryActionBtnText}>Done / Back to Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Bar */}
          {currentStep !== 4 && (
            <View style={styles.bottomBar}>
              {currentStep === 1 ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setErrorMsg(null);
                    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1));
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="arrow-back" size={15} color="#e2e8f0" />
                    <Text style={styles.secondaryBtnText}>Back</Text>
                  </View>
                </TouchableOpacity>
              )}

              {currentStep === 1 && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { flex: 1 }, !uploadToken && styles.btnDisabled]}
                  onPress={() => {
                    if (validateStep1()) setCurrentStep(2);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.primaryActionBtnText}>Next: Fill Profile Details</Text>
                    <Ionicons name="arrow-forward" size={15} color="#020d06" />
                  </View>
                </TouchableOpacity>
              )}

              {currentStep === 2 && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { flex: 1 }]}
                  onPress={() => {
                    if (validateStep2()) setCurrentStep(3);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.primaryActionBtnText}>Next: KYC & Bank Payouts</Text>
                    <Ionicons name="arrow-forward" size={15} color="#020d06" />
                  </View>
                </TouchableOpacity>
              )}

              {currentStep === 3 && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { flex: 1 }, busySubmit && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={busySubmit}
                >
                  {busySubmit ? (
                    <ActivityIndicator size="small" color="#020d06" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.primaryActionBtnText}>Submit Partner Application</Text>
                      <Ionicons name="checkmark-done" size={16} color="#020d06" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 720,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    backgroundColor: '#061a10',
    borderColor: 'rgba(0, 255, 135, 0.22)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 20px 48px -10px rgba(0, 0, 0, 0.85), 0 0 24px rgba(0, 255, 135, 0.15)',
        } as any)
      : {
          elevation: 12,
        }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 4,
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
    color: '#f8fafc',
  },
  headerSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    backgroundColor: '#020d06',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionLabel: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    marginBottom: 2,
  },
  label: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleCard: {
    minWidth: Platform.OS === 'web' ? 175 : '48%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: '#0a1f13',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  roleCardActive: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
  },
  roleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#e2e8f0',
  },
  roleCardTitleActive: {
    color: '#00ff87',
    fontFamily: FONT.bold,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  miniBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  otpBox: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: '#020d06',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
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
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldCol: {
    flex: 1,
    minWidth: 200,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#f8fafc',
    backgroundColor: '#020d06',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  inputBare: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#f8fafc',
    paddingVertical: 8,
    outlineStyle: 'none' as any,
  },
  primaryActionBtn: {
    backgroundColor: '#00ff87',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: '#020d06',
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
  },
  verifyBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  secondaryBtn: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  lookupBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookupBtnText: {
    color: '#fff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  devPillText: {
    color: '#a7f3d0',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  devFillText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
    textDecorationLine: 'underline',
  },
  verifiedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  verifiedPhone: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  verifiedMeta: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  changePhoneText: {
    color: '#38bdf8',
    fontSize: 11.5,
    fontFamily: FONT.bold,
    textDecorationLine: 'underline',
  },
  existingAppBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  existingAppTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#f59e0b',
  },
  existingAppSub: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#cbd5e1',
    marginTop: 2,
  },
  roleSpecificBox: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: '#0a1f13',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  complianceNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  complianceNoteText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#a7f3d0',
    flex: 1,
    lineHeight: 15,
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
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: '#020d06',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  uploadLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  uploadSub: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#64748b',
    marginTop: 1,
  },
  uploadActionBtn: {
    backgroundColor: '#00ff87',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadActionBtnDone: {
    backgroundColor: 'rgba(0, 255, 135, 0.14)',
    borderWidth: 1,
    borderColor: '#00ff87',
  },
  uploadBtnText: {
    color: '#020d06',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  uploadBtnTextDone: {
    color: '#00ff87',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  uploadMiniThumb: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  successIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 255, 135, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  successMetaCard: {
    width: '100%',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: '#020d06',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaKey: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  metaVal: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  errorText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#fca5a5',
  },
});
