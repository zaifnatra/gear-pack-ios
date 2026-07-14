import { Text, View } from 'react-native';

/* Dashed empty container, same pattern as the web's empty feed/list states. */
export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-border p-8">
    <Text className="text-center text-neutral-500">{message}</Text>
      {hint ? (
        <Text className="mt-2 text-center text-sm font-sans-semibold text-emerald-600">{hint}</Text>
      ) : null}
    </View>
  );
}
