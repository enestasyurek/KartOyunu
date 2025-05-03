// --- START OF FILE components/Card.js ---
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti'; // Import AnimatePresence
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// --- THEMES ---
const CARD_THEME = {
    kapalı: {
        bg: ['#6E7A8A', '#4A5568'], text: COLORS.white, border: 'rgba(255, 255, 255, 0.1)',
    },
    mavi: {
        bg: [COLORS.accent, COLORS.accentDark], text: COLORS.white, border: COLORS.accentLight,
    },
    kırmızı: {
        bg: [COLORS.negative, COLORS.negativeDark], text: COLORS.white, border: COLORS.negativeLight,
    },
    siyah: {
        bg: ['#3A475A', '#1A202C'], text: COLORS.textSecondary, border: '#5A677A',
    },
    custom: {
        bg: [COLORS.warning, COLORS.warningDark], text: COLORS.black, border: COLORS.warningLight,
    },
};

// --- SIZING ---
const CARD_WIDTH_PERCENTAGE = 0.80;
export const CARD_MAX_WIDTH = SIZES.cardMaxWidth * 1.1;
export const CARD_ASPECT_RATIO = 1.45;

// --- CARD COMPONENT ---
const Card = ({ type = 'kapalı', text = '', isVisible = false, style, cardKey }) => {
    const { width: windowWidth } = useWindowDimensions();

    // --- DERIVED VALUES (Memoized) ---
    const { effectiveType, theme, showFront } = useMemo(() => {
        let effType = type;
        const safeText = String(text ?? '');
        if (effType === 'kırmızı' && safeText.startsWith("ÖZEL:")) {
            effType = 'custom';
        } else if (!CARD_THEME[effType]) {
            effType = 'kapalı';
        }
        const thm = CARD_THEME[effType] || CARD_THEME.kapalı;
        // showFront is true only if the card should be visible AND it's not the 'kapalı' type
        const show = isVisible && effType !== 'kapalı';
        return { effectiveType: effType, theme: thm, showFront: show };
    }, [type, text, isVisible]);

    const { dynamicCardWidth, dynamicCardHeight } = useMemo(() => {
        const width = Math.min(windowWidth * CARD_WIDTH_PERCENTAGE, CARD_MAX_WIDTH);
        const height = width * CARD_ASPECT_RATIO;
        return { dynamicCardWidth: width, dynamicCardHeight: height };
    }, [windowWidth]);

    // --- ANIMATION CONFIG ---
    const flipTransition = useMemo(() => ({
        type: 'spring', damping: 18, stiffness: 150,
    }), []);
    const appearTransition = useMemo(() => ({
        type: 'timing', duration: 300,
    }), []);

    // Unique key for the outer MotiView to handle appear/disappear
    const outerKey = cardKey ? `outer-${cardKey}-${isVisible}` : `outer-${effectiveType}-${text}-${isVisible}`;

    return (
        // Outer container for appear/disappear animation (opacity/scale)
        <MotiView
            key={outerKey}
            style={styles.perspectiveContainer}
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.85 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={appearTransition}
            pointerEvents={isVisible ? 'auto' : 'none'}
        >
            {/* Inner container handles the 3D flip */}
            <MotiView
                style={[
                    styles.cardOuterContainer,
                    { width: dynamicCardWidth, height: dynamicCardHeight },
                    style,
                ]}
                // Animate rotation based on showFront state
                animate={{ rotateY: showFront ? '0deg' : '180deg' }}
                transition={flipTransition}
            >
                {/* Use AnimatePresence to manage mounting/unmounting of faces */}
                <AnimatePresence exitBeforeEnter>
                    {showFront ? (
                        // Front Face
                        <MotiView
                            key="front"
                            style={[StyleSheet.absoluteFillObject, styles.cardFace, styles.cardFront]}
                            from={{ rotateY: '-180deg' }} // Start flipped relative to parent
                            animate={{ rotateY: '0deg' }}
                            exit={{ rotateY: '-180deg' }}
                            transition={flipTransition} // Use same flip transition
                        >
                            <LinearGradient colors={theme.bg} style={[styles.cardInnerContainer, { borderColor: theme.border }]}>
                                <Text style={[styles.cardText, { color: theme.text }]} selectable={true}>
                                    {String(text ?? '')}
                                </Text>
                            </LinearGradient>
                        </MotiView>
                    ) : (
                        // Back Face
                        <MotiView
                            key="back"
                            style={[StyleSheet.absoluteFillObject, styles.cardFace, styles.cardBack]}
                            from={{ rotateY: '0deg' }} // Start facing forward relative to parent
                            animate={{ rotateY: '0deg' }} // Stays at 0deg relative to parent
                            exit={{ rotateY: '180deg' }}
                            transition={flipTransition} // Use same flip transition
                        >
                            <LinearGradient colors={CARD_THEME.kapalı.bg} style={styles.cardInnerContainer}>
                                <View style={styles.backPattern}>
                                    <Ionicons name="layers-outline" size={dynamicCardWidth * 0.4} color="rgba(255, 255, 255, 0.05)" />
                                </View>
                                <Text style={[styles.closedCardText, { color: CARD_THEME.kapalı.text }]}>🃏</Text>
                                <Text style={styles.closedCardBrand}>Kart Oyunu</Text>
                            </LinearGradient>
                        </MotiView>
                    )}
                </AnimatePresence>
            </MotiView>
        </MotiView>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    perspectiveContainer: {
        perspective: 1500,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardOuterContainer: {
        // This container now ONLY rotates. Shadows applied to faces if needed.
        backgroundColor: 'transparent',
        position: 'relative',
        // Preserve 3D space for children during rotation
        transformStyle: 'preserve-3d',
    },
    cardFace: {
        position: 'absolute', // Position faces absolutely
        top: 0, left: 0, right: 0, bottom: 0,
        backfaceVisibility: 'hidden', // Hide the back
        borderRadius: SIZES.cardRadius * 1.1,
        overflow: 'hidden',
        // Apply shadows to the faces themselves if desired
        shadowColor: COLORS.darkShadow,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 7,
        elevation: 8,
    },
    cardFront: {
        // No specific transform needed here, Moti handles rotation
    },
    cardBack: {
        // No specific transform needed here, Moti handles rotation
    },
    cardInnerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SIZES.padding * 1.3,
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: SIZES.cardRadius * 1.1,
    },
    cardText: {
        fontSize: SIZES.body * 1.25,
        fontFamily: SIZES.regular,
        textAlign: 'center',
        lineHeight: SIZES.lineHeightTitle * 1.15,
    },
    closedCardText: {
        fontSize: SIZES.width * 0.18,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        opacity: 0.95,
        lineHeight: SIZES.width * 0.18 * 1.1,
        zIndex: 2,
    },
    closedCardBrand: {
        position: 'absolute',
        bottom: SIZES.padding * 1.1,
        fontSize: SIZES.caption * 1.1,
        fontFamily: SIZES.bold,
        color: 'rgba(255, 255, 255, 0.5)',
        opacity: 0.7,
        letterSpacing: 1,
        zIndex: 2,
        // Text needs to be flipped back if its parent rotates
        transform: [{ rotateY: '180deg' }],
    },
    backPattern: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
        zIndex: 1,
        // Pattern needs to be flipped back if its parent rotates
        transform: [{ rotateY: '180deg' }],
    },
});

export default Card;
// --- END OF FILE components/Card.js ---