import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/shop');
  }, []);

  return null;
}
