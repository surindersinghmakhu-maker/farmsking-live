import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS } from '@/constants/theme';

export interface ImpersonationTarget {
  id: string;
  name: string;
  role: 'FARMER' | 'FARM_ADVISOR' | 'SELLER';
  location: string;
  badge: string;
}

interface Props {
  target: ImpersonationTarget | null;
  onExit: () => void;
}

export function AdminImpersonationBanner({ target, onExit }: Props) {
  if (!target) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.contentRow}>
        <View style={styles.eyeIconBox}>
          <Ionicons name="eye" size={16} color="#92400e" />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.mainText}>
            <Text style={{ fontFamily: FONT.extraBold }}>Executive Impersonation Active:</Text> Viewing portal as{' '}
            <Text style={{ fontFamily: FONT.bold, textDecorationLine: 'underline' }}>{target.name}</Text>{' '}
            ({target.badge} · {target.location})
          </Text>
          <Text style={styles.subText}>
            Simulated Sandbox Mode · Real database updates disabled · Safe executive preview
          </Text>
        </View>

        <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.8}>
          <Ionicons name="exit-outline" size={14} color="#ffffff" />
          <Text style={styles.exitBtnText}>Exit Simulation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
    width: '100%',
  },
  eyeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  mainText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#92400e',
  },
  subText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#b45309',
    marginTop: 1,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: RADIUS.pill,
  },
  exitBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
