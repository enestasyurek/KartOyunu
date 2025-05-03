// --- START OF FILE components/Card.js (Clean, Simple) ---
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';

// --- THEMES ---
const CARD_THEME = {
    kapalı: { bg: ['#6E7A8A', '#4A5568'], text: COLORS.white, border: 'rgba(255, 255, 255, 0.1)' },
    mavi: { bg: [COLORS.accent, COLORS.accentDark], text: COLORS.white, border: COLORS.accentLight },
    kırmızı: { bg: [COLORS.negative, COLORS.negativeDark], text: COLORS.white, border: COLORS.negativeLight },
    siyah: { bg: ['#3A475A', '#1A202C'], text: COLORS.textSecondary, border: '#5A677A' },
    custom: { bg: [COLORS.warning, COLORS.warningDark], text: COLORS.black, border: COLORS.warningLight },
};

// --- SIZING ---
const CARD_WIDTH_PERCENTAGE = 0.75;
export const CARD_MAX_WIDTH = SIZES.cardMaxWidth;
export const CARD_ASPECT_RATIO = 1.5;

// --- CARD COMPONENT (Simplified) ---
const Card = ({ type = 'kapalı', text = '', isVisible = false, style }) => {
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

    // If not visible, render nothing to avoid layout shifts or opacity issues
    if (!isVisible) {
        return null;
    }

    // Determine which theme to use based on whether front or back is shown
    const displayTheme = showFront ? theme : CARD_THEME.kapalı;

    return (
        // Basic View container
        <View
            style={[
                styles.cardOuterContainer,
                { width: dynamicCardWidth, height: dynamicCardHeight },
                style, // Allow external styles
                // Apply pointerEvents directly to style
                { pointerEvents: isVisible ? 'auto' : 'none' }
            ]}
        >
            <LinearGradient
                colors={displayTheme.bg}
                style={[styles.cardInnerContainer, { borderColor: displayTheme.border }]}
            >
                {showFront ? (
                    // Front Content
                    <Text style={[styles.cardText, { color: displayTheme.text }]} selectable={true}>
                        {String(text ?? '')}
                    </Text>
                ) : (
                    // Back Content
                    <>
                        <Text style={[styles.closedCardText, { color: displayTheme.text }]}>🃏</Text>
                        <Text style={styles.closedCardBrand}>Kart Oyunu</Text>
                    </>
                )}
            </LinearGradient>
        </View>
    );
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
        // Add a fallback background color in case gradient fails? Optional.
        // backgroundColor: CARD_THEME.kapalı.bg[1],
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
    cardText: {
        fontSize: SIZES.body,
        fontFamily: SIZES.regular,
        textAlign: 'center',
        lineHeight: SIZES.body * 1.5,
    },
    closedCardText: {
        fontSize: SIZES.width * 0.15,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        opacity: 0.9,
    },
    closedCardBrand: {
        position: 'absolute',
        bottom: SIZES.paddingSmall,
        fontSize: SIZES.small,
        fontFamily: SIZES.bold,
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 0.5,
    },
});

export default Card;
// --- END OF FILE components/Card.js ---