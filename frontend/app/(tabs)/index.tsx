import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Redirect } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { useRole } from '@/src/store/role-context';

import { FarmerDashboardView } from '@/components/dashboards/FarmerDashboardView';
import { AdvisorDashboardView } from '@/components/dashboards/AdvisorDashboardView';
import { GardenAdvisorDashboardView } from '@/components/dashboards/GardenAdvisorDashboardView';
import { GardenerDashboardView } from '@/components/dashboards/GardenerDashboardView';
import { PartnerDashboardView } from '@/components/dashboards/PartnerDashboardView';
import { AdminDashboardView } from '@/components/dashboards/AdminDashboardView';
import { SuperAdminDashboardView } from '@/components/dashboards/SuperAdminDashboardView';
import { OperatorDashboardView } from '@/components/dashboards/OperatorDashboardView';
import { LabourDashboardView } from '@/components/dashboards/LabourDashboardView';
import { AdminChatModal } from '@/src/components/AdminChatModal';

export default function HomeScreen() {
  const { role: currentRole } = useRole();
  const [showAdminChatModal, setShowAdminChatModal] = useState(false);

  const theme = RoleThemes[currentRole];

  if (currentRole === 'CUSTOMER') {
    return <Redirect href="/(tabs)/shop" />;
  }

  const renderDashboardView = () => {
    switch (currentRole) {
      case 'FARMER':
        return <FarmerDashboardView onOpenAdminChat={() => setShowAdminChatModal(true)} />;
      case 'FARM_ADVISOR':
        return <AdvisorDashboardView />;
      case 'GARDEN_ADVISOR':
        return <GardenAdvisorDashboardView />;
      case 'GARDENER':
        return <GardenerDashboardView />;
      case 'BUSINESS_PARTNER':
        return <PartnerDashboardView />;
      case 'ADMIN':
        return <AdminDashboardView />;
      case 'SUPER_ADMIN':
        return <SuperAdminDashboardView />;
      case 'OPERATOR':
        return <OperatorDashboardView />;
      case 'LABOUR':
        return <LabourDashboardView />;
      default:
        return <FarmerDashboardView onOpenAdminChat={() => setShowAdminChatModal(true)} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {renderDashboardView()}

        {/* Admin Chat Modal for Farmers */}
        {currentRole === 'FARMER' ? (
          <AdminChatModal visible={showAdminChatModal} onClose={() => setShowAdminChatModal(false)} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
});
