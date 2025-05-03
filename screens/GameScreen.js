// screens/GameScreen.js
import React, { useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, Platform, StatusBar, TouchableOpacity,
    BackHandler, // Android geri tuşu için
    Alert // Onay penceresi için
} from 'react-native';
import Constants from 'expo-constants';
import { useGame } from '../context/useGame'; // <-- Doğru hook
import Card, { CARD_WIDTH, CARD_HEIGHT } from '../components/Card'; // Kart component'i ve boyutları
import { LinearGradient } from 'expo-linear-gradient'; // Arka plan gradient
import { COLORS } from '../constants/theme'; // Renk sabitleri
import ActionButton from '../components/ActionButton'; // Özel buton component'i
import { getAchievementDetails } from '../data/achievements'; // Başarım detayları için
import { Ionicons } from '@expo/vector-icons'; // İkon için (opsiyonel)
import { MotiView, MotiText, AnimatePresence } from 'moti'; // Animasyon için Moti

// --- Animated Score Component ---
// Skor değiştiğinde animasyonla güncellenir
const AnimatedScore = ({ score }) => {
    // Moti, score prop'u değiştiğinde animasyonu otomatik olarak yönetir
    return (
        <MotiText
            style={styles.scorePoints} // Temel stil (fontFamily dahil)
            from={{ translateY: -10, opacity: 0 }} // Başlangıç durumu
            animate={{ translateY: 0, opacity: 1 }} // Bitiş durumu
            transition={{ type: 'timing', duration: 300 }} // Animasyon süresi
            key={score} // Skor değiştiğinde animasyonu tetiklemek için key
        >
            {score}
        </MotiText>
    );
};

// Scoreboard Componenti (AnimatedScore Kullanıldı)
const Scoreboard = ({ players, currentPlayerId }) => (
    // Skor tablosunun potansiyel animasyonları için MotiView
    <MotiView style={styles.scoreboardContainer}>
         <View style={styles.scoreboard}>
             {players.map(player => {
                 const isActive = player.id === currentPlayerId; // Aktif oyuncu mu?
                 return (
                    // Aktif oyuncu satırı için ek stil
                    <View key={player.id} style={[ styles.scoreRow, isActive && styles.activePlayerRow ]}>
                        <Text style={styles.avatarText}>{player.avatarId || '👤'}</Text>
                        <Text style={[ styles.scoreText, isActive && styles.activePlayerText ]} numberOfLines={1}> {player.name} </Text>
                        <View style={styles.scoreAndIndicator}>
                            {/* Animasyonlu skor gösterimi */}
                            <AnimatedScore score={player.score} />
                            {/* Aktif oyuncu için belirgin bir ikon */}
                            {isActive && <Ionicons name="chevron-forward-circle" size={18} color={COLORS.accent} style={styles.turnIndicatorIcon} />}
                        </View>
                    </View>
                 );
             })}
         </View>
    </MotiView>
);

