import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CalendarDays, MapPin, Mountain, Route, Users } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { DifficultyChip, TypeChip } from '@/components/ui/chips';
import { useTripWeather } from '@/lib/queries';
import type { Trip, TripWeatherDay } from '@/types';

export const weatherEmoji = (condition: string) =>
  condition.includes('Rain') || condition.includes('Drizzle')
    ? '🌧️'
    : condition.includes('Snow')
      ? '❄️'
      : condition.includes('Cloud') || condition.includes('Overcast')
        ? '☁️'
        : '☀️';

function WeatherBadge({ days }: { days: TripWeatherDay[] | undefined }) {
  if (!days || days.length === 0) return null;
  const first = days[0];
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-md border border-blue-100 bg-blue-50/50 px-2 py-1 dark:border-blue-900/30 dark:bg-blue-900/10">
      <Text className="text-xs">{weatherEmoji(first.condition)}</Text>
      <Text className="text-xs font-sans-medium text-neutral-600 dark:text-neutral-400">
        {Math.round(first.tempMin)}° – {Math.round(first.tempMax)}°C
      </Text>
      {first.precipProb > 20 ? (
        <Text className="text-xs font-sans-medium text-blue-600 dark:text-blue-400">
          {first.precipProb}%
        </Text>
      ) : null}
    </View>
  );
}

export function formatDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const isSingleDay = !end || start.toDateString() === end.toDateString();
  if (isSingleDay) return start.toLocaleDateString(undefined, { dateStyle: 'medium' });
  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end!.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function tripDays(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const isSingleDay = !end || start.toDateString() === end.toDateString();
  if (isSingleDay) return 1;
  const ms = end!.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000) + 1);
}

/* Port of the web TripCard: cover, date + weather, chips, stats footer. */
export function TripCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  const { data: weather } = useTripWeather(trip.id, Boolean(trip.location));
  const days = tripDays(trip.startDate, trip.endDate);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/trips/${trip.id}`)}
      className="overflow-hidden rounded-xl border border-neutral-200 bg-white active:opacity-90 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Cover: emerald→blue tint gradient, same as the web's placeholder */}
      <View className="h-32 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <LinearGradient
          colors={['rgba(16,185,129,0.15)', 'rgba(59,130,246,0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="absolute bottom-3 left-3 right-3 gap-1">
          <View className="self-start rounded-md bg-white/60 px-2 py-0.5 dark:bg-black/50">
            <Text className="font-heading text-lg text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
              {trip.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-1 self-start rounded-md bg-white/60 px-2 py-0.5 dark:bg-black/50">
            <MapPin size={12} color="#525252" />
            <Text className="text-xs text-neutral-600 dark:text-neutral-300">
              {trip.location || 'No Location'}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-4">
        <View className="mb-4 flex-row items-start justify-between">
          <View className="gap-1.5">
            <View className="flex-row items-center gap-1.5">
              <CalendarDays size={12} color="#737373" />
              <Text className="text-xs text-neutral-500">
                {formatDateRange(trip.startDate, trip.endDate)}
              </Text>
            </View>
            <WeatherBadge days={weather} />
          </View>
          <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
            <Text className="text-xs text-neutral-600 dark:text-neutral-300">
              {days} Day{days > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View className="mb-4 flex-row flex-wrap gap-2">
          <TypeChip type={trip.type} />
          <DifficultyChip difficulty={trip.difficulty} />
        </View>

        <View className="flex-row items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Route size={14} color="#737373" />
              <Text className="text-xs text-neutral-500">
                {trip.distance ? `${trip.distance}km` : '–'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Mountain size={14} color="#737373" />
              <Text className="text-xs text-neutral-500">
                {trip.elevationGain ? `${trip.elevationGain}m` : '–'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <Users size={14} color="#525252" />
            <Text className="text-xs font-sans-medium text-neutral-600 dark:text-neutral-400">
              {trip.participants.length}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
