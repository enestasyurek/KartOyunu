// context/GameProvider.js
import React, { createContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { LayoutAnimation, Platform, UIManager, AppState, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { gameReducer } from './gameReducer';
import { initialGameState } from './initialStates';
import { useSounds } from '../hooks/useSounds';
import { getAchievementDetails, ACHIEVEMENTS_LIST } from '../data/achievements'; // MAX_PLAYERS buradan alınabilir
import { AVATARS } from '../constants/avatars'; // Gerekirse

// Sabitler
const TARGET_SCORE = 20;
const MAX_PLAYERS_ACHIEVEMENT = 6; // 'full_house' başarımı için limit

// LayoutAnimation Android için
if ( Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
// --- Context Tanımı ---
export const GameContext = createContext(null);
// --- Animasyon Yardımcısı ---
const configureAnimation = (duration = 250) => { try { LayoutAnimation.configureNext( LayoutAnimation.create( duration, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity )); } catch (error) {} };

// --- Ana Provider Componenti ---
export const GameProvider = ({ children }) => {
    // --- State ve Dispatch ---
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
    // --- Custom Hooks ---
    const playSound = useSounds();

    // --- Logger ---
    const logError = useCallback((functionName, error, stateSnapshot = gameState) => {
        console.error(`\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        console.error(`--- HATA YAKALANDI (GameProvider) ---`);
        console.error(`  Fonksiyon: ${functionName}`);
        console.error("  Zaman:", new Date().toISOString());
        console.error("  Hata:", error?.message || error);
        console.error("  İlgili State Özeti:", JSON.stringify({
            phase: stateSnapshot?.gamePhase, playerIdx: stateSnapshot?.currentPlayerIndex,
            revealIdx: stateSnapshot?.revealingPlayerIndex, selectedP: stateSnapshot?.selectedPlayerForTask,
            redCard: stateSnapshot?.currentRedCard?.id, blueCard: stateSnapshot?.currentBlueCardInfo?.text,
            voting: !!stateSnapshot?.votingInfo, message: stateSnapshot?.message?.substring(0,30)
        }, null, 1));
        if (error?.stack) { console.error("  Stack:", error.stack.substring(0, 150)); }
        console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);
     }, [gameState]); // gameState değişince log fonksiyonu da güncellensin

    // --- Geri Bildirim (Ses ve Titreşim) ---
    const triggerFeedback = useCallback((feedbackType = null, soundName = null) => {
        if (feedbackType) {
            Haptics.notificationAsync(feedbackType).catch(e => {}); // Haptik hatalarını yoksay
        }
        if (soundName) {
            playSound(soundName);
        }
    }, [playSound]);

    // --- State Güncelleme Aksiyonları ---
    const unlockAchievement = useCallback((achievementId) => {
       if (!achievementId || !gameState.achievements) return; // State yüklenmemişse işlem yapma
       try {
           const isAlreadyUnlocked = gameState.achievements[achievementId]?.unlocked;
           const isPending = gameState.pendingAchievementNotifications?.includes(achievementId);
            if (isAlreadyUnlocked || isPending) { /*console.log(`Skipping achievement: ${achievementId} (unlocked: ${isAlreadyUnlocked}, pending: ${isPending})`);*/ return; }

            dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: { achievementId } });
            triggerFeedback(Haptics.NotificationFeedbackType.Success, 'achievement'); // Özel ses yoksa varsayılan
       } catch(e){ logError('unlockAchievement', e); }
    }, [dispatch, triggerFeedback, logError, gameState.achievements, gameState.pendingAchievementNotifications]);

    const updateStat = useCallback((statKey, valueIncrement = 1, playerId = null) => {
        if (!statKey) return;
        try { dispatch({ type: 'UPDATE_STAT', payload: { statKey, valueIncrement, playerId } }); } catch(e){ logError('updateStat', e); }
    }, [dispatch, logError]);

    const markAchievementNotified = useCallback((achievementId) => {
        if (!achievementId) return;
        try { dispatch({ type: 'MARK_ACHIEVEMENT_NOTIFIED', payload: { achievementId } }); } catch (error) { logError('markAchievementNotified', error); }
    }, [dispatch, logError]);


    // --- Oyun Akışı Aksiyonları ---

    // Oyun Kurulumu
    const setupGame = useCallback((playerNames, customTasks = []) => {
        try {
            dispatch({ type: 'SETUP_GAME', payload: { playerNames, customTasks } });
            triggerFeedback(Haptics.NotificationFeedbackType.Success, 'buttonClick');
            if (customTasks.length > 0) { unlockAchievement('custom_task_added'); }
             if (playerNames.length >= MAX_PLAYERS_ACHIEVEMENT) { unlockAchievement('full_house'); }
        } catch(e) { logError('setupGame', e); }
    }, [dispatch, triggerFeedback, unlockAchievement, logError]);

    // Başlangıç Mavi Kartı Göster
    const showInitialBlueCard = useCallback(() => {
         try {
             const playerIndex = gameState.revealingPlayerIndex;
             const currentPlayer = gameState.players?.[playerIndex];
             if (!currentPlayer || !currentPlayer.blueCard || currentPlayer.blueCard === "Deste Bitti!") {
                 triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error');
                 dispatch({ type: 'SHOW_INITIAL_BLUE_CARD' }); // Reducer atlamayı handle eder
                 return;
             }
             configureAnimation();
             dispatch({ type: 'SHOW_INITIAL_BLUE_CARD' });
             triggerFeedback(null, 'cardDraw');
        } catch(e) { logError('showInitialBlueCard', e); }
    }, [gameState.players, gameState.revealingPlayerIndex, dispatch, triggerFeedback, logError]);

    // Başlangıç Mavi Kartı Gizle ve Devam Et
    const hideInitialBlueCardAndProceed = useCallback(() => {
        try {
            configureAnimation();
            dispatch({ type: 'HIDE_INITIAL_BLUE_CARD_AND_PROCEED' });
            triggerFeedback(Haptics.ImpactFeedbackStyle.Light, 'turnChange');
        } catch(e) { logError('hideInitialBlueCardAndProceed', e); }
    }, [dispatch, triggerFeedback, logError]);

     // Kırmızı Kart Çek
     const drawRedCardForTurn = useCallback(() => {
         try {
             if ((gameState.redDeck?.length || 0) === 0) {
                 // Deste boşsa kullanıcıyı uyar (Reducer da handle ediyor)
                 Alert.alert("Deste Boş", "Kırmızı kart destesinde çekilecek görev kalmadı. Sıra sonraki oyuncuya geçiyor.");
                 // Reducer zaten state'i güncelleyip 'playing' bırakıyor ve mesaj veriyor.
                 triggerFeedback(Haptics.NotificationFeedbackType.Warning, 'error'); // Hata sesi
                 dispatch({ type: 'DRAW_RED_CARD' }); // Reducer'ın deste boş durumunu işlemesini sağla
             } else {
                  configureAnimation();
                  dispatch({ type: 'DRAW_RED_CARD' });
                  triggerFeedback(null, 'cardDraw');
              }
         } catch (e) {
             logError('drawRedCardForTurn', e);
             Alert.alert("Hata", "Kırmızı kart çekilirken bir sorun oluştu.");
         }
     }, [dispatch, triggerFeedback, logError, gameState.redDeck]);

     // Sonraki Tura Geçiş (Artık sadece reducer tetikliyor)
     // const nextTurn = useCallback((playerIndexArg) => { ... }, []); // Bu fonksiyon artık doğrudan çağrılmıyor

    // --- Oylama & Görev Tamamlama ---

     // Oy Ver
    const castVote = useCallback((voterId, vote) => {
         try {
             const currentVotingInfo = gameState.votingInfo;
             // Oylama yoksa veya oyuncu zaten oy verdiyse işlem yapma
             if (!currentVotingInfo || currentVotingInfo.votes[voterId] !== null) {
                 triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error');
                 console.warn(`Invalid vote attempt by ${voterId}. VotingInfo: ${!!currentVotingInfo}, CurrentVote: ${currentVotingInfo?.votes?.[voterId]}`);
                 return;
             }
             configureAnimation(150);
             triggerFeedback(Haptics.ImpactFeedbackStyle.Light, 'buttonClick');
             // Reducer oylamayı işleyecek ve gerekirse sonuçları hesaplayıp state'i güncelleyecek
             dispatch({ type: 'CAST_VOTE', payload: { voterId, vote } });

             // Başarım ve istatistik güncellemeleri reducer'da veya vote sonrası effect'te yapılabilir.
             // Şimdilik reducer'da bırakıldı.
             // Geri bildirimler reducer'dan gelen state değişikliğine göre GameScreen'de verilebilir.

         } catch(e) { logError('castVote', e); }
    }, [gameState.votingInfo, dispatch, triggerFeedback, logError]); // processVotingResults bağımlılığı kaldırıldı

     // Genel Görev Tamamlama
     const handleTaskCompletion = useCallback((playerId, points, achievementId = null, statKey = null, isVotable = false, taskInfo = null, wasDelegated = false) => {
         try {
             configureAnimation();
             if (isVotable && taskInfo) {
                 // Oylamayı başlatır (Reducer sonuçları işleyince sonraki adıma geçer)
                 dispatch({ type: 'START_VOTING', payload: { taskInfo, performerId: playerId, wasDelegated } });
                 triggerFeedback(Haptics.NotificationFeedbackType.Warning, 'votingStart');
             } else {
                 // Direkt tamamlar (Reducer sonraki adıma geçer)
                 dispatch({ type: 'COMPLETE_TASK_DIRECTLY', payload: { playerId, points, wasDelegated } });
                 triggerFeedback(Haptics.NotificationFeedbackType.Success, 'scorePoint');
                 if (achievementId) unlockAchievement(achievementId);
                 if (statKey) updateStat(statKey, 1, playerId);
                 updateStat('totalScoreAccumulated', points);
                 const player = gameState.players.find(p => p.id === playerId);
                 if(player && ((player.score || 0) + points) >= 30) unlockAchievement('high_scorer');
                 // Sıra geçişi artık reducer tarafından yönetiliyor (COMPLETE_TASK_DIRECTLY sonrası)
             }
         } catch (error) {
             logError('handleTaskCompletion Logic', error);
             triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error');
             // Hata durumunda state'i temizleyip sıra geçmeyi dene
             dispatch({ type: 'CLEAR_SELECTION_AND_PASS_TURN' });
         }
     }, [dispatch, unlockAchievement, updateStat, triggerFeedback, gameState.players, logError]); // nextTurn bağımlılığı kaldırıldı


    // --- Karar & Delegasyon Aksiyonları ---
     // Karar: "Ben Yaparım"
     const iWillDoIt = useCallback(() => {
        try {
             const currentPlayer = gameState.players[gameState.currentPlayerIndex];
             const task = gameState.currentRedCard;
             if (!currentPlayer || !task || !task.text) { triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error'); return; }
             const currentCompletedCount = gameState.stats?.tasksCompleted?.[currentPlayer.id] || 0;
             if (currentCompletedCount + 1 >= 5) { unlockAchievement('brave_soul'); }
             // handleTaskCompletion çağrısı: wasDelegated = false
             handleTaskCompletion(currentPlayer.id, 5, null, 'tasksCompleted', task.isVotable, task.isVotable ? { taskId: task.id || task.text, taskText: task.text } : null, false);
         } catch (e) { logError('iWillDoIt', e); }
    }, [gameState, handleTaskCompletion, unlockAchievement, triggerFeedback, logError]); // nextTurn bağımlılığı kaldırıldı

     // Karar: "O Yapsın" Başlangıç
    const delegateTaskStart = useCallback(() => { try { configureAnimation(); dispatch({ type: 'START_DELEGATION' }); triggerFeedback(null, 'buttonClick'); } catch (e) { logError('delegateTaskStart', e); } }, [dispatch, triggerFeedback, logError]);

     // Karar: "O Yapsın" Oyuncu Seçimi
     const selectPlayerForTask = useCallback((selectedPlayerId) => {
        try {
             const selectedPlayer = gameState.players.find(p => p.id === selectedPlayerId);
             if (!selectedPlayer || !selectedPlayer.blueCard || selectedPlayer.blueCard === "Deste Bitti!"){
                 triggerFeedback(Haptics.NotificationFeedbackType.Error, 'error');
                 // Reducer'a fazı geri almasını söylemek yerine, burada bir uyarı verip state'i değiştirmemek daha iyi olabilir.
                 // VEYA reducer'a özel bir action gönderilebilir. Şimdilik sadece uyarı verelim.
                 Alert.alert("Geçersiz Seçim", "Seçilen oyuncunun Mavi Kartı yok veya geçersiz. Lütfen başka bir oyuncu seçin veya 'Ben Yaparım' deyin.");
                 // dispatch({ type: 'GO_TO_PHASE', payload: { phase: 'decision', message:"Seçilen oyuncunun Mavi Kartı yok veya geçersiz." } }); // Bu state'i geri sarar, belki istenmez.
                 return;
             }
             configureAnimation();
             dispatch({ type: 'SELECT_PLAYER_FOR_TASK', payload: { selectedPlayerId } });
             triggerFeedback(null, 'cardDraw');
        } catch(e) { logError('selectPlayerForTask', e); }
     }, [gameState.players, dispatch, triggerFeedback, logError]);

    // Karar: "O Yapsın" Vazgeçme
    const cancelPlayerSelection = useCallback(() => { try { configureAnimation(); dispatch({ type: 'CANCEL_SELECTION_RETURN_TO_DECISION' }); triggerFeedback(null, 'buttonClick'); } catch(e) { logError('cancelPlayerSelection', e); } }, [dispatch, triggerFeedback, logError]);

     // Delegasyon: Devreden Mavi'yi Yaptı
     const delegatorDidBlueTask = useCallback(() => {
        try {
             const currentPlayer = gameState.players[gameState.currentPlayerIndex];
             if (!currentPlayer) { triggerFeedback(Haptics.NotificationFeedbackType.Error,'error'); return; }
             const currentDelegateCount = gameState.stats?.tasksDelegated?.[currentPlayer.id] || 0;
             if(currentDelegateCount + 1 >= 3){ unlockAchievement('delegator_master'); }
             unlockAchievement('blue_master');
             configureAnimation();
             dispatch({ type: 'DELEGATOR_COMPLETE_BLUE' }); // Reducer fazı 'redCardForSelected' yapacak
             triggerFeedback(Haptics.NotificationFeedbackType.Success, 'scorePoint');
             updateStat('tasksDelegated', 1, currentPlayer.id); updateStat('totalScoreAccumulated', 10);
              if ((currentPlayer.score || 0) + 10 >= 30) { unlockAchievement('high_scorer'); }
        } catch(e) { logError('delegatorDidBlueTask', e); }
    }, [gameState, dispatch, unlockAchievement, updateStat, triggerFeedback, logError]);

     // Delegasyon: Seçilen Kırmızı'yı Yaptı
    const selectedPlayerDidRedTask = useCallback(() => {
         try {
             const selectedPlayerId = gameState.selectedPlayerForTask;
             const selectedPlayer = gameState.players.find(p => p.id === selectedPlayerId);
             const task = gameState.currentRedCard;
             // const delegatorIndex = gameState.currentPlayerIndex; // Artık nextTurn için gerekmiyor
             if (!selectedPlayer || !task || !task.text /*|| delegatorIndex === undefined*/) { triggerFeedback(Haptics.NotificationFeedbackType.Error,'error'); return; }
             // handleTaskCompletion çağrısı: wasDelegated = true
             handleTaskCompletion(selectedPlayer.id, 5, 'red_master', 'tasksCompleted', task.isVotable, task.isVotable ? { taskId: task.id || task.text, taskText: task.text } : null, true );
              // Yeni mavi kart çekme işlemi artık reducer tarafından yönetiliyor (COMPLETE_TASK_DIRECTLY veya VOTE_RESULT sonrası)
        } catch(e) {
            logError('selectedPlayerDidRedTask', e);
            // Hata durumunda state'i temizleyip sıra geçmeyi dene
            dispatch({ type: 'CLEAR_SELECTION_AND_PASS_TURN' });
        }
    }, [gameState, handleTaskCompletion, dispatch, triggerFeedback, logError]); // nextTurn bağımlılığı kaldırıldı

     // Delegasyon: Yeni Mavi Kartı Kapat
     const confirmCloseNewBlueCard = useCallback(() => {
        try {
            // const delegatorIndex = gameState.currentPlayerIndex; // Artık nextTurn için gerekmiyor
            configureAnimation();
            // Reducer kartı kapatıp sırayı geçirecek
            dispatch({ type: 'CONFIRM_CLOSE_NEW_BLUE_CARD' });
            triggerFeedback(Haptics.ImpactFeedbackStyle.Light, 'buttonClick');
         } catch(e) { logError('confirmCloseNewBlueCard Action', e); }
     }, [dispatch, triggerFeedback, logError]); // nextTurn ve index bağımlılığı kaldırıldı


    // --- Oyun Sonu ---
     // useEffect içinde çağrılır
    const endGame = useCallback(() => {
       try {
           // Bu fonksiyon artık sadece istatistik/başarım güncellemeleri yapar.
           // Faz geçişini useEffect tetikler, reducer 'ending' yapar, sonra 'assigningBlackCard'.
           console.log("--- Provider: endGame fonksiyonu çağrıldı (istatistik/başarım için) ---");
           updateStat('gamesPlayed');
           const winnerPlayer = gameState.players.reduce((max, p) => (p.score || 0) > (max.score || 0) ? p : max, gameState.players[0]);
           if(winnerPlayer && winnerPlayer.score >= TARGET_SCORE) { updateStat('wins', 1, winnerPlayer.id); unlockAchievement('first_win'); }
           unlockAchievement('first_game');
           // Reducer'a geçiş yapmasını söylemek yerine, reducer zaten 'ending' fazına geçti.
           // dispatch({ type: 'TRIGGER_END_GAME' }); // Bu artık useEffect'ten tetikleniyor
           triggerFeedback(Haptics.NotificationFeedbackType.Success, 'gameEnd'); // Bu ses belki 'ending' fazına geçince çalmalı
       } catch(error) { logError('endGame Logic', error); }
    }, [gameState.players, updateStat, unlockAchievement, triggerFeedback, logError, dispatch]); // dispatch eklendi (gerçi kullanılmıyor artık)

    // Siyah Kart Çek ve Bitir
    const assignAndFinishBlackCard = useCallback(() => {
         try {
             const loserId = gameState.selectedPlayerForTask;
             if (loserId !== null) { unlockAchievement('black_card_victim'); } // İstatistiği reducer yapar (veya burada updateStat çağrılabilir)
             const blackDeckWasNotEmpty = gameState.blackDeck.length > 0;
             dispatch({ type: 'ASSIGN_BLACK_CARD' }); // Reducer 'ended' yapar
             triggerFeedback(Haptics.NotificationFeedbackType.Warning, blackDeckWasNotEmpty ? 'cardDraw' : 'gameEnd');
         } catch(e) { logError('assignAndFinishBlackCard', e); }
    }, [gameState.selectedPlayerForTask, gameState.blackDeck, dispatch, unlockAchievement, triggerFeedback, logError]);

    // Restart / Replay
    const restartGame = useCallback(() => { try { dispatch({ type: 'RESTART_GAME' }); triggerFeedback(null, 'buttonClick'); } catch(e) { logError('restartGame', e); } }, [dispatch, triggerFeedback, logError]);
    const restartWithSamePlayers = useCallback(() => { try { if (!gameState.players || gameState.players.length === 0) { restartGame(); return; } dispatch({ type: 'REPLAY_GAME' }); triggerFeedback(Haptics.NotificationFeedbackType.Success, 'buttonClick'); } catch(e) { logError('restartWithSamePlayers', e); } }, [gameState.players, dispatch, restartGame, triggerFeedback, logError]);

   // --- useEffect Hooks ---
   // Oyun Sonu Kontrolü
   useEffect(() => {
       const currentPhase = gameState.gamePhase;
        // console.log(`--- Provider Phase Check Effect --- Phase: ${currentPhase}`); // Anlık fazı logla

       const shouldCheckWin = [
            'playing', 'decision', 'redCardForSelected', 'showingNewBlueCard', 'voting', 'voteResultDisplay' // Olası yeni ara faz
            // initialBlueCardReveal, selectingPlayer, revealingBlueCard fazlarında henüz skor değişimi olmaz
        ].includes(currentPhase);

        if (shouldCheckWin) {
           const winner = gameState.players.find(p => (p.score || 0) >= TARGET_SCORE);
           if (winner && !['ending', 'assigningBlackCard', 'ended'].includes(currentPhase)) {
                console.log(`>>> useEffect [Game End Check]: Winner found! Dispatching END_GAME_CHECK.`);
                 dispatch({ type: 'END_GAME_CHECK' }); // Reducer fazı 'ending' yapabilir
           }
       } else if (currentPhase === 'ending') {
           // Eğer 'ending' fazına geçildiyse endGame fonksiyonunu çağır (sadece stat/başarım için)
          console.log(`>>> useEffect [Game End Check]: Phase is 'ending'. Calling endGame for stats.`);
           endGame(); // Bu artık TRIGGER_END_GAME dispatch etmiyor, sadece stat güncelliyor. Reducer zaten 'assigningBlackCard'a geçiyor.
       }

   }, [gameState.gamePhase, gameState.players, endGame]); // endGame bağımlılığı doğru

    // Başarım Bildirimleri
   useEffect(() => {
       if (gameState.pendingAchievementNotifications?.length > 0) {
           const achievementId = gameState.pendingAchievementNotifications[0];
           const details = getAchievementDetails(achievementId);
           const timer = setTimeout(() => {
               Alert.alert(`Başarım Açıldı!`, `🏆 ${details?.name || achievementId}\n${details?.description || ''}`);
               markAchievementNotified(achievementId); // Bildirildi olarak işaretle
           }, 700);
           return () => clearTimeout(timer);
       }
   }, [gameState.pendingAchievementNotifications, markAchievementNotified]);

   // --- Context Değeri ---
   const actions = useMemo(() => ({
       setupGame, showInitialBlueCard, hideInitialBlueCardAndProceed, drawRedCardForTurn,
       iWillDoIt, delegateTaskStart, selectPlayerForTask, cancelPlayerSelection, // Kararlar
       delegatorDidBlueTask, selectedPlayerDidRedTask, confirmCloseNewBlueCard, // Delegasyon
       castVote, // Oylama
       assignAndFinishBlackCard, // Oyun sonu
       restartGame, restartWithSamePlayers, // Yeniden başlatma
       // handleTaskCompletion ve processVotingResults gibi iç mantık fonksiyonları dışarıya açılmamalı
   }), [ // Tüm public aksiyonları listele
       setupGame, showInitialBlueCard, hideInitialBlueCardAndProceed, drawRedCardForTurn,
       iWillDoIt, delegateTaskStart, selectPlayerForTask, cancelPlayerSelection,
       delegatorDidBlueTask, selectedPlayerDidRedTask, confirmCloseNewBlueCard,
       castVote, assignAndFinishBlackCard,
       restartGame, restartWithSamePlayers
   ]);

   const contextValue = useMemo(() => ({ gameState, actions }), [gameState, actions]);

   return (
       <GameContext.Provider value={contextValue}>
           {children}
       </GameContext.Provider>
   );
};