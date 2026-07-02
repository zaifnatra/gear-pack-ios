import { Text, View } from 'react-native';

/*
 * Placeholder for native Google / Apple sign-in. These are intentionally
 * disabled until Phase 0 is done:
 *   - Google: install @react-native-google-signin/google-signin, add an iOS
 *     OAuth client ID, then supabase.auth.signInWithIdToken({ provider: 'google', token }).
 *   - Apple: install expo-apple-authentication, configure the Service ID/key,
 *     then supabase.auth.signInWithIdToken({ provider: 'apple', token }).
 * Both require a custom dev build (they don't run in Expo Go). Sign in with
 * Apple is mandatory for App Review (guideline 4.8) since Google is offered.
 */
export function SocialAuthButtons() {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-sm text-muted">or</Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <View className="items-center rounded-xl border border-border border-dashed px-4 py-3">
        <Text className="text-sm text-muted">Google &amp; Apple sign-in — coming soon</Text>
      </View>
    </View>
  );
}
