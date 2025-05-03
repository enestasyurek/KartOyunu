// hooks/useSounds.js
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

// !!! IMPORTANT: Replace these paths with your actual sound files in assets/sounds !!!
const soundFiles = {
  buttonClick: require('../assets/sounds/clickbutton.mp3'), // Example path
  cardDraw: require('../assets/sounds/card.mp3'),       // Example path
  scorePoint: require('../assets/sounds/point.mp3'),    // Example path
  turnChange: require('../assets/sounds/next.mp3'),   // Example path
  gameEnd: require('../assets/sounds/endgame.mp3'),         // Example path
  error: require('../assets/sounds/clickbutton.mp3'),             // Example path
};
// Make sure you have an 'assets/sounds' folder with these (or your own) sound files.

export const useSounds = () => {
  const sounds = useRef({}); // To store loaded sound objects

  useEffect(() => {
    const loadSounds = async () => {
      console.log('Loading sounds...');
      // Allow audio playback in silent mode on iOS
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      // Load each sound file
      for (const key in soundFiles) {
        try {
          // Check if file exists (require throws error if not)
          const resource = soundFiles[key];
          if (!resource) {
              console.warn(`Sound file not found for key: ${key}`);
              sounds.current[key] = null;
              continue;
          }
          const { sound } = await Audio.Sound.createAsync(resource);
          sounds.current[key] = sound;
          console.log(`Sound loaded: ${key}`);
        } catch (error) {
          console.error(`Error loading sound ${key}:`, error);
          sounds.current[key] = null; // Assign null if loading fails
        }
      }
      console.log('Sound loading complete.');
    };

    loadSounds();

    // Cleanup function to unload sounds when the hook is unmounted
    return () => {
      console.log('Unloading sounds...');
      Object.values(sounds.current).forEach(sound => {
        if (sound && typeof sound.unloadAsync === 'function') {
          sound.unloadAsync().catch(e => console.log("Error unloading sound:", e));
        }
      });
      console.log('Sounds unloaded.');
    };
  }, []); // Run only once on mount

  // Function to play a sound by its key name
  const playSound = async (soundName) => {
    const soundObject = sounds.current[soundName];
    if (soundObject) {
      try {
        // Ensure the sound is ready and plays from the beginning
        await soundObject.replayAsync();
        // console.log(`Playing sound: ${soundName}`); // Optional: uncomment for debugging
      } catch (error) {
        // Catch specific errors like interrupted playback
        if (error.message.includes('Player does not exist')) {
             console.warn(`Sound object for ${soundName} might have been unloaded.`);
             // Optionally try reloading the sound here if needed
        } else {
            console.error(`Error playing sound ${soundName}:`, error);
        }
      }
    } else {
      console.warn(`Sound not found or not loaded: ${soundName}`);
    }
  };

  return playSound; // Return the playSound function for use in components/context
};