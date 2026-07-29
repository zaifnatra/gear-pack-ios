# Expo HAS CHANGED

This project is on **SDK 54**, not the latest SDK.
Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Why SDK 54 and not 57

Expo Go on the App Store stops at SDK 54 (version 54.0.2).
SDK 55, 56, and 57 exist on npm, but none of them can run in Expo Go — they need a custom development build, which requires a paid Apple Developer account to install on a device.
This project was deliberately moved back to 54 on 2026-07-28 so it runs in stock Expo Go on a physical iPhone.

Do not run `npx expo install --fix` expecting SDK 57, and do not "upgrade" the SDK without deciding how the app will get onto a device.
If a development build ever becomes an option, going back to 57 is mostly reverting the two API shims noted below.

## SDK 54 API differences to watch

- `DarkTheme` / `DefaultTheme` / `ThemeProvider` come from `@react-navigation/native`.
  expo-router v7 (SDK 57) re-exports them; v6 does not.
- Native tabs: `Label` and `Icon` are **named exports** of `expo-router/unstable-native-tabs`.
  In v7 they're `NativeTabs.Trigger.Label` / `.Icon`.
- `expo-image` and `expo-status-bar` have no config plugins in SDK 54 — don't list them in
  `app.json` plugins.
- `babel-preset-expo` must be an explicit devDependency.
- `package.json` pins `react-server-dom-webpack` via `overrides`: expo-router 6 allows a version
  that demands React ≥19.2.8, which conflicts with SDK 54's React 19.1.0. Removing the override
  breaks `npm install`.
