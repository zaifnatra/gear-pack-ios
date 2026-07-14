import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import type { PublicUser } from '@/types';

const SIZES = {
  sm: { box: 'h-8 w-8', text: 'text-xs' },
  md: { box: 'h-10 w-10', text: 'text-sm' },
  lg: { box: 'h-14 w-14', text: 'text-lg' },
  xl: { box: 'h-24 w-24', text: 'text-3xl' },
} as const;

/*
 * Avatar with the web app's initials fallback (first letter of full name or
 * username on a neutral circle). All demo users are initials-only, matching
 * the web's look for users without an uploaded photo.
 */
export function Avatar({
  user,
  size = 'md',
}: {
  user: Pick<PublicUser, 'username' | 'fullName' | 'avatarUrl'>;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  const initial = (user.fullName?.[0] || user.username?.[0] || '?').toUpperCase();

  return (
    <View
      className={`${s.box} items-center justify-center overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800`}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text className={`${s.text} font-sans-bold text-neutral-500 dark:text-neutral-400`}>
          {initial}
        </Text>
      )}
    </View>
  );
}
