// Expo's Metro config plus the debug IDs Sentry needs to match crash reports to source maps.
// https://docs.sentry.io/platforms/react-native/manual-setup/expo/
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
