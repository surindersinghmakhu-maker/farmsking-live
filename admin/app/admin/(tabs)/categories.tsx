import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy categories route redirect to the Market Product Catalog.
 */
export default function CategoriesRedirect() {
  return <Redirect href="/admin/(tabs)/admin-products" />;
}
