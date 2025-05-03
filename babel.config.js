// --- START OF FILE babel.config.js ---

module.exports = function (api) {
    api.cache(true);
    return {
      // Preset for Expo projects, includes React Native and common transformations
      presets: ['babel-preset-expo'],
      plugins: [
        // Plugin for React Native Reanimated v2+ (required for Moti)
        // !!! IMPORTANT: This plugin MUST be listed LAST. !!!
        'react-native-reanimated/plugin',
      ],
    };
  };
// --- END OF FILE babel.config.js ---