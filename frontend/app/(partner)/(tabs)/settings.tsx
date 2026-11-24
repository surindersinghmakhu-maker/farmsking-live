import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { RoleHeader } from '@/components/dashboards/RoleHeader';
import { useAuth } from '@/src/store/auth-context';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { DoctorSettingsConsole } from '@/src/components/DoctorSettingsConsole';
import { DoctorMessengerModal } from '@/src/components/chat/DoctorMessengerModal';
import { GroupVoiceCallModal } from '@/src/components/chat/GroupVoiceCallModal';
import { useGroupVoiceCall } from '@/src/hooks/useGroupVoiceCall';

export default function DoctorSettingsScreen() {
  const { user } = useAuth();
  const { colors, isLight } = useExecutiveTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const voiceCallHook = useGroupVoiceCall();

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#f1f5f9' : (colors.bg || '#020d06') }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: isDesktop ? 32 : 110 }}
        showsVerticalScrollIndicator={false}
      >
        <RoleHeader
          currentRole="FARM_ADVISOR"
          profileName={user?.name || 'Doctor'}
          avatarUrl={user?.photoUrl || undefined}
          onMessengerPress={() => setIsMessengerOpen(true)}
        />

        <View style={styles.consoleWrapper}>
          <DoctorSettingsConsole advisorId={user?.id} />
        </View>
      </ScrollView>

      {/* Doctor Agronomy Messenger Dialogue Box */}
      <DoctorMessengerModal
        visible={isMessengerOpen}
        onClose={() => setIsMessengerOpen(false)}
        onOpenGroupCall={() => setShowVoiceCallModal(true)}
      />

      {/* Voice Broadcast Modal */}
      <GroupVoiceCallModal
        visible={showVoiceCallModal}
        onClose={() => setShowVoiceCallModal(false)}
        voiceCallHook={voiceCallHook}
        currentUserId={user?.id}
        isHostOrAdmin={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  consoleWrapper: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 8,
    marginTop: 8,
  },
});
