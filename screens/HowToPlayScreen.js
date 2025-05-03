// screens/HowToPlayScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import ActionButton from '../components/ActionButton';

const HowToPlayScreen = ({ navigation }) => {
    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Nasıl Oynanır?</Text>
                </View>

                <ScrollView style={styles.rulesScroll} contentContainerStyle={styles.rulesContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.heading}>Amaç</Text>
                    <Text style={styles.paragraph}>Oyuncular sırayla kart çekerek görevleri tamamlar ve puan kazanır. Belirlenen puana (varsayılan 20) ilk ulaşan oyuncu kazanır! En düşük puana sahip oyuncu ise oyun sonunda bir "ceza" görevi (Siyah Kart) yapar.</Text>
                    <Text style={styles.heading}>Başlangıç</Text>
                    <Text style={styles.paragraph}>1. Oyuncu sayısı seçilir ve isimler girilir (İsteğe bağlı özel görevler eklenebilir).{"\n"}2. Her oyuncuya başlangıçta gizli bir <Text style={styles.blueText}>Mavi Kart</Text> verilir.{"\n"}3. Tüm oyuncular sırayla kendi Mavi Kartlarına bakar ve kapatır.</Text>
                    <Text style={styles.heading}>Oyun Turu</Text>
                    <Text style={styles.paragraph}>Sırası gelen oyuncu bir <Text style={styles.redText}>Kırmızı Kart</Text> (veya özel görev) çeker. Görev ekranda belirir.{"\n"}Bazı görevler <Text style={styles.votableText}>Oylanabilir</Text>. Başarısı diğer oyuncuların oyuna göre belirlenir (çoğunluk 'Evet' gerekir).{"\n"}Oyuncunun iki seçeneği vardır:</Text>
                    <Text style={styles.subHeading}>   • "Ben Yaparım":</Text>
                    <Text style={styles.paragraphIndent}>Oyuncu Kırmızı Kart görevini yapar. <Text style={styles.votableText}>Oylanabilir</Text> ise oylanır. Başarılı olursa <Text style={styles.points}>+5 Puan</Text>. Sıra bir sonraki oyuncuya geçer.</Text>
                    <Text style={styles.subHeading}>   • "O Yapsın":</Text>
                    <Text style={styles.paragraphIndent}>1. Başka bir oyuncu seçer.{"\n"}2. Seçen oyuncu (siz), seçilenin <Text style={styles.blueText}>Mavi Kartındaki</Text> görevi yapar. Yaparsa <Text style={styles.points}>+10 Puan</Text>.{"\n"}3. Seçilen oyuncu, ortadaki <Text style={styles.redText}>Kırmızı Kart</Text> görevini yapar. <Text style={styles.votableText}>Oylanabilir</Text> ise oylanır. Başarılı olursa <Text style={styles.points}>+5 Puan</Text>.{"\n"}4. Görevi başarıyla yapan seçilen oyuncu, yeni bir gizli <Text style={styles.blueText}>Mavi Kart</Text> çeker.{"\n"}5. Sıra, görevi devreden (ilk kartı çeken) oyuncunun bir sonrasındaki oyuncuya geçer.</Text>
                    <Text style={styles.heading}>Oyun Sonu</Text>
                    <Text style={styles.paragraph}>Bir oyuncu 20 puana ulaştığında oyun biter.{"\n"}En düşük puanlı oyuncu rastgele bir <Text style={styles.blackText}>Siyah Kart</Text> çeker ve görevi yapar.</Text>
                    <Text style={styles.heading}>Özel Görevler</Text>
                    <Text style={styles.paragraph}>Kurulumda kendi görevlerinizi Kırmızı Kart destesine ekleyebilirsiniz (max 5).</Text>
                    <Text style={styles.heading}>Başarımlar ve İstatistikler</Text>
                    <Text style={styles.paragraph}>Anasayfadan Başarımlar ve Oyun İstatistikleri ekranlarına ulaşabilirsiniz.</Text>
                    <Text style={styles.heading}>Kart Renkleri Özet</Text>
                    <Text style={styles.paragraph}><Text style={styles.redText}>Kırmızı:</Text> Ana görev kartı.{"\n"}<Text style={styles.blueText}>Mavi:</Text> Gizli, devredilebilen görev kartı.{"\n"}<Text style={styles.blackText}>Siyah:</Text> Oyun sonu ceza kartı.</Text>
                </ScrollView>

                <View style={styles.bottomAction}>
                    <ActionButton title="Geri Dön" onPress={() => navigation.goBack()} type="secondary" />
                </View>
            </View>
        </LinearGradient>
    );
};
const styles = StyleSheet.create({
    flexFill: { flex: 1 },
    container: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 15 : 35, },
    header: { width: '100%', alignItems: 'center', marginBottom: 20, },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', },
    rulesScroll: { flex: 1, width: '100%', marginBottom: 15, },
    rulesContent: { paddingBottom: 10, },
    heading: { fontSize: 20, fontWeight: 'bold', color: COLORS.accent, marginTop: 15, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.accentDisabled, paddingBottom: 4, },
    subHeading: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary, marginTop: 10, marginBottom: 5, marginLeft: 10, },
    paragraph: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 23, marginBottom: 10, },
    paragraphIndent: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 23, marginBottom: 10, marginLeft: 25, },
    points: { fontWeight: 'bold', color: COLORS.positive, },
    redText: { color: COLORS.negative, fontWeight: 'bold' },
    blueText: { color: COLORS.accent, fontWeight: 'bold' },
    blackText: { color: COLORS.textMuted, fontWeight: 'bold' },
    votableText: { color: COLORS.warning, fontWeight: 'bold' },
    bottomAction: { width: '90%', maxWidth: 350, justifyContent: 'flex-end', marginTop: 10, },
});
export default HowToPlayScreen;