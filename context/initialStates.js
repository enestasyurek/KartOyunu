// context/initialStates.js
import { initialAchievementsState as initialAchStateFromData } from '../data/achievements';

export const initialStatsState = {
    gamesPlayed: 0, totalScoreAccumulated: 0, tasksCompleted: {},
    tasksDelegated: {}, wins: {}, blackCardsDrawn: {},
    votableTasksWon: {}, customTasksAdded: 0,
};

export const initialGameState = {
    players: [], currentPlayerIndex: 0, redDeck: [], blueDeck: [], blackDeck: [],
    currentRedCard: null, currentBlueCardInfo: null,
    gamePhase: 'setup', // Oyun başlangıç fazı
    revealingPlayerIndex: 0, selectedPlayerForTask: null,
    message: '', lastActionMessage: '',
    votingInfo: null,
    achievements: initialAchStateFromData, // Başlangıç başarım durumu
    stats: initialStatsState, // Başlangıç istatistik durumu
    pendingAchievementNotifications: [],
};