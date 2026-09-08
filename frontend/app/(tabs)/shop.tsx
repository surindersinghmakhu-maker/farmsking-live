import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { resolveMediaUrl } from '@/src/api/client';
import { useCreateProduct, useProducts, useRemoveProduct, useUpdateProduct } from '@/src/hooks/useProducts';
import {
  useAllOrders,
  useCancelOrder,
  useConfirmOrder,
  useCreateOrder,
  useOrderUpiLink,
  useInitiatePhonePePayment,
  useMyOrders,
  useStartPackingOrder,
  useMarkOrderPacked,
  useDispatchOrder,
  useMarkOrderDelivered,
} from '@/src/hooks/useOrders';
import { useCouponPreview } from '@/src/hooks/useCoupons';
import { useMyAddresses, useCreateAddress, useUpdateAddress } from '@/src/hooks/useAddresses';
import { CustomerAddress } from '@/src/api/addresses.api';
import { lookupPincode } from '@/src/api/pincode.api';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useCart } from '@/src/store/cart-context';
import { Product, CustomerOrder, OrderStatus } from '@/src/types/api';
import { SuperAdminExpenseCategoriesModal } from '@/components/SuperAdminExpenseCategoriesModal';
import { BrandLogo } from '@/src/components/BrandLogo';

const theme = RoleThemes.CUSTOMER;

export const ALL_MEASUREMENT_UNITS = [
  'Kg', 'gram', 'mg', 'Quintal', 'Ton', 'Pound (lb)',
  'Litre', 'ml', 'Gallon', 'Barrel', 'Can', 'Bottle', 'Jar', 'Vial', 'Bucket',
  'Packet', 'Bag', 'Piece', 'Box', 'Carton', 'Crate', 'Pouch', 'Drum', 'Strip',
  'Canister', 'Tin', 'Bundle', 'Sack', 'Tube', 'Container', 'Blister',
  'Dozen', 'Bunch', 'Pair', 'Set', 'Roll',
  'Meter', 'cm', 'mm', 'Feet (ft)', 'Inch', 'Acre', 'Hectare', 'Bigha', 'Kanal', 'Marla', 'Sq Ft', 'Sq Meter',
  'Hour', 'Day', 'Trip', 'Service', 'Unit'
];


const parseImageUrls = (urlStr?: string | null): string[] => {
  if (!urlStr || typeof urlStr !== 'string') return [];
  const str = urlStr.trim();
  if (!str) return [];

  const rawParts = str.split(/\|\||\n/).map((s) => s.trim()).filter(Boolean);
  const result: string[] = [];

  for (const part of rawParts) {
    if (part.startsWith('data:')) {
      result.push(part);
    } else {
      const subParts = part.split(',').map((s) => s.trim()).filter(Boolean);
      for (const sp of subParts) {
        if (sp) result.push(sp);
      }
    }
  }
  return result;
};

const isRealImageString = (s?: string | null): boolean => {
  if (!s || typeof s !== 'string') return false;
  const str = s.trim();
  if (str.length < 5) return false;
  if (str === 'null' || str === 'undefined' || str === '[object Object]' || str === 'none') return false;
  if (
    str.startsWith('Brand:') ||
    str.startsWith('SubCat:') ||
    str.startsWith('Crop:') ||
    str.startsWith('PrimaryVariant:') ||
    str.startsWith('PackSizes:') ||
    str.startsWith('MRP:') ||
    str.startsWith('Selling:') ||
    str.startsWith('VariantRates:') ||
    str.startsWith('GST:') ||
    str.startsWith('Formula:') ||
    str.startsWith('Dosage:') ||
    str.startsWith('SKU:') ||
    str.startsWith('MOQ:') ||
    str.startsWith('Status:') ||
    str.startsWith('Description:') ||
    str.startsWith('Gallery:')
  ) {
    return false;
  }
  if (str.includes(' ') && !str.startsWith('data:') && !str.startsWith('file:') && !str.startsWith('http')) {
    return false;
  }
  return true;
};


const cleanProductDisplayDescription = (desc?: string | null): string => {
  if (!desc || typeof desc !== 'string') return '';
  let str = desc.trim();

  // 1. Remove embedded Gallery section and any base64 image strings
  const galleryIdx = str.search(/\n\nGallery:\n|\nGallery:\n|Gallery:\s*/i);
  if (galleryIdx > -1) {
    str = str.substring(0, galleryIdx).trim();
  }

  // 2. Extract actual description text after "Description:\n"
  const descIdx = str.indexOf('\n\nDescription:\n');
  if (descIdx > -1) {
    str = str.substring(descIdx + '\n\nDescription:\n'.length).trim();
  } else if (str.includes('Description:\n')) {
    str = str.split('Description:\n')[1] || str;
  } else if (str.startsWith('Brand:') || str.startsWith('SubCat:') || str.startsWith('Crop:')) {
    const lines = str.split('\n').map((l) => l.trim()).filter(Boolean);
    const nonMetaLines = lines.filter(
      (l) =>
        !l.startsWith('Brand:') &&
        !l.startsWith('SubCat:') &&
        !l.startsWith('Crop:') &&
        !l.startsWith('PrimaryVariant:') &&
        !l.startsWith('PackSizes:') &&
        !l.startsWith('MRP:') &&
        !l.startsWith('Selling:') &&
        !l.startsWith('VariantRates:') &&
        !l.startsWith('GST:') &&
        !l.startsWith('Formula:') &&
        !l.startsWith('Dosage:') &&
        !l.startsWith('SKU:') &&
        !l.startsWith('MOQ:') &&
        !l.startsWith('Status:') &&
        !l.startsWith('Gallery:') &&
        !l.startsWith('data:')
    );
    str = nonMetaLines.join('\n');
  }

  // 3. Remove [FARMER_MADE] tag if present
  str = str.replace(/\[FARMER_MADE\]/g, '').trim();

  return str.trim();
};

const getProductDisplayImage = (p: Product | null | undefined): string | null => {
  if (!p) return null;

  const pushIfValid = (urlStr?: string | null): string | null => {
    if (!urlStr || typeof urlStr !== 'string') return null;
    const parts = parseImageUrls(urlStr);
    for (const pt of parts) {
      if (isRealImageString(pt)) {
        const resolved = resolveMediaUrl(pt);
        if (resolved) return resolved;
      }
    }
    return null;
  };

  // 1. Primary imageUrl
  const fromMain = pushIfValid(p.imageUrl);
  if (fromMain) return fromMain;

  // 2. Candidate array or string fields
  const candidates = [(p as any).images, (p as any).productImages, (p as any).galleryImages, (p as any).photos];
  for (const raw of candidates) {
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item === 'string') {
          const res = pushIfValid(item);
          if (res) return res;
        }
      }
    } else if (typeof raw === 'string') {
      const res = pushIfValid(raw);
      if (res) return res;
    }
  }

  // 3. Description embedded Gallery:
  if (p.description) {
    const galleryIdx = p.description.search(/Gallery:\s*/i);
    if (galleryIdx > -1) {
      const gContent = p.description.substring(galleryIdx).replace(/^Gallery:\s*/i, '');
      const res = pushIfValid(gContent);
      if (res) return res;
    }
  }

  return null;
};

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

type EcomAdminTab = 'OVERVIEW' | 'INVENTORY' | 'ORDERS' | 'PAYMENTS' | 'DEALS' | 'SETTINGS';

const ORDER_STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  PLACED: { label: 'Placed', bg: '#fef3c7', color: '#b45309' },
  CONFIRMED: { label: 'Confirmed', bg: '#d1fae5', color: '#047857' },
  PACKING: { label: 'Packing', bg: '#e0e7ff', color: '#4338ca' },
  PACKED: { label: 'Packed', bg: '#dbeafe', color: '#1d4ed8' },
  DISPATCHED: { label: 'Dispatched', bg: '#dbeafe', color: '#1d4ed8' },
  DELIVERED: { label: 'Delivered', bg: '#f1f5f9', color: '#334155' },
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

const CATEGORY_TREE: Record<string, string[]> = {
  Seeds: ['Grain Seeds', 'Vegetable Seeds', 'Hybrid Cotton', 'Oilseeds', 'Fodder Seeds'],
  Fertilizers: ['Urea & Nitrogen', 'DAP & Phosphatic', 'NPK Complex', 'Micronutrients', 'Organic Bio-Fertilizer'],
  'Crop Protection': ['Insecticide', 'Fungicide', 'Herbicide / Weedicide', 'Plant Growth Regulator (PGR)'],
  'Farm Machinery & Tools': ['Battery Sprayers', 'Tarpaulins & Covers', 'Pruning Tools', 'Solar Pumps', 'Drip Accessories'],
  'Bio & Organics': ['Neem Oil & Extracts', 'Vermicompost', 'Bio-Stimulants', 'Soil Conditioners'],
  'Farmer Made Foods': [
    'Pure Organic Jaggery & Shakkar',
    'Cold-Pressed Mustard & Sesame Oils',
    'A2 Desi Cow Ghee',
    'Raw Forest Honey',
    'Handmade Spices & Turmeric',
    'Organic Pulses & Grains',
    'Pickles & Preserves',
  ],
  'Natural Farmer Foods': [
    'Pure Organic Jaggery & Shakkar',
    'Cold-Pressed Mustard & Sesame Oils',
    'A2 Desi Cow Ghee',
    'Raw Forest Honey',
    'Handmade Spices & Turmeric',
    'Organic Pulses & Grains',
    'Pickles & Preserves',
  ],
  'Farmer Plan & Coupons': [
    'VIP Gold Farmer Membership Pass',
    'Crop Advisory Voucher',
    'Agri Store Flat ₹500 Discount Pass',
    'Soil Testing & Drone Spray Voucher',
    'Machinery Rental Subsidy Coupon',
  ],
};

