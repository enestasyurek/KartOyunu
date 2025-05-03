// data/achievements.js
export const ACHIEVEMENTS_LIST = [
    { id: 'first_game', name: 'Hoş Geldin!', description: 'İlk oyununu tamamla.', unlocked: false },
    { id: 'first_win', name: 'İlk Zafer!', description: 'Bir oyunu kazan.', unlocked: false },
    { id: 'delegator_master', name: 'Görev Kaçağı', description: 'Bir oyunda 3 kez "O Yapsın" de.', unlocked: false },
    { id: 'brave_soul', name: 'Cesur Yürek', description: 'Bir oyunda 5 kez "Ben Yaparım" de.', unlocked: false },
    { id: 'high_scorer', name: 'Skor Canavarı', description: 'Bir oyunda 30 puana ulaş.', unlocked: false },
    { id: 'blue_master', name: 'Mavi Uzman', description: 'Bir "O Yapsın" durumunda 10 puan kazan.', unlocked: false },
    { id: 'red_master', name: 'Kırmızı Uzman', description: '"O Yapsın" sonrası kırmızı kart görevini tamamla.', unlocked: false },
    { id: 'black_card_victim', name: 'Kara Talih', description: 'Siyah kart cezası çek.', unlocked: false },
    { id: 'custom_task_added', name: 'Yaratıcı Zihin', description: 'Oyuna özel görev ekle.', unlocked: false },
    { id: 'voted_task_win', name: 'Halkın Seçimi', description: 'Oylama ile bir görevi başarıyla tamamla.', unlocked: false },
    // Daha fazla başarım eklenebilir...
];

// Başlangıç state'i için sadece ID'leri ve unlocked durumunu alalım
export const initialAchievementsState = ACHIEVEMENTS_LIST.reduce((acc, ach) => {
    acc[ach.id] = { unlocked: false, notified: false }; // notified: kullanıcıya gösterildi mi?
    return acc;
}, {});

// Başarım detaylarını ID ile almak için helper
export const getAchievementDetails = (id) => {
    return ACHIEVEMENTS_LIST.find(ach => ach.id === id);
}