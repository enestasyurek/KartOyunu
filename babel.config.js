module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // Reanimated veya diğer plug‑inleriniz
        'react-native-reanimated/plugin'
      ],
    };
  };
  