import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { FONT, RADIUS } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

export default function RefundPolicyScreen() {
  const router = useRouter();
  const { colors } = useExecutiveTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false, title: 'Refund & Return Policy • FarmsKing' }} />

      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.titleColor }]}>Refund & Cancellation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient
          colors={colors.headerGradient}
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.badgeRow}>
            <Ionicons name="receipt" size={14} color="#00ff87" />
            <Text style={styles.badgeText}>CONSUMER PROTECTION (E-COMMERCE) RULES, 2020</Text>
          </View>
          <Text style={styles.heroTitle}>Refund, Return & Cancellation Policy</Text>
          <Text style={styles.heroSubtitle}>
            Transparent, Farmer-First Guidelines for Certified Seeds, Bio-Nutrients, and Equipment Purchases
          </Text>
          <Text style={styles.effectiveDate}>FarmsKing India Private Limited • Customer Trust Desk</Text>
        </LinearGradient>

        {/* Section 1: Cancellation Policy */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>1. Order Cancellation Windows</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            • <Text style={{ fontFamily: FONT.bold, color: colors.text }}>Pre-Dispatch Cancellations:</Text> You can cancel any marketplace order free of charge before it is dispatched from the seller's hub or regional fulfillment warehouse. A 100% immediate refund is credited to your original payment method or FarmsKing Wallet.
          </Text>
          <Text style={[styles.bodyText, { color: colors.textMuted, marginTop: 8 }]}>
            • <Text style={{ fontFamily: FONT.bold, color: colors.text }}>Post-Dispatch Orders:</Text> If the consignment is in transit via courier/logistics, you may decline delivery at doorstep. Return transit fees may apply if the package is returned without valid defect grounds.
          </Text>
        </View>

        {/* Section 2: Returns & Replacements */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>2. 7-Day Hassle-Free Returns & Replacements</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            Cultivators and urban gardeners are eligible for a replacement or full refund within 7 days of delivery under the following conditions:
          </Text>
          <View style={styles.bulletBox}>
            <Text style={[styles.bulletItem, { color: colors.textMuted }]}>
              ✓ Damaged in transit, broken container seals, or leaking chemical bottles.
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textMuted, marginTop: 6 }]}>
              ✓ Wrong product variant, weight discrepancy, or expired manufacturing batch date.
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textMuted, marginTop: 6 }]}>
              ✓ Defective farm tools, malfunctioning spray battery pumps, or damaged solar equipment.
            </Text>
          </View>
        </View>

        {/* Section 3: Seed & Biological Goods Exclusions */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>3. Perishable & Certified Seed Exclusions</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            To protect biosecurity and prevent counterfeit seed re-entry:
          </Text>
          <Text style={[styles.bodyText, { color: colors.textMuted, marginTop: 8 }]}>
            • Certified hybrid seed packets, inoculated live bio-fertilizers, and nursery saplings cannot be returned once the manufacturer seal is broken or tampered with, unless verifiable germination defect certification is provided.
          </Text>
        </View>

        {/* Section 4: Refund Timelines */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>4. Refund Processing Timelines</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            Once the returned item is inspected at our regional verification hub:
          </Text>
          <View style={styles.bulletBox}>
            <Text style={[styles.bulletItem, { color: colors.textMuted }]}>
              • <Text style={{ fontFamily: FONT.bold, color: colors.text }}>FarmsKing Wallet Credit:</Text> Instant (0 to 15 minutes) — 100% usable on any store purchase.
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textMuted, marginTop: 6 }]}>
              • <Text style={{ fontFamily: FONT.bold, color: colors.text }}>UPI / Bank Transfer:</Text> 2 to 4 business days directly to source account.
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textMuted, marginTop: 6 }]}>
              • <Text style={{ fontFamily: FONT.bold, color: colors.text }}>Cash on Delivery (COD) Orders:</Text> Refunded via instant NEFT/IMPS/UPI upon providing bank details.
            </Text>
          </View>
        </View>

        {/* Section 5: Support Desk */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>5. Need Help with a Return?</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            Our dedicated Farmer Support Desk is available 7 days a week:
          </Text>
          <Text style={[styles.bodyText, { color: colors.primary, fontFamily: FONT.bold, marginTop: 8 }]}>
            📞 Farmer Helpline: 95776-22000 (6:00 AM – 10:00 PM IST)
          </Text>
          <Text style={[styles.bodyText, { color: colors.text, marginTop: 4 }]}>
            ✉️ E-mail: farmskingindia@gmail.com
          </Text>
        </View>

        {/* Back to Home Button */}
        <TouchableOpacity
          style={[styles.returnButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/')}
          activeOpacity={0.85}
        >
          <Ionicons name="home" size={18} color="#020d06" />
          <Text style={styles.returnButtonText}>Return to FarmsKing Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  backText: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  heroBanner: {
    borderRadius: RADIUS.lg,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 8,
  },
  effectiveDate: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  legalCard: {
    borderRadius: RADIUS.md,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.2,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: FONT.bold,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: FONT.regular,
    lineHeight: 21,
  },
  bulletBox: {
    marginTop: 10,
    paddingLeft: 6,
  },
  bulletItem: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    lineHeight: 19,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    marginTop: 16,
    marginBottom: 20,
  },
  returnButtonText: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#020d06',
  },
});