// Ana Game Screen Componenti
const GameScreen = ({ navigation }) => {
    // --- Context State ve Actions ---
    const { gameState, actions } = useGame(); // useGame hook'undan state ve actions'ı al
    const {
        players, currentPlayerIndex, currentRedCard, currentBlueCardInfo, gamePhase, message,
        lastActionMessage, selectedPlayerForTask, revealingPlayerIndex, votingInfo, pendingAchievementNotifications
    } = gameState;

    // --- Efektler ---
    // Başarım Bildirimi
    useEffect(() => {
        if (pendingAchievementNotifications && pendingAchievementNotifications.length > 0 && gamePhase !== 'setup') {
            const achievementId = pendingAchievementNotifications[0];
            // State güncellemesi sonrası alert göstermek için küçük bir gecikme
            const timer = setTimeout(() => {
                const details = getAchievementDetails(achievementId); // Başarım detaylarını al
                alert(`Başarım Açıldı!\n🏆 ${details?.name || achievementId}\n${details?.description || ''}`);
                actions.markAchievementNotified(achievementId); // Bildirildi olarak işaretle (action çağır)
            }, 300); // Gecikme süresi
            return () => clearTimeout(timer); // Component unmount olduğunda zamanlayıcıyı temizle
        }
    }, [pendingAchievementNotifications, actions, gamePhase]); // Bağımlılıklar

    // Oyun Sonu Yönlendirme
    useEffect(() => {
        if (gamePhase === 'assigningBlackCard' || gamePhase === 'ended') {
            navigation.navigate('End'); // Oyun bittiğinde EndScreen'e git
        }
        // Oyun sonu kontrolü context içindeki useEffect'te yapılıyor.
    }, [gamePhase, navigation]); // Bağımlılıklar

     // --- Geri Tuşu Yönetimi (Koşullu Onay ile) ---
    useEffect(() => {
        const backAction = () => {
            // Sadece oyunun aktif fazlarında onay iste
            const shouldConfirm = [
                'playing', 'decision', 'selectingPlayer', 'revealingBlueCard',
                'redCardForSelected', 'showingNewBlueCard', 'voting', 'processingVote'
            ].includes(gamePhase); // gamePhase'i doğrudan kullan

            if (shouldConfirm) {
                  Alert.alert( "Ana Menüye Dön", "Oyundan çıkıp ana menüye dönmek istediğinize emin misiniz? Mevcut ilerleme kaydedilebilir.",
                     [
                        { text: "Hayır", onPress: () => null, style: "cancel" }, // Bir şey yapma
                        { text: "Evet", onPress: () => navigation.navigate('Home') } // Anasayfaya git
                     ]
                  );
                  return true; // Android'de varsayılan geri tuşu davranışını engelle
            } else {
                 // Diğer fazlarda (örn. initialBlueCardReveal) normal geri gitmeye izin ver
                 return false;
            }
        };

        // Android fiziksel geri tuşu için dinleyici
        const backHandler = BackHandler.addEventListener( "hardwareBackPress", backAction );
        // iOS geri hareketi için dinleyici
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
             const shouldConfirm = ['playing', 'decision', 'selectingPlayer', 'revealingBlueCard', 'redCardForSelected', 'showingNewBlueCard', 'voting', 'processingVote'].includes(gameState.gamePhase); // En güncel gamePhase'i oku
             // Kullanıcı tarafından başlatılan (swipe/header back) ve onay gerektiren fazlarda
             if ((e.data.action.type === 'POP' || e.data.action.type === 'GO_BACK') && shouldConfirm && !e.data.action.source) {
                  e.preventDefault(); // Varsayılan geri gitmeyi engelle
                  backAction();       // Onay penceresini göster
              }
        });

        return () => { // Cleanup: Dinleyicileri kaldır
            backHandler.remove();
            unsubscribe();
        }
      }, [navigation, gamePhase]); // navigation ve gamePhase bağımlılıkları


    // --- Oyuncu Bilgileri ---
    // O anki aktif oyuncunun ID'sini ve diğer oyuncuları belirle
    const activePlayerId = gamePhase === 'initialBlueCardReveal' ? players[revealingPlayerIndex]?.id : players[currentPlayerIndex]?.id;
    const otherPlayers = players.filter(p => p.id !== currentPlayerIndex);
    const currentPlayerName = players.find(p => p.id === activePlayerId)?.name || ''; // Aktif oyuncu ismini al

    // --- Yükleniyor / Hata Kontrolleri ---
    // Oyuncular yüklenmediyse veya beklenmedik bir durum varsa yükleme/hata ekranı göster
    if (!players || players.length === 0 ) {
         if(gamePhase !== 'setup') {
             return ( <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexCenter}><ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 50} color={COLORS.negative} /><Text style={[styles.loadingText, {color: COLORS.textSecondary}]}>Oyuncu Verisi Yüklenemedi!</Text></LinearGradient> );
         }
         return ( <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexCenter}><ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 50} color={COLORS.accent} /><Text style={[styles.loadingText, {color: COLORS.textSecondary}]}>Oyun Kuruluyor...</Text></LinearGradient> );
        }
    // Aktif oyuncu indeksi geçerli mi kontrolü
    const isPlayerError = (
        (gamePhase === 'initialBlueCardReveal' && !players[revealingPlayerIndex]) ||
        (gamePhase !== 'initialBlueCardReveal' && gamePhase !== 'setup' && !players[currentPlayerIndex])
    );
    if (isPlayerError) {
        return ( <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexCenter}><ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 50} color={COLORS.negative} /><Text style={[styles.loadingText, {color: COLORS.textSecondary}]}>Oyuncu bilgisi hatası!</Text></LinearGradient> );
     }
    // --- Yükleniyor / Hata Kontrolleri Sonu ---


    // --- Oylama Butonları Render Fonksiyonu (useCallback ile memoize edildi) ---
    const renderVotingButtons = useCallback(() => {
        if (!votingInfo) return null;
        const voters = players.filter(p => p.id !== votingInfo.performerId); // Görevi yapan oy veremez
        if (voters.length === 0) { return <Text style={styles.warningText}>Oylayacak başka oyuncu yok!</Text>; }
        return (
            <View style={styles.votingContainer}>
                {voters.map(voter => (
                    <View key={voter.id} style={styles.voterRow}>
                        <Text style={styles.voterName}>{voter.avatarId} {voter.name}:</Text>
                        {votingInfo.votes[voter.id] === null ? ( // Henüz oy vermediyse
                            <View style={styles.voteButtons}>
                                <TouchableOpacity onPress={() => actions.castVote(voter.id, 'yes')} style={[styles.voteButton, styles.voteYes]}>
                                    <Text style={styles.voteButtonText}>Evet 👍</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => actions.castVote(voter.id, 'no')} style={[styles.voteButton, styles.voteNo]}>
                                    <Text style={styles.voteButtonText}>Hayır 👎</Text>
                                </TouchableOpacity>
                            </View>
                        ) : ( // Oy verdiyse
                            <Text style={styles.voteCast}>{votingInfo.votes[voter.id] === 'yes' ? 'Evet 👍' : 'Hayır 👎'}</Text>
                        )}
                    </View>
                ))}
            </View>
        );
    }, [votingInfo, players, actions]); // Bağımlılıklar: votingInfo, players, actions


    // --- Oyuncu Seçim Butonu Render Fonksiyonu (useCallback ile memoize edildi) ---
    const renderPlayerSelectButton = useCallback((player) => {
        const isDisabled = !player.blueCard || player.blueCard === "Deste Bitti!";
        const title = `${player.name} ${isDisabled ? '(Kart Yok!)' : ''}`;
        return (
            <ActionButton
                key={player.id}
                title={title}
                onPress={() => actions.selectPlayerForTask(player.id)} // actions objesinden çağır
                disabled={isDisabled}
                type="secondary" // Buton tipi
                style={styles.playerSelectButton} // Ek stil
            />
        );
    }, [actions]); // Sadece actions'a bağlı (içindeki fonksiyonların referansı stabil)

    // --- Ana Render JSX ---
    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            {/* İçerik konteyneri (StatusBar padding'i ile) */}
            <View style={styles.container}>
                 {/* Üst Alan: Skor Tablosu ve Aktif Oyuncu Göstergesi */}
                 <View style={styles.topArea}>
                     <Scoreboard players={players} currentPlayerId={activePlayerId} />
                     {/* Sadece oyunun ana fazlarında aktif oyuncuyu göster */}
                     {(gamePhase !== 'initialBlueCardReveal' && gamePhase !== 'setup') && (
                         <MotiView
                            from={{ opacity: 0, translateY: -10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300 }}
                         >
                            <View style={styles.currentPlayerIndicator}>
                                <Text style={styles.currentPlayerText}>Sıra: {currentPlayerName}</Text>
                            </View>
                         </MotiView>
                     )}
                 </View>

                {/* Oyun Alanı (Esnek, dikeyde içeriği dağıtacak) */}
                <View style={styles.gameArea}>
                    {/* Son Aksiyon Mesajı Alanı (Animasyonlu) */}
                    <View style={styles.lastActionContainer}>
                        <AnimatePresence> {/* Giriş/Çıkış animasyonları için */}
                             {lastActionMessage ? (
                                <MotiText
                                    style={styles.lastActionText}
                                    from={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: 'timing', duration: 250 }}
                                    key={lastActionMessage} // Mesaj değiştiğinde animasyonu tetikle
                                >
                                    {lastActionMessage}
                                </MotiText>
                             ) : ( <View style={styles.lastActionPlaceholder} /> /* Mesaj yoksa boşluk */ )}
                         </AnimatePresence>
                    </View>

                    {/* Oylama Arayüzü veya Kart Gösterme Alanı */}
                    {gamePhase === 'voting' || gamePhase === 'processingVote' ? (
                         renderVotingButtons() // Oylama arayüzünü render et
                    ) : (
                        // Normal Kart Gösterme Alanı
                        <View style={styles.cardDisplayArea}>
                            {/* Kartlar (Card component'i kendi animasyonlarını yönetir) */}
                            <Card // Tek bir Card component'i, tip ve içeriği state'ten alır
                                type={currentBlueCardInfo?.isVisible ? "mavi" : (currentRedCard?.isVisible ? "kırmızı" : "kapalı")}
                                text={currentBlueCardInfo?.text || currentRedCard?.text || ""}
                                isVisible={!!currentBlueCardInfo?.isVisible || !!currentRedCard?.isVisible}
                                key={currentRedCard?.id || currentBlueCardInfo?.text || 'placeholder'} // Kart değiştiğinde animasyonu tetikle
                            />
                            {/* Placeholder mantığı Card component'i içine alındı ('kapalı' tipi ile) */}
                        </View>
                    )}

                    {/* Ana Mesaj Alanı (Animasyonlu) */}
                    <View style={styles.messageContainer}>
                         <MotiText
                            style={styles.messageText}
                            numberOfLines={4}
                            key={message} // Mesaj değiştiğinde animasyonu tetikle
                            from={{ opacity: 0.5, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300 }}
                         >
                             {message || ' '}
                         </MotiText>
                    </View>

                    {/* Ana Buton Alanı (Oylama sırasında gizlenir, animasyonlu) */}
                    {(gamePhase !== 'voting' && gamePhase !== 'processingVote') && (
                        <MotiView
                           from ={{ opacity: 0 }} // Başlangıçta görünmez
                           animate={{ opacity: 1 }} // Görünür hale getir
                           transition={{ type: 'timing', duration: 300 }} // Animasyon süresi
                           style={styles.actionButtonsContainer}
                        >
                            {/* Fazlara göre butonlar (actions objesindeki fonksiyonları çağırır) */}
                            {gamePhase === 'initialBlueCardReveal' && (
                                <>
                                    {!currentBlueCardInfo?.isVisible ? (
                                        <ActionButton title="Mavi Kartı Göster" onPress={actions.showInitialBlueCard} disabled={!players[revealingPlayerIndex]?.blueCard || players[revealingPlayerIndex].blueCard === "Deste Bitti!"} />
                                     ) : (
                                         <ActionButton title="Kapat ve Devam Et" onPress={actions.hideInitialBlueCardAndProceed} type="secondary"/>
                                     )}
                                    {(!players[revealingPlayerIndex]?.blueCard || players[revealingPlayerIndex].blueCard === "Deste Bitti!") && !currentBlueCardInfo?.isVisible && ( <Text style={styles.warningText}>Başlangıç mavi kartı yok.</Text> )}
                                </>
                             )}
                            {gamePhase === 'playing' && ( <ActionButton title="Kırmızı Kart Çek" onPress={actions.drawRedCardForTurn} /> )}
                            {gamePhase === 'decision' && currentRedCard?.isVisible && (
                                <>
                                    <ActionButton title="Ben Yaparım (+5 Puan)" onPress={actions.iWillDoIt} />
                                    <ActionButton title="O Yapsın..." onPress={actions.delegateTaskStart} disabled={otherPlayers.length === 0 || otherPlayers.every(p => !p.blueCard || p.blueCard === "Deste Bitti!")} type="secondary" style={styles.spacerTop} />
                                    {(otherPlayers.length === 0 || otherPlayers.every(p => !p.blueCard || p.blueCard === "Deste Bitti!")) && ( <Text style={styles.warningText}>Görev verilecek kimse yok.</Text> )}
                                </>
                             )}
                            {gamePhase === 'selectingPlayer' && (
                                <View style={styles.playerSelectionContainer}>
                                    {otherPlayers.length > 0 ? (
                                        otherPlayers.map(player => renderPlayerSelectButton(player)) // map ile butonları render et
                                    ) : ( <Text style={styles.warningText}>Seçilecek başka oyuncu yok.</Text> )}
                                    <ActionButton title="Vazgeç" type="danger" onPress={actions.cancelPlayerSelection} style={styles.spacerTop} />
                                </View>
                            )}
                            {gamePhase === 'revealingBlueCard' && currentBlueCardInfo?.isVisible && ( <ActionButton title="Mavi Görevi Yaptım (+10 Puan)" onPress={actions.delegatorDidBlueTask} /> )}
                            {gamePhase === 'redCardForSelected' && currentRedCard?.isVisible && ( <ActionButton title={`${players.find(p=>p.id === selectedPlayerForTask)?.name || ''} Kırmızı Görevi Yaptı (+5 Puan)`} onPress={actions.selectedPlayerDidRedTask} /> )}
                            {gamePhase === 'showingNewBlueCard' && currentBlueCardInfo?.isVisible && ( <ActionButton title="Yeni Kartı Kapat" onPress={actions.confirmCloseNewBlueCard} type="secondary" disabled={currentBlueCardInfo.text === "Deste Bitti!"} /> )}
                        </MotiView>
                    )}
                </View>
            </View>
        </LinearGradient>
    );
};

