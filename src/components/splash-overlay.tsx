import * as SplashScreen from 'expo-splash-screen';
import { Mountain } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/*
 * Branded launch overlay. It paints the same background as the native splash
 * (see the expo-splash-screen plugin config in app.json), so hiding the native
 * splash underneath it is invisible — then it fades to reveal the app.
 *
 * Hiding is driven by onLayout rather than a timer: the native splash only
 * comes down once this view has actually painted, so there's never a blank
 * frame between the two.
 */

const DURATION = 550;

const fadeOut = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  40: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 1.06 }], easing: Easing.out(Easing.quad) },
});

export function AnimatedSplashOverlay() {
  const { colorScheme } = useColorScheme();
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const isDark = colorScheme === 'dark';
  const background = { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' };

  const mark = (
    <View style={styles.mark}>
      <View style={styles.tile}>
        <Mountain size={44} color="#ffffff" strokeWidth={2.25} />
      </View>
      <Text style={[styles.wordmark, { color: isDark ? '#ededed' : '#171717' }]}>GearPack</Text>
    </View>
  );

  return animate ? (
    <Animated.View
      entering={fadeOut.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={[styles.overlay, background]}>
      {mark}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setAnimate(true));
      }}
      style={[styles.overlay, background]}>
      {mark}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  mark: {
    alignItems: 'center',
    gap: 18,
  },
  tile: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
  },
  wordmark: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
  },
});
