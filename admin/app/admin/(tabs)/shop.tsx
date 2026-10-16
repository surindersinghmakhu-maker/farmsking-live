import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy shop route redirect to the consolidated Admin Product Catalog.
 */
export default function ShopRedirect() {
  return <Redirect href="/admin/(tabs)/admin-products" />;
}
