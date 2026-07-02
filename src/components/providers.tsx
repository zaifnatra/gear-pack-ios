import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { queryClient } from '@/lib/query-client';

/*
 * TanStack Query has no browser "window focus" on native, so we bridge AppState
 * into its focusManager: queries with refetchOnWindowFocus behave like the web
 * and refresh when the app returns to the foreground.
 */
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
