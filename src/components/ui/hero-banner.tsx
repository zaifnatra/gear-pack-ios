import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, View, type ImageSourcePropType } from 'react-native';

/*
 * The web dashboard's signature header: a rounded-3xl photo banner with a
 * bottom-heavy black gradient, a big Outfit-black title, and optional action
 * buttons. Ported 1:1 from the web's dashboard/gear/social page headers.
 */
export function HeroBanner({
  image,
  title,
  subtitle,
  children,
  compact = false,
}: {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <View
      className={`relative justify-end overflow-hidden rounded-3xl bg-neutral-900 ${compact ? 'min-h-[180px]' : 'min-h-[240px]'}`}>
      <Image
        source={image}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.40)', 'rgba(0,0,0,0.90)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View className="p-6">
        <Text className="mb-1 font-heading-black text-3xl tracking-tight text-white">{title}</Text>
        {subtitle ? (
          <Text className="font-sans-medium text-base leading-relaxed text-neutral-200">
            {subtitle}
          </Text>
        ) : null}
        {children ? <View className="mt-5 flex-row flex-wrap gap-3">{children}</View> : null}
      </View>
    </View>
  );
}
