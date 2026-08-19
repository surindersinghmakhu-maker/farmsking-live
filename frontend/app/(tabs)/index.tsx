import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { RoleThemes } from '@/constants/Colors';
import { useRole } from '@/src/store/role-context';

import { FarmerDashboardView } from '@/components/dashboards/FarmerDashboardView';
import { AdvisorDashboardView } from '@/components/dashboards/AdvisorDashboardView';
import { GardenAdvisorDashboardView } from '@/components/dashboards/GardenAdvisorDashboardView';
import { GardenerDashboardView } from '@/components/dashboards/GardenerDashboardView';
import { CustomerDashboardView } from '@/components/dashboards/CustomerDashboardView';
import { PartnerDashboardView } from '@/components/dashboards/PartnerDashboardView';
import { AdminDashboardView } from '@/components/dashboards/AdminDashboardView';
import { SuperAdminDashboardView } from '@/components/dashboards/SuperAdminDashboardView';
import { OperatorDashboardView } from '@/components/dashboards/OperatorDashboardView';

export default function HomeScreen() {
  const { role: currentRole } = useRole();

  const theme = RoleThemes[currentRole];

  const renderDashboardView = () => {
    switch (currentRole) {
      case 'FARMER':
        return <FarmerDashboardView />;
      case 'FARM_ADVISOR':
        return <AdvisorDashboardView />;
      case 'GARDEN_ADVISOR':
        return <GardenAdvisorDashboardView />;
      case 'GARDENER':
        return <GardenerDashboardView />;
      case 'CUSTOMER':
        return <CustomerDashboardView />;
      case 'BUSINESS_PARTNER':
        return <PartnerDashboardView />;
      case 'ADMIN':
        return <AdminDashboardView />;
      case 'SUPER_ADMIN':
        return <SuperAdminDashboardView />;
      case 'OPERATOR':
        return <OperatorDashboardView />;
      default:
        return <CustomerDashboardView />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#0f172a' }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <View style={styles.webOuterWrapper}>
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
          {renderDashboardView()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  webOuterWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090d16',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    overflow: 'hidden',
  },
});
