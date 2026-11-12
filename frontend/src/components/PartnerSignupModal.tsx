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
import { LinearGradient } from 'expo-linear-gradient';
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

const PARTNER_ROLE_CARDS: {
  id: 'SELLER' | 'FARM_ADVISOR' | 'GARDEN_ADVISOR' | 'AGENT';
  role: 'AGENT' | 'ADVISOR' | 'SELLER';
  advisorType?: 'FARM' | 'GARDEN';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}[] = [
  {
    id: 'SELLER',
    role: 'SELLER',
    title: 'Seller',
    subtitle: 'Sell certified seeds, agri inputs & farm products (Sec 194-O / GST Sec 52)',
    icon: 'storefront',
    accent: '#38bdf8',
  },
  {
    id: 'FARM_ADVISOR',
    role: 'ADVISOR',
    advisorType: 'FARM',
    title: 'Crop Doctor / Advisor',
    subtitle: 'Provide crop advisory, spray schedules & farm visits (TDS Sec 194-J)',
    icon: 'medical',
    accent: '#10b981',
  },
  {
    id: 'GARDEN_ADVISOR',
    role: 'ADVISOR',
    advisorType: 'GARDEN',
    title: 'Garden Advisor',
    subtitle: 'Guide home gardens, kitchen gardens & nurseries (TDS Sec 194-J)',
    icon: 'flower',
    accent: '#ec4899',
  },
  {
    id: 'AGENT',
    role: 'AGENT',
    title: 'Sales Manager',
    subtitle: 'Manage farmer outreach & earn commission on plans and orders (TDS Sec 194-H)',
    icon: 'briefcase',
    accent: '#f59e0b',
  },
];

