import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
    Platform, TouchableWithoutFeedback, Keyboard, StatusBar, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import Constants from 'expo-constants';
import { useGame } from '../context/useGame';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
import ActionButton from '../components/ActionButton';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { AVATARS, getRandomAvatar } from '../constants/avatars'; // Avatarları kullanmak için

const MAX_PLAYERS = 6; // Max oyuncu sayısı
const MAX_CUSTOM_TASKS = 5; // Max özel görev

const SetupScreen = ({ navigation }) => {
    // Oyuncu Sayısı ve İsimleri State'i
    const [playerCount, setPlayerCount] = useState(2);
     // İsim ve avatarı birlikte tutalım
     const initialPlayers = Array.from({ length: 2 }, (_, i) => ({ name: '', avatar: getRandomAvatar([]) })); // Başlangıçta boş avatar listesi
     const [players, setPlayers] = useState(initialPlayers);

     // Özel Görevler State'i
     const [newTask, setNewTask] = useState('');
     const [customTasksList, setCustomTasksList] = useState([]);

    const [focusedInput, setFocusedInput] = useState(null); // Hangi inputun odakta olduğunu takip et

    const { actions } = useGame(); // Oyun aksiyonlarını al
    const nameInputsRef = useRef([]); // İsim inputlarına focus olmak için referanslar
    const scrollViewRef = useRef(); // Klavye açılınca scroll yapmak için referans

     // Bileşen mount edildiğinde veya oyuncu sayısı değiştiğinde avatarları ata/güncelle
     useEffect(() => {
         // Oyuncu sayısı değiştiğinde yeniden avatarları ata, isimleri koru
        assignRandomAvatars(playerCount, true); // keepNames = true
    }, [playerCount]); // Sadece playerCount değiştiğinde çalıştır

    // --- Avatar Atama Fonksiyonu ---
    // keepNames: true ise mevcut isimleri korur, sadece avatarı günceller/ekler/çıkarır
    const assignRandomAvatars = (count, keepNames = false) => {
        setPlayers(prevPlayers => {
           const currentPlayers = keepNames ? [...prevPlayers] : []; // İsimleri koru veya sıfırdan başla
            let assignedAvatars = [];
           // Önce mevcut atanmış avatarları topla (isimleri koruyorsak)
            if(keepNames) {
                assignedAvatars = currentPlayers.slice(0, count).map(p => p?.avatar).filter(Boolean);
            }

            const newPlayers = Array(count).fill(null).map((_, index) => {
                 const existingPlayer = currentPlayers[index] || {}; // Mevcut oyuncu bilgisi (varsa)
                 const currentAvatar = existingPlayer.avatar;

                 // Yeni bir avatar seç: Mevcut varsa ve kullanılmamışsa onu kullan, yoksa rastgele seç
                 let newAvatar = currentAvatar && !assignedAvatars.includes(currentAvatar) ? currentAvatar : getRandomAvatar(assignedAvatars);

                // Çakışma kontrolü (çok oyunculu durumda olabilir)
                let tries = 0;
                while(assignedAvatars.includes(newAvatar) && tries < AVATARS.length * 2) { // Ekstra deneme hakkı
                    newAvatar = getRandomAvatar(assignedAvatars);
                    tries++;
                }
                if (assignedAvatars.includes(newAvatar)) {
                    console.warn("Çok fazla denemeye rağmen benzersiz avatar bulunamadı!");
                    // En kötü ihtimalle rastgele birini ata
                    newAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
                 }

                 assignedAvatars.push(newAvatar); // Seçilen avatarı listeye ekle

                 return {
                     name: keepNames ? (existingPlayer.name || '') : '', // İsimleri koru veya boşalt
                     avatar: newAvatar,
                 };
             });
             return newPlayers;
         });
     };

     // --- Oyuncu Sayısı Değişikliği ---
     const handlePlayerCountChange = useCallback((change) => {
         Keyboard.dismiss(); // Klavye açıksa kapat
         const newCount = Math.max(2, Math.min(MAX_PLAYERS, playerCount + change));
         if (newCount !== playerCount) {
             setPlayerCount(newCount);
            // useEffect zaten tetiklenecek ve assignRandomAvatars'ı çağıracak
         }
     }, [playerCount]);

    // --- İsim Değişikliği ---
    const handleNameChange = useCallback((text, index) => {
        setPlayers(prevPlayers => {
            const newPlayers = [...prevPlayers];
             if (newPlayers[index]) {
                 newPlayers[index] = { ...newPlayers[index], name: text };
             }
            return newPlayers;
        });
    }, []);

     // --- Avatar Değişikliği (Tek oyuncu için) ---
     const handleAvatarChange = useCallback((index) => {
        setPlayers(prevPlayers => {
            const newPlayers = [...prevPlayers];
            if (newPlayers[index]) {
                 // Diğer oyuncuların avatarlarını al
                 const otherAvatars = newPlayers
                     .map((p, i) => (i !== index ? p.avatar : null))
                     .filter(Boolean);
                 // Farklı bir avatar seç
                 let newAvatar = getRandomAvatar(otherAvatars);
                 // Eğer hala aynı geldiyse (tek ihtimal buysa) tekrar dene
                 if (newAvatar === newPlayers[index].avatar && AVATARS.length > 1) {
                    const doubleCheckAvatars = [...otherAvatars, newAvatar]; // Mevcutu da ekle
                    newAvatar = getRandomAvatar(doubleCheckAvatars);
                  }

                 newPlayers[index] = { ...newPlayers[index], avatar: newAvatar };
             }
            return newPlayers;
         });
     }, []);


     // --- Özel Görev Ekleme ---
     const handleAddTask = useCallback(() => {
        const trimmedTask = newTask.trim();
        if (trimmedTask && customTasksList.length < MAX_CUSTOM_TASKS) {
            setCustomTasksList(prevTasks => [...prevTasks, trimmedTask]);
            setNewTask('');
             Keyboard.dismiss(); // Ekleme sonrası klavyeyi kapat
             setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); // Listenin sonuna git
         } else if (customTasksList.length >= MAX_CUSTOM_TASKS) {
             Alert.alert("Limit Aşıldı", `En fazla ${MAX_CUSTOM_TASKS} özel görev ekleyebilirsiniz.`);
         } else if (!trimmedTask) {
             Alert.alert("Boş Görev", "Lütfen eklemek için bir görev yazın.");
         }
     }, [newTask, customTasksList]);

    // --- Özel Görevi Silme ---
    const handleRemoveTask = useCallback((indexToRemove) => {
        setCustomTasksList(prevTasks => prevTasks.filter((_, index) => index !== indexToRemove));
    }, []);

    // --- Oyunu Başlat ---
    const handleStartGame = useCallback(() => {
        Keyboard.dismiss();
        const finalPlayerNames = players.map((player, index) => player.name.trim() || `Oyuncu ${index + 1}`);

        try {
            actions.setupGame(finalPlayerNames, customTasksList);
            navigation.replace('Game'); // Oyuna geç, geri dönülememesin
        } catch (error) {
            console.error("HATA [handleStartGame]:", error);
            Alert.alert("Başlatma Hatası", "Oyunu başlatırken bir sorun oluştu. Lütfen tekrar deneyin.");
        }
    }, [players, customTasksList, actions, navigation]);

    // --- Sonraki Inputa Focus ---
    const focusNextInput = (index) => {
        if (nameInputsRef.current[index + 1]) {
            nameInputsRef.current[index + 1].focus();
         } else {
             Keyboard.dismiss(); // Son input ise klavyeyi kapat
         }
    };

    // Klavye açıldığında ilgili inputu görünür alana kaydırma
    const handleInputFocus = (refIndexOrId) => {
         setFocusedInput(refIndexOrId); // Odaklanan input'u state'e al
         // Sadece oyuncu inputları için scroll yap (görev inputu zaten sonda)
         if (typeof refIndexOrId === 'number') {
             const node = nameInputsRef.current[refIndexOrId];
             if (node && scrollViewRef.current) {
                 setTimeout(() => { // Keyboard animasyonu bitince
                     // Inputun pozisyonunu al ve scroll et
                      node.measure((fx, fy, width, height, px, py) => {
                         // py: Inputun ekrandaki Y pozisyonu
                         // height: Klavye yüksekliği (deneysel veya library ile alınabilir)
                         // Hedef: py + inputHeight biraz görünecek şekilde scroll etmek
                          const scrollOffsetY = py - SIZES.height * 0.2; // Ekranın %20 yukarısında dursun
                          if (scrollOffsetY > 0) {
                              scrollViewRef.current.scrollTo({ y: scrollOffsetY, animated: true });
                          }
                     });
                     // Alternatif basit yöntem: Sadece sona kaydır
                     // scrollViewRef.current.scrollToEnd({ animated: true });
                  }, 250);
             }
         }
     };

    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
             <KeyboardAvoidingView
                 behavior={Platform.OS === "ios" ? "padding" : "height"}
                 style={styles.flexFill}
                 keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0} // iOS için hafif offset
             >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                     <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.container}>
                             {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Yeni Oyun Kur</Text>
                                <TouchableOpacity style={styles.rulesButton} onPress={() => navigation.navigate('HowToPlay')}>
                                     <Ionicons name="help-circle-outline" size={SIZES.iconSizeLarge} color={COLORS.accentLight} />
                                 </TouchableOpacity>
                            </View>

                            {/* Player Count */}
                            <View style={styles.section}>
                                <Text style={styles.label}>Oyuncu Sayısı</Text>
                                <View style={styles.playerCountContainer}>
                                    <TouchableOpacity
                                        style={[styles.countButton, playerCount <= 2 && styles.countButtonDisabled]}
                                        onPress={() => handlePlayerCountChange(-1)} disabled={playerCount <= 2} activeOpacity={0.7} >
                                        <Ionicons name="remove-outline" size={SIZES.iconSize * 1.1} color={playerCount <= 2 ? COLORS.textMuted : COLORS.textPrimary} />
                                    </TouchableOpacity>
                                    <Text style={styles.playerCountText}>{playerCount}</Text>
                                    <TouchableOpacity
                                        style={[styles.countButton, playerCount >= MAX_PLAYERS && styles.countButtonDisabled]}
                                        onPress={() => handlePlayerCountChange(1)} disabled={playerCount >= MAX_PLAYERS} activeOpacity={0.7} >
                                        <Ionicons name="add-outline" size={SIZES.iconSize * 1.1} color={playerCount >= MAX_PLAYERS ? COLORS.textMuted : COLORS.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Player Names & Avatars */}
                            <View style={styles.section}>
                                <Text style={styles.label}>Oyuncular</Text>
                                <View style={styles.playersContainer}>
                                    {/* AnimatePresence ile oyuncu ekleme/çıkarma animasyonu */}
                                    <AnimatePresence>
                                        {players.map((player, index) => (
                                            <MotiView
                                                key={`player-${index}`} // Count değişince key değişir, animasyon çalışır
                                                from={{ opacity: 0, scaleY: 0.8, height: 0 }}
                                                animate={{ opacity: 1, scaleY: 1, height: 75 }} // Sabit yükseklik
                                                exit={{ opacity: 0, scaleY: 0.8, height: 0 }}
                                                transition={{ type: 'timing', duration: 250 }}
                                                style={styles.playerInputRow}
                                                // overflow="hidden" // height animasyonu için
                                            >
                                                <TouchableOpacity onPress={() => handleAvatarChange(index)} style={styles.avatarButton}>
                                                    <Text style={styles.avatarText}>{player.avatar}</Text>
                                                </TouchableOpacity>
                                                <TextInput
                                                    ref={(el) => (nameInputsRef.current[index] = el)}
                                                    style={[ styles.input, styles.nameInput, focusedInput === index && styles.inputFocused ]}
                                                    placeholder={`Oyuncu ${index + 1}`}
                                                    placeholderTextColor={COLORS.inputPlaceholder}
                                                    value={player.name}
                                                    onChangeText={(text) => handleNameChange(text, index)}
                                                    maxLength={15}
                                                    autoCapitalize="words"
                                                    returnKeyType={index === players.length - 1 ? "done" : "next"}
                                                    onFocus={() => handleInputFocus(index)} // Odaklanınca kaydırma ve state güncelleme
                                                    onBlur={() => setFocusedInput(null)} // Odak kalkınca state'i sıfırla
                                                    onSubmitEditing={() => focusNextInput(index)} // Enter ile sonraki
                                                    blurOnSubmit={index === players.length - 1} // Sadece son inputta submit edince klavyeyi kapat
                                                />
                                            </MotiView>
                                        ))}
                                    </AnimatePresence>
                                </View>
                            </View>

                             {/* Custom Tasks */}
                            <View style={styles.section}>
                                <Text style={styles.label}>Özel Görev Ekle (Opsiyonel, Max {MAX_CUSTOM_TASKS})</Text>
                                <View style={styles.addTaskContainer}>
                                    <TextInput
                                        style={[ styles.input, styles.taskInput, focusedInput === 'newTask' && styles.inputFocused ]}
                                        placeholder="Kendi komik görevini yaz..."
                                        placeholderTextColor={COLORS.inputPlaceholder}
                                        value={newTask}
                                        onChangeText={setNewTask}
                                        maxLength={120}
                                        returnKeyType="done" // Enter = Ekle
                                        onSubmitEditing={handleAddTask}
                                        onFocus={() => handleInputFocus('newTask')}
                                        onBlur={() => setFocusedInput(null)}
                                         multiline={true} // Çok satırlı görevler için
                                         numberOfLines={2} // Başlangıç yüksekliği
                                    />
                                    <ActionButton
                                        title="Ekle" onPress={handleAddTask}
                                        disabled={!newTask.trim() || customTasksList.length >= MAX_CUSTOM_TASKS}
                                        style={styles.addButton} textStyle={styles.addButtonText}
                                        type="success" iconLeft="add-circle-outline"
                                    />
                                </View>
                                 {/* Task List */}
                                <AnimatePresence>
                                     {customTasksList.length > 0 && (
                                         <View style={styles.taskList}>
                                             {customTasksList.map((task, index) => (
                                                 <MotiView
                                                    key={`task-${index}-${task}`}
                                                    from={{ opacity: 0, scale: 0.8, height: 0}}
                                                    animate={{ opacity: 1, scale: 1, height: 'auto'}}
                                                    exit={{ opacity: 0, scale: 0.8, height: 0}}
                                                    transition={{ type: 'timing', duration: 250 }}
                                                    style={styles.taskItem}
                                                    // overflow="hidden"
                                                 >
                                                     <Text style={styles.taskText} numberOfLines={3}>{task}</Text>
                                                     <TouchableOpacity onPress={() => handleRemoveTask(index)} style={styles.removeButton}>
                                                         <Ionicons name="trash-outline" size={SIZES.iconSizeSmall * 1.1} color={COLORS.negativeLight} />
                                                      </TouchableOpacity>
                                                 </MotiView>
                                             ))}
                                          </View>
                                     )}
                                </AnimatePresence>
                                {customTasksList.length === 0 && (
                                     <Text style={styles.noTasksText}>Henüz özel görev eklenmedi.</Text>
                                )}
                             </View>

                            {/* Start Game Button */}
                            <View style={styles.bottomAction}>
                                {/* MotiView ile hafif bir animasyon */}
                                 <MotiView from={{opacity:0, translateY: 10}} animate={{opacity:1, translateY: 0}} transition={{delay:100}}>
                                    <ActionButton
                                        title={`Oyunu ${playerCount} Kişiyle Başlat`}
                                        onPress={handleStartGame}
                                        iconRight="rocket-outline"
                                        type="primary" // Ana başlatma rengi
                                         // Loading state eklenebilir
                                     />
                                 </MotiView>
                             </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
             </KeyboardAvoidingView>
         </LinearGradient>
    );
};

