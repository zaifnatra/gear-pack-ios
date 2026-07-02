import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Providers } from '@/components/providers';
import { AuthProvider, useAuth } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, initializing } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync();
  }, [initializing]);

  // Keep the native splash up until the persisted session is resolved, so we
  // never flash the auth screen at a returning, already-signed-in user.
  if (initializing) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </Providers>
  );
}
