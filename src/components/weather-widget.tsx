import { ScrollView, Text, View } from 'react-native';

import { weatherEmoji } from '@/components/trip-card';
import type { TripWeatherDay } from '@/types';

/* Trip-detail forecast strip (web WeatherWidget parity, adapted to a scroll row). */
export function WeatherWidget({ days }: { days: TripWeatherDay[] | undefined }) {
  if (!days || days.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {days.map((day) => (
        <View
          key={day.date}
          className="w-24 items-center gap-1 rounded-2xl border border-blue-100 bg-blue-50/50 px-3 py-3 dark:border-blue-900/30 dark:bg-blue-900/10">
          <Text className="text-xs font-sans-semibold text-neutral-500">
            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
          </Text>
          <Text className="text-2xl">{weatherEmoji(day.condition)}</Text>
          <Text className="text-xs font-sans-medium text-neutral-700 dark:text-neutral-300">
            {Math.round(day.tempMin)}° / {Math.round(day.tempMax)}°
          </Text>
          {day.precipProb > 20 ? (
            <Text className="text-[10px] font-sans-medium text-blue-600 dark:text-blue-400">
              💧 {day.precipProb}%
            </Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
