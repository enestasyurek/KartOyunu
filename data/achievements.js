export const ACHIEVEMENTS_LIST = [
    // Temel Oyun
    { id: 'first_game', name: 'Acemi Oyuncu', description: 'İlk oyununu tamamla.', unlocked: false },
    { id: 'first_win', name: 'İlk Zafer!', description: 'Bir oyunu kazan (hedef skora ulaş).', unlocked: false },
    { id: 'high_scorer', name: 'Skor Canavarı', description: 'Tek bir oyunda 30 veya daha fazla puana ulaş.', unlocked: false },
    { id: 'black_card_victim', name: 'Kara Talih', description: 'Oyun sonunda Siyah Kart cezası çek.', unlocked: false },

    // Karar Mekanizmaları
    { id: 'brave_soul', name: 'Cesur Yürek', description: 'Tek bir oyunda 5 kez "Ben Yaparım" seçeneğini kullan.', unlocked: false },
    { id: 'delegator_master', name: 'Görev Kaçağı', description: 'Tek bir oyunda 3 kez "O Yapsın" diyerek görev devret.', unlocked: false },

    // Görev Başarıları
    { id: 'blue_master', name: 'Mavi Uzman', description: 'Devredilen bir görevin Mavi Kartını başarıyla tamamlayarak 10 puan kazan.', unlocked: false },
    { id: 'red_master', name: 'Kırmızı Usta', description: 'Sana devredilen bir Kırmızı Kart görevini başarıyla tamamla.', unlocked: false },
    { id: 'voted_task_win', name: 'Halkın Seçimi', description: 'Oylamaya sunulan bir görevi oyuncuların oylarıyla başarıyla tamamla.', unlocked: false },

    // Kurulum ve Çeşitlilik
    { id: 'custom_task_added', name: 'Yaratıcı Zihin', description: 'Oyuna en az bir tane özel görev ekleyerek başla.', unlocked: false },
    { id: 'full_house', name: 'Kalabalık Eğlence', description: 'Oyunu 6 oyuncu ile başlat.', unlocked: false }, // Yeni başarım örneği
    // TODO: Zorluk seviyesi, belirli kartları çekme vb. için başarımlar eklenebilir
];

// Başlangıç state'i için sadece ID'leri ve unlocked/notified durumunu alalım
// Notified: Kullanıcıya bildirimi gösterildi mi? (örn. Alert)
export const initialAchievementsState = ACHIEVEMENTS_LIST.reduce((acc, ach) => {
    acc[ach.id] = { unlocked: false, notified: false };
    return acc;
}, {});

// Başarım detaylarını ID ile almak için helper fonksiyon
export const getAchievementDetails = (id) => {
    if (!id) return null;
    return ACHIEVEMENTS_LIST.find(ach => ach.id === id);
};