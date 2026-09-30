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

export interface ProductVariantItem {
  id: string;
  packSize: string;
  price: string;
  mrp: string;
  stockQty: string;
  sku: string;
  deadWeightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
}

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
  const [entityType, setEntityType] = useState<'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PVT_LTD' | 'INDIVIDUAL_FARMER' | 'PESTICIDE_DEALER'>('INDIVIDUAL_FARMER');
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
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
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
  const [skuCode, setSkuCode] = useState(`FK-${Math.floor(100000 + Math.random() * 900000)}`);
  const [unitsInBox, setUnitsInBox] = useState('1');
  const [isDangerousGood, setIsDangerousGood] = useState(false);
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

  // Dynamic Product Variants Matrix (Per-Variant Price, Stock, Weight & Shiprocket Dimensions)
  const [productVariants, setProductVariants] = useState<ProductVariantItem[]>([
    {
      id: 'var-1',
      packSize: '1 Kg',
      price: '450',
      mrp: '600',
      stockQty: '50',
      sku: `FK-${Math.floor(100000 + Math.random() * 900000)}`,
      deadWeightKg: '1.0',
      lengthCm: '15',
      widthCm: '10',
      heightCm: '8',
    },
  ]);

  const addVariantByChip = (sz: string) => {
    const exists = productVariants.some((v) => v.packSize === sz);
    if (exists) {
      if (productVariants.length > 1) {
        setProductVariants(productVariants.filter((v) => v.packSize !== sz));
      } else {
        showAlert('Primary Variant Required ⚠️', 'At least 1 product variant is required.');
      }
    } else {
      let w = '1.0', l = '15', wi = '10', h = '8';
      if (sz.includes('250') || sz.includes('500 gram')) { w = '0.5'; l = '10'; wi = '10'; h = '5'; }
      else if (sz.includes('5 Kg')) { w = '5.2'; l = '25'; wi = '20'; h = '15'; }
      else if (sz.includes('25 Kg')) { w = '25.5'; l = '50'; wi = '35'; h = '20'; }
      else if (sz.includes('50 Kg')) { w = '50.5'; l = '70'; wi = '45'; h = '30'; }
      else if (sz.includes('5 Litre')) { w = '5.1'; l = '22'; wi = '18'; h = '30'; }

      const newVar: ProductVariantItem = {
        id: `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        packSize: sz,
        price: productPrice || '450',
        mrp: newMrpPrice || '600',
        stockQty: '50',
        sku: `FK-${sz.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        deadWeightKg: w,
        lengthCm: l,
        widthCm: wi,
        heightCm: h,
      };
      setProductVariants([...productVariants, newVar]);
    }
  };

  const updateVariantField = (id: string, field: keyof ProductVariantItem, val: string) => {
    setProductVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: val } : v))
    );
  };

  const removeVariant = (id: string) => {
    if (productVariants.length <= 1) {
      showAlert('Variant Required ⚠️', 'At least one variant must remain.');
      return;
    }
    setProductVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const addCustomVariant = () => {
    const newVar: ProductVariantItem = {
      id: `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      packSize: 'Custom Pack Size',
      price: '500',
      mrp: '650',
      stockQty: '25',
      sku: `FK-VAR-${Math.floor(1000 + Math.random() * 9000)}`,
      deadWeightKg: '1.0',
      lengthCm: '15',
      widthCm: '10',
      heightCm: '10',
    };
    setProductVariants([...productVariants, newVar]);
  };

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

  // Additional Agri E-Commerce Specifications (BigHaat / AgroStar / Amazon Agri Standards)
  const [physicalForm, setPhysicalForm] = useState('Liquid / Spray');
  const [modeOfAction, setModeOfAction] = useState('Systemic Action');
  const [toxicityBand, setToxicityBand] = useState('🟢 Green (Safe / Organic)');
  const [shelfLife, setShelfLife] = useState('2 Years from Mfg');
  const [returnPolicy, setReturnPolicy] = useState('Replacement Only (Agri Inputs)');

  // 12. FSSAI Packaged Food Compliance & Nutritional Matrix States
  const [isVegProduct, setIsVegProduct] = useState(true);
  const [ingredientsList, setIngredientsList] = useState('');
  const [allergenInfo, setAllergenInfo] = useState('Gluten Free');
  const [energyKcal, setEnergyKcal] = useState('380 Kcal');
  const [proteinG, setProteinG] = useState('8.5 g');
  const [carbsG, setCarbsG] = useState('72 g');
  const [fatG, setFatG] = useState('4.2 g');
  const [storageInstruction, setStorageInstruction] = useState('Store in a cool, dry place away from direct sunlight.');
  const [foodShelfLife, setFoodShelfLife] = useState('9 Months from MFD');
  const [organicCertStatus, setOrganicCertStatus] = useState<'Jaivik Bharat Certified' | 'Natural Farmer Direct' | 'Conventional / Regular'>('Jaivik Bharat Certified');

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

  const setDefaultSamplePhoto = () => {
    const sampleUrl = 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a80?q=80&w=600&auto=format&fit=crop';
    setImageFrontUrl(sampleUrl);
    setNewProductImages((prev) => Array.from(new Set([sampleUrl, ...prev])));
    showAlert('Sample Photo Attached 📸', 'Default high-resolution agricultural product sample photo attached successfully!');
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
    if (!productName || productVariants.length === 0) {
      showAlert('Error ⚠️', 'Please enter Product Title and add at least 1 Product Variant.');
      return;
    }

    const primaryVariant = productVariants[0];
    const basePrice = parseFloat(primaryVariant.price || '0');
    if (!basePrice || basePrice <= 0) {
      showAlert('Error ⚠️', 'Please enter a valid Selling Price for the primary variant.');
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
      const variantPackNames = productVariants.map((v) => v.packSize);
      const totalStock = productVariants.reduce((sum, v) => sum + parseInt(v.stockQty || '0', 10), 0);

      const descMeta: string[] = [];
      if (newProductDescription) descMeta.push(newProductDescription);
      descMeta.push(`\nVARIANTS_MATRIX:${JSON.stringify(productVariants)}`);

      await apiClient.post('/products', {
        name: productName.trim(),
        price: basePrice,
        categorySlug: productCategorySlug,
        category: productCategorySlug,
        stockQty: totalStock || 50,
        hsnCode: hsnCode || '120991',
        sellerStoreId: storeData?.id,
        deadWeightKg: parseFloat(primaryVariant.deadWeightKg || '1.0'),
        lengthCm: parseFloat(primaryVariant.lengthCm || '15'),
        widthCm: parseFloat(primaryVariant.widthCm || '10'),
        heightCm: parseFloat(primaryVariant.heightCm || '8'),
        skuCode: primaryVariant.sku,
        technicalName,
        dosageInstructions,
        suitableCrops,
        targetPests,
        batchNumber,
        expiryDate,
        imageFrontUrl: imageFrontUrl || newProductImages[0],
        imageBackLabelUrl,
        imageDosageUrl,
        imageProductUrl,
        description: descMeta.join('\n'),
      });

      showAlert('Success 🎉', `Product with ${productVariants.length} Variants added successfully to AgriStore catalog!`);
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
      <View style={[styles.centerContainer, { backgroundColor: '#0B0F17' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Official FarmsKing Brand Logo */}
          <Image
            source={require('@/assets/images/farmsking_logo_round_goldring.png')}
            style={{ width: 110, height: 110, marginBottom: 20 }}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 12 }} />
          <Text style={{ color: '#F9FAFB', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }}>FarmsKing National Vendor Portal</Text>
          <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700', marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Enterprise Seller Ecosystem
          </Text>
        </View>
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
          <Text style={styles.headerSub}>FarmsKing Direct Vendor Portal</Text>
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

                {/* Structured Tax & Legal Inputs Grid */}
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginVertical: 4 }}>
                  <View style={{ flex: 1.2 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabel}>
                        {sellerType === 'FARMER' || entityType === 'INDIVIDUAL_FARMER' ? 'GSTIN (Optional)' : 'GSTIN Number *'}
                      </Text>
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>15 Chars</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { letterSpacing: 1.5, fontWeight: '700', fontSize: 13 }, errors.gstin && styles.inputError]}
                      placeholder="03AAAAA0000A1Z5"
                      placeholderTextColor="#6B7280"
                      value={gstin}
                      onChangeText={handleGstinChange}
                      maxLength={15}
                      autoCapitalize="characters"
                    />
                    {gstStateDetected ? (
                      <View style={styles.verifiedBadgeRow}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.verifiedText}>State: {gstStateDetected}</Text>
                      </View>
                    ) : null}
                    {errors.gstin ? <Text style={styles.errText}>{errors.gstin}</Text> : null}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabel}>PAN Number *</Text>
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>10 Chars</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { letterSpacing: 2, fontWeight: '800', fontSize: 13 }, errors.panNumber && styles.inputError]}
                      placeholder="ABCDE1234F"
                      placeholderTextColor="#6B7280"
                      value={panNumber}
                      onChangeText={(val) => setPanNumber(val.trim().toUpperCase())}
                      maxLength={10}
                      autoCapitalize="characters"
                    />
                    {errors.panNumber ? <Text style={styles.errText}>{errors.panNumber}</Text> : null}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginVertical: 4 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabel}>FSSAI License No.</Text>
                      <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '800' }}>14 Digits</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { letterSpacing: 1.5, fontWeight: '700', fontSize: 13 }]}
                      placeholder="14-digit FSSAI License"
                      placeholderTextColor="#6B7280"
                      value={fssaiNo}
                      onChangeText={setFssaiNo}
                      keyboardType="number-pad"
                      maxLength={14}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Agri Inputs License No.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Seeds / Pesticide License"
                      placeholderTextColor="#6B7280"
                      value={agriLicenseNo}
                      onChangeText={setAgriLicenseNo}
                    />
                  </View>
                </View>

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
                  FarmsKing Daily Nodal Auto-Payout Nodal Account integration for direct earnings transfers.
                </Text>

                {/* Compact Bank IFSC & Account Number Grid */}
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginVertical: 4 }}>
                  <View style={{ width: 190 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabel}>Bank IFSC Code *</Text>
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>11 Chars</Text>
                    </View>
                    <View style={styles.inputWithLoader}>
                      <TextInput
                        style={[styles.input, { width: 190, letterSpacing: 2, fontWeight: '800', fontSize: 13, borderColor: '#059669' }, errors.bankIfsc && styles.inputError]}
                        placeholder="SBIN0001234"
                        placeholderTextColor="#6B7280"
                        value={bankIfsc}
                        onChangeText={handleIfscLookup}
                        maxLength={11}
                        autoCapitalize="characters"
                      />
                      {isIfscLoading && <ActivityIndicator size="small" color="#10B981" style={{ position: 'absolute', right: 8 }} />}
                    </View>
                    {ifscError ? <Text style={styles.errText}>{ifscError}</Text> : null}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Account Holder Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="As printed on Passbook / Cheque"
                      placeholderTextColor="#6B7280"
                      value={bankHolderName}
                      onChangeText={setBankHolderName}
                    />
                  </View>
                </View>

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

                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginVertical: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Bank Account Number *</Text>
                    <TextInput
                      style={[styles.input, { letterSpacing: 1.5, fontWeight: '700' }]}
                      placeholder="123456789012"
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad"
                      value={bankAccountNo}
                      onChangeText={setBankAccountNo}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Re-Enter Account Number *</Text>
                    <TextInput
                      style={[styles.input, { letterSpacing: 1.5, fontWeight: '700' }, errors.confirmAccountNo && styles.inputError]}
                      placeholder="Re-enter to confirm"
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad"
                      value={confirmAccountNo}
                      onChangeText={setConfirmAccountNo}
                    />
                    {errors.confirmAccountNo ? <Text style={styles.errText}>{errors.confirmAccountNo}</Text> : null}
                  </View>
                </View>

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
                  <MaterialCommunityIcons name="truck-delivery" size={26} color="#10B981" />
                  <Text style={styles.stepTitle}>4. Pickup Warehouse Hub</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  FarmsKing Express Logistics Multi-Origin warehouse pickup location for automated dispatch.
                </Text>

                {/* Compact 6-Digit Pincode & Auto-City/State Grid */}
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginVertical: 4 }}>
                  <View style={{ width: 170 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabel}>Pickup Pincode *</Text>
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>6 Digits</Text>
                    </View>
                    <View style={styles.inputWithLoader}>
                      <TextInput
                        style={[styles.input, { width: 170, textAlign: 'center', letterSpacing: 3, fontWeight: '800', fontSize: 15, borderColor: '#059669' }, errors.pickupPincode && styles.inputError]}
                        placeholder="141001"
                        placeholderTextColor="#6B7280"
                        keyboardType="number-pad"
                        value={pickupPincode}
                        onChangeText={handlePincodeLookup}
                        maxLength={6}
                      />
                      {isPincodeLoading && <ActivityIndicator size="small" color="#10B981" style={{ position: 'absolute', right: 8 }} />}
                    </View>
                    {errors.pickupPincode ? <Text style={styles.errText}>{errors.pickupPincode}</Text> : null}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>City / District</Text>
                    <TextInput style={styles.input} value={pickupCity} onChangeText={setPickupCity} placeholder="Auto-detected city" placeholderTextColor="#6B7280" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>State</Text>
                    <TextInput style={styles.input} value={pickupState} onChangeText={setPickupState} placeholder="Auto-state" placeholderTextColor="#6B7280" />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Full Pickup Warehouse Address *</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="Street, Building No, Industrial Area / Village"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                />

                <Text style={styles.inputLabel}>Warehouse Landmark (Near Market / GT Road)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Near Main Grain Market Gate No. 2"
                  placeholderTextColor="#9CA3AF"
                  value={pickupLandmark}
                  onChangeText={setPickupLandmark}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Dispatch Manager Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Contact Person Name"
                      placeholderTextColor="#9CA3AF"
                      value={contactPerson}
                      onChangeText={setContactPerson}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Dispatch Mobile Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10-digit Mobile"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      value={contactMobile}
                      onChangeText={setContactMobile}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Dispatch Manager Email (SMS / Tracking Alerts)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="dispatch@seller.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  value={contactEmail}
                  onChangeText={setContactEmail}
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

            {/* Compact 4-Column Analytics Toolbar */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: '#111827', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#10B981', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#064E3B', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="cube-outline" size={18} color="#34D399" />
                </View>
                <View>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{stats.activeProducts}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '600' }}>Active Products</Text>
                </View>
              </View>

              <View style={{ flex: 1, backgroundColor: '#111827', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="cart-check" size={18} color="#60A5FA" />
                </View>
                <View>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{stats.totalOrders}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '600' }}>Total Orders</Text>
                </View>
              </View>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#111827', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', gap: 8 }}
                onPress={() => router.push('/seller-payouts')}
              >
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#78350F', justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesome5 name="wallet" size={14} color="#FBBF24" />
                </View>
                <View>
                  <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>₹{stats.pendingPayoutsAmount}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '600' }}>Pending Payouts</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#111827', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#8B5CF6', flexDirection: 'row', alignItems: 'center', gap: 8 }}
                onPress={() => router.push('/seller-payouts')}
              >
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#4C1D95', justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesome5 name="hand-holding-usd" size={14} color="#A78BFA" />
                </View>
                <View>
                  <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>₹{stats.settledPayoutsAmount}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '600' }}>Settled Earnings</Text>
                </View>
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
                  <Text style={styles.cardTitle}>📦 FarmsKing Product Builder</Text>
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

                {/* 3. MULTI-PHOTO GALLERY & PRESET SAMPLE PHOTOS */}
                <Text style={styles.inputLabel}>Product Photo(s) * (Select Gallery, Angle Photo, or Preset Sample)</Text>
                
                {/* Preset Sample Photo Buttons */}
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 4 }}>⚡ Quick Select Sample Agri Photo if device gallery photo is not ready:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {[
                        { label: '🌾 Seeds Bag', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a80?q=80&w=600&auto=format&fit=crop' },
                        { label: '🧪 Bio-Spray Bottle', url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=600&auto=format&fit=crop' },
                        { label: '🍯 Organic Gur/Honey', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=600&auto=format&fit=crop' },
                        { label: '🥦 Fresh Farm Produce', url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=600&auto=format&fit=crop' },
                        { label: '⚡ Fertilizer Sack', url: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=600&auto=format&fit=crop' },
                      ].map((item, i) => (
                        <TouchableOpacity
                          key={i}
                          style={{ backgroundColor: '#064E3B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#10B981', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => {
                            setImageFrontUrl(item.url);
                            setNewProductImages((prev) => Array.from(new Set([item.url, ...prev])));
                            showAlert('Sample Photo Selected 📸', `${item.label} photo set as primary product image!`);
                          }}
                        >
                          <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '700' }}>{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Upload Gallery & Angle Pickers */}
                <TouchableOpacity style={styles.uploadBox} onPress={pickProductPhotos}>
                  <Ionicons name="images-outline" size={24} color="#10B981" />
                  <Text style={styles.uploadText}>
                    {newProductImages.length > 0 ? `Attach ${newProductImages.length} Gallery Photo(s)` : 'Browse & Upload Photos from Gallery'}
                  </Text>
                </TouchableOpacity>

                {/* Individual Angle Slots */}
                <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
                  {[
                    { label: 'Front Main', state: imageFrontUrl, setter: setImageFrontUrl },
                    { label: 'Back Label', state: imageBackLabelUrl, setter: setImageBackLabelUrl },
                    { label: 'Dosage Chart', state: imageDosageUrl, setter: setImageDosageUrl },
                    { label: 'Pack Unit', state: imageProductUrl, setter: setImageProductUrl },
                  ].map((ang, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{ flex: 1, height: 60, borderRadius: 8, backgroundColor: '#1F2937', borderWidth: 1, borderColor: ang.state ? '#10B981' : '#374151', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                      onPress={() => pickSingleImage(ang.setter)}
                    >
                      {ang.state ? (
                        <Image source={{ uri: ang.state }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View style={{ alignItems: 'center' }}>
                          <Ionicons name="camera-outline" size={16} color="#9CA3AF" />
                          <Text style={{ color: '#9CA3AF', fontSize: 9, marginTop: 2, textAlign: 'center' }}>{ang.label}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Thumbnails list */}
                {(newProductImages.length > 0 || imageFrontUrl) ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                    {Array.from(new Set([...(imageFrontUrl ? [imageFrontUrl] : []), ...newProductImages])).map((img, idx) => (
                      <View key={idx} style={{ position: 'relative', marginRight: 8 }}>
                        <Image source={{ uri: img }} style={{ width: 64, height: 64, borderRadius: 8, borderWidth: 1.5, borderColor: '#10B981' }} resizeMode="cover" />
                        <TouchableOpacity
                          style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, padding: 3 }}
                          onPress={() => {
                            setNewProductImages(newProductImages.filter((i) => i !== img));
                            if (imageFrontUrl === img) setImageFrontUrl(null);
                          }}
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

                {/* 7 & 8. DYNAMIC PRODUCT VARIANTS MATRIX (PRICE, MRP, STOCK, WEIGHT & DIMENSIONS PER VARIANT) */}
                <View style={{ backgroundColor: '#111827', borderRadius: 12, padding: 12, marginVertical: 10, borderWidth: 1, borderColor: '#059669' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#10B981', fontSize: 13.5, fontWeight: '800' }}>
                      📦 Product Variants Pricing & FarmsKing Express Logistics Matrix ({productVariants.length})
                    </Text>
                    <TouchableOpacity
                      style={{ backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      onPress={addCustomVariant}
                    >
                      <Ionicons name="add-circle-outline" size={14} color="#FFF" />
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>+ Custom Variant</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 8 }}>
                    Click pack size chips below to add/remove variants. Set individual Price, Stock, Weight & Dimensions for each size variant:
                  </Text>

                  {/* Variant Quick Select Chips */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {['250 ml', '500 ml', '1 Litre', '5 Litres', '500 gram', '1 Kg', '5 Kg Bag', '25 Kg Bag', '50 Kg Bag'].map((sz) => {
                      const isAdded = productVariants.some((v) => v.packSize === sz);
                      return (
                        <TouchableOpacity
                          key={sz}
                          style={[styles.entityChip, isAdded && styles.activeEntityChip]}
                          onPress={() => addVariantByChip(sz)}
                        >
                          <Text style={[styles.entityText, isAdded && styles.activeEntityText]}>
                            {isAdded ? `✅ ${sz}` : `+ ${sz}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Render Variant Matrix Cards */}
                  {productVariants.map((v, idx) => {
                    const dW = parseFloat(v.deadWeightKg || '0.5');
                    const l = parseFloat(v.lengthCm || '10');
                    const w = parseFloat(v.widthCm || '10');
                    const h = parseFloat(v.heightCm || '10');
                    const volKg = (l * w * h) / 5000;
                    const billableKg = Math.max(dW, volKg);

                    return (
                      <View key={v.id} style={{ backgroundColor: '#1F2937', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#374151' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#374151', paddingBottom: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="cube" size={16} color="#34D399" />
                            <Text style={{ color: '#34D399', fontSize: 13, fontWeight: '800' }}>Variant #{idx + 1}: {v.packSize}</Text>
                          </View>
                          {productVariants.length > 1 && (
                            <TouchableOpacity onPress={() => removeVariant(v.id)}>
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Variant Pack Name, Price, MRP, Stock */}
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                          <View style={{ flex: 1.2 }}>
                            <Text style={styles.inputLabel}>Pack Size Name *</Text>
                            <TextInput
                              style={[styles.input, { fontSize: 12 }]}
                              value={v.packSize}
                              onChangeText={(val) => updateVariantField(v.id, 'packSize', val)}
                              placeholder="e.g. 5 Kg Bag"
                              placeholderTextColor="#9CA3AF"
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Price (₹) *</Text>
                            <TextInput
                              style={[styles.input, { fontSize: 12 }]}
                              value={v.price}
                              onChangeText={(val) => updateVariantField(v.id, 'price', val)}
                              placeholder="450"
                              placeholderTextColor="#9CA3AF"
                              keyboardType="numeric"
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>MRP (₹)</Text>
                            <TextInput
                              style={[styles.input, { fontSize: 12 }]}
                              value={v.mrp}
                              onChangeText={(val) => updateVariantField(v.id, 'mrp', val)}
                              placeholder="600"
                              placeholderTextColor="#9CA3AF"
                              keyboardType="numeric"
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Stock</Text>
                            <TextInput
                              style={[styles.input, { fontSize: 12 }]}
                              value={v.stockQty}
                              onChangeText={(val) => updateVariantField(v.id, 'stockQty', val)}
                              placeholder="50"
                              placeholderTextColor="#9CA3AF"
                              keyboardType="number-pad"
                            />
                          </View>
                        </View>

                        {/* Variant Courier Dimensions & Weight */}
                        <View style={{ backgroundColor: '#111827', borderRadius: 8, padding: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ color: '#D1D5DB', fontSize: 11, fontWeight: '700' }}>🚚 Courier Size & Weight for {v.packSize}:</Text>
                            <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '800' }}>Billable: {billableKg.toFixed(2)} kg</Text>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Weight (Kg) *</Text>
                              <TextInput
                                style={[styles.input, { height: 34, fontSize: 11 }]}
                                value={v.deadWeightKg}
                                onChangeText={(val) => updateVariantField(v.id, 'deadWeightKg', val)}
                                keyboardType="numeric"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#9CA3AF', fontSize: 10 }}>L (cm) *</Text>
                              <TextInput
                                style={[styles.input, { height: 34, fontSize: 11 }]}
                                value={v.lengthCm}
                                onChangeText={(val) => updateVariantField(v.id, 'lengthCm', val)}
                                keyboardType="numeric"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#9CA3AF', fontSize: 10 }}>W (cm) *</Text>
                              <TextInput
                                style={[styles.input, { height: 34, fontSize: 11 }]}
                                value={v.widthCm}
                                onChangeText={(val) => updateVariantField(v.id, 'widthCm', val)}
                                keyboardType="numeric"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#9CA3AF', fontSize: 10 }}>H (cm) *</Text>
                              <TextInput
                                style={[styles.input, { height: 34, fontSize: 11 }]}
                                value={v.heightCm}
                                onChangeText={(val) => updateVariantField(v.id, 'heightCm', val)}
                                keyboardType="numeric"
                              />
                            </View>
                            <View style={{ flex: 1.5 }}>
                              <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Variant SKU *</Text>
                              <TextInput
                                style={[styles.input, { height: 34, fontSize: 10 }]}
                                value={v.sku}
                                onChangeText={(val) => updateVariantField(v.id, 'sku', val)}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* 9. FARMSKING SKU CODE & MASTER BOX UNITS */}
                <View style={{ flexDirection: 'row', gap: 10, marginVertical: 4 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabel}>FarmsKing SKU Code *</Text>
                      <TouchableOpacity
                        onPress={() => setSkuCode(`FK-${productCategorySlug.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`)}
                      >
                        <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '700' }}>⚡ Auto SKU</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={skuCode}
                      onChangeText={setSkuCode}
                      placeholder="FK-SEED-10023"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Inner Units per Box</Text>
                    <TextInput
                      style={styles.input}
                      value={unitsInBox}
                      onChangeText={setUnitsInBox}
                      placeholder="1"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                {/* SHIPROCKET LIQUID / HAZARDOUS CARGO MODE TOGGLE */}
                <TouchableOpacity
                  style={{
                    backgroundColor: isDangerousGood ? '#78350F' : '#1F2937',
                    borderRadius: 8,
                    padding: 10,
                    marginVertical: 6,
                    borderWidth: 1,
                    borderColor: isDangerousGood ? '#F59E0B' : '#374151',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => setIsDangerousGood(!isDangerousGood)}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                      🧪 Liquid / Bio-Chemical Cargo Mode ({isDangerousGood ? 'Surface Transport Mandatory' : 'Standard'})
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 10.5, marginTop: 2 }}>
                      Enable for liquid sprays, bio-fertilizers, or oils (Air Cargo Restricted by IATA).
                    </Text>
                  </View>
                  <Ionicons
                    name={isDangerousGood ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isDangerousGood ? '#F59E0B' : '#9CA3AF'}
                  />
                </TouchableOpacity>

                {/* 10. GST % & HSN CODE */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>GST Tax Rate</Text>
                    <TextInput style={styles.input} value={storeData?.gstin ? newGstRate : 'Exempt (0%)'} onChangeText={setNewGstRate} editable={Boolean(storeData?.gstin)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>HSN Code *</Text>
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

                {/* 11.5 AGRI E-COMMERCE SPECIFICATIONS & CIBRC TOXICITY (BIGHAAT & AGROSTAR STANDARDS) */}
                <View style={{ backgroundColor: '#111827', borderRadius: 10, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: '#374151' }}>
                  <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                    🌿 Agri Specifications & CIBRC Safety Rating (BigHaat & AgroStar Standard)
                  </Text>

                  {/* Physical State Form & Mode of Action */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Physical Form / State</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {['Liquid / Spray', 'Granules / Khad', 'Powder / WP', 'Fresh Produce'].map((f) => (
                          <TouchableOpacity
                            key={f}
                            style={[styles.entityChip, physicalForm === f && styles.activeEntityChip]}
                            onPress={() => setPhysicalForm(f)}
                          >
                            <Text style={[styles.entityText, physicalForm === f && styles.activeEntityText, { fontSize: 10 }]}>{f}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Mode of Action</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {['Systemic Action', 'Contact Action', 'Preventive & Curative', 'Foliar Spray'].map((m) => (
                          <TouchableOpacity
                            key={m}
                            style={[styles.entityChip, modeOfAction === m && styles.activeEntityChip]}
                            onPress={() => setModeOfAction(m)}
                          >
                            <Text style={[styles.entityText, modeOfAction === m && styles.activeEntityText, { fontSize: 10 }]}>{m}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* CIBRC Toxicity Warning Band */}
                  <Text style={styles.inputLabel}>CIBRC Insecticide Toxicity Safety Rating</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
                    {[
                      { label: '🟢 Green (Safe / Organic)', color: '#059669' },
                      { label: '🔵 Blue (Moderate Toxicity)', color: '#2563EB' },
                      { label: '🟡 Yellow (High Toxicity)', color: '#D97706' },
                      { label: '🔴 Red (Extremely Toxic)', color: '#DC2626' },
                    ].map((b) => (
                      <TouchableOpacity
                        key={b.label}
                        style={[styles.entityChip, toxicityBand === b.label && { backgroundColor: b.color, borderColor: '#FFF' }]}
                        onPress={() => setToxicityBand(b.label)}
                      >
                        <Text style={[styles.entityText, toxicityBand === b.label && { color: '#FFF', fontWeight: '800' }, { fontSize: 10.5 }]}>
                          {b.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Shelf Life & Return Policy */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Shelf Life / Expiry Duration</Text>
                      <TextInput
                        style={styles.input}
                        value={shelfLife}
                        onChangeText={setShelfLife}
                        placeholder="e.g. 2 Years from Mfg Date"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Return & Replacement Policy</Text>
                      <TextInput
                        style={styles.input}
                        value={returnPolicy}
                        onChangeText={setReturnPolicy}
                        placeholder="Replacement Only (Agri Inputs)"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>

                {/* 12. FSSAI PACKAGED FOOD COMPLIANCE & NUTRITIONAL MATRIX */}
                {(isFarmerMadeProduct || productCategorySlug === 'food-products' || productCategory.includes('Food')) ? (
                  <View style={{ backgroundColor: '#064E3B', borderRadius: 12, padding: 12, marginVertical: 10, borderWidth: 1.5, borderColor: '#10B981' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#34D399" />
                        <Text style={{ color: '#FFF', fontSize: 13.5, fontWeight: '800' }}>
                          🥗 FSSAI Packaged Food Compliance & Nutritional Matrix
                        </Text>
                      </View>
                      <View style={{ backgroundColor: isVegProduct ? '#059669' : '#DC2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>{isVegProduct ? '🟢 Veg' : '🔴 Non-Veg'}</Text>
                      </View>
                    </View>

                    <Text style={{ color: '#A7F3D0', fontSize: 11, marginBottom: 8 }}>
                      Mandatory FSSAI E-Commerce Regulations 2024 compliance parameters for processed food & farm items:
                    </Text>

                    {/* Veg / Non-Veg Indicator Selector */}
                    <Text style={styles.inputLabel}>FSSAI Veg / Non-Veg Classification *</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TouchableOpacity
                        style={[styles.entityChip, isVegProduct && { backgroundColor: '#059669', borderColor: '#34D399' }, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                        onPress={() => setIsVegProduct(true)}
                      >
                        <View style={{ width: 14, height: 14, borderRadius: 2, borderWidth: 2, borderColor: '#34D399', justifyContent: 'center', alignItems: 'center' }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' }} />
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>🟢 100% Vegetarian (Green Dot)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.entityChip, !isVegProduct && { backgroundColor: '#991B1B', borderColor: '#EF4444' }, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                        onPress={() => setIsVegProduct(false)}
                      >
                        <View style={{ width: 14, height: 14, borderRadius: 2, borderWidth: 2, borderColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
                          <View style={{ width: 6, height: 6, backgroundColor: '#EF4444' }} />
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>🔴 Non-Vegetarian (Red Mark)</Text>
                      </TouchableOpacity>
                    </View>

                    {/* FSSAI License Confirmation Badge */}
                    <View style={{ backgroundColor: '#111827', borderRadius: 8, padding: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                          FSSAI License: <Text style={{ color: '#F59E0B' }}>{storeData?.fssaiNo || fssaiNo || 'Exempt Direct Farmer'}</Text>
                        </Text>
                      </View>
                      <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '800' }}>FSSAI Verified</Text>
                    </View>

                    {/* Organic Certification Selector */}
                    <Text style={styles.inputLabel}>Organic & Natural Certification Status</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {['Jaivik Bharat Certified', 'Natural Farmer Direct', 'Conventional / Regular'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[styles.entityChip, organicCertStatus === status && styles.activeEntityChip]}
                          onPress={() => setOrganicCertStatus(status as any)}
                        >
                          <Text style={[styles.entityText, organicCertStatus === status && styles.activeEntityText, { fontSize: 11 }]}>
                            {status === 'Jaivik Bharat Certified' ? '🇮🇳 Jaivik Bharat Certified' : status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Ingredients List & Allergen Warning */}
                    <Text style={styles.inputLabel}>Ingredients List *</Text>
                    <TextInput
                      style={styles.input}
                      value={ingredientsList}
                      onChangeText={setIngredientsList}
                      placeholder="e.g. 100% Pure Mustard Seeds, Cold Pressed Oil"
                      placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.inputLabel}>Allergen Information</Text>
                    <TextInput
                      style={styles.input}
                      value={allergenInfo}
                      onChangeText={setAllergenInfo}
                      placeholder="e.g. Contains Mustard. Processed in a facility handling Nuts and Wheat."
                      placeholderTextColor="#9CA3AF"
                    />

                    {/* Nutritional Information Grid (Per 100g / 100ml) */}
                    <Text style={[styles.inputLabel, { marginTop: 8 }]}>Nutritional Facts (Per 100g / 100ml)</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Energy (kcal)</Text>
                        <TextInput
                          style={[styles.input, { height: 36, fontSize: 11 }]}
                          value={energyKcal}
                          onChangeText={setEnergyKcal}
                          placeholder="380 kcal"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Protein (g)</Text>
                        <TextInput
                          style={[styles.input, { height: 36, fontSize: 11 }]}
                          value={proteinG}
                          onChangeText={setProteinG}
                          placeholder="8.5 g"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Carbs (g)</Text>
                        <TextInput
                          style={[styles.input, { height: 36, fontSize: 11 }]}
                          value={carbsG}
                          onChangeText={setCarbsG}
                          placeholder="72 g"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Fat (g)</Text>
                        <TextInput
                          style={[styles.input, { height: 36, fontSize: 11 }]}
                          value={fatG}
                          onChangeText={setFatG}
                          placeholder="4.2 g"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    {/* Storage & Expiry / Best Before */}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Storage Conditions</Text>
                        <TextInput
                          style={styles.input}
                          value={storageInstruction}
                          onChangeText={setStorageInstruction}
                          placeholder="Store in cool, dry place"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Best Before / Expiry</Text>
                        <TextInput
                          style={styles.input}
                          value={foodShelfLife}
                          onChangeText={setFoodShelfLife}
                          placeholder="9 Months from MFD"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    {/* Direct Farmer Producer Details */}
                    <Text style={[styles.inputLabel, { marginTop: 8 }]}>Direct Farmer Producer Name</Text>
                    <TextInput
                      style={styles.input}
                      value={farmerProducerName}
                      onChangeText={setFarmerProducerName}
                      placeholder="Producer / Farmer Group Name"
                      placeholderTextColor="#9CA3AF"
                    />
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
                      <View style={{ height: 260, backgroundColor: '#0F172A', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                        {imageFrontUrl || newProductImages[0] ? (
                          <Image source={{ uri: imageFrontUrl || newProductImages[0] }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        ) : (
                          <View style={{ alignItems: 'center' }}>
                            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>No Image Attached</Text>
                          </View>
                        )}

                        {/* Visual Highlighting Badges on Photo */}
                        <View style={{ position: 'absolute', top: 8, left: 8, flexDirection: 'column', gap: 4 }}>
                          {(productCategorySlug === 'food-products' || isFarmerMadeProduct || productCategory.includes('Food')) && (
                            <View style={{ backgroundColor: isVegProduct ? '#059669' : '#DC2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <View style={{ width: 10, height: 10, borderRadius: isVegProduct ? 5 : 0, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ width: 4, height: 4, borderRadius: isVegProduct ? 2 : 0, backgroundColor: isVegProduct ? '#059669' : '#DC2626' }} />
                              </View>
                              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{isVegProduct ? '🟢 100% Veg Food' : '🔴 Non-Veg Food'}</Text>
                            </View>
                          )}
                          {(productCategorySlug === 'pesticides' || productCategorySlug === 'bio-fertilizers') && (
                            <View style={{ backgroundColor: '#D97706', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>🌾 Organic / Bio Formula</Text>
                            </View>
                          )}
                          {organicCertStatus && (
                            <View style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                              <Text style={{ color: '#FFF', fontSize: 10.5, fontWeight: '800' }}>🇮🇳 {organicCertStatus}</Text>
                            </View>
                          )}
                          {newBrand === 'FarmsKing Certified' && (
                            <View style={{ backgroundColor: '#047857', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
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

                        {/* FSSAI & Packaged Food Preview Card */}
                        {(productCategorySlug === 'food-products' || isFarmerMadeProduct || productCategory.includes('Food')) && (
                          <View style={{ backgroundColor: '#064E3B', borderRadius: 10, padding: 10, marginVertical: 6, borderWidth: 1, borderColor: '#10B981' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>🥗 FSSAI License: {storeData?.fssaiNo || fssaiNo || 'Exempt Direct Farmer'}</Text>
                              <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '800' }}>{organicCertStatus}</Text>
                            </View>
                            {ingredientsList ? (
                              <Text style={{ color: '#D1D5DB', fontSize: 11, marginTop: 2 }}>
                                🥣 <Text style={{ fontWeight: '700' }}>Ingredients:</Text> {ingredientsList}
                              </Text>
                            ) : null}
                            {allergenInfo ? (
                              <Text style={{ color: '#FCA5A5', fontSize: 10.5, marginTop: 2 }}>
                                ⚠️ <Text style={{ fontWeight: '700' }}>Allergens:</Text> {allergenInfo}
                              </Text>
                            ) : null}
                            
                            {/* Nutritional Matrix Table */}
                            <View style={{ backgroundColor: '#111827', borderRadius: 6, padding: 6, marginTop: 6, flexDirection: 'row', justifyContent: 'space-around' }}>
                              <View style={{ alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 9 }}>Energy</Text>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{energyKcal}</Text>
                              </View>
                              <View style={{ alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 9 }}>Protein</Text>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{proteinG}</Text>
                              </View>
                              <View style={{ alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 9 }}>Carbs</Text>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{carbsG}</Text>
                              </View>
                              <View style={{ alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 9 }}>Fat</Text>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{fatG}</Text>
                              </View>
                            </View>
                          </View>
                        )}

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
                <Text style={styles.infoTitle}>FarmsKing Nodal Settlement & 1% GST TCS Active</Text>
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
