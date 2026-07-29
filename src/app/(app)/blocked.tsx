import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useBlockedUsers, useUnblockUser } from '@/lib/queries';

/*
 * Blocked accounts (App Store guideline 1.2) — the management half of the
 * block action offered on profiles and messages.
 */
export default function BlockedAccountsScreen() {
  const { data: blocked } = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader title="Blocked Accounts" />
      <FlatList
        data={blocked ?? []}
        keyExtractor={(user) => user.id}
        contentContainerClassName="p-4 gap-2 pb-10"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          (blocked ?? []).length > 0 ? (
            <Text className="mb-2 text-sm leading-relaxed text-neutral-500">
              Blocked hikers can&apos;t message you, see your trips, or find you in search.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5 dark:bg-neutral-900">
            <View className="flex-1 flex-row items-center gap-3 pr-2">
              <Avatar user={item} />
              <View className="flex-1">
                <Text className="text-sm font-sans-medium text-foreground" numberOfLines={1}>
                  {item.fullName || item.username}
                </Text>
                <Text className="text-xs text-neutral-500" numberOfLines={1}>
                  @{item.username}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={unblock.isPending}
              onPress={() => unblock.mutate(item.id)}
              className="rounded-full bg-neutral-100 px-3 py-1.5 active:opacity-70 disabled:opacity-40 dark:bg-neutral-800">
              <Text className="text-xs font-sans-semibold text-foreground">Unblock</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            message="You haven't blocked anyone."
            hint="Block from a profile or a message"
          />
        }
      />
    </SafeAreaView>
  );
}
