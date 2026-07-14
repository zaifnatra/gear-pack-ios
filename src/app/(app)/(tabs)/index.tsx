import { useRouter } from 'expo-router';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { TabScreen } from '@/components/tab-screen';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { HeroBanner } from '@/components/ui/hero-banner';
import { useFriendTrips, useGear, useMe, useTrips } from '@/lib/queries';
import type { Trip } from '@/types';

function StatTile({ value, label, tone }: { value: number; label: string; tone: 'emerald' | 'teal' }) {
  const styles =
    tone === 'emerald'
      ? {
          box: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30',
          value: 'text-emerald-700 dark:text-emerald-400',
          label: 'text-emerald-600/80 dark:text-emerald-500/80',
        }
      : {
          box: 'bg-teal-50 border-teal-100 dark:bg-teal-900/10 dark:border-teal-900/30',
          value: 'text-teal-700 dark:text-teal-400',
          label: 'text-teal-600/80 dark:text-teal-500/80',
        };
  return (
    <View className={`flex-1 rounded-2xl border p-4 ${styles.box}`}>
      <Text className={`font-heading text-3xl ${styles.value}`}>{value}</Text>
      <Text className={`text-xs font-sans-semibold uppercase tracking-wider ${styles.label}`}>
        {label}
      </Text>
    </View>
  );
}

function ActivityCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/trips/${trip.id}`)}
      className="rounded-2xl border border-neutral-200 bg-white p-5 active:border-emerald-500/30 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-start gap-4">
        <Avatar user={trip.organizer} />
        <View className="flex-1">
          <Text className="text-sm text-neutral-900 dark:text-neutral-100">
            <Text className="font-sans-bold">{trip.organizer.fullName || trip.organizer.username}</Text>
            {' is organizing a trip'}
          </Text>
          <Text className="mt-1 font-heading text-lg text-neutral-900 dark:text-white">
            {trip.name}
          </Text>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1.5 rounded-md bg-neutral-50 px-2 py-1 dark:bg-neutral-800">
              <CalendarDays size={13} color="#737373" />
              <Text className="text-xs font-sans-medium text-neutral-500">
                {new Date(trip.startDate).toLocaleDateString()}
              </Text>
            </View>
            {trip.location ? (
              <View className="flex-row items-center gap-1.5">
                <MapPin size={13} color="#737373" />
                <Text className="text-xs font-sans-medium text-neutral-500" numberOfLines={1}>
                  {trip.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: trips, refetch: refetchTrips, isRefetching } = useTrips();
  const { data: gear, refetch: refetchGear } = useGear();
  const { data: friendTrips, refetch: refetchFriendTrips } = useFriendTrips();

  const refresh = () => {
    refetchTrips();
    refetchGear();
    refetchFriendTrips();
  };

  return (
    <TabScreen>
      <ScrollView
        contentContainerClassName="p-4 gap-6 pb-10"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}>
        <HeroBanner
          image={require('@/assets/images/headers/header1.jpg')}
          title="Welcome back to Basecamp."
          subtitle={`${me?.fullName?.split(' ')[0] ?? 'Hey'} — your gear is packed, your routes are planned. See what your friends are up to or start planning your next adventure.`}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/trips')}
            className="rounded-full bg-white px-6 py-3.5 active:opacity-80">
            <Text className="text-sm font-sans-bold text-neutral-900">Plan a Trip</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/gear')}
            className="rounded-full border border-white/10 bg-white/10 px-6 py-3.5 active:opacity-80">
            <Text className="text-sm font-sans-bold text-white">Manage Gear</Text>
          </Pressable>
        </HeroBanner>

        <View>
          <Text className="mb-3 font-heading text-xl text-neutral-900 dark:text-neutral-100">
            Quick Stats
          </Text>
          <View className="flex-row gap-4">
            <StatTile value={trips?.length ?? 0} label="Trips" tone="emerald" />
            <StatTile value={gear?.length ?? 0} label="Gear Items" tone="teal" />
          </View>
        </View>

        <View>
          <Text className="mb-3 font-heading text-xl text-neutral-900 dark:text-neutral-100">
            Friends&apos; Activity
          </Text>
          <View className="gap-4">
            {friendTrips && friendTrips.length > 0 ? (
              friendTrips.map((trip) => <ActivityCard key={trip.id} trip={trip} />)
            ) : (
              <EmptyState
                message="No recent activity from friends."
                hint="Find friends to follow →"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </TabScreen>
  );
}
