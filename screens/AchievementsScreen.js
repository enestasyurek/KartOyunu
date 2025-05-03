import React, { useMemo } from 'react'; // useMemo eklendi
import { View, Text, StyleSheet, FlatList, Platform, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/useGame'; // Doğru hook
import { COLORS, SIZES } from '../constants/theme';
import { ACHIEVEMENTS_LIST, getAchievementDetails } from '../data/achievements';
import ActionButton from '../components/ActionButton'; // Geri butonu için
import { Ionicons } from '@expo/vector-icons'; // Header ikonu için
import { MotiView } from 'moti'; // Animasyon için

// Helper component for rendering each achievement item
const AchievementItem = ({ item, unlocked }) => {
    const details = getAchievementDetails(item.id); // ID ile detayları al

     // Moti animasyonları için (listenin görünür olmasıyla tetiklenebilir)
     const animProps = useMemo(() => ({
          from: { opacity: 0, translateY: 15 },
          animate: { opacity: 1, translateY: 0 },
          transition: { type: 'timing', duration: 300 }
      }), []);

    if (!details) return null; // Detay bulunamazsa render etme

    return (
        <MotiView {...animProps} style={[styles.achievementItem, unlocked ? styles.unlocked : styles.locked]}>
             {/* Sol Taraf: İkon */}
             <View style={[styles.iconContainer, unlocked && styles.iconContainerUnlocked]}>
                  {/* Dinamik ikon (kazanıldı/kazanılmadı) */}
                  <Text style={styles.icon}>{unlocked ? '🏆' : '🔒'}</Text>
              </View>
              {/* Sağ Taraf: Metin */}
             <View style={styles.textContainer}>
                 <Text style={[styles.name, !unlocked && styles.lockedText]}>{details.name}</Text>
                 <Text style={[styles.description, !unlocked && styles.lockedText]}>{details.description}</Text>
              </View>
          </MotiView>
    );
};


const AchievementsScreen = ({ navigation }) => {
    const { gameState } = useGame();
    const unlockedAchievementsState = gameState.achievements || {}; // Başarım state'i

    // FlatList için veriyi hazırla ve sırala (kilitsizler üste)
    const sortedAchievementsData = useMemo(() => {
        return ACHIEVEMENTS_LIST
            .map(ach => ({ id: ach.id, unlocked: !!unlockedAchievementsState[ach.id]?.unlocked }))
            .sort((a, b) => (b.unlocked === a.unlocked) ? 0 : b.unlocked ? -1 : 1); // Önce unlocked=true olanlar
     }, [unlockedAchievementsState]); // State değişince yeniden hesapla

     // Kilitli/Kilitsiz başarım sayısını hesapla
    const unlockedCount = sortedAchievementsData.filter(a => a.unlocked).length;
    const totalCount = sortedAchievementsData.length;

    // Render item fonksiyonu
    const renderAchievement = ({ item, index }) => (
         // index prop'unu animasyon gecikmesi için kullanabiliriz
        <AchievementItem item={item} unlocked={item.unlocked} />
    );

    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
             <SafeAreaView style={styles.flexFill}>
                <View style={styles.container}>
                     {/* Header */}
                    <View style={styles.header}>
                         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back-outline" size={SIZES.iconSizeLarge} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                         <Text style={styles.title}>Başarımlar</Text>
                        {/* Sağ taraf boş */}
                         <View style={styles.backButton} />
                    </View>

                     {/* Başarım Sayacı */}
                    <Text style={styles.counterText}>
                        {unlockedCount} / {totalCount} tamamlandı
                    </Text>

                     {/* Başarım Listesi */}
                    <FlatList
                         data={sortedAchievementsData}
                         renderItem={renderAchievement}
                         keyExtractor={(item) => item.id}
                         style={styles.list}
                         contentContainerStyle={styles.listContent}
                         showsVerticalScrollIndicator={false}
                         // ItemSeparatorComponent={() => <View style={styles.separator} />} // Ayırıcı çizgi kaldırıldı
                     />

                    {/* Geri Butonu (Artık Header'da) */}
                    {/* <View style={styles.bottomAction}>
                         <ActionButton title="Geri Dön" onPress={() => navigation.goBack()} type="secondary" />
                     </View> */}
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
        // paddingHorizontal artık listede/headerda
        // paddingBottom: 20, // Liste zaten aşağı kadar uzanıyor
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0, // SafeArea hallediyor
    },
    header: { // Diğer ekranlarla aynı header
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.paddingSmall,
        paddingVertical: SIZES.paddingSmall,
        marginBottom: SIZES.marginSmall, // Sayaçtan önce hafif boşluk
    },
    backButton: { // Diğer ekranlarla aynı
        padding: SIZES.paddingSmall,
        minWidth: 40,
        alignItems: 'center'
    },
    title: { // Diğer ekranlarla aynı
        fontSize: SIZES.h2 * 1.1,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
     counterText: { // Yeni sayaç stili
         fontSize: SIZES.body,
         fontFamily: SIZES.regular,
         color: COLORS.textSecondary,
         marginBottom: SIZES.marginMedium, // Listeden önce boşluk
     },
    list: {
        width: '100%',
        flex: 1, // Kalan alanı doldur
    },
    listContent: {
        paddingHorizontal: SIZES.padding, // Liste içeriği için yan boşluklar
        paddingBottom: SIZES.paddingLarge, // Scroll dibi boşluğu
    },
    achievementItem: {
        flexDirection: 'row',
        alignItems: 'center', // Dikeyde ortala
        paddingVertical: SIZES.paddingMedium, // İç dikey boşluk
        paddingHorizontal: SIZES.padding, // İç yatay boşluk
        borderRadius: SIZES.cardRadius * 0.8, // Yumuşak köşeler
        marginBottom: SIZES.marginMedium, // Öğeler arası boşluk
        borderWidth: 1.5, // Kenarlık kalınlığı
        overflow: 'hidden', // Moti animasyonları için
    },
    unlocked: {
        backgroundColor: 'rgba(72, 187, 120, 0.2)', // Kilitsiz arka planı (daha belirgin)
        borderColor: COLORS.positive, // Kilitsiz kenarlık rengi
    },
    locked: {
        backgroundColor: 'rgba(113, 128, 150, 0.1)', // Kilitli arka planı
        borderColor: COLORS.textMuted, // Kilitli kenarlık rengi
        opacity: 0.75, // Kilitlileri hafif soluklaştır
    },
    iconContainer: {
        marginRight: SIZES.padding, // İkon ve metin arası boşluk
        padding: SIZES.paddingSmall * 1.2, // İkon etrafında boşluk
        borderRadius: 30, // Yuvarlak ikon arka planı
        backgroundColor: 'rgba(0,0,0,0.2)', // Genel ikon arka planı
         alignItems: 'center',
         justifyContent: 'center',
         width: SIZES.iconSizeLarge * 1.5, // Sabit boyut
         height: SIZES.iconSizeLarge * 1.5, // Sabit boyut
    },
     iconContainerUnlocked: {
         backgroundColor: COLORS.positive, // Kazanılınca farklı arka plan
     },
    icon: {
        fontSize: SIZES.iconSize * 1.1, // İkon boyutu
        color: COLORS.textPrimary, // İkon rengi
    },
    textContainer: {
        flex: 1, // Metin alanı kalan genişliği alsın
    },
    name: {
        fontSize: SIZES.title, // Başarım adı daha büyük
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        marginBottom: SIZES.base * 0.5, // Ad ve açıklama arası boşluk
    },
    description: {
        fontSize: SIZES.body, // Açıklama boyutu
         fontFamily: SIZES.regular,
        color: COLORS.textSecondary,
        lineHeight: SIZES.body * 1.4, // Okunabilirlik
    },
    lockedText: {
        color: COLORS.textMuted, // Kilitli metin rengi (zaten opacity var item'da)
    },
    // separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }, // Ayırıcı çizgiye gerek kalmadı
    // bottomAction kaldırıldı, geri butonu header'da
});

export default AchievementsScreen;