function formatPartnerRoleLabel(role: 'AGENT' | 'ADVISOR' | 'SELLER', advType?: 'FARM' | 'GARDEN' | null) {
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
  const [step, setStep] = useState<'OTP' | 'PENDING_VIEW' | 'FORM' | 'SUBMITTED'>('OTP');
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

  // Profile + Role fields
  const [requestedRole, setRequestedRole] = useState<'AGENT' | 'ADVISOR' | 'SELLER'>('AGENT');
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

  // Advisor fields
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');

  // Seller fields
  const [storeName, setStoreName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [sellerType, setSellerType] = useState<'FARMER' | 'COMMERCIAL'>('FARMER');
  const [pickupAddress, setPickupAddress] = useState('');

  // Statutory KYC + Bank fields
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
      if (app.advisorType) setAdvisorType(app.advisorType);
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
      setTermsAccepted(true);

      if (app.status === 'PENDING') {
        setStep('PENDING_VIEW');
        return;
      }
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
      setGstDocUrl(userSummary.gstDocUrl || '');
      setTermsAccepted(false);
    }
    setStep('FORM');
  };

  useEffect(() => {
    if (!visible) return;
    setErrorMsg(null);
    setOtpInput('');
    setDevOtp(null);
    setPassword('');
    const cleanInitMobile = initialMobile.replace(/\D/g, '').slice(-10);
    setMobile(cleanInitMobile);

    if (initialPartnerUploadToken) {
      setUploadToken(initialPartnerUploadToken);
      setOtpSent(true);
      applyPrefillFromServer(initialExistingUserSummary, initialExistingApplication);
    } else if (initialExistingApplication?.status === 'PENDING') {
      setUploadToken(null);
      setExistingUser(initialExistingUserSummary);
      setExistingApp(initialExistingApplication);
      setStep('PENDING_VIEW');
    } else {
      setUploadToken(null);
      setOtpSent(false);
      setExistingUser(null);
      setExistingApp(null);
      setStep('OTP');
      setRequestedRole('AGENT');
      setAdvisorType('FARM');
      setName('');
      setEmail('');
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
      setErrorMsg('Mobile OTP session missing. Please re-verify OTP to upload KYC documents.');
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

  const handleSubmit = async () => {
    setErrorMsg(null);
    const cleanMob = mobile.replace(/\D/g, '').slice(-10);
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    if (!existingApp?.hasPassword && !existingUser && (!password.trim() || password.trim().length < 8)) {
      setErrorMsg('Please set a Partner login password of at least 8 characters.');
      return;
    }
    if (password.trim() && password.trim().length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
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
    if (requestedRole === 'ADVISOR' && !qualification.trim()) {
      setErrorMsg('Academic qualification / agronomy certification is required for Advisors.');
      return;
    }
    if (requestedRole === 'SELLER') {
      if (!storeName.trim() || !pickupAddress.trim() || !/^\d{6}$/.test(pincode.trim())) {
        setErrorMsg('Store Name, Full Pickup Address, and 6-digit PIN Code are required for Sellers.');
        return;
      }
      if (sellerType === 'COMMERCIAL' && (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase()) || !gstDocUrl)) {
        setErrorMsg('Valid 15-character GSTIN and GST Certificate photo are mandatory for Commercial Sellers.');
        return;
      }
    }
    if (!termsAccepted) {
      setErrorMsg('Please accept the Partner Terms & Income Tax TDS / GST Compliance declaration.');
      return;
    }

    setBusySubmit(true);
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
        storeName: requestedRole === 'SELLER' ? storeName.trim() : undefined,
        legalName: requestedRole === 'SELLER' ? legalName.trim() || undefined : undefined,
        sellerType: requestedRole === 'SELLER' ? sellerType : undefined,
        pickupAddress: requestedRole === 'SELLER' ? pickupAddress.trim() : undefined,
        termsAccepted: true,
      });
      setSubmittedMessage(res.message);
      setStep('SUBMITTED');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed. Check your entries and try again.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setBusySubmit(false);
    }
  };

  const renderUploadButton = (
    field: DocFieldKey,
    label: string,
    urlValue: string,
    setter: (v: string) => void,
    required = true,
  ) => {
    const isBusy = uploadingKey === field;
    const isDone = Boolean(urlValue);
    return (
      <View style={styles.docCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.docLabel}>
              {label} {required ? <Text style={{ color: '#ef4444' }}>*</Text> : <Text style={{ color: '#64748b' }}>(Optional)</Text>}
            </Text>
            <Text style={styles.docSub}>{isDone ? 'Uploaded & Ready' : 'Select clear photo (JPG / PNG)'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.uploadBtn, isDone && styles.uploadBtnDone]}
            disabled={isBusy}
            onPress={() => handlePickAndUpload(field, setter)}
            activeOpacity={0.85}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name={isDone ? 'checkmark-circle' : 'cloud-upload-outline'} size={15} color="#fff" />
                <Text style={styles.uploadBtnText}>{isDone ? 'Replace' : 'Upload'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {isDone ? (
          <Image
            source={{ uri: resolveMediaUrl(urlValue) || urlValue }}
            style={styles.docThumb}
            resizeMode="cover"
          />
        ) : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#fbbf24" />
                <Text style={styles.headerBadgeText}>PARTNER ONBOARDING &amp; KYC</Text>
              </View>
              <Text style={styles.headerTitle}>
                {existingApp?.status === 'REJECTED'
                  ? 'Edit & Resubmit Partner Profile'
                  : 'Apply for FarmsKing Partner Account'}
              </Text>
              <Text style={styles.headerSub}>
                Agent, Crop Doctor / Advisor, or Store Seller (Activated after Admin verification)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={true}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={17} color="#f87171" />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Existing King ID Sync Banner */}
            {existingUser?.kingId ? (
              <View style={styles.kingIdBanner}>
                <Ionicons name="key" size={18} color="#34d399" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.kingIdTitle}>
                    Existing FarmsKing Account Found — King ID: {existingUser.kingId}
                  </Text>
                  <Text style={styles.kingIdDesc}>
                    After Admin approves your Partner application, your approved Partner role will be linked to this exact same King ID ({existingUser.kingId}) without changing your User Login access.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Rejection Reason Banner */}
            {existingApp?.status === 'REJECTED' ? (
              <View style={styles.rejectedBanner}>
                <Ionicons name="warning" size={18} color="#fca5a5" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectedTitle}>Previous Application Rejected</Text>
                  <Text style={styles.rejectedReason}>
                    Admin Reason: {existingApp.rejectionReason || 'Documents or profile details need correction.'}
                  </Text>
                  <Text style={styles.rejectedHint}>
                    Update your details or documents below and submit again for approval.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* STEP 1: MOBILE OTP VERIFICATION */}
            {step === 'OTP' && (
              <View style={{ gap: 14 }}>
                <Text style={styles.sectionTitle}>Step 1: Verify Your Mobile Number</Text>
                <Text style={styles.helpText}>
                  If you already have a Farmer, Gardener, Trader, or Buyer account on this mobile number, we will automatically keep your exact same King ID after Admin approval.
                </Text>

                <Text style={styles.label}>10-Digit Mobile Number *</Text>
                <View style={styles.rowInput}>
                  <Text style={styles.prefix}>+91</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobile}
                    editable={!otpSent}
                    onChangeText={(t) => {
                      setMobile(t.replace(/\D/g, '').slice(-10));
                      setErrorMsg(null);
                    }}
                  />
                </View>

                {!otpSent ? (
                  <TouchableOpacity onPress={handleSendOtp} disabled={busyOtp} activeOpacity={0.85} style={styles.primaryBtn}>
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.primaryBtnGrad}>
                      {busyOtp ? (
                        <ActivityIndicator color="#0f172a" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Send Verification OTP</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 10 }}>
                    {devOtp ? (
                      <View style={styles.devPill}>
                        <Text style={styles.devPillText}>Localhost Server OTP: {devOtp}</Text>
                        <TouchableOpacity onPress={() => setOtpInput(devOtp)}>
                          <Text style={styles.devFillText}>Auto-Fill</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    <Text style={styles.label}>Enter 4-Digit Verification OTP *</Text>
                    <View style={styles.rowInput}>
                      <TextInput
                        style={[styles.textInput, { letterSpacing: 6, fontSize: 18, fontFamily: FONT.bold }]}
                        placeholder="••••"
                        placeholderTextColor="#64748b"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={otpInput}
                        onChangeText={setOtpInput}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => {
                          setOtpSent(false);
                          setOtpInput('');
                        }}
                      >
                        <Text style={styles.secondaryBtnText}>Change Number</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleVerifyOtp} disabled={busyOtp} style={[styles.primaryBtn, { flex: 1 }]}>
                        <LinearGradient colors={['#10b981', '#059669']} style={styles.primaryBtnGrad}>
                          {busyOtp ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={[styles.primaryBtnText, { color: '#fff' }]}>Verify &amp; Continue</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* PENDING APPLICATION STATUS VIEW */}
            {step === 'PENDING_VIEW' && existingApp && (
              <View style={styles.statusCard}>
                <View style={styles.statusIconWrap}>
                  <Ionicons name="time" size={32} color="#fbbf24" />
                </View>
                <Text style={styles.statusTitle}>Application Under Admin Review</Text>
                <Text style={styles.statusDesc}>
                  Your application for <Text style={{ color: '#fbbf24', fontFamily: FONT.bold }}>{formatPartnerRoleLabel(existingApp.requestedRole, existingApp.advisorType)}</Text> on mobile <Text style={{ color: '#fff', fontFamily: FONT.bold }}>+91 {existingApp.mobile}</Text> has been received and is awaiting Admin verification.
                </Text>
                <Text style={styles.statusMeta}>
                  You will be able to sign in on the Partner Login tab immediately once an Admin approves your KYC documents.
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, width: '100%' }}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => setStep('FORM')}
                  >
                    <Text style={styles.secondaryBtnText}>Update Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1 }]}
                    onPress={onClose}
                  >
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.primaryBtnGrad}>
                      <Text style={[styles.primaryBtnText, { color: '#fff' }]}>Back to Login</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 2 & 3: FULL PARTNER PROFILE & KYC FORM */}
            {step === 'FORM' && (
              <View style={{ gap: 16 }}>
                {/* Role Selection */}
                <Text style={styles.sectionTitle}>1. Select Partner Role</Text>
                <View style={{ gap: 8 }}>
                  {PARTNER_ROLE_CARDS.map((card) => {
                    const selected =
                      requestedRole === card.role &&
                      (card.role !== 'ADVISOR' || advisorType === card.advisorType);
                    const alreadyHasRole = existingUser?.activeRoles?.includes(card.role);
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[
                          styles.roleOption,
                          selected && { borderColor: card.accent, backgroundColor: 'rgba(245, 158, 11, 0.08)' },
                          alreadyHasRole && { opacity: 0.5 },
                        ]}
                        disabled={Boolean(alreadyHasRole)}
                        onPress={() => {
                          setRequestedRole(card.role);
                          if (card.advisorType) setAdvisorType(card.advisorType);
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.roleIconBox, { backgroundColor: `${card.accent}22` }]}>
                          <Ionicons name={card.icon} size={18} color={card.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.roleTitle}>
                            {card.title} {alreadyHasRole ? '(Already Active)' : ''}
                          </Text>
                          <Text style={styles.roleDesc}>{card.subtitle}</Text>
                        </View>
                        <Ionicons
                          name={selected ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={selected ? card.accent : '#64748b'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Basic & Login Details */}
                <Text style={styles.sectionTitle}>2. Profile &amp; Address Details</Text>
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
                    <Text style={styles.label}>Email Address</Text>
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

                <View style={styles.gridTwo}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>Postal PIN Code {requestedRole === 'SELLER' ? '*' : ''}</Text>
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
                        {busyPin ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.lookupBtnText}>Lookup</Text>
                        )}
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

                {postOffices.length > 1 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {postOffices.slice(0, 8).map((po) => (
                      <TouchableOpacity
                        key={po}
                        style={[styles.poChip, postOffice === po && styles.poChipActive]}
                        onPress={() => setPostOffice(po)}
                      >
                        <Text style={[styles.poChipText, postOffice === po && { color: '#fbbf24' }]}>{po}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                <View style={styles.gridTwo}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>District</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="District"
                      placeholderTextColor="#64748b"
                      value={district}
                      onChangeText={setDistrict}
                    />
                  </View>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="State"
                      placeholderTextColor="#64748b"
                      value={stateName}
                      onChangeText={setStateName}
                    />
                  </View>
                </View>

                {/* Role-Specific Fields */}
                {requestedRole === 'ADVISOR' && (
                  <View style={styles.roleBox}>
                    <Text style={styles.sectionTitle}>Crop Doctor / Advisor Credentials</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['FARM', 'GARDEN'] as const).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.choiceBtn, advisorType === t && styles.choiceBtnActive]}
                          onPress={() => setAdvisorType(t)}
                        >
                          <Text style={[styles.choiceBtnText, advisorType === t && { color: '#10b981' }]}>
                            {t === 'FARM' ? 'Farm Crop Advisor' : 'Garden Plant Advisor'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.gridTwo}>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Qualification / Degree *</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. B.Sc. Agriculture"
                          placeholderTextColor="#64748b"
                          value={qualification}
                          onChangeText={setQualification}
                        />
                      </View>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Years Experience</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 5"
                          placeholderTextColor="#64748b"
                          keyboardType="number-pad"
                          value={yearsExperience}
                          onChangeText={(v) => setYearsExperience(v.replace(/\D/g, ''))}
                        />
                      </View>
                    </View>
                    <Text style={styles.label}>Specialization &amp; Bio</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Crop disease control, orchards, soil nutrition..."
                      placeholderTextColor="#64748b"
                      value={specialization}
                      onChangeText={setSpecialization}
                    />
                    <TextInput
                      style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
                      placeholder="Brief experience summary for farmers"
                      placeholderTextColor="#64748b"
                      multiline
                      value={bio}
                      onChangeText={setBio}
                    />
                  </View>
                )}

                {requestedRole === 'SELLER' && (
                  <View style={styles.roleBox}>
                    <Text style={styles.sectionTitle}>Marketplace Seller Store Details</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['FARMER', 'COMMERCIAL'] as const).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.choiceBtn, sellerType === t && styles.choiceBtnActive]}
                          onPress={() => setSellerType(t)}
                        >
                          <Text style={[styles.choiceBtnText, sellerType === t && { color: '#38bdf8' }]}>
                            {t === 'FARMER' ? 'Farmer Seller (Unregistered)' : 'Commercial / Agri Dealer (GSTIN)'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.gridTwo}>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Store Display Name *</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Punjab Kisan Kendra"
                          placeholderTextColor="#64748b"
                          value={storeName}
                          onChangeText={setStoreName}
                        />
                      </View>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Legal Business Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Firm / Proprietor Name"
                          placeholderTextColor="#64748b"
                          value={legalName}
                          onChangeText={setLegalName}
                        />
                      </View>
                    </View>
                    <Text style={styles.label}>Full Pickup / Warehouse Address *</Text>
                    <TextInput
                      style={[styles.input, { minHeight: 56 }]}
                      placeholder="Shop No, Market/Mandi, Landmark for Courier Pickup"
                      placeholderTextColor="#64748b"
                      multiline
                      value={pickupAddress}
                      onChangeText={setPickupAddress}
                    />
                  </View>
                )}

                {/* Statutory Tax & Bank Payouts */}
                <Text style={styles.sectionTitle}>3. Tax KYC &amp; Bank Payout Details</Text>
                <View style={styles.gridTwo}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>PAN Number * (Sec 194-O/H/J TDS)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ABCDE1234F"
                      placeholderTextColor="#64748b"
                      autoCapitalize="characters"
                      maxLength={10}
                      value={panNumber}
                      onChangeText={(t) => setPanNumber(t.toUpperCase())}
                    />
                  </View>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>Aadhaar Last 4 Digits *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1234"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={aadhaarLast4}
                      onChangeText={(t) => setAadhaarLast4(t.replace(/\D/g, '').slice(0, 4))}
                    />
                  </View>
                </View>

                <View style={styles.gridTwo}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>
                      GSTIN {requestedRole === 'SELLER' && sellerType === 'COMMERCIAL' ? '*' : '(Optional)'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="03ABCDE1234F1Z5"
                      placeholderTextColor="#64748b"
                      autoCapitalize="characters"
                      maxLength={15}
                      value={gstin}
                      onChangeText={(t) => setGstin(t.toUpperCase())}
                    />
                  </View>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>UPI ID (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="name@bank"
                      placeholderTextColor="#64748b"
                      autoCapitalize="none"
                      value={upiId}
                      onChangeText={setUpiId}
                    />
                  </View>
                </View>

                <View style={styles.gridTwo}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>Bank Account Holder Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Exact name on bank account"
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

                <View>
                  <Text style={styles.label}>Bank IFSC Code *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="SBIN0001234"
                    placeholderTextColor="#64748b"
                    autoCapitalize="characters"
                    maxLength={11}
                    value={bankIfsc}
                    onChangeText={(t) => setBankIfsc(t.toUpperCase())}
                  />
                </View>

                {/* KYC Document Uploads */}
                <Text style={styles.sectionTitle}>4. Required KYC Documents Upload</Text>
                <View style={styles.docsGrid}>
                  {renderUploadButton('photoUrl', 'Passport Profile Photo', photoUrl, setPhotoUrl, true)}
                  {renderUploadButton('panDocUrl', 'PAN Card Photo', panDocUrl, setPanDocUrl, true)}
                  {renderUploadButton('aadhaarDocUrl', 'Aadhaar Front Photo', aadhaarDocUrl, setAadhaarDocUrl, true)}
                  {renderUploadButton('aadhaarBackUrl', 'Aadhaar Back Photo', aadhaarBackUrl, setAadhaarBackUrl, false)}
                  {renderUploadButton('chequeDocUrl', 'Cancelled Cheque / Passbook', chequeDocUrl, setChequeDocUrl, true)}
                  {renderUploadButton(
                    'gstDocUrl',
                    'GST Registration Certificate',
                    gstDocUrl,
                    setGstDocUrl,
                    requestedRole === 'SELLER' && sellerType === 'COMMERCIAL',
                  )}
                </View>

                {/* Statutory Consent */}
                <TouchableOpacity
                  style={styles.consentRow}
                  onPress={() => setTermsAccepted((v) => !v)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={termsAccepted ? 'checkbox' : 'square-outline'}
                    size={21}
                    color={termsAccepted ? '#10b981' : '#64748b'}
                  />
                  <Text style={styles.consentText}>
                    I confirm all details and documents belong to me. I agree to FarmsKing Technologies Private Limited Partner Terms, statutory TDS (Sec 194-O / 194-H / 194-J), and GST Section 52 TCS compliance.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={busySubmit || Boolean(uploadingKey)}
                  style={[styles.primaryBtn, (busySubmit || Boolean(uploadingKey)) && { opacity: 0.65 }]}
                  activeOpacity={0.88}
                >
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.primaryBtnGrad}>
                    {busySubmit ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={[styles.primaryBtnText, { color: '#fff' }]}>
                        {existingApp?.status === 'REJECTED'
                          ? 'Save Changes & Resubmit Application'
                          : 'Submit Partner Application for Admin Approval'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* SUBMITTED CONFIRMATION SCREEN */}
            {step === 'SUBMITTED' && (
              <View style={styles.statusCard}>
                <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.16)' }]}>
                  <Ionicons name="checkmark-done-circle" size={40} color="#10b981" />
                </View>
                <Text style={styles.statusTitle}>Application Submitted Successfully</Text>
                <Text style={styles.statusDesc}>{submittedMessage}</Text>
                {existingUser?.kingId ? (
                  <Text style={[styles.statusMeta, { color: '#34d399', fontFamily: FONT.bold }]}>
                    Your existing King ID ({existingUser.kingId}) will be preserved upon Admin approval.
                  </Text>
                ) : null}
                <TouchableOpacity onPress={onClose} style={[styles.primaryBtn, { marginTop: 14, width: '100%' }]}>
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.primaryBtnGrad}>
                    <Text style={[styles.primaryBtnText, { color: '#fff' }]}>Done — Return to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 24 : 12,
    zIndex: 9999,
  },
  sheet: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%',
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#090e17',
    gap: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    marginBottom: 6,
  },
  headerBadgeText: { fontSize: 10, fontFamily: FONT.bold, color: '#fbbf24', letterSpacing: 0.6 },
  headerTitle: { fontSize: 18, fontFamily: FONT.bold, color: '#f8fafc' },
  headerSub: { fontSize: 12, fontFamily: FONT.regular, color: '#94a3b8', marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { padding: 20, gap: 14 },
  sectionTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#f8fafc', marginTop: 4 },
  helpText: { fontSize: 12.5, fontFamily: FONT.regular, color: '#94a3b8', lineHeight: 18 },
  label: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#cbd5e1', marginBottom: 4 },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
  },
  prefix: { color: '#fbbf24', fontFamily: FONT.bold, fontSize: 14, marginRight: 8 },
  textInput: {
    flex: 1,
    paddingVertical: 11,
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  gridTwo: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldCol: { flex: 1, minWidth: 230 },
  lookupBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  lookupBtnText: { color: '#fff', fontFamily: FONT.bold, fontSize: 12 },
  poChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  poChipActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.14)' },
  poChipText: { color: '#cbd5e1', fontSize: 11, fontFamily: FONT.medium },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  roleIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#f8fafc' },
  roleDesc: { fontSize: 11.5, fontFamily: FONT.regular, color: '#94a3b8', marginTop: 2 },
  roleBox: {
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    gap: 10,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  choiceBtnActive: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  choiceBtnText: { color: '#cbd5e1', fontSize: 11.5, fontFamily: FONT.bold, textAlign: 'center' },
  docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  docCard: {
    flex: 1,
    minWidth: 250,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 8,
  },
  docLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#f8fafc' },
  docSub: { fontSize: 10.5, fontFamily: FONT.regular, color: '#94a3b8', marginTop: 2 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  uploadBtnDone: { backgroundColor: '#16a34a' },
  uploadBtnText: { color: '#fff', fontSize: 11, fontFamily: FONT.bold },
  docThumb: { width: '100%', height: 90, borderRadius: RADIUS.sm, backgroundColor: '#0f172a' },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: RADIUS.md,
    padding: 12,
  },
  consentText: { flex: 1, fontSize: 11.5, fontFamily: FONT.medium, color: '#cbd5e1', lineHeight: 17 },
  primaryBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  primaryBtnGrad: { paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#e2e8f0', fontSize: 13, fontFamily: FONT.semiBold },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 12,
    borderRadius: RADIUS.md,
  },
  errorBannerText: { flex: 1, color: '#fecaca', fontSize: 12, fontFamily: FONT.medium },
  kingIdBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    padding: 12,
    borderRadius: RADIUS.md,
  },
  kingIdTitle: { color: '#34d399', fontSize: 12.5, fontFamily: FONT.bold },
  kingIdDesc: { color: '#d1fae5', fontSize: 11.5, fontFamily: FONT.regular, marginTop: 2, lineHeight: 16 },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: 12,
    borderRadius: RADIUS.md,
  },
  rejectedTitle: { color: '#fca5a5', fontSize: 13, fontFamily: FONT.bold },
  rejectedReason: { color: '#fee2e2', fontSize: 12, fontFamily: FONT.semiBold, marginTop: 2 },
  rejectedHint: { color: '#cbd5e1', fontSize: 11, fontFamily: FONT.regular, marginTop: 3 },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  devPillText: { color: '#a7f3d0', fontSize: 12, fontFamily: FONT.bold },
  devFillText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold, textDecorationLine: 'underline' },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  statusIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: { fontSize: 17, fontFamily: FONT.bold, color: '#f8fafc', textAlign: 'center' },
  statusDesc: { fontSize: 13, fontFamily: FONT.regular, color: '#cbd5e1', textAlign: 'center', lineHeight: 19 },
  statusMeta: { fontSize: 12, fontFamily: FONT.regular, color: '#94a3b8', textAlign: 'center', lineHeight: 17 },
});

