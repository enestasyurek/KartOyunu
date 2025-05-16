// --- START OF FILE GameScreen.js (No Animations) ---
import React, { useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, Platform, StatusBar, TouchableOpacity,
    BackHandler, Alert, useWindowDimensions, ScrollView, Animated
} from 'react-native';
import Constants from 'expo-constants';
import { useGame } from '../context/useGame';
import Card, { CARD_ASPECT_RATIO, CARD_MAX_WIDTH, CARD_WIDTH_PERCENTAGE } from '../components/Card'; // Use the non-animated Card
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
import ActionButton from '../components/ActionButton';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
// Removed Moti/AnimatePresence imports

// --- Scoreboard (No Animations) ---
const Scoreboard = React.memo(({ players, currentPlayerId }) => {
    const safePlayers = Array.isArray(players) ? players : [];
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scoreboardContent} style={styles.scoreboardContainer}>
            {safePlayers.map((player) => {
                 if (!player || typeof player !== 'object' || player.id === undefined) return null;
                 const isActive = player.id === currentPlayerId;
                 const playerName = player.name || `Oyuncu ${player.id}`;
                 const avatar = player.avatarId || '👤';
                 const score = player.score ?? 0;
                return (
                    <View key={player.id} style={[ styles.scoreColumn, isActive && styles.activePlayerColumn ]}>
                         {isActive ? (<View style={styles.turnIndicatorIconWrapper}><Ionicons name="caret-down" size={SIZES.iconSizeSmall} color={COLORS.activePlayerHighlight} /></View>) : null}
                        <Text style={styles.avatarTextScoreboard}>{avatar}</Text>
                        <Text style={[ styles.scoreText, isActive && styles.activePlayerText ]} numberOfLines={1}>{playerName.substring(0, 8) + (playerName.length > 8 ? '…' : '')}</Text>
                        <Text style={styles.scorePoints}>{score}</Text>
                     </View>
                );
            })}
        </ScrollView>
    );
});

