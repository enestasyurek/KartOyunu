// --- START OF FILE HowToPlayScreen.js ---

// screens/HowToPlayScreen.js
import React from 'react';
// TouchableOpacity import edildi
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
// ActionButton burada kullanılmıyor - import kaldırıldı
import { Ionicons } from '@expo/vector-icons'; // İkonlar için

const HowToPlayScreen = ({ navigation }) => {
    return (
        <LinearGradient colors={COLORS.backgroundGradient} style={styles.flexFill}>
             <SafeAreaView style={styles.flexFill}>
                 <View style={styles.container}>
                      <View style={styles.header}>
                          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                               <Ionicons name="chevron-back-outline" size={SIZES.iconSizeLarge} color={COLORS.textPrimary} />
                           </TouchableOpacity>
                          <Text style={styles.title}>Nasıl Oynanır?</Text>
                          <View style={styles.backButton} />
                      </View>

                     {/* --- Kural İçeriklerini <Text> ile sar --- */}
                     <ScrollView style={styles.rulesScroll} contentContainerStyle={styles.rulesContent} showsVerticalScrollIndicator={false}>
                         <RuleSection icon="flag-outline" title="Amaç">
                             {/* TÜM METNİ BİR TEXT İÇİNE AL */}
                            <Text style={styles.paragraph}>
                                Oyuncular sırayla kart çekerek görevleri tamamlar ve puan toplar. <Text style={styles.points}>20 Puana</Text> ilk ulaşan oyuncu oyunu kazanır! Oyun sonunda en düşük puana sahip olan oyuncu ise bir <Text style={styles.blackText}>Siyah Kart</Text> (ceza görevi) çeker.
                            </Text>
                         </RuleSection>

                          <RuleSection icon="settings-outline" title="Başlangıç">
                            {/* HER MADDEYİ BİR TEXT İÇİNE AL */}
                            <Text style={styles.listItem}>
                                • 1. Oyuncu sayısı (2-6) ve isimleri girilir. İsteğe bağlı <Text style={styles.customText}>Özel Görevler</Text> ekleyebilirsiniz.
                            </Text>
                             <Text style={styles.listItem}>
                                • 2. Her oyuncuya gizli bir <Text style={styles.blueText}>Mavi Kart</Text> verilir.
                             </Text>
                             <Text style={styles.listItem}>
                                • 3. Oyun başlarken herkes sırayla kendi Mavi Kartına bakar ve kapatır.
                              </Text>
                          </RuleSection>

                          <RuleSection icon="game-controller-outline" title="Oyun Akışı">
                              {/* TÜM METİNLER TEXT İÇİNDE OLMALI */}
                             <Text style={styles.paragraph}><Text style={styles.boldText}>Kart Çekme:</Text> Sırası gelen oyuncu bir <Text style={styles.redText}>Kırmızı Kart</Text> çeker. Bu kart standart bir görev veya sizin eklediğiniz özel bir görev olabilir.</Text>
                             <Text style={styles.paragraph}><Text style={styles.boldText}>Oylanabilir Görevler:</Text> Bazı görevlerin yanında <Text style={styles.votableText}>OYLANABİLİR</Text> yazar. Bu görevlerin başarısı, diğer oyuncuların vereceği Evet/Hayır oylarıyla (salt çoğunluk 'Evet') belirlenir.</Text>
                             <Text style={styles.paragraph}><Text style={styles.boldText}>Karar Zamanı:</Text> Kart çekildikten sonra oyuncunun 2 seçeneği vardır:</Text>

                             <SubRule icon="checkmark-circle-outline" title='"Ben Yaparım"'>
                                {/* SubRule içeriğini de Text içine al */}
                                <Text style={styles.paragraph}>
                                    Oyuncu, çekilen <Text style={styles.redText}>Kırmızı Kart</Text> görevini kendisi yapar. Oylanabilir ise oylama yapılır. Başarılı olursa <Text style={styles.points}>+5 Puan</Text> alır. Sıra sonraki oyuncuya geçer.
                                </Text>
                             </SubRule>

                             <SubRule icon="people-outline" title='"O Yapsın"'>
                                  {/* Her maddeyi ayrı Text içine al */}
                                  <Text style={styles.listItem}>
                                      1. Oyuncu, görevi yapması için başka birini (<Text style={styles.boldText}>Hedef Oyuncu</Text>) seçer.
                                  </Text>
                                 <Text style={styles.listItem}>
                                      2. Siz (kartı çeken), Hedef Oyuncu'nun <Text style={styles.blueText}>Mavi Kartındaki</Text> görevi yaparsınız. Başarılı olursa <Text style={styles.points}>+10 Puan</Text> kazanırsınız.
                                  </Text>
                                  <Text style={styles.listItem}>
                                      3. Hedef Oyuncu, ortadaki asıl <Text style={styles.redText}>Kırmızı Kart</Text> görevini yapar. Oylanabilir ise oylanır. Başarılı olursa <Text style={styles.points}>+5 Puan</Text> alır.
                                  </Text>
                                  <Text style={styles.listItem}>
                                      4. Hedef Oyuncu, Kırmızı Kart görevini (oylanabilirse oylama sonucuyla) başarıyla tamamlarsa, desteden yeni bir gizli <Text style={styles.blueText}>Mavi Kart</Text> çeker.
                                  </Text>
                                  <Text style={styles.listItem}>
                                      5. Sıra, görevi ilk devreden oyuncudan <Text style={styles.boldText}>sonraki</Text> oyuncuya geçer.
                                  </Text>
                              </SubRule>
                          </RuleSection>

                         <RuleSection icon="trophy-outline" title="Oyun Sonu">
                             <Text style={styles.listItem}>
                                • Bir oyuncu <Text style={styles.points}>20 Puana</Text> ulaştığında oyun biter.
                              </Text>
                              <Text style={styles.listItem}>
                                • En düşük puanlı oyuncu rastgele bir <Text style={styles.blackText}>Siyah Kart</Text> çeker ve final görevini yapar.
                              </Text>
                              <Text style={styles.listItem}>
                                • Sonuç ekranında skorları görebilir, tekrar oynamayı veya yeni oyun kurmayı seçebilirsiniz.
                              </Text>
                          </RuleSection>

                          <RuleSection icon="color-palette-outline" title="Kart Renkleri">
                              <Text style={styles.listItem}>
                                  <Text style={styles.redText}>KIRMIZI:</Text> Turun ana görevi.
                              </Text>
                              <Text style={styles.listItem}>
                                  <Text style={styles.blueText}>MAVİ:</Text> Gizli, "O Yapsın" durumunda ortaya çıkan görev.
                              </Text>
                             <Text style={styles.listItem}>
                                  <Text style={styles.blackText}>SİYAH:</Text> Oyun sonu ceza/eğlence görevi.
                              </Text>
                             <Text style={styles.listItem}>
                                  <Text style={styles.customText}>(ÖZEL):</Text> Sizin eklediğiniz Kırmızı Kart görevi.
                              </Text>
                          </RuleSection>
                          {/* --- Metinleri <Text> ile Sarma Sonu --- */}

                          <View style={{ height: 40 }} />
                      </ScrollView>
                  </View>
              </SafeAreaView>
        </LinearGradient>
    );
};

