import React from 'react';
import { Redirect } from 'expo-router';

// Re-export modals for backward compatibility if any external route references them
export { UserGuidesModal, SuperAdminWorkspaceModal, AdminInfoModal, AboutAppModal } from '@/components/AdminMoreModals';

/**
 * Legacy more route redirect to the consolidated 4D Executive Admin More Hub.
 */
export default function MoreRedirect() {
  return <Redirect href="/admin/(tabs)/admin_more" />;
}