const UNITS_OF_MEASUREMENT = ['bag', 'kg', 'gram', 'litre', 'ml', 'piece', 'packet', 'quintal', 'acre kit', 'drum', 'box'];
const PACK_SIZES = ['250 ml', '500 ml', '1 Litre', '5 Litres', '500 gram', '1 Kg', '5 Kg', '25 Kg Bag', '50 Kg Bag', 'Universal Size'];
const GST_RATES = ['Exempt (0%)', '5% GST', '12% GST', '18% GST'];
const BRANDS_LIST = ['FarmsKing Certified', 'Syngenta', 'Bayer CropScience', 'UPL Ltd', 'Tata Rallis', 'IFFCO', 'Corteva', 'FMC', 'Dhanuka', 'PI Industries'];
const TARGET_CROPS = ['Paddy / Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Vegetables', 'Mustard', 'Potato', 'Pulses', 'Fruits', 'All Crops'];
const STOCK_STATUS_OPTIONS = [
  { value: 'IN_STOCK', label: 'In Stock', color: '#16a34a' },
  { value: 'LOW_STOCK', label: 'Low Stock', color: '#d97706' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock', color: '#dc2626' },
  { value: 'PRE_ORDER', label: 'Pre-Order', color: '#2563eb' },
];

function renderDeliveryAddressCard(order: any) {
  const rawAddress = order.deliveryAddress || '';
  const customerName = order.customer?.name || order.user?.name || '';
  const customerMobile = order.customer?.mobile || order.user?.mobile || order.user?.phone || '';

  const nameMatch = rawAddress.match(/Name:\s*([^,]+)/i);
  const mobileMatch = rawAddress.match(/Mobile:\s*([^,]+)/i);
  const lineMatch = rawAddress.match(/Address:\s*([^,]+)/i);
  const poMatch = rawAddress.match(/Post Office:\s*([^,]+)/i);
  const distMatch = rawAddress.match(/District:\s*([^,]+)/i);
  const stateMatch = rawAddress.match(/State:\s*([^,]+)/i);
  const pinMatch = rawAddress.match(/(?:PIN|Pincode):\s*([^,]+)/i);

  const name = nameMatch ? nameMatch[1].trim() : customerName || 'Customer';
  const mobile = mobileMatch ? mobileMatch[1].trim() : customerMobile || 'N/A';

  let rawLine = lineMatch ? lineMatch[1].trim() : rawAddress;
  rawLine = rawLine
    .replace(/Name:\s*[^,]+,?/gi, '')
    .replace(/Mobile:\s*[^,]+,?/gi, '')
    .replace(/Post Office:\s*[^,]+,?/gi, '')
    .replace(/District:\s*[^,]+,?/gi, '')
    .replace(/State:\s*[^,]+,?/gi, '')
    .replace(/(?:PIN|Pincode):\s*[^,]+,?/gi, '')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim();

  const line = rawLine || rawAddress;
  const postOffice = poMatch ? poMatch[1].trim() : '';
  const district = distMatch ? distMatch[1].trim() : '';
  const state = stateMatch ? stateMatch[1].trim() : '';
  const pincode = pinMatch ? pinMatch[1].trim() : '';

  return (
    <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 6, marginVertical: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4 }}>
        <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#15803d' }}>📍 Customer Delivery Address</Text>
        <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b' }}>Verified Dispatch Details</Text>
      </View>

      <View style={{ gap: 4 }}>
        {/* 1. Name */}
        <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
          👤 Name: <Text style={{ fontFamily: FONT.extraBold, color: '#166534' }}>{name}</Text>
        </Text>

        {/* 2. Address Line */}
        <Text style={{ fontSize: 11.5, fontFamily: FONT.semiBold, color: '#334155' }}>
          🏠 <Text style={{ fontFamily: FONT.bold }}>Address:</Text> {line}
        </Text>

        {/* 3. Post Office, District, State, PIN Badges */}
        {(postOffice || district || state || pincode) ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 2 }}>
            {postOffice ? (
              <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bae6fd' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#0369a1' }}>📮 PO: {postOffice}</Text>
              </View>
            ) : null}
            {district ? (
              <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fde68a' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#92400e' }}>🏢 Dist: {district}</Text>
              </View>
            ) : null}
            {state ? (
              <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d' }}>🗺️ State: {state}</Text>
              </View>
            ) : null}
            {pincode ? (
              <View style={{ backgroundColor: '#f3e8ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#e9d5ff' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#7e22ce' }}>📌 PIN: {pincode}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 4. Mobile Number (AT THE VERY END) */}
        <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bae6fd', alignSelf: 'flex-start', marginTop: 2 }}>
          <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0369a1' }}>
            📱 Mobile Number: <Text style={{ fontFamily: FONT.extraBold, color: '#0284c7' }}>{mobile}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ShopScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useRole();
  const { data: settings } = useAppSettings();
  const isAdminOrSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  // Mode: STORE preview vs E-COMMERCE MANAGEMENT SYSTEM
  const [viewMode, setViewMode] = useState<'STORE' | 'MANAGEMENT'>(
    isAdminOrSuperAdmin ? 'MANAGEMENT' : 'STORE'
  );

  React.useEffect(() => {
    setViewMode(isAdminOrSuperAdmin ? 'MANAGEMENT' : 'STORE');
  }, [isAdminOrSuperAdmin]);

  // E-Commerce Admin Sub-tab
  const [adminTab, setAdminTab] = useState<EcomAdminTab>('OVERVIEW');

  // Products Data
  const { data: products, isLoading: isLoadingProducts, refetch: refetchProducts } = useProducts(true);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const removeProduct = useRemoveProduct();
  const createOrder = useCreateOrder();

  // Orders Data
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const { data: allOrders, isLoading: isLoadingOrders } = useAllOrders(
    orderFilter === 'ALL' ? undefined : orderFilter
  );
  const { data: myOrders, isLoading: isLoadingMyOrders } = useMyOrders();
  const confirmOrder = useConfirmOrder();
  const cancelOrder = useCancelOrder();
  const startPackingOrder = useStartPackingOrder();
  const markOrderPacked = useMarkOrderPacked();
  const dispatchOrderMutation = useDispatchOrder();
  const markOrderDelivered = useMarkOrderDelivered();

  // Dispatch Order & Tax Invoice Modal State
  const [dispatchingOrder, setDispatchingOrder] = useState<CustomerOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<CustomerOrder | null>(null);
  const [courierNameInput, setCourierNameInput] = useState('Delhivery Express');
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [activeCropFilter, setActiveCropFilter] = useState<string>('All');

  // Cart & Checkout State
  const { addItem, items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubTab, setActiveSubTab] = useState<'CATALOG' | 'CHECKOUT' | 'ORDERS'>('CATALOG');
  const [storeLayoutMode, setStoreLayoutMode] = useState<'GRID' | 'COMPACT_LIST'>('GRID');

  // Direct QR Code Payment Modal State
  const [isQrPaymentModalOpen, setIsQrPaymentModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(
    [user?.village, user?.district, user?.state].filter(Boolean).join(', ')
  );
  const [paymentMethod, setPaymentMethod] = useState<'DIRECT_QR' | 'COD' | 'ONLINE'>('DIRECT_QR');
  const [utrTransactionId, setUtrTransactionId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Modals & Settings State
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [editingPhotoProduct, setEditingPhotoProduct] = useState<Product | null>(null);
  const [updatePhotoUrl, setUpdatePhotoUrl] = useState('');

  // E-Commerce Settings
  const [gstEnabled, setGstEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [onlinePayEnabled, setOnlinePayEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [whatsappOrderBtn, setWhatsappOrderBtn] = useState(true);
  const [farmerFoodsEnabled, setFarmerFoodsEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('999');
  const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState('5');
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // 🔥 Shop Launch Hot Deal Popup Banner States
  const [hotDealBannerEnabled, setHotDealBannerEnabled] = useState(true);
  const [hotDealTitle, setHotDealTitle] = useState('🔥 MEGA FARMER FLASH SALE - 40% OFF!');
  const [isHotDealModalVisible, setIsHotDealModalVisible] = useState(true);

  // Full Customer Cart System States & Hooks
  const couponPreview = useCouponPreview();
  const orderUpiLink = useOrderUpiLink();
  const initiatePhonePe = useInitiatePhonePePayment();
  const { data: savedAddresses = [] } = useMyAddresses();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();

  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [editingAddressItem, setEditingAddressItem] = useState<CustomerAddress | null>(null);
  const [addrTag, setAddrTag] = useState<'HOME' | 'FARM' | 'WORK'>('HOME');
  const [addrLine, setAddrLine] = useState('');
  const [addrPostOffice, setAddrPostOffice] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrMobile, setAddrMobile] = useState('');
  const [addrError, setAddrError] = useState<string | null>(null);
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);

  const handlePincodeChange = async (pin: string) => {
    setAddrPincode(pin);
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      try {
        setIsLookingUpPincode(true);
        const res = await lookupPincode(pin);
        if (res.postOffice) setAddrPostOffice(res.postOffice);
        if (res.district) setAddrDistrict(res.district);
        if (res.state) setAddrState(res.state);
      } catch (e) {
        // ignore
      } finally {
        setIsLookingUpPincode(false);
      }
    }
  };

  const handleOpenEditAddressModal = (addr: CustomerAddress | null) => {
    setEditingAddressItem(addr);
    if (addr) {
      setAddrTag(addr.tag || 'HOME');
      setAddrLine(addr.line || '');
      setAddrPostOffice(addr.postOffice || '');
      setAddrDistrict(addr.district || '');
      setAddrState(addr.state || '');
      setAddrPincode(addr.pincode || '');
      setAddrMobile(addr.mobile || user?.mobile || (user as any)?.phone || '');
    } else {
      setAddrTag('HOME');
      setAddrLine('');
      setAddrPostOffice('');
      setAddrDistrict('');
      setAddrState('');
      setAddrPincode('');
      setAddrMobile(user?.mobile || (user as any)?.phone || '');
    }
    setAddrError(null);
    setIsEditAddressModalOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addrLine.trim() || !addrPostOffice.trim() || !addrDistrict.trim() || !addrState.trim() || !addrPincode.trim()) {
      setAddrError('Please fill all required address fields.');
      return;
    }
    if (!/^\d{6}$/.test(addrPincode.trim())) {
      setAddrError('PIN code must be exactly 6 digits.');
      return;
    }
    try {
      tap();
      const payload = {
        tag: addrTag,
        line: addrLine.trim(),
        postOffice: addrPostOffice.trim(),
        district: addrDistrict.trim(),
        state: addrState.trim(),
        pincode: addrPincode.trim(),
        mobile: addrMobile.trim() || undefined,
      };

      let saved: CustomerAddress;
      if (editingAddressItem?.id) {
        saved = await updateAddressMutation.mutateAsync({ id: editingAddressItem.id, payload });
      } else {
        saved = await createAddressMutation.mutateAsync(payload);
      }

      setSelectedAddressId(saved.id);
      setDeliveryAddress(composeAddress(saved));
      setIsEditAddressModalOpen(false);
      setEditingAddressItem(null);
    } catch (err: any) {
      setAddrError(err?.response?.data?.message || err?.message || 'Failed to save address.');
    }
  };
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  React.useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(savedAddresses[0].id);
      setDeliveryAddress(composeAddress(savedAddresses[0]));
    }
  }, [savedAddresses, selectedAddressId]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [requestHardCopyDelivery, setRequestHardCopyDelivery] = useState(false);

  const discountAmount = appliedDiscount?.amount ?? 0;
  const deliveryFeeAmount = requestHardCopyDelivery ? 100 : 0;
  const finalPayableAmount = Math.max((subtotal || 0) - discountAmount + deliveryFeeAmount, 0);

  const composeAddress = (addr: (typeof savedAddresses)[number]) => {
    const parts = [];
    const mob = addr.mobile || user?.mobile || (user as any)?.phone;
    parts.push(`Address: ${addr.line}`);
    if (addr.postOffice) parts.push(`Post Office: ${addr.postOffice}`);
    if (addr.district) parts.push(`District: ${addr.district}`);
    if (addr.state) parts.push(`State: ${addr.state}`);
    if (addr.pincode) parts.push(`PIN: ${addr.pincode}`);
    if (mob) parts.push(`Mobile: ${mob}`);
    return parts.join(', ');
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    try {
      const preview = await couponPreview.mutateAsync({ code, amount: subtotal || 0 });
      setAppliedDiscount({ code, amount: Number(preview.discountAmount) });
    } catch (err: any) {
      setAppliedDiscount(null);
      setCouponError(err?.response?.data?.message ?? 'Invalid coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponCode('');
    setCouponError(null);
  };

  // Product Creation Form
  const [newProductName, setNewProductName] = useState('');
  const [newBrand, setNewBrand] = useState('FarmsKing Certified');
  const [newCategory, setNewCategory] = useState('Seeds');
  const [newSubCategory, setNewSubCategory] = useState('Grain Seeds');
  const [newUnit, setNewUnit] = useState('bag');
  const [newPackSize, setNewPackSize] = useState('50 Kg Bag');
  const [newPackSizes, setNewPackSizes] = useState<string[]>([]);
  const [newCustomPackSizeInput, setNewCustomPackSizeInput] = useState('');
  const [variantDetailsMap, setVariantDetailsMap] = useState<Record<string, { mrp: string; sellingPrice: string; stockQty: string; sku: string }>>({});
  const [primaryVariant, setPrimaryVariant] = useState<string>('');
  const [newMrpPrice, setNewMrpPrice] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');

  // Format Builder & Edit States for Pack Size Variants
  const [builderVal, setBuilderVal] = useState('');
  const [builderUnit, setBuilderUnit] = useState('');
  const [builderMrp, setBuilderMrp] = useState('');
  const [builderSelling, setBuilderSelling] = useState('');
  const [builderStock, setBuilderStock] = useState('');
  const [builderSku, setBuilderSku] = useState('');
  const [editingVariantKey, setEditingVariantKey] = useState<string | null>(null);

  const updateVariantDetail = (sz: string, field: 'mrp' | 'sellingPrice' | 'stockQty' | 'sku', value: string) => {
    setVariantDetailsMap((prev) => ({
      ...prev,
      [sz]: {
        mrp: prev[sz]?.mrp ?? newMrpPrice,
        sellingPrice: prev[sz]?.sellingPrice ?? newSellingPrice,
        stockQty: prev[sz]?.stockQty ?? newStockQty,
        sku: prev[sz]?.sku ?? '',
        [field]: value,
      },
    }));
  };
  const [newGstRate, setNewGstRate] = useState('5% GST');
  const [newStockQty, setNewStockQty] = useState('50');
  const [newMoq, setNewMoq] = useState('1');
  const [newStockStatus, setNewStockStatus] = useState('IN_STOCK');
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newTechnicalFormula, setNewTechnicalFormula] = useState('');
  const [newDosageInstructions, setNewDosageInstructions] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newTargetCrop, setNewTargetCrop] = useState('All Crops');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [productError, setProductError] = useState<string | null>(null);

  // Dedicated Natural Farmer Food Form States
  const [isFarmerMadeProduct, setIsFarmerMadeProduct] = useState(false);
  const [farmerProducerName, setFarmerProducerName] = useState('');
  const [harvestBatchDate, setHarvestBatchDate] = useState('');
  const [processingMethod, setProcessingMethod] = useState('Cold-Pressed / Traditional Desi Kohlu');
  const [purityGuarantee, setPurityGuarantee] = useState('100% Organic & Chemical-Free · No Preservatives');
  const [shelfLifeInfo, setShelfLifeInfo] = useState('Best before 6 months in cool dry place');

  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);
  const [isTargetCropDropdownOpen, setIsTargetCropDropdownOpen] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isPrimaryCategoryDropdownOpen, setIsPrimaryCategoryDropdownOpen] = useState(false);
  const [isBuilderUnitDropdownOpen, setIsBuilderUnitDropdownOpen] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');

  const filteredBuilderUnits = ALL_MEASUREMENT_UNITS.filter((u: string) =>
    u.toLowerCase().includes(unitSearchQuery.trim().toLowerCase())
  );
  const [machineryPowerSource, setMachineryPowerSource] = useState('12V 12Ah Battery & Manual Dual');
  const [machineryWarranty, setMachineryWarranty] = useState('1 Year Manufacturer Warranty');
  const [machineryMotorSpecs, setMachineryMotorSpecs] = useState('Heavy Duty Brass Nozzle & Copper Motor Winding');

  const [chemicalActiveIngredient, setChemicalActiveIngredient] = useState('');
  const [chemicalFormulation, setChemicalFormulation] = useState('Liquid EC (Emulsifiable Concentrate)');
  const [chemicalDosageAcre, setChemicalDosageAcre] = useState('250 ml per acre in 150L water');

  const [bioBotanicalSource, setBioBotanicalSource] = useState('Pure Neem Seed Kernel Extract (10000 PPM)');
  const [bioCertificationStandard, setBioCertificationStandard] = useState('NPOP Certified Organic Inputs');

  const [seedVarietyName, setSeedVarietyName] = useState('');
  const [isSeedHybrid, setIsSeedHybrid] = useState(false);
  const [seedGerminationRate, setSeedGerminationRate] = useState('98% Minimum Germination Rate');
  const [seedMaturityDays, setSeedMaturityDays] = useState('120 - 130 Days to Harvest');

  const [couponPassValue, setCouponPassValue] = useState('Flat ₹500 Discount Voucher');
  const [couponValidityPeriod, setCouponValidityPeriod] = useState('Valid for 1 Year from Purchase Date');
  const [isBrowsingImage, setIsBrowsingImage] = useState(false);

  // UPI ID for Shop Direct Payment
  const activeShopUpiId = (settings as any)?.upiId || 'surindersinghmakhu-5@oksbi';
  const qrUpiLink = `upi://pay?pa=${activeShopUpiId}&pn=FarmsKing%20Shop&am=${finalPayableAmount}&cu=INR`;

  // Image Browser (Supports Multiple Photo Selection at Once + Auto Resizing)
  const convertAssetToBase64 = async (asset: ImagePicker.ImagePickerAsset): Promise<string | null> => {
    if (asset.base64) {
      const mime = asset.mimeType || 'image/jpeg';
      return `data:${mime};base64,${asset.base64}`;
    }
    if (!asset.uri) return null;
    if (asset.uri.startsWith('data:')) return asset.uri;

    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve(asset.uri);
          }
        };
        reader.onerror = () => resolve(asset.uri);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Blob to base64 conversion failed:', err);
      return asset.uri;
    }
  };

  const handleBrowseImage = async () => {
    try {
      tap();
      setIsBrowsingImage(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Permission to access image library is required.');
        setIsBrowsingImage(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const converted = await Promise.all(result.assets.map((asset) => convertAssetToBase64(asset)));
        const newUris = converted.filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 3));

        setNewProductImages((prev) => {
          const combined = [...prev, ...newUris];
          return Array.from(new Set(combined.filter((u) => u && typeof u === 'string' && u.trim().length > 3)));
        });
        if (!newImageUrl && newUris[0]) setNewImageUrl(newUris[0]);
        if (editingPhotoProduct && newUris[0]) setUpdatePhotoUrl(newUris[0]);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    } finally {
      setIsBrowsingImage(false);
    }
  };

  const handleCopyUpiId = async () => {
    tap();
    await Clipboard.setStringAsync(activeShopUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Metrics
  const totalRevenue = useMemo(() => {
    return (allOrders ?? [])
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [allOrders]);

  const paidOrdersCount = useMemo(() => {
    return (allOrders ?? []).filter((o) => o.paymentStatus === 'PAID').length;
  }, [allOrders]);

  const placedOrdersCount = useMemo(() => {
    return (allOrders ?? []).filter((o) => o.status === 'PLACED').length;
  }, [allOrders]);

  const categoriesList = useMemo(() => {
    const defaults = ['All', '🔥 Deals & VIP Coupons', 'Seeds', 'Fertilizers', 'Crop Protection', 'Farm Machinery & Tools', 'Bio & Organics'];
    if (farmerFoodsEnabled) defaults.push('Farmer Made Foods');
    const mappedDistinct = (products ?? [])
      .map((p) => {
        if (!p.category) return '';
        const c = p.category.trim();
        if (c.toLowerCase().startsWith('fertiliz')) return 'Fertilizers';
        if (c.toLowerCase().startsWith('seed')) return 'Seeds';
        if (c.toLowerCase().startsWith('farm mach') || c.toLowerCase().startsWith('machin')) return 'Farm Machinery & Tools';
        if (c.toLowerCase().startsWith('crop prot') || c.toLowerCase().startsWith('insect') || c.toLowerCase().startsWith('pestic')) return 'Crop Protection';
        if (c.toLowerCase().includes('farmer made') || c.toLowerCase().startsWith('natural farmer') || c.toLowerCase().includes('jaggery') || c.toLowerCase().includes('ghee') || c.toLowerCase().includes('honey')) return 'Farmer Made Foods';
        if (c.toLowerCase().includes('coupon') || c.toLowerCase().includes('plan') || c.toLowerCase().includes('deal')) return '🔥 Deals & VIP Coupons';
        if (c.toLowerCase().startsWith('bio') || c.toLowerCase().startsWith('organic')) return 'Bio & Organics';
        return c;
      })
      .filter(Boolean);
    return Array.from(new Set([...defaults, ...mappedDistinct]));
  }, [products, farmerFoodsEnabled]);

  const filteredProducts = useMemo(() => {
    return (products ?? []).filter((p) => {
      const pCat = (p.category || '').toLowerCase().trim();
      const aCat = activeCategory.toLowerCase().trim();
      const matchesCategory =
        activeCategory === 'All' ||
        pCat === aCat ||
        pCat.includes(aCat) ||
        aCat.includes(pCat) ||
        (activeCategory === '🔥 Deals & VIP Coupons' && (pCat.includes('coupon') || pCat.includes('plan') || pCat.includes('deal') || pCat.includes('farmer plan')));
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const outOfStockCount = (products ?? []).filter((p) => p.stockQty <= 0).length;
  const lowStockCount = (products ?? []).filter((p) => p.stockQty > 0 && p.stockQty <= Number(lowStockAlertThreshold)).length;
  const activeProductCount = (products ?? []).filter((p) => p.isActive).length;

  const cartQtyFor = (productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0;

  const discountPercent = useMemo(() => {
    const mrp = Number(newMrpPrice);
    const selling = Number(newSellingPrice);
    if (mrp > 0 && selling > 0 && mrp > selling) {
      return Math.round(((mrp - selling) / mrp) * 100);
    }
    return 0;
  }, [newMrpPrice, newSellingPrice]);

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setNewProductName(p.name);
    setNewCategory(p.category || 'Seeds');
    setNewUnit(p.unit || 'bag');
    setNewSellingPrice(String(p.price));
    setNewStockQty(String(p.stockQty));

    const desc = p.description || '';

    // 1. Brand
    const brandMatch = desc.match(/Brand:\s*([^|]+)/i);
    setNewBrand(brandMatch ? brandMatch[1].trim() : ((p as any).brand || 'FarmsKing Certified'));

    // 2. SubCategory
    const subCatMatch = desc.match(/SubCat:\s*([^|]+)/i);
    setNewSubCategory(subCatMatch ? subCatMatch[1].trim() : ((p as any).subCategory || 'General'));

    // 3. Target Crop
    const cropMatch = desc.match(/Crop:\s*([^|]+)/i);
    setNewTargetCrop(cropMatch ? cropMatch[1].trim() : ((p as any).targetCrop || 'All Crops'));

    // 4. Primary Variant
    const primMatch = desc.match(/PrimaryVariant:\s*([^|]+)/i);
    const primVar = primMatch ? primMatch[1].trim() : '';
    setPrimaryVariant(primVar);

    // 5. Pack Sizes
    const packSizesMatch = desc.match(/PackSizes:\s*([^|]+)/i);
    let extractedPackSizes: string[] = [];
    if (packSizesMatch && packSizesMatch[1]) {
      extractedPackSizes = packSizesMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
    } else if ((p as any).packSizes && Array.isArray((p as any).packSizes)) {
      extractedPackSizes = (p as any).packSizes;
    }
    if (extractedPackSizes.length === 0) {
      extractedPackSizes = [p.unit || '1 Pack'];
    }
    setNewPackSizes(extractedPackSizes);

    // 6. MRP
    const mrpMatch = desc.match(/MRP:\s*₹?\s*([\d.]+)/i);
    const parsedMrp = mrpMatch ? mrpMatch[1].trim() : ((p as any).mrp ? String((p as any).mrp) : String(Math.round(Number(p.price) * 1.25)));
    setNewMrpPrice(parsedMrp);

    // 7. Selling Price
    const sellMatch = desc.match(/Selling:\s*₹?\s*([\d.]+)/i);
    setNewSellingPrice(sellMatch ? sellMatch[1].trim() : String(p.price));

    // 8. Variant Rates Map
    const varRatesMatch = desc.match(/VariantRates:\s*([^|]+)/i);
    const vMap: Record<string, { mrp: string; sellingPrice: string; stockQty: string; sku: string }> = {};
    if (varRatesMatch && varRatesMatch[1]) {
      const parts = varRatesMatch[1].split('|').map((s) => s.trim());
      parts.forEach((pt) => {
        const colonIdx = pt.indexOf(':');
        if (colonIdx > -1) {
          let packName = pt.substring(0, colonIdx).replace(/\[PRIMARY MAIN ITEM\]/gi, '').trim();
          const details = pt.substring(colonIdx + 1);
          const vSelling = details.match(/Selling\s*₹?\s*([\d.]+)/i)?.[1] || String(p.price);
          const vMrp = details.match(/MRP\s*₹?\s*([\d.]+)/i)?.[1] || parsedMrp;
          const vStock = details.match(/Stock\s*([\d.]+)/i)?.[1] || String(p.stockQty);
          const vSku = details.match(/SKU:\s*([^\s,]+)/i)?.[1] || '';
          if (packName) {
            vMap[packName] = { mrp: vMrp, sellingPrice: vSelling, stockQty: vStock, sku: vSku };
          }
        }
      });
    }
    // 11. SKU & MOQ & Status
    const skuMatch = desc.match(/SKU:\s*([^|]+)/i);
    const skuVal = skuMatch ? skuMatch[1].trim() : ((p as any).sku || '');
    setNewSkuCode(skuVal);

    extractedPackSizes.forEach((sz) => {
      if (!vMap[sz]) {
        vMap[sz] = {
          mrp: parsedMrp || String(Math.round(Number(p.price) * 1.25)),
          sellingPrice: String(p.price),
          stockQty: String(p.stockQty),
          sku: skuVal || '',
        };
      }
    });
    setVariantDetailsMap(vMap);

    // Pre-fill builder with first/primary variant
    const firstSz = primVar && extractedPackSizes.includes(primVar) ? primVar : extractedPackSizes[0];
    if (firstSz) {
      const v = vMap[firstSz] || { mrp: parsedMrp, sellingPrice: String(p.price), stockQty: String(p.stockQty), sku: '' };
      const trimmed = firstSz.trim();
      const match = trimmed.match(/^([\d.]+)\s*(.*)$/);
      let valPart = trimmed;
      let unitPart = '';
      if (match) {
        valPart = match[1];
        unitPart = match[2] || '';
      } else {
        const parts = trimmed.split(/\s+/);
        valPart = parts[0] || trimmed;
        unitPart = parts.slice(1).join(' ');
      }
      setBuilderVal(valPart);
      setBuilderUnit(unitPart || p.unit || 'Pack');
      setBuilderMrp(v.mrp || parsedMrp);
      setBuilderSelling(v.sellingPrice || String(p.price));
      setBuilderStock(v.stockQty || String(p.stockQty));
      setBuilderSku(v.sku || skuVal);
      setEditingVariantKey(firstSz);
    }

    // 9. GST
    const gstMatch = desc.match(/GST:\s*([^|]+)/i);
    if (gstMatch && gstMatch[1]) {
      const gVal = gstMatch[1].trim();
      if (gVal.toLowerCase() === 'exempt') {
        setGstEnabled(false);
      } else {
        setGstEnabled(true);
        setNewGstRate(gVal);
      }
    }

    // 10. Formula & Dosage
    const formulaMatch = desc.match(/Formula:\s*([^|]+)/i);
    setNewTechnicalFormula(formulaMatch ? formulaMatch[1].trim() : ((p as any).technicalFormula || ''));

    const dosageMatch = desc.match(/Dosage:\s*([^|]+)/i);
    setNewDosageInstructions(dosageMatch ? dosageMatch[1].trim() : ((p as any).dosageInstructions || ''));

    // 11. MOQ & Status
    const moqMatch = desc.match(/MOQ:\s*([^|]+)/i);
    setNewMoq(moqMatch ? moqMatch[1].trim() : '1');

    const statusMatch = desc.match(/Status:\s*([^|]+)/i);
    setNewStockStatus(statusMatch ? statusMatch[1].trim() : (p.stockQty > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'));

    // 12. Farmer Food Details
    const isFarmerProduct = p.category === 'Natural Farmer Foods' || p.category === 'Farmer Made Foods' || (p as any).isFarmerFood || desc.includes('[FARMER_MADE]');
    setIsFarmerMadeProduct(isFarmerProduct);

    const producerMatch = desc.match(/Producer:\s*([^|]+)/i);
    setFarmerProducerName(producerMatch ? producerMatch[1].trim() : ((p as any).farmerProducerName || 'Direct Farmer Product'));

    const batchMatch = desc.match(/Batch:\s*([^|]+)/i);
    setHarvestBatchDate(batchMatch ? batchMatch[1].trim() : ((p as any).harvestBatchDate || 'Fresh Batch'));

    const methodMatch = desc.match(/Method:\s*([^|]+)/i);
    setProcessingMethod(methodMatch ? methodMatch[1].trim() : ((p as any).processingMethod || 'Cold-Pressed / Traditional Desi Kohlu'));

    const purityMatch = desc.match(/Purity:\s*([^|]+)/i);
    setPurityGuarantee(purityMatch ? purityMatch[1].trim() : ((p as any).purityGuarantee || '100% Organic & Chemical-Free · No Preservatives'));

    const shelfMatch = desc.match(/ShelfLife:\s*([^|]+)/i);
    setShelfLifeInfo(shelfMatch ? shelfMatch[1].trim() : ((p as any).shelfLifeInfo || 'Best before 6 months in cool dry place'));

    // 13. Clean Description
    let cleanDesc = desc;
    const descIdx = cleanDesc.indexOf('\n\nDescription:\n');
    if (descIdx > -1) {
      cleanDesc = cleanDesc.substring(descIdx + '\n\nDescription:\n'.length);
    } else if (cleanDesc.includes('Description:\n')) {
      cleanDesc = cleanDesc.split('Description:\n')[1] || cleanDesc;
    }
    const galleryIdx = cleanDesc.search(/\n\nGallery:\n|\nGallery:\n|Gallery:\s*/i);
    if (galleryIdx > -1) {
      cleanDesc = cleanDesc.substring(0, galleryIdx);
    }
    setNewProductDescription(cleanDesc.trim());

    // 14. Images & Multiple Photos
    const imageList: string[] = [];
    const isRealImageString = (s?: string | null): boolean => {
      if (!s || typeof s !== 'string') return false;
      const str = s.trim();
      if (str.length < 3) return false;
      if (
        str.startsWith('Brand:') ||
        str.startsWith('SubCat:') ||
        str.startsWith('Crop:') ||
        str.startsWith('PrimaryVariant:') ||
        str.startsWith('PackSizes:') ||
        str.startsWith('MRP:') ||
        str.startsWith('Selling:') ||
        str.startsWith('VariantRates:') ||
        str.startsWith('GST:') ||
        str.startsWith('Formula:') ||
        str.startsWith('Dosage:') ||
        str.startsWith('SKU:') ||
        str.startsWith('MOQ:') ||
        str.startsWith('Status:') ||
        str.startsWith('Description:') ||
        str.startsWith('Gallery:')
      ) {
        return false;
      }
      if (str.includes(' ') && !str.startsWith('data:') && !str.startsWith('file:') && !str.startsWith('http')) {
        return false;
      }
      return true;
    };

    const checkValidImg = (urlStr?: string | null) => {
      if (!urlStr || typeof urlStr !== 'string') return;
      const parts = parseImageUrls(urlStr);
      for (const pStr of parts) {
        if (isRealImageString(pStr) && !imageList.includes(pStr)) {
          imageList.push(pStr);
        }
      }
    };

    checkValidImg(p.imageUrl);

    const candidateImgs = [(p as any).images, (p as any).productImages, (p as any).galleryImages, (p as any).photos];
    candidateImgs.forEach((raw) => {
      if (Array.isArray(raw)) {
        raw.forEach((img) => {
          if (typeof img === 'string') checkValidImg(img);
        });
      } else if (typeof raw === 'string') {
        checkValidImg(raw);
      }
    });

    const descGalleryIdx = desc.search(/Gallery:\s*/i);
    if (descGalleryIdx > -1) {
      const gContent = desc.substring(descGalleryIdx).replace(/^Gallery:\s*/i, '');
      checkValidImg(gContent);
    }

    setNewProductImages(imageList);
    setNewImageUrl(imageList[0] || p.imageUrl || '');

    setProductError(null);
    setIsAddProductModalOpen(true);
  };

  const handleOpenAddModal = (defaultCategory?: string, defaultTitle?: string, defaultPrice?: string) => {
    setEditingProduct(null);
    setNewProductName(defaultTitle || '');
    setNewBrand('FarmsKing Certified');
    setNewCategory(defaultCategory || 'Seeds');
    setNewSubCategory('Grain Seeds');
    setNewUnit('bag');
    setNewPackSize('50 Kg Bag');
    setNewPackSizes([]);
    setNewCustomPackSizeInput('');
    setVariantDetailsMap({});
    setPrimaryVariant('');
    setNewMrpPrice('');
    setNewSellingPrice(defaultPrice || '');

    setBuilderVal('');
    setBuilderUnit('');
    setBuilderMrp('');
    setBuilderSelling('');
    setBuilderStock('');
    setBuilderSku('');
    setEditingVariantKey(null);

    setNewGstRate('5% GST');
    setNewStockQty('50');
    setNewMoq('1');
    setNewStockStatus('IN_STOCK');
    setNewSkuCode('');
    setNewTechnicalFormula('');
    setNewDosageInstructions('');
    setNewProductDescription('');
    setNewTargetCrop('All Crops');
    setNewImageUrl('');
    setNewProductImages([]);
    setProductError(null);

    setIsFarmerMadeProduct(false);
    setFarmerProducerName('');
    setHarvestBatchDate('');
    setProcessingMethod('Cold-Pressed / Traditional Desi Kohlu');
    setPurityGuarantee('100% Organic & Chemical-Free · No Preservatives');
    setShelfLifeInfo('Best before 6 months in cool dry place');

    setIsAddProductModalOpen(true);
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      setProductError('Please enter product title.');
      return;
    }
    if (newPackSizes.length === 0) {
      setProductError('Please select at least 1 Available Pack Size / Model variant.');
      return;
    }

    // Validate that every selected pack size has mandatory MRP, Selling Price and Stock filled
    for (const sz of newPackSizes) {
      const v = variantDetailsMap[sz] || {
        mrp: newMrpPrice,
        sellingPrice: newSellingPrice,
        stockQty: newStockQty,
      };
      if (!v.sellingPrice || Number(v.sellingPrice) <= 0) {
        setProductError(`⚠️ Variant "${sz}" da Selling Offer Price (₹) fill krna jruri hai.`);
        return;
      }
      if (!v.mrp || Number(v.mrp) <= 0) {
        setProductError(`⚠️ Variant "${sz}" da MRP Maximum Price (₹) fill krna jruri hai.`);
        return;
      }
      if (v.stockQty === undefined || v.stockQty === '' || Number(v.stockQty) < 0) {
        setProductError(`⚠️ Variant "${sz}" da Stock Quantity fill krna jruri hai.`);
        return;
      }
    }

    try {
      tap();
      const selectedPrimary = primaryVariant && newPackSizes.includes(primaryVariant) ? primaryVariant : newPackSizes[0];

      const variantRatesFormatted = newPackSizes.map((sz) => {
        const v = variantDetailsMap[sz] || { mrp: newMrpPrice, sellingPrice: newSellingPrice, stockQty: newStockQty, sku: '' };
        const isPrimTag = sz === selectedPrimary ? ' [PRIMARY MAIN ITEM]' : '';
        const skuTag = v.sku ? `, SKU: ${v.sku}` : '';
        return `${sz}${isPrimTag}: Selling ₹${v.sellingPrice}, MRP ₹${v.mrp}, Stock ${v.stockQty}${skuTag}`;
      }).join(' | ');

      const baseVariant = variantDetailsMap[selectedPrimary] || { mrp: newMrpPrice, sellingPrice: newSellingPrice, stockQty: newStockQty, sku: newSkuCode };
      const effectiveSellingPrice = Number(baseVariant.sellingPrice || newSellingPrice) || 0;
      const effectiveMrpPrice = Number(baseVariant.mrp || newMrpPrice) || Math.round(effectiveSellingPrice * 1.25);
      const effectiveStockQty = Number(baseVariant.stockQty || newStockQty) || 0;
      const computedStockStatus = effectiveStockQty >= 5 ? 'IN_STOCK' : (effectiveStockQty > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK');

      const packSizesFormatted = newPackSizes.length > 0 ? newPackSizes.join(', ') : (newPackSize || '50 Kg Bag');
      const validPhotos: string[] = [];
      const isRealImageString = (s?: string | null): boolean => {
        if (!s || typeof s !== 'string') return false;
        const str = s.trim();
        if (str.length < 3) return false;
        if (
          str.startsWith('Brand:') ||
          str.startsWith('SubCat:') ||
          str.startsWith('Crop:') ||
          str.startsWith('PrimaryVariant:') ||
          str.startsWith('PackSizes:') ||
          str.startsWith('MRP:') ||
          str.startsWith('Selling:') ||
          str.startsWith('VariantRates:') ||
          str.startsWith('GST:') ||
          str.startsWith('Formula:') ||
          str.startsWith('Dosage:') ||
          str.startsWith('SKU:') ||
          str.startsWith('MOQ:') ||
          str.startsWith('Status:') ||
          str.startsWith('Description:') ||
          str.startsWith('Gallery:')
        ) {
          return false;
        }
        if (str.includes(' ') && !str.startsWith('data:') && !str.startsWith('file:') && !str.startsWith('http')) {
          return false;
        }
        return true;
      };

      const checkAndPushPhoto = (pStr?: string) => {
        if (!pStr || typeof pStr !== 'string') return;
        const s = pStr.trim();
        if (isRealImageString(s) && !validPhotos.includes(s)) {
          validPhotos.push(s);
        }
      };

      if (newProductImages && newProductImages.length > 0) {
        newProductImages.forEach(checkAndPushPhoto);
      } else {
        if (newImageUrl && newImageUrl.trim()) checkAndPushPhoto(newImageUrl.trim());
        if (editingProduct && editingProduct.imageUrl && editingProduct.imageUrl.trim()) {
          checkAndPushPhoto(editingProduct.imageUrl.trim());
        }
      }

      const imagesCombined = validPhotos.join(' || ');
      const primaryPhoto = validPhotos[0] || (editingProduct ? editingProduct.imageUrl : undefined);

      const skuFormatted = (baseVariant.sku && baseVariant.sku.trim()) ? baseVariant.sku.trim() : (newSkuCode.trim() || `FK-SKU-${Date.now().toString().slice(-6)}`);
      const isFarmerMade = isFarmerMadeProduct || newCategory === 'Natural Farmer Foods';
      const farmerBadgeTag = isFarmerMade ? ` | [FARMER_MADE] | Producer: ${farmerProducerName.trim() || 'Direct Farmer Natural Food Product'} | Batch: ${harvestBatchDate.trim() || 'Fresh Batch'} | Method: ${processingMethod.trim() || 'Cold-Pressed / Traditional Desi Kohlu'} | Purity: ${purityGuarantee.trim() || '100% Organic & Chemical-Free · No Preservatives'} | ShelfLife: ${shelfLifeInfo.trim() || 'Best before 6 months in cool dry place'}` : ``;
      const descCombined = `Brand: ${newBrand} | SubCat: ${newSubCategory}${farmerBadgeTag} | Crop: ${newTargetCrop} | PrimaryVariant: ${selectedPrimary} | PackSizes: ${packSizesFormatted} | Size: ${selectedPrimary} | MRP: ₹${effectiveMrpPrice} | Selling: ₹${effectiveSellingPrice} | VariantRates: ${variantRatesFormatted} | GST: ${gstEnabled ? newGstRate : 'Exempt'} | Formula: ${newTechnicalFormula || 'Standard'} | Dosage: ${newDosageInstructions || 'As per advice'} | SKU: ${skuFormatted} | MOQ: ${newMoq} | Status: ${computedStockStatus}\n\nDescription:\n${newProductDescription.trim() || (isFarmerMade ? '100% Natural, chemical-free food product produced directly by local farmers.' : 'Factory genuine certified agriculture product.')}${imagesCombined ? `\n\nGallery:\n${imagesCombined}` : ''}`;

      if (editingProduct) {
        if (primaryPhoto) editingProduct.imageUrl = primaryPhoto;
        editingProduct.description = descCombined;

        await updateProduct.mutateAsync({
          id: editingProduct.id,
          payload: {
            name: newProductName.trim(),
            category: newCategory,
            unit: newUnit,
            price: Math.max(effectiveSellingPrice, 0),
            stockQty: Math.max(Math.round(effectiveStockQty), 0),
            imageUrl: primaryPhoto || undefined,
            description: descCombined,
          },
        });
      } else {
        await createProduct.mutateAsync({
          name: `${newProductName.trim()} (${packSizesFormatted})`,
          category: newCategory,
          unit: newUnit,
          price: Math.max(effectiveSellingPrice, 0),
          stockQty: Math.max(Math.round(effectiveStockQty), 0),
          imageUrl: primaryPhoto || undefined,
          description: descCombined,
        });
      }

      setEditingProduct(null);
      setIsFarmerMadeProduct(false);
      setNewProductName('');
      setNewBrand('FarmsKing Certified');
      setNewCategory('Seeds');
      setNewSubCategory('Grain Seeds');
      setIsFarmerMadeProduct(false);
      setFarmerProducerName('');
      setHarvestBatchDate('');
      setProcessingMethod('Cold-Pressed / Traditional Desi Kohlu');
      setPurityGuarantee('100% Organic & Chemical-Free · No Preservatives');
      setShelfLifeInfo('Best before 6 months in cool dry place');
      setNewUnit('bag');
      setNewPackSize('50 Kg Bag');
      setVariantDetailsMap({});
      setNewMrpPrice('');
      setNewSellingPrice('');
      setNewGstRate('5% GST');
      setNewStockQty('50');
      setNewMoq('1');
      setNewStockStatus('IN_STOCK');
      setNewSkuCode('');
      setNewTechnicalFormula('');
      setNewDosageInstructions('');
      setNewProductDescription('');
      setNewTargetCrop('All Crops');
      setNewImageUrl('');
      setNewProductImages([]);
      setProductError(null);
      setIsAddProductModalOpen(false);
      refetchProducts();
    } catch (err: any) {
      const serverMsg = Array.isArray(err?.response?.data?.message)
        ? err.response.data.message.join(', ')
        : err?.response?.data?.message || err?.message || 'Could not save product SKU.';
      setProductError(serverMsg);
    }
  };

  const handlePlaceOrderDirect = async () => {
    if (items.length === 0) return;
    if (!deliveryAddress.trim()) {
      setCheckoutError('Please enter delivery address.');
      return;
    }
    if (paymentMethod === 'DIRECT_QR' && !utrTransactionId.trim()) {
      setCheckoutError('Please enter 12-digit UTR / Payment Reference ID.');
      return;
    }
    setCheckoutError(null);
    try {
      tap();
      let addressParts = [deliveryAddress.trim()];
      if (paymentMethod === 'DIRECT_QR' && utrTransactionId.trim()) {
        addressParts.push(`[UPI UTR: ${utrTransactionId.trim()}]`);
      }
      if (requestHardCopyDelivery) {
        addressParts.push(`[HARD-COPY COUPON CARD COURIER (+₹100 Fee)]`);
      } else {
        addressParts.push(`[FREE WHATSAPP COUPON DELIVERY]`);
      }
      const finalAddressNote = addressParts.join(' | ');

      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: finalAddressNote,
        couponCode: appliedDiscount?.code || couponCode.trim() || undefined,
        paymentMode: paymentMethod === 'COD' ? 'COD' : 'ONLINE',
      });

      const placedOrderNum = order?.orderNumber || 'PLACED';
      clearCart();
      setIsQrPaymentModalOpen(false);
      const utrSubmitted = utrTransactionId.trim();
      setUtrTransactionId('');
      setCouponCode('');
      setAppliedDiscount(null);

      const msg = `Order #${placedOrderNum} confirmed successfully! ${paymentMethod === 'DIRECT_QR' ? 'UTR transaction reference saved.' : ''}`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Order Confirmed 🎉', msg);
      }

      // Switch to My Orders subtab inside shop
      setActiveSubTab('ORDERS');

      // Prompt WhatsApp notification to shop
      const shopPhone = (settings as any)?.phone || '919876543210';
      const waMsg = `Hello FarmsKing! I have confirmed Order #${placedOrderNum} for ₹${finalPayableAmount.toLocaleString('en-IN')}.
Address: ${deliveryAddress.trim()}
Payment: ${paymentMethod}${utrSubmitted ? ` (UTR: ${utrSubmitted})` : ''}`;
      setTimeout(() => {
        Linking.openURL(`https://wa.me/${shopPhone}?text=${encodeURIComponent(waMsg)}`).catch(() => {});
      }, 600);

    } catch (err: any) {
      console.error('Order placement failed:', err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Could not place order. Please try again.';
      setCheckoutError(Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg);
    }
  };

  const handleSaveSettings = () => {
    tap();
    setSettingsNotice('✅ Shop Settings Saved & Updated Successfully!');
    setTimeout(() => setSettingsNotice(null), 3000);
  };

  return (
    <View style={styles.container}>
      {/* Top E-Commerce Mode Switcher for Admins */}
      {isAdminOrSuperAdmin && (
        <View style={styles.adminTopBar}>
          <View style={styles.brandBadge}>
            <Ionicons name="bag-check" size={14} color="#f59e0b" />
            <Text style={styles.brandBadgeText}>AGRISTORE E-COMMERCE MANAGEMENT HUB</Text>
          </View>

          <View style={styles.modeSwitchGroup}>
            <TouchableOpacity
              style={[styles.modeBtn, viewMode === 'MANAGEMENT' && styles.modeBtnActive]}
              onPress={() => {
                tap();
                setViewMode('MANAGEMENT');
              }}
            >
              <Ionicons name="settings" size={12} color={viewMode === 'MANAGEMENT' ? '#ffffff' : '#94a3b8'} />
              <Text style={[styles.modeBtnText, viewMode === 'MANAGEMENT' && styles.modeBtnTextActive]}>
                AgriStore Console
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeBtn, viewMode === 'STORE' && styles.modeBtnActiveStore]}
              onPress={() => {
                tap();
                setViewMode('STORE');
              }}
            >
              <Ionicons name="eye" size={12} color={viewMode === 'STORE' ? '#ffffff' : '#94a3b8'} />
              <Text style={[styles.modeBtnText, viewMode === 'STORE' && styles.modeBtnTextActive]}>
                Customer Store View
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {viewMode === 'MANAGEMENT' ? (
        /* 🏬 FULL-FEATURED E-COMMERCE MANAGEMENT SYSTEM */
        <View style={{ flex: 1 }}>
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.sellerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerHeaderTitle}>AgriStore Console 🌾</Text>
              <Text style={styles.sellerHeaderSubtitle}>Product SKU Inventory, Orders Fulfillment & Payments</Text>
            </View>

            <TouchableOpacity
              style={styles.sellerAddBtn}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                handleOpenAddModal();
              }}
            >
              <Ionicons name="add-circle" size={16} color="#ffffff" />
              <Text style={styles.sellerAddBtnText}>+ Add SKU Product</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.ecomNavBar}>
            {(
              [
                { key: 'OVERVIEW', label: '📊 Dashboard' },
                { key: 'INVENTORY', label: '📦 Stock & Catalog' },
                { key: 'ORDERS', label: `🚚 Sales (${allOrders?.length ?? 0})` },
                { key: 'PAYMENTS', label: '💳 Payments' },
                { key: 'DEALS', label: '🏷️ Deals' },
                { key: 'SETTINGS', label: '⚙️ Settings' },
              ] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.ecomNavItem, adminTab === tab.key && styles.ecomNavItemActive]}
                onPress={() => {
                  tap();
                  setAdminTab(tab.key);
                }}
              >
                <Text style={[styles.ecomNavText, adminTab === tab.key && styles.ecomNavTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.md, gap: 12 }} showsVerticalScrollIndicator={false}>
            {adminTab === 'OVERVIEW' ? (
              <View style={{ gap: 12 }}>
                <View style={styles.analyticsGrid}>
                  <LinearGradient colors={['#065f46', '#047857']} style={styles.analyticsCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.analyticsTitle}>TOTAL GROSS SALES (GMV)</Text>
                      <Ionicons name="cash" size={18} color="#a7f3d0" />
                    </View>
                    <Text style={styles.analyticsValue}>₹{(totalRevenue ?? 0).toLocaleString('en-IN')}</Text>
                    <Text style={styles.analyticsSub}>Paid & Dispatched Customer Orders</Text>
                  </LinearGradient>

                  <LinearGradient colors={['#1e40af', '#1d4ed8']} style={styles.analyticsCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.analyticsTitle}>TOTAL SALES ORDERS</Text>
                      <Ionicons name="receipt" size={18} color="#bfdbfe" />
                    </View>
                    <Text style={styles.analyticsValue}>{allOrders?.length ?? 0}</Text>
                    <Text style={styles.analyticsSub}>
                      {placedOrdersCount > 0 ? `⚠️ ${placedOrdersCount} order(s) pending dispatch` : 'Fulfillment complete'}
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.kpiRow}>
                  <View style={styles.kpiBox}>
                    <Ionicons name="cube" size={16} color="#0284c7" />
                    <Text style={styles.kpiVal}>{activeProductCount}</Text>
                    <Text style={styles.kpiLbl}>Active SKUs</Text>
                  </View>

                  <View style={styles.kpiBox}>
                    <Ionicons name="warning" size={16} color="#d97706" />
                    <Text style={[styles.kpiVal, { color: lowStockCount > 0 ? '#d97706' : '#16a34a' }]}>
                      {lowStockCount}
                    </Text>
                    <Text style={styles.kpiLbl}>Low Stock</Text>
                  </View>

                  <View style={styles.kpiBox}>
                    <Ionicons name="close-circle" size={16} color="#dc2626" />
                    <Text style={[styles.kpiVal, { color: outOfStockCount > 0 ? '#dc2626' : '#16a34a' }]}>
                      {outOfStockCount}
                    </Text>
                    <Text style={styles.kpiLbl}>Out of Stock</Text>
                  </View>
                </View>
              </View>
            ) : adminTab === 'INVENTORY' ? (
              <View style={{ gap: 10 }}>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.tableHeaderTitle}>📦 SKU Inventory & Multi-Crop Catalog</Text>
                  <Text style={styles.tableHeaderCount}>({filteredProducts.length} items)</Text>
                </View>

                {/* Crop Filter Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                  {['All', 'Hidden / Off', 'Seeds', 'Fertilizers', 'Crop Protection', 'Farm Machinery & Tools', 'Bio & Organics'].map((cropCat) => {
                    const isActive = activeCropFilter === cropCat;
                    const isHiddenBtn = cropCat === 'Hidden / Off';
                    return (
                      <TouchableOpacity
                        key={cropCat}
                        style={[
                          styles.filterChip,
                          isActive && {
                            backgroundColor: isHiddenBtn ? '#dc2626' : '#0284c7',
                            borderColor: isHiddenBtn ? '#b91c1c' : '#0369a1',
                          },
                        ]}
                        onPress={() => setActiveCropFilter(cropCat)}
                      >
                        <Text style={[styles.filterChipText, isActive && { color: '#ffffff' }]}>{cropCat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {filteredProducts
                  .filter((p) => {
                    if (activeCropFilter === 'Hidden / Off') return !p.isActive;
                    if (activeCropFilter === 'All') return true;
                    return p.category && (p.category.toLowerCase().includes(activeCropFilter.toLowerCase()) || activeCropFilter.toLowerCase().includes(p.category.toLowerCase()));
                  })
                  .map((p) => {
                    const isLow = p.stockQty > 0 && p.stockQty < 5;
                    const isOut = p.stockQty <= 0;
                    return (
                      <View key={p.id} style={[styles.mgmtProductCard, premiumShadow('#0f172a', 'sm'), !p.isActive && { opacity: 0.6 }]}>
                        {(() => {
                          const displayImg = getProductDisplayImage(p);
                          return displayImg ? (
                            <Image source={{ uri: displayImg }} style={styles.mgmtProductImg} resizeMode="cover" />
                          ) : (
                            <View style={styles.mgmtProductImgPlaceholder}>
                              <Ionicons name="cube" size={20} color="#0284c7" />
                            </View>
                          );
                        })()}

                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.mgmtProductName} numberOfLines={1}>{p.name}</Text>
                          <Text style={styles.mgmtProductMeta}>
                            💰 ₹{p.price} / {p.unit} · {p.category || 'General'}
                          </Text>

                          {/* In-Line Quick Stock Adjuster */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' }}>Stock:</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', borderRadius: RADIUS.pill, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => {
                                  tap();
                                  updateProduct.mutate({ id: p.id, payload: { stockQty: Math.max(p.stockQty - 1, 0) } });
                                }}
                              >
                                <Ionicons name="remove" size={12} color="#334155" />
                              </TouchableOpacity>

                              <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: isOut ? '#dc2626' : isLow ? '#b45309' : '#16a34a', minWidth: 20, textAlign: 'center' }}>
                                {p.stockQty}
                              </Text>

                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => {
                                  tap();
                                  updateProduct.mutate({ id: p.id, payload: { stockQty: p.stockQty + 1 } });
                                }}
                              >
                                <Ionicons name="add" size={12} color="#334155" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TouchableOpacity
                            style={[styles.updatePhotoBtn, { backgroundColor: '#fef3c7' }]}
                            onPress={() => {
                              tap();
                              handleOpenEditModal(p);
                            }}
                          >
                            <Ionicons name="create-outline" size={13} color="#b45309" />
                            <Text style={[styles.updatePhotoBtnText, { color: '#b45309' }]}>Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.updatePhotoBtn}
                            onPress={() => {
                              tap();
                              setEditingPhotoProduct(p);
                              setUpdatePhotoUrl(p.imageUrl || '');
                            }}
                          >
                            <Ionicons name="camera" size={12} color="#0284c7" />
                            <Text style={styles.updatePhotoBtnText}>Photo</Text>
                          </TouchableOpacity>

                          <Switch
                            value={p.isActive}
                            onValueChange={(val) => {
                              tap();
                              updateProduct.mutate({ id: p.id, payload: { isActive: val } });
                            }}
                          />

                          <TouchableOpacity onPress={() => { tap(); removeProduct.mutate(p.id); }}>
                            <Ionicons name="trash-outline" size={16} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
              </View>
            ) : adminTab === 'ORDERS' ? (
              <View style={{ gap: 12 }}>
                {/* Status Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                  {(['ALL', 'PLACED', 'CONFIRMED', 'PACKING', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] as const).map((st) => {
                    const isActive = orderFilter === st;
                    const count = st === 'ALL' ? (allOrders?.length ?? 0) : (allOrders ?? []).filter((o) => o.status === st).length;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.filterChip,
                          isActive && { backgroundColor: '#0284c7', borderColor: '#0369a1' },
                        ]}
                        onPress={() => setOrderFilter(st)}
                      >
                        <Text style={[styles.filterChipText, isActive && { color: '#ffffff' }]}>
                          {st} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {isLoadingOrders ? (
                  <ActivityIndicator color="#0284c7" style={{ marginTop: 20 }} />
                ) : !allOrders || allOrders.length === 0 ? (
                  <View style={styles.emptyCenter}>
                    <Ionicons name="cube-outline" size={44} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No customer sales orders found.</Text>
                  </View>
                ) : (
                  allOrders.map((order) => {
                    const statusMeta = ORDER_STATUS_META[order.status] || { label: order.status, bg: '#f1f5f9', color: '#334155' };
                    return (
                      <View key={order.id} style={[styles.cartItemRow, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'column', gap: 10 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bae6fd' }}>
                              <Ionicons name="receipt" size={18} color="#0284c7" />
                            </View>
                            <View>
                              <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' }}>{order.orderNumber}</Text>
                              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                                {new Date((order as any).createdAt || (order as any).date || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                          </View>
                          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, backgroundColor: statusMeta.bg }}>
                            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: statusMeta.color }}>{statusMeta.label}</Text>
                          </View>
                        </View>

                        {/* Customer Details & Structured Delivery Address Card */}
                        {renderDeliveryAddressCard(order)}
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.semiBold, color: '#334155', marginTop: 2 }}>
                          🛍️ Items: {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                        </Text>

                        {/* Payment Info & Status Actions */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8, flexWrap: 'wrap', gap: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</Text>
                            <View style={{ backgroundColor: order.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: order.paymentStatus === 'PAID' ? '#047857' : '#b45309' }}>
                                {order.paymentStatus || 'PENDING'} · {order.paymentMode || 'COD'}
                              </Text>
                            </View>
                          </View>

                          {/* Status Action Buttons */}
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              style={{ backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 8, paddingVertical: 6, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                              onPress={() => { tap(); setInvoiceOrder(order); }}
                            >
                              <Ionicons name="document-text-outline" size={13} color="#334155" />
                              <Text style={{ color: '#334155', fontSize: 11, fontFamily: FONT.bold }}>Invoice</Text>
                            </TouchableOpacity>

                            {order.status === 'PLACED' && (
                              <>
                                <TouchableOpacity
                                  style={{ backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md }}
                                  disabled={confirmOrder.isPending}
                                  onPress={() => { tap(); confirmOrder.mutate(order.id); }}
                                >
                                  <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: FONT.bold }}>✅ Confirm</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md }}
                                  disabled={cancelOrder.isPending}
                                  onPress={() => { tap(); cancelOrder.mutate(order.id); }}
                                >
                                  <Text style={{ color: '#dc2626', fontSize: 11, fontFamily: FONT.bold }}>Cancel</Text>
                                </TouchableOpacity>
                              </>
                            )}

                            {(order.status === 'CONFIRMED' || order.status === 'PACKING') && (
                              <TouchableOpacity
                                style={{ backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md }}
                                onPress={() => {
                                  tap();
                                  setDispatchingOrder(order);
                                }}
                              >
                                <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: FONT.bold }}>🚚 Dispatch</Text>
                              </TouchableOpacity>
                            )}

                            {order.status === 'DISPATCHED' && (
                              <TouchableOpacity
                                style={{ backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md }}
                                disabled={markOrderDelivered.isPending}
                                onPress={() => { tap(); markOrderDelivered.mutate(order.id); }}
                              >
                                <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: FONT.bold }}>🎉 Mark Delivered</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            ) : adminTab === 'PAYMENTS' ? (
              <View style={{ gap: 12 }}>
                <View style={styles.analyticsGrid}>
                  <LinearGradient colors={['#0f766e', '#0d9488']} style={styles.analyticsCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.analyticsTitle}>PAID REVENUE</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#99f6e4" />
                    </View>
                    <Text style={styles.analyticsValue}>₹{(totalRevenue ?? 0).toLocaleString('en-IN')}</Text>
                    <Text style={styles.analyticsSub}>{paidOrdersCount} Paid Orders</Text>
                  </LinearGradient>

                  <LinearGradient colors={['#4338ca', '#3730a3']} style={styles.analyticsCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.analyticsTitle}>SHOP UPI ID</Text>
                      <Ionicons name="qr-code" size={18} color="#c7d2fe" />
                    </View>
                    <Text style={[styles.analyticsValue, { fontSize: 13 }]} numberOfLines={1}>{activeShopUpiId}</Text>
                    <Text style={styles.analyticsSub}>Official Store UPI Address</Text>
                  </LinearGradient>
                </View>

                {/* QR Code Verification Preview Card */}
                <View style={[styles.settingsCard, { alignItems: 'center', gap: 8 }]}>
                  <Text style={styles.settingsCardTitle}>📱 Active Direct QR Code Merchant Link</Text>
                  <View style={styles.qrBox}>
                    <QRCode value={`upi://pay?pa=${activeShopUpiId}&pn=FarmsKing%20Store&cu=INR`} size={140} />
                  </View>
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>{activeShopUpiId}</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' }}>
                    Customers can scan this QR code or enter this UPI ID for instant direct payments.
                  </Text>
                </View>
              </View>
            ) : adminTab === 'DEALS' ? (
              <View style={{ gap: 12 }}>
                <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.analyticsCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.analyticsTitle}>🌾 MANDI FLASH SALES & SEASONAL DEALS</Text>
                    <Ionicons name="flame" size={20} color="#fde047" />
                  </View>
                  <Text style={[styles.analyticsValue, { fontSize: 20 }]}>Active 24-Hour Deals</Text>
                  <Text style={styles.analyticsSub}>Special discounted prices for farmers during crop sowing seasons</Text>
                </LinearGradient>

                <View style={styles.settingsCard}>
                  <Text style={styles.settingsCardTitle}>🔥 Current Active Flash Deals</Text>
                  {[
                    { title: 'Kharif Special: Bio Vermicompost 5kg', discount: '20% OFF', price: '₹280', original: '₹350', timer: 'Ends in 14h 22m' },
                    { title: 'Pusa Bt Cotton Hybrid Seed Pack (500g)', discount: '15% OFF', price: '₹950', original: '₹1,120', timer: 'Ends in 08h 10m' },
                    { title: 'Battery Sprayer Pump 16L Heavy Duty', discount: '25% OFF', price: '₹2,450', original: '₹3,200', timer: 'Ends in 19h 45m' },
                  ].map((deal, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>{deal.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#16a34a' }}>{deal.price}</Text>
                          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', textDecorationLine: 'line-through' }}>{deal.original}</Text>
                          <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#b45309' }}>{deal.discount}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#dc2626' }}>⏳ {deal.timer}</Text>
                        <TouchableOpacity style={{ backgroundColor: '#7c3aed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#ffffff' }}>Active</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity style={styles.saveSettingsBtn} onPress={() => { tap(); Platform.OS === 'web' ? alert('New Mandi Flash Sale Deal Created!') : Alert.alert('Create Deal', 'New Mandi Flash Sale banner created successfully!'); }}>
                    <Ionicons name="add-circle" size={16} color="#ffffff" />
                    <Text style={styles.saveSettingsBtnText}>+ Create New Flash Sale Deal</Text>
                  </TouchableOpacity>
                </View>

                {/* 🎟️ Farmer VIP Plans & Discount Coupons Hub in DEALS tab */}
                <View style={styles.settingsCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.settingsCardTitle}>🎟️ Farmer VIP Plans & Discount Coupons Hub</Text>
                    <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill }}>
                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#b45309' }}>DEALS & SUBSIDIES</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: -4 }}>
                    Manage Farmer membership plans, Store discount vouchers & Machinery rental subsidies under Deals. Delivered via WhatsApp or optional Hard-Copy card (+₹100 courier fee).
                  </Text>

                  {[
                    { title: '🥇 VIP Gold Farmer Membership Pass', type: 'Annual Pass', price: '₹999', original: '₹1,999', desc: '10% Extra Store Discount + Priority Agronomist Call Support' },
                    { title: '🚜 Machinery Rental Subsidy Voucher', type: 'Rental Coupon', price: '₹499', original: '₹800', desc: 'Flat ₹500 discount voucher on Tractor/Harvester rentals' },
                    { title: '🧪 Soil Testing & Drone Spray Voucher', type: 'Service Pass', price: '₹299', original: '₹500', desc: 'Free 1 Acre Soil NPK Test + 20% Off Drone Spraying' },
                    { title: '🎟️ Agri Store Flat ₹500 Discount Coupon', type: 'Store Discount', price: '₹350', original: '₹500', desc: 'Redeemable on any Fertilizers or Seeds order above ₹2,000' },
                  ].map((plan, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fffbeb', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fde68a' }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#78350f' }}>{plan.title}</Text>
                          <View style={{ backgroundColor: '#d97706', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>{plan.type}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#92400e' }}>{plan.desc}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#15803d' }}>{plan.price}</Text>
                          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', textDecorationLine: 'line-through' }}>{plan.original}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={{ backgroundColor: '#b45309', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                        onPress={() => {
                          tap();
                          handleOpenAddModal(
                            'Farmer Plan & Coupons',
                            plan.title.replace(/^[^\w]+/, '').trim(),
                            plan.price.replace('₹', '').replace(',', '')
                          );
                        }}
                      >
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#ffffff' }}>+ Add to Store</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ) : adminTab === 'SETTINGS' ? (
              <View style={styles.settingsCard}>
                <Text style={styles.settingsCardTitle}>⚙️ AgriStore E-Commerce Global Settings</Text>

                <View style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingLabel}>🏷️ Enable GST Calculations (0%, 5%, 12%, 18%)</Text>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>Calculate GST breakdown on product checkout</Text>
                  </View>
                  <Switch value={gstEnabled} onValueChange={setGstEnabled} />
                </View>

                <View style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingLabel}>💵 Cash on Delivery (COD)</Text>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>Allow farmers to pay cash upon order delivery</Text>
                  </View>
                  <Switch value={codEnabled} onValueChange={setCodEnabled} />
                </View>

                <View style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingLabel}>💳 Online Payments & UPI QR</Text>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>Accept PhonePe, Google Pay, BHIM & Netbanking</Text>
                  </View>
                  <Switch value={onlinePayEnabled} onValueChange={setOnlinePayEnabled} />
                </View>

                <View style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingLabel}>💬 WhatsApp Direct Order Button</Text>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>Allow direct WhatsApp order inquiries</Text>
                  </View>
                  <Switch value={whatsappOrderBtn} onValueChange={setWhatsappOrderBtn} />
                </View>

                {/* 🔥 Hot Deal Popup Setting Row */}
                <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'stretch', gap: 6, backgroundColor: '#fff7ed', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#ffedd5', marginVertical: 6 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#c2410c' }}>🔥 Shop Launch Hot Deal Popup Banner</Text>
                        <View style={{ backgroundColor: '#ea580c', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ fontSize: 8.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>POPUP ACTIVE</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#9a3412', marginTop: 2 }}>
                        Automatically show a promotional sale popup banner every time customers open the shop tab.
                      </Text>
                    </View>
                    <Switch
                      value={hotDealBannerEnabled}
                      onValueChange={(val) => {
                        setHotDealBannerEnabled(val);
                        if (val) setIsHotDealModalVisible(true);
                      }}
                      trackColor={{ false: '#cbd5e1', true: '#fdba74' }}
                      thumbColor={hotDealBannerEnabled ? '#ea580c' : '#94a3b8'}
                    />
                  </View>

                  {hotDealBannerEnabled && (
                    <View style={{ gap: 4, marginTop: 4, borderTopWidth: 1, borderTopColor: '#fed7aa', paddingTop: 6 }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#9a3412' }}>Promotional Headline Banner Text</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: '#ffffff', height: 38 }]}
                        value={hotDealTitle}
                        onChangeText={setHotDealTitle}
                        placeholder="e.g. 🔥 MEGA FARMER FLASH SALE - 40% OFF!"
                      />
                    </View>
                  )}
                </View>

                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.settingLabel}>🌾 Natural & Organic Farmer Foods Category</Text>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>
                      Enable sale of 100% natural, chemical-free farmer produced foods (Gur, Shakkar, Kacchi Ghani Oils, A2 Ghee, Forest Honey, Spices & Pulses)
                    </Text>
                  </View>
                  <Switch value={farmerFoodsEnabled} onValueChange={setFarmerFoodsEnabled} />
                </View>

                <View style={{ gap: 4, marginTop: 4 }}>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' }}>🚚 Free Shipping Minimum Order Amount (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={freeShippingThreshold}
                    onChangeText={setFreeShippingThreshold}
                    placeholder="e.g. 999"
                  />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' }}>⚠️ Low Stock Warning Threshold (Qty)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={lowStockAlertThreshold}
                    onChangeText={setLowStockAlertThreshold}
                    placeholder="e.g. 5"
                  />
                </View>

                {/* Discount Coupons Link */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#1e1b4b',
                    paddingVertical: 11,
                    borderRadius: RADIUS.md,
                    marginTop: 6,
                  }}
                  onPress={() => {
                    tap();
                    router.push('/(tabs)/super-coupons');
                  }}
                >
                  <Ionicons name="pricetag" size={16} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold }}>
                    🎟️ Open Discount Coupons & Offers Engine
                  </Text>
                </TouchableOpacity>

                {settingsNotice ? (
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#16a34a', textAlign: 'center' }}>
                    {settingsNotice}
                  </Text>
                ) : null}

                <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings}>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text style={styles.saveSettingsBtnText}>Save Store Configurations</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : (
        /* 🛒 CUSTOMER STOREFRONT VIEW & EMBEDDED DASHBOARD CART */
        <View style={{ flex: 1 }}>
          {/* Official FarmsKing Hero Header */}
          <LinearGradient colors={['#0a2417', '#0f3923', '#15803d']} style={styles.hero}>
            <View style={{ width: '100%', maxWidth: 1200, alignSelf: 'center', gap: 12 }}>
              <View style={styles.headerTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.logoBadgeWrap}>
                    <BrandLogo size={42} useFastBundledOnly={true} useHdQuality={true} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#86efac', letterSpacing: 0.2, marginBottom: 2 }}>
                      👋 Welcome, {user?.name || 'Farmer'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.heroTitle}>FarmsKing Store</Text>
                      <View style={styles.verifiedTag}>
                        <Ionicons name="checkmark-circle" size={12} color="#facc15" />
                        <Text style={styles.verifiedTagText}>Verified Official</Text>
                      </View>
                    </View>
                    <Text style={styles.heroSubtitle}>100% Factory Genuine Seeds, Fertilizers & Machinery</Text>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.cartIconBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      tap();
                      setActiveSubTab('CHECKOUT');
                    }}
                  >
                    <Ionicons name="bag-handle" size={21} color="#ffffff" />
                    {itemCount > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{itemCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Search Input Box */}
              <View style={styles.searchBarBox}>
                <Ionicons name="search" size={18} color="#15803d" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search: Seeds, Fertilizers, Insecticides, Spray Pumps..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#64748b" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

          </LinearGradient>

          {/* Sub Nav Bar */}
          <View style={styles.subTabBar}>
            <View style={{ flexDirection: 'row', width: '100%', maxWidth: 1200, alignSelf: 'center' }}>
              <TouchableOpacity
                style={[styles.subTabItem, activeSubTab === 'CATALOG' && styles.subTabItemActive]}
                onPress={() => {
                  tap();
                  setActiveSubTab('CATALOG');
                }}
              >
                <Ionicons name="grid-outline" size={15} color={activeSubTab === 'CATALOG' ? '#15803d' : '#64748b'} />
                <Text style={[styles.subTabText, activeSubTab === 'CATALOG' && styles.subTabTextActive]}>Products</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabItem, activeSubTab === 'CHECKOUT' && styles.subTabItemActive]}
                onPress={() => {
                  tap();
                  setActiveSubTab('CHECKOUT');
                }}
              >
                <Ionicons name="bag-check-outline" size={15} color={activeSubTab === 'CHECKOUT' ? '#15803d' : '#64748b'} />
                <Text style={[styles.subTabText, activeSubTab === 'CHECKOUT' && styles.subTabTextActive]}>
                  Shopping Cart ({itemCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabItem, activeSubTab === 'ORDERS' && styles.subTabItemActive]}
                onPress={() => {
                  tap();
                  setActiveSubTab('ORDERS');
                }}
              >
                <Ionicons name="receipt-outline" size={15} color={activeSubTab === 'ORDERS' ? '#15803d' : '#64748b'} />
                <Text style={[styles.subTabText, activeSubTab === 'ORDERS' && styles.subTabTextActive]}>
                  My Orders
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeSubTab === 'CATALOG' ? (
            <View style={{ flex: 1 }}>
              {/* Category Filter Chips Bar */}
              <View style={{ backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryFilterRow}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', maxWidth: 1200, alignSelf: 'center' }}
                >
                {categoriesList.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      activeCategory === cat && { backgroundColor: '#15803d', borderColor: '#166534' },
                    ]}
                    onPress={() => {
                      tap();
                      setActiveCategory(cat);
                    }}
                  >
                    <Text style={[styles.filterChipText, activeCategory === cat && { color: '#ffffff' }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
                </ScrollView>
              </View>



              

              {/* Layout View Mode Bar (Grid vs List Toggle) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: 6, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
                <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#475569' }}>
                  📦 Available Products ({filteredProducts.length})
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: storeLayoutMode === 'GRID' ? '#15803d' : '#f1f5f9',
                      borderWidth: 1,
                      borderColor: storeLayoutMode === 'GRID' ? '#166534' : '#cbd5e1',
                    }}
                    onPress={() => { tap(); setStoreLayoutMode('GRID'); }}
                  >
                    <Ionicons name="grid" size={13} color={storeLayoutMode === 'GRID' ? '#ffffff' : '#64748b'} />
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: storeLayoutMode === 'GRID' ? '#ffffff' : '#64748b' }}>
                      2-Col Grid
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: storeLayoutMode === 'COMPACT_LIST' ? '#15803d' : '#f1f5f9',
                      borderWidth: 1,
                      borderColor: storeLayoutMode === 'COMPACT_LIST' ? '#166534' : '#cbd5e1',
                    }}
                    onPress={() => { tap(); setStoreLayoutMode('COMPACT_LIST'); }}
                  >
                    <Ionicons name="list" size={13} color={storeLayoutMode === 'COMPACT_LIST' ? '#ffffff' : '#64748b'} />
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: storeLayoutMode === 'COMPACT_LIST' ? '#ffffff' : '#64748b' }}>
                      Compact List
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                contentContainerStyle={storeLayoutMode === 'COMPACT_LIST' ? [styles.grid, { flexDirection: 'column', gap: 8 }] : styles.grid}
                showsVerticalScrollIndicator={false}
              >
                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyCenter}>
                    <Ionicons name="storefront-outline" size={44} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No products available right now.</Text>
                  </View>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQty={cartQtyFor(product.id)}
                      layoutMode={storeLayoutMode}
                      onPressProduct={(p) => setSelectedProductForDetail(p)}
                      onAdd={() =>
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: Number(product.price),
                          unit: product.unit,
                          imageUrl: product.imageUrl,
                        })
                      }
                    />
                  ))
                )}
              </ScrollView>
            </View>
          ) : activeSubTab === 'CHECKOUT' ? (
            /* 🛒 COMPLETE CUSTOMER DASHBOARD CART SYSTEM */
            <ScrollView contentContainerStyle={{ padding: SPACING.md, gap: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
                <Text style={styles.tableHeaderTitle}>🛒 My Shopping Cart Items ({items.length})</Text>
                {items.length > 0 && (
                  <TouchableOpacity onPress={clearCart} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#dc2626' }}>Clear Cart</Text>
                  </TouchableOpacity>
                )}
              </View>

              {items.length === 0 ? (
                <View style={styles.emptyCenter}>
                  <Ionicons name="cart-outline" size={48} color="#cbd5e1" />
                  <Text style={[styles.emptyText, { fontSize: 14, fontFamily: FONT.bold, color: '#475569' }]}>Your shopping cart is empty</Text>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
                    Browse our product catalog to add genuine seeds, fertilizers, and farm equipment.
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 12, backgroundColor: '#15803d', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md }}
                    onPress={() => { tap(); setActiveSubTab('CATALOG'); }}
                  >
                    <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12.5 }}>🌾 Browse Products</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                items.map((item) => (
                  <View key={item.productId} style={[styles.cartItemRow, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }]}>
                    <View style={{ width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
                      <Ionicons name="cube-outline" size={22} color="#15803d" />
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 6 }}>
                      <Text style={[styles.mgmtProductName, { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' }]}>{item.name}</Text>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>{item.unit}</Text>
                      <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#15803d', marginTop: 2 }}>₹{item.price.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <TouchableOpacity onPress={() => removeItem(item.productId)} style={{ padding: 2 }}>
                        <Ionicons name="trash-outline" size={15} color="#dc2626" />
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="remove" size={14} color="#334155" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a', minWidth: 16, textAlign: 'center' }}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="add" size={14} color="#334155" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}

              {items.length > 0 && (
                <View style={[styles.checkoutBox, premiumShadow('#0f172a', 'md'), { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 16, borderWidth: 1.5, borderColor: '#cbd5e1', gap: 16 }]}>
                  
                  {/* Checkout Header Banner */}
                  <View style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="bag-check" size={22} color="#facc15" />
                      <View>
                        <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#ffffff' }}>⚡ Quick 3-Step Checkout</Text>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8' }}>Verified Safe & Fast Village Delivery</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: '#15803d', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill }}>
                      <Text style={{ fontSize: 10, fontFamily: FONT.extraBold, color: '#ffffff' }}>Step-by-Step</Text>
                    </View>
                  </View>

                  {/* 📍 STEP 1: DELIVERY ADDRESS */}
                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#ffffff' }}>1</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>📍 Select Delivery Address</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleOpenEditAddressModal(null)}>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#15803d' }}>+ Add New</Text>
                      </TouchableOpacity>
                    </View>

                    {savedAddresses.length > 0 ? (
                      <View style={{ gap: 8 }}>
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <TouchableOpacity
                              key={addr.id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: 10,
                                borderRadius: RADIUS.md,
                                borderWidth: 1.5,
                                borderColor: isSelected ? '#15803d' : '#cbd5e1',
                                backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                              }}
                              onPress={() => {
                                setSelectedAddressId(addr.id);
                                setDeliveryAddress(composeAddress(addr));
                              }}
                            >
                              <Ionicons
                                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={isSelected ? '#15803d' : '#94a3b8'}
                                style={{ marginTop: 2 }}
                              />
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isSelected ? '#15803d' : '#0f172a' }}>
                                    🏷️ {addr.tag || 'Address'}
                                  </Text>
                                  {isSelected && (
                                    <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                      <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#15803d' }}>SELECTED</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#334155', marginTop: 2, lineHeight: 16 }}>
                                  {composeAddress(addr)}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={{ padding: 4 }}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditAddressModal(addr);
                                }}
                              >
                                <Ionicons name="pencil" size={16} color={isSelected ? '#15803d' : '#64748b'} />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#15803d', borderStyle: 'dashed' }}
                        onPress={() => handleOpenEditAddressModal(null)}
                      >
                        <Ionicons name="location-sharp" size={20} color="#15803d" />
                        <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#15803d' }}>+ Add Registered Delivery Address</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 🎟️ STEP 2: DISCOUNT COUPON */}
                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#b45309', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#ffffff' }}>2</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>🎟️ Have a Discount Coupon?</Text>
                    </View>

                    {appliedDiscount ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bbf7d0', paddingVertical: 8, paddingHorizontal: 10 }}>
                        <Ionicons name="pricetag" size={16} color="#16a34a" />
                        <Text style={{ flex: 1, fontSize: 12, fontFamily: FONT.bold, color: '#15803d' }}>
                          Discount Code '{appliedDiscount.code}' Applied — Savings: ₹{appliedDiscount.amount.toLocaleString('en-IN')}
                        </Text>
                        <TouchableOpacity onPress={handleRemoveCoupon}>
                          <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                        <TextInput
                          style={[styles.modalInput, { flex: 1, height: 40, textTransform: 'uppercase', fontFamily: FONT.bold, fontSize: 12.5 }]}
                          placeholder="Enter coupon code (e.g. KISAAN50)"
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="characters"
                          value={couponCode}
                          onChangeText={setCouponCode}
                        />
                        <TouchableOpacity
                          style={{ backgroundColor: '#15803d', paddingHorizontal: 16, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' }}
                          disabled={!couponCode.trim() || couponPreview.isPending}
                          onPress={handleApplyCoupon}
                        >
                          {couponPreview.isPending ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <Text style={{ color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold }}>Apply Code</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                    {couponError ? <Text style={{ color: '#dc2626', fontSize: 11.5, fontFamily: FONT.medium }}>{couponError}</Text> : null}
                  </View>

                  {/* 💳 STEP 2.5: COUPON & PLAN HARD-COPY DELIVERY OPTION */}
                  <View style={{ backgroundColor: requestHardCopyDelivery ? '#fff7ed' : '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: requestHardCopyDelivery ? '#ea580c' : '#e2e8f0', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: requestHardCopyDelivery ? '#ffedd5' : '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="card" size={16} color={requestHardCopyDelivery ? '#c2410c' : '#64748b'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: requestHardCopyDelivery ? '#9a3412' : '#0f172a' }}>
                            💳 Printed Hard-Copy Card Courier (+₹100)
                          </Text>
                          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                            {requestHardCopyDelivery
                              ? 'Physical printed coupon card will be couriered to your address (+₹100 fee added).'
                              : 'By default, your coupon/plan pass is sent FREE instantly on WhatsApp upon order confirmation.'}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={requestHardCopyDelivery}
                        onValueChange={(val) => {
                          tap();
                          setRequestHardCopyDelivery(val);
                        }}
                        trackColor={{ false: '#cbd5e1', true: '#ffedd5' }}
                        thumbColor={requestHardCopyDelivery ? '#ea580c' : '#94a3b8'}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: requestHardCopyDelivery ? '#ffedd5' : '#f1f5f9', padding: 8, borderRadius: 8 }}>
                      <Ionicons name={requestHardCopyDelivery ? 'cube-outline' : 'logo-whatsapp'} size={15} color={requestHardCopyDelivery ? '#c2410c' : '#16a34a'} />
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: requestHardCopyDelivery ? '#9a3412' : '#166534', flex: 1 }}>
                        {requestHardCopyDelivery
                          ? '📦 Hard-Copy Delivery Selected: ₹100 courier fee added to cart total.'
                          : '📱 Free Digital Delivery: Coupon code sent via WhatsApp on order confirmation.'}
                      </Text>
                    </View>
                  </View>

                  {/* 🧾 STEP 3: ORDER BILL SUMMARY */}
                  <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#bbf7d0', borderLeftWidth: 5, borderLeftColor: '#15803d', gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#0284c7', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#ffffff' }}>3</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>🧾 Order Bill Summary</Text>
                    </View>

                    <View style={{ gap: 4, marginTop: 2 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b' }}>Items Subtotal:</Text>
                        <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#334155' }}>₹{finalPayableAmount.toLocaleString('en-IN')}</Text>
                      </View>

                      {appliedDiscount ? (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12.5, fontFamily: FONT.medium, color: '#16a34a' }}>Coupon Discount:</Text>
                          <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#16a34a' }}>-₹{discountAmount.toLocaleString('en-IN')}</Text>
                        </View>
                      ) : null}

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, fontFamily: FONT.medium, color: requestHardCopyDelivery ? '#c2410c' : '#16a34a' }}>
                          {requestHardCopyDelivery ? 'Courier Fee (Hard-Copy Card):' : 'Delivery Fee:'}
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: requestHardCopyDelivery ? '#c2410c' : '#16a34a' }}>
                          {requestHardCopyDelivery ? '+₹100 (Printed Card Courier)' : 'FREE Instant WhatsApp Delivery 📱'}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 8, marginTop: 4 }}>
                        <Text style={{ fontFamily: FONT.extraBold, fontSize: 16, color: '#0f172a' }}>Total Amount Payable:</Text>
                        <Text style={{ fontFamily: FONT.extraBold, fontSize: 22, color: '#15803d' }}>
                          ₹{finalPayableAmount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 💳 STEP 4: PAYMENT METHOD & PLACE ORDER */}
                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#4338ca', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#ffffff' }}>4</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>💳 Select Payment Mode *</Text>
                    </View>

                    <View style={{ flexDirection: 'column', gap: 8 }}>
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          padding: 12,
                          borderRadius: RADIUS.md,
                          borderWidth: 1.5,
                          borderColor: paymentMethod === 'DIRECT_QR' ? '#0284c7' : '#cbd5e1',
                          backgroundColor: paymentMethod === 'DIRECT_QR' ? '#f0f9ff' : '#ffffff',
                        }}
                        onPress={() => setPaymentMethod('DIRECT_QR')}
                      >
                        <Ionicons name={paymentMethod === 'DIRECT_QR' ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={paymentMethod === 'DIRECT_QR' ? '#0284c7' : '#94a3b8'} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: paymentMethod === 'DIRECT_QR' ? '#0369a1' : '#0f172a' }}>
                            📱 Direct UPI QR Code Payment (PhonePe / GPay / Paytm)
                          </Text>
                          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                            Instant payment via QR Code scan. Enter 12-digit UTR to confirm order immediately.
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {onlinePayEnabled && (
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            padding: 12,
                            borderRadius: RADIUS.md,
                            borderWidth: 1.5,
                            borderColor: paymentMethod === 'ONLINE' ? '#6366f1' : '#cbd5e1',
                            backgroundColor: paymentMethod === 'ONLINE' ? '#eeef2' : '#ffffff',
                          }}
                          onPress={() => setPaymentMethod('ONLINE')}
                        >
                          <Ionicons name={paymentMethod === 'ONLINE' ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={paymentMethod === 'ONLINE' ? '#6366f1' : '#94a3b8'} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: paymentMethod === 'ONLINE' ? '#4338ca' : '#0f172a' }}>
                              💳 Online Payment Gateway (PhonePe / Debit Card / Netbanking)
                            </Text>
                            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                              Automatic online checkout via integrated payment gateway.
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {codEnabled && (
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            padding: 12,
                            borderRadius: RADIUS.md,
                            borderWidth: 1.5,
                            borderColor: paymentMethod === 'COD' ? '#16a34a' : '#cbd5e1',
                            backgroundColor: paymentMethod === 'COD' ? '#f0fdf4' : '#ffffff',
                          }}
                          onPress={() => setPaymentMethod('COD')}
                        >
                          <Ionicons name={paymentMethod === 'COD' ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={paymentMethod === 'COD' ? '#16a34a' : '#94a3b8'} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: paymentMethod === 'COD' ? '#15803d' : '#0f172a' }}>
                              📦 Cash on Delivery
                            </Text>
                            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                              Pay in cash when order arrives at your village doorstep.
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Helper Instruction Banner */}
                    <View style={{ backgroundColor: '#fffbebe6', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#fef3c7', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="information-circle" size={16} color="#b45309" />
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#92400e', flex: 1 }}>
                        {paymentMethod === 'DIRECT_QR'
                          ? '👇 Tap "Scan QR & Confirm Order" button below. Scan the QR code and enter 12-digit UTR.'
                          : paymentMethod === 'ONLINE'
                          ? '👇 Tap "Pay Online & Confirm Order" button below.'
                          : '👇 Tap "Confirm Cash on Delivery Order" button below to complete your order.'}
                      </Text>
                    </View>

                    {/* Prominent Action Button */}
                    <TouchableOpacity
                      style={[styles.placeOrderBtn, { backgroundColor: '#15803d', marginTop: 2, paddingVertical: 14, borderRadius: RADIUS.md }]}
                      activeOpacity={0.88}
                      onPress={() => {
                        if (paymentMethod === 'DIRECT_QR') {
                          setIsQrPaymentModalOpen(true);
                        } else {
                          handlePlaceOrderDirect();
                        }
                      }}
                    >
                      <Text style={[styles.placeOrderBtnText, { fontSize: 15, fontFamily: FONT.extraBold }]}>
                        {paymentMethod === 'DIRECT_QR'
                          ? `📱 Scan QR & Confirm Order (₹${finalPayableAmount.toLocaleString('en-IN')})`
                          : paymentMethod === 'ONLINE'
                          ? `💳 Pay Online & Confirm Order (₹${finalPayableAmount.toLocaleString('en-IN')})`
                          : `📦 Confirm Cash on Delivery Order (₹${finalPayableAmount.toLocaleString('en-IN')})`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={{ padding: SPACING.md, gap: 12, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
              {/* 📦 MY ORDERS SUB-TAB UI */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
                <Text style={styles.tableHeaderTitle}>📦 My Customer Orders ({myOrders?.length ?? 0})</Text>
              </View>

              {isLoadingMyOrders ? (
                <ActivityIndicator color="#15803d" style={{ marginTop: 20 }} />
              ) : !myOrders || myOrders.length === 0 ? (
                <View style={styles.emptyCenter}>
                  <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                  <Text style={[styles.emptyText, { fontSize: 14, fontFamily: FONT.bold, color: '#475569' }]}>No orders placed yet</Text>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
                    Your placed seed and fertilizer order history will appear here.
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 12, backgroundColor: '#15803d', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md }}
                    onPress={() => { tap(); setActiveSubTab('CATALOG'); }}
                  >
                    <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12.5 }}>🌾 Start Shopping</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                myOrders.map((order) => {
                  const statusMeta = ORDER_STATUS_META[order.status] || { label: order.status, bg: '#f1f5f9', color: '#334155' };
                  const canCancel = order.status === 'PLACED';
                  const itemsSummary = order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ');

                  return (
                    <View key={order.id} style={[styles.cartItemRow, premiumShadow('#0f172a', 'sm'), { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'column', gap: 10 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 34, height: 34, borderRadius: RADIUS.md, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
                            <Ionicons name="receipt" size={17} color="#15803d" />
                          </View>
                          <View>
                            <Text style={{ fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' }}>{order.orderNumber}</Text>
                            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8' }}>
                              {new Date((order as any).createdAt || (order as any).date || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                          </View>
                        </View>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, backgroundColor: statusMeta.bg }}>
                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: statusMeta.color }}>{statusMeta.label}</Text>
                        </View>
                      </View>

                      <View style={{ width: '100%', gap: 4 }}>
                        <Text style={{ fontSize: 12, fontFamily: FONT.semiBold, color: '#334155' }}>Items: {itemsSummary}</Text>
                        {renderDeliveryAddressCard(order)}
                      </View>

                      {order.status === 'DISPATCHED' && order.courierName ? (
                        <View style={{ backgroundColor: '#eff6ff', borderRadius: RADIUS.md, padding: 8, borderWidth: 1, borderColor: '#bfdbfe' }}>
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#1d4ed8' }}>
                            🚚 {order.courierName}{order.trackingId ? ` · Tracking ID: ${order.trackingId}` : ''}
                          </Text>
                        </View>
                      ) : null}

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' }}>Payment Mode:</Text>
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>{order.paymentMode || 'COD'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={{ fontSize: 15, fontFamily: FONT.extraBold, color: '#15803d' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</Text>
                          {canCancel && (
                            <TouchableOpacity
                              style={{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md }}
                              disabled={cancelOrder.isPending}
                              onPress={() => { tap(); cancelOrder.mutate(order.id); }}
                            >
                              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#dc2626' }}>Cancel Order</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Cart Bottom Checkout Banner */}
          {itemCount > 0 && activeSubTab !== 'CHECKOUT' && (
            <TouchableOpacity
              style={styles.cartFooterBanner}
              activeOpacity={0.9}
              onPress={() => {
                tap();
                setActiveSubTab('CHECKOUT');
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.cartFooterBadge}>
                  <Text style={styles.cartFooterBadgeText}>{itemCount}</Text>
                </View>
                <View>
                  <Text style={styles.cartFooterText}>{itemCount} Item{itemCount > 1 ? 's' : ''} in Cart</Text>
                  <Text style={styles.cartFooterSub}>Total: ₹{finalPayableAmount.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.cartFooterAction}>Proceed to Checkout</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 📱 DIRECT UPI QR CODE PAYMENT MODAL (WITH UTR INPUT) */}
      <Modal visible={isQrPaymentModalOpen} transparent animationType="fade" onRequestClose={() => setIsQrPaymentModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', gap: 8 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="qr-code" size={20} color="#0284c7" />
                <Text style={styles.modalTitle}>Direct UPI QR Payment</Text>
              </View>
              <TouchableOpacity onPress={() => setIsQrPaymentModalOpen(false)}>
                <Ionicons name="close-circle" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' }}>
              Scan the QR Code below with Google Pay, PhonePe, Paytm or BHIM to pay:
            </Text>

            <View style={styles.qrBox}>
              <QRCode value={qrUpiLink} size={180} />
            </View>

            <Text style={{ fontSize: 22, fontFamily: FONT.extraBold, color: '#0d9488' }}>
              ₹{finalPayableAmount.toLocaleString('en-IN')}
            </Text>

            {/* UPI ID Badge & Copy Button */}
            <View style={styles.upiCopyBadge}>
              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>
                UPI ID: {activeShopUpiId}
              </Text>
              <TouchableOpacity onPress={handleCopyUpiId} style={styles.copyBtn}>
                <Ionicons name={copiedUpi ? 'checkmark' : 'copy'} size={12} color="#ffffff" />
                <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' }}>
                  {copiedUpi ? 'Copied!' : 'Copy UPI'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* UTR Transaction ID Entry */}
            <View style={{ width: '100%', gap: 4, marginTop: 4 }}>
              <Text style={styles.inputLabel}>Enter 12-Digit UTR / Transaction Reference ID *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 329182938102"
                keyboardType="numeric"
                value={utrTransactionId}
                onChangeText={setUtrTransactionId}
              />
            </View>

            {checkoutError ? <Text style={styles.errorText}>{checkoutError}</Text> : null}

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { width: '100%', backgroundColor: '#0d9488' }]}
              disabled={createOrder.isPending}
              onPress={handlePlaceOrderDirect}
            >
              {createOrder.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalSubmitText}>✅ Verify Payment & Place Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add New SKU Product Modal */}
      <Modal visible={isAddProductModalOpen} transparent animationType="fade" onRequestClose={() => setIsAddProductModalOpen(false)}>
        <View style={styles.modalOverlay}>
          {(isPrimaryCategoryDropdownOpen || isSubCategoryDropdownOpen || isBrandDropdownOpen || isBuilderUnitDropdownOpen) && (
            <Pressable
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 150 }}
              onPress={() => {
                setIsPrimaryCategoryDropdownOpen(false);
                setIsSubCategoryDropdownOpen(false);
                setIsBrandDropdownOpen(false);
                setIsBuilderUnitDropdownOpen(false);
              }}
            />
          )}

          <View style={[styles.modalContent, { width: '95%', maxWidth: 580, padding: 14, zIndex: 200 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 10 }}>
                <Ionicons name={editingProduct ? "create" : "add-circle"} size={20} color="#0284c7" />
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {editingProduct ? `Edit SKU: ${editingProduct.name}` : 'Add Product SKU (Multiple Photos & Specs)'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddProductModalOpen(false)}>
                <Ionicons name="close-circle" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 540 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {/* 1. Primary Category & Sub-Category Side-by-Side Dropdown Selection */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start', marginBottom: 12, position: 'relative', zIndex: 200 }}>
                {/* Primary Category Dropdown */}
                <View style={{ flex: 1.2, minWidth: 160, gap: 4, position: 'relative' }}>
                  <Text style={styles.inputLabel}>1. Select Primary Category *</Text>
                  {(() => {
                    const catList = [
                      { key: 'Seeds', icon: '🌾', label: 'Seeds' },
                      { key: 'Fertilizers', icon: '🧪', label: 'Fertilizers & Chemicals' },
                      { key: 'Farm Machinery & Tools', icon: '🚜', label: 'Machinery & Tools' },
                      { key: 'Bio & Organics', icon: '🌿', label: 'Bio & Organics' },
                      { key: 'Farmer Made Foods', icon: '👨‍🌾', label: 'Farmer Made Foods' },
                      { key: 'Farmer Plan & Coupons', icon: '🎟️', label: 'Deals & VIP Coupons' },
                    ];
                    const currentCatObj = catList.find(c => c.key === newCategory) || catList[0];
                    return (
                      <View style={{ position: 'relative' }}>
                        <TouchableOpacity
                          style={[
                            styles.modalInput,
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingRight: 8,
                              backgroundColor: '#ffffff',
                              borderColor: isPrimaryCategoryDropdownOpen ? '#166534' : '#cbd5e1',
                              borderWidth: 1.5,
                            },
                          ]}
                          activeOpacity={0.85}
                          onPress={() => {
                            tap();
                            setIsPrimaryCategoryDropdownOpen(!isPrimaryCategoryDropdownOpen);
                            setIsSubCategoryDropdownOpen(false);
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            <Text style={{ fontSize: 14 }}>{currentCatObj.icon}</Text>
                            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
                              {currentCatObj.label}
                            </Text>
                          </View>
                          <Ionicons name={isPrimaryCategoryDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#166534" />
                        </TouchableOpacity>

                        {isPrimaryCategoryDropdownOpen && (
                          <View
                            style={{
                              position: 'absolute',
                              top: 48,
                              left: 0,
                              right: 0,
                              backgroundColor: '#ffffff',
                              borderRadius: RADIUS.md,
                              borderWidth: 1.5,
                              borderColor: '#166534',
                              maxHeight: 220,
                              zIndex: 999,
                              ...premiumShadow('#0f172a', 'md'),
                            }}
                          >
                            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true} style={{ maxHeight: 215 }}>
                              {catList.map((cat) => {
                                const isSelected = newCategory === cat.key;
                                const isFood = cat.key === 'Farmer Made Foods' || cat.key === 'Natural Farmer Foods';
                                return (
                                  <TouchableOpacity
                                    key={cat.key}
                                    style={{
                                      paddingHorizontal: 10,
                                      paddingVertical: 9,
                                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                                      borderBottomWidth: 0.5,
                                      borderBottomColor: '#f1f5f9',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                    }}
                                    onPress={() => {
                                      tap();
                                      setNewCategory(cat.key);
                                      setNewSubCategory(CATEGORY_TREE[cat.key]?.[0] || 'General');
                                      setIsFarmerMadeProduct(isFood);
                                      setIsPrimaryCategoryDropdownOpen(false);
                                    }}
                                  >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                      <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                                      <Text style={{ fontSize: 11.5, fontFamily: isSelected ? FONT.bold : FONT.medium, color: isSelected ? '#166534' : '#334155' }} numberOfLines={1}>
                                        {cat.label}
                                      </Text>
                                    </View>
                                    {isSelected && <Ionicons name="checkmark-circle" size={14} color="#166534" />}
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </View>

                {/* Sub-Category Dropdown (Optional) */}
                <View style={{ flex: 1, minWidth: 140, gap: 4, position: 'relative' }}>
                  <Text style={styles.inputLabel}>Sub-Category (Optional)</Text>
                  <TouchableOpacity
                    style={[
                      styles.modalInput,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingRight: 8,
                        backgroundColor: '#ffffff',
                        borderColor: isSubCategoryDropdownOpen ? '#4338ca' : '#cbd5e1',
                        borderWidth: 1.5,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      tap();
                      setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen);
                      setIsPrimaryCategoryDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: newSubCategory ? '#4338ca' : '#64748b' }} numberOfLines={1}>
                      {newSubCategory || '-- None (Select Optional) --'}
                    </Text>
                    <Ionicons name={isSubCategoryDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#4338ca" />
                  </TouchableOpacity>

                  {/* Sub-Category Dropdown List */}
                  {isSubCategoryDropdownOpen && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 48,
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        borderRadius: RADIUS.md,
                        borderWidth: 1.5,
                        borderColor: '#4338ca',
                        maxHeight: 210,
                        zIndex: 999,
                        ...premiumShadow('#0f172a', 'md'),
                      }}
                    >
                      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true} style={{ maxHeight: 200 }}>
                        {['-- None (Clear Sub-Category) --', ...(CATEGORY_TREE[newCategory] || ['General'])].map((sub) => {
                          const isNoneOpt = sub === '-- None (Clear Sub-Category) --';
                          const isSel = isNoneOpt ? !newSubCategory : newSubCategory === sub;
                          return (
                            <TouchableOpacity
                              key={sub}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f1f5f9',
                                backgroundColor: isSel ? '#e0e7ff' : '#ffffff',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                              onPress={() => {
                                tap();
                                setNewSubCategory(isNoneOpt ? '' : sub);
                                setIsSubCategoryDropdownOpen(false);
                              }}
                            >
                              <Text style={{ fontSize: 11.5, fontFamily: isSel ? FONT.bold : FONT.medium, color: isNoneOpt ? '#dc2626' : isSel ? '#4338ca' : '#334155' }}>
                                {sub}
                              </Text>
                              {isSel && <Ionicons name="checkmark-circle" size={14} color={isNoneOpt ? '#dc2626' : '#4338ca'} />}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* 📷 Multiple Product Photos Section */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 4 }}>
                <Text style={styles.inputLabel}>2. Product Photos *</Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: '#e0f2fe',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: RADIUS.pill,
                    borderWidth: 1,
                    borderColor: '#7dd3fc',
                  }}
                  onPress={handleBrowseImage}
                  disabled={isBrowsingImage}
                >
                  {isBrowsingImage ? (
                    <ActivityIndicator color="#0284c7" size="small" />
                  ) : (
                    <>
                      <Ionicons name="images" size={14} color="#0284c7" />
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0369a1' }}>
                        + Add Multiple Photos ({newProductImages.length})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>


              {newProductImages.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
                    {newProductImages.map((imgUri, index) => {
                      const isPrimary = index === 0;
                      return (
                        <TouchableOpacity
                          key={index}
                          activeOpacity={0.8}
                          style={{ position: 'relative' }}
                          onPress={() => {
                            tap();
                            const reordered = [imgUri, ...newProductImages.filter((_, i) => i !== index)];
                            setNewProductImages(reordered);
                            setNewImageUrl(imgUri);
                          }}
                        >
                          <Image
                            source={{ uri: imgUri }}
                            style={{
                              width: 75,
                              height: 75,
                              borderRadius: 8,
                              borderWidth: isPrimary ? 2.5 : 1,
                              borderColor: isPrimary ? '#16a34a' : '#cbd5e1',
                            }}
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            style={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              backgroundColor: '#dc2626',
                              borderRadius: 10,
                              width: 20,
                              height: 20,
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10,
                            }}
                            onPress={() => {
                              const remaining = newProductImages.filter((_, i) => i !== index);
                              setNewProductImages(remaining);
                              if (newImageUrl === imgUri) setNewImageUrl(remaining[0] || '');
                            }}
                          >
                            <Ionicons name="close" size={12} color="#ffffff" />
                          </TouchableOpacity>

                          {isPrimary ? (
                            <View style={{ position: 'absolute', bottom: 2, left: 2, right: 2, backgroundColor: '#16a34a', borderRadius: 4, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 8, fontFamily: FONT.extraBold, color: '#ffffff', textAlign: 'center' }}>⭐ PRIMARY</Text>
                            </View>
                          ) : (
                            <View style={{ position: 'absolute', bottom: 2, left: 2, right: 2, backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: 4, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 7.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'center' }}>Set Primary</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

              {/* 🏷️ Product Title & Brand Manufacturer Dropdown Row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start', marginVertical: 2, zIndex: 100 }}>
                <View style={{ flex: 1.5, minWidth: 180, gap: 4 }}>
                  <Text style={styles.inputLabel}>2. Product Title *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Syngenta Virtako Insecticide"
                    value={newProductName}
                    onChangeText={setNewProductName}
                  />
                </View>

                <View style={{ flex: 1, minWidth: 140, gap: 4, position: 'relative' }}>
                  <Text style={styles.inputLabel}>Brand Manufacturer (Optional)</Text>
                  <TouchableOpacity
                    style={[
                      styles.modalInput,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingRight: 8,
                        backgroundColor: '#ffffff',
                        borderColor: isBrandDropdownOpen ? '#0284c7' : '#cbd5e1',
                        borderWidth: 1.5,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      tap();
                      setIsBrandDropdownOpen(!isBrandDropdownOpen);
                      setIsPrimaryCategoryDropdownOpen(false);
                      setIsSubCategoryDropdownOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: newBrand ? '#0f172a' : '#64748b' }} numberOfLines={1}>
                      {newBrand || '-- None (Select Optional) --'}
                    </Text>
                    <Ionicons name={isBrandDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#0284c7" />
                  </TouchableOpacity>

                  {/* Brand Selector Dropdown List */}
                  {isBrandDropdownOpen && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 60,
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        borderRadius: RADIUS.md,
                        borderWidth: 1.5,
                        borderColor: '#0284c7',
                        maxHeight: 180,
                        zIndex: 999,
                        ...premiumShadow('#0f172a', 'md'),
                      }}
                    >
                      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true} style={{ maxHeight: 175 }}>
                        {['-- None (Clear Brand) --', ...BRANDS_LIST.filter(b => !b.includes('Select Brand'))].map((b) => {
                          const isNoneOpt = b === '-- None (Clear Brand) --';
                          const isSel = isNoneOpt ? !newBrand : newBrand === b;
                          return (
                            <TouchableOpacity
                              key={b}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f1f5f9',
                                backgroundColor: isSel ? '#f0f9ff' : '#ffffff',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                              onPress={() => {
                                tap();
                                setNewBrand(isNoneOpt ? '' : b);
                                setIsBrandDropdownOpen(false);
                              }}
                            >
                              <Text style={{ fontSize: 12, fontFamily: isSel ? FONT.bold : FONT.medium, color: isNoneOpt ? '#dc2626' : isSel ? '#0284c7' : '#334155' }}>
                                {b}
                              </Text>
                              {isSel && <Ionicons name="checkmark-circle" size={14} color={isNoneOpt ? '#dc2626' : '#0284c7'} />}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>





              {/* 👨‍🌾 1. FARMER MADE FOODS PRODUCT FORM & PURITY CHECKBOXES */}
              <View style={{ marginVertical: 6, gap: 6 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isFarmerMadeProduct ? '#dcfce7' : '#f8fafc',
                    padding: 10,
                    borderRadius: RADIUS.md,
                    borderWidth: 1.5,
                    borderColor: isFarmerMadeProduct ? '#166534' : '#cbd5e1',
                  }}
                  activeOpacity={0.85}
                  onPress={() => {
                    tap();
                    setIsFarmerMadeProduct(!isFarmerMadeProduct);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons
                      name={isFarmerMadeProduct ? "checkbox" : "square-outline"}
                      size={20}
                      color={isFarmerMadeProduct ? "#15803d" : "#64748b"}
                    />
                    <View>
                      <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: isFarmerMadeProduct ? "#14532d" : "#334155" }}>
                        🌿 100% Pure Natural Farmer Product
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#64748b' }}>
                        Enable 100% Purity Guarantee, Producer Name, & Chemical-Free Badge
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: isFarmerMadeProduct ? '#15803d' : '#cbd5e1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                    <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: isFarmerMadeProduct ? '#ffffff' : '#475569' }}>
                      {isFarmerMadeProduct ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {(isFarmerMadeProduct || newCategory === 'Farmer Made Foods' || newCategory === 'Natural Farmer Foods') && (
                  <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#86efac', gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#bbf7d0', paddingBottom: 6 }}>
                      <Text style={{ fontSize: 16 }}>👨‍🌾</Text>
                      <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#14532d' }}>
                        Farmer Made Foods & Purity Details
                      </Text>
                      <View style={{ backgroundColor: '#166534', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' }}>
                        <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#ffffff' }}>100% PURE GUARANTEE</Text>
                      </View>
                    </View>

                    <View style={{ gap: 4 }}>
                      <Text style={[styles.inputLabel, { color: '#166534' }]}>Farmer Producer / Creator Name *</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#86efac' }]}
                        placeholder="e.g. Sardar Gurdev Singh (Village Makhu)"
                        placeholderTextColor="#94a3b8"
                        value={farmerProducerName}
                        onChangeText={setFarmerProducerName}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.inputLabel, { color: '#166534' }]}>Harvest / Batch Date</Text>
                        <TextInput
                          style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#86efac' }]}
                          placeholder="e.g. August 2026 Batch"
                          placeholderTextColor="#94a3b8"
                          value={harvestBatchDate}
                          onChangeText={setHarvestBatchDate}
                        />
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.inputLabel, { color: '#166534' }]}>Processing Method</Text>
                        <TextInput
                          style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#86efac' }]}
                          placeholder="e.g. Cold-Pressed / Desi Kohlu"
                          placeholderTextColor="#94a3b8"
                          value={processingMethod}
                          onChangeText={setProcessingMethod}
                        />
                      </View>
                    </View>

                    <View style={{ gap: 4 }}>
                      <Text style={[styles.inputLabel, { color: '#166534' }]}>Purity Guarantee Badges (Click to ON / OFF):</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 2 }}>
                        {[
                          '100% Natural',
                          'Chemical-Free',
                          'Organic',
                          'No Preservatives',
                          'Lab Tested Purity',
                          'Pure Desi A2',
                        ].map((opt) => {
                          const isSelected = purityGuarantee
                            ? purityGuarantee.toLowerCase().includes(opt.toLowerCase())
                            : false;
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: RADIUS.md,
                                borderWidth: 1.5,
                                borderColor: isSelected ? '#15803d' : '#cbd5e1',
                                backgroundColor: isSelected ? '#dcfce7' : '#ffffff',
                              }}
                              onPress={() => {
                                tap();
                                let parts = purityGuarantee
                                  ? purityGuarantee.split('·').map((s) => s.trim()).filter(Boolean)
                                  : [];
                                const exists = parts.some((p) => p.toLowerCase() === opt.toLowerCase());
                                if (exists) {
                                  parts = parts.filter((p) => p.toLowerCase() !== opt.toLowerCase());
                                } else {
                                  parts.push(opt);
                                }
                                setPurityGuarantee(parts.join(' · '));
                              }}
                            >
                              <Ionicons
                                name={isSelected ? 'checkbox' : 'square-outline'}
                                size={16}
                                color={isSelected ? '#15803d' : '#64748b'}
                              />
                              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: isSelected ? '#14532d' : '#334155' }}>
                                {opt}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* 🚜 2. FARM MACHINERY & TOOLS FORM */}
              {newCategory === 'Farm Machinery & Tools' && (
                <View style={{ backgroundColor: '#f0f9ff', padding: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#7dd3fc', gap: 10, marginVertical: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#bae6fd', paddingBottom: 6 }}>
                    <Text style={{ fontSize: 16 }}>🚜</Text>
                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0369a1' }}>
                      Farm Machinery & Tool Required Details
                    </Text>
                    <View style={{ backgroundColor: '#0284c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' }}>
                      <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#ffffff' }}>TOOL FORM</Text>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#0369a1' }]}>Power Source / Fuel Type *</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#7dd3fc' }]}
                      placeholder="e.g. 12V 12Ah Battery / Solar Powered / Manual Hand Operated"
                      placeholderTextColor="#94a3b8"
                      value={machineryPowerSource}
                      onChangeText={setMachineryPowerSource}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.inputLabel, { color: '#0369a1' }]}>Warranty Period</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#7dd3fc' }]}
                        placeholder="e.g. 1 Year Warranty"
                        placeholderTextColor="#94a3b8"
                        value={machineryWarranty}
                        onChangeText={setMachineryWarranty}
                      />
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.inputLabel, { color: '#0369a1' }]}>Motor / Material Specs</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#7dd3fc' }]}
                        placeholder="e.g. Brass Nozzle & Copper Motor"
                        placeholderTextColor="#94a3b8"
                        value={machineryMotorSpecs}
                        onChangeText={setMachineryMotorSpecs}
                      />
                    </View>
                  </View>
                </View>
              )}



              {/* 🧪 2. FERTILIZERS & CHEMICALS FORM */}
              {(newCategory === 'Fertilizers' || newCategory === 'Fertilizers & Chemicals' || newCategory === 'Crop Protection') && (
                <View style={{ backgroundColor: '#fff7ed', padding: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#fdba74', gap: 10, marginVertical: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#ffedd5', paddingBottom: 6 }}>
                    <Text style={{ fontSize: 16 }}>🧪</Text>
                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#c2410c' }}>
                      Fertilizers & Chemicals Required Details
                    </Text>
                    <View style={{ backgroundColor: '#ea580c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' }}>
                      <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#ffffff' }}>FERTILIZER FORM</Text>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#c2410c' }]}>Active Technical Ingredient / NPK Ratio *</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#fdba74' }]}
                      placeholder="e.g. NPK 19:19:19 / Chlorpyrifos 50% EC / Urea 46% N"
                      placeholderTextColor="#94a3b8"
                      value={chemicalActiveIngredient}
                      onChangeText={setChemicalActiveIngredient}
                    />
                  </View>



                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#c2410c' }]}>Technical Chemical Formula / Active Composition</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#fdba74' }]}
                      placeholder="e.g. Chlorantraniliprole 18.5% SC"
                      placeholderTextColor="#94a3b8"
                      value={newTechnicalFormula}
                      onChangeText={setNewTechnicalFormula}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#c2410c' }]}>Recommended Dosage & Application Instructions</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#fdba74' }]}
                      placeholder="e.g. 60 ml per acre in 150-200 Litres water. Spray during pest emergence."
                      placeholderTextColor="#94a3b8"
                      value={newDosageInstructions}
                      onChangeText={setNewDosageInstructions}
                    />
                  </View>
                </View>
              )}
              {newCategory === 'Bio & Organics' && (
                <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#86efac', gap: 10, marginVertical: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#bbf7d0', paddingBottom: 6 }}>
                    <Text style={{ fontSize: 16 }}>🌿</Text>
                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#166534' }}>
                      Bio-Inputs & Organics Required Details
                    </Text>
                    <View style={{ backgroundColor: '#15803d', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' }}>
                      <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#ffffff' }}>ORGANIC FORM</Text>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#166534' }]}>Botanical Source / Bio-Organism *</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#86efac' }]}
                      placeholder="e.g. Neem Seed Kernel Extract (10000 PPM) / Trichoderma Viride"
                      placeholderTextColor="#94a3b8"
                      value={bioBotanicalSource}
                      onChangeText={setBioBotanicalSource}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#166534' }]}>Organic Standard</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#86efac' }]}
                      placeholder="e.g. NPOP Certified Organic Inputs / EcoCert Approved"
                      placeholderTextColor="#94a3b8"
                      value={bioCertificationStandard}
                      onChangeText={setBioCertificationStandard}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#166534' }]}>Recommended Dosage & Application Instructions</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#86efac' }]}
                      placeholder="e.g. 2-3 ml per Litre of water. Apply every 15 days."
                      placeholderTextColor="#94a3b8"
                      value={newDosageInstructions}
                      onChangeText={setNewDosageInstructions}
                    />
                  </View>
                </View>
              )}

              {/* 🌾 5. SEEDS & VARIETY FORM */}
              {newCategory === 'Seeds' && (
                <View style={{ backgroundColor: '#fefce8', padding: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#fde047', gap: 10, marginVertical: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#fef08a', paddingBottom: 6 }}>
                    <Text style={{ fontSize: 16 }}>🌾</Text>
                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#854d0e' }}>
                      Seeds & Crop Variety Required Details
                    </Text>
                    <View style={{ backgroundColor: '#ca8a04', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' }}>
                      <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#ffffff' }}>SEEDS FORM</Text>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.inputLabel, { color: '#854d0e' }]}>Seed Variety Name *</Text>
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: RADIUS.sm,
                          backgroundColor: isSeedHybrid ? '#fef3c7' : '#ffffff',
                          borderWidth: 1.5,
                          borderColor: isSeedHybrid ? '#ca8a04' : '#cbd5e1',
                        }}
                        onPress={() => {
                          tap();
                          setIsSeedHybrid(!isSeedHybrid);
                        }}
                      >
                        <Ionicons
                          name={isSeedHybrid ? 'checkbox' : 'square-outline'}
                          size={15}
                          color={isSeedHybrid ? '#ca8a04' : '#64748b'}
                        />
                        <Text style={{ fontSize: 11, fontFamily: isSeedHybrid ? FONT.bold : FONT.medium, color: isSeedHybrid ? '#854d0e' : '#475569' }}>
                          Hybrid
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#fde047' }]}
                      placeholder="e.g. PB-1121 Basmati Paddy / HD-3086 Wheat"
                      placeholderTextColor="#94a3b8"
                      value={seedVarietyName}
                      onChangeText={setSeedVarietyName}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.inputLabel, { color: '#854d0e' }]}>Aprox. Germination Rate (%)</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#fde047' }]}
                        placeholder="e.g. 98% Aprox. Germination Rate"
                        placeholderTextColor="#94a3b8"
                        value={seedGerminationRate}
                        onChangeText={setSeedGerminationRate}
                      />
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.inputLabel, { color: '#854d0e' }]}>Aprox. Maturity Days</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#fde047' }]}
                        placeholder="e.g. 120 - 130 Days"
                        placeholderTextColor="#94a3b8"
                        value={seedMaturityDays}
                        onChangeText={setSeedMaturityDays}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* 🎟️ 6. DEALS & VIP COUPONS FORM */}
              {newCategory === 'Farmer Plan & Coupons' && (
                <View style={{ backgroundColor: '#fffbeb', padding: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#fcd34d', gap: 10, marginVertical: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#fef3c7', paddingBottom: 6 }}>
                    <Text style={{ fontSize: 16 }}>🎟️</Text>
                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#78350f' }}>
                      Deals & VIP Pass Coupon Required Details
                    </Text>
                    <View style={{ backgroundColor: '#d97706', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' }}>
                      <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#ffffff' }}>COUPON FORM</Text>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#78350f' }]}>Coupon Benefit / Pass Value *</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#fcd34d' }]}
                      placeholder="e.g. Flat ₹500 Off / 10% Extra Cashback"
                      placeholderTextColor="#94a3b8"
                      value={couponPassValue}
                      onChangeText={setCouponPassValue}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: '#78350f' }]}>Validity Period</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: '#ffffff', borderColor: '#fcd34d' }]}
                      placeholder="e.g. Valid for 1 Year from Purchase Date"
                      placeholderTextColor="#94a3b8"
                      value={couponValidityPeriod}
                      onChangeText={setCouponValidityPeriod}
                    />
                  </View>
                </View>
              )}



              {/* 🏷️ Dynamic Pack Size Variant Format Builder & List Manager */}
              <View style={{ backgroundColor: '#fffbeb', borderRadius: RADIUS.md, padding: 12, borderWidth: 1.5, borderColor: '#fcd34d', gap: 10, marginVertical: 6, zIndex: isBuilderUnitDropdownOpen ? 999 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#fef3c7', paddingBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>🏷️</Text>
                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#78350f' }}>
                      {editingVariantKey ? `✏️ Edit Variant Format: ${editingVariantKey}` : '1. Add / Format New Pack Size Variant'}
                    </Text>
                  </View>
                  {editingVariantKey && (
                    <TouchableOpacity
                      onPress={() => {
                        tap();
                        setEditingVariantKey(null);
                        setBuilderVal('');
                        setBuilderUnit('');
                        setBuilderMrp('');
                        setBuilderSelling('');
                        setBuilderStock('');
                        setBuilderSku('');
                      }}
                      style={{ backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}
                    >
                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#dc2626' }}>Cancel Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Single Row Form: Value, Unit, MRP, Offer, Stock, SKU */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6, minWidth: '100%', alignItems: 'flex-start', paddingBottom: 6 }}>
                  {/* 1. Value */}
                  <View style={{ width: 68, gap: 2 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#78350f' }} numberOfLines={1}>Value *</Text>
                    <TextInput
                      style={[styles.modalInput, { height: 34, fontSize: 11, paddingHorizontal: 6, backgroundColor: '#ffffff', borderColor: '#fcd34d' }]}
                      placeholder="e.g. 500"
                      value={builderVal}
                      onChangeText={(text) => {
                        setBuilderVal(text);
                        const bPart = (newBrand && newBrand.trim() !== '' && newBrand !== 'Select Brand')
                          ? newBrand.trim().charAt(0).toUpperCase() + '-'
                          : '';
                        const cPart = newCategory ? newCategory.trim().charAt(0).toUpperCase() : '';
                        const tPart = newProductName
                          ? newProductName.trim().split(/\s+/).filter(Boolean).map(w => w.charAt(0)).join('').toUpperCase()
                          : '';
                        const mPart = text.trim();
                        setBuilderSku(`${bPart}${cPart}${tPart}${mPart}`);
                      }}
                    />
                  </View>

                  {/* 2. Unit */}
                  <View style={{ width: 82, gap: 2, position: 'relative', zIndex: 999 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#78350f' }} numberOfLines={1}>Unit *</Text>
                    <TouchableOpacity
                      style={[
                        styles.modalInput,
                        {
                          height: 34,
                          paddingHorizontal: 6,
                          backgroundColor: '#ffffff',
                          borderColor: isBuilderUnitDropdownOpen ? '#b45309' : '#fcd34d',
                          borderWidth: 1.5,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        tap();
                        setIsBuilderUnitDropdownOpen(!isBuilderUnitDropdownOpen);
                        setIsPrimaryCategoryDropdownOpen(false);
                        setIsSubCategoryDropdownOpen(false);
                        setIsBrandDropdownOpen(false);
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#78350f' }} numberOfLines={1}>
                        {builderUnit || 'Unit'}
                      </Text>
                      <Ionicons name={isBuilderUnitDropdownOpen ? "chevron-up" : "chevron-down"} size={14} color="#b45309" />
                    </TouchableOpacity>

                    <Modal
                      visible={isBuilderUnitDropdownOpen}
                      transparent
                      animationType="fade"
                      onRequestClose={() => {
                        setIsBuilderUnitDropdownOpen(false);
                        setUnitSearchQuery('');
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(15, 23, 42, 0.45)',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 20,
                        }}
                        activeOpacity={1}
                        onPress={() => {
                          setIsBuilderUnitDropdownOpen(false);
                          setUnitSearchQuery('');
                        }}
                      >
                        <TouchableOpacity
                          activeOpacity={1}
                          style={{
                            width: '90%',
                            maxWidth: 340,
                            backgroundColor: '#ffffff',
                            borderRadius: 16,
                            borderWidth: 1.5,
                            borderColor: '#b45309',
                            padding: 14,
                            maxHeight: 400,
                            gap: 10,
                            ...premiumShadow('#0f172a', 'lg'),
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
                            <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#78350f' }}>
                              📐 Select Measurement Unit
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                tap();
                                setIsBuilderUnitDropdownOpen(false);
                                setUnitSearchQuery('');
                              }}
                            >
                              <Ionicons name="close-circle" size={22} color="#64748b" />
                            </TouchableOpacity>
                          </View>

                          <TextInput
                            style={{
                              height: 38,
                              paddingHorizontal: 10,
                              fontSize: 12,
                              fontFamily: FONT.medium,
                              backgroundColor: '#f8fafc',
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: '#cbd5e1',
                              color: '#0f172a',
                            }}
                            placeholder="🔍 Search unit (e.g. Kg, Litre, Box, Acre)..."
                            placeholderTextColor="#94a3b8"
                            value={unitSearchQuery}
                            onChangeText={setUnitSearchQuery}
                          />

                          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true} style={{ maxHeight: 260 }}>
                            {filteredBuilderUnits.map((u: string) => {
                              const isSel = builderUnit.toLowerCase() === u.toLowerCase();
                              return (
                                <TouchableOpacity
                                  key={u}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    backgroundColor: isSel ? '#fef3c7' : '#ffffff',
                                    borderRadius: 8,
                                    marginBottom: 4,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderWidth: isSel ? 1 : 0,
                                    borderColor: '#f59e0b',
                                  }}
                                  onPress={() => {
                                    tap();
                                    setBuilderUnit(u);
                                    setIsBuilderUnitDropdownOpen(false);
                                    setUnitSearchQuery('');
                                  }}
                                >
                                  <Text style={{ fontSize: 12.5, fontFamily: isSel ? FONT.bold : FONT.medium, color: isSel ? '#b45309' : '#1e293b' }}>
                                    {u}
                                  </Text>
                                  {isSel && <Ionicons name="checkmark-circle" size={16} color="#b45309" />}
                                </TouchableOpacity>
                              );
                            })}

                            {filteredBuilderUnits.length === 0 && unitSearchQuery.trim() !== '' && (
                              <TouchableOpacity
                                style={{ padding: 12, backgroundColor: '#eff6ff', borderRadius: 8, marginTop: 4, alignItems: 'center' }}
                                onPress={() => {
                                  tap();
                                  setBuilderUnit(unitSearchQuery.trim());
                                  setIsBuilderUnitDropdownOpen(false);
                                  setUnitSearchQuery('');
                                }}
                              >
                                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0284c7' }}>
                                  + Use custom unit "{unitSearchQuery.trim()}"
                                </Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </Modal>
                  </View>

                  {/* 3. MRP */}
                  <View style={{ width: 64, gap: 2 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#475569' }} numberOfLines={1}>MRP (₹)</Text>
                    <TextInput
                      style={[styles.modalInput, { height: 34, fontSize: 11, paddingHorizontal: 6, backgroundColor: '#ffffff' }]}
                      placeholder="600"
                      keyboardType="numeric"
                      value={builderMrp}
                      onChangeText={setBuilderMrp}
                    />
                  </View>

                  {/* 4. Selling */}
                  <View style={{ width: 68, gap: 2 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#dc2626' }} numberOfLines={1}>Offer (₹) *</Text>
                    <TextInput
                      style={[styles.modalInput, { height: 34, fontSize: 11, paddingHorizontal: 6, backgroundColor: '#ffffff', borderColor: '#fca5a5' }]}
                      placeholder="500"
                      keyboardType="numeric"
                      value={builderSelling}
                      onChangeText={setBuilderSelling}
                    />
                  </View>

                  {/* 5. Stock */}
                  <View style={{ width: 58, gap: 2 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#15803d' }} numberOfLines={1}>Stock *</Text>
                    <TextInput
                      style={[styles.modalInput, { height: 34, fontSize: 11, paddingHorizontal: 6, backgroundColor: '#ffffff', borderColor: '#86efac' }]}
                      placeholder="50"
                      keyboardType="numeric"
                      value={builderStock}
                      onChangeText={setBuilderStock}
                    />
                  </View>

                  {/* 6. SKU */}
                  <View style={{ width: 92, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#0369a1' }} numberOfLines={1}>SKU</Text>
                      <TouchableOpacity
                        onPress={() => {
                          tap();
                          const bPart = (newBrand && newBrand.trim() !== '' && newBrand !== 'Select Brand')
                            ? newBrand.trim().charAt(0).toUpperCase() + '-'
                            : '';
                          const cPart = newCategory ? newCategory.trim().charAt(0).toUpperCase() : '';
                          const tPart = newProductName
                            ? newProductName.trim().split(/\s+/).filter(Boolean).map(w => w.charAt(0)).join('').toUpperCase()
                            : '';
                          const mPart = builderVal ? builderVal.trim() : '';
                          setBuilderSku(`${bPart}${cPart}${tPart}${mPart}`);
                        }}
                      >
                        <Text style={{ fontSize: 8, fontFamily: FONT.bold, color: '#0284c7' }}>⚡Auto</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[styles.modalInput, { height: 34, fontSize: 10.5, paddingHorizontal: 5, backgroundColor: '#ffffff', borderColor: '#bae6fd' }]}
                      placeholder="SKU"
                      value={builderSku}
                      onChangeText={setBuilderSku}
                    />
                  </View>
                </ScrollView>

                {/* Add to List Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: editingVariantKey ? '#0284c7' : '#b45309',
                    paddingVertical: 9,
                    borderRadius: RADIUS.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                    marginTop: 2,
                  }}
                  onPress={() => {
                    const trimmedVal = builderVal.trim();
                    if (!trimmedVal) {
                      alert('Please enter a measurement value (e.g. 1, 500, 250).');
                      return;
                    }
                    if (!builderSelling || Number(builderSelling) <= 0) {
                      alert('Please enter a valid Selling Offer Price (₹).');
                      return;
                    }
                    const fullVariantName = `${trimmedVal} ${builderUnit.trim()}`.trim();

                    tap();
                    if (editingVariantKey) {
                      // Updating item in list
                      if (editingVariantKey !== fullVariantName) {
                        const updatedPackSizes = newPackSizes.map((s) => (s === editingVariantKey ? fullVariantName : s));
                        setNewPackSizes(updatedPackSizes);
                        const newMap = { ...variantDetailsMap };
                        delete newMap[editingVariantKey];
                        newMap[fullVariantName] = {
                          mrp: builderMrp || builderSelling,
                          sellingPrice: builderSelling,
                          stockQty: builderStock || '50',
                          sku: builderSku,
                        };
                        setVariantDetailsMap(newMap);
                        if (primaryVariant === editingVariantKey) setPrimaryVariant(fullVariantName);
                      } else {
                        setVariantDetailsMap((prev) => ({
                          ...prev,
                          [fullVariantName]: {
                            mrp: builderMrp || builderSelling,
                            sellingPrice: builderSelling,
                            stockQty: builderStock || '50',
                            sku: builderSku,
                          },
                        }));
                      }
                      setEditingVariantKey(null);
                    } else {
                      // Adding new item to list
                      if (!newPackSizes.includes(fullVariantName)) {
                        setNewPackSizes([...newPackSizes, fullVariantName]);
                      }
                      setVariantDetailsMap((prev) => ({
                        ...prev,
                        [fullVariantName]: {
                          mrp: builderMrp || builderSelling,
                          sellingPrice: builderSelling,
                          stockQty: builderStock || '50',
                          sku: builderSku,
                        },
                      }));
                      if (!primaryVariant) setPrimaryVariant(fullVariantName);
                    }

                    // Reset builder inputs
                    setBuilderVal('');
                    setBuilderUnit('');
                    setBuilderMrp('');
                    setBuilderSelling('');
                    setBuilderStock('');
                    setBuilderSku('');
                  }}
                >
                  <Ionicons name={editingVariantKey ? "checkmark-circle" : "add-circle"} size={16} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontSize: 12, fontFamily: FONT.bold }}>
                    {editingVariantKey ? `Update Variant (${editingVariantKey}) in List` : '+ Add Format to Variant List'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 📋 Active Variant List Single Card Table */}
              {newPackSizes.length > 0 && (
                <View
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: RADIUS.md,
                    borderWidth: 1.5,
                    borderColor: '#fcd34d',
                    overflow: 'hidden',
                    marginVertical: 6,
                    ...premiumShadow('#0f172a', 'sm'),
                  }}
                >
                  {/* Card Header */}
                  <View style={{ backgroundColor: '#fffbeb', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1.5, borderBottomColor: '#fde68a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#78350f' }}>
                      🏷️ Mandatory Variant Details Table ({newPackSizes.length})
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#b45309' }}>
                      Tap ✏️ to Edit
                    </Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 480, width: '100%' }}>
                      {/* Table Header Row */}
                  <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center' }}>
                    <Text style={{ flex: 1.2, fontSize: 9.5, fontFamily: FONT.extraBold, color: '#475569' }}>VARIANT</Text>
                    <Text style={{ flex: 0.9, fontSize: 9.5, fontFamily: FONT.extraBold, color: '#64748b', textAlign: 'center' }}>MRP</Text>
                    <Text style={{ flex: 1, fontSize: 9.5, fontFamily: FONT.extraBold, color: '#dc2626', textAlign: 'center' }}>OFFER</Text>
                    <Text style={{ flex: 0.9, fontSize: 9.5, fontFamily: FONT.extraBold, color: '#15803d', textAlign: 'center' }}>STOCK</Text>
                    <Text style={{ flex: 1.2, fontSize: 9.5, fontFamily: FONT.extraBold, color: '#0369a1', textAlign: 'center' }}>SKU</Text>
                    <Text style={{ flex: 1.1, fontSize: 9.5, fontFamily: FONT.extraBold, color: '#475569', textAlign: 'right' }}>ACTION</Text>
                  </View>

                  {/* Table Data Rows */}
                  {newPackSizes.map((sz, index) => {
                    const isPrimary = primaryVariant ? primaryVariant === sz : index === 0;
                    const vDetails = variantDetailsMap[sz] || {
                      mrp: newMrpPrice,
                      sellingPrice: newSellingPrice,
                      stockQty: newStockQty,
                      sku: '',
                    };
                    const vMrp = Number(vDetails.mrp || newMrpPrice);
                    const vSell = Number(vDetails.sellingPrice || newSellingPrice);
                    const vDisc = vMrp > vSell && vSell > 0 ? Math.round(((vMrp - vSell) / vMrp) * 100) : 0;

                    return (
                      <View
                        key={sz}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 8,
                          paddingHorizontal: 8,
                          backgroundColor: isPrimary ? '#fefce8' : (index % 2 === 0 ? '#ffffff' : '#f8fafc'),
                          borderBottomWidth: index === newPackSizes.length - 1 ? 0 : 1,
                          borderBottomColor: '#f1f5f9',
                        }}
                      >
                        {/* Variant Name & Main Badge */}
                        <View style={{ flex: 1.2, gap: 2 }}>
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>{sz}</Text>
                          {isPrimary && (
                            <View style={{ backgroundColor: '#d97706', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, alignSelf: 'flex-start' }}>
                              <Text style={{ fontSize: 7.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>⭐ MAIN</Text>
                            </View>
                          )}
                        </View>

                        {/* MRP */}
                        <Text style={{ flex: 0.9, fontSize: 11, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', textDecorationLine: vDisc > 0 ? 'line-through' : 'none' }}>
                          ₹{vDetails.mrp || '-'}
                        </Text>

                        {/* Selling Offer */}
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#dc2626' }}>
                            ₹{vDetails.sellingPrice || '-'}
                          </Text>
                          {vDisc > 0 && (
                            <Text style={{ fontSize: 7.5, fontFamily: FONT.bold, color: '#16a34a' }}>{vDisc}% OFF</Text>
                          )}
                        </View>

                        {/* Stock Qty */}
                        <Text style={{ flex: 0.9, fontSize: 11, fontFamily: FONT.bold, color: '#16a34a', textAlign: 'center' }}>
                          {vDetails.stockQty || '0'}
                        </Text>

                        {/* SKU Code */}
                        <Text style={{ flex: 1.2, fontSize: 10, fontFamily: FONT.bold, color: '#0284c7', textAlign: 'center' }} numberOfLines={1}>
                          {vDetails.sku || '-'}
                        </Text>

                        {/* Action Buttons: Edit, Set Primary, Delete */}
                        <View style={{ flex: 1.1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          {/* Edit */}
                          <TouchableOpacity
                            style={{ padding: 4, backgroundColor: '#e0f2fe', borderRadius: 4 }}
                            onPress={() => {
                              tap();
                              const v = variantDetailsMap[sz] || { mrp: newMrpPrice, sellingPrice: newSellingPrice, stockQty: newStockQty, sku: '' };
                              const trimmed = sz.trim();
                              const match = trimmed.match(/^([\d.]+)\s*(.*)$/);
                              let valPart = trimmed;
                              let unitPart = '';
                              if (match) {
                                valPart = match[1];
                                unitPart = match[2] || '';
                              } else {
                                const parts = trimmed.split(/\s+/);
                                valPart = parts[0] || trimmed;
                                unitPart = parts.slice(1).join(' ');
                              }
                              setBuilderVal(valPart);
                              setBuilderUnit(unitPart || newUnit || 'Pack');
                              setBuilderMrp(v.mrp || newMrpPrice);
                              setBuilderSelling(v.sellingPrice || newSellingPrice);
                              setBuilderStock(v.stockQty || newStockQty || '50');
                              setBuilderSku(v.sku || newSkuCode || '');
                              setEditingVariantKey(sz);
                            }}
                          >
                            <Ionicons name="pencil" size={12} color="#0284c7" />
                          </TouchableOpacity>

                          {/* Set Primary */}
                          <TouchableOpacity
                            style={{ padding: 4, backgroundColor: isPrimary ? '#fef08a' : '#f1f5f9', borderRadius: 4 }}
                            onPress={() => {
                              tap();
                              setPrimaryVariant(sz);
                            }}
                          >
                            <Ionicons name={isPrimary ? 'star' : 'star-outline'} size={12} color={isPrimary ? '#ca8a04' : '#64748b'} />
                          </TouchableOpacity>

                          {/* Delete */}
                          <TouchableOpacity
                            style={{ padding: 4, backgroundColor: '#fee2e2', borderRadius: 4 }}
                            onPress={() => {
                              tap();
                              setNewPackSizes(newPackSizes.filter((s) => s !== sz));
                              if (primaryVariant === sz) {
                                const remaining = newPackSizes.filter((s) => s !== sz);
                                setPrimaryVariant(remaining[0] || '');
                              }
                            }}
                          >
                            <Ionicons name="trash-outline" size={12} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                    </View>
                  </ScrollView>
                </View>
              )}



              <Text style={styles.inputLabel}>GST Tax Rate</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 2 }}>
                {GST_RATES.map((gst) => {
                  const selected = newGstRate === gst;
                  return (
                    <TouchableOpacity
                      key={gst}
                      style={[styles.filterChip, selected && { backgroundColor: '#15803d', borderColor: '#166534' }]}
                      onPress={() => setNewGstRate(gst)}
                    >
                      <Text style={[styles.filterChipText, selected && { color: '#ffffff' }]}>{gst}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>





              {/* 📝 Multiline Description */}
              <Text style={styles.inputLabel}>Detailed Product Description & Features *</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Enter rich details, features, crop benefits, storage conditions, safety guidelines..."
                multiline
                numberOfLines={4}
                value={newProductDescription}
                onChangeText={setNewProductDescription}
              />

              {productError ? <Text style={styles.errorText}>{productError}</Text> : null}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              disabled={createProduct.isPending}
              onPress={handleAddProduct}
            >
              {createProduct.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalSubmitText}>+ Save & Publish Complete Product SKU</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📷 UPDATE PRODUCT PHOTO MODAL (BROWSE + AI SAMPLE GALLERY) */}
      {editingPhotoProduct && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setEditingPhotoProduct(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="camera" size={20} color="#0284c7" />
                  <Text style={styles.modalTitle}>Update Photo: {editingPhotoProduct.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setEditingPhotoProduct(null)}>
                  <Ionicons name="close-circle" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {/* 1. Device Image Browser */}
                <Text style={styles.inputLabel}>1. Browse Photo from Device Storage *</Text>
                <TouchableOpacity
                  style={styles.imageBrowseBtn}
                  onPress={handleBrowseImage}
                  disabled={isBrowsingImage}
                >
                  {isBrowsingImage ? (
                    <ActivityIndicator color="#0284c7" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={24} color="#0284c7" />
                      <Text style={styles.imageBrowseText}>📁 Browse Image File from PC / Mobile</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* 2. Photo URL Input */}
                <Text style={styles.inputLabel}>2. Or Paste Photo URL</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://example.com/photo.jpg"
                  value={updatePhotoUrl}
                  onChangeText={setUpdatePhotoUrl}
                />

                {/* Photo Preview */}
                {updatePhotoUrl ? (
                  <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    <Text style={styles.inputLabel}>Current Preview:</Text>
                    <Image source={{ uri: updatePhotoUrl }} style={{ width: 100, height: 100, borderRadius: 10 }} resizeMode="cover" />
                  </View>
                ) : null}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                disabled={updateProduct.isPending}
                onPress={async () => {
                  tap();
                  if (editingPhotoProduct && updatePhotoUrl) {
                    try {
                      await updateProduct.mutateAsync({
                        id: editingPhotoProduct.id,
                        payload: { imageUrl: updatePhotoUrl.trim() },
                      });
                      refetchProducts();
                    } catch (err) {
                      console.warn('Quick photo update failed:', err);
                    }
                  }
                  setEditingPhotoProduct(null);
                }}
              >
                {updateProduct.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>💾 Save & Apply Photo Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 🚚 DISPATCH ORDER MODAL */}
      {dispatchingOrder && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setDispatchingOrder(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cube" size={20} color="#0284c7" />
                  <Text style={styles.modalTitle}>Dispatch Order: {dispatchingOrder.orderNumber}</Text>
                </View>
                <TouchableOpacity onPress={() => setDispatchingOrder(null)}>
                  <Ionicons name="close-circle" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Courier / Transport Partner Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Delhivery, BlueDart, India Post"
                value={courierNameInput}
                onChangeText={setCourierNameInput}
              />

              <Text style={styles.inputLabel}>Tracking ID / AWB Number (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 129381928301"
                value={trackingIdInput}
                onChangeText={setTrackingIdInput}
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#0284c7' }]}
                disabled={dispatchOrderMutation.isPending}
                onPress={() => {
                  tap();
                  dispatchOrderMutation.mutate({
                    id: dispatchingOrder.id,
                    courierName: courierNameInput.trim() || 'Standard Delivery',
                    trackingId: trackingIdInput.trim() || undefined,
                  });
                  setDispatchingOrder(null);
                }}
              >
                {dispatchOrderMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>🚚 Confirm Dispatch & Notify Customer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 📄 OFFICIAL TAX INVOICE & SHIPPING SLIP MODAL */}
      {invoiceOrder && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setInvoiceOrder(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 500, padding: 16 }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BrandLogo size={28} useFastBundledOnly={true} />
                  <Text style={styles.modalTitle}>Tax Invoice & Shipping Label</Text>
                </View>
                <TouchableOpacity onPress={() => setInvoiceOrder(null)}>
                  <Ionicons name="close-circle" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Printable Invoice Header Box */}
                <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1', gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#15803d' }}>FarmsKing Official Store</Text>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>INVOICE: #{invoiceOrder.orderNumber}</Text>
                  </View>

                  <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>
                    GSTIN: 03ABCDE1234F1Z5 · 100% Certified Genuine Agri Products
                  </Text>
                </View>

                {/* Shipping & Billing Address Box */}
                <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
                  <View style={{ flex: 1, backgroundColor: '#f1f5f9', padding: 10, borderRadius: RADIUS.md, gap: 2 }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' }}>📍 SHIP TO (CUSTOMER):</Text>
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#1e293b' }}>{(invoiceOrder as any).user?.name || 'Customer'}</Text>
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569' }}>{(invoiceOrder as any).user?.phone || 'N/A'}</Text>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.regular, color: '#64748b' }}>{invoiceOrder.deliveryAddress || 'No address'}</Text>
                  </View>
                </View>

                {/* Items Table */}
                <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ flex: 2, fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>Item Description</Text>
                    <Text style={{ flex: 1, fontSize: 11, fontFamily: FONT.bold, color: '#334155', textAlign: 'center' }}>Qty</Text>
                    <Text style={{ flex: 1, fontSize: 11, fontFamily: FONT.bold, color: '#334155', textAlign: 'right' }}>Total</Text>
                  </View>

                  {invoiceOrder.items.map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: '#f1f5f9' }}>
                      <Text style={{ flex: 2, fontSize: 11.5, fontFamily: FONT.medium, color: '#0f172a' }}>{item.productName}</Text>
                      <Text style={{ flex: 1, fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', textAlign: 'center' }}>{item.quantity}</Text>
                      <Text style={{ flex: 1, fontSize: 11.5, fontFamily: FONT.extraBold, color: '#16a34a', textAlign: 'right' }}>
                        ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Total Summary */}
                <View style={{ marginTop: 10, borderTopWidth: 1.5, borderTopColor: '#0f172a', paddingTop: 8, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' }}>Payment Mode:</Text>
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>{invoiceOrder.paymentMode || 'COD'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' }}>Grand Total (Inc. GST):</Text>
                    <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#15803d' }}>₹{Number(invoiceOrder.totalAmount).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#15803d', marginTop: 10 }]}
                onPress={() => {
                  tap();
                  if (Platform.OS === 'web') window.print();
                  else Alert.alert('Print Invoice', 'Invoice sent to printer / PDF viewer');
                }}
              >
                <Ionicons name="print" size={16} color="#ffffff" />
                <Text style={styles.modalSubmitText}>🖨️ Print / Download Official Invoice PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 📍 Edit Registered Address Modal */}
      <Modal visible={isEditAddressModalOpen} animationType="fade" transparent onRequestClose={() => setIsEditAddressModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 460, padding: 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddressItem ? '✏️ Edit Registered Address' : '📍 Add Registered Address'}
              </Text>
              <TouchableOpacity onPress={() => setIsEditAddressModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 10 }} showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              <Text style={styles.inputLabel}>Address Tag *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['HOME', 'FARM', 'WORK'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.filterChip,
                      addrTag === t && { backgroundColor: '#15803d', borderColor: '#166534' },
                    ]}
                    onPress={() => setAddrTag(t)}
                  >
                    <Text style={[styles.filterChipText, addrTag === t && { color: '#ffffff' }]}>
                      {t === 'HOME' ? '🏠 HOME' : t === 'FARM' ? '🌾 FARM' : '🏢 WORK'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>6-Digit PIN Code *</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="e.g. 142044"
                  keyboardType="numeric"
                  maxLength={6}
                  value={addrPincode}
                  onChangeText={handlePincodeChange}
                />
                {isLookingUpPincode ? <ActivityIndicator size="small" color="#15803d" /> : null}
              </View>

              <Text style={styles.inputLabel}>House No. / Street / Village Line *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. VPO Makhu, Near Gurudwara Sahib"
                value={addrLine}
                onChangeText={setAddrLine}
              />

              <Text style={styles.inputLabel}>Post Office *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Makhu"
                value={addrPostOffice}
                onChangeText={setAddrPostOffice}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>District *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Ferozepur"
                    value={addrDistrict}
                    onChangeText={setAddrDistrict}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>State *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Punjab"
                    value={addrState}
                    onChangeText={setAddrState}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Contact Mobile Number *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9577622000"
                keyboardType="phone-pad"
                maxLength={10}
                value={addrMobile}
                onChangeText={setAddrMobile}
              />

              {addrError ? <Text style={styles.errorText}>{addrError}</Text> : null}

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#15803d', marginTop: 10 }]}
                disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                onPress={handleSaveAddress}
              >
                {createAddressMutation.isPending || updateAddressMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    💾 {editingAddressItem ? 'Update & Save Address' : 'Save New Address'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FarmsKing Certified Product Details Modal */}
      <FarmsKingProductDetailModal
        product={selectedProductForDetail}
        cartQty={selectedProductForDetail ? cartQtyFor(selectedProductForDetail.id) : 0}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={() => {
          if (selectedProductForDetail) {
            addItem({
              productId: selectedProductForDetail.id,
              name: selectedProductForDetail.name,
              price: Number(selectedProductForDetail.price),
              unit: selectedProductForDetail.unit,
              imageUrl: selectedProductForDetail.imageUrl,
            });
          }
        }}
        onBuyNow={() => {
          if (selectedProductForDetail) {
            addItem({
              productId: selectedProductForDetail.id,
              name: selectedProductForDetail.name,
              price: Number(selectedProductForDetail.price),
              unit: selectedProductForDetail.unit,
              imageUrl: selectedProductForDetail.imageUrl,
            });
            setSelectedProductForDetail(null);
            setActiveSubTab('CHECKOUT');
          }
        }}
      />

      {/* 🔥 Shop Launch Hot Deal Promotional Popup Banner */}
      <HotDealPopupModal
        visible={isHotDealModalVisible && hotDealBannerEnabled}
        featuredProduct={products && products.length > 0 ? (products.find(p => p.stockQty > 0) || products[0]) : null}
        headlineTitle={hotDealTitle}
        onClose={() => setIsHotDealModalVisible(false)}
        onAddToCartAndBuy={(prod) => {
          addItem({
            productId: prod.id,
            name: prod.name,
            price: Number(prod.price),
            unit: prod.unit,
            imageUrl: prod.imageUrl,
          });
          setIsHotDealModalVisible(false);
          setActiveSubTab('CHECKOUT');
        }}
      />

      {/* Expense/Product Categories Manager Modal */}
      <SuperAdminExpenseCategoriesModal visible={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} />
    </View>
  );
}

function getVariantMultiplier(sizeStr: string): number {
  if (!sizeStr) return 1;
  const match = sizeStr.match(/^([\d.]+)\s*(.*)$/);
  if (!match) return 1;
  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return 1;
  const unit = match[2].trim().toLowerCase();
  if (unit.startsWith('gm') || unit.startsWith('g') || unit.startsWith('ml')) {
    if (num >= 50) return num / 1000;
  }
  if (num === 2) return 1.9;
  if (num === 3) return 2.8;
  if (num === 5) return 4.5;
  if (num >= 10) return num * 0.85;
  return num;
}

function FarmsKingProductDetailModal({
  product,
  cartQty,
  onClose,
  onAddToCart,
  onBuyNow,
}: {
  product: Product | null;
  cartQty: number;
  onClose: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}) {
  if (!product) return null;

  const images = useMemo(() => {
    const list: string[] = [];
    const pushIfValid = (urlStr?: string | null) => {
      if (!urlStr || typeof urlStr !== 'string') return;
      const parts = parseImageUrls(urlStr);
      for (const p of parts) {
        const resolved = resolveMediaUrl(p);
        if (resolved && !list.includes(resolved)) {
          list.push(resolved);
        }
      }
    };

    // 1. Primary imageUrl
    pushIfValid(product.imageUrl);

    // 2. Direct array or string fields
    const candidateArrays = [
      (product as any).images,
      (product as any).productImages,
      (product as any).galleryImages,
      (product as any).photos,
      (product as any).imageUrls,
      (product as any).gallery,
    ];

    candidateArrays.forEach((raw) => {
      if (!raw) return;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((img: any) => {
              if (typeof img === 'string') pushIfValid(img);
              else if (img?.uri) pushIfValid(img.uri);
              else if (img?.url) pushIfValid(img.url);
            });
          } else {
            pushIfValid(raw);
          }
        } catch {
          pushIfValid(raw);
        }
      } else if (Array.isArray(raw)) {
        raw.forEach((img: any) => {
          if (typeof img === 'string') pushIfValid(img);
          else if (img?.uri) pushIfValid(img.uri);
          else if (img?.url) pushIfValid(img.url);
        });
      }
    });

    // 3. Extract gallery URLs embedded in product.description if present
    if (product.description) {
      const galleryMatch = product.description.match(/Gallery:\s*([^\n]+(?:\n[^\n]+)*)/i);
      if (galleryMatch && galleryMatch[1]) {
        pushIfValid(galleryMatch[1]);
      }
      const httpMatches = product.description.match(/https?:\/\/[^\s"',]+\.(?:png|jpg|jpeg|webp|gif)/gi);
      if (httpMatches) {
        httpMatches.forEach((m) => pushIfValid(m));
      }
    }

    return list;
  }, [product]);

  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [imgErrorMap, setImgErrorMap] = useState<Record<number, boolean>>({});
  const [selectedPackSize, setSelectedPackSize] = useState((product as any).packSize || product.unit || '1 Pack');

  const mainScrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewWidth = event.nativeEvent.layoutMeasurement.width || containerWidth;
    if (viewWidth > 0) {
      const pageIndex = Math.round(contentOffsetX / viewWidth);
      if (pageIndex >= 0 && pageIndex < images.length && pageIndex !== selectedImgIndex) {
        setSelectedImgIndex(pageIndex);
      }
    }
  };

  const handleSelectThumbnail = (index: number) => {
    setSelectedImgIndex(index);
    if (mainScrollRef.current && containerWidth > 0) {
      mainScrollRef.current.scrollTo({ x: index * containerWidth, animated: true });
    }
  };

  React.useEffect(() => {
    setSelectedImgIndex(0);
    setImgErrorMap({});
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [product?.id]);

  const desc = product.description || '';

  const packSizesMatch = desc.match(/PackSizes:\s*([^|]+)/i);
  const PACK_SIZES = useMemo(() => {
    if (packSizesMatch && packSizesMatch[1]) {
      const extracted = packSizesMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
      if (extracted.length > 0) return extracted;
    }
    if ((product as any).packSizes && Array.isArray((product as any).packSizes) && (product as any).packSizes.length > 0) {
      return (product as any).packSizes;
    }
    const unit = product.unit || 'Pack';
    return [`1 ${unit}`, `2 ${unit}s`, `5 ${unit}s`, `10 ${unit}s`];
  }, [product, desc]);

  const basePrice = Number(product.price);
  const baseMrp = (product as any).mrp ? Number((product as any).mrp) : Math.round(basePrice * 1.25);

  const varRatesMatch = desc.match(/VariantRates:\s*([^|]+)/i);
  const variantPrices = useMemo(() => {
    const map: Record<string, { price: number; mrp: number; stock: number; sku: string }> = {};
    if (varRatesMatch && varRatesMatch[1]) {
      const parts = varRatesMatch[1].split('|').map((s) => s.trim());
      parts.forEach((pt) => {
        const colonIdx = pt.indexOf(':');
        if (colonIdx > -1) {
          const packName = pt.substring(0, colonIdx).replace(/\[PRIMARY MAIN ITEM\]/gi, '').trim();
          const details = pt.substring(colonIdx + 1);
          const vSelling = details.match(/Selling\s*₹?\s*([\d.]+)/i)?.[1];
          const vMrp = details.match(/MRP\s*₹?\s*([\d.]+)/i)?.[1];
          const vStock = details.match(/Stock\s*([\d.]+)/i)?.[1];
          const vSku = details.match(/SKU:\s*([^\s,]+)/i)?.[1];
          if (packName && vSelling) {
            map[packName] = {
              price: Number(vSelling),
              mrp: Number(vMrp || Math.round(Number(vSelling) * 1.25)),
              stock: Number(vStock !== undefined ? vStock : product.stockQty),
              sku: vSku || '',
            };
          }
        }
      });
    }

    PACK_SIZES.forEach((sz: string) => {
      if (!map[sz]) {
        let p = basePrice;
        let m = baseMrp;
        if ((product as any).variants && Array.isArray((product as any).variants)) {
          const found = (product as any).variants.find((v: any) => v.packSize === sz || v.size === sz || v.name === sz);
          if (found) {
            p = Number(found.price || basePrice);
            m = Number(found.mrp || Math.round(p * 1.25));
          } else {
            const mult = getVariantMultiplier(sz);
            p = Math.round(basePrice * mult);
            m = Math.round(baseMrp * mult);
          }
        } else {
          const mult = getVariantMultiplier(sz);
          p = Math.round(basePrice * mult);
          m = Math.round(baseMrp * mult);
        }
        map[sz] = { price: p, mrp: m, stock: product.stockQty, sku: '' };
      }
    });
    return map;
  }, [product, desc, PACK_SIZES, basePrice, baseMrp]);

  React.useEffect(() => {
    setSelectedImgIndex(0);
    setImgErrorMap({});
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ x: 0, animated: false });
    }
    if (PACK_SIZES.length > 0) {
      const primMatch = desc.match(/PrimaryVariant:\s*([^|]+)/i);
      const primVar = primMatch ? primMatch[1].trim() : '';
      if (primVar && PACK_SIZES.includes(primVar)) {
        setSelectedPackSize(primVar);
      } else {
        setSelectedPackSize(PACK_SIZES[0]);
      }
    }
  }, [product?.id, PACK_SIZES]);

  const isFarmerFood = (product as any).isFarmerFood || product.category === 'Natural Farmer Foods' || product.category === 'Farmer Made Foods' || desc.includes('[FARMER_MADE]');

  const producerMatch = desc.match(/Producer:\s*([^|]+)/i);
  const farmerProducerName = producerMatch ? producerMatch[1].trim() : ((product as any).farmerProducerName || (product as any).producerName || (product as any).brand || 'Local Direct Farmer');

  const batchMatch = desc.match(/Batch:\s*([^|]+)/i);
  const harvestBatchDate = batchMatch ? batchMatch[1].trim() : ((product as any).harvestBatchDate || 'Fresh Batch');

  const methodMatch = desc.match(/Method:\s*([^|]+)/i);
  const processingMethod = methodMatch ? methodMatch[1].trim() : ((product as any).processingMethod || (product as any).method || 'Cold-Pressed / Traditional Desi Kohlu');

  const purityMatch = desc.match(/Purity:\s*([^|]+)/i);
  const purityGuarantee = purityMatch ? purityMatch[1].trim() : ((product as any).purityGuarantee || (product as any).guarantee || '100% Organic & Chemical-Free · No Preservatives');

  const shelfMatch = desc.match(/ShelfLife:\s*([^|]+)/i);
  const shelfLifeInfo = shelfMatch ? shelfMatch[1].trim() : ((product as any).shelfLifeInfo || (product as any).shelfLife || 'Best before 6 months in cool dry place');

  const brandMatch = desc.match(/Brand:\s*([^|]+)/i);
  const brandName = brandMatch ? brandMatch[1].trim() : ((product as any).brand || 'FarmsKing Certified');

  const subCatMatch = desc.match(/SubCat:\s*([^|]+)/i);
  const subCategoryName = subCatMatch ? subCatMatch[1].trim() : ((product as any).subCategory || 'General');

  const cropMatch = desc.match(/Crop:\s*([^|]+)/i);
  const targetCropsName = cropMatch ? cropMatch[1].trim() : ((product as any).targetCrops || (product as any).targetCrop || 'All Crops');

  const formulaMatch = desc.match(/Formula:\s*([^|]+)/i);
  const technicalFormula = formulaMatch ? formulaMatch[1].trim() : ((product as any).activeIngredients || (product as any).technicalFormula || '100% Genuine Certified Formulation');

  const dosageMatch = desc.match(/Dosage:\s*([^|]+)/i);
  const dosageInstructions = dosageMatch ? dosageMatch[1].trim() : ((product as any).dosage || (product as any).dosageInstructions || 'As per package label or Agri Expert advisory');

  const skuMatch = desc.match(/SKU:\s*([^|]+)/i);
  const mainSkuCode = skuMatch ? skuMatch[1].trim() : ((product as any).sku || '');

  const gstMatch = desc.match(/GST:\s*([^|]+)/i);
  const gstInfo = gstMatch ? gstMatch[1].trim() : '5% GST';

  const moqMatch = desc.match(/MOQ:\s*([^|]+)/i);
  const moqVal = moqMatch ? moqMatch[1].trim() : '1';

  const currentVariant = variantPrices[selectedPackSize] || { price: basePrice, mrp: baseMrp, stock: product.stockQty, sku: mainSkuCode };
  const sellingPrice = currentVariant.price;
  const mrpPrice = currentVariant.mrp;
  const variantStock = currentVariant.stock;
  const variantSku = currentVariant.sku || mainSkuCode;
  const savings = Math.max(0, mrpPrice - sellingPrice);
  const discountPercent = mrpPrice > sellingPrice ? Math.round((savings / mrpPrice) * 100) : 20;
  const outOfStock = variantStock <= 0;

  const currentImg = images[selectedImgIndex] || product.imageUrl;

  const handleShareWhatsApp = () => {
    tap();
    const msg = `Hi FarmsKing! I want to order/inquire about *${product.name}* (Price: ₹${product.price}/${product.unit}). Please provide more details.`;
    Linking.openURL(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`);
  };

  return (
    <Modal visible={Boolean(product)} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* FarmsKing Header Bar */}
        <LinearGradient colors={['#0f172a', '#1e293b']} style={{ paddingTop: 44, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#f59e0b', fontSize: 11, fontFamily: FONT.extraBold, letterSpacing: 0.4 }}>FarmsKing Official Store</Text>
                <View style={{ backgroundColor: '#15803d', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={{ color: '#ffffff', fontSize: 9, fontFamily: FONT.bold }}>FarmsKing Certified</Text>
                </View>
              </View>
              <Text style={{ color: '#ffffff', fontSize: 13, fontFamily: FONT.bold }} numberOfLines={1}>
                {product.name}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={20} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Main Hero Gallery */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', gap: 12, ...premiumShadow('#0f172a', 'sm') }}>
            {/* FarmsKing Bestseller Tag */}
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#ffedd5', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="ribbon" size={14} color="#ea580c" />
                <Text style={{ fontSize: 10.5, fontFamily: FONT.extraBold, color: '#c2410c' }}>#1 Best Seller in {product.category || 'Agri Store'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
                <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' }}>100% Genuine</Text>
              </View>
            </View>

            {/* Main Horizontal Swipeable Product Image Gallery */}
            <View
              style={{ width: '100%', height: 260, borderRadius: 12, overflow: 'hidden' }}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0) setContainerWidth(w);
              }}
            >
              {images.length > 0 ? (
                <ScrollView
                  ref={mainScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {images.map((img, idx) => (
                    <View key={idx} style={{ width: containerWidth, height: 260, alignItems: 'center', justifyContent: 'center' }}>
                      {img && !imgErrorMap[idx] ? (
                        <Image
                          source={{ uri: img }}
                          style={{ width: containerWidth, height: 260, borderRadius: 12 }}
                          resizeMode="contain"
                          onError={() => {
                            setImgErrorMap((prev) => ({ ...prev, [idx]: true }));
                          }}
                        />
                      ) : (
                        <View style={{ width: containerWidth, height: 220, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Ionicons name="leaf" size={56} color="#15803d" />
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#15803d' }}>Image preview unavailable</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={{ width: '100%', height: 220, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ionicons name="leaf" size={56} color="#15803d" />
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#15803d' }}>Image preview unavailable</Text>
                </View>
              )}
            </View>

            {/* Pagination Dots Indicator */}
            {images.length > 1 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 2 }}>
                {images.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectThumbnail(idx)}
                    style={{
                      width: selectedImgIndex === idx ? 18 : 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: selectedImgIndex === idx ? '#0284c7' : '#cbd5e1',
                    }}
                  />
                ))}
              </View>
            )}

            {/* Thumbnail Selector */}
            {images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                {images.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectThumbnail(idx)}
                    style={{
                      borderWidth: 2,
                      borderColor: selectedImgIndex === idx ? '#0284c7' : '#cbd5e1',
                      borderRadius: 8,
                      overflow: 'hidden',
                      padding: 2,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {imgErrorMap[idx] ? (
                      <View style={{ width: 50, height: 50, borderRadius: 6, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="image-outline" size={20} color="#94a3b8" />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: img }}
                        style={{ width: 50, height: 50, borderRadius: 6 }}
                        resizeMode="cover"
                        onError={() => setImgErrorMap((prev) => ({ ...prev, [idx]: true }))}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Product Title & Ratings Section */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 8, ...premiumShadow('#0f172a', 'sm') }}>
            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Brand: {brandName}
            </Text>

            <Text style={{ fontSize: 17, fontFamily: FONT.bold, color: '#0f172a', lineHeight: 23 }}>
              {product.name}
            </Text>

            {/* Ratings & Reviews */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' }}>
                <Ionicons name="star" size={13} color="#d97706" />
                <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#b45309' }}>4.9</Text>
              </View>
              <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#0284c7' }}>
                1,428 ratings · 350+ answered questions
              </Text>
            </View>

            {/* Price Breakdown */}
            <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, marginTop: 4, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#dc2626' }}>-{discountPercent}%</Text>
                <Text style={{ fontSize: 26, fontFamily: FONT.extraBold, color: '#0f172a' }}>₹{sellingPrice.toLocaleString('en-IN')}</Text>
                <Text style={{ fontSize: 13, fontFamily: FONT.medium, color: '#64748b', textDecorationLine: 'line-through' }}>
                  M.R.P.: ₹{mrpPrice.toLocaleString('en-IN')}
                </Text>
              </View>

              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#16a34a' }}>
                You Save: ₹{savings.toLocaleString('en-IN')} (Inclusive of all GST taxes)
              </Text>
            </View>

            {/* 👨‍🌾 Farmer Direct Food Product Certification Banner */}
            {((product.category === 'Natural Farmer Foods') || (product.description || '').includes('[FARMER_MADE]')) && (
              <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#86efac', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>👨‍🌾</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12.5, fontFamily: FONT.extraBold, color: '#166534' }}>100% Direct Farmer Natural Product</Text>
                    <Ionicons name="checkmark-circle" size={15} color="#166534" />
                  </View>
                  <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#15803d', marginTop: 1 }}>
                    Handmade & processed directly by local farmers with zero chemicals, pure natural ingredients & traditional processing methods.
                  </Text>
                </View>
              </View>
            )}

            {/* In Stock & Fast Village Delivery Guarantee */}
            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#bbf7d0', gap: 6, marginTop: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#166534' }}>
                  {outOfStock ? 'Out of Stock' : 'In Stock · Ready to Dispatch'}
                </Text>
              </View>
              <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#15803d' }}>
                🚚 FREE Fast Express Delivery to your village within 24-48 Hours.
              </Text>
            </View>
          </View>

          {/* Pack Size Variant Selector */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 10, ...premiumShadow('#0f172a', 'sm') }}>
            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>
              📦 Select Pack Size Variant:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PACK_SIZES.map((sz: string) => {
                const isSelected = selectedPackSize === sz;
                const vData = variantPrices[sz];
                const vPrice = vData ? vData.price : basePrice;
                return (
                  <TouchableOpacity
                    key={sz}
                    onPress={() => { tap(); setSelectedPackSize(sz); }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#15803d' : '#cbd5e1',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      alignItems: 'center',
                      minWidth: 80,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isSelected ? '#15803d' : '#334155' }}>
                      {sz}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: isSelected ? '#166534' : '#64748b', marginTop: 2 }}>
                      ₹{vPrice.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 👨‍🌾 Direct Farmer Natural Produce Guarantee Card (Compact) */}
          {isFarmerFood && (
            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#86efac', gap: 6, ...premiumShadow('#0f172a', 'sm') }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#bbf7d0', paddingBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ fontSize: 15 }}>👨‍🌾</Text>
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#14532d' }}>
                    Farmer Foods & Purity Info
                  </Text>
                </View>
                <View style={{ backgroundColor: '#166534', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={{ fontSize: 8.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>100% PURE</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 }}>
                {[
                  { icon: '👨‍🌾', label: 'Producer', value: farmerProducerName || 'Local Direct Farmer' },
                  { icon: '📅', label: 'Harvest/Batch', value: harvestBatchDate || 'Fresh Batch' },
                  { icon: '⚙️', label: 'Processing', value: processingMethod || 'Cold-Pressed / Kohlu' },
                  { icon: '📦', label: 'Shelf Life', value: shelfLifeInfo || '6 Months' },
                ].map((item) => (
                  <View key={item.label} style={{ width: '50%', paddingHorizontal: 3, paddingVertical: 3 }}>
                    <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' }}>
                      <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#15803d' }}>{item.icon} {item.label}</Text>
                      <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#14532d', marginTop: 1 }} numberOfLines={1}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {purityGuarantee ? (
                <View style={{ backgroundColor: '#ffffff', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' }}>
                  <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#15803d' }}>🌿 Purity Badges:</Text>
                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#14532d', marginTop: 1 }}>{purityGuarantee}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Technical Specifications & SKU Metadata Grid (Compact) */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 8, ...premiumShadow('#0f172a', 'sm') }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 }}>
              <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>
                📋 Product SKU & Specifications
              </Text>
              <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#475569' }}>SKU: {variantSku || mainSkuCode || 'FK-CERTIFIED'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
              {[
                { label: 'Category', value: product.category || 'Agri Store' },
                { label: 'Sub-Category', value: subCategoryName },
                { label: 'Brand', value: brandName },
                { label: 'Selected Pack', value: selectedPackSize },
                { label: 'Base Unit', value: product.unit || 'bag' },
                { label: 'SKU Code', value: variantSku || mainSkuCode || 'FK-CERTIFIED' },
                { label: 'MOQ (Min Order)', value: moqVal + ' Unit(s)' },
                { label: 'Stock Available', value: variantStock + ' Units (' + (variantStock > 0 ? 'In Stock' : 'Out') + ')' },
                { label: 'GST Tax Rate', value: gstInfo },
                { label: 'Target Crops', value: targetCropsName },
                { label: 'Formula / Active', value: technicalFormula },
                { label: 'Dosage / Acre', value: dosageInstructions },
              ].map((item, idx) => (
                <View key={item.label} style={{ width: '50%', paddingHorizontal: 4, paddingVertical: 4 }}>
                  <View style={{ backgroundColor: idx % 4 === 0 || idx % 4 === 3 ? '#f8fafc' : '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9', height: '100%', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#64748b', textTransform: 'uppercase' }}>{item.label}</Text>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0f172a', marginTop: 1 }} numberOfLines={2}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Description & Key Features */}
          {cleanProductDisplayDescription(product.description) ? (
            <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 8, ...premiumShadow('#0f172a', 'sm') }}>
              <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>
                💡 About This Item & Highlights:
              </Text>
              <Text style={{ fontSize: 12.5, fontFamily: FONT.regular, color: '#334155', lineHeight: 19 }}>
                {cleanProductDisplayDescription(product.description)}
              </Text>
            </View>
          ) : null}


        </ScrollView>

        {/* Sticky FarmsKing Bottom Action Bar */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 10, ...premiumShadow('#0f172a', 'md') }}>
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#25d366', alignItems: 'center', justifyContent: 'center' }}
            onPress={handleShareWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, backgroundColor: cartQty > 0 ? '#166534' : '#15803d', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', opacity: outOfStock ? 0.6 : 1 }}
            disabled={outOfStock}
            onPress={() => {
              tap();
              onAddToCart();
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 13, fontFamily: FONT.bold }}>
              {cartQty > 0 ? `In Cart (${cartQty}) · Add More` : '🛒 Add to Cart'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#f59e0b', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', opacity: outOfStock ? 0.6 : 1 }}
            disabled={outOfStock}
            onPress={() => {
              tap();
              onBuyNow();
            }}
          >
            <Text style={{ color: '#0f172a', fontSize: 13, fontFamily: FONT.extraBold }}>
              ⚡ Buy Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ProductCard({
  product,
  cartQty,
  onAdd,
  onPressProduct,
  layoutMode = 'GRID',
}: {
  product: Product;
  cartQty: number;
  onAdd: () => void;
  onPressProduct?: (product: Product) => void;
  layoutMode?: 'GRID' | 'COMPACT_LIST';
}) {
  const outOfStock = product.stockQty <= 0;

  const sellingPrice = Number(product.price);
  const mrpPrice = (product as any).mrp ? Number((product as any).mrp) : Math.round(sellingPrice * 1.25);
  const discountPercent = mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 20;

  const isFarmerFood = product.category === 'Natural Farmer Foods' || (product.description || '').includes('[FARMER_MADE]');
  const isCouponProduct = product.category === 'Farmer Plan & Coupons' || (product.category || '').includes('Coupon') || (product.category || '').includes('Plan');

  if (layoutMode === 'COMPACT_LIST') {
    return (
      <TouchableOpacity
        style={[
          styles.listRowCard,
          premiumShadow('#0f172a', 'sm'),
          isFarmerFood && { backgroundColor: '#f0fdf4', borderColor: '#16a34a', borderWidth: 1.5 },
          isCouponProduct && { backgroundColor: '#fffbeb', borderColor: '#fcd34d', borderWidth: 1.5 },
        ]}
        activeOpacity={0.88}
        onPress={() => {
          tap();
          if (onPressProduct) onPressProduct(product);
        }}
      >
        {(() => {
          const displayImg = getProductDisplayImage(product);
          return displayImg ? (
            <Image source={{ uri: displayImg }} style={{ width: 56, height: 56, borderRadius: 8 }} resizeMode="cover" />
          ) : (
            <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="leaf" size={24} color="#15803d" />
            </View>
          );
        })()}

        <View style={{ flex: 1, paddingHorizontal: 10, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#0284c7', textTransform: 'uppercase' }}>
              {product.category || 'Agri Inputs'}
            </Text>
            {discountPercent > 0 && (
              <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                <Text style={{ fontSize: 8.5, fontFamily: FONT.extraBold, color: '#15803d' }}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
            {product.name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#166534' }}>
              ₹{sellingPrice.toLocaleString('en-IN')}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#64748b' }}>/ {product.unit}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { paddingHorizontal: 12, paddingVertical: 8, marginTop: 0 }, outOfStock && styles.addBtnDisabled, cartQty > 0 && styles.addBtnActive]}
          activeOpacity={0.88}
          disabled={outOfStock}
          onPress={(e) => {
            e.stopPropagation();
            tap();
            onAdd();
          }}
        >
          <Ionicons name={cartQty > 0 ? 'checkmark-circle' : 'cart'} size={14} color={outOfStock ? '#94a3b8' : '#ffffff'} />
          <Text style={[styles.addBtnText, outOfStock && { color: '#94a3b8' }]}>
            {outOfStock ? 'Out' : cartQty > 0 ? `(${cartQty})` : '+ Add'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        premiumShadow('#0f172a', 'sm'),
        isFarmerFood && { backgroundColor: '#f0fdf4', borderColor: '#16a34a', borderWidth: 2 },
        isCouponProduct && { backgroundColor: '#fffbeb', borderColor: '#fcd34d', borderWidth: 1.5 },
      ]}
      activeOpacity={0.88}
      onPress={() => {
        tap();
        if (onPressProduct) onPressProduct(product);
      }}
    >
      <View style={styles.cardBadgeRow}>
        {isFarmerFood ? (
          <View style={[styles.certifiedTag, { backgroundColor: '#dcfce7', borderColor: '#16a34a', borderWidth: 1 }]}>
            <Text style={{ fontSize: 9 }}>👨‍🌾</Text>
            <Text style={[styles.certifiedTagText, { color: '#14532d', fontFamily: FONT.bold }]}>Direct Farmer</Text>
          </View>
        ) : isCouponProduct ? (
          <View style={[styles.certifiedTag, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
            <Text style={{ fontSize: 9 }}>🎟️</Text>
            <Text style={[styles.certifiedTagText, { color: '#92400e' }]}>Coupon / Card</Text>
          </View>
        ) : (
          <View style={styles.certifiedTag}>
            <Ionicons name="star" size={9} color="#b45309" />
            <Text style={styles.certifiedTagText}>4.9⭐</Text>
          </View>
        )}
      </View>

      {(() => {
        const displayImg = getProductDisplayImage(product);
        return displayImg ? (
          <Image source={{ uri: displayImg }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="leaf" size={28} color="#15803d" />
          </View>
        );
      })()}

      <View style={styles.cardContent}>
        <Text style={styles.productCategoryTag}>{product.category || 'Agri Inputs'}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

        <View style={{ gap: 2, marginVertical: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#86efac' }}>
              <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#15803d' }}>{discountPercent}% OFF</Text>
            </View>
            <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8', textDecorationLine: 'line-through' }}>
              M.R.P. ₹{mrpPrice.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{sellingPrice.toLocaleString('en-IN')}</Text>
            <Text style={styles.productUnit}>/ {product.unit}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, outOfStock && styles.addBtnDisabled, cartQty > 0 && styles.addBtnActive]}
          activeOpacity={0.88}
          disabled={outOfStock}
          onPress={(e) => {
            e.stopPropagation();
            tap();
            onAdd();
          }}
        >
          <Ionicons name={cartQty > 0 ? 'checkmark-circle' : 'cart'} size={14} color={outOfStock ? '#94a3b8' : '#ffffff'} />
          <Text style={[styles.addBtnText, outOfStock && { color: '#94a3b8' }]}>
            {outOfStock ? 'Out of Stock' : cartQty > 0 ? `In Cart (${cartQty})` : '+ Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  adminTopBar: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#334155' },
  brandBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  brandBadgeText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#f59e0b', letterSpacing: 0.4 },
  modeSwitchGroup: { flexDirection: 'row', gap: 6 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, backgroundColor: '#1e293b' },
  modeBtnActive: { backgroundColor: '#0284c7' },
  modeBtnActiveStore: { backgroundColor: '#15803d' },
  modeBtnText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#94a3b8' },
  modeBtnTextActive: { color: '#ffffff' },

  sellerHeader: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sellerHeaderTitle: { color: '#ffffff', fontSize: 15, fontFamily: FONT.extraBold },
  sellerHeaderSubtitle: { color: '#94a3b8', fontSize: 10.5, fontFamily: FONT.medium, marginTop: 1 },
  sellerAddBtn: { backgroundColor: '#0284c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerAddBtnText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.bold },

  ecomNavBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  ecomNavItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  ecomNavItemActive: { borderBottomColor: '#0284c7' },
  ecomNavText: { fontSize: 10, fontFamily: FONT.medium, color: '#64748b' },
  ecomNavTextActive: { fontSize: 10, fontFamily: FONT.bold, color: '#0284c7' },

  analyticsGrid: { flexDirection: 'row', gap: 10 },
  analyticsCard: { flex: 1, borderRadius: 12, padding: 12, gap: 4 },
  analyticsTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 9.5, fontFamily: FONT.extraBold, letterSpacing: 0.3 },
  analyticsValue: { color: '#ffffff', fontSize: 19, fontFamily: FONT.extraBold },
  analyticsSub: { color: 'rgba(255,255,255,0.75)', fontSize: 9.5, fontFamily: FONT.medium },

  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', gap: 2 },
  kpiVal: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a' },
  kpiLbl: { fontSize: 10, fontFamily: FONT.bold, color: '#64748b' },

  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  tableHeaderTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  tableHeaderCount: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },

  mgmtProductCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  mgmtProductImg: { width: 44, height: 44, borderRadius: 8 },
  mgmtProductImgPlaceholder: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  mgmtProductName: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  mgmtProductMeta: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  updatePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#e0f2fe' },
  updatePhotoBtnText: { fontSize: 10, fontFamily: FONT.bold, color: '#0284c7' },

  settingsCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  settingsCardTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  settingLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  saveSettingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0284c7', borderRadius: RADIUS.md, paddingVertical: 10, marginTop: 6 },
  saveSettingsBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },

  imageBrowseContainer: { gap: 6, marginTop: 2 },
  imageBrowseBtn: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#0284c7', borderRadius: RADIUS.md, padding: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f9ff', gap: 4 },
  imageBrowseText: { fontSize: 12, fontFamily: FONT.bold, color: '#0284c7' },
  previewImage: { width: 90, height: 90, borderRadius: 8 },
  removeImgBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removeImgText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#dc2626' },

  hero: { paddingTop: 14, paddingBottom: 10, paddingHorizontal: SPACING.md, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoBadgeWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#facc15' },
  heroTitle: { color: '#ffffff', fontSize: 19, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(250, 204, 21, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.4)' },
  verifiedTagText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#facc15' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: FONT.medium, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cartBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#ef4444', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#ffffff' },
  cartBadgeText: { color: '#ffffff', fontSize: 9.5, fontFamily: FONT.extraBold },
  searchBarBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.md, paddingHorizontal: 12, height: 44, gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, fontFamily: FONT.regular, fontSize: 13, color: '#0f172a' },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'rgba(0,0,0,0.25)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustItemText: { fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' },
  trustDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' },

  subTabBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: SPACING.md },
  subTabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabItemActive: { borderBottomColor: '#15803d' },
  subTabText: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  subTabTextActive: { color: '#15803d', fontFamily: FONT.bold },
  categoryFilterRow: { backgroundColor: '#ffffff', flexGrow: 0, height: 50, minHeight: 50 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', minHeight: 34 },
  filterChipText: { fontSize: 12, fontFamily: FONT.bold, color: '#334155', textAlign: 'center', includeFontPadding: false, lineHeight: 16 },
  grid: { padding: SPACING.md, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, columnGap: 10, paddingBottom: 170, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  emptyCenter: { width: '100%', alignItems: 'center', justifyContent: 'center', padding: 50, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },

  card: { width: (Platform.OS === 'web' ? 'calc(50% - 6px)' : '48.5%') as any, maxWidth: 280, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 8, gap: 4, borderWidth: 1.5, borderColor: '#e2e8f0', overflow: 'hidden' },
  cardBadgeRow: { position: 'absolute', top: 6, left: 6, zIndex: 10 },
  certifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: '#fde68a' },
  certifiedTagText: { fontSize: 8.5, fontFamily: FONT.extraBold, color: '#92400e' },
  productImage: { width: '100%', height: 125, borderRadius: RADIUS.md },
  productImagePlaceholder: { backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  cardContent: { gap: 4, flex: 1, justifyContent: 'space-between' },
  productCategoryTag: { fontSize: 9.5, fontFamily: FONT.bold, color: '#0284c7', textTransform: 'uppercase' },
  productName: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', minHeight: 32, lineHeight: 15 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  productPrice: { fontSize: 14, fontFamily: FONT.extraBold, color: '#166534' },
  productUnit: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b' },

  listRowCard: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.md, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#15803d', paddingVertical: 8, borderRadius: RADIUS.md, marginTop: 4 },
  addBtnActive: { backgroundColor: '#166534' },
  addBtnDisabled: { backgroundColor: '#e2e8f0' },
  addBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },

  cartFooterBanner: { position: 'absolute', bottom: 14, left: 12, right: 12, backgroundColor: '#15803d', borderRadius: RADIUS.lg, paddingVertical: 11, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#166534', ...premiumShadow('#0f172a', 'md') },
  cartFooterBadge: { backgroundColor: '#ffffff', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cartFooterBadgeText: { color: '#15803d', fontSize: 13, fontFamily: FONT.extraBold },
  cartFooterText: { color: '#ffffff', fontSize: 13, fontFamily: FONT.bold },
  cartFooterSub: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontFamily: FONT.medium },
  cartFooterAction: { color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold },

  cartItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  checkoutBox: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 10 },
  payMethodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  payMethodBtnActive: { backgroundColor: '#15803d', borderColor: '#166534' },
  payMethodText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  placeOrderBtn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  placeOrderBtnText: { color: '#ffffff', fontSize: 14, fontFamily: FONT.bold },

  qrBox: { padding: 14, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#15803d', marginVertical: 6 },
  upiCopyBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#bbf7d0' },
  copyBtn: { backgroundColor: '#15803d', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },

  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 999 },
  modalContent: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 14.5, fontFamily: FONT.bold, color: '#0f172a' },
  inputLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#334155', marginTop: 8, marginBottom: 3 },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12.5, color: '#0f172a', backgroundColor: '#f8fafc' },
  errorText: { fontSize: 11, fontFamily: FONT.bold, color: '#dc2626', marginTop: 8 },
  modalSubmitBtn: { marginTop: 14, borderRadius: RADIUS.md, paddingVertical: 11, backgroundColor: '#15803d', alignItems: 'center' },
  modalSubmitText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 9, fontFamily: FONT.extraBold },
});


function HotDealPopupModal({
  visible,
  featuredProduct,
  headlineTitle,
  onClose,
  onAddToCartAndBuy,
}: {
  visible: boolean;
  featuredProduct: Product | null;
  headlineTitle: string;
  onClose: () => void;
  onAddToCartAndBuy: (product: Product) => void;
}) {
  if (!visible || !featuredProduct) return null;

  const sellingPrice = Number(featuredProduct.price);
  const mrpPrice = Math.round(sellingPrice * 1.35);
  const discountPercent = Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#ea580c', ...premiumShadow('#0f172a', 'md') }}>
          
          {/* Fire Orange Gradient Header */}
          <LinearGradient colors={['#ea580c', '#c2410c']} style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
              <Ionicons name="flame" size={24} color="#fef08a" />
              <View>
                <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.2 }} numberOfLines={1}>
                  {headlineTitle || '🔥 LIMITED TIME HOT DEAL OFFER!'}
                </Text>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#fed7aa' }}>
                  Special Farmer Offer · Express Village Delivery
                </Text>
              </View>
            </View>

            {/* X Cross Close Button */}
            <TouchableOpacity
              onPress={() => {
                tap();
                onClose();
              }}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255, 255, 255, 0.25)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Modal Body Card */}
          <View style={{ padding: 16, alignItems: 'center', gap: 12 }}>
            
            {/* Discount Badge */}
            <View style={{ alignSelf: 'flex-start', backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ffedd5', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="sparkles" size={14} color="#ea580c" />
              <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: '#c2410c' }}>
                🔥 SAVE {discountPercent > 0 ? discountPercent : 35}% OFF TODAY!
              </Text>
            </View>

            {/* Featured Product Image */}
            {(() => {
              const displayImg = getProductDisplayImage(featuredProduct);
              return displayImg ? (
                <Image source={{ uri: displayImg }} style={{ width: '100%', height: 180, borderRadius: 12 }} resizeMode="contain" />
              ) : (
                <View style={{ width: '100%', height: 150, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="leaf" size={56} color="#15803d" />
                </View>
              );
            })()}

            {/* Product Title & Brand */}
            <View style={{ width: '100%', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {(featuredProduct as any).brand || 'FarmsKing Certified Hot Sale'}
              </Text>
              <Text style={{ fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', textAlign: 'center' }} numberOfLines={2}>
                {featuredProduct.name}
              </Text>
            </View>

            {/* Pricing Section */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 24, fontFamily: FONT.extraBold, color: '#16a34a' }}>
                ₹{sellingPrice.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8', textDecorationLine: 'line-through' }}>
                M.R.P. ₹{mrpPrice.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#ea580c' }}>
                / {featuredProduct.unit}
              </Text>
            </View>

            {/* Urgency Stock Tag */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time" size={14} color="#b45309" />
              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#b45309' }}>
                ⚡ Limited Stock Offer! Only a few units remaining.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ width: '100%', gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#15803d', paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...premiumShadow('#15803d', 'sm') }}
                onPress={() => {
                  tap();
                  onAddToCartAndBuy(featuredProduct);
                }}
              >
                <Ionicons name="cart" size={18} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: FONT.extraBold }}>
                  🛒 Add to Cart & Buy Now (₹{sellingPrice.toLocaleString('en-IN')})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: '#f1f5f9', paddingVertical: 9, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => {
                  tap();
                  onClose();
                }}
              >
                <Text style={{ color: '#64748b', fontSize: 11.5, fontFamily: FONT.bold }}>
                  ❌ Dismiss & Continue Browsing Store
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
