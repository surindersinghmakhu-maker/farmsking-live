import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { apiClient } from '@/src/api/client';
import { lookupPincode } from '@/src/api/pincode.api';
import * as ImagePicker from 'expo-image-picker';
import { RADIUS, FONT } from '@/constants/theme';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    activeProducts: 0,
    totalOrders: 0,
    pendingPayoutsAmount: 0,
    settledPayoutsAmount: 0,
    commissionRate: 10.0,
  });

  // Onboarding Wizard Step (1 to 5)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  // Seller Type: FARMER vs COMMERCIAL
  const [sellerType, setSellerType] = useState<'FARMER' | 'COMMERCIAL'>('FARMER');

  // Step 1: Business Identity & Brand Details
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [entityType, setEntityType] = useState<'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PVT_LTD' | 'INDIVIDUAL_FARMER'>('INDIVIDUAL_FARMER');
  const [legalName, setLegalName] = useState('');

  // Step 2: Legal & Tax Compliance & FSSAI
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [wantsToSellFood, setWantsToSellFood] = useState(false);
  const [fssaiNo, setFssaiNo] = useState('');
  const [fssaiExpiryDate, setFssaiExpiryDate] = useState('');
  const [agriLicenseNo, setAgriLicenseNo] = useState('');
  const [gstStateDetected, setGstStateDetected] = useState<string | null>(null);

  // Step 3: Bank Account & Live IFSC Auto-Lookup
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [confirmAccountNo, setConfirmAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [isIfscLoading, setIsIfscLoading] = useState(false);
  const [ifscDetails, setIfscDetails] = useState<{ bank: string; branch: string; city: string; state: string; address: string } | null>(null);
  const [ifscError, setIfscError] = useState<string | null>(null);

  // Step 4: Logistics & Pickup Warehouse Hub
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [pickupPostOffice, setPickupPostOffice] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  // Step 5: Document Uploads & Verification
  const [gstCertDoc, setGstCertDoc] = useState<string | null>(null);
  const [panCardDoc, setPanCardDoc] = useState<string | null>(null);
  const [chequeDoc, setChequeDoc] = useState<string | null>(null);
  const [aadhaarFrontDoc, setAadhaarFrontDoc] = useState<string | null>(null);
  const [aadhaarBackDoc, setAadhaarBackDoc] = useState<string | null>(null);
  const [fssaiCertDoc, setFssaiCertDoc] = useState<string | null>(null);
  const [tradeLicenseDoc, setTradeLicenseDoc] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Product Builder State with 4 Mandatory Photo Angles & Dimensional Metrics
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [newMrpPrice, setNewMrpPrice] = useState('');
  const [productCategorySlug, setProductCategorySlug] = useState<'bio-fertilizers' | 'handmade-products' | 'pesticides' | 'khad-spray' | 'food-products'>('bio-fertilizers');
  const [productCategory, setProductCategory] = useState('Bio & Organics');
  const [isFarmerMadeProduct, setIsFarmerMadeProduct] = useState(false);
  const [packSizes, setPackSizes] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('FarmsKing Certified');
  const [newUnit, setNewUnit] = useState('kg');
  const [stockQty, setStockQty] = useState('50');
  const [hsnCode, setHsnCode] = useState('120991');
  const [newGstRate, setNewGstRate] = useState('0%');

  // Dimensional Metrics Inputs (in cm & kg)
  const [deadWeightKg, setDeadWeightKg] = useState('0.5');
  const [lengthCm, setLengthCm] = useState('10');
  const [widthCm, setWidthCm] = useState('10');
  const [heightCm, setHeightCm] = useState('10');

  // Agri Technical Formulation & Dosage
  const [technicalName, setTechnicalName] = useState('');
  const [dosageInstructions, setDosageInstructions] = useState('');
  const [suitableCrops, setSuitableCrops] = useState('');
  const [targetPests, setTargetPests] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [newTargetCrop, setNewTargetCrop] = useState('');
  const [newTechnicalFormula, setNewTechnicalFormula] = useState('');
  const [newDosageInstructions, setNewDosageInstructions] = useState('');
  const [farmerProducerName, setFarmerProducerName] = useState('');
  const [harvestBatchDate, setHarvestBatchDate] = useState('');
  const [processingMethod, setProcessingMethod] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');

  // 4 Mandatory Photo Angles
  const [imageFrontUrl, setImageFrontUrl] = useState<string | null>(null);
  const [imageBackLabelUrl, setImageBackLabelUrl] = useState<string | null>(null);
  const [imageDosageUrl, setImageDosageUrl] = useState<string | null>(null);
  const [imageProductUrl, setImageProductUrl] = useState<string | null>(null);
  const [newProductImages, setNewProductImages] = useState<string[]>([]);

  const pickProductPhotos = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uris = res.assets.map((a) => (a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri));
        setNewProductImages((prev) => [...prev, ...uris]);
        if (uris[0] && !imageFrontUrl) setImageFrontUrl(uris[0]);
      }
    } catch (err) {
      showAlert('Photo Picker Error', 'Could not open image gallery.');
    }
  };

  const pickSingleImage = async (setter: (url: string) => void) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        const uri = res.assets[0].base64 ? `data:image/jpeg;base64,${res.assets[0].base64}` : res.assets[0].uri;
        setter(uri);
      }
    } catch (err) {
      showAlert('Photo Picker Error', 'Could not open image gallery.');
    }
  };

  const pickDocPhoto = pickSingleImage;

  // Live Dimensional Volumetric Weight & Billable Weight Calculation
  const parsedDeadWeight = parseFloat(deadWeightKg || '0.5');
  const parsedLength = parseFloat(lengthCm || '10');
  const parsedWidth = parseFloat(widthCm || '10');
  const parsedHeight = parseFloat(heightCm || '10');

  const volumetricWeightKg = (parsedLength * parsedWidth * parsedHeight) / 5000;
  const billableWeightKg = Math.max(parsedDeadWeight, volumetricWeightKg);
  const isCodAllowedAuto = !(productCategorySlug === 'khad-spray' || billableWeightKg >= 25);

  const resetProductForm = () => {
    setProductName('');
    setProductPrice('');
    setNewMrpPrice('');
    setProductCategorySlug('bio-fertilizers');
    setStockQty('50');
    setTechnicalName('');
    setDosageInstructions('');
    setSuitableCrops('');
    setTargetPests('');
    setBatchNumber('');
    setExpiryDate('');
    setImageFrontUrl(null);
    setImageBackLabelUrl(null);
    setImageDosageUrl(null);
    setImageProductUrl(null);
  };

  // Edit state for resubmitting rejected or modifying store
  const [isEditingRejected, setIsEditingRejected] = useState(false);

  useEffect(() => {
    fetchStoreData();
    restoreDraftLocal();
  }, []);

  const populateStoreFields = (data: any) => {
    if (!data) return;
    if (data.sellerType) setSellerType(data.sellerType);
    if (data.storeName) setStoreName(data.storeName);
    if (data.slug) setSlug(data.slug);
    if (data.legalName) setLegalName(data.legalName);
    if (data.gstin) setGstin(data.gstin);
    if (data.panNumber) setPanNumber(data.panNumber);
    if (data.wantsToSellFood !== undefined) setWantsToSellFood(data.wantsToSellFood);
    if (data.fssaiNo) setFssaiNo(data.fssaiNo);
    if (data.agriLicenseNo) setAgriLicenseNo(data.agriLicenseNo);
    if (data.bankAccountNo) setBankAccountNo(data.bankAccountNo);
    if (data.bankIfsc) setBankIfsc(data.bankIfsc);
    if (data.bankBeneficiaryName) setBankHolderName(data.bankBeneficiaryName);
    if (data.pickupAddress) setPickupAddress(data.pickupAddress);
    if (data.pickupCity) setPickupCity(data.pickupCity);
    if (data.pickupState) setPickupState(data.pickupState);
    if (data.pickupPincode) setPickupPincode(data.pickupPincode);
    if (data.gstDocUrl) setGstCertDoc(data.gstDocUrl);
    if (data.panDocUrl) setPanCardDoc(data.panDocUrl);
    if (data.chequeDocUrl) setChequeDoc(data.chequeDocUrl);
    if (data.aadhaarFrontUrl) setAadhaarFrontDoc(data.aadhaarFrontUrl);
    if (data.aadhaarBackUrl) setAadhaarBackDoc(data.aadhaarBackUrl);
    if (data.tradeLicenseUrl) setTradeLicenseDoc(data.tradeLicenseUrl);
  };

  const saveDraftLocal = (nextStep?: number) => {
    try {
      const draft = {
        sellerType,
        storeName,
        slug,
        entityType,
        legalName,
        gstin,
        panNumber,
        wantsToSellFood,
        fssaiNo,
        fssaiExpiryDate,
        agriLicenseNo,
        bankAccountNo,
        confirmAccountNo,
        bankIfsc,
        bankHolderName,
        pickupAddress,
        pickupPincode,
        pickupCity,
        pickupState,
        contactPerson,
        contactMobile,
        gstCertDoc,
        panCardDoc,
        chequeDoc,
        aadhaarFrontDoc,
        aadhaarBackDoc,
        tradeLicenseDoc,
        step: nextStep || step,
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('farmsking_seller_onboarding_draft', JSON.stringify(draft));
      }
    } catch (e) {
      // ignore
    }
  };

  const restoreDraftLocal = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('farmsking_seller_onboarding_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.sellerType) setSellerType(parsed.sellerType);
          if (parsed.storeName) setStoreName(parsed.storeName);
          if (parsed.slug) setSlug(parsed.slug);
          if (parsed.entityType) setEntityType(parsed.entityType);
          if (parsed.legalName) setLegalName(parsed.legalName);
          if (parsed.gstin) setGstin(parsed.gstin);
          if (parsed.panNumber) setPanNumber(parsed.panNumber);
          if (parsed.wantsToSellFood !== undefined) setWantsToSellFood(parsed.wantsToSellFood);
          if (parsed.fssaiNo) setFssaiNo(parsed.fssaiNo);
          if (parsed.agriLicenseNo) setAgriLicenseNo(parsed.agriLicenseNo);
          if (parsed.bankAccountNo) setBankAccountNo(parsed.bankAccountNo);
          if (parsed.bankIfsc) setBankIfsc(parsed.bankIfsc);
          if (parsed.bankHolderName) setBankHolderName(parsed.bankHolderName);
          if (parsed.pickupAddress) setPickupAddress(parsed.pickupAddress);
          if (parsed.pickupCity) setPickupCity(parsed.pickupCity);
          if (parsed.pickupState) setPickupState(parsed.pickupState);
          if (parsed.pickupPincode) setPickupPincode(parsed.pickupPincode);
          if (parsed.contactPerson) setContactPerson(parsed.contactPerson);
          if (parsed.contactMobile) setContactMobile(parsed.contactMobile);
          if (parsed.gstCertDoc) setGstCertDoc(parsed.gstCertDoc);
          if (parsed.panCardDoc) setPanCardDoc(parsed.panCardDoc);
          if (parsed.chequeDoc) setChequeDoc(parsed.chequeDoc);
          if (parsed.aadhaarFrontDoc) setAadhaarFrontDoc(parsed.aadhaarFrontDoc);
          if (parsed.aadhaarBackDoc) setAadhaarBackDoc(parsed.aadhaarBackDoc);
          if (parsed.tradeLicenseDoc) setTradeLicenseDoc(parsed.tradeLicenseDoc);
          if (parsed.step) setStep(parsed.step);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/seller/store/me');
      setStoreData(res.data);
      setHasStore(true);
      populateStoreFields(res.data);
      fetchStats();
    } catch (err: any) {
      setHasStore(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/seller/dashboard/stats');
      setStats(res.data);
    } catch (err: any) {
      console.log('Error fetching stats:', err);
    }
  };

  // Live IFSC Code Auto-Lookup via Razorpay Free Public API
  const handleIfscLookup = async (code: string) => {
    const formatted = code.trim().toUpperCase();
    setBankIfsc(formatted);
    setIfscError(null);
    setIfscDetails(null);

    if (formatted.length === 11) {
      try {
        setIsIfscLoading(true);
        const res = await fetch(`https://ifsc.razorpay.com/${formatted}`);
        if (res.ok) {
          const data = await res.json();
          setIfscDetails({
            bank: data.BANK,
            branch: data.BRANCH,
            city: data.CITY,
            state: data.STATE,
            address: data.ADDRESS,
          });
        } else {
          setIfscError('Invalid IFSC Code. Please check code on cheque leaf.');
        }
      } catch (err) {
        setIfscError('Could not verify IFSC code.');
      } finally {
        setIsIfscLoading(false);
      }
    }
  };

  // Live Pincode Lookup
  const handlePincodeLookup = async (code: string) => {
    setPickupPincode(code);
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      try {
        setIsPincodeLoading(true);
        const res = await lookupPincode(code);
        setPickupCity(res.postOffice && res.postOffice !== res.district ? `${res.postOffice}, ${res.district}` : res.district);
        setPickupState(res.state);
        setPickupPostOffice(res.postOffice);
      } catch (err) {
        // ignore
      } finally {
        setIsPincodeLoading(false);
      }
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleGstinChange = (val: string) => {
    const uppercase = val.trim().toUpperCase();
    setGstin(uppercase);

    if (uppercase.length >= 2) {
      const stateCode = uppercase.substring(0, 2);
      const stateMap: Record<string, string> = {
        '03': 'Punjab',
        '06': 'Haryana',
        '07': 'Delhi',
        '08': 'Rajasthan',
        '02': 'Himachal Pradesh',
        '01': 'Jammu & Kashmir',
        '09': 'Uttar Pradesh',
        '27': 'Maharashtra',
        '24': 'Gujarat',
        '10': 'Bihar',
        '19': 'West Bengal',
        '33': 'Tamil Nadu',
        '36': 'Telangana',
        '29': 'Karnataka',
        '37': 'Andhra Pradesh',
        '21': 'Odisha',
        '22': 'Chhattisgarh',
        '23': 'Madhya Pradesh',
        '05': 'Uttarakhand',
        '18': 'Assam',
      };
      setGstStateDetected(stateMap[stateCode] || 'Valid State GST Code');
    } else {
      setGstStateDetected(null);
    }

    if (uppercase.length >= 12) {
      const extractedPan = uppercase.substring(2, 12);
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extractedPan)) {
        setPanNumber(extractedPan);
      }
    }
  };

  const [showProductPreviewModal, setShowProductPreviewModal] = useState(false);

  const validateStep1 = () => {
    if (!storeName.trim()) {
      setErrors({ storeName: 'Store Name is required.' });
      showAlert('Required Field ⚠️', 'Please enter your Store / Brand Name.');
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const isFarmerProducer = sellerType === 'FARMER' || entityType === 'INDIVIDUAL_FARMER';

    // 1. GSTIN Validation: Optional for Farmer/Producer, Mandatory for Commercial Sellers
    if (!isFarmerProducer) {
      if (!gstin.trim()) {
        showAlert('GSTIN Required ⚠️', '15-Digit GSTIN Number is mandatory for Commercial Sellers.');
        return false;
      }
      if (gstin.trim().length !== 15) {
        showAlert('Invalid GSTIN ⚠️', 'Please enter a valid 15-Digit GSTIN Number.');
        return false;
      }
    } else {
      if (gstin.trim() && gstin.trim().length !== 15) {
        showAlert('Invalid GSTIN ⚠️', 'Please enter a valid 15-Digit GSTIN Number or leave it empty.');
        return false;
      }
    }

    // 2. PAN Number Validation
    if (!panNumber.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim())) {
      showAlert(
        'PAN Required ⚠️',
        isFarmerProducer
          ? 'Please enter a valid 10-Digit PAN Number.'
          : 'Please enter a valid 10-Digit Business PAN Number.'
      );
      return false;
    }

    // 3. FSSAI Validation if provided
    if (wantsToSellFood || fssaiNo.trim()) {
      if (fssaiNo.trim() && !/^\d{14}$/.test(fssaiNo.trim())) {
        showAlert('FSSAI Code Error ⚠️', 'FSSAI License Number must be a valid 14-digit numeric code.');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    if (!bankIfsc.trim() || bankIfsc.trim().length !== 11) {
      showAlert('IFSC Code Required ⚠️', 'Please enter a valid 11-character Bank IFSC code (e.g. SBIN0001234).');
      return false;
    }
    if (!bankAccountNo.trim()) {
      showAlert('Account Number Required ⚠️', 'Please enter your Bank Account Number.');
      return false;
    }
    if (confirmAccountNo.trim() && confirmAccountNo.trim() !== bankAccountNo.trim()) {
      showAlert('Account Number Mismatch ⚠️', 'Re-entered Bank Account Number does not match.');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!pickupPincode.trim() || !/^\d{6}$/.test(pickupPincode.trim())) {
      showAlert('Pincode Required ⚠️', 'Please enter a valid 6-digit Pickup Pincode.');
      return false;
    }
    if (!pickupAddress.trim()) {
      showAlert('Pickup Address Required ⚠️', 'Please enter your Full Pickup Warehouse Address.');
      return false;
    }
    if (!contactPerson.trim()) {
      showAlert('Dispatch Manager Required ⚠️', 'Please enter Dispatch Manager Name.');
      return false;
    }
    if (!contactMobile.trim() || !/^\d{10}$/.test(contactMobile.trim())) {
      showAlert('Dispatch Mobile Required ⚠️', 'Please enter a valid 10-digit Dispatch Manager Mobile Number.');
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    const isFarmerProducer = sellerType === 'FARMER' || entityType === 'INDIVIDUAL_FARMER';
    const isCommercial = sellerType === 'COMMERCIAL' || entityType !== 'INDIVIDUAL_FARMER';

    // 1. Cheque / Passbook Copy is mandatory for all payout nodal accounts
    if (!chequeDoc) {
      showAlert('Passbook / Cheque Copy Required ⚠️', 'Please upload a clear photo of your Bank Passbook / Cancelled Cheque for payout verification.');
      return false;
    }

    // 2. PAN Card photo mandatory for all sellers
    if (!panCardDoc) {
      showAlert('PAN Card Photo Required ⚠️', 'Please upload a clear photo of your PAN Card.');
      return false;
    }

    // 3. GST Certificate mandatory for Commercial sellers
    if (isCommercial && !gstCertDoc) {
      showAlert('GST Certificate Required ⚠️', 'Commercial Businesses must upload a copy of their GST Certificate.');
      return false;
    }

    // 4. Aadhaar Front Photo mandatory for Farmers
    if (isFarmerProducer && !aadhaarFrontDoc) {
      showAlert('Aadhaar Card Required ⚠️', 'Farmer Producers must upload Aadhaar Card Front Photo for identity verification.');
      return false;
    }

    if (!termsAccepted) {
      showAlert('Agreement Acceptance Required ⚠️', 'Please read and accept the 10% Platform Commission & Section 79 Intermediary Indemnity Agreement.');
      return false;
    }

    return true;
  };

  const handleFinalSubmission = async () => {
    if (!storeName.trim()) {
      setStep(1);
      setErrors({ storeName: 'Store Name is required.' });
      showAlert('Required Field ⚠️', 'Please enter your Store / Brand Name in Step 1.');
      return;
    }

    if (!validateStep2()) {
      setStep(2);
      return;
    }

    if (!validateStep3()) {
      setStep(3);
      return;
    }

    if (!validateStep4()) {
      setStep(4);
      return;
    }

    if (!validateStep5()) {
      setStep(5);
      return;
    }

    try {
      setLoading(true);
      const rawSlug = slug.trim() || storeName.trim().toLowerCase().replace(/\s+/g, '-');
      const autoSlug = rawSlug.replace(/[^a-z0-9-]/g, '') || `seller-${Date.now().toString(36)}`;

      const payload = {
        sellerType,
        storeName: storeName.trim(),
        slug: autoSlug,
        legalName: legalName.trim() || storeName.trim(),
        gstin: gstin.trim() || undefined,
        panNumber: panNumber.trim() || undefined,
        wantsToSellFood,
        fssaiNo: fssaiNo.trim() || undefined,
        fssaiCertificateUrl: fssaiCertDoc || undefined,
        fssaiExpiryDate: fssaiExpiryDate || undefined,
        agriLicenseNo: agriLicenseNo.trim() || undefined,
        bankAccountNo: bankAccountNo.trim() || undefined,
        bankIfsc: bankIfsc.trim() || undefined,
        bankBeneficiaryName: bankHolderName.trim() || storeName.trim(),
        pickupAddress: pickupAddress.trim() ? `${pickupAddress.trim()}${pickupPostOffice ? `, ${pickupPostOffice}` : ''}` : undefined,
        pickupCity: pickupCity.trim() || undefined,
        pickupState: pickupState.trim() || undefined,
        pickupPincode: pickupPincode.trim() || undefined,
        gstDocUrl: gstCertDoc || undefined,
        panDocUrl: panCardDoc || undefined,
        chequeDocUrl: chequeDoc || undefined,
        aadhaarFrontUrl: aadhaarFrontDoc || undefined,
        aadhaarBackUrl: aadhaarBackDoc || undefined,
        tradeLicenseUrl: tradeLicenseDoc || undefined,
      };

      if (storeData?.id) {
        await apiClient.patch('/seller/store/kyc', payload);
      } else {
        try {
          await apiClient.post('/seller/store', payload);
        } catch (postErr: any) {
          if (postErr?.response?.status === 409) {
            await apiClient.patch('/seller/store/kyc', payload);
          } else {
            throw postErr;
          }
        }
      }

      showAlert('🎉 Application Submitted!', 'Your Seller Store application has been submitted successfully for Admin review.');
      setIsEditingRejected(false);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('farmsking_seller_onboarding_draft');
        }
      } catch (e) {}
      await fetchStoreData();
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || 'Failed to submit seller registration.';
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;
      showAlert('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productName || !productPrice) {
      showAlert('Error ⚠️', 'Please enter Product Name and Price.');
      return;
    }

    const activeFssaiNo = storeData?.fssaiNo || fssaiNo;
    const activeAgriLicenseNo = storeData?.agriLicenseNo || agriLicenseNo;

    // FSSAI License Enforcement for Food Products
    const isFoodCategory = productCategorySlug === 'food-products';
    if (isFoodCategory && (!activeFssaiNo || !activeFssaiNo.trim())) {
      showAlert(
        'FSSAI License Required ⚠️',
        'FSSAI License No. must be filled in store settings to enter and list Food Products.'
      );
      return;
    }

    // Agri Inputs License Enforcement for Seeds & Pesticides
    const isAgriInputCategory = productCategorySlug === 'pesticides' || productCategorySlug === 'bio-fertilizers' || productCategorySlug === 'khad-spray';
    if (isAgriInputCategory && (!activeAgriLicenseNo || !activeAgriLicenseNo.trim())) {
      showAlert(
        'Agri Inputs License Required ⚠️',
        'Agri Inputs License No. (Seeds / Pesticide License) must be filled in store settings to select and list Seeds & Agrochemical Pesticides.'
      );
      return;
    }

    try {
      await apiClient.post('/products', {
        name: productName.trim(),
        price: parseFloat(productPrice),
        categorySlug: productCategorySlug,
        category: productCategorySlug,
        stockQty: parseInt(stockQty || '10', 10),
        hsnCode,
        sellerStoreId: storeData?.id,
        deadWeightKg: parsedDeadWeight,
        lengthCm: parsedLength,
        widthCm: parsedWidth,
        heightCm: parsedHeight,
        technicalName,
        dosageInstructions,
        suitableCrops,
        targetPests,
        batchNumber,
        expiryDate,
        imageFrontUrl,
        imageBackLabelUrl,
        imageDosageUrl,
        imageProductUrl,
      });

      showAlert('Success 🎉', 'Product added successfully! It is now under catalog review.');
      setShowAddProduct(false);
      resetProductForm();
      fetchStats();
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || 'Failed to add product.';
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;
      showAlert('Error', msg);
    }
  };


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading Seller Hub Ecosystem...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>🏪 National Seller Hub</Text>
          <Text style={styles.headerSub}>Amazon & Shopify Grade Vendor Portal</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchStoreData}>
          <Ionicons name="refresh" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!hasStore || isEditingRejected ? (
          /* Multi-Step International Seller Onboarding Wizard */
          <View style={styles.card}>
            {/* Step Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.wizardStepText}>STEP {step} OF 5</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(step / 5) * 100}%` }]} />
              </View>
            </View>

            {/* STEP 1: Business Identity & Brand Details */}
            {step === 1 && (
              <View>
                <View style={styles.stepHeaderRow}>
                  <MaterialCommunityIcons name="domain" size={26} color="#10B981" />
                  <Text style={styles.stepTitle}>1. Business Identity & Brand</Text>
                </View>

                <Text style={styles.inputLabel}>Select Entity Type *</Text>
                <View style={styles.entityRow}>
                  {[
                    { id: 'PROPRIETORSHIP', label: 'Proprietorship' },
                    { id: 'PARTNERSHIP', label: 'Partnership' },
                    { id: 'PVT_LTD', label: 'Pvt Ltd / LLP' },
                    { id: 'INDIVIDUAL_FARMER', label: 'Farmer Producer' },
                  ].map((ent) => (
                    <TouchableOpacity
                      key={ent.id}
                      style={[styles.entityChip, entityType === ent.id && styles.activeEntityChip]}
                      onPress={() => setEntityType(ent.id as any)}
                    >
                      <Text style={[styles.entityText, entityType === ent.id && styles.activeEntityText]}>
                        {ent.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Store / Brand Name *</Text>
                <TextInput
                  style={[styles.input, errors.storeName && styles.inputError]}
                  placeholder="e.g. Royal Punjab Seeds & Agro"
                  placeholderTextColor="#9CA3AF"
                  value={storeName}
                  onChangeText={(val) => {
                    setStoreName(val);
                    if (!slug) setSlug(val.toLowerCase().replace(/\s+/g, '-'));
                  }}
                />
                {errors.storeName ? <Text style={styles.errText}>{errors.storeName}</Text> : null}

                <Text style={styles.inputLabel}>Store Web Handle / Slug * (Unique Identifier)</Text>
                <TextInput
                  style={[styles.input, errors.slug && styles.inputError]}
                  placeholder="e.g. royal-punjab-seeds"
                  placeholderTextColor="#9CA3AF"
                  value={slug}
                  onChangeText={setSlug}
                />
                {errors.slug ? <Text style={styles.errText}>{errors.slug}</Text> : null}

                <Text style={styles.inputLabel}>Legal Registered Firm Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Royal Punjab Enterprises Private Limited"
                  placeholderTextColor="#9CA3AF"
                  value={legalName}
                  onChangeText={setLegalName}
                />

                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={() => {
                    if (validateStep1()) setStep(2);
                  }}
                >
                  <Text style={styles.nextBtnText}>Continue to Step 2: Legal & Tax ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Tax & Regulatory Compliance */}
            {step === 2 && (
              <View>
                <View style={styles.stepHeaderRow}>
                  <FontAwesome5 name="file-invoice-dollar" size={24} color="#10B981" />
                  <Text style={styles.stepTitle}>2. Tax & Legal Compliance</Text>
                </View>

                <Text style={styles.inputLabel}>
                  {sellerType === 'FARMER' || entityType === 'INDIVIDUAL_FARMER'
                    ? '15-Digit GSTIN Number (Optional for Farmer/Producer)'
                    : '15-Digit GSTIN Number *'}
                </Text>
                <TextInput
                  style={[styles.input, errors.gstin && styles.inputError]}
                  placeholder="03AAAAA0000A1Z5"
                  placeholderTextColor="#9CA3AF"
                  value={gstin}
                  onChangeText={handleGstinChange}
                  maxLength={15}
                  autoCapitalize="characters"
                />
                {gstStateDetected ? (
                  <View style={styles.verifiedBadgeRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.verifiedText}>State Detected: {gstStateDetected}</Text>
                  </View>
                ) : null}
                {errors.gstin ? <Text style={styles.errText}>{errors.gstin}</Text> : null}

                <Text style={styles.inputLabel}>
                  {sellerType === 'FARMER' || entityType === 'INDIVIDUAL_FARMER'
                    ? '10-Digit PAN Number *'
                    : '10-Digit Business PAN Number *'}
                </Text>
                <TextInput
                  style={[styles.input, errors.panNumber && styles.inputError]}
                  placeholder="ABCDE1234F"
                  placeholderTextColor="#9CA3AF"
                  value={panNumber}
                  onChangeText={(val) => setPanNumber(val.trim().toUpperCase())}
                  maxLength={10}
                  autoCapitalize="characters"
                />
                {errors.panNumber ? <Text style={styles.errText}>{errors.panNumber}</Text> : null}

                <Text style={styles.inputLabel}>FSSAI License No. (If Selling Foods / Organic Ghee/Honey)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="14-digit FSSAI License Number"
                  placeholderTextColor="#9CA3AF"
                  value={fssaiNo}
                  onChangeText={setFssaiNo}
                  keyboardType="number-pad"
                />

                <Text style={styles.inputLabel}>Agri Inputs License No. (Seeds / Pesticide License)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Department of Agriculture License Number"
                  placeholderTextColor="#9CA3AF"
                  value={agriLicenseNo}
                  onChangeText={setAgriLicenseNo}
                />

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(1)}>
                    <Text style={styles.prevBtnText}>⬅️ Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.nextBtn, { flex: 1, marginLeft: 10 }]}
                    onPress={() => {
                      if (validateStep2()) setStep(3);
                    }}
                  >
                    <Text style={styles.nextBtnText}>Continue to Step 3 ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: Bank Account & Live IFSC Auto-Lookup */}
            {step === 3 && (
              <View>
                <View style={styles.stepHeaderRow}>
                  <MaterialCommunityIcons name="bank" size={26} color="#10B981" />
                  <Text style={styles.stepTitle}>3. Bank Account & Live IFSC</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Cashfree Auto-Payout Nodal Account integration for direct daily earnings transfers.
                </Text>

                <Text style={styles.inputLabel}>11-Digit Bank IFSC Code (e.g. SBIN0001234) *</Text>
                <View style={styles.inputWithLoader}>
                  <TextInput
                    style={[styles.input, { flex: 1 }, errors.bankIfsc && styles.inputError]}
                    placeholder="SBIN0001234"
                    placeholderTextColor="#9CA3AF"
                    value={bankIfsc}
                    onChangeText={handleIfscLookup}
                    maxLength={11}
                    autoCapitalize="characters"
                  />
                  {isIfscLoading && <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 8 }} />}
                </View>
                {ifscError ? <Text style={styles.errText}>{ifscError}</Text> : null}

                {/* Auto-Fetched Bank Branch Card */}
                {ifscDetails && (
                  <View style={styles.bankBranchCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text style={styles.bankBranchName}>{ifscDetails.bank}</Text>
                    </View>
                    <Text style={styles.bankBranchSub}>Branch: {ifscDetails.branch}, {ifscDetails.city}</Text>
                    <Text style={styles.bankBranchSub}>Address: {ifscDetails.address}</Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Bank Account Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456789012"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={bankAccountNo}
                  onChangeText={setBankAccountNo}
                  secureTextEntry={false}
                />

                <Text style={styles.inputLabel}>Re-Enter Bank Account Number *</Text>
                <TextInput
                  style={[styles.input, errors.confirmAccountNo && styles.inputError]}
                  placeholder="Re-enter to confirm"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={confirmAccountNo}
                  onChangeText={setConfirmAccountNo}
                />
                {errors.confirmAccountNo ? <Text style={styles.errText}>{errors.confirmAccountNo}</Text> : null}

                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="As printed on Passbook / Cheque"
                  placeholderTextColor="#9CA3AF"
                  value={bankHolderName}
                  onChangeText={setBankHolderName}
                />

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(2)}>
                    <Text style={styles.prevBtnText}>⬅️ Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.nextBtn, { flex: 1, marginLeft: 10 }]}
                    onPress={() => {
                      if (validateStep3()) setStep(4);
                    }}
                  >
                    <Text style={styles.nextBtnText}>Continue to Step 4 ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 4: Logistics & Pickup Warehouse Hub */}
            {step === 4 && (
              <View>
                <View style={styles.stepHeaderRow}>
                  <FontAwesome5 name="shipping-fast" size={22} color="#10B981" />
                  <Text style={styles.stepTitle}>4. Pickup Warehouse Hub</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Shiprocket Multi-Origin courier pickup location for automated dispatch.
                </Text>

                <Text style={styles.inputLabel}>6-Digit Pickup Pincode *</Text>
                <View style={styles.inputWithLoader}>
                  <TextInput
                    style={[styles.input, { flex: 1 }, errors.pickupPincode && styles.inputError]}
                    placeholder="141001"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={pickupPincode}
                    onChangeText={handlePincodeLookup}
                    maxLength={6}
                  />
                  {isPincodeLoading && <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 8 }} />}
                </View>
                {errors.pickupPincode ? <Text style={styles.errText}>{errors.pickupPincode}</Text> : null}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>City / District</Text>
                    <TextInput style={styles.input} value={pickupCity} onChangeText={setPickupCity} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>State</Text>
                    <TextInput style={styles.input} value={pickupState} onChangeText={setPickupState} />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Full Pickup Warehouse Address</Text>
                <TextInput
                  style={[styles.input, { height: 70 }]}
                  placeholder="Street, Building No, Industrial Area / Village"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                />

                <Text style={styles.inputLabel}>Dispatch Manager Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contact Person Name"
                  placeholderTextColor="#9CA3AF"
                  value={contactPerson}
                  onChangeText={setContactPerson}
                />

                <Text style={styles.inputLabel}>Dispatch Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit Mobile Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={contactMobile}
                  onChangeText={setContactMobile}
                />

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(3)}>
                    <Text style={styles.prevBtnText}>⬅️ Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.nextBtn, { flex: 1, marginLeft: 10 }]}
                    onPress={() => {
                      if (validateStep4()) setStep(5);
                    }}
                  >
                    <Text style={styles.nextBtnText}>Continue to Step 5 ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 5: Document Uploads & Agreement Submission */}
            {step === 5 && (
              <View>
                <View style={styles.stepHeaderRow}>
                  <MaterialCommunityIcons name="file-certificate" size={26} color="#10B981" />
                  <Text style={styles.stepTitle}>5. Documents & Final Agreement</Text>
                </View>

                {/* Upload Buttons */}
                <Text style={styles.inputLabel}>
                  Upload Cancelled Cheque / Bank Passbook Copy * Mandatory
                </Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocPhoto(setChequeDoc)}>
                  <Ionicons name={chequeDoc ? 'checkmark-circle' : 'cloud-upload-outline'} size={24} color="#10B981" />
                  <Text style={styles.uploadText}>{chequeDoc ? 'Bank Cheque/Passbook Attached' : 'Select Photo from Gallery'}</Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>
                  Upload PAN Card Photo * Mandatory
                </Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocPhoto(setPanCardDoc)}>
                  <Ionicons name={panCardDoc ? 'checkmark-circle' : 'cloud-upload-outline'} size={24} color="#10B981" />
                  <Text style={styles.uploadText}>{panCardDoc ? 'PAN Card Photo Attached' : 'Select Photo from Gallery'}</Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>
                  Upload GST Certificate {sellerType === 'FARMER' || entityType === 'INDIVIDUAL_FARMER' ? '(Optional for Farmer/Producer)' : '* Mandatory'}
                </Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocPhoto(setGstCertDoc)}>
                  <Ionicons name={gstCertDoc ? 'checkmark-circle' : 'cloud-upload-outline'} size={24} color="#10B981" />
                  <Text style={styles.uploadText}>{gstCertDoc ? 'GST Certificate Attached' : 'Select Photo from Gallery'}</Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>
                  Upload Aadhaar Card Front Photo {sellerType === 'FARMER' || entityType === 'INDIVIDUAL_FARMER' ? '* Mandatory for Farmer Identity' : '(Optional)'}
                </Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocPhoto(setAadhaarFrontDoc)}>
                  <Ionicons name={aadhaarFrontDoc ? 'checkmark-circle' : 'cloud-upload-outline'} size={24} color="#10B981" />
                  <Text style={styles.uploadText}>{aadhaarFrontDoc ? 'Aadhaar Front Photo Attached' : 'Select Photo from Gallery'}</Text>
                </TouchableOpacity>

                {/* Interactive Agreement Trigger Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#1e293b',
                    padding: 12,
                    borderRadius: RADIUS.md,
                    marginVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => setShowAgreementModal(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="document-text" size={20} color="#10b981" />
                    <Text style={{ color: '#FFF', fontSize: 12, fontFamily: FONT.bold }}>
                      📄 Read Full 10% Commission & Section 79 Indemnity Bond
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>

                {/* Seller Agreement Checkbox */}
                <TouchableOpacity
                  style={styles.agreementRow}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={termsAccepted ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={termsAccepted ? '#10B981' : '#6B7280'}
                  />
                  <Text style={styles.agreementText}>
                    I accept FarmsKing Code of Conduct, 10% Platform Commission Terms & Section 79 IT Act Intermediary Safe Harbor & Statutory Indemnity Bond.
                  </Text>
                </TouchableOpacity>

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(4)}>
                    <Text style={styles.prevBtnText}>⬅️ Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primarySubmitBtn, { flex: 1, marginLeft: 10 }]}
                    onPress={handleFinalSubmission}
                  >
                    <Text style={styles.primarySubmitBtnText}>🚀 SUBMIT SELLER REGISTRATION</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* FULL SELLER AGREEMENT & INDEMNITY BOND MODAL */}
            <Modal visible={showAgreementModal} transparent animationType="slide" onRequestClose={() => setShowAgreementModal(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 }}>
                <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 16, maxHeight: '90%', borderWidth: 1, borderColor: '#374151' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#374151', paddingBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                      <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>FarmsKing Seller Merchant Agreement & Indemnity</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowAgreementModal(false)}>
                      <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={true} style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                      📜 STATUTORY MERCHANT AGREEMENT & INDEMNIFICATION BOND
                    </Text>

                    <Text style={{ color: '#D1D5DB', fontSize: 11, lineHeight: 17, marginBottom: 10 }}>
                      This Agreement is entered into between FarmsKing E-Commerce Marketplace ("Platform") and the Registering Vendor/Farmer Producer ("Seller"). By registering as a seller, you explicitly agree to the following legally binding terms:
                    </Text>

                    <Text style={{ color: '#FBBF24', fontSize: 11.5, fontWeight: '700', marginTop: 6 }}>
                      1. Section 79 IT Act 2000 Intermediary Safe Harbor & Statutory Indemnity
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 10.5, lineHeight: 16, marginBottom: 8 }}>
                      FarmsKing operates as a neutral marketplace intermediary under Section 79 of the Information Technology Act, 2000. Seller warrants that all listed products, seeds, organic inputs, and farm produce are authentic, legally owned, and strictly compliant with the Seeds Act 1966, Insecticides Act 1968, PPV&FR Act 2001, and FSSAI rules. Seller hereby assumes sole legal responsibility for product efficacy, seed germination, and quality, and agrees to fully indemnify, defend, and hold harmless FarmsKing, its Directors, Admins, and Officers against any legal claims, consumer complaints, or regulatory proceedings.
                    </Text>

                    <Text style={{ color: '#FBBF24', fontSize: 11.5, fontWeight: '700', marginTop: 6 }}>
                      2. 10% Platform Commission & Daily Automatic Cashfree Payouts
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 10.5, lineHeight: 16, marginBottom: 8 }}>
                      FarmsKing charges a standard 10% platform commission on settled customer orders. Net seller earnings (90%) are credited automatically to the seller's registered nodal bank account via Cashfree Payout API after order delivery confirmation.
                    </Text>

                    <Text style={{ color: '#FBBF24', fontSize: 11.5, fontWeight: '700', marginTop: 6 }}>
                      3. Quality Assurance & Auto-Block Governance Policy
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 10.5, lineHeight: 16, marginBottom: 8 }}>
                      Products receiving 3 consecutive reviews rated ≤ 2 stars will be automatically suspended. If a seller accumulates 2 or more suspended products, the seller store will be deactivated pending mandatory KYC re-approval by Admin.
                    </Text>

                    <Text style={{ color: '#FBBF24', fontSize: 11.5, fontWeight: '700', marginTop: 6 }}>
                      4. Truthfulness & Authenticity Warranties
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 10.5, lineHeight: 16, marginBottom: 8 }}>
                      Seller affirms under penalty of perjury that all uploaded documents (Aadhaar, PAN, GST, Passbook, Licenses) are authentic, accurate, and belong to the registering individual or business entity.
                    </Text>
                  </ScrollView>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#10B981',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setTermsAccepted(true);
                      setShowAgreementModal(false);
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 12.5, fontWeight: '700' }}>
                      ✅ I Have Read, Understood & Accept All Terms
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        ) : (
          /* Active Seller Dashboard */
          <>
            {/* Rejection Alert Box */}
            {storeData?.kycStatus === 'REJECTED' && (
              <View style={styles.rejectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="alert-circle" size={24} color="#EF4444" />
                  <Text style={styles.rejectionTitle}>Application Rejected by Admin</Text>
                </View>
                <Text style={styles.rejectionReasonText}>
                  <Text style={{ fontWeight: '700', color: '#FCA5A5' }}>Reason: </Text>
                  {storeData?.rejectionReason || 'Uploaded documents or store details require correction.'}
                </Text>
                <TouchableOpacity
                  style={styles.resubmitBtn}
                  onPress={() => {
                    populateStoreFields(storeData);
                    setIsEditingRejected(true);
                    setStep(1);
                  }}
                >
                  <Ionicons name="refresh-circle-outline" size={20} color="#FFF" />
                  <Text style={styles.resubmitBtnText}> ✏️ Edit & Resubmit Application</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pending Admin Verification Notice Card */}
            {(storeData?.kycStatus === 'SUBMITTED' || storeData?.kycStatus === 'PENDING' || storeData?.kycStatus === 'UNVERIFIED') && (
              <View style={[styles.card, { backgroundColor: '#111827', borderColor: '#374151', borderWidth: 1, marginBottom: 20 }]}>
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <MaterialCommunityIcons name="clock-outline" size={56} color="#F59E0B" />
                  <Text style={{ color: '#FBBF24', fontSize: 18, fontWeight: '800', marginTop: 10, textAlign: 'center' }}>
                    ⏳ Application Under Official Review
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>
                    Waiting for KYC Verification by FarmsKing Admin. Your store registration details and uploaded business documents (GST/PAN/Bank details) have been received officially.
                  </Text>

                  <View style={{ backgroundColor: '#1F2937', padding: 12, borderRadius: 8, width: '100%', marginTop: 14, borderWidth: 1, borderColor: '#374151' }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>🏪 Store Name: <Text style={{ color: '#FFF', fontWeight: '700' }}>{storeData?.storeName}</Text></Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>🏢 Registered Legal Firm: <Text style={{ color: '#FFF', fontWeight: '700' }}>{storeData?.legalName || storeData?.storeName}</Text></Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>📋 Status: <Text style={{ color: '#F59E0B', fontWeight: '800' }}>Waiting for KYC Verification by FarmsKing Admin</Text></Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={{ backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={fetchStoreData}>
                      <Ionicons name="refresh" size={16} color="#FFF" />
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12.5 }}>Check Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: '#374151', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => { populateStoreFields(storeData); setIsEditingRejected(true); setStep(1); }}>
                      <Ionicons name="create-outline" size={16} color="#FFF" />
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12.5 }}>Edit Application</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Store Profile Card */}
            <View style={styles.storeCard}>
              <View style={styles.storeRow}>
                <View style={styles.storeAvatar}>
                  <Text style={styles.avatarText}>{storeData?.storeName?.charAt(0) || 'S'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeNameText}>{storeData?.storeName}</Text>
                  <Text style={styles.slugText}>farmsking.in/store/{storeData?.slug}</Text>
                </View>

                <View
                  style={[
                    styles.kycBadge,
                    {
                      backgroundColor:
                        storeData?.kycStatus === 'VERIFIED'
                          ? '#065F46'
                          : storeData?.kycStatus === 'REJECTED'
                            ? '#991B1B'
                            : '#92400E',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      storeData?.kycStatus === 'VERIFIED'
                        ? 'checkmark-circle'
                        : storeData?.kycStatus === 'REJECTED'
                          ? 'close-circle'
                          : 'time'
                    }
                    size={14}
                    color="#FFF"
                  />
                  <Text style={styles.kycText}>{storeData?.kycStatus || 'PENDING'}</Text>
                </View>
              </View>
            </View>

            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { borderColor: '#10B981' }]}>
                <MaterialCommunityIcons name="cube-outline" size={24} color="#10B981" />
                <Text style={styles.kpiValue}>{stats.activeProducts}</Text>
                <Text style={styles.kpiLabel}>Active Products</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: '#3B82F6' }]}>
                <MaterialCommunityIcons name="cart-check" size={24} color="#3B82F6" />
                <Text style={styles.kpiValue}>{stats.totalOrders}</Text>
                <Text style={styles.kpiLabel}>Total Orders</Text>
              </View>
            </View>

            <View style={styles.kpiGrid}>
              <TouchableOpacity
                style={[styles.kpiCard, { borderColor: '#F59E0B' }]}
                onPress={() => router.push('/seller-payouts')}
              >
                <FontAwesome5 name="wallet" size={20} color="#F59E0B" />
                <Text style={styles.kpiValue}>₹{stats.pendingPayoutsAmount}</Text>
                <Text style={styles.kpiLabel}>Pending Payouts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.kpiCard, { borderColor: '#8B5CF6' }]}
                onPress={() => router.push('/seller-payouts')}
              >
                <FontAwesome5 name="hand-holding-usd" size={20} color="#8B5CF6" />
                <Text style={styles.kpiValue}>₹{stats.settledPayoutsAmount}</Text>
                <Text style={styles.kpiLabel}>Settled Earnings</Text>
              </TouchableOpacity>
            </View>

            {/* Action Bar & Quick Catalog Link */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              <TouchableOpacity
                style={[styles.addProductBtn, { flex: 1 }]}
                onPress={() => setShowAddProduct(!showAddProduct)}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color="#FFF" />
                <Text style={styles.addProductBtnText}>
                  {showAddProduct ? 'Close Builder' : '+ Premium Product Builder'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addProductBtn, { backgroundColor: '#1E40AF', paddingHorizontal: 12 }]}
                onPress={() => router.push('/(tabs)/shop')}
              >
                <Ionicons name="storefront-outline" size={18} color="#FFF" />
                <Text style={styles.addProductBtnText}>Go to SK Store</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Amazon-Style Add Product Builder Form */}
            {showAddProduct && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.cardTitle}>📦 Amazon-Grade Product Builder</Text>
                  <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                    <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* 1. NON-GST SELLER COMPLIANCE BANNER */}
                {!storeData?.gstin ? (
                  <View style={{ backgroundColor: '#064E3B', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#10B981' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="leaf" size={18} color="#34D399" />
                      <Text style={{ color: '#34D399', fontSize: 13, fontWeight: '800' }}>🌾 Non-GST Local Farmer Mode Active</Text>
                    </View>
                    <Text style={{ color: '#D1D5DB', fontSize: 11.5, marginTop: 4, lineHeight: 16 }}>
                      You are listing as a Non-GST seller. Products are restricted to 100% Tax-Exempt Local Organic Foods & Fresh Farm Produce.
                    </Text>
                  </View>
                ) : null}

                {/* 2. FSSAI FOOD LICENSE NOTICE */}
                {isFarmerMadeProduct || productCategory.includes('Food') ? (
                  <View style={{ backgroundColor: storeData?.fssaiNo ? '#065F46' : '#78350F', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: storeData?.fssaiNo ? '#10B981' : '#F59E0B' }}>
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                      {storeData?.fssaiNo ? `✅ FSSAI Licensed Seller (${storeData.fssaiNo}): National Delivery Active` : '⚠️ No FSSAI Food License Attached: Restricted to Intra-State Local Delivery'}
                    </Text>
                  </View>
                ) : null}

                {/* 3. MULTI-PHOTO GALLERY UPLOAD */}
                <Text style={styles.inputLabel}>Product Gallery Photos (Select Multiple) *</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={pickProductPhotos}>
                  <Ionicons name="images-outline" size={24} color="#10B981" />
                  <Text style={styles.uploadText}>
                    {newProductImages.length > 0 ? `Attach ${newProductImages.length} Photo(s)` : 'Browse & Upload Photos from Gallery'}
                  </Text>
                </TouchableOpacity>

                {newProductImages.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                    {newProductImages.map((img, idx) => (
                      <View key={idx} style={{ position: 'relative', marginRight: 8 }}>
                        <Image source={{ uri: img }} style={{ width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#10B981' }} />
                        <TouchableOpacity
                          style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, padding: 2 }}
                          onPress={() => setNewProductImages(newProductImages.filter((_, i) => i !== idx))}
                        >
                          <Ionicons name="close" size={12} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : null}

                {/* 4. PRODUCT NAME */}
                <Text style={styles.inputLabel}>Product Title / Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Pure Organic Desi Sugarcane Jaggery (Gur)"
                  placeholderTextColor="#9CA3AF"
                  value={productName}
                  onChangeText={setProductName}
                />

                {/* 5. BRAND SELECTOR */}
                <Text style={styles.inputLabel}>Brand / Producer</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
                  {['FarmsKing Certified', 'Syngenta', 'Bayer CropScience', 'UPL Ltd', 'Tata Rallis', 'IFFCO', 'Natural Farmer Direct'].map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.entityChip, newBrand === b && styles.activeEntityChip]}
                      onPress={() => setNewBrand(b)}
                    >
                      <Text style={[styles.entityText, newBrand === b && styles.activeEntityText]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 6. CATEGORY & SUBCATEGORY SELECTOR */}
                <Text style={styles.inputLabel}>Primary Category *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
                  {!storeData?.gstin ? (
                    ['Natural Farmer Foods', 'Farmer Made Foods', 'Farm-Saved Seeds (Desi Seeds)', 'Bio & Organics (Vermicompost/Neem Cake)', 'Raw Farm Produce & Grains'].map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.entityChip, productCategory === c && styles.activeEntityChip]}
                        onPress={() => {
                          setProductCategory(c);
                          setIsFarmerMadeProduct(c.includes('Food') || c.includes('Produce'));
                        }}
                      >
                        <Text style={[styles.entityText, productCategory === c && styles.activeEntityText]}>🌾 {c}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    ['Seeds', 'Fertilizers', 'Crop Protection', 'Farm Machinery & Tools', 'Bio & Organics', 'Natural Farmer Foods'].map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.entityChip, productCategory === c && styles.activeEntityChip]}
                        onPress={() => {
                          const activeAgriLicenseNo = storeData?.agriLicenseNo || agriLicenseNo;

                          if (c.includes('Protection') && (!activeAgriLicenseNo || !activeAgriLicenseNo.trim())) {
                            showAlert('Agri Inputs License Required ⚠️', 'Agri Inputs License No. (Pesticide License) must be filled in store settings to select Chemical Crop Protection.');
                            return;
                          }

                          setProductCategory(c);
                          setIsFarmerMadeProduct(c.includes('Food'));
                        }}
                      >
                        <Text style={[styles.entityText, productCategory === c && styles.activeEntityText]}>{c}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                {/* 7. PRICES & MRP */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 450"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={productPrice}
                      onChangeText={setProductPrice}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>List MRP (₹) (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 600"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={newMrpPrice}
                      onChangeText={setNewMrpPrice}
                    />
                  </View>
                </View>

                {/* 8. PACK SIZE VARIANTS */}
                <Text style={styles.inputLabel}>Pack Size Variants (Available Sizes)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
                  {['250 ml', '500 ml', '1 Litre', '5 Litres', '500 gram', '1 Kg', '5 Kg', '25 Kg Bag', '50 Kg Bag'].map((sz) => {
                    const isSelected = packSizes.includes(sz);
                    return (
                      <TouchableOpacity
                        key={sz}
                        style={[styles.entityChip, isSelected && styles.activeEntityChip]}
                        onPress={() => {
                          if (isSelected) setPackSizes(packSizes.filter((s) => s !== sz));
                          else setPackSizes([...packSizes, sz]);
                        }}
                      >
                        <Text style={[styles.entityText, isSelected && styles.activeEntityText]}>{sz}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 9. GST % & HSN CODE */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>GST Tax Rate</Text>
                    <TextInput style={styles.input} value={storeData?.gstin ? newGstRate : 'Exempt (0%)'} onChangeText={setNewGstRate} editable={Boolean(storeData?.gstin)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>HSN Code</Text>
                    <TextInput style={styles.input} value={hsnCode} onChangeText={setHsnCode} placeholder="120991" placeholderTextColor="#9CA3AF" />
                  </View>
                </View>

                {/* 10. STOCK & UNIT */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Stock Quantity</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={stockQty} onChangeText={setStockQty} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Unit of Measure</Text>
                    <TextInput style={styles.input} value={newUnit} onChangeText={setNewUnit} placeholder="bag / kg / litre" placeholderTextColor="#9CA3AF" />
                  </View>
                </View>

                {/* 11. TARGET CROP & TECHNICAL FORMULA */}
                <Text style={styles.inputLabel}>Target Crop</Text>
                <TextInput style={styles.input} value={newTargetCrop} onChangeText={setNewTargetCrop} placeholder="e.g. Wheat, Cotton, Sugarcane, Vegetables" placeholderTextColor="#9CA3AF" />

                <Text style={styles.inputLabel}>Technical Formula / Active Ingredients (Optional)</Text>
                <TextInput style={styles.input} value={newTechnicalFormula} onChangeText={setNewTechnicalFormula} placeholder="e.g. Neem Oil 10000 PPM" placeholderTextColor="#9CA3AF" />

                <Text style={styles.inputLabel}>Dosage Instructions per Acre (Optional)</Text>
                <TextInput style={styles.input} value={newDosageInstructions} onChangeText={setNewDosageInstructions} placeholder="e.g. 250 ml per acre in 150L water" placeholderTextColor="#9CA3AF" />

                {/* 12. NATURAL FARMER FOOD DETAILS */}
                {isFarmerMadeProduct ? (
                  <View style={{ backgroundColor: '#111827', borderRadius: 8, padding: 10, marginVertical: 8, borderWidth: 1, borderColor: '#059669' }}>
                    <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>🌾 Natural Farmer Food Compliance Details</Text>

                    <Text style={styles.inputLabel}>Producer / Farmer Name</Text>
                    <TextInput style={styles.input} value={farmerProducerName} onChangeText={setFarmerProducerName} placeholder="Direct Farmer Name" placeholderTextColor="#9CA3AF" />

                    <Text style={styles.inputLabel}>Harvest / Batch Date</Text>
                    <TextInput style={styles.input} value={harvestBatchDate} onChangeText={setHarvestBatchDate} placeholder="e.g. Harvested Sept 2026" placeholderTextColor="#9CA3AF" />

                    <Text style={styles.inputLabel}>Processing Method</Text>
                    <TextInput style={styles.input} value={processingMethod} onChangeText={setProcessingMethod} placeholder="Cold-Pressed / Traditional Kohlu" placeholderTextColor="#9CA3AF" />
                  </View>
                ) : null}

                {/* 13. FULL DESCRIPTION */}
                <Text style={styles.inputLabel}>Full Product Description</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Enter detailed benefits, usage guide, and storage instructions..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={newProductDescription}
                  onChangeText={setNewProductDescription}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, backgroundColor: '#3B82F6' }]}
                    onPress={() => setShowProductPreviewModal(true)}
                  >
                    <Ionicons name="eye-outline" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}> 👁 Live Customer View Preview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleAddProduct}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}> Save Product to Store</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* LIVE CUSTOMER PRODUCT PREVIEW MODAL */}
            <Modal visible={showProductPreviewModal} transparent animationType="slide" onRequestClose={() => setShowProductPreviewModal(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 }}>
                <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 16, maxHeight: '90%', borderWidth: 1, borderColor: '#374151' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#374151', paddingBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="eye" size={20} color="#10B981" />
                      <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Customer Live View Preview</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowProductPreviewModal(false)}>
                      <Ionicons name="close-circle" size={26} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Simulated Product Card */}
                    <View style={{ backgroundColor: '#1F2937', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#374151' }}>
                      {/* Product Image & Overlay Badges */}
                      <View style={{ height: 200, backgroundColor: '#374151', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                        {imageFrontUrl || newProductImages[0] ? (
                          <Image source={{ uri: imageFrontUrl || newProductImages[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <View style={{ alignItems: 'center' }}>
                            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>No Image Attached</Text>
                          </View>
                        )}

                        {/* Visual Highlighting Badges on Photo */}
                        <View style={{ position: 'absolute', top: 8, left: 8, flexDirection: 'column', gap: 4 }}>
                          {productCategorySlug === 'food-products' && (
                            <View style={{ backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>🥦 Pure Food Product</Text>
                            </View>
                          )}
                          {(productCategorySlug === 'pesticides' || productCategorySlug === 'bio-fertilizers') && (
                            <View style={{ backgroundColor: '#D97706', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>🌾 Organic / Bio Formula</Text>
                            </View>
                          )}
                          {newBrand === 'FarmsKing Certified' && (
                            <View style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>👑 FarmsKing Direct</Text>
                            </View>
                          )}
                        </View>

                        <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                          <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>⭐ 4.0 Top Rated</Text>
                        </View>
                      </View>

                      {/* Details Content */}
                      <View style={{ padding: 14 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' }}>{newBrand || storeData?.storeName}</Text>
                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800', marginVertical: 4 }}>{productName || 'Untitled Product'}</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginVertical: 6 }}>
                          <Text style={{ color: '#10B981', fontSize: 20, fontWeight: '900' }}>₹{productPrice || '0'}</Text>
                          {newMrpPrice ? <Text style={{ color: '#9CA3AF', fontSize: 14, textDecorationLine: 'line-through' }}>₹{newMrpPrice}</Text> : null}
                          <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '700' }}>Per {newUnit || 'unit'}</Text>
                        </View>

                        {/* Logistics Metric */}
                        <View style={{ backgroundColor: '#111827', borderRadius: 8, padding: 8, marginVertical: 6 }}>
                          <Text style={{ color: '#D1D5DB', fontSize: 11 }}>📦 Billable Express Weight: <Text style={{ color: '#F59E0B', fontWeight: '700' }}>{billableWeightKg.toFixed(2)} kg</Text></Text>
                          <Text style={{ color: '#D1D5DB', fontSize: 11, marginTop: 2 }}>
                            🚚 Delivery Rule: {isCodAllowedAuto ? '✅ COD Available' : '⚠️ Online Payment Only (Heavy SKU / Khad)'}
                          </Text>
                        </View>

                        {/* Technical info if chemical/seed */}
                        {technicalName ? (
                          <Text style={{ color: '#A7F3D0', fontSize: 12, marginVertical: 4 }}>🧪 Technical: {technicalName}</Text>
                        ) : null}

                        {/* Seller Trust Tag */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                          <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>🛡️ Trusted Seller: {storeData?.storeName || 'Verified Vendor'}</Text>
                        </View>

                        {/* Legal Intermediary Disclaimer Banner */}
                        <View style={{ backgroundColor: '#374151', borderRadius: 8, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#4B5563' }}>
                          <Text style={{ color: '#F3F4F6', fontSize: 11, fontWeight: '700', marginBottom: 2 }}>⚖️ Platform Legal Intermediary Disclaimer</Text>
                          <Text style={{ color: '#9CA3AF', fontSize: 10, lineHeight: 14 }}>
                            FarmsKing is an e-commerce marketplace platform connecting independent verified sellers with buyers. Efficacy, germination rates, and crop yield outcomes are the sole responsibility of the brand/seller under Section 79 of IT Act 2000.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>

                  <TouchableOpacity
                    style={{ backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 }}
                    onPress={() => setShowProductPreviewModal(false)}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>Looks Satisfactory! Return to Editing</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Compliance Note */}
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.infoTitle}>Cashfree Nodal Split & 1% GST TCS Active</Text>
                <Text style={styles.infoDesc}>
                  FarmsKing Platform Fee: {stats.commissionRate}% | 1% GST TCS tax automatically deducted & filed for your GSTR-8 returns.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F17' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F17' },
  loadingText: { color: '#9CA3AF', marginTop: 12, fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  refreshBtn: { backgroundColor: '#065F46', padding: 8, borderRadius: 8 },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  headerSub: { color: '#A7F3D0', fontSize: 11, marginTop: 1 },
  scrollContent: { padding: 16 },

  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  progressContainer: { marginBottom: 16 },
  wizardStepText: { color: '#10B981', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  progressBarBg: { height: 6, backgroundColor: '#374151', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981' },

  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepTitle: { color: '#F9FAFB', fontSize: 17, fontWeight: '700', marginLeft: 10 },
  cardSubtitle: { color: '#9CA3AF', fontSize: 12, marginBottom: 14, lineHeight: 18 },

  inputLabel: { color: '#D1D5DB', fontSize: 12.5, fontWeight: '600', marginBottom: 4, marginTop: 10 },
  input: {
    backgroundColor: '#111827',
    color: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  inputError: { borderColor: '#EF4444' },
  errText: { color: '#EF4444', fontSize: 11, marginTop: 2 },

  entityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  entityChip: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  activeEntityChip: { backgroundColor: '#065F46', borderColor: '#10B981' },
  entityText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  activeEntityText: { color: '#FFF', fontWeight: '700' },

  inputWithLoader: { flexDirection: 'row', alignItems: 'center' },
  verifiedBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  verifiedText: { color: '#10B981', fontSize: 12, marginLeft: 4, fontWeight: '600' },

  bankBranchCard: { backgroundColor: '#064E3B', borderRadius: 8, padding: 10, marginVertical: 8 },
  bankBranchName: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 6 },
  bankBranchSub: { color: '#D1D5DB', fontSize: 11, marginTop: 2 },

  uploadBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 12, marginVertical: 4 },
  uploadText: { color: '#9CA3AF', fontSize: 13, marginLeft: 10 },

  agreementRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  agreementText: { color: '#D1D5DB', fontSize: 12, marginLeft: 8, flex: 1, lineHeight: 18 },

  wizardBtnRow: { flexDirection: 'row', marginTop: 16 },
  prevBtn: { backgroundColor: '#374151', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, justifyContent: 'center' },
  prevBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  nextBtn: { backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  primarySubmitBtn: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  primarySubmitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  storeCard: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#059669' },
  storeRow: { flexDirection: 'row', alignItems: 'center' },
  storeAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  storeNameText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  slugText: { color: '#10B981', fontSize: 13, marginTop: 2 },
  kycBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  kycText: { color: '#FFF', fontSize: 11, fontWeight: '700', marginLeft: 4 },

  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  kpiCard: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 14, alignItems: 'center', marginHorizontal: 4, borderWidth: 1 },
  kpiValue: { color: '#FFF', fontSize: 20, fontWeight: '800', marginVertical: 4 },
  kpiLabel: { color: '#9CA3AF', fontSize: 12 },

  addProductBtn: { flexDirection: 'row', backgroundColor: '#047857', borderRadius: 12, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginVertical: 12 },
  addProductBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 8 },

  primaryBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  infoBox: { flexDirection: 'row', backgroundColor: '#064E3B', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 },
  infoTitle: { color: '#A7F3D0', fontSize: 13, fontWeight: '700' },
  infoDesc: { color: '#D1D5DB', fontSize: 12, marginTop: 2 },

  rejectionCard: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  rejectionTitle: { color: '#F87171', fontSize: 16, fontWeight: '800', marginLeft: 8 },
  rejectionReasonText: { color: '#FEE2E2', fontSize: 13, marginTop: 6, lineHeight: 18 },
  resubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  resubmitBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
