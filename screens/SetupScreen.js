// screens/SetupScreen.js
import React, { useState, useCallback } from 'react'; // useCallback eklendi
import {
    View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
    Platform, TouchableWithoutFeedback, Keyboard, StatusBar, ScrollView, TouchableOpacity
} from 'react-native';
import Constants from 'expo-constants';
import { useGame } from '../context/useGame'; // <-- Doğru hook
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import ActionButton from '../components/ActionButton';

const SetupScreen = ({ navigation }) => {
    // --- Local State ---
    const [playerCount, setPlayerCount] = useState(2);
    const [playerNames, setPlayerNames] = useState(Array(2).fill(''));
    const [newTask, setNewTask] = useState('');
    // customTasksInput context'ten geliyordu, şimdi yerel state olacak
    const [customTasksList, setCustomTasksList] = useState([]);

    // --- Context Actions ---
    const { actions } = useGame(); // Sadece actions'ı al

    const MAX_PLAYERS = 6;

    // --- Handlers (useCallback ile) ---
    const handlePlayerCountChange = useCallback((change) => {
        const newCount = Math.max(2, Math.min(MAX_PLAYERS, playerCount + change));
        setPlayerCount(newCount);
        setPlayerNames(prevNames => {
            const newNames = Array(newCount).fill('');
            for (let i = 0; i < Math.min(prevNames.length, newCount); i++) { newNames[i] = prevNames[i]; }
            return newNames;
        });
    }, [playerCount]); // playerCount'a bağlı

    const handleNameChange = useCallback((text, index) => {
        setPlayerNames(prevNames => {
            const newNames = [...prevNames];
            newNames[index] = text;
            return newNames;
        });
    }, []); // Bağımlılık yok

    const handleAddTask = useCallback(() => {
        const trimmedTask = newTask.trim();
        if (trimmedTask && customTasksList.length < 5) {
            setCustomTasksList(prevTasks => [...prevTasks, trimmedTask]);
            setNewTask('');
        }
        Keyboard.dismiss();
    }, [newTask, customTasksList]); // newTask ve customTasksList'e bağlı

    const handleRemoveTask = useCallback((indexToRemove) => {
        setCustomTasksList(prevTasks => prevTasks.filter((_, index) => index !== indexToRemove));
    }, []); // Bağımlılık yok

    const handleStartGame = useCallback(() => {
        try {
            const finalPlayerNames = playerNames.map((name, index) => name.trim() || `Oyuncu ${index + 1}`);
            actions.setupGame(finalPlayerNames, customTasksList); // actions'ı kullan
            navigation.navigate('Game');
        } catch (error) {
            console.error("Error in handleStartGame:", error);
            alert("Oyunu başlatırken bir sorun oluştu.");
        }
    }, [playerNames, customTasksList, actions, navigation]); // Bağımlılıklar

    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flexFill}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Yeni Oyun Kur</Text>
                                <ActionButton title="?" onPress={() => navigation.navigate('HowToPlay')} type="secondary" style={styles.howToPlayButton} textStyle={styles.howToPlayButtonText}/>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.playerCountContainer}>
                                    <Text style={styles.label}>Oyuncu Sayısı:</Text>
                                    <View style={styles.countAdjuster}>
                                        <ActionButton title="-" onPress={() => handlePlayerCountChange(-1)} disabled={playerCount <= 2} type="secondary" style={styles.countButton} textStyle={styles.countButtonText} />
                                        <Text style={styles.playerCountText}>{playerCount}</Text>
                                        <ActionButton title="+" onPress={() => handlePlayerCountChange(1)} disabled={playerCount >= MAX_PLAYERS} type="secondary" style={styles.countButton} textStyle={styles.countButtonText} />
                                    </View>
                                </View>
                                <View style={styles.nameInputsContainer}>
                                    <Text style={styles.label}>Oyuncu İsimleri:</Text>
                                    {playerNames.map((name, index) => ( <TextInput key={index} style={styles.input} placeholder={`Oyuncu ${index + 1}`} placeholderTextColor={COLORS.inputPlaceholder} value={name} onChangeText={(text) => handleNameChange(text, index)} maxLength={12} autoCapitalize="words" returnKeyType={index === playerNames.length - 1 ? "done" : "next"}/> ))}
                                </View>
                            </View>

                            <View style={[styles.section, styles.customTaskSection]}>
                                <Text style={styles.label}>Özel Görev Ekle (Max 5)</Text>
                                <View style={styles.addTaskContainer}>
                                    <TextInput style={[styles.input, styles.taskInput]} placeholder="Kendi görevini yaz..." placeholderTextColor={COLORS.inputPlaceholder} value={newTask} onChangeText={setNewTask} maxLength={100} returnKeyType="done" onSubmitEditing={handleAddTask} />
                                    <ActionButton title="Ekle" onPress={handleAddTask} disabled={!newTask.trim() || customTasksList.length >= 5} style={styles.addButton} textStyle={styles.addButtonText} type="primary" />
                                </View>
                                {customTasksList.map((task, index) => (
                                    <View key={index} style={styles.taskItem}>
                                        <Text style={styles.taskText} numberOfLines={2}>{index + 1}. {task}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveTask(index)} style={styles.removeButton}><Text style={styles.removeButtonText}>✕</Text></TouchableOpacity>
                                    </View>
                                ))}
                                {customTasksList.length === 0 && ( <Text style={styles.noTasksText}>Henüz özel görev eklenmedi.</Text> )}
                            </View>

                            <View style={styles.bottomAction}>
                                <ActionButton title="Oyunu Başlat" onPress={handleStartGame} />
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    flexFill: { flex: 1 },
    scrollContainer: { flexGrow: 1, justifyContent: 'space-between', },
    container: { flex: 1, minHeight: '100%', alignItems: 'center', paddingHorizontal: 25, paddingBottom: 30, paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 15 : 40, }, // minHeight eklendi
    header: { width: '100%', alignItems: 'center', position: 'relative', paddingTop: 10, marginBottom: 10, },
    title: { fontSize: 30, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 10, },
    howToPlayButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, width: 'auto', position: 'absolute', right: 0, top: 0, backgroundColor: 'rgba(255,255,255,0.1)', minWidth: 40, height: 40, justifyContent: 'center', alignItems: 'center'}, // Boyut ayarlandı
    howToPlayButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textSecondary }, // Soru işareti büyütüldü
    section: { width: '100%', marginBottom: 20, },
    playerCountContainer: { width: '100%', alignItems: 'center', marginBottom: 25, },
    label: { fontSize: 17, color: COLORS.textSecondary, marginBottom: 12, alignSelf: 'flex-start', },
    countAdjuster: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '80%', },
    countButton: { width: 45, height: 45, borderRadius: 22.5, paddingVertical: 0, paddingHorizontal: 0, marginHorizontal: 20, minWidth: 45, alignItems: 'center', justifyContent: 'center', },
    countButtonText: { fontSize: 24, lineHeight: Platform.OS === 'ios' ? 28 : 30, color: COLORS.textPrimary, textAlign: 'center', },
    playerCountText: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, minWidth: 40, textAlign: 'center', },
    nameInputsContainer: { width: '100%', },
    input: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder, color: COLORS.inputText, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, marginBottom: 12, fontSize: 16, width: '100%', },
    customTaskSection: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', },
    addTaskContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, },
    taskInput: { flex: 1, marginRight: 10, marginBottom: 0, },
    addButton: { width: 'auto', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, minWidth: 60, height: 50, alignSelf: 'stretch', justifyContent: 'center', },
    addButtonText: { fontSize: 14, fontWeight: 'bold', },
    taskItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 8, paddingLeft: 12, paddingRight: 5, borderRadius: 8, marginBottom: 6, },
    taskText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, marginRight: 10, },
    removeButton: { padding: 5, marginLeft: 5 },
    removeButtonText: { color: COLORS.negative, fontSize: 18, fontWeight: 'bold', },
    noTasksText: { color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 5,},
    bottomAction: { width: '90%', maxWidth: 350, justifyContent: 'flex-end', marginTop: 20, },
});

export default SetupScreen;