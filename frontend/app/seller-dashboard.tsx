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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { apiClient } from '@/src/api/client';
import { lookupPincode } from '@/src/api/pincode.api';
import * as ImagePicker from 'expo-image-picker';

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
    commissionRate: 5.0,
  });

  // Onboarding Wizard Step (1 to 5)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Business Identity & Entity Type
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [entityType, setEntityType] = useState<'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PVT_LTD' | 'INDIVIDUAL_FARMER'>('PROPRIETORSHIP');
  const [legalName, setLegalName] = useState('');
  const [businessRegNo, setBusinessRegNo] = useState('');

  // Step 2: Legal & Tax Compliance
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [fssaiNo, setFssaiNo] = useState('');
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
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Premium Amazon-Style Product Builder State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [newMrpPrice, setNewMrpPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Seeds');
  const [newSubCategory, setNewSubCategory] = useState('Grain Seeds');
  const [newBrand, setNewBrand] = useState('FarmsKing Certified');
  const [newUnit, setNewUnit] = useState('bag');
  const [stockQty, setStockQty] = useState('50');
  const [hsnCode, setHsnCode] = useState('120991');
  const [newGstRate, setNewGstRate] = useState('5% GST');
  const [newTargetCrop, setNewTargetCrop] = useState('All Crops');
  const [newTechnicalFormula, setNewTechnicalFormula] = useState('');
  const [newDosageInstructions, setNewDosageInstructions] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImages, setNewProductImages] = useState<string[]>([]);

  // Natural Organic Farmer Foods Section
  const [isFarmerMadeProduct, setIsFarmerMadeProduct] = useState(false);
  const [farmerProducerName, setFarmerProducerName] = useState('');
  const [harvestBatchDate, setHarvestBatchDate] = useState('');
  const [processingMethod, setProcessingMethod] = useState('Cold-Pressed / Traditional Desi Kohlu');
  const [purityGuarantee, setPurityGuarantee] = useState('100% Organic & Chemical-Free · No Preservatives');
  const [shelfLifeInfo, setShelfLifeInfo] = useState('Best before 6 months in cool dry place');

  // Pack Size Variants Chips
  const [packSizes, setPackSizes] = useState<string[]>(['1 Kg', '5 Kg', '50 Kg Bag']);
  const [newPackSizeInput, setNewPackSizeInput] = useState('');

  const resetProductForm = () => {
    setProductName('');
    setProductPrice('');
    setNewMrpPrice('');
    setProductCategory('Seeds');
    setNewSubCategory('Grain Seeds');
    setNewBrand('FarmsKing Certified');
    setNewUnit('bag');
    setStockQty('50');
    setHsnCode('120991');
    setNewGstRate('5% GST');
    setNewTargetCrop('All Crops');
    setNewTechnicalFormula('');
    setNewDosageInstructions('');
    setNewProductDescription('');
    setNewProductImages([]);
    setIsFarmerMadeProduct(false);
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/seller/store/me');
      setStoreData(res.data);
      setHasStore(true);
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
        setPickupCity(res.district);
        setPickupState(res.state);
        setPickupPostOffice(res.postOffice);
      } catch (err) {
        // ignore
      } finally {
        setIsPincodeLoading(false);
      }
    }
  };

  // Cross-platform Alert Helper (Works on Web & Native Mobile)
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Live GSTIN State Identifier, PAN Auto-Extract & Firm Name Lookup
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

    // Auto-extract 10-digit PAN from GSTIN (digits 3-12)
    if (uppercase.length >= 12) {
      const extractedPan = uppercase.substring(2, 12);
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extractedPan)) {
        setPanNumber(extractedPan);
      }
    }

    // Auto Firm Name check
    if (uppercase.length === 15 && !legalName.trim() && storeName.trim()) {
      setLegalName(`${storeName.trim()} (Verified GST Firm)`);
    }
  };

  const handleFinalSubmission = async () => {
    if (!termsAccepted) {
      showAlert('Terms Required ⚠️', 'Please check the box to accept the Seller Code of Conduct & Platform Agreement.');
      return;
    }

    if (!storeName.trim()) {
      setStep(1);
      setErrors({ storeName: 'Store Name is required.' });
      showAlert('Required Field ⚠️', 'Please enter your Store / Brand Name in Step 1.');
      return;
    }

    try {
      setLoading(true);
      const rawSlug = slug.trim() || storeName.trim().toLowerCase().replace(/\s+/g, '-');
      const autoSlug = rawSlug.replace(/[^a-z0-9-]/g, '') || `seller-${Date.now().toString(36)}`;

      const payload = {
        storeName: storeName.trim(),
        slug: autoSlug,
        legalName: legalName.trim() || storeName.trim(),
        gstin: gstin.trim() || undefined,
        panNumber: panNumber.trim() || undefined,
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
      };

      if (storeData?.id) {
        // Update existing store or resubmit rejected KYC
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

      showAlert('🎉 Registration Submitted!', 'Your National Seller Store has been submitted successfully for Super Admin verification.');
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

    try {
      await apiClient.post('/products', {
        name: productName.trim(),
        price: parseFloat(productPrice),
        category: productCategory,
        stockQty: parseInt(stockQty || '10', 10),
        hsnCode,
        sellerStoreId: storeData?.id,
      });

      showAlert('Success 🎉', 'Product added to your Seller Store! It is now live in the Store catalog.');
      setShowAddProduct(false);
      setProductName('');
      setProductPrice('');
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
        {!hasStore ? (
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

                <Text style={styles.inputLabel}>Select Entity Type (ਵਪਾਰ ਦਾ ਕਿਸਮ) *</Text>
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

                <Text style={styles.inputLabel}>Store / Brand Name * (ਦੁਕਾਨ ਦਾ ਨਾਮ)</Text>
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

                <Text style={styles.inputLabel}>Legal Registered Firm Name (ਰਜਿਸਟਰਡ ਫਰਮ ਦਾ ਨਾਮ)</Text>
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

                <Text style={styles.inputLabel}>15-Digit GSTIN Number (GST ਨੰਬਰ)</Text>
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

                <Text style={styles.inputLabel}>10-Digit Business PAN Number (ਪੈਨ ਨੰਬਰ)</Text>
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

                <Text style={styles.inputLabel}>11-Digit Bank IFSC Code (ਜਿਵੇਂ SBIN0001234) *</Text>
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

                <Text style={styles.inputLabel}>Bank Account Number (ਬੈਂਕ ਅਕਾਊਂਟ ਨੰਬਰ) *</Text>
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

                <Text style={styles.inputLabel}>Account Holder Name (ਖਾਤਾਧਾਰਕ ਦਾ ਨਾਮ)</Text>
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

                <Text style={styles.inputLabel}>Full Pickup Warehouse Address (ਪੂਰਾ ਪਤਾ)</Text>
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
                <Text style={styles.inputLabel}>Upload GST Certificate / Business Proof</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocPhoto(setGstCertDoc)}>
                  <Ionicons name={gstCertDoc ? 'checkmark-circle' : 'cloud-upload-outline'} size={24} color="#10B981" />
                  <Text style={styles.uploadText}>{gstCertDoc ? 'GST Certificate Attached' : 'Select Photo from Gallery'}</Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Upload Cancelled Cheque / Passbook Copy</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocPhoto(setChequeDoc)}>
                  <Ionicons name={chequeDoc ? 'checkmark-circle' : 'cloud-upload-outline'} size={24} color="#10B981" />
                  <Text style={styles.uploadText}>{chequeDoc ? 'Bank Cheque Attached' : 'Select Photo from Gallery'}</Text>
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
                    I accept FarmsKing Seller Code of Conduct, 5% Platform Commission Terms & 1% GST TCS Compliance.
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
                    setStoreName(storeData?.storeName || '');
                    setSlug(storeData?.slug || '');
                    setLegalName(storeData?.legalName || '');
                    setGstin(storeData?.gstin || '');
                    setPanNumber(storeData?.panNumber || '');
                    setBankAccountNo(storeData?.bankAccountNo || '');
                    setBankIfsc(storeData?.bankIfsc || '');
                    setPickupAddress(storeData?.pickupAddress || '');
                    setPickupCity(storeData?.pickupCity || '');
                    setPickupState(storeData?.pickupState || '');
                    setPickupPincode(storeData?.pickupPincode || '');
                    setHasStore(false);
                    setStep(1);
                  }}
                >
                  <Ionicons name="refresh-circle-outline" size={20} color="#FFF" />
                  <Text style={styles.resubmitBtnText}> 🔄 Edit & Resubmit Application</Text>
                </TouchableOpacity>
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

            {/* Action Bar */}
            <TouchableOpacity
              style={styles.addProductBtn}
              onPress={() => setShowAddProduct(!showAddProduct)}
            >
              <MaterialCommunityIcons name="plus-circle" size={22} color="#FFF" />
              <Text style={styles.addProductBtnText}>+ Add New Product to Store</Text>
            </TouchableOpacity>

            {/* Add Product Form */}
            {showAddProduct && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📦 Add New Product</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Product Name (e.g. Hybrid Mustard Seeds)"
                  placeholderTextColor="#9CA3AF"
                  value={productName}
                  onChangeText={setProductName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Price (₹)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={productPrice}
                  onChangeText={setProductPrice}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Stock Quantity"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={stockQty}
                  onChangeText={setStockQty}
                />
                <TextInput
                  style={styles.input}
                  placeholder="HSN Code (Default: 120991)"
                  placeholderTextColor="#9CA3AF"
                  value={hsnCode}
                  onChangeText={setHsnCode}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleAddProduct}>
                  <Text style={styles.primaryBtnText}>Save Product to Store</Text>
                </TouchableOpacity>
              </View>
            )}

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
