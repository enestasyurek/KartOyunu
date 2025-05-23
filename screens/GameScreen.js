// --- START OF FILE GameScreen.js (Refactored & UX‑Polished) ---
import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity,
  BackHandler,
  Alert,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useGame } from '../context/useGame';
import Card, {
  CARD_ASPECT_RATIO,
  CARD_MAX_WIDTH,
  CARD_WIDTH_PERCENTAGE,
} from '../components/Card';
import ActionButton from '../components/ActionButton';
import { COLORS, SIZES } from '../constants/theme';

/* -------------------------------------------------------------------------- */
/*                                SCOREBOARD                                  */
/* -------------------------------------------------------------------------- */

// Extract player score item into separate component for better memo
const PlayerScoreItem = React.memo(({ player, isActive }) => {
  if (!player || typeof player !== 'object' || player.id === undefined) return null;

  const playerName = player.name || `Oyuncu ${player.id}`;
  const avatar = player.avatarId || '👤';
  const score = player.score ?? 0;

  return (
    <View
      style={[styles.scoreColumn, isActive && styles.activePlayerColumn]}
    >
      {isActive && (
        <View style={styles.turnIndicatorIconWrapper}>
          <Ionicons
            name="caret-down"
            size={SIZES.iconSizeSmall}
            color={COLORS.activePlayerHighlight}
          />
        </View>
      )}
      <Text style={styles.avatarTextScoreboard}>{avatar}</Text>
      <Text
        style={[styles.scoreText, isActive && styles.activePlayerText]}
        numberOfLines={1}
      >
        {playerName.length > 8
          ? `${playerName.substring(0, 8)}…`
          : playerName}
      </Text>
      <Text style={styles.scorePoints}>{score}</Text>
    </View>
  );
});

const Scoreboard = React.memo(({ players, currentPlayerId, targetScore }) => {
  const safePlayers = useMemo(() => Array.isArray(players) ? players : [], [players]);
  
  return (
    <View style={styles.scoreboardWrapper}>
      <Text style={styles.targetScoreText}>Hedef: {targetScore} puan</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scoreboardContent}
        style={styles.scoreboardContainer}
        removeClippedSubviews={true}
      >
        {safePlayers.map((player) => (
          <PlayerScoreItem 
            key={player.id}
            player={player}
            isActive={player.id === currentPlayerId}
          />
        ))}
      </ScrollView>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render when active player changes, scores change, or target score changes
  if (prevProps.currentPlayerId !== nextProps.currentPlayerId) return false;
  if (prevProps.targetScore !== nextProps.targetScore) return false;
  
  if (!prevProps.players || !nextProps.players || 
      prevProps.players.length !== nextProps.players.length) return false;
      
  // Check if any player scores changed
  for (let i = 0; i < prevProps.players.length; i++) {
    if (prevProps.players[i].score !== nextProps.players[i].score) return false;
  }
  return true;
});

/* -------------------------------------------------------------------------- */
/*                               GAME  SCREEN                                 */
/* -------------------------------------------------------------------------- */

