import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy farm route redirect to the Crop Master Registry.
 */
export default function FarmRedirect() {
  return <Redirect href="/admin/(tabs)/super-crop-edit" />;
}
