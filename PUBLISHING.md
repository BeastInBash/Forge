# Publishing Forge: Google Play, App Store and CI/CD

This guide takes Forge from its first closed-testing upload to automatic releases on both stores.
Work through the parts in order. Part A is Android, Part B is iOS, Part C is the CI/CD pipeline,
and Part D is the checklist for every release after that.

| | |
| --- | --- |
| App name | Forge |
| Android package / iOS bundle ID | `in.besaif.forge.fitness` (`app.json`, can never change once published) |
| Expo project | `@beast0/Forge`, id `4726b97b-0922-40a5-a186-a2e367673a22` |
| GitHub repo | `BeastInBash/Forge` (connected to Expo) |
| Build and upload | EAS Build + EAS Submit, run by EAS Workflows (`.eas/workflows/`) |
| Versioning | `appVersionSource: "remote"`. EAS increments `versionCode` / `buildNumber`; you bump `version` in `app.json` |

## Where things stand

Done:

- [x] Play Console developer account and the Forge app created
- [x] Upload keystore generated and stored on EAS (Play App Signing holds the real signing key)
- [x] Google service account `forge-fitness@crucial-bucksaw-398209.iam.gserviceaccount.com`,
      key uploaded to EAS and assigned to Play Store submissions
- [x] GitHub repo connected to the Expo project
- [x] `release-android.yml`: every merge to `main` builds an .aab + .apk and uploads the .aab to
      **Closed testing**
- [x] `build-testing.yml`: manual build of the `testing` branch, uploaded to **Internal testing**
- [x] In-app account deletion and a privacy policy link (both stores require them)

Still to do: the rest of Part A (closed test → production access → production), all of Part B,
and the C.3–C.5 additions in Part C.

---

# Part A: Google Play

## A.1 How the tracks work

| Track | `eas.json` `track` value | Review | Who can install | Used for |
| --- | --- | --- | --- | --- |
| Internal testing | `internal` | None, available in minutes | Up to 100 testers by email | Builds from the `testing` branch |
| Closed testing | `alpha` | Yes, usually hours to a few days | Email lists or Google Groups | Every merge to `main` |
| Open testing | `beta` | Yes | Anyone who joins | Not used |
| Production | `production` | Yes | Everyone | Tagged releases (Part C.4) |

A release moves up the tracks by **promotion** in Play Console. You don't have to rebuild it.

## A.2 Play Console setup tasks

Play Console → Forge → **Dashboard** lists these tasks. Uploads to the testing tracks work
before they're finished, but you can't release to production until all of them are done.

**Policy → App content.** Answer every declaration:

| Declaration | What to put for Forge |
| --- | --- |
| Privacy policy | `https://forge-backend-peach.vercel.app/privacy`, the same URL the Profile screen opens |
| App access | **"All or some functionality is restricted"**. Forge needs sign-in, so give reviewers a working **demo email + password** account with sample workouts and meals. Without this, the review is rejected. |
| Ads | No ads |
| Content rating | Fill in the IARC questionnaire (fitness/utility, no violence → usually "Everyone") |
| Target audience | 18+ (or 13+). Avoid ages under 13, which triggers the Families policy |
| Data safety | List what the backend stores: email/name (account), photos (exercise images, user-provided), health & fitness data (workouts, meals, body stats). Say it is **encrypted in transit**, **not sold or shared**, and that **users can request deletion** (in-app account deletion) |
| Health apps | Forge is a fitness tracker. Declare it under the Health apps declaration (fitness/nutrition tracking, not a medical device) |
| Account deletion | Give the in-app path (Profile → Delete account) and a web URL where users can request deletion without the app. Google requires the web URL as well |
| Government apps / Financial features / News | No |

**Grow → Store presence → Main store listing**

- App name (max 30 chars), short description (max 80), full description (max 4000)
- App icon **512 × 512** PNG: `../play-store-assets/icon-512.png`
- Feature graphic **1024 × 500**: `../play-store-assets/feature-graphic-1024x500.png`
- Phone screenshots: at least 2 (up to 8), 16:9 or 9:16, each side 320–3840 px.
  Take them from the emulator (`adb exec-out screencap -p > shot.png`)
