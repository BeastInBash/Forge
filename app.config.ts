import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json. Firebase's google-services.json (Android push) is kept out of the public
 * repo: EAS builds get it from the GOOGLE_SERVICES_JSON secret file variable, which holds the
 * file's path on the builder; local builds use the git-ignored copy in the project root.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
