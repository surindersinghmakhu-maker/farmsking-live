import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy cart route redirect to the Admin Orders Hub.
 */
export default function CartRedirect() {
  return <Redirect href="/admin/(tabs)/admin-orders" />;
}
