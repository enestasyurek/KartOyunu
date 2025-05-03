// components/ActionButton.js
import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native'; // Pressable import edildi
import { MotiView } from 'moti'; // Moti for animation
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/theme';

const ActionButton = ({ title, onPress, disabled = false, style, textStyle, type = 'primary' }) => {
    let bgColor = COLORS.accent;
    if (type === 'secondary') bgColor = COLORS.textMuted;
    if (type === 'danger') bgColor = COLORS.negative;

    const handlePress = () => {
        if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Stronger feedback
            onPress();
        }
    };

    return (
        // Use Pressable for better interaction states
        <Pressable onPress={handlePress} disabled={disabled} style={({ pressed }) => [ style ]} >
             {({ pressed }) => (
                 // MotiView for press animation
                 <MotiView
                    style={[ styles.buttonBase, { backgroundColor: bgColor }, disabled && styles.buttonDisabled ]}
                    animate={{
                         scale: pressed ? 0.97 : 1, // Scale down when pressed
                         opacity: pressed ? 0.8 : 1, // Fade slightly when pressed
                    }}
                    transition={{ type: 'timing', duration: 100 }}
                 >
                    <Text style={[ styles.buttonTextBase, disabled && styles.buttonTextDisabled, textStyle ]}>{title}</Text>
                 </MotiView>
             )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    buttonBase: {
        width: '100%', paddingVertical: 16, paddingHorizontal: 25, // Slightly taller
        borderRadius: 30, alignItems: 'center', justifyContent: 'center',
        marginVertical: 7, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
    },
    buttonDisabled: { backgroundColor: COLORS.accentDisabled, elevation: 0, shadowOpacity: 0, },
    buttonTextBase: { fontSize: 17, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Oswald-Bold' /* Use Custom Font */ },
    buttonTextDisabled: { color: COLORS.textSecondary },
});

export default ActionButton;