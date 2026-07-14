import { Text, View } from 'react-native';

import type { Condition, Difficulty, TripType } from '@/types';

/* Colored badge chips ported from the web TripCard / GearCard. */

export function TypeChip({ type }: { type: TripType }) {
  return (
    <View className="rounded-md bg-blue-50 px-2 py-1 dark:bg-blue-900/20">
      <Text className="text-xs font-sans-medium text-blue-700 dark:text-blue-400">
        {type.replaceAll('_', ' ')}
      </Text>
    </View>
  );
}

const DIFFICULTY_STYLES: Record<Difficulty, { box: string; text: string }> = {
  EASY: { box: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
  MODERATE: {
    box: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-400',
  },
  HARD: { box: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
  EXTREME: { box: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
};

export function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  const style = DIFFICULTY_STYLES[difficulty];
  return (
    <View className={`rounded-md px-2 py-1 ${style.box}`}>
      <Text className={`text-xs font-sans-medium ${style.text}`}>{difficulty}</Text>
    </View>
  );
}

export function ConditionLabel({ condition }: { condition: Condition }) {
  const color =
    condition === 'NEW'
      ? 'text-green-600'
      : condition === 'POOR' || condition === 'RETIRED'
        ? 'text-red-500'
        : 'text-neutral-500';
  return <Text className={`text-[10px] font-sans-semibold uppercase ${color}`}>{condition}</Text>;
}
