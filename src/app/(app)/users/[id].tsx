import { useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GearCard } from '@/components/gear-card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useFriendGear } from '@/lib/queries';

/* Friend closet — read-only gear grid (web: /dashboard/social/[userId]/closet). */
export default function FriendClosetScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { data: gear } = useFriendGear(id);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader title={`${name ?? 'Friend'}'s Closet`} />
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
    </SafeAreaView>
  );
}