// --- Yardımcı Bileşenler (DEĞİŞİKLİK YOK) ---
// Children prop'u artık View içinde değil, Text içinde render ediliyor kullanım yerinde.
const RuleSection = ({ icon, title, children }) => (
    <View style={styles.section}>
         <View style={styles.sectionHeader}>
             <Ionicons name={icon || "information-circle-outline"} size={SIZES.h3} color={COLORS.accentLight} style={styles.sectionIcon}/>
            <Text style={styles.heading}>{title}</Text>
         </View>
        <View style={styles.sectionContent}>
            {/* children doğrudan burada render ediliyor, kullanım yerinde Text ile sarılı */}
            {children}
        </View>
     </View>
);

const SubRule = ({ icon, title, children }) => (
    <View style={styles.subRule}>
         <View style={styles.subRuleHeader}>
            <Ionicons name={icon || "play-forward-outline"} size={SIZES.title * 1.1} color={COLORS.textPrimary} style={styles.subRuleIcon}/>
            <Text style={styles.subHeading}>{title}</Text>
         </View>
         {/* Children kullanım yerinde Text ile sarılı */}
         <View style={styles.subRuleContent}>
            {children}
        </View>
     </View>
);


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
        paddingVertical: SIZES.paddingSmall * 1.5,
        marginBottom: SIZES.margin,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
    },
    backButton: {
         padding: SIZES.paddingSmall,
         minWidth: 45,
         minHeight: 45,
         alignItems: 'center',
         justifyContent: 'center',
    },
    title: {
         fontSize: SIZES.h2 * 1.1,
         fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    rulesScroll: {
        flex: 1,
        width: '100%',
    },
    rulesContent: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.paddingLarge * 2,
    },
    section: {
         marginBottom: SIZES.marginLarge * 1.2,
         backgroundColor: 'rgba(0,0,0,0.1)',
         borderRadius: SIZES.cardRadius * 0.8,
         padding: SIZES.paddingMedium,
    },
    sectionHeader: {
         flexDirection: 'row',
         alignItems: 'center',
         marginBottom: SIZES.margin,
         paddingBottom: SIZES.paddingSmall,
         borderBottomWidth: 1,
         borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionIcon: {
         marginRight: SIZES.marginSmall * 1.2,
    },
     heading: {
        fontSize: SIZES.h3,
        fontFamily: SIZES.bold,
        color: COLORS.textPrimary,
         flex: 1
    },
     sectionContent: {
         marginTop: SIZES.base,
      },
      subRule: {
           marginTop: SIZES.marginMedium,
           marginLeft: SIZES.paddingSmall,
           paddingLeft: SIZES.padding,
           borderLeftWidth: 2,
           borderLeftColor: COLORS.accentDisabled,
      },
     subRuleHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: SIZES.base * 1.2,
     },
     subRuleIcon: {
         marginRight: SIZES.base * 1.2,
         opacity: 0.9
     },
    subHeading: {
         fontSize: SIZES.title * 1.1,
         fontFamily: SIZES.bold,
        color: COLORS.textSecondary,
     },
     subRuleContent: {
         paddingLeft: SIZES.base,
     },
     paragraph: { // Tüm RuleSection içindeki metinler için
        fontSize: SIZES.body,
        color: COLORS.textSecondary,
        lineHeight: SIZES.body * 1.65,
        marginBottom: SIZES.marginSmall, // Paragraflar arası boşluk
     },
     listItem: { // Tüm liste maddeleri için
        fontSize: SIZES.body,
        color: COLORS.textSecondary,
        lineHeight: SIZES.body * 1.65,
        marginBottom: SIZES.base * 1.2, // Maddeler arası boşluk
        paddingLeft: 5, // Madde işareti için hafif boşluk
    },
    boldText: {
         fontFamily: SIZES.bold, color: COLORS.textPrimary
    },
    points: { fontFamily: SIZES.bold, color: COLORS.positiveLight },
     redText: { fontFamily: SIZES.bold, color: COLORS.negativeLight },
     blueText: { fontFamily: SIZES.bold, color: COLORS.accentLight },
     blackText: { fontFamily: SIZES.bold, color: COLORS.warningLight },
    customText: { fontFamily: SIZES.bold, color: COLORS.warningLight },
     votableText: { fontFamily: SIZES.bold, color: COLORS.warning, backgroundColor: 'rgba(237, 137, 54, 0.15)', paddingHorizontal: 4, borderRadius: 4}
});

export default HowToPlayScreen;