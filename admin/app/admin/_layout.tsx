import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'TECHNICAL_TRAINER', 'ACCOUNTANT'];

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!user) return <Redirect href={'/(auth)/login' as any} />;

  const deactivated = Array.isArray((user as any).deactivatedRoles) ? (user as any).deactivatedRoles : [];
  const activeRoles = [user.role, ...(user.roles || [])].filter((r) => !deactivated.includes(r));
  if (!activeRoles.some((r) => ADMIN_ROLES.includes(r as string))) {
    return <Redirect href={'/(auth)/login' as any} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
