import React from 'react';
import { Redirect } from 'expo-router';

/**
 * SuperOrders Screen - Consolidated into the primary Admin Orders Hub (/admin/(tabs)/admin-orders).
 * Seamlessly redirects all legacy routes to prevent duplicates.
 */
export default function SuperOrdersRedirect() {
  return <Redirect href="/admin/(tabs)/admin-orders" />;
}
