import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, Share } from 'react-native';
import Constants from 'expo-constants';
import { useGame } from '../context/useGame';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
import ActionButton from '../components/ActionButton';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons'; // İkonlar için

const EndScreen = ({ navigation }) => {
    const { gameState, actions } = useGame();
    const { players, message: endScreenMessage, gamePhase, selectedPlayerForTask } = gameState;
    const confettiRef = useRef(null);

    // Kazananı ve Kaybedeni belirle (useMemo ile gereksiz hesaplamaları önle)
    const gameResult = useMemo(() => {
        if (!players || players.length === 0) {
            return { winner: null, loser: null, sortedPlayers: [] };
        }
         // Skora göre büyükten küçüğe sırala
         const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
         // Kazanan: En yüksek skorlu VEYA 20'ye ilk ulaşan (Kurala göre en yüksek skorlu varsayalım)
         const winner = sorted[0]?.score >= 0 ? sorted[0] : null; // En az 0 puanı olan kazanan olabilir
         // Kaybeden: En düşük skorlu (gamePhase='assigningBlackCard' ise selectedPlayerForTask'tan da alınabilir)
         // Eğer Siyah Kart atanacaksa ID'si zaten bellidir
          const loserExplicit = players.find(p => p.id === selectedPlayerForTask);
          // Explicit kaybeden yoksa en düşüğü bul
          const loserImplicit = sorted[sorted.length - 1];
         const loser = loserExplicit || (loserImplicit?.score < winner?.score ? loserImplicit : null) ; // Kaybeden kazananla aynı kişi olamaz

         return { winner, loser, sortedPlayers: sorted };
    }, [players, selectedPlayerForTask]);

    const { winner, loser, sortedPlayers } = gameResult;

    // Konfetiyi kazanan belirlendiğinde ve animasyon referansı hazır olduğunda tetikle
    useEffect(() => {
        if (winner && confettiRef.current) {
            // Konfetiyi başlat (biraz gecikmeyle daha iyi görünebilir)
             const timer = setTimeout(() => {
                if (confettiRef.current) {
                     confettiRef.current.start();
                 }
             }, 300); // Ekran animasyonu bittikten sonra
             return () => clearTimeout(timer); // Cleanup
        }
    }, [winner]); // Sadece winner değiştiğinde veya component mount edildiğinde

    // Aksiyon Handler'ları (useCallback gerekmez, doğrudan kullanılıyor)
    const handleNewGame = () => {
        try {
            actions.restartGame();
            navigation.replace('Setup'); // Setup'a geri dön, stack'i temizle
        } catch(error){ console.error("Error restarting game:", error); alert("Yeni oyun başlatılırken bir hata oluştu."); }
    }

    const handleReplay = () => {
        try {
            actions.restartWithSamePlayers();
            navigation.replace('Game'); // Oyuna geri dön, stack'i temizle
        } catch(error){ console.error("Error replaying game:", error); alert("Oyun yeniden başlatılırken bir hata oluştu."); }
    }

    const handleDrawBlackCard = () => {
        try {
            actions.assignAndFinishBlackCard(); // Reducer state'i 'ended' yapacak
        } catch(error){ console.error("Error assigning black card:", error); alert("Siyah kart çekilirken bir hata oluştu."); }
    }

    // Sonucu Paylaşma Fonksiyonu (Opsiyonel)
    const handleShareResults = async () => {
         try {
            let shareMessage = "Kart Oyunu Sonuçları:\n\n";
            if (winner) {
                 shareMessage += `🏆 Kazanan: ${winner.avatarId} ${winner.name} (${winner.score} Puan)\n`;
             }
             if (loser) {
                 shareMessage += `⚫️ Siyah Kart: ${loser.avatarId} ${loser.name}\n`;
             }
             shareMessage += "\nSkorlar:\n";
             sortedPlayers.forEach((p, index) => {
                 shareMessage += `${index + 1}. ${p.avatarId} ${p.name}: ${p.score} Puan\n`;
             });

             await Share.share({ message: shareMessage });
         } catch (error) {
             console.error("Error sharing results:", error);
             alert('Sonuçlar paylaşılamadı.');
         }
     };

    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            {/* Konfeti */}
            <ConfettiCannon
                 count={winner ? 250 : 0} // Sadece kazanan varsa
                 origin={{ x: -10, y: 0 }}
                 autoStart={false} // useEffect ile tetiklenecek
                 ref={confettiRef}
                 fadeOut={true}
                 explosionSpeed={400} // Hız
                 fallSpeed={3000} // Düşme hızı
                 colors={[COLORS.accent, COLORS.positive, COLORS.warning, COLORS.white]} // Tema renkleri
             />

            <View style={styles.container}>
                 {/* Üst Başlık ve Kazanan Alanı */}
                <MotiView
                    from={{ opacity: 0, scale: 0.5, translateY: -50 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 100 }}
                    style={styles.header}
                >
                     <Text style={styles.title}>Oyun Bitti!</Text>
                     {winner && (
                         <View style={styles.winnerContainer}>
                            <Text style={styles.winnerText}>
                                 🏆 Kazanan: {winner.avatarId} {winner.name} ({winner.score} Puan) 🏆
                             </Text>
                         </View>
                    )}
                      {!winner && (
                         <View style={[styles.winnerContainer, {backgroundColor: 'rgba(113, 128, 150, 0.25)', borderColor: COLORS.textMuted}]}>
                             <Text style={[styles.winnerText, {color: COLORS.textSecondary}]}>Kazanan Belirlenemedi</Text>
                          </View>
                      )}
                </MotiView>

                 {/* Orta İçerik Alanı */}
                <ScrollView
                    style={styles.middleScroll}
                    contentContainerStyle={styles.middleContentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Final Skorları */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400, delay: 250 }}
                        style={styles.scoresContainer}
                    >
                        <Text style={styles.scoresTitle}>📊 Final Skorları</Text>
                         <View style={styles.scoresList}>
                            {sortedPlayers.map((player, index) => (
                                <MotiView
                                    key={player.id}
                                    from={{ opacity: 0, translateX: -20 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ type: 'timing', duration: 300, delay: 300 + index * 50 }}
                                    style={[
                                        styles.scoreRow,
                                        player.id === winner?.id && styles.winnerRow, // Kazananı vurgula
                                        player.id === loser?.id && styles.loserRow, // Kaybedeni vurgula
                                    ]}
                                >
                                    <Text style={styles.rankText}>{index + 1}.</Text>
                                    <Text style={styles.avatarText}>{player.avatarId || '👤'}</Text>
                                    <Text style={styles.scoreName} numberOfLines={1}>{player.name}</Text>
                                    <Text style={styles.scorePoints}>{player.score || 0}</Text>
                                </MotiView>
                             ))}
                         </View>
                    </MotiView>

                     {/* Siyah Kart Alanı */}
                    <MotiView
                         from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                         transition={{ type: 'timing', duration: 400, delay: 400 }}
                         style={styles.blackCardContainer}
                     >
                        <Ionicons name="skull-outline" size={SIZES.iconSizeLarge * 1.2} color={COLORS.warningLight} style={{ marginBottom: 10, opacity: 0.8 }} />
                        <Text style={styles.messageText} selectable>{endScreenMessage || " "}</Text>
                         {/* Siyah kart çekme butonu sadece ilgili fazda ve kaybeden varsa */}
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
                 </ScrollView>

                 {/* Alt Aksiyonlar */}
                 {/* Sadece oyun tamamen bittiğinde ('ended' fazı) göster */}
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
                             type="secondary"
                            style={styles.actionButton}
                            iconLeft="people-outline" // İkon değişti
                         />
                         <ActionButton // Paylaş butonu
                              title="Sonuçları Paylaş"
                             onPress={handleShareResults}
                              type="outline"
                              style={styles.actionButton}
                              iconLeft="share-social-outline"
                          />
                     </MotiView>
                )}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    flexFill: { flex: 1 },

    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.paddingLarge,
        paddingTop: Platform.OS === 'android'
            ? Constants.statusBarHeight + SIZES.padding
            : SIZES.paddingLarge,
    },

    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: SIZES.marginMedium,
    },

    title: {
        fontSize: SIZES.h1 * 1.2,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SIZES.marginMedium,
    },

    winnerContainer: {
        backgroundColor: 'rgba(72, 187, 120, 0.3)',
        paddingVertical: SIZES.padding,
        paddingHorizontal: SIZES.paddingLarge,
        borderRadius: SIZES.buttonRadius * 1.5,
        borderWidth: 1.5,
        borderColor: COLORS.positiveLight,
        shadowColor: COLORS.positive,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 8,
    },

    winnerText: {
        fontSize: SIZES.title * 1.1,
        fontFamily: SIZES.bold,
        color: COLORS.white,
        textAlign: 'center',
    },

    middleScroll: {
        flex: 1,
        width: '100%',
        marginVertical: SIZES.marginMedium,
    },

    middleContentContainer: {
        alignItems: 'center',
        paddingBottom: SIZES.padding,
    },

    scoresContainer: {
        width: '95%',
        maxWidth: SIZES.contentMaxWidth,
        backgroundColor: COLORS.scoreboardBg,
        borderRadius: SIZES.cardRadius * 1.1,
        padding: SIZES.paddingMedium,
        marginBottom: SIZES.marginLarge,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },

    scoresTitle: {
        fontSize: SIZES.h3,
        fontFamily: SIZES.bold,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SIZES.marginMedium,
    },
    scoresList: { // Added for potential future styling
        width: '100%',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SIZES.padding * 0.8,
        paddingHorizontal: SIZES.paddingSmall,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: SIZES.base,
        marginBottom: SIZES.base * 0.5,
    },

    winnerRow: {
        backgroundColor: 'rgba(72, 187, 120, 0.15)',
        borderBottomColor: COLORS.positive,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.positive,
        paddingLeft: SIZES.paddingSmall + 4,
    },

    loserRow: {
        backgroundColor: 'rgba(245, 101, 101, 0.1)',
        borderBottomColor: COLORS.negative,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.negative,
        paddingLeft: SIZES.paddingSmall + 4,
    },

    rankText: {
        fontSize: SIZES.body,
        fontFamily: SIZES.bold,
        color: COLORS.textMuted,
        marginRight: SIZES.base * 1.5,
        minWidth: 25,
        textAlign: 'right',
    },

    avatarText: {
        fontSize: SIZES.title,
        marginRight: SIZES.base,
        marginLeft: SIZES.base * 0.5,
    },

    scoreName: {
        flex: 1,
        fontSize: SIZES.body,
        fontFamily: SIZES.regular,
        color: COLORS.textPrimary,
        marginRight: SIZES.base,
    },

    scorePoints: {
        fontSize: SIZES.body * 1.1,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        marginLeft: 'auto',
        minWidth: 40,
        textAlign: 'right',
    },

    blackCardContainer: {
        width: '95%',
        maxWidth: SIZES.contentMaxWidth,
        alignItems: 'center',
        padding: SIZES.paddingLarge,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: SIZES.cardRadius * 1.1,
        minHeight: 150,
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.warning,
        marginBottom: SIZES.marginLarge,
    },

    messageText: {
        fontSize: SIZES.body,
        textAlign: 'center',
        color: COLORS.warningLight,
        fontFamily: SIZES.regular,
        lineHeight: SIZES.body * 1.6,
        marginBottom: SIZES.marginMedium,
        paddingHorizontal: SIZES.base,
    },

    blackCardButton: {
        marginTop: SIZES.marginSmall,
        width: '100%',
        maxWidth: 300,
    },

    bottomActionContainer: {
        width: '90%',
        maxWidth: SIZES.buttonMaxWidth,
        alignItems: 'center',
        paddingTop: SIZES.margin,
    },

    actionButton: {
        width: '100%',
        marginBottom: SIZES.marginSmall * 1.2,
    },
});


export default EndScreen;