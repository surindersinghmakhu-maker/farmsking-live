import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

/**
 * Passwordless Architecture:
 * Passwords are not used anywhere in the platform.
 * Users sign in exclusively via verified Mobile OTP.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/login');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#090e17', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}
