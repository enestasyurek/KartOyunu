import { Platform } from 'react-native';

// Only import Haptics if not on web
let Haptics;
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics');
}

/**
 * Platform-safe haptics hook that checks if haptics is available
 * before attempting to use it (particularly for web environment)
 */
const useHaptics = () => {
  // Function to check if haptics is available
  const isHapticsAvailable = () => {
    return Platform.OS !== 'web' && Haptics !== undefined;
  };

  // Safe wrapper for impactAsync
  const impactAsync = async (style) => {
    if (isHapticsAvailable()) {
      try {
        // Default to Medium if style not provided
        const feedbackStyle = style || Haptics.ImpactFeedbackStyle.Medium;
        await Haptics.impactAsync(feedbackStyle);
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
  };

  // Safe wrapper for notificationAsync
  const notificationAsync = async (type) => {
    if (isHapticsAvailable()) {
      try {
        // Default to Success if type not provided
        const feedbackType = type || Haptics.NotificationFeedbackType.Success;
        await Haptics.notificationAsync(feedbackType);
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
  };

  // Safe wrapper for selectionAsync
  const selectionAsync = async () => {
    if (isHapticsAvailable()) {
      try {
        await Haptics.selectionAsync();
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
  };

  return {
    impactAsync,
    notificationAsync,
    selectionAsync,
    isHapticsAvailable
  };
};

export default useHaptics; 