// --- START OF FILE ActionButton.js ---

// components/ActionButton.js
import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, View } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

const ActionButton = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    style,
    textStyle,
    type = 'primary', // primary, secondary, danger, success, warning, outline, transparent
    iconLeft = null,
    iconRight = null,
}) => {
    // Renk temaları (Değişiklik yok)
    const theme = {
        primary: { bg: COLORS.accent, text: COLORS.white, border: COLORS.transparent },
        secondary: { bg: COLORS.textMuted, text: COLORS.textPrimary, border: 'rgba(255,255,255,0.1)' },
        danger: { bg: COLORS.negative, text: COLORS.white, border: COLORS.transparent },
        success: { bg: COLORS.positive, text: COLORS.white, border: COLORS.transparent },
        warning: { bg: COLORS.warning, text: COLORS.white, border: COLORS.transparent },
        outline: { bg: COLORS.transparent, text: COLORS.textPrimary, border: COLORS.textSecondary },
        transparent: { bg: COLORS.transparent, text: COLORS.accentLight, border: COLORS.transparent },
    };
    const currentTheme = theme[type] || theme.primary;

    const isDisabledOrLoading = disabled || loading;

    // Duruma göre son renkler (Değişiklik yok)
    const finalBgColor = isDisabledOrLoading ? COLORS.accentDisabled : currentTheme.bg;
    const finalTextColor = isDisabledOrLoading ? COLORS.textSecondary : currentTheme.text;
    const finalBorderColor = isDisabledOrLoading ? 'rgba(113, 128, 150, 0.3)' : currentTheme.border;

    const handlePress = () => {
        if (!isDisabledOrLoading && onPress && typeof onPress === 'function') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Biraz daha belirgin haptic
            onPress();
        }
    };

    const iconSize = SIZES.iconSize * 0.9; // İkon boyutunu değişkene al

    return (
        <Pressable onPress={handlePress} disabled={isDisabledOrLoading} style={style}>
            {({ pressed }) => (
                <MotiView
                    style={[
                        styles.buttonBase,
                        {
                            backgroundColor: finalBgColor,
                            borderColor: finalBorderColor,
                            // Şeffaf ve outline için border rengi ayarı
                            borderWidth: (type === 'outline' || type === 'transparent') ? 1.5 : 0,
                        },
                        // Gölge (Değişiklik yok)
                        !isDisabledOrLoading && type !== 'transparent' && styles.shadow,
                    ]}
                    animate={{
                        // Sadece aktifken ve basılıyken hafifçe küçült ve içeri bastır
                        scale: pressed && !isDisabledOrLoading ? 0.97 : 1,
                        opacity: isDisabledOrLoading ? 0.65 : 1, // Devre dışıysa biraz daha soluk
                    }}
                    transition={{ type: 'timing', duration: 150 }} // Biraz daha yumuşak animasyon
                >
                    {loading ? (
                        <ActivityIndicator size={SIZES.iconSizeSmall} color={finalTextColor} />
                    ) : (
                        // İçerik (İkon ve metin)
                        <View style={styles.contentWrapper}>
                            {iconLeft && (
                                <Ionicons
                                    name={iconLeft}
                                    size={iconSize}
                                    color={finalTextColor}
                                    style={styles.iconLeft}
                                />
                            )}
                            <Text
                                style={[
                                    styles.buttonTextBase,
                                    { color: finalTextColor },
                                    // Outline ve transparent tip için text rengi ayarı
                                    (type === 'outline' || type === 'transparent') && { color: currentTheme.text },
                                    textStyle, // Harici stil override
                                ]}
                                numberOfLines={1}
                                adjustsFontSizeToFit // Uzun yazılar sığsın
                                minimumFontScale={0.8} // Min font ölçeği
                            >
                                {title}
                            </Text>
                            {iconRight && (
                                <Ionicons
                                    name={iconRight}
                                    size={iconSize}
                                    color={finalTextColor}
                                    style={styles.iconRight}
                                />
                            )}
                        </View>
                    )}
                </MotiView>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    buttonBase: {
        width: '100%', // Genellikle parent'tan alır veya style prop'u ile ayarlanır
        paddingVertical: SIZES.paddingMedium, // İç dikey boşluk arttı
        paddingHorizontal: SIZES.padding * 1.5, // İç yatay boşluk arttı
        borderRadius: SIZES.buttonRadius,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50, // Minimum yükseklik
        marginVertical: SIZES.marginSmall, // Butonlar arası boşluk
        // borderWidth: 1.5, // Tipe göre dinamik olarak ayarlanacak
        overflow: 'hidden',
    },
    shadow: {
        shadowColor: COLORS.darkShadow,
        shadowOffset: { width: 0, height: 3 }, // Gölge biraz daha belirgin
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    contentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonTextBase: {
        fontSize: SIZES.body,
        fontFamily: SIZES.bold, // Kalın font
        textAlign: 'center',
        marginHorizontal: SIZES.base, // Metin ile ikon arası boşluk
    },
    iconLeft: {
        marginRight: SIZES.base,
    },
    iconRight: {
        marginLeft: SIZES.base,
    },
});

export default ActionButton;
// --- END OF FILE ActionButton.js ---
