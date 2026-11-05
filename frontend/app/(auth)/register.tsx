import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

/**
 * Passwordless Architecture:
 * Registration is unified directly inside the Mobile + OTP portal at /(auth)/login.
 * New mobile users are automatically prompted with the 3-Role Onboarding Modal upon OTP verification.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    router.replace({ pathname: '/(auth)/login', params: params as any });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#090e17', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}
