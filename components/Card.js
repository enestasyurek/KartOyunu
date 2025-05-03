// components/Card.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { MotiView, AnimatePresence } from 'moti'; // Import Moti
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

// --- DÜZELTME: CARD_THEME tanımı eklendi ---
const CARD_THEME = {
    kapalı: {
        bg: [COLORS.textMuted, COLORS.textSecondary], // Gri tonlar
        text: COLORS.textPrimary,
    },
    mavi: {
        bg: [COLORS.accent, '#3182ce'], // Mavi tonları (accent'ten biraz farklı)
        text: COLORS.textPrimary,
    },
    kırmızı: {
        bg: [COLORS.negative, '#c53030'], // Kırmızı tonları (negative'den biraz farklı)
        text: COLORS.textPrimary,
    },
    siyah: {
        bg: ['#2D3748', '#1A202C'], // Çok koyu gri/siyah tonları
        text: COLORS.textSecondary,
    },
    // İhtiyaç olursa diğer kart türleri için de eklenebilir
};
// --- DÜZELTME SONU ---

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.7;
export const CARD_HEIGHT = CARD_WIDTH * 1.45; // Adjusted aspect ratio slightly

const Card = ({ type = 'kapalı', text = '', isVisible = true, style }) => {
    const [isFront, setIsFront] = useState(type !== 'kapalı');
    // theme artık CARD_THEME[type] tanımsız olsa bile CARD_THEME.kapalı'yı bulacak
    const theme = CARD_THEME[type] || CARD_THEME.kapalı;
    const cardText = type === 'kapalı' ? '?' : String(text ?? '');

    // Update face based on type prop change
    useEffect(() => {
        setIsFront(type !== 'kapalı');
    }, [type]);

    return (
        // AnimatePresence for smooth visibility transitions
        <AnimatePresence>
            {isVisible && (
                // Outer container for scaling and opacity
                <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'timing', duration: 250 }}
                    style={[styles.cardOuterContainer, style]}
                >
                    {/* Pressable for potential future interactions */}
                    <Pressable>
                        {/* Inner container handles the 3D flip */}
                        <MotiView
                            style={styles.cardInnerWrapper}
                            animate={{ rotateY: isFront ? '0deg' : '180deg' }}
                            transition={{ type: 'timing', duration: 500 }} // Flip duration
                        >
                            {/* Front Face */}
                            <MotiView style={[styles.cardFace, styles.cardFaceFront]}
                                      // Hide backface when front is visible
                                      animate={{ opacity: isFront ? 1 : 0 }}
                                      transition={{type:'timing', duration: 100, delay: isFront ? 200: 0}} // Fade in/out during flip
                            >
                                {/* --- DÜZELTME: theme.bg artık tanımsız olmamalı --- */}
                                <LinearGradient colors={theme.bg} style={styles.cardInnerContainer}>
                                    <Text style={[styles.cardText, { color: theme.text }]}>
                                        {String(text ?? '')}
                                    </Text>
                                </LinearGradient>
                            </MotiView>

                            {/* Back Face */}
                            <MotiView style={[styles.cardFace, styles.cardFaceBack]}
                                      // Hide backface when back is visible (it's rotated)
                                       animate={{ opacity: !isFront ? 1 : 0 }}
                                       transition={{type:'timing', duration: 100, delay: !isFront ? 200: 0}}
                            >
                                {/* --- DÜZELTME: CARD_THEME.kapalı.bg artık tanımsız olmamalı --- */}
                                <LinearGradient colors={CARD_THEME.kapalı.bg} style={[styles.cardInnerContainer, styles.backFaceContent]}>
                                    <Text style={[styles.cardText, styles.closedCardText, { color: CARD_THEME.kapalı.text }]}>?</Text>
                                </LinearGradient>
                            </MotiView>
                        </MotiView>
                    </Pressable>
                </MotiView>
            )}
        </AnimatePresence>
    );
};

const styles = StyleSheet.create({
    cardOuterContainer: {
        width: CARD_WIDTH, height: CARD_HEIGHT, marginVertical: 15,
        // Perspective for 3D effect (important for flip)
        perspective: 1000,
    },
    cardInnerWrapper: { // Handles the flip transform
        width: '100%', height: '100%',
        transformStyle: 'preserve-3d', // Needed for 3D rotation
    },
    cardFace: {
        width: '100%', height: '100%',
        borderRadius: 18,
        position: 'absolute', // Both faces occupy the same space
        backfaceVisibility: 'hidden', // Hide the face turned away
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
    },
    cardFaceFront: { zIndex: 2 /* Ensure front is initially above */ },
    cardFaceBack: { transform: [{ rotateY: '180deg' }] /* Pre-rotate back face */ },
    cardInnerContainer: { flex: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center', padding: 20, },
    backFaceContent: {},
    cardText: { fontSize: 19, fontWeight: '600', textAlign: 'center', lineHeight: 28, fontFamily: 'Oswald-Regular' /* Use Custom Font */ },
    closedCardText: { fontSize: 90, fontWeight: 'bold', opacity: 0.8, fontFamily: 'Oswald-Bold' /* Use Custom Font */ },
});

export default Card;