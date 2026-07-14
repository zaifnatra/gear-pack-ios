import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { getCategoryDefaultImage } from '@/constants/category-images';
import { ConditionLabel } from '@/components/ui/chips';
import type { GearItem } from '@/types';

/*
 * Port of the web GearCard: square image (item photo or category default),
 * weight badge, name + brand, category pill + condition label.
 */
export function GearCard({
  item,
  onPress,
  showWeight = true,
}: {
  item: GearItem;
  onPress?: (item: GearItem) => void;
  showWeight?: boolean;
}) {
  const defaultImage = getCategoryDefaultImage(item.category?.name);
  const source = item.imageUrl ? { uri: item.imageUrl } : defaultImage;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={() => onPress?.(item)}
      className="flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {source ? (
          <Image source={source} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : null}
        {showWeight ? (
          <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1">
            <Text className="text-[10px] font-sans-medium text-white">{item.weightGrams}g</Text>
          </View>
        ) : null}
      </View>

      <View className="p-3">
        <Text
          className="font-sans-medium text-sm text-neutral-900 dark:text-neutral-100"
          numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-neutral-500" numberOfLines={1}>
          {item.brand || 'Unknown Brand'}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
            <Text className="text-[10px] text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
              {item.category?.name || 'Uncategorized'}
            </Text>
          </View>
          <ConditionLabel condition={item.condition} />
        </View>
      </View>
    </Pressable>
  );
}
