import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in the Supabase project values.',
  );
}

/*
 * SecureStore stores values in the iOS Keychain but warns/fails on values over
 * ~2048 bytes. A full Supabase session (access + refresh token + user JSON)
 * regularly exceeds that, so we chunk large values across multiple keys and keep
 * a small manifest (the chunk count) under the base key. This is the
 * dependency-free equivalent of Supabase's documented "LargeSecureStore".
 */
const CHUNK_SIZE = 2000;

const ChunkedSecureStore: SupportedStorage = {
  async getItem(key) {
    const head = await SecureStore.getItemAsync(key);
    if (head === null) return null;
    // A JSON-number head means the value was chunked; anything else is a plain value.
    const chunkCount = Number(head);
    if (!Number.isInteger(chunkCount) || chunkCount <= 0) return head;
    const parts: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) return null; // corrupt/partial write — treat as missing
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key, value) {
    if (value.length <= CHUNK_SIZE) {
      await this.removeItem(key);
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
    await this.removeItem(key);
    for (let i = 0; i < chunkCount; i++) {
      await SecureStore.setItemAsync(
        `${key}.${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
    await SecureStore.setItemAsync(key, String(chunkCount));
  },
  async removeItem(key) {
    const head = await SecureStore.getItemAsync(key);
    if (head !== null) {
      const chunkCount = Number(head);
      if (Number.isInteger(chunkCount) && chunkCount > 0) {
        for (let i = 0; i < chunkCount; i++) {
          await SecureStore.deleteItemAsync(`${key}.${i}`);
        }
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // SecureStore isn't available on web; fall back to the default (localStorage).
    storage: Platform.OS === 'web' ? undefined : ChunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection on native — auth happens via id-token exchange.
    detectSessionInUrl: false,
  },
});

/*
 * Supabase can only refresh tokens while the app is foregrounded. Tie its
 * auto-refresh timer to AppState so it pauses in the background and resumes on
 * return — the documented Supabase + Expo pattern. Native only.
 */
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
