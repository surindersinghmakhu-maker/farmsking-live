import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  roleName: string;
}

export function PendingApprovalView({ roleName }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="time" size={60} color="#f59e0b" style={{ marginBottom: 16 }} />
        
        <Text style={styles.title}>Account Pending Approval</Text>
        
        <Text style={styles.desc}>
          Your role as <Text style={{ fontFamily: FONT.bold }}>{roleName}</Text> has been assigned, but your account is pending admin verification.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            To speed up the approval process, please make sure your profile is fully complete.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.btn} 
          activeOpacity={0.8}
          onPress={() => router.push('/advisor-profile')}
        >
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.btnGradient}>
            <Ionicons name="person-circle" size={20} color="#fff" />
            <Text style={styles.btnText}>Complete My Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  content: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: '#fffbeb',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  btnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 15,
  },
});
