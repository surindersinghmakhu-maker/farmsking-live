import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/src/store/auth-context';

const PARTNER_ROLES = ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'SELLER'];

export default function PartnerLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <View style={{ flex: 1, backgroundColor: '#070c18' }} />;
  }
  const deactivated = Array.isArray((user as any).deactivatedRoles) ? (user as any).deactivatedRoles : [];
  const activeRoles = [user.role, ...(user.roles || [])].filter((r) => !deactivated.includes(r));
  if (!activeRoles.some((r) => PARTNER_ROLES.includes(r as string))) {
    return <Redirect href={'/(user)/(tabs)' as any} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
