import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING } from '@/constants/theme';

export type PolicyType = 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'REFUND_POLICY' | 'SHIPPING_POLICY';

interface LegalPoliciesModalProps {
  visible: boolean;
  initialType?: PolicyType;
  onClose: () => void;
}

export function LegalPoliciesModal({
  visible,
  initialType = 'TERMS_OF_SERVICE',
  onClose,
}: LegalPoliciesModalProps) {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialType);
  const { width, height } = useWindowDimensions();
  const isMobile = width < 640;

  useEffect(() => {
    if (visible && initialType) {
      setActiveTab(initialType);
    }
  }, [visible, initialType]);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'TERMS_OF_SERVICE':
        return 'Terms of Service & User Agreement';
      case 'PRIVACY_POLICY':
        return 'Privacy Policy & Data Protection';
      case 'REFUND_POLICY':
        return 'Refund, Return & Cancellation Policy';
      case 'SHIPPING_POLICY':
        return 'Shipping & Pan-India Delivery Policy';
    }
  };

  const getHeaderIcon = () => {
    switch (activeTab) {
      case 'TERMS_OF_SERVICE':
        return 'document-text';
      case 'PRIVACY_POLICY':
        return 'shield-checkmark';
      case 'REFUND_POLICY':
        return 'receipt';
      case 'SHIPPING_POLICY':
        return 'cube';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to close */}
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Card */}
        <View style={[styles.card, { maxHeight: Math.min(height * 0.9, 740) }]}>
          {/* Header with Title and Prominent Close [X] Button */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconBadge}>
                <Ionicons name={getHeaderIcon()} size={18} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {getHeaderTitle()}
                </Text>
                <Text style={styles.updatedSub} numberOfLines={1}>
                  FARMSKING TECHNOLOGIES PRIVATE LIMITED · CIN: U01100PB2026PTC063294
                </Text>
              </View>
            </View>

            {/* Explicit Close [X] Button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close Dialog"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color="#f8fafc" />
            </TouchableOpacity>
          </View>

          {/* Toggle Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'TERMS_OF_SERVICE' && styles.tabBtnActive]}
              onPress={() => setActiveTab('TERMS_OF_SERVICE')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="document-text"
                size={14}
                color={activeTab === 'TERMS_OF_SERVICE' ? '#10b981' : '#94a3b8'}
              />
              <Text style={[styles.tabText, activeTab === 'TERMS_OF_SERVICE' && styles.tabTextActive]}>
                Terms
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'PRIVACY_POLICY' && styles.tabBtnActive]}
              onPress={() => setActiveTab('PRIVACY_POLICY')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={activeTab === 'PRIVACY_POLICY' ? '#10b981' : '#94a3b8'}
              />
              <Text style={[styles.tabText, activeTab === 'PRIVACY_POLICY' && styles.tabTextActive]}>
                Privacy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'REFUND_POLICY' && styles.tabBtnActive]}
              onPress={() => setActiveTab('REFUND_POLICY')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="receipt"
                size={14}
                color={activeTab === 'REFUND_POLICY' ? '#10b981' : '#94a3b8'}
              />
              <Text style={[styles.tabText, activeTab === 'REFUND_POLICY' && styles.tabTextActive]}>
                Refunds
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'SHIPPING_POLICY' && styles.tabBtnActive]}
              onPress={() => setActiveTab('SHIPPING_POLICY')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="cube"
                size={14}
                color={activeTab === 'SHIPPING_POLICY' ? '#10b981' : '#94a3b8'}
              />
              <Text style={[styles.tabText, activeTab === 'SHIPPING_POLICY' && styles.tabTextActive]}>
                Shipping
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Policy Body */}
          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyScrollContent}
          >
            {/* 1. TERMS OF SERVICE */}
            {activeTab === 'TERMS_OF_SERVICE' && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>1. Acceptance of Terms & Platform Scope</Text>
                  <Text style={styles.bodyText}>
                    By accessing, registering, browsing, or using the FarmsKing platform (Web & Mobile applications), you agree to be legally bound by these Terms of Service. FarmsKing is an agricultural technology platform operated by <Text style={styles.boldText}>FARMSKING TECHNOLOGIES PRIVATE LIMITED</Text> (CIN: U01100PB2026PTC063294), providing digital farm management records, live mandi rates, AI crop diagnostic recommendations, AgriStore e-commerce marketplace, and verified agronomy consultations.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>2. User Account Security & KYC Obligations</Text>
                  <Text style={styles.bodyText}>
                    • You agree to provide accurate, verified information during account onboarding (Mobile number, King ID, Farm Acreage, and Postal PIN code).{'\n'}
                    • Account credentials and OTP codes are strictly confidential. You are solely responsible for activities performed under your registered account.{'\n'}
                    • Any fraudulent crop listings, counterfeit inputs, or unauthorized account tampering will result in immediate suspension and blacklisting.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>3. E-Commerce Marketplace & Direct Sales</Text>
                  <Text style={styles.bodyText}>
                    • FarmsKing operates as an agricultural marketplace connecting farmers with certified seed companies, bio-fertilizer manufacturers, and equipment vendors.{'\n'}
                    • All listed inputs comply with statutory Fertilizer Control Order (FCO), Seed Act, and Insecticides Act regulations.{'\n'}
                    • Payments processed via verified gateways (Cashfree, Razorpay, UPI) are escrow-protected under FarmsKing Buyer Protection guidelines.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>4. Crop Advisory & Plant Pathology Disclaimer</Text>
                  <Text style={styles.bodyText}>
                    • AI Crop Doctor and agronomist consultation recommendations are advisory in nature based on submitted imagery, symptom logs, and regional weather data.{'\n'}
                    • Farmers are advised to observe label instructions, application dosages, and local university agronomy guidelines before spraying chemical products.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>5. Safe Harbor Protection & Governance</Text>
                  <Text style={styles.bodyText}>
                    These terms are governed by the laws of India and subject to intermediary protections under Section 79 of the Information Technology Act, 2000. All legal disputes are subject to the exclusive jurisdiction of the competent courts in Punjab, India.
                  </Text>
                </View>
              </View>
            )}

            {/* 2. PRIVACY POLICY */}
            {activeTab === 'PRIVACY_POLICY' && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>1. Information We Collect</Text>
                  <Text style={styles.bodyText}>
                    In compliance with the Digital Personal Data Protection Act (DPDPA 2023), FarmsKing collects only essential data needed to provide agricultural services:{'\n'}
                    • <Text style={styles.boldText}>Identity & Contact:</Text> Mobile number, Name, King ID, and Village/District/PIN code.{'\n'}
                    • <Text style={styles.boldText}>Farm & Agronomy Records:</Text> Land acreage, crop rotation history, soil test results, and spray records.{'\n'}
                    • <Text style={styles.boldText}>Media Uploads:</Text> High-resolution crop photos uploaded for AI leaf disease diagnostics and doctor consultations.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>2. Data Security & Storage Standards</Text>
                  <Text style={styles.bodyText}>
                    • All server traffic is secured using 256-bit SSL/TLS end-to-end encryption.{'\n'}
                    • <Text style={styles.boldText}>Zero Third-Party Data Sale:</Text> FarmsKing never sells, rents, or monetizes farmer personal or agricultural data to unauthorized third parties or ad brokers.{'\n'}
                    • Financial transactions are processed exclusively through RBI-authorized payment aggregators (Cashfree, Razorpay) with PCI-DSS Level 1 compliance.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>3. Instant In-App Account & Data Deletion</Text>
                  <Text style={styles.bodyText}>
                    You maintain complete ownership of your personal data:{'\n'}
                    • You may trigger complete account deletion directly in the app via <Text style={styles.boldText}>Account Settings ➔ Delete Account</Text>.{'\n'}
                    • Upon confirmed deletion, your profile records, stored farm photos, and active ledgers are permanently purged from active production servers. You may also contact privacy@farmsking.com for data access or erasure requests.
                  </Text>
                </View>
              </View>
            )}

            {/* 3. REFUND POLICY */}
            {activeTab === 'REFUND_POLICY' && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>1. Return & Refund Eligibility Window</Text>
                  <Text style={styles.bodyText}>
                    Under the Consumer Protection (E-Commerce) Rules 2020, FarmsKing provides transparent refund and return procedures:{'\n'}
                    • <Text style={styles.boldText}>Return Window:</Text> Return requests for eligible agricultural products must be raised within 7 calendar days of delivery.{'\n'}
                    • <Text style={styles.boldText}>Condition:</Text> Products must remain unused, unopened, and in their original tamper-evident packaging with company batch codes intact.{'\n'}
                    • <Text style={styles.boldText}>Damaged / Defective Items:</Text> If a shipment arrives damaged or with broken seals, report within 48 hours with package photos for immediate replacement or full refund.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>2. Refund Processing SLA (5 to 7 Working Days)</Text>
                  <Text style={styles.bodyText}>
                    • Once returned goods are inspected and verified at the seller fulfillment hub, refunds are initiated immediately.{'\n'}
                    • The refund amount is credited back to the original source method (UPI, NetBanking, Credit/Debit Card) within <Text style={styles.boldText}>5 to 7 working days</Text> as per banking gateway protocols.{'\n'}
                    • For Cash-on-Delivery (COD) orders, refunds are credited directly to your verified FarmsKing Wallet or provided bank UPI account.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>3. Order Cancellations & Advisory Services</Text>
                  <Text style={styles.bodyText}>
                    • Orders may be cancelled with 100% full refund at any time before dispatch from the supplier warehouse.{'\n'}
                    • <Text style={styles.boldText}>Crop Advisory Plans:</Text> Digital consultation fees are fully refundable if the assigned agronomist fails to provide a prescription within the committed SLA window.
                  </Text>
                </View>
              </View>
            )}

            {/* 4. SHIPPING POLICY */}
            {activeTab === 'SHIPPING_POLICY' && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>1. Order Dispatch & Packaging Standards</Text>
                  <Text style={styles.bodyText}>
                    • Orders placed before 2:00 PM IST on working days (Monday through Saturday) are packed and dispatched within <Text style={styles.boldText}>24 to 48 business hours</Text>.{'\n'}
                    • Agri-inputs (seeds, bio-nutrients, equipment) are packaged in moisture-proof, tamper-evident containers meeting pan-India agricultural transport safety protocols.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>2. Delivery Timelines & Logistics Partners</Text>
                  <Text style={styles.bodyText}>
                    • Delivery typically takes <Text style={styles.boldText}>3 to 7 working days</Text> depending on village / PIN code accessibility.{'\n'}
                    • We partner with certified tier-1 logistics carriers including Blue Dart, Delhivery, DTDC, and India Post Speed Post for rural reach.{'\n'}
                    • Real-time SMS and King ID live tracking links are dispatched immediately upon shipment handover.
                  </Text>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.head}>3. Delivery Inquiries & Support</Text>
                  <Text style={styles.bodyText}>
                    For any delivery delays or transit inquiries, contact FarmsKing Support via WhatsApp or email at support@farmsking.com quoting your Order ID.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeActionBtn}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Close and return to form"
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.closeActionBtnText}>I Have Read & Understand · Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 14, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999999,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl || 16,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    maxWidth: 620,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 25,
    zIndex: 1000000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  updatedSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090e17',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 7,
  },
  tabBtnActive: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#10b981',
  },
  bodyScroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  bodyScrollContent: {
    paddingBottom: 16,
  },
  sectionWrap: {
    gap: 14,
  },
  sectionBlock: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    padding: 12,
  },
  head: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#38bdf8',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  boldText: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  closeActionBtn: {
    backgroundColor: '#10b981',
    borderRadius: RADIUS.md || 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  closeActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
});
