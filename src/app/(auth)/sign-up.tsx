import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { SocialAuthButtons } from '@/components/social-auth-buttons';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/lib/auth-context';

const schema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'At most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', password: '' },
  });

  // TODO: pre-submit username/email availability check once the backend exposes
  // an endpoint (mirrors the web's signUp pre-checks). For now the server
  // rejects duplicates and we surface the error.
  const onSubmit = handleSubmit(async ({ username, email, password }) => {
    setFormError(null);
    try {
      await signUp(email, password, username);
      // If email confirmation is enabled, no session exists yet — tell the user.
      // Otherwise the root guard swaps to the app stack automatically.
      setConfirmationSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign up.');
    }
  });

  if (confirmationSent) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center gap-3 px-6">
          <Text className="text-2xl font-bold text-foreground">Check your email</Text>
          <Text className="text-base text-muted">
            If confirmation is required, we&apos;ve sent you a link. Once confirmed, sign in to
            continue.
          </Text>
          <Link href="/sign-in" className="text-base font-semibold text-foreground">
            Back to sign in
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="grow justify-center px-6 py-10 gap-6"
          keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Create account</Text>
            <Text className="text-base text-muted">Join GearPack to plan your trips.</Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Username"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                  autoCapitalize="none"
                  autoComplete="username"
                  placeholder="trailblazer"
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  autoCapitalize="none"
                  secureTextEntry
                  placeholder="At least 8 characters"
                />
              )}
            />
          </View>

          {formError ? <Text className="text-sm text-red-500">{formError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onSubmit}
            className="items-center rounded-xl bg-primary py-3.5 active:opacity-80 disabled:opacity-50">
            {isSubmitting ? (
              <ActivityIndicator color="rgb(255 255 255)" />
            ) : (
              <Text className="text-base font-semibold text-background">Create account</Text>
            )}
          </Pressable>

          <SocialAuthButtons />

          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-muted">Already have an account?</Text>
            <Link href="/sign-in" className="text-sm font-semibold text-foreground">
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
