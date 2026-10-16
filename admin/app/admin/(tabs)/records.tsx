import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy records route redirect to the Global Balance Sheet & Ledgers.
 */
export default function RecordsRedirect() {
  return <Redirect href="/admin/(tabs)/super-accounts" />;
}
