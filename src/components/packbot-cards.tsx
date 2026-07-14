import { AlertTriangle, CheckCircle2, Clock, MapPin, Mountain, Route, XCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { DifficultyChip } from '@/components/ui/chips';
import type { GearAnalysisData, TrailOption } from '@/types';

/* Structured PackBot responses, ported from web TrailCard / GearAnalysis. */

export function TrailCards({ trails }: { trails: TrailOption[] }) {
  return (
    <View className="gap-3">
      {trails.map((trail) => (
        <View
          key={trail.id}
          className="gap-2 rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900/30 dark:bg-neutral-900">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 font-heading text-base text-foreground">{trail.name}</Text>
            <DifficultyChip difficulty={trail.difficulty} />
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color="#737373" />
              <Text className="text-xs text-neutral-500">{trail.location}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#737373" />
              <Text className="text-xs text-neutral-500">{trail.driveTime}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Route size={12} color="#059669" />
              <Text className="text-xs font-sans-medium text-neutral-600 dark:text-neutral-300">
                {trail.distance}km
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Mountain size={12} color="#059669" />
              <Text className="text-xs font-sans-medium text-neutral-600 dark:text-neutral-300">
                {trail.elevationGain}m gain
              </Text>
            </View>
          </View>
          <Text className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            {trail.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

const STATUS_META = {
  READY: { Icon: CheckCircle2, color: '#16a34a', box: 'border-green-100 dark:border-green-900/30' },
  WARNING: { Icon: AlertTriangle, color: '#ca8a04', box: 'border-yellow-100 dark:border-yellow-900/30' },
  MISSING: { Icon: XCircle, color: '#dc2626', box: 'border-red-100 dark:border-red-900/30' },
} as const;

export function GearAnalysisCard({ data }: { data: GearAnalysisData }) {
  return (
    <View className="gap-3">
      <View className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
        <Text className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
          {data.summary}
        </Text>
      </View>
      {data.categories.map((category) => {
        const meta = STATUS_META[category.status];
        return (
          <View
            key={category.category}
            className={`gap-2 rounded-2xl border bg-white p-4 dark:bg-neutral-900 ${meta.box}`}>
            <View className="flex-row items-center gap-2">
              <meta.Icon size={16} color={meta.color} />
              <Text className="flex-1 font-heading text-sm text-foreground">{category.category}</Text>
              <Text className="text-[10px] font-sans-semibold uppercase" style={{ color: meta.color }}>
                {category.status}
              </Text>
            </View>
            {category.items.map((item) => (
              <View key={item.name} className="flex-row items-baseline gap-2 pl-6">
                <Text className="text-xs font-sans-medium text-neutral-700 dark:text-neutral-300">
                  {item.name}
                </Text>
                {item.note ? <Text className="flex-1 text-[11px] text-neutral-500">{item.note}</Text> : null}
              </View>
            ))}
            {category.suggestion ? (
              <Text className="pl-6 text-[11px] leading-relaxed text-neutral-500">
                💡 {category.suggestion}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
