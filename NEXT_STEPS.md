# GearPack iOS — Next Steps

**Where things stand (2026-07-14):** The full Phase 3 frontend is built and runs entirely
on an in-memory **demo backend** — no Supabase, no deployed API required. Every screen from
the [plan](../gear-pack/docs/IOS_APP_PLAN.md) exists, is styled to match the web app, and was
verified end-to-end on Expo web. `tsc --noEmit` is clean. Committed as `phase 3 front end`.

---

## How it runs today

- **Demo mode is ON by default.** `src/lib/demo.ts` exports `DEMO_MODE = process.env.EXPO_PUBLIC_DEMO !== '0'`.
- In demo mode, `apiFetch` (`src/lib/api.ts`) routes every `/api/v1/*` call to the mock router
  (`src/mocks/router.ts`), which reads/mutates seeded fixtures in `src/mocks/db.ts`. Auth accepts
  **any** email + password and holds an in-memory session (resets on reload).
- Run it:
  ```bash
  npm install
  npm run web      # browser, http://localhost:8081
  npm start        # then scan the QR in Expo Go for a real device
  ```

## What was verified

Web build only: sign-in → Home → trip detail (optimistic packed-toggle) → gear closet →
PackBot structured cards → send a DM + auto-reply → badge clearing → light/dark toggle.

**Not yet verified:** the app has never run on a physical iPhone. The native tab bar uses
SF Symbols (`src/components/app-tabs.tsx`) which don't render on web — the web build uses the
lucide fallback (`app-tabs.web.tsx`). Confirm the native tabs on device first.

---

## Next steps, in priority order

### 1. Run on a real device (do this first)
- `npm start`, open in Expo Go on an iPhone, walk every tab.
- Confirm SF Symbols render in the tab bar, safe-area insets look right (notch + home
  indicator), and keyboard-avoidance works in the chat + forms.
- Known gap: `ai.tsx`, `[id].tsx` chat, and forms use `KeyboardAvoidingView` with estimated
  offsets — tune `keyboardVerticalOffset` on device if the input hides behind the keyboard.

### 2. Wire the real backend (when ready to leave demo mode)
The backend is already live at `gear-pack.vercel.app`. To switch:
- Set `EXPO_PUBLIC_DEMO=0` and real `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` in `.env`.
- **Migrate email/password auth** to the endpoints the web team shipped for native clients
  (not in the plan's original endpoint map, but they exist and are built for this):
  - `POST /api/v1/auth/login` — accepts **username or email** (the current app is email-only;
    web users who log in by username can't sign in until this is wired). Returns Supabase
    session tokens → call `supabase.auth.setSession(tokens)` to persist.
  - `POST /api/v1/auth/register` — pre-checks username/email uniqueness and creates the Prisma
    row up front (the plan required a username availability check on sign-up; the current
    direct-Supabase path skips it).
  - `POST /api/v1/auth/reset-password` — add a "Forgot password?" link on the sign-in screen
    (currently missing entirely).
  - Native Google/Apple keep going direct to Supabase + `POST /api/v1/auth/sync` as planned.
- **Verify response shapes match `src/types.ts`.** The mock router returns exactly what these
  types describe; if the real API differs, adjust the types + `src/lib/queries.ts`, not the
  screens. Watch specifically: trip `_count.gearList`, `Conversation.participants` (excludes
  self), and the PackBot structured payload (`trail_options` / `gear_analysis`).
- Image uploads are **stubbed** — gear/trip/avatar "add photo" isn't built. Wire
  `expo-image-picker` → Supabase Storage (same bucket/path as the web's `ImageUpload.tsx`),
  then save the URL via the API. Today all gear falls back to category default images.

### 3. Phase 0 prerequisites for native sign-in + builds
Native Google/Apple buttons are a disabled placeholder (`src/components/social-auth-buttons.tsx`).
To enable them you need:
- Apple Developer enrollment; Apple **Service ID** + key; enable Apple provider in Supabase.
- iOS **OAuth client ID** in Google Cloud Console.
- `npm i @react-native-google-signin/google-signin expo-apple-authentication`.
- A **custom dev build** (`eas build --profile development`) — these libraries don't run in
  Expo Go. `eas.json` and the EAS project are already configured.
- **Sign in with Apple is mandatory** for App Review (guideline 4.8) since Google is offered.

### 4. App Store readiness (from the plan's §10 checklist)
- Account deletion (`DELETE /api/v1/account`) is wired in Settings and confirmed working —
  make sure the real backend actually deletes the Supabase auth user, not just the Prisma row.
- Report/Block UI is **not built yet** (UGC guideline 1.2) — add long-press → Report/Block on
  messages and profiles; the endpoints (`POST /api/v1/reports`, `/users/:id/block`) exist.
- Audit all strings for upgrade/purchase language (guideline 3.1.1). PackBot is already hidden
  for non-paid users (`me.isPaid` gate in `ai.tsx`), which is the main risk area.
- Seed a demo account (`isPaid = true`) for the App Review notes.

---

## Architecture notes for whoever picks this up

- **Adding a screen:** put it under `src/app/(app)/(tabs)/` for a tab, or `src/app/(app)/` for
  a header/pushed route. Data goes through a hook in `src/lib/queries.ts` (TanStack Query) that
  calls `apiFetch` — never call `fetch` directly, so demo mode keeps working.
- **Adding a mock endpoint:** add a branch in `src/mocks/router.ts` and, if needed, a fixture in
  `src/mocks/db.ts`. The router deep-clones every response (mutating shared references breaks
  React Query change detection — don't remove that).
- **Theming:** tailwind `darkMode: 'class'` + `.dark:root` CSS vars in `src/global.css`. Toggle
  via nativewind's `colorScheme.set` (see `settings.tsx`). Do **not** switch to `darkMode: 'media'`
  — it crashes react-native-css-interop's web runtime.
- **Design tokens** mirror the web's `globals.css`; accent is emerald/teal, base is neutral,
  headings are Outfit, body is Inter. Keep new UI consistent with `src/components/ui/*`.

## Known rough edges
- Badge/list freshness depends on the deep-clone in the mock router (documented above).
- No pull-to-refresh on a few secondary screens (messages, notifications) — lists poll instead.
- `metro.config.js` adds `avif` to asset extensions for the ported category images; `.jfif`
  files were renamed to `.jpg` because Metro doesn't recognize that extension.