- Category: **Health & Fitness**. Add a contact email.

## A.3 Closed testing: what each merge to `main` does

Each merge to `main` runs `.eas/workflows/release-android.yml`, which does this:

1. type-checks the code (`./node_modules/.bin/tsc --noEmit`)
2. builds a signed **.aab** (profile `production`) and an installable **.apk** (profile `production-apk`)
3. uploads the .aab to **Closed testing** (`submit.production` → `track: alpha`, `releaseStatus: completed`)

To set up the closed testing track once in Play Console:

1. **Test and release → Testing → Closed testing** → open the track (default name "Closed testing", API name `alpha`).
2. **Testers**: create an email list, or use a Google Group, which is easier to manage.
   Copy the **opt-in link** and send it to testers. Each tester must open the link on their
   Google account and accept, then install from Play.
3. **Countries/regions**: select where testers are.
4. **Publishing overview → Send changes for review** after each release is uploaded. With
   *Managed publishing* off, approved releases go live to testers automatically.

> If the upload step fails with *"Only releases with status draft may be created on draft
> app"*, the app has never had a reviewed release. Set `releaseStatus` to `"draft"` in
> `eas.json` → `submit.production.android`, roll out the first release by hand in Play Console,
> then switch back to `"completed"`.

## A.4 Getting production access (personal developer accounts)

A **personal** developer account created after **13 November 2023** can't publish to production
until it has passed a closed test:

1. At least **12 testers** must be **opted in** to the closed test for **14 days in a row**.
   If the count drops below 12, the 14 days start again.
2. Testers have to actually use the app. Google checks engagement, and feedback through the
   Play listing helps.
3. After 14 days: **Dashboard → Apply for production**. Answer the questions about your
   testing, what you changed from the feedback, and why the app is ready. Approval usually
   takes up to 7 days.

**Organization** accounts are exempt. Check the current numbers in Play Console Help before
starting the test, because Google changes them.

## A.5 First production release (by hand)

1. **Closed testing → Releases → Promote release → Production**. No rebuild is needed.
2. Add release notes ("What's new"), up to 500 characters per language.
3. Pick a **staged rollout** percentage, for example 10% → 50% → 100% over a few days.
4. **Send changes for review.** After approval it goes live to that percentage. Watch
   **Android vitals** (crashes, ANRs) before raising the percentage.

A release can't be rolled back. You can only **halt** a rollout and ship a new release with a
higher `versionCode`.

## A.6 Ongoing Android requirements

- **Target API level**: from **31 August 2026**, new apps and updates must target **Android 16
  (API 36)**. Forge on Expo SDK 57 / React Native 0.86 already targets 36. Keep the Expo SDK
  updated each year (see the `expo-upgrade` skill) and the next requirement is covered too.
- **Large screens**: with API 36, apps can't lock orientation on screens 600dp and wider.
  `"orientation": "portrait"` is ignored on tablets and foldables, so check that layouts hold up
  in landscape there.
- Keep the **Data safety** form current whenever the backend starts storing new kinds of data.

---

# Part B: Apple App Store

EAS builds iOS apps in the cloud, so **you don't need a Mac**. Everything below works from
Linux.

## B.1 Accounts

1. **Apple Developer Program**: <https://developer.apple.com/programs/enroll/>, **US$99 per
   year**. Enrol as an individual (your legal name is shown as the seller) or as an
   organization (needs a D-U-N-S number, and the company name is shown). Approval takes 1–2
   days.
2. In **App Store Connect → Business**, accept the agreements and add **tax and banking**
   details. They're required even for a free app before it can be published in some regions.

## B.2 Code changes needed before the first iOS build

These are blocking. Without them, App Review rejects the app.

