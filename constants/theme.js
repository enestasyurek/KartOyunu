import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Renkler (Genellikle iyi durumda, birkaç küçük ayarlama/ekleme)
export const COLORS = {
    // Ana Tema Renkleri
    backgroundGradient: ['#4a5568', '#2d3748'], // Geçişli Arka Plan
    textPrimary: '#f7fafc', // Ana Metin (Beyaza Yakın)
    textSecondary: '#a0aec0', // İkincil Metin (Açık Gri)
    textMuted: '#718096', // Soluk Metin (Gri)
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',

    // Vurgu Renkleri
    accent: '#4299e1', // Ana Vurgu (Mavi)
    accentLight: '#63b3ed', // Açık Mavi
    accentDark: '#2b6cb0', // Koyu Mavi
    accentDisabled: '#5a6678', // Devre Dışı Vurgu Grisi

    // Durum Renkleri
    positive: '#48bb78', // Başarılı (Yeşil)
    positiveLight: '#68d391', // Açık Yeşil
    negative: '#f56565', // Hata/Olumsuz (Kırmızı)
    negativeLight: '#fc8181', // Açık Kırmızı
    warning: '#ed8936', // Uyarı (Turuncu)
    warningLight: '#f6ad55', // Açık Turuncu

    // Bileşen Özel Renkleri
    cardPlaceholderBg: 'rgba(255, 255, 255, 0.06)', // Kapalı Kart Arka Plan
    cardPlaceholderBorder: 'rgba(255, 255, 255, 0.12)', // Kapalı Kart Kenarlık
    scoreboardBg: 'rgba(0, 0, 0, 0.3)', // Skor Tablosu Arka Planı
    activePlayerBg: 'rgba(66, 153, 225, 0.2)', // Aktif Oyuncu Vurgu Arka Planı (Daha hafif)
    activePlayerHighlight: '#63b3ed', // Aktif Oyuncu Kenar Vurgusu (Açık Mavi)
    activePlayerText: '#ffffff', // Aktif Oyuncu Metni
    inputBg: 'rgba(255, 255, 255, 0.08)', // Input Arka Planı
    inputBorder: 'rgba(255, 255, 255, 0.2)', // Input Kenarlığı
    inputBorderFocused: '#63b3ed', // Odaklanmış Input Kenarlığı (Açık Mavi)
    inputText: '#f7fafc', // Input Metni
    inputPlaceholder: '#8a9aaf', // Input Placeholder Rengi (Biraz daha açık)

    // Gölgeler
    shadow: 'rgba(0, 0, 0, 0.15)', // Normal Gölge
    darkShadow: 'rgba(0, 0, 0, 0.35)', // Daha Koyu Gölge
};

// Boyutlar (Ekran boyutuna göre temel birim ayarı iyi bir yaklaşım)
const baseUnit = SCREEN_WIDTH < 380 ? 7 : 8; // Küçük ekranlar için biraz daha küçük birim

export const SIZES = {
    // Temel Birimler   
    base: baseUnit,
    fontScaleFactor: 1.0, // İleride fontları global olarak ölçeklendirmek için

    // Padding
    paddingSmall: baseUnit,
    padding: baseUnit * 2,
    paddingMedium: baseUnit * 2.5, // Ayarlandı
    paddingLarge: baseUnit * 3.5, // Ayarlandı

    // Margin
    marginSmall: baseUnit,
    margin: baseUnit * 2,
    marginMedium: baseUnit * 2.5, // Ayarlandı
    marginLarge: baseUnit * 3.5, // Ayarlandı

    // Font Boyutları (baseUnit * 2 * fontScaleFactor gibi düşünülebilir)
    h1: baseUnit * 4 * 1.0,
    h2: baseUnit * 3.5 * 1.0,
    h3: baseUnit * 3 * 1.0,
    h4: baseUnit * 2.5 * 1.0,
    title: baseUnit * 2.25 * 1.0,
    body: baseUnit * 2 * 1.0,
    caption: baseUnit * 1.75 * 1.0,
    small: baseUnit * 1.5 * 1.0,

    // Satır Yükseklikleri
    lineHeightBase: baseUnit * 2.8,
    lineHeightTitle: baseUnit * 3.2, // Ayarlandı
    lineHeightHeading: baseUnit * 4.5, // Ayarlandı

    // Font Aileleri (Gerçek dosya adları assets/fonts içinde bulunmalı)
    regular: 'Oswald-Regular', // Yüklendiğinden emin ol
    bold: 'Oswald-Bold',       // Eğer Oswald-Bold.ttf varsa ve yüklendiyse.
    // !!! Alternatif: Eğer tek Oswald-Regular varsa ve bold kullanmak isterseniz:
    // regular: 'Oswald-Regular',
    // bold: 'Oswald-Regular', // Aynı fontu kullanıp component içinde fontWeight: 'bold' ekleyin

    // Köşe Yarıçapları
    buttonRadius: 35, // Daha belirgin yuvarlaklık
    cardRadius: baseUnit * 2.5, // Daha yuvarlak kartlar
    inputRadius: baseUnit * 1.5, // Daha yuvarlak inputlar

    // İkon Boyutları
    iconSizeSmall: baseUnit * 2.5,
    iconSize: baseUnit * 3,
    iconSizeLarge: baseUnit * 4,

    // Ekran ve İçerik Boyutları
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    contentMaxWidth: 600, // Biraz daha geniş max içerik alanı
    buttonMaxWidth: 400, // Butonlar için max genişlik
    cardMaxWidth: 360, // Kartlar için max genişlik (artırıldı)
};

export const appTheme = { COLORS, SIZES };
export default appTheme;