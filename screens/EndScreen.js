import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Share,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGame } from '../context/useGame';
import ActionButton from '../components/ActionButton';
import { COLORS, SIZES } from '../constants/theme';

/**
 * End-of-game screen — everything (scorboard + buttons) scrolls together.
 */
const EndScreen = ({ navigation }) => {
  /* ────── STATE ────── */
  const { gameState, actions } = useGame();
  const {
    players = [],
    message: endScreenMessage,
    gamePhase,
    selectedPlayerForTask,
  } = gameState;

  /* winner / loser / sorted list */
  const { winner, loser, sortedPlayers } = useMemo(() => {
    if (!players.length) return { winner: null, loser: null, sortedPlayers: [] };

    const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const winnerPlayer = sorted[0];
    const explicitLoser = players.find(p => p.id === selectedPlayerForTask);
    const implicitLoser = sorted.at(-1);
    const loserPlayer =
      explicitLoser || (implicitLoser?.id !== winnerPlayer?.id ? implicitLoser : null);

    return { winner: winnerPlayer, loser: loserPlayer, sortedPlayers: sorted };
  }, [players, selectedPlayerForTask]);

  /* ────── EFFECTS ────── */
  const confettiRef = useRef(null);

  useEffect(() => {
    if (winner) {
      const t = setTimeout(() => {
        confettiRef.current?.start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [winner]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(
      `Oyun sona erdi. Kazanan: ${winner?.name ?? 'belirlenemedi'}`,
    );
  }, [winner]);

  /* ────── ACTIONS ────── */
  const handleNewGame = useCallback(() => {
    actions.restartGame();
    navigation.replace('Setup');
  }, [actions, navigation]);

  const handleReplay = useCallback(() => {
    actions.restartWithSamePlayers();
    navigation.replace('Game');
  }, [actions, navigation]);

  const handleDrawBlackCard = useCallback(() => {
    actions.assignAndFinishBlackCard();
    Haptics.selectionAsync();
  }, [actions]);

  const handleShareResults = useCallback(async () => {
    try {
      let msg = 'Kart Oyunu Sonuçları\n\n';
      if (winner) msg += `🏆 Kazanan: ${winner.avatarId} ${winner.name} (${winner.score} Puan)\n`;
      if (loser) msg += `⚫️ Siyah Kart: ${loser.avatarId} ${loser.name}\n`;
      msg += '\nSkor Tablosu:\n';
      sortedPlayers.forEach((p, i) => {
        msg += `${i + 1}. ${p.avatarId} ${p.name}: ${p.score} Puan\n`;
      });
      await Share.share({ message: msg.trim() });
    } catch (e) {
      console.error('share error', e);
    }
  }, [sortedPlayers, winner, loser]);

  /* ────── RENDERERS ────── */
  const renderScoreRow = useCallback(
    ({ item, index }) => {
      const isWinner = item.id === winner?.id;
      const isLoser  = item.id === loser?.id;

      return (
        <MotiView
          from={{ opacity: 0, translateX: -15 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 150 + index * 40 }}
          style={[
            styles.scoreRow,
            isWinner && styles.winnerRow,
            isLoser && styles.loserRow,
          ]}
        >
          <Text style={styles.rankText}>{index + 1}.</Text>
          <Text style={styles.avatarText}>{item.avatarId || '👤'}</Text>
          <Text style={styles.scoreName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.scorePoints}>{item.score ?? 0}</Text>
        </MotiView>
      );
    },
    [winner, loser],
  );

  /* ────── UI ────── */
  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

        {/* Confetti */}
        <ConfettiCannon
          ref={confettiRef}
          autoStart={false}
          fadeOut
          count={winner ? 240 : 0}
          origin={{ x: -10, y: 0 }}
          explosionSpeed={420}
          fallSpeed={2900}
          colors={[COLORS.accent, COLORS.positive, COLORS.warning, COLORS.white]}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header & winner */}
          <MotiView
            from={{ opacity: 0, scale: 0.7, translateY: -40 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
            style={styles.header}
          >
            <Text style={styles.title}>Oyun Bitti!</Text>
            <View
              style={[styles.winnerContainer, !winner && styles.noWinnerContainer]}
              accessibilityLiveRegion="polite"
            >
              <Text style={[styles.winnerText, !winner && styles.noWinnerText]}>
                {winner
                  ? `🏆 Kazanan: ${winner.avatarId} ${winner.name} (${winner.score} Puan)`
                  : 'Kazanan Belirlenemedi'}
              </Text>
            </View>
          </MotiView>

          {/* Scores */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 250 }}
            style={styles.scoresContainer}
          >
            <Text style={styles.scoresTitle}>📊 Final Skorları</Text>
            <FlatList
              data={sortedPlayers}
              keyExtractor={item => String(item.id)}
              renderItem={renderScoreRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scoresList}
              scrollEnabled={false}   /* outer ScrollView handles scrolling */
            />
          </MotiView>

          {/* Black card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 }}
            style={styles.blackCardContainer}
          >
            <Ionicons
              name="skull-outline"
              size={SIZES.iconSizeLarge * 1.2}
              color={COLORS.warningLight}
              style={styles.blackCardIcon}
            />
            <Text style={styles.messageText}>{endScreenMessage || ' '}</Text>
            {gamePhase === 'assigningBlackCard' && loser && (
              <ActionButton
                title={`${loser.name}, Kara Talihinle Yüzleş!`}
                onPress={handleDrawBlackCard}
                type="danger"
                iconLeft="skull-outline"
                style={styles.blackCardButton}
              />
            )}
          </MotiView>

          {/* Bottom actions (scrolls together) */}
          {gamePhase === 'ended' && (
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 500 }}
              style={styles.bottomActionContainer}
            >
              <ActionButton
                title="Tekrar Oyna (Aynı Kadro)"
                onPress={handleReplay}
                iconLeft="refresh-outline"
                type="primary"
                style={styles.actionButton}
              />
              <ActionButton
                title="Yeni Oyun Kur"
                onPress={handleNewGame}
                iconLeft="people-outline"
                type="secondary"
                style={styles.actionButton}
              />
              <ActionButton
                title="Sonuçları Paylaş"
                onPress={handleShareResults}
                iconLeft="share-social-outline"
                type="outline"
                style={styles.actionButton}
              />
            </MotiView>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

/* ────── STYLES ────── */
const styles = StyleSheet.create({
  flexFill: { flex: 1 },
  safeArea: { flex: 1 },

  scroll:  { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.paddingLarge,
  },

  /* Header */
  header: { width: '100%', alignItems: 'center', marginBottom: SIZES.marginMedium },
  title:  {
    fontSize: SIZES.h1 * 1.2,
    fontFamily: SIZES.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.marginMedium,
  },
  winnerContainer: {
    paddingVertical: SIZES.padding * 0.8,
    paddingHorizontal: SIZES.paddingLarge,
    borderRadius: SIZES.buttonRadius * 1.5,
    borderWidth: 1.5,
    borderColor: COLORS.positiveLight,
    backgroundColor: 'rgba(72,187,120,0.3)',
  },
  noWinnerContainer: {
    backgroundColor: 'rgba(113,128,150,0.25)',
    borderColor: COLORS.textMuted,
  },
  winnerText: {
    fontSize: SIZES.title * 1.05,
    fontFamily: SIZES.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  noWinnerText: { color: COLORS.textSecondary },

  /* Scores */
  scoresContainer: {
    width: '95%',
    maxWidth: SIZES.contentMaxWidth,
    backgroundColor: COLORS.scoreboardBg,
    borderRadius: SIZES.cardRadius * 1.1,
    paddingVertical: SIZES.paddingMedium,
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.marginLarge,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scoresTitle: {
    fontSize: SIZES.h3,
    fontFamily: SIZES.bold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.marginMedium,
  },
  scoresList: { paddingBottom: SIZES.padding },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding * 0.8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  winnerRow: {
    backgroundColor: 'rgba(72,187,120,0.15)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.positive,
    paddingLeft: SIZES.paddingSmall,
  },
  loserRow: {
    backgroundColor: 'rgba(245,101,101,0.12)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.negative,
    paddingLeft: SIZES.paddingSmall,
  },
  rankText: {
    width: 28,
    textAlign: 'right',
    marginRight: SIZES.base * 1.2,
    fontSize: SIZES.body,
    fontFamily: SIZES.bold,
    color: COLORS.textMuted,
  },
  avatarText: { fontSize: SIZES.title, marginRight: SIZES.base },
  scoreName: {
    flex: 1,
    fontSize: SIZES.body,
    fontFamily: SIZES.regular,
    color: COLORS.textPrimary,
  },
  scorePoints: {
    minWidth: 45,
    textAlign: 'right',
    fontSize: SIZES.body * 1.05,
    fontFamily: SIZES.bold,
    color: COLORS.textPrimary,
  },

  /* Black Card */
  blackCardContainer: {
    width: '95%',
    maxWidth: SIZES.contentMaxWidth,
    alignItems: 'center',
    padding: SIZES.paddingLarge,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: SIZES.cardRadius * 1.1,
    borderWidth: 1.4,
    borderColor: COLORS.warning,
    marginBottom: SIZES.marginLarge,
  },
  blackCardIcon: { marginBottom: 8, opacity: 0.85 },
  messageText: {
    fontSize: SIZES.body,
    lineHeight: SIZES.body * 1.6,
    textAlign: 'center',
    color: COLORS.warningLight,
    marginBottom: SIZES.marginMedium,
  },
  blackCardButton: {
    marginTop: SIZES.marginSmall,
    width: '100%',
    maxWidth: 320,
  },

  /* Bottom buttons */
  bottomActionContainer: {
    width: '90%',
    maxWidth: SIZES.buttonMaxWidth,
    alignItems: 'center',
    paddingTop: SIZES.margin,
    marginBottom: SIZES.marginLarge, /* so last button nefes alır */
  },
  actionButton: {
    width: '100%',
    marginBottom: SIZES.marginSmall * 1.25,
  },
});

export default EndScreen;