1. **Sign in with Apple (App Store Review Guideline 4.8).** Forge offers **Continue with
   Google**. An iOS app that offers a third-party or social login must also offer an
   equivalent privacy-focused login, and in practice that means **Sign in with Apple**:
   - Add `expo-apple-authentication` and the `usesAppleSignIn: true` iOS config.
   - Show the Apple button on iOS next to the Google button. Apple's button guidelines apply.
   - Backend: enable the Apple social provider in better-auth (`socialProviders.apple`). It
     needs a Services ID, Team ID, Key ID and a `.p8` key from the Apple Developer portal.
     Add `https://appleid.apple.com` to `trustedOrigins`.
   - On account deletion, also **revoke the Apple token** (Apple requires it for apps that
     use Sign in with Apple).
2. **Google sign-in on iOS.** Create an **iOS OAuth client** in Google Cloud for bundle ID
   `in.besaif.forge.fitness` and check that the `forge://` redirect works in an iOS build.
3. **`app.json` → `expo.ios`** additions:

   ```jsonc
   "ios": {
     "bundleIdentifier": "in.besaif.forge.fitness",
     "supportsTablet": false,          // true = iPad screenshots + iPad review too
     "usesAppleSignIn": true,
     "config": { "usesNonExemptEncryption": false }, // HTTPS only → skips the export-compliance question on every build
     "icon": { "light": "./assets/images/icon-light.png", "dark": "./assets/images/icon.png" }
   }
   ```

4. **Permission strings**: every iOS permission prompt needs a clear purpose string. The
   photo-library string is already set through the `expo-image-picker` plugin. Add a string
   for any permission you add later.
5. **Privacy manifest**: Expo modules ship their own `PrivacyInfo.xcprivacy`. If you add a
   library that uses "required reason" APIs and doesn't ship one, declare it in
   `ios.privacyManifests` in `app.json`.

## B.3 Create the app and credentials

```bash
eas build -p ios --profile production
```

The first time you run it interactively, EAS:

- asks you to log in with your Apple ID,
- registers the bundle ID and creates the **distribution certificate** and **provisioning
  profile**, then stores them on EAS,
- can create the app record in App Store Connect.

Then, for CI, create an **App Store Connect API key** so submissions run without your
password and without two-factor prompts:

```bash
eas credentials -p ios
# production → App Store Connect: Manage your API Key → Set up a new API key
```

(Or create it in App Store Connect → Users and Access → Integrations → **App Store Connect
API**, role **App Manager**, and upload the `.p8` to EAS.)

Add the App Store Connect app ID (App Store Connect → App Information → **Apple ID**, a
number) to `eas.json`:

```jsonc
"submit": {
  "production": {
    "android": { "track": "alpha", "releaseStatus": "completed" },
    "ios": { "ascAppId": "1234567890" }
  }
}
```

## B.4 TestFlight (the iOS equivalent of testing tracks)

```bash
eas submit -p ios --profile production --latest
```

uploads the build to App Store Connect. Processing takes 5–30 minutes. Then:

| | Internal testing | External testing |
| --- | --- | --- |
| Testers | Up to 100 members of your App Store Connect team | Up to 10,000 by email or public link |
| Review | None | **Beta App Review** for the first build of each version (about 1 day) |
| Build expiry | 90 days | 90 days |

Apple has **no 12-tester / 14-day rule**. You can go straight to App Store review.

## B.5 App Store listing (App Store Connect → Forge)

- **App Information**: name (30 chars), subtitle (30), category **Health & Fitness**, age
  rating questionnaire, **privacy policy URL**.
- **App Privacy** ("nutrition labels"): declare the same data as the Play Data safety form.
  Contact info (email, name) and Health & Fitness data are "linked to the user", used for
  app functionality, and **not used for tracking**.
