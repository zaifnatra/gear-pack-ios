import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { ScreenHeader } from '@/components/ui/screen-header';
import {
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  useToggleReaction,
} from '@/lib/queries';
import type { Message } from '@/types';

const MY_ID = 'u-me';

function Bubble({
  message,
  isGroup,
  onLongPress,
}: {
  message: Message;
  isGroup: boolean;
  onLongPress: () => void;
}) {
  const isMine = message.sender.id === MY_ID;

  return (
    <View className={`flex-row ${isMine ? 'justify-end pl-12' : 'pr-12'} `}>
      {!isMine ? (
        <View className="mr-2 self-end">
          <Avatar user={message.sender} size="sm" />
        </View>
      ) : null}
      <View className={`max-w-full ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup ? (
          <Text className="mb-0.5 ml-1 text-[10px] font-sans-medium text-neutral-500">
            {message.sender.fullName || message.sender.username}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onLongPress={onLongPress}
          delayLongPress={250}
          className={`rounded-2xl px-4 py-2.5 ${
            isMine ? 'rounded-tr-md bg-emerald-600' : 'rounded-tl-md bg-neutral-100 dark:bg-neutral-800'
          }`}>
          <Text
            className={`text-sm leading-relaxed ${isMine ? 'text-white' : 'text-neutral-800 dark:text-neutral-200'}`}>
            {message.content}
          </Text>
        </Pressable>
        {message.reactions.length > 0 ? (
          <View className={`-mt-1.5 flex-row gap-1 ${isMine ? 'mr-2' : 'ml-2'}`}>
            <View className="flex-row items-center rounded-full border border-border bg-white px-1.5 py-0.5 dark:bg-neutral-900">
              {message.reactions.map((reaction, index) => (
                <Text key={`${reaction.userId}-${index}`} className="text-[11px]">
                  {reaction.emoji}
                </Text>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: conversations } = useConversations();
  const { data: messages } = useMessages(id);
  const sendMessage = useSendMessage(id);
  const markRead = useMarkConversationRead(id);
  const toggleReaction = useToggleReaction(id);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const conversation = conversations?.find((c) => c.id === id);
  const title = conversation
    ? conversation.isGroup
      ? (conversation.name ?? 'Group chat')
      : conversation.participants[0]?.fullName || conversation.participants[0]?.username || 'Chat'
    : 'Chat';

  // Entering the chat clears the unread badge (web parity).
  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages?.length]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
    setInput('');
    sendMessage.mutate(trimmed);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScreenHeader title={title} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ScrollView
          ref={scrollRef}
          contentContainerClassName="p-4 gap-3"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {(messages ?? []).map((message) => (
            <Bubble
              key={message.id}
              message={message}
              isGroup={conversation?.isGroup ?? false}
              onLongPress={() => toggleReaction.mutate({ messageId: message.id, emoji: '❤️' })}
            />
          ))}
        </ScrollView>

        <View className="flex-row items-center gap-2 border-t border-border px-4 py-3">
          <TextInput
            className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-sm text-foreground dark:bg-neutral-900"
            placeholder="Message…"
            placeholderTextColor="#a3a3a3"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!input.trim() || sendMessage.isPending}
            onPress={send}
            className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600 active:opacity-80 disabled:opacity-40">
            <Send size={16} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
