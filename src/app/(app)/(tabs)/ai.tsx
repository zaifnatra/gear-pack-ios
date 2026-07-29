import { Bot, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GearAnalysisCard, TrailCards } from '@/components/packbot-cards';
import { TabScreen } from '@/components/tab-screen';
import { useAiHistory, useMe, useSendAiMessage } from '@/lib/queries';
import type { ChatMessage } from '@/types';

function AssistantMessage({ message, onQuickAction }: { message: ChatMessage; onQuickAction: (value: string) => void }) {
  return (
    <View className="flex-row gap-2.5 pr-8">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
        <Bot size={16} color="#ffffff" />
      </View>
      <View className="flex-1 gap-3">
        <View className="self-start rounded-2xl rounded-tl-md bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
          <Text className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
            {message.content}
          </Text>
        </View>
        {message.structured?.type === 'trail_options' ? <TrailCards trails={message.structured.trails} /> : null}
        {message.structured?.type === 'gear_analysis' ? <GearAnalysisCard data={message.structured.data} /> : null}
        {message.quickActions && message.quickActions.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {message.quickActions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={() => onQuickAction(action.value)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 active:opacity-70 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                <Text className="text-xs font-sans-medium text-emerald-700 dark:text-emerald-400">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <View className="items-end pl-12">
      <View className="rounded-2xl rounded-tr-md bg-emerald-600 px-4 py-3">
        <Text className="text-sm leading-relaxed text-white">{message.content}</Text>
      </View>
    </View>
  );
}

export default function PackBotScreen() {
  const { data: me } = useMe();
  const { data: history } = useAiHistory();
  const sendMessage = useSendAiMessage();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const messages = history ?? [];

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, sendMessage.isPending]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    setInput('');
    sendMessage.mutate(trimmed);
  };

  // PackBot is paid-only; free users never see this tab's content (3.1.1 —
  // no upsell language, just a neutral empty state).
  if (me && !me.isPaid) {
    return (
      <TabScreen>
        <View className="flex-1 items-center justify-center gap-3 p-8">
          <Bot size={32} color="#a3a3a3" />
          <Text className="text-center text-neutral-500">
            PackBot isn&apos;t available on your account.
          </Text>
        </View>
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      {/*
       * No keyboardVerticalOffset: KeyboardAvoidingView measures its own frame
       * in window coordinates, so the padding it applies already accounts for
       * the tab bar below it. The old hardcoded 90 lifted the composer that far
       * above the keyboard. Worth re-checking on a device.
       */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center gap-2 border-b border-border px-4 py-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
            <Bot size={18} color="#ffffff" />
          </View>
          <View>
            <Text className="font-heading text-base text-foreground">PackBot</Text>
            <Text className="text-xs text-neutral-500">Your gear & trip assistant</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerClassName="p-4 gap-4 pb-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}>
          {messages.map((message) =>
            message.role === 'assistant' ? (
              <AssistantMessage key={message.id} message={message} onQuickAction={send} />
            ) : (
              <UserMessage key={message.id} message={message} />
            ),
          )}
          {sendMessage.isPending ? (
            <View className="flex-row items-center gap-2.5">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
                <Bot size={16} color="#ffffff" />
              </View>
              <View className="flex-row items-center gap-2 rounded-2xl rounded-tl-md bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
                <ActivityIndicator size="small" color="#059669" />
                <Text className="text-sm text-neutral-500">Thinking…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View className="flex-row items-center gap-2 border-t border-border px-4 py-3">
          <TextInput
            className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-sm text-foreground dark:bg-neutral-900"
            placeholder="Ask about trails, gear, packing…"
            placeholderTextColor="#a3a3a3"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!input.trim() || sendMessage.isPending}
            onPress={() => send(input)}
            className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600 active:opacity-80 disabled:opacity-40">
            <Send size={16} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </TabScreen>
  );
}
