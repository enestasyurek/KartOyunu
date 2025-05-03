// context/gameReducer.js
import { shuffleDeck, cardData } from '../data/cards';
import { AVATARS, getRandomAvatar } from '../constants/avatars';
import { initialGameState } from './initialStates'; // initialGameState import edildi

// Helper: Ensure card is an object with necessary properties
const ensureCardObject = (card) => { if (!card) return null; if (typeof card === 'string') { return { text: card, isVotable: false, id: card }; } return { ...card, id: card.id || card.text || `card_${Math.random()}`, isVotable: !!card.votable, isVisible: card.isVisible !== undefined ? card.isVisible : true }; };
// Helper: Draw card from a deck (pure function)
const drawCardPure = (deck) => { if (!deck || deck.length === 0) { return { card: null, remainingDeck: [] }; } const newDeck = [...deck]; const card = newDeck.pop(); return { card: ensureCardObject(card), remainingDeck: newDeck }; };

// --- Reducer Function ---
export const gameReducer = (state, action) => {
    console.log(`--- Reducer Action: ${action.type} ---`, action.payload || '');

    switch (action.type) {
        case 'SETUP_GAME': {
            const { playerNames, customTasks } = action.payload;
            try {
                let assignedAvatars = [];
                const initialPlayers = playerNames.map((name, index) => { const avatarId = getRandomAvatar(assignedAvatars); assignedAvatars.push(avatarId); return { id: index, name: name || `Oyuncu ${index + 1}`, score: 0, blueCard: null, avatarId: avatarId }; });
                let initialBlueDeck = shuffleDeck(cardData.mavi);
                let initialRedDeckCards = cardData.kırmızı.map(card => ensureCardObject(card));
                let initialBlackDeck = shuffleDeck(cardData.siyah);
                const formattedCustomTasks = customTasks.map((task, index) => ({ text: task, isCustom: true, id: `custom_${index}`, isVotable: false }));
                let combinedRedDeck = shuffleDeck([...initialRedDeckCards, ...formattedCustomTasks]);
                initialPlayers.forEach(player => { player.blueCard = initialBlueDeck.pop() || "Deste Bitti!"; });
                return {
                    ...state, // Keep history
                    players: initialPlayers, currentPlayerIndex: 0, redDeck: combinedRedDeck, blueDeck: initialBlueDeck, blackDeck: initialBlackDeck,
                    currentRedCard: null, currentBlueCardInfo: null, gamePhase: 'initialBlueCardReveal', // <-- START PHASE
                    revealingPlayerIndex: 0, selectedPlayerForTask: null, message: `${initialPlayers[0]?.name || ''}, sıra sende. Mavi kartına bak.`, lastActionMessage: '',
                    votingInfo: null, pendingAchievementNotifications: [],
                    stats: { ...state.stats, tasksCompleted: {}, tasksDelegated: {}, blackCardsDrawn: {}, votableTasksWon: {}, customTasksAdded: (state.stats.customTasksAdded || 0) + customTasks.length }
                };
            } catch (error) { console.error("Error during SETUP_GAME reducer:", error); return { ...state, gamePhase: 'setup', message: "Oyun kurulumunda hata!" }; }
        }
        case 'SHOW_INITIAL_BLUE_CARD': { const currentPlayer = state.players[state.revealingPlayerIndex]; if (!currentPlayer || !currentPlayer.blueCard || currentPlayer.blueCard === "Deste Bitti!") { return state; } return { ...state, currentBlueCardInfo: { text: currentPlayer.blueCard, isVisible: true, forPlayerName: currentPlayer.name, forPlayerId: currentPlayer.id }, message: `Mavi Kartın:\n(Kapatıp telefonu sıradakine ver.)` }; }
        case 'HIDE_INITIAL_BLUE_CARD_AND_PROCEED': { const nextRevealingIndex = state.revealingPlayerIndex + 1; if (nextRevealingIndex < state.players.length) { const nextPlayer = state.players[nextRevealingIndex]; return { ...state, currentBlueCardInfo: null, revealingPlayerIndex: nextRevealingIndex, message: `${nextPlayer?.name || ''}, sıra sende. Mavi kartına bak.`, }; } else { return { ...state, currentBlueCardInfo: null, gamePhase: 'playing', revealingPlayerIndex: 0, message: `${state.players[state.currentPlayerIndex]?.name || ''}, sıra sende! Kırmızı kart çek.`, }; } }
        case 'DRAW_RED_CARD': { const { card, remainingDeck } = drawCardPure(state.redDeck); return { ...state, currentRedCard: card ? { ...card, isVisible: true } : null, redDeck: remainingDeck, message: card ? `Yeni Görev:` : "Kırmızı kart destesi bitti!", gamePhase: card ? 'decision' : state.gamePhase, lastActionMessage: '', currentBlueCardInfo: null }; }
        case 'START_DELEGATION': { return { ...state, gamePhase: 'selectingPlayer', message: 'Görevi kim yapsın?', lastActionMessage: '' }; }
        case 'SELECT_PLAYER_FOR_TASK': { const { selectedPlayerId } = action.payload; const selectedPlayer = state.players.find(p => p.id === selectedPlayerId); const currentPlayer = state.players[state.currentPlayerIndex]; if (!selectedPlayer || !currentPlayer || !selectedPlayer.blueCard || selectedPlayer.blueCard === "Deste Bitti!") { return { ...state, message: "Geçerli bir oyuncu seçilemedi veya mavi kartı yok.", gamePhase: 'decision' }; } return { ...state, selectedPlayerForTask: selectedPlayerId, gamePhase: 'revealingBlueCard', currentBlueCardInfo: { text: selectedPlayer.blueCard, isVisible: true, forPlayerName: selectedPlayer.name, forPlayerId: selectedPlayer.id }, currentRedCard: state.currentRedCard ? { ...state.currentRedCard, isVisible: false } : null, message: `${currentPlayer.name}, ${selectedPlayer.name}'nin mavi kart görevini yapmalısın:`, lastActionMessage: '', }; }
        case 'CANCEL_SELECTION_RETURN_TO_DECISION': { return { ...state, gamePhase: 'decision', message: `Görev:\n"${state.currentRedCard?.text || ''}"`, selectedPlayerForTask: null, currentBlueCardInfo: null, currentRedCard: state.currentRedCard ? { ...state.currentRedCard, isVisible: true } : null,}; }
        case 'COMPLETE_TASK_DIRECTLY': { const { playerId, points, message: customMessage, lastMessage: customLastMessage } = action.payload; const playerIndex = state.players.findIndex(p => p.id === playerId); if (playerIndex === -1) return state; const updatedPlayers = state.players.map((p, index) => index === playerIndex ? { ...p, score: (p.score || 0) + points } : p); const playerName = updatedPlayers[playerIndex].name; return { ...state, players: updatedPlayers, currentRedCard: null, currentBlueCardInfo: null, message: customMessage || "Görev tamamlandı!", lastActionMessage: customLastMessage || `${playerName} +${points} Puan!` }; }
        case 'DELEGATOR_COMPLETE_BLUE': { const delegatorId = state.currentPlayerIndex; const selectedPlayer = state.players.find(p => p.id === state.selectedPlayerForTask); const delegator = state.players[delegatorId]; if (!selectedPlayer || !delegator) return state; const updatedPlayers = state.players.map(p => p.id === delegatorId ? { ...p, score: (p.score || 0) + 10 } : p); return { ...state, players: updatedPlayers, gamePhase: 'redCardForSelected', currentBlueCardInfo: null, currentRedCard: state.currentRedCard ? { ...state.currentRedCard, isVisible: true } : null, message: `Şimdi ${selectedPlayer.name}, sıradaki kırmızı kart görevini yapmalı:`, lastActionMessage: `${delegator.name} +10 Puan!`, }; }
         case 'DRAW_NEW_BLUE_CARD': { const { playerId } = action.payload; const playerIndex = state.players.findIndex(p => p.id === playerId); if (playerIndex === -1) return state; const { card: newBlueCardText, remainingDeck: newBlueDeck } = drawCardPure(state.blueDeck); const drawnCardText = newBlueCardText?.text || "Deste Bitti!"; const updatedPlayers = state.players.map((p, index) => index === playerIndex ? { ...p, blueCard: drawnCardText } : p); return { ...state, players: updatedPlayers, blueDeck: newBlueDeck, /* message updated by action if needed */ }; }
        case 'CONFIRM_CLOSE_NEW_BLUE_CARD': { return { ...state, currentBlueCardInfo: null, message: `Kart kapatıldı.`, lastActionMessage: '' }; }
        case 'START_VOTING': { const { taskInfo, performerId, nextTurnLogic } = action.payload; const initialVotes = {}; state.players.forEach(p => { if (p.id !== performerId) { initialVotes[p.id] = null; } }); const performer = state.players.find(p => p.id === performerId); return { ...state, gamePhase: 'voting', votingInfo: { ...taskInfo, performerId: performerId, votes: initialVotes, nextTurnLogic: nextTurnLogic }, currentRedCard: null, message: `${performer?.name || ''} görevi yaptı mı?\n"${taskInfo.taskText}"\nDiğer oyuncular oy versin!`, lastActionMessage: '', }; }
        case 'CAST_VOTE': { const { voterId, vote } = action.payload; if (!state.votingInfo || state.votingInfo.votes[voterId] !== null) return state; const newVotes = { ...state.votingInfo.votes, [voterId]: vote }; const allVoted = Object.values(newVotes).every(v => v !== null); const voters = state.players.filter(p => p.id !== state.votingInfo?.performerId); const votedCount = Object.values(newVotes).filter(v => v !== null).length; const remainingCount = voters.length - votedCount; const newMessage = allVoted ? "Oylama bitti, sonuç bekleniyor..." : `${votedCount}/${voters.length} oy kullanıldı. ${remainingCount} kişi bekleniyor...`; return { ...state, votingInfo: { ...state.votingInfo, votes: newVotes }, message: newMessage /* phase updated by action creator */ }; }
        case 'PROCESS_VOTE_RESULT': { const { success, yesVotes, noVotes, performerId, points } = action.payload; const performer = state.players.find(p => p.id === performerId); const message = success ? `Oylama Sonucu: Başarılı! (${yesVotes} Evet / ${noVotes} Hayır)` : `Oylama Sonucu: Başarısız! (${yesVotes} Evet / ${noVotes} Hayır)`; const lastAction = success ? `${performer?.name || ''} +${points} Puan!` : `${performer?.name || ''} puan kazanamadı.`; let updatedPlayers = state.players; if (success && performer) { updatedPlayers = state.players.map(p => p.id === performerId ? {...p, score: (p.score || 0) + points} : p); } return { ...state, players: updatedPlayers, gamePhase: 'playing', votingInfo: null, message: message, lastActionMessage: lastAction, selectedPlayerForTask: null, }; }
        case 'PASS_TURN': {
            const { playerIndex } = action.payload;
            const currentIndex = playerIndex !== undefined ? playerIndex : state.currentPlayerIndex;
            // Winner check moved to useEffect in Provider
            if (state.gamePhase === 'ended' || state.gamePhase === 'assigningBlackCard' || state.gamePhase === 'ending') { return state; }
            const nextPlayerIndex = (currentIndex + 1) % state.players.length;
            const nextPlayer = state.players[nextPlayerIndex];
            return { ...state, currentPlayerIndex: nextPlayerIndex, currentRedCard: null, currentBlueCardInfo: null, selectedPlayerForTask: null, votingInfo: null, gamePhase: 'playing', message: `${nextPlayer?.name || 'Sıradaki'}, sıra sende! Kırmızı kart çek.`, lastActionMessage: '', };
        }
         case 'END_GAME_CHECK': { // Called by useEffect in provider
             const winner = state.players.find(p => p.score >= 20);
             // Only transition to 'ending' if a winner is found AND we are not already ending/ended
             if (winner && state.gamePhase !== 'assigningBlackCard' && state.gamePhase !== 'ended' && state.gamePhase !== 'ending') {
                 console.log("Reducer END_GAME_CHECK: Winner found, moving to 'ending' phase.");
                 return { ...state, gamePhase: 'ending' }; // Transition to intermediate ending phase
             }
             // Otherwise, no state change needed by this check
             console.log(`Reducer END_GAME_CHECK: No winner or game already ending (Phase: ${state.gamePhase}). No state change.`);
             return state;
         }
         case 'TRIGGER_END_GAME': { // Called by useEffect when phase is 'ending'
             console.log("Reducer TRIGGER_END_GAME: Moving to 'assigningBlackCard' phase.");
             let loser = null; if (state.players.length > 0) { loser = state.players.reduce((min, p) => p.score < min.score ? p : min, state.players[0]); }
             const winnerPlayer = state.players.find(p => p.score >= 20);
             return { ...state, gamePhase: 'assigningBlackCard', message: `Oyun Bitti! En düşük puan (${loser?.score || '?'}) ${loser ? loser.name : '???'}. Siyah kart çekilecek!`, selectedPlayerForTask: loser ? loser.id : null, currentRedCard: null, currentBlueCardInfo: null, lastActionMessage: `🏆 Kazanan: ${winnerPlayer?.name || 'Biri'}!` };
         }
        case 'ASSIGN_BLACK_CARD': { const { card, remainingDeck } = drawCardPure(state.blackDeck); const loserName = state.players.find(p => p.id === state.selectedPlayerForTask)?.name || 'Kaybeden'; return { ...state, blackDeck: remainingDeck, gamePhase: 'ended', message: card?.text ? `${loserName}, Siyah Kart Görevin:\n"${card.text}"\n\n(Yapınca oyun tamamen biter)` : `Siyah kart destesi bitti! ${loserName} görevi yapmaktan kurtuldu!`, lastActionMessage: "Oyun Tamamlandı!", currentRedCard: null, currentBlueCardInfo: null }; }
        case 'RESTART_GAME': { const { initialGameState: importedInitialGameState } = require('./initialStates'); return { ...importedInitialGameState, achievements: state.achievements, stats: state.stats, gamePhase: 'setup' }; }
        case 'REPLAY_GAME': { const { initialGameState: importedInitialGameState } = require('./initialStates'); if (state.players.length === 0) return { ...importedInitialGameState, achievements: state.achievements, stats: state.stats, gamePhase: 'setup' }; const resetPlayers = state.players.map(player => ({ ...player, score: 0, blueCard: null, })); let initialBlueDeck = shuffleDeck(cardData.mavi); let initialRedDeckCards = cardData.kırmızı.map(card => ensureCardObject(card)).filter(card => !card.isCustom); let initialRedDeck = shuffleDeck(initialRedDeckCards); let initialBlackDeck = shuffleDeck(cardData.siyah); resetPlayers.forEach(player => { player.blueCard = initialBlueDeck.pop() || "Deste Bitti!"; }); return { ...importedInitialGameState, achievements: state.achievements, stats: { ...state.stats, tasksCompleted: {}, tasksDelegated: {}, blackCardsDrawn: {}, votableTasksWon: {} }, players: resetPlayers, redDeck: initialRedDeck, blueDeck: initialBlueDeck, blackDeck: initialBlackDeck, gamePhase: 'initialBlueCardReveal', message: `${resetPlayers[0]?.name || ''}, sıra sende. Mavi kartına bak.` }; }
        case 'UNLOCK_ACHIEVEMENT': { const { achievementId } = action.payload; if (state.achievements[achievementId] && !state.achievements[achievementId].unlocked) { const newAchievements = { ...state.achievements, [achievementId]: { unlocked: true, notified: false } }; const newPending = [...state.pendingAchievementNotifications, achievementId]; return { ...state, achievements: newAchievements, pendingAchievementNotifications: newPending }; } return state; }
        // --- DÜZELTME: MARK_ACHIEVEMENT_NOTIFIED ---
         case 'MARK_ACHIEVEMENT_NOTIFIED': {
             const { achievementId } = action.payload;
             // Sadece 'notified' flag'ini güncelle
             const newAchievements = { ...state.achievements, [achievementId]: { ...state.achievements[achievementId], notified: true } };
             // Bildirim sırasından çıkar
             const newPending = state.pendingAchievementNotifications.filter(id => id !== achievementId);
             // *** FAZI DEĞİŞTİRME *** - Faz değişikliği burada olmamalı, oyun akışını bozuyor.
             // const currentPhase = state.gamePhase;
             // const nextPhase = newPending.length === 0 && !['setup', 'initialBlueCardReveal', 'assigningBlackCard', 'ended', 'voting', 'processingVote'].includes(currentPhase) ? 'playing' : currentPhase;
             // const nextMessage = newPending.length > 0 ? state.message : "Devam ediliyor...";
             return { ...state, achievements: newAchievements, pendingAchievementNotifications: newPending /* , gamePhase: nextPhase, message: nextMessage */ };
         }
         case 'UPDATE_STAT': { const { statKey, valueIncrement = 1, playerId = null } = action.payload; const newStats = { ...state.stats }; if (playerId !== null) { if (!newStats[statKey]) newStats[statKey] = {}; newStats[statKey][playerId] = (newStats[statKey][playerId] || 0) + valueIncrement; } else { newStats[statKey] = (newStats[statKey] || 0) + valueIncrement; } return { ...state, stats: newStats }; }
         case 'GO_TO_PHASE': { return { ...state, gamePhase: action.payload.phase, message: action.payload.message || state.message }; }
         case 'CLEAR_SELECTION': { return { ...state, selectedPlayerForTask: null, votingInfo: null }; }
        default: console.warn(`Unhandled action type in gameReducer: ${action.type}`); return state;
    }
};