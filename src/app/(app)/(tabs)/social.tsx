import { useRouter } from 'expo-router';
import { Search, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

import { TabScreen } from '@/components/tab-screen';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { HeroBanner } from '@/components/ui/hero-banner';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import {
  useCancelFriendRequest,
  useFriendRequests,
  useFriends,
  useRespondFriendRequest,
  useSendFriendRequest,
  useSentRequests,
  useUserSearch,
} from '@/lib/queries';
import type { PublicUser } from '@/types';

function UserRow({ user, right }: { user: PublicUser; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5 dark:bg-neutral-900">
      <View className="flex-1 flex-row items-center gap-3 pr-2">
        <Avatar user={user} />
        <View className="flex-1">
          <Text className="text-sm font-sans-medium text-foreground" numberOfLines={1}>
            {user.fullName || user.username}
          </Text>
          <Text className="text-xs text-neutral-500" numberOfLines={1}>
            @{user.username}
            {user.location ? ` · ${user.location}` : ''}
          </Text>
        </View>
      </View>
      {right}
    </View>
  );
}

export default function SocialScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('friends');
  const [query, setQuery] = useState('');

  const { data: friends, refetch, isRefetching } = useFriends();
  const { data: requests } = useFriendRequests();
  const { data: sentRequests } = useSentRequests();
  const { data: searchResults, isFetching: isSearching } = useUserSearch(tab === 'search' ? query : '');
  const respondRequest = useRespondFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const sendRequest = useSendFriendRequest();

  const friendIds = new Set((friends ?? []).map((f) => f.id));
  const sentIds = new Set((sentRequests ?? []).map((r) => r.user.id));

  return (
    <TabScreen>
      <ScrollView
        contentContainerClassName="p-4 gap-5 pb-10"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <HeroBanner
          image={require('@/assets/images/headers/header3.jpg')}
          title="Social Hub"
          subtitle="Connect with other hikers, share gear lists, and coordinate group trips."
          compact
        />

        <UnderlineTabs
          tabs={[
            { key: 'friends', label: 'Friends', count: friends?.length },
            { key: 'requests', label: 'Requests', count: (requests?.length ?? 0) + (sentRequests?.length ?? 0) },
            { key: 'search', label: 'Find Hikers' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'friends' ? (
          <View className="gap-2">
            {(friends ?? []).map((friend) => (
              <UserRow
                key={friend.id}
                user={friend}
                right={
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/users/${friend.id}?name=${encodeURIComponent(friend.fullName ?? friend.username)}`)}
                    className="rounded-full bg-neutral-100 px-3 py-1.5 active:opacity-70 dark:bg-neutral-800">
                    <Text className="text-xs font-sans-semibold text-foreground">View Closet</Text>
                  </Pressable>
                }
              />
            ))}
            {(friends ?? []).length === 0 ? (
              <EmptyState message="No friends yet." hint="Find hikers to connect with →" />
            ) : null}
          </View>
        ) : null}

        {tab === 'requests' ? (
          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-xs font-sans-semibold uppercase tracking-wider text-neutral-500">
                Received
              </Text>
              {(requests ?? []).length > 0 ? (
                (requests ?? []).map((request) => (
                  <UserRow
                    key={request.id}
                    user={request.user}
                    right={
                      <View className="flex-row gap-2">
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => respondRequest.mutate({ id: request.id, accept: true })}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 active:opacity-80">
                          <Text className="text-xs font-sans-semibold text-white">Accept</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => respondRequest.mutate({ id: request.id, accept: false })}
                          className="rounded-full bg-neutral-100 px-3 py-1.5 active:opacity-70 dark:bg-neutral-800">
                          <Text className="text-xs font-sans-semibold text-neutral-600 dark:text-neutral-300">
                            Decline
                          </Text>
                        </Pressable>
                      </View>
                    }
                  />
                ))
              ) : (
                <Text className="text-sm text-neutral-500">No pending requests.</Text>
              )}
            </View>

            <View className="gap-2">
              <Text className="text-xs font-sans-semibold uppercase tracking-wider text-neutral-500">
                Sent
              </Text>
              {(sentRequests ?? []).length > 0 ? (
                (sentRequests ?? []).map((request) => (
                  <UserRow
                    key={request.id}
                    user={request.user}
                    right={
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => cancelRequest.mutate(request.id)}
                        className="rounded-full bg-neutral-100 px-3 py-1.5 active:opacity-70 dark:bg-neutral-800">
                        <Text className="text-xs font-sans-semibold text-neutral-600 dark:text-neutral-300">
                          Cancel
                        </Text>
                      </Pressable>
                    }
                  />
                ))
              ) : (
                <Text className="text-sm text-neutral-500">No sent requests.</Text>
              )}
            </View>
          </View>
        ) : null}

        {tab === 'search' ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2 rounded-xl border border-border bg-white px-3 dark:bg-neutral-900">
              <Search size={16} color="#737373" />
              <TextInput
                className="flex-1 py-3 text-sm text-foreground"
                placeholder="Search by name or username…"
                placeholderTextColor="#a3a3a3"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
              />
            </View>
            <View className="gap-2">
              {(searchResults ?? []).map((user) => {
                const isFriend = friendIds.has(user.id);
                const isSent = sentIds.has(user.id);
                return (
                  <UserRow
                    key={user.id}
                    user={user}
                    right={
                      isFriend ? (
                        <Text className="text-xs font-sans-semibold text-emerald-600">Friends ✓</Text>
                      ) : isSent ? (
                        <Text className="text-xs font-sans-semibold text-neutral-400">Requested</Text>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => sendRequest.mutate(user.id)}
                          className="flex-row items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 active:opacity-80">
                          <UserPlus size={12} color="#ffffff" />
                          <Text className="text-xs font-sans-semibold text-white">Add</Text>
                        </Pressable>
                      )
                    }
                  />
                );
              })}
              {query.trim().length > 0 && !isSearching && (searchResults ?? []).length === 0 ? (
                <Text className="text-center text-sm text-neutral-500">No hikers found for “{query}”.</Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </TabScreen>
  );
}