// --- Stiller (Önceki yanıttaki güncel halleri) ---
const styles = StyleSheet.create({
    flexFill: { flex: 1 },
    flexCenter: { flex: 1, alignItems: 'center', justifyContent: 'center'},
    container: { flex: 1, paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0 },
    loadingText: { marginTop: 15, fontSize: 16, color: COLORS.textSecondary },
    topArea: { paddingHorizontal: 5, },
    scoreboardContainer: {},
    scoreboard: { paddingVertical: 5, paddingHorizontal: 10, backgroundColor: COLORS.scoreboardBg, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, marginBottom: 5, },
    scoreRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, marginVertical: 1, },
    activePlayerRow: { backgroundColor: COLORS.activePlayerBg, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 5, transform: [{ scale: 1.02 }] },
    avatarText: { fontSize: 20, marginRight: 10, opacity: 0.9 },
    scoreText: { flex: 1, fontSize: 16, color: COLORS.textSecondary, fontWeight: '500', fontFamily: 'Oswald-Regular' /* Custom Font */ },
    activePlayerText: { color: COLORS.activePlayerText, fontWeight: 'bold', fontFamily: 'Oswald-Regular' /* Custom Font */ },
    scoreAndIndicator: { flexDirection: 'row', alignItems: 'center', marginLeft: 5, },
    scorePoints: { fontSize: 16, color: COLORS.textPrimary, fontWeight: 'bold', fontFamily: 'Oswald-Regular' /* Custom Font */ },
    turnIndicatorIcon: { marginLeft: 8, },
    currentPlayerIndicator: { paddingVertical: 6, paddingHorizontal: 15, backgroundColor: 'rgba(0,0,0,0.3)', alignSelf: 'center', borderRadius: 15, marginTop: 5, marginBottom: 5, },
    currentPlayerText: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, fontFamily: 'Oswald-Regular' /* Custom Font */ },
    gameArea: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 5, paddingBottom: 15, },
    lastActionContainer: { height: 30, justifyContent: 'center', marginBottom: 0, },
    lastActionText: { fontSize: 16, fontWeight: 'bold', color: COLORS.positive, textAlign: 'center', fontFamily: 'Oswald-Regular' /* Custom Font */ },
    lastActionPlaceholder: { height: 30, },
    cardDisplayArea: { flex: 3.5, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: -10 },
    cardPlaceholder: { width: CARD_WIDTH * 0.85, height: CARD_HEIGHT * 0.85, borderRadius: 16, backgroundColor: COLORS.cardPlaceholderBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardPlaceholderBorder, },
    cardPlaceholderText: { fontSize: 55, color: COLORS.textMuted, fontWeight: 'bold', },
    messageContainer: { flex: 1.5, width: '100%', justifyContent: 'center', paddingVertical: 5, },
    messageText: { fontSize: 17, textAlign: 'center', color: COLORS.textPrimary, lineHeight: 24, paddingHorizontal: 5, fontFamily: 'Oswald-Regular' /* Custom Font */ },
    actionButtonsContainer: { flex: 1.5, width: '95%', maxWidth: 380, justifyContent: 'flex-end', paddingBottom: 5, },
    playerSelectionContainer: { width: '100%', alignItems: 'center', marginBottom: 10, }, // No fixed height
    playerSelectButton: { marginVertical: 5, width: '100%', },
    warningText: { fontSize: 13, color: COLORS.warning, textAlign: 'center', marginTop: 5, fontFamily: 'Oswald-Regular' /* Custom Font */ },
    spacerTop: { marginTop: 10, },
    // Voting Styles
    votingContainer: { flex: 3.5, width: '95%', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 5, justifyContent: 'center', alignItems: 'stretch', },
    voterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 10, },
    voterName: { fontSize: 17, color: COLORS.textPrimary, fontWeight: '500', flexShrink: 1, marginRight: 10, fontFamily: 'Oswald-Regular' /* Custom Font */ },
    voteButtons: { flexDirection: 'row', },
    voteButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 25, marginHorizontal: 6, minWidth: 80, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, },
    voteYes: { backgroundColor: COLORS.positive, },
    voteNo: { backgroundColor: COLORS.negative, },
    voteButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, fontFamily: 'Oswald-Regular' /* Custom Font */ },
    voteCast: { fontSize: 16, fontWeight: 'bold', color: COLORS.textSecondary, paddingHorizontal: 10, fontFamily: 'Oswald-Regular' /* Custom Font */ },
});

export default GameScreen;