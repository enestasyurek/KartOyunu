// constants/avatars.js
export const AVATARS = [
    '😀', '😎', '🤔', '🥳', '👽', '🤖', '🎃', '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🦁', '🐷',
    '🐙', '🐵', '🦄', '🐲', '👻', '🥶', '🤠', '🤡', '😈'
  ]; 
  
  // Helper function to get a random avatar, avoiding duplicates if possible
  export const getRandomAvatar = (existingAvatars = []) => {
    const availableAvatars = AVATARS.filter(a => !existingAvatars.includes(a));
    if (availableAvatars.length === 0) {
      // Fallback if all avatars are used (unlikely with many avatars)
      console.warn("All avatars used, reusing randomly.");
      return AVATARS[Math.floor(Math.random() * AVATARS.length)];
    }
    const randomIndex = Math.floor(Math.random() * availableAvatars.length);
    return availableAvatars[randomIndex];
  };