import { Link, useRouter } from 'expo-router';
import { Bell, MessageCircle, Search } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { useMe, useUnreadMessages, useUnreadNotifications } from '@/lib/queries';

function IconButton({
  onPress,
  label,
  children,
  badge,
}: {
  onPress: () => void;
  label: string;
  children: ReactNode;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="rounded-full p-2 active:bg-neutral-100 dark:active:bg-neutral-800">
      {children}
      {badge && badge > 0 ? (
        <View className="absolute right-0.5 top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1">
          <Text className="text-[10px] font-sans-bold text-white">{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/*
 * Port of the web AppHeader: brand on the left; search, notifications (badge),
 * messages (badge), and profile avatar on the right. Badges poll every 10s via
 * the query hooks — same cadence as the web dashboard.
 */
export function AppHeader() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#a3a3a3' : '#737373';
  const { data: me } = useMe();
  const { data: unreadNotifications } = useUnreadNotifications();
  const { data: unreadMessages } = useUnreadMessages();

  return (
    <View className="flex-row items-center justify-between border-b border-border/50 bg-background px-4 py-2">
      <Link href="/" asChild>
        <Pressable accessibilityRole="link">
          <Text className="font-heading-black text-xl tracking-tight text-emerald-900 dark:text-emerald-400">
            GearPack
          </Text>
        </Pressable>
      </Link>

      <View className="flex-row items-center gap-1">
        <IconButton label="Search" onPress={() => router.push('/search')}>
          <Search size={20} color={iconColor} />
        </IconButton>
        <IconButton
          label="Notifications"
          onPress={() => router.push('/notifications')}
          badge={unreadNotifications?.count}>
          <Bell size={20} color={iconColor} />
        </IconButton>
        <IconButton
          label="Messages"
          onPress={() => router.push('/messages')}
          badge={unreadMessages?.count}>
          <MessageCircle size={20} color={iconColor} />
        </IconButton>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => router.push('/profile')}
          className="ml-1 active:opacity-70">
          {me ? (
            <Avatar user={me} size="sm" />
          ) : (
            <View className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
