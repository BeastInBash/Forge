@AGENTS.md

# Forge app

Expo SDK 57 / React Native 0.86 / React 19 (React Compiler) / Expo Router with typed routes. The API
is [forge-backend](../forge-backend); see README.md for setup and running on devices.

## Commands

- `bun install`, `bun run start` (Metro on 8081), `bun run android` / `ios` / `web`
- Typecheck: `bunx tsc --noEmit` — run after every change; it also validates icon names.
- Lint: `npx expo lint`. Four problems already exist (`use-session.ts`, `workout-screen.tsx`,
  `use-color-scheme.web.ts`, `lift-chart.tsx`); don't add new ones.
- There is no Prettier config and no test suite. Match the surrounding formatting (2 spaces,
  single quotes, trailing commas, ~100 columns).

## Layout

- `src/app/` holds routes only. Each route file re-exports a screen:
  `export { MealDetailScreen as default } from '@/features/meals/meal-detail-screen';`
  Each tab is a group with its own `Stack` in `_layout.tsx`: `(home)`, `(workouts)`, `(progress)`,
  `(nutrition)`, `(profile)`. Modals (`log-lift`, `log-meal`) are `presentation: 'modal'` screens.
- `src/features/<feature>/` holds screens, components and data for one feature. A feature that
  talks to the API follows the `progress` (lifts) and `meals` pattern:
  - `api.ts`: types plus a local `request()` that adds `apiURL` and `authHeaders()`, sends
    `credentials: 'include'`, throws `Error(body.message)` and returns `body.data`.
  - `*-store.ts`: a module-level store (`subscribe` / `getSnapshot`, `revalidate*` that never
    throws and shares in-flight requests, `add*Locally` / `remove*Locally`, `clear*`).
  - `use-*.ts`: hooks using `useSyncExternalStore`, refetching in `useFocusEffect`.
  - Every store's `clear*` is called on sign-out in `src/features/auth/session.tsx`; add new
    stores there.
- `src/components/ui/`: `RulerPicker` (scrolling ruler for numbers: onboarding's age/height/
  weight, the water goal; `color` and `pointer="droplet"` restyle the needle), `Text`
  (variants `hero`, `display`, `title`, `body`, `bodyStrong`, `label`, `caption`), `Icon` (pass both `ios` SF Symbol and `material` names; both are typed),
  `IconBadge` (icon on a small tile, for card headers and list rows), `SectionLabel` (uppercase
  heading over a group, with optional icon), `Segmented`, `PressScale`.
- `src/constants/theme.ts`: all colours (`useTheme()`), `Spacing`, `Radius`, `FontFamily`,
  `Temper` (per-split colours), and `Surfaces` (`useSurface()`). See Design system below.

## Design system (required for all UI work)

Forge uses **Minimalism / Flat Design 2.0**. Every new or changed screen must follow it; don't
reintroduce Claymorphism, neumorphism, glassmorphism or other styles.

- **No shadows or depth effects.** No `boxShadow`, `elevation`, inset highlights, or gradients
  for depth. Surfaces are solid fills separated by 1px borders. The only gradients allowed are
  the existing decorative temper bands and the auth ember glow.
- **Small corners only.** Use `Radius.small` (6) for buttons, chips, inputs, checkboxes, icon
  tiles and wells, and `Radius.medium` / `Radius.large` (both 8) for cards and panels. No
  capsules or big radii; `Radius.pill` is also 6. Only avatars, dots and radio indicators are
  circles, given explicit `size / 2` radii.
- **Surfaces** come from `useSurface()`, spread after the background colour: `raised` for
  cards, `soft` for chips and secondary buttons, `sunken` for inputs and wells, and as the
  pressed state of white/secondary buttons (it sets the page fill). `accent` / `iron` sit on
  straw and iron fills, `ironSoft` / `ironSunken` for controls on the iron panel. Every variant
  has a 1px border so swapping them never shifts layout. Put style overrides such as
  `borderColor` *after* the surface spread.
- **Press feedback.** Pressing straw (accent) or mint buttons uses `opacity: 0.85`. Don't swap
  those to `sunken`, because it would turn them grey. Secondary buttons swap `soft` → `sunken`.
