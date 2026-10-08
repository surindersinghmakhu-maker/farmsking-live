import { Stack } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'TECHNICAL_TRAINER', 'MARKET_MANAGER'];

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  
  if (isLoading || !user) return null;
  const userRoles = [user.role, ...(user.roles || [])];
  if (!userRoles.some(r => ADMIN_ROLES.includes(r as string))) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
