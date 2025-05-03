// screens/StatisticsScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/useGame'; // <-- Doğru hook
import { COLORS } from '../constants/theme';
import ActionButton from '../components/ActionButton';

const StatisticsScreen = ({ navigation }) => {
    const { gameState } = useGame(); // State'i al
    const { stats, players } = gameState; // stats ve players objelerini al

    // Helper to get player stat safely
    const getPlayerStat = (statKey, playerId) => {
        return stats[statKey]?.[playerId] || 0;
    };

    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Oyun İstatistikleri</Text>
                </View>

                <ScrollView style={styles.statsScroll} contentContainerStyle={styles.statsContent} showsVerticalScrollIndicator={false}>
                    {/* Genel İstatistikler */}
                    <View style={styles.statSection}>
                         <Text style={styles.sectionTitle}>Genel</Text>
                         <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Oynanan Oyun:</Text>
                            <Text style={styles.statValue}>{stats.gamesPlayed || 0}</Text>
                         </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Toplam Puan:</Text>
                            <Text style={styles.statValue}>{stats.totalScoreAccumulated || 0}</Text>
                         </View>
                         <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Eklenen Özel Görev:</Text>
                            <Text style={styles.statValue}>{stats.customTasksAdded || 0}</Text>
                         </View>
                    </View>

                    {/* Oyuncu Bazlı İstatistikler */}
                    <View style={styles.statSection}>
                         <Text style={styles.sectionTitle}>Oyuncu İstatistikleri</Text>
                         {/* Check if players exist in the current game state or overall stats */}
                         {(stats.wins && Object.keys(stats.wins).length > 0) || (stats.tasksCompleted && Object.keys(stats.tasksCompleted).length > 0) ? (
                            // Get player info potentially from stats keys if players array is empty (e.g., app just opened)
                            // This part needs refinement based on how you want to display stats without an active game
                            // For now, let's assume stats are primarily viewed after a game or players are loaded
                             Object.keys(stats.wins || {}).map(playerIdStr => {
                                const playerId = parseInt(playerIdStr, 10);
                                // Try to find player name from current game state, or show ID
                                const player = players?.find(p => p.id === playerId);
                                const playerName = player?.name || `Oyuncu ID: ${playerId}`;
                                const playerAvatar = player?.avatarId || '👤';
                                return (
                                    <View key={playerId} style={styles.playerStats}>
                                        <Text style={styles.playerName}>{playerAvatar} {playerName}</Text>
                                        <View style={styles.statRowInner}><Text style={styles.statLabelInner}>Kazanma:</Text><Text style={styles.statValueInner}>{getPlayerStat('wins', playerId)}</Text></View>
                                        <View style={styles.statRowInner}><Text style={styles.statLabelInner}>Tamamlanan Görev:</Text><Text style={styles.statValueInner}>{getPlayerStat('tasksCompleted', playerId)}</Text></View>
                                        <View style={styles.statRowInner}><Text style={styles.statLabelInner}>Devredilen Görev:</Text><Text style={styles.statValueInner}>{getPlayerStat('tasksDelegated', playerId)}</Text></View>
                                        <View style={styles.statRowInner}><Text style={styles.statLabelInner}>Kazanılan Oylu Görev:</Text><Text style={styles.statValueInner}>{getPlayerStat('votableTasksWon', playerId)}</Text></View>
                                        <View style={styles.statRowInner}><Text style={styles.statLabelInner}>Çekilen Siyah Kart:</Text><Text style={styles.statValueInner}>{getPlayerStat('blackCardsDrawn', playerId)}</Text></View>
                                    </View>
                                );
                            })
                         ) : (
                             <Text style={styles.noPlayerText}>Henüz oyuncu istatistiği yok.</Text>
                         )}
                    </View>
                </ScrollView>

                <View style={styles.bottomAction}>
                    <ActionButton title="Geri Dön" onPress={() => navigation.goBack()} type="secondary" />
                </View>
            </View>
        </LinearGradient>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    flexFill: { flex: 1 },
    container: { flex: 1, alignItems: 'center', paddingHorizontal: 15, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 15 : 35, },
    header: { width: '100%', alignItems: 'center', marginBottom: 20, },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', },
    statsScroll: { flex: 1, width: '100%', marginBottom: 15, },
    statsContent: { paddingBottom: 10, },
    statSection: { width: '100%', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 15, marginBottom: 15, },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.accent, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.accentDisabled, paddingBottom: 5, },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, }, // Increased padding
    statLabel: { fontSize: 16, color: COLORS.textSecondary, flexShrink: 1, marginRight: 10 }, // Allow label shrink
    statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, },
    playerStats: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', },
    playerName: { fontSize: 17, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8, }, // Increased margin
    statRowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 10, paddingVertical: 4,}, // Increased padding
    statLabelInner: { fontSize: 15, color: COLORS.textSecondary, },
    statValueInner: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, },
    noPlayerText: { fontSize: 15, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
    bottomAction: { width: '90%', maxWidth: 350, justifyContent: 'flex-end', marginTop: 10, },
});

export default StatisticsScreen;