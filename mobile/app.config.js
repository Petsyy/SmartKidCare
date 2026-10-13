/**
 * @param {{ config: import("@expo/config-types").ExpoConfig }} context
 * @returns {import("@expo/config-types").ExpoConfig}
 */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
});
