# Forge

A fitness app for iOS, Android and the web, built with Expo SDK 57 and Expo Router. You can sign in,
browse and extend an exercise library, and plan a weekly training split with sets, reps and weight
for each exercise. Data comes from [forge-backend](../forge-backend).

## Features

- **Auth**: email and password sign-up and login, plus Google sign-in, through Better Auth. On native
  the session cookie is kept in the secure store; on web the browser keeps it.
- **Today**: the day's session, the week at a glance, and meals. This screen still uses sample data
  from `src/features/home/data.ts`.
- **Workouts**: a weekly split and a plan editor for creating, editing and deleting workout plans.
- **Exercise library**: the catalog with images, cached on disk and revalidated with ETags (a
  `304` when nothing changed), and a form to add an exercise with an image from the photo library.
- **Profile**: everything stored about the signed-in user.
- **Nutrition**: a placeholder for now.
- Light and dark themes, native tabs (SF Symbols on iOS, Material icons on Android), and the
  Archivo and Big Shoulders Display fonts.

## Stack

Expo 57 · React Native 0.86 · React 19 with the React Compiler · Expo Router (typed routes, native
tabs) · Reanimated 4 · `@expo/ui` · Better Auth with `@better-auth/expo` · `expo-secure-store` ·
`expo-file-system` · `expo-image` / `expo-image-picker` · TypeScript.

## Getting started

Prerequisites: [Bun](https://bun.com) (the lockfile is `bun.lock`; npm also works), and a running
forge-backend, either local or deployed.

```bash
bun install
```

Create `.env.local` with the backend's URL, without a trailing slash:

```bash
# Deployed
EXPO_PUBLIC_API_URL=https://forge-backend-peach.vercel.app
# or local
EXPO_PUBLIC_API_URL=http://localhost:3000
```

It must match `BETTER_AUTH_URL` on the backend. `EXPO_PUBLIC_` values are bundled into the app, so
never put secrets in them, and restart `expo start` after changing one. The app throws at startup if
it is missing.

Then start it:

```bash
bun run start      # Metro; press a / i / w for Android, iOS or web
bun run android    # build and run a development build on Android
bun run ios        # build and run a development build on iOS (macOS only)
bun run web        # web only
```

The app uses native modules, so use a development build (`expo run:*` or an EAS development build)
rather than Expo Go.

### Talking to a local backend

- **Android emulator**: forward the backend's port so `localhost` reaches your machine, e.g.
  `adb reverse tcp:3000 tcp:3000`, and `adb reverse tcp:8081 tcp:8081` for Metro.
- **Web**: add `http://localhost:8081` to the backend's `CORS_ORIGIN`.
- **Physical device / Google sign-in**: the phone must reach the backend, so expose it through a
  tunnel (cloudflared, ngrok) and use the tunnel URL for both `EXPO_PUBLIC_API_URL` and the
  backend's `BETTER_AUTH_URL`.

### Building Android locally

`expo run:android` needs JDK 17 (newer JDKs break the `react-native-worklets` CMake step) and
`ANDROID_HOME` pointing at your Android SDK:

```bash
export JAVA_HOME=/path/to/jdk-17
export ANDROID_HOME=$HOME/Android/Sdk
bun run android
```

## Project layout

```
src/
  app/                    Routes (Expo Router)
    _layout.tsx           Fonts, theme, session gate, splash screen
    (auth)/               login, signup
    (tabs)/               Native tabs; a .web.tsx variant for the browser
      (home)/             Today
      (workouts)/         workouts, plan editor, exercise library, add exercise
      (nutrition)/
      (profile)/
  features/               Screens, components, API calls and state, by feature
    auth/ home/ workouts/ plans/ exercises/ profile/
  components/             Shared UI (text, icons, gradient text)
  hooks/                  Theme, color scheme, stack options
  lib/                    Auth client, persisted storage, week helpers
  constants/theme.ts      Colors and font families
  types/                  Shared domain types
assets/                   Icons, splash and logo images
```

Platform-specific files use the `.web.ts(x)` and `.android.tsx` suffixes, for example
`src/lib/persisted.web.ts` and `src/components/ui/icon.android.tsx`. The `@/` import alias points at
`src/`.

## Builds and releases (EAS)

`eas.json` defines three profiles:

| Profile       | Use                                         | Backend                                   |
| ------------- | ------------------------------------------- | ----------------------------------------- |
| `development` | Development client, internal distribution   | From `.env.local`                         |
| `preview`     | Internal test builds                        | `https://forge-backend-peach.vercel.app`  |
| `production`  | Store builds, version auto-incremented      | `https://forge-backend-peach.vercel.app`  |

```bash
eas build --profile preview --platform android
eas build --profile production --platform all
eas submit --platform ios
```

The bundle identifier / package name is `in.besaif.forge.fitness` and the deep-link scheme is
`forge://`, which the backend trusts for auth redirects.

## Scripts

| Script            | What it does                         |
| ----------------- | ------------------------------------ |
| `bun run start`   | Start Metro                          |
| `bun run android` | Build and run on Android             |
| `bun run ios`     | Build and run on iOS                 |
| `bun run web`     | Start the web build                  |
| `bun run lint`    | `expo lint`                          |

## License

Copyright © 2026 BeastInBash ([saifdev0847@gmail.com](mailto:saifdev0847@gmail.com)). All rights
reserved.

This project is proprietary and is not open source. No part of this codebase may be copied, modified,
distributed, deployed or used, in whole or in part, for any purpose without prior written permission
from the author. To request permission, contact saifdev0847@gmail.com.
