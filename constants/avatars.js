export const AVATARS = [
    '😀', '😂', '😊', '😎', '🤩', '🤔', '🤫', '🥳', '👽', '🤖', '👾', '🎃', '👻', '🧙', '🧛',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
    '🦄', '🐲', '🌵', '🍄', '⭐', '🌙', '🔥', '💧', '💨', '💎', '💡', '💣', '🎉', '💯', '✅',
    '🥶', '🤠', '🤡', '😈', '😇', '👀', '🤝', '🧠', '👑', '🎩', '🎈'
  ];
  
  // Helper function to get a random avatar, avoiding duplicates if possible
  export const getRandomAvatar = (existingAvatars = []) => {
    // Tüm avatarlar kullanılmışsa veya mevcut liste boşsa tüm listeyi kullan
    const availableAvatars = AVATARS.filter(a => !existingAvatars.includes(a));
  
    if (availableAvatars.length === 0) {
      // Eğer hepsi kullanıldıysa, tüm listeyi tekrar kullanılabilir yap (nadiren olur)
      console.warn("All avatars used, selecting randomly from the full list.");
      const randomIndex = Math.floor(Math.random() * AVATARS.length);
      return AVATARS[randomIndex];
    }
  
    // Kullanılabilir olanlardan rastgele seç
    const randomIndex = Math.floor(Math.random() * availableAvatars.length);
    return availableAvatars[randomIndex];
  };
  // --- END OF FILE avatars.js ---