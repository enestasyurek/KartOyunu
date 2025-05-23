import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
    Platform, TouchableWithoutFeedback, Keyboard, StatusBar, 
    ScrollView, TouchableOpacity, Alert, AccessibilityInfo
} from 'react-native';
import Constants from 'expo-constants';
import { useGame } from '../context/useGame';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
import ActionButton from '../components/ActionButton';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { AVATARS, getRandomAvatar } from '../constants/avatars';

// Constants
const MAX_PLAYERS = 6;
const MAX_CUSTOM_TASKS = 5;
const DEFAULT_TARGET_SCORE = 20;
const MIN_TARGET_SCORE = 10;
const MAX_TARGET_SCORE = 50;

// Component for a single player row with name input and avatar
const PlayerItem = ({ 
    player, 
    index, 
    onNameChange, 
    onAvatarChange, 
    inputRef,
    focusedInput,
    onFocus,
    onBlur,
    onSubmit,
    totalPlayers 
}) => (
    <MotiView
        key={`player-${index}`}
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'timing', duration: 250 }}
        style={styles.playerCard}
        accessible={true}
        accessibilityLabel={`Oyuncu ${index + 1} bilgileri`}
    >
        <TouchableOpacity 
            onPress={() => onAvatarChange(index)} 
            style={styles.avatarButton}
            accessibilityLabel={`Avatar değiştir, şu anki avatar: ${player.avatar}`}
            accessibilityHint="Farklı bir avatar seçmek için dokunun"
            accessibilityRole="button"
        >
            <Text style={styles.avatarText}>{player.avatar}</Text>
        </TouchableOpacity>
        
        <View style={styles.inputContainer}>
            <TextInput
                ref={inputRef}
                style={[
                    styles.input, 
                    focusedInput === index && styles.inputFocused
                ]}
                placeholder={`Oyuncu ${index + 1}`}
                placeholderTextColor={COLORS.inputPlaceholder}
                value={player.name}
                onChangeText={(text) => onNameChange(text, index)}
                maxLength={15}
                autoCapitalize="words"
                returnKeyType={index === totalPlayers - 1 ? "done" : "next"}
                onFocus={() => onFocus(index)}
                onBlur={onBlur}
                onSubmitEditing={() => onSubmit(index)}
                blurOnSubmit={index === totalPlayers - 1}
                accessibilityLabel={`Oyuncu ${index + 1} ismi`}
                accessibilityHint="Oyuncu ismini girin"
            />
            
            <TouchableOpacity 
                onPress={() => onAvatarChange(index)} 
                style={styles.refreshButton}
                accessibilityLabel="Avatar yenile"
                accessibilityHint="Rastgele yeni bir avatar seçmek için dokunun"
                accessibilityRole="button"
            >
                <Ionicons name="refresh-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
        </View>
    </MotiView>
);

