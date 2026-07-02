import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

// Labeled text input styled with the shared design tokens. Uses the muted token
// value for the placeholder (placeholderTextColor can't take a className).
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, ...props },
  ref,
) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor="rgb(115 115 115)"
        className="rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
        {...props}
      />
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
});
