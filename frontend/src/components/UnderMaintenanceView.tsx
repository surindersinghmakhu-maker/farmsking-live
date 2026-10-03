import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface UnderMaintenanceViewProps {
  moduleName: string;
}

export function UnderMaintenanceView({ moduleName }: UnderMaintenanceViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="construct-outline" size={64} color="#f59e0b" />
      </View>
      <Text style={styles.title}>{moduleName} is Under Maintenance</Text>
      <Text style={styles.description}>
        We are currently upgrading this section to serve you better. It will be back online shortly. Thank you for your patience!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope_700Bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});
