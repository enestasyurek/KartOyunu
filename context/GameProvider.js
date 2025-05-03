// context/GameProvider.js
import React, { createContext, useReducer, useCallback, useMemo, useState, useContext, useEffect } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import * as Haptics from 'expo-haptics';
import { gameReducer } from './gameReducer'; // Reducer'ı import et
import { initialGameState } from './initialStates'; // Başlangıç state'ini import et
import { useSounds } from '../hooks/useSounds';
// Diğer gerekli importlar reducer içinde veya burada kullanılabilir
import { cardData, shuffleDeck } from '../data/cards';
import { AVATARS, getRandomAvatar } from '../constants/avatars';
import { getAchievementDetails, initialAchievementsState as initialAchStateFromData } from '../data/achievements';


// Enable LayoutAnimation on Android
if ( Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Context Tanımı ---
export const GameContext = createContext(null);

// --- Animasyon ---
const configureAnimation = () => { try { LayoutAnimation.configureNext(LayoutAnimation.create( 250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity )); } catch (error) { console.warn("LayoutAnimation configuration failed:", error); } };

// --- Ana Provider Componenti ---
export const GameProvider = ({ children }) => {
    // --- State ve Dispatch ---
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
    // const [customTasksInput, setCustomTasksInput] = useState([]); // KALDIRILDI

    // --- Custom Hooks ---
    const playSound = useSounds();

    // --- Logger ---
    const logError = useCallback((functionName, error, stateSnapshot = gameState) => {
        console.error(`\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        console.error(`--- ERROR BOUNDARY / CATCH ---`);
        console.error(`  Function: ${functionName}`);
        console.error("Timestamp:", new Date().toISOString());
        console.error("Error:", error?.message || error);
        console.error("Relevant State:", JSON.stringify({
            phase: stateSnapshot?.gamePhase, playerIdx: stateSnapshot?.currentPlayerIndex,
            selectedTaskPlayer: stateSnapshot?.selectedPlayerForTask,
            redCardText: stateSnapshot?.currentRedCard?.text,
            blueCardVisible: !!stateSnapshot?.currentBlueCardInfo?.isVisible,
            votingActive: !!stateSnapshot?.votingInfo, message: stateSnapshot?.message
        }, null, 2));
        console.error("Error Stack:", error?.stack);
        console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);
     }, [gameState]); // gameState'e bağlı


    // --- Yan Etki Tetikleyici ---
    const triggerFeedback = useCallback((feedbackType = null, soundName = null) => {
        if (feedbackType) { Haptics.notificationAsync(feedbackType).catch(e => {}); }
        if (soundName) { playSound(soundName); }
    }, [playSound]);

    // --- Aksiyon Fonksiyonları (dispatch + yan etkiler) ---

    // !!! DÜZELTME: unlockAchievement ---
    const unlockAchievement = useCallback((achievementId) => {
       try {
           dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: { achievementId } });
           triggerFeedback(Haptics.NotificationFeedbackType.Success, 'achievement');
       } catch(e){ logError('unlockAchievement Action', e); }
    }, [dispatch, triggerFeedback]); // Bağımlılıklar güncellendi

    // !!! DÜZELTME: updateStat ---
    const updateStat = useCallback((statKey, valueIncrement = 1, playerId = null) => {
       try {
           dispatch({ type: 'UPDATE_STAT', payload: { statKey, valueIncrement, playerId } });
       } catch(e){ logError('updateStat Action', e); }
    }, [dispatch]); // Bağımlılıklar güncellendi

    const markAchievementNotified = useCallback((achievementId) => {
        try {
            configureAnimation();
            dispatch({ type: 'MARK_ACHIEVEMENT_NOTIFIED', payload: { achievementId } });
        } catch (error) { logError('markAchievementNotified Action', error); }
    }, [dispatch]);

     // --- endGame, nextTurn vs. için Fonksiyon Referansları (useCallback ile) ---
     const endGame = useCallback(() => {
       try {
           updateStat('gamesPlayed');
           const winnerPlayer = gameState.players.find(p => p.score >= 20);
           if(winnerPlayer){
               updateStat('wins', 1, winnerPlayer.id);
               unlockAchievement('first_win');
           }
           unlockAchievement('first_game');
           dispatch({ type: 'TRIGGER_END_GAME' });
           triggerFeedback(Haptics.NotificationFeedbackType.Success, 'gameEnd');
       } catch(error) { logError('endGame Action Logic', error); }
   }, [gameState.players, dispatch, updateStat, unlockAchievement, triggerFeedback]);

    const nextTurn = useCallback((playerIndexArg) => {
       try {
            dispatch({ type: 'PASS_TURN', payload: { playerIndex: playerIndexArg } });
            triggerFeedback(Haptics.NotificationFeedbackType.Warning, 'turnChange');
       } catch (error) { logError('nextTurn Action', error); }
   }, [dispatch, triggerFeedback]);

    const drawNewBlueCardForPlayer = useCallback((playerId) => {
       try {
           dispatch({ type: 'DRAW_NEW_BLUE_CARD', payload: { playerId } });
           playSound('cardDraw');
       } catch (error) { logError('drawNewBlueCardForPlayer Action', error); }
   }, [dispatch, playSound]); // Bağımlılıklar güncellendi

    const processVotingResults = useCallback((finalVotes, nextTurnLogic) => {
       try {
           const votingInfoSnapshot = gameState.votingInfo;
           if (!votingInfoSnapshot) { logError('processVotingResults', new Error("votingInfo is null")); return; }
           const yesVotes = Object.values(finalVotes).filter(v => v === 'yes').length;
           const noVotes = Object.values(finalVotes).filter(v => v === 'no').length;
           const totalVotes = yesVotes + noVotes;
           const success = totalVotes === 0 ? false : yesVotes >= Math.ceil(totalVotes / 2);
           const performerId = votingInfoSnapshot.performerId;
           const points = 5;

           dispatch({ type: 'PROCESS_VOTE_RESULT', payload: { success, yesVotes, noVotes, performerId, points } });
           triggerFeedback(success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error, success ? 'scorePoint' : 'error');

           if (success) {
                unlockAchievement('voted_task_win');
                updateStat('votableTasksWon', 1, performerId);
                updateStat('totalScoreAccumulated', points);
                const performer = gameState.players.find(p=>p.id === performerId); // Eski state okunabilir
                const wasDelegated = gameState.selectedPlayerForTask === performerId; // Eski state okunabilir
                if(performer && (performer.score + points) >= 30) unlockAchievement('high_scorer');
                if (wasDelegated) { drawNewBlueCardForPlayer(performerId); }
           }
           setTimeout(() => {
               console.log("Executing nextTurnLogic after voting results processing...");
               nextTurnLogic();
           }, 2000);

       } catch(error) {
           logError('processVotingResults Action Logic', error);
           setTimeout(() => {
               console.log("Executing recovery nextTurnLogic after voting error...");
               dispatch({ type: 'CLEAR_SELECTION', payload: { message: "Oylama hatası sonrası devam ediliyor." } });
               if(nextTurnLogic && typeof nextTurnLogic === 'function') nextTurnLogic(); else nextTurn();
           }, 500);
       }
   }, [gameState.votingInfo, gameState.players, gameState.selectedPlayerForTask, dispatch, triggerFeedback, unlockAchievement, updateStat, drawNewBlueCardForPlayer, nextTurn]);

   const startVoting = useCallback((taskInfo, performerId, nextTurnLogic) => {
       try {
            dispatch({ type: 'START_VOTING', payload: { taskInfo, performerId, nextTurnLogic } });
            triggerFeedback(Haptics.NotificationFeedbackType.Warning, 'votingStart');
       } catch(e) { logError('startVoting Action', e); }
   }, [dispatch, triggerFeedback]);

    const handleTaskCompletion = useCallback((playerId, points, achievementId = null, statKey = null, isVotable = false, taskInfo = null, nextTurnLogic = () => nextTurn()) => {
       try {
           if (isVotable && taskInfo) {
               startVoting(taskInfo, playerId, nextTurnLogic);
           } else {
               dispatch({ type: 'COMPLETE_TASK_DIRECTLY', payload: { playerId, points } });
               triggerFeedback(Haptics.NotificationFeedbackType.Success, 'scorePoint');
               if (achievementId) unlockAchievement(achievementId);
               if (statKey) updateStat(statKey, 1, playerId);
               updateStat('totalScoreAccumulated', points);
               const player = gameState.players.find(p => p.id === playerId); // Eski state okunabilir
               if(player && (player.score + points) >= 30) unlockAchievement('high_scorer');
               setTimeout(nextTurnLogic, 1500);
           }
       } catch (error) {
            logError('handleTaskCompletion Action Logic', error);
            setTimeout(nextTurnLogic, 500);
       }
   }, [dispatch, unlockAchievement, updateStat, triggerFeedback, gameState.players, startVoting, nextTurn]);

   // --- Diğer Aksiyonlar ---
   const setupGame = useCallback((playerNames, customTasks = []) => {
       try {
           dispatch({ type: 'SETUP_GAME', payload: { playerNames, customTasks } });
           triggerFeedback(null, 'buttonClick');
           if (customTasks.length > 0) {
                unlockAchievement('custom_task_added');
           }
           // setCustomTasksInput(customTasks); // KALDIRILDI
       } catch(e) { logError('setupGame Action', e); }
    // }, [dispatch, triggerFeedback, unlockAchievement, setCustomTasksInput]); // KALDIRILDI setCustomTasksInput bağımlılığı
    }, [dispatch, triggerFeedback, unlockAchievement]); // DÜZELTİLDİ bağımlılıklar

   const showInitialBlueCard = useCallback(() => {
       try {
           const currentPlayer = gameState.players[gameState.revealingPlayerIndex];
           if (!currentPlayer || !currentPlayer.blueCard || currentPlayer.blueCard === "Deste Bitti!") { triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error'); return; }
           configureAnimation();
           dispatch({ type: 'SHOW_INITIAL_BLUE_CARD' });
           triggerFeedback(Haptics.NotificationFeedbackType.Success, 'cardDraw');
       } catch(e) { logError('showInitialBlueCard Action', e); }
    }, [gameState.players, gameState.revealingPlayerIndex, dispatch, triggerFeedback]);

   const hideInitialBlueCardAndProceed = useCallback(() => {
       try {
           configureAnimation();
           dispatch({ type: 'HIDE_INITIAL_BLUE_CARD_AND_PROCEED' });
           triggerFeedback(Haptics.NotificationFeedbackType.Success, 'turnChange');
       } catch(e) { logError('hideInitialBlueCardAndProceed Action', e); }
    }, [dispatch, triggerFeedback]);

   const drawRedCardForTurn = useCallback(() => {
       try {
           configureAnimation();
           dispatch({ type: 'DRAW_RED_CARD' });
           triggerFeedback(Haptics.NotificationFeedbackType.Success, 'cardDraw');
       } catch(e) { logError('drawRedCardForTurn Action', e); }
   }, [dispatch, triggerFeedback]);

   const iWillDoIt = useCallback(() => { try { const currentPlayer = gameState.players[gameState.currentPlayerIndex]; const task = gameState.currentRedCard; if (!currentPlayer || !task?.text) { triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error'); return; } const currentCompletedCount = gameState.stats.tasksCompleted?.[currentPlayer.id] || 0; if (currentCompletedCount + 1 >= 5) { unlockAchievement('brave_soul'); } handleTaskCompletion(currentPlayer.id, 5, null, 'tasksCompleted', task.isVotable, task.isVotable ? { taskId: task.id || task.text, taskText: task.text } : null, () => nextTurn()); } catch (e) { logError('iWillDoIt Action', e); } }, [gameState.players, gameState.currentPlayerIndex, gameState.currentRedCard, gameState.stats, handleTaskCompletion, unlockAchievement, nextTurn, triggerFeedback]);
   const delegateTaskStart = useCallback(() => { try { configureAnimation(); dispatch({ type: 'START_DELEGATION' }); triggerFeedback(null, 'buttonClick'); } catch (e) { logError('delegateTaskStart Action', e); } }, [dispatch, triggerFeedback]);
   const selectPlayerForTask = useCallback((selectedPlayerId) => { try { const selectedPlayer = gameState.players.find(p => p.id === selectedPlayerId); if (!selectedPlayer || !selectedPlayer.blueCard || selectedPlayer.blueCard === "Deste Bitti!"){ triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error'); dispatch({ type: 'GO_TO_PHASE', payload: { phase: 'decision', message:"Geçerli bir oyuncu seçilemedi veya mavi kartı yok." } }); return; } configureAnimation(); dispatch({ type: 'SELECT_PLAYER_FOR_TASK', payload: { selectedPlayerId } }); triggerFeedback(Haptics.NotificationFeedbackType.Success, 'cardDraw'); } catch(e) { logError('selectPlayerForTask Action', e); } }, [gameState.players, dispatch, triggerFeedback]);
   const delegatorDidBlueTask = useCallback(() => { try { const currentPlayer = gameState.players[gameState.currentPlayerIndex]; if (!currentPlayer) { triggerFeedback(Haptics.NotificationFeedbackType.Error,'error'); return; } const currentDelegateCount = gameState.stats.tasksDelegated?.[currentPlayer.id] || 0; if(currentDelegateCount + 1 >= 3){ unlockAchievement('delegator_master'); } configureAnimation(); dispatch({ type: 'DELEGATOR_COMPLETE_BLUE' }); triggerFeedback(Haptics.NotificationFeedbackType.Success, 'scorePoint'); unlockAchievement('blue_master'); updateStat('tasksDelegated', 1, currentPlayer.id); updateStat('totalScoreAccumulated', 10); } catch(e) { logError('delegatorDidBlueTask Action', e); } }, [gameState.players, gameState.currentPlayerIndex, gameState.stats, dispatch, unlockAchievement, updateStat, triggerFeedback]);
   const selectedPlayerDidRedTask = useCallback(() => { try { const selectedPlayer = gameState.players.find(p => p.id === gameState.selectedPlayerForTask); const task = gameState.currentRedCard; const delegatorIndex = gameState.currentPlayerIndex; if (!selectedPlayer || !task?.text || delegatorIndex === undefined) { triggerFeedback(Haptics.NotificationFeedbackType.Error,'error'); return; } const nextTurnAfterDelegation = () => nextTurn(delegatorIndex); handleTaskCompletion(selectedPlayer.id, 5, 'red_master', 'tasksCompleted', task.isVotable, task.isVotable ? { taskId: task.id || task.text, taskText: task.text } : null, nextTurnAfterDelegation); if (!task.isVotable) { drawNewBlueCardForPlayer(selectedPlayer.id); } } catch(e) { logError('selectedPlayerDidRedTask Action', e); } }, [gameState.players, gameState.selectedPlayerForTask, gameState.currentRedCard, gameState.currentPlayerIndex, handleTaskCompletion, nextTurn, drawNewBlueCardForPlayer, triggerFeedback, unlockAchievement, updateStat]);
   const confirmCloseNewBlueCard = useCallback(() => { try { const delegatorIndex = gameState.currentPlayerIndex; dispatch({ type: 'CONFIRM_CLOSE_NEW_BLUE_CARD' }); triggerFeedback(Haptics.NotificationFeedbackType.Success, 'buttonClick'); setTimeout(() => dispatch({ type: 'PASS_TURN', payload: { playerIndex: delegatorIndex } }), 500); } catch(e) { logError('confirmCloseNewBlueCard Action', e); } }, [gameState.currentPlayerIndex, dispatch, triggerFeedback]);
   const castVote = useCallback((voterId, vote) => { try { const currentVotingInfo = gameState.votingInfo; if (!currentVotingInfo || currentVotingInfo.votes[voterId] !== null) { triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error'); return; } triggerFeedback(Haptics.ImpactFeedbackStyle.Light, 'buttonClick'); dispatch({ type: 'CAST_VOTE', payload: { voterId, vote } }); const newVotes = { ...currentVotingInfo.votes, [voterId]: vote }; const allVoted = Object.values(newVotes).every(v => v !== null); if(allVoted){ const nextTurnLogicVote = currentVotingInfo.nextTurnLogic; setTimeout(() => { processVotingResults(newVotes, nextTurnLogicVote); }, 1000); } } catch(e) { logError('castVote Action', e); } }, [gameState.votingInfo, dispatch, triggerFeedback, processVotingResults]);
   const assignAndFinishBlackCard = useCallback(() => { try { const loserId = gameState.selectedPlayerForTask; if (loserId !== null) { updateStat('blackCardsDrawn', 1, loserId); unlockAchievement('black_card_victim'); } const blackDeckWasNotEmpty = gameState.blackDeck.length > 0; dispatch({ type: 'ASSIGN_BLACK_CARD' }); triggerFeedback(Haptics.NotificationFeedbackType.Warning, blackDeckWasNotEmpty ? 'cardDraw' : 'gameEnd'); } catch(e) { logError('assignAndFinishBlackCard Action', e); } }, [gameState.selectedPlayerForTask, gameState.blackDeck, dispatch, updateStat, unlockAchievement, triggerFeedback]);
   const restartGame = useCallback(() => { try { dispatch({ type: 'RESTART_GAME' }); /*setCustomTasksInput([]); */ triggerFeedback(null, 'buttonClick'); } catch(e) { logError('restartGame Action', e); } }, [dispatch, /*setCustomTasksInput,*/ triggerFeedback]); // Bağımlılık güncellendi
   const restartWithSamePlayers = useCallback(() => { try { if (!gameState.players || gameState.players.length === 0) { restartGame(); return; } dispatch({ type: 'REPLAY_GAME' }); /*setCustomTasksInput([]); */ triggerFeedback(Haptics.NotificationFeedbackType.Success, 'buttonClick'); } catch(e) { logError('restartWithSamePlayers Action', e); } }, [gameState.players, dispatch, restartGame, /*setCustomTasksInput,*/ triggerFeedback]); // Bağımlılık güncellendi
   const cancelPlayerSelection = useCallback(() => { try { configureAnimation(); dispatch({ type: 'CANCEL_SELECTION_RETURN_TO_DECISION' }); triggerFeedback(null, 'buttonClick'); } catch(e) { logError('cancelPlayerSelection Action', e); } }, [dispatch, triggerFeedback]);


   // --- useEffect for End Game Check ---
   useEffect(() => {
    if (gameState.gamePhase === 'playing' || gameState.gamePhase === 'decision' || gameState.gamePhase === 'redCardForSelected') {
        const winner = gameState.players.find(p => p.score >= 20);
        if (winner) {
              console.log("Winner detected in useEffect, dispatching END_GAME_CHECK");
              dispatch({ type: 'END_GAME_CHECK' });
        }
    }
    if (gameState.gamePhase === 'ending') {
       console.log("Detected 'ending' phase, calling endGame action");
       endGame();
    }
}, [gameState.players, gameState.gamePhase, dispatch, endGame]);


 // --- useEffect for Achievement Notifications ---
 useEffect(() => {
   if (gameState.pendingAchievementNotifications && gameState.pendingAchievementNotifications.length > 0) {
       const achievementId = gameState.pendingAchievementNotifications[0];
       const details = getAchievementDetails(achievementId);
       const timer = setTimeout(() => {
           alert(`Başarım Açıldı!\n🏆 ${details?.name || achievementId}\n${details?.description || ''}`);
           markAchievementNotified(achievementId);
       }, 300);
       return () => clearTimeout(timer);
   }
}, [gameState.pendingAchievementNotifications, markAchievementNotified]);

   // --- Context Değeri ---
   const actions = useMemo(() => ({
       setupGame, showInitialBlueCard, hideInitialBlueCardAndProceed, drawRedCardForTurn,
       iWillDoIt, delegateTaskStart, selectPlayerForTask, delegatorDidBlueTask,
       selectedPlayerDidRedTask, confirmCloseNewBlueCard, castVote, assignAndFinishBlackCard,
       restartGame, restartWithSamePlayers, unlockAchievement, markAchievementNotified,
       cancelPlayerSelection,
   }), [ // Tüm memoize edilmiş eylem fonksiyonlarını listele
       setupGame, showInitialBlueCard, hideInitialBlueCardAndProceed, drawRedCardForTurn,
       iWillDoIt, delegateTaskStart, selectPlayerForTask, delegatorDidBlueTask,
       selectedPlayerDidRedTask, confirmCloseNewBlueCard, castVote, assignAndFinishBlackCard,
       restartGame, restartWithSamePlayers, unlockAchievement, markAchievementNotified, cancelPlayerSelection
   ]);

   // Sağlanacak son context değeri
   const contextValue = useMemo(() => ({
       gameState,
       actions,
       // customTasksInput, // KALDIRILDI
       // setCustomTasksInput // KALDIRILDI
    // }), [gameState, actions, customTasksInput, setCustomTasksInput]); // KALDIRILDI bağımlılıklar
    }), [gameState, actions]); // DÜZELTİLDİ bağımlılıklar


   return (
       <GameContext.Provider value={contextValue}>
           {children}
       </GameContext.Provider>
   );
};

// --- Custom Hook (useGame aşağıda tanımlı veya useGame.js'den import edildi) ---
// Hook tanımını kendi dosyasında (useGame.js) tutmak daha iyi bir pratiktir.
// export const useGame = () => { ... };