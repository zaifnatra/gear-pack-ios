# GearPack iOS — Next Steps

**Where things stand (2026-07-14):** The full Phase 3 frontend is built and runs entirely
on an in-memory **demo backend** — no Supabase, no deployed API required. Every screen from
the [plan](../gear-pack/docs/IOS_APP_PLAN.md) exists, is styled to match the web app, and was
verified end-to-end on Expo web. `tsc --noEmit` is clean. Committed as `phase 3 front end`.

---

## How it runs today

- **Demo mode is ON by default.** `src/lib/demo.ts` exports `DEMO_MODE = process.env.EXPO_PUBLIC_DEMO !== '0'`.
- In demo mode, `apiFetch` (`src/lib/api.ts`) routes every `/api/v1/*` call to the mock router
  (`src/mocks/router.ts`), which reads/mutates seeded fixtures in `src/mocks/db.ts`.
- **There is no sign-in wall.** The app launches already signed in as Alex Rivers (a stub session
  in `src/lib/auth-context.tsx`), so a demo opens straight on the Home tab.
  The auth screens still work and accept any credentials — reach them with Sign Out in Settings.
- Run it:
  ```bash
  npm install
  npm run web      # browser, http://localhost:8081
  npm start        # then scan the QR with the iPhone Camera app to open in Expo Go
  ```
- **The project runs on Expo SDK 54 on purpose.** Expo Go on the App Store stops at SDK 54, and
  SDK 55+ can only reach a device through a custom development build, which needs a paid Apple
  Developer account. Staying on 54 is what makes stock Expo Go work. See [AGENTS.md](AGENTS.md)
  for the API differences that came with it.
- `expo-dev-client` was removed along the way — it's only needed for custom dev builds, and with it
  installed `expo start` defaults away from Expo Go. Add it back with `npx expo install expo-dev-client`
  if you later go the dev-build route.

## What was verified

Web build only: launch (already signed in) → Home → trip detail (optimistic packed-toggle) → gear
closet → PackBot structured cards → send a DM + auto-reply → badge clearing → light/dark toggle.

Moderation was walked end to end on web: report a user from a DM header, report a message from a
long-press, block from both a chat and a friend's closet, and unblock from Settings.
After a block the friend count drops, their DM disappears, the group chat's last message
recalculates without them, the message badge falls, and they stop appearing in hiker search.

**Not yet verified:** the app has never run on a physical iPhone. The native tab bar uses
SF Symbols (`src/components/app-tabs.tsx`) which don't render on web — the web build uses the
lucide fallback (`app-tabs.web.tsx`). Confirm the native tabs on device first.

What *has* been checked for iOS without a device:
`npx expo export -p ios` bundles clean (7.59 MB Hermes, no native-only resolution errors) and
`npx expo-doctor` passes 18/18, both on SDK 54.
SDK 54's iOS deployment target is 15.1, so the one `.avif` category image is worth watching —
iOS only decodes AVIF from 16.0, and it will fall back to the category placeholder below that.

---

## Next steps, in priority order

### 1. Run on a real device (do this first)
- `npx expo start --go`, open in Expo Go on an iPhone, walk every tab.
- Confirm SF Symbols render in the tab bar, safe-area insets look right (notch + home
  indicator), and keyboard-avoidance works in the chat + forms.
- `keyboardVerticalOffset` was removed from `ai.tsx` and the chat rather than guessed at:
  KeyboardAvoidingView measures its own frame in window coordinates, so 0 is the correct
  baseline and the old hardcoded 90 lifted the composer that far above the keyboard.
  If the input still sits wrong on device, that's the knob to turn.
- Everything below in this section is already done, but only a device can confirm it:
  branded splash + app icon, status bar contrast in dark mode, interactive keyboard dismissal.

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
  Expo Go. `eas.json` and the EAS project are already configured; re-add `expo-dev-client` first.
- **Sign in with Apple is mandatory** for App Review (guideline 4.8) since Google is offered.

Note that the paid Apple Developer account this needs is the same thing that would unlock a
development build — and therefore SDK 55/56/57. If you enroll for native sign-in anyway, the
reason for staying on SDK 54 disappears.

### 4. App Store readiness (from the plan's §10 checklist)
- Account deletion (`DELETE /api/v1/account`) is wired in Settings and confirmed working —
  make sure the real backend actually deletes the Supabase auth user, not just the Prisma row.
- Report/Block is **built** (UGC guideline 1.2) — `src/components/moderation-sheet.tsx`, reachable
  from a DM's header menu, a long-press on someone else's message, and a friend's closet header.
  Blocking removes the friendship, deletes the DM, drops their messages from group chats, and hides
  them from search; Settings → Safety → Blocked Accounts lists and unblocks them.
  It calls `POST /api/v1/reports`, `POST|DELETE /api/v1/users/:id/block`, and `GET /api/v1/users/blocked`
  — confirm the real backend implements all four before leaving demo mode.
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
- **Launch presentation:** the app icon (`assets/images/app-icon.png`) and the splash mark
  (`src/components/splash-overlay.tsx`) are the same lucide mountain glyph on emerald.
  The native splash is a solid color only — white in light, `#0a0a0a` in dark — and the overlay
  paints that same background, so hiding the native splash under it is invisible.
  If you change one, change the other, and keep the app.json `expo-splash-screen` colors in sync.
  The icon is generated, not designed: swap in a real 1024×1024 asset when branding exists.

## Known rough edges
- Badge/list freshness depends on the deep-clone in the mock router (documented above).
- No pull-to-refresh on a few secondary screens (messages, notifications) — lists poll instead.
- `metro.config.js` adds `avif` to asset extensions for the ported category images; `.jfif`
  files were renamed to `.jpg` because Metro doesn't recognize that extension.
- Leftover Expo template assets (`expo-logo.png`, `logo-glow.png`, `react-logo*`, `tabIcons/`,
  `assets/expo.icon`) are now unreferenced. They don't ship — Metro only bundles what's
  imported — but they can be deleted.
- The app icon has no dark or tinted variant, so iOS 18 reuses the light one in those modes.
  `ios.icon` accepts `{ light, dark, tinted }` if that's worth doing later.
