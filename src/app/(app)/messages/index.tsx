import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { timeAgo } from '@/lib/format';
import { useConversations } from '@/lib/queries';
import type { Conversation } from '@/types';

function conversationTitle(conversation: Conversation) {
  if (conversation.isGroup) return conversation.name ?? 'Group chat';
  const friend = conversation.participants[0];
  return friend?.fullName || friend?.username || 'Conversation';
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const friend = conversation.participants[0];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/messages/${conversation.id}`)}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-neutral-50 dark:active:bg-neutral-900">
      {conversation.isGroup ? (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
          <Users size={18} color="#059669" />
        </View>
      ) : (
        <Avatar user={friend} />
      )}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-sm ${conversation.unreadCount > 0 ? 'font-sans-bold text-foreground' : 'font-sans-medium text-foreground'}`}
            numberOfLines={1}>
            {conversationTitle(conversation)}
          </Text>
          {conversation.lastMessage ? (
            <Text className="text-xs text-neutral-400">{timeAgo(conversation.lastMessage.createdAt)}</Text>
          ) : null}
        </View>
        <View className="mt-0.5 flex-row items-center justify-between gap-2">
          <Text
            className={`flex-1 text-xs ${conversation.unreadCount > 0 ? 'font-sans-medium text-neutral-700 dark:text-neutral-300' : 'text-neutral-500'}`}
            numberOfLines={1}>
            {conversation.lastMessage
              ? `${conversation.lastMessage.sender.id === 'u-me' ? 'You: ' : ''}${conversation.lastMessage.content}`
              : 'No messages yet'}
          </Text>
          {conversation.unreadCount > 0 ? (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5">
              <Text className="text-[10px] font-sans-bold text-white">{conversation.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { data: conversations } = useConversations();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader title="Messages" />
      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationRow conversation={item} />}
        ItemSeparatorComponent={() => <View className="ml-16 h-px bg-border/60" />}
        ListEmptyComponent={
          <View className="p-4">
            <EmptyState message="No conversations yet." hint="Say hi to a friend →" />
          </View>
        }
      />
    </SafeAreaView>
  );
}
