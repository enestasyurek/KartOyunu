import { initialAchievementsState as initialAchStateFromData } from '../data/achievements';

// Başlangıç İstatistikleri (Oyunlar arası korunacak veya sıfırlanacaklar ayrılabilir)
export const initialStatsState = {
    // --- Kümülatif (Oyunlar Arası Korunan) ---
    gamesPlayed: 0,              // Toplam oynanan oyun sayısı
    totalScoreAccumulated: 0,    // Tüm oyunlarda kazanılan toplam puan
    wins: {},                    // Oyuncu bazında kazanma sayıları (playerId: count)
    customTasksAdded: 0,         // Toplam eklenen özel görev sayısı
    // Başarım bazlı istatistikler (örn: 'first_win' kilidini açan kişi) de buraya eklenebilir.

    // --- Oyun Özel (Her Yeni Oyunda Sıfırlanabilir - Reducer'da handle edilir) ---
    tasksCompleted: {},          // Bu oyunda oyuncuların tamamladığı görev sayısı (playerId: count)
    tasksDelegated: {},          // Bu oyunda oyuncuların devrettiği görev sayısı (playerId: count)
    blackCardsDrawn: {},         // Bu oyunda oyuncuların çektiği siyah kart sayısı (playerId: count)
    votableTasksWon: {},         // Bu oyunda oyuncuların kazandığı oylanabilir görev sayısı (playerId: count)
};

// Başlangıç Oyun State'i (Her oyun başında veya restart'ta kullanılır)
export const initialGameState = {
    players: [],                 // Oyuncu listesi ( { id, name, score, blueCard, avatarId } )
    currentPlayerIndex: 0,       // Sıradaki oyuncunun index'i
    redDeck: [],                 // Kırmızı kart destesi
    blueDeck: [],                // Mavi kart destesi
    blackDeck: [],               // Siyah kart destesi

    currentRedCard: null,        // Şu an aktif olan kırmızı kart objesi { text, id, votable, isCustom, isVisible }
    currentBlueCardInfo: null,   // Gösterilen mavi kart bilgisi { text, isVisible, forPlayerId, forPlayerName }

    gamePhase: 'setup',          // Mevcut oyun aşaması ('setup', 'initialBlueCardReveal', 'playing', 'decision', 'selectingPlayer', 'revealingBlueCard', 'redCardForSelected', 'showingNewBlueCard', 'voting', 'processingVote', 'ending', 'assigningBlackCard', 'ended')
    revealingPlayerIndex: 0,     // 'initialBlueCardReveal' fazında hangi oyuncunun kartına baktığı
    selectedPlayerForTask: null, // 'O Yapsın' için seçilen oyuncunun ID'si / Siyah kartı çekecek kişinin ID'si
    votingInfo: null,            // Aktif oylama bilgileri { taskId, taskText, performerId, votes: {playerId: 'yes'/'no'/null}, wasDelegated, performerName } // nextTurnLogic kaldırıldı, wasDelegated eklendi

    message: 'Oyuna Hoş Geldiniz!', // Oyuncuya gösterilecek ana mesaj
    lastActionMessage: '',       // Gerçekleşen son aksiyonu özetleyen kısa mesaj (örn: "+5 Puan!")

    // Başarımlar ve İstatistikler (Provider seviyesinde yönetilir, başlangıç değerleri buradan alınır)
    achievements: initialAchStateFromData, // Başarım durumu ({ achievementId: { unlocked, notified } })
    stats: initialStatsState,           // İstatistik durumu
    pendingAchievementNotifications: [], // Kullanıcıya gösterilmeyi bekleyen başarımlar (ID listesi)
};