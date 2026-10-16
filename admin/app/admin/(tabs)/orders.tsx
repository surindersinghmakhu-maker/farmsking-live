import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy orders route redirect to the consolidated Admin Orders Hub.
 */
export default function OrdersRedirect() {
  return <Redirect href="/admin/(tabs)/admin-orders" />;
}
