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

Forge uses a **soft & airy minimal** style: borderless white cards on a soft grey page, rounded
corners, generous space, and colour only for small accents. Every new or changed screen must
follow it; don't reintroduce Claymorphism, neumorphism, glassmorphism or other styles.

- **No shadows or depth effects.** No `boxShadow`, `elevation`, inset highlights, or gradients
  for depth. Cards separate from the page by fill alone. No coloured strips or bands on card
  edges (split colour is shown as a small dot). The only gradient left is the auth ember glow.
- **Few lines.** Inside a card, separate groups with space, not hairline dividers. Hairlines
  stay only between rows of a settings-style list (`profile/components/section.tsx`).
- **Rounded corners.** `Radius.small` (10) for buttons, inputs, checkboxes, icon tiles and
  wells, `Radius.medium` (14) for cards and `Radius.large` (18) for cards and hero panels.
  `Radius.pill` (999) makes capsules for chips, segmented controls and small round buttons.
- **Surfaces** come from `useSurface()`, spread after the background colour: `raised` for
  cards, `soft` for chips and secondary buttons, `sunken` for inputs and wells, and as the
  pressed state of white/secondary buttons (it sets the page fill). `accent` / `iron` sit on
  straw and iron fills, `ironSoft` / `ironSunken` for controls on the iron panel. `raised` has a
  transparent border (cards are borderless); `soft` / `sunken` keep a faint `line` border so
  controls still read on the page. Every variant has a 1px border so swapping never shifts layout. Put style overrides such as
  `borderColor` *after* the surface spread.
- **Press feedback.** Pressing straw (accent) or mint buttons uses `opacity: 0.85`. Don't swap
  those to `sunken`, because it would turn them grey. Secondary buttons swap `soft` → `sunken`.
- **Colour.** Page `background` is soft grey, cards are borderless `surface` (white), and the hero panels (today's session, nutrition, progress, workout clock, profile) are white
  cards too. `iron` is only for the auth brand panel and overlays on photos; don't add new iron
  panels. Straw `accent` is a fill colour only; on white use `text` or `up` for glyphs and text.
  `accent` (straw) is the primary action, `mint` / `onMint` highlights and the selected tab,
  `up` is positive/green and `danger` is red. Status chips are a tint of their colour (e.g.
  `${color}1F` fill, `${color}55` border) with coloured text, never white text on a solid
  colour. Always use tokens, never literal colours.
- **Icons everywhere they name something.** Use `Icon` (SF Symbol + Material name) generously:
  card headers get an `IconBadge` (workout → dumbbell, meals → fork.knife, body → figure,
  goal → target, calendar/week → calendar…), list rows get a leading `IconBadge` (meal rows use
  `mealTimeInfo(...).icon`), stats and tiles get a small leading icon, and section headings use
  `SectionLabel` with an `icon`. Card headers use an `IconBadge` with `text` glyph, `background` fill
  and `line` border.
- **Typography.** The scale is compact (`hero` 32, `display` 26, `title` 17, `body` 15, `label`
  13, `caption` 11); build hierarchy with weight, colour and space rather than bigger sizes, and
  don't hardcode `fontSize` outside `Text` unless it's a big number readout or a `TextInput`
  (inputs stay at 16 so iOS Safari doesn't zoom on focus). Small labels and eyebrows are
  uppercase `caption`/`label` with letterSpacing 0.6–0.8 in `textSecondary`. Numbers use
  `title`/`display`/`hero` with a small unit beside them.
- **Spacing.** Screen content uses `paddingHorizontal: Spacing.screen` (20), `paddingTop:
  Spacing.three` and `gap: Spacing.five` between top-level sections.
- **Motion** (`src/constants/motion.ts`). Wrap a screen's top-level blocks in
  `<Animated.View entering={enter(i)}>` for a short staggered rise; rows of a list inside a card can
  use `slideIn(i, after)` (staggered slide from the left, as in Home's session card); use `layout={reflow}` on
  blocks that get pushed around when content above loads. Solid action buttons use `PressScale`
  (with `pressedStyle`); full-width cards and list rows keep a background highlight instead.
  No animation on tab switches. Use `EASE_OUT` / `CSS_EASE_OUT`, never the built-in easings.
- **Progress bars** are flat: a `line` (or `ironLine`) track, height 4–8, radius half the
  height, no padding or border, with square-ended fills clipped by `overflow: 'hidden'`.
- **Tab bar** is a full-width borderless `surface` bar; the active tab is a mint tile.
- The Home header shows the app icon (`assets/images/icon.png`) in a 32px circle before the
  "Forge" wordmark (`BrandTitle` in `src/app/(tabs)/(home)/_layout.tsx`).

## Auth

- `(auth)` holds `login`, `signup`, `forgot-password` (sends a code) and `reset-password` (code +
  new password, then signs in). The reset calls go through `useSession()`
  (`requestPasswordReset`, `resetPassword`), which map Better Auth error codes to messages.

## Exercise muscles

- Catalog exercises carry `primary_muscles` / `secondary_muscles` (labels from
  `features/exercises/muscles.ts`, mirroring the backend's list). `MuscleTags` shows them
  (library, exercise picker); `MusclePicker` edits them (tap cycles main → assists → off) on
  the add screen and the admin-only `/edit-exercise?id=` screen (tap a library row).
- `searchExercises` (library, picker) also matches muscles and their body region ("legs");
  `findMatches` stays name-only for the duplicate check.

## Split templates

- `features/plans/templates.ts` holds the ready-made splits (Push/Pull/Legs 6 days, Upper/Lower
  4 days) as data. Each exercise lists the names it goes by; `resolveExercise` sends the catalog
  id when the catalog has one of them, else the first name, which the backend adds to the catalog.
- `/templates` (Workouts tab → "Start from a ready-made split") previews them; `applyTemplate`
  replaces the whole week: creates or updates each training day (keeping an existing plan's
  time, else 6:00 PM) and deletes plans on the template's rest days, after a confirm.
- A day's `muscleGroup` picks its colour through `splitFor`, so name days "Push A", "Upper body
  B" and so on.

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