// Component for player count selector
const PlayerCounter = ({ count, onDecrease, onIncrease, maxPlayers }) => (
    <View style={styles.counterContainer}>
        <TouchableOpacity
            style={[styles.counterBtn, count <= 2 && styles.counterBtnDisabled]}
            onPress={onDecrease} 
            disabled={count <= 2} 
            activeOpacity={0.7}
            accessibilityLabel="Oyuncu sayısını azalt"
            accessibilityHint={count <= 2 ? "Minimum oyuncu sayısına ulaşıldı" : "Oyuncu sayısını azaltmak için dokunun"}
            accessibilityRole="button"
            accessibilityState={{ disabled: count <= 2 }}
        >
            <Ionicons 
                name="remove" 
                size={22} 
                color={count <= 2 ? COLORS.textMuted : COLORS.textPrimary} 
            />
        </TouchableOpacity>
        
        <MotiView
            key={`count-${count}`}
            from={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            accessible={true}
            accessibilityLabel={`${count} oyuncu`}
            style={styles.counterTextContainer}
        >
            <Text style={styles.counterText}>{count}</Text>
        </MotiView>
        
        <TouchableOpacity
            style={[styles.counterBtn, count >= maxPlayers && styles.counterBtnDisabled]}
            onPress={onIncrease} 
            disabled={count >= maxPlayers} 
            activeOpacity={0.7}
            accessibilityLabel="Oyuncu sayısını artır"
            accessibilityHint={count >= maxPlayers ? "Maksimum oyuncu sayısına ulaşıldı" : "Oyuncu sayısını artırmak için dokunun"}
            accessibilityRole="button"
            accessibilityState={{ disabled: count >= maxPlayers }}
        >
            <Ionicons 
                name="add" 
                size={22} 
                color={count >= maxPlayers ? COLORS.textMuted : COLORS.textPrimary} 
            />
        </TouchableOpacity>
    </View>
);

// Component for target score selector
const ScoreSelector = ({ value, onDecrease, onIncrease, minScore, maxScore }) => (
    <View style={styles.counterContainer}>
        <TouchableOpacity
            style={[styles.counterBtn, value <= minScore && styles.counterBtnDisabled]}
            onPress={onDecrease} 
            disabled={value <= minScore} 
            activeOpacity={0.7}
            accessibilityLabel="Hedef puanı azalt"
            accessibilityHint={value <= minScore ? "Minimum puana ulaşıldı" : "Hedef puanı azaltmak için dokunun"}
            accessibilityRole="button"
            accessibilityState={{ disabled: value <= minScore }}
        >
            <Ionicons 
                name="remove" 
                size={22} 
                color={value <= minScore ? COLORS.textMuted : COLORS.textPrimary} 
            />
        </TouchableOpacity>
        
        <MotiView
            key={`score-${value}`}
            from={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            accessible={true}
            accessibilityLabel={`${value} puan`}
            style={styles.counterTextContainer}
        >
            <Text style={styles.counterText}>{value}</Text>
        </MotiView>
        
        <TouchableOpacity
            style={[styles.counterBtn, value >= maxScore && styles.counterBtnDisabled]}
            onPress={onIncrease} 
            disabled={value >= maxScore} 
            activeOpacity={0.7}
            accessibilityLabel="Hedef puanı artır"
            accessibilityHint={value >= maxScore ? "Maksimum puana ulaşıldı" : "Hedef puanı artırmak için dokunun"}
            accessibilityRole="button"
            accessibilityState={{ disabled: value >= maxScore }}
        >
            <Ionicons 
                name="add" 
                size={22} 
                color={value >= maxScore ? COLORS.textMuted : COLORS.textPrimary} 
            />
        </TouchableOpacity>
    </View>
);

// Component for a single custom task item
const TaskItem = ({ task, index, onRemove }) => (
    <MotiView
        key={`task-${index}-${task}`}
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: 5 }}
        transition={{ type: 'timing', duration: 250 }}
        style={styles.taskCard}
        accessible={true}
        accessibilityLabel={`Özel görev ${index + 1}: ${task}`}
    >
        <Text 
            style={styles.taskText} 
            numberOfLines={3}
            accessibilityLabel={`Görev: ${task}`}
        >
            {task}
        </Text>
        <TouchableOpacity 
            onPress={() => onRemove(index)} 
            style={styles.removeButton}
            accessibilityLabel="Görevi sil"
            accessibilityHint="Bu görevi listeden kaldırmak için dokunun"
            accessibilityRole="button"
        >
            <Ionicons name="close-circle" size={20} color={COLORS.negativeLight} />
        </TouchableOpacity>
    </MotiView>
);

// Section component for consistent UI sections
const Section = ({ children, title, subtitle, delay = 0, fromLeft = false }) => (
    <MotiView 
        style={styles.section}
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay }}
        accessible={true}
        accessibilityLabel={title}
    >
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle && (
                <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            )}
        </View>
        {children}
    </MotiView>
);

