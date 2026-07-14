import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/*
 * Bottom-sheet style modal — the iOS-native equivalent of the web's centered
 * dialog (Modal.tsx). Slide-up sheet, rounded top corners, scrollable body.
 */
export function ModalSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <View
          className="max-h-[88%] rounded-t-3xl bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <Text className="font-heading text-lg text-foreground">{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              className="rounded-full bg-neutral-100 p-2 active:opacity-70 dark:bg-neutral-800">
              <X size={18} color="#737373" />
            </Pressable>
          </View>
          <ScrollView
            contentContainerClassName="p-5 gap-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
