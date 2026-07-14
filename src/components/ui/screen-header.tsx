import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

/* Back-button header for screens pushed above the tab bar. */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between border-b border-border bg-background px-2 py-3">
      <View className="flex-1 flex-row items-center gap-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="rounded-full p-2 active:opacity-60">
          <ChevronLeft size={24} color="#737373" />
        </Pressable>
        <Text className="flex-1 font-heading text-xl text-foreground" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}
