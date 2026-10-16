import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy referrals route redirect to the User Directory.
 */
export default function ReferralsRedirect() {
  return <Redirect href="/admin/(tabs)/super-users" />;
}
