import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { showAdminToast } from '@/components/AdminLiveToastNotification';

export interface MarketOffer {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  discountType: 'PERCENTAGE' | 'FLAT' | 'BUNDLE' | 'FREE_SHIPPING';
  discountValue: string;
  category: string;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFlashDeal: boolean;
  isPopupBanner: boolean;
  claimedCount: number;
  revenueGenerated: string;
  applicableStores: 'ALL' | 'VERIFIED_ONLY' | 'SELECTED';
}

const INITIAL_OFFERS: MarketOffer[] = [
  {
    id: 'OFFER-WHEAT-2026',
    title: 'Kisan Rabi Sowing Season Special',
    subtitle: 'Flat discount on certified PBW-725 & HD-3086 wheat seed varieties',
    tag: 'FESTIVAL SPECIAL',
    discountType: 'PERCENTAGE',
    discountValue: '20% OFF',
    category: 'Seeds & Grains',
    minOrderValue: 2000,
    startDate: '2026-10-01',
    endDate: '2026-11-25',
    isActive: true,
    isFlashDeal: true,
    isPopupBanner: true,
    claimedCount: 428,
    revenueGenerated: '₹3,85,200',
    applicableStores: 'ALL',
  },
  {
    id: 'OFFER-FERT-MEGA',
    title: 'Bio-NPK & Zinc Fertilizer Mega Deal',
    subtitle: 'Bulk discount on liquid bio-fertilizers and micronutrient spray kits',
    tag: 'HOT DEAL',
    discountType: 'FLAT',
    discountValue: '₹350 OFF',
    category: 'Fertilizers & Nutrients',
    minOrderValue: 3500,
    startDate: '2026-10-10',
    endDate: '2026-11-15',
    isActive: true,
    isFlashDeal: false,
    isPopupBanner: false,
    claimedCount: 295,
    revenueGenerated: '₹2,65,500',
    applicableStores: 'VERIFIED_ONLY',
  },
  {
    id: 'OFFER-POPUP-LAUNCH',
    title: 'Shop Launch Hot Deal Popup Banner',
    subtitle: 'Promotional welcome offer for all farmers on their first marketplace purchase',
    tag: 'WELCOME OFFER',
    discountType: 'PERCENTAGE',
    discountValue: '15% OFF',
    category: 'All Store Categories',
    minOrderValue: 1000,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    isActive: true,
    isFlashDeal: false,
    isPopupBanner: true,
    claimedCount: 1240,
    revenueGenerated: '₹8,92,800',
    applicableStores: 'ALL',
  },
  {
    id: 'OFFER-SPRAYER-FLASH',
    title: 'Battery Sprayer & Drone Service Flash Sale',
    subtitle: '16L & 20L continuous battery spray tanks with 1-year warranty',
    tag: 'FLASH SALE',
    discountType: 'FLAT',
    discountValue: '₹500 OFF',
    category: 'Farm Machinery & Tools',
    minOrderValue: 4000,
    startDate: '2026-10-14',
    endDate: '2026-10-24',
    isActive: true,
    isFlashDeal: true,
    isPopupBanner: false,
    claimedCount: 167,
    revenueGenerated: '₹3,34,000',
    applicableStores: 'VERIFIED_ONLY',
  },
  {
    id: 'OFFER-GARDEN-BALCONY',
    title: 'Urban Garden Plant Care Combo',
    subtitle: 'Buy organic potting soil & vermicompost with free pruning shears',
    tag: 'BUNDLE DEAL',
    discountType: 'BUNDLE',
    discountValue: 'Buy 2 Get 1',
    category: 'Urban Gardening',
    minOrderValue: 800,
    startDate: '2026-10-05',
    endDate: '2026-11-05',
    isActive: false,
    isFlashDeal: false,
    isPopupBanner: false,
    claimedCount: 88,
    revenueGenerated: '₹52,800',
    applicableStores: 'ALL',
  },
];

type FilterType = 'ALL' | 'FLASH' | 'BANNERS' | 'ACTIVE' | 'EXPIRED';