- **Colour.** Page `background` is near-white, cards are `surface` (white) with a `line`
  border, and the hero panel (today's session, nutrition, progress, workout clock) is `iron`.
  `accent` (straw) is the primary action, `mint` / `onMint` highlights and the selected tab,
  `up` is positive/green and `danger` is red. Status chips are a tint of their colour (e.g.
  `${color}1F` fill, `${color}55` border) with coloured text, never white text on a solid
  colour. Always use tokens, never literal colours.
- **Icons everywhere they name something.** Use `Icon` (SF Symbol + Material name) generously:
  card headers get an `IconBadge` (workout → dumbbell, meals → fork.knife, body → figure,
  goal → target, calendar/week → calendar…), list rows get a leading `IconBadge` (meal rows use
  `mealTimeInfo(...).icon`), stats and tiles get a small leading icon, and section headings use
  `SectionLabel` with an `icon`. On iron panels, use an `IconBadge` with `ironLine` background
  and an `accent` glyph.
- **Typography.** Small labels and eyebrows are uppercase `caption`/`label` with letterSpacing
  0.6–0.8 in `textSecondary`. Numbers use `title`/`display`/`hero` with a small unit beside them.
- **Progress bars** are flat: a `line` (or `ironLine`) track, height 4–8, radius half the
  height, no padding or border, with square-ended fills clipped by `overflow: 'hidden'`.
- **Tab bar** is a full-width flat bar with a hairline top border; the active tab is a mint tile.
- The Home header shows the app icon (`assets/images/icon.png`) in a 32px circle before the
  "Forge" wordmark (`BrandTitle` in `src/app/(tabs)/(home)/_layout.tsx`).

## Auth

- `(auth)` holds `login`, `signup`, `forgot-password` (sends a code) and `reset-password` (code +
  new password, then signs in). The reset calls go through `useSession()`
  (`requestPasswordReset`, `resetPassword`), which map Better Auth error codes to messages.

## Nutrition (meals)

- `features/meals/`: Nutrition tab history (`nutrition-screen`), `/log-meal` modal, and
  `/meal/[mealId]` detail. Logging calls `POST /api/v1/meals`, which runs the AI analysis on the
  backend (a few seconds), then `router.replace`s to the new meal's detail.
- All nutrition numbers come from the backend; the app only sums meal totals for the day
  (`features/meals/today.ts`). Nutrient labels and FDA Daily Values live in `nutrients.ts`; macro
  colours in `components/macro-bar.tsx`.
- Home's "Meals today" card (`features/home/components/meals-card.tsx`) reads the same meals
  store. The calorie goal comes from `features/body` (`summarize(...).goal ?? maintenance`).

## Water

- `features/water/`: the goal store (`useWaterGoal`, null until set), the "Daily water" card on
  the Nutrition tab, and the `/water-goal` modal: a `water`-blue `RulerPicker` in litres with a
  droplet pointer, starting at the saved goal or ~35 ml/kg of body weight.
- `PUT /api/v1/water/goal` replaces every setting, so saving sends the current reminder window
  back with the new amount, plus the device time zone. Reminders are pushed by the backend.

## Push notifications

- `features/notifications/push.ts` (`expo-notifications`; plugin in app.json with the white
  96px `notification-icon.png` and the `default` channel). `registerForPush({ prompt })` creates
  the Android channel, checks permission (asks only with `prompt`), gets the Expo push token and
  POSTs it to `/api/v1/notifications/push-token`. Never throws; returns `unavailable` on web,
  simulators, Expo Go on Android, or without FCM credentials.
- Permission is asked when a water goal is saved, never on launch. `usePushNotifications` in the
  root navigator re-registers silently while signed in, on token rotation, and routes taps
  (`data.type === 'water-reminder'` → `/nutrition`). `signOut` calls `unregisterPush()` first.
- Remote push needs a development or store build, and on Android `google-services.json`
  (`android.googleServicesFile`) plus the FCM V1 service account key uploaded to EAS.

## Update prompt

- `features/app-update/` shows an "Update available" dialog (mounted in the root layout) when
  Google Play has a newer version for this install. It uses Play's In-App Updates API through the
  local native module `modules/play-updates` (Android only; `PlayUpdates` is null on iOS, web and
  Expo Go). "Update" runs Play's immediate update flow; "Not now" hides that version for a day.
- It only answers for installs from Google Play, so it can't be tried in a dev build or with a
  sideloaded .apk. Test it with Play's internal app sharing or a testing track: install an older
  build from Play, publish a newer one, then reopen the app.

## Environment and testing gotchas

- `EXPO_PUBLIC_API_URL` comes from `.env.local` (git-ignored) and points at the deployed Vercel
  backend. In development it is read through Expo's virtual env module from `.env.local`, so a
  shell variable does not override it. `eas.json` sets it for EAS builds.
- Don't edit `.env.local`, or run a second `expo start --clear` in this folder, while the user's
  Metro is running: both disturb the bundle their phone loads. To test against a local backend,
  use a separate copy of the project or ask first.
- New backend routes reach the app only after forge-backend is deployed to Vercel.

## Commits

Conventional Commits (`feat(meals): …`, `style: …`, `chore(deps): …`). No `Co-Authored-By` or
other AI attribution lines.
