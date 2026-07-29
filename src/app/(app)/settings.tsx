import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DEMO_MODE } from '@/lib/demo';

type ThemeChoice = 'system' | 'light' | 'dark';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-sans-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-neutral-900">
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeChoice>('system');

  const applyTheme = (choice: ThemeChoice) => {
    setTheme(choice);
    // Overrides the scheme app-wide (NativeWind class strategy, like next-themes).
    nativewindColorScheme.set(choice);
  };

  const confirmDeleteAccount = () => {
    const remove = async () => {
      await apiFetch('/api/v1/account', { method: 'DELETE' });
      await signOut();
    };
    if (Platform.OS === 'web') return void remove();
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, gear, and trips. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: remove },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerClassName="p-4 gap-6 pb-12" showsVerticalScrollIndicator={false}>
        <Section title="Appearance">
          <View className="flex-row gap-2 p-3">
            {(['system', 'light', 'dark'] as ThemeChoice[]).map((choice) => (
              <Pressable
                key={choice}
                accessibilityRole="button"
                onPress={() => applyTheme(choice)}
                className={`flex-1 items-center rounded-xl border py-2.5 active:opacity-70 ${
                  theme === choice
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-border'
                }`}>
                <Text
                  className={`text-sm font-sans-medium capitalize ${
                    theme === choice ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-300'
                  }`}>
                  {choice}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Safety">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/blocked')}
            className="flex-row items-center justify-between px-4 py-3.5 active:bg-neutral-50 dark:active:bg-neutral-800">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-sans-medium text-foreground">Blocked Accounts</Text>
              <Text className="mt-0.5 text-xs text-neutral-500">
                Review and unblock hikers you&apos;ve blocked.
              </Text>
            </View>
            <ChevronRight size={18} color="#737373" />
          </Pressable>
        </Section>

        <Section title="Account">
          <Pressable
            accessibilityRole="button"
            onPress={() => signOut()}
            className="border-b border-border px-4 py-3.5 active:bg-neutral-50 dark:active:bg-neutral-800">
            <Text className="text-sm font-sans-medium text-foreground">Sign Out</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={confirmDeleteAccount}
            className="px-4 py-3.5 active:bg-red-50 dark:active:bg-red-900/10">
            <Text className="text-sm font-sans-medium text-red-600">Delete Account</Text>
            <Text className="mt-0.5 text-xs text-neutral-500">
              Permanently removes your account and data.
            </Text>
          </Pressable>
        </Section>

        <Section title="About">
          <View className="border-b border-border px-4 py-3.5">
            <Text className="text-sm text-neutral-500">
              Version {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
          <View className="px-4 py-3.5">
            <Text className="text-sm text-neutral-500">
              {DEMO_MODE ? 'Demo mode — running on sample data, no backend.' : 'Connected to gear-pack.vercel.app'}
            </Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
