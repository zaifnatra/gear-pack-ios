import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  MapPin,
  MessageCircle,
  Mountain,
  Plus,
  Route,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddTripGearSheet } from '@/components/add-trip-gear-sheet';
import { formatDateRange, tripDays } from '@/components/trip-card';
import { Avatar } from '@/components/ui/avatar';
import { DifficultyChip, TypeChip } from '@/components/ui/chips';
import { EmptyState } from '@/components/ui/empty-state';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { WeatherWidget } from '@/components/weather-widget';
import {
  useDeleteTrip,
  useFriends,
  useMe,
  useRemoveTripGear,
  useTogglePacked,
  useTrip,
  useTripGear,
  useTripWeather,
} from '@/lib/queries';
import { apiFetch } from '@/lib/api';
import type { Conversation, PublicUser } from '@/types';

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-2xl border border-border bg-white py-3 dark:bg-neutral-900">
      {icon}
      <Text className="font-heading text-base text-foreground">{value}</Text>
      <Text className="text-[10px] font-sans-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </Text>
    </View>
  );
}

function InviteFriendsSheet({
  visible,
  onClose,
  tripId,
  participants,
}: {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  participants: PublicUser[];
}) {
  const { data: friends } = useFriends();
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const participantIds = new Set(participants.map((p) => p.id));
  const invitable = (friends ?? []).filter((f) => !participantIds.has(f.id));

  const invite = async (userId: string) => {
    await apiFetch(`/api/v1/trips/${tripId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    setInvited((prev) => new Set(prev).add(userId));
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Invite Friends">
      {invitable.length === 0 ? (
        <Text className="text-center text-neutral-500">All your friends are already on this trip.</Text>
      ) : (
        invitable.map((friend) => {
          const isInvited = invited.has(friend.id);
          return (
            <View key={friend.id} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Avatar user={friend} />
                <View>
                  <Text className="text-sm font-sans-medium text-foreground">{friend.fullName}</Text>
                  <Text className="text-xs text-neutral-500">@{friend.username}</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={isInvited}
                onPress={() => invite(friend.id)}
                className={`rounded-full px-4 py-2 active:opacity-70 ${
                  isInvited ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-emerald-600'
                }`}>
                <Text
                  className={`text-xs font-sans-semibold ${isInvited ? 'text-neutral-500' : 'text-white'}`}>
                  {isInvited ? 'Invited ✓' : 'Invite'}
                </Text>
              </Pressable>
            </View>
          );
        })
      )}
    </ModalSheet>
  );
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: me } = useMe();
  const { data: trip, refetch, isRefetching } = useTrip(id);
  const { data: weather } = useTripWeather(id);
  const { data: tripGear, refetch: refetchGear } = useTripGear(id);
  const togglePacked = useTogglePacked(id);
  const removeGear = useRemoveTripGear(id);
  const deleteTrip = useDeleteTrip();
  const [addGearOpen, setAddGearOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const isOrganizer = trip.organizerId === me?.id;
  const gearList = tripGear ?? [];
  const packedCount = gearList.filter((g) => g.isPacked).length;
  const progress = gearList.length > 0 ? packedCount / gearList.length : 0;
  const totalGrams = gearList.reduce((sum, g) => sum + g.gearItem.weightGrams, 0);

  const openTripChat = async () => {
    const conversation = await apiFetch<Conversation | null>(`/api/v1/trips/${trip.id}/conversation`);
    if (conversation) router.push(`/messages/${conversation.id}`);
  };

  const confirmDeleteTrip = () => {
    const remove = async () => {
      await deleteTrip.mutateAsync(trip.id);
      router.back();
    };
    if (Platform.OS === 'web') return void remove();
    Alert.alert('Delete trip', `Delete “${trip.name}” and its packing list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="pb-12"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              refetchGear();
            }}
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View className="h-64 justify-end overflow-hidden bg-neutral-900">
          <LinearGradient
            colors={['rgba(16,185,129,0.35)', 'rgba(59,130,246,0.35)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <SafeAreaView edges={['top']} className="absolute left-0 top-0">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              className="m-3 rounded-full bg-black/30 p-2 active:opacity-70">
              <ChevronLeft size={22} color="#ffffff" />
            </Pressable>
          </SafeAreaView>
          <View className="gap-2 p-5">
            <Text className="font-heading-black text-3xl text-white">{trip.name}</Text>
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color="#e5e5e5" />
                <Text className="text-sm text-neutral-200">{trip.location || 'No location'}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <CalendarDays size={13} color="#e5e5e5" />
                <Text className="text-sm text-neutral-200">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </Text>
              </View>
            </View>
            <View className="mt-1 flex-row gap-2">
              <TypeChip type={trip.type} />
              <DifficultyChip difficulty={trip.difficulty} />
            </View>
          </View>
        </View>

        <View className="gap-6 p-4">
          {/* Stats */}
          <View className="flex-row gap-3">
            <Stat icon={<Route size={16} color="#059669" />} label="Distance" value={trip.distance ? `${trip.distance}km` : '–'} />
            <Stat icon={<Mountain size={16} color="#059669" />} label="Elevation" value={trip.elevationGain ? `${trip.elevationGain}m` : '–'} />
            <Stat icon={<CalendarDays size={16} color="#059669" />} label="Days" value={String(tripDays(trip.startDate, trip.endDate))} />
            <Stat icon={<Users size={16} color="#059669" />} label="Crew" value={String(trip.participants.length)} />
          </View>

          {/* Actions */}
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={openTripChat}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 active:opacity-80">
              <MessageCircle size={16} color="#ffffff" />
              <Text className="text-sm font-sans-semibold text-white">Trip Chat</Text>
            </Pressable>
            {isOrganizer ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setInviteOpen(true)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-white py-3 active:opacity-70 dark:bg-neutral-900">
                <UserPlus size={16} color="#059669" />
                <Text className="text-sm font-sans-semibold text-foreground">Invite</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Weather */}
          {weather && weather.length > 0 ? (
            <View className="gap-3">
              <Text className="font-heading text-xl text-foreground">Weather</Text>
              <WeatherWidget days={weather} />
            </View>
          ) : null}

          {/* Packing list */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-heading text-xl text-foreground">Packing List</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAddGearOpen(true)}
                className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 active:opacity-70 dark:bg-neutral-800">
                <Plus size={14} color="#059669" />
                <Text className="text-xs font-sans-semibold text-foreground">Add Gear</Text>
              </Pressable>
            </View>

            {gearList.length > 0 ? (
              <>
                <View className="gap-1.5">
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-sans-medium text-neutral-500">
                      {packedCount} of {gearList.length} packed · {(totalGrams / 1000).toFixed(1)} kg
                    </Text>
                    <Text className="text-xs font-sans-semibold text-emerald-600">
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <View
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(progress * 100, 2)}%` }}
                    />
                  </View>
                </View>

                <View className="gap-2">
                  {gearList.map((entry) => (
                    <View
                      key={entry.id}
                      className="flex-row items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 dark:bg-neutral-900">
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: entry.isPacked }}
                        onPress={() => togglePacked.mutate({ id: entry.id, isPacked: !entry.isPacked })}
                        className={`h-6 w-6 items-center justify-center rounded-full border ${
                          entry.isPacked ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300 dark:border-neutral-600'
                        }`}>
                        {entry.isPacked ? <Check size={14} color="#ffffff" /> : null}
                      </Pressable>
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-sans-medium ${
                            entry.isPacked ? 'text-neutral-400 line-through' : 'text-foreground'
                          }`}
                          numberOfLines={1}>
                          {entry.gearItem.name}
                        </Text>
                        <Text className="text-xs text-neutral-500">
                          {entry.gearItem.weightGrams}g
                          {entry.isGroupGear ? '  ·  group gear' : ''}
                        </Text>
                      </View>
                      {entry.isGroupGear ? (
                        <View className="rounded-full bg-teal-50 px-2 py-0.5 dark:bg-teal-900/20">
                          <Text className="text-[10px] font-sans-semibold text-teal-700 dark:text-teal-400">
                            GROUP
                          </Text>
                        </View>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${entry.gearItem.name}`}
                        onPress={() => removeGear.mutate(entry.id)}
                        className="rounded-full p-1.5 active:opacity-60">
                        <X size={14} color="#a3a3a3" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <EmptyState message="Nothing on the packing list yet." hint="Add gear from your closet →" />
            )}
          </View>

          {/* Participants */}
          <View className="gap-3">
            <Text className="font-heading text-xl text-foreground">Crew</Text>
            <View className="gap-2">
              {trip.participants.map((participant) => (
                <View
                  key={participant.id}
                  className="flex-row items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5 dark:bg-neutral-900">
                  <View className="flex-row items-center gap-3">
                    <Avatar user={participant.user} />
                    <View>
                      <Text className="text-sm font-sans-medium text-foreground">
                        {participant.user.fullName || participant.user.username}
                      </Text>
                      <Text className="text-xs text-neutral-500">@{participant.user.username}</Text>
                    </View>
                  </View>
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      participant.role === 'ORGANIZER'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                        : participant.status === 'INVITED'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20'
                          : 'bg-neutral-100 dark:bg-neutral-800'
                    }`}>
                    <Text
                      className={`text-[10px] font-sans-semibold ${
                        participant.role === 'ORGANIZER'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : participant.status === 'INVITED'
                            ? 'text-yellow-800 dark:text-yellow-400'
                            : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                      {participant.role === 'ORGANIZER' ? 'ORGANIZER' : participant.status === 'INVITED' ? 'INVITED' : 'MEMBER'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* About */}
          {trip.description ? (
            <View className="gap-2">
              <Text className="font-heading text-xl text-foreground">About</Text>
              <Text className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {trip.description}
              </Text>
            </View>
          ) : null}

          {isOrganizer ? (
            <Pressable
              accessibilityRole="button"
              onPress={confirmDeleteTrip}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 py-3 active:opacity-70 dark:border-red-900/40">
              <Trash2 size={15} color="#dc2626" />
              <Text className="text-sm font-sans-semibold text-red-600">Delete Trip</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {addGearOpen ? (
        <AddTripGearSheet tripId={trip.id} visible={addGearOpen} onClose={() => setAddGearOpen(false)} />
      ) : null}
      {inviteOpen ? (
        <InviteFriendsSheet
          visible={inviteOpen}
          onClose={() => setInviteOpen(false)}
          tripId={trip.id}
          participants={trip.participants.map((p) => p.user)}
        />
      ) : null}
    </View>
  );
}
