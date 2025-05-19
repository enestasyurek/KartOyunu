// --- START OF FILE components/Card.js (No Animations) ---
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
// Ionicons might still be needed if other parts of your app use it, but not for the card back pattern if image is full.
// import { Ionicons } from '@expo/vector-icons'; 

// --- CARD IMAGES ---
const blueCardImage = require('../assets/cards/blue_card.png');
const redCardImage = require('../assets/cards/red_card.png');

// --- THEMES ---
const CARD_THEME = {
    kapalı: { bg: ['#6E7A8A', '#4A5568'], text: COLORS.white, border: 'rgba(255, 255, 255, 0.1)' },
    mavi: { bg: [COLORS.accent, COLORS.accentDark], text: COLORS.white, border: COLORS.accentLight },
    kırmızı: { bg: [COLORS.negative, COLORS.negativeDark], text: COLORS.white, border: COLORS.negativeLight },
    siyah: { bg: ['#3A475A', '#1A202C'], text: COLORS.textSecondary, border: '#5A677A' },
    custom: { bg: [COLORS.warning, COLORS.warningDark], text: COLORS.black, border: COLORS.warningLight },
};

// --- SIZING ---
const CARD_WIDTH_PERCENTAGE = 0.78;
export const CARD_MAX_WIDTH = SIZES.cardMaxWidth * 1.05;
export const CARD_ASPECT_RATIO = 1.5;

// --- CARD COMPONENT (No Animations) ---
const Card = ({ type = 'kapalı', text = '', isVisible = false, style, faceDownContextType = 'blue' }) => {
    const { width: windowWidth } = useWindowDimensions();

    // --- DERIVED VALUES ---
    const { effectiveType, theme, showFront } = useMemo(() => {
        let effType = type;
        const safeText = String(text ?? '');
        if (effType === 'kırmızı' && safeText.startsWith("ÖZEL:")) { effType = 'custom'; }
        else if (!CARD_THEME[effType]) { effType = 'kapalı'; }
        const thm = CARD_THEME[effType] || CARD_THEME.kapalı;
        const show = isVisible && effType !== 'kapalı';
        return { effectiveType: effType, theme: thm, showFront: show };
    }, [type, text, isVisible]);

    const { dynamicCardWidth, dynamicCardHeight } = useMemo(() => {
        const width = Math.min(windowWidth * CARD_WIDTH_PERCENTAGE, CARD_MAX_WIDTH);
        const height = width * CARD_ASPECT_RATIO;
        return { dynamicCardWidth: width, dynamicCardHeight: height };
    }, [windowWidth]);

    if (!isVisible) {
        return null;
    }

    const outerContainerStyle = [
        styles.cardOuterContainer,
        { width: dynamicCardWidth, height: dynamicCardHeight },
        style,
        { pointerEvents: isVisible ? 'auto' : 'none' }
    ];

    if (!showFront) { // Render card back with an image
        const backImageSource = faceDownContextType === 'red' ? redCardImage : blueCardImage;
        const backTheme = CARD_THEME.kapalı; // Still used for border color

        return (
            <View style={outerContainerStyle}>
                <ImageBackground
                    source={backImageSource}
                    style={[styles.cardInnerContainer, { borderColor: backTheme.border }]}
                    imageStyle={styles.cardBackgroundImage}
                >
                    {/* Joker icon and Kart Oyunu text removed from here */}
                </ImageBackground>
            </View>
        );
    } else { // Render card front with LinearGradient
        const displayTheme = theme; // Already derived for the front face
        return (
            <View style={outerContainerStyle}>
                <LinearGradient
                    colors={displayTheme.bg}
                    style={[styles.cardInnerContainer, { borderColor: displayTheme.border }]}
                >
                    <Text style={[styles.cardText, { color: displayTheme.text }]} selectable={true}>
                        {String(text ?? '')}
                    </Text>
                </LinearGradient>
            </View>
        );
    }
};

// --- STYLES ---
const styles = StyleSheet.create({
    cardOuterContainer: {
        alignSelf: 'center',
        shadowColor: COLORS.darkShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 7,
        borderRadius: SIZES.cardRadius,
    },
    cardInnerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SIZES.padding,
        borderWidth: 1,
        borderColor: 'transparent',
        borderRadius: SIZES.cardRadius,
        overflow: 'hidden',
        position: 'relative',
    },
    cardBackgroundImage: {
        borderRadius: SIZES.cardRadius,
        resizeMode: 'cover',
    },
    cardText: {
        fontSize: SIZES.body,
        fontFamily: SIZES.regular,
        textAlign: 'center',
        lineHeight: SIZES.body * 1.5,
    },
    closedCardText: {
        fontSize: SIZES.width * 0.15,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        opacity: 0.9, // Keep opacity for the emoji itself if needed, but ensure color is contrasty
        zIndex: 2,
    },
    closedCardBrand: {
        position: 'absolute',
        bottom: SIZES.paddingSmall,
        fontSize: SIZES.small,
        fontFamily: SIZES.bold,
        // Color is now set inline above for better contrast control on image
        letterSpacing: 0.5,
        zIndex: 2,
    },
    // backPattern is no longer needed if images are used for the back
    /* backPattern: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.6,
        zIndex: 1,
    }, */
});

export default Card;
// --- END OF FILE components/Card.js ---