/*
 * Frontend-only demo mode. When enabled (the default), apiFetch routes every
 * request to the in-memory mock backend in src/mocks and auth never touches
 * Supabase — the whole app runs visually with zero backend dependencies.
 *
 * Set EXPO_PUBLIC_DEMO=0 in .env to run against the real deployed /api/v1
 * backend + Supabase auth instead.
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO !== '0';