const GameScreen = ({ navigation }) => {
  const { gameState, actions } = useGame();
  const { width: windowWidth } = useWindowDimensions();

  /* --------------------------------- STATE -------------------------------- */
  const {
    players = [],
    currentPlayerIndex = 0,
    currentRedCard = null,
    currentBlueCardInfo = null,
    gamePhase = 'setup',
    message = '',
    lastActionMessage = '',
    selectedPlayerForTask = null,
    revealingPlayerIndex = 0,
    votingInfo = null,
    targetScore = 0,
  } = gameState || {};

  /* ---------------------------------------------------------------------- */
  /*                         EFFECT: NAVIGATION HANDLERS                    */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (gamePhase === 'assigningBlackCard' || gamePhase === 'ended') {
      navigation.replace('End');
    }
  }, [gamePhase, navigation]);

  useEffect(() => {
    const backAction = () => {
      const shouldConfirm = [
        'playing',
        'decision',
        'selectingPlayer',
        'revealingBlueCard',
        'redCardForSelected',
        'showingNewBlueCard',
        'voting',
      ].includes(gamePhase);

      if (shouldConfirm) {
        Alert.alert(
          'Oyundan Ayrıl',
          'Ana Menüye dönmek istediğine emin misin? Oyun kaydedilmeyecek.',
          [
            { text: 'Hayır', style: 'cancel' },
            { text: 'Evet, Çık', onPress: () => navigation.navigate('Home') },
          ],
          { cancelable: true },
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const isNavigatingToEnd =
        e.data.action.type === 'REPLACE' && e.data.action.payload?.name === 'End';
      const isNavigatingHomeByAction =
        e.data.action.type === 'NAVIGATE' &&
        e.data.action.payload?.name === 'Home';

      if (!isNavigatingToEnd && !isNavigatingHomeByAction && backAction()) {
        e.preventDefault();
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [navigation, gamePhase]);

  /* ---------------------------------------------------------------------- */
  /*                     PERFORMANCE OPTIMIZATIONS                          */
  /* ---------------------------------------------------------------------- */
  // Clean up memory and resources when component unmounts
  useEffect(() => {
    // On component unmount, cleanup any resources
    return () => {
      // Remove any potential listeners or timers
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                        DERIVED PLAYER  STATE                           */
  /* ---------------------------------------------------------------------- */
  const activePlayerId = useMemo(() => {
    if (gamePhase === 'initialBlueCardReveal')
      return players[revealingPlayerIndex]?.id;
    if (gamePhase === 'assigningBlackCard' && selectedPlayerForTask !== null)
      return selectedPlayerForTask;
    if (gamePhase === 'ended') return null;
    return players[currentPlayerIndex]?.id;
  }, [gamePhase, players, currentPlayerIndex, revealingPlayerIndex, selectedPlayerForTask]);

  const activePlayer = useMemo(
    () => players.find((p) => p.id === activePlayerId),
    [players, activePlayerId],
  );

  const otherPlayers = useMemo(
    () => players.filter((p) => p.id !== activePlayerId),
    [players, activePlayerId],
  );

  /* ---------------------------------------------------------------------- */
  /*                     EARLY RETURNS (LOADING / ERROR)                    */
  /* ---------------------------------------------------------------------- */
  if (players.length === 0 && gamePhase !== 'setup') {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexCenter}>
        <ActivityIndicator size={60} color={COLORS.negative} />
        <Text style={styles.loadingText}>Oyuncu Verisi Yok!</Text>
      </LinearGradient>
    );
  }

  if (
    !activePlayer &&
    !['ended', 'assigningBlackCard', 'setup', 'initialBlueCardReveal'].includes(
      gamePhase,
    )
  ) {
    console.error(
      'Aktif Oyuncu Hatası! Phase:',
      gamePhase,
      'ActivePlayerId:',
      activePlayerId,
      'CurrentIndex:',
      currentPlayerIndex,
    );
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexCenter}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={COLORS.negative}
        />
        <Text style={[styles.loadingText, { color: COLORS.negativeLight }]}>Aktif Oyuncu Hatası!</Text>
      </LinearGradient>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                    CARD  DISPLAY  DATA (MEMOIZED)                      */
  /* ---------------------------------------------------------------------- */
  const cardDisplayData = useMemo(() => {
    let type = 'kapalı';
    let text = '';
    let isVisible = false;
    let cardKey = 'placeholder';
    let faceDownContextType = 'red';

    const cardAreaVisible = [
      'initialBlueCardReveal',
      'revealingBlueCard',
      'showingNewBlueCard',
      'decision',
      'redCardForSelected',
      'playing',
    ].includes(gamePhase);

    if (cardAreaVisible) {
      // Blue card showing
      if (
        currentBlueCardInfo?.isVisible &&
        ['initialBlueCardReveal', 'revealingBlueCard', 'showingNewBlueCard'].includes(gamePhase)
      ) {
        type = 'mavi';
        text = currentBlueCardInfo.text;
        isVisible = true;
        cardKey = `blue-${gamePhase}-${currentBlueCardInfo.forPlayerId}`;
      }
      // Red card showing
      else if (
        currentRedCard?.isVisible &&
        ['decision', 'redCardForSelected'].includes(gamePhase)
      ) {
        type = 'kırmızı';
        text = currentRedCard.text;
        isVisible = true;
        cardKey = `red-${gamePhase}-${currentRedCard.id || text}`;
      }
      // Face‑down card (main pile)
      else if (
        gamePhase === 'playing' ||
        (gamePhase === 'initialBlueCardReveal' && !currentBlueCardInfo?.isVisible)
      ) {
        type = 'kapalı';
        text = '?';
        isVisible = true;
        cardKey = `closed-${gamePhase}`;
        faceDownContextType =
          gamePhase === 'playing' ? 'red' : /* initial face‑down blue */ 'blue';
      }
    }

    return {
      type,
      text: String(text ?? ''),
      isVisible,
      cardKey,
      faceDownContextType,
    };
  }, [currentBlueCardInfo, currentRedCard, gamePhase]);

  /* ---------------------------------------------------------------------- */
  /*                           PRE-COMPUTE VOTING DATA                      */
  /* ---------------------------------------------------------------------- */
  // Move hooks out of render functions to top level
  const voters = useMemo(() => 
    votingInfo ? players.filter((p) => p.id !== votingInfo.performerId) : [],
    [players, votingInfo]
  );
  
  const performer = useMemo(() => 
    votingInfo ? players.find((p) => p.id === votingInfo.performerId) : null,
    [players, votingInfo]
  );
  
  const handleVote = useCallback((voterId, voteType) => {
    if (actions?.castVote) {
      actions.castVote(voterId, voteType);
    }
  }, [actions]);

  /* ---------------------------------------------------------------------- */
  /*                      PRE-COMPUTE PLAYER SELECTION DATA                 */
  /* ---------------------------------------------------------------------- */
  const currentUserId = players[currentPlayerIndex]?.id;
  
  const selectablePlayers = useMemo(() => 
    players.filter(
      (p) => p.id !== currentUserId && p.blueCard && p.blueCard !== 'Deste Bitti!'
    ),
    [players, currentUserId]
  );

  const handleSelectPlayer = useCallback((playerId) => {
    if (actions?.selectPlayerForTask) {
      actions.selectPlayerForTask(playerId);
    }
  }, [actions]);

  const taskText = useMemo(() => 
    String(currentRedCard?.text || '...'),
    [currentRedCard]
  );

  /* ---------------------------------------------------------------------- */
  /*                               LAYOUT  SIZES                             */
  /* ---------------------------------------------------------------------- */
  // Precompute layout sizes to avoid recalculations on each render
  const layoutSizes = useMemo(() => {
    const cardWidth = Math.min(windowWidth * CARD_WIDTH_PERCENTAGE, CARD_MAX_WIDTH);
    return {
      responsiveCardWidth: cardWidth,
      responsiveCardHeight: cardWidth * CARD_ASPECT_RATIO,
      buttonContainerMaxWidth: Math.min(windowWidth * 0.95, SIZES.buttonMaxWidth),
      messageContainerMaxWidth: Math.min(windowWidth * 0.9, SIZES.contentMaxWidth)
    };
  }, [windowWidth]);

  /* ---------------------------------------------------------------------- */
  /*                          VISIBILITY FLAGS                               */
  /* ---------------------------------------------------------------------- */
  const visibilityFlags = useMemo(() => ({
    showCardArea: !['voting', 'selectingPlayer'].includes(gamePhase),
    showVotingArea: gamePhase === 'voting',
    showSelectionArea: gamePhase === 'selectingPlayer',
    showActionButtons: ![
      'voting',
      'selectingPlayer',
      'ended',
      'assigningBlackCard',
    ].includes(gamePhase)
  }), [gamePhase]);

  /* ---------------------------------------------------------------------- */
  /*                           RENDER COMPONENTS                            */
  /* ---------------------------------------------------------------------- */
  // Extract player score item into separate component for better memo
  const VoterRow = React.memo(({ voter, currentVote, onVoteYes, onVoteNo }) => {
    const hasVoted = currentVote !== null && currentVote !== undefined;
    
    return (
      <View style={styles.voterRow}>
        <Text style={styles.voterAvatar}>{voter.avatarId || '👤'}</Text>
        <Text style={styles.voterName} numberOfLines={1}>
          {voter.name}
        </Text>
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[
              styles.voteButtonBase,
              styles.voteYes,
              hasVoted && currentVote !== 'yes' && styles.voteDisabled,
            ]}
            onPress={onVoteYes}
            disabled={hasVoted}
            activeOpacity={0.7}
          >
            {currentVote === 'yes' ? (
              <Ionicons name="checkmark-circle" size={SIZES.iconSizeLarge * 1.2} color={COLORS.white} />
            ) : (
              <Ionicons name="thumbs-up-outline" size={SIZES.iconSizeLarge} color={COLORS.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.voteButtonBase,
              styles.voteNo,
              hasVoted && currentVote !== 'no' && styles.voteDisabled,
            ]}
            onPress={onVoteNo}
            disabled={hasVoted}
            activeOpacity={0.7}
          >
            {currentVote === 'no' ? (
              <Ionicons name="close-circle" size={SIZES.iconSizeLarge * 1.2} color={COLORS.white} />
            ) : (
              <Ionicons name="thumbs-down-outline" size={SIZES.iconSizeLarge} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  });

  // Memoized player selection item
  const PlayerSelectionItem = React.memo(({ player, onSelectPlayer }) => (
    <TouchableOpacity
      style={styles.playerSelectCard}
      onPress={() => onSelectPlayer(player.id)}
      activeOpacity={0.8}
    >
      <Text style={styles.playerSelectAvatar}>{player.avatarId || '👤'}</Text>
      <Text style={styles.playerSelectName} numberOfLines={1}>
        {player.name}
      </Text>
      <Ionicons name="chevron-forward-outline" size={SIZES.iconSize} color={COLORS.accentLight} />
    </TouchableOpacity>
  ));

  /* ---------------------------------------------------------------------- */
  /*                           RENDER FUNCTIONS                             */
  /* ---------------------------------------------------------------------- */
  const renderVotingUI = useCallback(() => {
    if (!votingInfo || !players || !actions?.castVote) return null;
    
    if (voters.length === 0) {
      return (
        <View style={styles.flexCenter}>
          <Ionicons name="sad-outline" size={40} color={COLORS.warningLight} />
          <Text style={styles.warningText}>Oylayacak başka oyuncu yok!</Text>
        </View>
      );
    }
    
    const taskText = votingInfo.taskText;
    const votes = votingInfo.votes;

    return (
      <View style={styles.votingOuterContainer}>
        <Text style={styles.sectionTitle}>🗳️ Oylama Zamanı!</Text>
        <Text style={styles.votingInfoText}>
          <Text style={styles.boldText}>{performer?.name || 'Oyuncu'}</Text>{' '}
          <Text>şu görevi başarıyla yaptı mı?</Text>
        </Text>
        <Text
          style={[styles.votingInfoText, styles.italicText, { color: COLORS.accentLight, marginBottom: SIZES.marginLarge * 1.5 }]}
        >
          "{taskText}"
        </Text>
        <ScrollView 
          style={styles.votingScroll} 
          contentContainerStyle={styles.votingList}
          removeClippedSubviews={true}
        >
          {voters.map((voter) => (
            <VoterRow
              key={voter.id}
              voter={voter}
              currentVote={votes[voter.id]}
              onVoteYes={() => handleVote(voter.id, 'yes')}
              onVoteNo={() => handleVote(voter.id, 'no')}
            />
          ))}
        </ScrollView>
        <Text style={styles.votingStatusText}>{message || ''}</Text>
      </View>
    );
  }, [votingInfo, voters, performer, message, handleVote]);

  const renderPlayerSelectionUI = useCallback(() => {
    if (!players || !actions?.selectPlayerForTask || !actions?.cancelPlayerSelection) return null;

    if (selectablePlayers.length === 0) {
      return (
        <View style={styles.playerSelectionOuterContainer}>
          <Text style={styles.sectionTitle}>👥 Oyuncu Seç</Text>
          <View style={styles.flexCenter}>
            <Ionicons name="sad-outline" size={40} color={COLORS.warningLight} />
            <Text style={styles.warningText}>Görev devredilecek uygun oyuncu bulunamadı.</Text>
          </View>
          <ActionButton
            title="Geri Dön"
            onPress={actions.cancelPlayerSelection}
            type="secondary"
            style={styles.cancelButton}
          />
        </View>
      );
    }

    return (
      <View style={styles.playerSelectionOuterContainer}>
        <Text style={styles.sectionTitle}>👥 Kimi Seçiyorsun?</Text>
        <Text style={styles.votingInfoText}>
          <Text>Bu görevi (</Text>
          <Text style={styles.italicText}>"{taskText}"</Text>
          <Text>) hangi oyuncu yapsın?</Text>
        </Text>
        <ScrollView 
          style={styles.playerSelectionScroll}
          removeClippedSubviews={true}
        >
          {selectablePlayers.map((player) => (
            <PlayerSelectionItem 
              key={player.id}
              player={player}
              onSelectPlayer={handleSelectPlayer}
            />
          ))}
        </ScrollView>
        <ActionButton
          title="Vazgeç"
          onPress={actions.cancelPlayerSelection}
          type="secondary"
          style={styles.cancelButton}
          iconLeft="close-circle-outline"
        />
      </View>
    );
  }, [players, actions, selectablePlayers, taskText, handleSelectPlayer]);

  const renderActionButtons = useCallback(() => {
    if (!players || !actions) return null;

    const currentPlayer = players[currentPlayerIndex];
    const currentRevealingPlayer = players[revealingPlayerIndex];

    switch (gamePhase) {
      case 'initialBlueCardReveal': {
        const canShowInitial =
          currentRevealingPlayer?.blueCard && currentRevealingPlayer.blueCard !== 'Deste Bitti!';
        return (
          <>
            {!currentBlueCardInfo?.isVisible ? (
              <ActionButton
                title={`${currentRevealingPlayer?.name || 'Oyuncu'}, Mavi Kartını Gör`}
                onPress={actions.showInitialBlueCard}
                disabled={!canShowInitial}
                iconLeft="eye-outline"
                type="primary"
              />
            ) : (
              <ActionButton
                title="Gördüm, Kapat & Devam Et"
                onPress={actions.hideInitialBlueCardAndProceed}
                type="secondary"
                iconRight="arrow-forward"
              />
            )}
            {!canShowInitial && !currentBlueCardInfo?.isVisible && (
              <Text style={styles.warningText}>Başlangıç Mavi Kartı yok veya geçersiz.</Text>
            )}
          </>
        );
      }
      case 'playing': {
        if (!currentRedCard && !currentBlueCardInfo && !votingInfo) {
          return (
            <ActionButton
              title={`${currentPlayer?.name || 'Oyuncu'}, Kırmızı Kart Çek!`}
              onPress={actions.drawRedCardForTurn}
              iconLeft="color-palette-outline"
              type="danger"
            />
          );
        }
        return null;
      }
      case 'decision': {
        if (!currentRedCard?.isVisible) return null;

        const canDelegate =
          otherPlayers.length > 0 &&
          otherPlayers.some((p) => p.blueCard && p.blueCard !== 'Deste Bitti!');

        return (
          <>
            <ActionButton
              title="Ben Yaparım (+5)"
              onPress={actions.iWillDoIt}
              iconLeft="checkmark-circle-outline"
              type="success"
            />
            <ActionButton
              title="Başkası Yapsın..."
              onPress={actions.delegateTaskStart}
              disabled={!canDelegate}
              type={canDelegate ? 'warning' : 'secondary'}
              iconLeft="people-outline"
              style={styles.spacerTop}
            />
            {!canDelegate && (
              <Text style={styles.warningText}>Görev devredilecek uygun oyuncu yok.</Text>
            )}
          </>
        );
      }
      case 'revealingBlueCard': {
        if (!currentBlueCardInfo?.isVisible) return null;
        return (
          <ActionButton
            title="Mavi Kart Görevini Yaptım (+10)"
            onPress={actions.delegatorDidBlueTask}
            iconLeft="checkmark-done-circle-outline"
            type="primary"
          />
        );
      }
      case 'redCardForSelected': {
        if (!currentRedCard?.isVisible) return null;
        const selectedPlayer = players.find((p) => p.id === selectedPlayerForTask);
        return (
          <ActionButton
            title={`${selectedPlayer?.name || 'Oyuncu'} Kırmızı Görevi Yaptı (+5)`}
            onPress={actions.selectedPlayerDidRedTask}
            iconLeft="flame-outline"
            type="success"
          />
        );
      }
      case 'showingNewBlueCard': {
        if (!currentBlueCardInfo?.isVisible) return null;
        const cardIsFinished = currentBlueCardInfo.text === 'Deste Bitti!';
        return (
          <ActionButton
            title={cardIsFinished ? 'Mavi Deste Bitti! (Kapat)' : 'Yeni Mavi Kartı Gördüm, Kapat'}
            onPress={actions.confirmCloseNewBlueCard}
            type="secondary"
            iconRight="close-circle-outline"
          />
        );
      }
      default:
        return null;
    }
  }, [gamePhase, currentBlueCardInfo, currentRedCard, players, revealingPlayerIndex, currentPlayerIndex, selectedPlayerForTask, actions, otherPlayers, votingInfo]);

  /* ---------------------------------------------------------------------- */
  /*                              MAIN  RENDER                               */
  /* ---------------------------------------------------------------------- */
  return (
    <LinearGradient
      colors={['#1e293b', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flexFill}
    >
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        {/* ---------------------------------------------------------------- */}
        {/*                                TOP                               */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.topArea}>
          <Scoreboard players={players} currentPlayerId={activePlayerId} targetScore={targetScore} />
        </View>

        {/* ---------------------------------------------------------------- */}
        {/*                              MIDDLE                              */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.middleArea}>
          {/* Last Action */}
          <View style={styles.lastActionContainer}>
            {lastActionMessage ? (
              <Text style={styles.lastActionText}>{lastActionMessage}</Text>
            ) : (
              <View style={styles.lastActionPlaceholder} />
            )}
          </View>

          {/* Main Stage */}
          <View style={styles.mainContentStage}>
            {visibilityFlags.showCardArea && (
              <View style={styles.cardDisplayArea}>
                <Card
                  type={cardDisplayData.type}
                  text={cardDisplayData.text}
                  isVisible={cardDisplayData.isVisible}
                  key={cardDisplayData.cardKey}
                  faceDownContextType={cardDisplayData.faceDownContextType}
                  style={[{ width: layoutSizes.responsiveCardWidth, height: layoutSizes.responsiveCardHeight }, styles.enhancedCard]}
                />
              </View>
            )}
            {visibilityFlags.showVotingArea && renderVotingUI()}
            {visibilityFlags.showSelectionArea && renderPlayerSelectionUI()}
          </View>

          {/* Main Message */}
          <View style={[styles.messageContainer, { maxWidth: layoutSizes.messageContainerMaxWidth }]}>
            <Text style={styles.messageText} numberOfLines={4}>
              {message || ' '}
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/*                               BOTTOM                             */}
        {/* ---------------------------------------------------------------- */}
        <View style={[styles.bottomArea, { maxWidth: layoutSizes.buttonContainerMaxWidth }]}>
          {visibilityFlags.showActionButtons && (
            <View style={styles.actionButtonsContainer}>{renderActionButtons()}</View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  /* LAYOUT WRAPPERS */
  flexFill: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop:
      Platform.OS === 'android' ? Math.max(Constants.statusBarHeight, 8) : 0,
  },
  flexCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },

  /* REGIONS */
  topArea: {
    paddingHorizontal: SIZES.paddingSmall,
    paddingBottom: SIZES.paddingSmall,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  middleArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    width: '100%',
  },
  bottomArea: {
    paddingBottom: SIZES.paddingLarge,
    paddingHorizontal: SIZES.padding,
    alignSelf: 'center',
    width: '100%',
    paddingTop: SIZES.paddingSmall,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  /* LAST ACTION */
  lastActionContainer: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
    width: '100%',
  },
  lastActionText: {
    fontSize: 16,
    color: COLORS.action,
    textAlign: 'center',
    fontWeight: '600',
  },
  lastActionPlaceholder: {
    height: 24,
  },

  /* MAIN STAGE */
  mainContentStage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SIZES.marginSmall,
  },
  cardDisplayArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },

  /* MESSAGE */
  messageContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.paddingMedium,
    minHeight: 80,
    marginTop: SIZES.marginSmall,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: SIZES.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageText: {
    fontSize: SIZES.body * 1.15,
    textAlign: 'center',
    color: COLORS.textPrimary,
    lineHeight: SIZES.body * 1.7,
    fontFamily: SIZES.regular,
    paddingHorizontal: SIZES.padding,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  /* ACTION BUTTON AREA */
  actionButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: SIZES.padding,
  },

  /* SCOREBOARD */
  scoreboardContainer: {
    width: '100%',
    paddingVertical: SIZES.paddingSmall,
  },
  scoreboardContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: SIZES.paddingSmall,
  },
  scoreboardWrapper: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  targetScoreText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  activePlayerColumn: {
    borderColor: COLORS.activePlayerHighlight,
    backgroundColor: 'rgba(66, 153, 225, 0.3)',
    transform: [{ scale: 1.03 }],
    shadowColor: COLORS.activePlayerHighlight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  turnIndicatorIconWrapper: {
    position: 'absolute',
    top: -SIZES.iconSizeSmall * 0.4,
    left: 0,
    right: 0,
    alignItems: 'center',
    shadowColor: COLORS.activePlayerHighlight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  avatarTextScoreboard: {
    fontSize: SIZES.h4,
    marginBottom: SIZES.base * 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scoreText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    fontFamily: SIZES.regular,
    marginBottom: SIZES.base * 0.5,
    textAlign: 'center',
  },
  activePlayerText: {
    color: COLORS.activePlayerText,
    fontFamily: SIZES.bold,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scorePoints: {
    fontSize: SIZES.title,
    color: COLORS.textPrimary,
    fontFamily: SIZES.bold,
    textAlign: 'center',
    marginTop: 'auto',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  /* TEXT UTIL */
  sectionTitle: {
    fontSize: SIZES.h3,
    fontFamily: SIZES.bold,
    color: COLORS.textPrimary,
    marginBottom: SIZES.margin,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  boldText: {
    fontFamily: SIZES.bold,
    color: COLORS.textPrimary,
  },
  italicText: {
    fontStyle: 'italic',
  },

  /* VOTING */
  votingOuterContainer: {
    flex: 1,
    width: '100%',
    maxWidth: SIZES.contentMaxWidth * 0.95,
    padding: SIZES.padding,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: SIZES.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.warningLight,
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  votingInfoText: {
    fontSize: SIZES.body,
    fontFamily: SIZES.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.base,
    lineHeight: SIZES.lineHeightBase,
  },
  votingScroll: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: '60%',
    marginBottom: SIZES.margin,
  },
  votingList: {
    paddingBottom: SIZES.padding,
  },
  voterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.margin * 1.2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.inputRadius,
    padding: SIZES.paddingSmall,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  voterName: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    fontFamily: SIZES.regular,
    flex: 1,
    marginRight: SIZES.base,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  voterAvatar: {
    fontSize: SIZES.body * 1.1,
    marginRight: SIZES.marginSmall,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  voteButtons: {
    flexDirection: 'row',
  },
  voteButtonBase: {
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.paddingMedium,
    borderRadius: SIZES.buttonRadius * 2,
    marginHorizontal: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 70,
    minHeight: 60,
  },
  voteYes: {
    backgroundColor: COLORS.positive,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.positiveLight,
  },
  voteNo: {
    backgroundColor: COLORS.negative,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.negativeLight,
  },
  voteDisabled: {
    opacity: 0.4,
    backgroundColor: COLORS.textMuted,
  },
  votingStatusText: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SIZES.marginSmall,
    fontStyle: 'italic',
  },

  /* PLAYER SELECTION */
  playerSelectionOuterContainer: {
    flex: 1,
    width: '100%',
    maxWidth: SIZES.contentMaxWidth * 0.95,
    justifyContent: 'space-between',
    padding: SIZES.padding,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: SIZES.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  playerSelectionScroll: {
    flexGrow: 0,
    flexShrink: 1,
    width: '100%',
    marginVertical: SIZES.marginSmall,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playerSelectAvatar: {
    fontSize: SIZES.h3,
    marginRight: SIZES.marginMedium,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  playerSelectName: {
    flex: 1,
    fontSize: SIZES.body * 1.1,
    fontFamily: SIZES.bold,
    color: COLORS.textPrimary,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    marginTop: SIZES.margin,
    width: '100%',
  },

  /* UTILS */
  warningText: {
    fontSize: SIZES.caption,
    color: COLORS.warningLight,
    textAlign: 'center',
    marginTop: SIZES.base,
    fontFamily: SIZES.regular,
    lineHeight: SIZES.lineHeightBase * 0.9,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  spacerTop: {
    marginTop: SIZES.marginSmall,
  },
  loadingText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontFamily: SIZES.regular,
    textAlign: 'center',
  },
});

export default GameScreen;
// --- END OF FILE GameScreen.js ---
