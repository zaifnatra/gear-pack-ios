import { useRouter } from 'expo-router';
import { MapPin, Package, Search as SearchIcon, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { useGlobalSearch } from '@/lib/queries';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-sans-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </Text>
      <View className="gap-2">{children}</View>
    </View>
  );
}

function ResultRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 active:opacity-70 dark:bg-neutral-900">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-sans-medium text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-neutral-500" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/* Global search — the app's take on the web's SearchDialog (trips/gear/hikers). */
export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: results, isFetching } = useGlobalSearch(query);

  const isEmpty =
    query.trim().length > 0 &&
    !isFetching &&
    results &&
    results.trips.length === 0 &&
    results.gear.length === 0 &&
    results.users.length === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader title="Search" />
      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-white px-3 dark:bg-neutral-900">
          <SearchIcon size={16} color="#737373" />
          <TextInput
            className="flex-1 py-3 text-sm text-foreground"
            placeholder="Trips, gear, hikers…"
            placeholderTextColor="#a3a3a3"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView
        contentContainerClassName="p-4 gap-5 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {results && results.trips.length > 0 ? (
          <Section title="Trips">
            {results.trips.map((trip) => (
              <ResultRow
                key={trip.id}
                icon={<MapPin size={16} color="#059669" />}
                title={trip.name}
                subtitle={trip.location}
                onPress={() => router.push(`/trips/${trip.id}`)}
              />
            ))}
          </Section>
        ) : null}

        {results && results.gear.length > 0 ? (
          <Section title="Gear">
            {results.gear.map((item) => (
              <ResultRow
                key={item.id}
                icon={<Package size={16} color="#0d9488" />}
                title={item.name}
                subtitle={item.brand}
                onPress={() => router.push('/gear')}
              />
            ))}
          </Section>
        ) : null}

        {results && results.users.length > 0 ? (
          <Section title="Hikers">
            {results.users.map((user) => (
              <ResultRow
                key={user.id}
                icon={<User size={16} color="#2563eb" />}
                title={user.fullName || user.username}
                subtitle={`@${user.username}`}
                onPress={() => router.push(`/users/${user.id}?name=${encodeURIComponent(user.fullName ?? user.username)}`)}
              />
            ))}
          </Section>
        ) : null}

        {isEmpty ? (
          <Text className="mt-8 text-center text-sm text-neutral-500">
            No results for “{query}”.
          </Text>
        ) : null}
        {query.trim().length === 0 ? (
          <Text className="mt-8 text-center text-sm text-neutral-400">
            Search across your trips, closet, and the community.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
