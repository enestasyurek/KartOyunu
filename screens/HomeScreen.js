import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
import ActionButton from '../components/ActionButton';
import { MotiView, MotiText } from 'moti';
import { Ionicons } from '@expo/vector-icons'; // İkonlar için

const HomeScreen = ({ navigation }) => {
    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            <View style={styles.container}>
                {/* Başlık ve Logo Alanı */}
                <MotiView
                    from={{ opacity: 0, translateY: -40, scale: 0.8 }}
                    animate={{ opacity: 1, translateY: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 100 }}
                    style={styles.titleContainer}
                >
                    <MotiText style={styles.logoPlaceholder}>🃏</MotiText>
                    <Text style={styles.title}>Kart Oyunu</Text>
                    <Text style={styles.subtitle}>Arkadaşlarınla Eğlencenin Dibine Vur!</Text>
                </MotiView>

                {/* Buton Alanı */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 400, delay: 300 }}
                    style={styles.buttonsContainer}
                >
                    {/* Oyna Butonu */}
                    <ActionButton
                        title="Yeni Oyuna Başla"
                        onPress={() => navigation.navigate('Setup')}
                        iconRight="play-forward" // İkon güncel
                        type="primary" // Ana buton
                        style={styles.mainButton} // Biraz daha büyük
                    />
                    {/* Diğer Butonlar (Grid Yapısı) */}
                    <View style={styles.secondaryButtonsGrid}>
                        {/* Kurallar */}
                        <MotiView
                            style={styles.gridButton}
                            from={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 400 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <TouchableOpacity onPress={() => navigation.navigate('HowToPlay')} style={styles.touchableContent}>
                                <Ionicons name="book-outline" size={SIZES.iconSize * 1.3} color={COLORS.accentLight} />
                                <Text style={styles.gridButtonText}>Kurallar</Text>
                            </TouchableOpacity>
                        </MotiView>
                        {/* Başarımlar */}
                        <MotiView
                            style={styles.gridButton}
                            from={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 500 }} // Staggered delay
                            whileTap={{ scale: 0.95 }}
                        >
                            <TouchableOpacity onPress={() => navigation.navigate('Achievements')} style={styles.touchableContent}>
                                <Ionicons name="trophy-outline" size={SIZES.iconSize * 1.3} color={COLORS.warningLight} />
                                <Text style={styles.gridButtonText}>Başarımlar</Text>
                            </TouchableOpacity>
                        </MotiView>
                        {/* İstatistikler */}
                        <MotiView
                            style={styles.gridButton}
                            from={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 600 }} // Staggered delay
                            whileTap={{ scale: 0.95 }}
                        >
                            <TouchableOpacity onPress={() => navigation.navigate('Statistics')} style={styles.touchableContent}>
                                <Ionicons name="stats-chart-outline" size={SIZES.iconSize * 1.3} color={COLORS.positiveLight} />
                                <Text style={styles.gridButtonText}>İstatistikler</Text>
                            </TouchableOpacity>
                        </MotiView>
                         {/* Ayarlar (Gelecekte)
                         <TouchableOpacity style={styles.gridButton} onPress={() => { alert('Yakında!'); }}>
                             <Ionicons name="settings-outline" size={SIZES.iconSize * 1.3} color={COLORS.textSecondary} />
                            <Text style={styles.gridButtonText}>Ayarlar</Text>
                         </TouchableOpacity> */}
                     </View>
                </MotiView>

                 {/* Footer */}
                 <MotiText
                      from={{opacity: 0}} animate={{opacity:1}} transition={{delay: 500}}
                     style={styles.footerText}>
                      İyi Eğlenceler! 🎉
                  </MotiText>
             </View>
        </LinearGradient>
    );
};

// --- Stiller (İyileştirildi) ---
const styles = StyleSheet.create({
     flexFill: { flex: 1 },
     container: {
         flex: 1,
         justifyContent: 'space-between', // Alanları dikeyde dağıt
         alignItems: 'center', // Yatayda ortala
         paddingHorizontal: SIZES.padding * 1.5,
         paddingBottom: SIZES.paddingLarge, // Footer için boşluk
          paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + SIZES.padding * 2 : SIZES.paddingLarge * 1.5,
     },
     titleContainer: {
         alignItems: 'center',
         // marginBottom: SIZES.margin, // Otomatik boşluk bırakılacak
     },
     logoPlaceholder: {
          fontSize: 100, // Daha büyük logo
          marginBottom: SIZES.base,
      },
     title: {
         fontSize: SIZES.h1 * 1.4, // Daha büyük başlık
         fontFamily: SIZES.bold,
         color: COLORS.textPrimary,
         textAlign: 'center',
         letterSpacing: 1.5,
     },
     subtitle: {
         fontSize: SIZES.body * 1.1, // Biraz daha büyük alt başlık
         fontFamily: SIZES.regular,
         color: COLORS.textSecondary,
         marginTop: SIZES.base * 1.5, // Başlıkla arası boşluk
         textAlign: 'center',
     },
     buttonsContainer: {
         width: '100%', // Konteynır tam genişlik
         maxWidth: SIZES.buttonMaxWidth * 1.1, // Maks genişlik
         alignItems: 'center',
         // marginVertical: SIZES.margin, // Otomatik boşluk
     },
     mainButton: {
          width: '100%', // Ana buton tam genişlik
          paddingVertical: SIZES.paddingMedium * 1.2, // Daha yüksek
          marginBottom: SIZES.marginLarge * 1.5, // Altındaki grid'den önce boşluk
      },
     secondaryButtonsGrid: {
          flexDirection: 'row', // Yatay sıra
         flexWrap: 'wrap', // Sığmazsa alt satıra geç (2x2 için gerekmez)
          justifyContent: 'space-around', // Eşit aralık bırak
          width: '100%', // Grid tam genişlik
      },
     gridButton: {
          alignItems: 'center',
         justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)', // Hafif arka plan
          borderRadius: SIZES.cardRadius, // Yuvarlak köşeler
         // padding: SIZES.paddingMedium, // Padding will be handled by touchableContent
         width: '45%', // İki sütunlu yapı için yaklaşık genişlik
          aspectRatio: 1.1, // Yaklaşık karemsi görünüm
          marginBottom: SIZES.margin, // Butonlar arası boşluk
          borderWidth: 1,
         borderColor: 'rgba(255, 255, 255, 0.15)',
     },
     touchableContent: { // New style for the content inside MotiView
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SIZES.paddingMedium,
     },
     gridButtonText: {
          marginTop: SIZES.base,
          fontSize: SIZES.caption,
          fontFamily: SIZES.bold,
          color: COLORS.textPrimary,
          textAlign: 'center',
      },
     footerText: {
          fontSize: SIZES.caption,
          fontFamily: SIZES.regular,
          color: COLORS.textMuted,
          // marginTop: SIZES.margin, // Otomatik boşluk
      }
 });

export default HomeScreen;