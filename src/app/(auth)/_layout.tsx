import { Stack } from 'expo-router';

// Land on sign-in when the app redirects into the auth group (e.g. after sign-out
// or when a signed-out user hits a protected route).
export const unstable_settings = {
  initialRouteName: 'sign-in',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
