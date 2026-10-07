import React, { useEffect } from 'react';
import { Link, Stack, useRouter } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import YouPage from './you/index';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('you') || path.includes('dose') || path.includes('my')) {
        router.replace('/you');
      }
    }
  }, []);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('you') || path.includes('dose') || path.includes('my')) {
      return <YouPage />;
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen doesn't exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
