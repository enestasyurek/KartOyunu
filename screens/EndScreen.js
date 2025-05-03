// screens/EndScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import Constants from 'expo-constants';
import { useGame } from '../context/useGame'; // <-- Doğru hook
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import ActionButton from '../components/ActionButton';

const EndScreen = ({ navigation }) => {
    // --- useGame Hook Kullanımı ---
    const { gameState, actions } = useGame(); // <-- State ve Actions'ı al
    const { players, message, gamePhase, selectedPlayerForTask } = gameState;

    // Determine loser and winner from gameState
    const loser = players.find(p => p.id === selectedPlayerForTask);
    const winner = players.length > 0 ? players.reduce((max, p) => p.score > max.score ? p : max, players[0]) : null;

    // --- Handlers ---
    const handleNewGame = () => {
        try {
            actions.restartGame(); // <-- actions kullanıldı
            navigation.navigate('Setup');
        } catch(error){ console.error("Error restarting game:", error); alert("Yeni oyun başlatılırken bir hata oluştu."); }
    }

    const handleReplay = () => {
        try {
            // Pass gameState to action if it needs the current state for checks
            actions.restartWithSamePlayers(gameState); // <-- actions kullanıldı
            navigation.navigate('Game');
        } catch(error){ console.error("Error replaying game:", error); alert("Oyun yeniden başlatılırken bir hata oluştu."); }
    }

     const handleDrawBlackCard = () => {
         try {
             // Pass gameState to action if it needs the current state for checks
             actions.assignAndFinishBlackCard(gameState); // <-- actions kullanıldı
         } catch(error){ console.error("Error assigning black card:", error); alert("Siyah kart çekilirken bir hata oluştu."); }
     }

    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            <View style={styles.container}>
                {/* Header: Title and Winner */}
                <View style={styles.header}>
                     <Text style={styles.title}>Oyun Bitti!</Text>
                     {winner && (
                         <View style={styles.winnerContainer}>
                            <Text style={styles.winnerText}>🏆 Kazanan: {winner.name} ({winner.score} Puan)</Text>
                         </View>
                    )}
                </View>

                {/* Middle Content: Scores and Black Card */}
                <View style={styles.middleContent}>
                    <View style={styles.scoresContainer}>
                        <Text style={styles.scoresTitle}>Final Skorları</Text>
                        <ScrollView style={styles.scoresScroll} contentContainerStyle={styles.scoresContent} showsVerticalScrollIndicator={false}>
                            {players.map(player => (
                                <View key={player.id} style={styles.scoreRow}>
                                    <Text style={styles.avatarText}>{player.avatarId || '👤'}</Text>
                                    <Text style={styles.scoreName} numberOfLines={1}>{player.name}:</Text>
                                    <Text style={styles.scorePoints}>{player.score}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                    <View style={styles.blackCardContainer}>
                        <Text style={styles.messageText}>{message}</Text>
                        {gamePhase === 'assigningBlackCard' && loser && (
                            <ActionButton title={`${loser.name} Siyah Kart Çeksin!`} onPress={handleDrawBlackCard} type="danger" style={{width: '90%'}}/>
                        )}
                    </View>
                </View>

                {/* Bottom Actions: Replay Buttons */}
                 {gamePhase === 'ended' && (
                    <View style={styles.bottomAction}>
                        <ActionButton title="Tekrar Oyna (Aynı Oyuncular)" onPress={handleReplay} />
                        <ActionButton title="Yeni Oyun Kur" onPress={handleNewGame} type="secondary" style={styles.spacerTop} />
                    </View>
                )}
            </View>
        </LinearGradient>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    flexFill: { flex: 1 },
    container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30, paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 20 : 40, },
    header: { width: '100%', alignItems: 'center', marginBottom: 15, },
    title: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 10, },
    winnerContainer: { backgroundColor: 'rgba(72, 187, 120, 0.2)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, },
    winnerText: { fontSize: 19, fontWeight: 'bold', color: COLORS.positive, textAlign: 'center', },
    middleContent: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', marginVertical: 15, },
    scoresContainer: { width: '95%', maxHeight: '45%', backgroundColor: COLORS.scoreboardBg, borderRadius: 15, padding: 15, marginBottom: 20, },
    scoresTitle:{ fontSize: 18, fontWeight: 'bold', color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12, },
    scoresScroll: { flexGrow: 0, },
    scoresContent: { paddingBottom: 5, },
    scoreRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', },
    avatarText: { fontSize: 16, marginRight: 8, },
    scoreName: { flex: 1, fontSize: 16, color: COLORS.textPrimary, },
    scorePoints: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginLeft: 10 },
    blackCardContainer: { width: '95%', alignItems: 'center', padding: 15, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, minHeight: 100, justifyContent: 'center', },
    messageText: { fontSize: 16, textAlign: 'center', color: COLORS.warning, fontWeight: '600', lineHeight: 23, marginBottom: 15, },
    bottomAction: { width: '90%', maxWidth: 350, justifyContent: 'flex-end', },
    spacerTop: { marginTop: 10, },
});

export default EndScreen;