// --- Styles --- (Minor adjustments might be needed after layout review)
const styles = StyleSheet.create({
    flexFill: { flex: 1 },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingBottom: SIZES.paddingLarge * 2, // En alttaki buton için daha fazla boşluk
    },
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + SIZES.padding : SIZES.paddingLarge * 1.2,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SIZES.marginLarge * 1.5,
        position: 'relative',
    },
    title: {
        fontSize: SIZES.h2 * 1.1,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    rulesButton: {
        position: 'absolute',
        right: -SIZES.paddingSmall,
        top: -SIZES.paddingSmall,
        padding: SIZES.padding,
        zIndex: 1,
    },
    section: {
        width: '100%',
        maxWidth: SIZES.contentMaxWidth,
        marginBottom: SIZES.marginLarge * 1.3,
    },
    label: {
        fontSize: SIZES.title,
        fontFamily: SIZES.bold,
        color: COLORS.textSecondary,
        marginBottom: SIZES.margin,
        alignSelf: 'flex-start',
    },
    playerCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.07)',
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.paddingSmall,
        borderRadius: SIZES.inputRadius * 2,
        minHeight: 65,
    },
    countButton: {
        padding: SIZES.padding,
        borderRadius: 50, // Tam yuvarlak
        backgroundColor: COLORS.accentDisabled,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countButtonDisabled: {
        backgroundColor: 'rgba(90, 103, 124, 0.4)',
        opacity: 0.6,
    },
    playerCountText: {
        fontSize: SIZES.h2 * 1.2,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        minWidth: 60,
    },
    playersContainer: {
        width: '100%',
    },
    playerInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.marginMedium, // Satırlar arası boşluk
         height: 75, // Moti animasyonu için sabit yükseklik
    },
    avatarButton: {
        padding: SIZES.base,
        marginRight: SIZES.margin,
        borderRadius: 40, // Yuvarlak avatar arka planı
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
         width: SIZES.h2 * 2, // Genişlik ayarı
         height: SIZES.h2 * 2, // Yükseklik ayarı
         alignItems:'center', // Emojiyi ortala
         justifyContent:'center',
    },
    avatarText: {
        fontSize: SIZES.h2, // Avatar boyutu
    },
    input: { // Genel input stili
        backgroundColor: COLORS.inputBg,
        borderWidth: 1.5,
        borderColor: COLORS.inputBorder,
        color: COLORS.inputText,
        paddingHorizontal: SIZES.paddingMedium,
         paddingVertical: Platform.OS === 'ios' ? SIZES.paddingMedium * 1.2 : SIZES.paddingMedium * 0.8, // Dikey padding ince ayar
        borderRadius: SIZES.inputRadius,
        fontSize: SIZES.body,
        fontFamily: SIZES.regular,
         textAlignVertical: 'center', // Android için dikey hizalama
    },
    nameInput: { // Oyuncu adı inputuna özel
        flex: 1, // Kalan alanı doldur
         height: '80%', // Avatar ile hizalamak için yükseklik
    },
    inputFocused: {
        borderColor: COLORS.inputBorderFocused,
        backgroundColor: 'rgba(66, 153, 225, 0.1)',
        shadowColor: COLORS.inputBorderFocused,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 4, // Android shadow
    },
    addTaskContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Multiline input için başlangıca hizala
        marginBottom: SIZES.marginMedium,
    },
    taskInput: {
        flex: 1,
        marginRight: SIZES.marginSmall,
        // minHeight: 50, // Multiline için min yükseklik
         maxHeight: 100, // Uzun görevler için max yükseklik
         paddingVertical: SIZES.padding, // İç padding
         textAlignVertical: 'top', // Multiline için üstten başla
    },
    addButton: {
        width: 'auto',
        minWidth: 70,
        paddingHorizontal: SIZES.padding,
         marginVertical: 0,
         // Yüksekliği taskInput ile daha iyi hizala (approx.)
         height: Platform.OS === 'ios' ? 50 : 55,
         alignSelf: 'center', // Dikeyde ortala (container alignItems: flex-start olduğu için)
    },
    addButtonText: {
        fontSize: SIZES.body * 0.9, // Biraz daha küçük olabilir
    },
    taskList: {
        marginTop: SIZES.base,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingVertical: SIZES.paddingSmall * 1.2, // Daha fazla dikey boşluk
        paddingLeft: SIZES.padding,
        paddingRight: SIZES.paddingSmall,
        borderRadius: SIZES.base,
        marginBottom: SIZES.base,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.warning,
        minHeight: 50, // min yükseklik
         overflow: 'hidden', // Moti animasyonu için
    },
    taskText: {
        flex: 1,
        fontSize: SIZES.caption,
        fontFamily: SIZES.regular,
        color: COLORS.textPrimary,
        marginRight: SIZES.base,
        lineHeight: SIZES.caption * 1.4,
    },
    removeButton: {
        padding: SIZES.paddingSmall * 0.8,
        marginLeft: SIZES.base,
        borderRadius: SIZES.base,
    },
    noTasksText: {
        color: COLORS.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: SIZES.margin,
        fontFamily: SIZES.regular,
        fontSize: SIZES.caption,
        lineHeight: SIZES.caption * 1.5,
    },
    bottomAction: {
        width: '100%',
        maxWidth: SIZES.buttonMaxWidth,
        marginTop: SIZES.marginLarge,
        paddingBottom: SIZES.padding, // Klavye görünümünü itmemesi için
    },
    warningText: {
        fontSize: SIZES.small,
        color: COLORS.warningLight,
        textAlign: 'center',
        marginTop: SIZES.base * 1.5,
        fontFamily: SIZES.regular,
    },
});

export default SetupScreen;