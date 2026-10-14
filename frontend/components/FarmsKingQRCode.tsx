import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface FarmsKingQRCodeProps {
  size?: number;
  showCaption?: boolean;
  themeMode?: 'day' | 'night';
  url?: string;
  onPress?: () => void;
}

export default function FarmsKingQRCode({
  size = 180,
  showCaption = true,
  themeMode = 'day',
  url = 'https://www.farmsking.in',
  onPress,
}: FarmsKingQRCodeProps) {
  const isDay = themeMode === 'day';

  const handleOpenUrl = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View style={[styles.container, isDay ? styles.containerDay : styles.containerNight]}>
      {/* QR Code Container with Scan Frame */}
      <TouchableOpacity
        style={[styles.qrWrapper, { width: size + 24, height: size + 24 }, isDay ? styles.qrWrapperDay : styles.qrWrapperNight]}
        onPress={handleOpenUrl}
        activeOpacity={0.85}
      >
        <Image
          source={require('@/assets/images/farmsking_qr_code.png')}
          style={{ width: size, height: size, borderRadius: 10 }}
          resizeMode="contain"
        />

        {/* Center FarmsKing Verified Badge */}
        <View style={styles.centerLogoBadge}>
          <Image
            source={require('@/assets/images/farmsking_logo_transparent_bg.png')}
            style={styles.centerLogoImg}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {showCaption && (
        <View style={styles.captionBox}>
          <View style={[styles.scanBadge, isDay ? styles.scanBadgeDay : styles.scanBadgeNight]}>
            <Ionicons name="qr-code-outline" size={13} color={isDay ? '#059669' : '#34d399'} />
            <Text style={[styles.scanBadgeText, isDay ? styles.scanBadgeTextDay : styles.scanBadgeTextNight]}>
              SCAN WITH PHONE CAMERA
            </Text>
          </View>
          <Text style={[styles.captionTitle, isDay ? styles.captionTitleDay : styles.captionTitleNight]}>
            www.farmsking.in
          </Text>
          <Text style={[styles.captionSub, isDay ? styles.captionSubDay : styles.captionSubNight]}>
            Mobile & Web Compatible • Direct Access
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  containerDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.06)', 'sm'),
  },
  containerNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...premiumShadow('rgba(0,0,0,0.4)', 'sm'),
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    position: 'relative',
  },
  qrWrapperDay: {
    backgroundColor: '#ffffff',
    borderColor: '#a7f3d0',
  },
  qrWrapperNight: {
    backgroundColor: '#ffffff',
    borderColor: '#34d399',
  },
  centerLogoBadge: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#10b981',
    ...premiumShadow('#000000', 'xs'),
  },
  centerLogoImg: {
    width: 24,
    height: 24,
  },
  captionBox: {
    alignItems: 'center',
    marginTop: 12,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    marginBottom: 6,
  },
  scanBadgeDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  scanBadgeNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  scanBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.6,
  },
  scanBadgeTextDay: {
    color: '#059669',
  },
  scanBadgeTextNight: {
    color: '#34d399',
  },
  captionTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
  captionTitleDay: {
    color: '#0f172a',
  },
  captionTitleNight: {
    color: '#ffffff',
  },
  captionSub: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  captionSubDay: {
    color: '#64748b',
  },
  captionSubNight: {
    color: '#94a3b8',
  },
});
