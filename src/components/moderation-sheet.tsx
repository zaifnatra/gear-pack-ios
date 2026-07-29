import { Ban, Check, Flag, ShieldAlert } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { ModalSheet } from '@/components/ui/modal-sheet';
import { useBlockUser, useReportContent } from '@/lib/queries';
import type { PublicUser, ReportReason, ReportTargetType } from '@/types';

/*
 * Report + block flow (App Store guideline 1.2 — every app with user-generated
 * content needs both, reachable from the content itself). Mounted by the chat
 * screen (long-press a message) and by user profiles.
 *
 * Confirmation lives inside the sheet rather than in Alert.alert: RN Web has no
 * Alert implementation, so an Alert-based confirm silently does nothing in the
 * browser demo.
 */

export interface ModerationTarget {
  type: ReportTargetType;
  user: PublicUser;
  /** Reported id — the message id for MESSAGE targets, else the user id. */
  targetId: string;
  /** Message text, echoed back so it's clear what is being reported. */
  preview?: string;
}

export interface ModerationAction {
  label: string;
  icon: ReactNode;
  onPress: () => void;
}

const REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'SPAM', label: 'Spam or scam', hint: 'Unwanted promotion, links, or fake offers' },
  { value: 'HARASSMENT', label: 'Harassment or bullying', hint: 'Threats, hate speech, or targeted abuse' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content', hint: 'Sexual, violent, or graphic material' },
  { value: 'IMPERSONATION', label: 'Impersonation', hint: 'Pretending to be someone else' },
  { value: 'OTHER', label: 'Something else', hint: 'Tell us what happened below' },
];

type Step = 'menu' | 'report' | 'confirm-block' | 'reported' | 'blocked';

