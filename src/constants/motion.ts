/** Shared motion curves. Values come from Emil Kowalski's set; built-in easings are too weak. */

import { cubicBezier, Easing } from 'react-native-reanimated';

/** Strong ease-out for worklet animations and layout animations. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** The same curve for Reanimated CSS transitions, which take their own easing type. */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
