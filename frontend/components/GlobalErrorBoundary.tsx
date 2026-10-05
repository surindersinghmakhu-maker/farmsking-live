import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS } from '@/constants/theme';
import { useRouter } from 'expo-router';

export function GlobalErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="warning" size={32} color="#dc2626" />
      </View>
      <Text style={styles.title}>ਓਹੋ! ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ</Text>
      <Text style={styles.subtitle}>(Oops! Something went wrong)</Text>
      
      <View style={styles.errorBox}>
        <Text style={styles.errorText} numberOfLines={4}>
          {error?.message || 'An unexpected error occurred.'}
        </Text>
      </View>

      <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
        <Ionicons name="refresh" size={18} color="#ffffff" />
        <Text style={styles.retryBtnText}>ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ (Try Again)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')} activeOpacity={0.8}>
        <Ionicons name="home-outline" size={18} color="#475569" />
        <Text style={styles.homeBtnText}>ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ ਜਾਓ (Go Home)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#ef4444',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  homeBtnText: {
    color: '#475569',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
});
