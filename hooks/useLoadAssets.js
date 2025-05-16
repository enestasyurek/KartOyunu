// hooks/useLoadAssets.js
import { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons'; // Example: Load icon fonts too

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const useLoadAssets = () => {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [fontError, setFontError] = useState(null);

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        console.log("Loading assets...");
        // Load fonts
        await Font.loadAsync({
          // Replace with your actual font names and files
          'Oswald-Regular': require('../assets/fonts/Oswald-Regular.ttf'),
          'Oswald-Bold': require('../assets/fonts/Oswald-Bold.ttf'),
          // Load icon fonts if you use them directly
          ...Ionicons.font,
        });
        console.log("Fonts loaded.");

        // Example: Load other assets like sounds (useSounds hook handles this now)
        // await loadSoundsAsync(); // If you had a separate asset loading function

        // Example: Prepare initial data if needed (e.g., load from AsyncStorage)
        // await loadInitialData();

      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn("Error loading assets:", e);
        setFontError(e); // Store font loading error
      } finally {
        console.log("Asset loading finished.");
        setLoadingComplete(true);
        SplashScreen.hideAsync(); // Hide the splash screen
      }
    }

    loadResourcesAndDataAsync();
  }, []); // Run only once

  return { isLoadingComplete, fontError };
};