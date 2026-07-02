import AppTabs from '@/components/app-tabs';

// The authenticated area. Route protection lives in the root layout's
// Stack.Protected guard; this layout just mounts the native tab bar.
export default function AppLayout() {
  return <AppTabs />;
}
