import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy farmers route redirect to the Farmers Network Directory.
 */
export default function FarmersRedirect() {
  return <Redirect href="/admin/(tabs)/super-users?group=CLIENTS&filter=FARMER" />;
}