- **Version page**:
  - Screenshots: the **6.9" iPhone** set is required (**1320 × 2868** portrait, 1 to 10
    images). Apple scales it down for smaller iPhones. If `supportsTablet` is true, you also
    need a **13" iPad** set (2064 × 2752). Sizes must match exactly. Check Apple's current
    "Screenshot specifications" page before exporting.
  - Description, keywords (100 chars), support URL (required), promotional text.
  - **App Review Information**: the same **demo account** as Google, a contact phone and
    email, and notes ("Sign in with the demo account; Google and Apple sign-in are also
    available").
- **Pricing and Availability**: Free, and the countries to publish in.

## B.6 Submit for review and release

1. On the version page, select the processed build → **Add for Review → Submit**.
   Review usually takes 24–48 hours.
2. Release options: **automatically after approval**, **manually**, or **phased release**
   (rolls out automatic updates over 7 days, 1% → 100%). Phased release is the iOS
   equivalent of a staged rollout.
3. Common Forge-specific rejection reasons to check first: missing Sign in with Apple
   (4.8), the demo account not working, account deletion not working (5.1.1(v)), and
   placeholder content.

---

# Part C: CI/CD

## C.1 Branch model

```
feature/* ──PR──▶ testing ──PR──▶ main ──tag v1.2.0──▶ stores (production)
                    │               │
       manual run ──┘               └── automatic: Closed testing (+ TestFlight)
       Internal testing
```

| Event | Workflow | Result |
| --- | --- | --- |
| `eas workflow:run .eas/workflows/build-testing.yml --ref testing` | `build-testing.yml` | .aab + .apk, .aab → Play **Internal testing** (`-F upload_to_play=false` to skip the upload) |
| Merge into `main` | `release-android.yml` | .aab + .apk, .aab → Play **Closed testing**, .apk → a **GitHub Release** (`forge-vX.Y.Z-<versionCode>`, pre-release, made by `scripts/github-release.mjs` with the `GH_RELEASE_TOKEN` EAS secret) |
| Push tag `v*` (C.4) | `store-release.yml` (to add) | Play **Production** (staged rollout) + **App Store Connect** |

Commits that only change `.md` files don't trigger the `main` release. Putting `[eas skip]` in a
commit message skips any push-triggered run.

## C.2 Branch protection (recommended)

GitHub → Settings → Branches → **Add rule** for `main`: require a pull request, and block
force pushes and deletions. Do the same for `testing` if others commit to it. Since every
merge to `main` now ships to testers, nothing should reach it without a PR.

## C.3 Add iOS to the `main` release

Once Part B works by hand, replace `.eas/workflows/release-android.yml` with
`.eas/workflows/release.yml`:

```yaml
name: Release (main → Closed testing + TestFlight)

on:
  push:
    branches: ['main']
    paths:
      - '**'
      - '!**/*.md'

concurrency:
  cancel_in_progress: true
  group: ${{ workflow.filename }}-${{ github.ref }}

jobs:
  checks:
    name: Type-check
    steps:
      - uses: eas/checkout
      - uses: eas/install_node_modules
      - name: TypeScript
        run: ./node_modules/.bin/tsc --noEmit

  build_android:
    name: Build Android .aab
    needs: [checks]
    type: build
    params:
      platform: android
      profile: production

  build_ios:
    name: Build iOS .ipa
    needs: [checks]
    type: build
    params:
      platform: ios
      profile: production

  submit_android:
    name: Upload to Google Play (Closed testing)
    needs: [build_android]
    type: submit
    params:
      profile: production
      build_id: ${{ needs.build_android.outputs.build_id }}

  submit_ios:
    name: Upload to TestFlight
    needs: [build_ios]
    type: submit
    params:
      profile: production
      build_id: ${{ needs.build_ios.outputs.build_id }}
```

This version drops the .apk build to save build credits (see C.6). Add the `build_apk` job back
from `release-android.yml` if you want an .apk on every merge.

To make every new TestFlight build go straight to a tester group, add `groups: ['Testers']`
to the `submit_ios` params, using the name of an internal group in App Store Connect.

## C.4 Automatic production releases (tag-based)

Production releases should be **deliberate**. Don't publish every merge to `main` to all users.
Tag a commit on `main` that has already been tested in closed testing / TestFlight instead.

**1. Add a `store` submit profile** to `eas.json`:

```jsonc
"submit": {
  "production": { ... },            // closed testing + TestFlight (unchanged)
  "testing":    { ... },            // internal testing (unchanged)
  "store": {
    "android": {
      "track": "production",
      "releaseStatus": "inProgress", // a staged rollout
      "rollout": 0.1                 // start at 10%; raise it in Play Console
    },
    "ios": { "ascAppId": "1234567890" }
  }
}
```

**2. Add `.eas/workflows/store-release.yml`:**

```yaml
name: Store release (tag v* → Production / App Store)

on:
  push:
    tags: ['v*']

jobs:
  checks:
    name: Type-check
    steps:
      - uses: eas/checkout
      - uses: eas/install_node_modules
      - name: TypeScript
        run: ./node_modules/.bin/tsc --noEmit

  build_android:
    name: Build Android .aab
    needs: [checks]
    type: build
    params:
      platform: android
      profile: production

  build_ios:
    name: Build iOS .ipa
    needs: [checks]
    type: build
    params:
      platform: ios
      profile: production

  submit_android:
    name: Google Play production (staged rollout)
    needs: [build_android]
    type: submit
    params:
      profile: store
      build_id: ${{ needs.build_android.outputs.build_id }}

  submit_ios:
    name: Upload to App Store Connect
    needs: [build_ios]
    type: submit
    params:
      profile: store
      build_id: ${{ needs.build_ios.outputs.build_id }}
```

Validate both files before committing:

```bash
npx -y eas-cli@latest workflow:validate .eas/workflows/release.yml --non-interactive
npx -y eas-cli@latest workflow:validate .eas/workflows/store-release.yml --non-interactive
```

**3. To release:**

```bash
# bump "version" in app.json (e.g. 1.0.0 → 1.1.0) on testing, merge to main, let closed testing run
git switch main && git pull
git tag v1.1.0
git push origin v1.1.0
```

**What is and isn't automatic:**

| Step | Android | iOS |
| --- | --- | --- |
| Build + upload | Automatic | Automatic |
| Store review | Google reviews it automatically, and it goes live to 10% after approval | You click **Add for Review → Submit** in App Store Connect. EAS Submit only uploads; it doesn't submit for review |
| Rollout to 100% | Raise the percentage in Play Console | Phased release takes 7 days automatically, or release to everyone |

Production access (A.4) must be granted before the Android production submission can succeed.

**Alternative that saves builds:** the tag workflow above rebuilds an app that closed testing
already has. To ship the *exact* tested binary instead, promote it by hand: Play Console
**Promote release** from Closed testing (A.5), and in App Store Connect select the existing
TestFlight build for the new version. That costs no build credits and doesn't need the tag
workflow.

## C.5 Versions

| Field | Where it's set | Who changes it |
| --- | --- | --- |
| `version` (users see "1.1.0") | `app.json` → `expo.version` | **You**, once per store release. Use semver: patch = fixes, minor = features |
| Android `versionCode` / iOS `buildNumber` | Stored on EAS (`appVersionSource: "remote"`) | EAS, +1 on every `production` build (`autoIncrement: true`) |

- Every upload to Play needs a higher `versionCode` than any earlier upload; EAS handles that.
- The App Store needs a **new `version`** for each release submitted for review. TestFlight
  builds within one version only need a new `buildNumber`.
- If you ever upload a build made outside EAS: `eas build:version:set` to move the counter
  past it.

## C.6 Build budget (Expo free plan)

| Limit | Free plan |
| --- | --- |
| Android builds | 15 per month |
| iOS builds | 15 per month |
| Workflow (CI) minutes | 60 per month (type-check jobs use about 1–2 minutes each) |
| Queue | Low priority, can wait 90+ minutes at peak times |
| Build timeout | 45 minutes |

What each run costs:

| Run | Android | iOS |
| --- | --- | --- |
| Merge to `main` (current: .aab + .apk) | 2 | 0 |
| Merge to `main` (C.3 version: .aab + .ipa) | 1 | 1 |
| Testing run (.aab + .apk) | 2 | 0 |
| Tag release (C.4) | 1 | 1 |

To stretch the budget:

- Build the .apk locally for free: `eas build -p android --profile production-apk --local`.
  It needs JDK 17 + Android SDK (see the `android-local-build` setup) and uses the same EAS
  keystore.
- Promote releases instead of rebuilding them (C.4 alternative).
- Batch changes on `testing` and merge to `main` less often.

Check current limits at <https://expo.dev/pricing>. The Starter plan adds credits and
pay-as-you-go builds.

## C.7 Over-the-air updates (optional)

Most Forge changes are JavaScript only. **EAS Update** can send those to installed apps in
minutes, with no store review:

1. `npx expo install expo-updates && eas update:configure`
2. Set `"runtimeVersion": { "policy": "fingerprint" }` in `app.json` and a `channel` on each
   build profile (`production` → `production`).
3. In the `main` workflow, add a `fingerprint` job. Build and submit only when the native
   fingerprint changed; otherwise run an `update` job on the `production` channel.

Both stores allow OTA updates for bug fixes and small changes. A change to the app's core
purpose or features still needs a store release (Apple guideline 3.3.1(B)/2.5.2, Google's
Device and Network Abuse policy). Set this up only after the store pipeline is stable.

---

# Part D: Release checklist

**Every change**

1. [ ] Work on a feature branch → PR into `testing`
2. [ ] `bunx tsc --noEmit` and `npx expo lint` locally
3. [ ] Optional: `eas workflow:run .eas/workflows/build-testing.yml --ref testing` → test from
       Internal testing / the .apk
4. [ ] Backend first: if the app needs new endpoints or tables, deploy `forge-backend` (and run
       migrations) **before** merging the app. Keep the API backward-compatible, because old
       app versions stay installed for weeks
5. [ ] PR `testing` → `main`, merge → watch expo.dev → Workflows → closed testing / TestFlight

**Every store (production) release**

1. [ ] Bump `version` in `app.json`
2. [ ] Testers have used the closed-testing / TestFlight build for long enough
3. [ ] Update release notes (Play "What's new", App Store "What's New in This Version")
4. [ ] Update screenshots, Data safety and App Privacy if the UI or data collection changed
5. [ ] Tag `vX.Y.Z` (C.4) **or** promote by hand (A.5 / B.6)
6. [ ] iOS: **Add for Review → Submit** in App Store Connect
7. [ ] Watch Android vitals / Xcode Organizer crashes, then raise the rollout

---

# Part E: Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Workflow doesn't start after a merge | Only `.md` files changed, the commit has `[eas skip]`, or the GitHub connection was removed (expo.dev → Project settings → GitHub) |
| Type-check: `bunx: command not found` | Custom job steps don't have Bun on PATH. Use `./node_modules/.bin/tsc` (already fixed) |
| Type-check: `TS2882 … '@/global.css'` | `expo-env.d.ts` is gitignored. `src/expo-types.d.ts` provides the same reference (already fixed) |
| Submit: `The caller does not have permission` | Service account not invited in Play Console, missing "Release apps to testing tracks", or the invite is still propagating (can take hours) |
| Submit: `Google Play Android Developer API has not been used…` | Enable the API in Google Cloud project `crucial-bucksaw-398209` |
| Submit: `Package not found` | No .aab has ever been uploaded by hand. Upload one in Play Console first |
| Submit: `Only releases with status draft may be created on draft app` | Use `releaseStatus: "draft"` until the first release has been reviewed (A.3) |
| Submit: `Version code N has already been used` | A build was uploaded outside EAS. Run `eas build:version:set` with a higher number |
| Production submit rejected | Production access not granted yet (A.4) or the App content declarations are incomplete (A.2) |
| iOS submit asks for a password / 2FA in CI | No App Store Connect API key on EAS (B.3) |
| iOS build: missing export compliance | Add `ios.config.usesNonExemptEncryption: false` (B.2) |
| App Review 4.8 rejection | Sign in with Apple missing next to Google sign-in (B.2) |

## Links

- Play Console: <https://play.google.com/console>
- Play Console Help, app testing requirements for new personal accounts: search "testing
  requirements for new personal developer accounts" in Play Console Help
- Target API requirements: <https://developer.android.com/google/play/requirements/target-sdk>
- App Store Connect: <https://appstoreconnect.apple.com>
- App Review Guidelines: <https://developer.apple.com/app-store/review/guidelines/>
- Screenshot specifications: <https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications>
- EAS Workflows: <https://docs.expo.dev/eas/workflows/get-started/>
- EAS Submit (Android / iOS): <https://docs.expo.dev/submit/introduction/>
- Expo pricing: <https://expo.dev/pricing>
