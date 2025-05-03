// screens/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, Image } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import ActionButton from '../components/ActionButton';
// useGame hook'unu import etmeye gerek yok, sadece navigasyon kullanılıyor

const HomeScreen = ({ navigation }) => {
    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            <View style={styles.container}>
                <View style={styles.titleContainer}>
                    {/* <Image source={require('../assets/logo.png')} style={styles.logo} /> */}
                    <Text style={styles.title}>Kart Oyunu</Text>
                    <Text style={styles.subtitle}>Arkadaşlarınla Eğlen!</Text>
                </View>

                <View style={styles.buttonsContainer}>
                    <ActionButton
                        title="Oyna"
                        onPress={() => navigation.navigate('Setup')}
                    />
                    <ActionButton
                        title="Kurallar"
                        onPress={() => navigation.navigate('HowToPlay')}
                        type="secondary"
                        style={styles.buttonSpacer}
                    />
                     <ActionButton
                        title="İstatistikler"
                        onPress={() => navigation.navigate('Statistics')}
                        type="secondary"
                        style={styles.buttonSpacer}
                     />
                     <ActionButton
                        title="Başarımlar"
                        onPress={() => navigation.navigate('Achievements')}
                        type="secondary"
                        style={styles.buttonSpacer}
                     />
                </View>

                 <Text style={styles.footerText}>İyi Eğlenceler!</Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    flexFill: { flex: 1 },
    container: {
        flex: 1, justifyContent: 'space-around', alignItems: 'center',
        paddingHorizontal: 30, paddingBottom: 40,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 30 : 60,
    },
    titleContainer: { alignItems: 'center', marginBottom: 20, },
    logo: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 20, },
    title: { fontSize: 48, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', letterSpacing: 1, },
    subtitle: { fontSize: 18, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center', },
    buttonsContainer: { width: '85%', maxWidth: 350, alignItems: 'center', },
    buttonSpacer: { marginTop: 12, },
    footerText: { fontSize: 14, color: COLORS.textMuted, marginTop: 20, }
});

export default HomeScreen;