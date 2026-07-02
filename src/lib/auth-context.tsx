import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await syncAuthUser();
      },
      async signUp(email, password, username) {
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
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
