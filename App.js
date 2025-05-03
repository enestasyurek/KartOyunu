// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform, Alert, Text, View, StyleSheet } from 'react-native'; // Added Text, View, StyleSheet
import { GameProvider } from './context/GameProvider';
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';
import HowToPlayScreen from './screens/HowToPlayScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import { COLORS } from './constants/theme';
import { useLoadAssets } from './hooks/useLoadAssets'; // Import asset loading hook

// --- Global Error Handler (Same as before) ---
const globalErrorHandler = (error, isFatal) => { /* ... */ };
if (!__DEV__) { const ErrorUtils = global.ErrorUtils; if (ErrorUtils) { ErrorUtils.setGlobalHandler(globalErrorHandler); console.log("Global Error Handler Set."); } else { console.warn("ErrorUtils not available."); }
} else { console.log("Running in DEV mode."); }

const Stack = createStackNavigator();

const AppNavigator = () => (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.backgroundGradient[1] } }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="End" component={EndScreen} />
        <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} />
    </Stack.Navigator>
);

// App content wrapped with Error Boundary
const AppContent = () => {
     // Could potentially get restart action here if needed for ErrorBoundary retry
    return (
        <ErrorBoundary /* onRetry={() => { console.log("Retry requested") } */ >
            <AppNavigator />
        </ErrorBoundary>
    )
}

export default function App() {
    // --- Load Assets ---
    const { isLoadingComplete, fontError } = useLoadAssets();

    // --- Render Loading/Error or App ---
    if (!isLoadingComplete) {
        // You can return a custom loading component here instead of null
        // For now, Expo's splash screen is shown via SplashScreen.preventAutoHideAsync()
        return null;
    }

    if (fontError) {
         // Handle font loading error (e.g., show an error message)
         return (
             <View style={styles.errorContainer}>
                 <Text style={styles.errorText}>Font Yüklenemedi!</Text>
                 <Text style={styles.errorTextSmall}>{fontError.message}</Text>
             </View>
         );
    }

    // Assets loaded, render the main app
    return (
        <GameProvider>
            <NavigationContainer>
                <StatusBar barStyle={'light-content'} backgroundColor={COLORS.backgroundGradient[0]} translucent={false} />
                <AppContent />
            </NavigationContainer>
        </GameProvider>
    );
}

const styles = StyleSheet.create({
   errorContainer: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: COLORS.negative || '#f56565',
       padding: 20,
   },
   errorText: {
       color: 'white',
       fontSize: 20,
       fontWeight: 'bold',
       textAlign: 'center',
       marginBottom: 10,
   },
    errorTextSmall: {
       color: 'white',
       fontSize: 14,
       textAlign: 'center',
   }
});