function ActionRow({
  icon,
  label,
  hint,
  destructive,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 active:opacity-70 dark:bg-neutral-900">
      {icon}
      <View className="flex-1">
        <Text
          className={`text-sm font-sans-semibold ${destructive ? 'text-red-600' : 'text-foreground'}`}>
          {label}
        </Text>
        {hint ? <Text className="mt-0.5 text-xs text-neutral-500">{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

function DoneState({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <View className="items-center gap-3 py-2">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
        <Check size={22} color="#059669" />
      </View>
      <Text className="font-heading text-lg text-foreground">{title}</Text>
      <Text className="text-center text-sm leading-relaxed text-neutral-500">{body}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        className="mt-2 w-full items-center rounded-xl bg-emerald-600 py-3 active:opacity-80">
        <Text className="text-sm font-sans-semibold text-white">Done</Text>
      </Pressable>
    </View>
  );
}

export function ModerationSheet({
  target,
  onClose,
  actions,
  onBlocked,
}: {
  target: ModerationTarget | null;
  onClose: () => void;
  /** Context actions shown above Report/Block (e.g. react to a message). */
  actions?: (target: ModerationTarget) => ModerationAction[];
  /** Called after the block lands — chat uses it to leave the conversation. */
  onBlocked?: () => void;
}) {
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  // Held so the sheet keeps rendering its content while it slides back out,
  // instead of flashing an empty menu the moment `target` clears.
  const [shown, setShown] = useState<ModerationTarget | null>(target);
  const report = useReportContent();
  const block = useBlockUser();

  // Every open starts at the menu with a clean form. Adjusting during render
  // (rather than in an effect) avoids a frame of stale content on open.
  const [lastOpened, setLastOpened] = useState(target);
  if (target && target !== lastOpened) {
    setLastOpened(target);
    setShown(target);
    setStep('menu');
    setReason(null);
    setDetails('');
  }

  const user = shown?.user;
  const handle = user ? `@${user.username}` : '';
  const isMessage = shown?.type === 'MESSAGE';

  const submitReport = async () => {
    if (!shown || !reason) return;
    await report.mutateAsync({
      targetType: shown.type,
      targetId: shown.targetId,
      reason,
      details: details.trim() || undefined,
    });
    setStep('reported');
  };

  const submitBlock = async () => {
    if (!user) return;
    await block.mutateAsync(user.id);
    setStep('blocked');
  };

  const title =
    step === 'report'
      ? `Report ${isMessage ? 'message' : handle}`
      : step === 'confirm-block'
        ? `Block ${handle}`
        : step === 'reported'
          ? 'Report received'
          : step === 'blocked'
            ? 'User blocked'
            : isMessage
              ? 'Message options'
              : handle;

  return (
    <ModalSheet visible={target !== null} onClose={onClose} title={title}>
      {step === 'menu' ? (
        <View className="gap-2">
          {shown?.preview ? (
            <View className="mb-1 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
              <Text className="text-sm text-neutral-600 dark:text-neutral-300" numberOfLines={3}>
                {shown.preview}
              </Text>
            </View>
          ) : null}
          {(shown && actions ? actions(shown) : []).map((action) => (
            <ActionRow
              key={action.label}
              icon={action.icon}
              label={action.label}
              onPress={action.onPress}
            />
          ))}
          <ActionRow
            icon={<Flag size={18} color="#737373" />}
            label={isMessage ? 'Report message' : `Report ${handle}`}
            hint="Send this to our moderation team"
            onPress={() => setStep('report')}
          />
          <ActionRow
            icon={<Ban size={18} color="#dc2626" />}
            label={`Block ${handle}`}
            hint="They can no longer message or find you"
            destructive
            onPress={() => setStep('confirm-block')}
          />
        </View>
      ) : null}

      {step === 'report' ? (
        <View className="gap-4">
          {shown?.preview ? (
            <View className="rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
              <Text className="text-sm text-neutral-600 dark:text-neutral-300" numberOfLines={3}>
                {shown.preview}
              </Text>
            </View>
          ) : null}
          <View className="gap-2">
            <Text className="text-xs font-sans-semibold uppercase tracking-wider text-neutral-500">
              Why are you reporting this?
            </Text>
            {REASONS.map((option) => {
              const selected = reason === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  aria-checked={selected}
                  onPress={() => setReason(option.value)}
                  className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 active:opacity-70 ${
                    selected
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-border bg-white dark:bg-neutral-900'
                  }`}>
                  <View
                    className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300 dark:border-neutral-600'
                    }`}>
                    {selected ? <Check size={12} color="#ffffff" /> : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-sans-medium text-foreground">{option.label}</Text>
                    <Text className="mt-0.5 text-xs text-neutral-500">{option.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Details (optional)</Text>
            <TextInput
              className="min-h-[88px] rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
              placeholder="Add anything that helps us review this…"
              placeholderTextColor="rgb(115 115 115)"
              value={details}
              onChangeText={setDetails}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep('menu')}
              className="flex-1 items-center rounded-xl border border-border py-3 active:opacity-70">
              <Text className="text-sm font-sans-semibold text-foreground">Back</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!reason || report.isPending}
              onPress={submitReport}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-red-600 py-3 active:opacity-80 disabled:opacity-40">
              {report.isPending ? <ActivityIndicator size="small" color="#ffffff" /> : null}
              <Text className="text-sm font-sans-semibold text-white">Submit report</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {step === 'confirm-block' ? (
        <View className="gap-4">
          <View className="flex-row gap-3 rounded-xl bg-red-50 px-4 py-3.5 dark:bg-red-900/20">
            <ShieldAlert size={18} color="#dc2626" />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-sans-semibold text-red-700 dark:text-red-400">
                Block {user?.fullName || handle}?
              </Text>
              <Text className="text-xs leading-relaxed text-red-700/80 dark:text-red-400/80">
                They will be removed from your friends, your direct messages will be deleted, and
                they won&apos;t be able to find you in search. You can undo this from Settings.
              </Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep('menu')}
              className="flex-1 items-center rounded-xl border border-border py-3 active:opacity-70">
              <Text className="text-sm font-sans-semibold text-foreground">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={block.isPending}
              onPress={submitBlock}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-red-600 py-3 active:opacity-80 disabled:opacity-40">
              {block.isPending ? <ActivityIndicator size="small" color="#ffffff" /> : null}
              <Text className="text-sm font-sans-semibold text-white">Block</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {step === 'reported' ? (
        <DoneState
          title="Thanks for the report"
          body={`Our moderation team reviews reports within 24 hours. You can also block ${handle} if you don't want to hear from them.`}
          onClose={onClose}
        />
      ) : null}

      {step === 'blocked' ? (
        <DoneState
          title={`${handle} is blocked`}
          body="They can no longer message you or see your profile. Manage blocked accounts in Settings."
          onClose={() => {
            onClose();
            onBlocked?.();
          }}
        />
      ) : null}
    </ModalSheet>
  );
}
