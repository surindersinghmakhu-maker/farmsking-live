import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING } from '@/constants/theme';

export type PolicyType = 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE';

interface LegalPoliciesModalProps {
  visible: boolean;
  initialType?: PolicyType;
  onClose: () => void;
}

export function LegalPoliciesModal({
  visible,
  initialType = 'PRIVACY_POLICY',
  onClose,
}: LegalPoliciesModalProps) {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialType);

  // Keep state synced with prop when opening
  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialType);
    }
  }, [visible, initialType]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.title}>
                {activeTab === 'PRIVACY_POLICY' ? '🛡️ Privacy Policy & Data Protection' : '📜 Terms of Service & User Agreement'}
              </Text>
              <Text style={styles.updatedSub}>
                Updated September 2026 · FarmsKing Agriculture Platform
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={26} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Toggle Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'PRIVACY_POLICY' && styles.tabBtnActive]}
              onPress={() => setActiveTab('PRIVACY_POLICY')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark"
                size={15}
                color={activeTab === 'PRIVACY_POLICY' ? '#16a34a' : '#64748b'}
              />
              <Text style={[styles.tabText, activeTab === 'PRIVACY_POLICY' && styles.tabTextActive]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'TERMS_OF_SERVICE' && styles.tabBtnActive]}
              onPress={() => setActiveTab('TERMS_OF_SERVICE')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="document-text"
                size={15}
                color={activeTab === 'TERMS_OF_SERVICE' ? '#16a34a' : '#64748b'}
              />
              <Text style={[styles.tabText, activeTab === 'TERMS_OF_SERVICE' && styles.tabTextActive]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.bodyScroll}>
            {activeTab === 'PRIVACY_POLICY' ? (
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={styles.head}>1. Information We Collect</Text>
                  <Text style={styles.bodyText}>
                    FarmsKing collects essential account information to provide localized smart farming services:{"\n"}
                    • <Text style={styles.boldText}>Account Credentials:</Text> Mobile number, full name, unique King ID, postal PIN code, and security credentials.{"\n"}
                    • <Text style={styles.boldText}>Farm & Agricultural Data:</Text> Land area, soil type, irrigation sources, crop rotation history, spray schedules, and worker attendance ledgers.{"\n"}
                    • <Text style={styles.boldText}>Location Details:</Text> PIN code, district, state, and village data for accurate daily mandi prices, weather forecasts, and satellite monitoring.
                  </Text>
                </View>

                <View>
                  <Text style={styles.head}>2. Permissions & Media Data</Text>
                  <Text style={styles.bodyText}>
                    • <Text style={styles.boldText}>Camera & Storage:</Text> Crop photos uploaded for AI disease diagnosis, expert crop doctor consulting, and profile identification.{"\n"}
                    • <Text style={styles.boldText}>Microphone & Audio Stream:</Text> Used solely during active doctor voice consultations. Audio is never recorded in the background.{"\n"}
                    • <Text style={styles.boldText}>Device & Notification:</Text> Push notifications for urgent weather alerts, mandi price updates, and order status tracking.
                  </Text>
                </View>

                <View>
                  <Text style={styles.head}>3. How Data Is Protected & Used</Text>
                  <Text style={styles.bodyText}>
                    • All data transmission is encrypted using 256-bit SSL/TLS HTTPS protocols.{"\n"}
                    • <Text style={styles.boldText}>No Third-Party Data Sale:</Text> FarmsKing does not sell, lease, or monetize your personal or farm data to advertising networks.{"\n"}
                    • <Text style={styles.boldText}>Authorized Integrations:</Text> Secure payment processors (Cashfree, Razorpay, UPI) and SMS OTP partners handle authorized transactions only.
                  </Text>
                </View>

                <View>
                  <Text style={styles.head}>4. User Rights & Account Deletion</Text>
                  <Text style={styles.bodyText}>
                    In compliance with Google Play Developer Policy, you hold complete control over your account and personal data:{"\n"}
                    • <Text style={styles.boldText}>In-App Instant Account Deletion:</Text> Initiate complete account deletion anytime inside the app under Account Settings ➔ Delete Account.{"\n"}
                    • Upon confirmation, all active personal data, wallet ledgers, and profile records are immediately soft-deleted and permanently purged from active server nodes. You may also email privacy@farmsking.com for data removal requests.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={styles.head}>1. Acceptance of Terms & Platform Services</Text>
                  <Text style={styles.bodyText}>
                    By registering, logging in, or accessing FarmsKing Agriculture Platform (via Mobile App or Web), you agree to be bound by these Terms of Service. FarmsKing provides digital agricultural management tools, mandi price updates, AI crop disease scanning, AgriStore marketplace, and digital farm ledgers.
                  </Text>
                </View>

                <View>
                  <Text style={styles.head}>2. User Account Responsibility & Security</Text>
                  <Text style={styles.bodyText}>
                    • Users are responsible for maintaining the confidentiality of their login mobile number, password, and King ID.{"\n"}
                    • You agree to provide true, accurate, and current information during registration and seller store setup.{"\n"}
                    • Misuse of the platform, fraudulent crop listings, fake buyer inquiries, or unauthorized access attempts will result in instant account suspension.
                  </Text>
                </View>

                <View>
                  <Text style={styles.head}>3. AgriStore Marketplace & Buyer-Seller Transactions</Text>
                  <Text style={styles.bodyText}>
                    • FarmsKing acts as an agricultural marketplace platform connecting farmers, sellers, dealers, and agricultural advisors.{"\n"}
                    • All listed items (seeds, fertilizers, equipment, crops) must comply with Indian statutory laws, FCO guidelines, and quality standards.{"\n"}
                    • Direct sales between buyers and sellers are subject to mutual verification. Platform order payments processed via verified payment gateways (Cashfree/Razorpay) are protected under FarmsKing buyer protection terms.
                  </Text>
                </View>

                <View>
                  <Text style={styles.head}>4. Advisory & AI Disease Diagnosis Disclaimer</Text>
                  <Text style={styles.bodyText}>
                    • AI Crop Doctor and specialist advisory recommendations are provided as agricultural decision support tools.{"\n"}
                    • Farmers are advised to follow local agricultural university spray guidelines and package dosage instructions before applying chemical sprays.
                  </Text>
                </View>

                <View>
                  <Text style={styles.head}>5. Wallet, Royalties & Rewards Terms</Text>
                  <Text style={styles.bodyText}>
                    • FarmsKing wallet credits, registration welcome bonuses, and advisory commissions are non-transferable reward points credited for legitimate platform engagement.{"\n"}
                    • Fraudulent attempts to generate duplicate accounts or exploit invite bonuses will result in forfeiture of wallet balance and permanent IP blacklisting.
                  </Text>
                </View>

                <View>
                  <Text style={styles.head}>6. Governance & Jurisdiction</Text>
                  <Text style={styles.bodyText}>
                    These terms are governed by the laws of India and subject to Section 79 of the Information Technology Act, 2000 (Safe Harbor Intermediary Protections).
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <TouchableOpacity style={styles.acceptBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.acceptBtnText}>I Have Read & Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  updatedSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    padding: 4,
    marginVertical: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#16a34a',
  },
  bodyScroll: {
    marginVertical: 4,
    paddingRight: 4,
  },
  head: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#334155',
    lineHeight: 18,
  },
  boldText: {
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  acceptBtn: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
  },
});
