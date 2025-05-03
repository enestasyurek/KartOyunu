// screens/AchievementsScreen.js
import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform, StatusBar } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/useGame'; // <-- Doğru hook
import { COLORS } from '../constants/theme';
import { ACHIEVEMENTS_LIST, getAchievementDetails } from '../data/achievements';
import ActionButton from '../components/ActionButton';

const AchievementsScreen = ({ navigation }) => {
    const { gameState } = useGame(); // State'i al
    const { achievements: unlockedAchievementsState } = gameState;

    // Render item function for FlatList
    const renderAchievement = ({ item }) => {
        const details = getAchievementDetails(item.id); // Get details from definition
        const isUnlocked = unlockedAchievementsState[item.id]?.unlocked || false;

        return (
            <View style={[styles.achievementItem, isUnlocked ? styles.unlocked : styles.locked]}>
                <View style={styles.iconContainer}>
                     <Text style={styles.icon}>{isUnlocked ? '🏆' : '🔒'}</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.name, !isUnlocked && styles.lockedText]}>{details?.name || item.id}</Text>
                    <Text style={[styles.description, !isUnlocked && styles.lockedText]}>{details?.description || '???'}</Text>
                </View>
            </View>
        );
    };

    // Prepare data for FlatList (list of achievement IDs)
    const achievementIds = ACHIEVEMENTS_LIST.map(ach => ({ id: ach.id }));

    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Başarımlar</Text>
                </View>

                <FlatList
                    data={achievementIds}
                    renderItem={renderAchievement}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    showsVerticalScrollIndicator={false}
                />

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
    list: { width: '100%', },
    listContent: { paddingBottom: 10, },
    achievementItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, },
    unlocked: { backgroundColor: 'rgba(72, 187, 120, 0.15)', borderColor: COLORS.positive, },
    locked: { backgroundColor: 'rgba(113, 128, 150, 0.15)', borderColor: COLORS.textMuted, },
    iconContainer: { marginRight: 15, padding: 5, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.1)'},
    icon: { fontSize: 24, },
    textContainer: { flex: 1, },
    name: { fontSize: 17, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 3, },
    description: { fontSize: 14, color: COLORS.textSecondary, },
    lockedText: { color: COLORS.textMuted, opacity: 0.7 }, // Make locked text slightly faded
    separator: { height: 0, /* Removed separator line */ },
    bottomAction: { width: '90%', maxWidth: 350, justifyContent: 'flex-end', marginTop: 15, },
});

export default AchievementsScreen;