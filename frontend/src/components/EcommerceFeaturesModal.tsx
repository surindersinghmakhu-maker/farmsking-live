import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { apiClient } from '@/src/api/client';
import * as Haptics from 'expo-haptics';

interface EcommerceFeaturesModalProps {
  visible: boolean;
  onClose: () => void;
  appSettings: any;
  refetchAppSettings: () => void;
}

export const EcommerceFeaturesModal: React.FC<EcommerceFeaturesModalProps> = ({
  visible,
  onClose,
  appSettings,
  refetchAppSettings,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Parse existing featureFlags or default to empty object
  const featureFlags = appSettings?.featureFlags || {};

  const features = [
    { key: 'loyalty_program', label: 'Customer Loyalty & Rewards (King Coins)', icon: 'star' },
    { key: 'video_stories', label: 'Video Shopping / Farm Tours (Stories)', icon: 'videocam' },
    { key: 'smart_recommendations', label: 'Smart Product Recommendations', icon: 'bulb' },
    { key: 'voice_search', label: 'Voice-Based Search & Listings', icon: 'mic' },
    { key: 'harvest_broadcasts', label: 'One-Click "Harvest Ready" Broadcasts', icon: 'megaphone' },
    { key: 'weather_alerts', label: 'Weather & Sowing SMS Alerts', icon: 'partly-sunny' },
    { key: 'seller_analytics', label: 'Seller Analytics Dashboard', icon: 'bar-chart' },
    { key: 'wholesale_tiers', label: 'Bulk Discount Engine (Wholesale Tiers)', icon: 'cart' },
    { key: 'promoted_listings', label: 'Promoted Listings (Sponsored Products)', icon: 'trending-up' },
  ];

  const handleToggle = async (key: string, currentValue: boolean) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setIsUpdating(true);
      const newFlags = { ...featureFlags, [key]: !currentValue };
      await apiClient.patch('/app-settings', { featureFlags: newFlags });
      await refetchAppSettings();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update feature flag');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>E-Commerce Feature Toggles</Text>
              <Text style={styles.subtitle}>Turn premium features ON/OFF across the platform.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {features.map((feat) => {
              const isEnabled = !!featureFlags[feat.key];
              return (
                <View key={feat.key} style={styles.featureRow}>
                  <View style={styles.featureIconBox}>
                    <Ionicons name={feat.icon as any} size={20} color={isEnabled ? '#00ff87' : '#64748b'} />
                  </View>
                  <View style={styles.featureInfo}>
                    <Text style={[styles.featureLabel, isEnabled && { color: '#00ff87' }]}>{feat.label}</Text>
                    <Text style={styles.featureStatus}>{isEnabled ? 'ACTIVE' : 'DISABLED'}</Text>
                  </View>
                  <View style={styles.switchBox}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#00ff87" />
                    ) : (
                      <Switch
                        value={isEnabled}
                        onValueChange={() => handleToggle(feat.key, isEnabled)}
                        trackColor={{ false: '#1e293b', true: '#059669' }}
                        thumbColor={isEnabled ? '#00ff87' : '#94a3b8'}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020d06',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: '80%',
    paddingTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 12,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  featureStatus: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  switchBox: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
});
