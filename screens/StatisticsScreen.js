// screens/StatisticsScreen.js
import React, { useMemo } from 'react'; // useMemo eklendi
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/useGame'; // Doğru hook
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons'; // İkonlar için
import ActionButton from '../components/ActionButton'; // Geri butonu için ActionButton
import { MotiView } from 'moti';

// Helper component for displaying a single statistic row
const StatRow = ({ label, value, icon = null, valueColor = COLORS.textPrimary }) => (
     <MotiView
        from={{opacity: 0, translateX: -10}} animate={{opacity: 1, translateX: 0}} transition={{type:'timing', duration: 300}}
        style={styles.statRow}
    >
        <View style={styles.statLabelContainer}>
             {icon && <Ionicons name={icon} size={SIZES.body * 1.1} color={COLORS.textSecondary} style={styles.statIcon} />}
            <Text style={styles.statLabel}>{label}:</Text>
        </View>
         <Text style={[styles.statValue, { color: valueColor }]}>{value ?? 0}</Text>
    </MotiView>
);

// Helper component for displaying player stats section
const PlayerStatsCard = ({ player, stats }) => {
    const getStat = (key) => stats?.[key]?.[player.id] || 0;

     if (!player) return null; // Oyuncu bilgisi yoksa gösterme

    return (
         <MotiView
             from={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} transition={{type:'spring', damping: 10}}
             style={styles.playerStats}
         >
            <View style={styles.playerHeader}>
                <Text style={styles.playerAvatar}>{player.avatarId || '👤'}</Text>
                <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
            </View>
             <StatRow label="Kazanma Sayısı" value={getStat('wins')} icon="trophy-outline" valueColor={COLORS.positiveLight}/>
             <StatRow label="Tamamlanan Görevler" value={getStat('tasksCompleted')} icon="checkmark-done-outline" />
            <StatRow label="Devredilen Görevler" value={getStat('tasksDelegated')} icon="swap-horizontal-outline" />
             <StatRow label="Kazanılan Oylu Görevler" value={getStat('votableTasksWon')} icon="thumbs-up-outline" />
             <StatRow label="Çekilen Siyah Kartlar" value={getStat('blackCardsDrawn')} icon="skull-outline" valueColor={COLORS.warningLight}/>
        </MotiView>
    );
};

