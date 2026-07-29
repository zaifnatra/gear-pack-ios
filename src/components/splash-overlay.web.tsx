/*
 * The web build has no native splash to hand off from, and the browser paints
 * the app immediately — so there's nothing to cover. Rendering nothing keeps
 * the reanimated keyframe off the web runtime entirely.
 */
export function AnimatedSplashOverlay() {
  return null;
}
