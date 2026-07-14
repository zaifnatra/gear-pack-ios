import Constants from 'expo-constants';

import { ApiError } from '@/lib/api-error';
import { DEMO_MODE } from '@/lib/demo';

export { ApiError };

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/*
 * Single fetch wrapper for the /api/v1 backend. In demo mode every request is
 * served by the in-memory mock router (src/mocks) — no network, no Supabase.
 *
 * Against the real backend it attaches the Supabase bearer token and the
 * X-App-Version header (§5.9), and on a 401 refreshes the session once and
 * retries — if that still fails, it signs the user out so the UI falls back
 * to the auth stack. Unwraps the backend's { success, data | error } contract,
 * throwing ApiError on failure.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (DEMO_MODE) {
    const { handleMockRequest } = await import('@/mocks/router');
    return handleMockRequest<T>(path, options);
  }

  if (!API_URL) {
    throw new Error('Missing EXPO_PUBLIC_API_URL. Set it in .env (see .env.example).');
  }

  // Lazy so demo mode never initializes the Supabase client (or needs its env).
  const { supabase } = await import('@/lib/supabase');

  const send = async (token: string | null) => {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    headers.set('X-App-Version', APP_VERSION);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  const { data: sessionData } = await supabase.auth.getSession();
  let response = await send(sessionData.session?.access_token ?? null);

  if (response.status === 401) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      await supabase.auth.signOut();
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }
    response = await send(data.session.access_token);
    if (response.status === 401) {
      await supabase.auth.signOut();
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in body && String(body.error)) ||
      `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  // Backend responses use { success, data | error }; unwrap to the payload.
  if (body && typeof body === 'object' && 'success' in body) {
    if (!body.success) {
      throw new ApiError(response.status, String(body.error ?? 'Request failed'));
    }
    return body.data as T;
  }
  return body as T;
}
