import { Info, Map, UserPlus } from 'lucide-react-native';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { timeAgo } from '@/lib/format';
import { useMarkAllNotificationsRead, useNotifications } from '@/lib/queries';
import type { Notification } from '@/types';

const TYPE_ICON = {
  FRIEND_REQUEST: { Icon: UserPlus, color: '#059669' },
  TRIP_INVITE: { Icon: Map, color: '#2563eb' },
  SYSTEM: { Icon: Info, color: '#737373' },
} as const;

function NotificationRow({ notification }: { notification: Notification }) {
  const meta = TYPE_ICON[notification.type] ?? TYPE_ICON.SYSTEM;
  return (
    <View
      className={`flex-row items-start gap-3 px-4 py-3.5 ${
        notification.read ? '' : 'bg-emerald-50/50 dark:bg-emerald-900/10'
      }`}>
      <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <meta.Icon size={16} color={meta.color} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className={`flex-1 text-sm ${notification.read ? 'font-sans-medium' : 'font-sans-bold'} text-foreground`}
            numberOfLines={1}>
            {notification.title}
          </Text>
          <Text className="text-xs text-neutral-400">{timeAgo(notification.createdAt)}</Text>
        </View>
        <Text className="mt-0.5 text-xs leading-relaxed text-neutral-500">{notification.body}</Text>
      </View>
      {!notification.read ? <View className="mt-2 h-2 w-2 rounded-full bg-emerald-500" /> : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const hasUnread = (notifications ?? []).some((n) => !n.read);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader
        title="Notifications"
        right={
          hasUnread ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => markAllRead.mutate()}
              className="mr-2 rounded-full bg-neutral-100 px-3 py-1.5 active:opacity-70 dark:bg-neutral-800">
              <Text className="text-xs font-sans-semibold text-foreground">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRow notification={item} />}
        ItemSeparatorComponent={() => <View className="ml-16 h-px bg-border/60" />}
        ListEmptyComponent={
          <View className="p-4">
            <EmptyState message="You're all caught up." />
          </View>
        }
      />
    </SafeAreaView>
  );
}
