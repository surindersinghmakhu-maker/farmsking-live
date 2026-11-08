import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';

const PARTNER_ROLES = ['BUSINESS_PARTNER', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'];

export default function PartnerLayout() {
  const { user, isLoading } = useAuth();
  
  if (isLoading || !user) {
    return <View style={{ flex: 1, backgroundColor: '#070c18' }} />;
  }
  const userRoles = [user.role, ...(user.roles || [])];
  if (!userRoles.some(r => PARTNER_ROLES.includes(r as string))) {
    return <View style={{ flex: 1, backgroundColor: '#070c18' }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
