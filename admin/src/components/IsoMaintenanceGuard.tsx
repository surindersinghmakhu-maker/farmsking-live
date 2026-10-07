import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getIsoModuleControls, IsoModuleControl } from '../api/iso-controls.api';

interface IsoMaintenanceGuardProps {
  moduleKey: 'ADMIN' | 'ECOMMERCE' | 'CUSTOMER_FARMER_DASHBOARD' | 'FARMER_DOCTOR' | 'GARDENER_DASHBOARD' | 'GARDEN_ADVISOR' | 'STAFF_PORTAL' | 'WALLET' | 'ACCOUNTS';
  children: React.ReactNode;
}

export const IsoMaintenanceGuard: React.FC<IsoMaintenanceGuardProps> = ({ moduleKey, children }) => {
  const [loading, setLoading] = useState(true);
  const [control, setControl] = useState<IsoModuleControl | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const controls = await getIsoModuleControls();
      const match = controls.find((c) => c.moduleKey.toUpperCase() === moduleKey.toUpperCase());
      setControl(match || null);
    } catch (e) {
      console.warn('Failed to check ISO module status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [moduleKey]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // If control exists and isDisabled (isEnabled === false), show ISO Maintenance Mode
  if (control && !control.isEnabled) {
    return (
      <View style={styles.maintenanceContainer}>
        <View style={styles.isoCard}>
          <View style={styles.badgeRow}>
            <Ionicons name="shield-checkmark" size={24} color="#f59e0b" />
            <Text style={styles.badgeText}>ISO 9001 COMPLIANCE SYSTEM GUARD</Text>
          </View>

          <View style={styles.iconCircle}>
            <Ionicons name="construct" size={48} color="#ef4444" />
          </View>

          <Text style={styles.moduleTitle}>{control.moduleName} Under Maintenance</Text>
          <Text style={styles.maintenanceMsg}>
            {control.maintenanceMessage ||
              'This module is currently placed in ISO maintenance mode by the administrator for scheduled system verification.'}
          </Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#16a34a" style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>
              All user data and transactions remain 100% safe & encrypted. Full service will resume shortly.
            </Text>
          </View>

          <TouchableOpacity style={styles.retryButton} onPress={fetchStatus}>
            <Ionicons name="refresh" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Check Status Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  maintenanceContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  isoCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  badgeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  moduleTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  maintenanceMsg: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  infoText: {
    color: '#4ade80',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