export default function AdminOffersScreen() {
  const { colors, isLight, isDarkTheme } = useExecutiveTheme();
  const [offers, setOffers] = useState<MarketOffer[]>(INITIAL_OFFERS);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<MarketOffer | null>(null);

  // New / Edit Offer Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formTag, setFormTag] = useState('HOT DEAL');
  const [formDiscountType, setFormDiscountType] = useState<'PERCENTAGE' | 'FLAT' | 'BUNDLE' | 'FREE_SHIPPING'>('PERCENTAGE');
  const [formDiscountValue, setFormDiscountValue] = useState('20% OFF');
  const [formCategory, setFormCategory] = useState('All Store Categories');
  const [formMinOrder, setFormMinOrder] = useState('1500');
  const [formIsFlash, setFormIsFlash] = useState(false);
  const [formIsPopup, setFormIsPopup] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  const tap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleOpenCreateModal = () => {
    tap();
    setEditingOffer(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormTag('SPECIAL OFFER');
    setFormDiscountType('PERCENTAGE');
    setFormDiscountValue('15% OFF');
    setFormCategory('All Store Categories');
    setFormMinOrder('1500');
    setFormIsFlash(false);
    setFormIsPopup(false);
    setFormIsActive(true);
    setModalVisible(true);
  };

  const handleOpenEditModal = (offer: MarketOffer) => {
    tap();
    setEditingOffer(offer);
    setFormTitle(offer.title);
    setFormSubtitle(offer.subtitle);
    setFormTag(offer.tag);
    setFormDiscountType(offer.discountType);
    setFormDiscountValue(offer.discountValue);
    setFormCategory(offer.category);
    setFormMinOrder(String(offer.minOrderValue));
    setFormIsFlash(offer.isFlashDeal);
    setFormIsPopup(offer.isPopupBanner);
    setFormIsActive(offer.isActive);
    setModalVisible(true);
  };

  const handleToggleOfferStatus = (id: string) => {
    tap();
    let newStatus = false;
    let targetTitle = '';
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          newStatus = !o.isActive;
          targetTitle = o.title;
          return { ...o, isActive: newStatus };
        }
        return o;
      })
    );
    showAdminToast('INFO', 'Offer Status Updated', `"${targetTitle}" is now ${newStatus ? 'Active' : 'Paused'}`);
  };

  const handleDeleteOffer = (id: string, title: string) => {
    tap();
    setOffers((prev) => prev.filter((o) => o.id !== id));
    showAdminToast('WARNING', 'Offer Deleted', `"${title}" has been removed from marketplace`);
  };

  const handleSaveOffer = () => {
    tap();
    if (!formTitle.trim()) {
      showAdminToast('ALERT', 'Validation Error', 'Please enter an offer title to proceed.');
      return;
    }

    if (editingOffer) {
      setOffers((prev) =>
        prev.map((o) =>
          o.id === editingOffer.id
            ? {
                ...o,
                title: formTitle.trim(),
                subtitle: formSubtitle.trim() || 'Special promotional discount for farmers and buyers',
                tag: formTag.trim().toUpperCase(),
                discountType: formDiscountType,
                discountValue: formDiscountValue.trim(),
                category: formCategory,
                minOrderValue: Number(formMinOrder) || 0,
                isFlashDeal: formIsFlash,
                isPopupBanner: formIsPopup,
                isActive: formIsActive,
              }
            : o
        )
      );
      showAdminToast('SUCCESS', 'Offer Updated', `"${formTitle.trim()}" changes saved successfully.`);
    } else {
      const newOffer: MarketOffer = {
        id: `OFFER-${Date.now().toString().slice(-6)}`,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || 'Special promotional discount for farmers and buyers',
        tag: formTag.trim().toUpperCase() || 'NEW DEAL',
        discountType: formDiscountType,
        discountValue: formDiscountValue.trim() || '10% OFF',
        category: formCategory,
        minOrderValue: Number(formMinOrder) || 1000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31',
        isActive: formIsActive,
        isFlashDeal: formIsFlash,
        isPopupBanner: formIsPopup,
        claimedCount: 0,
        revenueGenerated: '₹0',
        applicableStores: 'ALL',
      };
      setOffers((prev) => [newOffer, ...prev]);
      showAdminToast('SUCCESS', 'New Deal Created', `"${formTitle.trim()}" published to marketplace.`);
    }

    setModalVisible(false);
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((item) => {
      if (filter === 'ACTIVE' && !item.isActive) return false;
      if (filter === 'EXPIRED' && item.isActive) return false;
      if (filter === 'FLASH' && !item.isFlashDeal) return false;
      if (filter === 'BANNERS' && !item.isPopupBanner) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesTag = item.tag.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubtitle && !matchesCategory && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [offers, filter, searchQuery]);

  const activeCount = offers.filter((o) => o.isActive).length;
  const totalClaimed = offers.reduce((acc, o) => acc + o.claimedCount, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Banner */}
        <LinearGradient
          colors={
            isLight
              ? ['#ffffff', '#f0fdf4']
              : isDarkTheme
              ? ['#0b1329', '#020617']
              : ['#03140a', '#020b06']
          }
          style={[
            styles.heroCard,
            isLight && styles.heroCardLight,
            isDarkTheme && styles.heroCardDark,
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.liveDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.badgeText}>STORE & SELLER DEALS</Text>
              </View>
              <Text style={[styles.heroTitle, isLight && { color: '#0f172a' }]}>
                Market Offers & Deals
              </Text>
              <Text style={[styles.heroSubtitle, isLight && { color: '#475569' }]}>
                Create, monitor and blast flash deals, promotional banners & store discounts
              </Text>
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleOpenCreateModal}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#ffffff" />
              <Text style={styles.createBtnText}>New Offer</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Cards */}
          <View style={styles.metricsGrid}>
            <View
              style={[
                styles.metricPill,
                isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              ]}
            >
              <Ionicons name="pricetags" size={18} color="#0284c7" />
              <View>
                <Text style={[styles.metricVal, isLight && { color: '#0f172a' }]}>
                  {activeCount}
                </Text>
                <Text style={styles.metricLabel}>Active Offers</Text>
              </View>
            </View>

            <View
              style={[
                styles.metricPill,
                isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              ]}
            >
              <Ionicons name="flame" size={18} color="#ea580c" />
              <View>
                <Text style={[styles.metricVal, isLight && { color: '#0f172a' }]}>
                  {offers.filter((o) => o.isFlashDeal && o.isActive).length}
                </Text>
                <Text style={styles.metricLabel}>Flash Deals</Text>
              </View>
            </View>

            <View
              style={[
                styles.metricPill,
                isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              ]}
            >
              <Ionicons name="people" size={18} color="#16a34a" />
              <View>
                <Text style={[styles.metricVal, isLight && { color: '#0f172a' }]}>
                  {totalClaimed.toLocaleString()}
                </Text>
                <Text style={styles.metricLabel}>Deals Claimed</Text>
              </View>
            </View>

            <View
              style={[
                styles.metricPill,
                isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              ]}
            >
              <Ionicons name="cash" size={18} color="#8b5cf6" />
              <View>
                <Text style={[styles.metricVal, isLight && { color: '#0f172a' }]}>
                  ₹16.3 L
                </Text>
                <Text style={styles.metricLabel}>Deal Volume</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Search Bar & Filter Controls */}
        <View style={styles.controlsSection}>
          <View
            style={[
              styles.searchBar,
              isLight && { backgroundColor: '#ffffff', borderColor: '#cbd5e1' },
              isDarkTheme && { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(56,189,248,0.2)' },
            ]}
          >
            <Ionicons name="search" size={16} color={isLight ? '#0284c7' : '#38bdf8'} />
            <TextInput
              style={[styles.searchInput, isLight && { color: '#0f172a' }]}
              placeholder="Search offers by name, product or tag..."
              placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScroll}
          >
            {[
              { key: 'ALL', label: 'All Offers' },
              { key: 'ACTIVE', label: 'Live Now' },
              { key: 'FLASH', label: '⚡ Flash Deals' },
              { key: 'BANNERS', label: '🖼️ Popups & Banners' },
              { key: 'EXPIRED', label: 'Paused' },
            ].map((tab) => {
              const isSelected = filter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterPill,
                    isLight && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                    isSelected && (isLight ? styles.filterPillActiveLight : styles.filterPillActiveDark),
                  ]}
                  onPress={() => {
                    tap();
                    setFilter(tab.key as FilterType);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isLight && { color: '#475569' },
                      isSelected && (isLight ? { color: '#ffffff' } : { color: '#020617' }),
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Offers Cards Grid */}
        <View style={styles.offersGrid}>
          {filteredOffers.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              ]}
            >
              <Ionicons name="pricetag-outline" size={42} color="#94a3b8" />
              <Text style={[styles.emptyTitle, isLight && { color: '#0f172a' }]}>
                No Market Offers Found
              </Text>
              <Text style={styles.emptySubtitle}>
                No promotions match your search or filter. Create a new offer to boost sales.
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={handleOpenCreateModal}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={16} color="#ffffff" />
                <Text style={styles.emptyCreateBtnText}>Create Market Offer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOffers.map((item) => {
              return (
                <View
                  key={item.id}
                  style={[
                    styles.offerCard,
                    isLight && styles.offerCardLight,
                    isDarkTheme && styles.offerCardDark,
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View
                        style={[
                          styles.tagPill,
                          item.isFlashDeal
                            ? { backgroundColor: 'rgba(234, 88, 12, 0.15)', borderColor: 'rgba(234, 88, 12, 0.4)' }
                            : { backgroundColor: 'rgba(2, 132, 199, 0.15)', borderColor: 'rgba(2, 132, 199, 0.4)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            item.isFlashDeal ? { color: '#ea580c' } : { color: '#0284c7' },
                          ]}
                        >
                          {item.tag}
                        </Text>
                      </View>

                      {item.isPopupBanner && (
                        <View style={styles.bannerTagPill}>
                          <Text style={styles.bannerTagText}>POPUP BANNER</Text>
                        </View>
                      )}
                    </View>

                    {/* Status & Toggle */}
                    <View style={styles.cardHeaderRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          item.isActive
                            ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }
                            : { backgroundColor: 'rgba(148, 163, 184, 0.15)', borderColor: 'rgba(148, 163, 184, 0.4)' },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: item.isActive ? '#10b981' : '#94a3b8' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: item.isActive ? '#10b981' : '#94a3b8' },
                          ]}
                        >
                          {item.isActive ? 'LIVE' : 'PAUSED'}
                        </Text>
                      </View>

                      <Switch
                        value={item.isActive}
                        onValueChange={() => handleToggleOfferStatus(item.id)}
                        trackColor={{ false: '#475569', true: '#10b981' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  </View>

                  {/* Discount Headline */}
                  <View style={styles.discountRow}>
                    <Text style={[styles.discountValueText, isLight && { color: '#0284c7' }]}>
                      {item.discountValue}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Ionicons name="folder-outline" size={11} color="#64748b" />
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>

                  {/* Title & Subtitle */}
                  <Text style={[styles.offerTitle, isLight && { color: '#0f172a' }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.offerSubtitle, isLight && { color: '#475569' }]}>
                    {item.subtitle}
                  </Text>

                  {/* Details Pill Row */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="cart-outline" size={13} color="#94a3b8" />
                      <Text style={styles.detailText}>
                        Min Order: ₹{item.minOrderValue.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={13} color="#94a3b8" />
                      <Text style={styles.detailText}>
                        Valid till: {item.endDate}
                      </Text>
                    </View>
                  </View>

                  {/* Performance Metrics Footer */}
                  <View
                    style={[
                      styles.cardFooter,
                      isLight && { borderTopColor: '#f1f5f9', backgroundColor: '#f8fafc' },
                      isDarkTheme && { borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' },
                    ]}
                  >
                    <View style={styles.statsGroup}>
                      <Text style={styles.statLabel}>Claimed</Text>
                      <Text style={[styles.statValue, isLight && { color: '#0f172a' }]}>
                        {item.claimedCount} times
                      </Text>
                    </View>

                    <View style={styles.statsGroup}>
                      <Text style={styles.statLabel}>Revenue</Text>
                      <Text style={[styles.statValue, isLight && { color: '#16a34a' }]}>
                        {item.revenueGenerated}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionBtnsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, isLight && { backgroundColor: '#e0f2fe' }]}
                        onPress={() => handleOpenEditModal(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={15} color="#0284c7" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, isLight && { backgroundColor: '#fee2e2' }]}
                        onPress={() => handleDeleteOffer(item.id, item.title)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={15} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Create / Edit Offer Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View
            style={[
              styles.modalSheet,
              isLight && { backgroundColor: '#ffffff', borderTopColor: '#0284c7' },
              isDarkTheme && { backgroundColor: '#0b1329', borderTopColor: '#38bdf8' },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, isLight && { color: '#0f172a' }]}>
                  {editingOffer ? 'Edit Market Offer' : 'Create New Market Offer'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Configure promotional headline, discount value and store criteria
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={isLight ? '#64748b' : '#94a3b8'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalFormContent}>
              {/* Offer Title */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isLight && { color: '#334155' }]}>
                  Offer Title *
                </Text>
                <TextInput
                  style={[styles.formInput, isLight && styles.formInputLight]}
                  placeholder="e.g. Kisan Rabi Sowing Season Special"
                  placeholderTextColor="#94a3b8"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Offer Subtitle */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isLight && { color: '#334155' }]}>
                  Offer Subtitle / Description
                </Text>
                <TextInput
                  style={[styles.formInput, isLight && styles.formInputLight]}
                  placeholder="e.g. 20% off on all certified wheat seed varieties"
                  placeholderTextColor="#94a3b8"
                  value={formSubtitle}
                  onChangeText={setFormSubtitle}
                />
              </View>

              {/* Tag & Discount Value Row */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, isLight && { color: '#334155' }]}>
                    Badge Tag
                  </Text>
                  <TextInput
                    style={[styles.formInput, isLight && styles.formInputLight]}
                    placeholder="HOT DEAL / SPECIAL"
                    placeholderTextColor="#94a3b8"
                    value={formTag}
                    onChangeText={setFormTag}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, isLight && { color: '#334155' }]}>
                    Discount Value *
                  </Text>
                  <TextInput
                    style={[styles.formInput, isLight && styles.formInputLight]}
                    placeholder="e.g. 25% OFF or ₹200 OFF"
                    placeholderTextColor="#94a3b8"
                    value={formDiscountValue}
                    onChangeText={setFormDiscountValue}
                  />
                </View>
              </View>

              {/* Category & Min Order Value */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, isLight && { color: '#334155' }]}>
                    Category Scope
                  </Text>
                  <TextInput
                    style={[styles.formInput, isLight && styles.formInputLight]}
                    placeholder="e.g. Seeds, Fertilizers, All"
                    placeholderTextColor="#94a3b8"
                    value={formCategory}
                    onChangeText={setFormCategory}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, isLight && { color: '#334155' }]}>
                    Min Order Value (₹)
                  </Text>
                  <TextInput
                    style={[styles.formInput, isLight && styles.formInputLight]}
                    placeholder="1500"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={formMinOrder}
                    onChangeText={setFormMinOrder}
                  />
                </View>
              </View>

              {/* Toggles Row */}
              <View
                style={[
                  styles.togglesCard,
                  isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
                ]}
              >
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, isLight && { color: '#0f172a' }]}>
                      ⚡ Flash Deal Counter
                    </Text>
                    <Text style={styles.toggleSub}>
                      Display countdown clock and urgent deal banner on product cards
                    </Text>
                  </View>
                  <Switch
                    value={formIsFlash}
                    onValueChange={setFormIsFlash}
                    trackColor={{ false: '#475569', true: '#ea580c' }}
                  />
                </View>

                <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)', paddingTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, isLight && { color: '#0f172a' }]}>
                      🖼️ Shop Popup Banner
                    </Text>
                    <Text style={styles.toggleSub}>
                      Automatically popup promotional banner when customers visit the marketplace
                    </Text>
                  </View>
                  <Switch
                    value={formIsPopup}
                    onValueChange={setFormIsPopup}
                    trackColor={{ false: '#475569', true: '#0284c7' }}
                  />
                </View>

                <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)', paddingTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, isLight && { color: '#0f172a' }]}>
                      Activate Immediately
                    </Text>
                    <Text style={styles.toggleSub}>Make this offer visible to all farmers and buyers</Text>
                  </View>
                  <Switch
                    value={formIsActive}
                    onValueChange={setFormIsActive}
                    trackColor={{ false: '#475569', true: '#10b981' }}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveOffer}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>
                  {editingOffer ? 'Save Changes' : 'Launch Market Offer'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: Platform.OS === 'web' ? 16 : 24,
    gap: 10,
  },
  heroCard: {
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    gap: 10,
    ...premiumShadow('#0284c7', 'md'),
  },
  heroCardLight: {
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  heroCardDark: {
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#0284c7',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 18,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    ...premiumShadow('#0284c7', 'sm'),
  },
  createBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricVal: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  controlsSection: {
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },
  filterPillsScroll: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterPillActiveLight: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  filterPillActiveDark: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  filterPillText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  offersGrid: {
    gap: 8,
  },
  offerCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 11,
    gap: 8,
    overflow: 'hidden',
  },
  offerCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'sm'),
  },
  offerCardDark: {
    backgroundColor: '#0b1329',
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  bannerTagPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  bannerTagText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#a78bfa',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discountValueText: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
    letterSpacing: -0.5,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  categoryText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  offerTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
    lineHeight: 20,
  },
  offerSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 17,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statsGroup: {
    gap: 2,
  },
  statLabel: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  statValue: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  emptyCreateBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#020b06',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 2,
    borderTopColor: '#0284c7',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormContent: {
    padding: 18,
    gap: 14,
  },
  formGroup: {
    gap: 5,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },
  formInputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    color: '#0f172a',
  },
  togglesCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 12,
    marginTop: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  toggleSub: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    marginTop: 10,
    ...premiumShadow('#0284c7', 'md'),
  },
  submitBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
