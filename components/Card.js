// --- START OF FILE components/Card.js (UI/UX Enhanced, Still No Animations) ---
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';

// --- CARD BACK IMAGES ---
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

// --- SIZING --- Standard playing card aspect ratio is 2.5" × 3.5" (≈1:1.4)
const CARD_RATIO = 0.71; // width : height

/**
 * Card
 * @param {object} props - Component props
 * @param {string} props.type - Card face type ("kapalı" shows face-down)
 * @param {string|number} props.text - Text shown on the card face
 * @param {boolean} props.isVisible - Whether the card should render at all
 * @param {string} props.faceDownContextType - "blue" | "red" (image for the back)
 * @param {object} props.style - Additional style overrides for wrapper
 * @param {function} props.onPress - Optional press handler
 * @param {boolean} props.disabled - Disable press interaction & lower opacity
 * @param {string} props.accessibilityLabel - Custom accessibility label
 * @param {string} props.testID - ID used for testing
 */
const Card = ({
  type = 'kapalı',
  text = '',
  isVisible = false,
  faceDownContextType = 'blue',
  style,
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
}) => {
  const { width: screenWidth } = useWindowDimensions();

  // Prevent unnecessary re-calculations on every rerender
  const cardWidth = useMemo(() => Math.min(screenWidth * 0.75, 300), [screenWidth]);
  const cardHeight = useMemo(() => cardWidth / CARD_RATIO, [cardWidth]);

  if (!isVisible) return null; // Early return saves work

  const isCardBack = type === 'kapalı';
  const cardBackSource = faceDownContextType === 'red' ? redCardImage : blueCardImage;

  // --- INTERNAL RENDERERS ---
  const renderCardFront = () => (
    <LinearGradient
      colors={CARD_THEMES[type]?.bg || CARD_THEMES.kapalı.bg}
      style={styles.cardFront}
    >
      <Text
        style={[styles.cardText, { color: CARD_THEMES[type]?.text || CARD_THEMES.kapalı.text }]}
        numberOfLines={3}
        adjustsFontSizeToFit
      >
        {String(text)}
      </Text>
    </LinearGradient>
  );

  const renderCardBack = () => (
    <View style={styles.cardBackInner}>
      <Image
        source={cardBackSource}
        style={{
          width: cardWidth - 4, // Account for the border thickness
          height: cardHeight - 4,
          borderRadius: 10,
        }}
        resizeMode="stretch"
      />
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.cardWrapper,
        { width: cardWidth, height: cardHeight, opacity: pressed ? 0.85 : 1 },
        disabled && styles.disabled,
        style,
      ]}
      android_ripple={{ color: '#ffffff20', borderless: true }}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel || (isCardBack ? 'Yüzü kapalı kart' : `Kart: ${String(text)}`)
      }
      testID={testID}
    >
      {isCardBack ? renderCardBack() : renderCardFront()}
    </Pressable>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  cardWrapper: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5, // Android shadow

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,

    backgroundColor: '#000', // Helps reveal layout issues during dev
  },
  disabled: {
    opacity: 0.4,
  },
  cardBackInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
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
  },
});

export default Card;
// --- END OF FILE components/Card.js ---