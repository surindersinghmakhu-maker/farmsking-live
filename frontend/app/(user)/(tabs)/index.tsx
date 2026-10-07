import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Redirect } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { useRole } from '@/src/store/role-context';
import { useAuth } from '@/src/store/auth-context';
import { useMyWallet } from '@/src/hooks/useWallet';
import * as AppStorage from '@/src/lib/storage';

import { FarmerDashboardView } from '@/components/dashboards/FarmerDashboardView';
import { AdvisorDashboardView } from '@/components/dashboards/AdvisorDashboardView';
import { GardenAdvisorDashboardView } from '@/components/dashboards/GardenAdvisorDashboardView';
import { GardenerDashboardView } from '@/components/dashboards/GardenerDashboardView';
import { PartnerDashboardView } from '@/components/dashboards/PartnerDashboardView';

import { OperatorDashboardView } from '@/components/dashboards/OperatorDashboardView';
import { LabourDashboardView } from '@/components/dashboards/LabourDashboardView';
import { AdminChatModal } from '@/src/components/AdminChatModal';
import { WelcomeBonusModal } from '@/src/components/WelcomeBonusModal';
import { TechnicalTrainerDashboardView } from '@/components/dashboards/TechnicalTrainerDashboardView';
import { PendingApprovalView } from '@/src/components/PendingApprovalView';

import { useExecutiveTheme } from '@/src/store/theme-context';

export default function HomeScreen() {
  const { role: currentRole } = useRole();
  const { user } = useAuth();
  const { colors } = useExecutiveTheme();
  const { data: wallet } = useMyWallet();
  const [showAdminChatModal, setShowAdminChatModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const theme = RoleThemes[currentRole] || RoleThemes.FARM_ADVISOR || RoleThemes.FARMER;

  useEffect(() => {
    if (!user?.id) return;

    const checkFirstTimeWelcome = async () => {
      // ONLY show welcome bonus popup if user registered via a referral link/code (user.referredById is present)!
      if (!user?.referredById) return;

      // 1. Check if user already claimed welcome bonus
      const hasClaimed = (wallet?.transactions ?? []).some(
        (t) => t.type === 'CREDIT' && t.reason?.toLowerCase().includes('welcome')
      );
      if (hasClaimed) return;

      // 2. Check if pop-up was already shown/dismissed once for this user
      const storageKey = `farmsking_welcome_popup_shown_${user.id}`;
      const alreadyShown = await AppStorage.getItemAsync(storageKey);

      if (!alreadyShown) {
        setShowWelcomeModal(true);
      }
    };

    checkFirstTimeWelcome();
  }, [user?.id, user?.referredById, wallet]);

  const handleCloseWelcomeModal = async () => {
    setShowWelcomeModal(false);
    if (user?.id) {
      await AppStorage.setItemAsync(`farmsking_welcome_popup_shown_${user.id}`, 'true');
    }
  };

  if (currentRole === 'CUSTOMER') {
    return <Redirect href="/(user)/(tabs)/shop" />;
  }

  const renderDashboardView = () => {
    const isStaffRole = ['ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(currentRole);
    if (isStaffRole && user && !(user as any).isApproved) {
      const roleNames: Record<string, string> = {
        'ADVISOR': 'Crop Advisor',
        'FARM_ADVISOR': 'Crop Doctor',
        'GARDEN_ADVISOR': 'Garden Advisor',
        'TECHNICAL_TRAINER': 'Technical Trainer'
      };
      return <PendingApprovalView roleName={roleNames[currentRole] || currentRole} />;
    }

    switch (currentRole) {
      case 'FARMER':
        return <FarmerDashboardView onOpenAdminChat={() => setShowAdminChatModal(true)} />;
      case 'ADVISOR':
      case 'FARM_ADVISOR':
        return <AdvisorDashboardView />;
      case 'GARDEN_ADVISOR':
        return <GardenAdvisorDashboardView />;
      case 'GARDENER':
        return <GardenerDashboardView />;
      case 'BUSINESS_PARTNER':
        return <PartnerDashboardView />;

      case 'OPERATOR':
        return <OperatorDashboardView />;
      case 'LABOUR':
        return <LabourDashboardView />;
      case 'TECHNICAL_TRAINER':
        return <TechnicalTrainerDashboardView />;
      default:
        return <FarmerDashboardView onOpenAdminChat={() => setShowAdminChatModal(true)} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} backgroundColor={colors.headerBg} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {renderDashboardView()}

        {/* 🎁 First-Time Welcome Bonus Pop-Up Modal (Shows ONCE immediately after sign-in / sign-up) */}
        <WelcomeBonusModal
          visible={showWelcomeModal}
          onClose={handleCloseWelcomeModal}
        />

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
