import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextField } from '@/components/text-field';
import { Avatar } from '@/components/ui/avatar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useFriends, useGear, useMe, useTrips, useUpdateMe } from '@/lib/queries';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-border bg-white py-3 dark:bg-neutral-900">
      <Text className="font-heading text-xl text-foreground">{value}</Text>
      <Text className="text-[10px] font-sans-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: gear } = useGear();
  const { data: trips } = useTrips();
  const { data: friends } = useFriends();
  const updateMe = useUpdateMe();

  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) {
      setFullName(me.fullName ?? '');
      setLocation(me.location ?? '');
      setBio(me.bio ?? '');
    }
  }, [me]);

  const dirty =
    !!me &&
    (fullName !== (me.fullName ?? '') || location !== (me.location ?? '') || bio !== (me.bio ?? ''));

  const save = async () => {
    await updateMe.mutateAsync({ fullName, location, bio });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!me) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader
        title="Profile"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            className="mr-2 rounded-full p-2 active:opacity-60">
            <Settings size={20} color="#737373" />
          </Pressable>
        }
      />
      <ScrollView contentContainerClassName="p-4 gap-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="items-center gap-2">
          <Avatar user={me} size="xl" />
          <Text className="font-heading text-2xl text-foreground">{me.fullName}</Text>
          <Text className="text-sm text-neutral-500">
            @{me.username}
            {me.location ? ` · ${me.location}` : ''}
          </Text>
          {me.isPaid ? (
            <View className="rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-900/20">
              <Text className="text-xs font-sans-semibold text-emerald-700 dark:text-emerald-400">
                PackBot Member
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row gap-3">
          <Stat value={gear?.length ?? 0} label="Gear" />
          <Stat value={trips?.length ?? 0} label="Trips" />
          <Stat value={friends?.length ?? 0} label="Friends" />
        </View>

        <View className="gap-4">
          <Text className="font-heading text-xl text-foreground">Edit Profile</Text>
          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Alex Rivers" />
          <TextField label="Location" value={location} onChangeText={setLocation} placeholder="Boulder, CO" />
          <TextField label="Bio" value={bio} onChangeText={setBio} placeholder="Tell hikers about yourself…" />
          <Pressable
            accessibilityRole="button"
            disabled={!dirty || updateMe.isPending}
            onPress={save}
            className="items-center rounded-xl bg-emerald-600 py-3.5 active:opacity-80 disabled:opacity-40">
            {updateMe.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-sans-semibold text-white">
                {saved ? 'Saved ✓' : 'Save Changes'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
