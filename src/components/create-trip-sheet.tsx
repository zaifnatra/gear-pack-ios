import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { POPULAR_TRAILS, type TrailTemplate } from '@/constants/popular-trails';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { TextField } from '@/components/text-field';
import { useCreateTrip } from '@/lib/queries';
import type { Difficulty, TripType } from '@/types';

const TYPES: TripType[] = ['DAY_HIKE', 'OVERNIGHT', 'MULTI_DAY', 'THRU_HIKE', 'OTHER'];
const DIFFICULTIES: Difficulty[] = ['EASY', 'MODERATE', 'HARD', 'EXTREME'];

const isoDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 active:opacity-70 ${
        selected ? 'border-emerald-600 bg-emerald-600' : 'border-border bg-white dark:bg-neutral-900'
      }`}>
      <Text
        className={`text-xs font-sans-medium ${selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/* Create-trip sheet: popular-trail templates autofill the form (web parity). */
export function CreateTripSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const createTrip = useCreateTrip();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(isoDate(14));
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<TripType>('DAY_HIKE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MODERATE');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = (trail: TrailTemplate) => {
    setName(trail.name);
    setLocation(trail.location);
    setType(trail.type);
    setDifficulty(trail.difficulty);
    setDistance(String(trail.distance));
    setElevation(String(trail.elevationGain));
  };

  const submit = async () => {
    if (!name.trim()) return setError('Give the trip a name.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return setError('Start date must be YYYY-MM-DD.');
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return setError('End date must be YYYY-MM-DD.');
    setError(null);
    const trip = await createTrip.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim(),
      startDate: new Date(`${startDate}T09:00:00`).toISOString(),
      endDate: endDate ? new Date(`${endDate}T17:00:00`).toISOString() : null,
      type,
      difficulty,
      distance: distance ? Number(distance) : null,
      elevationGain: elevation ? Number(elevation) : null,
    });
    onClose();
    router.push(`/trips/${trip.id}`);
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Plan a Trip">
      <View className="gap-2">
        <Text className="text-sm font-sans-medium text-foreground">Start from a popular trail</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {POPULAR_TRAILS.map((trail) => (
            <Pressable
              key={trail.name}
              accessibilityRole="button"
              onPress={() => applyTemplate(trail)}
              className={`w-44 gap-1 rounded-2xl border p-3 active:opacity-70 ${
                name === trail.name
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/10'
                  : 'border-border bg-white dark:bg-neutral-900'
              }`}>
              <Text className="text-xs font-sans-semibold text-foreground" numberOfLines={2}>
                {trail.name}
              </Text>
              <Text className="text-[10px] text-neutral-500" numberOfLines={1}>
                {trail.location}
              </Text>
              <Text className="text-[10px] text-neutral-500">
                {trail.distance}km · {trail.elevationGain}m · {trail.difficulty}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <TextField label="Trip name" value={name} onChangeText={setName} placeholder="Franconia Ridge Loop" />
      <TextField label="Location" value={location} onChangeText={setLocation} placeholder="Lincoln, NH" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        </View>
        <View className="flex-1">
          <TextField label="End date (optional)" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-sans-medium text-foreground">Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {TYPES.map((t) => (
            <Chip key={t} label={t.replaceAll('_', ' ')} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-sans-medium text-foreground">Difficulty</Text>
        <View className="flex-row flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <Chip key={d} label={d} selected={difficulty === d} onPress={() => setDifficulty(d)} />
          ))}
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Distance (km)" value={distance} onChangeText={setDistance} placeholder="14.3" keyboardType="decimal-pad" />
        </View>
        <View className="flex-1">
          <TextField label="Elevation (m)" value={elevation} onChangeText={setElevation} placeholder="1160" keyboardType="number-pad" />
        </View>
      </View>

      <TextField label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Meet at the trailhead at 6am…" />

      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={createTrip.isPending}
        onPress={submit}
        className="items-center rounded-xl bg-emerald-600 py-3.5 active:opacity-80 disabled:opacity-50">
        {createTrip.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-base font-sans-semibold text-white">Create Trip</Text>
        )}
      </Pressable>
    </ModalSheet>
  );
}
