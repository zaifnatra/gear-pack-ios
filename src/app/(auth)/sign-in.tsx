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
import { DEMO_MODE } from '@/lib/demo';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await signIn(email, password);
      // On success the session updates and the root guard swaps to the app stack.
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in.');
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="grow justify-center px-6 py-10 gap-6"
          keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Welcome back</Text>
            <Text className="text-base text-muted">Sign in to your GearPack account.</Text>
            {DEMO_MODE ? (
              <Text className="text-sm text-emerald-600">
                Demo mode — any email and password will sign you in.
              </Text>
            ) : null}
          </View>

          <View className="gap-4">
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
                  placeholder="••••••••"
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
              <Text className="text-base font-semibold text-background">Sign in</Text>
            )}
          </Pressable>

          <SocialAuthButtons />

          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-muted">Don&apos;t have an account?</Text>
            <Link href="/sign-up" className="text-sm font-semibold text-foreground">
              Sign up
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
