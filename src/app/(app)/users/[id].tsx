import { useLocalSearchParams, useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GearCard } from '@/components/gear-card';
import { ModerationSheet, type ModerationTarget } from '@/components/moderation-sheet';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useFriendGear, useFriends } from '@/lib/queries';

/* Friend closet — read-only gear grid (web: /dashboard/social/[userId]/closet). */
export default function FriendClosetScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { data: gear } = useFriendGear(id);
  const { data: friends } = useFriends();
  const [moderating, setModerating] = useState<ModerationTarget | null>(null);

  // Prefer the real record; fall back to the name passed in the route params.
  const user = friends?.find((friend) => friend.id === id) ?? {
    id,
    username: name ?? 'hiker',
    fullName: name ?? null,
    avatarUrl: null,
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader
        title={`${name ?? 'Friend'}'s Closet`}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Options for ${user.username}`}
            onPress={() => setModerating({ type: 'USER', user, targetId: user.id })}
            className="rounded-full p-2 active:opacity-60">
            <MoreVertical size={20} color="#737373" />
          </Pressable>
        }
      />
      <FlatList
        data={gear ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerClassName="gap-3 py-4 pb-10"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <GearCard item={item} />}
        ListEmptyComponent={
          <View className="px-4">
            <EmptyState message="This closet is empty." />
          </View>
        }
      />

      <ModerationSheet
        target={moderating}
        onClose={() => setModerating(null)}
        onBlocked={() => (router.canGoBack() ? router.back() : router.replace('/social'))}
      />
    </SafeAreaView>
  );
}
