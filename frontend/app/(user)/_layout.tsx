import { Stack } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';

export default function UserLayout() {
  const { user, isLoading } = useAuth();
  
  if (isLoading || !user) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