// --- Ana Oyun Ekranı (No Animations) ---
const GameScreen = ({ navigation }) => {
    const { gameState, actions } = useGame();
    const { width: windowWidth } = useWindowDimensions();

    // --- Defensive State Destructuring ---
    const {
        players = [], currentPlayerIndex = 0, currentRedCard = null, currentBlueCardInfo = null,
        gamePhase = 'setup', message = '', lastActionMessage = '', selectedPlayerForTask = null,
        revealingPlayerIndex = 0, votingInfo = null,
    } = gameState || {};

    // --- Effects (Keep as before) ---
    useEffect(() => { if (gamePhase === 'assigningBlackCard' || gamePhase === 'ended') { navigation.replace('End'); } }, [gamePhase, navigation]);
    useEffect(() => { const backAction = () => { const shouldConfirm = ['playing', 'decision', 'selectingPlayer', 'revealingBlueCard', 'redCardForSelected', 'showingNewBlueCard', 'voting'].includes(gamePhase); if (shouldConfirm) { Alert.alert("Oyundan Ayrıl", "Ana Menüye dönmek istediğine emin misin? Oyun kaydedilmeyecek.", [{ text: "Hayır", style: "cancel" }, { text: "Evet, Çık", onPress: () => navigation.navigate('Home') }], { cancelable: true }); return true; } return false; }; const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction); const unsubscribe = navigation.addListener('beforeRemove', (e) => { const isNavigatingToEnd = e.data.action.type === 'REPLACE' && e.data.action.payload?.name === 'End'; const isNavigatingHomeByAction = e.data.action.type === 'NAVIGATE' && e.data.action.payload?.name === 'Home'; if (!isNavigatingToEnd && !isNavigatingHomeByAction && backAction()) { e.preventDefault(); } }); return () => { backHandler.remove(); unsubscribe(); }; }, [navigation, gamePhase]);

    // --- Oyuncu Bilgileri ---
    const activePlayerId = useMemo(() => { if (gamePhase === 'initialBlueCardReveal') return players[revealingPlayerIndex]?.id; if (gamePhase === 'assigningBlackCard' && selectedPlayerForTask !== null) return selectedPlayerForTask; if (gamePhase === 'ended') return null; return players[currentPlayerIndex]?.id; }, [gamePhase, players, currentPlayerIndex, revealingPlayerIndex, selectedPlayerForTask]);
    const activePlayer = useMemo(() => players.find(p => p.id === activePlayerId), [players, activePlayerId]);
    const otherPlayers = useMemo(() => players.filter(p => p.id !== currentPlayerIndex), [players, currentPlayerIndex]);
    const currentPlayerName = activePlayer?.name || '';

    // --- Yüklenme veya Hata Durumu ---
     if (players.length === 0 && gamePhase !== 'setup') { return ( <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexCenter}><ActivityIndicator size={60} color={COLORS.negative} /><Text style={styles.loadingText}>Oyuncu Verisi Yok!</Text></LinearGradient> ); }
     if (!activePlayer && !['ended', 'assigningBlackCard', 'setup', 'initialBlueCardReveal'].includes(gamePhase)) { console.error("Aktif Oyuncu Hatası! Phase:", gamePhase, "ActivePlayerId:", activePlayerId, "CurrentIndex:", currentPlayerIndex); return ( <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexCenter}><Ionicons name="alert-circle-outline" size={60} color={COLORS.negative} /><Text style={[styles.loadingText, {color: COLORS.negativeLight}]}>Aktif Oyuncu Hatası!</Text></LinearGradient> ); }

    // --- Gösterilecek Kart Verisi ---
    const cardDisplayData = useMemo(() => {
        let type = 'kapalı', text = '', isVisible = false, cardKey = 'placeholder';
        const cardAreaVisible = ['initialBlueCardReveal', 'revealingBlueCard', 'showingNewBlueCard', 'decision', 'redCardForSelected', 'playing'].includes(gamePhase);
        if (cardAreaVisible) {
            if (currentBlueCardInfo?.isVisible && (gamePhase === 'initialBlueCardReveal' || gamePhase === 'revealingBlueCard' || gamePhase === 'showingNewBlueCard')) { type = 'mavi'; text = currentBlueCardInfo.text; isVisible = true; cardKey = `blue-${gamePhase}-${currentBlueCardInfo.forPlayerId}`; }
            else if (currentRedCard?.isVisible && (gamePhase === 'decision' || gamePhase === 'redCardForSelected')) { type = 'kırmızı'; text = currentRedCard.text; isVisible = true; cardKey = `red-${gamePhase}-${currentRedCard.id || text}`; }
            else if (gamePhase === 'playing' || (gamePhase === 'initialBlueCardReveal' && !currentBlueCardInfo?.isVisible)) { type = 'kapalı'; text = '?'; isVisible = true; cardKey = `closed-${gamePhase}`; }
            else { isVisible = false; cardKey = 'fallback-invisible'; }
        } else { isVisible = false; cardKey = 'no-card-phase-' + gamePhase; }
        return { type, text: String(text ?? ''), isVisible, cardKey };
     }, [currentBlueCardInfo, currentRedCard, gamePhase]);

    // --- UI Rendering Callbacks ---
    const renderVotingUI = useCallback(() => {
        if (!votingInfo || !players || !actions?.castVote) return null;
        const voters = players.filter(p => p.id !== votingInfo.performerId);
        if (voters.length === 0) { return (<View style={styles.flexCenter}><Ionicons name="sad-outline" size={40} color={COLORS.warningLight} /><Text style={styles.warningText}>Oylayacak başka oyuncu yok!</Text></View>); }
        const performer = players.find(p => p.id === votingInfo.performerId);
        const taskText = votingInfo.taskText;
        const votes = votingInfo.votes;
        const votingMessage = String(message || '');
        return (
            <View style={styles.votingOuterContainer}>
                <Text style={styles.sectionTitle}>🗳️ Oylama Zamanı!</Text>
                <Text style={styles.votingInfoText}><Text style={styles.boldText}>{performer?.name || 'Oyuncu'}</Text>{' '}<Text>şu görevi başarıyla yaptı mı?</Text></Text>
                <Text style={[styles.votingInfoText, styles.italicText, { color: COLORS.accentLight, marginBottom: SIZES.marginLarge * 1.5 }]}>"{taskText}"</Text>
                <ScrollView style={styles.votingScroll} contentContainerStyle={styles.votingList}>
                    {voters.map(voter => {
                        const currentVote = votes[voter.id]; const hasVoted = currentVote !== null;
                        return (
                            <View key={voter.id} style={styles.voterRow}>
                                <Text style={styles.voterAvatar}>{voter.avatarId || '👤'}</Text><Text style={styles.voterName} numberOfLines={1}>{voter.name}</Text>
                                <View style={styles.voteButtons}>
                                    <TouchableOpacity style={[styles.voteButtonBase, styles.voteYes, hasVoted && currentVote !== 'yes' && styles.voteDisabled]} onPress={() => actions.castVote(voter.id, 'yes')} disabled={hasVoted} activeOpacity={0.7} >{currentVote === 'yes' ? ( <Ionicons name="checkmark-circle" size={SIZES.iconSizeLarge * 1.2} color={COLORS.white} /> ) : ( <Ionicons name="thumbs-up-outline" size={SIZES.iconSizeLarge} color={COLORS.white} /> )}</TouchableOpacity>
                                    <TouchableOpacity style={[styles.voteButtonBase, styles.voteNo, hasVoted && currentVote !== 'no' && styles.voteDisabled]} onPress={() => actions.castVote(voter.id, 'no')} disabled={hasVoted} activeOpacity={0.7} >{currentVote === 'no' ? ( <Ionicons name="close-circle" size={SIZES.iconSizeLarge * 1.2} color={COLORS.white} /> ) : ( <Ionicons name="thumbs-down-outline" size={SIZES.iconSizeLarge} color={COLORS.white} /> )}</TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
                 <Text style={styles.votingStatusText}>{votingMessage}</Text>
            </View>
        );
    }, [votingInfo, players, actions, message]);

    const renderPlayerSelectionUI = useCallback(() => {
        if(!players || !actions?.selectPlayerForTask || !actions?.cancelPlayerSelection) return null;
         const currentUserId = players[currentPlayerIndex]?.id;
         const selectablePlayers = players.filter(p => p.id !== currentUserId && p.blueCard && p.blueCard !== "Deste Bitti!");
         if (selectablePlayers.length === 0) { return ( <View style={styles.playerSelectionOuterContainer}><Text style={styles.sectionTitle}>👥 Oyuncu Seç</Text><View style={styles.flexCenter}><Ionicons name="sad-outline" size={40} color={COLORS.warningLight} /><Text style={styles.warningText}>Görev devredilecek uygun oyuncu bulunamadı.</Text></View><ActionButton title="Geri Dön" onPress={actions.cancelPlayerSelection} type="secondary" style={styles.cancelButton} /></View> ); }
         const taskText = String(currentRedCard?.text || '...');
        return (
            <View style={styles.playerSelectionOuterContainer}>
                <Text style={styles.sectionTitle}>👥 Kimi Seçiyorsun?</Text>
                <Text style={styles.votingInfoText}><Text>Bu görevi (</Text><Text style={styles.italicText}>"{taskText}"</Text><Text>) hangi oyuncu yapsın?</Text></Text>
                <ScrollView style={styles.playerSelectionScroll}>
                    {selectablePlayers.map((player, index) => (
                        <TouchableOpacity key={player.id} style={styles.playerSelectCard} onPress={() => actions.selectPlayerForTask(player.id)} activeOpacity={0.8} >
                             <Text style={styles.playerSelectAvatar}>{player.avatarId || '👤'}</Text>
                            <Text style={styles.playerSelectName} numberOfLines={1}>{player.name}</Text>
                            <Ionicons name="chevron-forward-outline" size={SIZES.iconSize} color={COLORS.accentLight} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <ActionButton title="Vazgeç" onPress={actions.cancelPlayerSelection} type="secondary" style={styles.cancelButton} iconLeft="close-circle-outline"/>
            </View>
        );
    }, [players, currentPlayerIndex, actions, currentRedCard?.text]);

    const renderActionButtons = useCallback(() => {
        if (!players || !actions) return null;
        const currentPlayer = players[currentPlayerIndex];
        const currentRevealingPlayer = players[revealingPlayerIndex];
        switch (gamePhase) {
            case 'initialBlueCardReveal':
                const canShowInitial = currentRevealingPlayer?.blueCard && currentRevealingPlayer.blueCard !== "Deste Bitti!";
                 return (
                    <>
                         {!currentBlueCardInfo?.isVisible ? ( <ActionButton title={`${currentRevealingPlayer?.name || 'Oyuncu'}, Mavi Kartını Gör`} onPress={actions.showInitialBlueCard} disabled={!canShowInitial} iconLeft="eye-outline" type="primary" /> ) : ( <ActionButton title="Gördüm, Kapat & Devam Et" onPress={actions.hideInitialBlueCardAndProceed} type="secondary" iconRight="arrow-forward"/> )}
                         {!canShowInitial && !currentBlueCardInfo?.isVisible ? ( <Text style={styles.warningText}>Başlangıç Mavi Kartı yok veya geçersiz.</Text> ) : null}
                     </>
                );
            case 'playing':
                 if (!currentRedCard && !currentBlueCardInfo && !votingInfo) { return ( <ActionButton title={`${currentPlayer?.name || 'Oyuncu'}, Kırmızı Kart Çek!`} onPress={actions.drawRedCardForTurn} iconLeft="color-palette-outline" type="danger" />); } return null;
             case 'decision':
                  if (!currentRedCard?.isVisible) return null;
                  const canDelegate = otherPlayers.length > 0 && otherPlayers.some(p => p.blueCard && p.blueCard !== "Deste Bitti!");
                  return (
                      <>
                         <ActionButton title="Ben Yaparım (+5)" onPress={actions.iWillDoIt} iconLeft="checkmark-circle-outline" type="success" />
                          <ActionButton title="Başkası Yapsın..." onPress={actions.delegateTaskStart} disabled={!canDelegate} type={canDelegate ? "warning" : "secondary"} iconLeft="people-outline" style={styles.spacerTop} />
                         {!canDelegate ? ( <Text style={styles.warningText}>Görev devredilecek uygun oyuncu yok.</Text> ) : null}
                     </>
                   );
             case 'revealingBlueCard':
                  if (!currentBlueCardInfo?.isVisible) return null;
                 return ( <ActionButton title="Mavi Kart Görevini Yaptım (+10)" onPress={actions.delegatorDidBlueTask} iconLeft="checkmark-done-circle-outline" type="primary" /> );
             case 'redCardForSelected':
                   if (!currentRedCard?.isVisible) return null;
                  const selectedPlayer = players.find(p=>p.id === selectedPlayerForTask);
                  return ( <ActionButton title={`${selectedPlayer?.name || 'Oyuncu'} Kırmızı Görevi Yaptı (+5)`} onPress={actions.selectedPlayerDidRedTask} iconLeft="flame-outline" type="success" /> );
             case 'showingNewBlueCard':
                   if (!currentBlueCardInfo?.isVisible) return null;
                  const cardIsFinished = currentBlueCardInfo.text === "Deste Bitti!";
                  return ( <ActionButton title={cardIsFinished ? "Mavi Deste Bitti! (Kapat)" : "Yeni Mavi Kartı Gördüm, Kapat"} onPress={actions.confirmCloseNewBlueCard} type="secondary" iconRight="close-circle-outline"/> );
            default: return null;
        }
    }, [gamePhase, currentBlueCardInfo, currentRedCard, players, revealingPlayerIndex, currentPlayerIndex, selectedPlayerForTask, actions, otherPlayers]);

    // --- Ana Render ---
    const responsiveCardWidth = Math.min(windowWidth * CARD_WIDTH_PERCENTAGE, CARD_MAX_WIDTH);
    const responsiveCardHeight = responsiveCardWidth * CARD_ASPECT_RATIO;
    const buttonContainerMaxWidth = Math.min(windowWidth * 0.95, SIZES.buttonMaxWidth);
    const messageContainerMaxWidth = Math.min(windowWidth * 0.9, SIZES.contentMaxWidth);

    // Determine visibility of different sections
    const showCardArea = !['voting', 'selectingPlayer'].includes(gamePhase);
    const showVotingArea = gamePhase === 'voting';
    const showSelectionArea = gamePhase === 'selectingPlayer';
    const showActionButtons = !['voting', 'selectingPlayer', 'ended', 'assigningBlackCard'].includes(gamePhase);

    return (
        <LinearGradient 
            colors={['#1e293b', '#0f172a']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}}
            style={styles.flexFill}>
            <StatusBar barStyle="light-content" />
             <View style={styles.container}>
                 {/* --- Top Area --- */}
                 <View style={styles.topArea}>
                     <Scoreboard players={players} currentPlayerId={activePlayerId} />
                 </View>

                {/* --- Middle Area --- */}
                <View style={styles.middleArea}>
                    {/* Last Action Message */}
                    <View style={styles.lastActionContainer}>
                        {lastActionMessage ? (
                            <Text style={styles.lastActionText}>{lastActionMessage}</Text>
                        ) : (<View style={styles.lastActionPlaceholder} />)}
                    </View>

                    {/* Main Content Stage */}
                    <View style={styles.mainContentStage}>
                        {showCardArea && (
                            <View style={styles.cardDisplayArea}>
                                <Card
                                    type={cardDisplayData.type}
                                    text={cardDisplayData.text}
                                    isVisible={cardDisplayData.isVisible}
                                    key={cardDisplayData.cardKey}
                                    style={[
                                        { width: responsiveCardWidth, height: responsiveCardHeight },
                                        styles.enhancedCard
                                    ]}
                                />
                            </View>
                        )}
                        {showVotingArea && renderVotingUI()}
                        {showSelectionArea && renderPlayerSelectionUI()}
                    </View>

                    {/* Main Message */}
                    <View style={[styles.messageContainer, { maxWidth: messageContainerMaxWidth }]}>
                         <Text style={styles.messageText} numberOfLines={4}>
                             {message || ' '}
                         </Text>
                    </View>
                 </View>

                 {/* --- Bottom Area --- */}
                 <View style={[styles.bottomArea, { maxWidth: buttonContainerMaxWidth }]}>
                     {showActionButtons ? (
                        <View style={styles.actionButtonsContainer}>
                            {renderActionButtons()}
                         </View>
                     ) : null}
                  </View>
            </View>
         </LinearGradient>
    );
};

// --- STYLES (Simplified Layout) ---
const styles = StyleSheet.create({
    flexFill: { 
        flex: 1 
    },
    flexCenter: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: SIZES.padding 
    },
    container: { 
        flex: 1, 
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : SIZES.paddingMedium 
    },
    loadingText: { 
        marginTop: SIZES.margin, 
        fontSize: SIZES.body, 
        color: COLORS.textSecondary, 
        fontFamily: SIZES.regular, 
        textAlign: 'center' 
    },
    topArea: { 
        paddingHorizontal: SIZES.paddingSmall, 
        paddingBottom: SIZES.paddingSmall,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingTop: SIZES.paddingSmall
    },
    middleArea: { 
        flex: 1, 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: SIZES.padding, 
        paddingVertical: SIZES.paddingSmall, 
        width: '100%' 
    },
    bottomArea: { 
        paddingBottom: SIZES.paddingLarge, 
        paddingHorizontal: SIZES.padding, 
        alignSelf: 'center', 
        width: '100%', 
        paddingTop: SIZES.paddingSmall,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    lastActionContainer: { 
        minHeight: 40, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: SIZES.base, 
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: SIZES.inputRadius,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.paddingSmall
    },
    lastActionText: { 
        fontSize: SIZES.body * 0.95, 
        fontWeight: '600', 
        color: COLORS.accentLight, 
        textAlign: 'center', 
        fontFamily: SIZES.regular, 
        paddingHorizontal: SIZES.padding,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 2
    },
    lastActionPlaceholder: { 
        height: 30 
    },
    mainContentStage: { 
        flex: 1, 
        width: '100%', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginVertical: SIZES.marginSmall 
    },
    cardDisplayArea: { 
        width: '100%', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    enhancedCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 20
    },
    messageContainer: { 
        width: '100%', 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingVertical: SIZES.paddingMedium, 
        minHeight: 80, 
        marginTop: SIZES.marginSmall,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: SIZES.cardRadius,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    messageText: { 
        fontSize: SIZES.body * 1.15, 
        textAlign: 'center', 
        color: COLORS.textPrimary, 
        lineHeight: SIZES.body * 1.7, 
        fontFamily: SIZES.regular, 
        paddingHorizontal: SIZES.padding,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 3
    },
    actionButtonsContainer: { 
        width: '100%', 
        alignItems: 'center',
        paddingTop: SIZES.padding
    },
    scoreboardContainer: { 
        marginBottom: SIZES.marginSmall, 
        borderRadius: SIZES.cardRadius,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: SIZES.paddingSmall
    },
    scoreboardContent: { 
        paddingHorizontal: SIZES.paddingSmall, 
        paddingVertical: SIZES.paddingSmall * 0.5, 
        alignItems: 'flex-end' 
    },
    scoreColumn: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingHorizontal: SIZES.padding, 
        paddingVertical: SIZES.paddingSmall, 
        borderRadius: SIZES.inputRadius, 
        minWidth: 80, 
        marginRight: SIZES.base, 
        position: 'relative', 
        minHeight: 90, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3
    },
    activePlayerColumn: { 
        borderColor: COLORS.activePlayerHighlight, 
        backgroundColor: 'rgba(66, 153, 225, 0.3)', 
        transform: [{ scale: 1.03 }], 
        shadowColor: COLORS.activePlayerHighlight, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.5, 
        shadowRadius: 4, 
        elevation: 5 
    },
    turnIndicatorIconWrapper: { 
        position: 'absolute', 
        top: -SIZES.iconSizeSmall * 0.4, 
        left: 0, right: 0, 
        alignItems: 'center',
        shadowColor: COLORS.activePlayerHighlight,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.8,
        shadowRadius: 3
    },
    avatarTextScoreboard: { 
        fontSize: SIZES.h4, 
        marginBottom: SIZES.base * 0.5,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 3
    },
    scoreText: { 
        fontSize: SIZES.caption, 
        color: COLORS.textSecondary, 
        fontFamily: SIZES.regular, 
        marginBottom: SIZES.base * 0.5, 
        textAlign: 'center' 
    },
    activePlayerText: { 
        color: COLORS.activePlayerText, 
        fontFamily: SIZES.bold,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 2
    },
    scorePoints: { 
        fontSize: SIZES.title, 
        color: COLORS.textPrimary, 
        fontFamily: SIZES.bold, 
        textAlign: 'center', 
        marginTop: 'auto',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 3
    },
    sectionTitle: { 
        fontSize: SIZES.h3, 
        fontFamily: SIZES.bold, 
        color: COLORS.textPrimary, 
        marginBottom: SIZES.margin, 
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 2
    },
    votingOuterContainer: { 
        flex: 1, 
        width: '100%', 
        maxWidth: SIZES.contentMaxWidth * 0.95, 
        padding: SIZES.padding, 
        justifyContent: 'space-around', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.4)', 
        borderRadius: SIZES.cardRadius, 
        borderWidth: 1, 
        borderColor: COLORS.warningLight,
        shadowColor: COLORS.warning,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10
    },
    votingInfoText: { 
        fontSize: SIZES.body, 
        fontFamily: SIZES.regular, 
        color: COLORS.textSecondary, 
        textAlign: 'center', 
        marginBottom: SIZES.base, 
        lineHeight: SIZES.lineHeightBase 
    },
    boldText: { 
        fontFamily: SIZES.bold, 
        color: COLORS.textPrimary 
    },
    italicText: { 
        fontStyle: 'italic' 
    },
    votingScroll: { 
        width: '100%', 
        flexGrow: 0, 
        flexShrink: 1, 
        maxHeight: '60%', 
        marginBottom: SIZES.margin 
    },
    votingList: { 
        paddingBottom: SIZES.padding 
    },
    voterRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: SIZES.margin * 1.2, 
        paddingHorizontal: SIZES.paddingSmall,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: SIZES.inputRadius,
        padding: SIZES.paddingSmall,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    voterName: { 
        fontSize: SIZES.body, 
        color: COLORS.textPrimary, 
        fontFamily: SIZES.regular, 
        flex: 1, 
        marginRight: SIZES.base,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 2
    },
    voterAvatar: { 
        fontSize: SIZES.body * 1.1, 
        marginRight: SIZES.marginSmall,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 3
    },
    voteButtons: { 
        flexDirection: 'row' 
    },
    voteButtonBase: { 
        paddingVertical: SIZES.padding, 
        paddingHorizontal: SIZES.paddingMedium, 
        borderRadius: SIZES.buttonRadius * 2, 
        marginHorizontal: SIZES.base, 
        alignItems: 'center', 
        justifyContent: 'center', 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 3 }, 
        shadowOpacity: 0.4, 
        shadowRadius: 4, 
        elevation: 5, 
        minWidth: 70, 
        minHeight: 60 
    },
    voteYes: { 
        backgroundColor: COLORS.positive,
        borderWidth: 1,
        borderColor: COLORS.positiveLight
    },
    voteNo: { 
        backgroundColor: COLORS.negative,
        borderWidth: 1,
        borderColor: COLORS.negativeLight
    },
    voteDisabled: { 
        opacity: 0.4, 
        backgroundColor: COLORS.textMuted 
    },
    votingStatusText: { 
        fontSize: SIZES.caption, 
        color: COLORS.textMuted, 
        textAlign: 'center', 
        marginTop: SIZES.marginSmall, 
        fontStyle: 'italic' 
    },
    playerSelectionOuterContainer: { 
        flex: 1, 
        width: '100%', 
        maxWidth: SIZES.contentMaxWidth * 0.95, 
        justifyContent: 'space-between', 
        padding: SIZES.padding, 
        backgroundColor: 'rgba(0,0,0,0.4)', 
        borderRadius: SIZES.cardRadius, 
        borderWidth: 1, 
        borderColor: COLORS.accent,
        shadowColor: COLORS.accent,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10
    },
    playerSelectionScroll: { 
        flexGrow: 0, 
        flexShrink: 1, 
        width: '100%', 
        marginVertical: SIZES.marginSmall 
    },
    playerSelectCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255, 255, 255, 0.08)', 
        paddingVertical: SIZES.paddingMedium, 
        paddingHorizontal: SIZES.padding, 
        borderRadius: SIZES.inputRadius, 
        marginBottom: SIZES.margin, 
        borderWidth: 1.5, 
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    playerSelectAvatar: { 
        fontSize: SIZES.h3, 
        marginRight: SIZES.marginMedium,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 3
    },
    playerSelectName: { 
        flex: 1, 
        fontSize: SIZES.body * 1.1, 
        fontFamily: SIZES.bold, 
        color: COLORS.textPrimary,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 2
    },
    cancelButton: { 
        marginTop: SIZES.margin, 
        width: '100%' 
    },
    warningText: { 
        fontSize: SIZES.caption, 
        color: COLORS.warningLight, 
        textAlign: 'center', 
        marginTop: SIZES.base, 
        fontFamily: SIZES.regular, 
        lineHeight: SIZES.lineHeightBase * 0.9,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 2
    },
    spacerTop: { 
        marginTop: SIZES.marginSmall 
    },
});


export default GameScreen;
// --- END OF FILE GameScreen.js ---