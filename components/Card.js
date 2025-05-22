// --- START OF FILE components/Card.js (No Animations) ---
import React from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
// Ionicons might still be needed if other parts of your app use it, but not for the card back pattern if image is full.
// import { Ionicons } from '@expo/vector-icons'; 

// --- CARD IMAGES ---
const blueCardImage = require('../assets/cards/blue_card.png');
const redCardImage = require('../assets/cards/red_card.png');

// --- THEMES ---
const CARD_THEMES = {
    kapalı: { bg: ['#6E7A8A', '#4A5568'], text: COLORS.white },
    mavi: { bg: [COLORS.accent, COLORS.accentDark], text: COLORS.white },
    kırmızı: { bg: [COLORS.negative, COLORS.negativeDark], text: COLORS.white },
    siyah: { bg: ['#3A475A', '#1A202C'], text: COLORS.textSecondary },
    custom: { bg: [COLORS.warning, COLORS.warningDark], text: COLORS.black },
};

// --- SIZING --- Standard playing card aspect ratio is 2.5" × 3.5" (1:1.4)
const CARD_RATIO = 0.71; // Standard playing card ratio (width:height)

// --- CARD COMPONENT (No Animations) ---
const Card = ({ type = 'kapalı', text = '', isVisible = false, faceDownContextType = 'blue', style }) => {
    const { width: screenWidth } = useWindowDimensions();
    
    // If not visible, return null
    if (!isVisible) return null;
    
    // Calculate card dimensions
    const cardWidth = Math.min(screenWidth * 0.75, 300);
    const cardHeight = cardWidth / CARD_RATIO;
    
    // Force showing card back when type is 'kapalı'
    const isCardBack = type === 'kapalı';
    
    // Get image source for card back
    const cardBackSource = faceDownContextType === 'red' ? redCardImage : blueCardImage;
    
    return (
        <View style={[
            styles.cardWrapper, 
            { width: cardWidth, height: cardHeight },
            style
        ]}>
            {isCardBack ? (
                // CARD BACK
                <View style={styles.cardBack}>
                    <Image
                        source={cardBackSource}
                        style={{
                            width: cardWidth - 4, // Account for border
                            height: cardHeight - 4,
                            borderRadius: 10
                        }}
                        resizeMode="stretch"
                    />
                </View>
            ) : (
                // CARD FRONT
                <LinearGradient 
                    colors={CARD_THEMES[type]?.bg || CARD_THEMES.kapalı.bg}
                    style={styles.cardFront}
                >
                    <Text style={[
                        styles.cardText, 
                        { color: CARD_THEMES[type]?.text || CARD_THEMES.kapalı.text }
                    ]}>
                        {String(text)}
                    </Text>
                </LinearGradient>
            )}
        </View>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    cardWrapper: {
        alignSelf: 'center',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        backgroundColor: '#000', // Black background to make any issues visible
    },
    cardBack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#222', // Dark background for the back
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 10,
    },
    cardFront: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    cardText: {
        fontSize: SIZES.body,
        fontFamily: SIZES.regular,
        textAlign: 'center',
    }
});

export default Card;
// --- END OF FILE components/Card.js ---