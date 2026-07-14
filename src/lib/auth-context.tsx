import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiFetch } from '@/lib/api';
import { DEMO_MODE } from '@/lib/demo';

type AuthContextValue = {
  session: Session | null;
  /** True until the initial persisted session has been read from the Keychain. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/*
 * Provisions the Prisma user row after native sign-in (§5.4). The backend may
 * not be deployed yet during Phase 2, so a failure here is logged but not fatal
 * — the Supabase session is still valid and screens can render. Once /api/v1 is
 * live, a failed sync just means the next authed request 401s and recovers.
 */
async function syncAuthUser(): Promise<void> {
  try {
    await apiFetch('/api/v1/auth/sync', { method: 'POST' });
  } catch (error) {
    console.warn('[auth] auth/sync failed (backend may not be deployed yet):', error);
  }
}

// Demo mode never touches Supabase: any credentials sign in instantly with a
// stub session so the whole app runs frontend-only.
const DEMO_SESSION = {
  access_token: 'demo',
  refresh_token: 'demo',
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: 'u-me', email: 'alex@gearpack.app' },
} as unknown as Session;

function useDemoAuth(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  return useMemo(
    () => ({
      session,
      initializing: false,
      async signIn() {
        setSession(DEMO_SESSION);
      },
      async signUp() {
        setSession(DEMO_SESSION);
      },
      async signOut() {
        setSession(null);
      },
    }),
    [session],
  );
}

function useSupabaseAuth(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) return; // this hook still mounts in demo mode; do nothing
    let unsubscribe = () => {};
    // Dynamic import keeps Supabase (and its env requirements) out of demo mode.
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setInitializing(false);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });
    return () => unsubscribe();
  }, []);

  return useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      async signIn(email, password) {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await syncAuthUser();
      },
      async signUp(email, password, username) {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
        // If email confirmation is off, a session exists now; sync immediately.
        // If it's on, sync runs after the user confirms and signs in.
        const { data } = await supabase.auth.getSession();
        if (data.session) await syncAuthUser();
      },
      async signOut() {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [session, initializing],
  );
}

// Both branches call the same hooks in the same order; DEMO_MODE is a
// build-time constant so the conditional hook usage is stable.
function useAuthValue(): AuthContextValue {
  const demo = useDemoAuth();
  const real = useSupabaseAuth();
  return DEMO_MODE ? demo : real;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthValue();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
