import '@/global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
// SDK 54's expo-router (v6) doesn't re-export the navigation themes — they come
// straight from React Navigation. expo-router v7 re-exports them; if this
// project moves back to SDK 57, collapse this back into the expo-router import.
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/splash-overlay';
import { Providers } from '@/components/providers';
import { AuthProvider, useAuth } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, initializing } = useAuth();
  const { colorScheme } = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  const ready = !initializing && fontsLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Keep the native splash up until fonts + the persisted session are resolved,
  // so we never flash the auth screen at a returning, already-signed-in user.
  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/*
       * Drive the status bar from NativeWind's scheme, not style="auto" — that
       * follows the *system* appearance, which goes wrong the moment Settings
       * overrides the theme in-app (dark UI, dark clock and battery).
       */}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} animated />
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
