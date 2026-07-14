import { Stack } from 'expo-router';

/*
 * The authenticated area. Route protection lives in the root layout's
 * Stack.Protected guard. The tab bar lives in (tabs); everything reachable
 * from the header (messages, notifications, search, profile, settings, friend
 * closets) pushes on top of it, matching the web's AppHeader navigation.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
