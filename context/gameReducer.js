import { shuffleDeck, cardData } from '../data/cards';
import { AVATARS, getRandomAvatar } from '../constants/avatars';
import { initialGameState as importedInitialGameState } from './initialStates';

// Helper: Ensure card is an object
const ensureCardObject = (card) => {
     if (!card) return null;
     if (typeof card === 'string') {
         const isCustom = card.startsWith("ÖZEL:");
         const text = isCustom ? card.substring(5).trim() : card;
         // ID için kart metnini veya rastgele bir değer kullan
         const id = card.length > 0 ? card : `card_${Math.random().toString(36).substring(7)}`;
         return { text: text, isCustom: isCustom, votable: false, id: id, isVisible: true };
     }
     return {
         ...card,
         id: card.id || card.text || `card_${Math.random().toString(36).substring(7)}`,
         isVotable: !!card.votable,
         isCustom: !!card.isCustom,
         isVisible: card.isVisible !== undefined ? card.isVisible : true,
     };
 };

// Helper: Draw card (pure)
const drawCardPure = (deck) => {
     if (!deck || deck.length === 0) { return { card: null, remainingDeck: [] }; }
     const newDeck = [...deck];
     const card = newDeck.pop();
     return { card: ensureCardObject(card), remainingDeck: newDeck };
 };

// Helper: Get next player index (pure)
const getNextPlayerIndex = (currentIndex, playerCount) => {
    if (playerCount <= 0) return 0;
    return (currentIndex + 1) % playerCount;
};


