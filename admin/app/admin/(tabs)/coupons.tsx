import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy coupons route redirect to the consolidated Super Admin Coupon Management Engine.
 */
export default function CouponsRedirect() {
  return <Redirect href="/admin/(tabs)/super-coupons" />;
}
