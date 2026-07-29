import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { CreateTripSheet } from '@/components/create-trip-sheet';
import { TabScreen } from '@/components/tab-screen';
import { TripCard, formatDateRange } from '@/components/trip-card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { HeroBanner } from '@/components/ui/hero-banner';
import { useRespondTripInvite, useTripInvites, useTrips } from '@/lib/queries';

export default function TripsScreen() {
  const { data: trips, refetch, isRefetching } = useTrips();
  const { data: invites, refetch: refetchInvites } = useTripInvites();
  const respondInvite = useRespondTripInvite();
  const [createOpen, setCreateOpen] = useState(false);

  // Read the clock once per mount — calling Date.now() during render makes the
  // upcoming/past split unstable across re-renders.
  const [now] = useState(() => Date.now());
  const upcoming = (trips ?? []).filter((t) => new Date(t.endDate ?? t.startDate).getTime() >= now);
  const past = (trips ?? []).filter((t) => new Date(t.endDate ?? t.startDate).getTime() < now);

  const respond = async (id: string, accept: boolean) => {
    await respondInvite.mutateAsync({ id, accept });
    refetchInvites();
  };

  return (
    <TabScreen>
      <ScrollView
        contentContainerClassName="p-4 gap-6 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              refetchInvites();
            }}
          />
        }
        showsVerticalScrollIndicator={false}>
        <HeroBanner
          image={require('@/assets/images/headers/header2.jpg')}
          title="Trips"
          subtitle="Plan adventures, build packing lists, and coordinate your crew."
          compact>
          <Pressable
            accessibilityRole="button"
            onPress={() => setCreateOpen(true)}
            className="flex-row items-center gap-2 rounded-full bg-white px-6 py-3 active:opacity-80">
            <Plus size={16} color="#171717" />
            <Text className="text-sm font-sans-bold text-neutral-900">Plan a Trip</Text>
          </Pressable>
        </HeroBanner>

        {invites && invites.length > 0 ? (
          <View className="gap-3">
            <Text className="font-heading text-xl text-neutral-900 dark:text-neutral-100">
              Invites
            </Text>
            {invites.map((invite) => (
              <View
                key={invite.id}
                className="gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                <View className="flex-row items-center gap-3">
                  <Avatar user={invite.invitedBy} />
                  <View className="flex-1">
                    <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                      <Text className="font-sans-bold">{invite.invitedBy.fullName}</Text>
                      {' invited you to '}
                      <Text className="font-sans-bold">{invite.trip.name}</Text>
                    </Text>
                    <Text className="mt-0.5 text-xs text-neutral-500">
                      {invite.trip.location} · {formatDateRange(invite.trip.startDate, invite.trip.endDate)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => respond(invite.id, true)}
                    className="flex-1 items-center rounded-xl bg-emerald-600 py-2.5 active:opacity-80">
                    <Text className="text-sm font-sans-semibold text-white">Accept</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => respond(invite.id, false)}
                    className="flex-1 items-center rounded-xl border border-border bg-white py-2.5 active:opacity-70 dark:bg-neutral-900">
                    <Text className="text-sm font-sans-semibold text-neutral-600 dark:text-neutral-300">
                      Decline
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View className="gap-3">
          <Text className="font-heading text-xl text-neutral-900 dark:text-neutral-100">
            Upcoming
          </Text>
          {upcoming.length > 0 ? (
            <View className="gap-4">
              {upcoming.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </View>
          ) : (
            <EmptyState message="No upcoming trips." hint="Plan your next adventure →" />
          )}
        </View>

        {past.length > 0 ? (
          <View className="gap-3">
            <Text className="font-heading text-xl text-neutral-900 dark:text-neutral-100">Past</Text>
            <View className="gap-4 opacity-80">
              {past.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {createOpen ? <CreateTripSheet visible={createOpen} onClose={() => setCreateOpen(false)} /> : null}
    </TabScreen>
  );
}
