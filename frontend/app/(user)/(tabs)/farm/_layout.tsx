import { Stack } from 'expo-router';

export default function FarmStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[farmId]/index" />
      <Stack.Screen name="[farmId]/plots/[plotId]/index" />
    </Stack>
  );
}
