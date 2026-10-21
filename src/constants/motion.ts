/** Shared motion curves. Values come from Emil Kowalski's set; built-in easings are too weak. */

import {
  cubicBezier,
  Easing,
  FadeInDown,
  FadeInLeft,
  LinearTransition,
} from 'react-native-reanimated';

/** Strong ease-out for worklet animations and layout animations. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** The same curve for Reanimated CSS transitions, which take their own easing type. */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/**
 * Entrance for a screen's top-level blocks: a short rise from 8pt below, staggered by `index`
 * so the page reads top to bottom. The stagger is capped so long pages never wait on it, and
 * layout animations default to ReduceMotion.System, so this is skipped under reduced motion.
 */
export function enter(index: number) {
  return FadeInDown.duration(320)
    .delay(Math.min(index, 6) * 45)
    .easing(EASE_OUT)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });
}

/**
 * Entrance for the rows of a list inside a card: a slide in from 24pt to the left, staggered by
 * `index`, starting once the card itself has mostly risen in (`after`, in ms).
 */
export function slideIn(index: number, after = 0) {
  return FadeInLeft.duration(380)
    .delay(after + Math.min(index, 8) * 55)
    .easing(EASE_OUT)
    .withInitialValues({ opacity: 0, transform: [{ translateX: -24 }] });
}

/** Siblings sliding into place when a block above them appears, grows or goes away. */
export const reflow = LinearTransition.duration(240).easing(EASE_OUT);
