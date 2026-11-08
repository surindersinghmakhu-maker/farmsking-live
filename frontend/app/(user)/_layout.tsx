import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';

export default function UserLayout() {
  const { user, isLoading } = useAuth();
  
  if (isLoading || !user) {
    return <View style={{ flex: 1, backgroundColor: '#070c18' }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