const SetupScreen = ({ navigation }) => {
    // State hooks
    const [playerCount, setPlayerCount] = useState(2);
    const [players, setPlayers] = useState(
        Array.from({ length: 2 }, () => ({ name: '', avatar: getRandomAvatar([]) }))
    );
    const [newTask, setNewTask] = useState('');
    const [customTasksList, setCustomTasksList] = useState([]);
    const [focusedInput, setFocusedInput] = useState(null);
    const [targetScore, setTargetScore] = useState(DEFAULT_TARGET_SCORE);

    // Refs
    const nameInputsRef = useRef([]);
    const scrollViewRef = useRef();
    const taskInputRef = useRef();

    // Context
    const { actions } = useGame();

    // Effect to assign/update avatars when player count changes
    useEffect(() => {
        assignRandomAvatars(playerCount, true);
    }, [playerCount]);

    // Avatar assignment function
    const assignRandomAvatars = (count, keepNames = false) => {
        setPlayers(prevPlayers => {
            const currentPlayers = keepNames ? [...prevPlayers] : [];
            let assignedAvatars = [];
            
            if(keepNames) {
                assignedAvatars = currentPlayers.slice(0, count)
                    .map(p => p?.avatar)
                    .filter(Boolean);
            }

            const newPlayers = Array(count).fill(null).map((_, index) => {
                const existingPlayer = currentPlayers[index] || {};
                const currentAvatar = existingPlayer.avatar;
                
                let newAvatar = currentAvatar && !assignedAvatars.includes(currentAvatar) 
                    ? currentAvatar 
                    : getRandomAvatar(assignedAvatars);

                // Avoid duplicates
                let tries = 0;
                while(assignedAvatars.includes(newAvatar) && tries < AVATARS.length * 2) {
                    newAvatar = getRandomAvatar(assignedAvatars);
                    tries++;
                }
                
                if (assignedAvatars.includes(newAvatar)) {
                    console.warn("Çok fazla denemeye rağmen benzersiz avatar bulunamadı!");
                    newAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
                }

                assignedAvatars.push(newAvatar);

                return {
                    name: keepNames ? (existingPlayer.name || '') : '',
                    avatar: newAvatar,
                };
            });
            
            return newPlayers;
        });
    };

    // Player count handlers
    const handlePlayerCountChange = useCallback((change) => {
        Keyboard.dismiss();
        const newCount = Math.max(2, Math.min(MAX_PLAYERS, playerCount + change));
        if (newCount !== playerCount) {
            setPlayerCount(newCount);
            
            // Provide haptic feedback if available
            if (Platform.OS === 'ios' && AccessibilityInfo) {
                AccessibilityInfo.announceForAccessibility(`Oyuncu sayısı ${newCount} olarak değiştirildi`);
            }
        }
    }, [playerCount]);

    // Name change handler
    const handleNameChange = useCallback((text, index) => {
        setPlayers(prevPlayers => {
            const newPlayers = [...prevPlayers];
            if (newPlayers[index]) {
                newPlayers[index] = { ...newPlayers[index], name: text };
            }
            return newPlayers;
        });
    }, []);

    // Avatar change handler for individual player
    const handleAvatarChange = useCallback((index) => {
        setPlayers(prevPlayers => {
            const newPlayers = [...prevPlayers];
            if (newPlayers[index]) {
                const otherAvatars = newPlayers
                    .map((p, i) => (i !== index ? p.avatar : null))
                    .filter(Boolean);
                
                let newAvatar = getRandomAvatar(otherAvatars);
                
                if (newAvatar === newPlayers[index].avatar && AVATARS.length > 1) {
                    const doubleCheckAvatars = [...otherAvatars, newAvatar];
                    newAvatar = getRandomAvatar(doubleCheckAvatars);
                }

                newPlayers[index] = { ...newPlayers[index], avatar: newAvatar };
            }
            return newPlayers;
        });
    }, []);

    // Target score handlers
    const handleTargetScoreChange = useCallback((change) => {
        Keyboard.dismiss();
        const newScore = Math.max(MIN_TARGET_SCORE, Math.min(MAX_TARGET_SCORE, targetScore + change));
        if (newScore !== targetScore) {
            setTargetScore(newScore);
            
            // Provide haptic feedback if available
            if (Platform.OS === 'ios' && AccessibilityInfo) {
                AccessibilityInfo.announceForAccessibility(`Hedef puan ${newScore} olarak değiştirildi`);
            }
        }
    }, [targetScore]);

    // Task management handlers
    const handleAddTask = useCallback(() => {
        const trimmedTask = newTask.trim();
        if (trimmedTask && customTasksList.length < MAX_CUSTOM_TASKS) {
            setCustomTasksList(prevTasks => [...prevTasks, trimmedTask]);
            setNewTask('');
            Keyboard.dismiss();
            
            // Scroll to newly added task
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            
            // Announce for accessibility
            if (AccessibilityInfo) {
                AccessibilityInfo.announceForAccessibility("Görev eklendi");
            }
        } else if (customTasksList.length >= MAX_CUSTOM_TASKS) {
            Alert.alert(
                "Limit Aşıldı", 
                `En fazla ${MAX_CUSTOM_TASKS} özel görev ekleyebilirsiniz.`,
                [{ text: "Anladım", style: "default" }],
                { cancelable: true }
            );
        } else if (!trimmedTask) {
            Alert.alert(
                "Boş Görev", 
                "Lütfen eklemek için bir görev yazın.",
                [{ text: "Tamam", style: "default" }],
                { cancelable: true }
            );
        }
    }, [newTask, customTasksList]);

    const handleRemoveTask = useCallback((indexToRemove) => {
        setCustomTasksList(prevTasks => prevTasks.filter((_, index) => index !== indexToRemove));
        
        // Announce for accessibility
        if (AccessibilityInfo) {
            AccessibilityInfo.announceForAccessibility("Görev silindi");
        }
    }, []);

    // Game start handler
    const handleStartGame = useCallback(() => {
        Keyboard.dismiss();
        
        // Validate player names - ensure all players have names
        const hasEmptyNames = players.some(player => !player.name.trim());
        if (hasEmptyNames) {
            Alert.alert(
                "Eksik İsimler", 
                "Bazı oyuncuların ismi girilmemiş. Otomatik isimler atanacak. Devam etmek istiyor musunuz?",
                [
                    { text: "İptal", style: "cancel" },
                    { text: "Devam Et", onPress: startGameWithFinalData }
                ],
                { cancelable: true }
            );
        } else {
            startGameWithFinalData();
        }
    }, [players, customTasksList, targetScore]);

    const startGameWithFinalData = () => {
        try {
            // Generate final player names (use "Oyuncu X" for empty names)
            const finalPlayerNames = players.map((player, index) => 
                player.name.trim() || `Oyuncu ${index + 1}`
            );
            
            // Setup game with context action
            actions.setupGame(finalPlayerNames, customTasksList, targetScore);
            
            // Navigate to game screen
            navigation.replace('Game');
        } catch (error) {
            console.error("HATA [handleStartGame]:", error);
            Alert.alert(
                "Başlatma Hatası", 
                "Oyunu başlatırken bir sorun oluştu. Lütfen tekrar deneyin.",
                [{ text: "Tamam", style: "default" }]
            );
        }
    };

    // Input focus handling
    const focusNextInput = (index) => {
        if (nameInputsRef.current[index + 1]) {
            nameInputsRef.current[index + 1].focus();
        } else {
            // If it's the last player name field, focus on task input if visible
            if (taskInputRef.current) {
                taskInputRef.current.focus();
            } else {
                Keyboard.dismiss();
            }
        }
    };

    const handleInputFocus = (refIndexOrId) => {
        setFocusedInput(refIndexOrId);
        
        // Only scroll for player inputs (indexes are numbers)
        if (typeof refIndexOrId === 'number') {
            const node = nameInputsRef.current[refIndexOrId];
            if (node && scrollViewRef.current) {
                setTimeout(() => {
                    node.measure((fx, fy, width, height, px, py) => {
                        const scrollOffsetY = py - SIZES.height * 0.2;
                        if (scrollOffsetY > 0) {
                            scrollViewRef.current.scrollTo({ y: scrollOffsetY, animated: true });
                        }
                    });
                }, 250);
            }
        } else if (refIndexOrId === 'newTask' && scrollViewRef.current) {
            // If focusing the task input, scroll to it
            setTimeout(() => {
                scrollViewRef.current.scrollToEnd({ animated: true });
            }, 250);
        }
    };

    return (
        <LinearGradient 
            colors={[COLORS.backgroundGradient[0], '#1a2936', COLORS.backgroundGradient[1]]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Yeni Oyun Kurulum Ekranı"
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <MotiView 
                                from={{ opacity: 0, translateY: -15 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'timing', duration: 600 }}
                            >
                                <Text style={styles.title} accessibilityRole="header">Yeni Oyun</Text>
                            </MotiView>
                            
                            <TouchableOpacity 
                                style={styles.helpButton} 
                                onPress={() => navigation.navigate('HowToPlay')}
                                accessibilityLabel="Nasıl oynanır"
                                accessibilityHint="Oyun kurallarını görüntülemek için dokunun"
                                accessibilityRole="button"
                            >
                                <Ionicons name="help-circle" size={26} color={COLORS.accentLight} />
                            </TouchableOpacity>
                        </View>

                        {/* Target Score Section */}
                        <Section 
                            title="Hedef Puan" 
                            subtitle="Oyunun biteceği puanı seç"
                            delay={100}
                        >
                            <ScoreSelector 
                                value={targetScore}
                                onDecrease={() => handleTargetScoreChange(-5)}
                                onIncrease={() => handleTargetScoreChange(5)}
                                minScore={MIN_TARGET_SCORE}
                                maxScore={MAX_TARGET_SCORE}
                            />
                        </Section>

                        {/* Player Count Section */}
                        <Section 
                            title="Oyuncu Sayısı" 
                            delay={150}
                        >
                            <PlayerCounter 
                                count={playerCount}
                                onDecrease={() => handlePlayerCountChange(-1)}
                                onIncrease={() => handlePlayerCountChange(1)}
                                maxPlayers={MAX_PLAYERS}
                            />
                        </Section>

                        {/* Players Section */}
                        <Section 
                            title="Oyuncular" 
                            delay={250}
                        >
                            <View style={styles.playersContainer}>
                                <AnimatePresence>
                                    {players.map((player, index) => (
                                        <PlayerItem 
                                            key={`player-${index}`}
                                            player={player}
                                            index={index}
                                            onNameChange={handleNameChange}
                                            onAvatarChange={handleAvatarChange}
                                            inputRef={(el) => (nameInputsRef.current[index] = el)}
                                            focusedInput={focusedInput}
                                            onFocus={handleInputFocus}
                                            onBlur={() => setFocusedInput(null)}
                                            onSubmit={focusNextInput}
                                            totalPlayers={players.length}
                                        />
                                    ))}
                                </AnimatePresence>
                            </View>
                        </Section>

                        {/* Custom Tasks Section */}
                        <Section 
                            title="Özel Görev Ekle" 
                            subtitle={`${customTasksList.length}/${MAX_CUSTOM_TASKS} görev (opsiyonel)`}
                            delay={350}
                        >
                            <View style={styles.taskInputContainer}>
                                <TextInput
                                    ref={taskInputRef}
                                    style={[styles.taskInput, focusedInput === 'newTask' && styles.inputFocused]}
                                    placeholder="Kendi komik görevini yaz..."
                                    placeholderTextColor={COLORS.inputPlaceholder}
                                    value={newTask}
                                    onChangeText={setNewTask}
                                    maxLength={120}
                                    returnKeyType="done"
                                    onSubmitEditing={handleAddTask}
                                    onFocus={() => handleInputFocus('newTask')}
                                    onBlur={() => setFocusedInput(null)}
                                    multiline={true}
                                    numberOfLines={2}
                                    accessibilityLabel="Özel görev giriş alanı"
                                    accessibilityHint="Oyun sırasında kullanılacak kendi özel görevinizi girin"
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.addButton,
                                        (!newTask.trim() || customTasksList.length >= MAX_CUSTOM_TASKS) && styles.addButtonDisabled
                                    ]}
                                    onPress={handleAddTask}
                                    disabled={!newTask.trim() || customTasksList.length >= MAX_CUSTOM_TASKS}
                                    accessibilityLabel="Görevi ekle"
                                    accessibilityHint="Yazdığınız görevi listeye eklemek için dokunun"
                                    accessibilityState={{ 
                                        disabled: !newTask.trim() || customTasksList.length >= MAX_CUSTOM_TASKS 
                                    }}
                                >
                                    <Ionicons 
                                        name="add-circle" 
                                        size={28} 
                                        color={(!newTask.trim() || customTasksList.length >= MAX_CUSTOM_TASKS) 
                                            ? COLORS.textMuted 
                                            : COLORS.positive} 
                                    />
                                </TouchableOpacity>
                            </View>
                            
                            {/* Task List */}
                            <View style={styles.taskList}>
                                <AnimatePresence>
                                    {customTasksList.map((task, index) => (
                                        <TaskItem 
                                            key={`task-${index}`}
                                            task={task}
                                            index={index}
                                            onRemove={handleRemoveTask}
                                        />
                                    ))}
                                </AnimatePresence>
                                
                                {customTasksList.length === 0 && (
                                    <Text style={styles.emptyTasksText} accessibilityLabel="Henüz özel görev eklenmedi">
                                        Henüz özel görev eklenmedi
                                    </Text>
                                )}
                            </View>
                        </Section>

                        {/* Start Game Button */}
                        <MotiView 
                            style={styles.startButtonContainer}
                            from={{opacity: 0, translateY: 20}} 
                            animate={{opacity: 1, translateY: 0}} 
                            transition={{type: 'timing', duration: 600, delay: 450}}
                        >
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={handleStartGame}
                                accessibilityLabel={`Oyunu ${playerCount} kişiyle başlat`}
                                accessibilityHint="Oyunu başlatmak için dokunun"
                                accessibilityRole="button"
                            >
                                <Text style={styles.startButtonText}>Başlat</Text>
                                <Ionicons name="rocket" size={18} color="#fff" style={styles.startIcon} />
                            </TouchableOpacity>
                            
                            {playerCount > 2 && (
                                <Text 
                                    style={styles.startHintText}
                                    accessibilityLabel={`${playerCount} kişilik oyun başlatılacak, hazır mısınız?`}
                                >
                                    {playerCount} kişiyle oyna
                                </Text>
                            )}
                        </MotiView>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

// Modern, minimal styles
const styles = StyleSheet.create({
    container: { 
        flex: 1,
        backgroundColor: '#121a22',
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 16 : 50, 
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        position: 'relative',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    helpButton: {
        position: 'absolute',
        right: 0,
        padding: 8,
    },
    section: {
        marginBottom: 28,
        width: '100%',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.accentLight,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        opacity: 0.8,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 18,
        padding: 8,
        marginVertical: 8,
    },
    counterBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        opacity: 0.5,
    },
    counterTextContainer: {
        width: 60,
        alignItems: 'center',
    },
    counterText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    playersContainer: {
        marginTop: 4,
        width: '100%',
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    avatarButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 22,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 10,
        color: '#fff',
        fontSize: 16,
    },
    inputFocused: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    refreshButton: {
        padding: 8,
        marginLeft: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
    },
    taskInput: {
        flex: 1,
        minHeight: 40,
        backgroundColor: 'transparent',
        color: '#fff',
        fontSize: 15,
        paddingVertical: 4,
        marginRight: 12,
    },
    addButton: {
        padding: 8,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    taskList: {
        width: '100%',
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    taskText: {
        flex: 1,
        fontSize: 15,
        color: '#fff',
        marginRight: 10,
        lineHeight: 20,
    },
    removeButton: {
        padding: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255,105,97,0.15)',
    },
    emptyTasksText: {
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        fontStyle: 'italic',
        fontSize: 14,
        paddingVertical: 16,
    },
    startButtonContainer: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    startButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    startIcon: {
        marginLeft: 10,
    },
    startHintText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 10,
    },
});

export default SetupScreen;