// --- Reducer Function ---
export const gameReducer = (state, action) => {
    // Sadece geliştirme sırasında detaylı loglama
    if (__DEV__) {
        console.log(`--- Reducer: ${action.type}`, action.payload || '');
    }

    switch (action.type) {
        case 'SETUP_GAME': {
            const { playerNames, customTasks } = action.payload;
            try {
                let assignedAvatars = [];
                const initialPlayers = playerNames.map((name, index) => {
                    const trimmedName = name.trim();
                    const avatarId = getRandomAvatar(assignedAvatars);
                    assignedAvatars.push(avatarId);
                    return { id: index, name: trimmedName || `Oyuncu ${index + 1}`, score: 0, blueCard: null, avatarId: avatarId };
                });

                let initialBlueDeck = shuffleDeck(cardData.mavi.map(ensureCardObject));
                let initialRedDeckCards = cardData.kırmızı.map(ensureCardObject);
                let initialBlackDeck = shuffleDeck(cardData.siyah.map(ensureCardObject));
                const formattedCustomTasks = customTasks.map((task, index) =>
                    ensureCardObject({ text: task, isCustom: true, id: `custom_${index}` })
                );
                let combinedRedDeck = shuffleDeck([...initialRedDeckCards, ...formattedCustomTasks]);

                initialPlayers.forEach(player => {
                    const { card: blueCard, remainingDeck: newBlueDeck } = drawCardPure(initialBlueDeck);
                    player.blueCard = blueCard?.text || "Deste Bitti!";
                    initialBlueDeck = newBlueDeck;
                });

                // initialGameState'i kullanarak tam sıfırlama
                const baseInitialState = { ...importedInitialGameState };

                return {
                    ...baseInitialState,
                    players: initialPlayers,
                    currentPlayerIndex: 0,
                    redDeck: combinedRedDeck,
                    blueDeck: initialBlueDeck,
                    blackDeck: initialBlackDeck,
                    gamePhase: 'initialBlueCardReveal',
                    revealingPlayerIndex: 0,
                    message: `${initialPlayers[0]?.name || ''}, sıra sende. Başlamak için Mavi Kartına bak.`,
                    // Kümülatif istatistikleri koru, oyun özel olanları sıfırla
                    stats: {
                        ...(state?.stats || baseInitialState.stats), // Önceki stats varsa al, yoksa başlangıcı kullan
                        tasksCompleted: {}, tasksDelegated: {}, blackCardsDrawn: {}, votableTasksWon: {},
                        customTasksAdded: (state?.stats?.customTasksAdded || 0) + customTasks.length
                    },
                    // Başarımları koru
                    achievements: state?.achievements || baseInitialState.achievements,
                    pendingAchievementNotifications: [], // Temizle
                    // Diğer state'leri sıfırla
                    currentRedCard: null, currentBlueCardInfo: null, selectedPlayerForTask: null,
                    lastActionMessage: '', votingInfo: null,
                };
            } catch (error) {
                console.error("HATA [SETUP_GAME]:", error);
                // Hata durumunda state'i bozmadan setup fazına geri dön
                return { ...(state || importedInitialGameState), gamePhase: 'setup', message: "Oyun kurulumunda beklenmedik bir hata oluştu!" };
            }
        }

        case 'SHOW_INITIAL_BLUE_CARD': {
            const playerIndex = state.revealingPlayerIndex;
            const currentPlayer = state.players?.[playerIndex]; // Daha güvenli erişim
            // Kart yoksa veya geçersizse otomatik ilerleme mantığı
            if (!currentPlayer || !currentPlayer.blueCard || currentPlayer.blueCard === "Deste Bitti!") {
                 console.warn(`Initial Blue Card: Player ${playerIndex} için kart yok veya geçersiz.`);
                 const nextIndex = playerIndex + 1;
                 if (nextIndex < (state.players?.length || 0)) { // Sıradaki varsa ona geç
                     const nextPlayer = state.players[nextIndex];
                     return {
                         ...state, currentBlueCardInfo: null, revealingPlayerIndex: nextIndex,
                         message: `${nextPlayer?.name || ''}, sıra sende. Mavi kartına bak.`,
                         lastActionMessage: `${currentPlayer?.name || 'Oyuncu'} Mavi Kartı atladı.`
                     };
                 } else { // Herkes baktıysa oyuna başla
                     console.log("Initial Blue Card: Herkes baktı, playing fazına geçiliyor.");
                     const firstPlayerName = state.players?.[0]?.name || '';
                     return {
                        ...state, currentBlueCardInfo: null, gamePhase: 'playing',
                        revealingPlayerIndex: 0, currentPlayerIndex: 0,
                        message: `${firstPlayerName}, sıra sende! Kırmızı kart çek.`,
                        lastActionMessage: `Mavi kartlar kontrol edildi.`,
                        selectedPlayerForTask: null, votingInfo: null,
                     };
                 }
             }
             // Kart varsa göster
             return {
                 ...state,
                 currentBlueCardInfo: { text: currentPlayer.blueCard, isVisible: true, forPlayerName: currentPlayer.name, forPlayerId: currentPlayer.id },
                 message: `Mavi Kartın:\n(Görevi aklında tut, kapatıp telefonu sıradakine ver.)`
             };
        }

        case 'HIDE_INITIAL_BLUE_CARD_AND_PROCEED': {
            const nextRevealingIndex = state.revealingPlayerIndex + 1;
            if (nextRevealingIndex < (state.players?.length || 0)) { // Sıradaki oyuncu varsa
                const nextPlayer = state.players?.[nextRevealingIndex];
                return {
                    ...state, currentBlueCardInfo: null, revealingPlayerIndex: nextRevealingIndex,
                    message: `${nextPlayer?.name || ''}, sıra sende. Mavi kartına bak.`,
                    lastActionMessage: '', // Önceki mesajı temizle
                };
            } else { // Herkes baktı, oyunu başlat
                 console.log("Hide Initial Blue Card: Herkes baktı, playing fazına geçiliyor.");
                 const firstPlayerName = state.players?.[0]?.name || '';
                return {
                    ...state, currentBlueCardInfo: null, gamePhase: 'playing', // <<< GAME START PHASE
                    revealingPlayerIndex: 0, currentPlayerIndex: 0,
                    message: `${firstPlayerName}, sıra sende! Kırmızı kart çek.`,
                    selectedPlayerForTask: null, // Reset selections
                    votingInfo: null,            // Reset voting
                    lastActionMessage: "Mavi kartlar kontrol edildi." // Setup tamamlandı mesajı
                };
            }
        }

        case 'DRAW_RED_CARD': {
            const { card: redCard, remainingDeck: newRedDeck } = drawCardPure(state.redDeck);
            if (!redCard) { // Deste bittiyse
                 console.warn("Kırmızı kart destesi bitti!");
                 // Deste bitince mesaj gösterip turu pas geç
                 const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players.length);
                 const nextPlayer = state.players[nextPlayerIndex];
                 return {
                     ...state, currentRedCard: null, redDeck: newRedDeck,
                     message: `Kırmızı kart destesi bitti! Sıra ${nextPlayer?.name || ''}'e geçiyor.`,
                     gamePhase: 'playing', // Sıra geçişi için 'playing' kalmalı
                     currentPlayerIndex: nextPlayerIndex, // Sırayı hemen geçir
                     lastActionMessage: 'Kırmızı Deste Boş!', currentBlueCardInfo: null,
                     selectedPlayerForTask: null, votingInfo: null, // Temizlik
                 };
            }
             // Kart varsa karar fazına geç
            return {
                ...state, currentRedCard: { ...redCard, isVisible: true }, redDeck: newRedDeck,
                message: `Yeni Görev:`, gamePhase: 'decision', lastActionMessage: '',
                currentBlueCardInfo: null, selectedPlayerForTask: null, votingInfo: null // Temizlik
            };
        }

        case 'START_DELEGATION': {
            return {
                ...state, gamePhase: 'selectingPlayer', message: 'Bu görevi kim yapsın?',
                lastActionMessage: `"${state.currentRedCard?.text || 'Görev'}" devredilecek.`
            };
        }

        case 'SELECT_PLAYER_FOR_TASK': {
            const { selectedPlayerId } = action.payload;
            const selectedPlayer = state.players.find(p => p.id === selectedPlayerId);
            const currentPlayer = state.players[state.currentPlayerIndex];
            // Bu kontrol Provider'da yapıldı, ama burada da olması zararsız.
            if (!selectedPlayer || !currentPlayer || !selectedPlayer.blueCard || selectedPlayer.blueCard === "Deste Bitti!") {
                 console.error("Reducer: SELECT_PLAYER_FOR_TASK - Geçersiz seçim.");
                 // State'i değiştirmeden hata mesajı vermek daha iyi olabilir.
                 // Provider'ın uyarı vermesi yeterli.
                 return state;
             }
             return {
                 ...state, selectedPlayerForTask: selectedPlayerId, gamePhase: 'revealingBlueCard',
                 currentBlueCardInfo: { text: selectedPlayer.blueCard, isVisible: true, forPlayerName: selectedPlayer.name, forPlayerId: selectedPlayer.id },
                 message: `${currentPlayer.name}, seçtiğin ${selectedPlayer.name}'in şu Mavi Kart görevini yapmalısın:`, lastActionMessage: '',
                 currentRedCard: state.currentRedCard, // Kırmızı kart görünür kalsın
             };
        }

        case 'CANCEL_SELECTION_RETURN_TO_DECISION': {
            return {
                ...state, gamePhase: 'decision', message: `Görev:\n"${state.currentRedCard?.text || '...'}"`,
                selectedPlayerForTask: null, currentBlueCardInfo: null,
            };
        }

        case 'COMPLETE_TASK_DIRECTLY': {
            const { playerId, points, wasDelegated } = action.payload;
            const playerIndex = state.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) return state;

            const updatedPlayers = state.players.map((p, index) =>
                index === playerIndex ? { ...p, score: (p.score || 0) + points } : p
            );
            const playerName = updatedPlayers[playerIndex].name;

            // Eğer görev delege EDİLMEDİYSE, sıra normal şekilde geçer.
            // Eğer görev delege EDİLDİYSE (ve başarılıysa), yeni mavi kart çekilir.
            if (wasDelegated) {
                // Yeni mavi kart çekme adımına geç
                const { card: newBlueCard, remainingDeck: newBlueDeck } = drawCardPure(state.blueDeck);
                const drawnCardText = newBlueCard?.text || "Deste Bitti!";
                const finalPlayers = updatedPlayers.map((p, index) =>
                     index === playerIndex ? { ...p, blueCard: drawnCardText } : p
                 );
                const showNewCard = drawnCardText !== "Deste Bitti!";

                return {
                    ...state, players: finalPlayers, blueDeck: newBlueDeck,
                    gamePhase: showNewCard ? 'showingNewBlueCard' : 'playing', // Kart yoksa direkt sıra geç
                    currentBlueCardInfo: showNewCard ? { text: drawnCardText, isVisible: true, forPlayerName: playerName, forPlayerId: playerId } : null,
                    currentRedCard: null, // Görev bitti
                    selectedPlayerForTask: null, // Delegasyon bitti
                    message: showNewCard ? `${playerName}, yeni gizli Mavi Kartın:\n(Aklında tut ve kapat)` : `${playerName} yeni Mavi Kart çekmeye çalıştı ama deste boş! Sıra geçiyor...`,
                    lastActionMessage: `${playerName} +${points} Puan kazandı ve yeni Mavi Kart çekti!`,
                    // Kart yoksa sıra geçişi:
                    currentPlayerIndex: showNewCard ? state.currentPlayerIndex : getNextPlayerIndex(state.currentPlayerIndex, finalPlayers.length),
                    votingInfo: null,
                };

            } else {
                // Delege edilmedi, normal sıra geçişi
                const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, updatedPlayers.length);
                const nextPlayer = updatedPlayers[nextPlayerIndex];
                return {
                    ...state, players: updatedPlayers, currentRedCard: null, currentBlueCardInfo: null,
                    selectedPlayerForTask: null, votingInfo: null, // Temizlik
                    gamePhase: 'playing', // Sıra geçişi
                    currentPlayerIndex: nextPlayerIndex,
                    message: `${nextPlayer.name}, sıra sende! Kırmızı kart çek.`,
                    lastActionMessage: `${playerName} +${points} Puan kazandı!`
                };
            }
        }

        case 'DELEGATOR_COMPLETE_BLUE': {
            const delegatorIndex = state.currentPlayerIndex;
            const selectedPlayerId = state.selectedPlayerForTask;
            const selectedPlayer = state.players.find(p => p.id === selectedPlayerId);
            const delegator = state.players[delegatorIndex];
            if (!selectedPlayer || !delegator) return state;
            const updatedPlayers = state.players.map((p, index) =>
                index === delegatorIndex ? { ...p, score: (p.score || 0) + 10 } : p
            );
            return {
                ...state, players: updatedPlayers, gamePhase: 'redCardForSelected', currentBlueCardInfo: null,
                currentRedCard: state.currentRedCard ? { ...state.currentRedCard, isVisible: true } : null, // Kırmızının görünür olduğundan emin ol
                message: `Süper! Şimdi ${selectedPlayer.name}, sıradaki Kırmızı Kart görevini yapmalı:`,
                lastActionMessage: `${delegator.name} Mavi Kart görevini tamamlayarak +10 Puan kazandı!`,
                votingInfo: null, // Olası eski oylama bilgisini temizle
            };
        }

        // DRAW_NEW_BLUE_CARD artık COMPLETE_TASK_DIRECTLY ve CAST_VOTE içinde handle ediliyor.
        // case 'DRAW_NEW_BLUE_CARD': { ... } // Bu case kaldırılabilir veya sadece hata durumu için bırakılabilir.

        case 'CONFIRM_CLOSE_NEW_BLUE_CARD': {
             // Kart kapatıldıktan sonra sıra geçer. Sıra, delegasyonu başlatan oyuncudan sonrakine geçer.
             // currentPlayerIndex hala delegasyonu başlatan kişiyi gösteriyor olmalı.
             const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players.length);
             const nextPlayer = state.players[nextPlayerIndex];
             return {
                 ...state, currentBlueCardInfo: null,
                 gamePhase: 'playing', // Sıra geçişi
                 currentPlayerIndex: nextPlayerIndex,
                 message: `${nextPlayer.name}, sıra sende! Kırmızı kart çek.`,
                 lastActionMessage: `Sıra ${nextPlayer.name}'e geçti.`,
                 selectedPlayerForTask: null, // Temizlik
                 votingInfo: null,
             };
        }

        case 'START_VOTING': {
            const { taskInfo, performerId, wasDelegated } = action.payload; // nextTurnLogic kaldırıldı, wasDelegated eklendi
            const voters = state.players.filter(p => p.id !== performerId);
            if (voters.length === 0) {
                 console.warn("Oylama başlatılamadı: Oy verecek başka oyuncu yok.");
                  const performer = state.players.find(p=>p.id===performerId);
                  // Oylama yapılamıyorsa, görevi başarısız sayıp sırayı geçirelim.
                  const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players.length);
                  const nextPlayer = state.players[nextPlayerIndex];
                 return {
                     ...state, gamePhase: 'playing', // Direkt sıra geçsin
                     currentPlayerIndex: nextPlayerIndex,
                     message: `Oylama yapılamadı (oyuncu yok). ${performer?.name || ''} puan alamadı. Sıra ${nextPlayer?.name || ''}'e geçiyor.`,
                    lastActionMessage: "Oylama atlandı.", currentRedCard: null, votingInfo: null, selectedPlayerForTask: null,
                 };
             }
            const initialVotes = {};
            voters.forEach(p => { initialVotes[p.id] = null; });
            const performer = state.players.find(p => p.id === performerId);
            return {
                 ...state, gamePhase: 'voting',
                 // nextTurnLogic kaldırıldı, wasDelegated eklendi
                 votingInfo: { taskId: taskInfo.taskId, taskText: taskInfo.taskText, performerId: performerId, votes: initialVotes, wasDelegated: wasDelegated, performerName: performer?.name || 'Oyuncu' },
                 currentRedCard: null, currentBlueCardInfo: null, // Diğer kartları temizle
                 message: `${performer?.name || ''} şu görevi yaptı mı?\n"${taskInfo.taskText}"\nDiğer oyuncular oy versin!`,
                 lastActionMessage: '',
             };
         }

        case 'CAST_VOTE': {
            const { voterId, vote } = action.payload;
            if (!state.votingInfo || state.votingInfo.votes[voterId] !== null) return state; // Geçersiz oy

            const newVotes = { ...state.votingInfo.votes, [voterId]: vote };
            const voterCount = Object.keys(state.votingInfo.votes).length;
            const votedCount = Object.values(newVotes).filter(v => v !== null).length;
            const allVoted = votedCount === voterCount;

            // Eğer herkes oy verdiyse, sonucu İŞLE ve state'i GÜNCELLE
            if (allVoted) {
                const yesVotes = Object.values(newVotes).filter(v => v === 'yes').length;
                const noVotes = Object.values(newVotes).filter(v => v === 'no').length;
                const totalVotes = yesVotes + noVotes;
                const success = totalVotes > 0 && yesVotes > (totalVotes / 2);
                const performerId = state.votingInfo.performerId;
                const points = 5; // Oylu görev puanı
                const performer = state.players.find(p => p.id === performerId);
                const wasDelegated = state.votingInfo.wasDelegated;

                let updatedPlayers = state.players;
                let finalStats = state.stats;

                if (success && performer) {
                    updatedPlayers = state.players.map(p => p.id === performerId ? {...p, score: (p.score || 0) + points} : p);
                    // İstatistikleri güncelle (Provider yerine burada yapmak daha direkt olabilir)
                    finalStats = { ...state.stats };
                    if (!finalStats.votableTasksWon) finalStats.votableTasksWon = {};
                    finalStats.votableTasksWon[performerId] = (finalStats.votableTasksWon[performerId] || 0) + 1;
                    if (!finalStats.tasksCompleted) finalStats.tasksCompleted = {}; // tasksCompleted'i de sayalım
                    finalStats.tasksCompleted[performerId] = (finalStats.tasksCompleted[performerId] || 0) + 1;
                    finalStats.totalScoreAccumulated = (finalStats.totalScoreAccumulated || 0) + points;
                }

                const message = success ? `Oylama Sonucu: Başarılı! (${yesVotes} Evet / ${noVotes} Hayır)` : `Oylama Sonucu: Başarısız! (${yesVotes} Evet / ${noVotes} Hayır)`;
                const lastAction = success ? `${performer?.name || ''} +${points} Puan!` : `${performer?.name || ''} puan alamadı.`;

                // Eğer görev başarılıysa VE delege edilmişse, yeni mavi kart çekme adımına geç
                if (success && wasDelegated && performer) {
                    const { card: newBlueCard, remainingDeck: newBlueDeck } = drawCardPure(state.blueDeck);
                    const drawnCardText = newBlueCard?.text || "Deste Bitti!";
                    const finalPlayersWithNewCard = updatedPlayers.map((p, index) =>
                         p.id === performerId ? { ...p, blueCard: drawnCardText } : p
                     );
                    const showNewCard = drawnCardText !== "Deste Bitti!";

                    return {
                        ...state, players: finalPlayersWithNewCard, stats: finalStats, blueDeck: newBlueDeck,
                        gamePhase: showNewCard ? 'showingNewBlueCard' : 'playing', // Kart yoksa direkt sıra geç
                        currentBlueCardInfo: showNewCard ? { text: drawnCardText, isVisible: true, forPlayerName: performer.name, forPlayerId: performerId } : null,
                        currentRedCard: null, selectedPlayerForTask: null, votingInfo: null, // Temizlik
                        message: showNewCard ? `${message}\n${performer.name}, yeni gizli Mavi Kartın:\n(Aklında tut ve kapat)` : `${message}\n${performer.name} yeni Mavi Kart çekmeye çalıştı ama deste boş! Sıra geçiyor...`,
                        lastActionMessage: lastAction + (showNewCard ? " Yeni Mavi Kart çekti!" : " Deste boş!"),
                        // Kart yoksa sıra geçişi (delegator'dan sonraki)
                        currentPlayerIndex: showNewCard ? state.currentPlayerIndex : getNextPlayerIndex(state.currentPlayerIndex, finalPlayersWithNewCard.length),
                    };
                } else {
                    // Oylama bitti, delege edilmemişti VEYA başarısız oldu. Sıra geç.
                    const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, updatedPlayers.length);
                    const nextPlayer = updatedPlayers[nextPlayerIndex];
                    return {
                        ...state, players: updatedPlayers, stats: finalStats,
                        gamePhase: 'playing', // Sıra geçişi
                        currentPlayerIndex: nextPlayerIndex,
                        votingInfo: null, // Temizlik
                        currentRedCard: null, currentBlueCardInfo: null, selectedPlayerForTask: null,
                        message: `${message}\nSıra ${nextPlayer.name}'e geçiyor.`,
                        lastActionMessage: lastAction,
                    };
                }
            } else {
                // Oylama devam ediyor, sadece oyları güncelle
                const newMessage = `${votedCount}/${voterCount} oy kullanıldı. (${voterCount - votedCount} bekleniyor...)`;
                return { ...state, votingInfo: { ...state.votingInfo, votes: newVotes }, message: newMessage };
            }
         }

        // PROCESS_VOTE_RESULT artık CAST_VOTE içinde ele alınıyor. Bu case kaldırılabilir.
        // case 'PROCESS_VOTE_RESULT': { ... }

        // PASS_TURN artık doğrudan çağrılmıyor, diğer action'lar sonrası tetikleniyor.
        // case 'PASS_TURN': { ... }

        // Hata durumunda temizlik ve sıra geçişi için yeni action
        case 'CLEAR_SELECTION_AND_PASS_TURN': {
            console.warn("Reducer: CLEAR_SELECTION_AND_PASS_TURN çağrıldı (hata durumu).");
            const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players.length);
            const nextPlayer = state.players[nextPlayerIndex];
            return {
                 ...state, currentPlayerIndex: nextPlayerIndex, currentRedCard: null,
                 currentBlueCardInfo: null, selectedPlayerForTask: null, votingInfo: null,
                 gamePhase: 'playing', // TUR BAŞLANGIÇ FAZI
                 message: `Bir hata oluştu. Sıra ${nextPlayer.name}'e geçiyor. Kırmızı kart çek.`,
                 lastActionMessage: `Hata sonrası sıra geçildi.`,
            };
        }


        case 'END_GAME_CHECK': {
            const winner = state.players.find(p => (p.score || 0) >= 20);
            if (winner && !['assigningBlackCard', 'ended', 'ending'].includes(state.gamePhase)) {
                 console.log("Reducer END_GAME_CHECK: Kazanan var -> 'ending' fazına geçiliyor.");
                 // 'ending' fazı sadece bir ara durum, hemen 'assigningBlackCard'a geçebiliriz.
                 let loser = null;
                 if (state.players.length > 0) { loser = state.players.reduce((min, p) => (p.score || 0) < (min.score || 0) ? p : min, state.players[0]); }
                 const winnerPlayer = state.players.reduce((max, p) => (p.score || 0) > (max.score || 0) ? p : max, state.players[0]); // En yüksek skorlu kazanan

                 if (!loser) {
                     console.error("END_GAME_CHECK: Kaybeden bulunamadı!");
                     return { ...state, gamePhase: 'ended', message: "Oyun Bitti! Kazanan var ama kaybeden belirlenemedi.", lastActionMessage: "Hata."};
                 }

                 return {
                     ...state, gamePhase: 'assigningBlackCard', // Direkt siyah kart fazına geç
                     message: `Oyun Bitti! En düşük puan (${loser.score || 0}) ile ${loser.name} Siyah Kart çekecek!`,
                     selectedPlayerForTask: loser.id, // Kaybedeni işaretle
                     currentRedCard: null, currentBlueCardInfo: null, votingInfo: null, // Temizlik
                     lastActionMessage: `🏆 Kazanan: ${winnerPlayer?.name || 'Biri'}!`
                 };
            }
             return state; // Koşul yoksa veya zaten bitiyorsa değiştirme
        }

        // TRIGGER_END_GAME artık END_GAME_CHECK içinde ele alınıyor.
        // case 'TRIGGER_END_GAME': { ... }

        case 'ASSIGN_BLACK_CARD': {
             const { card: blackCard, remainingDeck: newBlackDeck } = drawCardPure(state.blackDeck);
             const loserId = state.selectedPlayerForTask;
             const loserName = state.players.find(p => p.id === loserId)?.name || 'Kaybeden';

             // Stat update: Provider'dan tetiklenmesi daha tutarlı olsa da, burada bırakmak daha basit.
             // Achievement Provider'da tetikleniyor.
             const newStats = { ...state.stats };
             if (loserId !== null) {
                  if (!newStats.blackCardsDrawn) newStats.blackCardsDrawn = {};
                  newStats.blackCardsDrawn[loserId] = (newStats.blackCardsDrawn[loserId] || 0) + 1;
             }

             const finalMessage = blackCard?.text
                 ? `${loserName}, işte Siyah Kart görevin:\n"${blackCard.text}"\n\n(Yapınca oyun tamamen biter)`
                 : `Siyah kart destesi tükenmiş! ${loserName} kurtuldu!`;
             return {
                 ...state, stats: newStats, blackDeck: newBlackDeck, gamePhase: 'ended', // OYUN BİTTİ
                 message: finalMessage, lastActionMessage: "Oyun Tamamlandı!",
                 currentRedCard: null, currentBlueCardInfo: null, selectedPlayerForTask: null, votingInfo: null // Final Temizlik
             };
        }

        case 'RESTART_GAME': {
            const baseInitialState = { ...importedInitialGameState };
            // Kümülatif statları ve başarımları koru
            return { ...baseInitialState, achievements: state.achievements, stats: state.stats, gamePhase: 'setup' };
        }

        case 'REPLAY_GAME': {
            if (!state.players || state.players.length === 0) {
                const baseInitialState = { ...importedInitialGameState };
                return { ...baseInitialState, achievements: state.achievements, stats: state.stats, gamePhase: 'setup' };
            }
            const resetPlayers = state.players.map(p => ({ ...p, score: 0, blueCard: null }));
            let initialBlueDeck = shuffleDeck(cardData.mavi.map(ensureCardObject));
            // Özel görevleri tekrar eklemiyoruz, bu kasıtlı olabilir.
            let initialRedDeckCards = cardData.kırmızı.map(ensureCardObject).filter(c => !c?.isCustom);
            let initialRedDeck = shuffleDeck(initialRedDeckCards);
            let initialBlackDeck = shuffleDeck(cardData.siyah.map(ensureCardObject));
            resetPlayers.forEach(p => {
                const { card, remainingDeck } = drawCardPure(initialBlueDeck);
                p.blueCard = card?.text || "Deste Bitti!"; initialBlueDeck = remainingDeck;
            });
             const baseInitialState = { ...importedInitialGameState };
            return {
                ...baseInitialState, achievements: state.achievements, // Başarımları koru
                // Kümülatif statları koru, oyun özel olanları sıfırla
                stats: { ...state.stats, tasksCompleted: {}, tasksDelegated: {}, blackCardsDrawn: {}, votableTasksWon: {} },
                players: resetPlayers, redDeck: initialRedDeck, blueDeck: initialBlueDeck, blackDeck: initialBlackDeck,
                gamePhase: 'initialBlueCardReveal', revealingPlayerIndex: 0, currentPlayerIndex: 0,
                message: `${resetPlayers[0]?.name || ''}, sıra sende. Tekrar başlıyoruz! Mavi Kartına bak.`,
                lastActionMessage: "Yeni oyun başladı!",
                // Diğer state'leri sıfırla
                currentRedCard: null, currentBlueCardInfo: null, selectedPlayerForTask: null, votingInfo: null, pendingAchievementNotifications: [],
            };
        }

        case 'UNLOCK_ACHIEVEMENT': {
            const { achievementId } = action.payload;
            if (state.achievements && state.achievements[achievementId] && !state.achievements[achievementId].unlocked) {
                const newAchievements = { ...state.achievements, [achievementId]: { unlocked: true, notified: false } };
                const newPending = [...state.pendingAchievementNotifications, achievementId];
                return { ...state, achievements: newAchievements, pendingAchievementNotifications: newPending };
            }
            return state;
        }
        case 'MARK_ACHIEVEMENT_NOTIFIED': {
            const { achievementId } = action.payload;
            const achievement = state.achievements?.[achievementId];
            if(!achievement) return state;
            const newAchievements = { ...state.achievements, [achievementId]: { ...achievement, notified: true } };
            const newPending = state.pendingAchievementNotifications.filter(id => id !== achievementId);
            return { ...state, achievements: newAchievements, pendingAchievementNotifications: newPending };
        }
        case 'UPDATE_STAT': {
             const { statKey, valueIncrement = 1, playerId = null } = action.payload;
             const newStats = { ...state.stats };
             if (playerId !== null && typeof playerId === 'number') { // playerId kontrolü
                 if (!newStats[statKey]) newStats[statKey] = {};
                 newStats[statKey][playerId] = (newStats[statKey][playerId] || 0) + valueIncrement;
             } else {
                 newStats[statKey] = (newStats[statKey] || 0) + valueIncrement;
             }
             return { ...state, stats: newStats };
         }

        case 'GO_TO_PHASE': { // Bu action dikkatli kullanılmalı, state tutarlılığını bozabilir.
            console.warn(`Reducer: GO_TO_PHASE kullanıldı -> ${action.payload.phase}`);
            return { ...state, gamePhase: action.payload.phase, message: action.payload.message || state.message };
        }
        case 'CLEAR_SELECTION': { // Sadece temizlik yapar, sıra geçirmez
            return { ...state, selectedPlayerForTask: null, votingInfo: null, currentBlueCardInfo: null };
        }
        default:
            console.warn(`Unhandled action type in gameReducer: ${action.type}`);
            return state;
    }
};