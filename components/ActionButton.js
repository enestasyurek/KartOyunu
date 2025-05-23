// --- START OF FILE ActionButton.js ---

// components/ActionButton.js
import React, { useCallback, useMemo } from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, View } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

// Pre-define themes for each button type to avoid recreating every render
const BUTTON_THEMES = {
    primary: { bg: COLORS.accent, text: COLORS.white, border: COLORS.transparent },
    secondary: { bg: COLORS.textMuted, text: COLORS.textPrimary, border: 'rgba(255,255,255,0.1)' },
    danger: { bg: COLORS.negative, text: COLORS.white, border: COLORS.transparent },
    success: { bg: COLORS.positive, text: COLORS.white, border: COLORS.transparent },
    warning: { bg: COLORS.warning, text: COLORS.white, border: COLORS.transparent },
    outline: { bg: COLORS.transparent, text: COLORS.textPrimary, border: COLORS.textSecondary },
    transparent: { bg: COLORS.transparent, text: COLORS.accentLight, border: COLORS.transparent },
};

const ActionButton = React.memo(({
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
    // Use memoized values to prevent recalculation on each render
    const buttonTheme = useMemo(() => {
        const currentTheme = BUTTON_THEMES[type] || BUTTON_THEMES.primary;
        const isDisabledOrLoading = disabled || loading;
        
        return {
            finalBgColor: isDisabledOrLoading ? COLORS.accentDisabled : currentTheme.bg,
            finalTextColor: isDisabledOrLoading ? COLORS.textSecondary : currentTheme.text,
            finalBorderColor: isDisabledOrLoading ? 'rgba(113, 128, 150, 0.3)' : currentTheme.border,
            isTransparentOrOutline: (type === 'outline' || type === 'transparent'),
            isDisabledOrLoading
        };
    }, [type, disabled, loading]);

    const {
        finalBgColor,
        finalTextColor, 
        finalBorderColor,
        isTransparentOrOutline,
        isDisabledOrLoading
    } = buttonTheme;

    const iconSize = SIZES.iconSize * 0.9; // İkon boyutunu değişkene al

    const handlePress = useCallback(() => {
        if (!isDisabledOrLoading && onPress && typeof onPress === 'function') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onPress();
        }
    }, [onPress, isDisabledOrLoading]);

    // Precompute styles that involve theme values
    const baseButtonStyle = useMemo(() => ([
        styles.buttonBase,
        {
            backgroundColor: finalBgColor,
            borderColor: finalBorderColor,
            borderWidth: isTransparentOrOutline ? 1.5 : 0,
        },
        !isDisabledOrLoading && type !== 'transparent' && styles.shadow,
    ]), [finalBgColor, finalBorderColor, isTransparentOrOutline, isDisabledOrLoading, type]);

    const textStyleComputed = useMemo(() => [
        styles.buttonTextBase,
        { color: finalTextColor },
        isTransparentOrOutline && { color: BUTTON_THEMES[type]?.text },
        textStyle,
    ], [finalTextColor, isTransparentOrOutline, type, textStyle]);

    return (
        <Pressable onPress={handlePress} disabled={isDisabledOrLoading} style={style}>
            {({ pressed }) => (
                <MotiView
                    style={baseButtonStyle}
                    animate={{
                        scale: pressed && !isDisabledOrLoading ? 0.97 : 1,
                        opacity: isDisabledOrLoading ? 0.65 : 1,
                    }}
                    transition={{ type: 'timing', duration: 150 }}
                >
                    {loading ? (
                        <ActivityIndicator size={SIZES.iconSizeSmall} color={finalTextColor} />
                    ) : (
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
                                style={textStyleComputed}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
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
}, (prevProps, nextProps) => {
    // Custom comparison function to avoid unnecessary re-renders
    return (
        prevProps.title === nextProps.title &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.loading === nextProps.loading &&
        prevProps.type === nextProps.type &&
        prevProps.iconLeft === nextProps.iconLeft &&
        prevProps.iconRight === nextProps.iconRight &&
        prevProps.onPress === nextProps.onPress
    );
});

const styles = StyleSheet.create({
    buttonBase: {
        width: '100%',
        paddingVertical: SIZES.paddingMedium,
        paddingHorizontal: SIZES.padding * 1.5,
        borderRadius: SIZES.buttonRadius,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        marginVertical: SIZES.marginSmall,
        overflow: 'hidden',
    },
    shadow: {
        shadowColor: COLORS.darkShadow,
        shadowOffset: { width: 0, height: 3 },
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
        fontFamily: SIZES.bold,
        textAlign: 'center',
        marginHorizontal: SIZES.base,
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