const StatisticsScreen = ({ navigation }) => {
    const { gameState } = useGame();
    // Mevcut oyunun oyuncuları VEYA genel istatistiklerde kayıtlı oyuncu ID'lerini kullan
    const stats = gameState.stats || {};
     const currentPlayers = gameState.players || []; // Aktif oyun varsa

     // Tüm istatistikleri olan oyuncuları topla (hem mevcut hem eski)
     const allPlayerIdsWithStats = useMemo(() => {
         const ids = new Set();
         // Aktif oyuncu ID'leri
         currentPlayers.forEach(p => ids.add(p.id));
         // İstatistiklerdeki ID'ler (wins, tasksCompleted etc.)
         ['wins', 'tasksCompleted', 'tasksDelegated', 'votableTasksWon', 'blackCardsDrawn'].forEach(key => {
            if (stats[key]) {
                 Object.keys(stats[key]).forEach(idStr => ids.add(parseInt(idStr, 10)));
            }
        });
         return Array.from(ids);
     }, [stats, currentPlayers]);

    // Oyuncu bilgilerini oluştur (mevcut oyun veya sadece ID)
    const playersData = useMemo(() => {
         return allPlayerIdsWithStats.map(id => {
            const currentPlayer = currentPlayers.find(p => p.id === id);
            if (currentPlayer) {
                 // Aktif oyundaysa tüm bilgiler mevcut
                 return { id: id, name: currentPlayer.name, avatarId: currentPlayer.avatarId };
             } else {
                 // Sadece istatistiklerde varsa ID ve varsayılan göster
                  // TODO: İleride isimleri de saklamak gerekebilir
                 return { id: id, name: `Oyuncu ID: ${id}`, avatarId: '❓' };
             }
        }).sort((a, b) => (stats?.wins?.[b.id] || 0) - (stats?.wins?.[a.id] || 0)); // Kazanmaya göre sırala
     }, [allPlayerIdsWithStats, currentPlayers, stats]);

    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
             <SafeAreaView style={styles.flexFill}>
                <View style={styles.container}>
                     {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back-outline" size={SIZES.iconSizeLarge} color={COLORS.textPrimary} />
                         </TouchableOpacity>
                        <Text style={styles.title}>İstatistikler</Text>
                         <View style={styles.backButton} /> {/* Başlığı ortalamak için */}
                    </View>

                     <ScrollView style={styles.statsScroll} contentContainerStyle={styles.statsContent} showsVerticalScrollIndicator={false}>
                        {/* Genel İstatistikler */}
                         <View style={styles.statSection}>
                             <Text style={styles.sectionTitle}>📈 Genel Oyun Verileri</Text>
                              <StatRow label="Toplam Oynanan Oyun" value={stats.gamesPlayed} icon="game-controller-outline" />
                             <StatRow label="Kazanılan Toplam Puan" value={stats.totalScoreAccumulated} icon="calculator-outline" />
                              <StatRow label="Eklenen Özel Görev Sayısı" value={stats.customTasksAdded} icon="create-outline" />
                         </View>

                         {/* Oyuncu Bazlı İstatistikler */}
                         <View style={styles.statSection}>
                             <Text style={styles.sectionTitle}>👤 Oyuncu İstatistikleri</Text>
                             {playersData.length > 0 ? (
                                playersData.map((player) => (
                                     <PlayerStatsCard key={player.id} player={player} stats={stats} />
                                ))
                            ) : (
                                 <Text style={styles.noPlayerText}>Henüz görüntülenecek oyuncu istatistiği bulunmuyor.</Text>
                             )}
                         </View>

                         {/* İstatistikleri Sıfırlama Butonu (Opsiyonel) */}
                         {/*
                          <View style={{alignItems: 'center', marginTop: SIZES.marginLarge }}>
                              <ActionButton
                                 title="İstatistikleri Sıfırla"
                                 type="danger"
                                 iconLeft="trash-outline"
                                 onPress={() => {
                                     Alert.alert("Emin Misin?", "Tüm oyun istatistiklerini kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.", [
                                        { text: "Vazgeç", style: "cancel" },
                                         { text: "Evet, Sıfırla", onPress: () => { /* dispatch({type: 'RESET_STATS'}) ??? }, style: 'destructive' }
                                     ]);
                                 }}
                                 style={{maxWidth: 250}}
                             />
                         </View>
                         */}

                          <View style={{ height: SIZES.paddingLarge }} /> {/* Scroll sonu boşluk */}

                     </ScrollView>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

// --- Stiller ---
const styles = StyleSheet.create({
    flexFill: { flex: 1 },

    container: {
        flex: 1,
        alignItems: 'center',
    },

    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.paddingSmall,
        paddingVertical: SIZES.paddingSmall,
        marginBottom: SIZES.margin,
    },

    backButton: {
        padding: SIZES.paddingSmall,
        minWidth: 40,
        alignItems: 'center',
    },

    title: {
        fontSize: SIZES.h2 * 1.1,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },

    statsScroll: {
        flex: 1,
        width: '100%',
    },

    statsContent: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.paddingLarge,
    },

    statSection: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: SIZES.cardRadius,
        padding: SIZES.paddingMedium,
        marginBottom: SIZES.marginLarge,
    },

    sectionTitle: {
        fontSize: SIZES.h3,
        fontFamily: SIZES.bold,
        color: COLORS.accentLight,
        marginBottom: SIZES.marginMedium,
        paddingBottom: SIZES.paddingSmall,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },

    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SIZES.paddingSmall,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        marginBottom: SIZES.base,
    },

    statLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        marginRight: SIZES.margin,
    },

    statIcon: {
        marginRight: SIZES.marginSmall,
        opacity: 0.7,
    },

    statLabel: {
        fontSize: SIZES.body,
        color: COLORS.textSecondary,
    },

    statValue: {
        fontSize: SIZES.body * 1.1,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        textAlign: 'right',
        minWidth: 40,
    },

    playerStats: {
        marginBottom: SIZES.marginMedium,
        paddingBottom: SIZES.paddingSmall,
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },

    playerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.margin,
    },

    playerAvatar: {
        fontSize: SIZES.h3,
        marginRight: SIZES.marginSmall,
    },

    playerName: {
        fontSize: SIZES.title,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        flex: 1,
    },

    noPlayerText: {
        fontSize: SIZES.body,
        color: COLORS.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: SIZES.paddingLarge,
    },
});


export default StatisticsScreen;