import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, RADIUS } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';

interface TrustItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  route?: string;
}

/**
 * Genuine customer assurance & promotion strip for Agri Store.
 * Links directly to real order tracking, statutory refund policy, and active promo/referral tools.
 */
export const CustomerTrustStrip: React.FC<{ onOpenCart?: () => void }> = ({ onOpenCart }) => {
  const router = useRouter();
  const { user } = useAuth();

  const items: TrustItem[] = [
    {
      id: 'kyc',
      icon: 'shield-checkmark',
      title: 'KYC-Verified Sellers',
      subtitle: 'Agri license & GST checked',
      color: '#047857',
      bg: '#ecfdf5',
    },
    {
      id: 'gst',
      icon: 'receipt-outline',
      title: '100% GST Tax Invoice',
      subtitle: 'Printable A4 bill on every order',
      color: '#0369a1',
      bg: '#f0f9ff',
    },
    {
      id: 'track',
      icon: 'navigate-outline',
      title: 'Live Order Tracking',
      subtitle: 'Track dispatch & AWB status',
      color: '#6d28d9',
      bg: '#f5f3ff',
      route: '/order-tracking',
    },
    {
      id: 'return',
      icon: 'refresh-circle-outline',
      title: '7-Day Fair Return',
      subtitle: 'Transparent refund guarantee',
      color: '#b45309',
      bg: '#fffbeb',
      route: '/refund-policy',
    },
    {
      id: 'promo',
      icon: 'pricetag-outline',
      title: user ? 'Offers & Referral Rewards' : 'Apply Promo Code in Cart',
      subtitle: user ? 'Verify coupons & invite friends' : 'Save with verified partner codes',
      color: '#be123c',
      bg: '#fff1f2',
      route: user ? '/(user)/(tabs)/coupons' : undefined,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {items.map((item) => {
          const clickable = Boolean(item.route || (item.id === 'promo' && onOpenCart));
          const handlePress = () => {
            if (item.route) {
              router.push(item.route as any);
            } else if (item.id === 'promo' && onOpenCart) {
              onOpenCart();
            }
          };

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={clickable ? 0.78 : 1}
              disabled={!clickable}
              onPress={handlePress}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={17} color={item.color} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              {clickable ? (
                <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flexGrow: 1,
    flexBasis: 215,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
});

