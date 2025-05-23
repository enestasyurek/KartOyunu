import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import Constants from 'expo-constants';

// Helper to get status bar height - memoized to avoid recalculation
const getStatusBarHeight = (() => {
  const height = Platform.OS === 'ios' ? 50 : Constants.statusBarHeight || 24;
  return () => height;
})();

// Precompute animation config for performance
const SLIDE_IN_CONFIG = {
  toValue: 0,
  tension: 100,
  friction: 8,
  useNativeDriver: true
};

const FADE_IN_CONFIG = {
  toValue: 1,
  duration: 200,
  useNativeDriver: true
};

const SLIDE_OUT_CONFIG = {
  toValue: -300,
  duration: 200,
  useNativeDriver: true
};

const FADE_OUT_CONFIG = {
  toValue: 0,
  duration: 150,
  useNativeDriver: true
};

const AchievementNotification = ({ achievement, visible, onHide }) => {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  
  useEffect(() => {
    // Clear any existing timer to prevent memory leaks
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (visible && achievement) {
      // Show toast animation - use parallel for performance
      Animated.parallel([
        Animated.spring(slideAnim, SLIDE_IN_CONFIG),
        Animated.timing(opacityAnim, FADE_IN_CONFIG)
      ]).start();

      // Auto hide after 3 seconds
      timerRef.current = setTimeout(() => {
        hideToast();
      }, 3000);
    }
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, achievement]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, SLIDE_OUT_CONFIG),
      Animated.timing(opacityAnim, FADE_OUT_CONFIG)
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!achievement) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
          top: getStatusBarHeight() + 10
        }
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={hideToast}
        style={styles.touchable}
      >
        <View style={styles.content}>
          {/* Side ribbon */}
          <View style={styles.ribbon} />
          
          {/* Trophy Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={SIZES.iconSizeLarge} color={COLORS.warningLight} />
          </View>
          
          {/* Achievement Info */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Başarım Açıldı!</Text>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    maxWidth: 450,
    alignSelf: 'center',
  },
  touchable: {
    width: '100%',
  },
  content: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 48, 70, 0.95)',
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    paddingRight: SIZES.padding * 1.2,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'hidden',
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: '100%',
    backgroundColor: COLORS.warningLight,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.padding,
    marginLeft: SIZES.paddingSmall,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: SIZES.bold,
    fontSize: SIZES.body,
    color: COLORS.white,
    marginBottom: 2,
  },
  achievementName: {
    fontFamily: SIZES.bold,
    fontSize: SIZES.title,
    color: COLORS.warningLight,
    marginBottom: 4,
  },
  description: {
    fontFamily: SIZES.regular,
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    lineHeight: SIZES.lineHeightBase * 0.9,
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(AchievementNotification); 