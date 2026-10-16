import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy schedule route redirect to the Garden System Schedule.
 */
export default function ScheduleRedirect() {
  return <Redirect href="/admin/(tabs)/garden" />;
}
